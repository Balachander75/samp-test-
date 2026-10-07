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
  Package,
} from "lucide-react";
import { isMaterialAddedRecently } from "@/features/sample-requests/programs/components/ProgramChatterFeed";
import { parseSampRemark } from "@/features/sample-requests/programs/utils/programRemarkUtils";
import { CopyBadge } from "@/components/ui/CopyBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { WorkflowTabStrip } from "@/components/erp/WorkflowTabStrip";
import { PaginationBar } from "@/components/erp/PaginationBar";
import { exportRecordsToCsv } from "@/lib/csvExport";

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
  const [filterTab, setFilterTab] = useState<SampProgramTab>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [plantFilter, setPlantFilter] = useState("all");
  const [customerFilter, setCustomerFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 15;

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

  const totalPages = Math.max(1, Math.ceil(filteredRequests.length / PAGE_SIZE));
  const paginatedRequests = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredRequests.slice(start, start + PAGE_SIZE);
  }, [filteredRequests, currentPage]);

  const sampTabs = useMemo(
    () => [
      { id: "all", label: "All Programs", count: tabCounts.all },
      { id: "pending_review", label: "Pending SAMP Review", count: tabCounts.pending_review },
      { id: "reviewed", label: "Reviewed / Verified", count: tabCounts.reviewed },
    ],
    [tabCounts]
  );

  // Export CSV
  const handleExportCSV = () => {
    const dateStr = new Date().toISOString().split("T")[0];
    exportRecordsToCsv({
      filename: `SAMP_Program_Planning_Review_${dateStr}.csv`,
      columns: [
        { header: "Program Code", accessor: (r) => r.materialCode || "" },
        { header: "SR Number", accessor: (r) => r.srNumber || "" },
        { header: "Campaign Title", accessor: (r) => r.programName || r.productDescription || "" },
        { header: "Customer", accessor: (r) => r.customer || "" },
        { header: "Target Plant", accessor: (r) => r.targetPlant || "" },
        { header: "Program Year", accessor: (r) => r.programYear || "2026" },
        { header: "Status", accessor: (r) => r.status || "Pending SAMP Review" },
        { header: "Materials Count", accessor: (r) => (r.programMaterials || []).length },
        { header: "Created By", accessor: (r) => r.createdBy || "Marketing" },
        { header: "Created Date", accessor: (r) => r.dateRequestCreated || r.createdAt || "" },
      ],
      data: filteredRequests,
    });
    showToast(`Exported ${filteredRequests.length} program planning records to CSV`);
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
              SAMP Team
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
                Needs SAMP Review
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
          <WorkflowTabStrip
            tabs={sampTabs}
            activeTab={filterTab}
            onSelectTab={(id) => {
              setFilterTab(id as SampProgramTab);
              setCurrentPage(1);
            }}
            compact
          />

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

      {/* ── 4. Main Data Table ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="min-w-full inline-block align-middle">
            {filteredRequests.length === 0 ? (
              <EmptyState
                icon={FolderGit2}
                title="No seasonal programs match your current filter"
                description="Try resetting the search facet or changing plant / stage filter."
                onResetFilters={() => {
                  setFilterTab("all");
                  setPlantFilter("all");
                  setCustomerFilter("all");
                  setSearchTerm("");
                }}
              />
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
                        <td className="py-3 px-4 font-mono font-bold text-xs whitespace-nowrap">
                          <CopyBadge text={req.materialCode || req.srNumber} />
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
        </div>

      {/* ── 5. Sticky Bottom Pagination (Matched to Feasibility Workbench) ── */}
      <PaginationBar
        currentPage={currentPage}
        totalPages={totalPages}
        totalCount={filteredRequests.length}
        pageSize={PAGE_SIZE}
        onPageChange={(p) => setCurrentPage(p)}
        itemLabel="campaigns"
      />
    </div>
  );
};
