import type { MiniGameId } from "@/lib/constants/game";

export interface ReflexDashResult {
  score: number;
  hits: number;
  durationMs: number;
}

export interface MemoryMatchResult {
  score: number;
  pairs: number;
  moves: number;
  durationMs: number;
}

export type MiniGameResult = ReflexDashResult | MemoryMatchResult;

export interface ClaimRewardResult {
  score: number;
  creditsEarned: number;
  totalCredits: number;
  skillStat: string;
  skillGain: number;
  xpEarned: number;
  level: number;
  xp: number;
}

export interface StartSessionResult {
  sessionId: string;
  startedAt: number;
  energy: number;
}

export type { MiniGameId };
