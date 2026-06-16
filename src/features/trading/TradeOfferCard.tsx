"use client";

import { useCallback, useState } from "react";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase/client";
import { Button } from "@/components/ui/button";
import type { TradeWithId } from "./types";
import {
  formatCredits,
  formatTradeItems,
} from "./formatTrade";

interface TradeOfferCardProps {
  trade: TradeWithId;
  currentUid: string;
  onAction?: () => void;
}

export function TradeOfferCard({
  trade,
  currentUid,
  onAction,
}: TradeOfferCardProps) {
  const [pending, setPending] = useState<"accept" | "cancel" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isRecipient = trade.toUid === currentUid;
  const isPending = trade.status === "pending";
  const expired = trade.expiresAt.toMillis() <= Date.now();

  const runAction = useCallback(
    async (action: "accept" | "cancel") => {
      setPending(action);
      setError(null);
      try {
        const fn = httpsCallable(functions, action === "accept" ? "executeTrade" : "cancelTrade");
        await fn({ tradeId: trade.id });
        onAction?.();
      } catch (err: unknown) {
        const msg =
          err && typeof err === "object" && "message" in err
            ? String((err as { message?: string }).message)
            : "Trade action failed.";
        setError(msg);
      } finally {
        setPending(null);
      }
    },
    [trade.id, onAction]
  );

  return (
    <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-medium">
          {trade.fromUsername} → {trade.toUsername}
        </p>
        <span className="text-xs capitalize text-muted-foreground">
          {trade.status}
          {isPending && expired ? " (expired)" : ""}
        </span>
      </div>

      <div className="grid gap-2 text-sm sm:grid-cols-2">
        <div className="rounded-xl bg-muted/40 p-3">
          <p className="text-xs font-medium text-muted-foreground">Offered</p>
          <p>{formatTradeItems(trade.offeredItems)}</p>
          <p>{formatCredits(trade.offeredCredits)}</p>
          {trade.offeredPetId && (
            <p className="text-xs text-muted-foreground">Pet swap included</p>
          )}
        </div>
        <div className="rounded-xl bg-muted/40 p-3">
          <p className="text-xs font-medium text-muted-foreground">Requested</p>
          <p>{formatTradeItems(trade.requestedItems)}</p>
          <p>{formatCredits(trade.requestedCredits)}</p>
          {trade.requestedPetId && (
            <p className="text-xs text-muted-foreground">Pet swap included</p>
          )}
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {isPending && (
        <div className="flex flex-wrap gap-2">
          {isRecipient && !expired && (
            <Button
              size="sm"
              disabled={pending !== null}
              onClick={() => runAction("accept")}
            >
              {pending === "accept" ? "Accepting…" : "Accept trade"}
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            disabled={pending !== null}
            onClick={() => runAction("cancel")}
          >
            {pending === "cancel" ? "Cancelling…" : "Cancel"}
          </Button>
        </div>
      )}
    </div>
  );
}
