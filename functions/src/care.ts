import * as admin from "firebase-admin";
import {
  ACCELERATED_HEALTH_DECAY_MULTIPLIER,
  CARE_ACTIONS,
  DECAY_PER_HOUR,
  NEED_STATS,
  STAT_MAX,
  STAT_MIN,
  CURRENCY_STARTING_BALANCE,
  type CareActionId,
} from "./constants";

export type { CareActionId };

export function clampStat(value: number): number {
  return Math.min(STAT_MAX, Math.max(STAT_MIN, Math.round(value)));
}

export function applyDecay(
  stats: Record<string, number>,
  hoursElapsed: number
): Record<string, number> {
  if (hoursElapsed <= 0) return { ...stats };

  const next = { ...stats };
  const healthMultiplier =
    (stats.hunger ?? 0) <= 0 || (stats.happiness ?? 0) <= 0
      ? ACCELERATED_HEALTH_DECAY_MULTIPLIER
      : 1;

  for (const stat of NEED_STATS) {
    let decay = DECAY_PER_HOUR[stat] * hoursElapsed;
    if (stat === "health") {
      decay *= healthMultiplier;
    }
    next[stat] = clampStat((next[stat] ?? 0) - decay);
  }

  return next;
}

export function applyCareAction(
  stats: Record<string, number>,
  action: CareActionId
): Record<string, number> {
  const config = CARE_ACTIONS[action];
  const next = { ...stats };

  for (const stat of NEED_STATS) {
    const delta = config[stat as keyof typeof config];
    if (typeof delta === "number") {
      next[stat] = clampStat((next[stat] ?? 0) + delta);
    }
  }

  return next;
}

export function isCareActionReady(
  lastUsedAt: admin.firestore.Timestamp | undefined,
  action: CareActionId,
  nowMs: number = Date.now()
): boolean {
  if (!lastUsedAt) return true;
  const elapsed = nowMs - lastUsedAt.toMillis();
  return elapsed >= CARE_ACTIONS[action].cooldownMinutes * 60 * 1000;
}

export { CARE_ACTIONS, CURRENCY_STARTING_BALANCE, STAT_MIN, STAT_MAX };
