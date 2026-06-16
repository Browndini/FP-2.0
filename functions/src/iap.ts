import * as admin from "firebase-admin";
import { HttpsError } from "firebase-functions/v2/https";
import { IAP_ITEMS, getIapStripePriceId } from "./constants";

export function assertIapProductId(productId: string) {
  const item = IAP_ITEMS.find((i) => i.id === productId);
  if (!item) {
    throw new HttpsError("not-found", "Unknown IAP product.");
  }
  if (!item.cosmeticOnly) {
    throw new HttpsError("failed-precondition", "IAP products must be cosmetic only.");
  }
  return item;
}

export async function fulfillIapPurchase(
  db: admin.firestore.Firestore,
  uid: string,
  productId: string,
  sessionId: string
): Promise<{ alreadyFulfilled: boolean }> {
  assertIapProductId(productId);

  const fulfillmentRef = db.doc(`iapFulfillments/${sessionId}`);

  return db.runTransaction(async (tx) => {
    const existing = await tx.get(fulfillmentRef);
    if (existing.exists) {
      return { alreadyFulfilled: true };
    }

    const invRef = db.doc(`users/${uid}/inventory/${productId}`);
    const invSnap = await tx.get(invRef);
    const now = admin.firestore.Timestamp.now();

    if (invSnap.exists) {
      tx.update(invRef, { quantity: (invSnap.data()?.quantity ?? 0) + 1 });
    } else {
      tx.set(invRef, {
        itemId: productId,
        quantity: 1,
        acquiredAt: now,
        source: "iap",
      });
    }

    tx.set(fulfillmentRef, {
      uid,
      productId,
      sessionId,
      fulfilledAt: now,
    });

    return { alreadyFulfilled: false };
  });
}

export function resolveStripePriceId(productId: string): string {
  const priceId = getIapStripePriceId(productId);
  if (!priceId) {
    throw new HttpsError(
      "failed-precondition",
      "IAP is not configured. Set Stripe price env vars on Cloud Functions."
    );
  }
  return priceId;
}

export function getStripeSecretKey(): string {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new HttpsError(
      "failed-precondition",
      "Stripe is not configured. Set STRIPE_SECRET_KEY on Cloud Functions."
    );
  }
  return key;
}
