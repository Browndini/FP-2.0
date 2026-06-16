"use client";

import { Suspense } from "react";
import { useAuthRedirect } from "@/features/auth";
import { ShopPage } from "@/features/shop";

function ShopContent() {
  const { isReady } = useAuthRedirect("requireDashboard");

  if (!isReady) {
    return (
      <div className="flex min-h-full items-center justify-center">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  return <ShopPage />;
}

export default function ShopRoute() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-full items-center justify-center">
          <p className="text-muted-foreground">Loading…</p>
        </div>
      }
    >
      <ShopContent />
    </Suspense>
  );
}
