"use client";

import { useState } from "react";
import { useAuth, useAuthRedirect } from "@/features/auth";
import { usePets } from "@/features/pets";
import { AppHeader } from "@/components/AppHeader";
import { BreedingInviteCard, IncubatingCard } from "./BreedingCards";
import { CreateBreedingInvite } from "./CreateBreedingInvite";
import { useBreedingPairs } from "./useBreedingPairs";
import { BREEDING_INFO } from "./formatBreeding";
import { cn } from "@/lib/utils";

type Tab = "incubating" | "incoming" | "outgoing" | "invite";

export function BreedingPage() {
  const { user, userDoc, signOut } = useAuth();
  const { isReady } = useAuthRedirect("requireDashboard");
  const { pets } = usePets(user?.uid);
  const {
    pendingIncoming,
    pendingOutgoing,
    incubating,
    completed,
    loading,
  } = useBreedingPairs(user?.uid);
  const [tab, setTab] = useState<Tab>("incubating");

  if (!isReady) {
    return (
      <div className="flex min-h-full items-center justify-center">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: "incubating", label: "Eggs", count: incubating.length },
    { id: "incoming", label: "Invites", count: pendingIncoming.length },
    { id: "outgoing", label: "Sent", count: pendingOutgoing.length },
    { id: "invite", label: "New invite" },
  ];

  return (
    <div className="flex min-h-full flex-col">
      <AppHeader
        credits={userDoc?.credits ?? 0}
        username={userDoc?.username}
        onSignOut={signOut}
      />

      <main className="flex-1">
        <div className="mx-auto w-full max-w-6xl space-y-6 px-6 py-8">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Breeding</h1>
            <p className="text-sm text-muted-foreground">
              Match with another player to incubate an egg. Offspring inherit skill stats
              from both parents with a fresh rarity roll — shiny parents boost shiny odds.
            </p>
            <p className="text-xs text-muted-foreground">
              Level {BREEDING_INFO.minLevel}+ · {BREEDING_INFO.cooldownDays}-day cooldown per
              pet · {BREEDING_INFO.incubationHours}h incubation
            </p>
            {!userDoc?.username && (
              <p className="text-sm text-amber-700">Set a username before breeding.</p>
            )}
          </div>

          <div className="flex flex-wrap gap-1 rounded-lg bg-muted/50 p-1">
            {tabs.map(({ id, label, count }) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  tab === id
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {label}
                {count !== undefined && count > 0 ? ` (${count})` : ""}
              </button>
            ))}
          </div>

          {loading && tab !== "invite" && (
            <p className="text-sm text-muted-foreground">Loading…</p>
          )}

          {tab === "incubating" && !loading && (
            <div className="space-y-3">
              {incubating.length === 0 && completed.length === 0 ? (
                <p className="text-sm text-muted-foreground">No eggs incubating.</p>
              ) : (
                <>
                  {incubating.map((pair) => (
                    <IncubatingCard
                      key={pair.id}
                      pair={pair}
                      alreadyHatched={
                        pair.ownerAUid === user!.uid
                          ? Boolean(pair.hatchedByA)
                          : Boolean(pair.hatchedByB)
                      }
                    />
                  ))}
                  {completed.length > 0 && (
                    <p className="text-sm text-muted-foreground pt-2">
                      {completed.length} completed breeding pair(s) in your history.
                    </p>
                  )}
                </>
              )}
            </div>
          )}

          {tab === "incoming" && !loading && (
            <div className="space-y-3">
              {pendingIncoming.length === 0 ? (
                <p className="text-sm text-muted-foreground">No incoming invites.</p>
              ) : (
                pendingIncoming.map((pair) => (
                  <BreedingInviteCard
                    key={pair.id}
                    pair={pair}
                    currentUid={user!.uid}
                    pets={pets}
                  />
                ))
              )}
            </div>
          )}

          {tab === "outgoing" && !loading && (
            <div className="space-y-3">
              {pendingOutgoing.length === 0 ? (
                <p className="text-sm text-muted-foreground">No sent invites.</p>
              ) : (
                pendingOutgoing.map((pair) => (
                  <BreedingInviteCard
                    key={pair.id}
                    pair={pair}
                    currentUid={user!.uid}
                    pets={pets}
                  />
                ))
              )}
            </div>
          )}

          {tab === "invite" && userDoc?.username && (
            <CreateBreedingInvite
              pets={pets}
              credits={userDoc.credits ?? 0}
            />
          )}
        </div>
      </main>
    </div>
  );
}
