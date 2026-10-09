import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { UserProfile } from "@/features/auth";
import { SampleRequestItem } from "../types";
import { getStageIdForRequest } from "../utils/trackTypes";
import { getBusinessYearForDate } from "@/lib/businessYear";
import {
  Search,
  X,
  Plus,
  Download,
  Trash2,
  Send,
  RefreshCw,
  Package,
  List as ListIcon,
} from "lucide-react";
import { DraftPackagesView } from "../components/DraftPackagesView";
import { SamplingRequestsTable } from "./components/SamplingRequestsTable";
import { getRequestTypes } from "./utils/requestTypeUtils";

export interface SamplingRequestsPageProps {
  requests: SampleRequestItem[];
  isLoading: boolean;
  selectedYear: string;
  selectedPlant: string;
  uniquePlants: string[];
  uniqueCustomers: string[];
  user?: UserProfile | null;
  isAdmin: boolean;
  onOpenNewModal: () => void;
  onInspectRequest: (req: SampleRequestItem) => void;
  onReleaseDraft: (req: SampleRequestItem) => Promise<void>;
  onBatchReleaseDraft: (selectedIds: Set<string | number>) => Promise<void>;
  onDeleteRequest: (req: SampleRequestItem, e?: React.MouseEvent) => Promise<void>;
  onBatchDelete: (selectedIds: Set<string | number>) => Promise<void>;
  onRefresh: () => Promise<void>;
  onExportCSV: () => void;
  onUpdateStatus?: (reqId: string | number, newStatus: string) => Promise<void>;
  showToast?: (msg: string, type?: "success" | "error") => void;
}

export type SamplingFilterTab =
  | "all"
  | "draft"
  | "creative"
  | "studio"
  | "costing"
  | "samp"
  | "plant"
  | "dispatched"
  | "deal";

