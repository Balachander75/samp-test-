import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { UserProfile } from "@/features/auth";
import {
  fetchAllMarketingRequestsApi,
  fetchCreativeBriefsApi,
  fetchStudioDielinesApi,
  fetchCostingEstimationsApi,
} from "@/features/sample-requests/api";
import { SampleRequestItem } from "@/features/sample-requests/types";
import { useMasterData } from "@/features/sample-requests/hooks/useMasterData";
import { MetricRibbon, MetricTileItem } from "@/components/erp/MetricRibbon";
import {
  Sparkles,
  ArrowRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Download,
  Building2,
  Calendar,
  Layers,
  Palette,
  Box,
  FlaskConical,
  Calculator,
  ShieldCheck,
  Truck,
  Activity,
  ChevronRight,
} from "lucide-react";

interface OperationsOverviewProps {
  user: UserProfile;
}

export const OperationsOverview: React.FC<OperationsOverviewProps> = ({ user }) => {
  const navigate = useNavigate();
  const { plants } = useMasterData();
  const [requests, setRequests] = useState<SampleRequestItem[]>([]);
  const [briefsCount, setBriefsCount] = useState<number>(0);
  const [dielinesCount, setDielinesCount] = useState<number>(0);
  const [costingsCount, setCostingsCount] = useState<number>(0);
  const [lastRefreshed, setLastRefreshed] = useState<string>("");

  const loadData = useCallback(async () => {
    try {
      const [requestsData, briefsData, dielinesData, costingsData] = await Promise.all([
        fetchAllMarketingRequestsApi().catch(() => []),
        fetchCreativeBriefsApi().catch(() => []),
        fetchStudioDielinesApi().catch(() => []),
        fetchCostingEstimationsApi().catch(() => []),
      ]);
      setRequests(requestsData);
      setBriefsCount(briefsData.length);
      setDielinesCount(dielinesData.length);
      setCostingsCount(costingsData.length);
      const now = new Date();
      setLastRefreshed(now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    } catch (err) {
      console.error("Failed to load operations telemetry:", err);
    }
  }, []);

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
        label: "Total Pipeline Volume",
        value: telemetry.total,
        deltaText: "Cross-Department Total",
        deltaTone: "neutral",
        onClick: () => navigate("/sample-requests"),
      },
      {
        id: "pending_feas",
        label: "Pending Feasibility",
        value: telemetry.pendingFeasibility,
        deltaText: telemetry.pendingFeasibility > 0 ? "Dual Broadcast Active" : "All Cleared",
        deltaTone: telemetry.pendingFeasibility > 0 ? "warning" : "positive",
        onClick: () => navigate("/sample-requests"),
      },
      {
        id: "urgent_sla",
        label: "Critical SLA (<72h)",
        value: telemetry.urgentCount,
        deltaText: telemetry.urgentCount > 0 ? "Immediate Attention" : "On Schedule",
        deltaTone: telemetry.urgentCount > 0 ? "critical" : "positive",
        onClick: () => navigate("/sample-requests"),
      },
      {
        id: "in_lab",
        label: "Prototyping & CAD",
        value: telemetry.inFabrication,
        deltaText: "Factory Floor Run",
        deltaTone: "positive",
        onClick: () => navigate("/samp-team-work"),
      },
      {
        id: "dispatched",
        label: "Dispatched / Closed",
        value: telemetry.closedCount,
        deltaText: "Commercial Ready",
        deltaTone: "positive",
        onClick: () => navigate("/costing-team"),
      },
    ],
    [telemetry, navigate]
  );

  const pipelineStages = useMemo(() => {
    const statusCount = (matches: string[]) =>
      requests.filter((request) => {
        const status = String(request.status || "").toLowerCase();
        return matches.some((match) => status.includes(match));
      }).length;

    const stages = [
      { stage: "01. Intake & Feasibility Audit", count: statusCount(["draft", "feasibility", "pending"]), dept: "Marketing & Plant Engineering", color: "bg-amber-500" },
      { stage: "02. Creative Artwork & Prepress", count: statusCount(["creative"]), dept: "Creative Studio", color: "bg-purple-500" },
      { stage: "03. Structural CAD & Dieline Engineering", count: statusCount(["studio", "cad"]), dept: "Packaging Engineering Studio", color: "bg-cyan-500" },
      { stage: "04. Prototyping Laboratory Fabrication", count: telemetry.inFabrication, dept: "SAMP Lab & Plants", color: "bg-indigo-500" },
      { stage: "05. BOM Costing & Quotation", count: statusCount(["cost", "quote", "deal"]), dept: "Finance & Costing", color: "bg-emerald-500" },
    ];

    return stages.map((stage) => ({
      ...stage,
      pct: Math.min(100, Math.round((stage.count / Math.max(1, telemetry.total)) * 100)),
    }));
  }, [requests, telemetry]);

  // Department Desks Definition
  const DEPARTMENT_DESKS = [
    {
      id: "marketing",
      title: "Marketing Work Desk",
      shortCode: "MK",
      icon: <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />,
      tag: "Direct Intake & Feasibility",
      description: "Client prototype intake, dual-broadcast technical feasibility evaluation, and seasonal catalog planning.",
      route: "/sample-requests",
      accent: "hover:border-blue-500/80 group-hover:text-blue-600 dark:group-hover:text-blue-400",
      badgeText: `${telemetry.total} Active Requests`,
      badgeTone: "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800",
      subItems: ["Direct Intake (4 Scopes)", "Plant & Lab Feasibility Sign-off", "Seasonal Program Quota Matrix"],
    },
    {
      id: "creative",
      title: "Creative Work Desk",
      shortCode: "CR",
      icon: <Palette className="w-4 h-4 text-purple-600 dark:text-purple-400" />,
      tag: "Artwork & Prepress",
      description: "Packaging graphics, high-resolution CMYK color separation, bleed margin validation, and cylinder output sign-off.",
      route: "/creative-work",
      accent: "hover:border-purple-500/80 group-hover:text-purple-600 dark:group-hover:text-purple-400",
      badgeText: `${briefsCount} In-flight Briefs`,
      badgeTone: "bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800",
      subItems: ["300/600 DPI Resolution Audit", "Spot Pantone Formulations", "Prepress Proof Certification"],
    },
    {
      id: "studio",
      title: "Studio Work Desk",
      shortCode: "ST",
      icon: <Box className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />,
      tag: "Structural CAD & Dieline",
      description: "Precision flute caliper geometry, tuck-end carton calculations, laser die clearance validation, and 3D folding fitment.",
      route: "/studio-work",
      accent: "hover:border-cyan-500/80 group-hover:text-cyan-600 dark:group-hover:text-cyan-400",
      badgeText: `${dielinesCount} Dieline Packages`,
      badgeTone: "bg-cyan-50 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800",
      subItems: ["DXF / CF2 / ARD Geometry", "Flute Caliper Compensation", "Laser Die Tooling Ready"],
    },
    {
      id: "samp",
      title: "SAMP Team Work Desk",
      shortCode: "SM",
      icon: <FlaskConical className="w-4 h-4 text-amber-600 dark:text-amber-400" />,
      tag: "Prototyping Lab & Plants",
      description: "Physical prototype fabrication, sample table plotting, manual finishing, QC inspection, and courier dispatch tracking.",
      route: "/samp-team-work",
      accent: "hover:border-amber-500/80 group-hover:text-amber-600 dark:group-hover:text-amber-400",
      badgeText: `${telemetry.inFabrication} Fabrication Orders`,
      badgeTone: "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800",
      subItems: ["Rapid First-Responder Sign-off", "Milestone Fabrication Tracker", "Courier Dispatch & AWB Sync"],
    },
    {
      id: "costing",
      title: "Costing Team Desk",
      shortCode: "CO",
      icon: <Calculator className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
      tag: "BOM Pricing & Quotations",
      description: "Multi-component raw material BOM breakdown, volume tier margin simulation (10k–250k pcs), and official PDF quotation release.",
      route: "/costing-team",
      accent: "hover:border-emerald-500/80 group-hover:text-emerald-600 dark:group-hover:text-emerald-400",
      badgeText: `${costingsCount} BOM Quotes`,
      badgeTone: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
      subItems: ["Substrate & Finishing Costing", "Interactive Margin Simulator", "Formal PDF Quotation Export"],
    },
  ];

  // Recent operational activity
  const recentActivities = useMemo(() => {
    const colors = [
      "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800",
      "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800",
      "text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/40 border-cyan-200 dark:border-cyan-800",
      "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800",
    ];

    return requests.slice(0, 4).map((request, index) => ({
      id: request.id,
      time: request.createdAt ? new Date(request.createdAt).toLocaleString("en-IN") : "",
      department: request.status || "Pipeline",
      badgeColor: colors[index % colors.length],
      message: `${request.srNumber || "Request"} · ${request.productDescription || "Request created"}${request.customer ? ` · ${request.customer}` : ""}`,
      actionLink: "/sample-requests",
    }));
  }, [requests]);

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 overflow-y-auto bg-[#fafafa] dark:bg-[#08090d] select-text">
      {/* 1. Header Toolbar */}
      <div className="px-5 sm:px-6 py-3.5 border-b border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-[#0f1118] flex items-center justify-between gap-3 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm sm:text-[15px] font-bold text-zinc-950 dark:text-zinc-50 tracking-tight">
              Executive Operations Control Room
            </h1>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              LIVE TELEMETRY
            </span>
          </div>
          <p className="text-[11px] font-mono text-zinc-400 dark:text-zinc-500 mt-0.5">
            Cross-Department Pipeline Health · 5 Core Manufacturing Units Synchronized
            {lastRefreshed && ` · Updated at ${lastRefreshed}`}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => navigate("/sample-requests")}
            className="h-9 px-4 rounded-md bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
          >
            <span>Launch Marketing Intake</span>
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
                Department Operational Work Desks
              </h2>
              <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
                Direct access to specialized operational consoles with dedicated pipelines and inspectors.
              </p>
            </div>
            <span className="text-[11px] font-mono text-zinc-400">5 of 5 Desks Active</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {DEPARTMENT_DESKS.map((desk) => (
              <div
                key={desk.id}
                onClick={() => navigate(desk.route)}
                className={`group relative flex flex-col justify-between p-4 rounded-lg border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-[#0f1118] ${desk.accent} hover:shadow-md transition-all duration-150 cursor-pointer select-none`}
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

        {/* Bottom Section: Cross-Department Throughput Bar & Activity Chatter */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Column (7 cols): Stage Distribution Summary */}
          <div className="lg:col-span-7 rounded-lg border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-[#0f1118] p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200 font-mono">
                  Live Stage Pipeline Distribution
                </h3>
              </div>
              <span className="text-[11px] font-mono text-zinc-400">
                {telemetry.total} Total Orders Tracked
              </span>
            </div>

            {/* Segmented Stage Breakdown */}
            <div className="space-y-3">
              {[
                {
                  stage: "01. Intake & Dual Feasibility Audit",
                  count: telemetry.pendingFeasibility,
                  dept: "Marketing & Plant Engineering",
                  color: "bg-amber-500",
                  pct: Math.min(100, Math.round((telemetry.pendingFeasibility / Math.max(1, telemetry.total)) * 100)),
                },
                {
                  stage: "02. Creative Artwork & Prepress Certification",
                  count: briefsCount,
                  dept: "Creative Studio",
                  color: "bg-purple-500",
                  pct: Math.min(100, Math.round((briefsCount / Math.max(1, telemetry.total)) * 100)),
                },
                {
                  stage: "03. Structural CAD & Dieline Engineering",
                  count: dielinesCount,
                  dept: "Packaging Engineering Studio",
                  color: "bg-cyan-500",
                  pct: Math.min(100, Math.round((dielinesCount / Math.max(1, telemetry.total)) * 100)),
                },
                {
                  stage: "04. Prototyping Laboratory Fabrication",
                  count: telemetry.inFabrication,
                  dept: "Central SAMP Lab & Plants",
                  color: "bg-indigo-500",
                  pct: Math.min(100, Math.round((telemetry.inFabrication / Math.max(1, telemetry.total)) * 100)),
                },
                {
                  stage: "05. Multi-tier BOM Costing & Quotation",
                  count: costingsCount,
                  dept: "Finance & Costing Estimation",
                  color: "bg-emerald-500",
                  pct: Math.min(100, Math.round((costingsCount / Math.max(1, telemetry.total)) * 100)),
                },
              ].map((item) => (
                <div key={item.stage} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">{item.stage}</span>
                    <span className="font-mono text-[11px] font-bold text-zinc-700 dark:text-zinc-300 tabular-nums">
                      {item.count} items ({item.pct}%)
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${item.color} transition-all duration-300`}
                      style={{ width: `${Math.max(5, item.pct)}%` }}
                    />
                  </div>
                  <div className="text-[10px] font-mono text-zinc-400">Unit: {item.dept}</div>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-zinc-100 dark:border-white/[0.05] flex items-center justify-between text-[11px] text-zinc-400 font-mono">
              <span>
                Facility sync: {plants.length ? plants.map((plant) => plant.name).join(", ") : "No plants loaded"}
              </span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">✓ 100% Operational</span>
            </div>
          </div>

          {/* Right Column (5 cols): Live Telemetry Event Stream */}
          <div className="lg:col-span-5 rounded-lg border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-[#0f1118] p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-zinc-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200 font-mono">
                  Operational Event Stream
                </h3>
              </div>
              <span className="text-[10px] font-mono text-zinc-400">Auto-logging active</span>
            </div>

            <div className="space-y-3">
              {recentActivities.map((act) => (
                <div
                  key={act.id}
                  onClick={() => navigate(act.actionLink)}
                  className="p-3 rounded-md border border-zinc-100 dark:border-white/[0.05] bg-zinc-50/60 dark:bg-zinc-900/30 hover:border-brand-500/50 transition-colors cursor-pointer space-y-1"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold border ${act.badgeColor}`}>
                      {act.department}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-400">{act.time}</span>
                  </div>
                  <p className="text-[11px] text-zinc-700 dark:text-zinc-300 leading-snug">
                    {act.message}
                  </p>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-zinc-100 dark:border-white/[0.05] text-center">
              <button
                type="button"
                onClick={() => navigate("/sample-requests")}
                className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline cursor-pointer"
              >
                View Complete Historical Audit Log →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OperationsOverview;
