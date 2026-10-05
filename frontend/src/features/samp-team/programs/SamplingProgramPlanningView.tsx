import React, { useState, useMemo } from "react";
import { UserProfile } from "@/features/auth";
import { SampleRequestItem } from "@/features/sample-requests/types";
import { getRequestTrackType } from "@/features/sample-requests/utils/trackTypes";
import {
  Search,
  RefreshCw,
  FolderGit2,
  Building2,
  Calendar,
  Layers,
  CheckCircle2,
  Clock,
  Highlighter,
  Eye,
  ShieldCheck,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  Download,
  List as ListIcon,
  LayoutGrid,
  Filter,
  Package,
} from "lucide-react";
import { isMaterialAddedRecently } from "@/features/sample-requests/programs/components/ProgramChatterFeed";
import { parseSampRemark } from "@/features/sample-requests/programs/components/ProgramPlanningInspectorModal";

export interface SamplingProgramPlanningViewProps {
  requests: SampleRequestItem[];
  isLoading: boolean;
  selectedPlant: string;
  uniquePlants: string[];
  user?: UserProfile | null;
  isAdmin: boolean;
  onInspectRequest: (req: SampleRequestItem) => void;
  onRefresh: () => Promise<void>;
  showToast: (msg: string) => void;
}

export type SampProgramTab = "all" | "pending_review" | "reviewed";

export const SAMP_PROGRAM_KANBAN_COLUMNS = [
  {
    id: "pending_review",
    label: "1. Awaiting Technical Review",
    bgTone: "bg-amber-50/40 dark:bg-amber-950/20",
    borderTone: "border-amber-200/80 dark:border-amber-900/40",
    accentTone: "text-amber-700 dark:text-amber-400",
  },
  {
    id: "reviewed",
    label: "2. Reviewed by SAMP Lab",
    bgTone: "bg-[#017E84]/5 dark:bg-[#017E84]/15",
    borderTone: "border-[#017E84]/30 dark:border-[#017E84]/30",
    accentTone: "text-[#017E84] dark:text-[#2dd4bf]",
  },
];

