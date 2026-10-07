import React, { useState, useMemo } from "react";
import { UserProfile } from "@/features/auth";
import { SampleRequestItem } from "../types";
import { getRequestTrackType } from "../utils/trackTypes";
import { StatusPill } from "@/components/ui/StatusPill";
import { useNavigate } from "react-router-dom";
import {
  FolderGit2,
  Plus,
  RefreshCw,
  Search,
  ExternalLink,
  Layers,
  Building2,
  Calendar,
  Sparkles,
  ArrowRight,
  Trash2,
  Copy,
  Check,
  Package,
  List as ListIcon,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
  Zap,
  TrendingUp,
  Clock,
  Highlighter,
  CheckCircle2,
  AlertCircle,
  Download,
  ClipboardCheck,
} from "lucide-react";
import { parseSampRemark } from "./utils/programRemarkUtils";
import { CopyBadge } from "@/components/ui/CopyBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { WorkflowTabStrip } from "@/components/erp/WorkflowTabStrip";
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
  const [copiedId, setCopiedId] = useState<string | null>(null);

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

  // Derived Customers List
  const customerList = useMemo(() => {
    if (uniqueCustomers && uniqueCustomers.length > 0) return uniqueCustomers;
    const set = new Set<string>();
    programRequests.forEach((r) => {
      if (r.customer && r.customer.trim()) set.add(r.customer.trim());
    });
    return Array.from(set).sort();
  }, [programRequests, uniqueCustomers]);

  // Telemetry metrics
  const programStats = useMemo(() => {
    const totalPrograms = programRequests.length;
    let stagingCount = 0;
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

  const workflowTabs = useMemo(
    () =>
      PROGRAM_STAGE_TABS.map((tab) => ({
        id: tab.id,
        label: tab.label,
        count: stageCounts[tab.id],
      })),
    [stageCounts]
  );

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

  // Helper to open inspector
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

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#F8F9FA] dark:bg-[#0b0c10] select-text">
      {/* ── 1. Compact Page Header (Exact Match to Feasibility Image 1) ── */}
      <div className="bg-white dark:bg-[#12141d] border-b border-[#E2E8F0] dark:border-white/[0.08] px-6 py-3 shrink-0">
        <div className="flex items-center justify-between gap-4">
          {/* Title + badge */}
          <div className="flex items-center gap-2.5 min-w-0">
            <h1 className="text-sm font-bold text-neutral-900 dark:text-white truncate">
              Seasonal Program Planning Workbench
            </h1>
            <span className="shrink-0 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#714B67]/10 text-[#714B67] dark:bg-purple-950/40 dark:text-purple-300 border border-[#714B67]/20">
              Marketing Desk
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {/* New Program Button */}
            <button
              type="button"
              onClick={() => setIsNewModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#017E84] hover:bg-[#00666A] text-white text-xs font-semibold shadow-xs transition active:scale-95 cursor-pointer"
              title="Initialize New Seasonal Program with Single Year & Multi-Material Matrix"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New</span>
            </button>

            {/* Refresh */}
            <button
              type="button"
              onClick={onRefresh}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-[#CED4DA] dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-neutral-50 dark:hover:bg-zinc-700 text-xs font-semibold text-neutral-700 dark:text-zinc-200 shadow-2xs transition cursor-pointer disabled:opacity-50"
              title="Refresh Program Records"
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

        {/* ── 2. KPI Metric Ribbon (Exact 6 Cards Matching Feasibility Workbench Image 1) ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 mt-3 pt-3 border-t border-[#F1F5F9] dark:border-white/[0.05]">
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
                TOTAL INTAKE
              </span>
              <ClipboardCheck className="w-3.5 h-3.5 text-neutral-400" />
            </div>
            <div className="text-xl font-bold font-mono text-neutral-900 dark:text-zinc-100 mt-0.5">
              {isLoading ? "—" : programStats.totalPrograms}
            </div>
            <div className="text-[10px] text-neutral-400 font-mono">From Marketing</div>
          </div>

          {/* Card 2: Awaiting SAMP Review */}
          <div
            onClick={() => {
              setFilterTab("awaiting_review");
              setCurrentPage(1);
            }}
            className={`p-2.5 rounded-lg border transition cursor-pointer ${
              filterTab === "awaiting_review"
                ? "border-amber-400 bg-amber-500/10 dark:bg-amber-950/30 shadow-2xs"
                : "border-[#E2E8F0] dark:border-white/[0.06] bg-neutral-50/60 dark:bg-zinc-900/40 hover:border-amber-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] uppercase font-bold text-amber-700 dark:text-amber-300 font-mono tracking-wider">
                NEEDS REVIEW
              </span>
              <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="text-xl font-bold font-mono text-amber-900 dark:text-amber-200 mt-0.5">
              {isLoading ? "—" : programStats.awaitingReviewCount}
            </div>
            <div className="text-[10px] text-amber-700/80 dark:text-amber-400/80 font-mono">
              SAMP Team Queue
            </div>
          </div>

          {/* Card 3: Reviewed by SAMP Team */}
          <div
            onClick={() => {
              setFilterTab("reviewed");
              setCurrentPage(1);
            }}
            className={`p-2.5 rounded-lg border transition cursor-pointer ${
              filterTab === "reviewed"
                ? "border-emerald-400 bg-emerald-500/10 dark:bg-emerald-950/30 shadow-2xs"
                : "border-[#E2E8F0] dark:border-white/[0.06] bg-neutral-50/60 dark:bg-zinc-900/40 hover:border-emerald-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] uppercase font-bold text-emerald-700 dark:text-emerald-300 font-mono tracking-wider">
                REVIEWED (SAMP TEAM)
              </span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="text-xl font-bold font-mono text-emerald-900 dark:text-emerald-200 mt-0.5">
              {isLoading ? "—" : programStats.reviewedCount}
            </div>
            <div className="text-[10px] text-emerald-700/80 dark:text-emerald-400/80 font-mono">
              Matrix Verified &amp; Signed
            </div>
          </div>

          {/* Card 5: Production Handoff */}
          <div
            onClick={() => {
              setFilterTab("production");
              setCurrentPage(1);
            }}
            className={`p-2.5 rounded-lg border transition cursor-pointer ${
              filterTab === "production"
                ? "border-purple-400 bg-purple-500/10 dark:bg-purple-950/30 shadow-2xs"
                : "border-[#E2E8F0] dark:border-white/[0.06] bg-neutral-50/60 dark:bg-zinc-900/40 hover:border-purple-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] uppercase font-bold text-purple-700 dark:text-purple-300 font-mono tracking-wider">
                PRODUCTION
              </span>
              <Zap className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="text-xl font-bold font-mono text-purple-900 dark:text-purple-200 mt-0.5">
              {isLoading ? "—" : programStats.productionCount}
            </div>
            <div className="text-[10px] text-purple-700/80 dark:text-purple-400/80 font-mono">
              Ready for Execution
            </div>
          </div>

          {/* Card 6: Matrix SKUs */}
          <div className="p-2.5 rounded-lg border border-[#E2E8F0] dark:border-white/[0.06] bg-neutral-50/60 dark:bg-zinc-900/40">
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] uppercase font-bold text-neutral-500 dark:text-zinc-400 font-mono tracking-wider">
                MATRIX SKUS
              </span>
              <Layers className="w-3.5 h-3.5 text-[#017E84]" />
            </div>
            <div className="text-xl font-bold font-mono text-[#017E84] dark:text-teal-400 mt-0.5">
              {programStats.totalSkus}
            </div>
            <div className="text-[10px] text-neutral-400 font-mono">Planned Materials</div>
          </div>
        </div>
      </div>

      {/* ── 3. Segmented Filter Pills Strip (Exact Match to Feasibility Workbench Image 1) ── */}
      <div className="bg-white dark:bg-[#12141d] border-b border-[#E2E8F0] dark:border-white/[0.08] px-6 py-2.5 shrink-0 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Odoo Segmented Filter Pills */}
        <WorkflowTabStrip
          tabs={workflowTabs}
          activeTab={filterTab}
          onSelectTab={(id) => {
            setFilterTab(id as ProgramStageTab);
            setCurrentPage(1);
          }}
          compact
        />

        {/* Right: Customer & Plant Dropdown Selectors */}
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
              {customerList.map((c) => (
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
              value={selectedPlantFilter}
              onChange={(e) => {
                setSelectedPlantFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="h-8 pl-2.5 pr-7 rounded border border-[#CED4DA] dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-medium text-neutral-700 dark:text-zinc-200 focus:outline-none focus:border-[#714B67] transition cursor-pointer appearance-none font-mono"
            >
              <option value="all">All Plants</option>
              {uniquePlants.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <Filter className="w-3 h-3 text-neutral-400 absolute right-2 top-2.5 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* ── 4. Search Filter Input Strip (Exact Match to Image 1) ── */}
      <div className="bg-white dark:bg-[#12141d] border-b border-[#E2E8F0] dark:border-white/[0.08] px-6 py-2 shrink-0">
        <div className="relative max-w-sm">
          <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search SR, Code, Customer"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full h-8 pl-9 pr-7 rounded border border-[#CED4DA] dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-neutral-900 dark:text-zinc-100 placeholder:text-neutral-400 focus:outline-none focus:border-[#714B67] transition"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              className="absolute right-2.5 top-2 text-neutral-400 hover:text-neutral-700 dark:hover:text-zinc-200 text-xs font-bold"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* ── 5. Full-Bleed Table View (Exact Match to Image 1) ── */}
      <div className="flex-1 overflow-y-auto p-6">
        {filteredRequests.length === 0 ? (
          <EmptyState
            icon={ClipboardCheck}
            title="No Seasonal Programs Found"
            description={
              searchTerm || customerFilter !== "all" || filterTab !== "all"
                ? "No seasonal programs match your active filter criteria. Try resetting your search or selecting another tab."
                : "There are currently no seasonal program planning requests submitted by Marketing in this category."
            }
            onResetFilters={
              searchTerm || customerFilter !== "all" || filterTab !== "all"
                ? () => {
                    setSearchTerm("");
                    setCustomerFilter("all");
                    setFilterTab("all");
                  }
                : undefined
            }
            action={
              <button
                type="button"
                onClick={() => setIsNewModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-[#017E84] hover:bg-[#00666A] text-white text-xs font-semibold shadow-xs transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Program Request</span>
              </button>
            }
          />
        ) : (
            <div className="bg-white dark:bg-[#12141d] rounded-lg border border-[#CED4DA] dark:border-white/[0.08] shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                <thead>
                    <tr className="bg-[#F8F9FA] dark:bg-zinc-900/80 border-b border-[#CED4DA] dark:border-white/[0.08] text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-500 dark:text-zinc-400 select-none">
                      <th className="py-2.5 px-3 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={
                            paginatedRequests.length > 0 &&
                            paginatedRequests.every((r) => selectedIds.has(r.id))
                          }
                          onChange={handleToggleSelectAll}
                          className="rounded border-[#CED4DA] dark:border-zinc-700 text-[#714B67] focus:ring-[#714B67] cursor-pointer"
                        />
                      </th>
                      <th className="py-2.5 px-3 w-36">Program ID</th>
                      <th className="py-2.5 px-3">Campaign Title & Product Scope</th>
                      <th className="py-2.5 px-3 w-40">Customer</th>
                      <th className="py-2.5 px-3 w-28">Plant</th>
                      <th className="py-2.5 px-3 w-24 text-center">Program Year</th>
                      <th className="py-2.5 px-3 w-28 text-center">Matrix SKUs</th>
                      <th className="py-2.5 px-3 w-48">SAMP Technical Review</th>
                      <th className="py-2.5 px-3 w-28">Target Date</th>
                      <th className="py-2.5 px-3 w-32 text-right pr-4">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-[#E9ECEF] dark:divide-white/[0.05]">
                    {isLoading ? (
                      <tr>
                        <td colSpan={10} className="py-12 text-center text-neutral-400 font-mono">
                          <RefreshCw className="w-5 h-5 animate-spin mx-auto text-[#017E84] mb-2" />
                          <span>Loading seasonal program planning matrix...</span>
                        </td>
                      </tr>
                    ) : paginatedRequests.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="py-16 text-center text-neutral-400">
                          <div className="flex flex-col items-center justify-center space-y-2">
                            <FolderGit2 className="w-10 h-10 text-neutral-300 dark:text-zinc-600" />
                            <span className="font-bold text-sm text-neutral-700 dark:text-zinc-300">
                              No seasonal programs match your current filter
                            </span>
                            <span className="text-xs text-neutral-500 max-w-sm">
                              Try resetting the search facet or changing plant / stage filter, or click "+ New" to initialize a program request.
                            </span>
                            <button
                              type="button"
                              onClick={() => setIsNewModalOpen(true)}
                              className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#017E84] text-white text-xs font-semibold shadow-xs"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Create Program Request</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      paginatedRequests.map((row) => {
                        const srCode = row.srNumber || `PG-${row.id}`;
                        const materials = row.programMaterials || [];
                        const skuCount = materials.length > 0 ? materials.length : 1;
                        const isReviewed = (row.status || "").toLowerCase().includes("reviewed");

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
                            className="hover:bg-neutral-50/80 dark:hover:bg-white/[0.03] cursor-pointer transition"
                          >
                            {/* Checkbox */}
                            <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={selectedIds.has(row.id)}
                                onChange={(e) => handleToggleSelectRow(row.id, e)}
                                className="rounded border-[#CED4DA] dark:border-zinc-700 text-[#714B67] focus:ring-[#714B67] cursor-pointer"
                              />
                            </td>

                            {/* Program ID */}
                            <td className="py-3 px-3 font-mono font-bold whitespace-nowrap">
                              <CopyBadge text={srCode} />
                            </td>

                            {/* Title & Description */}
                            <td className="py-3 px-3">
                              <div className="font-bold text-neutral-900 dark:text-zinc-100 line-clamp-1">
                                {row.programName || row.programCampaignTitle || "Seasonal Program"}
                              </div>
                              <div className="text-[11px] text-neutral-500 dark:text-zinc-400 line-clamp-1 mt-0.5">
                                {row.productDescription || "Multi-SKU scholastic program range"}
                              </div>
                            </td>

                            {/* Customer */}
                            <td className="py-3 px-3 text-neutral-700 dark:text-zinc-300 font-semibold truncate">
                              {row.customer || "—"}
                            </td>

                            {/* Plant */}
                            <td className="py-3 px-3 font-mono text-neutral-600 dark:text-zinc-400">
                              <div className="flex items-center space-x-1">
                                <Building2 className="w-3 h-3 text-neutral-400" />
                                <span className="truncate">{row.targetPlant || "1505"}</span>
                              </div>
                            </td>

                            {/* Program Year (Single Year) */}
                            <td className="py-3 px-3 text-center font-mono font-bold text-zinc-700 dark:text-zinc-300">
                              <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-[11px]">
                                {row.programYear || "2026"}
                              </span>
                            </td>

                            {/* Matrix SKUs */}
                            <td className="py-3 px-3 text-center font-mono">
                              <span className="bg-purple-50 dark:bg-purple-950/60 text-[#714B67] dark:text-purple-300 font-bold px-2 py-0.5 rounded text-[11px]">
                                {skuCount} Line{skuCount !== 1 ? "s" : ""}
                              </span>
                            </td>

                            {/* SAMP Technical Review Status */}
                            <td className="py-3 px-3">
                              {isReviewed ? (
                                <div className="space-y-0.5">
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>Reviewed by SAMP</span>
                                  </span>
                                  {flaggedCount > 0 && (
                                    <div className="text-[10px] text-amber-700 dark:text-amber-400 font-mono font-semibold flex items-center gap-1">
                                      <Highlighter className="w-2.5 h-2.5" />
                                      <span>{flaggedCount} column{flaggedCount !== 1 ? "s" : ""} flagged</span>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                  <Clock className="w-3 h-3" />
                                  <span>Pending SAMP Review</span>
                                </span>
                              )}
                            </td>

                            {/* Target Date */}
                            <td className="py-3 px-3 font-mono text-neutral-600 dark:text-zinc-400">
                              {row.sampleRequiredDate ? (
                                <span className="flex items-center space-x-1">
                                  <Calendar className="w-3 h-3 text-neutral-400" />
                                  <span>{row.sampleRequiredDate.slice(5)}</span>
                                </span>
                              ) : (
                                <span>—</span>
                              )}
                            </td>

                            {/* Actions */}
                            <td className="py-3 px-3 text-right pr-4" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-end space-x-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleOpenInspector(row)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#017E84] hover:bg-[#00666A] text-white text-[11px] font-bold shadow-xs transition cursor-pointer"
                                  title="Inspect technical matrix & remarks"
                                >
                                  <Highlighter className="w-3 h-3" />
                                  <span>Inspect</span>
                                </button>

                                {isAdmin && (
                                  <button
                                    type="button"
                                    onClick={(e) => onDeleteRequest(row, e)}
                                    className="p-1 text-rose-400 hover:text-rose-600 transition cursor-pointer"
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
              </div>

              {/* Table Footer Pager */}
              <PaginationBar
                currentPage={currentPage}
                totalPages={totalPages}
                totalCount={filteredRequests.length}
                pageSize={pageSize}
                onPageChange={(p) => setCurrentPage(p)}
                itemLabel="campaigns"
              />
            </div>
          )}
        </div>

      {/* ── 5. Modals & Dialogs (Lazy-loaded) ── */}
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
