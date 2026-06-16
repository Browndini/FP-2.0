"use client";

import { useEffect, useMemo, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { TradeHistoryEntryWithId, TradeWithId } from "./types";

export function useTrades(uid: string | undefined) {
  const [sent, setSent] = useState<TradeWithId[]>([]);
  const [received, setReceived] = useState<TradeWithId[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setSent([]);
      setReceived([]);
      setLoading(false);
      return;
    }

    const sentQuery = query(
      collection(db, "trades"),
      where("fromUid", "==", uid)
    );
    const receivedQuery = query(
      collection(db, "trades"),
      where("toUid", "==", uid)
    );

    let sentReady = false;
    let receivedReady = false;

    const maybeDone = () => {
      if (sentReady && receivedReady) setLoading(false);
    };

    const unsubSent = onSnapshot(sentQuery, (snap) => {
      setSent(
        snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<TradeWithId, "id">) }))
      );
      sentReady = true;
      maybeDone();
    });

    const unsubReceived = onSnapshot(receivedQuery, (snap) => {
      setReceived(
        snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<TradeWithId, "id">) }))
      );
      receivedReady = true;
      maybeDone();
    });

    return () => {
      unsubSent();
      unsubReceived();
    };
  }, [uid]);

  const all = useMemo(() => {
    const map = new Map<string, TradeWithId>();
    for (const trade of [...sent, ...received]) {
      map.set(trade.id, trade);
    }
    return Array.from(map.values()).sort(
      (a, b) => b.createdAt.toMillis() - a.createdAt.toMillis()
    );
  }, [sent, received]);

  const pendingIncoming = received.filter((t) => t.status === "pending");
  const pendingOutgoing = sent.filter((t) => t.status === "pending");
  const history = all.filter(
    (t) => t.status === "completed" || t.status === "cancelled"
  );

  return {
    all,
    pendingIncoming,
    pendingOutgoing,
    history,
    loading,
  };
}

export function useTradeHistory(uid: string | undefined) {
  const [entries, setEntries] = useState<TradeHistoryEntryWithId[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setEntries([]);
      setLoading(false);
      return;
    }

    const ref = collection(db, "users", uid, "tradeHistory");
    const unsub = onSnapshot(ref, (snap) => {
      setEntries(
        snap.docs
          .map((d) => ({ id: d.id, ...(d.data() as Omit<TradeHistoryEntryWithId, "id">) }))
          .sort((a, b) => b.recordedAt.toMillis() - a.recordedAt.toMillis())
      );
      setLoading(false);
    });

    return unsub;
  }, [uid]);

  return { entries, loading };
}
