import Link from "next/link";
import { Compass } from "lucide-react";

import { PageContainer } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <PageContainer>
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-24 text-center">
        <span className="bg-muted text-muted-foreground flex size-12 items-center justify-center rounded-xl">
          <Compass className="size-6" />
        </span>
        <div className="space-y-1.5">
          <h2 className="text-lg font-semibold">Page not found</h2>
          <p className="text-muted-foreground text-sm">
            That page doesn’t exist or may have been deleted.
          </p>
        </div>
        <Button render={<Link href="/" />}>Back to dashboard</Button>
      </div>
    </PageContainer>
  );
}
