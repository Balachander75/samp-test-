import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { UserProfileInfo, DashboardLayout } from "@/features/dashboard";
import {
  fetchSampleRequestsApi,
  fetchProductDetailsApi,
  ProductDetailItem,
} from "@/features/sample-requests/api";
import { SampleRequestItem } from "@/features/sample-requests/types";
import { ProductSpecificationsDrawer } from "@/features/sample-requests/components/ProductSpecificationsDrawer";
import {
  Briefcase, ShieldCheck, Clock, CheckCircle2, ArrowRight,
  Search, RefreshCw, FileText, Eye, X,
  Layers, Factory,
} from "@/components/ui/icons";

export interface SampTeamWorkPageProps {
  user?: UserProfileInfo | null;
  onLogout?: () => void;
}

type FilterSection = "all" | "feasibility" | "qc" | "plant";
type StatusFilter = "all" | "in_progress" | "done";

interface WorkDoneState { done: boolean; progressPct: number; }

function isSampStage(req: SampleRequestItem): boolean {
  const s = (req.status || "").toLowerCase();
  return (
    s.includes("samp") || s.includes("pmt") || s.includes("review") ||
    s.includes("qc") || s.includes("in plant") || s.includes("execution") ||
    s.includes("released") || s.includes("dispatch") || s.includes("closed")
  );
}

function isFeasibilityRequest(req: SampleRequestItem): boolean {
  const mode = (req.creationMode || "").toLowerCase();
  const desc = (req.productDescription || "").toLowerCase();
  return (
    mode === "feasibility_check" ||
    desc.includes("new category") || desc.includes("new format") ||
    desc.includes("new finish") || desc.includes("new accessories") || desc.includes("[new ")
  );
}

function isQCStage(r: SampleRequestItem) { return (r.status || "").toLowerCase().includes("qc"); }
function isPlantStage(r: SampleRequestItem) {
  const s = (r.status || "").toLowerCase();
  return s.includes("plant") || s.includes("execution");
}

