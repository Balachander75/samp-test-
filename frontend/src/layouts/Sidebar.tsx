import React, { useEffect, useState } from "react";
import { UserProfile } from "@/features/auth";
import { NAVIGATION_GROUPS, NavigationItem } from "./navigation";
import { X, LogOut } from "lucide-react";
import logoImg from "@/assets/logo.png";
import {
  fetchAllMarketingRequestsApi,
  fetchCreativeBriefsApi,
  fetchStudioDielinesApi,
  fetchCostingEstimationsApi,
} from "@/infrastructure/api";
import { useBusinessYear } from "@/context/BusinessYearContext";
import { getRequestTrackType } from "@/features/sample-requests/utils/trackTypes";

// Clean enterprise navigation buttons
const NavButton: React.FC<{ active: boolean; onClick: () => void; "aria-current"?: "page"; children: React.ReactNode }> = ({ active, onClick, children, ...rest }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group w-full flex items-center justify-between gap-2 h-[38px] px-3 rounded-[10px] cursor-pointer text-left transition-all duration-150 relative ${
        active
          ? "bg-emerald-50 text-[#006d32] border border-emerald-200/70 font-bold shadow-2xs"
          : "bg-transparent hover:bg-slate-100/70 text-slate-700 border border-transparent font-medium"
      }`}
      {...rest}
    >
      {active && (
        <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-[#006d32]" />
      )}
      {children}
    </button>
  );
};

const SubNavButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center justify-between gap-2 h-[30px] px-2.5 rounded-[8px] cursor-pointer text-left transition-all duration-150 ${
        active
          ? "bg-emerald-50/80 text-[#006d32] font-semibold"
          : "bg-transparent hover:bg-slate-100/60 text-slate-600 font-normal"
      }`}
    >
      {children}
    </button>
  );
};

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
  const { selectedYear } = useBusinessYear();
  const [dynamicBadges, setDynamicBadges] = useState<Record<string, number | string>>({});
  const [reloadTrigger, setReloadTrigger] = useState(0);

  // Live real-time sync with database events and window focus
  useEffect(() => {
    const handleRequestsChanged = () => {
      setReloadTrigger((prev) => prev + 1);
    };

    window.addEventListener("samp:requests-changed", handleRequestsChanged);
    window.addEventListener("focus", handleRequestsChanged);

    // Heartbeat sync every 25 seconds to ensure DB consistency without blocking UI
    const timer = setInterval(() => {
      setReloadTrigger((prev) => prev + 1);
    }, 25000);

    return () => {
      window.removeEventListener("samp:requests-changed", handleRequestsChanged);
      window.removeEventListener("focus", handleRequestsChanged);
      clearInterval(timer);
    };
  }, []);

  // Sync live operational counts directly from database (cached, zero impact on route changes)
  useEffect(() => {
    let isMounted = true;
    Promise.all([
      fetchAllMarketingRequestsApi(selectedYear).catch(() => []),
      fetchCreativeBriefsApi().catch(() => []),
      fetchStudioDielinesApi().catch(() => []),
      fetchCostingEstimationsApi().catch(() => []),
    ]).then(([requests, briefs, dielines, costings]) => {
      if (!isMounted) return;

      // 1. Commercial Sample Requests (Strict separation: Only marketing_request track)
      const sampleRequests = requests.filter((r) => {
        const track = getRequestTrackType(r);
        if (track !== "marketing_request") return false;
        const s = String(r.status || "").toLowerCase().trim();
        return !(
          s.includes("dispatch") ||
          s.includes("close") ||
          s.includes("complete") ||
          s.includes("deal") ||
          s.includes("actual")
        );
      });

      // 2. Feasibility Checks (Strict separation: Only feasibility_check track)
      const feasRequests = requests.filter((r) => {
        const track = getRequestTrackType(r);
        if (track !== "feasibility_check") return false;
        const s = String(r.status || "").toLowerCase().trim();
        return !(s.includes("close") || s.includes("reject") || s.includes("complete"));
      });

      // 3. Program Planning (Strict separation: Only program_planning track)
      const programRequests = requests.filter((r) => {
        const track = getRequestTrackType(r);
        if (track !== "program_planning") return false;
        const s = String(r.status || "").toLowerCase().trim();
        return !(s.includes("close") || s.includes("dispatch"));
      });

      const inSampling = requests.filter((r) => {
        const track = getRequestTrackType(r);
        if (track !== "marketing_request") return false;
        const s = String(r.status || "").toLowerCase().trim();
        return (
          s === "in_sampling" ||
          s === "sampling_completed" ||
          s.includes("sampling review") ||
          s.includes("in fabrication") ||
          s.includes("in sampling")
        );
      }).length;

      // Real live DB counts (no artificial hardcoded Math.max)
      const samplingCount = sampleRequests.length;
      const pendingFeasCount = feasRequests.length;
      const programCount = programRequests.length;
      const totalMarketingCount = samplingCount + pendingFeasCount + programCount;

      // SAMP Team workload breakdown:
      const sampFeasPending = feasRequests.filter((r) => !r.samplingFeasibilityResponse).length;
      const sampTotalActive = inSampling + sampFeasPending + programCount;

      // Creative & Studio workload breakdown:
      const nonProgramRequests = requests.filter(
        (r) =>
          r.requestKind !== "program" &&
          r.creationMode !== "program_planning" &&
          !String(r.srNumber || "").includes("-PG-") &&
          !String(r.materialCode || "").startsWith("PG-")
      );
      const creativeDesignCount = nonProgramRequests.filter((r) =>
        (r.requestTypes || []).includes("design") || String(r.status || "").toLowerCase().includes("creative")
      ).length + briefs.length;
      const creativeSamplingCount = nonProgramRequests.filter((r) =>
        (r.requestTypes || []).includes("sample") || (r.requestTypes || []).includes("mockup") || r.mockupRequired === "Yes"
      ).length;

      setDynamicBadges({
        marketing: totalMarketingCount,
        sampling: samplingCount,
        pendingFeas: pendingFeasCount,
        programs: programCount,
        creative: briefs.length + creativeDesignCount,
        creativeDesign: creativeDesignCount,
        creativeSampling: creativeSamplingCount,
        studio: dielines.length,
        studioArtwork: dielines.length,
        studioMockup: dielines.filter((d) => d.status === "3D Simulation" || d.status === "CAD Intake").length || dielines.length,
        studioSampling: dielines.filter((d) => d.status === "Laser Die Cleared" || d.status === "Plotter Sample Tested").length || dielines.length,
        samp: sampTotalActive,
        sampOverview: sampTotalActive,
        sampSampling: inSampling,
        sampFeasibility: sampFeasPending,
        sampPrograms: programCount,
        costing: costings.length,
        plant: programCount,
        plantPrograms: programCount,
      });
    });
    return () => { isMounted = false; };
  }, [selectedYear, reloadTrigger]);

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

  const initials = (user?.name || "U")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const roleLabel = user?.sub_role || user?.role || "Global Admin";

  const renderNavContent = (isDrawer = false) => (
    <div className="flex flex-col h-full select-none bg-white border-r border-slate-200">
      {/* ── Brand Header ── */}
      <div className="flex items-center justify-between shrink-0 h-14 px-4 bg-white border-b border-slate-200">
        <img
          src={logoImg}
          alt="Logo"
          className="h-7 w-auto max-w-[140px] object-contain object-left"
        />
        {isDrawer && onCloseMobile && (
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Close navigation"
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* ── Nav Scroll Area ── */}
      <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-200 dark:[&::-webkit-scrollbar-thumb]:bg-white/10 p-2.5">
        {NAVIGATION_GROUPS.map((group, gIdx) => (
          <div key={group.groupTitle} className={gIdx < NAVIGATION_GROUPS.length - 1 ? "mb-4" : ""}>
            {/* Group label */}
            <div className="px-2 mt-2 mb-1.5">
              <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400 dark:text-zinc-500 font-mono">
                {group.groupTitle}
              </span>
            </div>

            {/* Nav items */}
            <div className="flex flex-col gap-1">
              {group.items.map((item) => {
                const active = isItemActive(item);
                const badgeValue = dynamicBadges[item.id] !== undefined ? String(dynamicBadges[item.id]) : item.badge;
                const showBadge = badgeValue !== undefined && Number(badgeValue) > 0;

                return (
                  <div key={item.id}>
                    <NavButton active={active} onClick={() => handleItemClick(item)} aria-current={active ? "page" : undefined}>
                      <div className="flex items-center min-w-0 flex-1 overflow-hidden">
                        <span
                          className={`overflow-hidden text-ellipsis whitespace-nowrap text-[13px] tracking-tight transition-colors duration-150 ${
                            active ? "font-semibold text-slate-900 dark:text-white" : "font-medium text-slate-700 dark:text-zinc-300"
                          }`}
                        >
                          {item.title}
                        </span>
                      </div>
                      {showBadge && (
                        <span
                          className={`shrink-0 text-[10px] font-bold font-mono px-2 py-0.5 rounded-full ${
                            active
                              ? "bg-emerald-50 dark:bg-emerald-500/20 text-[#006d32] dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-500/40 dark:shadow-[0_0_8px_rgba(0,209,102,0.2)]"
                              : "bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-zinc-400 border border-slate-200/60 dark:border-white/[0.06]"
                          }`}
                        >
                          {badgeValue}
                        </span>
                      )}
                    </NavButton>

                    {/* Sub-items (when active) */}
                    {active && item.subItems && item.subItems.length > 0 && (
                      <div className="my-1 ml-3 pl-2.5 border-l-2 border-emerald-500/20 dark:border-emerald-500/40 flex flex-col gap-1">
                        {item.subItems.map((sub) => {
                          const isSubActive = selectedPath === sub.path || (sub.path !== item.path && selectedPath.startsWith(sub.path));
                          const subBadge = sub.badgeKey ? dynamicBadges[sub.badgeKey] : undefined;
                          return (
                            <SubNavButton
                              key={sub.id}
                              active={isSubActive}
                              onClick={() => { onSelectPath(sub.path); if (onCloseMobile) onCloseMobile(); }}
                            >
                              <div className="flex items-center min-w-0 flex-1 overflow-hidden">
                                <span className={`overflow-hidden text-ellipsis whitespace-nowrap text-xs ${isSubActive ? "font-semibold text-[#006d32] dark:text-emerald-400" : "font-normal text-slate-600 dark:text-zinc-400"}`}>
                                  {sub.title}
                                </span>
                              </div>
                              {subBadge !== undefined && Number(subBadge) > 0 && (
                                <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full shrink-0 ${isSubActive ? "bg-emerald-500/20 text-[#006d32] dark:text-emerald-300" : "bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-zinc-400"}`}>
                                  {subBadge}
                                </span>
                              )}
                            </SubNavButton>
                          );
                        })}
                      </div>
                    )}

                    {/* SubTeams (when active and no subItems) */}
                    {active && !item.subItems && item.subTeams && item.subTeams.length > 0 && (
                      <div className="my-1 ml-3 pl-2.5 border-l-2 border-emerald-500/20 dark:border-emerald-500/30 flex flex-col gap-1">
                        {item.subTeams.map((sub, sIdx) => (
                          <div key={sIdx} className="flex items-center h-7 px-2 rounded-md cursor-pointer text-xs text-slate-500 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100/60 dark:hover:bg-white/[0.04] transition-colors">
                            <span className="overflow-hidden text-ellipsis whitespace-nowrap">{sub}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* ── Bottom User Card ── */}
      <div className="p-2.5 border-t border-slate-200 bg-white shrink-0">
        <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 border border-slate-200/70">
          <div className="w-8 h-8 rounded-lg shrink-0 bg-gradient-to-tr from-[#006d32] to-[#00d166] flex items-center justify-center text-white font-bold text-xs shadow-xs font-display">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-900 overflow-hidden text-ellipsis whitespace-nowrap">
                {user?.name || "User"}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            </div>
            <span className="block text-[10px] text-slate-400 overflow-hidden text-ellipsis whitespace-nowrap font-mono">
              {roleLabel}
            </span>
          </div>
          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              title="Sign Out"
              aria-label="Sign out"
              className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
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
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col sticky top-0 h-screen shrink-0 z-30" style={{ width: 244 }}>
        {renderNavContent(false)}
      </aside>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-black/60" onClick={onCloseMobile} />
          <aside className="fixed inset-y-0 left-0 z-50 flex flex-col shadow-2xl" style={{ width: 244 }}>
            {renderNavContent(true)}
          </aside>
        </div>
      )}
    </>
  );
};
