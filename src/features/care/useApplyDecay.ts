"use client";

import { useEffect, useRef } from "react";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase/client";

export function useApplyDecay(petId: string | undefined) {
  const appliedForPet = useRef<string | null>(null);

  useEffect(() => {
    if (!petId || appliedForPet.current === petId) return;
    appliedForPet.current = petId;

    const sync = httpsCallable(functions, "syncPetDecay");
    sync({ petId }).catch((err) => {
      console.error("Failed to sync pet decay:", err);
      appliedForPet.current = null;
    });
  }, [petId]);
}
