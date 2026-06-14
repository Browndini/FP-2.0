"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "./AuthProvider";

interface SignInButtonProps {
  size?: "default" | "sm" | "lg" | "xs" | "icon";
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
  className?: string;
}

export function SignInButton({ size = "default", variant = "default", className }: SignInButtonProps) {
  const { signIn } = useAuth();
  const [pending, setPending] = useState(false);

  async function handleSignIn() {
    setPending(true);
    try {
      await signIn();
    } finally {
      setPending(false);
    }
  }

  return (
    <Button
      onClick={handleSignIn}
      disabled={pending}
      size={size}
      variant={variant}
      className={className}
    >
      {pending ? "Signing in…" : "Sign in with Google"}
    </Button>
  );
}
