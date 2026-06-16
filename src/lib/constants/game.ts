/**
 * Tunable game constants for Future Pets.
 * All balance values live here — update GAME_DESIGN.md when changing defaults.
 */

export const GAME_NAME = "Future Pets";

/** Need stats — passive decay applies (hybrid care model). */
export const NEED_STATS = [
  "hunger",
  "happiness",
  "health",
  "energy",
] as const;

/** Combat/skill stats — no passive decay; trained via mini-games and items. */
export const SKILL_STATS = [
  "strength",
  "speed",
  "defense",
  "intelligence",
] as const;

export type NeedStat = (typeof NEED_STATS)[number];
export type SkillStat = (typeof SKILL_STATS)[number];
export type PetStat = NeedStat | SkillStat;

export const RARITY_TIERS = [
  "common",
  "uncommon",
  "rare",
  "shiny",
  "super",
] as const;

export type RarityTier = (typeof RARITY_TIERS)[number];

/** Roll weights at pet creation (must sum to 1). Server-side roll in Phase 1+. */
export const RARITY_WEIGHTS: Record<RarityTier, number> = {
  common: 0.75,
  uncommon: 0.18,
  rare: 0.059,
  shiny: 0.01,
  super: 0.001,
};

/** Multipliers applied to base stat ranges per rarity tier. */
export const RARITY_STAT_MULTIPLIERS: Record<RarityTier, number> = {
  common: 1.0,
  uncommon: 1.08,
  rare: 1.18,
  shiny: 1.35,
  super: 1.55,
};

/** Passive decay per hour for need stats (0–100 scale). TUNABLE. */
export const DECAY_PER_HOUR: Record<NeedStat, number> = {
  hunger: 1.2,
  happiness: 0.8,
  health: 0.3,
  energy: 0.9,
};

/** Base stat range per species at creation (before rarity multiplier). */
export const STARTER_SPECIES = [
  {
    id: "emberfox",
    name: "Emberfox",
    element: "fire",
    description: "Quick and spirited; favors speed and energy.",
    placeholderImage: "/pets/placeholders/emberfox.svg",
    baseStats: {
      hunger: [55, 70],
      happiness: [50, 65],
      health: [50, 60],
      energy: [60, 75],
      strength: [45, 55],
      speed: [60, 75],
      defense: [40, 50],
      intelligence: [45, 55],
    },
  },
  {
    id: "tidefin",
    name: "Tidefin",
    element: "water",
    description: "Balanced and adaptable; solid all-round starter.",
    placeholderImage: "/pets/placeholders/tidefin.svg",
    baseStats: {
      hunger: [50, 65],
      happiness: [55, 70],
      health: [55, 65],
      energy: [50, 60],
      strength: [50, 60],
      speed: [50, 60],
      defense: [50, 60],
      intelligence: [50, 60],
    },
  },
  {
    id: "leafhorn",
    name: "Leafhorn",
    element: "nature",
    description: "Sturdy and calm; high health and defense.",
    placeholderImage: "/pets/placeholders/leafhorn.svg",
    baseStats: {
      hunger: [50, 60],
      happiness: [50, 60],
      health: [65, 80],
      energy: [45, 55],
      strength: [55, 65],
      speed: [40, 50],
      defense: [60, 75],
      intelligence: [45, 55],
    },
  },
  {
    id: "voltail",
    name: "Voltail",
    element: "electric",
    description: "Clever and energetic; peaks in intelligence and speed.",
    placeholderImage: "/pets/placeholders/voltail.svg",
    baseStats: {
      hunger: [45, 55],
      happiness: [55, 70],
      health: [45, 55],
      energy: [65, 80],
      strength: [40, 50],
      speed: [65, 80],
      defense: [40, 50],
      intelligence: [60, 75],
    },
  },
  {
    id: "crystwing",
    name: "Crystwing",
    element: "crystal",
    description: "Rare temperament; high variance in rolled stats.",
    placeholderImage: "/pets/placeholders/crystwing.svg",
    baseStats: {
      hunger: [45, 70],
      happiness: [45, 70],
      health: [45, 70],
      energy: [45, 70],
      strength: [45, 70],
      speed: [45, 70],
      defense: [45, 70],
      intelligence: [45, 70],
    },
  },
] as const;

export type StarterSpeciesId = (typeof STARTER_SPECIES)[number]["id"];

/** Onboarding choices that modify stat roll weights (Phase 1+). */
export const ONBOARDING_CHOICES = {
  playStyle: ["adventurer", "caretaker", "competitor"] as const,
  favoriteElement: ["fire", "water", "nature", "electric", "crystal"] as const,
  personality: ["bold", "calm", "curious"] as const,
} as const;

/** Stat bias deltas from onboarding (added to roll midpoint). TUNABLE. */
export const ONBOARDING_STAT_BIAS: Record<
  string,
  Partial<Record<PetStat, number>>
> = {
  adventurer: { energy: 5, speed: 4 },
  caretaker: { happiness: 6, health: 4 },
  competitor: { strength: 5, defense: 4 },
  bold: { strength: 3, happiness: 2 },
  calm: { health: 3, defense: 2 },
  curious: { intelligence: 4, happiness: 2 },
};

export const CURRENCY = {
  id: "credits",
  displayName: "Credits",
  startingBalance: 500,
} as const;

export const CARE_ACTIONS = {
  feed: { cooldownMinutes: 30, hunger: 25, happiness: 5 },
  play: { cooldownMinutes: 20, happiness: 20, energy: -10 },
  rest: { cooldownMinutes: 45, energy: 30, health: 5 },
  heal: { cooldownMinutes: 60, health: 25, creditsCost: 50 },
} as const;

