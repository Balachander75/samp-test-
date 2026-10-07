import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchAllMarketingRequestsApi,
  fetchCreativeBriefsApi,
  fetchStudioDielinesApi,
  fetchCostingEstimationsApi,
} from "@/infrastructure/api";
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
  Factory,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Plus,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  Cpu,
  PackageCheck,
  Sliders,
  Sparkles,
} from "lucide-react";

export const OperationsOverview: React.FC = () => {
  const navigate = useNavigate();
  const { selectedYear } = useBusinessYear();
  const [requests, setRequests] = useState<SampleRequestItem[]>([]);
  const [briefsCount, setBriefsCount] = useState<number>(0);
  const [dielinesCount, setDielinesCount] = useState<number>(0);
  const [costingsCount, setCostingsCount] = useState<number>(0);
  const [lastRefreshed, setLastRefreshed] = useState<string>("");
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Capacity Matrix state
  const [rebalancedNov, setRebalancedNov] = useState(false);

  const loadData = useCallback(async () => {
    setIsRefreshing(true);
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
      setLastRefreshed(now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }));
    } catch (err) {
      console.error("Failed to load operations telemetry:", err);
    } finally {
      setIsRefreshing(false);
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

    // Pending Feasibility
    const pendingFeasibility = requests.filter((r) => {
      const mode = String(r.creationMode || "").toLowerCase();
      const kind = String(r.requestKind || "").toLowerCase();
      const isFeas = mode === "feasibility_check" || kind === "feasibility";
      if (!isFeas) return false;
      if (r.samplingFeasibilityResponse) return false;
      const status = String(r.status || "").toLowerCase();
      return !["completed", "closed", "approved", "rejected"].some((term) => status.includes(term));
    }).length;

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
        s.includes("plant") ||
        s.includes("review")
      );
    }).length;

    // Commercial ready / dispatched
    const closedCount = requests.filter((r) => {
      const s = (r.status || "").toLowerCase();
      return s.includes("dispatch") || s.includes("deal") || s.includes("approved") || s.includes("closed");
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
        deltaText: selectedYear === "ALL" ? "All Business Years" : `BY ${selectedYear}`,
        deltaTone: "neutral",
        onClick: () => navigate("/sample-requests"),
      },
      {
        id: "pending_feas",
        label: "Pending Feasibility",
        value: telemetry.pendingFeasibility,
        deltaText: "Awaiting Lab review",
        deltaTone: telemetry.pendingFeasibility > 0 ? "warning" : "positive",
        onClick: () => navigate("/sample-requests"),
      },
      {
        id: "urgent_sla",
        label: "Critical SLA (<72h)",
        value: telemetry.urgentCount,
        deltaText: "Due within 3 working days",
        deltaTone: telemetry.urgentCount > 0 ? "critical" : "positive",
        onClick: () => navigate("/sample-requests"),
      },
      {
        id: "in_lab",
        label: "Prototyping & CAD",
        value: telemetry.inFabrication,
        deltaText: "Active in SAMP Team & Studio",
        deltaTone: "positive",
        onClick: () => navigate("/samp-team-work"),
      },
      {
        id: "dispatched",
        label: "Dispatched / Closed",
        value: telemetry.closedCount,
        deltaText: "Completed or actual deals",
        deltaTone: "positive",
        onClick: () => navigate("/sample-requests"),
      },
      {
        id: "capacity_load",
        label: "Plant SCU Load",
        value: "1.90 SCU",
        deltaText: "Average plant effort index",
        deltaTone: "neutral",
        onClick: () => navigate("/analytics"),
      },
    ],
    [telemetry, selectedYear, navigate]
  );

  // Department workspaces with ALL teams and sub-teams
  const DEPARTMENT_DESKS = [
    {
      id: "marketing",
      title: "Marketing Work Desk",
      shortCode: "MK",
      icon: <Layers className="w-4 h-4 text-[#714b67] dark:text-purple-300" />,
      tag: "Requests & Intake",
      description: "Manage sample requests, customer feasibility checks, and seasonal programs.",
      route: "/sample-requests",
      badgeText: `${telemetry.total} Requests`,
      badgeTone: "bg-[#714b67]/10 text-[#714b67] dark:bg-purple-950/40 dark:text-purple-300 border-[#714b67]/20",
      subItems: ["Sample Requests", "Feasibility Checks", "Program Planning Matrix"],
    },
    {
      id: "creative",
      title: "Creative Work Desk",
      shortCode: "CR",
      icon: <Palette className="w-4 h-4 text-pink-600 dark:text-pink-400" />,
      tag: "Graphics & Artwork",
      description: "Review artwork briefs, concept variants, and prepress certifications.",
      route: "/creative-work",
      badgeText: `${briefsCount} Briefs`,
      badgeTone: "bg-pink-50 text-pink-700 dark:bg-pink-950/30 dark:text-pink-300 border-pink-200 dark:border-pink-900/50",
      subItems: ["Artwork Briefs", "Design Variants", "Prepress Proofing"],
    },
    {
      id: "studio",
      title: "Studio Work Desk",
      shortCode: "ST",
      icon: <Box className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />,
      tag: "Structural CAD",
      description: "Structural engineering, dieline packaging construction, and 3D simulation.",
      route: "/studio-work",
      badgeText: `${dielinesCount} Dielines`,
      badgeTone: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-300 border-indigo-200 dark:border-indigo-900/50",
      subItems: ["CAD Intake", "Dielines & Flute Grades", "Plotter Sample Cleared"],
    },
    {
      id: "samp",
      title: "SAMP Team Work Desk",
      shortCode: "SM",
      icon: <FlaskConical className="w-4 h-4 text-teal-600 dark:text-teal-400" />,
      tag: "Sampling Lab",
      description: "Physical sample fabrication, PMT specification reviews, and QC sign-off.",
      route: "/samp-team-work",
      badgeText: `${telemetry.inFabrication} In Lab`,
      badgeTone: "bg-teal-50 text-teal-700 dark:bg-teal-950/30 dark:text-teal-300 border-teal-200 dark:border-teal-900/50",
      subItems: ["PMT Reviews", "Physical Prototypes", "Machine Compatibility"],
    },
    {
      id: "costing",
      title: "Costing Team Desk",
      shortCode: "CO",
      icon: <Calculator className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
      tag: "BOM & Pricing",
      description: "Raw material substrate calculations, conversion costs, and margin quotes.",
      route: "/costing-team",
      badgeText: `${costingsCount} Estimates`,
      badgeTone: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/50",
      subItems: ["Substrate Pricing", "Tooling & Labor", "Parallel Quote Released"],
    },
    {
      id: "plant",
      title: "Plant Execution Desk",
      shortCode: "PL",
      icon: <Factory className="w-4 h-4 text-amber-600 dark:text-amber-400" />,
      tag: "Floor Execution & QC",
      description: "Shop-floor workcentre operations, tooling, quality control, and dispatch.",
      route: "/plant",
      badgeText: "Shopfloor Ready",
      badgeTone: "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300 border-amber-200 dark:border-amber-900/50",
      subItems: [
        "Production Floor (WC-10, WC-20, WC-30)",
        "Quality Control (QC / 100% Protocol)",
        "Tooling & Die Prep",
        "Dispatch & Freight Tracking",
      ],
    },
    {
      id: "analytics",
      title: "Capacity & SLA Analytics",
      shortCode: "AN",
      icon: <BarChart3 className="w-4 h-4 text-blue-600 dark:text-blue-400" />,
      tag: "Planning Matrix",
      description: "Annual plant capacity balancing matrix (Oct-Sep) and SLA turnaround radar.",
      route: "/analytics",
      badgeText: "FY26-27 Active",
      badgeTone: "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300 border-blue-200 dark:border-blue-900/50",
      subItems: ["Annual SCU Capacity", "Plant Load Rebalance", "SLA Turnaround Radar"],
    },
  ];

  // Cross-department operational timeline
  const recentActivities = useMemo(() => {
    return requests.slice(0, 5).map((request) => ({
      id: request.id,
      time: request.createdAt ? new Date(request.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "Today",
      stage: request.status || "Pipeline Intake",
      code: request.srNumber || "SR-2026",
      desc: request.productDescription || "Sample specification initialized",
      customer: request.customer || "Staples Global",
    }));
  }, [requests]);

  const handleRebalanceQuota = () => {
    setRebalancedNov(true);
    window.dispatchEvent(
      new CustomEvent("app:show-toast", {
        detail: {
          message: "✓ Rebalanced: 4.8 SCU workload transferred from Plant 01 (Pune) to Plant 02 (Vapi).",
          tone: "success",
        },
      })
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 overflow-y-auto bg-[#f1f3f5] dark:bg-[#0c0d12] text-[#1e293b] dark:text-zinc-100 select-text font-sans">
      
      {/* ========================================================================= */}
      {/* 1. CONTROL PANEL SUB-BAR (Breadcrumbs, Quick Actions, Status)             */}
      {/* ========================================================================= */}
      <div className="px-4 sm:px-6 py-2.5 bg-white dark:bg-[#12141d] border-b border-[#d8dadd] dark:border-white/[0.08] flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center text-xs font-semibold">
            <span className="text-zinc-400">Workspace</span>
            <span className="mx-1.5 text-zinc-300 dark:text-zinc-600">/</span>
            <span className="text-[#1e293b] dark:text-zinc-100 font-bold">Operations Overview</span>
          </div>

          <span className="h-4 w-px bg-zinc-200 dark:bg-white/10 hidden sm:inline-block" />

          <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">
            <Clock className="w-3 h-3 text-[#714b67] dark:text-purple-400" />
            <span>Updated {lastRefreshed || "Just now"}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate("/sample-requests", { state: { openMarketingSetup: true } })}
            className="h-8 px-3 rounded bg-white hover:bg-zinc-50 border border-[#ced4da] dark:border-white/15 text-xs font-semibold text-[#1e293b] dark:text-zinc-200 flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5 text-[#714b67]" />
            <span>New Request</span>
          </button>

          <button
            type="button"
            onClick={() => navigate("/sample-requests")}
            className="h-8 px-3.5 rounded bg-[#017e84] hover:bg-[#00666a] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs active:scale-95"
          >
            <span>Open Marketing Work</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={loadData}
            title="Refresh Metrics"
            className="h-8 w-8 rounded border border-[#ced4da] dark:border-white/15 bg-white dark:bg-[#1a1e2c] flex items-center justify-center text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 hover:bg-zinc-50 transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-[#714b67]" : ""}`} />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. UNIFIED METRIC KPI RIBBON                                              */}
      {/* ========================================================================= */}
      <MetricRibbon metrics={metrics} />

      {/* ========================================================================= */}
      {/* 3. MAIN DASHBOARD CONTENT AREA                                            */}
      {/* ========================================================================= */}
      <div className="p-4 sm:p-6 space-y-6 max-w-7xl w-full mx-auto">
        
        {/* Department Launchpad Grid */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 font-mono">
                Department Workspaces & Operational Units
              </h2>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Coordinated workflow spanning intake, artwork, CAD dielines, sampling lab, costing, and plant floor.
              </p>
            </div>
            <span className="text-[11px] font-mono text-zinc-400 font-semibold">
              {DEPARTMENT_DESKS.length} Workspaces Active
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {DEPARTMENT_DESKS.map((desk) => (
              <div
                key={desk.id}
                onClick={() => navigate(desk.route)}
                role="link"
                tabIndex={0}
                className="group relative flex flex-col justify-between p-4 rounded bg-white dark:bg-[#141722] border border-[#d8dadd] dark:border-white/10 hover:border-[#714b67] dark:hover:border-purple-400 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-md transition-all duration-150 cursor-pointer select-none"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded bg-zinc-50 dark:bg-white/[0.04] flex items-center justify-center border border-zinc-200 dark:border-white/10 shrink-0">
                        {desk.icon}
                      </div>
                      <div>
                        <h3 className="text-[13px] font-bold text-[#1e293b] dark:text-zinc-50 group-hover:text-[#714b67] dark:group-hover:text-purple-300 transition-colors">
                          {desk.title}
                        </h3>
                        <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-tight">
                          {desk.tag}
                        </span>
                      </div>
                    </div>

                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${desk.badgeTone}`}>
                      {desk.badgeText}
                    </span>
                  </div>

                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed mb-3">
                    {desk.description}
                  </p>

                  {/* Sub-teams list */}
                  <div className="border-t border-zinc-100 dark:border-white/[0.06] pt-2 mb-2 space-y-1">
                    {desk.subItems.map((sub, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                        <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-600" />
                        <span className="truncate">{sub}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-zinc-100 dark:border-white/[0.06] flex items-center justify-between text-xs font-semibold text-[#017e84] group-hover:text-[#00666a] transition-colors">
                  <span>Enter Console</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ===================================================================== */}
        {/* 4. ANNUAL PLANT CAPACITY BALANCING MATRIX (Oct -> Sep Model)          */}
        {/* ===================================================================== */}
        <section className="bg-white dark:bg-[#141722] border border-[#d8dadd] dark:border-white/10 rounded shadow-xs p-4 sm:p-5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-zinc-200 dark:border-white/10 gap-2">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[#1e293b] dark:text-zinc-50">
                  Annual Plant Capacity Balancing Matrix (Oct 2026 → Sep 2027)
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-50 text-[#714b67] border border-purple-200">
                  SCU Quotas
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Declared Capacity vs. Sales Demand Plan vs. Released Sampling Load in Sampling Capacity Units (SCU).
              </p>
            </div>

            <button
              type="button"
              onClick={handleRebalanceQuota}
              disabled={rebalancedNov}
              className={`px-3 py-1 rounded text-xs font-semibold shadow-xs transition cursor-pointer active:scale-95 ${
                rebalancedNov
                  ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed border border-zinc-200 dark:border-zinc-700"
                  : "bg-[#017e84] hover:bg-[#00666a] text-white"
              }`}
            >
              {rebalancedNov ? "✓ Rebalanced" : "Revise Declared Quota"}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-center border-collapse text-xs">
              <thead className="bg-[#f8f9fa] dark:bg-white/[0.02] text-zinc-600 dark:text-zinc-400 font-mono text-[10px] uppercase border-b border-zinc-200 dark:border-white/10">
                <tr>
                  <th className="p-2 text-left w-48">Measurement (SCU)</th>
                  <th className="p-2">Oct</th><th className="p-2">Nov</th><th className="p-2">Dec</th>
                  <th className="p-2">Jan</th><th className="p-2">Feb</th><th className="p-2">Mar</th>
                  <th className="p-2">Apr</th><th className="p-2">May</th><th className="p-2">Jun</th>
                  <th className="p-2">Jul</th><th className="p-2">Aug</th><th className="p-2">Sep</th>
                  <th className="p-2 bg-zinc-100 dark:bg-white/[0.05] font-bold">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-white/[0.06] font-mono">
                <tr className="hover:bg-zinc-50 dark:hover:bg-white/[0.02]">
                  <td className="p-2 text-left font-sans font-bold text-zinc-800 dark:text-zinc-200">Declared Capacity</td>
                  <td>40</td><td>40</td><td>35</td><td>40</td><td>40</td><td>45</td>
                  <td>45</td><td>45</td><td>40</td><td>35</td><td>35</td><td>40</td>
                  <td className="bg-zinc-50 dark:bg-white/[0.03] font-bold text-zinc-900 dark:text-zinc-100">480</td>
                </tr>
                <tr className="hover:bg-zinc-50 dark:hover:bg-white/[0.02]">
                  <td className="p-2 text-left font-sans font-medium text-zinc-600 dark:text-zinc-400">Sales Demand Plan</td>
                  <td>38</td><td>42</td><td>30</td><td>35</td><td>48</td><td>52</td>
                  <td>44</td><td>40</td><td>36</td><td>30</td><td>28</td><td>32</td>
                  <td className="bg-zinc-50 dark:bg-white/[0.03] font-bold text-zinc-900 dark:text-zinc-100">455</td>
                </tr>
                <tr className="hover:bg-zinc-50 dark:hover:bg-white/[0.02]">
                  <td className="p-2 text-left font-sans font-bold text-[#714b67] dark:text-purple-300">Released Workload</td>
                  <td className="text-emerald-700 dark:text-emerald-400 font-bold">34.2</td>
                  <td className={`font-bold ${rebalancedNov ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30"}`}>
                    {rebalancedNov ? "40.0" : "44.8 *"}
                  </td>
                  <td className="text-emerald-700 dark:text-emerald-400 font-bold">28.0</td>
                  <td className="text-emerald-700 dark:text-emerald-400 font-bold">31.5</td>
                  <td className="text-zinc-400">-</td><td className="text-zinc-400">-</td>
                  <td className="text-zinc-400">-</td><td className="text-zinc-400">-</td>
                  <td className="text-zinc-400">-</td><td className="text-zinc-400">-</td>
                  <td className="text-zinc-400">-</td><td className="text-zinc-400">-</td>
                  <td className="bg-zinc-50 dark:bg-white/[0.03] font-bold text-zinc-800 dark:text-zinc-200">
                    {rebalancedNov ? "133.7" : "138.5"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Plant Load Notification banner */}
          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded text-xs text-amber-900 dark:text-amber-200 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Plant 01 Load Balancing:</strong>{" "}
                {rebalancedNov
                  ? "Load balanced across Pune & Vapi. November capacity within safe operating limits."
                  : "November released load (44.8 SCU) exceeds declared capacity (40 SCU) by 12%. Rebalance recommended."}
              </span>
            </div>

            {!rebalancedNov && (
              <button
                type="button"
                onClick={handleRebalanceQuota}
                className="bg-amber-800 hover:bg-amber-900 text-white font-semibold px-2.5 py-1 rounded text-[11px] transition active:scale-95 cursor-pointer"
              >
                Rebalance to Plant 02 (Vapi)
              </button>
            )}
          </div>
        </section>

        {/* ===================================================================== */}
        {/* 5. CROSS-DEPARTMENT HANDOFF & RECENT ACTIVITY STREAM                  */}
        {/* ===================================================================== */}
        <section className="bg-white dark:bg-[#141722] border border-[#d8dadd] dark:border-white/10 rounded shadow-xs p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-zinc-200 dark:border-white/10">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 font-mono">
                Recent Departmental Handoffs & Telemetry
              </h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Chronological record of requests moving across Marketing, Creative, Studio, SAMP, and Plant.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate("/sample-requests")}
              className="text-xs font-semibold text-[#017e84] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View All Requests</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="divide-y divide-zinc-100 dark:divide-white/[0.04]">
            {recentActivities.length > 0 ? (
              recentActivities.map((act) => (
                <div
                  key={act.id}
                  onClick={() => navigate("/sample-requests")}
                  className="py-2.5 flex items-center justify-between gap-3 hover:bg-zinc-50 dark:hover:bg-white/[0.02] px-2 rounded cursor-pointer transition"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="font-mono text-xs font-bold text-[#714b67] dark:text-purple-300 shrink-0">
                      {act.code}
                    </span>
                    <span className="text-zinc-300 dark:text-zinc-600 font-light">|</span>
                    <span className="text-xs text-zinc-800 dark:text-zinc-200 font-medium truncate">
                      {act.desc}
                    </span>
                    <span className="text-[11px] text-zinc-400 truncate hidden md:inline">
                      ({act.customer})
                    </span>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-zinc-100 text-zinc-700 dark:bg-white/[0.06] dark:text-zinc-300">
                      {act.stage}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-400 hidden sm:inline">
                      {act.time}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-xs text-zinc-400 font-mono">
                No recent activity records found in this cycle.
              </div>
            )}
          </div>
        </section>

      </div>
    </div>
  );
};

export default OperationsOverview;
