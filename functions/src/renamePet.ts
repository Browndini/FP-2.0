import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

interface RenamePetInput {
  petId: string;
  name: string;
}

export const renamePet = onCall<RenamePetInput>(
  { region: "us-central1", cors: true },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be signed in.");
    }

    const uid = request.auth.uid;
    const { petId, name } = request.data;
    const trimmed = name?.trim();

    if (!petId || !trimmed) {
      throw new HttpsError("invalid-argument", "Pet ID and name are required.");
    }
    if (trimmed.length < 2 || trimmed.length > 24) {
      throw new HttpsError(
        "invalid-argument",
        "Pet name must be 2–24 characters."
      );
    }

    const db = admin.firestore();
    const petRef = db.doc(`users/${uid}/pets/${petId}`);

    return db.runTransaction(async (tx) => {
      const petSnap = await tx.get(petRef);
      if (!petSnap.exists) {
        throw new HttpsError("not-found", "Pet not found.");
      }

      const pet = petSnap.data()!;
      if (pet.freeRenameUsed) {
        throw new HttpsError(
          "failed-precondition",
          "Free rename already used."
        );
      }

      tx.update(petRef, {
        name: trimmed,
        freeRenameUsed: true,
      });

      return { name: trimmed };
    });
  }
);
