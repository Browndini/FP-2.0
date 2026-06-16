import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

interface CancelBreedingInput {
  pairId: string;
}

export const cancelBreeding = onCall<CancelBreedingInput>(
  { region: "us-central1", cors: true },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be signed in.");
    }

    const uid = request.auth.uid;
    const { pairId } = request.data;

    if (!pairId) {
      throw new HttpsError("invalid-argument", "Breeding pair ID is required.");
    }

    const db = admin.firestore();
    const pairRef = db.doc(`breedingPairs/${pairId}`);

    return db.runTransaction(async (tx) => {
      const pairSnap = await tx.get(pairRef);
      if (!pairSnap.exists) {
        throw new HttpsError("not-found", "Breeding pair not found.");
      }

      const pair = pairSnap.data()!;

      if (pair.ownerAUid !== uid && pair.ownerBUid !== uid) {
        throw new HttpsError("permission-denied", "Not a participant.");
      }

      if (pair.status === "incubating" || pair.status === "hatched") {
        throw new HttpsError(
          "failed-precondition",
          "Cannot cancel an incubating or completed breeding pair."
        );
      }

      if (pair.status !== "pending") {
        throw new HttpsError("failed-precondition", "Breeding pair is not pending.");
      }

      tx.update(pairRef, { status: "cancelled" });
      tx.update(db.doc(`users/${pair.ownerAUid}/pets/${pair.petAId}`), {
        activeBreedingPairId: null,
      });

      return { pairId, status: "cancelled" };
    });
  }
);
