"use client";

import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShopLinkButton } from "@/components/AppHeader";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { NEED_STATS, SKILL_STATS, SHOP_ITEMS, STARTER_SPECIES, MINI_GAMES, findCosmeticItem } from "@/lib/constants/game";
import { xpToNextLevel } from "@/lib/leveling";
import type { PetWithId } from "@/features/pets/types";
import { resolvePetLevelingFields } from "@/features/pets/types";
import {
  CareActionPanel,
  LowStatWarnings,
  PetRenameButton,
} from "@/features/care";
import { StatBar } from "./StatBar";
import { cn } from "@/lib/utils";

const RARITY_STYLES: Record<string, string> = {
  common: "bg-muted text-muted-foreground",
  uncommon: "bg-green-100 text-green-700",
  rare: "bg-blue-100 text-blue-700",
  shiny: "bg-yellow-100 text-yellow-700 ring-1 ring-yellow-400/50",
  super: "bg-purple-100 text-purple-700 ring-1 ring-purple-500/50 rarity-super-badge",
};

const RARITY_FRAME: Record<string, string> = {
  shiny: "ring-4 ring-yellow-400/70 shadow-[0_0_28px_rgba(250,204,21,0.45)]",
  super: "ring-4 ring-purple-500/80 shadow-[0_0_32px_rgba(168,85,247,0.5)] rarity-super-glow",
};

interface PetDashboardProps {
  pet: PetWithId;
  credits: number;
  onCreditsChange?: () => void;
}

export function PetDashboard({ pet, credits, onCreditsChange }: PetDashboardProps) {
  const species = STARTER_SPECIES.find((s) => s.id === pet.speciesId);
  const { totalXp, levelCostMultiplier, growthTier } = resolvePetLevelingFields(pet);
  const nextLevelXp = xpToNextLevel(pet.level, levelCostMultiplier);
  const progressPct =
    nextLevelXp > 0 ? Math.min(100, (pet.xp / nextLevelXp) * 100) : 0;

  return (
    <div className="space-y-6">
      <LowStatWarnings stats={pet.stats} />

      <Card className="rounded-2xl">
        <CardContent className="flex flex-col items-center gap-4 pt-6 sm:flex-row sm:items-start">
          <div
            className={cn(
              "relative size-32 shrink-0 rounded-2xl p-1",
              RARITY_FRAME[pet.rarity]
            )}
          >
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
              {growthTier === "fast" && (
                <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                  Fast grower
                </Badge>
              )}
              {pet.equippedCosmetic && (() => {
                const cosmetic = findCosmeticItem(pet.equippedCosmetic);
                return cosmetic ? (
                  <Badge className="bg-violet-100 text-violet-700 hover:bg-violet-100">
                    {cosmetic.name}
                  </Badge>
                ) : null;
              })()}
            </div>
            {species && (
              <p className="text-sm text-muted-foreground">
                {species.name} · {species.element}
              </p>
            )}
            <PetRenameButton
              petId={pet.id}
              currentName={pet.name}
              freeRenameUsed={pet.freeRenameUsed}
            />
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Level {pet.level}</span>
                <span className="text-muted-foreground">
                  {pet.xp} / {nextLevelXp} XP
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Lifetime: {totalXp.toLocaleString()} XP
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <CareActionPanel
        petId={pet.id}
        careCooldowns={pet.careCooldowns}
        credits={credits}
        onCreditsChange={onCreditsChange}
      />

      <Card className="rounded-2xl border-primary/20 bg-primary/5">
        <CardContent className="flex flex-col items-start justify-between gap-4 pt-6 sm:flex-row sm:items-center">
          <div className="space-y-1">
            <p className="font-semibold">Mini-games</p>
            <p className="text-sm text-muted-foreground">
              Train skills and earn credits — costs{" "}
              {MINI_GAMES["reflex-dash"].energyCost} energy per session.
            </p>
          </div>
          <Link href="/games" className={buttonVariants({ size: "sm" })}>
            Play games
          </Link>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-primary/20 bg-primary/5">
        <CardContent className="flex flex-col items-start justify-between gap-4 pt-6 sm:flex-row sm:items-center">
          <div className="space-y-1">
            <p className="font-semibold">Cosmetic shop</p>
            <p className="text-sm text-muted-foreground">
              You have {credits.toLocaleString()} credits — browse accessories for{" "}
              {pet.name}.
            </p>
          </div>
          <ShopLinkButton size="sm" />
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
}
