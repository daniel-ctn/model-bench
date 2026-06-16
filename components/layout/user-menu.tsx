"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronsUpDown, LogOut, UserRound } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { authClient } from "@/lib/auth-client";

function initials(name?: string | null, email?: string | null): string {
  const source = name?.trim() || email?.split("@")[0] || "?";
  const parts = source.split(/\s+/).filter(Boolean);
  const letters = parts.length > 1 ? parts[0][0] + parts[1][0] : source.slice(0, 2);
  return letters.toUpperCase();
}

export function UserMenu() {
  const { data } = authClient.useSession();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);
  const user = data?.user;

  const handleSignOut = async () => {
    setSigningOut(true);
    await authClient.signOut();
    toast.success("Signed out.");
    router.push("/login");
    router.refresh();
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton className="h-auto py-2 group-data-[collapsible=icon]:p-1.5" />
            }
          >
            <Avatar className="size-7 rounded-md">
              <AvatarFallback className="bg-primary/15 text-primary rounded-md text-xs font-medium">
                {initials(user?.name, user?.email)}
              </AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-col text-left leading-tight group-data-[collapsible=icon]:hidden">
              <span className="truncate text-sm font-medium">
                {user?.name ?? "Account"}
              </span>
              <span className="text-muted-foreground truncate text-xs">
                {user?.email ?? ""}
              </span>
            </div>
            <ChevronsUpDown className="text-muted-foreground ml-auto size-4 group-data-[collapsible=icon]:hidden" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="top"
            align="start"
            className="w-56"
          >
            <DropdownMenuLabel className="flex flex-col">
              <span className="font-medium">{user?.name ?? "Account"}</span>
              <span className="text-muted-foreground text-xs font-normal">
                {user?.email}
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem render={<Link href="/account" />}>
                <UserRound />
                Account
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              disabled={signingOut}
              onClick={handleSignOut}
            >
              <LogOut />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
