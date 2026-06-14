"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase/client";
import { ONBOARDING_CHOICES, type StarterSpeciesId } from "@/lib/constants/game";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SpeciesPicker } from "./SpeciesPicker";
import { cn } from "@/lib/utils";

type PlayStyle = (typeof ONBOARDING_CHOICES.playStyle)[number];
type FavoriteElement = (typeof ONBOARDING_CHOICES.favoriteElement)[number];
type Personality = (typeof ONBOARDING_CHOICES.personality)[number];

const PLAY_STYLE_OPTIONS: { value: PlayStyle; label: string; description: string }[] = [
  { value: "adventurer", label: "Adventurer", description: "Seek thrills and explore the unknown with energy and speed." },
  { value: "caretaker", label: "Caretaker", description: "Bond deeply and keep your companion healthy and happy." },
  { value: "competitor", label: "Competitor", description: "Train hard, fight smart, and dominate the leaderboard." },
];

const ELEMENT_OPTIONS: { value: FavoriteElement; label: string; emoji: string }[] = [
  { value: "fire", label: "Fire", emoji: "🔥" },
  { value: "water", label: "Water", emoji: "💧" },
  { value: "nature", label: "Nature", emoji: "🌿" },
  { value: "electric", label: "Electric", emoji: "⚡" },
  { value: "crystal", label: "Crystal", emoji: "💎" },
];

const PERSONALITY_OPTIONS: { value: Personality; label: string; description: string }[] = [
  { value: "bold", label: "Bold", description: "Strong and happy — charges in head-first." },
  { value: "calm", label: "Calm", description: "Healthy and defensive — steady under pressure." },
  { value: "curious", label: "Curious", description: "Smart and happy — always learning something new." },
];

const STEPS = ["Species", "Name", "Play style", "Element", "Personality"] as const;

export function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [speciesId, setSpeciesId] = useState<StarterSpeciesId | null>(null);
  const [petName, setPetName] = useState("");
  const [playStyle, setPlayStyle] = useState<PlayStyle | null>(null);
  const [favoriteElement, setFavoriteElement] = useState<FavoriteElement | null>(null);
  const [personality, setPersonality] = useState<Personality | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canAdvance = [
    !!speciesId,
    petName.trim().length >= 2,
    !!playStyle,
    !!favoriteElement,
    !!personality,
  ][step];

  async function handleCreate() {
    if (!speciesId || !petName.trim() || !playStyle || !favoriteElement || !personality) return;
    setCreating(true);
    setError(null);
    try {
      const createPet = httpsCallable(functions, "createStarterPet");
      await createPet({ speciesId, petName: petName.trim(), playStyle, favoriteElement, personality });
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
      setCreating(false);
    }
  }

  function next() {
    if (step < STEPS.length - 1) setStep((s) => s + 1);
    else handleCreate();
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <div
              className={cn(
                "flex size-7 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                i < step
                  ? "bg-primary text-primary-foreground"
                  : i === step
                  ? "bg-primary/20 text-primary"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {i < step ? "✓" : i + 1}
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn("h-px w-6 transition-colors", i < step ? "bg-primary" : "bg-border")} />
            )}
          </div>
        ))}
      </div>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>{STEPS[step]}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Step 0 — Species */}
          {step === 0 && (
            <SpeciesPicker value={speciesId} onChange={setSpeciesId} />
          )}

          {/* Step 1 — Name */}
          {step === 1 && (
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="pet-name">
                What&apos;s your pet&apos;s name?
              </label>
              <input
                id="pet-name"
                type="text"
                value={petName}
                onChange={(e) => setPetName(e.target.value)}
                maxLength={24}
                placeholder="Enter a name…"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <p className="text-xs text-muted-foreground">2–24 characters</p>
            </div>
          )}

          {/* Step 2 — Play style */}
          {step === 2 && (
            <div className="grid gap-3">
              {PLAY_STYLE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setPlayStyle(opt.value)}
                  className={cn(
                    "rounded-xl border-2 px-4 py-3 text-left transition-all",
                    playStyle === opt.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/40 hover:bg-muted/40"
                  )}
                >
                  <p className="font-semibold">{opt.label}</p>
                  <p className="text-sm text-muted-foreground">{opt.description}</p>
                </button>
              ))}
            </div>
          )}

          {/* Step 3 — Element */}
          {step === 3 && (
            <div className="flex flex-wrap gap-3">
              {ELEMENT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setFavoriteElement(opt.value)}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-xl border-2 px-5 py-4 transition-all",
                    favoriteElement === opt.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/40 hover:bg-muted/40"
                  )}
                >
                  <span className="text-2xl">{opt.emoji}</span>
                  <span className="text-sm font-medium">{opt.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* Step 4 — Personality */}
          {step === 4 && (
            <div className="grid gap-3">
              {PERSONALITY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setPersonality(opt.value)}
                  className={cn(
                    "rounded-xl border-2 px-4 py-3 text-left transition-all",
                    personality === opt.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/40 hover:bg-muted/40"
                  )}
                >
                  <p className="font-semibold">{opt.label}</p>
                  <p className="text-sm text-muted-foreground">{opt.description}</p>
                </button>
              ))}
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-between pt-2">
            <Button
              variant="outline"
              onClick={() => setStep((s) => s - 1)}
              disabled={step === 0 || creating}
            >
              Back
            </Button>
            <Button onClick={next} disabled={!canAdvance || creating}>
              {creating ? "Creating…" : step < STEPS.length - 1 ? "Next" : "Create my pet"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
