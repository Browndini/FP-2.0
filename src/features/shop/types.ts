import type { Timestamp } from "firebase/firestore";

export interface InventoryItem {
  itemId: string;
  quantity: number;
  acquiredAt: Timestamp;
}