export const SamplingRequestsPage: React.FC<SamplingRequestsPageProps> = ({
  requests,
  isLoading,
  selectedYear,
  selectedPlant,
  isAdmin,
  onOpenNewModal,
  onInspectRequest,
  onReleaseDraft,
  onBatchReleaseDraft,
  onDeleteRequest,
  onBatchDelete,
  onRefresh,
  onExportCSV,
  showToast,
}) => {
  const [draftSubMode, setDraftSubMode] = useState<"packages" | "flat">("packages");
  const [selectedStageTab, setSelectedStageTab] = useState<SamplingFilterTab>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPlantFilter, setSelectedPlantFilter] = useState<string>("all");
  const [selectedCustomerFilter, setSelectedCustomerFilter] = useState<string>("all");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 40;

  const navigate = useNavigate();

  const handleOpenDraftInStaging = (row: SampleRequestItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const stagingContext = {
      customer: row.customer || "",
      programName: row.programName || row.productDescription || "",
      programYear: row.programYear || "2026",
      year: row.year || "2026-27",
      targetPlant: row.targetPlant || "",
      parentRequestId: row.id,
      parentSrNumber: row.srNumber || `SR-${row.id}`,
    };
    sessionStorage.setItem("samp_active_program_form", JSON.stringify(stagingContext));

    const cached = sessionStorage.getItem("samp_active_staged_products");
    let stagedList: any[] = [];
    try {
      if (cached) stagedList = JSON.parse(cached);
    } catch {}

    if (!Array.isArray(stagedList) || stagedList.length === 0) {
      const isDesign = (row.requestTypes || []).includes("design") || Boolean(row.designsCustomerCreative);
      const initialItem = {
        id: String(row.id),
        productDescription: row.productDescription || "Commercial Product Sample",
        materialCode: row.materialCode || row.srNumber || "NEW-SPEC",
        scopes: row.requestTypes && row.requestTypes.length > 0 ? (row.requestTypes as any) : ["sample"],
        stagedDate: row.dateRequestCreated || new Date().toISOString().split("T")[0],
        timestamp: "Draft Intake",
        designMetadata: isDesign
          ? {
              numberOfDesigns: Number(row.designsCustomerCreative || row.productArtworkNos) || 1,
              designRequiredDate: row.sampleRequiredDate || row.targetArtworkDateCreative || "",
              trend: row.trend || "",
              targetAudience: row.targetAudience || "",
              referenceImage: row.productImagePath || "",
              remarks: row.designRemarks || (row as any).remarks || row.marketingRemarks || row.descriptionNotes || "",
              images: (row.referenceImages || []).map((url, i) => ({ id: String(i), url, name: `Attachment ${i + 1}` })),
              webLinks: row.referenceLinks || [],
            }
          : undefined,
        samplingMetadata: {
          sampleType: row.productType === "Partial Sample" ? "partial" : "full",
          partialRequirements: (row as any).remarks || row.marketingRemarks || row.descriptionNotes || "",
          sourceSrNumber: row.sourceSampleCode || "",
          bindingType1: (row as any).customBinding1 || "",
          bindingType2: (row as any).customBinding2 || "",
        },
      };
      sessionStorage.setItem("samp_active_staged_products", JSON.stringify([initialItem]));
    }

    navigate("/sample-requests/product-staging", { state: stagingContext });
  };

  // Only commercial sampling requests
  const samplingRequests = useMemo(() => {
    return requests.filter((r) => {
      const mat = String(r.materialCode || "").toLowerCase();
      const sr = String(r.srNumber || "").toLowerCase();
      const desc = String(r.productDescription || "").toLowerCase();
      const kind = String(r.requestKind || "").toLowerCase();
      const mode = String(r.creationMode || "").toLowerCase();

      // Exclude Feasibility checks
      if (
        kind === "feasibility" ||
        mode === "feasibility_check" ||
        mat.startsWith("fc-") ||
        mat.startsWith("fc-ck") ||
        sr.startsWith("fc-") ||
        sr.startsWith("fs-") ||
        desc.includes("feasibility check")
      ) {
        return false;
      }

      // Exclude Seasonal Program plannings
      if (
        kind === "program" ||
        mode === "program_planning" ||
        mat.startsWith("pg-") ||
        sr.startsWith("pg-") ||
        desc.includes("seasonal program:")
      ) {
        return false;
      }

      return true;
    });
  }, [requests]);

  // Derived Customers List
  const customerList = useMemo(() => {
    const set = new Set<string>();
    samplingRequests.forEach((r) => {
      if (r.customer && r.customer.trim()) set.add(r.customer.trim());
    });
    return Array.from(set).sort();
  }, [samplingRequests]);

  // Derived Plants List
  const plantList = useMemo(() => {
    const set = new Set<string>();
    samplingRequests.forEach((r) => {
      if (r.targetPlant && r.targetPlant.trim()) set.add(r.targetPlant.trim());
    });
    return Array.from(set).sort();
  }, [samplingRequests]);

  // Stage counts
  const stageCounts = useMemo(() => {
    const counts: Record<SamplingFilterTab, number> = {
      all: 0,
      draft: 0,
      creative: 0,
      studio: 0,
      costing: 0,
      samp: 0,
      plant: 0,
      dispatched: 0,
      deal: 0,
    };

    samplingRequests.forEach((r) => {
      const stage = getStageIdForRequest(r) as SamplingFilterTab;
      if (counts[stage] !== undefined) {
        counts[stage]++;
      }
      // "all" tab represents active / released requests
      if (stage !== "draft") {
        counts.all++;
      }
    });

    return counts;
  }, [samplingRequests]);

  // Filtered requests
  const filteredRequests = useMemo(() => {
    return samplingRequests.filter((r) => {
      if (selectedStageTab !== "all") {
        const itemStage = getStageIdForRequest(r);
        if (itemStage !== selectedStageTab) return false;
      } else {
        // Exclude drafts from active requests view
        if (getStageIdForRequest(r) === "draft") return false;
      }

      if (selectedYear !== "ALL") {
        const itemYear = r.year || (r.dateRequestCreated ? getBusinessYearForDate(r.dateRequestCreated) : "");
        if (itemYear && itemYear !== selectedYear) return false;
      }

      if (selectedPlant !== "ALL") {
        const p = (r.targetPlant || "").toLowerCase();
        if (!p.includes(selectedPlant.toLowerCase())) return false;
      }

      if (selectedPlantFilter !== "all") {
        const p = (r.targetPlant || "").toLowerCase();
        if (!p.includes(selectedPlantFilter.toLowerCase())) return false;
      }

      if (selectedCustomerFilter !== "all" && r.customer !== selectedCustomerFilter) {
        return false;
      }

      if (selectedTypeFilter !== "all") {
        const types = getRequestTypes(r);
        if (!types.includes(selectedTypeFilter as any)) return false;
      }

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const sr = (r.srNumber || "").toLowerCase();
        const mat = (r.materialCode || "").toLowerCase();
        const desc = (r.productDescription || "").toLowerCase();
        const cust = (r.customer || "").toLowerCase();
        const plant = (r.targetPlant || "").toLowerCase();
        const brand = (r.brandName || "").toLowerCase();

        return (
          sr.includes(q) ||
          mat.includes(q) ||
          desc.includes(q) ||
          cust.includes(q) ||
          plant.includes(q) ||
          brand.includes(q)
        );
      }

      return true;
    });
  }, [
    samplingRequests,
    selectedStageTab,
    selectedYear,
    selectedPlant,
    selectedPlantFilter,
    selectedCustomerFilter,
    selectedTypeFilter,
    searchTerm,
  ]);

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

  const selectedDraftsCount = useMemo(() => {
    return requests.filter(
      (r) => selectedIds.has(r.id) && getStageIdForRequest(r) === "draft"
    ).length;
  }, [requests, selectedIds]);

  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedCustomerFilter("all");
    setSelectedPlantFilter("all");
    setSelectedTypeFilter("all");
    setSelectedStageTab("all");
    setCurrentPage(1);
  };

  const hasActiveFilters = Boolean(
    searchTerm.trim() ||
      selectedCustomerFilter !== "all" ||
      selectedPlantFilter !== "all" ||
      selectedTypeFilter !== "all" ||
      selectedStageTab !== "all"
  );

  const stageTabs: { id: SamplingFilterTab; label: string; count: number }[] = [
    { id: "all", label: "Active Requests", count: stageCounts.all },
    { id: "draft", label: "Pre-PMT Drafts", count: stageCounts.draft },
    { id: "creative", label: "Creative & Design", count: stageCounts.creative },
    { id: "studio", label: "Studio CAD", count: stageCounts.studio },
    { id: "costing", label: "Costing", count: stageCounts.costing },
    { id: "samp", label: "SAMP Lab", count: stageCounts.samp },
    { id: "plant", label: "Plant Floor", count: stageCounts.plant },
    { id: "dispatched", label: "Dispatched", count: stageCounts.dispatched },
    { id: "deal", label: "Won Deals", count: stageCounts.deal },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-white text-slate-800 select-text overflow-hidden">
      {/* ── 1. Compact Editorial Header (Maximized Space for Requests) ── */}
      <header className="bg-white px-6 py-3 shrink-0 border-b border-slate-200/60 shadow-[0_1px_4px_rgba(11,28,48,0.02)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 font-display">
              Commercial Sample Requests
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold font-mono bg-slate-100 text-slate-600">
              {samplingRequests.length} Requests
            </span>
            {stageCounts.draft > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold font-mono bg-emerald-50 text-emerald-700 animate-pulse">
                ⚡ {stageCounts.draft} Drafts to Release
              </span>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Draft Mode Sub-view Toggle */}
            {selectedStageTab === "draft" && (
              <div className="inline-flex rounded-xl bg-slate-100 p-0.5 mr-1">
                <button
                  type="button"
                  onClick={() => setDraftSubMode("packages")}
                  className={`px-2.5 py-1 rounded-lg text-xs transition cursor-pointer flex items-center gap-1.5 ${
                    draftSubMode === "packages"
                      ? "bg-white text-slate-900 shadow-2xs font-bold"
                      : "text-slate-600 hover:text-slate-900 font-medium"
                  }`}
                  title="Grouped Program Packages"
                >
                  <Package className="w-3.5 h-3.5" />
                  <span>Packages</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDraftSubMode("flat")}
                  className={`px-2.5 py-1 rounded-lg text-xs transition cursor-pointer flex items-center gap-1.5 ${
                    draftSubMode === "flat"
                      ? "bg-white text-slate-900 shadow-2xs font-bold"
                      : "text-slate-600 hover:text-slate-900 font-medium"
                  }`}
                  title="Flat Items Table"
                >
                  <ListIcon className="w-3.5 h-3.5" />
                  <span>Flat Table</span>
                </button>
              </div>
            )}

            {/* Create New Request Button */}
            <button
              type="button"
              onClick={onOpenNewModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white shadow-[0_2px_10px_rgba(0,109,50,0.25)] hover:shadow-[0_4px_14px_rgba(0,109,50,0.35)] transition-all cursor-pointer active:scale-98"
              style={{ background: "linear-gradient(135deg, #006d32 0%, #00d166 100%)" }}
              title="Create New Commercial Sample Request"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Sample Request</span>
            </button>

            {/* Refresh */}
            <button
              type="button"
              onClick={onRefresh}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-xs font-semibold text-slate-700 transition cursor-pointer disabled:opacity-50"
              title="Refresh Records"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-[#006d32]" : "text-slate-500"}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            {/* Export CSV */}
            <button
              type="button"
              onClick={onExportCSV}
              disabled={filteredRequests.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-xs font-semibold text-slate-700 transition cursor-pointer disabled:opacity-50"
              title="Export Filtered CSV"
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
          {stageTabs.map((t) => {
            const isActive = selectedStageTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setSelectedStageTab(t.id);
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

        {/* Right Search & Controls */}
        <div className="flex items-center gap-2 flex-1 sm:flex-initial justify-end">
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-1.5">
              {selectedDraftsCount > 0 && (
                <button
                  type="button"
                  onClick={() => onBatchReleaseDraft(selectedIds)}
                  className="h-9 px-3 rounded-lg text-xs font-semibold text-white flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                  style={{ background: "linear-gradient(135deg, #006d32 0%, #00d166 100%)" }}
                  title="Release selected drafts to PMT workflow"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Release ({selectedDraftsCount})</span>
                </button>
              )}
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => onBatchDelete(selectedIds)}
                  className="h-9 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer transition"
                  title="Delete selected requests"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete ({selectedIds.size})</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setSelectedIds(new Set())}
                className="text-slate-500 hover:text-slate-800 text-[11px] underline px-1 cursor-pointer"
              >
                Clear
              </button>
            </div>
          )}

          {/* Request Type Filter */}
          <select
            value={selectedTypeFilter}
            onChange={(e) => {
              setSelectedTypeFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="h-9 px-3 rounded-lg bg-slate-100/80 hover:bg-slate-200/60 text-xs font-medium text-slate-700 border border-slate-200/70 focus:outline-none focus:ring-2 focus:ring-[#006d32]/15 focus:border-[#006d32]/40 cursor-pointer transition"
          >
            <option value="all">All Request Types</option>
            <option value="sample">Sampling</option>
            <option value="design">Design</option>
            <option value="mockup">Mockup</option>
            <option value="costing">Costing</option>
          </select>

          {/* Customer Filter */}
          {customerList.length > 0 && (
            <select
              value={selectedCustomerFilter}
              onChange={(e) => {
                setSelectedCustomerFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="h-9 px-3 rounded-lg bg-slate-100/80 hover:bg-slate-200/60 text-xs font-medium text-slate-700 border border-slate-200/70 focus:outline-none focus:ring-2 focus:ring-[#006d32]/15 focus:border-[#006d32]/40 cursor-pointer transition max-w-[160px] truncate"
            >
              <option value="all">All Customers</option>
              {customerList.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}

          {/* Plant Filter */}
          {plantList.length > 0 && (
            <select
              value={selectedPlantFilter}
              onChange={(e) => {
                setSelectedPlantFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="h-9 px-3 rounded-lg bg-slate-100/80 hover:bg-slate-200/60 text-xs font-medium text-slate-700 border border-slate-200/70 focus:outline-none focus:ring-2 focus:ring-[#006d32]/15 focus:border-[#006d32]/40 cursor-pointer transition"
            >
              <option value="all">All Plants</option>
              {plantList.map((p) => (
                <option key={p} value={p}>
                  Plant {p}
                </option>
              ))}
            </select>
          )}

          {/* Search Box */}
          <div className="relative w-56 sm:w-64 group">
            <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#006d32] transition-colors pointer-events-none" />
            <input
              type="text"
              placeholder="Search SR#, material, desc..."
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
                onClick={() => {
                  setSearchTerm("");
                  setCurrentPage(1);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-4.5 h-4.5 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/80 transition-colors cursor-pointer"
                title="Clear search"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── 3. Main Workspace: Draft Packages View or Table View ── */}
      {selectedStageTab === "draft" && draftSubMode === "packages" ? (
        <div className="flex-1 min-h-0 overflow-y-auto p-6 bg-white">
          <DraftPackagesView
            requests={samplingRequests}
            isLoading={isLoading}
            onRefresh={onRefresh}
            showToast={showToast || (() => {})}
          />
        </div>
      ) : (
        <SamplingRequestsTable
          paginatedRequests={paginatedRequests}
          filteredRequestsCount={filteredRequests.length}
          isLoading={isLoading}
          selectedIds={selectedIds}
          currentPage={currentPage}
          pageSize={pageSize}
          totalPages={totalPages}
          isAdmin={isAdmin}
          hasActiveFilters={hasActiveFilters}
          onToggleSelectAll={handleToggleSelectAll}
          onToggleSelectRow={handleToggleSelectRow}
          onOpenDraftInStaging={handleOpenDraftInStaging}
          onInspectRequest={onInspectRequest}
          onReleaseDraft={onReleaseDraft}
          onDeleteRequest={onDeleteRequest}
          onPageChange={(p) => setCurrentPage(p)}
          onOpenNewModal={onOpenNewModal}
          onResetFilters={handleResetFilters}
        />
      )}
    </div>
  );
};

export default SamplingRequestsPage;
