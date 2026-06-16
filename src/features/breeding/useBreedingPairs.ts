"use client";

import { useEffect, useMemo, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { BreedingPairWithId } from "./types";

export function useBreedingPairs(uid: string | undefined) {
  const [asOwnerA, setAsOwnerA] = useState<BreedingPairWithId[]>([]);
  const [asOwnerB, setAsOwnerB] = useState<BreedingPairWithId[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setAsOwnerA([]);
      setAsOwnerB([]);
      setLoading(false);
      return;
    }

    const qA = query(collection(db, "breedingPairs"), where("ownerAUid", "==", uid));
    const qB = query(collection(db, "breedingPairs"), where("ownerBUid", "==", uid));

    let readyA = false;
    let readyB = false;
    const maybeDone = () => {
      if (readyA && readyB) setLoading(false);
    };

    const unsubA = onSnapshot(qA, (snap) => {
      setAsOwnerA(
        snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<BreedingPairWithId, "id">),
        }))
      );
      readyA = true;
      maybeDone();
    });

    const unsubB = onSnapshot(qB, (snap) => {
      setAsOwnerB(
        snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<BreedingPairWithId, "id">),
        }))
      );
      readyB = true;
      maybeDone();
    });

    return () => {
      unsubA();
      unsubB();
    };
  }, [uid]);

  const all = useMemo(() => {
    const map = new Map<string, BreedingPairWithId>();
    for (const pair of [...asOwnerA, ...asOwnerB]) {
      map.set(pair.id, pair);
    }
    return Array.from(map.values()).sort(
      (a, b) => b.createdAt.toMillis() - a.createdAt.toMillis()
    );
  }, [asOwnerA, asOwnerB]);

  const pendingIncoming = asOwnerB.filter((p) => p.status === "pending");
  const pendingOutgoing = asOwnerA.filter((p) => p.status === "pending");
  const incubating = all.filter((p) => p.status === "incubating");
  const completed = all.filter((p) => p.status === "hatched");

  return {
    all,
    pendingIncoming,
    pendingOutgoing,
    incubating,
    completed,
    loading,
  };
}
