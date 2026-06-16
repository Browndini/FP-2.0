import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { applyDecay, clampStat } from "./care";
import { MINI_GAMES } from "./constants";
import { assertValidGameId } from "./miniGames";

interface StartMiniGameSessionInput {
  petId: string;
  gameId: string;
}

function timestampToMs(value: admin.firestore.Timestamp | undefined): number | null {
  return value ? value.toMillis() : null;
}

export const startMiniGameSession = onCall<StartMiniGameSessionInput>(
  { region: "us-central1", cors: true },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be signed in.");
    }

    const uid = request.auth.uid;
    const { petId, gameId } = request.data;

    if (!petId || !gameId) {
      throw new HttpsError("invalid-argument", "Missing pet or game.");
    }

    const validGameId = assertValidGameId(gameId);
    const game = MINI_GAMES[validGameId];

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
        timestampToMs(pet.lastDecayAppliedAt as admin.firestore.Timestamp) ??
        timestampToMs(pet.createdAt as admin.firestore.Timestamp) ??
        nowMs;
      const hoursElapsed = (nowMs - lastDecayMs) / (1000 * 60 * 60);
      const decayedStats = applyDecay(stats, hoursElapsed);

      const energy = decayedStats.energy ?? 0;
      if (energy < game.energyCost) {
        throw new HttpsError(
          "failed-precondition",
          `Not enough energy. Need ${game.energyCost}, have ${Math.floor(energy)}.`
        );
      }

      decayedStats.energy = clampStat(energy - game.energyCost);

      const sessionRef = db.collection("miniGameSessions").doc();
      tx.set(sessionRef, {
        uid,
        petId,
        gameId: validGameId,
        score: 0,
        startedAt: now,
        completedAt: null,
        rewardClaimed: false,
        metadata: {},
      });

      tx.update(petRef, {
        stats: decayedStats,
        lastDecayAppliedAt: now,
      });

      return {
        sessionId: sessionRef.id,
        startedAt: nowMs,
        energy: decayedStats.energy,
      };
    });
  }
);
