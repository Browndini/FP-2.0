"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth";
import { usePet } from "@/features/pets";
import { PetDashboard } from "@/features/dashboard";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const { user, userDoc, loading: authLoading, signOut } = useAuth();
  const { pet, loading: petLoading } = usePet(user?.uid);
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/");
      return;
    }
    if (userDoc && !userDoc.onboardingComplete) {
      router.replace("/onboarding");
    }
  }, [user, userDoc, authLoading, router]);

  if (authLoading || petLoading) {
    return (
      <div className="flex min-h-full items-center justify-center">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-border/60 bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <span className="text-xl font-bold tracking-tight text-primary">Future Pets</span>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {userDoc?.credits ?? 0} credits
            </span>
            <Button variant="outline" size="sm" onClick={signOut}>
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto w-full max-w-6xl px-6 py-8">
          {pet ? (
            <PetDashboard pet={pet} />
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
