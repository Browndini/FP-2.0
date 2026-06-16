import {
  XP_PER_LEVEL_BASE,
  XP_LEVEL_SCALING,
} from "@/lib/constants/game";

export interface PetXpState {
  level: number;
  xp: number;
  totalXp: number;
  levelCostMultiplier: number;
}

export function baseXpForLevel(level: number): number {
  return Math.round(XP_PER_LEVEL_BASE * Math.pow(XP_LEVEL_SCALING, level - 1));
}

export function xpToNextLevel(
  level: number,
  levelCostMultiplier: number
): number {
  return Math.round(baseXpForLevel(level) * levelCostMultiplier);
}

export function applyXpGain(
  pet: PetXpState,
  baseXpEarned: number
): PetXpState {
  let { level, xp, totalXp, levelCostMultiplier } = pet;

  totalXp += baseXpEarned;
  xp += baseXpEarned;

  let threshold = xpToNextLevel(level, levelCostMultiplier);
  while (xp >= threshold) {
    xp -= threshold;
    level += 1;
    threshold = xpToNextLevel(level, levelCostMultiplier);
  }

  return { level, xp, totalXp, levelCostMultiplier };
}

export function resolvePetXpState(pet: {
  level: number;
  xp: number;
  totalXp?: number;
  levelCostMultiplier?: number;
}): PetXpState {
  return {
    level: pet.level,
    xp: pet.xp,
    totalXp: pet.totalXp ?? pet.xp,
    levelCostMultiplier: pet.levelCostMultiplier ?? 1,
  };
}
