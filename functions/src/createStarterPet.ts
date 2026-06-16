import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import {
  RARITY_WEIGHTS,
  RARITY_STAT_MULTIPLIERS,
  ONBOARDING_STAT_BIAS,
  STAT_MIN,
  STAT_MAX,
  STARTER_SPECIES,
  type RarityTier,
} from "./constants";
import { rollLevelCostMultiplier } from "./leveling";

interface CreateStarterPetInput {
  speciesId: string;
  petName: string;
  playStyle: string;
  favoriteElement: string;
  personality: string;
}

function rollRarity(): RarityTier {
  const rand = Math.random();
  let cumulative = 0;
  for (const [rarity, weight] of Object.entries(RARITY_WEIGHTS)) {
    cumulative += weight;
    if (rand < cumulative) return rarity as RarityTier;
  }
  return "common";
}

function rollStat(range: readonly [number, number], bias: number, multiplier: number): number {
  const [min, max] = range;
  const raw = min + Math.random() * (max - min);
  const biased = raw + bias;
  const result = biased * multiplier;
  return Math.round(Math.min(STAT_MAX, Math.max(STAT_MIN, result)));
}

export const createStarterPet = onCall<CreateStarterPetInput>(
  { region: "us-central1", cors: true },
  async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Must be signed in.");
  }

  const uid = request.auth.uid;
  const { speciesId, petName, playStyle, favoriteElement, personality } = request.data;

  // Validate inputs
  if (!speciesId || !petName?.trim() || !playStyle || !favoriteElement || !personality) {
    throw new HttpsError("invalid-argument", "Missing required fields.");
  }
  if (petName.trim().length < 2 || petName.trim().length > 24) {
    throw new HttpsError("invalid-argument", "Pet name must be 2–24 characters.");
  }

  const species = STARTER_SPECIES.find((s) => s.id === speciesId);
  if (!species) {
    throw new HttpsError("invalid-argument", `Unknown species: ${speciesId}`);
  }

  const db = admin.firestore();
  const userRef = db.doc(`users/${uid}`);

  // Guard: prevent duplicate starter pets
  const userSnap = await userRef.get();
  if (userSnap.exists && userSnap.data()?.onboardingComplete) {
    throw new HttpsError("already-exists", "Starter pet already created.");
  }

  const rarity = rollRarity();
  const multiplier = RARITY_STAT_MULTIPLIERS[rarity];
  const { levelCostMultiplier, growthTier } = rollLevelCostMultiplier(rarity);

  // Build stat bias from onboarding choices (play style + personality; element stored only)
  const biasMap: Record<string, number> = {};
  for (const choice of [playStyle, personality]) {
    const bias = ONBOARDING_STAT_BIAS[choice] ?? {};
    for (const [stat, delta] of Object.entries(bias)) {
      biasMap[stat] = (biasMap[stat] ?? 0) + (delta as number);
    }
  }

  const stats: Record<string, number> = {};
  for (const [stat, range] of Object.entries(species.baseStats)) {
    stats[stat] = rollStat(range as readonly [number, number], biasMap[stat] ?? 0, multiplier);
  }

  const now = admin.firestore.FieldValue.serverTimestamp();
  const petRef = db.collection(`users/${uid}/pets`).doc();

  await db.runTransaction(async (tx) => {
    tx.set(petRef, {
      speciesId,
      name: petName.trim(),
      rarity,
      imageUrl: species.placeholderImage,
      stats,
      level: 1,
      xp: 0,
      totalXp: 0,
      levelCostMultiplier,
      growthTier,
      createdAt: now,
      lastCareAt: now,
      lastDecayAppliedAt: now,
      isPublic: true,
    });
    tx.set(
      userRef,
      {
        onboardingComplete: true,
        credits: admin.firestore.FieldValue.increment(0), // preserve existing; set on first create only
        favoriteElement,
      },
      { merge: true }
    );
  });

  return { petId: petRef.id, rarity, levelCostMultiplier, growthTier };
});
