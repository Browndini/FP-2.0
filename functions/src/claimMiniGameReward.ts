import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { clampStat } from "./care";
import { MINI_GAMES, computeMiniGameRewards } from "./constants";
import { applyXpGain } from "./leveling";
import {
  assertValidGameId,
  validateMiniGameScore,
  type MiniGameMetadata,
} from "./miniGames";

interface ClaimMiniGameRewardInput {
  sessionId: string;
  score: number;
  metadata?: MiniGameMetadata;
}

export const claimMiniGameReward = onCall<ClaimMiniGameRewardInput>(
  { region: "us-central1", cors: true },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be signed in.");
    }

    const uid = request.auth.uid;
    const { sessionId, score, metadata = {} } = request.data;

    if (!sessionId || score === undefined || score === null) {
      throw new HttpsError("invalid-argument", "Missing session or score.");
    }

    const db = admin.firestore();
    const sessionRef = db.doc(`miniGameSessions/${sessionId}`);
    const now = admin.firestore.Timestamp.now();
    const nowMs = now.toMillis();

    return db.runTransaction(async (tx) => {
      const sessionSnap = await tx.get(sessionRef);
      if (!sessionSnap.exists) {
        throw new HttpsError("not-found", "Session not found.");
      }

      const session = sessionSnap.data()!;
      if (session.uid !== uid) {
        throw new HttpsError("permission-denied", "Not your session.");
      }
      if (session.rewardClaimed) {
        throw new HttpsError(
          "failed-precondition",
          "Rewards already claimed for this session."
        );
      }

      const gameId = assertValidGameId(session.gameId);
      const startedAt = session.startedAt as admin.firestore.Timestamp;
      const serverDurationMs = nowMs - startedAt.toMillis();
      const durationMs = metadata.durationMs ?? serverDurationMs;

      if (
        metadata.durationMs !== undefined &&
        Math.abs(metadata.durationMs - serverDurationMs) > 8000
      ) {
        throw new HttpsError(
          "failed-precondition",
          "Session timing mismatch."
        );
      }

      validateMiniGameScore(gameId, score, durationMs, metadata);

      const game = MINI_GAMES[gameId];
      const petRef = db.doc(`users/${uid}/pets/${session.petId}`);
      const userRef = db.doc(`users/${uid}`);

      const [petSnap, userSnap] = await Promise.all([
        tx.get(petRef),
        tx.get(userRef),
      ]);

      if (!petSnap.exists || !userSnap.exists) {
        throw new HttpsError("not-found", "Pet or user not found.");
      }

      const pet = petSnap.data()!;
      const stats = { ...(pet.stats as Record<string, number>) };
      const rewards = computeMiniGameRewards(score);

      stats[game.skillStat] = clampStat(
        (stats[game.skillStat] ?? 0) + rewards.skillGain
      );
      stats.happiness = clampStat(
        (stats.happiness ?? 0) + rewards.happinessGain
      );

      const xpState = applyXpGain(
        {
          level: pet.level ?? 1,
          xp: pet.xp ?? 0,
          totalXp: pet.totalXp ?? pet.xp ?? 0,
          levelCostMultiplier: pet.levelCostMultiplier ?? 1,
        },
        rewards.xp
      );

      const credits = (userSnap.data()?.credits ?? 0) + rewards.credits;

      tx.update(sessionRef, {
        score,
        completedAt: now,
        rewardClaimed: true,
        metadata,
      });

      tx.update(petRef, {
        stats,
        level: xpState.level,
        xp: xpState.xp,
        totalXp: xpState.totalXp,
      });

      tx.update(userRef, { credits });

      return {
        score,
        creditsEarned: rewards.credits,
        totalCredits: credits,
        skillStat: game.skillStat,
        skillGain: rewards.skillGain,
        xpEarned: rewards.xp,
        level: xpState.level,
        xp: xpState.xp,
      };
    });
  }
);
