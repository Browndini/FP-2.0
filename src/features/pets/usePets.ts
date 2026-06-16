"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { PetWithId, PetDoc } from "./types";

export function usePets(uid: string | undefined) {
  const [pets, setPets] = useState<PetWithId[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setPets([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "users", uid, "pets"),
      orderBy("createdAt", "asc")
    );
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setPets(
          snap.docs.map((d) => ({ id: d.id, ...(d.data() as PetDoc) }))
        );
        setLoading(false);
      },
      () => {
        setPets([]);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [uid]);

  return { pets, loading };
}
