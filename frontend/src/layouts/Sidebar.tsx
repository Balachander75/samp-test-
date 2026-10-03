import React, { useEffect, useState } from "react";
import { UserProfile } from "@/features/auth";
import {
  NAVIGATION_GROUPS,
  NavigationItem,
} from "./navigation";
import {
  BarChart3,
  Calculator,
  CircleHelp,
  ClipboardList,
  Factory,
  FlaskConical,
  LayoutDashboard,
  LogOut,
  Palette,
  Ruler,
  Settings,
  Users,
  X,
} from "lucide-react";
import logoImg from "@/assets/logo.png";
import {
  fetchAllMarketingRequestsApi,
  fetchCreativeBriefsApi,
  fetchStudioDielinesApi,
  fetchCostingEstimationsApi,
} from "@/features/sample-requests/api";
import { useBusinessYear } from "@/context/BusinessYearContext";

export interface SidebarProps {
  user?: UserProfile | null;
  onLogout?: () => void;
  selectedPath: string;
  onSelectPath: (path: string) => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

// Single brand cobalt accent for active state left-bar indicator (Anti-color-carnival)
const ACTIVE_ACCENT = "bg-brand-600 dark:bg-brand-500";

const NAV_ICONS = {
  dashboard: LayoutDashboard,
  marketing: ClipboardList,
  creative: Palette,
  studio: Ruler,
  samp: FlaskConical,
  costing: Calculator,
  plant: Factory,
  analytics: BarChart3,
  members: Users,
  settings: Settings,
  help: CircleHelp,
} as const;

export const Sidebar: React.FC<SidebarProps> = ({
  user,
  onLogout,
  selectedPath,
  onSelectPath,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const { selectedYear } = useBusinessYear();
  const [dynamicBadges, setDynamicBadges] = useState<Record<string, number | string>>({});

  // Sync live operational counts
  useEffect(() => {
    let isMounted = true;
    Promise.all([
      fetchAllMarketingRequestsApi(selectedYear).catch(() => []),
      fetchCreativeBriefsApi().catch(() => []),
      fetchStudioDielinesApi().catch(() => []),
      fetchCostingEstimationsApi().catch(() => []),
    ]).then(([requests, briefs, dielines, costings]) => {
      if (!isMounted) return;
      const activeMarketing = requests.filter((r) => {
        const s = String(r.status || "").toLowerCase().trim();
        return !(
          s.includes("dispatch") ||
          s.includes("close") ||
          s.includes("complete") ||
          s.includes("deal") ||
          s.includes("actual")
        );
      }).length;

      const inSampling = requests.filter(
        (r) =>
          r.status === "in_sampling" ||
          r.status === "sampling_completed" ||
          r.samplingFeasibilityResponse === "Yes" ||
          (Array.isArray(r.requestTypes) && r.requestTypes.includes("sample"))
      ).length;

      setDynamicBadges({
        marketing: activeMarketing,
        creative: briefs.length,
        studio: dielines.length,
        samp: inSampling,
        costing: costings.length,
      });
    });
    return () => { isMounted = false; };
  }, [selectedPath, selectedYear]);

  // Escape to close mobile
  useEffect(() => {
    if (!isMobileOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && onCloseMobile) onCloseMobile();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobileOpen, onCloseMobile]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = isMobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isMobileOpen]);

  const handleItemClick = (item: NavigationItem) => {
    onSelectPath(item.path);
    if (onCloseMobile) onCloseMobile();
  };

  const isItemActive = (item: NavigationItem) => {
    if (selectedPath === item.path) return true;
    if (selectedPath.startsWith(`${item.path}/`)) return true;
    if (
      item.aliases &&
      item.aliases.some(
        (alias) => selectedPath === alias || selectedPath.startsWith(`${alias}/`)
      )
    ) return true;
    return false;
  };

  // User initials (up to 2 chars)
  const initials = (user?.name || "U")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const roleLabel = user?.sub_role || user?.role || "Operator";

  const renderNavContent = (isDrawer = false) => (
    <div className="flex flex-col h-full select-none">

      {/* ── Brand Header ─────────────────────────────── */}
      <div className="flex items-center justify-between h-[58px] px-4 sm:px-5 shrink-0 border-b border-zinc-200 dark:border-white/[0.08]">
        <img
          src={logoImg}
          alt="Navneet"
          className="h-8 w-auto max-w-[148px] object-contain object-left"
        />
        {isDrawer && onCloseMobile && (
          <button
            type="button"
            onClick={onCloseMobile}
            className="h-7 w-7 rounded-md flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/[0.07] transition-colors cursor-pointer"
            aria-label="Close navigation"
          >
            <X className="w-[15px] h-[15px]" />
          </button>
        )}
      </div>

      {/* ── Navigation Groups ─────────────────────────── */}
      <div className="flex-1 overflow-y-auto py-3 space-y-5">
        {NAVIGATION_GROUPS.map((group, gIdx) => (
          <div key={group.groupTitle}>

            {/* Inter-group divider */}
            {gIdx > 0 && (
              <div className="mx-4 mb-3 h-px bg-zinc-200/80 dark:bg-white/[0.08]" />
            )}

            {/* Group label */}
            <div className="px-4 mb-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-zinc-500 dark:text-zinc-500">
                {group.groupTitle}
              </span>
            </div>

            {/* Nav items */}
            <div className="space-y-0.5 px-2">
              {group.items.map((item) => {
                const active = isItemActive(item);
                const badgeValue =
                  dynamicBadges[item.id] !== undefined
                    ? String(dynamicBadges[item.id])
                    : item.badge;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleItemClick(item)}
                    className={[
                      "group relative w-full flex items-center h-9 px-3 rounded-md text-[13px] transition-colors duration-150 cursor-pointer text-left gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500",
                      active
                        ? "bg-brand-600/10 dark:bg-brand-600/[0.14] text-brand-700 dark:text-brand-300 font-semibold"
                        : "text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 font-medium dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-white/[0.06]",
                    ].join(" ")}
                    aria-current={active ? "page" : undefined}
                  >
                    {/* Active accent bar */}
                    <span
                      className={[
                        "absolute left-0 inset-y-1.5 w-[3px] rounded-full transition-all duration-200",
                        active ? `${ACTIVE_ACCENT} opacity-100` : "opacity-0",
                      ].join(" ")}
                    />

                    {(() => {
                      const Icon = NAV_ICONS[item.id as keyof typeof NAV_ICONS] || ClipboardList;
                      return <Icon className={`w-4 h-4 shrink-0 ${active ? "text-brand-700 dark:text-brand-300" : "text-zinc-500 dark:text-zinc-500"}`} strokeWidth={1.8} aria-hidden="true" />;
                    })()}

                    {/* Title */}
                    <span className="flex-1 truncate">{item.title}</span>

                    {/* Badge */}
                    {badgeValue && (
                      <span
                        className={[
                          "shrink-0 text-[10px] font-mono font-bold px-1.5 py-px rounded-full tabular-nums",
                          active
                            ? "bg-brand-600/20 text-brand-700 dark:bg-brand-500/25 dark:text-brand-300"
                            : "bg-zinc-200/80 text-zinc-500 dark:bg-white/[0.08] dark:text-zinc-500",
                        ].join(" ")}
                      >
                        {badgeValue}
                      </span>
                    )}

                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* ── Bottom: Operator Identity Card ───────────── */}
      <div className="px-3 py-2.5 border-t border-zinc-200/60 dark:border-white/[0.06] shrink-0">
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-md hover:bg-zinc-50 dark:hover:bg-white/[0.03] transition-colors group">

          {/* Avatar with online pip */}
          <div className="relative shrink-0">
            <div className="w-8 h-8 rounded-md bg-brand-700 text-white font-semibold text-[12px] flex items-center justify-center">
              {initials}
            </div>
          </div>

          {/* Name + role */}
          <div className="flex-1 min-w-0">
            <span className="block text-[12px] font-semibold text-zinc-800 dark:text-zinc-100 truncate leading-tight">
              {user?.name || "Corporate User"}
            </span>
            <span className="block text-[11px] text-zinc-500 dark:text-zinc-400 truncate leading-tight">
              {roleLabel}
            </span>
          </div>

          {/* Sign out */}
          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              title="Sign Out"
              className="h-7 w-7 rounded-md flex items-center justify-center text-zinc-400 hover:text-rose-600 dark:text-zinc-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
              aria-label="Sign out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sticky Sidebar */}
      <aside className="hidden md:flex flex-col sticky top-0 h-screen shrink-0 border-r border-zinc-200 dark:border-white/[0.08] bg-[var(--bg-panel)] z-30 w-[240px]">
        {renderNavContent(false)}
      </aside>

      {/* Mobile Off-Canvas Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-smooth-backdrop"
            onClick={onCloseMobile}
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-[256px] bg-[var(--bg-panel)] border-r border-zinc-200/60 dark:border-white/[0.06] shadow-2xl flex flex-col animate-smooth-drawer">
            {renderNavContent(true)}
          </aside>
        </div>
      )}
    </>
  );
};
