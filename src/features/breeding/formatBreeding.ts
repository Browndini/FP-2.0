import {
  BREEDING_COOLDOWN_DAYS,
  BREEDING_FEE_CREDITS,
  BREEDING_INCUBATION_HOURS,
  BREEDING_MIN_LEVEL,
  STARTER_SPECIES,
} from "@/lib/constants/game";
import type { PetWithId } from "@/features/pets/types";

export function formatIncubationRemaining(hatchAtMs: number): string {
  const remaining = hatchAtMs - Date.now();
  if (remaining <= 0) return "Ready to hatch!";
  const hours = Math.floor(remaining / (60 * 60 * 1000));
  const minutes = Math.ceil((remaining % (60 * 60 * 1000)) / (60 * 1000));
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h remaining`;
  }
  if (hours > 0) return `${hours}h ${minutes}m remaining`;
  return `${minutes}m remaining`;
}

export function petCanBreed(pet: PetWithId): { ok: boolean; reason?: string } {
  if (pet.level < BREEDING_MIN_LEVEL) {
    return { ok: false, reason: `Needs level ${BREEDING_MIN_LEVEL}+` };
  }
  if (pet.inTradeId) {
    return { ok: false, reason: "In an active trade" };
  }
  if (pet.activeBreedingPairId) {
    return { ok: false, reason: "Already in a breeding pair" };
  }
  const lastBredMs = pet.lastBredAt?.toMillis() ?? 0;
  const cooldownMs = BREEDING_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
  if (lastBredMs && Date.now() - lastBredMs < cooldownMs) {
    return { ok: false, reason: "Breeding cooldown active" };
  }
  return { ok: true };
}

export function speciesName(speciesId?: string): string {
  return STARTER_SPECIES.find((s) => s.id === speciesId)?.name ?? speciesId ?? "Unknown";
}

export const BREEDING_INFO = {
  minLevel: BREEDING_MIN_LEVEL,
  cooldownDays: BREEDING_COOLDOWN_DAYS,
  incubationHours: BREEDING_INCUBATION_HOURS,
  feeCredits: BREEDING_FEE_CREDITS,
} as const;
