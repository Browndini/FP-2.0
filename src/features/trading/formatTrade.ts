import { SHOP_ITEMS } from "@/lib/constants/game";
import type { TradeItemLine } from "@/lib/constants/game";

export function itemDisplayName(itemId: string): string {
  return SHOP_ITEMS.find((i) => i.id === itemId)?.name ?? itemId;
}

export function formatTradeItems(items: TradeItemLine[]): string {
  if (!items.length) return "—";
  return items
    .map((line) => `${itemDisplayName(line.itemId)} ×${line.quantity}`)
    .join(", ");
}

export function formatCredits(amount: number): string {
  if (!amount) return "—";
  return `${amount.toLocaleString()} credits`;
}

export function canUserTrade(createdAtMs: number | null): boolean {
  if (!createdAtMs) return true;
  const cooldownMs = 7 * 24 * 60 * 60 * 1000;
  return Date.now() - createdAtMs >= cooldownMs;
}

export function tradeCooldownRemainingMs(createdAtMs: number | null): number {
  if (!createdAtMs) return 0;
  const cooldownMs = 7 * 24 * 60 * 60 * 1000;
  return Math.max(0, cooldownMs - (Date.now() - createdAtMs));
}

export function formatDuration(ms: number): string {
  const days = Math.floor(ms / (24 * 60 * 60 * 1000));
  const hours = Math.floor((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h`;
  const minutes = Math.ceil(ms / (60 * 1000));
  return `${minutes}m`;
}
