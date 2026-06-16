"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { InventoryItem } from "./types";

export function useInventory(uid: string | undefined) {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setInventory([]);
      setLoading(false);
      return;
    }

    const ref = collection(db, "users", uid, "inventory");
    const unsub = onSnapshot(
      ref,
      (snap) => {
        setInventory(snap.docs.map((d) => d.data() as InventoryItem));
        setLoading(false);
      },
      () => {
        setInventory([]);
        setLoading(false);
      }
    );

    return unsub;
  }, [uid]);

  return { inventory, loading };
}
