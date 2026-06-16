"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AppHeaderProps {
  credits?: number;
  username?: string;
  profileHref?: string;
  onSignOut?: () => void;
}

const NAV = [
  { href: "/dashboard", label: "My pet" },
  { href: "/games", label: "Games" },
  { href: "/shop", label: "Shop" },
] as const;

export function AppHeader({
  credits,
  username,
  profileHref,
  onSignOut,
}: AppHeaderProps) {
  const pathname = usePathname();

  return (
    <header className="border-b border-border/60 bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-4">
          <Link
            href="/dashboard"
            className="text-xl font-bold tracking-tight text-primary"
          >
            Future Pets
          </Link>
          <nav className="flex items-center gap-1 rounded-lg bg-muted/50 p-1">
            {NAV.map(({ href, label }) => {
              const active =
                pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {username && profileHref && (
            <Link
              href={profileHref}
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              @{username}
            </Link>
          )}
          {credits !== undefined && (
            <span className="text-sm text-muted-foreground">
              {credits.toLocaleString()} credits
            </span>
          )}
          {onSignOut && (
            <Button variant="outline" size="sm" onClick={onSignOut}>
              Sign out
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

export function ShopLinkButton({
  className,
  size = "default",
}: {
  className?: string;
  size?: "default" | "sm" | "lg";
}) {
  return (
    <Link
      href="/shop"
      className={cn(buttonVariants({ size }), className)}
    >
      Browse shop
    </Link>
  );
}
