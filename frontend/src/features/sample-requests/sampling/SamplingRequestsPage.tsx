import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { UserProfile } from "@/features/auth";
import { SampleRequestItem } from "../types";
import { getStageIdForRequest } from "../utils/trackTypes";
import { getBusinessYearForDate } from "@/lib/businessYear";
import {
  Search,
  Plus,
  Download,
  Copy,
  Check,
  Trash2,
  Send,
  Building2,
  Calendar,
  RefreshCw,
  ExternalLink,
  Layers,
  List as ListIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Sparkles,
  RotateCcw,
  Zap,
  TrendingUp,
  Factory,
  FlaskConical,
  Palette,
  Ruler,
  Calculator,
  CheckCircle2,
  AlertTriangle,
  Package,
  ShieldCheck,
  Star,
  Flame,
} from "lucide-react";

import { DraftPackagesView } from "../components/DraftPackagesView";
import { SamplingRequestsTable } from "./components/SamplingRequestsTable";
import { WorkflowTabStrip } from "@/components/erp/WorkflowTabStrip";
import { EmptyState } from "@/components/ui/EmptyState";
import { getRequestTypes } from "./utils/requestTypeUtils";
import { getSlaEvaluation } from "../utils/slaUtils";

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

export const SAMPLING_STAGES: { id: SamplingFilterTab; label: string }[] = [
  { id: "all", label: "All Sampling" },
  { id: "draft", label: "Draft (Pre-PMT)" },
  { id: "creative", label: "Creative & Design" },
  { id: "studio", label: "Studio CAD & Specs" },
  { id: "costing", label: "Costing Estimations" },
  { id: "samp", label: "SAMP Team Review" },
  { id: "plant", label: "Plant Floor Execution" },
  { id: "dispatched", label: "Dispatched & Closed" },
  { id: "deal", label: "Won Deals / Converted" },
];

