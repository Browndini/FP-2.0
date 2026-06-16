import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { USERNAME_REGEX } from "./constants";

interface SetUsernameInput {
  username: string;
}

export const setUsername = onCall<SetUsernameInput>(
  { region: "us-central1", cors: true },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be signed in.");
    }

    const uid = request.auth.uid;
    const normalized = request.data.username?.toLowerCase().trim();

    if (!normalized || !USERNAME_REGEX.test(normalized)) {
      throw new HttpsError(
        "invalid-argument",
        "Username must be 3–20 characters: lowercase letters, numbers, and underscores only."
      );
    }

    const db = admin.firestore();
    const userRef = db.doc(`users/${uid}`);
    const usernameRef = db.doc(`usernames/${normalized}`);

    return db.runTransaction(async (tx) => {
      const [userSnap, usernameSnap] = await Promise.all([
        tx.get(userRef),
        tx.get(usernameRef),
      ]);

      if (!userSnap.exists) {
        throw new HttpsError("not-found", "User not found.");
      }

      if (userSnap.data()?.username) {
        throw new HttpsError("failed-precondition", "Username already set.");
      }

      if (usernameSnap.exists) {
        throw new HttpsError("already-exists", "That username is already taken.");
      }

      tx.set(usernameRef, { uid });
      tx.update(userRef, { username: normalized });

      return { username: normalized };
    });
  }
);
