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
  Camera, Palette, Layers, Clock, CheckCircle2, ArrowRight,
  Search, RefreshCw, FileText, Eye, X, Package,
} from "@/components/ui/icons";

export interface StudioWorkPageProps {
  user?: UserProfileInfo | null;
  onLogout?: () => void;
}

type FilterSection = "all" | "studio" | "creative" | "mockup";
type StatusFilter = "all" | "in_progress" | "done";

interface WorkDoneState { done: boolean; progressPct: number; }

function isStudioPool(req: SampleRequestItem): boolean {
  const s = (req.status || "").toLowerCase();
  return s.includes("studio") || s.includes("creative");
}

function isStudioStage(r: SampleRequestItem) { return (r.status || "").toLowerCase().includes("studio"); }
function isCreativeStage(r: SampleRequestItem) { return (r.status || "").toLowerCase().includes("creative"); }
function isMockupReq(r: SampleRequestItem) {
  return (r.mockupRequired || "").toLowerCase() === "yes" || Boolean(r.requestTypes?.includes("mockup"));
}

function isOverdue(dateStr?: string): boolean {
  if (!dateStr) return false;
  try { return new Date(dateStr) < new Date(); } catch { return false; }
}

function StudioContent({ user }: { user?: UserProfileInfo | null }) {
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
    try { return JSON.parse(localStorage.getItem("studio_work_done_overrides") || "{}"); }
    catch { return {}; }
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const saveWorkDone = (id: string, state: WorkDoneState) => {
    setWorkDoneOverrides((prev) => {
      const next = { ...prev, [id]: state };
      try { localStorage.setItem("studio_work_done_overrides", JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const load = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const all = await fetchSampleRequestsApi();
      setRequests(all.filter(isStudioPool));
    } catch { } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const getWorkDone = useCallback((r: SampleRequestItem): WorkDoneState => {
    if (workDoneOverrides[r.id]) return workDoneOverrides[r.id];
    const s = (r.status || "").toLowerCase();
    if (s.includes("samp") || s.includes("plant") || s.includes("dispatch") || s.includes("closed"))
      return { done: true, progressPct: 100 };
    if (s.includes("studio")) return { done: false, progressPct: 65 };
    return { done: false, progressPct: 35 };
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

  const studioRequests = useMemo(() => requests.filter(isStudioStage), [requests]);
  const creativeRequests = useMemo(() => requests.filter(isCreativeStage), [requests]);
  const mockupRequests = useMemo(() => requests.filter(isMockupReq), [requests]);

  const overdueCount = useMemo(
    () => requests.filter(r => isOverdue(r.targetArtworkDateStudio || r.targetArtworkDateCreative)).length,
    [requests]
  );

  const stats = useMemo(() => {
    let allDone = 0, studioDone = 0, creativeDone = 0, mockupDone = 0;
    requests.forEach((r) => { if (getWorkDone(r).done) allDone++; });
    studioRequests.forEach((r) => { if (getWorkDone(r).done) studioDone++; });
    creativeRequests.forEach((r) => { if (getWorkDone(r).done) creativeDone++; });
    mockupRequests.forEach((r) => { if (getWorkDone(r).done) mockupDone++; });
    const pct = (d: number, t: number) => t > 0 ? Math.round((d / t) * 100) : 0;
    return {
      all: { total: requests.length, done: allDone, pctDone: pct(allDone, requests.length) },
      studio: { total: studioRequests.length, done: studioDone, pctDone: pct(studioDone, studioRequests.length) },
      creative: { total: creativeRequests.length, done: creativeDone, pctDone: pct(creativeDone, creativeRequests.length) },
      mockup: { total: mockupRequests.length, done: mockupDone, pctDone: pct(mockupDone, mockupRequests.length) },
    };
  }, [requests, studioRequests, creativeRequests, mockupRequests, getWorkDone]);

  const cards = [
    {
      id: "all" as FilterSection, title: "Total Queue", subtitle: "All Studio Stages",
      count: stats.all.total, done: stats.all.done, pctDone: stats.all.pctDone,
      tagText: `${stats.all.pctDone}% Done`, icon: Layers,
      iconBg: "bg-purple-50 text-purple-600 dark:bg-purple-950/70 dark:text-purple-400 border border-purple-200/70 dark:border-purple-900/60",
      topBar: "bg-purple-500", barColor: "bg-gradient-to-r from-purple-500 to-violet-600",
      textColor: "text-purple-600 dark:text-purple-400",
      selectedRing: "border-purple-500 ring-2 ring-purple-500/25 shadow-card-hover bg-purple-50/20 dark:bg-purple-950/20",
    },
    {
      id: "studio" as FilterSection, title: "Studio Work", subtitle: "3D & Photography",
      count: stats.studio.total, done: stats.studio.done, pctDone: stats.studio.pctDone,
      tagText: `${stats.studio.pctDone}% Done`, icon: Camera,
      iconBg: "bg-violet-50 text-violet-600 dark:bg-violet-950/70 dark:text-violet-400 border border-violet-200/70 dark:border-violet-900/60",
      topBar: "bg-violet-500", barColor: "bg-gradient-to-r from-violet-500 to-purple-700",
      textColor: "text-violet-600 dark:text-violet-400",
      selectedRing: "border-violet-500 ring-2 ring-violet-500/25 shadow-card-hover bg-violet-50/20 dark:bg-violet-950/20",
    },
    {
      id: "creative" as FilterSection, title: "Creative Work", subtitle: "Artwork & Design",
      count: stats.creative.total, done: stats.creative.done, pctDone: stats.creative.pctDone,
      tagText: `${stats.creative.pctDone}% Done`, icon: Palette,
      iconBg: "bg-rose-50 text-rose-600 dark:bg-rose-950/70 dark:text-rose-400 border border-rose-200/70 dark:border-rose-900/60",
      topBar: "bg-rose-500", barColor: "bg-gradient-to-r from-rose-500 to-pink-600",
      textColor: "text-rose-600 dark:text-rose-400",
      selectedRing: "border-rose-500 ring-2 ring-rose-500/25 shadow-card-hover bg-rose-50/20 dark:bg-rose-950/20",
    },
    {
      id: "mockup" as FilterSection, title: "Mockup Required", subtitle: "Prototypes & 3D",
      count: stats.mockup.total, done: stats.mockup.done, pctDone: stats.mockup.pctDone,
      tagText: `${stats.mockup.pctDone}% Done`, icon: Package,
      iconBg: "bg-sky-50 text-sky-600 dark:bg-sky-950/70 dark:text-sky-400 border border-sky-200/70 dark:border-sky-900/60",
      topBar: "bg-sky-500", barColor: "bg-gradient-to-r from-sky-500 to-blue-600",
      textColor: "text-sky-600 dark:text-sky-400",
      selectedRing: "border-sky-500 ring-2 ring-sky-500/25 shadow-card-hover bg-sky-50/20 dark:bg-sky-950/20",
    },
  ];

  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      if (filterSection === "studio" && !isStudioStage(r)) return false;
      if (filterSection === "creative" && !isCreativeStage(r)) return false;
      if (filterSection === "mockup" && !isMockupReq(r)) return false;
      const { done } = getWorkDone(r);
      if (statusFilter === "done" && !done) return false;
      if (statusFilter === "in_progress" && done) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return (
          (r.srNumber || "").toLowerCase().includes(q) ||
          (r.productDescription || "").toLowerCase().includes(q) ||
          (r.customer || "").toLowerCase().includes(q) ||
          (r.materialCode || "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [requests, filterSection, statusFilter, searchTerm, getWorkDone]);

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {toastMessage && (
        <div className="fixed top-20 right-6 z-[160] flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-emerald-600 text-white shadow-xl shadow-emerald-600/30 text-xs font-semibold animate-in slide-in-from-top-4 duration-200 max-w-sm">
          <CheckCircle2 size={16} className="stroke-[3] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Dark gradient header banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 rounded-2xl bg-gradient-to-r from-purple-900 via-violet-950 to-slate-950 text-white p-4 sm:p-5 shadow-lg shadow-purple-950/20 border border-purple-800/40">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="h-8 w-8 rounded-xl bg-purple-500/30 text-purple-300 border border-purple-400/40 flex items-center justify-center">
              <Camera size={16} />
            </div>
            <h1 className="text-base sm:text-lg font-bold tracking-tight">
              Studio Pipeline & Deliverables
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/20 text-purple-200 border border-purple-400/30">
              {requests.length} Total Requests
            </span>
            {overdueCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/25 text-rose-200 border border-rose-400/30 animate-pulse">
                {overdueCount} Overdue
              </span>
            )}
          </div>
          <p className="text-xs text-purple-200/80">
            {user?.name ? `Welcome, ${user.name} — ` : ""}
            Track artwork briefs, 3D structural mockups, photography, and pre-SMT studio deliverables.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
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
                  : "bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/40 shadow-sm hover:shadow-md hover:-translate-y-0.5"
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

      {/* Table */}
      <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3.5 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800 flex items-center justify-center shrink-0">
              <FileText size={17} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                  {filterSection === "all" ? "All Studio Requests"
                    : filterSection === "studio" ? "Studio Stage Requests"
                    : filterSection === "creative" ? "Creative Stage Requests"
                    : "Mockup Required Requests"}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 dark:bg-purple-950/70 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                  {filteredRequests.length}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Review specifications, artwork dates, and update deliverable work done.
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
                className="h-9 w-full pl-9 pr-7 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
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

        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-400 animate-pulse">Loading studio requests...</div>
        ) : filteredRequests.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
              <Camera size={24} />
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
                  <th className="py-3 px-4">Deliverables</th>
                  <th className="py-3 px-4">Customer & Program</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Artwork Due</th>
                  <th className="py-3 px-4">Work Done Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredRequests.map((req) => {
                  const workDone = getWorkDone(req);
                  const isStudio = isStudioStage(req);
                  const isCreative = isCreativeStage(req);
                  const hasMockup = isMockupReq(req);
                  const artworkDue = req.targetArtworkDateStudio || req.targetArtworkDateCreative;
                  const overdue = isOverdue(artworkDue);
                  return (
                    <tr
                      key={req.id}
                      onClick={() => handleOpenSpecs(req)}
                      className="group hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs">
                          {req.srNumber || req.id}
                        </span>
                        <p className="text-[10px] font-sans font-medium text-slate-400 mt-0.5">{req.dateRequestCreated || "—"}</p>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {isStudio && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-900/60">
                              <Camera size={10} /><span>Studio</span>
                            </span>
                          )}
                          {isCreative && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-900/60">
                              <Palette size={10} /><span>Creative</span>
                            </span>
                          )}
                          {hasMockup && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-900/60">
                              <Package size={10} /><span>Mockup</span>
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 min-w-[160px]">
                        <p className="font-bold text-slate-900 dark:text-slate-100">{req.customer || "—"}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{req.programName} ({req.programYear || "2026"})</p>
                      </td>
                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">{req.productDescription?.split("\n")[0] || "—"}</p>
                        <p className="text-[10px] font-mono text-slate-400 mt-0.5">{req.materialCode || "—"}</p>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-medium ${overdue ? "text-rose-600 dark:text-rose-400" : "text-slate-600 dark:text-slate-300"}`}>
                          <Clock size={12} className={overdue ? "text-rose-500" : "text-slate-400"} />
                          {artworkDue || "Not set"}
                          {overdue && <span className="text-[9px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 px-1 rounded ml-1">Overdue</span>}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                              workDone.done
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
                                : "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800"
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
                            <div className={`h-1 rounded-full transition-all duration-300 ${workDone.done ? "bg-emerald-500" : "bg-gradient-to-r from-purple-500 to-violet-600"}`} style={{ width: `${workDone.progressPct}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleOpenSpecs(req); }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-xs font-semibold hover:bg-purple-100 dark:hover:bg-purple-900/60 transition-colors cursor-pointer"
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

export const StudioWorkPage: React.FC<StudioWorkPageProps> = ({ user, onLogout }) => (
  <DashboardLayout
    user={user}
    onLogout={onLogout}
    title="Studio Work"
    subtitle="Artwork preparation, mockup generation, CAD engineering, and studio approvals."
  >
    <StudioContent user={user} />
  </DashboardLayout>
);

export default StudioWorkPage;