export const SamplingRequestsPage: React.FC<SamplingRequestsPageProps> = ({
  requests,
  isLoading,
  selectedYear,
  selectedPlant,
  uniquePlants,
  uniqueCustomers,
  isAdmin,
  onOpenNewModal,
  onInspectRequest,
  onReleaseDraft,
  onBatchReleaseDraft,
  onDeleteRequest,
  onBatchDelete,
  onRefresh,
  onExportCSV,
  onUpdateStatus,
  showToast,
}) => {
  const [draftSubMode, setDraftSubMode] = useState<"packages" | "flat">("packages");
  const [selectedStageTab, setSelectedStageTab] = useState<SamplingFilterTab>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPlantFilter, setSelectedPlantFilter] = useState<string>("all");
  const [selectedCustomerFilter, setSelectedCustomerFilter] = useState<string>("all");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>("all");
  const [selectedSlaFilter, setSelectedSlaFilter] = useState<string>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);

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

    // Seed staged products from this request if session is empty
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
        designMetadata: isDesign ? {
          numberOfDesigns: Number(row.designsCustomerCreative || row.productArtworkNos) || 1,
          designRequiredDate: row.sampleRequiredDate || row.targetArtworkDateCreative || "",
          trend: row.trend || "",
          targetAudience: row.targetAudience || "",
          referenceImage: row.productImagePath || "",
          remarks: (row as any).remarks || row.marketingRemarks || row.descriptionNotes || "",
          images: (row.referenceImages || []).map((url, i) => ({ id: String(i), url, name: `Attachment ${i + 1}` })),
          webLinks: row.referenceLinks || [],
        } : undefined,
        samplingMetadata: {
          sampleType: (row.productType === "Partial Sample" ? "partial" : "full"),
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



  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 40;

  // Copy feedback
  const handleCopyCode = (code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedId(code);
    setTimeout(() => setCopiedId(null), 1200);
  };

  // Only consider standard commercial sampling requests
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

  // Stage counts for polygon chevron stepper
  const stageCounts = useMemo(() => {
    const counts: Record<SamplingFilterTab, number> = {
      all: samplingRequests.length,
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
    });

    return counts;
  }, [samplingRequests]);

  const workflowTabs = useMemo(
    () =>
      SAMPLING_STAGES.map((tab) => ({
        id: tab.id,
        label: tab.label,
        count: stageCounts[tab.id] || 0,
      })),
    [stageCounts]
  );

  // Telemetry Metrics for the 6 Executive Ribbon Cards
  const telemetryMetrics = useMemo(() => {
    const total = samplingRequests.length;
    let draftCount = 0;
    let designCount = 0;
    let engineeringCount = 0;
    let plantExecutionCount = 0;
    let completedCount = 0;

    samplingRequests.forEach((r) => {
      const stage = getStageIdForRequest(r);
      if (stage === "draft") {
        draftCount++;
      } else if (stage === "creative" || stage === "studio") {
        designCount++;
      } else if (stage === "costing" || stage === "samp") {
        engineeringCount++;
      } else if (stage === "plant") {
        plantExecutionCount++;
      } else if (stage === "dispatched" || stage === "deal") {
        completedCount++;
      }
    });

    const activeWorkloadSCU = (
      draftCount * 0.5 +
      designCount * 1.2 +
      engineeringCount * 1.5 +
      plantExecutionCount * 2.2
    ).toFixed(1);

    return {
      total,
      draftCount,
      designCount,
      engineeringCount,
      plantExecutionCount,
      completedCount,
      activeWorkloadSCU,
    };
  }, [samplingRequests]);

  // Filtering
  const filteredRequests = useMemo(() => {
    return samplingRequests.filter((r) => {
      // 1. Stage Tab Filter
      if (selectedStageTab !== "all") {
        const itemStage = getStageIdForRequest(r);
        if (itemStage !== selectedStageTab) return false;
      }

      // 2. Business Year
      if (selectedYear !== "ALL") {
        const itemYear = r.year || (r.dateRequestCreated ? getBusinessYearForDate(r.dateRequestCreated) : "");
        if (itemYear && itemYear !== selectedYear) return false;
      }

      // 3. Global Selected Plant
      if (selectedPlant !== "ALL") {
        const p = (r.targetPlant || "").toLowerCase();
        if (!p.includes(selectedPlant.toLowerCase())) return false;
      }

      // 4. Local Dropdown Plant Filter
      if (selectedPlantFilter !== "all") {
        const p = (r.targetPlant || "").toLowerCase();
        if (!p.includes(selectedPlantFilter.toLowerCase())) return false;
      }

      // 5. Local Dropdown Customer Filter
      if (selectedCustomerFilter !== "all" && r.customer !== selectedCustomerFilter) {
        return false;
      }

      // 6. Request Type Filter
      if (selectedTypeFilter !== "all") {
        const types = getRequestTypes(r);
        if (!types.includes(selectedTypeFilter as any)) return false;
      }

      // 7. SLA Filter
      if (selectedSlaFilter !== "all") {
        const sla = getSlaEvaluation(r.sampleRequiredDate);
        if (selectedSlaFilter === "overdue" && sla.type !== "overdue") return false;
        if (selectedSlaFilter === "soon" && sla.type !== "soon" && sla.type !== "today" && sla.type !== "tomorrow")
          return false;
        if (selectedSlaFilter === "ontrack" && sla.type === "overdue") return false;
      }

      // 8. Text Search
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
    selectedSlaFilter,
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
    setSelectedSlaFilter("all");
    setSelectedStageTab("all");
    setCurrentPage(1);
  };

  const hasActiveFilters = Boolean(
    searchTerm.trim() ||
      selectedCustomerFilter !== "all" ||
      selectedPlantFilter !== "all" ||
      selectedTypeFilter !== "all" ||
      selectedSlaFilter !== "all" ||
      selectedStageTab !== "all"
  );

  // Configuration for the 6 Executive Metric Cards
  const kpiCards = [
    {
      id: "all" as SamplingFilterTab,
      title: "Total Intake",
      value: telemetryMetrics.total,
      subtitle: "Sampling Portfolio",
      icon: Package,
      iconBg: "bg-[#714B67]/10 dark:bg-[#714B67]/25",
      iconColor: "text-[#714B67] dark:text-[#d5bdd0]",
      accentBorder: "border-[#714B67] dark:border-[#966b8b]",
      ring: "ring-2 ring-[#714B67]/30",
      barColor: "bg-[#714B67]",
      isActive: selectedStageTab === "all",
    },
    {
      id: "draft" as SamplingFilterTab,
      title: "Pre-PMT Drafts",
      value: telemetryMetrics.draftCount,
      subtitle: "Awaiting PMT Release",
      icon: Sparkles,
      iconBg: "bg-amber-500/15 dark:bg-amber-950/40",
      iconColor: "text-amber-600 dark:text-amber-400",
      accentBorder: "border-amber-400 dark:border-amber-500",
      ring: "ring-2 ring-amber-400/30",
      barColor: "bg-amber-500",
      isActive: selectedStageTab === "draft",
    },
    {
      id: "creative" as SamplingFilterTab,
      title: "Creative & CAD",
      value: telemetryMetrics.designCount,
      subtitle: "Briefs & Dielines",
      icon: Palette,
      iconBg: "bg-sky-500/15 dark:bg-sky-950/40",
      iconColor: "text-sky-600 dark:text-sky-400",
      accentBorder: "border-sky-400 dark:border-sky-500",
      ring: "ring-2 ring-sky-400/30",
      barColor: "bg-sky-500",
      isActive: selectedStageTab === "creative" || selectedStageTab === "studio",
    },
    {
      id: "samp" as SamplingFilterTab,
      title: "Costing & SAMP",
      value: telemetryMetrics.engineeringCount,
      subtitle: "BOM & Lab Review",
      icon: FlaskConical,
      iconBg: "bg-purple-500/15 dark:bg-purple-950/40",
      iconColor: "text-purple-600 dark:text-purple-400",
      accentBorder: "border-purple-400 dark:border-purple-500",
      ring: "ring-2 ring-purple-400/30",
      barColor: "bg-purple-600",
      isActive: selectedStageTab === "costing" || selectedStageTab === "samp",
    },
    {
      id: "plant" as SamplingFilterTab,
      title: "Plant Execution",
      value: telemetryMetrics.plantExecutionCount,
      subtitle: "Machine Floor Units",
      icon: Factory,
      iconBg: "bg-indigo-500/15 dark:bg-indigo-950/40",
      iconColor: "text-indigo-600 dark:text-indigo-400",
      accentBorder: "border-indigo-400 dark:border-indigo-500",
      ring: "ring-2 ring-indigo-400/30",
      barColor: "bg-indigo-500",
      isActive: selectedStageTab === "plant",
    },
    {
      id: "dispatched" as SamplingFilterTab,
      title: "Closed / Won Deals",
      value: telemetryMetrics.completedCount,
      subtitle: `${telemetryMetrics.activeWorkloadSCU} SCU Effort`,
      icon: CheckCircle2,
      iconBg: "bg-emerald-500/15 dark:bg-emerald-950/40",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      accentBorder: "border-emerald-400 dark:border-emerald-500",
      ring: "ring-2 ring-emerald-400/30",
      barColor: "bg-emerald-500",
      isActive: selectedStageTab === "dispatched" || selectedStageTab === "deal",
    },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#F8F9FA] dark:bg-[#0b0c10] select-text">

      {/* ── 1. Compact Page Header (Aligned to Marketing Desk Standards) ── */}
      <div className="bg-white dark:bg-[#12141d] border-b border-[#E2E8F0] dark:border-white/[0.08] px-6 py-3.5 shrink-0">
        <div className="flex items-center justify-between gap-4">

          {/* Title + Icon + Desk Badge */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#714B67]/10 dark:bg-[#714B67]/25 text-[#714B67] dark:text-[#d5bdd0] flex items-center justify-center shrink-0 border border-[#714B67]/20 shadow-2xs">
              <FlaskConical className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-sm md:text-base font-bold text-neutral-900 dark:text-white truncate">
                  Sample Orders & Manufacturing Workflow Workbench
                </h1>
                <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#714B67]/10 text-[#714B67] dark:bg-purple-950/40 dark:text-purple-300 border border-[#714B67]/20">
                  Marketing Desk
                </span>
              </div>
              <p className="text-[11px] text-neutral-500 dark:text-zinc-400 truncate">
                Commercial sample lifecycle, PMT releases, feasibility checks & lab execution
              </p>
            </div>
          </div>

          {/* Action Buttons & Switchers */}
          <div className="flex items-center gap-2 shrink-0">

            {/* New Sample Request Registration */}
            <button
              type="button"
              onClick={onOpenNewModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#714B67] hover:bg-[#5f3c55] text-white text-xs font-semibold shadow-xs transition active:scale-95 cursor-pointer"
              title="Create New Commercial Sample Request"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New</span>
            </button>

            {/* Refresh */}
            <button
              type="button"
              onClick={onRefresh}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#CED4DA] dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-neutral-50 dark:hover:bg-zinc-700 text-xs font-semibold text-neutral-700 dark:text-zinc-200 shadow-2xs transition cursor-pointer disabled:opacity-50"
              title="Refresh Records"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-[#714B67]" : "text-neutral-500"}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            {/* Export CSV */}
            <button
              type="button"
              onClick={onExportCSV}
              disabled={filteredRequests.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#CED4DA] dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-neutral-50 dark:hover:bg-zinc-700 text-xs font-semibold text-neutral-700 dark:text-zinc-200 shadow-2xs transition cursor-pointer disabled:opacity-50"
              title="Export Filtered CSV"
            >
              <Download className="w-3.5 h-3.5 text-neutral-500" />
              <span className="hidden sm:inline">Export</span>
            </button>

            {/* Draft Mode Sub-view Toggle */}
            {selectedStageTab === "draft" && (
              <div className="inline-flex rounded-lg border border-[#CED4DA] dark:border-zinc-700 bg-neutral-100 dark:bg-zinc-800/80 p-0.5 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setDraftSubMode("packages")}
                  className={`px-2.5 py-1 rounded-md text-xs transition cursor-pointer flex items-center gap-1.5 ${
                    draftSubMode === "packages"
                      ? "bg-white dark:bg-zinc-700 text-[#714B67] dark:text-purple-300 shadow-2xs font-bold"
                      : "text-neutral-500 hover:text-neutral-800 dark:text-zinc-400 font-medium"
                  }`}
                  title="Grouped Program Packages"
                >
                  <Package className="w-3.5 h-3.5" />
                  <span className="text-[11px]">Packages</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDraftSubMode("flat")}
                  className={`px-2.5 py-1 rounded-md text-xs transition cursor-pointer flex items-center gap-1.5 ${
                    draftSubMode === "flat"
                      ? "bg-white dark:bg-zinc-700 text-[#714B67] dark:text-purple-300 shadow-2xs font-bold"
                      : "text-neutral-500 hover:text-neutral-800 dark:text-zinc-400 font-medium"
                  }`}
                  title="Flat Items Table"
                >
                  <ListIcon className="w-3.5 h-3.5" />
                  <span className="text-[11px]">Flat Table</span>
                </button>
              </div>
            )}

          </div>

        </div>

        {/* ── 2. KPI Metric Cards Ribbon (Exact 6 Executive Cards) ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-3.5 pt-3 border-t border-[#F1F5F9] dark:border-white/[0.05]">
          {kpiCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.id}
                onClick={() => {
                  setSelectedStageTab(card.id);
                  setCurrentPage(1);
                }}
                className={`p-3 rounded-xl border transition-all duration-200 cursor-pointer relative group flex flex-col justify-between overflow-hidden ${
                  card.isActive
                    ? `${card.accentBorder} ${card.ring} bg-white dark:bg-[#151722] shadow-xs`
                    : "border-[#E2E8F0] dark:border-white/[0.06] bg-neutral-50/70 dark:bg-zinc-900/40 hover:bg-white dark:hover:bg-zinc-900/80 hover:border-neutral-300 dark:hover:border-zinc-700 hover:shadow-2xs hover:-translate-y-0.5"
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <span className="text-[11px] font-semibold tracking-tight text-neutral-600 dark:text-zinc-300 truncate">
                    {card.title}
                  </span>
                  <div
                    className={`p-1.5 rounded-lg ${card.iconBg} ${card.iconColor} shrink-0 transition-transform group-hover:scale-110`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-sans tracking-tight text-neutral-900 dark:text-zinc-100">
                    {isLoading ? "—" : card.value}
                  </span>
                </div>

                <div className="text-[10.5px] text-neutral-500 dark:text-zinc-400 truncate mt-1 flex items-center gap-1 font-medium">
                  {card.subtitle}
                </div>

                {/* Bottom Active Accent Indicator */}
                {card.isActive && (
                  <div className={`absolute bottom-0 left-2 right-2 h-0.5 rounded-full ${card.barColor}`} />
                )}
              </div>
            );
          })}
        </div>

      </div>

      {/* ── 3. Dedicated Stage Tabs Strip (Tier 1) ── */}
      <div className="bg-white dark:bg-[#12141d] border-b border-[#E2E8F0] dark:border-white/[0.08] px-6 py-2 shrink-0">
        <WorkflowTabStrip
          tabs={workflowTabs}
          activeTab={selectedStageTab}
          onSelectTab={(tabId) => {
            setSelectedStageTab(tabId as SamplingFilterTab);
            setCurrentPage(1);
          }}
          compact
        />
      </div>

      {/* ── 4. Balanced Search, Filter & Batch Control Toolbar (Tier 2) ── */}
      <div className="bg-[#FAFBFD] dark:bg-[#0e1017] border-b border-[#E2E8F0] dark:border-white/[0.08] px-6 py-2.5 shrink-0 flex flex-wrap items-center justify-between gap-3">

        {/* Left: Search Input & Filter Dropdowns */}
        <div className="flex items-center gap-2.5 flex-1 min-w-[280px] max-w-4xl">

          {/* Search Input Box */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search by SR#, material code, title, customer..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-8.5 pl-9 pr-8 rounded-lg border border-[#CED4DA] dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-neutral-800 dark:text-zinc-200 placeholder:text-neutral-400 shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#714B67]/20 focus:border-[#714B67] transition"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 dark:hover:text-zinc-200 text-xs cursor-pointer p-0.5"
              >
                ✕
              </button>
            )}
          </div>

          {/* Request Type Filter Dropdown */}
          <select
            value={selectedTypeFilter}
            onChange={(e) => {
              setSelectedTypeFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="h-8.5 px-3 rounded-lg border border-[#CED4DA] dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-neutral-700 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-[#714B67]/20 focus:border-[#714B67] cursor-pointer shadow-2xs"
          >
            <option value="all">All Request Types</option>
            <option value="sample">Sampling</option>
            <option value="design">Design</option>
            <option value="mockup">Mockup</option>
            <option value="costing">Costing</option>
          </select>

          {/* Plant Filter Dropdown */}
          {uniquePlants.length > 0 && (
            <select
              value={selectedPlantFilter}
              onChange={(e) => {
                setSelectedPlantFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="h-8.5 px-3 rounded-lg border border-[#CED4DA] dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-neutral-700 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-[#714B67]/20 focus:border-[#714B67] cursor-pointer shadow-2xs"
            >
              <option value="all">All Plants</option>
              {uniquePlants.map((p) => (
                <option key={p} value={p}>
                  Plant {p}
                </option>
              ))}
            </select>
          )}

          {/* Customer Filter Dropdown */}
          {uniqueCustomers.length > 0 && (
            <select
              value={selectedCustomerFilter}
              onChange={(e) => {
                setSelectedCustomerFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="h-8.5 px-3 rounded-lg border border-[#CED4DA] dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-neutral-700 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-[#714B67]/20 focus:border-[#714B67] cursor-pointer shadow-2xs max-w-[180px] truncate"
            >
              <option value="all">All Customers</option>
              {uniqueCustomers.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}

        </div>

        {/* Right: Batch Selection Actions & Reset Button */}
        <div className="flex items-center gap-2">

          {/* Batch Actions when items are selected */}
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-1.5 bg-purple-50 dark:bg-purple-950/40 border border-[#714B67]/30 px-2.5 py-1 rounded-lg">
              <span className="font-bold text-xs text-[#714B67] dark:text-purple-300 font-mono">
                {selectedIds.size} Selected
              </span>
              {selectedDraftsCount > 0 && (
                <button
                  type="button"
                  onClick={() => onBatchReleaseDraft(selectedIds)}
                  className="bg-[#714B67] hover:bg-[#5B3C53] text-white text-[11px] font-semibold px-2 py-0.5 rounded flex items-center gap-1 shadow-2xs cursor-pointer"
                  title="Release selected drafts to active PMT workflow"
                >
                  <Send className="w-3 h-3" />
                  <span>Release ({selectedDraftsCount})</span>
                </button>
              )}
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => onBatchDelete(selectedIds)}
                  className="bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-semibold px-2 py-0.5 rounded flex items-center gap-1 cursor-pointer"
                  title="Delete selected requests"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Delete</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setSelectedIds(new Set())}
                className="text-neutral-500 hover:text-neutral-800 dark:hover:text-zinc-200 text-[10px] underline ml-1 cursor-pointer"
              >
                Clear
              </button>
            </div>
          )}

          {/* Reset Filters Shortcut */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-xs font-semibold text-[#714B67] hover:text-[#5b3c53] dark:text-purple-300 dark:hover:text-purple-200 flex items-center gap-1.5 cursor-pointer px-2 py-1 rounded hover:bg-purple-50 dark:hover:bg-purple-950/30 transition"
              title="Reset all search and filter conditions"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          )}

        </div>

      </div>

      {/* ── 5. Main Body: Draft Packages View or Table View ── */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {selectedStageTab === "draft" && draftSubMode === "packages" ? (
          <DraftPackagesView
            requests={samplingRequests}
            isLoading={isLoading}
            onRefresh={onRefresh}
            showToast={showToast || ((msg) => {})}
          />
        ) : filteredRequests.length === 0 ? (
          /* ── Elevated Enterprise Empty State ── */
          <EmptyState
            icon={Package}
            title={hasActiveFilters ? "No Matching Sampling Requests" : "No Sampling Requests in this Category"}
            description={
              hasActiveFilters
                ? "No sample requests match your active search terms or filters. Try adjusting your query or resetting all filters."
                : "There are currently no requests in this workflow stage. Start by creating a new commercial sample request, or check other workflow queues."
            }
            onResetFilters={hasActiveFilters ? handleResetFilters : undefined}
            action={
              <button
                type="button"
                onClick={onOpenNewModal}
                className="px-4 py-2 rounded-lg bg-[#714B67] hover:bg-[#5f3c55] text-white text-xs font-semibold shadow-xs flex items-center gap-2 transition active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Request</span>
              </button>
            }
          >

            {/* 3-Step Lifecycle Guidance Cards */}
            <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-3 text-left pt-6 border-t border-neutral-200/80 dark:border-zinc-800">
              <div className="p-3 rounded-xl border border-neutral-200/70 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/40 shadow-2xs">
                <div className="flex items-center gap-2 text-xs font-bold text-neutral-800 dark:text-zinc-200 mb-1">
                  <span className="w-4 h-4 rounded-full bg-[#714B67]/10 text-[#714B67] dark:bg-purple-900/40 dark:text-purple-300 text-[10px] flex items-center justify-center font-bold">1</span>
                  <span>Intake & Draft</span>
                </div>
                <p className="text-[11px] text-neutral-500 dark:text-zinc-400 leading-normal">Capture client specs, material codes, or custom dielines.</p>
              </div>
              <div className="p-3 rounded-xl border border-neutral-200/70 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/40 shadow-2xs">
                <div className="flex items-center gap-2 text-xs font-bold text-neutral-800 dark:text-zinc-200 mb-1">
                  <span className="w-4 h-4 rounded-full bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300 text-[10px] flex items-center justify-center font-bold">2</span>
                  <span>Creative & CAD</span>
                </div>
                <p className="text-[11px] text-neutral-500 dark:text-zinc-400 leading-normal">Artwork briefs, Shutterstock stock refs, and dielines.</p>
              </div>
              <div className="p-3 rounded-xl border border-neutral-200/70 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/40 shadow-2xs">
                <div className="flex items-center gap-2 text-xs font-bold text-neutral-800 dark:text-zinc-200 mb-1">
                  <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] flex items-center justify-center font-bold">3</span>
                  <span>Lab & Dispatch</span>
                </div>
                <p className="text-[11px] text-neutral-500 dark:text-zinc-400 leading-normal">Costing BOM approval, sampling prototypes, and physical dispatch.</p>
              </div>
            </div>
          </EmptyState>
        ) : (
          <SamplingRequestsTable
            paginatedRequests={paginatedRequests}
            filteredRequestsCount={filteredRequests.length}
            isLoading={isLoading}
            selectedIds={selectedIds}
            copiedId={copiedId}
            currentPage={currentPage}
            pageSize={pageSize}
            totalPages={totalPages}
            isAdmin={isAdmin}
            onToggleSelectAll={handleToggleSelectAll}
            onToggleSelectRow={handleToggleSelectRow}
            onCopyCode={handleCopyCode}
            onOpenDraftInStaging={handleOpenDraftInStaging}
            onInspectRequest={onInspectRequest}
            onReleaseDraft={onReleaseDraft}
            onDeleteRequest={onDeleteRequest}
            onPageChange={(p) => setCurrentPage(p)}
          />
        )}
      </div>

        </div>
      );
    };

export default SamplingRequestsPage;
