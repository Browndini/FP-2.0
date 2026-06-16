"use client";

import { useCallback, useEffect, useState } from "react";
import { httpsCallable } from "firebase/functions";
import {
  SHOP_ITEMS,
  TRADE_MAX_CREDITS,
  TRADE_MAX_ITEM_QUANTITY,
} from "@/lib/constants/game";
import { functions } from "@/lib/firebase/client";
import { useInventory } from "@/features/shop/useInventory";
import type { PetWithId } from "@/features/pets/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ItemSelection {
  itemId: string;
  quantity: number;
  enabled: boolean;
}

interface CreateTradeFormProps {
  uid: string;
  pet: PetWithId | null;
  credits: number;
  onCreated?: () => void;
}

export function CreateTradeForm({
  uid,
  pet,
  credits,
  onCreated,
}: CreateTradeFormProps) {
  const { inventory } = useInventory(uid);
  const [toUsername, setToUsername] = useState("");
  const [offeredCredits, setOfferedCredits] = useState(0);
  const [requestedCredits, setRequestedCredits] = useState(0);
  const [includePetSwap, setIncludePetSwap] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [offeredSelections, setOfferedSelections] = useState<ItemSelection[]>([]);
  const [requestedSelections, setRequestedSelections] = useState<ItemSelection[]>(
    SHOP_ITEMS.map((item) => ({
      itemId: item.id,
      quantity: 1,
      enabled: false,
    }))
  );

  useEffect(() => {
    setOfferedSelections((prev) =>
      inventory.map((item) => {
        const existing = prev.find((s) => s.itemId === item.itemId);
        return {
          itemId: item.itemId,
          quantity: existing?.quantity ?? 1,
          enabled: existing?.enabled ?? false,
        };
      })
    );
  }, [inventory]);

  const toggleOffered = (itemId: string, enabled: boolean) => {
    setOfferedSelections((prev) =>
      prev.map((s) => (s.itemId === itemId ? { ...s, enabled } : s))
    );
  };

  const setOfferedQty = (itemId: string, quantity: number) => {
    setOfferedSelections((prev) =>
      prev.map((s) =>
        s.itemId === itemId
          ? { ...s, quantity: Math.min(TRADE_MAX_ITEM_QUANTITY, Math.max(1, quantity)) }
          : s
      )
    );
  };

  const toggleRequested = (itemId: string, enabled: boolean) => {
    setRequestedSelections((prev) =>
      prev.map((s) => (s.itemId === itemId ? { ...s, enabled } : s))
    );
  };

  const setRequestedQty = (itemId: string, quantity: number) => {
    setRequestedSelections((prev) =>
      prev.map((s) =>
        s.itemId === itemId
          ? { ...s, quantity: Math.min(TRADE_MAX_ITEM_QUANTITY, Math.max(1, quantity)) }
          : s
      )
    );
  };

  const handleSubmit = useCallback(async () => {
    setPending(true);
    setError(null);
    setSuccess(null);

    const offeredItems = offeredSelections
      .filter((s) => s.enabled)
      .map(({ itemId, quantity }) => ({ itemId, quantity }));
    const requestedItems = requestedSelections
      .filter((s) => s.enabled)
      .map(({ itemId, quantity }) => ({ itemId, quantity }));

    try {
      const call = httpsCallable(functions, "createTradeOffer");
      await call({
        toUsername: toUsername.trim(),
        offeredItems,
        requestedItems,
        offeredCredits,
        requestedCredits,
        offeredPetId: includePetSwap && pet ? pet.id : null,
        requestedPetId: includePetSwap ? "swap" : null,
      });

      setSuccess(`Trade offer sent to @${toUsername.trim().toLowerCase()}.`);
      setToUsername("");
      setOfferedCredits(0);
      setRequestedCredits(0);
      setIncludePetSwap(false);
      onCreated?.();
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "message" in err
          ? String((err as { message?: string }).message)
          : "Could not create trade offer.";
      setError(msg);
    } finally {
      setPending(false);
    }
  }, [
    offeredSelections,
    requestedSelections,
    toUsername,
    offeredCredits,
    requestedCredits,
    includePetSwap,
    pet,
    onCreated,
  ]);

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="text-base">Create trade offer</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="trade-username">
            Trade with (@username)
          </label>
          <input
            id="trade-username"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            placeholder="username"
            value={toUsername}
            onChange={(e) => setToUsername(e.target.value)}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <p className="text-sm font-medium">You offer</p>
            {offeredSelections.length === 0 && (
              <p className="text-xs text-muted-foreground">No items in inventory.</p>
            )}
            {offeredSelections.map((sel) => {
              const owned = inventory.find((i) => i.itemId === sel.itemId)?.quantity ?? 0;
              const shopItem = SHOP_ITEMS.find((i) => i.id === sel.itemId);
              return (
                <label key={sel.itemId} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={sel.enabled}
                    onChange={(e) => toggleOffered(sel.itemId, e.target.checked)}
                  />
                  <span className="flex-1">{shopItem?.name ?? sel.itemId}</span>
                  <input
                    type="number"
                    min={1}
                    max={Math.min(TRADE_MAX_ITEM_QUANTITY, owned)}
                    value={sel.quantity}
                    disabled={!sel.enabled}
                    className="w-16 rounded border border-border px-2 py-1 text-xs"
                    onChange={(e) => setOfferedQty(sel.itemId, Number(e.target.value))}
                  />
                </label>
              );
            })}
            <label className="flex items-center gap-2 text-sm">
              Credits (max {Math.min(TRADE_MAX_CREDITS, credits)})
              <input
                type="number"
                min={0}
                max={Math.min(TRADE_MAX_CREDITS, credits)}
                value={offeredCredits}
                className="w-24 rounded border border-border px-2 py-1 text-xs"
                onChange={(e) => setOfferedCredits(Number(e.target.value) || 0)}
              />
            </label>
            {pet && !pet.inTradeId && (
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={includePetSwap}
                  onChange={(e) => setIncludePetSwap(e.target.checked)}
                />
                Include {pet.name} (pet swap — partner must accept with their pet)
              </label>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">You want</p>
            {requestedSelections.map((sel) => {
              const shopItem = SHOP_ITEMS.find((i) => i.id === sel.itemId);
              return (
                <label key={sel.itemId} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={sel.enabled}
                    onChange={(e) => toggleRequested(sel.itemId, e.target.checked)}
                  />
                  <span className="flex-1">{shopItem?.name ?? sel.itemId}</span>
                  <input
                    type="number"
                    min={1}
                    max={TRADE_MAX_ITEM_QUANTITY}
                    value={sel.quantity}
                    disabled={!sel.enabled}
                    className="w-16 rounded border border-border px-2 py-1 text-xs"
                    onChange={(e) => setRequestedQty(sel.itemId, Number(e.target.value))}
                  />
                </label>
              );
            })}
            <label className="flex items-center gap-2 text-sm">
              Credits
              <input
                type="number"
                min={0}
                max={TRADE_MAX_CREDITS}
                value={requestedCredits}
                className="w-24 rounded border border-border px-2 py-1 text-xs"
                onChange={(e) => setRequestedCredits(Number(e.target.value) || 0)}
              />
            </label>
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
        {success && <p className="text-sm text-primary">{success}</p>}

        <Button disabled={pending || !toUsername.trim()} onClick={handleSubmit}>
          {pending ? "Sending…" : "Send trade offer"}
        </Button>
      </CardContent>
    </Card>
  );
}
