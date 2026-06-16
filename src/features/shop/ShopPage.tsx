"use client";

import { useCallback, useState } from "react";
import { httpsCallable } from "firebase/functions";
import { doc, updateDoc } from "firebase/firestore";
import { SHOP_ITEMS } from "@/lib/constants/game";
import { db, functions } from "@/lib/firebase/client";
import { useAuth } from "@/features/auth";
import { usePet } from "@/features/pets";
import { useInventory } from "./useInventory";
import { AppHeader } from "@/components/AppHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ShopPage() {
  const { user, userDoc, refreshUserDoc } = useAuth();
  const { pet } = usePet(user?.uid);
  const { inventory } = useInventory(user?.uid);
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const ownedIds = new Set(inventory.map((i) => i.itemId));

  const handleBuy = useCallback(
    async (itemId: string) => {
      setPending(itemId);
      setError(null);
      try {
        const call = httpsCallable(functions, "purchaseItem");
        await call({ itemId });
        await refreshUserDoc();
      } catch (err: unknown) {
        const msg =
          err && typeof err === "object" && "message" in err
            ? String((err as { message?: string }).message)
            : "Purchase failed. Try again.";
        setError(msg);
      } finally {
        setPending(null);
      }
    },
    [refreshUserDoc]
  );

  const handleEquip = useCallback(
    async (itemId: string) => {
      if (!user || !pet) return;
      setPending(`equip-${itemId}`);
      setError(null);
      try {
        const isEquipped = pet.equippedCosmetic === itemId;
        await updateDoc(doc(db, "users", user.uid, "pets", pet.id), {
          equippedCosmetic: isEquipped ? null : itemId,
        });
      } catch {
        setError("Failed to update cosmetic.");
      } finally {
        setPending(null);
      }
    },
    [user, pet]
  );

  return (
    <div className="flex min-h-full flex-col">
      <AppHeader credits={userDoc?.credits ?? 0} username={userDoc?.username} />

      <main className="flex-1">
        <div className="mx-auto w-full max-w-6xl px-6 py-8 space-y-8">
          {error && (
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </p>
          )}

          <section>
            <h2 className="mb-4 text-lg font-semibold">Cosmetics</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {SHOP_ITEMS.map((item) => {
                const owned = ownedIds.has(item.id);
                const equipped = pet?.equippedCosmetic === item.id;
                const canAfford = (userDoc?.credits ?? 0) >= item.creditsPrice;
                const buying = pending === item.id;
                const equipping = pending === `equip-${item.id}`;

                return (
                  <Card key={item.id} className="rounded-2xl">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-base">{item.name}</CardTitle>
                        {equipped && (
                          <Badge className="bg-primary/10 text-primary hover:bg-primary/10 shrink-0">
                            Equipped
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{item.creditsPrice} credits</span>
                        {owned ? (
                          <Button
                            size="sm"
                            variant={equipped ? "outline" : "default"}
                            disabled={equipping || !pet}
                            onClick={() => handleEquip(item.id)}
                          >
                            {equipping
                              ? "Updating…"
                              : equipped
                              ? "Unequip"
                              : "Equip"}
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            disabled={buying || !canAfford || pending !== null}
                            onClick={() => handleBuy(item.id)}
                          >
                            {buying ? "Buying…" : canAfford ? "Buy" : "Can't afford"}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