function SampTeamContent({ user }: { user?: UserProfileInfo | null }) {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<SampleRequestItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filterSection, setFilterSection] = useState<FilterSection>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<SampleRequestItem | null>(null);
  const [specsDetails, setSpecsDetails] = useState<ProductDetailItem[]>([]);
  const [isLoadingSpecs, setIsLoadingSpecs] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [workDoneOverrides, setWorkDoneOverrides] = useState<Record<string, WorkDoneState>>(() => {
    try { return JSON.parse(localStorage.getItem("samp_work_done_overrides") || "{}"); }
    catch { return {}; }
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const saveWorkDone = (id: string, state: WorkDoneState) => {
    setWorkDoneOverrides((prev) => {
      const next = { ...prev, [id]: state };
      try { localStorage.setItem("samp_work_done_overrides", JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const load = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const all = await fetchSampleRequestsApi();
      setRequests(all.filter(isSampStage));
    } catch { /* silent */ } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const getWorkDone = useCallback((r: SampleRequestItem): WorkDoneState => {
    if (workDoneOverrides[r.id]) return workDoneOverrides[r.id];
    const s = (r.status || "").toLowerCase();
    if (s.includes("dispatch") || s.includes("closed") || s.includes("deal") || s.includes("approved"))
      return { done: true, progressPct: 100 };
    if (s.includes("plant") || s.includes("execution")) return { done: false, progressPct: 75 };
    if (s.includes("qc")) return { done: false, progressPct: 60 };
    return { done: false, progressPct: 40 };
  }, [workDoneOverrides]);

  const handleToggleWorkDone = (req: SampleRequestItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const cur = getWorkDone(req);
    const newState = { done: !cur.done, progressPct: !cur.done ? 100 : 50 };
    saveWorkDone(req.id, newState);
    showToast(!cur.done ? `${req.srNumber} marked as Work Done!` : `${req.srNumber} set back to In Progress.`);
  };

  const handleOpenSpecs = async (req: SampleRequestItem) => {
    setSelectedRequest(req);
    setIsLoadingSpecs(true);
    try {
      const details = await fetchProductDetailsApi(Number(req.id), false);
      setSpecsDetails(details);
    } catch { setSpecsDetails([]); }
    finally { setIsLoadingSpecs(false); }
  };

  const feasibilityRequests = useMemo(() => requests.filter(isFeasibilityRequest), [requests]);
  const qcRequests = useMemo(() => requests.filter(isQCStage), [requests]);
  const plantRequests = useMemo(() => requests.filter(isPlantStage), [requests]);

  const stats = useMemo(() => {
    let allDone = 0, feasDone = 0, qcDone = 0, plantDone = 0;
    requests.forEach((r) => { if (getWorkDone(r).done) allDone++; });
    feasibilityRequests.forEach((r) => { if (getWorkDone(r).done) feasDone++; });
    qcRequests.forEach((r) => { if (getWorkDone(r).done) qcDone++; });
    plantRequests.forEach((r) => { if (getWorkDone(r).done) plantDone++; });
    const pct = (d: number, t: number) => t > 0 ? Math.round((d / t) * 100) : 0;
    return {
      all: { total: requests.length, done: allDone, pctDone: pct(allDone, requests.length) },
      feasibility: { total: feasibilityRequests.length, done: feasDone, pctDone: pct(feasDone, feasibilityRequests.length) },
      qc: { total: qcRequests.length, done: qcDone, pctDone: pct(qcDone, qcRequests.length) },
      plant: { total: plantRequests.length, done: plantDone, pctDone: pct(plantDone, plantRequests.length) },
    };
  }, [requests, feasibilityRequests, qcRequests, plantRequests, getWorkDone]);

  const cards = [
    {
      id: "all" as FilterSection, title: "Total Queue", subtitle: "All SAMP Stages",
      count: stats.all.total, done: stats.all.done, pctDone: stats.all.pctDone,
      tagText: `${stats.all.pctDone}% Done`, icon: Layers,
      iconBg: "bg-amber-50 text-amber-600 dark:bg-amber-950/70 dark:text-amber-400 border border-amber-200/70 dark:border-amber-900/60",
      topBar: "bg-amber-500", barColor: "bg-gradient-to-r from-amber-500 to-orange-500",
      textColor: "text-amber-600 dark:text-amber-400",
      selectedRing: "border-amber-500 ring-2 ring-amber-500/25 shadow-card-hover bg-amber-50/20 dark:bg-amber-950/20",
    },
    {
      id: "feasibility" as FilterSection, title: "Feasibility Checks", subtitle: "Pending Review",
      count: stats.feasibility.total, done: stats.feasibility.done, pctDone: stats.feasibility.pctDone,
      tagText: `${stats.feasibility.pctDone}% Done`, icon: ShieldCheck,
      iconBg: "bg-violet-50 text-violet-600 dark:bg-violet-950/70 dark:text-violet-400 border border-violet-200/70 dark:border-violet-900/60",
      topBar: "bg-violet-500", barColor: "bg-gradient-to-r from-violet-500 to-purple-600",
      textColor: "text-violet-600 dark:text-violet-400",
      selectedRing: "border-violet-500 ring-2 ring-violet-500/25 shadow-card-hover bg-violet-50/20 dark:bg-violet-950/20",
    },
    {
      id: "qc" as FilterSection, title: "QC Inspection", subtitle: "Quality Control",
      count: stats.qc.total, done: stats.qc.done, pctDone: stats.qc.pctDone,
      tagText: `${stats.qc.pctDone}% Done`, icon: CheckCircle2,
      iconBg: "bg-sky-50 text-sky-600 dark:bg-sky-950/70 dark:text-sky-400 border border-sky-200/70 dark:border-sky-900/60",
      topBar: "bg-sky-500", barColor: "bg-gradient-to-r from-sky-500 to-blue-600",
      textColor: "text-sky-600 dark:text-sky-400",
      selectedRing: "border-sky-500 ring-2 ring-sky-500/25 shadow-card-hover bg-sky-50/20 dark:bg-sky-950/20",
    },
    {
      id: "plant" as FilterSection, title: "Plant Execution", subtitle: "Manufacturing",
      count: stats.plant.total, done: stats.plant.done, pctDone: stats.plant.pctDone,
      tagText: `${stats.plant.pctDone}% Done`, icon: Factory,
      iconBg: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/70 dark:text-emerald-400 border border-emerald-200/70 dark:border-emerald-900/60",
      topBar: "bg-emerald-500", barColor: "bg-gradient-to-r from-emerald-500 to-teal-600",
      textColor: "text-emerald-600 dark:text-emerald-400",
      selectedRing: "border-emerald-500 ring-2 ring-emerald-500/25 shadow-card-hover bg-emerald-50/20 dark:bg-emerald-950/20",
    },
  ];

  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      if (filterSection === "feasibility" && !isFeasibilityRequest(r)) return false;
      if (filterSection === "qc" && !isQCStage(r)) return false;
      if (filterSection === "plant" && !isPlantStage(r)) return false;
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
          (r.createdBy || "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [requests, filterSection, statusFilter, searchTerm, getWorkDone]);

  const pendingFeasibility = feasibilityRequests.filter((r) => !r.samplingFeasibilityResponse).length;

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-[160] flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-emerald-600 text-white shadow-xl shadow-emerald-600/30 text-xs font-semibold animate-in slide-in-from-top-4 duration-200 max-w-sm">
          <CheckCircle2 size={16} className="stroke-[3] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Dark gradient header banner — matches Creative Work */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 rounded-2xl bg-gradient-to-r from-amber-900 via-orange-950 to-slate-950 text-white p-4 sm:p-5 shadow-lg shadow-amber-950/20 border border-amber-800/40">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="h-8 w-8 rounded-xl bg-amber-500/30 text-amber-300 border border-amber-400/40 flex items-center justify-center">
              <Briefcase size={16} />
            </div>
            <h1 className="text-base sm:text-lg font-bold tracking-tight">
              SAMP Team Pipeline & Reviews
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-200 border border-amber-400/30">
              {requests.length} Total
            </span>
            {pendingFeasibility > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-violet-500/25 text-violet-200 border border-violet-400/30 animate-pulse">
                {pendingFeasibility} Feasibility Pending
              </span>
            )}
          </div>
          <p className="text-xs text-amber-200/80">
            {user?.name ? `Welcome, ${user.name} — ` : ""}
            Track sampling reviews, QC inspections, plant dispatch, and feasibility checks.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {pendingFeasibility > 0 && (
            <button
              onClick={() => navigate("/sampling/feasibility")}
              className="h-9 px-4 rounded-xl bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-500 hover:to-purple-600 text-white font-semibold text-xs shadow-md shadow-violet-600/30 inline-flex items-center gap-1.5 transition-all cursor-pointer active:scale-[0.98]"
            >
              <ShieldCheck size={14} />
              <span>Feasibility Inbox</span>
              <ArrowRight size={13} />
            </button>
          )}
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

      {/* 4 KPI Cards */}
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
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setFilterSection(c.id); } }}
              className={`group relative p-4 rounded-2xl cursor-pointer transition-all border overflow-hidden outline-none select-none ${
                isSelected
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
                  <span className={`text-[11px] font-bold uppercase tracking-wider truncate ${isSelected ? "text-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-400 group-hover:text-slate-800"}`}>
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
                  <div className={`h-1.5 rounded-full transition-all duration-300 ${c.barColor}`} style={{ width: `${Math.min(c.pctDone, 100)}%` }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Request Table */}
      <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3.5 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 flex items-center justify-center shrink-0">
              <FileText size={17} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                  {filterSection === "all" ? "All SAMP Requests"
                    : filterSection === "feasibility" ? "Feasibility Check Requests"
                    : filterSection === "qc" ? "QC Inspection Requests"
                    : "Plant Execution Requests"}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  {filteredRequests.length}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Review specs, track progress, and update work done status.
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
                placeholder="Search requests, customer..."
                className="h-9 w-full pl-9 pr-7 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer">
                  <X size={13} />
                </button>
              )}
            </div>
            <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold">
              {(["all", "in_progress", "done"] as StatusFilter[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    statusFilter === s
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

        {/* Table */}
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-400 animate-pulse">Loading SAMP requests...</div>
        ) : filteredRequests.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
              <Briefcase size={24} />
            </div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No requests found</h3>
            <p className="text-xs text-slate-500">
              {searchTerm ? `No requests match "${searchTerm}".` : "No requests for this filter."}
            </p>
            {(searchTerm || statusFilter !== "all" || filterSection !== "all") && (
              <button
                onClick={() => { setSearchTerm(""); setStatusFilter("all"); setFilterSection("all"); }}
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
                  <th className="py-3 px-4">Request #</th>
                  <th className="py-3 px-4">Description & Product</th>
                  <th className="py-3 px-4">Customer & Program</th>
                  <th className="py-3 px-4">Stage</th>
                  <th className="py-3 px-4">Required Date</th>
                  <th className="py-3 px-4">Work Done Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredRequests.map((req) => {
                  const workDone = getWorkDone(req);
                  const isFeas = isFeasibilityRequest(req);
                  return (
                    <tr
                      key={req.id}
                      onClick={() => handleOpenSpecs(req)}
                      className="group hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs">
                            {req.srNumber || req.id}
                          </span>
                          {isFeas && <span className="h-2 w-2 rounded-full bg-violet-500" title="Feasibility Request" />}
                        </div>
                        <p className="text-[10px] font-sans font-medium text-slate-400 mt-0.5">{req.dateRequestCreated || "—"}</p>
                      </td>
                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">{req.productDescription?.split("\n")[0] || "—"}</p>
                        <p className="text-[10px] font-mono text-slate-400 mt-0.5">{req.materialCode || "—"}</p>
                      </td>
                      <td className="py-3.5 px-4 min-w-[160px]">
                        <p className="font-bold text-slate-900 dark:text-slate-100">{req.customer || "—"}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{req.programName} ({req.programYear || "2026"})</p>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                          isFeas ? "bg-violet-50 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300"
                          : (req.status || "").toLowerCase().includes("qc") ? "bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300"
                          : (req.status || "").toLowerCase().includes("plant") || (req.status || "").toLowerCase().includes("execution")
                            ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300"
                          : "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300"
                        }`}>
                          {req.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 dark:text-slate-300">
                          <Clock size={12} className="text-slate-400" />
                          {req.sampleRequiredDate || "Not set"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                              workDone.done
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
                                : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800"
                            }`}>
                              {workDone.done ? <><CheckCircle2 size={11} className="stroke-[2.5]" /><span>Done (100%)</span></> : <><Clock size={11} /><span>Active ({workDone.progressPct}%)</span></>}
                            </span>
                            <button
                              onClick={(e) => handleToggleWorkDone(req, e)}
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border transition-all cursor-pointer ${
                                workDone.done
                                  ? "bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
                                  : "bg-emerald-600 hover:bg-emerald-700 text-white border-transparent shadow-xs"
                              }`}
                            >
                              {workDone.done ? "Undo" : "Mark Done"}
                            </button>
                          </div>
                          <div className="w-28 rounded-full h-1 bg-slate-100 dark:bg-slate-800 overflow-hidden">
                            <div className={`h-1 rounded-full transition-all duration-300 ${workDone.done ? "bg-emerald-500" : "bg-gradient-to-r from-amber-500 to-orange-500"}`} style={{ width: `${workDone.progressPct}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleOpenSpecs(req); }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-semibold hover:bg-amber-100 dark:hover:bg-amber-900/60 transition-colors cursor-pointer"
                        >
                          <Eye size={12} />
                          <span>View</span>
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

      {/* Specs Drawer */}
      {selectedRequest && (
        <ProductSpecificationsDrawer
          product={selectedRequest}
          details={specsDetails}
          isLoading={isLoadingSpecs}
          specMode="view"
          allowEdit={false}
          onClose={() => { setSelectedRequest(null); setSpecsDetails([]); }}
        />
      )}
    </div>
  );
}

export const SampTeamWorkPage: React.FC<SampTeamWorkPageProps> = ({ user, onLogout }) => (
  <DashboardLayout
    user={user}
    onLogout={onLogout}
    title="SAMP Team Work"
    subtitle="Sampling reviews, QC inspections, plant dispatch, and feasibility checks."
  >
    <SampTeamContent user={user} />
  </DashboardLayout>
);

export default SampTeamWorkPage;
