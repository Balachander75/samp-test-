import React, { useState, useMemo } from "react";
import { UserProfile } from "@/features/auth";
import { SampleRequestItem } from "../types";
import { getRequestTrackType } from "../utils/trackTypes";
import { useNavigate } from "react-router-dom";
import {
  FolderGit2,
  Plus,
  RefreshCw,
  Search,
  X,
  Building2,
  Calendar,
  Sparkles,
  Trash2,
  Clock,
  Highlighter,
  CheckCircle2,
  Download,
  ClipboardCheck,
  ChevronRight,
  Layers,
} from "lucide-react";
import { parseSampRemark } from "./utils/programRemarkUtils";
import { CopyBadge } from "@/components/ui/CopyBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { PaginationBar } from "@/components/erp/PaginationBar";
import { exportRecordsToCsv } from "@/lib/csvExport";

const NewProgramPlanningModal = React.lazy(() =>
  import("./components/NewProgramPlanningModal").then((m) => ({ default: m.NewProgramPlanningModal }))
);
const ProgramPlanningInspectorModal = React.lazy(() =>
  import("./components/ProgramPlanningInspectorModal").then((m) => ({ default: m.ProgramPlanningInspectorModal }))
);

export interface ProgramPlanningPageProps {
  requests: SampleRequestItem[];
  isLoading: boolean;
  selectedYear: string;
  selectedPlant: string;
  uniquePlants: string[];
  uniqueCustomers?: string[];
  user?: UserProfile | null;
  isAdmin: boolean;
  onOpenNewModal: () => void;
  onInspectRequest: (req: SampleRequestItem) => void;
  onDeleteRequest: (req: SampleRequestItem, e?: React.MouseEvent) => Promise<void>;
  onRefresh: () => Promise<void>;
}

export type ProgramStageTab = "all" | "awaiting_review" | "reviewed" | "production";

const PROGRAM_STAGE_TABS: { id: ProgramStageTab; label: string }[] = [
  { id: "all", label: "All Programs" },
  { id: "awaiting_review", label: "Awaiting SAMP Review" },
  { id: "reviewed", label: "Reviewed by SAMP" },
  { id: "production", label: "Production Handoff" },
];

