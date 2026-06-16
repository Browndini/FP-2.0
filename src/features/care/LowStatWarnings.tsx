import type { PetStat } from "@/lib/constants/game";
import { getLowNeedWarnings } from "@/lib/care";

interface LowStatWarningsProps {
  stats: Record<PetStat, number>;
}

export function LowStatWarnings({ stats }: LowStatWarningsProps) {
  const warnings = getLowNeedWarnings(stats);
  if (warnings.length === 0) return null;

  return (
    <div className="space-y-2 rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3">
      {warnings.map((warning) => (
        <p key={warning} className="text-sm text-destructive">
          {warning}
        </p>
      ))}
    </div>
  );
}
