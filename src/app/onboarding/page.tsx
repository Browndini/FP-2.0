"use client";

import { useAuthRedirect } from "@/features/auth";
import { OnboardingWizard } from "@/features/onboarding";

export default function OnboardingPage() {
  const { isReady } = useAuthRedirect("requireOnboarding");

  if (!isReady) {
    return (
      <div className="flex min-h-full items-center justify-center">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-12">
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Welcome to Future Pets</h1>
        <p className="text-muted-foreground">
          Choose your companion and set your preferences to get started.
        </p>
      </div>
      <OnboardingWizard />
    </div>
  );
}
