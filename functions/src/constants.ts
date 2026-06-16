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

export const XP_PER_LEVEL_BASE = 100;
export const XP_LEVEL_SCALING = 1.15;

/** Per-pet level cost roll bands — keep in sync with src/lib/constants/game.ts */
export const LEVEL_COST_MULTIPLIER = {
  normalMin: 0.92,
  normalMax: 1.08,
  shinySuperFastChance: 0.1,
  fastMin: 0.7,
  fastMax: 0.85,
  shinySuperNormalMin: 0.95,
  shinySuperNormalMax: 1.15,
} as const;

export const GROWTH_TIERS = ["normal", "fast"] as const;
export type GrowthTier = (typeof GROWTH_TIERS)[number];

export const ONBOARDING_STAT_BIAS: Record<string, Partial<Record<string, number>>> = {
  adventurer: { energy: 5, speed: 4 },
  caretaker: { happiness: 6, health: 4 },
  competitor: { strength: 5, defense: 4 },
  bold: { strength: 3, happiness: 2 },
  calm: { health: 3, defense: 2 },
  curious: { intelligence: 4, happiness: 2 },
};

export const CURRENCY_STARTING_BALANCE = 500;

export const DECAY_PER_HOUR = {
  hunger: 1.2,
  happiness: 0.8,
  health: 0.3,
  energy: 0.9,
} as const;

export const NEED_STATS = ["hunger", "happiness", "health", "energy"] as const;

export const ACCELERATED_HEALTH_DECAY_MULTIPLIER = 2;

export const CARE_ACTIONS = {
  feed: { cooldownMinutes: 30, hunger: 25, happiness: 5 },
  play: { cooldownMinutes: 20, happiness: 20, energy: -10 },
  rest: { cooldownMinutes: 45, energy: 30, health: 5 },
  heal: { cooldownMinutes: 60, health: 25, creditsCost: 50 },
} as const;

export type CareActionId = keyof typeof CARE_ACTIONS;

export const SHOP_ITEMS = [
  {
    id: "fire-collar",
    name: "Fire Collar",
    description: "A glowing collar that crackles with embers.",
    creditsPrice: 200,
  },
  {
    id: "crystal-crown",
    name: "Crystal Crown",
    description: "A delicate crown of shimmering crystals.",
    creditsPrice: 350,
  },
  {
    id: "tide-cape",
    name: "Tide Cape",
    description: "A flowing cape that ripples like ocean waves.",
    creditsPrice: 250,
  },
  {
    id: "storm-badge",
    name: "Storm Badge",
    description: "A crackling badge that hums with electric energy.",
    creditsPrice: 150,
  },
  {
    id: "nature-wreath",
    name: "Nature Wreath",
    description: "A wreath of living leaves and tiny blooms.",
    creditsPrice: 175,
  },
] as const;

export type ShopItemId = (typeof SHOP_ITEMS)[number]["id"];

export const USERNAME_REGEX = /^[a-z0-9_]{3,20}$/;

export const MINI_GAMES = {
  "reflex-dash": {
    id: "reflex-dash",
    skillStat: "speed",
    energyCost: 15,
    durationSeconds: 30,
    minDurationSeconds: 10,
    maxScore: 45,
    minMsBetweenHits: 350,
  },
  "memory-match": {
    id: "memory-match",
    skillStat: "intelligence",
    energyCost: 15,
    durationSeconds: 120,
    minDurationSeconds: 20,
    maxScore: 100,
    pairCount: 8,
  },
} as const;

export type MiniGameId = keyof typeof MINI_GAMES;

export const MINI_GAME_REWARDS = {
  baseCredits: 15,
  creditsPerScore: 1.5,
  skillGainPerScore: 0.25,
  maxSkillGain: 12,
  xpPerScore: 0.8,
  maxXp: 45,
  happinessGain: 5,
} as const;

export function computeMemoryMatchScore(pairs: number, moves: number): number {
  const pairCount = MINI_GAMES["memory-match"].pairCount;
  if (pairs <= 0) return 0;
  if (pairs >= pairCount) {
    return Math.max(
      0,
      Math.min(100, 100 - Math.max(0, moves - pairCount * 2) * 4)
    );
  }
  return Math.min(70, pairs * 8);
}

export function computeMiniGameRewards(score: number) {
  const credits =
    MINI_GAME_REWARDS.baseCredits +
    Math.floor(score * MINI_GAME_REWARDS.creditsPerScore);
  const skillGain = Math.min(
    MINI_GAME_REWARDS.maxSkillGain,
    Math.floor(score * MINI_GAME_REWARDS.skillGainPerScore)
  );
  const xp = Math.min(
    MINI_GAME_REWARDS.maxXp,
    Math.floor(score * MINI_GAME_REWARDS.xpPerScore)
  );
  return {
    credits,
    skillGain,
    xp,
    happinessGain: MINI_GAME_REWARDS.happinessGain,
  };
}

export const TRADE_COOLDOWN_DAYS = 7;
export const TRADE_EXPIRY_HOURS = 72;
export const TRADE_MAX_CREDITS = 5000;
export const TRADE_MAX_ITEM_QUANTITY = 10;

export interface TradeItemLine {
  itemId: string;
  quantity: number;
}

export const BREEDING_MIN_LEVEL = 10;
export const BREEDING_COOLDOWN_DAYS = 7;
export const BREEDING_INCUBATION_HOURS = 48;
export const BREEDING_FEE_CREDITS = 100;
export const BREEDING_MAX_PETS = 5;
export const BREEDING_EGG_ITEM_ID = "breeding-egg";

export const SKILL_STATS = ["strength", "speed", "defense", "intelligence"] as const;

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
