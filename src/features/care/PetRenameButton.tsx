"use client";

import { useState } from "react";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase/client";
import { Button } from "@/components/ui/button";

interface PetRenameButtonProps {
  petId: string;
  currentName: string;
  freeRenameUsed?: boolean;
}

export function PetRenameButton({
  petId,
  currentName,
  freeRenameUsed,
}: PetRenameButtonProps) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(currentName);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (freeRenameUsed) {
    return null;
  }

  async function handleSave() {
    const trimmed = name.trim();
    if (trimmed.length < 2 || trimmed.length > 24) {
      setError("Name must be 2–24 characters.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const rename = httpsCallable(functions, "renamePet");
      await rename({ petId, name: trimmed });
      setEditing(false);
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message?: string }).message)
          : "Rename failed.";
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  if (!editing) {
    return (
      <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
        Rename (free)
      </Button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={24}
        className="rounded-lg border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
      />
      <Button size="sm" onClick={handleSave} disabled={saving}>
        {saving ? "Saving…" : "Save"}
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => {
          setEditing(false);
          setName(currentName);
          setError(null);
        }}
      >
        Cancel
      </Button>
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  );
}
