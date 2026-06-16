"use client";

import { useCallback, useState } from "react";
import { httpsCallable } from "firebase/functions";
import { BREEDING_MAX_PETS } from "@/lib/constants/game";
import { functions } from "@/lib/firebase/client";
import type { PetWithId } from "@/features/pets/types";
import { BREEDING_INFO, petCanBreed } from "./formatBreeding";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CreateBreedingInviteProps {
  pets: PetWithId[];
  credits: number;
  onCreated?: () => void;
}

export function CreateBreedingInvite({
  pets,
  credits,
  onCreated,
}: CreateBreedingInviteProps) {
  const [partnerUsername, setPartnerUsername] = useState("");
  const [petId, setPetId] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const eligible = pets.filter((p) => petCanBreed(p).ok);

  const handleSubmit = useCallback(async () => {
    setPending(true);
    setError(null);
    setSuccess(null);
    try {
      await httpsCallable(functions, "initiateBreeding")({
        partnerUsername: partnerUsername.trim(),
        petId,
      });
      setSuccess(`Invite sent to @${partnerUsername.trim().toLowerCase()}.`);
      setPartnerUsername("");
      setPetId("");
      onCreated?.();
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "message" in err
          ? String((err as { message?: string }).message)
          : "Could not send invite.";
      setError(msg);
    } finally {
      setPending(false);
    }
  }, [partnerUsername, petId, onCreated]);

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="text-base">Invite partner to breed</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <p className="text-muted-foreground">
          Both pets must be level {BREEDING_INFO.minLevel}+. Each player pays{" "}
          {BREEDING_INFO.feeCredits} credits when the invite is accepted. Eggs incubate for{" "}
          {BREEDING_INFO.incubationHours} hours — each player hatches their own offspring.
        </p>
        <p className="text-muted-foreground">
          You have {pets.length}/{BREEDING_MAX_PETS} pets · {credits.toLocaleString()} credits
        </p>

        <div className="space-y-1">
          <label className="font-medium" htmlFor="breed-partner">
            Partner @username
          </label>
          <input
            id="breed-partner"
            className="w-full rounded-lg border border-border bg-background px-3 py-2"
            placeholder="username"
            value={partnerUsername}
            onChange={(e) => setPartnerUsername(e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <label className="font-medium" htmlFor="breed-pet">
            Your pet
          </label>
          <select
            id="breed-pet"
            className="w-full rounded-lg border border-border bg-background px-3 py-2"
            value={petId}
            onChange={(e) => setPetId(e.target.value)}
          >
            <option value="">Select a pet…</option>
            {pets.map((pet) => {
              const check = petCanBreed(pet);
              return (
                <option key={pet.id} value={pet.id} disabled={!check.ok}>
                  {pet.name} (Lv.{pet.level}){check.ok ? "" : ` — ${check.reason}`}
                </option>
              );
            })}
          </select>
        </div>

        {eligible.length === 0 && (
          <p className="text-amber-700">No pets eligible to breed right now.</p>
        )}

        {credits < BREEDING_INFO.feeCredits && (
          <p className="text-amber-700">
            You need at least {BREEDING_INFO.feeCredits} credits when the partner accepts.
          </p>
        )}

        {error && <p className="text-destructive">{error}</p>}
        {success && <p className="text-primary">{success}</p>}

        <Button
          disabled={pending || !partnerUsername.trim() || !petId}
          onClick={handleSubmit}
        >
          {pending ? "Sending…" : "Send breeding invite"}
        </Button>
      </CardContent>
    </Card>
  );
}
