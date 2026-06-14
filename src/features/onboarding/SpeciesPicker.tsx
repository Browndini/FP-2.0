"use client";

import Image from "next/image";
import { STARTER_SPECIES, type StarterSpeciesId } from "@/lib/constants/game";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const ELEMENT_COLORS: Record<string, string> = {
  fire: "bg-orange-100 text-orange-700 border-orange-200",
  water: "bg-blue-100 text-blue-700 border-blue-200",
  nature: "bg-green-100 text-green-700 border-green-200",
  electric: "bg-yellow-100 text-yellow-700 border-yellow-200",
  crystal: "bg-purple-100 text-purple-700 border-purple-200",
};

interface SpeciesPickerProps {
  value: StarterSpeciesId | null;
  onChange: (id: StarterSpeciesId) => void;
}

export function SpeciesPicker({ value, onChange }: SpeciesPickerProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {STARTER_SPECIES.map((species) => {
        const selected = value === species.id;
        return (
          <button
            key={species.id}
            type="button"
            onClick={() => onChange(species.id as StarterSpeciesId)}
            className={cn(
              "flex flex-col items-center gap-3 rounded-2xl border-2 p-4 text-left transition-all",
              selected
                ? "border-primary bg-primary/5 shadow-sm"
                : "border-border hover:border-primary/40 hover:bg-muted/40"
            )}
          >
            <div className="relative size-20 shrink-0">
              <Image
                src={species.placeholderImage}
                alt={species.name}
                fill
                className="object-contain"
                unoptimized
              />
            </div>
            <div className="w-full space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold">{species.name}</span>
                <Badge
                  variant="outline"
                  className={cn("text-xs", ELEMENT_COLORS[species.element])}
                >
                  {species.element}
                </Badge>
              </div>
              <p className="text-xs leading-snug text-muted-foreground">
                {species.description}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
