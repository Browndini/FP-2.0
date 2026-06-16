import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import {
  applyCareAction,
  applyDecay,
  CARE_ACTIONS,
  isCareActionReady,
  type CareActionId,
} from "./care";

interface PerformCareActionInput {
  petId: string;
  action: CareActionId;
}

function timestampToMs(value: admin.firestore.Timestamp | undefined): number | null {
  return value ? value.toMillis() : null;
}

export const performCareAction = onCall<PerformCareActionInput>(
  { region: "us-central1", cors: true },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be signed in.");
    }

    const uid = request.auth.uid;
    const { petId, action } = request.data;

    if (!petId || !action || !(action in CARE_ACTIONS)) {
      throw new HttpsError("invalid-argument", "Invalid pet or action.");
    }

    const db = admin.firestore();
    const userRef = db.doc(`users/${uid}`);
    const petRef = db.doc(`users/${uid}/pets/${petId}`);
    const now = admin.firestore.Timestamp.now();
    const nowMs = now.toMillis();

    return db.runTransaction(async (tx) => {
      const [userSnap, petSnap] = await Promise.all([
        tx.get(userRef),
        tx.get(petRef),
      ]);

      if (!petSnap.exists) {
        throw new HttpsError("not-found", "Pet not found.");
      }

      const pet = petSnap.data()!;
      const stats = { ...pet.stats } as Record<string, number>;
      const careCooldowns = {
        ...(pet.careCooldowns ?? {}),
      } as Record<string, admin.firestore.Timestamp>;

      const lastDecayMs =
        timestampToMs(pet.lastDecayAppliedAt as admin.firestore.Timestamp) ??
        timestampToMs(pet.createdAt as admin.firestore.Timestamp) ??
        nowMs;
      const hoursElapsed = (nowMs - lastDecayMs) / (1000 * 60 * 60);
      const decayedStats = applyDecay(stats, hoursElapsed);

      const lastActionAt = careCooldowns[action] as
        | admin.firestore.Timestamp
        | undefined;
      if (!isCareActionReady(lastActionAt, action, nowMs)) {
        throw new HttpsError(
          "failed-precondition",
          "This action is still on cooldown."
        );
      }

      let credits = userSnap.data()?.credits ?? 0;
      if (action === "heal") {
        const cost = CARE_ACTIONS.heal.creditsCost ?? 0;
        if (credits < cost) {
          throw new HttpsError(
            "failed-precondition",
            "Not enough credits to heal."
          );
        }
        credits -= cost;
        tx.update(userRef, { credits });
      }

      const updatedStats = applyCareAction(decayedStats, action);
      careCooldowns[action] = now;

      tx.update(petRef, {
        stats: updatedStats,
        careCooldowns,
        lastCareAt: now,
        lastDecayAppliedAt: now,
      });

      return {
        stats: updatedStats,
        careCooldowns: Object.fromEntries(
          Object.entries(careCooldowns).map(([key, value]) => [
            key,
            value.toMillis(),
          ])
        ),
        credits: action === "heal" ? credits : undefined,
      };
    });
  }
);
