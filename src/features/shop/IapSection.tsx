"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { httpsCallable } from "firebase/functions";
import { IAP_ITEMS } from "@/lib/constants/game";
import { functions } from "@/lib/firebase/client";
import { trackEvent } from "@/lib/analytics";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface IapSectionProps {
  ownedIds: Set<string>;
  onPurchased: () => void;
  onEquip?: (itemId: string) => void;
  equippedId?: string | null;
  equipPending?: string | null;
  hasPet?: boolean;
}

export function IapSection({
  ownedIds,
  onPurchased,
  onEquip,
  equippedId,
  equipPending,
  hasPet,
}: IapSectionProps) {
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleBuy = useCallback(async (productId: string) => {
    setPending(productId);
    setError(null);
    try {
      const origin = window.location.origin;
      const call = httpsCallable<
        { productId: string; successUrl: string; cancelUrl: string },
        { url: string }
      >(functions, "createStripeCheckout");

      trackEvent("iap_checkout_started", { product_id: productId });

      const response = await call({
        productId,
        successUrl: `${origin}/shop`,
        cancelUrl: `${origin}/shop`,
      });

      window.location.href = response.data.url;
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "message" in err
          ? String((err as { message?: string }).message)
          : "Checkout unavailable.";
      setError(msg);
      setPending(null);
    }
  }, []);

  return (
    <section>
      <div className="mb-4 space-y-1">
        <h2 className="text-lg font-semibold">Premium cosmetics (IAP)</h2>
        <p className="text-sm text-muted-foreground">
          Real-money purchases grant cosmetic items only — no stats, credits, or
          pay-to-win advantages.
        </p>
      </div>
      {error && (
        <p className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {IAP_ITEMS.map((item) => {
          const owned = ownedIds.has(item.id);
          return (
            <Card key={item.id} className="rounded-2xl border-primary/20">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">{item.name}</CardTitle>
                  <Badge variant="outline" className="shrink-0">
                    IAP
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">{item.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    ${item.displayPriceUsd.toFixed(2)}
                  </span>
                  {owned ? (
                    onEquip ? (
                      <Button
                        size="sm"
                        variant={equippedId === item.id ? "outline" : "default"}
                        disabled={equipPending === item.id || !hasPet}
                        onClick={() => onEquip(item.id)}
                      >
                        {equipPending === item.id
                          ? "Updating…"
                          : equippedId === item.id
                          ? "Unequip"
                          : "Equip"}
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">Owned</span>
                    )
                  ) : (
                    <Button
                      size="sm"
                      disabled={pending !== null}
                      onClick={() => handleBuy(item.id)}
                    >
                      {pending === item.id ? "Redirecting…" : "Buy"}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      <Suspense fallback={null}>
        <IapReturnHandler onPurchased={onPurchased} />
      </Suspense>
    </section>
  );
}

function IapReturnHandler({ onPurchased }: { onPurchased: () => void }) {
  const searchParams = useSearchParams();
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.get("iap") !== "success") return;
    const sessionId = searchParams.get("session_id");
    if (!sessionId) return;

    void (async () => {
      try {
        const call = httpsCallable<
          { sessionId: string },
          { productId: string }
        >(functions, "verifyIapPurchase");
        const response = await call({ sessionId });
        trackEvent("iap_purchase_completed", {
          product_id: response.data.productId,
        });
        setMessage("Premium cosmetic added to your inventory!");
        onPurchased();
        window.history.replaceState({}, "", "/shop");
      } catch {
        setMessage("Payment received — refresh if your item isn’t visible yet.");
      }
    })();
  }, [searchParams, onPurchased]);

  if (!message) return null;

  return (
    <p className="mt-4 rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary">
      {message}
    </p>
  );
}
