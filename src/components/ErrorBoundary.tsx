"use client";

import { Component, type ReactNode, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { trackError } from "@/lib/analytics";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, message: "" };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error) {
    trackError(error.message, "react.error_boundary");
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 p-8 text-center">
          <h2 className="text-lg font-semibold">Something went wrong</h2>
          <p className="max-w-md text-sm text-muted-foreground">{this.state.message}</p>
          <Button type="button" onClick={() => this.setState({ hasError: false, message: "" })}>
            Try again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

export function GlobalErrorListeners() {
  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      trackError(event.message ?? "Unknown error", "window.error");
    };
    const onRejection = (event: PromiseRejectionEvent) => {
      const msg =
        event.reason instanceof Error
          ? event.reason.message
          : String(event.reason ?? "Unhandled rejection");
      trackError(msg, "unhandledrejection");
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
}
