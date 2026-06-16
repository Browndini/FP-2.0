import type { Timestamp } from "firebase/firestore";
import type {
  RarityTier,
  GrowthTier,
  PetStat,
  CareActionId,
} from "@/lib/constants/game";

export type CareCooldowns = Partial<Record<CareActionId, Timestamp>>;

export interface PetDoc {
  speciesId: string;
  name: string;
  rarity: RarityTier;
  imageUrl: string;
  stats: Record<PetStat, number>;
  level: number;
  xp: number;
  totalXp?: number;
  levelCostMultiplier?: number;
  growthTier?: GrowthTier;
  careCooldowns?: CareCooldowns;
  equippedCosmetic?: string | null;
  freeRenameUsed?: boolean;
  createdAt: Timestamp;
  lastCareAt: Timestamp;
  lastDecayAppliedAt: Timestamp;
  isPublic: boolean;
  inTradeId?: string | null;
  activeBreedingPairId?: string | null;
  lastBredAt?: Timestamp | null;
  bredFromPairId?: string | null;
}

export interface PetWithId extends PetDoc {
  id: string;
}

/** Defaults for pets created before leveling fields were added. */
export function resolvePetLevelingFields(pet: PetWithId) {
  return {
    totalXp: pet.totalXp ?? pet.xp,
    levelCostMultiplier: pet.levelCostMultiplier ?? 1,
    growthTier: pet.growthTier ?? "normal",
  } as const;
}
