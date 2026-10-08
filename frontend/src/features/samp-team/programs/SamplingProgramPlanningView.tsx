import React, { useState, useMemo } from "react";
import { UserProfile } from "@/features/auth";
import { SampleRequestItem } from "@/features/sample-requests/types";
import { getRequestTrackType } from "@/features/sample-requests/utils/trackTypes";
import {
  Search,
  X,
  RefreshCw,
  FolderGit2,
  Building2,
  CheckCircle2,
  Clock,
  Highlighter,
  Download,
} from "lucide-react";
import { isMaterialAddedRecently } from "@/features/sample-requests/programs/components/ProgramChatterFeed";
import { parseSampRemark } from "@/features/sample-requests/programs/utils/programRemarkUtils";
import { CopyBadge } from "@/components/ui/CopyBadge";
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

  // Scoped strictly to program planning requests
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

  // Derived Customers List strictly from programRequests
  const customerList = useMemo(() => {
    const set = new Set<string>();
    programRequests.forEach((r) => {
      if (r.customer?.trim()) set.add(r.customer.trim());
    });
    return Array.from(set).sort();
  }, [programRequests]);

  // Derived Plants List strictly from programRequests
  const plantList = useMemo(() => {
    const set = new Set<string>();
    programRequests.forEach((r) => {
      if (r.targetPlant?.trim()) set.add(r.targetPlant.trim());
    });
    return Array.from(set).sort();
  }, [programRequests]);

  // Operational metrics
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

  // Navigation tab definitions with live counters
  const navTabs: { id: SampProgramTab; label: string; count: number }[] = [
    { id: "all", label: "All Programs", count: metrics.total },
    { id: "pending_review", label: "Pending SAMP Review", count: metrics.pending },
    { id: "reviewed", label: "Reviewed / Verified", count: metrics.reviewed },
  ];

  // Filtered dataset
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
    <div className="flex-1 flex flex-col min-h-0 bg-white text-slate-800 select-text overflow-hidden">
      {/* ── 1. Compact Editorial Header ── */}
      <header className="bg-white px-6 py-3 shrink-0 border-b border-slate-200/60 shadow-[0_1px_4px_rgba(11,28,48,0.02)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 font-display">
              Seasonal Program Planning Review Workbench
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold font-mono bg-[#006d32]/10 text-[#006d32]">
              SAMP Team
            </span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold font-mono bg-slate-100 text-slate-600">
              {metrics.total} Programs
            </span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold font-mono bg-[#006d32]/10 text-[#006d32] border border-[#006d32]/20">
              {metrics.totalMaterials} SKUs
            </span>
            {metrics.pending > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold font-mono bg-amber-50 text-amber-700 animate-pulse">
                ⚡ {metrics.pending} Needs Review
              </span>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Refresh */}
            <button
              type="button"
              onClick={onRefresh}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-xs font-semibold text-slate-700 transition cursor-pointer disabled:opacity-50"
              title="Refresh Records"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-[#006d32]" : "text-slate-500"}`}
              />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            {/* Export CSV */}
            <button
              type="button"
              onClick={handleExportCSV}
              disabled={filteredRequests.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-xs font-semibold text-slate-700 transition cursor-pointer disabled:opacity-50"
              title="Export CSV"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Export</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── 2. Floating Filter & Search Strip ── */}
      <div className="px-6 py-2 bg-white/80 backdrop-blur-xs shrink-0 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/50">
        {/* Soft Segmented Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 select-none">
          {navTabs.map((t) => {
            const isActive = filterTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setFilterTab(t.id);
                  setCurrentPage(1);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer ${
                  isActive
                    ? "bg-[#006d32] text-white shadow-[0_2px_8px_rgba(0,109,50,0.25)]"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 bg-transparent"
                }`}
              >
                <span>{t.label}</span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full tabular-nums ${
                    isActive ? "bg-white/25 text-white" : "bg-slate-200/70 text-slate-600"
                  }`}
                >
                  {t.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right Search, Customer, Plant Select */}
        <div className="flex items-center gap-2 flex-1 sm:flex-initial justify-end">
          {customerList.length > 0 && (
            <select
              value={customerFilter}
              onChange={(e) => {
                setCustomerFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="h-9 px-3 rounded-lg bg-slate-100/80 hover:bg-slate-200/60 text-xs font-medium text-slate-700 border border-slate-200/70 focus:outline-none focus:ring-2 focus:ring-[#006d32]/15 focus:border-[#006d32]/40 cursor-pointer transition"
            >
              <option value="all">All Customers</option>
              {customerList.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}

          {plantList.length > 0 && (
            <select
              value={plantFilter}
              onChange={(e) => {
                setPlantFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="h-9 px-3 rounded-lg bg-slate-100/80 hover:bg-slate-200/60 text-xs font-medium text-slate-700 border border-slate-200/70 focus:outline-none focus:ring-2 focus:ring-[#006d32]/15 focus:border-[#006d32]/40 cursor-pointer transition font-mono"
            >
              <option value="all">All Plants</option>
              {plantList.map((p) => (
                <option key={p} value={p}>
                  Plant {p}
                </option>
              ))}
            </select>
          )}

          <div className="relative w-60 sm:w-72 group">
            <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#006d32] transition-colors pointer-events-none" />
            <input
              type="text"
              placeholder="Search programs, SKUs, customer..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-9 pl-[34px] pr-8 rounded-lg bg-slate-100/80 hover:bg-slate-200/50 focus:bg-white text-xs text-slate-800 placeholder:text-slate-400 border border-slate-200/70 focus:border-[#006d32]/40 focus:outline-none focus:ring-2 focus:ring-[#006d32]/15 shadow-2xs transition-all"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-4.5 h-4.5 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/80 transition-colors cursor-pointer"
                title="Clear search"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── 3. Full-Bleed Table Workspace (Seamlessly Blended into Full UI) ── */}
      <div className="flex-1 min-h-0 overflow-auto bg-white flex flex-col">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="sticky top-0 z-10 bg-slate-50/90 backdrop-blur-xs border-b border-slate-200/70">
            <tr className="text-slate-600 font-mono text-[11px] uppercase tracking-wider select-none">
              <th className="py-3 pl-6 pr-3 w-12 text-center">#</th>
              <th className="py-3 px-4 font-semibold whitespace-nowrap">Program ID</th>
              <th className="py-3 px-4 font-semibold">Campaign Title & Scope</th>
              <th className="py-3 px-4 font-semibold whitespace-nowrap">Customer</th>
              <th className="py-3 px-4 font-semibold whitespace-nowrap">Plant</th>
              <th className="py-3 px-4 font-semibold text-center whitespace-nowrap">Year</th>
              <th className="py-3 px-4 font-semibold text-center whitespace-nowrap">Matrix SKUs</th>
              <th className="py-3 px-4 font-semibold whitespace-nowrap">Review Status</th>
              <th className="py-3 px-4 font-semibold whitespace-nowrap">Submitter</th>
              <th className="py-3 pl-4 pr-6 font-semibold text-right whitespace-nowrap">Action</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {filteredRequests.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-20 text-center">
                  <div className="max-w-sm mx-auto flex flex-col items-center">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
                      <FolderGit2 className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-800">No Seasonal Programs Found</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      {searchTerm || customerFilter !== "all" || filterTab !== "all" || plantFilter !== "all"
                        ? "No programs match your search or active filter criteria."
                        : "There are currently no seasonal program planning requests submitted."}
                    </p>
                    {(searchTerm || customerFilter !== "all" || filterTab !== "all" || plantFilter !== "all") && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchTerm("");
                          setCustomerFilter("all");
                          setPlantFilter("all");
                          setFilterTab("all");
                        }}
                        className="mt-3 text-xs font-semibold text-[#006d32] hover:underline cursor-pointer"
                      >
                        Reset filters
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              paginatedRequests.map((req, idx) => {
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
                    className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                  >
                    {/* 1. # */}
                    <td className="py-3.5 pl-6 pr-3 text-center font-mono text-[11px] text-slate-400 font-semibold">
                      {String(rowNumber).padStart(2, "0")}
                    </td>

                    {/* 2. Program ID */}
                    <td className="py-3.5 px-4 font-mono font-bold text-xs whitespace-nowrap">
                      <CopyBadge text={req.materialCode || req.srNumber} />
                    </td>

                    {/* 3. Campaign Title & Scope */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="font-semibold text-slate-900 truncate">
                        {req.programName || req.productDescription || "Seasonal Program"}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate mt-0.5">
                        {req.productDescription || "Multi-SKU range"}
                      </div>
                    </td>

                    {/* 4. Customer */}
                    <td className="py-3.5 px-4 font-semibold text-slate-900 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{req.customer || "—"}</span>
                      </div>
                    </td>

                    {/* 5. Plant */}
                    <td className="py-3.5 px-4 font-mono text-slate-600 whitespace-nowrap">
                      Plant {req.targetPlant || "1505"}
                    </td>

                    {/* 6. Year */}
                    <td className="py-3.5 px-4 text-center font-mono text-xs whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold">
                        {req.programYear || "2026"}
                      </span>
                    </td>

                    {/* 7. Matrix SKUs */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5 flex-wrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-mono font-bold bg-[#006d32]/10 text-[#006d32]">
                          {materialCount} SKU{materialCount !== 1 ? "s" : ""}
                        </span>
                        {hasRecent && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-[8.5px] font-mono font-bold bg-emerald-500 text-white shadow-2xs animate-pulse uppercase">
                            ✨ New
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 8. Status & Flags */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1 items-start">
                        {isReviewed ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-emerald-50 text-emerald-700">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Reviewed by SAMP</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-amber-50 text-amber-700">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            <span>Pending Review</span>
                          </span>
                        )}
                        {totalFlags > 0 ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-amber-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            {totalFlags} Column Flag{totalFlags !== 1 ? "s" : ""}
                          </span>
                        ) : evaluatedCount > 0 ? (
                          <span className="text-[10px] font-mono text-slate-500">
                            {evaluatedCount}/{materialCount} evaluated
                          </span>
                        ) : null}
                      </div>
                    </td>

                    {/* 9. Submitter */}
                    <td className="py-3.5 px-4 text-slate-600 font-mono text-xs whitespace-nowrap">
                      <div>{req.createdBy || "Marketing"}</div>
                      <div className="text-[10px] text-slate-400">{req.dateRequestCreated || "Recent"}</div>
                    </td>

                    {/* 10. Actions */}
                    <td className="py-3.5 pl-4 pr-6 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => onInspectRequest(req)}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold font-mono transition cursor-pointer"
                      >
                        <Highlighter className="w-3 h-3 text-[#006d32]" />
                        <span>Review Matrix</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Table Footer Pager */}
        <div className="mt-auto px-6 py-2.5 bg-white border-t border-slate-100 shrink-0">
          <PaginationBar
            currentPage={currentPage}
            totalPages={totalPages}
            totalCount={filteredRequests.length}
            pageSize={PAGE_SIZE}
            onPageChange={(p) => setCurrentPage(p)}
            itemLabel="campaigns"
          />
        </div>
      </div>
    </div>
  );
};

export default SamplingProgramPlanningView;