export type CareActionId = keyof typeof CARE_ACTIONS;

/** Health decay multiplier when hunger or happiness is at 0. TUNABLE. */
export const ACCELERATED_HEALTH_DECAY_MULTIPLIER = 2;

export const STAT_MIN = 0;
export const STAT_MAX = 100;
export const XP_PER_LEVEL_BASE = 100;
export const XP_LEVEL_SCALING = 1.15;

/** Per-pet level cost roll bands — TUNABLE. Lower multiplier = faster leveling. */
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

/** Mini-game definitions — keep in sync with functions/src/constants.ts */
export const MINI_GAMES = {
  "reflex-dash": {
    id: "reflex-dash",
    name: "Reflex Dash",
    description: "Tap glowing targets before they fade. Trains speed.",
    skillStat: "speed",
    energyCost: 15,
    durationSeconds: 30,
    minDurationSeconds: 10,
    maxScore: 45,
    minMsBetweenHits: 350,
  },
  "memory-match": {
    id: "memory-match",
    name: "Memory Match",
    description: "Flip cards and match pairs. Trains intelligence.",
    skillStat: "intelligence",
    energyCost: 15,
    durationSeconds: 120,
    minDurationSeconds: 20,
    maxScore: 100,
    pairCount: 8,
  },
} as const;

export type MiniGameId = keyof typeof MINI_GAMES;
export type MiniGameDefinition = (typeof MINI_GAMES)[MiniGameId];

export const MINI_GAME_LIST: MiniGameDefinition[] = Object.values(MINI_GAMES);

/** Reward tuning for completed mini-game sessions — TUNABLE. */
export const MINI_GAME_REWARDS = {
  baseCredits: 15,
  creditsPerScore: 1.5,
  skillGainPerScore: 0.25,
  maxSkillGain: 12,
  xpPerScore: 0.8,
  maxXp: 45,
  happinessGain: 5,
} as const;

/** Score formula for memory-match — duplicated server-side for validation. */
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

/** Trading — keep in sync with functions/src/constants.ts */
export const TRADE_COOLDOWN_DAYS = 7;
export const TRADE_EXPIRY_HOURS = 72;
export const TRADE_MAX_CREDITS = 5000;
export const TRADE_MAX_ITEM_QUANTITY = 10;

export type TradeStatus = "pending" | "cancelled" | "completed";

export interface TradeItemLine {
  itemId: string;
  quantity: number;
}

export interface TradeDoc {
  fromUid: string;
  fromUsername: string;
  toUid: string;
  toUsername: string;
  status: TradeStatus;
  offeredItems: TradeItemLine[];
  requestedItems: TradeItemLine[];
  offeredCredits: number;
  requestedCredits: number;
  offeredPetId?: string | null;
  requestedPetId?: string | null;
  createdAt: import("firebase/firestore").Timestamp;
  expiresAt: import("firebase/firestore").Timestamp;
  completedAt?: import("firebase/firestore").Timestamp | null;
  cancelledAt?: import("firebase/firestore").Timestamp | null;
  cancelledBy?: string | null;
}

/** Breeding — keep in sync with functions/src/constants.ts */
export const BREEDING_MIN_LEVEL = 10;
export const BREEDING_COOLDOWN_DAYS = 7;
export const BREEDING_INCUBATION_HOURS = 48;
export const BREEDING_FEE_CREDITS = 100;
export const BREEDING_MAX_PETS = 5;
export const BREEDING_EGG_ITEM_ID = "breeding-egg";

export type BreedingStatus = "pending" | "incubating" | "hatched" | "cancelled";

export interface BreedingPairDoc {
  ownerAUid: string;
  ownerBUid: string;
  ownerAUsername: string;
  ownerBUsername: string;
  petAId: string;
  petBId?: string | null;
  status: BreedingStatus;
  eggId: string;
  hatchAt?: import("firebase/firestore").Timestamp | null;
  createdAt: import("firebase/firestore").Timestamp;
  acceptedAt?: import("firebase/firestore").Timestamp | null;
  offspringSpeciesId?: string;
  offspringRarity?: string;
  offspringStats?: Record<string, number>;
  offspringLevelCostMultiplier?: number;
  offspringGrowthTier?: string;
  hatchedByA?: boolean;
  hatchedByB?: boolean;
}

/** Premium IAP cosmetics — real-money only, no stat effects. Document Stripe Price IDs in FIREBASE_SETUP.md */
export const IAP_ITEMS = [
  {
    id: "iap-nebula-cape",
    name: "Nebula Cape",
    description: "Premium starlit cape woven from distant constellations.",
    displayPriceUsd: 2.99,
    cosmeticOnly: true as const,
  },
  {
    id: "iap-aurora-halo",
    name: "Aurora Halo",
    description: "A shimmering ring of northern lights — cosmetic only.",
    displayPriceUsd: 1.99,
    cosmeticOnly: true as const,
  },
  {
    id: "iap-celestial-wings",
    name: "Celestial Wings",
    description: "Ethereal wings that glow at dusk — cosmetic only.",
    displayPriceUsd: 4.99,
    cosmeticOnly: true as const,
  },
] as const;

export type IapItemId = (typeof IAP_ITEMS)[number]["id"];

export function findCosmeticItem(itemId: string) {
  return (
    SHOP_ITEMS.find((i) => i.id === itemId) ??
    IAP_ITEMS.find((i) => i.id === itemId) ??
    null
  );
}
