import React, { useEffect, useState } from "react";
import { UserProfile } from "@/features/auth";
import { NAVIGATION_GROUPS, NavigationItem } from "./navigation";
import {
  X, LogOut,
  LayoutDashboard, Megaphone, Palette, Layers, FlaskConical,
  Calculator, Factory, BarChart3, Users, Settings, HelpCircle,
} from "lucide-react";
import logoImg from "@/assets/logo.png";
import {
  fetchAllMarketingRequestsApi,
  fetchCreativeBriefsApi,
  fetchStudioDielinesApi,
  fetchCostingEstimationsApi,
} from "@/infrastructure/api";
import { useBusinessYear } from "@/context/BusinessYearContext";
import { getRequestTrackType } from "@/features/sample-requests/utils/trackTypes";

const NAV_ICONS: Record<string, React.FC<{ style?: React.CSSProperties }>> = {
  dashboard: LayoutDashboard,
  marketing: Megaphone,
  creative: Palette,
  studio: Layers,
  samp: FlaskConical,
  costing: Calculator,
  plant: Factory,
  analytics: BarChart3,
  members: Users,
  settings: Settings,
  help: HelpCircle,
};

// Inline-hover buttons (avoids Tailwind group/peer for active state conflicts)
const NavButton: React.FC<{ active: boolean; onClick: () => void; "aria-current"?: "page"; children: React.ReactNode }> = ({ active, onClick, children, ...rest }) => {
  const [hovered, setHovered] = React.useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
        height: 38, padding: "0 10px", borderRadius: 10, border: "none", cursor: "pointer", textAlign: "left",
        transition: "background 0.13s, box-shadow 0.13s",
        background: active ? "#fff" : hovered ? "rgba(0,0,0,0.04)" : "transparent",
        boxShadow: active ? "0 1px 5px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.05)" : "none",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      {...rest}
    >
      {children}
    </button>
  );
};

const SubNavButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => {
  const [hovered, setHovered] = React.useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
        height: 30, padding: "0 8px", borderRadius: 7, border: "none", cursor: "pointer", textAlign: "left",
        transition: "background 0.12s",
        background: active ? "rgba(0,209,102,0.1)" : hovered ? "rgba(0,0,0,0.03)" : "transparent",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
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
      const creativeDesignCount = requests.filter((r) =>
        (r.requestTypes || []).includes("design") || String(r.status || "").toLowerCase().includes("creative")
      ).length + briefs.length;
      const creativeSamplingCount = requests.filter((r) =>
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
        samp: sampTotalActive,
        sampOverview: sampTotalActive,
        sampSampling: inSampling,
        sampFeasibility: sampFeasPending,
        sampPrograms: programCount,
        costing: costings.length,
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
    <div
      className="flex flex-col h-full select-none"
      style={{ background: "#f5f7fc", borderRight: "1px solid rgba(0,0,0,0.07)" }}
    >

      {/* ── Brand Header ── */}
      <div
        className="flex items-center justify-between shrink-0"
        style={{ height: 56, padding: "0 18px", background: "#fff", borderBottom: "1px solid rgba(0,0,0,0.06)" }}
      >
        <img
          src={logoImg}
          alt="Logo"
          style={{ height: 27, width: "auto", maxWidth: 140, objectFit: "contain", objectPosition: "left" }}
        />
        {isDrawer && onCloseMobile && (
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Close navigation"
            style={{ width: 28, height: 28, borderRadius: 8, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", color: "#94a3b8" }}
            className="hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <X style={{ width: 14, height: 14 }} />
          </button>
        )}
      </div>

      {/* ── Nav Scroll Area ── */}
      <div
        className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-200"
        style={{ padding: "10px 8px" }}
      >
        {NAVIGATION_GROUPS.map((group, gIdx) => (
          <div key={group.groupTitle} style={{ marginBottom: gIdx < NAVIGATION_GROUPS.length - 1 ? 18 : 0 }}>

            {/* Group label */}
            <div style={{ padding: "0 8px", marginBottom: 5 }}>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "#94a3b8", fontFamily: "monospace" }}>
                {group.groupTitle}
              </span>
            </div>

            {/* Nav items */}
            <div style={{ display: "flex", flexDirection: "column" as const, gap: 2 }}>
              {group.items.map((item) => {
                const active = isItemActive(item);
                const Icon = NAV_ICONS[item.id];
                const badgeValue = dynamicBadges[item.id] !== undefined ? String(dynamicBadges[item.id]) : item.badge;
                const showBadge = badgeValue !== undefined && Number(badgeValue) > 0;

                return (
                  <div key={item.id}>
                    <NavButton active={active} onClick={() => handleItemClick(item)} aria-current={active ? "page" : undefined}>
                      <div style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0, flex: 1, overflow: "hidden" }}>
                        {Icon && (
                          <Icon style={{ width: 15, height: 15, flexShrink: 0, color: active ? "#006d32" : "#94a3b8", transition: "color 0.15s" }} />
                        )}
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 13, fontWeight: active ? 600 : 500, color: active ? "#0f172a" : "#475569" }}>
                          {item.title}
                        </span>
                      </div>
                      {showBadge && (
                        <span style={{ flexShrink: 0, fontSize: 10, fontWeight: 700, fontFamily: "monospace", padding: "1px 7px", borderRadius: 99, background: active ? "rgba(0,109,50,0.1)" : "rgba(0,0,0,0.06)", color: active ? "#006d32" : "#64748b" }}>
                          {badgeValue}
                        </span>
                      )}
                    </NavButton>

                    {/* Sub-items (when active) */}
                    {active && item.subItems && item.subItems.length > 0 && (
                      <div style={{ margin: "3px 0 4px 20px", paddingLeft: 12, borderLeft: "1.5px solid rgba(0,109,50,0.18)", display: "flex", flexDirection: "column" as const, gap: 1 }}>
                        {item.subItems.map((sub) => {
                          const isSubActive = selectedPath === sub.path || (sub.path !== item.path && selectedPath.startsWith(sub.path));
                          const subBadge = sub.badgeKey ? dynamicBadges[sub.badgeKey] : undefined;
                          return (
                            <SubNavButton
                              key={sub.id}
                              active={isSubActive}
                              onClick={() => { onSelectPath(sub.path); if (onCloseMobile) onCloseMobile(); }}
                            >
                              <div style={{ display: "flex", alignItems: "center", gap: 7, minWidth: 0, flex: 1, overflow: "hidden" }}>
                                <span style={{ width: 5, height: 5, borderRadius: "50%", flexShrink: 0, background: isSubActive ? "#00d166" : "#cbd5e1" }} />
                                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 12, fontWeight: isSubActive ? 600 : 400, color: isSubActive ? "#006d32" : "#64748b" }}>
                                  {sub.title}
                                </span>
                              </div>
                              {subBadge !== undefined && Number(subBadge) > 0 && (
                                <span style={{ fontSize: 10, fontFamily: "monospace", fontWeight: 600, padding: "1px 6px", borderRadius: 99, background: "rgba(0,0,0,0.05)", color: "#64748b", flexShrink: 0 }}>
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
                      <div style={{ margin: "3px 0 4px 20px", paddingLeft: 12, borderLeft: "1.5px solid rgba(0,109,50,0.18)", display: "flex", flexDirection: "column" as const, gap: 1 }}>
                        {item.subTeams.map((sub, sIdx) => (
                          <div key={sIdx} style={{ display: "flex", alignItems: "center", gap: 7, height: 30, padding: "0 8px", borderRadius: 7, cursor: "pointer" }} className="text-slate-500 hover:text-emerald-600 hover:bg-black/[0.03] transition-colors">
                            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#cbd5e1", flexShrink: 0 }} />
                            <span style={{ fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sub}</span>
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
      <div style={{ padding: "10px", borderTop: "1px solid rgba(0,0,0,0.06)", background: "#fff", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "7px 9px", borderRadius: 10, background: "#f8fafc" }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, flexShrink: 0, background: "linear-gradient(135deg,#006d32 0%,#00d166 100%)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 12, boxShadow: "0 2px 8px rgba(0,109,50,0.22)" }}>
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user?.name || "User"}
              </span>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", flexShrink: 0 }} />
            </div>
            <span style={{ display: "block", fontSize: 10, color: "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "monospace" }}>
              {roleLabel}
            </span>
          </div>
          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              title="Sign Out"
              aria-label="Sign out"
              style={{ width: 28, height: 28, borderRadius: 8, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", flexShrink: 0 }}
              className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <LogOut style={{ width: 14, height: 14 }} />
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
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onCloseMobile} />
          <aside className="fixed inset-y-0 left-0 z-50 flex flex-col shadow-2xl" style={{ width: 244 }}>
            {renderNavContent(true)}
          </aside>
        </div>
      )}
    </>
  );
};
