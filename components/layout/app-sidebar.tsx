"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";

import { LogoMark } from "@/components/brand/logo-mark";
import { buttonVariants } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { isActive, mainNav, utilityNav } from "@/lib/nav";
import { cn } from "@/lib/utils";
import { UserMenu } from "./user-menu";

/** Branded active treatment: a primary accent rail + tinted icon. */
const activeItem =
  "relative before:absolute before:top-1.5 before:bottom-1.5 before:left-0 before:w-[3px] before:rounded-full before:bg-sidebar-primary before:content-[''] [&_svg]:text-sidebar-primary";

export function AppSidebar() {
  const pathname = usePathname();

  const groups: { label: string; items: typeof mainNav }[] = [
    { label: "Workspace", items: mainNav },
    { label: "Data", items: utilityNav },
  ];

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="pb-1">
        <Link
          href="/"
          className="flex items-center gap-2.5 px-1.5 py-1.5 group-data-[collapsible=icon]:justify-center"
        >
          <LogoMark variant="tile" animated title="ModelBench" className="size-8" />
          <span className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden">
            <span className="font-heading text-sm font-semibold tracking-tight">
              ModelBench
            </span>
            <span className="text-muted-foreground/80 eyebrow mt-0.5">
              Journal
            </span>
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {groups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className="eyebrow text-sidebar-foreground/55">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5">
                {group.items.map((item) => {
                  const active = isActive(item, pathname);
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        isActive={active}
                        tooltip={item.title}
                        className={cn(active && activeItem)}
                        render={<Link href={item.href} />}
                      >
                        <item.icon />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <Link
          href="/sessions/new"
          className={cn(
            buttonVariants({ size: "sm" }),
            "w-full group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:p-0",
          )}
        >
          <Plus />
          <span className="group-data-[collapsible=icon]:hidden">
            New session
          </span>
        </Link>
        <UserMenu />
      </SidebarFooter>
    </Sidebar>
  );
}
