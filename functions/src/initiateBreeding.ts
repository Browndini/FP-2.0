import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { assertPetCanBreed } from "./breeding";

interface InitiateBreedingInput {
  partnerUsername: string;
  petId: string;
}

export const initiateBreeding = onCall<InitiateBreedingInput>(
  { region: "us-central1", cors: true },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be signed in.");
    }

    const uid = request.auth.uid;
    const partnerUsername = request.data.partnerUsername?.toLowerCase().trim();
    const petId = request.data.petId;

    if (!partnerUsername || !petId) {
      throw new HttpsError("invalid-argument", "Partner username and pet are required.");
    }

    const db = admin.firestore();
    const now = admin.firestore.Timestamp.now();

    return db.runTransaction(async (tx) => {
      const userRef = db.doc(`users/${uid}`);
      const usernameRef = db.doc(`usernames/${partnerUsername}`);

      const [userSnap, usernameSnap, petSnap] = await Promise.all([
        tx.get(userRef),
        tx.get(usernameRef),
        tx.get(db.doc(`users/${uid}/pets/${petId}`)),
      ]);

      if (!userSnap.exists) {
        throw new HttpsError("not-found", "User not found.");
      }

      const ownerAUsername = userSnap.data()?.username as string | undefined;
      if (!ownerAUsername) {
        throw new HttpsError(
          "failed-precondition",
          "Set a username before breeding."
        );
      }

      if (ownerAUsername === partnerUsername) {
        throw new HttpsError("invalid-argument", "Cannot breed with yourself.");
      }

      if (!usernameSnap.exists) {
        throw new HttpsError("not-found", "Partner username not found.");
      }

      const ownerBUid = usernameSnap.data()?.uid as string;
      if (ownerBUid === uid) {
        throw new HttpsError("invalid-argument", "Cannot breed with yourself.");
      }

      if (!petSnap.exists) {
        throw new HttpsError("not-found", "Pet not found.");
      }

      assertPetCanBreed(petSnap.data() as Parameters<typeof assertPetCanBreed>[0]);

      const pairRef = db.collection("breedingPairs").doc();
      tx.set(pairRef, {
        ownerAUid: uid,
        ownerBUid,
        ownerAUsername,
        ownerBUsername: partnerUsername,
        petAId: petId,
        petBId: null,
        status: "pending",
        eggId: pairRef.id,
        hatchAt: null,
        createdAt: now,
        acceptedAt: null,
        hatchedByA: false,
        hatchedByB: false,
      });

      tx.update(db.doc(`users/${uid}/pets/${petId}`), {
        activeBreedingPairId: pairRef.id,
      });

      return { pairId: pairRef.id };
    });
  }
);
