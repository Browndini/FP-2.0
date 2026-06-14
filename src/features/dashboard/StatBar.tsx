"use client";

import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const STAT_COLORS: Record<string, string> = {
  hunger: "text-orange-600",
  happiness: "text-pink-600",
  health: "text-green-600",
  energy: "text-yellow-600",
  strength: "text-red-600",
  speed: "text-blue-500",
  defense: "text-slate-600",
  intelligence: "text-violet-600",
};

const STAT_LABELS: Record<string, string> = {
  hunger: "Hunger",
  happiness: "Happiness",
  health: "Health",
  energy: "Energy",
  strength: "Strength",
  speed: "Speed",
  defense: "Defense",
  intelligence: "Intelligence",
};

interface StatBarProps {
  stat: string;
  value: number;
}

export function StatBar({ stat, value }: StatBarProps) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className={cn("font-medium", STAT_COLORS[stat])}>
          {STAT_LABELS[stat] ?? stat}
        </span>
        <span className="tabular-nums text-muted-foreground">{value}</span>
      </div>
      <Progress value={value} className="h-2" />
    </div>
  );
}
