"use client";

import { useState } from "react";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase/client";
import { USERNAME_REGEX } from "@/lib/constants/game";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface UsernameSetupModalProps {
  onComplete: () => void;
}

export function UsernameSetupModal({ onComplete }: UsernameSetupModalProps) {
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const normalized = value.toLowerCase().trim();

    if (!USERNAME_REGEX.test(normalized)) {
      setError("3–20 characters: lowercase letters, numbers, and underscores only.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const call = httpsCallable(functions, "setUsername");
      await call({ username: normalized });
      onComplete();
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "message" in err
          ? String((err as { message?: string }).message)
          : "Failed to set username. Try again.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <Card className="w-full max-w-md rounded-2xl shadow-lg">
        <CardHeader>
          <CardTitle>Choose your username</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-muted-foreground">
            Your username appears on your public pet profile. You can only set it once.
          </p>
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value.toLowerCase())}
              placeholder="e.g. trainer_kyle"
              maxLength={20}
              autoFocus
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <p className="text-xs text-muted-foreground">
              3–20 characters · lowercase letters, numbers, underscores
            </p>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={saving || !value.trim()}>
              {saving ? "Saving…" : "Set username"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
