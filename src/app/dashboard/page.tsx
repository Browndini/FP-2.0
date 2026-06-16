"use client";

import { Suspense, useEffect, useState } from "react";
import { useAuth, useAuthRedirect } from "@/features/auth";
import { usePet } from "@/features/pets";
import { useApplyDecay } from "@/features/care";
import { PetDashboard } from "@/features/dashboard/PetDashboard";
import { CelebrationConfetti } from "@/features/dashboard/CelebrationConfetti";
import { UsernameSetupModal } from "@/features/dashboard/UsernameSetupModal";
import { AppHeader } from "@/components/AppHeader";

function DashboardContent() {
  const { userDoc, signOut, refreshUserDoc } = useAuth();
  const { isReady, user } = useAuthRedirect("requireDashboard");
  const { pet, loading: petLoading } = usePet(user?.uid);
  const [showWelcome, setShowWelcome] = useState(false);

  useApplyDecay(pet?.id);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (new URLSearchParams(window.location.search).get("celebrate") === "1") {
      setShowWelcome(true);
    }
  }, []);

  if (!isReady || petLoading) {
    return (
      <div className="flex min-h-full items-center justify-center">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col">
      <CelebrationConfetti />

      {isReady && userDoc && !userDoc.username && (
        <UsernameSetupModal onComplete={refreshUserDoc} />
      )}

      <AppHeader
        credits={userDoc?.credits ?? 0}
        username={userDoc?.username}
        profileHref={
          userDoc?.username && pet
            ? `/pet-profile?username=${encodeURIComponent(userDoc.username)}&petId=${encodeURIComponent(pet.id)}`
            : undefined
        }
        onSignOut={signOut}
      />

      <main className="flex-1">
        <div className="mx-auto w-full max-w-6xl px-6 py-8">
          {showWelcome && (
            <div className="mb-6 rounded-2xl border border-primary/20 bg-primary/10 px-6 py-4 text-center">
              <p className="text-lg font-semibold text-primary">
                Welcome to Future Pets!
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Your companion is ready. Take good care of them!
              </p>
            </div>
          )}
          {pet ? (
            <PetDashboard
              pet={pet}
              credits={userDoc?.credits ?? 0}
              onCreditsChange={refreshUserDoc}
            />
          ) : (
            <div className="flex min-h-64 items-center justify-center rounded-2xl border border-dashed border-border">
              <p className="text-muted-foreground">No pet found.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-full items-center justify-center">
          <p className="text-muted-foreground">Loading…</p>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
