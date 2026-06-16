import {
  BarChart3,
  Boxes,
  Database,
  FolderKanban,
  LayoutDashboard,
  Lightbulb,
  NotebookPen,
  Wrench,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  /** Marks the section so deep routes (e.g. /sessions/new) highlight correctly. */
  match?: (pathname: string) => boolean;
};

export const mainNav: NavItem[] = [
  { title: "Dashboard", href: "/", icon: LayoutDashboard },
  {
    title: "Sessions",
    href: "/sessions",
    icon: NotebookPen,
    match: (p) => p.startsWith("/sessions"),
  },
  {
    title: "Models",
    href: "/models",
    icon: Boxes,
    match: (p) => p.startsWith("/models"),
  },
  {
    title: "Tools",
    href: "/tools",
    icon: Wrench,
    match: (p) => p.startsWith("/tools"),
  },
  {
    title: "Projects",
    href: "/projects",
    icon: FolderKanban,
    match: (p) => p.startsWith("/projects"),
  },
  {
    title: "Insights",
    href: "/insights",
    icon: Lightbulb,
    match: (p) => p.startsWith("/insights"),
  },
  {
    title: "Reports",
    href: "/reports",
    icon: BarChart3,
    match: (p) => p.startsWith("/reports"),
  },
];

export const utilityNav: NavItem[] = [
  {
    title: "Data & backup",
    href: "/data",
    icon: Database,
    match: (p) => p.startsWith("/data"),
  },
];

export function isActive(item: NavItem, pathname: string): boolean {
  if (item.match) return item.match(pathname);
  return pathname === item.href;
}