export const ProgramPlanningPage: React.FC<ProgramPlanningPageProps> = ({
  requests,
  isLoading,
  selectedYear,
  selectedPlant,
  uniquePlants,
  uniqueCustomers,
  user,
  isAdmin,
  onOpenNewModal,
  onInspectRequest,
  onDeleteRequest,
  onRefresh,
}) => {
  const navigate = useNavigate();
  const [filterTab, setFilterTab] = useState<ProgramStageTab>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [customerFilter, setCustomerFilter] = useState("all");
  const [selectedPlantFilter, setSelectedPlantFilter] = useState<string>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());

  // Local Modal States
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [inspectingProgram, setInspectingProgram] = useState<SampleRequestItem | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 30;

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

  // Derived Customers List strictly from program planning requests
  const customerList = useMemo(() => {
    const set = new Set<string>();
    programRequests.forEach((r) => {
      if (r.customer && r.customer.trim()) set.add(r.customer.trim());
    });
    return Array.from(set).sort();
  }, [programRequests]);

  // Derived Plants List strictly from program planning requests
  const plantList = useMemo(() => {
    const set = new Set<string>();
    programRequests.forEach((r) => {
      if (r.targetPlant && r.targetPlant.trim()) set.add(r.targetPlant.trim());
    });
    return Array.from(set).sort();
  }, [programRequests]);

  // Operational metrics
  const programStats = useMemo(() => {
    const totalPrograms = programRequests.length;
    let awaitingReviewCount = 0;
    let reviewedCount = 0;
    let productionCount = 0;
    let totalSkus = 0;
    const plantSet = new Set<string>();

    programRequests.forEach((r) => {
      const matCount = r.programMaterials?.length || 1;
      totalSkus += matCount;
      if (r.targetPlant) plantSet.add(r.targetPlant);

      const status = (r.status || "").toLowerCase();
      if (status.includes("reviewed") || status.includes("samp reviewed") || status.includes("approved")) {
        reviewedCount++;
      } else if (status.includes("prod") || status.includes("handoff") || status.includes("deal")) {
        productionCount++;
      } else {
        awaitingReviewCount++;
      }
    });

    return {
      totalPrograms,
      awaitingReviewCount,
      reviewedCount,
      productionCount,
      totalSkus,
      plantsCount: plantSet.size || uniquePlants.length || 2,
    };
  }, [programRequests, uniquePlants]);

  // Stage tab counts
  const stageCounts = useMemo(() => {
    return {
      all: programStats.totalPrograms,
      awaiting_review: programStats.awaitingReviewCount,
      reviewed: programStats.reviewedCount,
      production: programStats.productionCount,
    };
  }, [programStats]);

  // Filtered requests
  const filteredRequests = useMemo(() => {
    return programRequests.filter((r) => {
      const status = (r.status || "").toLowerCase();

      // Tab filter
      if (filterTab === "awaiting_review") {
        if (status.includes("reviewed") || status.includes("prod") || status.includes("approved")) {
          return false;
        }
      } else if (filterTab === "reviewed") {
        if (!status.includes("reviewed") && !status.includes("approved") && !status.includes("samp reviewed")) {
          return false;
        }
      } else if (filterTab === "production") {
        if (!status.includes("prod") && !status.includes("handoff") && !status.includes("dispatch")) {
          return false;
        }
      }

      // Customer filter
      if (customerFilter !== "all" && r.customer !== customerFilter) {
        return false;
      }

      // Plant filter
      if (selectedPlant !== "ALL") {
        const p = (r.targetPlant || "").toLowerCase();
        if (!p.includes(selectedPlant.toLowerCase())) return false;
      }
      if (selectedPlantFilter !== "all") {
        const p = (r.targetPlant || "").toLowerCase();
        if (!p.includes(selectedPlantFilter.toLowerCase())) return false;
      }

      // Search query
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const sr = (r.srNumber || "").toLowerCase();
        const prog = (r.programName || "").toLowerCase();
        const desc = (r.productDescription || "").toLowerCase();
        const cust = (r.customer || "").toLowerCase();
        const yr = (r.programYear || "").toLowerCase();
        return sr.includes(q) || prog.includes(q) || desc.includes(q) || cust.includes(q) || yr.includes(q);
      }

      return true;
    });
  }, [programRequests, filterTab, customerFilter, selectedPlant, selectedPlantFilter, searchTerm]);

  // Paginated Slice
  const paginatedRequests = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRequests.slice(start, start + pageSize);
  }, [filteredRequests, currentPage, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredRequests.length / pageSize));

  // Selection
  const handleToggleSelectRow = (id: string | number, e?: React.SyntheticEvent) => {
    if (e) e.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.size === paginatedRequests.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedRequests.map((r) => r.id)));
    }
  };

  const handleOpenInspector = (req: SampleRequestItem) => {
    setInspectingProgram(req);
    onInspectRequest(req);
  };

  // Export CSV
  const handleExportCSV = () => {
    if (filteredRequests.length === 0) return;
    const dateStr = new Date().toISOString().slice(0, 10);
    exportRecordsToCsv({
      filename: `program_planning_${dateStr}.csv`,
      columns: [
        { header: "Program ID", accessor: (r) => r.srNumber || `PG-${r.id}` },
        { header: "Customer", accessor: (r) => r.customer },
        { header: "Program Title", accessor: (r) => r.programName || r.productDescription },
        { header: "Year", accessor: (r) => r.programYear || "2026" },
        { header: "Plant", accessor: (r) => r.targetPlant },
        { header: "Status", accessor: (r) => r.status || "Program Planning" },
        { header: "Total SKUs", accessor: (r) => r.programMaterials?.length || 1 },
      ],
      data: filteredRequests,
    });
  };

  const navTabs: { id: ProgramStageTab; label: string; count: number }[] = [
    { id: "all", label: "All Programs", count: stageCounts.all },
    { id: "awaiting_review", label: "Awaiting SAMP Review", count: stageCounts.awaiting_review },
    { id: "reviewed", label: "Reviewed by SAMP", count: stageCounts.reviewed },
    { id: "production", label: "Production Handoff", count: stageCounts.production },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-white text-slate-800 select-text overflow-hidden">
      {/* ── 1. Compact Editorial Header (Maximized Space for Requests) ── */}
      <header className="bg-white px-6 py-3 shrink-0 border-b border-slate-200/60 shadow-[0_1px_4px_rgba(11,28,48,0.02)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 font-display">
              Seasonal Program Planning
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold font-mono bg-slate-100 text-slate-600">
              {programStats.totalPrograms} Programs
            </span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold font-mono bg-[#006d32]/10 text-[#006d32] border border-[#006d32]/20">
              {programStats.totalSkus} Total SKUs
            </span>
            {programStats.awaitingReviewCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold font-mono bg-amber-50 text-amber-700 animate-pulse">
                ⚡ {programStats.awaitingReviewCount} In SAMP Queue
              </span>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* New Program Button */}
            <button
              type="button"
              onClick={() => setIsNewModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white shadow-[0_2px_10px_rgba(0,109,50,0.25)] hover:shadow-[0_4px_14px_rgba(0,109,50,0.35)] transition-all cursor-pointer active:scale-98"
              style={{ background: "linear-gradient(135deg, #006d32 0%, #00d166 100%)" }}
              title="Initialize New Seasonal Program with Matrix"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Program Planning</span>
            </button>

            {/* Refresh */}
            <button
              type="button"
              onClick={onRefresh}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-xs font-semibold text-slate-700 transition cursor-pointer disabled:opacity-50"
              title="Refresh Program Records"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-[#006d32]" : "text-slate-500"}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            {/* Export CSV */}
            <button
              type="button"
              onClick={handleExportCSV}
              disabled={filteredRequests.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-xs font-semibold text-slate-700 transition cursor-pointer disabled:opacity-50"
              title="Export To CSV"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Export</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── 2. Floating Filter & Search Strip ── */}
      <div className="px-6 py-2 bg-white shrink-0 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200">
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
          {selectedIds.size > 0 && isAdmin && (
            <button
              type="button"
              onClick={() => {
                const target = programRequests.find((r) => selectedIds.has(r.id));
                if (target) onDeleteRequest(target);
              }}
              className="h-9 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete ({selectedIds.size})</span>
            </button>
          )}

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
              value={selectedPlantFilter}
              onChange={(e) => {
                setSelectedPlantFilter(e.target.value);
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
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#006d32] transition-colors pointer-events-none" />
            <input
              type="text"
              placeholder="Search code, customer, title..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-9 pl-9 pr-8 rounded-xl bg-slate-50/50 hover:bg-slate-100/50 focus:bg-white text-xs font-medium text-slate-800 placeholder:text-slate-400 border border-slate-200/80 focus:border-[#006d32]/40 focus:outline-none focus:ring-4 focus:ring-[#006d32]/[0.08] shadow-2xs transition-all"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/80 transition-colors cursor-pointer"
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── 3. Full-Bleed Table Workspace (Seamlessly Blended into Full UI) ── */}
      <div className="flex-1 min-h-0 overflow-auto bg-white flex flex-col">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="sticky top-0 z-10 bg-[#f8fafc] border-b border-slate-200">
            <tr className="text-slate-600 font-mono text-[11px] uppercase tracking-wider select-none">
              <th className="py-3 pl-6 pr-3 w-10 text-center">
                <input
                  type="checkbox"
                  checked={
                    paginatedRequests.length > 0 &&
                    paginatedRequests.every((r) => selectedIds.has(r.id))
                  }
                  onChange={handleToggleSelectAll}
                  className="rounded text-[#006d32] focus:ring-[#006d32] cursor-pointer"
                />
              </th>
              <th className="py-3 px-4 font-semibold whitespace-nowrap">Program ID</th>
              <th className="py-3 px-4 font-semibold">Campaign Title & Product Scope</th>
              <th className="py-3 px-4 font-semibold whitespace-nowrap">Customer</th>
              <th className="py-3 px-4 font-semibold whitespace-nowrap">Plant</th>
              <th className="py-3 px-4 font-semibold text-center whitespace-nowrap">Year</th>
              <th className="py-3 px-4 font-semibold text-center whitespace-nowrap">Matrix SKUs</th>
              <th className="py-3 px-4 font-semibold whitespace-nowrap">SAMP Technical Review</th>
              <th className="py-3 px-4 font-semibold whitespace-nowrap">Target Date</th>
              <th className="py-3 pl-4 pr-6 font-semibold text-right whitespace-nowrap">Commercial Action</th>
            </tr>
          </thead>

              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={10} className="py-16 text-center text-slate-400 font-mono">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto text-[#006d32] mb-2" />
                      <span>Loading seasonal program planning matrix...</span>
                    </td>
                  </tr>
                ) : paginatedRequests.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-16 text-center">
                      <div className="max-w-sm mx-auto flex flex-col items-center">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
                          <FolderGit2 className="w-6 h-6" />
                        </div>
                        <h3 className="text-sm font-bold text-slate-800">No Seasonal Programs Found</h3>
                        <p className="text-xs text-slate-500 mt-1">
                          {searchTerm || customerFilter !== "all" || filterTab !== "all" || selectedPlantFilter !== "all"
                            ? "No programs match your search or active filter criteria."
                            : "There are currently no seasonal program planning requests submitted."}
                        </p>
                        {(searchTerm || customerFilter !== "all" || filterTab !== "all" || selectedPlantFilter !== "all") && (
                          <button
                            type="button"
                            onClick={() => {
                              setSearchTerm("");
                              setCustomerFilter("all");
                              setSelectedPlantFilter("all");
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
                  paginatedRequests.map((row) => {
                    const srCode = row.srNumber || `PG-${row.id}`;
                    const materials = row.programMaterials || [];
                    const skuCount = materials.length > 0 ? materials.length : 1;
                    const isReviewed = (row.status || "").toLowerCase().includes("reviewed");
                    const isSelected = selectedIds.has(row.id);

                    // Compute flagged columns by Sampling
                    let flaggedCount = 0;
                    materials.forEach((m) => {
                      const parsed = parseSampRemark(m.sampRemark);
                      flaggedCount += parsed.highlightedCols.length;
                    });

                    return (
                      <tr
                        key={row.id}
                        onClick={() => handleOpenInspector(row)}
                        className={`hover:bg-slate-50/80 transition-colors cursor-pointer group ${
                          isSelected ? "bg-emerald-50/40" : ""
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="py-3 pl-6 pr-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => handleToggleSelectRow(row.id, e)}
                            className="rounded text-[#006d32] focus:ring-[#006d32] cursor-pointer"
                          />
                        </td>

                        {/* Program ID */}
                        <td className="py-3 px-4 font-mono font-bold whitespace-nowrap">
                          <CopyBadge text={srCode} />
                        </td>

                        {/* Title & Description */}
                        <td className="py-3 px-4 max-w-sm">
                          <div className="font-semibold text-slate-900 truncate">
                            {row.programName || row.programCampaignTitle || "Seasonal Program"}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate mt-0.5">
                            {row.productDescription || "Multi-SKU scholastic program range"}
                          </div>
                        </td>

                        {/* Customer */}
                        <td className="py-3 px-4 font-semibold text-slate-900 whitespace-nowrap">
                          {row.customer || "—"}
                        </td>

                        {/* Plant */}
                        <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-slate-400" />
                            <span>Plant {row.targetPlant || "1505"}</span>
                          </div>
                        </td>

                        {/* Program Year */}
                        <td className="py-3 px-4 text-center font-mono font-bold whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px]">
                            {row.programYear || "2026"}
                          </span>
                        </td>

                        {/* Matrix SKUs */}
                        <td className="py-3 px-4 text-center font-mono whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-full bg-[#006d32]/10 text-[#006d32] font-bold text-[11px]">
                            {skuCount} SKU{skuCount !== 1 ? "s" : ""}
                          </span>
                        </td>

                        {/* SAMP Technical Review Status */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          {isReviewed ? (
                            <div className="space-y-0.5">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-emerald-50 text-emerald-700">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Reviewed by SAMP</span>
                              </span>
                              {flaggedCount > 0 && (
                                <div className="text-[10px] text-amber-700 font-mono font-semibold flex items-center gap-1 pl-1">
                                  <Highlighter className="w-3 h-3 text-amber-600" />
                                  <span>{flaggedCount} column{flaggedCount !== 1 ? "s" : ""} flagged</span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-amber-50 text-amber-700">
                              <Clock className="w-3.5 h-3.5 text-amber-500" />
                              <span>Pending SAMP Review</span>
                            </span>
                          )}
                        </td>

                        {/* Target Date */}
                        <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">
                          {row.sampleRequiredDate ? (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              <span>{row.sampleRequiredDate.slice(5)}</span>
                            </span>
                          ) : (
                            <span>Flexible</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3 pl-4 pr-6 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenInspector(row)}
                              className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium font-mono transition cursor-pointer"
                              title="Inspect technical matrix & remarks"
                            >
                              Inspect
                            </button>

                            {isAdmin && (
                              <button
                                type="button"
                                onClick={(e) => onDeleteRequest(row, e)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 transition cursor-pointer rounded-lg hover:bg-rose-50"
                                title="Delete record"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
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
                pageSize={pageSize}
                onPageChange={(p) => setCurrentPage(p)}
                itemLabel="campaigns"
              />
            </div>
          </div>

      {/* ── 4. Modals & Dialogs (Lazy-loaded) ── */}
      <React.Suspense fallback={null}>
        <NewProgramPlanningModal
          isOpen={isNewModalOpen}
          onClose={() => setIsNewModalOpen(false)}
          onProceed={(params) => {
            setIsNewModalOpen(false);
            navigate("/sample-requests/program-planning", { state: params });
          }}
        />

        <ProgramPlanningInspectorModal
          request={inspectingProgram}
          isOpen={Boolean(inspectingProgram)}
          onClose={() => setInspectingProgram(null)}
          onRefresh={onRefresh}
          mode="marketing"
          userRole="Marketing Specialist"
          currentUser={user}
        />
      </React.Suspense>
    </div>
  );
};

export default ProgramPlanningPage;
