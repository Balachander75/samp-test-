import React, { useState, useEffect, useCallback, useMemo } from "react";
import { UserProfileInfo, DashboardLayout } from "@/features/dashboard";
import {
  fetchSampleRequestsApi,
  fetchProductDetailsApi,
  ProductDetailItem,
} from "@/features/sample-requests/api";
import { SampleRequestItem } from "@/features/sample-requests/types";
import { ProductSpecificationsDrawer } from "@/features/sample-requests/components/ProductSpecificationsDrawer";
import {
  DollarSign,
  TrendingUp,
  Layers,
  Clock,
  CheckCircle2,
  ArrowRight,
  Search,
  RefreshCw,
  FileText,
  Eye,
  X,
  Package,
  SlidersHorizontal,
  Download,
  Save,
  AlertCircle,
  Factory,
  Copy,
  Sparkles,
  Check,
  Tag,
  BarChart3,
} from "@/components/ui/icons";

export interface CostingWorkPageProps {
  user?: UserProfileInfo | null;
  onLogout?: () => void;
}

type FilterSection = "all" | "pending" | "high_volume" | "approved";
type StatusFilter = "all" | "in_progress" | "done";

interface WorkDoneState {
  done: boolean;
  progressPct: number;
}

export interface CostBreakdownItem {
  substrateCost: number; // Paper / Board
  printingCost: number;  // Inks, plates, press time
  finishingCost: number; // Foil, UV, lamination, die-cutting
  bindingCost: number;   // Case, Wire-O, Stitch, Perfect
  packagingCost: number; // Shrink, box, master carton
  freightCost: number;   // Transport / Logistics factor
  marginPct: number;     // e.g. 20 for 20%
  notes?: string;
  isApproved?: boolean;
  lastUpdated?: string;
}

interface StoredCostData {
  [reqId: string]: CostBreakdownItem;
}

// Check if request belongs to Costing purview
function isCostingPool(req: SampleRequestItem): boolean {
  const s = (req.status || "").toLowerCase();
  const hasCostType = Boolean(req.requestTypes?.includes("costing"));
  const hasQty = Boolean(req.qtyDesignCosting);
  // All sample requests generally need costing, but we include any request that has commercial quantity,
  // costing request type, or active commercial stages
  return hasCostType || hasQty || s.includes("cost") || s.includes("deal") || !s.includes("draft");
}

function isHighVolume(req: SampleRequestItem): boolean {
  const qty = Number(req.qtyDesignCosting || 0);
  return qty >= 50000;
}

