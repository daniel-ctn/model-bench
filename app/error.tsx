"use client";

import { useEffect } from "react";
import { DatabaseZap, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/layout/page-header";

function looksLikeDbError(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("econnrefused") ||
    m.includes("connect") ||
    m.includes("database") ||
    m.includes("relation") ||
    m.includes("password") ||
    m.includes("getaddrinfo") ||
    m.includes("does not exist")
  );
}

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const isDb = looksLikeDbError(error.message);

  return (
    <PageContainer>
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-20 text-center">
        <span className="bg-destructive/10 text-destructive flex size-12 items-center justify-center rounded-xl">
          <DatabaseZap className="size-6" />
        </span>
        <div className="space-y-1.5">
          <h2 className="text-lg font-semibold">
            {isDb ? "Couldn’t reach the database" : "Something went wrong"}
          </h2>
          <p className="text-muted-foreground text-sm">
            {isDb ? (
              <>
                Set <code className="text-foreground">DATABASE_URL</code> in{" "}
                <code className="text-foreground">.env</code>, then run{" "}
                <code className="text-foreground">pnpm db:push</code> and{" "}
                <code className="text-foreground">pnpm db:seed</code>.
              </>
            ) : (
              "An unexpected error occurred while loading this page."
            )}
          </p>
        </div>
        <Button onClick={reset} variant="outline" size="sm">
          <RefreshCw />
          Try again
        </Button>
      </div>
    </PageContainer>
  );
}
