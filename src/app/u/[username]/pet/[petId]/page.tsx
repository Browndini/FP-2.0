"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { NEED_STATS, SHOP_ITEMS, SKILL_STATS, STARTER_SPECIES } from "@/lib/constants/game";
import type { PetDoc } from "@/features/pets/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatBar } from "@/features/dashboard/StatBar";
import { cn } from "@/lib/utils";

const RARITY_STYLES: Record<string, string> = {
  common: "bg-muted text-muted-foreground",
  uncommon: "bg-green-100 text-green-700",
  rare: "bg-blue-100 text-blue-700",
  shiny: "bg-yellow-100 text-yellow-700",
  super: "bg-purple-100 text-purple-700",
};

type ProfileState =
  | { status: "loading" }
  | { status: "not-found" }
  | { status: "private" }
  | { status: "loaded"; pet: PetDoc };

export default function PublicPetProfile() {
  const params = useParams<{ username: string; petId: string }>();
  const { username, petId } = params;
  const [state, setState] = useState<ProfileState>({ status: "loading" });

  useEffect(() => {
    if (!username || !petId) return;

    async function load() {
      try {
        const usernameSnap = await getDoc(doc(db, "usernames", username));
        if (!usernameSnap.exists()) {
          setState({ status: "not-found" });
          return;
        }

        const uid: string = usernameSnap.data().uid;
        const petSnap = await getDoc(doc(db, "users", uid, "pets", petId));

        if (!petSnap.exists()) {
          setState({ status: "not-found" });
          return;
        }

        const pet = petSnap.data() as PetDoc;
        if (!pet.isPublic) {
          setState({ status: "private" });
          return;
        }

        setState({ status: "loaded", pet });
      } catch {
        setState({ status: "not-found" });
      }
    }

    load();
  }, [username, petId]);

  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-border/60 bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-xl font-bold tracking-tight text-primary">
            Future Pets
          </Link>
          <span className="text-sm text-muted-foreground">@{username}</span>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto w-full max-w-2xl px-6 py-8">
          {state.status === "loading" && (
            <p className="text-center text-muted-foreground">Loading…</p>
          )}

          {state.status === "not-found" && (
            <div className="text-center space-y-2">
              <p className="text-lg font-semibold">Pet not found</p>
              <p className="text-sm text-muted-foreground">
                This profile doesn&apos;t exist or the pet has been removed.
              </p>
            </div>
          )}

          {state.status === "private" && (
            <div className="text-center space-y-2">
              <p className="text-lg font-semibold">This pet is private</p>
              <p className="text-sm text-muted-foreground">
                The owner has made this pet&apos;s profile private.
              </p>
            </div>
          )}

          {state.status === "loaded" && (() => {
            const pet = state.pet;
            const species = STARTER_SPECIES.find((s) => s.id === pet.speciesId);
            const cosmetic = SHOP_ITEMS.find((i) => i.id === pet.equippedCosmetic);

            return (
              <div className="space-y-6">
                <Card className="rounded-2xl">
                  <CardContent className="flex flex-col items-center gap-4 pt-6 sm:flex-row sm:items-start">
                    <div className="relative size-32 shrink-0">
                      <Image
                        src={pet.imageUrl || species?.placeholderImage || "/pets/placeholders/emberfox.svg"}
                        alt={pet.name}
                        fill
                        className="object-contain"
                        unoptimized
                      />
                    </div>
                    <div className="space-y-2 text-center sm:text-left">
                      <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                        <h1 className="text-2xl font-bold">{pet.name}</h1>
                        <Badge className={cn("capitalize", RARITY_STYLES[pet.rarity])}>
                          {pet.rarity}
                        </Badge>
                        {cosmetic && (
                          <Badge className="bg-violet-100 text-violet-700 hover:bg-violet-100">
                            {cosmetic.name}
                          </Badge>
                        )}
                      </div>
                      {species && (
                        <p className="text-sm text-muted-foreground">
                          {species.name} · {species.element}
                        </p>
                      )}
                      <p className="text-sm font-medium">Level {pet.level}</p>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid gap-6 md:grid-cols-2">
                  <Card className="rounded-2xl">
                    <CardHeader>
                      <CardTitle className="text-base">Needs</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {NEED_STATS.map((stat) => (
                        <StatBar key={stat} stat={stat} value={pet.stats[stat] ?? 0} />
                      ))}
                    </CardContent>
                  </Card>

                  <Card className="rounded-2xl">
                    <CardHeader>
                      <CardTitle className="text-base">Skills</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {SKILL_STATS.map((stat) => (
                        <StatBar key={stat} stat={stat} value={pet.stats[stat] ?? 0} />
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </div>
            );
          })()}
        </div>
      </main>
    </div>
  );
}
