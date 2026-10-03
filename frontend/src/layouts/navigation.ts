export interface NavigationItem {
  id: string;
  title: string;
  shortCode: string;
  path: string;
  aliases?: string[];
  badge?: string;
  departmentKey: string;
}

export interface NavigationGroup {
  groupTitle: string;
  items: NavigationItem[];
}

export const NAVIGATION_GROUPS: NavigationGroup[] = [
  {
    groupTitle: "Workspace",
    items: [
      {
        id: "dashboard",
        title: "Operations Overview",
        shortCode: "OP",
        path: "/dashboard",
        departmentKey: "operations",
      },
    ],
  },
  {
    groupTitle: "Department Units",
    items: [
      {
        id: "marketing",
        title: "Marketing Work",
        shortCode: "MK",
        path: "/sample-requests",
        aliases: ["/marketing-work", "/sales"],
        departmentKey: "marketing",
      },
      {
        id: "creative",
        title: "Creative Work",
        shortCode: "CR",
        path: "/creative-work",
        aliases: ["/creative", "/artwork"],
        departmentKey: "creative",
      },
      {
        id: "studio",
        title: "Studio Work",
        shortCode: "ST",
        path: "/studio-work",
        aliases: ["/studio", "/cad", "/prepress"],
        departmentKey: "studio",
      },
      {
        id: "samp",
        title: "SAMP Team Work",
        shortCode: "SM",
        path: "/samp-team-work",
        aliases: ["/sampling", "/prototypes"],
        badge: "8",
        departmentKey: "samp",
      },
      {
        id: "costing",
        title: "Costing Team",
        shortCode: "CO",
        path: "/costing-team",
        aliases: ["/costing", "/costing-work", "/bom"],
        departmentKey: "costing",
      },
      {
        id: "plant",
        title: "Plant",
        shortCode: "PL",
        path: "/plant",
        aliases: ["/plant-execution", "/plant-work", "/plants"],
        departmentKey: "plant",
      },
      {
        id: "analytics",
        title: "Analytics & SLA",
        shortCode: "AN",
        path: "/analytics",
        departmentKey: "analytics",
      },
      {
        id: "members",
        title: "Members & Plants",
        shortCode: "MB",
        path: "/members",
        departmentKey: "members",
      },
    ],
  },
  {
    groupTitle: "System & Governance",
    items: [
      {
        id: "settings",
        title: "System Settings",
        shortCode: "CF",
        path: "/settings",
        departmentKey: "settings",
      },
      {
        id: "help",
        title: "Help & Support",
        shortCode: "HP",
        path: "/help",
        departmentKey: "help",
      },
    ],
  },
];

export const ALL_NAVIGATION_ITEMS = NAVIGATION_GROUPS.flatMap((group) => group.items);

export function getNavigationTitle(pathname: string): string {
  const normalizedPath = pathname.toLowerCase();
  const match = ALL_NAVIGATION_ITEMS.find((item) =>
    [item.path, ...(item.aliases ?? [])].some(
      (path) => normalizedPath === path || normalizedPath.startsWith(`${path}/`)
    )
  );
  return match?.title ?? "Operations Overview";
}

export function getNavigationPath(titleOrId: string): string {
  const match = ALL_NAVIGATION_ITEMS.find(
    (item) => item.title === titleOrId || item.id === titleOrId
  );
  return match?.path ?? "/dashboard";
}
