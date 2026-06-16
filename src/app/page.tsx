"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuthRedirect, SignInButton } from "@/features/auth";
import { cn } from "@/lib/utils";

const features = [
  {
    title: "Care & Stats",
    description:
      "Feed, play, and rest with your companion. Needs decay over time while mini-games and daily care keep them thriving.",
    badge: "Core loop",
  },
  {
    title: "Mini-Games",
    description:
      "Earn credits, train combat stats, and unlock features through a growing library of skill-based games.",
    badge: "Coming soon",
  },
  {
    title: "Breed & Trade",
    description:
      "Match pets to discover new genetics, visit other players, and trade cosmetics in a player-driven economy.",
    badge: "Coming soon",
  },
] as const;

export default function Home() {
  const router = useRouter();
  const { isReady, user, loading } = useAuthRedirect("public");

  if (!isReady) {
    return (
      <div className="flex min-h-full items-center justify-center">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-border/60 bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight text-primary">
              Future Pets
            </span>
            <Badge variant="secondary" className="text-xs">
              Alpha
            </Badge>
          </div>
          {!user && <SignInButton size="sm" variant="outline" />}
        </div>
      </header>

      <main className="flex-1">
        <section className="relative overflow-hidden border-b border-border/60">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_oklch(0.75_0.14_45_/_0.18),_transparent_55%)]" />
          <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-20 md:py-28">
            <div className="max-w-2xl space-y-6">
              <Badge className="w-fit bg-primary/10 text-primary hover:bg-primary/10">
                Neopets-inspired · Long-term progression
              </Badge>
              <h1 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
                Raise companions built for the long game
              </h1>
              <p className="text-lg leading-relaxed text-muted-foreground md:text-xl">
                Create your account, roll a starter with unique stats (maybe even
                a shiny), and build your pet over weeks and months — not minutes.
              </p>
              <div className="flex flex-wrap gap-3">
                {loading ? (
                  <Button disabled size="lg" className="rounded-full px-8">
                    Loading…
                  </Button>
                ) : user ? (
                  <Button
                    size="lg"
                    className="rounded-full px-8"
                    onClick={() => router.push("/dashboard")}
                  >
                    Go to dashboard
                  </Button>
                ) : (
                  <SignInButton size="lg" className="rounded-full px-8" />
                )}
                <a
                  href="#features"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "lg" }),
                    "rounded-full"
                  )}
                >
                  Explore features
                </a>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="mx-auto w-full max-w-6xl px-6 py-16 md:py-20">
          <div className="mb-10 max-w-2xl space-y-3">
            <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
              What you&apos;ll be able to do
            </h2>
            <p className="text-muted-foreground">
              Phase 2 is live — create your account, roll your first companion, and start caring for them.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {features.map((feature) => (
              <Card key={feature.title} className="rounded-2xl border-border/70">
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle>{feature.title}</CardTitle>
                    <Badge variant="outline">{feature.badge}</Badge>
                  </div>
                  <CardDescription className="text-base leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
                <CardContent />
              </Card>
            ))}
          </div>
        </section>

        <section className="border-t border-border/60 bg-muted/30">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-12 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Building in the open</h2>
              <p className="text-sm text-muted-foreground">
                Documentation lives in the repo for humans and AI agents alike.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 text-sm">
              <Link
                href="https://github.com"
                className="text-primary underline-offset-4 hover:underline"
              >
                GitHub (placeholder)
              </Link>
              <span className="text-muted-foreground">·</span>
              <span className="text-muted-foreground">See README.md in the repo root</span>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/60">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-6 py-8 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} Future Pets. All rights reserved.</p>
          <p>Teens &amp; adults · Cosmetic IAP planned · No pay-to-win</p>
        </div>
      </footer>
    </div>
  );
}
