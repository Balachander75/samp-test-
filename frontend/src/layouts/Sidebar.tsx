import React, { useEffect, useState } from "react";
import { UserProfile } from "@/features/auth";
import {
  NAVIGATION_GROUPS,
  NavigationItem,
} from "./navigation";
import {
  LogOut,
  X,
  ChevronRight,
} from "lucide-react";
import logoImg from "@/assets/logo.png";
import {
  fetchAllMarketingRequestsApi,
  fetchCreativeBriefsApi,
  fetchStudioDielinesApi,
  fetchCostingEstimationsApi,
} from "@/features/sample-requests/api";

export interface SidebarProps {
  user?: UserProfile | null;
  onLogout?: () => void;
  selectedPath: string;
  onSelectPath: (path: string) => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

// Dept color accents for active state left-bar indicator
const DEPT_ACCENT: Record<string, string> = {
  operations: "bg-brand-600",
  marketing:  "bg-violet-500",
  creative:   "bg-pink-500",
  studio:     "bg-cyan-500",
  samp:       "bg-amber-500",
  costing:    "bg-emerald-500",
  plant:      "bg-orange-500",
  analytics:  "bg-indigo-500",
  members:    "bg-teal-500",
  settings:   "bg-zinc-400",
  help:       "bg-zinc-400",
};

export const Sidebar: React.FC<SidebarProps> = ({
  user,
  onLogout,
  selectedPath,
  onSelectPath,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const [dynamicBadges, setDynamicBadges] = useState<Record<string, number | string>>({});

  // Sync live operational counts
  useEffect(() => {
    let isMounted = true;
    Promise.all([
      fetchAllMarketingRequestsApi().catch(() => []),
      fetchCreativeBriefsApi().catch(() => []),
      fetchStudioDielinesApi().catch(() => []),
      fetchCostingEstimationsApi().catch(() => []),
    ]).then(([requests, briefs, dielines, costings]) => {
      if (!isMounted) return;
      const total = requests.length;
      const inSampling = requests.filter(
        (r) =>
          r.status === "in_sampling" ||
          r.status === "sampling_completed" ||
          r.samplingFeasibilityResponse === "Yes" ||
          (Array.isArray(r.requestTypes) && r.requestTypes.includes("sample"))
      ).length;
      setDynamicBadges({
        marketing: total,
        creative: briefs.length,
        studio: dielines.length,
        samp: inSampling,
        costing: costings.length,
      });
    });
    return () => { isMounted = false; };
  }, [selectedPath]);

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
      <div className="flex items-center justify-between h-14 px-4 sm:px-5 shrink-0 border-b border-zinc-200/60 dark:border-white/[0.06]">
        <img
          src={logoImg}
          alt="Navneet"
          className="h-8 w-auto max-w-[140px] object-contain object-left"
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
      <div className="flex-1 overflow-y-auto py-2.5 space-y-4">
        {NAVIGATION_GROUPS.map((group, gIdx) => (
          <div key={group.groupTitle}>

            {/* Inter-group divider */}
            {gIdx > 0 && (
              <div className="mx-4 mb-3 h-px bg-zinc-100 dark:bg-white/[0.04]" />
            )}

            {/* Group label */}
            <div className="px-4 mb-1.5">
              <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-zinc-400/80 dark:text-zinc-600">
                {group.groupTitle}
              </span>
            </div>

            {/* Nav items */}
            <div className="space-y-px px-2">
              {group.items.map((item) => {
                const active = isItemActive(item);
                const accentColor = DEPT_ACCENT[item.departmentKey] || "bg-brand-600";
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
                      "group relative w-full flex items-center h-9 px-3.5 rounded-md text-[13px] transition-all duration-150 ease-out cursor-pointer text-left gap-2",
                      active
                        ? "bg-brand-600/10 dark:bg-brand-600/[0.14] text-brand-700 dark:text-brand-300 font-semibold"
                        : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100/80 font-medium dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-white/[0.05]",
                    ].join(" ")}
                  >
                    {/* Active accent bar */}
                    <span
                      className={[
                        "absolute left-0 inset-y-1.5 w-[3px] rounded-full transition-all duration-200",
                        active ? `${accentColor} opacity-100` : "opacity-0",
                      ].join(" ")}
                    />

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

                    {/* Subtle chevron on hover (inactive only) */}
                    {!active && (
                      <ChevronRight className="w-3 h-3 shrink-0 opacity-0 group-hover:opacity-40 transition-opacity" />
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
            <div className="w-8 h-8 rounded-md bg-gradient-to-br from-zinc-800 to-zinc-900 dark:from-zinc-200 dark:to-white text-white dark:text-zinc-900 font-bold text-[11px] flex items-center justify-center font-mono shadow-xs">
              {initials}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-500 ring-[1.5px] ring-white dark:ring-[#0f1118]" />
          </div>

          {/* Name + role */}
          <div className="flex-1 min-w-0">
            <span className="block text-[12px] font-semibold text-zinc-800 dark:text-zinc-100 truncate leading-tight">
              {user?.name || "Corporate User"}
            </span>
            <span className="block text-[10px] text-zinc-400 dark:text-zinc-500 truncate leading-tight font-mono tracking-wide uppercase">
              {roleLabel}
            </span>
          </div>

          {/* Sign out */}
          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              title="Sign Out"
              className="h-7 w-7 rounded-md flex items-center justify-center text-zinc-300 hover:text-rose-500 dark:text-zinc-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer shrink-0 opacity-0 group-hover:opacity-100"
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
      <aside className="hidden md:flex flex-col sticky top-0 h-screen shrink-0 border-r border-zinc-200/60 dark:border-white/[0.06] bg-white dark:bg-[#0c0d12] z-30 w-[228px]">
        {renderNavContent(false)}
      </aside>

      {/* Mobile Off-Canvas Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-smooth-backdrop"
            onClick={onCloseMobile}
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-[256px] bg-white dark:bg-[#0c0d12] border-r border-zinc-200/60 dark:border-white/[0.06] shadow-2xl flex flex-col animate-smooth-drawer">
            {renderNavContent(true)}
          </aside>
        </div>
      )}
    </>
  );
};
