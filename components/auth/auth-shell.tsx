import Link from "next/link";

import { Logo } from "@/components/brand/logo";
import { Card, CardContent } from "@/components/ui/card";

export function AuthShell({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <main className="flex min-h-svh items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <Link href="/" aria-label="ModelBench" className="inline-flex">
            <Logo animated />
          </Link>
          <div className="space-y-1">
            <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
            {description ? (
              <p className="text-muted-foreground text-sm">{description}</p>
            ) : null}
          </div>
        </div>
        <Card>
          <CardContent className="p-6">{children}</CardContent>
        </Card>
        {footer ? (
          <div className="text-muted-foreground mt-4 text-center text-sm">
            {footer}
          </div>
        ) : null}
      </div>
    </main>
  );
}
