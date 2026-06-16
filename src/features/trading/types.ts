import type { Timestamp } from "firebase/firestore";
import type { TradeItemLine, TradeStatus } from "@/lib/constants/game";

export interface TradeWithId {
  id: string;
  fromUid: string;
  fromUsername: string;
  toUid: string;
  toUsername: string;
  status: TradeStatus;
  offeredItems: TradeItemLine[];
  requestedItems: TradeItemLine[];
  offeredCredits: number;
  requestedCredits: number;
  offeredPetId?: string | null;
  requestedPetId?: string | null;
  createdAt: Timestamp;
  expiresAt: Timestamp;
  completedAt?: Timestamp | null;
  cancelledAt?: Timestamp | null;
  cancelledBy?: string | null;
}

export interface TradeHistoryEntry {
  tradeId: string;
  role: "sender" | "receiver";
  summary: {
    fromUsername: string;
    toUsername: string;
    offeredItems: TradeItemLine[];
    requestedItems: TradeItemLine[];
    offeredCredits: number;
    requestedCredits: number;
    offeredPetId?: string | null;
    requestedPetId?: string | null;
  };
  recordedAt: Timestamp;
}

export interface TradeHistoryEntryWithId extends TradeHistoryEntry {
  id: string;
}
