import type { ElementType } from "react";
import {
  BarChart3,
  Briefcase,
  Camera,
  DollarSign,
  FileText,
  HelpCircle,
  Home,
  Palette,
  Settings,
  Users,
} from "@/components/ui/icons";

export interface NavigationItem {
  title: string;
  path: string;
  icon: ElementType;
  aliases?: string[];
  badge?: string;
  pulse?: boolean;
}

export const NAVIGATION_GROUPS: { groupTitle: string; items: NavigationItem[] }[] = [
  {
    groupTitle: "Workspace",
    items: [{ title: "Dashboard", path: "/dashboard", icon: Home }],
  },
  {
    groupTitle: "Department Units",
    items: [
      { title: "Marketing Work", path: "/sample-requests", aliases: ["/marketing-work", "/sample-requests", "/sales"], icon: FileText, pulse: true },
      { title: "Creative Work", path: "/creative-work", aliases: ["/overview"], icon: Palette },
      { title: "Studio Work", path: "/studio-work", aliases: ["/products"], icon: Camera },
      { title: "SAMP Team Work", path: "/samp-team-work", aliases: ["/tags"], icon: Briefcase },
      { title: "Costing Team", path: "/costing-team", aliases: ["/costing", "/costing-work"], icon: DollarSign },
      { title: "Analytics", path: "/analytics", icon: BarChart3 },
      { title: "Members", path: "/members", icon: Users, badge: "Staff" },
    ],
  },
  {
    groupTitle: "System & Tools",
    items: [
      { title: "Settings", path: "/settings", icon: Settings },
      { title: "Help & Support", path: "/help", icon: HelpCircle },
    ],
  },
];

const NAVIGATION_ITEMS = NAVIGATION_GROUPS.flatMap((group) => group.items);

export function getNavigationTitle(pathname: string): string {
  const normalizedPath = pathname.toLowerCase();
  const match = NAVIGATION_ITEMS.find((item) =>
    [item.path, ...(item.aliases ?? [])].some((path) =>
      normalizedPath === path || normalizedPath.startsWith(`${path}/`),
    ),
  );
  return match?.title ?? "Dashboard";
}

export function getNavigationPath(title: string): string {
  return NAVIGATION_ITEMS.find((item) => item.title === title)?.path ?? "/dashboard";
}
