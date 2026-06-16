"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus, Search } from "lucide-react";

import { OPEN_COMMAND_MENU } from "@/components/command-menu";
import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { isActive, mainNav, utilityNav } from "@/lib/nav";
import { cn } from "@/lib/utils";

function sectionTitle(pathname: string): string {
  const item = [...mainNav, ...utilityNav].find((i) => isActive(i, pathname));
  return item?.title ?? "ModelBench";
}

export function AppTopbar() {
  const pathname = usePathname();
  const title = sectionTitle(pathname);

  const openCommandMenu = () =>
    window.dispatchEvent(new CustomEvent(OPEN_COMMAND_MENU));

  return (
    <header className="bg-background/80 sticky top-0 z-30 flex h-14 items-center gap-2 border-b px-3 backdrop-blur-md sm:px-4">
      <SidebarTrigger className="text-muted-foreground" />
      <Separator orientation="vertical" className="mr-1 !h-5" />
      <h1 className="text-sm font-semibold tracking-tight">{title}</h1>

      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          onClick={openCommandMenu}
          className="text-muted-foreground hover:bg-accent/60 hover:text-foreground border-border bg-muted/40 inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-sm transition-colors"
        >
          <Search className="size-4" />
          <span className="hidden sm:inline">Search…</span>
          <kbd className="bg-background text-muted-foreground pointer-events-none hidden h-5 items-center gap-0.5 rounded border px-1.5 font-mono text-[10px] font-medium sm:inline-flex">
            ⌘K
          </kbd>
        </button>

        <Link
          href="/sessions/new"
          className={cn(buttonVariants({ size: "sm" }), "gap-1.5")}
        >
          <Plus />
          <span className="hidden sm:inline">New session</span>
        </Link>
      </div>
    </header>
  );
}
