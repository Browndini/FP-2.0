import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import {
  assertPetAvailable,
  assertTradeCooldown,
  grantItems,
  isTradeExpired,
  lockOfferedItems,
  transferPet,
  writeTradeHistory,
} from "./trades";
import type { TradeItemLine } from "./constants";

interface ExecuteTradeInput {
  tradeId: string;
}

export const executeTrade = onCall<ExecuteTradeInput>(
  { region: "us-central1", cors: true },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be signed in.");
    }

    const uid = request.auth.uid;
    const { tradeId } = request.data;

    if (!tradeId) {
      throw new HttpsError("invalid-argument", "Trade ID is required.");
    }

    const db = admin.firestore();
    const tradeRef = db.doc(`trades/${tradeId}`);
    const now = admin.firestore.Timestamp.now();
    const nowMs = now.toMillis();

    return db.runTransaction(async (tx) => {
      const tradeSnap = await tx.get(tradeRef);
      if (!tradeSnap.exists) {
        throw new HttpsError("not-found", "Trade not found.");
      }

      const trade = tradeSnap.data()!;
      if (trade.toUid !== uid) {
        throw new HttpsError(
          "permission-denied",
          "Only the recipient can accept a trade."
        );
      }

      if (trade.status !== "pending") {
        throw new HttpsError(
          "failed-precondition",
          "This trade is no longer pending."
        );
      }

      if (isTradeExpired(trade.expiresAt as admin.firestore.Timestamp, nowMs)) {
        throw new HttpsError("failed-precondition", "This trade offer has expired.");
      }

      const toUserRef = db.doc(`users/${uid}`);
      const fromUserRef = db.doc(`users/${trade.fromUid}`);

      const [toUserSnap, fromUserSnap] = await Promise.all([
        tx.get(toUserRef),
        tx.get(fromUserRef),
      ]);

      assertTradeCooldown(toUserSnap.data()?.createdAt as admin.firestore.Timestamp);

      const toCredits = toUserSnap.data()?.credits ?? 0;
      const fromCredits = fromUserSnap.data()?.credits ?? 0;
      const requestedItems = (trade.requestedItems ?? []) as TradeItemLine[];
      const offeredItems = (trade.offeredItems ?? []) as TradeItemLine[];

      if (toCredits < trade.requestedCredits) {
        throw new HttpsError(
          "failed-precondition",
          "Not enough credits to fulfill this trade."
        );
      }

      await lockOfferedItems(tx, uid, requestedItems, now);

      let requestedPetSnap: admin.firestore.DocumentSnapshot | null = null;
      let offeredPetSnap: admin.firestore.DocumentSnapshot | null = null;

      if (trade.requestedPetId) {
        const petsQuery = db.collection(`users/${uid}/pets`).limit(2);
        const petsSnap = await tx.get(petsQuery);
        if (petsSnap.size !== 1) {
          throw new HttpsError(
            "failed-precondition",
            "Pet swap requires you to have exactly one pet."
          );
        }
        const requestedPetId = petsSnap.docs[0].id;
        requestedPetSnap = await assertPetAvailable(tx, uid, requestedPetId);

        if (trade.requestedPetId !== "swap") {
          if (requestedPetId !== trade.requestedPetId) {
            throw new HttpsError(
              "failed-precondition",
              "Required pet is no longer available for swap."
            );
          }
        }
      }

      if (trade.offeredPetId) {
        offeredPetSnap = await tx.get(
          db.doc(`users/${trade.fromUid}/pets/${trade.offeredPetId}`)
        );
        if (!offeredPetSnap.exists) {
          throw new HttpsError("not-found", "Offered pet no longer available.");
        }
      }

      await grantItems(tx, trade.fromUid, requestedItems, now);
      await grantItems(tx, uid, offeredItems, now);

      const newFromCredits = fromCredits + trade.requestedCredits;
      const newToCredits =
        toCredits - trade.requestedCredits + trade.offeredCredits;
      tx.update(fromUserRef, { credits: newFromCredits });
      tx.update(toUserRef, { credits: newToCredits });

      if (trade.offeredPetId && offeredPetSnap) {
        transferPet(tx, trade.fromUid, uid, trade.offeredPetId, offeredPetSnap);
      }

      if (trade.requestedPetId && requestedPetSnap) {
        transferPet(
          tx,
          uid,
          trade.fromUid,
          requestedPetSnap.id,
          requestedPetSnap
        );
      }

      tx.update(tradeRef, {
        status: "completed",
        completedAt: now,
      });

      const summary = {
        fromUsername: trade.fromUsername,
        toUsername: trade.toUsername,
        offeredItems,
        requestedItems,
        offeredCredits: trade.offeredCredits,
        requestedCredits: trade.requestedCredits,
        offeredPetId: trade.offeredPetId ?? null,
        requestedPetId: trade.requestedPetId ?? null,
      };

      writeTradeHistory(tx, tradeId, trade.fromUid, "sender", summary, now);
      writeTradeHistory(tx, tradeId, trade.toUid, "receiver", summary, now);

      return {
        tradeId,
        status: "completed",
      };
    });
  }
);
