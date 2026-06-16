"use client";

import { Suspense } from "react";
import { MiniGamePlay } from "@/features/minigames";
import { useAuthRedirect } from "@/features/auth";

function ReflexDashContent() {
  const { isReady } = useAuthRedirect("requireDashboard");

  if (!isReady) {
    return (
      <div className="flex min-h-full items-center justify-center">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  return <MiniGamePlay gameId="reflex-dash" />;
}

export default function ReflexDashPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-full items-center justify-center">
          <p className="text-muted-foreground">Loading…</p>
        </div>
      }
    >
      <ReflexDashContent />
    </Suspense>
  );
}
