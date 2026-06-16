"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import type { User } from "firebase/auth";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";
import type { UserDoc } from "./types";

interface AuthContextValue {
  user: User | null;
  userDoc: UserDoc | null;
  /** True until the first auth state + user doc resolution completes. */
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshUserDoc: () => Promise<UserDoc | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userDoc, setUserDoc] = useState<UserDoc | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let userDocUnsub: (() => void) | undefined;

    const authUnsub = onAuthStateChanged(auth, async (firebaseUser) => {
      userDocUnsub?.();
      userDocUnsub = undefined;
      setLoading(true);
      setUser(firebaseUser);

      if (!firebaseUser) {
        setUserDoc(null);
        setLoading(false);
        return;
      }

      const ref = doc(db, "users", firebaseUser.uid);

      try {
        const snap = await getDoc(ref);

        if (!snap.exists()) {
          await setDoc(ref, {
            displayName: firebaseUser.displayName ?? "",
            email: firebaseUser.email ?? "",
            photoURL: firebaseUser.photoURL ?? undefined,
            credits: 500,
            onboardingComplete: false,
            createdAt: serverTimestamp(),
            lastLoginAt: serverTimestamp(),
          });
        } else {
          updateDoc(ref, { lastLoginAt: serverTimestamp() }).catch(() => {
            // Non-blocking; don't fail auth if login timestamp update fails.
          });
        }

        userDocUnsub = onSnapshot(
          ref,
          (docSnap) => {
            if (docSnap.exists()) {
              setUserDoc(docSnap.data() as UserDoc);
            } else {
              setUserDoc(null);
            }
            setLoading(false);
          },
          () => {
            setUserDoc(null);
            setLoading(false);
          }
        );
      } catch {
        setUserDoc(null);
        setLoading(false);
      }
    });

    return () => {
      authUnsub();
      userDocUnsub?.();
    };
  }, []);

  const signIn = useCallback(async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  }, []);

  const signOut = useCallback(async () => {
    await firebaseSignOut(auth);
  }, []);

  const refreshUserDoc = useCallback(async () => {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) return null;

    const ref = doc(db, "users", firebaseUser.uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;

    const data = snap.data() as UserDoc;
    setUserDoc(data);
    return data;
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, userDoc, loading, signIn, signOut, refreshUserDoc }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
