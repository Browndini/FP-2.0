import {
  LEVEL_COST_MULTIPLIER,
  XP_PER_LEVEL_BASE,
  XP_LEVEL_SCALING,
  type GrowthTier,
  type RarityTier,
} from "./constants";

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

function rollInRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export function rollLevelCostMultiplier(
  rarity: RarityTier
): { levelCostMultiplier: number; growthTier: GrowthTier } {
  const isShinyOrSuper = rarity === "shiny" || rarity === "super";

  if (isShinyOrSuper && Math.random() < LEVEL_COST_MULTIPLIER.shinySuperFastChance) {
    return {
      levelCostMultiplier: Number(
        rollInRange(
          LEVEL_COST_MULTIPLIER.fastMin,
          LEVEL_COST_MULTIPLIER.fastMax
        ).toFixed(2)
      ),
      growthTier: "fast",
    };
  }

  if (isShinyOrSuper) {
    return {
      levelCostMultiplier: Number(
        rollInRange(
          LEVEL_COST_MULTIPLIER.shinySuperNormalMin,
          LEVEL_COST_MULTIPLIER.shinySuperNormalMax
        ).toFixed(2)
      ),
      growthTier: "normal",
    };
  }

  return {
    levelCostMultiplier: Number(
      rollInRange(
        LEVEL_COST_MULTIPLIER.normalMin,
        LEVEL_COST_MULTIPLIER.normalMax
      ).toFixed(2)
    ),
    growthTier: "normal",
  };
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
