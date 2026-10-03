import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchAllMarketingRequestsApi,
  fetchCreativeBriefsApi,
  fetchStudioDielinesApi,
  fetchCostingEstimationsApi,
} from "@/features/sample-requests/api";
import { SampleRequestItem } from "@/features/sample-requests/types";
import { useBusinessYear } from "@/context/BusinessYearContext";
import { MetricRibbon, MetricTileItem } from "@/components/erp/MetricRibbon";
import {
  ArrowRight,
  Clock,
  Layers,
  Palette,
  Box,
  FlaskConical,
  Calculator,
  Activity,
  ChevronRight,
} from "lucide-react";

export const OperationsOverview: React.FC = () => {
  const navigate = useNavigate();
  const { selectedYear } = useBusinessYear();
  const [requests, setRequests] = useState<SampleRequestItem[]>([]);
  const [briefsCount, setBriefsCount] = useState<number>(0);
  const [dielinesCount, setDielinesCount] = useState<number>(0);
  const [costingsCount, setCostingsCount] = useState<number>(0);
  const [lastRefreshed, setLastRefreshed] = useState<string>("");

  const loadData = useCallback(async () => {
    try {
      const [requestsData, briefsData, dielinesData, costingsData] = await Promise.all([
        fetchAllMarketingRequestsApi(selectedYear).catch(() => []),
        fetchCreativeBriefsApi().catch(() => []),
        fetchStudioDielinesApi().catch(() => []),
        fetchCostingEstimationsApi().catch(() => []),
      ]);
      setRequests(requestsData);
      setBriefsCount(briefsData.length);
      setDielinesCount(dielinesData.length);
      setCostingsCount(costingsData.length);
      const now = new Date();
      setLastRefreshed(now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }));
    } catch (err) {
      console.error("Failed to load operations telemetry:", err);
    }
  }, [selectedYear]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const handleRefresh = (event: Event) => {
      event.preventDefault();
      void loadData().finally(() => window.dispatchEvent(new Event("app:refresh-complete")));
    };
    window.addEventListener("app:refresh-requested", handleRefresh);
    return () => window.removeEventListener("app:refresh-requested", handleRefresh);
  }, [loadData]);

  // Compute live pipeline metrics
  const telemetry = useMemo(() => {
    const total = requests.length;

    // Pending Feasibility means an open SAMP review, not a request already finalized by Marketing.
    const pendingFeasibility = requests.filter(
      (r) => {
        if (String(r.creationMode || "").toLowerCase() !== "feasibility_check") return false;
        if (r.samplingFeasibilityResponse) return false;
        const status = String(r.status || "").toLowerCase();
        return !["completed", "closed", "approved", "rejected"].some((term) => status.includes(term));
      }
    ).length;

    // Urgent SLA (<72h)
    const now = new Date();
    const threeDaysLater = new Date(now.getTime() + 3 * 86400000);
    const urgentCount = requests.filter((r) => {
      if (!r.sampleRequiredDate) return false;
      const d = new Date(r.sampleRequiredDate);
      const s = (r.status || "").toLowerCase();
      const isClosed = s.includes("dispatch") || s.includes("deal");
      return d <= threeDaysLater && !isClosed;
    }).length;

    // Prototyping in progress
    const inFabrication = requests.filter((r) => {
      const s = (r.status || "").toLowerCase();
      return (
        s.includes("samp") ||
        s.includes("studio") ||
        s.includes("machine") ||
        s.includes("prep") ||
        s.includes("plant")
      );
    }).length;

    // Commercial ready / dispatched
    const closedCount = requests.filter((r) => {
      const s = (r.status || "").toLowerCase();
      return s.includes("dispatch") || s.includes("deal") || s.includes("approved");
    }).length;

    return {
      total,
      pendingFeasibility,
      urgentCount,
      inFabrication,
      closedCount,
    };
  }, [requests]);

  // Metric Ribbon items
  const metrics: MetricTileItem[] = useMemo(
    () => [
      {
        id: "total_pipeline",
        label: "Marketing Requests",
        value: telemetry.total,
        deltaText: "Selected business year",
        deltaTone: "neutral",
        onClick: () => navigate("/sample-requests"),
      },
      {
        id: "pending_feas",
        label: "Pending Feasibility",
        value: telemetry.pendingFeasibility,
        deltaText: "Open feasibility checks",
        deltaTone: telemetry.pendingFeasibility > 0 ? "warning" : "positive",
        onClick: () => navigate("/sample-requests"),
      },
      {
        id: "urgent_sla",
        label: "Critical SLA (<72h)",
        value: telemetry.urgentCount,
        deltaText: "Required within 3 days",
        deltaTone: telemetry.urgentCount > 0 ? "critical" : "positive",
        onClick: () => navigate("/sample-requests"),
      },
      {
        id: "in_lab",
        label: "Prototyping & CAD",
        value: telemetry.inFabrication,
        deltaText: "Requests in production stages",
        deltaTone: "positive",
        onClick: () => navigate("/samp-team-work"),
      },
      {
        id: "dispatched",
        label: "Dispatched / Closed",
        value: telemetry.closedCount,
        deltaText: "Approved or dispatched",
        deltaTone: "positive",
        onClick: () => navigate("/costing-team"),
      },
    ],
    [telemetry, navigate]
  );

  // Department workspace launch links
  const DEPARTMENT_DESKS = [
    {
      id: "marketing",
      title: "Marketing Work Desk",
      shortCode: "MK",
      icon: <Layers className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />,
      tag: "Requests & planning",
      description: "Create and manage marketing requests, feasibility checks, and seasonal plans.",
      route: "/sample-requests",
      accent: "hover:border-brand-500/80 group-hover:text-brand-600 dark:group-hover:text-brand-400",
      badgeText: `${telemetry.total} Requests`,
      badgeTone: "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200 border-zinc-200 dark:border-zinc-700",
      subItems: ["Sample requests", "Feasibility checks", "Program planning"],
    },
    {
      id: "creative",
      title: "Creative Work Desk",
      shortCode: "CR",
      icon: <Palette className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />,
      tag: "Artwork & briefs",
      description: "Review creative briefs and manage artwork work in progress.",
      route: "/creative-work",
      accent: "hover:border-brand-500/80 group-hover:text-brand-600 dark:group-hover:text-brand-400",
      badgeText: `${briefsCount} Briefs`,
      badgeTone: "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200 border-zinc-200 dark:border-zinc-700",
      subItems: ["Creative briefs", "Artwork details", "Request status"],
    },
    {
      id: "studio",
      title: "Studio Work Desk",
      shortCode: "ST",
      icon: <Box className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />,
      tag: "Structure & dielines",
      description: "Manage studio work and dieline records for product requests.",
      route: "/studio-work",
      accent: "hover:border-brand-500/80 group-hover:text-brand-600 dark:group-hover:text-brand-400",
      badgeText: `${dielinesCount} Dielines`,
      badgeTone: "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200 border-zinc-200 dark:border-zinc-700",
      subItems: ["Studio work", "Dieline records", "Request status"],
    },
    {
      id: "samp",
      title: "SAMP Team Work Desk",
      shortCode: "SM",
      icon: <FlaskConical className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />,
      tag: "Sampling operations",
      description: "Coordinate sample work and review requests routed to the SAMP team.",
      route: "/samp-team-work",
      accent: "hover:border-brand-500/80 group-hover:text-brand-600 dark:group-hover:text-brand-400",
      badgeText: `${telemetry.inFabrication} in production`,
      badgeTone: "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200 border-zinc-200 dark:border-zinc-700",
      subItems: ["Sampling requests", "Work progress", "Dispatch details"],
    },
    {
      id: "costing",
      title: "Costing Team Desk",
      shortCode: "CO",
      icon: <Calculator className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />,
      tag: "Estimates & pricing",
      description: "Review costing estimates and their linked sample requests.",
      route: "/costing-team",
      accent: "hover:border-brand-500/80 group-hover:text-brand-600 dark:group-hover:text-brand-400",
      badgeText: `${costingsCount} Costing estimates`,
      badgeTone: "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200 border-zinc-200 dark:border-zinc-700",
      subItems: ["Costing estimates", "Material details", "Request status"],
    },
  ];

  // Recent operational activity
  const recentActivities = useMemo(() => {
    return requests.slice(0, 5).map((request) => ({
      id: request.id,
      time: request.createdAt ? new Date(request.createdAt).toLocaleString("en-IN") : "",
      department: request.status || "Pipeline",
      badgeColor: "text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700",
      message: `${request.srNumber || "Request"} · ${request.productDescription || "Request created"}${request.customer ? ` · ${request.customer}` : ""}`,
      actionLink: "/sample-requests",
    }));
  }, [requests]);

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 overflow-y-auto bg-[var(--bg-app)] select-text">
      {/* 1. Header Toolbar */}
      <div className="px-5 sm:px-6 py-3.5 border-b border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-[#0f1118] flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50 tracking-tight">
              Operations Overview
            </h1>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Counts reflect the request and department data available to this workspace
            {lastRefreshed && ` · Updated at ${lastRefreshed}`}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => navigate("/sample-requests")}
            className="h-9 px-4 rounded-md bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
          >
            <span>Open Marketing Work</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Unified Metric Ribbon */}
      <MetricRibbon metrics={metrics} />

      {/* 3. Main Dashboard Content Grid */}
      <div className="p-5 sm:p-6 space-y-6 max-w-7xl w-full mx-auto">
        {/* Department Launchpad Grid (5 Core Work Desks) */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 font-mono">
                Department workspaces
              </h2>
              <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
                Open a workspace to review and update its records.
              </p>
            </div>
            <span className="text-[11px] font-mono text-zinc-400">{DEPARTMENT_DESKS.length} workspaces</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {DEPARTMENT_DESKS.map((desk) => (
              <div
                key={desk.id}
                onClick={() => navigate(desk.route)}
                onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); navigate(desk.route); } }}
                role="link"
                tabIndex={0}
                className={`group relative flex flex-col justify-between p-4 rounded-lg border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-[#0f1118] ${desk.accent} hover:border-brand-400 dark:hover:border-brand-700 hover:bg-zinc-50/70 dark:hover:bg-white/[0.02] transition-colors cursor-pointer select-none`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-md bg-zinc-100 dark:bg-zinc-800/80 flex items-center justify-center border border-zinc-200 dark:border-zinc-700">
                        {desk.icon}
                      </div>
                      <div>
                        <h3 className="text-[13px] font-bold text-zinc-950 dark:text-zinc-50 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                          {desk.title}
                        </h3>
                        <span className="text-[10px] font-mono text-zinc-400">{desk.tag}</span>
                      </div>
                    </div>

                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${desk.badgeTone}`}>
                      {desk.badgeText}
                    </span>
                  </div>

                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed mt-1">
                    {desk.description}
                  </p>

                  <div className="mt-3 pt-2.5 border-t border-zinc-100 dark:border-white/[0.05] space-y-1">
                    {desk.subItems.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-mono">
                        <span className="text-zinc-300 dark:text-zinc-600">•</span>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 pt-2.5 border-t border-zinc-100 dark:border-white/[0.05] flex items-center justify-between text-xs font-semibold text-brand-600 dark:text-brand-400">
                  <span>Enter Console</span>
                  <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Workspace records and recent marketing intake */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Workspace record counts */}
          <div className="lg:col-span-7 rounded-lg border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-[#0f1118] p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200 font-mono">
                  Request stage summary
                </h3>
              </div>
            </div>

            {/* Counts come from separate workspaces, so they are shown as records rather than pipeline percentages. */}
            <div className="divide-y divide-zinc-100 dark:divide-white/[0.06]">
              {[
                {
                  stage: "Open feasibility checks",
                  count: telemetry.pendingFeasibility,
                  dept: "Marketing",
                },
                {
                  stage: "Creative briefs",
                  count: briefsCount,
                  dept: "Creative Studio",
                },
                {
                  stage: "Studio dielines",
                  count: dielinesCount,
                  dept: "Studio",
                },
                {
                  stage: "Sampling & production requests",
                  count: telemetry.inFabrication,
                  dept: "SAMP Team",
                },
                {
                  stage: "Costing estimates",
                  count: costingsCount,
                  dept: "Costing",
                },
              ].map((item) => (
                <div key={item.stage} className="flex items-center justify-between gap-4 py-2.5 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <div className="text-[13px] font-medium text-zinc-800 dark:text-zinc-200">{item.stage}</div>
                    <div className="text-[11px] text-zinc-500 dark:text-zinc-400">{item.dept}</div>
                  </div>
                  <span className="font-mono text-sm font-semibold text-zinc-900 dark:text-zinc-100 tabular-nums">{item.count}</span>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-zinc-100 dark:border-white/[0.05] flex items-center justify-between text-[11px] text-zinc-400 font-mono">
              <span>
                Counts reflect records available to this workspace.
              </span>
            </div>
          </div>

          {/* Recent marketing requests */}
          <div className="lg:col-span-5 rounded-lg border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-[#0f1118] p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-zinc-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200 font-mono">
                  Recent requests
                </h3>
              </div>
              <span className="text-[10px] font-mono text-zinc-400">Marketing intake</span>
            </div>

            <div className="space-y-2">
              {recentActivities.length ? recentActivities.map((act) => (
                <div
                  key={act.id}
                  onClick={() => navigate(act.actionLink)}
                  onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); navigate(act.actionLink); } }}
                  role="link"
                  tabIndex={0}
                  className="p-3 rounded-md border border-zinc-100 dark:border-white/[0.05] bg-zinc-50/60 dark:bg-zinc-900/30 hover:border-brand-500/50 transition-colors cursor-pointer space-y-1"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold border ${act.badgeColor}`}>
                      {act.department}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-400">{act.time}</span>
                  </div>
                  <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-snug">
                    {act.message}
                  </p>
                </div>
              )) : (
                <div className="rounded-md border border-dashed border-zinc-300 dark:border-zinc-700 px-4 py-8 text-center text-xs text-zinc-500 dark:text-zinc-400">
                  No marketing requests are available for this business year.
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-zinc-100 dark:border-white/[0.05] text-center">
              <button
                type="button"
                onClick={() => navigate("/sample-requests")}
                className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline cursor-pointer"
              >
                View all requests →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OperationsOverview;
