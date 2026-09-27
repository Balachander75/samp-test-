import React, { useEffect, useState } from "react";
import { UserProfile } from "@/features/auth";
import {
  NAVIGATION_GROUPS,
  NavigationItem,
} from "./navigation";
import {
  LogOut,
  X,
  ShieldCheck,
} from "lucide-react";
import logoImg from "@/assets/logo.png";
import {
  fetchSampleRequestsApi,
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

export const Sidebar: React.FC<SidebarProps> = ({
  user,
  onLogout,
  selectedPath,
  onSelectPath,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const [dynamicBadges, setDynamicBadges] = useState<Record<string, number | string>>({});

  // Sync live operational counts for badges across all active department desks
  useEffect(() => {
    let isMounted = true;
    Promise.all([
      fetchSampleRequestsApi().catch(() => []),
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
    return () => {
      isMounted = false;
    };
  }, [selectedPath]);

  // Close on Escape
  useEffect(() => {
    if (!isMobileOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && onCloseMobile) onCloseMobile();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobileOpen, onCloseMobile]);

  // Lock body scroll when open
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

  const renderNavContent = (isDrawer = false) => (
    <div className="flex flex-col h-full select-none">
      {/* Brand Header */}
      <div className="flex items-center justify-between h-14 px-4 sm:px-5 border-b border-zinc-200/80 dark:border-white/[0.07] shrink-0">
        <img
          src={logoImg}
          alt="Navneet"
          className="h-8 sm:h-9 w-auto max-w-[145px] object-contain object-left"
        />
        {isDrawer && onCloseMobile && (
          <button
            type="button"
            onClick={onCloseMobile}
            className="h-8 w-8 rounded-md flex items-center justify-center text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 dark:hover:text-zinc-200 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            aria-label="Close navigation"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 overflow-y-auto py-3 space-y-5">
        {NAVIGATION_GROUPS.map((group, gIdx) => (
          <div key={group.groupTitle}>
            {/* Group separator line for non-first groups */}
            {gIdx > 0 && (
              <div className="mx-4 mb-3 h-px bg-zinc-100 dark:bg-white/[0.05]" />
            )}

            <div className="px-4 mb-1">
              <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-zinc-400 dark:text-zinc-600 font-mono">
                {group.groupTitle}
              </span>
            </div>

            <div className="space-y-px px-2">
              {group.items.map((item) => {
                const active = isItemActive(item);

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleItemClick(item)}
                    className={[
                      "relative w-full flex items-center justify-between h-9 px-3.5 rounded-md text-[13px] transition-colors duration-150 ease-out cursor-pointer text-left",
                      active
                        ? "bg-brand-600 text-white font-semibold shadow-xs"
                        : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 font-medium dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-white/[0.05]",
                    ].join(" ")}
                  >
                    <span className="truncate tracking-tight">{item.title}</span>

                    {(() => {
                      const badgeValue = dynamicBadges[item.id] !== undefined ? String(dynamicBadges[item.id]) : item.badge;
                      if (!badgeValue) return null;
                      return (
                        <span
                          className={[
                            "text-[10px] font-mono px-1.5 py-0.5 rounded-full ml-2 shrink-0 tabular-nums font-bold",
                            active
                              ? "bg-white/20 text-white"
                              : "bg-zinc-200/70 text-zinc-600 dark:bg-white/[0.08] dark:text-zinc-400",
                          ].join(" ")}
                        >
                          {badgeValue}
                        </span>
                      );
                    })()}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom: Operator Identity Card */}
      <div className="p-2 border-t border-zinc-200/80 dark:border-white/[0.08] shrink-0">
        <div className="flex items-center justify-between gap-2 px-2 py-2 rounded hover:bg-zinc-50 dark:hover:bg-white/[0.03] transition-colors">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative shrink-0">
              <div className="w-7 h-7 rounded-md bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 font-bold text-[11px] flex items-center justify-center font-mono">
                {(user?.name || "A").charAt(0).toUpperCase()}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#0f1118]" />
            </div>

            <div className="min-w-0">
              <span className="block text-[12px] font-semibold text-zinc-900 dark:text-zinc-100 truncate leading-tight">
                {user?.name || "Corporate User"}
              </span>
              <span className="flex items-center gap-1 text-[10px] font-mono text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                <ShieldCheck className="w-2.5 h-2.5 text-brand-600 dark:text-brand-400 shrink-0" />
                <span className="truncate">{user?.sub_role || user?.role || "Operator"}</span>
              </span>
            </div>
          </div>

          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              title="Sign Out"
              className="h-7.5 w-7.5 rounded-md flex items-center justify-center text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer shrink-0"
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
      <aside className="hidden md:flex flex-col sticky top-0 h-screen shrink-0 border-r border-zinc-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0f1118] z-30 w-[232px]">
        {renderNavContent(false)}
      </aside>

      {/* Mobile Off-Canvas Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={onCloseMobile}
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-[260px] bg-white dark:bg-[#0f1118] border-r border-zinc-200/80 dark:border-white/[0.08] shadow-2xl flex flex-col">
            {renderNavContent(true)}
          </aside>
        </div>
      )}
    </>
  );
};
