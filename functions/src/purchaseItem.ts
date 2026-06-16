import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { SHOP_ITEMS } from "./constants";

interface PurchaseItemInput {
  itemId: string;
}

export const purchaseItem = onCall<PurchaseItemInput>(
  { region: "us-central1", cors: true },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be signed in.");
    }

    const uid = request.auth.uid;
    const { itemId } = request.data;

    const item = (SHOP_ITEMS as ReadonlyArray<{ id: string; creditsPrice: number }>).find(
      (i) => i.id === itemId
    );
    if (!item) {
      throw new HttpsError("not-found", "Item not found.");
    }

    const db = admin.firestore();
    const userRef = db.doc(`users/${uid}`);
    const invRef = db.doc(`users/${uid}/inventory/${itemId}`);

    return db.runTransaction(async (tx) => {
      const [userSnap, invSnap] = await Promise.all([
        tx.get(userRef),
        tx.get(invRef),
      ]);

      if (!userSnap.exists) {
        throw new HttpsError("not-found", "User not found.");
      }

      const credits: number = userSnap.data()?.credits ?? 0;
      if (credits < item.creditsPrice) {
        throw new HttpsError(
          "failed-precondition",
          `Not enough credits. Need ${item.creditsPrice}, have ${credits}.`
        );
      }

      const newCredits = credits - item.creditsPrice;
      tx.update(userRef, { credits: newCredits });

      if (invSnap.exists) {
        tx.update(invRef, {
          quantity: (invSnap.data()?.quantity ?? 0) + 1,
        });
      } else {
        tx.set(invRef, {
          itemId,
          quantity: 1,
          acquiredAt: admin.firestore.Timestamp.now(),
        });
      }

      return { credits: newCredits };
    });
  }
);
