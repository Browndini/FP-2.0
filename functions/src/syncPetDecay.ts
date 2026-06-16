import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { applyDecay } from "./care";

interface SyncPetDecayInput {
  petId: string;
}

export const syncPetDecay = onCall<SyncPetDecayInput>(
  { region: "us-central1", cors: true },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be signed in.");
    }

    const uid = request.auth.uid;
    const { petId } = request.data;

    if (!petId) {
      throw new HttpsError("invalid-argument", "Pet ID is required.");
    }

    const db = admin.firestore();
    const petRef = db.doc(`users/${uid}/pets/${petId}`);
    const now = admin.firestore.Timestamp.now();
    const nowMs = now.toMillis();

    return db.runTransaction(async (tx) => {
      const petSnap = await tx.get(petRef);
      if (!petSnap.exists) {
        throw new HttpsError("not-found", "Pet not found.");
      }

      const pet = petSnap.data()!;
      const stats = { ...pet.stats } as Record<string, number>;
      const lastDecayMs =
        pet.lastDecayAppliedAt?.toMillis?.() ??
        pet.createdAt?.toMillis?.() ??
        nowMs;
      const hoursElapsed = (nowMs - lastDecayMs) / (1000 * 60 * 60);

      if (hoursElapsed < 1 / 60) {
        return { stats, skipped: true };
      }

      const updatedStats = applyDecay(stats, hoursElapsed);
      tx.update(petRef, {
        stats: updatedStats,
        lastDecayAppliedAt: now,
      });

      return { stats: updatedStats, skipped: false };
    });
  }
);
