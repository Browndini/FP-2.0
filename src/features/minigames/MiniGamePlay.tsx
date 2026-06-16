"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { httpsCallable } from "firebase/functions";
import { MINI_GAMES, type MiniGameId } from "@/lib/constants/game";
import { functions } from "@/lib/firebase/client";
import { trackEvent } from "@/lib/analytics";
import { useAuth } from "@/features/auth";
import { usePet } from "@/features/pets";
import { AppHeader } from "@/components/AppHeader";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ClaimRewardResult, MiniGameResult, StartSessionResult } from "./types";
import { cn } from "@/lib/utils";

type PlayPhase = "idle" | "playing" | "claiming" | "done" | "error";

interface MiniGamePlayProps {
  gameId: MiniGameId;
}

export function MiniGamePlay({ gameId }: MiniGamePlayProps) {
  const game = MINI_GAMES[gameId];
  const { user, userDoc, refreshUserDoc, signOut } = useAuth();
  const { pet } = usePet(user?.uid);
  const canvasRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<import("phaser").Game | null>(null);

  const [phase, setPhase] = useState<PlayPhase>("idle");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [claimResult, setClaimResult] = useState<ClaimRewardResult | null>(null);
  const [lastScore, setLastScore] = useState<number | null>(null);

  useEffect(() => {
    return () => {
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, []);

  const claimReward = useCallback(
    async (result: MiniGameResult) => {
      if (!sessionId) return;

      setPhase("claiming");
      setError(null);

      try {
        const call = httpsCallable<
          {
            sessionId: string;
            score: number;
            metadata: Record<string, number>;
          },
          ClaimRewardResult
        >(functions, "claimMiniGameReward");

        const metadata: Record<string, number> =
          "hits" in result
            ? { hits: result.hits, durationMs: result.durationMs }
            : {
                pairs: result.pairs,
                moves: result.moves,
                durationMs: result.durationMs,
              };

        const response = await call({
          sessionId,
          score: result.score,
          metadata,
        });

        setLastScore(result.score);
        setClaimResult(response.data);
        trackEvent("mini_game_completed", {
          game_id: gameId,
          score: result.score,
        });
        await refreshUserDoc();
        setPhase("done");
      } catch (err: unknown) {
        const msg =
          err && typeof err === "object" && "message" in err
            ? String((err as { message?: string }).message)
            : "Could not claim rewards.";
        setError(msg);
        setPhase("error");
      } finally {
        gameRef.current?.destroy(true);
        gameRef.current = null;
      }
    },
    [sessionId, refreshUserDoc]
  );

  const startGame = useCallback(async () => {
    if (!pet) {
      setError("No pet found.");
      return;
    }

    setError(null);
    setClaimResult(null);
    setLastScore(null);

    try {
      const call = httpsCallable<
        { petId: string; gameId: MiniGameId },
        StartSessionResult
      >(functions, "startMiniGameSession");

      const response = await call({ petId: pet.id, gameId });
      setSessionId(response.data.sessionId);
      setPhase("playing");
      await refreshUserDoc();

      requestAnimationFrame(() => {
        void (async () => {
          if (!canvasRef.current) return;
          gameRef.current?.destroy(true);

          const onComplete = (result: MiniGameResult) => {
            void claimReward(result);
          };

          if (gameId === "reflex-dash") {
            const { launchReflexDash } = await import("./games/reflexDash");
            gameRef.current = await launchReflexDash(canvasRef.current, onComplete);
          } else {
            const { launchMemoryMatch } = await import("./games/memoryMatch");
            gameRef.current = await launchMemoryMatch(canvasRef.current, onComplete);
          }
        })();
      });
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "message" in err
          ? String((err as { message?: string }).message)
          : "Could not start session.";
      setError(msg);
      setPhase("error");
    }
  }, [pet, gameId, claimReward, refreshUserDoc]);

  const energy = pet?.stats.energy ?? 0;
  const canPlay = Boolean(pet) && energy >= game.energyCost && phase === "idle";

  return (
    <div className="flex min-h-full flex-col">
      <AppHeader
        credits={userDoc?.credits ?? 0}
        username={userDoc?.username}
        onSignOut={signOut}
      />

      <main className="flex-1">
        <div className="mx-auto w-full max-w-3xl space-y-6 px-6 py-8">
          <div className="space-y-2">
            <Link
              href="/games"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              ← Back to mini-games
            </Link>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold">{game.name}</h1>
              <Badge variant="outline" className="capitalize">
                {game.skillStat}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{game.description}</p>
          </div>

          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base">Session info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>Energy cost: {game.energyCost} (you have {Math.floor(energy)})</p>
              <p>
                Rewards: credits, {game.skillStat} stat XP, pet level XP, and a
                happiness boost — validated server-side when you finish.
              </p>
              {energy < game.energyCost && phase === "idle" && (
                <p className="text-amber-700">
                  Your pet needs more energy. Try resting on the dashboard first.
                </p>
              )}
            </CardContent>
          </Card>

          {error && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {phase === "done" && claimResult && (
            <Card className="rounded-2xl border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-base">Rewards claimed!</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>
                  Score: <span className="font-semibold">{lastScore}</span>
                </p>
                <p>
                  +{claimResult.creditsEarned} credits (now{" "}
                  {claimResult.totalCredits.toLocaleString()})
                </p>
                <p>
                  +{claimResult.skillGain} {claimResult.skillStat}
                </p>
                <p>
                  +{claimResult.xpEarned} pet XP (Level {claimResult.level},{" "}
                  {claimResult.xp} XP toward next)
                </p>
                <div className="flex flex-wrap gap-2 pt-2">
                  <Link href="/games" className={cn(buttonVariants({ size: "sm" }))}>
                    Play another
                  </Link>
                  <Link
                    href="/dashboard"
                    className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                  >
                    Back to pet
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          {(phase === "idle" || phase === "error") && (
            <Button onClick={startGame} disabled={!canPlay} className="w-full sm:w-auto">
              Start game ({game.energyCost} energy)
            </Button>
          )}

          {phase === "claiming" && (
            <p className="text-center text-sm text-muted-foreground">
              Validating score and granting rewards…
            </p>
          )}

          <div
            ref={canvasRef}
            className={cn(
              "overflow-hidden rounded-2xl border border-border bg-muted/30",
              phase === "playing" || phase === "claiming" ? "block" : "hidden"
            )}
          />
        </div>
      </main>
    </div>
  );
}
