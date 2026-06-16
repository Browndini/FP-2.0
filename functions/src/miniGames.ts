import { HttpsError } from "firebase-functions/v2/https";
import {
  MINI_GAMES,
  computeMemoryMatchScore,
  type MiniGameId,
} from "./constants";

export interface MiniGameMetadata {
  hits?: number;
  pairs?: number;
  moves?: number;
  durationMs?: number;
}

export function assertValidGameId(gameId: string): MiniGameId {
  if (!(gameId in MINI_GAMES)) {
    throw new HttpsError("invalid-argument", "Unknown mini-game.");
  }
  return gameId as MiniGameId;
}

export function validateSessionDuration(
  gameId: MiniGameId,
  durationMs: number
): void {
  const game = MINI_GAMES[gameId];
  const minMs = game.minDurationSeconds * 1000;
  const maxMs = (game.durationSeconds + 10) * 1000;

  if (durationMs < minMs) {
    throw new HttpsError(
      "failed-precondition",
      "Session ended too quickly to claim rewards."
    );
  }
  if (durationMs > maxMs) {
    throw new HttpsError(
      "failed-precondition",
      "Session exceeded the allowed time limit."
    );
  }
}

export function validateReflexDashScore(
  score: number,
  durationMs: number,
  metadata: MiniGameMetadata
): void {
  const game = MINI_GAMES["reflex-dash"];

  if (!Number.isFinite(score) || score < 0 || score > game.maxScore) {
    throw new HttpsError("invalid-argument", "Invalid score.");
  }

  if (metadata.hits !== undefined && metadata.hits !== score) {
    throw new HttpsError("invalid-argument", "Score metadata mismatch.");
  }

  const maxPlausible = Math.floor(durationMs / game.minMsBetweenHits) + 1;
  if (score > maxPlausible) {
    throw new HttpsError(
      "failed-precondition",
      "Score exceeds plausible limits for session duration."
    );
  }
}

export function validateMemoryMatchScore(
  score: number,
  metadata: MiniGameMetadata
): void {
  const game = MINI_GAMES["memory-match"];
  const pairs = metadata.pairs;
  const moves = metadata.moves;

  if (pairs === undefined || moves === undefined) {
    throw new HttpsError("invalid-argument", "Missing game metadata.");
  }

  if (!Number.isInteger(pairs) || pairs < 0 || pairs > game.pairCount) {
    throw new HttpsError("invalid-argument", "Invalid pairs count.");
  }

  if (!Number.isInteger(moves) || moves < pairs || moves > 120) {
    throw new HttpsError("invalid-argument", "Invalid move count.");
  }

  const expected = computeMemoryMatchScore(pairs, moves);
  if (score !== expected) {
    throw new HttpsError("invalid-argument", "Score does not match game result.");
  }
}

export function validateMiniGameScore(
  gameId: MiniGameId,
  score: number,
  durationMs: number,
  metadata: MiniGameMetadata
): void {
  validateSessionDuration(gameId, durationMs);

  if (gameId === "reflex-dash") {
    validateReflexDashScore(score, durationMs, metadata);
    return;
  }

  if (gameId === "memory-match") {
    validateMemoryMatchScore(score, metadata);
    validateSessionDuration(gameId, durationMs);
    return;
  }

  throw new HttpsError("invalid-argument", "Unsupported mini-game.");
}
