"use client";

import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NEED_STATS, SKILL_STATS, STARTER_SPECIES } from "@/lib/constants/game";
import type { PetWithId } from "@/features/pets/types";
import { StatBar } from "./StatBar";
import { cn } from "@/lib/utils";

const RARITY_STYLES: Record<string, string> = {
  common: "bg-muted text-muted-foreground",
  uncommon: "bg-green-100 text-green-700",
  rare: "bg-blue-100 text-blue-700",
  shiny: "bg-yellow-100 text-yellow-700",
  super: "bg-purple-100 text-purple-700",
};

function xpForNextLevel(level: number) {
  return Math.round(100 * Math.pow(1.15, level - 1));
}

interface PetDashboardProps {
  pet: PetWithId;
}

export function PetDashboard({ pet }: PetDashboardProps) {
  const species = STARTER_SPECIES.find((s) => s.id === pet.speciesId);
  const nextLevelXp = xpForNextLevel(pet.level);

  return (
    <div className="space-y-6">
      {/* Identity card */}
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
            </div>
            {species && (
              <p className="text-sm text-muted-foreground">
                {species.name} · {species.element}
              </p>
            )}
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
                  style={{ width: `${Math.min(100, (pet.xp / nextLevelXp) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Need stats */}
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

        {/* Skill stats */}
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
