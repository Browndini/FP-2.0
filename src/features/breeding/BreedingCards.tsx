"use client";

import { useCallback, useState } from "react";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase/client";
import type { PetWithId } from "@/features/pets/types";
import type { BreedingPairWithId } from "./types";
import { BREEDING_INFO, formatIncubationRemaining, speciesName } from "./formatBreeding";
import { Button } from "@/components/ui/button";

interface BreedingInviteCardProps {
  pair: BreedingPairWithId;
  currentUid: string;
  pets: PetWithId[];
  onAction?: () => void;
}

export function BreedingInviteCard({
  pair,
  currentUid,
  pets,
  onAction,
}: BreedingInviteCardProps) {
  const isPartner = pair.ownerBUid === currentUid;
  const [selectedPetId, setSelectedPetId] = useState("");
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const eligiblePets = pets.filter(
    (p) =>
      !p.inTradeId &&
      !p.activeBreedingPairId &&
      p.level >= BREEDING_INFO.minLevel
  );

  const run = useCallback(
    async (action: "accept" | "decline" | "cancel") => {
      setPending(action);
      setError(null);
      try {
        if (action === "cancel") {
          await httpsCallable(functions, "cancelBreeding")({ pairId: pair.id });
        } else {
          await httpsCallable(functions, "respondBreeding")({
            pairId: pair.id,
            accept: action === "accept",
            petId: action === "accept" ? selectedPetId : undefined,
          });
        }
        onAction?.();
      } catch (err: unknown) {
        const msg =
          err && typeof err === "object" && "message" in err
            ? String((err as { message?: string }).message)
            : "Action failed.";
        setError(msg);
      } finally {
        setPending(null);
      }
    },
    [pair.id, selectedPetId, onAction]
  );

  return (
    <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-medium">
          @{pair.ownerAUsername} invited @{pair.ownerBUsername}
        </p>
        <span className="text-xs capitalize text-muted-foreground">{pair.status}</span>
      </div>
      <p className="text-sm text-muted-foreground">
        Offering pet for breeding · fee {BREEDING_INFO.feeCredits} credits each on accept
      </p>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {isPartner ? (
        <div className="space-y-2">
          <label className="text-sm font-medium">Your pet to breed</label>
          <select
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            value={selectedPetId}
            onChange={(e) => setSelectedPetId(e.target.value)}
          >
            <option value="">Select a pet…</option>
            {eligiblePets.map((pet) => (
              <option key={pet.id} value={pet.id}>
                {pet.name} (Lv.{pet.level})
              </option>
            ))}
          </select>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              disabled={!selectedPetId || pending !== null}
              onClick={() => run("accept")}
            >
              {pending === "accept" ? "Accepting…" : "Accept & incubate"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={pending !== null}
              onClick={() => run("decline")}
            >
              Decline
            </Button>
          </div>
        </div>
      ) : (
        <Button
          size="sm"
          variant="outline"
          disabled={pending !== null}
          onClick={() => run("cancel")}
        >
          {pending === "cancel" ? "Cancelling…" : "Cancel invite"}
        </Button>
      )}
    </div>
  );
}

interface IncubatingCardProps {
  pair: BreedingPairWithId;
  alreadyHatched: boolean;
}

export function IncubatingCard({
  pair,
  alreadyHatched,
}: IncubatingCardProps) {
  const [petName, setPetName] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const hatchAtMs = pair.hatchAt?.toMillis() ?? 0;
  const ready = hatchAtMs > 0 && hatchAtMs <= Date.now();

  const handleHatch = async () => {
    setPending(true);
    setError(null);
    try {
      const response = await httpsCallable<
        { pairId: string; petName: string },
        { petId: string; rarity: string; speciesId: string }
      >(functions, "hatchEgg")({
        pairId: pair.id,
        petName: petName.trim(),
      });
      setResult(
        `Hatched ${speciesName(response.data.speciesId)} (${response.data.rarity})!`
      );
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "message" in err
          ? String((err as { message?: string }).message)
          : "Hatch failed.";
      setError(msg);
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-medium">
          Egg: @{pair.ownerAUsername} × @{pair.ownerBUsername}
        </p>
        {pair.offspringRarity && (
          <span className="text-xs capitalize text-primary">{pair.offspringRarity} roll</span>
        )}
      </div>
      {pair.offspringSpeciesId && (
        <p className="text-sm text-muted-foreground">
          Species: {speciesName(pair.offspringSpeciesId)}
        </p>
      )}
      <p className="text-sm">
        {ready ? "Incubation complete!" : formatIncubationRemaining(hatchAtMs)}
      </p>

      {result && <p className="text-sm text-primary">{result}</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}

      {ready && !alreadyHatched && !result && (
        <div className="flex flex-wrap items-end gap-2">
          <div className="space-y-1">
            <label className="text-xs font-medium" htmlFor={`hatch-name-${pair.id}`}>
              Name your new pet
            </label>
            <input
              id={`hatch-name-${pair.id}`}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
              placeholder="Pet name"
              value={petName}
              onChange={(e) => setPetName(e.target.value)}
            />
          </div>
          <Button
            size="sm"
            disabled={pending || petName.trim().length < 2}
            onClick={handleHatch}
          >
            {pending ? "Hatching…" : "Hatch egg"}
          </Button>
        </div>
      )}

      {alreadyHatched && !result && (
        <p className="text-sm text-muted-foreground">You already hatched your offspring.</p>
      )}
    </div>
  );
}
