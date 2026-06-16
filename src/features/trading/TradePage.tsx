"use client";

import { useState } from "react";
import { useAuth, useAuthRedirect } from "@/features/auth";
import { usePet } from "@/features/pets";
import { AppHeader } from "@/components/AppHeader";
import { CreateTradeForm } from "./CreateTradeForm";
import { TradeOfferCard } from "./TradeOfferCard";
import { useTradeHistory, useTrades } from "./useTrades";
import {
  canUserTrade,
  formatCredits,
  formatDuration,
  formatTradeItems,
  tradeCooldownRemainingMs,
} from "./formatTrade";
import { cn } from "@/lib/utils";

type Tab = "incoming" | "outgoing" | "create" | "history";

export function TradePage() {
  const { user, userDoc, signOut } = useAuth();
  const { isReady } = useAuthRedirect("requireDashboard");
  const { pet } = usePet(user?.uid);
  const { pendingIncoming, pendingOutgoing, history, loading } = useTrades(user?.uid);
  const { entries: historyEntries } = useTradeHistory(user?.uid);
  const [tab, setTab] = useState<Tab>("incoming");

  if (!isReady) {
    return (
      <div className="flex min-h-full items-center justify-center">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  const createdAtMs = userDoc?.createdAt?.toMillis() ?? null;
  const tradeAllowed = canUserTrade(createdAtMs);
  const cooldownMs = tradeCooldownRemainingMs(createdAtMs);

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: "incoming", label: "Incoming", count: pendingIncoming.length },
    { id: "outgoing", label: "Outgoing", count: pendingOutgoing.length },
    { id: "create", label: "Create offer" },
    { id: "history", label: "History" },
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
            <h1 className="text-2xl font-bold">Trading</h1>
            <p className="text-sm text-muted-foreground">
              Trade cosmetics, credits, or swap pets with other players. Offered
              items and credits are held in escrow until the trade completes or is
              cancelled.
            </p>
            {!tradeAllowed && (
              <p className="text-sm text-amber-700">
                New accounts can trade in {formatDuration(cooldownMs)}.
              </p>
            )}
            {!userDoc?.username && (
              <p className="text-sm text-amber-700">
                Set a username on your dashboard before trading.
              </p>
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

          {loading && tab !== "create" && (
            <p className="text-sm text-muted-foreground">Loading trades…</p>
          )}

          {tab === "incoming" && !loading && (
            <div className="space-y-3">
              {pendingIncoming.length === 0 ? (
                <p className="text-sm text-muted-foreground">No incoming offers.</p>
              ) : (
                pendingIncoming.map((trade) => (
                  <TradeOfferCard
                    key={trade.id}
                    trade={trade}
                    currentUid={user!.uid}
                  />
                ))
              )}
            </div>
          )}

          {tab === "outgoing" && !loading && (
            <div className="space-y-3">
              {pendingOutgoing.length === 0 ? (
                <p className="text-sm text-muted-foreground">No outgoing offers.</p>
              ) : (
                pendingOutgoing.map((trade) => (
                  <TradeOfferCard
                    key={trade.id}
                    trade={trade}
                    currentUid={user!.uid}
                  />
                ))
              )}
            </div>
          )}

          {tab === "create" && user && (
            tradeAllowed && userDoc?.username ? (
              <CreateTradeForm
                uid={user.uid}
                pet={pet}
                credits={userDoc.credits ?? 0}
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                Trading is unavailable until requirements are met.
              </p>
            )
          )}

          {tab === "history" && (
            <div className="space-y-3">
              {historyEntries.length === 0 && history.length === 0 ? (
                <p className="text-sm text-muted-foreground">No trade history yet.</p>
              ) : (
                historyEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-2xl border border-border bg-card p-4 text-sm space-y-1"
                  >
                    <p className="font-medium">
                      {entry.summary.fromUsername} ↔ {entry.summary.toUsername}
                    </p>
                    <p className="text-muted-foreground">
                      You were the {entry.role === "sender" ? "sender" : "recipient"}
                    </p>
                    <p>Gave: {formatTradeItems(entry.summary.offeredItems)} · {formatCredits(entry.summary.offeredCredits)}</p>
                    <p>Got: {formatTradeItems(entry.summary.requestedItems)} · {formatCredits(entry.summary.requestedCredits)}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
