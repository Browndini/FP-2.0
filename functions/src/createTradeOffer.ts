import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { TRADE_EXPIRY_HOURS } from "./constants";
import {
  assertCreditsAmount,
  assertPetAvailable,
  assertTradeCooldown,
  assertTradeHasValue,
  lockOfferedItems,
  markPetInTrade,
  normalizeTradeItems,
} from "./trades";

interface CreateTradeOfferInput {
  toUsername: string;
  offeredItems?: Array<{ itemId: string; quantity: number }>;
  requestedItems?: Array<{ itemId: string; quantity: number }>;
  offeredCredits?: number;
  requestedCredits?: number;
  offeredPetId?: string | null;
  requestedPetId?: string | null;
}

export const createTradeOffer = onCall<CreateTradeOfferInput>(
  { region: "us-central1", cors: true },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be signed in.");
    }

    const fromUid = request.auth.uid;
    const toUsername = request.data.toUsername?.toLowerCase().trim();

    if (!toUsername) {
      throw new HttpsError("invalid-argument", "Target username is required.");
    }

    const offeredItems = normalizeTradeItems(request.data.offeredItems);
    const requestedItems = normalizeTradeItems(request.data.requestedItems);
    const offeredCredits = assertCreditsAmount(
      request.data.offeredCredits ?? 0,
      "offered"
    );
    const requestedCredits = assertCreditsAmount(
      request.data.requestedCredits ?? 0,
      "requested"
    );
    const offeredPetId = request.data.offeredPetId ?? null;
    const requestedPetId = request.data.requestedPetId ?? null;

    if (offeredPetId && requestedPetId !== "swap") {
      throw new HttpsError(
        "invalid-argument",
        "Pet trades require a pet swap — set requestedPetId to swap."
      );
    }
    if (requestedPetId === "swap" && !offeredPetId) {
      throw new HttpsError(
        "invalid-argument",
        "Pet swap requires offering your pet too."
      );
    }

    assertTradeHasValue(offeredItems, offeredCredits, offeredPetId);
    assertTradeHasValue(
      requestedItems,
      requestedCredits,
      requestedPetId === "swap" ? "swap" : null
    );

    const db = admin.firestore();
    const now = admin.firestore.Timestamp.now();
    const expiresAt = admin.firestore.Timestamp.fromMillis(
      now.toMillis() + TRADE_EXPIRY_HOURS * 60 * 60 * 1000
    );

    return db.runTransaction(async (tx) => {
      const fromUserRef = db.doc(`users/${fromUid}`);
      const usernameRef = db.doc(`usernames/${toUsername}`);

      const [fromUserSnap, usernameSnap] = await Promise.all([
        tx.get(fromUserRef),
        tx.get(usernameRef),
      ]);

      if (!fromUserSnap.exists) {
        throw new HttpsError("not-found", "User not found.");
      }

      assertTradeCooldown(fromUserSnap.data()?.createdAt as admin.firestore.Timestamp);

      const fromUsername = fromUserSnap.data()?.username as string | undefined;
      if (!fromUsername) {
        throw new HttpsError(
          "failed-precondition",
          "Set a username before trading."
        );
      }

      if (fromUsername === toUsername) {
        throw new HttpsError("invalid-argument", "Cannot trade with yourself.");
      }

      if (!usernameSnap.exists) {
        throw new HttpsError("not-found", "That username was not found.");
      }

      const toUid = usernameSnap.data()?.uid as string;
      if (toUid === fromUid) {
        throw new HttpsError("invalid-argument", "Cannot trade with yourself.");
      }

      const toUserSnap = await tx.get(db.doc(`users/${toUid}`));
      if (!toUserSnap.exists) {
        throw new HttpsError("not-found", "Trade partner not found.");
      }

      assertTradeCooldown(toUserSnap.data()?.createdAt as admin.firestore.Timestamp);

      const credits = fromUserSnap.data()?.credits ?? 0;
      if (credits < offeredCredits) {
        throw new HttpsError("failed-precondition", "Not enough credits to offer.");
      }

      await lockOfferedItems(tx, fromUid, offeredItems, now);

      if (offeredCredits > 0) {
        tx.update(fromUserRef, { credits: credits - offeredCredits });
      }

      const tradeRef = db.collection("trades").doc();

      if (offeredPetId) {
        await assertPetAvailable(tx, fromUid, offeredPetId);
        markPetInTrade(tx, fromUid, offeredPetId, tradeRef.id);
      }

      tx.set(tradeRef, {
        fromUid,
        fromUsername,
        toUid,
        toUsername,
        status: "pending",
        offeredItems,
        requestedItems,
        offeredCredits,
        requestedCredits,
        offeredPetId,
        requestedPetId,
        createdAt: now,
        expiresAt,
        completedAt: null,
        cancelledAt: null,
        cancelledBy: null,
      });

      return { tradeId: tradeRef.id, expiresAt: expiresAt.toMillis() };
    });
  }
);
