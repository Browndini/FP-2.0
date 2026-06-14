// Duplicated from src/lib/constants/game.ts — keep in sync.

export const RARITY_TIERS = [
  "common",
  "uncommon",
  "rare",
  "shiny",
  "super",
] as const;

export type RarityTier = (typeof RARITY_TIERS)[number];

export const RARITY_WEIGHTS: Record<RarityTier, number> = {
  common: 0.75,
  uncommon: 0.18,
  rare: 0.059,
  shiny: 0.01,
  super: 0.001,
};

export const RARITY_STAT_MULTIPLIERS: Record<RarityTier, number> = {
  common: 1.0,
  uncommon: 1.08,
  rare: 1.18,
  shiny: 1.35,
  super: 1.55,
};

export const STAT_MIN = 0;
export const STAT_MAX = 100;

export const ONBOARDING_STAT_BIAS: Record<string, Partial<Record<string, number>>> = {
  adventurer: { energy: 5, speed: 4 },
  caretaker: { happiness: 6, health: 4 },
  competitor: { strength: 5, defense: 4 },
  bold: { strength: 3, happiness: 2 },
  calm: { health: 3, defense: 2 },
  curious: { intelligence: 4, happiness: 2 },
};

export const CURRENCY_STARTING_BALANCE = 500;

export const STARTER_SPECIES = [
  {
    id: "emberfox",
    placeholderImage: "/pets/placeholders/emberfox.svg",
    baseStats: {
      hunger: [55, 70] as [number, number],
      happiness: [50, 65] as [number, number],
      health: [50, 60] as [number, number],
      energy: [60, 75] as [number, number],
      strength: [45, 55] as [number, number],
      speed: [60, 75] as [number, number],
      defense: [40, 50] as [number, number],
      intelligence: [45, 55] as [number, number],
    },
  },
  {
    id: "tidefin",
    placeholderImage: "/pets/placeholders/tidefin.svg",
    baseStats: {
      hunger: [50, 65] as [number, number],
      happiness: [55, 70] as [number, number],
      health: [55, 65] as [number, number],
      energy: [50, 60] as [number, number],
      strength: [50, 60] as [number, number],
      speed: [50, 60] as [number, number],
      defense: [50, 60] as [number, number],
      intelligence: [50, 60] as [number, number],
    },
  },
  {
    id: "leafhorn",
    placeholderImage: "/pets/placeholders/leafhorn.svg",
    baseStats: {
      hunger: [50, 60] as [number, number],
      happiness: [50, 60] as [number, number],
      health: [65, 80] as [number, number],
      energy: [45, 55] as [number, number],
      strength: [55, 65] as [number, number],
      speed: [40, 50] as [number, number],
      defense: [60, 75] as [number, number],
      intelligence: [45, 55] as [number, number],
    },
  },
  {
    id: "voltail",
    placeholderImage: "/pets/placeholders/voltail.svg",
    baseStats: {
      hunger: [45, 55] as [number, number],
      happiness: [55, 70] as [number, number],
      health: [45, 55] as [number, number],
      energy: [65, 80] as [number, number],
      strength: [40, 50] as [number, number],
      speed: [65, 80] as [number, number],
      defense: [40, 50] as [number, number],
      intelligence: [60, 75] as [number, number],
    },
  },
  {
    id: "crystwing",
    placeholderImage: "/pets/placeholders/crystwing.svg",
    baseStats: {
      hunger: [45, 70] as [number, number],
      happiness: [45, 70] as [number, number],
      health: [45, 70] as [number, number],
      energy: [45, 70] as [number, number],
      strength: [45, 70] as [number, number],
      speed: [45, 70] as [number, number],
      defense: [45, 70] as [number, number],
      intelligence: [45, 70] as [number, number],
    },
  },
] as const;
