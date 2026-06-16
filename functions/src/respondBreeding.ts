import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import {
  BREEDING_EGG_ITEM_ID,
  BREEDING_FEE_CREDITS,
  BREEDING_INCUBATION_HOURS,
} from "./constants";
import {
  assertPetCanBreed,
  computeOffspring,
  eggInventoryDocId,
  type PetBreedingData,
} from "./breeding";

interface RespondBreedingInput {
  pairId: string;
  accept: boolean;
  petId?: string;
}

export const respondBreeding = onCall<RespondBreedingInput>(
  { region: "us-central1", cors: true },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be signed in.");
    }

    const uid = request.auth.uid;
    const { pairId, accept, petId } = request.data;

    if (!pairId) {
      throw new HttpsError("invalid-argument", "Breeding pair ID is required.");
    }

    const db = admin.firestore();
    const pairRef = db.doc(`breedingPairs/${pairId}`);
    const now = admin.firestore.Timestamp.now();
    const hatchAt = admin.firestore.Timestamp.fromMillis(
      now.toMillis() + BREEDING_INCUBATION_HOURS * 60 * 60 * 1000
    );

    return db.runTransaction(async (tx) => {
      const pairSnap = await tx.get(pairRef);
      if (!pairSnap.exists) {
        throw new HttpsError("not-found", "Breeding invite not found.");
      }

      const pair = pairSnap.data()!;

      if (pair.ownerBUid !== uid) {
        throw new HttpsError(
          "permission-denied",
          "Only the invited partner can respond."
        );
      }

      if (pair.status !== "pending") {
        throw new HttpsError(
          "failed-precondition",
          "This breeding invite is no longer pending."
        );
      }

      if (!accept) {
        tx.update(pairRef, { status: "cancelled" });
        tx.update(db.doc(`users/${pair.ownerAUid}/pets/${pair.petAId}`), {
          activeBreedingPairId: null,
        });
        return { pairId, status: "cancelled" };
      }

      if (!petId) {
        throw new HttpsError(
          "invalid-argument",
          "Select your pet to accept breeding."
        );
      }

      const [petASnap, petBSnap, userASnap, userBSnap] = await Promise.all([
        tx.get(db.doc(`users/${pair.ownerAUid}/pets/${pair.petAId}`)),
        tx.get(db.doc(`users/${uid}/pets/${petId}`)),
        tx.get(db.doc(`users/${pair.ownerAUid}`)),
        tx.get(db.doc(`users/${uid}`)),
      ]);

      if (!petASnap.exists || !petBSnap.exists) {
        throw new HttpsError("not-found", "One or both pets not found.");
      }

      const petA = petASnap.data() as PetBreedingData;
      const petB = petBSnap.data() as PetBreedingData;

      assertPetCanBreed(petA);
      assertPetCanBreed(petB);

      const creditsA = userASnap.data()?.credits ?? 0;
      const creditsB = userBSnap.data()?.credits ?? 0;

      if (creditsA < BREEDING_FEE_CREDITS || creditsB < BREEDING_FEE_CREDITS) {
        throw new HttpsError(
          "failed-precondition",
          `Both players need ${BREEDING_FEE_CREDITS} credits to breed.`
        );
      }

      const offspring = computeOffspring(petA, petB);

      tx.update(db.doc(`users/${pair.ownerAUid}`), {
        credits: creditsA - BREEDING_FEE_CREDITS,
      });
      tx.update(db.doc(`users/${uid}`), {
        credits: creditsB - BREEDING_FEE_CREDITS,
      });

      const eggDocId = eggInventoryDocId(pairId);
      const eggPayload = {
        itemId: BREEDING_EGG_ITEM_ID,
        quantity: 1,
        breedingPairId: pairId,
        hatchAt,
        acquiredAt: now,
      };

      tx.set(db.doc(`users/${pair.ownerAUid}/inventory/${eggDocId}`), eggPayload);
      tx.set(db.doc(`users/${uid}/inventory/${eggDocId}`), eggPayload);

      tx.update(db.doc(`users/${pair.ownerAUid}/pets/${pair.petAId}`), {
        lastBredAt: now,
        activeBreedingPairId: pairId,
      });
      tx.update(db.doc(`users/${uid}/pets/${petId}`), {
        lastBredAt: now,
        activeBreedingPairId: pairId,
      });

      tx.update(pairRef, {
        status: "incubating",
        petBId: petId,
        acceptedAt: now,
        hatchAt,
        offspringSpeciesId: offspring.speciesId,
        offspringRarity: offspring.rarity,
        offspringStats: offspring.stats,
        offspringLevelCostMultiplier: offspring.levelCostMultiplier,
        offspringGrowthTier: offspring.growthTier,
      });

      return {
        pairId,
        status: "incubating",
        hatchAt: hatchAt.toMillis(),
        offspringRarity: offspring.rarity,
      };
    });
  }
);
