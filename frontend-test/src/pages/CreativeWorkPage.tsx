import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { UserProfileInfo, DashboardLayout } from "@/features/dashboard";
import {
  fetchSampleRequestsApi,
  fetchDesignRequestsApi,
  mapDesignRequestToSampleRequest,
  fetchProductDetailsApi,
  updateDesignRequestStatusApi,
  updateSampleRequestApi,
  ProductDetailItem,
} from "@/features/sample-requests/api";
import { SampleRequestItem } from "@/features/sample-requests/types";
import { ProductSpecificationsDrawer } from "@/features/sample-requests/components/ProductSpecificationsDrawer";
import {
  Palette,
  Camera,
  Package,
  Layers,
  Search,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles,
  Filter,
  Check,
  Eye,
  RefreshCw,
  FileText,
  X,
  Copy,
  ChevronRight,
  TrendingUp,
} from "@/components/ui/icons";

export interface CreativeWorkPageProps {
  user?: UserProfileInfo | null;
  onLogout?: () => void;
}

type FilterSection = "all" | "design" | "mockup" | "sample";
type StatusFilter = "all" | "in_progress" | "done" | "pending";

interface WorkDoneState {
  done: boolean;
  progressPct: number;
}

export const CreativeWorkPage: React.FC<CreativeWorkPageProps> = ({ user, onLogout }) => {
  const navigate = useNavigate();

  // Requests state
  const [requests, setRequests] = useState<SampleRequestItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters state
  const [filterSection, setFilterSection] = useState<FilterSection>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Drawer / Inspection state
  const [selectedRequest, setSelectedRequest] = useState<SampleRequestItem | null>(null);
  const [specsDetails, setSpecsDetails] = useState<ProductDetailItem[]>([]);
  const [isLoadingSpecs, setIsLoadingSpecs] = useState(false);

  // Toast message
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Local Work Done state persistence
  const [workDoneOverrides, setWorkDoneOverrides] = useState<Record<string, WorkDoneState>>(() => {
    try {
      const saved = localStorage.getItem("creative_work_done_overrides");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const saveWorkDoneOverride = (reqId: string, newState: WorkDoneState) => {
    setWorkDoneOverrides((prev) => {
      const updated = { ...prev, [reqId]: newState };
      try {
        localStorage.setItem("creative_work_done_overrides", JSON.stringify(updated));
      } catch (err) {
        console.error("Failed to persist creative progress:", err);
      }
      return updated;
    });
  };

  // Load all creative requests
  const loadRequests = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const [sampleRequests, designRequests] = await Promise.all([
        fetchSampleRequestsApi(),
        fetchDesignRequestsApi(),
      ]);

      const all = [
        ...sampleRequests,
        ...designRequests.map(mapDesignRequestToSampleRequest),
      ].sort((a, b) => {
        const dateA = new Date(a.createdAt || a.dateRequestCreated || 0).getTime();
        const dateB = new Date(b.createdAt || b.dateRequestCreated || 0).getTime();
        return dateB - dateA;
      });

      // Filter to relevant creative work:
      // Includes:
      // 1. All design requests
      // 2. All requests currently in 'Creative' status
      // 3. All requests with 'design', 'mockup', or 'sample' deliverables in workflow
      const creativePool = all.filter((r) => {
        const s = (r.status || "").toLowerCase();
        if (r.requestKind === "design") return true;
        if (s.includes("creative")) return true;
        if (r.requestTypes && r.requestTypes.some((t) => ["design", "mockup", "sample"].includes(t))) {
          return true;
        }
        // If not in draft, it has passed into active stages
        return !s.includes("draft") && !s.includes("smt");
      });

      setRequests(creativePool);
    } catch (err) {
      console.error("Failed to load creative requests:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  // Helper to check deliverable membership
  const isDesignRequest = (r: SampleRequestItem) =>
    r.requestKind === "design" ||
    Boolean(r.requestTypes?.includes("design")) ||
    (r.materialCode || "").startsWith("DESIGN-") ||
    (r.srNumber || "").startsWith("DR-");

  const isMockupRequest = (r: SampleRequestItem) =>
    Boolean(r.requestTypes?.includes("mockup")) ||
    (r.mockupRequired || "").toLowerCase() === "yes";

  const isSamplingRequest = (r: SampleRequestItem) =>
    Boolean(r.requestTypes?.includes("sample")) ||
    r.requestKind !== "design";

  // Calculate work done for an item
  const getRequestWorkDone = useCallback(
    (r: SampleRequestItem): WorkDoneState => {
      if (workDoneOverrides[r.id]) {
        return workDoneOverrides[r.id];
      }
      const s = (r.status || "").toLowerCase();
      // Completed stages beyond creative
      if (
        s.includes("studio") ||
        s.includes("samp") ||
        s.includes("plant") ||
        s.includes("dispatch") ||
        s.includes("deal") ||
        s.includes("closed") ||
        s.includes("approved")
      ) {
        return { done: true, progressPct: 100 };
      }
      if (s.includes("creative")) {
        return { done: false, progressPct: 55 };
      }
      return { done: false, progressPct: 20 };
    },
    [workDoneOverrides]
  );

  // Toggle Work Done on a request
  const handleToggleWorkDone = (req: SampleRequestItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const current = getRequestWorkDone(req);
    const newDone = !current.done;
    const newState: WorkDoneState = {
      done: newDone,
      progressPct: newDone ? 100 : 50,
    };
    saveWorkDoneOverride(req.id, newState);
    showToast(
      newDone
        ? `Marked ${req.srNumber || req.materialCode} creative work as Completed!`
        : `Marked ${req.srNumber || req.materialCode} back to In Progress.`
    );
  };

  // Open Specs / Brief Drawer
  const handleOpenSpecs = async (prod: SampleRequestItem) => {
    setSelectedRequest(prod);
    setIsLoadingSpecs(true);
    try {
      if (prod.requestKind !== "design" && !prod.srNumber.startsWith("DR-")) {
        const details = await fetchProductDetailsApi(Number(prod.id), false);
        setSpecsDetails(details);
      } else {
        setSpecsDetails([]);
      }
    } catch {
      setSpecsDetails([]);
    } finally {
      setIsLoadingSpecs(false);
    }
  };

  // Calculate Section Statistics (The 4 Boxes)
  const stats = useMemo(() => {
    const allTotal = requests.length;
    let allDone = 0;

    let designTotal = 0;
    let designDone = 0;

    let mockupTotal = 0;
    let mockupDone = 0;

    let sampleTotal = 0;
    let sampleDone = 0;

    requests.forEach((r) => {
      const { done } = getRequestWorkDone(r);
      if (done) allDone++;

      if (isDesignRequest(r)) {
        designTotal++;
        if (done) designDone++;
      }
      if (isMockupRequest(r)) {
        mockupTotal++;
        if (done) mockupDone++;
      }
      if (isSamplingRequest(r)) {
        sampleTotal++;
        if (done) sampleDone++;
      }
    });

    const getPct = (done: number, total: number) =>
      total > 0 ? Math.round((done / total) * 100) : 0;

    return {
      all: {
        total: allTotal,
        done: allDone,
        inProgress: allTotal - allDone,
        pctDone: getPct(allDone, allTotal),
      },
      design: {
        total: designTotal,
        done: designDone,
        inProgress: designTotal - designDone,
        pctDone: getPct(designDone, designTotal),
      },
      mockup: {
        total: mockupTotal,
        done: mockupDone,
        inProgress: mockupTotal - mockupDone,
        pctDone: getPct(mockupDone, mockupTotal),
      },
      sample: {
        total: sampleTotal,
        done: sampleDone,
        inProgress: sampleTotal - sampleDone,
        pctDone: getPct(sampleDone, sampleTotal),
      },
    };
  }, [requests, getRequestWorkDone]);

  // Filter requests for the table
  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      // 1. Section filter (matching the 4 boxes)
      if (filterSection === "design" && !isDesignRequest(r)) return false;
      if (filterSection === "mockup" && !isMockupRequest(r)) return false;
      if (filterSection === "sample" && !isSamplingRequest(r)) return false;

      // 2. Status filter
      const { done } = getRequestWorkDone(r);
      if (statusFilter === "done" && !done) return false;
      if (statusFilter === "in_progress" && done) return false;

      // 3. Search query
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const matches =
          (r.srNumber || "").toLowerCase().includes(q) ||
          (r.materialCode || "").toLowerCase().includes(q) ||
          (r.customer || "").toLowerCase().includes(q) ||
          (r.programName || "").toLowerCase().includes(q) ||
          (r.productDescription || "").toLowerCase().includes(q) ||
          (r.createdBy || "").toLowerCase().includes(q) ||
          (r.brandName || "").toLowerCase().includes(q);
        if (!matches) return false;
      }

      return true;
    });
  }, [requests, filterSection, statusFilter, searchTerm, getRequestWorkDone]);

  // Define the 4 Cards
  const cards = [
    {
      id: "all" as FilterSection,
      title: "Total Requests",
      count: stats.all.total,
      doneCount: stats.all.done,
      inProgressCount: stats.all.inProgress,
      pctDone: stats.all.pctDone,
      subtitle: "Whole Pipeline",
      tagText: `${stats.all.pctDone}% Work Done`,
      icon: Layers,
      iconBg:
        "bg-blue-50 text-blue-600 dark:bg-blue-950/70 dark:text-blue-400 border border-blue-200/70 dark:border-blue-900/60",
      topBar: "bg-blue-600",
      barColor: "bg-gradient-to-r from-blue-600 to-indigo-600",
      textColor: "text-blue-600 dark:text-blue-400",
      selectedRing:
        "border-blue-500 ring-2 ring-blue-500/25 shadow-card-hover bg-blue-50/20 dark:bg-blue-950/20",
    },
    {
      id: "design" as FilterSection,
      title: "Design Section",
      count: stats.design.total,
      doneCount: stats.design.done,
      inProgressCount: stats.design.inProgress,
      pctDone: stats.design.pctDone,
      subtitle: "Artwork & Briefs",
      tagText: `${stats.design.pctDone}% Work Done`,
      icon: Palette,
      iconBg:
        "bg-rose-50 text-rose-600 dark:bg-rose-950/70 dark:text-rose-400 border border-rose-200/70 dark:border-rose-900/60",
      topBar: "bg-rose-500",
      barColor: "bg-gradient-to-r from-rose-500 to-pink-600",
      textColor: "text-rose-600 dark:text-rose-400",
      selectedRing:
        "border-rose-500 ring-2 ring-rose-500/25 shadow-card-hover bg-rose-50/20 dark:bg-rose-950/20",
    },
    {
      id: "mockup" as FilterSection,
      title: "Mockup Section",
      count: stats.mockup.total,
      doneCount: stats.mockup.done,
      inProgressCount: stats.mockup.inProgress,
      pctDone: stats.mockup.pctDone,
      subtitle: "3D & Photography",
      tagText: `${stats.mockup.pctDone}% Work Done`,
      icon: Camera,
      iconBg:
        "bg-purple-50 text-purple-600 dark:bg-purple-950/70 dark:text-purple-400 border border-purple-200/70 dark:border-purple-900/60",
      topBar: "bg-purple-500",
      barColor: "bg-gradient-to-r from-purple-500 to-violet-600",
      textColor: "text-purple-600 dark:text-purple-400",
      selectedRing:
        "border-purple-500 ring-2 ring-purple-500/25 shadow-card-hover bg-purple-50/20 dark:bg-purple-950/20",
    },
    {
      id: "sample" as FilterSection,
      title: "Sampling Section",
      count: stats.sample.total,
      doneCount: stats.sample.done,
      inProgressCount: stats.sample.inProgress,
      pctDone: stats.sample.pctDone,
      subtitle: "Prototype Builds",
      tagText: `${stats.sample.pctDone}% Work Done`,
      icon: Package,
      iconBg:
        "bg-amber-50 text-amber-600 dark:bg-amber-950/70 dark:text-amber-400 border border-amber-200/70 dark:border-amber-900/60",
      topBar: "bg-amber-500",
      barColor: "bg-gradient-to-r from-amber-500 to-orange-600",
      textColor: "text-amber-600 dark:text-amber-400",
      selectedRing:
        "border-amber-500 ring-2 ring-amber-500/25 shadow-card-hover bg-amber-50/20 dark:bg-amber-950/20",
    },
  ];

  return (
    <DashboardLayout
      user={user}
      onLogout={onLogout}
      title="Creative Work"
      subtitle="Digital artwork briefs, 3D structural mockups, and pre-press sampling deliverables."
      onRefresh={loadRequests}
      isRefreshing={isRefreshing}
    >
      <div className="space-y-5 animate-in fade-in duration-200">
        {/* Toast */}
        {toastMessage && (
          <div className="fixed top-20 right-6 z-[160] flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-emerald-600 text-white shadow-xl shadow-emerald-600/30 text-xs font-semibold animate-in slide-in-from-top-4 duration-200 max-w-sm">
            <CheckCircle2 size={16} className="stroke-[3] shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Pipeline Overview & Quick Action Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 rounded-2xl bg-gradient-to-r from-rose-900 via-rose-950 to-slate-950 text-white p-4 sm:p-5 shadow-lg shadow-rose-950/20 border border-rose-800/40">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="h-8 w-8 rounded-xl bg-rose-500/30 text-rose-300 border border-rose-400/40 flex items-center justify-center">
                <Palette size={16} />
              </div>
              <h1 className="text-base sm:text-lg font-bold tracking-tight">
                Creative Pipeline & Deliverables
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-200 border border-rose-400/30">
                {stats.all.total} Total Requests
              </span>
            </div>
            <p className="text-xs text-rose-200/80">
              Track creative progress across graphic designs, structural 3D mockups, and pre-SMT prototypes.
            </p>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              type="button"
              onClick={() => navigate("/sample-requests/create-design")}
              className="h-9 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-semibold text-xs shadow-md shadow-rose-600/30 inline-flex items-center gap-1.5 transition-all cursor-pointer active:scale-[0.98]"
            >
              <Sparkles size={14} />
              <span>New Design Request</span>
            </button>
          </div>
        </div>

        {/* The 4 KPI Section Boxes (Total Requests, Design, Mockup, Sampling) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {cards.map((c) => {
            const isSelected = filterSection === c.id;
            const Icon = c.icon;

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
                className={`group relative p-4 rounded-2xl cursor-pointer transition-all border overflow-hidden outline-none select-none ${
                  isSelected
                    ? `${c.selectedRing}`
                    : "bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/40 dark:hover:bg-slate-850/40 shadow-card hover:shadow-card-hover hover:-translate-y-0.5"
                }`}
              >
                {/* Active top accent hairline in card's unique color */}
                {isSelected && (
                  <div className={`absolute top-0 left-0 right-0 h-1 ${c.topBar}`} />
                )}

                {/* Header: Icon + Title + Work Done Tag */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${c.iconBg}`}>
                      <Icon size={14} className="stroke-[2.2]" />
                    </div>
                    <span
                      className={`text-[11px] font-bold uppercase tracking-wider truncate ${
                        isSelected
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

                {/* Metric Count & Subtitle */}
                <div className="mt-3 flex items-baseline justify-between gap-2">
                  <p className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 dark:text-slate-100 tracking-tight">
                    {c.count.toLocaleString()}
                  </p>
                  <span className={`text-[11px] font-semibold truncate ${c.textColor}`}>
                    {c.subtitle}
                  </span>
                </div>

                {/* Work Done Progress Tracker */}
                <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-medium">
                    <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <CheckCircle2 size={11} className="text-emerald-500" />
                      <strong className="text-slate-800 dark:text-slate-200">{c.doneCount}</strong> Done
                    </span>
                    <span className="text-slate-400 dark:text-slate-500">
                      {c.inProgressCount} Active
                    </span>
                  </div>

                  {/* Progress Bar */}
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

        {/* Requests Table Section ("then down that see their requests") */}
        <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden">
          {/* Table Toolbar: Search, Filters, Section Status */}
          <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3.5 bg-slate-50/50 dark:bg-slate-800/40">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center shrink-0">
                <FileText size={17} />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                    {filterSection === "all"
                      ? "All Creative Requests"
                      : filterSection === "design"
                      ? "Design Section Requests"
                      : filterSection === "mockup"
                      ? "Mockup Section Requests"
                      : "Sampling Section Requests"}
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950/70 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                    {filteredRequests.length}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Review specifications, creative brief attachments, and update deliverable work done.
                </p>
              </div>
            </div>

            {/* Controls: Search & Status Filter Tabs */}
            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Search Bar */}
              <div className="relative w-full sm:w-64">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search requests, SKU, customer..."
                  className="h-9 w-full pl-9 pr-7 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              {/* Status Tabs */}
              <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setStatusFilter("all")}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    statusFilter === "all"
                      ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-2xs font-bold"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                  }`}
                >
                  All Status
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("in_progress")}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    statusFilter === "in_progress"
                      ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-2xs font-bold"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                  }`}
                >
                  Active
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("done")}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    statusFilter === "done"
                      ? "bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-2xs font-bold"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                  }`}
                >
                  Work Done
                </button>
              </div>
            </div>
          </div>

          {/* Table Container */}
          {isLoading ? (
            <div className="p-12 text-center text-xs text-slate-400 animate-pulse">
              Loading creative requests...
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
                <Palette size={24} />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  No creative requests found
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {searchTerm
                    ? `No requests match "${searchTerm}". Try resetting your search.`
                    : "No requests found for this filter section."}
                </p>
              </div>
              {(searchTerm || statusFilter !== "all" || filterSection !== "all") && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("all");
                    setFilterSection("all");
                  }}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 cursor-pointer shadow-2xs"
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
                    <th className="py-3 px-4">Request #</th>
                    <th className="py-3 px-4">Deliverables</th>
                    <th className="py-3 px-4">Customer & Program</th>
                    <th className="py-3 px-4">Description & Specs</th>
                    <th className="py-3 px-4">Target Date</th>
                    <th className="py-3 px-4">Work Done Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredRequests.map((req) => {
                    const isDesign = isDesignRequest(req);
                    const isMockup = isMockupRequest(req);
                    const isSample = isSamplingRequest(req);
                    const workDone = getRequestWorkDone(req);

                    return (
                      <tr
                        key={req.id}
                        onClick={() => handleOpenSpecs(req)}
                        className="group hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                      >
                        {/* 1. Request # */}
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-slate-800 dark:text-slate-200">
                              {req.srNumber || req.id}
                            </span>
                            {isDesign && (
                              <span className="h-2 w-2 rounded-full bg-rose-500" title="Design Request" />
                            )}
                          </div>
                          <p className="text-[10px] font-sans font-medium text-slate-400 mt-0.5">
                            {req.dateRequestCreated || "Recent"}
                          </p>
                        </td>

                        {/* 2. Deliverable Section Badges */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {isDesign && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-900/60">
                                <Palette size={10} />
                                <span>Design</span>
                              </span>
                            )}
                            {isMockup && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-900/60">
                                <Camera size={10} />
                                <span>Mockup</span>
                              </span>
                            )}
                            {isSample && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-900/60">
                                <Package size={10} />
                                <span>Sampling</span>
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 3. Customer & Program */}
                        <td className="py-3.5 px-4 min-w-[180px]">
                          <p className="font-bold text-slate-900 dark:text-slate-100">
                            {req.customer || "General Customer"}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            {req.programName} ({req.programYear || "2026"})
                          </p>
                        </td>

                        {/* 4. Description & Specs */}
                        <td className="py-3.5 px-4 max-w-xs">
                          <p className="font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">
                            {req.productDescription || "Custom Product Brief"}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 mt-0.5">
                            <span>Code: {req.materialCode}</span>
                            {req.numberOfDesigns && (
                              <span>&bull; {req.numberOfDesigns} Designs</span>
                            )}
                          </div>
                        </td>

                        {/* 5. Target Date */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 dark:text-slate-300">
                            <Clock size={12} className="text-slate-400" />
                            <span>{req.sampleRequiredDate || "Not specified"}</span>
                          </span>
                        </td>

                        {/* 6. Work Done Status & Quick Toggle */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                                  workDone.done
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
                                    : "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800"
                                }`}
                              >
                                {workDone.done ? (
                                  <>
                                    <CheckCircle2 size={11} className="stroke-[2.5]" />
                                    <span>Work Done (100%)</span>
                                  </>
                                ) : (
                                  <>
                                    <Clock size={11} />
                                    <span>In Progress ({workDone.progressPct}%)</span>
                                  </>
                                )}
                              </span>

                              {/* Quick toggle button */}
                              <button
                                type="button"
                                onClick={(e) => handleToggleWorkDone(req, e)}
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border transition-all cursor-pointer ${
                                  workDone.done
                                    ? "bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
                                    : "bg-emerald-600 hover:bg-emerald-700 text-white border-transparent shadow-xs"
                                }`}
                                title={workDone.done ? "Set back to In Progress" : "Mark deliverable work done"}
                              >
                                {workDone.done ? "Undo" : "Mark Done"}
                              </button>
                            </div>

                            {/* Mini progress bar */}
                            <div className="w-28 rounded-full h-1 bg-slate-100 dark:bg-slate-800 overflow-hidden">
                              <div
                                className={`h-1 rounded-full transition-all duration-300 ${
                                  workDone.done
                                    ? "bg-emerald-500"
                                    : "bg-gradient-to-r from-blue-500 to-indigo-600"
                                }`}
                                style={{ width: `${workDone.progressPct}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* 7. Action */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenSpecs(req);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-xs hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-2xs cursor-pointer"
                          >
                            <Eye size={13} />
                            <span>Inspect</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Product Specifications / Creative Design Brief Drawer */}
      {selectedRequest && (
        <ProductSpecificationsDrawer
          product={selectedRequest}
          details={specsDetails}
          isLoading={isLoadingSpecs}
          specMode="view"
          allowEdit={false}
          onClose={() => setSelectedRequest(null)}
        />
      )}
    </DashboardLayout>
  );
};

export default CreativeWorkPage;
