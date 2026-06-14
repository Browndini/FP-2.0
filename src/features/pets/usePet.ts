"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, query, limit } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { PetWithId, PetDoc } from "./types";

export function usePet(uid: string | undefined) {
  const [pet, setPet] = useState<PetWithId | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setPet(null);
      setLoading(false);
      return;
    }

    const q = query(collection(db, "users", uid, "pets"), limit(1));
    const unsubscribe = onSnapshot(q, (snap) => {
      if (snap.empty) {
        setPet(null);
      } else {
        const docSnap = snap.docs[0];
        setPet({ id: docSnap.id, ...(docSnap.data() as PetDoc) });
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [uid]);

  return { pet, loading };
}
