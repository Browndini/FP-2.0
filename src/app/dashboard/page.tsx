"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth, useAuthRedirect } from "@/features/auth";
import { usePet } from "@/features/pets";
import { useApplyDecay } from "@/features/care";
import { PetDashboard } from "@/features/dashboard/PetDashboard";
import { CelebrationConfetti } from "@/features/dashboard/CelebrationConfetti";
import { UsernameSetupModal } from "@/features/dashboard/UsernameSetupModal";
import { Button } from "@/components/ui/button";

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

      <header className="border-b border-border/60 bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <span className="text-xl font-bold tracking-tight text-primary">Future Pets</span>
          <div className="flex items-center gap-3">
            {userDoc?.username && (
              <Link
                href={pet ? `/u/${userDoc.username}/pet/${pet.id}` : "#"}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                @{userDoc.username}
              </Link>
            )}
            <span className="text-sm text-muted-foreground">
              {userDoc?.credits ?? 0} credits
            </span>
            <Link href="/shop">
              <Button variant="outline" size="sm">Shop</Button>
            </Link>
            <Button variant="outline" size="sm" onClick={signOut}>
              Sign out
            </Button>
          </div>
        </div>
      </header>

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
