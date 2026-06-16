"use client";

import { useCallback, useEffect, useState } from "react";
import { httpsCallable } from "firebase/functions";
import { CARE_ACTIONS, type CareActionId } from "@/lib/constants/game";
import {
  formatCooldown,
  getCooldownRemainingMs,
  isCareActionReady,
} from "@/lib/care";
import type { CareCooldowns } from "@/features/pets/types";
import { functions } from "@/lib/firebase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ACTION_LABELS: Record<
  CareActionId,
  { label: string; description: string }
> = {
  feed: { label: "Feed", description: "+25 hunger, +5 happiness" },
  play: { label: "Play", description: "+20 happiness, −10 energy" },
  rest: { label: "Rest", description: "+30 energy, +5 health" },
  heal: {
    label: "Heal",
    description: "+25 health · 50 credits",
  },
};

interface CareActionPanelProps {
  petId: string;
  careCooldowns?: CareCooldowns;
  credits: number;
  onCreditsChange?: () => void;
}

function cooldownMsFromMap(
  careCooldowns: CareCooldowns | undefined,
  action: CareActionId
): number | null {
  const ts = careCooldowns?.[action];
  return ts ? ts.toMillis() : null;
}

export function CareActionPanel({
  petId,
  careCooldowns,
  credits,
  onCreditsChange,
}: CareActionPanelProps) {
  const [pending, setPending] = useState<CareActionId | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  const performAction = useCallback(
    async (action: CareActionId) => {
      setPending(action);
      setError(null);
      try {
        const call = httpsCallable(functions, "performCareAction");
        await call({ petId, action });
        if (action === "heal") {
          onCreditsChange?.();
        }
      } catch (err: unknown) {
        const message =
          err && typeof err === "object" && "message" in err
            ? String((err as { message?: string }).message)
            : "Action failed. Try again.";
        setError(message);
      } finally {
        setPending(null);
      }
    },
    [petId, onCreditsChange]
  );

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="text-base">Care</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-2 sm:grid-cols-2">
          {(Object.keys(CARE_ACTIONS) as CareActionId[]).map((action) => {
            const lastUsedMs = cooldownMsFromMap(careCooldowns, action);
            const ready = isCareActionReady(
              lastUsedMs,
              action,
              now
            );
            const remaining = getCooldownRemainingMs(
              lastUsedMs,
              CARE_ACTIONS[action].cooldownMinutes,
              now
            );
            const healBlocked =
              action === "heal" && credits < (CARE_ACTIONS.heal.creditsCost ?? 0);

            return (
              <Button
                key={action}
                variant="outline"
                className="h-auto flex-col items-start gap-1 px-4 py-3 text-left"
                disabled={!ready || healBlocked || pending !== null}
                onClick={() => performAction(action)}
              >
                <span className="font-semibold">
                  {pending === action ? "Working…" : ACTION_LABELS[action].label}
                </span>
                <span className="text-xs font-normal text-muted-foreground">
                  {ACTION_LABELS[action].description}
                </span>
                {!ready && remaining > 0 && (
                  <span className="text-xs font-normal text-primary">
                    Ready in {formatCooldown(remaining)}
                  </span>
                )}
              </Button>
            );
          })}
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
}
