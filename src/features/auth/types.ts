import type { Timestamp } from "firebase/firestore";

export interface UserDoc {
  displayName: string;
  email: string;
  photoURL?: string;
  credits: number;
  onboardingComplete: boolean;
  createdAt: Timestamp;
  lastLoginAt: Timestamp;
}
