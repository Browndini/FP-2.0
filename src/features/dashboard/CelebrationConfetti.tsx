"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import confetti from "canvas-confetti";

function fireCelebration() {
  const duration = 2800;
  const end = Date.now() + duration;

  const frame = () => {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.65 },
      colors: ["#f97316", "#eab308", "#a855f7", "#22c55e", "#0ea5e9"],
    });
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.65 },
      colors: ["#f97316", "#eab308", "#a855f7", "#22c55e", "#0ea5e9"],
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  };

  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    colors: ["#f97316", "#eab308", "#a855f7", "#22c55e", "#0ea5e9"],
  });
  frame();
}

export function CelebrationConfetti() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const hasFired = useRef(false);
  const celebrate = searchParams.get("celebrate") === "1";

  useEffect(() => {
    if (!celebrate || hasFired.current) return;
    hasFired.current = true;
    fireCelebration();
    const timer = window.setTimeout(() => {
      router.replace("/dashboard");
    }, 500);
    return () => window.clearTimeout(timer);
  }, [celebrate, router]);

  return null;
}
