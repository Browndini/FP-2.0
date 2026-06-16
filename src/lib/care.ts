import {
  ACCELERATED_HEALTH_DECAY_MULTIPLIER,
  CARE_ACTIONS,
  DECAY_PER_HOUR,
  NEED_STATS,
  STAT_MAX,
  STAT_MIN,
  type CareActionId,
  type NeedStat,
  type PetStat,
} from "@/lib/constants/game";

export function clampStat(value: number): number {
  return Math.min(STAT_MAX, Math.max(STAT_MIN, Math.round(value)));
}

export function applyDecay(
  stats: Record<PetStat, number>,
  hoursElapsed: number
): Record<PetStat, number> {
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
  stats: Record<PetStat, number>,
  action: CareActionId
): Record<PetStat, number> {
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

export function getCooldownEndsAt(
  lastUsedMs: number | null,
  cooldownMinutes: number
): number | null {
  if (lastUsedMs == null) return null;
  return lastUsedMs + cooldownMinutes * 60 * 1000;
}

export function getCooldownRemainingMs(
  lastUsedMs: number | null,
  cooldownMinutes: number,
  nowMs: number = Date.now()
): number {
  const endsAt = getCooldownEndsAt(lastUsedMs, cooldownMinutes);
  if (endsAt == null) return 0;
  return Math.max(0, endsAt - nowMs);
}

export function isCareActionReady(
  lastUsedMs: number | null,
  action: CareActionId,
  nowMs: number = Date.now()
): boolean {
  return (
    getCooldownRemainingMs(
      lastUsedMs,
      CARE_ACTIONS[action].cooldownMinutes,
      nowMs
    ) === 0
  );
}

export function formatCooldown(ms: number): string {
  if (ms <= 0) return "";
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

export function getLowNeedWarnings(stats: Record<PetStat, number>): string[] {
  const warnings: string[] = [];
  if ((stats.hunger ?? 0) <= 0) {
    warnings.push("Your pet is starving — health is decaying faster.");
  }
  if ((stats.happiness ?? 0) <= 0) {
    warnings.push("Your pet is miserable — health is decaying faster.");
  }
  if ((stats.energy ?? 0) <= 0) {
    warnings.push("Your pet is exhausted — mini-games are unavailable.");
  }
  return warnings;
}