function formatCurrency(val: number, currency = "₹"): string {
  if (val >= 10000000) {
    return `${currency}${(val / 10000000).toFixed(2)} Cr`;
  }
  if (val >= 100000) {
    return `${currency}${(val / 100000).toFixed(2)} Lakh`;
  }
  return `${currency}${val.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

// Generate sensible default BOM for a product based on its description & type
function getDefaultBOM(req: SampleRequestItem): CostBreakdownItem {
  const desc = (req.productDescription || "").toLowerCase();
  const isCasebound = desc.includes("case") || desc.includes("hardcover");
  const isWireO = desc.includes("wire") || desc.includes("spiral");
  const isPortfolio = desc.includes("portfolio") || desc.includes("folder");

  let substrate = 28.5;
  let printing = 8.2;
  let finishing = 6.5;
  let binding = 12.0;
  let packaging = 3.8;
  let freight = 2.0;

  if (isCasebound) {
    substrate = 38.0;
    printing = 11.5;
    finishing = 9.0;
    binding = 22.0;
    packaging = 5.5;
    freight = 3.5;
  } else if (isWireO) {
    substrate = 24.0;
    printing = 7.5;
    finishing = 5.0;
    binding = 14.5;
    packaging = 3.5;
    freight = 2.2;
  } else if (isPortfolio) {
    substrate = 42.0;
    printing = 14.0;
    finishing = 12.5;
    binding = 18.0;
    packaging = 6.0;
    freight = 4.0;
  }

  return {
    substrateCost: substrate,
    printingCost: printing,
    finishingCost: finishing,
    bindingCost: binding,
    packagingCost: packaging,
    freightCost: freight,
    marginPct: 22,
    notes: "Default standard manufacturing estimation based on item profile.",
    isApproved: false,
  };
}

function calculateTotals(bom: CostBreakdownItem, runQty: number) {
  const subtotalCOP =
    bom.substrateCost +
    bom.printingCost +
    bom.finishingCost +
    bom.bindingCost +
    bom.packagingCost +
    bom.freightCost;

  const marginMultiplier = 1 + (bom.marginPct || 0) / 100;
  const unitSellingPrice = Math.round(subtotalCOP * marginMultiplier * 100) / 100;
  const totalProductionValue = Math.round(unitSellingPrice * runQty);

  return {
    cop: Math.round(subtotalCOP * 100) / 100,
    unitPrice: unitSellingPrice,
    totalValue: totalProductionValue,
  };
}

function CostingContent({ user }: { user?: UserProfileInfo | null }) {
  const [requests, setRequests] = useState<SampleRequestItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filterSection, setFilterSection] = useState<FilterSection>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Drawer & Modal state
  const [selectedRequest, setSelectedRequest] = useState<SampleRequestItem | null>(null);
  const [specsDetails, setSpecsDetails] = useState<ProductDetailItem[]>([]);
  const [isLoadingSpecs, setIsLoadingSpecs] = useState(false);

  // BOM Estimator Modal state
  const [estimatingRequest, setEstimatingRequest] = useState<SampleRequestItem | null>(null);
  const [currentBOM, setCurrentBOM] = useState<CostBreakdownItem | null>(null);

  // Toast message
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Local Work Done state persistence
  const [workDoneOverrides, setWorkDoneOverrides] = useState<Record<string, WorkDoneState>>(() => {
    try {
      return JSON.parse(localStorage.getItem("costing_work_done_overrides") || "{}");
    } catch {
      return {};
    }
  });

  // Stored Cost Breakdown persistence
  const [storedCosts, setStoredCosts] = useState<StoredCostData>(() => {
    try {
      return JSON.parse(localStorage.getItem("costing_rates_overrides") || "{}");
    } catch {
      return {};
    }
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const saveWorkDone = (id: string, state: WorkDoneState) => {
    setWorkDoneOverrides((prev) => {
      const next = { ...prev, [id]: state };
      try {
        localStorage.setItem("costing_work_done_overrides", JSON.stringify(next));
      } catch { }
      return next;
    });
  };

  const saveCostData = (id: string, bom: CostBreakdownItem) => {
    setStoredCosts((prev) => {
      const next = { ...prev, [id]: bom };
      try {
        localStorage.setItem("costing_rates_overrides", JSON.stringify(next));
      } catch { }
      return next;
    });
  };

  const load = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const all = await fetchSampleRequestsApi();
      setRequests(all.filter(isCostingPool));
    } catch {
      /* silent */
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const getWorkDone = useCallback(
    (r: SampleRequestItem): WorkDoneState => {
      if (workDoneOverrides[r.id]) return workDoneOverrides[r.id];
      const costItem = storedCosts[r.id];
      if (costItem?.isApproved) return { done: true, progressPct: 100 };
      const s = (r.status || "").toLowerCase();
      if (s.includes("dispatch") || s.includes("closed") || s.includes("deal") || s.includes("approved")) {
        return { done: true, progressPct: 100 };
      }
      if (s.includes("plant") || s.includes("execution")) return { done: false, progressPct: 75 };
      if (s.includes("qc") || s.includes("review")) return { done: false, progressPct: 50 };
      return { done: false, progressPct: 30 };
    },
    [workDoneOverrides, storedCosts]
  );

  const handleToggleWorkDone = (req: SampleRequestItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const cur = getWorkDone(req);
    const newState = { done: !cur.done, progressPct: !cur.done ? 100 : 40 };
    saveWorkDone(req.id, newState);

    // Also toggle approval in stored costs if exists
    const existingBOM = storedCosts[req.id] || getDefaultBOM(req);
    saveCostData(req.id, {
      ...existingBOM,
      isApproved: !cur.done,
      lastUpdated: new Date().toISOString(),
    });

    showToast(
      !cur.done
        ? `${req.srNumber} marked as Commercial Work Done!`
        : `${req.srNumber} set back to Active Estimation.`
    );
  };

  const handleOpenSpecs = async (req: SampleRequestItem) => {
    setSelectedRequest(req);
    setIsLoadingSpecs(true);
    try {
      const details = await fetchProductDetailsApi(Number(req.id), false);
      setSpecsDetails(details);
    } catch {
      setSpecsDetails([]);
    } finally {
      setIsLoadingSpecs(false);
    }
  };

  const handleOpenEstimator = (req: SampleRequestItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEstimatingRequest(req);
    const bom = storedCosts[req.id] || getDefaultBOM(req);
    setCurrentBOM(bom);
  };

  const handleSaveEstimator = () => {
    if (!estimatingRequest || !currentBOM) return;
    saveCostData(estimatingRequest.id, {
      ...currentBOM,
      lastUpdated: new Date().toISOString(),
    });

    if (currentBOM.isApproved) {
      saveWorkDone(estimatingRequest.id, { done: true, progressPct: 100 });
    }

    showToast(`BOM & Commercial Pricing saved for ${estimatingRequest.srNumber}`);
    setEstimatingRequest(null);
  };

  // Sections
  const pendingRequests = useMemo(
    () => requests.filter((r) => !getWorkDone(r).done),
    [requests, getWorkDone]
  );

  const highVolumeRequests = useMemo(
    () => requests.filter(isHighVolume),
    [requests]
  );

  const approvedRequests = useMemo(
    () => requests.filter((r) => getWorkDone(r).done),
    [requests, getWorkDone]
  );

  // Aggregate stats
  const stats = useMemo(() => {
    let allDone = 0,
      pendDone = 0,
      hvDone = 0,
      apprDone = 0;

    requests.forEach((r) => {
      if (getWorkDone(r).done) allDone++;
    });
    pendingRequests.forEach((r) => {
      if (getWorkDone(r).done) pendDone++;
    });
    highVolumeRequests.forEach((r) => {
      if (getWorkDone(r).done) hvDone++;
    });
    approvedRequests.forEach((r) => {
      if (getWorkDone(r).done) apprDone++;
    });

    const pct = (d: number, t: number) => (t > 0 ? Math.round((d / t) * 100) : 0);

    return {
      all: { total: requests.length, done: allDone, pctDone: pct(allDone, requests.length) },
      pending: { total: pendingRequests.length, done: pendDone, pctDone: pct(pendDone, pendingRequests.length) },
      high_volume: { total: highVolumeRequests.length, done: hvDone, pctDone: pct(hvDone, highVolumeRequests.length) },
      approved: { total: approvedRequests.length, done: apprDone, pctDone: pct(apprDone, approvedRequests.length) },
    };
  }, [requests, pendingRequests, highVolumeRequests, approvedRequests, getWorkDone]);

  // Overall financial totals
  const overallMetrics = useMemo(() => {
    let totalUnits = 0;
    let totalEstValue = 0;

    requests.forEach((req) => {
      const qty = Number(req.qtyDesignCosting || 10000);
      totalUnits += qty;
      const bom = storedCosts[req.id] || getDefaultBOM(req);
      const totals = calculateTotals(bom, qty);
      totalEstValue += totals.totalValue;
    });

    return {
      totalUnits,
      totalEstValue,
      avgBatchSize: requests.length > 0 ? Math.round(totalUnits / requests.length) : 0,
    };
  }, [requests, storedCosts]);

  const cards = [
    {
      id: "all" as FilterSection,
      title: "Costing Queue",
      subtitle: "All Commercial Runs",
      count: stats.all.total,
      done: stats.all.done,
      pctDone: stats.all.pctDone,
      tagText: `${stats.all.pctDone}% Done`,
      icon: Layers,
      iconBg: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/70 dark:text-emerald-400 border border-emerald-200/70 dark:border-emerald-900/60",
      topBar: "bg-emerald-500",
      barColor: "bg-gradient-to-r from-emerald-500 to-teal-500",
      textColor: "text-emerald-600 dark:text-emerald-400",
      selectedRing: "border-emerald-500 ring-2 ring-emerald-500/25 shadow-card-hover bg-emerald-50/20 dark:bg-emerald-950/20",
    },
    {
      id: "pending" as FilterSection,
      title: "Pending Estimation",
      subtitle: "BOM In Review",
      count: stats.pending.total,
      done: stats.pending.done,
      pctDone: stats.pending.pctDone,
      tagText: `${stats.pending.total} Active`,
      icon: Clock,
      iconBg: "bg-amber-50 text-amber-600 dark:bg-amber-950/70 dark:text-amber-400 border border-amber-200/70 dark:border-amber-900/60",
      topBar: "bg-amber-500",
      barColor: "bg-gradient-to-r from-amber-500 to-orange-500",
      textColor: "text-amber-600 dark:text-amber-400",
      selectedRing: "border-amber-500 ring-2 ring-amber-500/25 shadow-card-hover bg-amber-50/20 dark:bg-amber-950/20",
    },
    {
      id: "high_volume" as FilterSection,
      title: "Volume Runs (≥50k)",
      subtitle: "Plant Tariff Scale",
      count: stats.high_volume.total,
      done: stats.high_volume.done,
      pctDone: stats.high_volume.pctDone,
      tagText: `${stats.high_volume.pctDone}% Done`,
      icon: TrendingUp,
      iconBg: "bg-cyan-50 text-cyan-600 dark:bg-cyan-950/70 dark:text-cyan-400 border border-cyan-200/70 dark:border-cyan-900/60",
      topBar: "bg-cyan-500",
      barColor: "bg-gradient-to-r from-cyan-500 to-blue-600",
      textColor: "text-cyan-600 dark:text-cyan-400",
      selectedRing: "border-cyan-500 ring-2 ring-cyan-500/25 shadow-card-hover bg-cyan-50/20 dark:bg-cyan-950/20",
    },
    {
      id: "approved" as FilterSection,
      title: "Commercial Approved",
      subtitle: "Quote Ready",
      count: stats.approved.total,
      done: stats.approved.done,
      pctDone: 100,
      tagText: "Approved",
      icon: CheckCircle2,
      iconBg: "bg-teal-50 text-teal-600 dark:bg-teal-950/70 dark:text-teal-400 border border-teal-200/70 dark:border-teal-900/60",
      topBar: "bg-teal-500",
      barColor: "bg-gradient-to-r from-teal-500 to-emerald-600",
      textColor: "text-teal-600 dark:text-teal-400",
      selectedRing: "border-teal-500 ring-2 ring-teal-500/25 shadow-card-hover bg-teal-50/20 dark:bg-teal-950/20",
    },
  ];

  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      if (filterSection === "pending" && getWorkDone(r).done) return false;
      if (filterSection === "high_volume" && !isHighVolume(r)) return false;
      if (filterSection === "approved" && !getWorkDone(r).done) return false;

      const { done } = getWorkDone(r);
      if (statusFilter === "done" && !done) return false;
      if (statusFilter === "in_progress" && done) return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return (
          (r.srNumber || "").toLowerCase().includes(q) ||
          (r.productDescription || "").toLowerCase().includes(q) ||
          (r.customer || "").toLowerCase().includes(q) ||
          (r.materialCode || "").toLowerCase().includes(q) ||
          (r.targetPlant || "").toLowerCase().includes(q) ||
          (r.brandName || "").toLowerCase().includes(q) ||
          (r.programName || "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [requests, filterSection, statusFilter, searchTerm, getWorkDone]);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleExportSummary = () => {
    const rows = filteredRequests.map((r) => {
      const qty = Number(r.qtyDesignCosting || 0);
      return `${r.srNumber}\t${r.productDescription?.split("\n")[0]}\t${r.customer}\t${qty}\t${getWorkDone(r).done ? "Approved" : "In Progress"}`;
    });
    const header = "SR Number\tProduct\tCustomer\tRun Qty\tCosting Status";
    copyToClipboard([header, ...rows].join("\n"), "export");
    showToast("Commercial summary copied to clipboard in TSV format!");
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-[160] flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-emerald-600 text-white shadow-xl shadow-emerald-600/30 text-xs font-semibold animate-in slide-in-from-top-4 duration-200 max-w-sm">
          <CheckCircle2 size={16} className="stroke-[3] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Dark gradient header banner — matches Creative & SAMP Work */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 rounded-2xl bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-950 text-white p-4 sm:p-5 shadow-lg shadow-emerald-950/20 border border-emerald-800/40">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="h-8 w-8 rounded-xl bg-emerald-500/30 text-emerald-300 border border-emerald-400/40 flex items-center justify-center">
              <DollarSign size={16} className="stroke-[2.5]" />
            </div>
            <h1 className="text-base sm:text-lg font-bold tracking-tight">
              Costing Team & Commercial Estimation
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
              {requests.length} Requests
            </span>
            {pendingRequests.length > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/25 text-amber-200 border border-amber-400/30 animate-pulse">
                {pendingRequests.length} Pending Estimation
              </span>
            )}
          </div>
          <p className="text-xs text-emerald-200/80">
            {user?.name ? `Welcome, ${user.name} — ` : ""}
            Calculate raw material BOMs, machine press tariffs, finishing costs, and commercial selling prices.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            onClick={handleExportSummary}
            className="h-9 px-3.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-xs inline-flex items-center gap-1.5 transition-all cursor-pointer"
            title="Export summary to clipboard"
          >
            {copiedKey === "export" ? (
              <>
                <Check size={13} className="text-emerald-400" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Download size={13} />
                <span>Export TSV</span>
              </>
            )}
          </button>
          <button
            onClick={load}
            disabled={isRefreshing}
            className="h-9 px-3.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-xs inline-flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-60"
          >
            <RefreshCw size={13} className={isRefreshing ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 4 Clickable KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {cards.map((c) => {
          const isSelected = filterSection === c.id;
          const Icon = c.icon;
          const inProgress = c.count - c.done;
          return (
            <div
              key={c.id}
              role="button"
              tabIndex={0}
              onClick={() => setFilterSection(c.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setFilterSection(c.id);
                }
              }}
              className={`group relative p-4 rounded-2xl cursor-pointer transition-all border overflow-hidden outline-none select-none ${isSelected
                  ? c.selectedRing
                  : "bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/40 dark:hover:bg-slate-850/40 shadow-sm hover:shadow-md hover:-translate-y-0.5"
                }`}
            >
              {isSelected && <div className={`absolute top-0 left-0 right-0 h-1 ${c.topBar}`} />}

              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${c.iconBg}`}>
                    <Icon size={14} className="stroke-[2.2]" />
                  </div>
                  <span
                    className={`text-[11px] font-bold uppercase tracking-wider truncate ${isSelected
                        ? "text-slate-900 dark:text-white"
                        : "text-slate-600 dark:text-slate-400 group-hover:text-slate-800"
                      }`}
                  >
                    {c.title}
                  </span>
                </div>
                <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 shrink-0">
                  {c.tagText}
                </span>
              </div>

              <div className="mt-3 flex items-baseline justify-between gap-2">
                <p className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 dark:text-slate-100 tracking-tight">
                  {c.count.toLocaleString()}
                </p>
                <span className={`text-[11px] font-semibold truncate ${c.textColor}`}>{c.subtitle}</span>
              </div>

              <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-medium">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <CheckCircle2 size={11} className="text-emerald-500" />
                    <strong className="text-slate-800 dark:text-slate-200">{c.done}</strong> Done
                  </span>
                  <span className="text-slate-400 dark:text-slate-500">{inProgress} Active</span>
                </div>
                <div className="w-full rounded-full h-1.5 bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className={`h-1.5 rounded-full transition-all duration-300 ${c.barColor}`}
                    style={{ width: `${Math.min(c.pctDone, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Request & Costing Table */}
      <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3.5 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center shrink-0">
              <FileText size={17} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                  {filterSection === "all"
                    ? "All Commercial Costing Requests"
                    : filterSection === "pending"
                      ? "Requests Pending Costing Review"
                      : filterSection === "high_volume"
                        ? "High Volume Production Requests (≥50k)"
                        : "Commercial Approved & Released Requests"}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  {filteredRequests.length}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Inspect BOM breakdowns, adjust tariffs and margins, and finalize quotes.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="relative w-full sm:w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search requests, customer, plant..."
                className="h-9 w-full pl-9 pr-7 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold">
              {(["all", "in_progress", "done"] as StatusFilter[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${statusFilter === s
                      ? s === "done"
                        ? "bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs font-bold"
                        : "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs font-bold"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                    }`}
                >
                  {s === "all" ? "All Status" : s === "in_progress" ? "Active" : "Work Done"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table Content */}
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-400 animate-pulse">
            Loading commercial costing pipeline...
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
              <DollarSign size={24} />
            </div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No costing requests found</h3>
            <p className="text-xs text-slate-500">
              {searchTerm ? `No requests match "${searchTerm}".` : "No requests for this filter view."}
            </p>
            {(searchTerm || statusFilter !== "all" || filterSection !== "all") && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                  setFilterSection("all");
                }}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 cursor-pointer shadow-xs"
              >
                Reset all filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-850/50 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="py-3 px-4">Request # & Date</th>
                  <th className="py-3 px-4">Product & Specs</th>
                  <th className="py-3 px-4">Customer & Plant</th>
                  <th className="py-3 px-4">Run Quantity</th>
                  <th className="py-3 px-4">Costing Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredRequests.map((req) => {
                  const workDone = getWorkDone(req);
                  const runQty = Number(req.qtyDesignCosting || 10000);
                  const isCostReq = Boolean(req.requestTypes?.includes("costing"));
                  const isHV = isHighVolume(req);

                  return (
                    <tr
                      key={req.id}
                      onClick={() => handleOpenSpecs(req)}
                      className="group hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                    >
                      {/* SR # & Date */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs">
                            {req.srNumber || req.id}
                          </span>
                          {isCostReq && (
                            <span
                              className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                              title="Explicit Costing Deliverable Requested"
                            >
                              Costing
                            </span>
                          )}
                          {isHV && (
                            <span
                              className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-800"
                              title="High Volume Order (≥50k)"
                            >
                              ≥50k
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] font-sans font-medium text-slate-400 mt-0.5">
                          {req.dateRequestCreated || "—"}
                        </p>
                      </td>

                      {/* Product & Specs */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">
                          {req.productDescription?.split("\n")[0] || "—"}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400 font-mono">
                          <span>{req.materialCode || "NEW-SPEC"}</span>
                          {req.productType && (
                            <>
                              <span>•</span>
                              <span className="text-slate-500 font-sans">{req.productType}</span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Customer & Plant */}
                      <td className="py-3.5 px-4 min-w-[150px]">
                        <p className="font-bold text-slate-900 dark:text-slate-100 truncate">
                          {req.customer || "—"}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-slate-500">
                          <Factory size={11} className="text-slate-400 shrink-0" />
                          <span className="truncate">{req.targetPlant || "Unassigned"}</span>
                        </div>
                      </td>

                      {/* Run Quantity */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="space-y-0.5">
                          <p className="font-mono font-bold text-slate-800 dark:text-slate-200">
                            {runQty.toLocaleString()} <span className="text-[10px] font-sans font-normal text-slate-400">units</span>
                          </p>
                          <span className="inline-block text-[10px] text-slate-400">
                            {req.unitPcPack || "Standard pack"}
                          </span>
                        </div>
                      </td>

                      {/* Costing Status & Work Done */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${workDone.done
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
                                  : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800"
                                }`}
                            >
                              {workDone.done ? (
                                <>
                                  <CheckCircle2 size={11} className="stroke-[2.5]" />
                                  <span>Approved (100%)</span>
                                </>
                              ) : (
                                <>
                                  <Clock size={11} />
                                  <span>Active ({workDone.progressPct}%)</span>
                                </>
                              )}
                            </span>
                            <button
                              onClick={(e) => handleToggleWorkDone(req, e)}
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border transition-all cursor-pointer ${workDone.done
                                  ? "bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
                                  : "bg-emerald-600 hover:bg-emerald-700 text-white border-transparent shadow-xs"
                                }`}
                            >
                              {workDone.done ? "Undo" : "Approve"}
                            </button>
                          </div>
                          <div className="w-28 rounded-full h-1 bg-slate-100 dark:bg-slate-800 overflow-hidden">
                            <div
                              className={`h-1 rounded-full transition-all duration-300 ${workDone.done
                                  ? "bg-emerald-500"
                                  : "bg-gradient-to-r from-emerald-500 to-teal-500"
                                }`}
                              style={{ width: `${workDone.progressPct}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={(e) => handleOpenEstimator(req, e)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors cursor-pointer"
                            title="Open BOM & Cost Calculator"
                          >
                            <DollarSign size={12} />
                            <span>BOM</span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenSpecs(req);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-750 transition-colors cursor-pointer"
                            title="View Product Specs"
                          >
                            <Eye size={12} />
                            <span>Specs</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Interactive BOM & Cost Breakdown Estimator Modal */}
      {estimatingRequest && currentBOM && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 text-white">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/25 border border-emerald-400/40 text-emerald-300 flex items-center justify-center">
                  <DollarSign size={16} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm sm:text-base font-bold text-white">
                      BOM & Commercial Cost Estimator
                    </h3>
                    <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                      {estimatingRequest.srNumber}
                    </span>
                  </div>
                  <p className="text-xs text-emerald-200/80 line-clamp-1">
                    {estimatingRequest.productDescription?.split("\n")[0]}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEstimatingRequest(null)}
                className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition-all"
              >
                <X size={15} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-5 text-xs flex-1">
              {/* Order Context Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200/70 dark:border-slate-800">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Customer</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {estimatingRequest.customer || "—"}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Target Plant</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {estimatingRequest.targetPlant || "—"}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Run Quantity</span>
                  <p className="font-mono font-bold text-slate-900 dark:text-slate-100">
                    {Number(estimatingRequest.qtyDesignCosting || 10000).toLocaleString()} units
                  </p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Sample Date</span>
                  <p className="font-medium text-slate-700 dark:text-slate-300">
                    {estimatingRequest.sampleRequiredDate || "Not set"}
                  </p>
                </div>
              </div>

              {/* BOM Breakdown Inputs */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <SlidersHorizontal size={13} className="text-emerald-500" />
                  <span>Cost Components Breakdown (₹ per unit)</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Paper / Substrate */}
                  <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="font-semibold text-slate-800 dark:text-slate-200">
                        1. Paper & Board Substrate
                      </label>
                      <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                        ₹{currentBOM.substrateCost.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">Inner text paper, cover board, GSM basis</p>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={currentBOM.substrateCost}
                      onChange={(e) =>
                        setCurrentBOM({ ...currentBOM, substrateCost: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full h-8 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono text-xs outline-none focus:border-emerald-500"
                    />
                  </div>

                  {/* Printing & Pre-press */}
                  <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="font-semibold text-slate-800 dark:text-slate-200">
                        2. Printing & Pre-press
                      </label>
                      <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                        ₹{currentBOM.printingCost.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">Plate setup, 4-color press, ink consumption</p>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={currentBOM.printingCost}
                      onChange={(e) =>
                        setCurrentBOM({ ...currentBOM, printingCost: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full h-8 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono text-xs outline-none focus:border-emerald-500"
                    />
                  </div>

                  {/* Binding & Assembly */}
                  <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="font-semibold text-slate-800 dark:text-slate-200">
                        3. Binding & Assembly
                      </label>
                      <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                        ₹{currentBOM.bindingCost.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">Case binding, Wire-O, folding, thread sewing</p>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={currentBOM.bindingCost}
                      onChange={(e) =>
                        setCurrentBOM({ ...currentBOM, bindingCost: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full h-8 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono text-xs outline-none focus:border-emerald-500"
                    />
                  </div>

                  {/* Surface Finishing */}
                  <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="font-semibold text-slate-800 dark:text-slate-200">
                        4. Surface Finishing
                      </label>
                      <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                        ₹{currentBOM.finishingCost.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">Spot UV, foil stamping, matte lamination, embossing</p>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={currentBOM.finishingCost}
                      onChange={(e) =>
                        setCurrentBOM({ ...currentBOM, finishingCost: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full h-8 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono text-xs outline-none focus:border-emerald-500"
                    />
                  </div>

                  {/* Packaging */}
                  <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="font-semibold text-slate-800 dark:text-slate-200">
                        5. Unit & Outer Packaging
                      </label>
                      <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                        ₹{currentBOM.packagingCost.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">Shrink wrap, belly band, master corrugated carton</p>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={currentBOM.packagingCost}
                      onChange={(e) =>
                        setCurrentBOM({ ...currentBOM, packagingCost: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full h-8 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono text-xs outline-none focus:border-emerald-500"
                    />
                  </div>

                  {/* Freight & Logistics */}
                  <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="font-semibold text-slate-800 dark:text-slate-200">
                        6. Plant Freight & Logistics
                      </label>
                      <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                        ₹{currentBOM.freightCost.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">Factory gate to port / warehouse loading</p>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={currentBOM.freightCost}
                      onChange={(e) =>
                        setCurrentBOM({ ...currentBOM, freightCost: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full h-8 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono text-xs outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Commercial Margin & Notes */}
              <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      Commercial Markup / Gross Margin
                    </span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Target commercial margin for quote submission
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={currentBOM.marginPct}
                      onChange={(e) =>
                        setCurrentBOM({ ...currentBOM, marginPct: parseFloat(e.target.value) || 0 })
                      }
                      className="w-16 h-8 text-center font-mono font-bold rounded-lg border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400"
                    />
                    <span className="font-bold text-emerald-700 dark:text-emerald-400">%</span>
                  </div>
                </div>

                <input
                  type="range"
                  min="5"
                  max="50"
                  step="1"
                  value={currentBOM.marginPct}
                  onChange={(e) =>
                    setCurrentBOM({ ...currentBOM, marginPct: parseInt(e.target.value, 10) })
                  }
                  className="w-full accent-emerald-600 cursor-pointer"
                />

                <div className="pt-2">
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                    Estimation Remarks & Tariff Notes
                  </label>
                  <input
                    type="text"
                    value={currentBOM.notes || ""}
                    onChange={(e) => setCurrentBOM({ ...currentBOM, notes: e.target.value })}
                    placeholder="e.g. Valid for 60 days, FOB Nhava Sheva, based on current kraft paper index"
                    className="w-full h-8 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Real-time Calculation Summary Box */}
              {(() => {
                const runQty = Number(estimatingRequest.qtyDesignCosting || 10000);
                const totals = calculateTotals(currentBOM, runQty);
                return (
                  <div className="p-4 rounded-xl bg-gradient-to-r from-slate-900 to-emerald-950 text-white space-y-3 shadow-md">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                      <span className="text-slate-300">Total Factory COP (Cost of Production):</span>
                      <span className="font-mono text-sm font-semibold">₹{totals.cop.toFixed(2)} / pc</span>
                    </div>

                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                      <span className="text-slate-300">Commercial Selling Price (+{currentBOM.marginPct}%):</span>
                      <span className="font-mono text-base font-bold text-emerald-400">
                        ₹{totals.unitPrice.toFixed(2)} / pc
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-slate-200 font-semibold">
                        Total Batch Commercial Value ({runQty.toLocaleString()} units):
                      </span>
                      <span className="font-mono text-lg font-bold text-emerald-300">
                        {formatCurrency(totals.totalValue)}
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-between gap-3">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={Boolean(currentBOM.isApproved)}
                  onChange={(e) => setCurrentBOM({ ...currentBOM, isApproved: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                />
                <span className="font-semibold text-slate-700 dark:text-slate-300 text-xs">
                  Mark as Approved / Final Quote
                </span>
              </label>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEstimatingRequest(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEstimator}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-md shadow-emerald-600/25 cursor-pointer transition-all"
                >
                  <Save size={13} />
                  <span>Save Estimation</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Product Specifications Drawer */}
      {selectedRequest && (
        <ProductSpecificationsDrawer
          product={selectedRequest}
          details={specsDetails}
          isLoading={isLoadingSpecs}
          specMode="view"
          allowEdit={false}
          onClose={() => {
            setSelectedRequest(null);
            setSpecsDetails([]);
          }}
        />
      )}
    </div>
  );
}

export const CostingWorkPage: React.FC<CostingWorkPageProps> = ({ user, onLogout }) => (
  <DashboardLayout
    user={user}
    onLogout={onLogout}
    title="Costing Team"
    subtitle="BOM costing, material rate lookups, manufacturing tariffs, and commercial quotes."
  >
    <CostingContent user={user} />
  </DashboardLayout>
);

export default CostingWorkPage;

