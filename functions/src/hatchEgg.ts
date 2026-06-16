import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import {
  BREEDING_MAX_PETS,
  STARTER_SPECIES,
} from "./constants";
import { eggInventoryDocId } from "./breeding";

interface HatchEggInput {
  pairId: string;
  petName: string;
}

export const hatchEgg = onCall<HatchEggInput>(
  { region: "us-central1", cors: true },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be signed in.");
    }

    const uid = request.auth.uid;
    const { pairId, petName } = request.data;

    if (!pairId || !petName?.trim()) {
      throw new HttpsError("invalid-argument", "Pair ID and pet name are required.");
    }

    if (petName.trim().length < 2 || petName.trim().length > 24) {
      throw new HttpsError("invalid-argument", "Pet name must be 2–24 characters.");
    }

    const db = admin.firestore();
    const pairRef = db.doc(`breedingPairs/${pairId}`);
    const now = admin.firestore.Timestamp.now();
    const nowMs = now.toMillis();

    return db.runTransaction(async (tx) => {
      const pairSnap = await tx.get(pairRef);
      if (!pairSnap.exists) {
        throw new HttpsError("not-found", "Breeding pair not found.");
      }

      const pair = pairSnap.data()!;

      if (pair.ownerAUid !== uid && pair.ownerBUid !== uid) {
        throw new HttpsError("permission-denied", "Not a participant.");
      }

      if (pair.status !== "incubating") {
        throw new HttpsError(
          "failed-precondition",
          "This egg is not ready to hatch yet."
        );
      }

      const hatchAt = pair.hatchAt as admin.firestore.Timestamp;
      if (hatchAt.toMillis() > nowMs) {
        throw new HttpsError(
          "failed-precondition",
          "Incubation is still in progress."
        );
      }

      const isOwnerA = pair.ownerAUid === uid;
      if (isOwnerA && pair.hatchedByA) {
        throw new HttpsError("failed-precondition", "You already hatched this egg.");
      }
      if (!isOwnerA && pair.hatchedByB) {
        throw new HttpsError("failed-precondition", "You already hatched this egg.");
      }

      const petsQuery = db.collection(`users/${uid}/pets`);
      const petsSnap = await tx.get(petsQuery);
      if (petsSnap.size >= BREEDING_MAX_PETS) {
        throw new HttpsError(
          "failed-precondition",
          `Maximum of ${BREEDING_MAX_PETS} pets per account.`
        );
      }

      const eggRef = db.doc(`users/${uid}/inventory/${eggInventoryDocId(pairId)}`);
      const eggSnap = await tx.get(eggRef);
      if (!eggSnap.exists) {
        throw new HttpsError("not-found", "Egg not found in your inventory.");
      }

      const species = STARTER_SPECIES.find(
        (s) => s.id === pair.offspringSpeciesId
      );
      if (!species) {
        throw new HttpsError("internal", "Unknown offspring species.");
      }

      const petRef = db.collection(`users/${uid}/pets`).doc();
      tx.set(petRef, {
        speciesId: pair.offspringSpeciesId,
        name: petName.trim(),
        rarity: pair.offspringRarity,
        imageUrl: species.placeholderImage,
        stats: pair.offspringStats,
        level: 1,
        xp: 0,
        totalXp: 0,
        levelCostMultiplier: pair.offspringLevelCostMultiplier,
        growthTier: pair.offspringGrowthTier,
        careCooldowns: {},
        freeRenameUsed: false,
        createdAt: now,
        lastCareAt: now,
        lastDecayAppliedAt: now,
        isPublic: true,
        bredFromPairId: pairId,
      });

      tx.delete(eggRef);

      const pairUpdate: Record<string, unknown> = isOwnerA
        ? { hatchedByA: true }
        : { hatchedByB: true };

      const hatchedByA = isOwnerA ? true : pair.hatchedByA;
      const hatchedByB = !isOwnerA ? true : pair.hatchedByB;

      if (hatchedByA && hatchedByB) {
        pairUpdate.status = "hatched";
        tx.update(db.doc(`users/${pair.ownerAUid}/pets/${pair.petAId}`), {
          activeBreedingPairId: null,
        });
        if (pair.petBId) {
          tx.update(db.doc(`users/${pair.ownerBUid}/pets/${pair.petBId}`), {
            activeBreedingPairId: null,
          });
        }
      }

      tx.update(pairRef, pairUpdate);

      return {
        petId: petRef.id,
        rarity: pair.offspringRarity,
        speciesId: pair.offspringSpeciesId,
      };
    });
  }
);
