"use client";

import { getAnalytics, isSupported, logEvent, type Analytics } from "firebase/analytics";
import { getApps } from "firebase/app";
import { firebaseConfig } from "./firebase/config";

export type AnalyticsEventName =
  | "sign_up"
  | "pet_created"
  | "mini_game_completed"
  | "shop_purchase"
  | "iap_checkout_started"
  | "iap_purchase_completed"
  | "app_error";

let analytics: Analytics | null = null;
let initPromise: Promise<void> | null = null;

export async function initAnalytics(): Promise<void> {
  if (typeof window === "undefined") return;
  if (analytics) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    if (!(await isSupported())) return;
    if (!firebaseConfig.apiKey || !firebaseConfig.appId) return;
    const app = getApps()[0];
    if (!app) return;
    analytics = getAnalytics(app);
  })();

  return initPromise;
}

export function trackEvent(
  name: AnalyticsEventName,
  params?: Record<string, string | number | boolean>
): void {
  void initAnalytics().then(() => {
    if (!analytics) return;
    // Firebase SDK types omit some standard/custom event names we use at runtime.
    logEvent(analytics, name as never, params);
  });
}

export function trackError(message: string, context?: string): void {
  trackEvent("app_error", {
    message: message.slice(0, 100),
    ...(context ? { context: context.slice(0, 100) } : {}),
  });
}
