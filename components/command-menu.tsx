"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Boxes,
  FolderKanban,
  Lightbulb,
  Plus,
  Search,
  Wrench,
} from "lucide-react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { mainNav, utilityNav } from "@/lib/nav";

const quickActions = [
  { label: "New session", href: "/sessions/new", icon: Plus },
  { label: "New model", href: "/models/new", icon: Boxes },
  { label: "New tool", href: "/tools/new", icon: Wrench },
  { label: "New project", href: "/projects/new", icon: FolderKanban },
  { label: "New insight", href: "/insights/new", icon: Lightbulb },
];

/** Custom event other components dispatch to open the palette. */
export const OPEN_COMMAND_MENU = "open-command-menu";

export function CommandMenu() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    const onOpen = () => setOpen(true);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener(OPEN_COMMAND_MENU, onOpen);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener(OPEN_COMMAND_MENU, onOpen);
    };
  }, []);

  const go = (href: string) => {
    setOpen(false);
    setQuery("");
    router.push(href);
  };

  const trimmed = query.trim();

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="Command menu"
      description="Jump to a page or run an action"
    >
      <CommandInput
        placeholder="Search sessions or jump to a page…"
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {trimmed && (
          <>
            <CommandGroup heading="Search">
              <CommandItem
                value={`search ${trimmed}`}
                onSelect={() =>
                  go(`/sessions?q=${encodeURIComponent(trimmed)}`)
                }
              >
                <Search />
                Search sessions for “{trimmed}”
                <CommandShortcut>↵</CommandShortcut>
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        <CommandGroup heading="Quick actions">
          {quickActions.map((action) => (
            <CommandItem
              key={action.href}
              value={action.label}
              onSelect={() => go(action.href)}
            >
              <action.icon />
              {action.label}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Navigation">
          {[...mainNav, ...utilityNav].map((item) => (
            <CommandItem
              key={item.href}
              value={`go ${item.title}`}
              onSelect={() => go(item.href)}
            >
              <item.icon />
              {item.title}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
