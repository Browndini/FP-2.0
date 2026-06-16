import type { Timestamp } from "firebase/firestore";
import type { BreedingStatus } from "@/lib/constants/game";

export interface BreedingPairWithId {
  id: string;
  ownerAUid: string;
  ownerBUid: string;
  ownerAUsername: string;
  ownerBUsername: string;
  petAId: string;
  petBId?: string | null;
  status: BreedingStatus;
  eggId: string;
  hatchAt?: Timestamp | null;
  createdAt: Timestamp;
  acceptedAt?: Timestamp | null;
  offspringSpeciesId?: string;
  offspringRarity?: string;
  offspringStats?: Record<string, number>;
  offspringLevelCostMultiplier?: number;
  offspringGrowthTier?: string;
  hatchedByA?: boolean;
  hatchedByB?: boolean;
}
