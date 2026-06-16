"use client";

import Link from "next/link";
import { MINI_GAME_LIST } from "@/lib/constants/game";
import { useAuth, useAuthRedirect } from "@/features/auth";
import { usePet } from "@/features/pets";
import { AppHeader } from "@/components/AppHeader";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function MiniGameHub() {
  const { userDoc, signOut } = useAuth();
  const { isReady, user } = useAuthRedirect("requireDashboard");
  const { pet } = usePet(user?.uid);

  if (!isReady) {
    return (
      <div className="flex min-h-full items-center justify-center">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  const energy = Math.floor(pet?.stats.energy ?? 0);

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
            <h1 className="text-2xl font-bold">Mini-games</h1>
            <p className="text-sm text-muted-foreground">
              Train your pet&apos;s skills, earn credits, and gain XP. Each game
              costs energy — rewards are granted server-side after you finish.
            </p>
            {pet && (
              <p className="text-sm">
                {pet.name} has{" "}
                <span className="font-medium text-primary">{energy} energy</span>
              </p>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {MINI_GAME_LIST.map((game) => {
              const blocked = energy < game.energyCost;
              return (
                <Card key={game.id} className="rounded-2xl">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base">{game.name}</CardTitle>
                      <Badge variant="outline" className="capitalize shrink-0">
                        {game.skillStat}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      {game.description}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Energy cost: {game.energyCost}
                      {blocked && " · Not enough energy right now"}
                    </p>
                    <Link
                      href={`/games/${game.id}`}
                      className={cn(
                        buttonVariants({ size: "sm" }),
                        blocked && "pointer-events-none opacity-50"
                      )}
                      aria-disabled={blocked}
                    >
                      Play
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