export const SamplingProgramPlanningView: React.FC<SamplingProgramPlanningViewProps> = ({
  requests,
  isLoading,
  selectedPlant,
  uniquePlants,
  user,
  isAdmin,
  onInspectRequest,
  onRefresh,
  showToast,
}) => {
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");
  const [filterTab, setFilterTab] = useState<SampProgramTab>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [plantFilter, setPlantFilter] = useState("all");
  const [customerFilter, setCustomerFilter] = useState("all");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 15;

  const handleCopy = (code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 1200);
  };

  // Only consider program planning requests
  const programRequests = useMemo(() => {
    return requests.filter((r) => {
      const mode = String(r.creationMode || "").toLowerCase();
      const kind = String(r.requestKind || "").toLowerCase();
      const sr = String(r.srNumber || "").toLowerCase();
      const mat = String(r.materialCode || "").toLowerCase();
      return (
        kind === "program" ||
        mode === "program_planning" ||
        sr.includes("-pg-") ||
        mat.includes("pg-") ||
        getRequestTrackType(r) === "program_planning"
      );
    });
  }, [requests]);

  // Unique customers for filter
  const uniqueCustomers = useMemo(() => {
    const set = new Set<string>();
    programRequests.forEach((r) => {
      if (r.customer?.trim()) set.add(r.customer.trim());
    });
    return Array.from(set).sort();
  }, [programRequests]);

  // Telemetry metrics
  const metrics = useMemo(() => {
    const total = programRequests.length;
    let pending = 0;
    let reviewed = 0;
    let totalMaterials = 0;

    programRequests.forEach((r) => {
      const st = (r.status || "").toLowerCase();
      if (st.includes("reviewed") || st.includes("approved")) {
        reviewed++;
      } else {
        pending++;
      }
      totalMaterials += (r.programMaterials || []).length;
    });

    return { total, pending, reviewed, totalMaterials };
  }, [programRequests]);

  // Tab counts
  const tabCounts = useMemo(() => {
    return {
      all: metrics.total,
      pending_review: metrics.pending,
      reviewed: metrics.reviewed,
    };
  }, [metrics]);

  // Filtered list
  const filteredRequests = useMemo(() => {
    return programRequests.filter((r) => {
      const st = (r.status || "").toLowerCase();
      if (filterTab === "pending_review") {
        if (st.includes("reviewed") || st.includes("approved")) return false;
      } else if (filterTab === "reviewed") {
        if (!st.includes("reviewed") && !st.includes("approved")) return false;
      }

      if (plantFilter !== "all" && r.targetPlant !== plantFilter) {
        return false;
      }

      if (customerFilter !== "all" && r.customer !== customerFilter) {
        return false;
      }

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const code = (r.materialCode || r.srNumber || "").toLowerCase();
        const cust = (r.customer || "").toLowerCase();
        const title = (r.programName || r.productDescription || "").toLowerCase();
        const plant = (r.targetPlant || "").toLowerCase();
        if (!code.includes(q) && !cust.includes(q) && !title.includes(q) && !plant.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [programRequests, filterTab, plantFilter, customerFilter, searchTerm]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredRequests.length / PAGE_SIZE));
  const paginatedRequests = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredRequests.slice(start, start + PAGE_SIZE);
  }, [filteredRequests, currentPage]);

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      "Program Code",
      "SR Number",
      "Campaign Title",
      "Customer",
      "Target Plant",
      "Program Year",
      "Status",
      "Materials Count",
      "Created By",
      "Created Date",
    ];

    const rows = filteredRequests.map((r) => [
      r.materialCode || "",
      r.srNumber || "",
      `"${(r.programName || r.productDescription || "").replace(/"/g, '""')}"`,
      `"${(r.customer || "").replace(/"/g, '""')}"`,
      r.targetPlant || "",
      r.programYear || "2026",
      r.status || "Pending SAMP Review",
      (r.programMaterials || []).length,
      r.createdBy || "Marketing",
      r.dateRequestCreated || r.createdAt || "",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `SAMP_Program_Planning_Review_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#F8F9FA] dark:bg-[#0b0c10] select-text">
      {/* ── 1. Compact Page Header (Matched to Feasibility Workbench) ── */}
      <div className="bg-white dark:bg-[#12141d] border-b border-[#E2E8F0] dark:border-white/[0.08] px-6 py-3 shrink-0">
        <div className="flex items-center justify-between gap-4">
          {/* Title + badge */}
          <div className="flex items-center gap-2.5 min-w-0">
            <h1 className="text-sm font-bold text-neutral-900 dark:text-white truncate">
              Seasonal Program Planning Review Workbench
            </h1>
            <span className="shrink-0 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#017E84]/10 text-[#017E84] dark:bg-teal-950/40 dark:text-teal-300 border border-[#017E84]/20">
              SAMP Lab
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Refresh */}
            <button
              type="button"
              onClick={onRefresh}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-[#CED4DA] dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-neutral-50 dark:hover:bg-zinc-700 text-xs font-semibold text-neutral-700 dark:text-zinc-200 shadow-2xs transition cursor-pointer disabled:opacity-50"
              title="Refresh Records"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-[#017E84]" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            {/* Export CSV */}
            <button
              type="button"
              onClick={handleExportCSV}
              disabled={filteredRequests.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-[#CED4DA] dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-neutral-50 dark:hover:bg-zinc-700 text-xs font-semibold text-neutral-700 dark:text-zinc-200 shadow-2xs transition cursor-pointer disabled:opacity-50"
              title="Export CSV"
            >
              <Download className="w-3.5 h-3.5 text-neutral-500" />
              <span className="hidden sm:inline">Export</span>
            </button>

            {/* View Mode Toggle */}
            <div className="inline-flex rounded border border-[#CED4DA] dark:border-zinc-700 bg-white dark:bg-zinc-800 p-0.5 shadow-2xs">
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`px-2 py-1 rounded text-xs transition cursor-pointer flex items-center gap-1.5 ${
                  viewMode === "list"
                    ? "bg-[#714B67] text-white shadow-2xs font-bold"
                    : "text-neutral-500 hover:text-neutral-800 dark:text-zinc-400"
                }`}
                title="Table View"
              >
                <ListIcon className="w-3.5 h-3.5" />
                <span className="text-[11px] font-semibold">List</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("kanban")}
                className={`px-2 py-1 rounded text-xs transition cursor-pointer flex items-center gap-1.5 ${
                  viewMode === "kanban"
                    ? "bg-[#714B67] text-white shadow-2xs font-bold"
                    : "text-neutral-500 hover:text-neutral-800 dark:text-zinc-400"
                }`}
                title="Kanban Pipeline Swimlanes"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="text-[11px] font-semibold">Kanban</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── 2. KPI Metric Ribbon (Exact 4 Cards Matching Feasibility Workbench) ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-3 pt-3 border-t border-[#F1F5F9] dark:border-white/[0.05]">
          {/* Card 1: Total Programs */}
          <div
            onClick={() => {
              setFilterTab("all");
              setCurrentPage(1);
            }}
            className={`p-2.5 rounded-lg border transition cursor-pointer ${
              filterTab === "all"
                ? "border-[#714B67] bg-[#714B67]/5 dark:bg-[#714B67]/20 shadow-2xs"
                : "border-[#E2E8F0] dark:border-white/[0.06] bg-neutral-50/60 dark:bg-zinc-900/40 hover:border-neutral-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] uppercase font-bold text-neutral-500 dark:text-zinc-400 font-mono tracking-wider">
                Total Intake
              </span>
              <FolderGit2 className="w-3.5 h-3.5 text-[#714B67]" />
            </div>
            <div className="text-xl font-bold font-mono text-neutral-900 dark:text-zinc-100 mt-0.5">
              {isLoading ? "—" : metrics.total}
            </div>
            <div className="text-[10px] text-neutral-400 font-mono">From Marketing Desk</div>
          </div>

          {/* Card 2: Needs Lab Review */}
          <div
            onClick={() => {
              setFilterTab("pending_review");
              setCurrentPage(1);
            }}
            className={`p-2.5 rounded-lg border transition cursor-pointer ${
              filterTab === "pending_review"
                ? "border-amber-400 bg-amber-500/10 dark:bg-amber-950/30 shadow-2xs"
                : "border-[#E2E8F0] dark:border-white/[0.06] bg-neutral-50/60 dark:bg-zinc-900/40 hover:border-amber-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] uppercase font-bold text-amber-700 dark:text-amber-300 font-mono tracking-wider">
                Needs Lab Review
              </span>
              <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="text-xl font-bold font-mono text-amber-900 dark:text-amber-200 mt-0.5">
              {isLoading ? "—" : metrics.pending}
            </div>
            <div className="text-[10px] text-amber-700/80 dark:text-amber-400/80 font-mono">
              Awaiting Technical Check
            </div>
          </div>

          {/* Card 3: Reviewed by SAMP */}
          <div
            onClick={() => {
              setFilterTab("reviewed");
              setCurrentPage(1);
            }}
            className={`p-2.5 rounded-lg border transition cursor-pointer ${
              filterTab === "reviewed"
                ? "border-[#017E84] bg-teal-500/10 dark:bg-teal-950/30 shadow-2xs"
                : "border-[#E2E8F0] dark:border-white/[0.06] bg-neutral-50/60 dark:bg-zinc-900/40 hover:border-teal-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] uppercase font-bold text-teal-700 dark:text-teal-300 font-mono tracking-wider">
                Reviewed by SAMP
              </span>
              <ShieldCheck className="w-3.5 h-3.5 text-[#017E84] dark:text-[#2dd4bf]" />
            </div>
            <div className="text-xl font-bold font-mono text-[#017E84] dark:text-[#2dd4bf] mt-0.5">
              {isLoading ? "—" : metrics.reviewed}
            </div>
            <div className="text-[10px] text-teal-700/80 dark:text-teal-400/80 font-mono">
              Matrix Verified &amp; Signed
            </div>
          </div>

          {/* Card 4: Total Materials SKUs */}
          <div className="p-2.5 rounded-lg border border-[#E2E8F0] dark:border-white/[0.06] bg-neutral-50/60 dark:bg-zinc-900/40">
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] uppercase font-bold text-purple-700 dark:text-purple-300 font-mono tracking-wider">
                Matrix SKUs Total
              </span>
              <Layers className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="text-xl font-bold font-mono text-purple-900 dark:text-purple-200 mt-0.5">
              {isLoading ? "—" : metrics.totalMaterials}
            </div>
            <div className="text-[10px] text-purple-700/80 dark:text-purple-400/80 font-mono">
              Raw Material Lines
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. Filter Tabs + Search Controls ── */}
      <div className="bg-white dark:bg-[#12141d] border-b border-[#E2E8F0] dark:border-white/[0.08] px-6 py-2 shrink-0">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
            {[
              { id: "all" as const, label: "All Programs", count: tabCounts.all },
              { id: "pending_review" as const, label: "Pending SAMP Review", count: tabCounts.pending_review },
              { id: "reviewed" as const, label: "Reviewed / Verified", count: tabCounts.reviewed },
            ].map((tab) => {
              const active = filterTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setFilterTab(tab.id);
                    setCurrentPage(1);
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                    active
                      ? "bg-[#714B67] text-white shadow-xs"
                      : "text-neutral-600 dark:text-zinc-400 hover:bg-neutral-100 dark:hover:bg-zinc-800"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                      active
                        ? "bg-white/20 text-white"
                        : "bg-neutral-200 dark:bg-zinc-700 text-neutral-700 dark:text-zinc-300"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search + Dropdown Filters */}
          <div className="flex items-center gap-2">
            {/* Customer Filter */}
            <div className="relative shrink-0">
              <select
                value={customerFilter}
                onChange={(e) => {
                  setCustomerFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-8 pl-2.5 pr-7 rounded border border-[#CED4DA] dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-medium text-neutral-700 dark:text-zinc-200 focus:outline-none focus:border-[#714B67] transition cursor-pointer appearance-none"
              >
                <option value="all">All Customers</option>
                {uniqueCustomers.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <Filter className="w-3 h-3 text-neutral-400 absolute right-2 top-2.5 pointer-events-none" />
            </div>

            {/* Plant Filter */}
            <div className="relative shrink-0">
              <select
                value={plantFilter}
                onChange={(e) => {
                  setPlantFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-8 pl-2.5 pr-7 rounded border border-[#CED4DA] dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-medium text-neutral-700 dark:text-zinc-200 focus:outline-none focus:border-[#714B67] transition cursor-pointer appearance-none font-mono"
              >
                <option value="all">All Plants ({metrics.total})</option>
                {uniquePlants.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
              <Filter className="w-3 h-3 text-neutral-400 absolute right-2 top-2.5 pointer-events-none" />
            </div>

            {/* Search Input */}
            <div className="relative w-48 sm:w-64">
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-2.5 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search programs, SKUs, customer..."
                className="w-full h-8 pl-8 pr-3 rounded border border-[#CED4DA] dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-neutral-800 dark:text-zinc-100 placeholder:text-neutral-400 focus:outline-none focus:border-[#714B67] transition"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2 top-2 text-neutral-400 hover:text-neutral-700 dark:hover:text-zinc-200 text-xs font-bold"
                >
                  ×
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── 4. Main Data Table or Kanban View ── */}
      <div className="flex-1 overflow-y-auto">
        {viewMode === "list" ? (
          <div className="min-w-full inline-block align-middle">
            {filteredRequests.length === 0 ? (
              <div className="py-16 text-center">
                <FolderGit2 className="w-12 h-12 text-neutral-300 dark:text-zinc-600 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-neutral-700 dark:text-zinc-300">
                  No seasonal programs match your current filter
                </h3>
                <p className="text-xs text-neutral-400 dark:text-zinc-500 mt-1">
                  Try resetting the search facet or changing plant / stage filter.
                </p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-white dark:bg-[#12141d] border-b border-[#E2E8F0] dark:border-white/[0.08] text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-500 dark:text-zinc-400 select-none">
                    <th className="py-2.5 px-4 w-12 text-center">#</th>
                    <th className="py-2.5 px-4">Program Ref / Code</th>
                    <th className="py-2.5 px-4">Campaign Title</th>
                    <th className="py-2.5 px-4">Customer</th>
                    <th className="py-2.5 px-4">Plant</th>
                    <th className="py-2.5 px-4">Year</th>
                    <th className="py-2.5 px-4 text-center">Matrix SKUs</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4">Submitter</th>
                    <th className="py-2.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#F1F3F5] dark:divide-white/[0.04] bg-white dark:bg-[#12141d]">
                  {paginatedRequests.map((req, idx) => {
                    const rowNumber = (currentPage - 1) * PAGE_SIZE + idx + 1;
                    const materialCount = (req.programMaterials || []).length;
                    const isReviewed =
                      req.status?.toLowerCase().includes("reviewed") ||
                      req.status?.toLowerCase().includes("approved");
                    const hasRecent = (req.programMaterials || []).some((m) =>
                      isMaterialAddedRecently(m.createdAt)
                    );
                    const totalFlags = (req.programMaterials || []).reduce((acc, m) => {
                      const { highlightedCols } = parseSampRemark(m.sampRemark);
                      return acc + highlightedCols.length;
                    }, 0);
                    const evaluatedCount = (req.programMaterials || []).filter((m) => {
                      const { text, highlightedCols } = parseSampRemark(m.sampRemark);
                      return Boolean(text.trim() || highlightedCols.length > 0);
                    }).length;

                    return (
                      <tr
                        key={req.id}
                        onClick={() => onInspectRequest(req)}
                        className="hover:bg-neutral-50/80 dark:hover:bg-zinc-800/50 transition cursor-pointer"
                      >
                        {/* 1. # */}
                        <td className="py-3 px-4 text-center font-mono text-[11px] text-neutral-400 font-semibold">
                          {String(rowNumber).padStart(2, "0")}
                        </td>

                        {/* 2. Code */}
                        <td className="py-3 px-4 font-mono font-bold text-xs text-[#017E84] dark:text-[#2dd4bf]">
                          <div className="flex items-center gap-1.5">
                            <span>{req.materialCode || req.srNumber}</span>
                            <button
                              type="button"
                              onClick={(e) => handleCopy(req.materialCode || req.srNumber, e)}
                              className="text-neutral-400 hover:text-neutral-700 dark:hover:text-zinc-200 cursor-pointer"
                              title="Copy code"
                            >
                              {copiedCode === (req.materialCode || req.srNumber) ? (
                                <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </td>

                        {/* 3. Title */}
                        <td className="py-3 px-4 font-semibold text-neutral-900 dark:text-zinc-100 max-w-xs truncate">
                          {req.programName || req.productDescription || "Seasonal Program"}
                        </td>

                        {/* 4. Customer */}
                        <td className="py-3 px-4 text-neutral-800 dark:text-zinc-200 font-medium">
                          <div className="flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                            <span>{req.customer}</span>
                          </div>
                        </td>

                        {/* 5. Plant */}
                        <td className="py-3 px-4 font-mono text-[11px] text-neutral-600 dark:text-zinc-400">
                          {req.targetPlant || "1505"}
                        </td>

                        {/* 6. Year */}
                        <td className="py-3 px-4 font-mono text-[11px] text-neutral-800 dark:text-zinc-200">
                          <span className="px-2 py-0.5 rounded bg-neutral-100 dark:bg-zinc-800 text-neutral-700 dark:text-zinc-300 font-bold">
                            {req.programYear || "2026"}
                          </span>
                        </td>

                        {/* 7. Matrix SKUs */}
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5 flex-wrap">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10.5px] font-mono font-bold bg-neutral-100 dark:bg-zinc-800 text-neutral-800 dark:text-zinc-200 border border-neutral-200 dark:border-zinc-700">
                              {materialCount} line{materialCount !== 1 ? "s" : ""}
                            </span>
                            {hasRecent && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[8.5px] font-mono font-bold bg-emerald-500 text-white shadow-2xs animate-pulse uppercase">
                                ✨ New Line
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 8. Status & Flags */}
                        <td className="py-3 px-4">
                          <div className="flex flex-col gap-1 items-start">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded text-[10.5px] font-mono font-bold uppercase tracking-wider border ${
                                isReviewed
                                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                                  : "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                              }`}
                            >
                              {req.status || "Pending SAMP Review"}
                            </span>
                            {totalFlags > 0 ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-amber-700 dark:text-amber-400">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                {totalFlags} Column Flag{totalFlags !== 1 ? "s" : ""}
                              </span>
                            ) : evaluatedCount > 0 ? (
                              <span className="text-[10px] font-mono text-zinc-500">
                                {evaluatedCount}/{materialCount} evaluated
                              </span>
                            ) : null}
                          </div>
                        </td>

                        {/* 9. Submitter */}
                        <td className="py-3 px-4 text-neutral-500 font-mono text-[11px]">
                          <div>{req.createdBy || "Marketing"}</div>
                          <div className="text-[10px] text-neutral-400">{req.dateRequestCreated || "Recent"}</div>
                        </td>

                        {/* 10. Actions */}
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onInspectRequest(req);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-[#017E84] hover:bg-[#00666A] active:bg-[#005256] text-white text-[11px] font-bold shadow-xs transition active:scale-95 cursor-pointer"
                          >
                            <Highlighter className="w-3 h-3" />
                            <span>Review Matrix</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        ) : (
          /* Kanban Swimlanes Mode */
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {SAMP_PROGRAM_KANBAN_COLUMNS.map((col) => {
              const colRequests = filteredRequests.filter((r) => {
                const st = (r.status || "").toLowerCase();
                const isRev = st.includes("reviewed") || st.includes("approved");
                return col.id === "reviewed" ? isRev : !isRev;
              });

              return (
                <div
                  key={col.id}
                  className={`rounded-xl border ${col.borderTone} ${col.bgTone} p-4 flex flex-col min-h-[500px]`}
                >
                  <div className="flex items-center justify-between pb-3 border-b border-black/5 dark:border-white/5 mb-3">
                    <span className={`text-xs font-bold font-mono uppercase tracking-wider ${col.accentTone}`}>
                      {col.label}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white dark:bg-zinc-800 text-neutral-700 dark:text-zinc-300 border border-neutral-200 dark:border-zinc-700">
                      {colRequests.length}
                    </span>
                  </div>

                  <div className="space-y-3 flex-1 overflow-y-auto">
                    {colRequests.map((req) => (
                      <div
                        key={req.id}
                        onClick={() => onInspectRequest(req)}
                        className="p-3.5 rounded-lg bg-white dark:bg-[#12141d] border border-neutral-200 dark:border-zinc-800 shadow-2xs hover:shadow-xs transition cursor-pointer group"
                      >
                        <div className="flex items-center justify-between text-[11px] font-mono text-[#017E84] font-bold mb-1">
                          <span>{req.materialCode || req.srNumber}</span>
                          <span className="text-neutral-500 font-normal">{req.programYear || "2026"}</span>
                        </div>
                        <h4 className="text-xs font-bold text-neutral-900 dark:text-zinc-100 group-hover:text-[#714B67] transition">
                          {req.programName || req.productDescription || "Seasonal Program"}
                        </h4>
                        <div className="mt-2 flex items-center justify-between text-[10.5px] text-neutral-500">
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3 h-3 text-neutral-400" />
                            {req.customer}
                          </span>
                          <span className="font-mono font-semibold">
                            {(req.programMaterials || []).length} SKUs
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── 5. Sticky Bottom Pagination (Matched to Feasibility Workbench) ── */}
      {viewMode === "list" && filteredRequests.length > 0 && (
        <div className="bg-white dark:bg-[#12141d] border-t border-[#E2E8F0] dark:border-white/[0.08] px-6 py-2.5 flex items-center justify-between text-xs text-neutral-500 dark:text-zinc-400 shrink-0">
          <div>
            Showing <strong className="text-neutral-900 dark:text-zinc-200">{paginatedRequests.length}</strong> of{" "}
            <strong className="text-neutral-900 dark:text-zinc-200">{filteredRequests.length}</strong> campaigns
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-2.5 py-1 rounded border border-[#CED4DA] dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-neutral-50 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer text-xs"
            >
              Prev
            </button>
            <span className="font-mono text-xs">
              {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-2.5 py-1 rounded border border-[#CED4DA] dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-neutral-50 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer text-xs"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
