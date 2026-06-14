import type { Timestamp } from "firebase/firestore";
import type { RarityTier, PetStat } from "@/lib/constants/game";

export interface PetDoc {
  speciesId: string;
  name: string;
  rarity: RarityTier;
  imageUrl: string;
  stats: Record<PetStat, number>;
  level: number;
  xp: number;
  createdAt: Timestamp;
  lastCareAt: Timestamp;
  lastDecayAppliedAt: Timestamp;
  isPublic: boolean;
}

export interface PetWithId extends PetDoc {
  id: string;
}
