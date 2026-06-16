import { CommandMenu } from "@/components/command-menu";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

import { AppSidebar } from "./app-sidebar";
import { AppTopbar } from "./app-topbar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="min-w-0">
        <AppTopbar />
        <div className="scrollbar-thin flex-1">{children}</div>
      </SidebarInset>
      <CommandMenu />
    </SidebarProvider>
  );
}
