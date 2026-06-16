"use client";

import { useEffect } from "react";
import { initAnalytics } from "@/lib/analytics";
import { AuthProvider } from "@/features/auth";
import { ErrorBoundary, GlobalErrorListeners } from "@/components/ErrorBoundary";

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    void initAnalytics();
  }, []);

  return (
    <ErrorBoundary>
      <GlobalErrorListeners />
      <AuthProvider>{children}</AuthProvider>
    </ErrorBoundary>
  );
}
