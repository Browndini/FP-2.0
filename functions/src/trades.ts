import { HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import {
  SHOP_ITEMS,
  TRADE_COOLDOWN_DAYS,
  TRADE_MAX_CREDITS,
  TRADE_MAX_ITEM_QUANTITY,
  type TradeItemLine,
} from "./constants";

const shopItemIds = new Set(SHOP_ITEMS.map((i) => i.id));

export function assertTradeCooldown(
  createdAt: admin.firestore.Timestamp | undefined
): void {
  if (!createdAt) return;
  const cooldownMs = TRADE_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
  if (Date.now() - createdAt.toMillis() < cooldownMs) {
    throw new HttpsError(
      "failed-precondition",
      `New accounts must wait ${TRADE_COOLDOWN_DAYS} days before trading.`
    );
  }
}

export function normalizeTradeItems(items: TradeItemLine[] | undefined): TradeItemLine[] {
  if (!items?.length) return [];

  const merged = new Map<string, number>();
  for (const line of items) {
    if (!line?.itemId || !shopItemIds.has(line.itemId as (typeof SHOP_ITEMS)[number]["id"])) {
      throw new HttpsError("invalid-argument", "Invalid shop item in trade.");
    }
    const qty = Number(line.quantity);
    if (!Number.isInteger(qty) || qty < 1 || qty > TRADE_MAX_ITEM_QUANTITY) {
      throw new HttpsError("invalid-argument", "Invalid item quantity.");
    }
    merged.set(line.itemId, (merged.get(line.itemId) ?? 0) + qty);
  }

  return Array.from(merged.entries()).map(([itemId, quantity]) => ({
    itemId,
    quantity,
  }));
}

export function assertCreditsAmount(amount: number, label: string): number {
  const value = Number(amount) || 0;
  if (!Number.isInteger(value) || value < 0 || value > TRADE_MAX_CREDITS) {
    throw new HttpsError("invalid-argument", `Invalid ${label} credits amount.`);
  }
  return value;
}

export function assertTradeHasValue(
  items: TradeItemLine[],
  credits: number,
  petId?: string | null
): void {
  if (items.length === 0 && credits === 0 && !petId) {
    throw new HttpsError(
      "invalid-argument",
      "Trade must include at least one item, credits, or pet."
    );
  }
}

export async function getInventoryQuantity(
  tx: admin.firestore.Transaction,
  uid: string,
  itemId: string
): Promise<number> {
  const snap = await tx.get(
    admin.firestore().doc(`users/${uid}/inventory/${itemId}`)
  );
  return snap.exists ? (snap.data()?.quantity ?? 0) : 0;
}

export function applyInventoryDelta(
  tx: admin.firestore.Transaction,
  ref: admin.firestore.DocumentReference,
  snap: admin.firestore.DocumentSnapshot,
  delta: number,
  now: admin.firestore.Timestamp
): void {
  const current = snap.exists ? (snap.data()?.quantity ?? 0) : 0;
  const next = current + delta;

  if (next < 0) {
    throw new HttpsError("failed-precondition", "Insufficient item quantity.");
  }

  if (next === 0) {
    if (snap.exists) tx.delete(ref);
    return;
  }

  if (snap.exists) {
    tx.update(ref, { quantity: next });
  } else {
    tx.set(ref, { itemId: ref.id, quantity: next, acquiredAt: now });
  }
}

export async function lockOfferedItems(
  tx: admin.firestore.Transaction,
  uid: string,
  items: TradeItemLine[],
  now: admin.firestore.Timestamp
): Promise<void> {
  for (const line of items) {
    const ref = admin.firestore().doc(`users/${uid}/inventory/${line.itemId}`);
    const snap = await tx.get(ref);
    const qty = snap.exists ? (snap.data()?.quantity ?? 0) : 0;
    if (qty < line.quantity) {
      throw new HttpsError(
        "failed-precondition",
        `Not enough ${line.itemId} in inventory.`
      );
    }
    applyInventoryDelta(tx, ref, snap, -line.quantity, now);
  }
}

export async function grantItems(
  tx: admin.firestore.Transaction,
  uid: string,
  items: TradeItemLine[],
  now: admin.firestore.Timestamp
): Promise<void> {
  for (const line of items) {
    const ref = admin.firestore().doc(`users/${uid}/inventory/${line.itemId}`);
    const snap = await tx.get(ref);
    applyInventoryDelta(tx, ref, snap, line.quantity, now);
  }
}

export async function assertPetAvailable(
  tx: admin.firestore.Transaction,
  uid: string,
  petId: string
): Promise<admin.firestore.DocumentSnapshot> {
  const ref = admin.firestore().doc(`users/${uid}/pets/${petId}`);
  const snap = await tx.get(ref);
  if (!snap.exists) {
    throw new HttpsError("not-found", "Pet not found.");
  }
  if (snap.data()?.inTradeId) {
    throw new HttpsError("failed-precondition", "Pet is already in an active trade.");
  }
  return snap;
}

export function markPetInTrade(
  tx: admin.firestore.Transaction,
  uid: string,
  petId: string,
  tradeId: string
): void {
  tx.update(admin.firestore().doc(`users/${uid}/pets/${petId}`), {
    inTradeId: tradeId,
  });
}

export function clearPetInTrade(
  tx: admin.firestore.Transaction,
  uid: string,
  petId: string
): void {
  tx.update(admin.firestore().doc(`users/${uid}/pets/${petId}`), {
    inTradeId: null,
  });
}

export function transferPet(
  tx: admin.firestore.Transaction,
  fromUid: string,
  toUid: string,
  petId: string,
  petSnap: admin.firestore.DocumentSnapshot
): void {
  const data = { ...petSnap.data(), inTradeId: null };
  tx.delete(admin.firestore().doc(`users/${fromUid}/pets/${petId}`));
  tx.set(admin.firestore().doc(`users/${toUid}/pets/${petId}`), data);
}

export function writeTradeHistory(
  tx: admin.firestore.Transaction,
  tradeId: string,
  uid: string,
  role: "sender" | "receiver",
  summary: Record<string, unknown>,
  now: admin.firestore.Timestamp
): void {
  const ref = admin.firestore().doc(`users/${uid}/tradeHistory/${tradeId}`);
  tx.set(ref, {
    tradeId,
    role,
    summary,
    recordedAt: now,
  });
}

export function isTradeExpired(
  expiresAt: admin.firestore.Timestamp,
  nowMs: number
): boolean {
  return expiresAt.toMillis() <= nowMs;
}
