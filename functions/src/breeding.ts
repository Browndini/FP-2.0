import { HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import {
  BREEDING_COOLDOWN_DAYS,
  BREEDING_MIN_LEVEL,
  NEED_STATS,
  RARITY_STAT_MULTIPLIERS,
  RARITY_WEIGHTS,
  SKILL_STATS,
  STARTER_SPECIES,
  STAT_MAX,
  STAT_MIN,
  type RarityTier,
} from "./constants";
import { rollLevelCostMultiplier } from "./leveling";

export interface PetBreedingData {
  speciesId: string;
  rarity: RarityTier;
  level: number;
  stats: Record<string, number>;
  inTradeId?: string | null;
  activeBreedingPairId?: string | null;
  lastBredAt?: admin.firestore.Timestamp | null;
}

export interface OffspringPreview {
  speciesId: string;
  rarity: RarityTier;
  stats: Record<string, number>;
  levelCostMultiplier: number;
  growthTier: "normal" | "fast";
}

function clampStat(value: number): number {
  return Math.min(STAT_MAX, Math.max(STAT_MIN, Math.round(value)));
}

function randomInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

export function rollBreedingRarity(
  parentA: RarityTier,
  parentB: RarityTier
): RarityTier {
  const weights: Record<RarityTier, number> = { ...RARITY_WEIGHTS };

  if (parentA === "shiny" || parentA === "super") {
    weights.shiny += 0.008;
  }
  if (parentB === "shiny" || parentB === "super") {
    weights.shiny += 0.008;
  }
  if (parentA === "super") {
    weights.super += 0.003;
  }
  if (parentB === "super") {
    weights.super += 0.003;
  }

  const total = Object.values(weights).reduce((sum, w) => sum + w, 0);
  const rand = Math.random() * total;
  let cumulative = 0;

  for (const [rarity, weight] of Object.entries(weights)) {
    cumulative += weight;
    if (rand < cumulative) return rarity as RarityTier;
  }

  return "common";
}

export function rollOffspringSpecies(
  speciesA: string,
  speciesB: string
): string {
  if (speciesA === speciesB) return speciesA;
  return Math.random() < 0.5 ? speciesA : speciesB;
}

function rollFreshNeedStat(
  range: readonly [number, number],
  multiplier: number
): number {
  const [min, max] = range;
  const raw = min + Math.random() * (max - min);
  return clampStat(raw * multiplier);
}

export function computeOffspring(
  parentA: PetBreedingData,
  parentB: PetBreedingData
): OffspringPreview {
  const speciesId = rollOffspringSpecies(parentA.speciesId, parentB.speciesId);
  const species = STARTER_SPECIES.find((s) => s.id === speciesId);
  if (!species) {
    throw new HttpsError("internal", "Unknown offspring species.");
  }

  const rarity = rollBreedingRarity(parentA.rarity, parentB.rarity);
  const multiplier = RARITY_STAT_MULTIPLIERS[rarity];
  const { levelCostMultiplier, growthTier } = rollLevelCostMultiplier(rarity);

  const stats: Record<string, number> = {};

  for (const stat of SKILL_STATS) {
    const avg =
      ((parentA.stats[stat] ?? 50) + (parentB.stats[stat] ?? 50)) / 2;
    stats[stat] = clampStat(avg + randomInt(-5, 5));
  }

  for (const stat of NEED_STATS) {
    const range = species.baseStats[stat as keyof typeof species.baseStats];
    stats[stat] = rollFreshNeedStat(range, multiplier);
  }

  return {
    speciesId,
    rarity,
    stats,
    levelCostMultiplier,
    growthTier,
  };
}

export function assertPetCanBreed(
  pet: PetBreedingData,
  nowMs: number = Date.now()
): void {
  if ((pet.level ?? 1) < BREEDING_MIN_LEVEL) {
    throw new HttpsError(
      "failed-precondition",
      `Pet must be level ${BREEDING_MIN_LEVEL}+ to breed.`
    );
  }

  if (pet.inTradeId) {
    throw new HttpsError(
      "failed-precondition",
      "Pets in an active trade cannot breed."
    );
  }

  if (pet.activeBreedingPairId) {
    throw new HttpsError(
      "failed-precondition",
      "This pet is already in a breeding pair."
    );
  }

  const lastBredMs = pet.lastBredAt?.toMillis?.() ?? 0;
  const cooldownMs = BREEDING_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
  if (lastBredMs && nowMs - lastBredMs < cooldownMs) {
    throw new HttpsError(
      "failed-precondition",
      `Breeding cooldown active (${BREEDING_COOLDOWN_DAYS} days per pet).`
    );
  }
}

export function eggInventoryDocId(pairId: string): string {
  return `egg-${pairId}`;
}
