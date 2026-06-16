"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";

type AuthRedirectMode =
  | "public" // signed-in users leave for app routes
  | "requireAuth" // signed-out users go home
  | "requireOnboarding" // signed-in, onboarding incomplete
  | "requireDashboard"; // signed-in, onboarding complete

/**
 * Centralized auth routing — waits for userDoc before redirecting to avoid loops.
 */
export function useAuthRedirect(mode: AuthRedirectMode) {
  const { user, userDoc, loading } = useAuth();
  const router = useRouter();
  const lastTarget = useRef<string | null>(null);

  useEffect(() => {
    if (loading) return;

    let target: string | null = null;

    switch (mode) {
      case "public":
        if (user && userDoc) {
          target = userDoc.onboardingComplete ? "/dashboard" : "/onboarding";
        }
        break;
      case "requireAuth":
        if (!user) {
          target = "/";
        } else if (!userDoc) {
          return;
        } else if (!userDoc.onboardingComplete) {
          target = "/onboarding";
        }
        break;
      case "requireOnboarding":
        if (!user) {
          target = "/";
        } else if (!userDoc) {
          return;
        } else if (userDoc.onboardingComplete) {
          target = "/dashboard";
        }
        break;
      case "requireDashboard":
        if (!user) {
          target = "/";
        } else if (!userDoc) {
          return;
        } else if (!userDoc.onboardingComplete) {
          target = "/onboarding";
        }
        break;
    }

    if (target && lastTarget.current !== target) {
      lastTarget.current = target;
      router.replace(target);
    }
  }, [loading, user, userDoc, mode, router]);

  const isReady =
    !loading &&
    (mode === "public" ? !user : Boolean(user && userDoc));

  return { isReady, user, userDoc, loading };
}
