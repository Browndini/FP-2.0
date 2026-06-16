import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import {
  clearPetInTrade,
  grantItems,
} from "./trades";

interface CancelTradeInput {
  tradeId: string;
}

export const cancelTrade = onCall<CancelTradeInput>(
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

    return db.runTransaction(async (tx) => {
      const tradeSnap = await tx.get(tradeRef);
      if (!tradeSnap.exists) {
        throw new HttpsError("not-found", "Trade not found.");
      }

      const trade = tradeSnap.data()!;
      if (trade.status !== "pending") {
        throw new HttpsError(
          "failed-precondition",
          "Only pending trades can be cancelled."
        );
      }

      if (trade.fromUid !== uid && trade.toUid !== uid) {
        throw new HttpsError("permission-denied", "Not a participant in this trade.");
      }

      const fromUserRef = db.doc(`users/${trade.fromUid}`);
      const fromUserSnap = await tx.get(fromUserRef);
      const fromCredits = fromUserSnap.data()?.credits ?? 0;

      await grantItems(tx, trade.fromUid, trade.offeredItems ?? [], now);

      if (trade.offeredCredits > 0) {
        tx.update(fromUserRef, {
          credits: fromCredits + trade.offeredCredits,
        });
      }

      if (trade.offeredPetId) {
        clearPetInTrade(tx, trade.fromUid, trade.offeredPetId);
      }

      tx.update(tradeRef, {
        status: "cancelled",
        cancelledAt: now,
        cancelledBy: uid,
      });

      return { tradeId, status: "cancelled" };
    });
  }
);
