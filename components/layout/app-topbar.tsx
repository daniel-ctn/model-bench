"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Gauge, Plus, Search } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { OPEN_COMMAND_MENU } from "@/components/command-menu";
import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { isActive, mainNav, utilityNav } from "@/lib/nav";
import { cn } from "@/lib/utils";

/** Human labels for known leaf routes, used as the trailing breadcrumb. */
const SUBPAGE_LABELS: Record<string, string> = {
  new: "New",
  edit: "Edit",
  compare: "Compare",
};

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

type Context = {
  title: string;
  href: string;
  icon: LucideIcon;
  sub: string | null;
};

function resolveContext(pathname: string): Context {
  const segments = pathname.split("/").filter(Boolean);
  const section = [...mainNav, ...utilityNav].find((i) => isActive(i, pathname));

  const title = section?.title ?? (segments[0] ? capitalize(segments[0]) : "ModelBench");
  const href = section?.href ?? (segments[0] ? `/${segments[0]}` : "/");
  const icon = section?.icon ?? Gauge;

  const last = segments[segments.length - 1];
  const sub =
    section && pathname !== section.href && last
      ? (SUBPAGE_LABELS[last] ?? null)
      : null;

  return { title, href, icon, sub };
}

export function AppTopbar() {
  const pathname = usePathname();
  const ctx = resolveContext(pathname);
  const Icon = ctx.icon;

  const openCommandMenu = () =>
    window.dispatchEvent(new CustomEvent(OPEN_COMMAND_MENU));

  return (
    <header className="bg-background/80 sticky top-0 z-30 flex h-14 items-center gap-3 border-b px-3 backdrop-blur-md sm:px-4">
      <SidebarTrigger className="text-muted-foreground" />
      <Separator orientation="vertical" className="!h-5" />

      <nav
        aria-label="Breadcrumb"
        className="flex min-w-0 items-center gap-2.5"
      >
        <span className="bg-primary/10 text-primary hidden size-7 shrink-0 items-center justify-center rounded-lg sm:flex">
          <Icon className="size-4" />
        </span>
        <div className="flex min-w-0 items-center gap-1.5">
          {ctx.sub ? (
            <Link
              href={ctx.href}
              className="text-muted-foreground hover:text-foreground truncate text-sm font-medium transition-colors"
            >
              {ctx.title}
            </Link>
          ) : (
            <span className="font-heading truncate text-sm font-semibold tracking-tight">
              {ctx.title}
            </span>
          )}
          {ctx.sub ? (
            <>
              <ChevronRight className="text-muted-foreground/40 size-3.5 shrink-0" />
              <span className="font-heading truncate text-sm font-semibold tracking-tight">
                {ctx.sub}
              </span>
            </>
          ) : null}
        </div>
      </nav>

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
