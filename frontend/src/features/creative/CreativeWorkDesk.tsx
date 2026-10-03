import React, { useState, useMemo, useCallback, useEffect } from "react";
import { UserProfile } from "@/features/auth";
import { fetchCreativeBriefsApi, updateCreativeBriefApi } from "@/features/sample-requests/api";
import { ProcessStageRibbon, StageStep } from "@/components/erp/ProcessStageRibbon";
import { MetricRibbon, MetricTileItem } from "@/components/erp/MetricRibbon";
import { DataTable, ColumnDef } from "@/components/erp/DataTable";
import { StatusPill } from "@/components/ui/StatusPill";
import {
  Search,
  X,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Zap,
  Clock,
  Layers,
  Sparkles,
  Download,
  Copy,
  Check,
  Palette,
  Eye,
  CheckSquare,
  Square,
  Sliders,
  Send,
  FileCheck,
  Image as ImageIcon,
  CheckCheck,
} from "lucide-react";

export interface CreativeWorkDeskProps {
  user?: UserProfile | null;
}

export interface CreativeBriefItem {
  id: string;
  artCode: string;
  srNumber: string;
  title: string;
  brand: string;
  category: "Notebook Covers" | "Rigid Packaging" | "Tin / Metal Containers" | "Stationery Packs";
  variantsCount: number;
  designer: string;
  colorSpecs: string;
  proofVersion: string;
  proofStatus: "Brief Intake" | "In Concept" | "Client Review" | "Revisions Requested" | "Prepress Approved";
  dueDate: string;
  dimensions: string;
  finishingNotes: string;
  cmykCheckPassed: boolean;
  resolutionDpi: number;
  bleedMm: number;
  clientFeedback?: string;
  accentColor: string;
}

const INITIAL_BRIEFS: CreativeBriefItem[] = [];

const CREATIVE_STAGES: { id: string; stepNumber: string; label: string }[] = [
  { id: "all", stepNumber: "ALL", label: "All Creative Projects" },
  { id: "intake", stepNumber: "01", label: "Brief & Intake" },
  { id: "concept", stepNumber: "02", label: "Concept Ideation" },
  { id: "variants", stepNumber: "03", label: "Design Variants" },
  { id: "proofing", stepNumber: "04", label: "Client Proofing" },
  { id: "prepress", stepNumber: "05", label: "Prepress Certified" },
];

export const CreativeWorkDesk: React.FC<CreativeWorkDeskProps> = ({ user }) => {
  const [briefs, setBriefs] = useState<CreativeBriefItem[]>(INITIAL_BRIEFS);
  const [selectedStageId, setSelectedStageId] = useState<string>("all");
  const [quickFilter, setQuickFilter] = useState<"none" | "client_review" | "prepress" | "revisions">("none");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBrand, setSelectedBrand] = useState<string>("all");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync from cross-desk API on mount
  const loadBriefs = useCallback(async () => {
    try {
      const live = await fetchCreativeBriefsApi();
      if (Array.isArray(live)) {
        setBriefs(live);
      }
    } catch {
      // Keep existing state
    }
  }, []);

  useEffect(() => {
    loadBriefs();
  }, [loadBriefs]);

  useEffect(() => {
    const handleRefresh = (event: Event) => {
      event.preventDefault();
      void loadBriefs().finally(() => window.dispatchEvent(new Event("app:refresh-complete")));
    };
    window.addEventListener("app:refresh-requested", handleRefresh);
    return () => window.removeEventListener("app:refresh-requested", handleRefresh);
  }, [loadBriefs]);

  // Inspector State
  const [selectedItem, setSelectedItem] = useState<CreativeBriefItem | null>(null);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [inspectorTab, setInspectorTab] = useState<"proof" | "review" | "assets">("proof");
  const [clientNoteInput, setClientNoteInput] = useState("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Multi-select state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Copy code feedback
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const handleCopyCode = (code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 1200);
  };

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }, []);

  // Stage steps
  const stageSteps: StageStep[] = useMemo(() => {
    return CREATIVE_STAGES.map((st) => {
      let count = 0;
      if (st.id === "all") count = briefs.length;
      else if (st.id === "intake") count = briefs.filter((b) => b.proofStatus === "Brief Intake").length;
      else if (st.id === "concept") count = briefs.filter((b) => b.proofStatus === "In Concept").length;
      else if (st.id === "variants") count = briefs.filter((b) => b.proofStatus === "Revisions Requested").length;
      else if (st.id === "proofing") count = briefs.filter((b) => b.proofStatus === "Client Review").length;
      else if (st.id === "prepress") count = briefs.filter((b) => b.proofStatus === "Prepress Approved").length;

      return {
        id: st.id,
        stepNumber: st.stepNumber,
        label: st.label,
        count,
      };
    });
  }, [briefs]);

  // Metrics
  const metrics: MetricTileItem[] = useMemo(() => {
    const total = briefs.length;
    const clientReview = briefs.filter((b) => b.proofStatus === "Client Review").length;
    const revisions = briefs.filter((b) => b.proofStatus === "Revisions Requested").length;
    const prepressApproved = briefs.filter((b) => b.proofStatus === "Prepress Approved").length;

    return [
      {
        id: "total",
        label: "Total Creative Pipeline",
        value: total,
        deltaText: "Active Design Studio Briefs",
        deltaTone: "neutral",
        isActive: selectedStageId === "all" && quickFilter === "none" && selectedCategory === "all",
        onClick: () => {
          setSelectedStageId("all");
          setQuickFilter("none");
          setSelectedCategory("all");
        },
      },
      {
        id: "client_review",
        label: "Awaiting Client Sign-Off",
        value: clientReview,
        deltaText: clientReview > 0 ? "⚡ Live Proofs Sent" : "Proofs Cleared",
        deltaTone: clientReview > 0 ? "warning" : "positive",
        isActive: quickFilter === "client_review",
        onClick: () => {
          setQuickFilter((prev) => (prev === "client_review" ? "none" : "client_review"));
          setSelectedStageId("all");
        },
      },
      {
        id: "revisions",
        label: "Design Revisions Active",
        value: revisions,
        deltaText: "Color & Typography Tweaks",
        deltaTone: revisions > 0 ? "warning" : "neutral",
        isActive: quickFilter === "revisions",
        onClick: () => {
          setQuickFilter((prev) => (prev === "revisions" ? "none" : "revisions"));
          setSelectedStageId("all");
        },
      },
      {
        id: "prepress",
        label: "Prepress Certified",
        value: prepressApproved,
        deltaText: "Ready for CAD & CTP Plates",
        deltaTone: "positive",
        isActive: quickFilter === "prepress",
        onClick: () => {
          setQuickFilter((prev) => (prev === "prepress" ? "none" : "prepress"));
          setSelectedStageId("all");
        },
      },
    ];
  }, [briefs, selectedStageId, quickFilter, selectedCategory]);

  // Filtering
  const filteredBriefs = useMemo(() => {
    return briefs.filter((b) => {
      // Quick filter
      if (quickFilter === "client_review" && b.proofStatus !== "Client Review") return false;
      if (quickFilter === "revisions" && b.proofStatus !== "Revisions Requested") return false;
      if (quickFilter === "prepress" && b.proofStatus !== "Prepress Approved") return false;

      // Stage filter
      if (selectedStageId !== "all") {
        if (selectedStageId === "intake" && b.proofStatus !== "Brief Intake") return false;
        if (selectedStageId === "concept" && b.proofStatus !== "In Concept") return false;
        if (selectedStageId === "variants" && b.proofStatus !== "Revisions Requested") return false;
        if (selectedStageId === "proofing" && b.proofStatus !== "Client Review") return false;
        if (selectedStageId === "prepress" && b.proofStatus !== "Prepress Approved") return false;
      }

      // Category filter
      if (selectedCategory !== "all" && b.category !== selectedCategory) return false;

      // Brand filter
      if (selectedBrand !== "all" && b.brand !== selectedBrand) return false;

      // Search Query
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const match =
          b.artCode.toLowerCase().includes(q) ||
          b.srNumber.toLowerCase().includes(q) ||
          b.title.toLowerCase().includes(q) ||
          b.brand.toLowerCase().includes(q) ||
          b.designer.toLowerCase().includes(q) ||
          b.colorSpecs.toLowerCase().includes(q);
        if (!match) return false;
      }

      return true;
    });
  }, [briefs, quickFilter, selectedStageId, selectedCategory, selectedBrand, searchTerm]);

  // Unique Brands
  const uniqueBrands = useMemo(() => {
    const set = new Set<string>();
    briefs.forEach((b) => set.add(b.brand));
    return Array.from(set);
  }, [briefs]);

  // Handle open inspector
  const handleSelectRow = (item: CreativeBriefItem) => {
    setSelectedItem(item);
    setClientNoteInput(item.clientFeedback || "");
    setInspectorTab("proof");
    setIsInspectorOpen(true);
  };

  // Toggle selection
  const handleToggleSelectRow = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.size === filteredBriefs.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredBriefs.map((b) => b.id)));
    }
  };

  // Action: Update Proof Status
  const handleUpdateStatus = (newStatus: CreativeBriefItem["proofStatus"]) => {
    if (!selectedItem) return;
    setIsUpdatingStatus(true);
    setTimeout(() => {
      setBriefs((prev) =>
        prev.map((b) =>
          b.id === selectedItem.id
            ? { ...b, proofStatus: newStatus, clientFeedback: clientNoteInput }
            : b
        )
      );
      setSelectedItem((prev) => (prev ? { ...prev, proofStatus: newStatus, clientFeedback: clientNoteInput } : null));
      updateCreativeBriefApi(selectedItem.id, { proofStatus: newStatus, clientFeedback: clientNoteInput });
      setIsUpdatingStatus(false);
      showToast(`✓ Artwork ${selectedItem.artCode} updated to: ${newStatus}`);
    }, 300);
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ["Artwork Code", "SR Number", "Title", "Brand", "Category", "Designer", "Color Profile", "Version", "Status", "Due Date"];
    const rows = filteredBriefs.map((b) => [
      `"${b.artCode}"`,
      `"${b.srNumber}"`,
      `"${b.title}"`,
      `"${b.brand}"`,
      `"${b.category}"`,
      `"${b.designer}"`,
      `"${b.colorSpecs}"`,
      `"${b.proofVersion}"`,
      `"${b.proofStatus}"`,
      `"${b.dueDate}"`,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = `navneet_creative_briefs_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    showToast(`Exported ${filteredBriefs.length} creative briefs to CSV`);
  };

  // Table Columns
  const columns: ColumnDef<CreativeBriefItem>[] = useMemo(
    () => [
      {
        id: "select",
        header: (
          <div className="flex items-center justify-center pl-1">
            <button
              type="button"
              onClick={handleToggleSelectAll}
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
            >
              {selectedIds.size > 0 && selectedIds.size === filteredBriefs.length ? (
                <CheckSquare className="w-3.5 h-3.5 text-brand-600" />
              ) : (
                <Square className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        ),
        width: "w-[36px]",
        align: "center",
        cell: (row) => (
          <div className="flex items-center justify-center pl-1" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => handleToggleSelectRow(row.id)}
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
            >
              {selectedIds.has(row.id) ? (
                <CheckSquare className="w-3.5 h-3.5 text-brand-600" />
              ) : (
                <Square className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        ),
      },
      {
        id: "artCode",
        header: "Artwork Code",
        sortable: true,
        width: "w-[140px]",
        cell: (row) => (
          <div>
            <div className="flex items-center gap-1.5 font-mono text-[12px] font-semibold text-zinc-900 dark:text-zinc-100">
              <span>{row.artCode}</span>
              <button
                type="button"
                onClick={(e) => handleCopyCode(row.artCode, e)}
                className="p-0.5 rounded text-zinc-400 hover:text-brand-600 cursor-pointer"
              >
                {copiedCode === row.artCode ? (
                  <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </button>
            </div>
            <div className="text-[10px] text-zinc-400 font-mono tracking-tight">
              Linked: {row.srNumber}
            </div>
          </div>
        ),
      },
      {
        id: "category",
        header: "Product Category",
        width: "w-[150px]",
        cell: (row) => (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-200 dark:border-white/5 whitespace-nowrap">
            <Palette className="w-3 h-3 text-brand-500 shrink-0" />
            {row.category}
          </span>
        ),
      },
      {
        id: "title",
        header: "Collection & Artwork Title",
        width: "min-w-[240px]",
        cell: (row) => (
          <div>
            <div className="font-medium text-zinc-900 dark:text-zinc-100 truncate max-w-[320px]">
              {row.title}
            </div>
            <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-sans mt-0.5">
              <span>Brand: <strong className="font-semibold text-zinc-700 dark:text-zinc-300">{row.brand}</strong></span>
              <span>·</span>
              <span className="font-mono text-brand-600 dark:text-brand-400 font-bold">{row.variantsCount} Variants</span>
            </div>
          </div>
        ),
      },
      {
        id: "designer",
        header: "Lead Designer",
        width: "w-[130px]",
        cell: (row) => (
          <span className="text-[12px] font-medium text-zinc-700 dark:text-zinc-300 truncate block">
            {row.designer}
          </span>
        ),
      },
      {
        id: "colorSpecs",
        header: "Color & Separation",
        width: "w-[190px]",
        cell: (row) => (
          <div className="flex flex-col gap-0.5 font-mono text-[11px]">
            <span className="text-zinc-800 dark:text-zinc-200 truncate">{row.colorSpecs}</span>
            <div className="flex items-center gap-1 text-[10px] text-zinc-400">
              <span className={row.cmykCheckPassed ? "text-emerald-600 font-bold" : "text-amber-600 font-bold"}>
                {row.cmykCheckPassed ? "✓ CMYK Validated" : "⚠ RGB Converted"}
              </span>
              <span>·</span>
              <span>{row.resolutionDpi} DPI</span>
            </div>
          </div>
        ),
      },
      {
        id: "proofStatus",
        header: "Proof Stage",
        sortable: true,
        width: "w-[155px]",
        cell: (row) => {
          let tone = "neutral";
          if (row.proofStatus === "Prepress Approved") tone = "positive";
          else if (row.proofStatus === "Client Review") tone = "warning";
          else if (row.proofStatus === "Revisions Requested") tone = "urgent";

          return (
            <div className="flex flex-col gap-0.5">
              <StatusPill status={row.proofStatus} size="xs" />
              <span className="text-[10px] font-mono text-zinc-400 pl-0.5">{row.proofVersion}</span>
            </div>
          );
        },
      },
      {
        id: "dueDate",
        header: "Target SLA",
        sortable: true,
        width: "w-[110px]",
        cell: (row) => (
          <span className="font-mono text-[12px] text-zinc-800 dark:text-zinc-200 tnum">
            {row.dueDate}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        width: "w-[90px]",
        align: "right",
        cell: (row) => (
          <div className="flex items-center justify-end" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => handleSelectRow(row)}
              className="h-8.5 px-3.5 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
            >
              <Eye className="w-3.5 h-3.5 text-zinc-400" />
              <span>Inspect</span>
            </button>
          </div>
        ),
      },
    ],
    [copiedCode, selectedIds, filteredBriefs]
  );

  return (
    <div className="flex flex-col flex-1 h-full min-h-0 overflow-hidden bg-white dark:bg-[#0b0c10] select-text">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-16 right-5 z-[60] flex items-center gap-2.5 px-4 py-2.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-2xl text-[12px] font-semibold border border-zinc-800 dark:border-zinc-200/80 max-w-sm animate-smooth-toast">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Process Stage Ribbon */}
      <ProcessStageRibbon
        stages={stageSteps}
        selectedStageId={selectedStageId}
        onSelectStage={(id) => {
          setSelectedStageId(id);
          setQuickFilter("none");
        }}
      />

      {/* 2. High-Density Metric Ribbon */}
      <MetricRibbon metrics={metrics} />

      {/* 3. Operational Command & Filter Toolbar */}
      <div className="erp-command-bar px-4 sm:px-6 py-2.5 shrink-0 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Filters & Search */}
        <div className="flex items-center flex-wrap gap-2.5">
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search Artwork, Brand, Designer… (Ctrl+K)"
              className="h-9 w-60 sm:w-72 pl-9 pr-8 rounded-md border border-zinc-300 dark:border-white/15 bg-white dark:bg-[#111318] text-[13px] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15 transition-colors font-sans"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Switcher */}
          <div className="inline-flex bg-zinc-100 dark:bg-zinc-800/80 p-0.5 rounded-md text-xs border border-zinc-200/60 dark:border-white/[0.05]">
            <button
              type="button"
              onClick={() => setSelectedCategory("all")}
              className={`h-8 px-3.5 rounded transition-colors text-xs font-medium cursor-pointer ${
                selectedCategory === "all"
                  ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-50 font-semibold shadow-xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              All Categories
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory("Notebook Covers")}
              className={`h-8 px-3.5 rounded transition-colors text-xs font-medium cursor-pointer ${
                selectedCategory === "Notebook Covers"
                  ? "bg-white dark:bg-zinc-700 text-brand-700 dark:text-brand-300 font-semibold shadow-xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              Notebooks
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory("Rigid Packaging")}
              className={`h-8 px-3.5 rounded transition-colors text-xs font-medium cursor-pointer ${
                selectedCategory === "Rigid Packaging"
                  ? "bg-white dark:bg-zinc-700 text-amber-700 dark:text-amber-300 font-semibold shadow-xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              Rigid Packaging
            </button>
          </div>

          {/* Brand Dropdown */}
          <select
            value={selectedBrand}
            onChange={(e) => setSelectedBrand(e.target.value)}
            className="h-9 px-3 rounded-md border border-zinc-200 dark:border-zinc-700/80 bg-zinc-50/60 dark:bg-zinc-900/60 text-xs text-zinc-700 dark:text-zinc-300 outline-none focus:border-brand-500 cursor-pointer max-w-[160px] truncate font-medium"
          >
            <option value="all">All Brands</option>
            {uniqueBrands.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>

          {/* Reset */}
          {(searchTerm || selectedCategory !== "all" || selectedBrand !== "all" || selectedStageId !== "all" || quickFilter !== "none") && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory("all");
                setSelectedBrand("all");
                setSelectedStageId("all");
                setQuickFilter("none");
              }}
              className="h-9 px-3.5 rounded-md border border-zinc-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-900 text-xs text-zinc-600 dark:text-zinc-400 hover:text-rose-600 hover:border-rose-200 flex items-center gap-1.5 cursor-pointer transition-colors font-medium"
            >
              <X className="w-3.5 h-3.5" />
              Reset
            </button>
          )}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 shrink-0 ml-auto">
          <button
            type="button"
            onClick={handleExportCSV}
            className="h-9 px-4 rounded-md border border-zinc-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 4. Dense Data Table */}
      <DataTable
        data={filteredBriefs}
        columns={columns}
        keyExtractor={(row) => row.id}
        onRowClick={handleSelectRow}
        selectedRowId={selectedItem?.id}
        totalCount={filteredBriefs.length}
        toolbarLeft={
          <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
            <span>
              Showing <span className="font-semibold text-zinc-900 dark:text-zinc-100 font-mono">{filteredBriefs.length}</span> of{" "}
              <span className="font-semibold text-zinc-900 dark:text-zinc-100 font-mono">{briefs.length}</span> creative briefs
            </span>
          </div>
        }
      />

      {/* 5. Master-Detail Inspector Modal */}
      {isInspectorOpen && selectedItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60"
          onClick={() => setIsInspectorOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="relative w-full max-w-5xl max-h-[94vh] flex flex-col bg-white dark:bg-[#0f1118] border border-zinc-200 dark:border-white/10 rounded-xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Bar */}
            <div className="px-5 py-3.5 border-b border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-[#0f1118] flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center flex-wrap gap-2">
                <span className="inline-flex items-center gap-1 bg-white dark:bg-zinc-800 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-700 text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100">
                  {selectedItem.artCode}
                </span>
                <span className="text-[11px] font-mono text-zinc-400">({selectedItem.brand})</span>
                <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">{selectedItem.title}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline-block text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
                  [Esc]
                </span>
                <button
                  type="button"
                  onClick={() => setIsInspectorOpen(false)}
                  className="h-8 w-8 rounded-md flex items-center justify-center text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                  title="Close (Esc)"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Context Strip */}
            <div className="grid grid-cols-3 border-b border-zinc-200 dark:border-white/[0.08] bg-zinc-50/40 dark:bg-[#161822] divide-x divide-zinc-200 dark:divide-white/[0.08] shrink-0 text-xs p-2.5">
              <div>
                <span className="block text-[10px] uppercase font-bold text-zinc-400">Lead Designer</span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100 truncate block">
                  {selectedItem.designer}
                </span>
              </div>
              <div className="pl-3">
                <span className="block text-[10px] uppercase font-bold text-zinc-400">Dimensions</span>
                <span className="font-mono font-semibold text-zinc-900 dark:text-zinc-100 truncate block tabular-nums">
                  {selectedItem.dimensions}
                </span>
              </div>
              <div className="pl-3">
                <span className="block text-[10px] uppercase font-bold text-zinc-400">SLA Due Date</span>
                <span className="font-mono font-semibold text-zinc-900 dark:text-zinc-100 truncate block tabular-nums">
                  {selectedItem.dueDate}
                </span>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-[#0f1118] px-3 shrink-0 gap-1">
              <button
                type="button"
                onClick={() => setInspectorTab("proof")}
                className={`h-9 px-3.5 text-xs font-semibold border-b-2 cursor-pointer transition-colors ${
                  inspectorTab === "proof"
                    ? "border-brand-600 text-brand-600 dark:text-brand-400"
                    : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                }`}
              >
                Artwork Proof Canvas
              </button>
              <button
                type="button"
                onClick={() => setInspectorTab("review")}
                className={`h-9 px-3.5 text-xs font-semibold border-b-2 cursor-pointer transition-colors flex items-center gap-1.5 ${
                  inspectorTab === "review"
                    ? "border-brand-600 text-brand-600 dark:text-brand-400"
                    : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                }`}
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Proof Sign-Off Workflow
              </button>
              <button
                type="button"
                onClick={() => setInspectorTab("assets")}
                className={`h-9 px-3.5 text-xs font-semibold border-b-2 cursor-pointer transition-colors flex items-center gap-1.5 ${
                  inspectorTab === "assets"
                    ? "border-brand-600 text-brand-600 dark:text-brand-400"
                    : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                }`}
              >
                <Download className="w-3.5 h-3.5" />
                Vector Assets & CTP
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
              {/* TAB 1: ARTWORK PROOF CANVAS */}
              {inspectorTab === "proof" && (
                <div className="space-y-4">
                  {/* Proof Graphic Simulator Card */}
                  <div className="rounded-lg border border-zinc-200 dark:border-white/10 bg-zinc-900 p-6 flex flex-col items-center justify-center text-center relative overflow-hidden shadow-inner">
                    <div
                      className="w-48 h-64 rounded-md shadow-2xl border-4 border-white/20 p-4 flex flex-col justify-between transition-transform hover:scale-[1.02]"
                      style={{
                        background: `linear-gradient(135deg, ${selectedItem.accentColor} 0%, #18181b 100%)`,
                      }}
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-mono text-[10px] font-bold text-white/80 uppercase tracking-widest">
                          {selectedItem.brand}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-white/20 text-white font-mono">
                          {selectedItem.proofVersion}
                        </span>
                      </div>
                      <div className="text-left text-white my-auto">
                        <h4 className="text-base font-extrabold tracking-tight leading-snug">
                          {selectedItem.title}
                        </h4>
                        <p className="text-[10px] text-white/70 mt-1 font-mono">{selectedItem.dimensions}</p>
                      </div>
                      <div className="border-t border-white/20 pt-2 flex justify-between items-center text-[10px] text-white/80 font-mono">
                        <span>{selectedItem.variantsCount} Colorways</span>
                        <span>Prepress: {selectedItem.resolutionDpi} DPI</span>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-white/10 text-white/90 border border-white/10">
                        {selectedItem.finishingNotes}
                      </span>
                    </div>
                  </div>

                  {/* Prepress Separation & Color Swatches */}
                  <div className="rounded-md border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-[#0f1118] p-4 space-y-3">
                    <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                      <Sliders className="w-4 h-4 text-brand-600" />
                      Color Separation & Prepress Compliance:
                    </h4>

                    <div className="grid grid-cols-5 gap-2 text-center font-mono text-[10px]">
                      <div className="p-2 rounded bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-300 dark:border-cyan-800 text-cyan-800 dark:text-cyan-200 font-bold">
                        Cyan (C)
                      </div>
                      <div className="p-2 rounded bg-pink-50 dark:bg-pink-950/40 border border-pink-300 dark:border-pink-800 text-pink-800 dark:text-pink-200 font-bold">
                        Magenta (M)
                      </div>
                      <div className="p-2 rounded bg-yellow-50 dark:bg-yellow-950/40 border border-yellow-300 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200 font-bold">
                        Yellow (Y)
                      </div>
                      <div className="p-2 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 font-bold">
                        Black (K)
                      </div>
                      <div className="p-2 rounded bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-200 font-bold">
                        Spot Foil
                      </div>
                    </div>

                    <div className="divide-y divide-zinc-100 dark:divide-white/5 font-mono text-[11px] pt-1">
                      <div className="py-1.5 flex justify-between">
                        <span className="text-zinc-500">Bleed Clearance:</span>
                        <span className="font-semibold text-emerald-600 tabular-nums">✓ {selectedItem.bleedMm}mm Full Bleed Applied</span>
                      </div>
                      <div className="py-1.5 flex justify-between">
                        <span className="text-zinc-500">Raster Image Check:</span>
                        <span className="font-semibold text-emerald-600 tabular-nums">✓ {selectedItem.resolutionDpi} DPI (Press Ready)</span>
                      </div>
                      <div className="py-1.5 flex justify-between">
                        <span className="text-zinc-500">Vector Fonts Outlined:</span>
                        <span className="font-semibold text-emerald-600">✓ All 12 Typefaces Converted to Outlines</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: PROOF SIGN-OFF WORKFLOW */}
              {inspectorTab === "review" && (
                <div className="space-y-4">
                  <div className="rounded-md border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-[#0f1118] p-4 space-y-3.5 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                        <Zap className="w-4 h-4 text-amber-500" />
                        Client Proof Approval Verdict:
                      </span>
                      <span className="font-mono text-[10px] text-zinc-400">Current Status: {selectedItem.proofStatus}</span>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">
                        Client Review Feedback / Revision Notes:
                      </label>
                      <textarea
                        rows={3}
                        value={clientNoteInput}
                        onChange={(e) => setClientNoteInput(e.target.value)}
                        placeholder="e.g. Brand director signed off color proof on 27-Sep; ready to release to Studio dieline..."
                        className="w-full p-3 rounded-md border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900 text-xs text-zinc-900 dark:text-zinc-100 outline-none focus:border-brand-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2.5 pt-1">
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus("Prepress Approved")}
                        disabled={isUpdatingStatus}
                        className="h-10 px-4 rounded-md bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-[13px] flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50 transition-colors"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Certify Proof & Release</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleUpdateStatus("Revisions Requested")}
                        disabled={isUpdatingStatus}
                        className="h-10 px-4 rounded-md border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 hover:bg-amber-100 font-bold text-[13px] flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50 transition-colors"
                      >
                        <AlertTriangle className="w-4 h-4" />
                        <span>Request Creative Revision</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: VECTOR ASSETS & CTP */}
              {inspectorTab === "assets" && (
                <div className="space-y-4">
                  <div className="rounded-md border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-[#0f1118] p-4 space-y-3">
                    <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                      <Download className="w-4 h-4 text-brand-600" />
                      Download Master Production Packages:
                    </h4>

                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => showToast(`Downloaded master package for ${selectedItem.artCode}.ai`)}
                        className="w-full p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-left hover:border-brand-500 hover:bg-brand-50/20 transition-all cursor-pointer flex items-center justify-between"
                      >
                        <div>
                          <span className="block font-bold text-xs text-zinc-800 dark:text-zinc-200">
                            {selectedItem.artCode}_Master_Artwork.ai
                          </span>
                          <span className="text-[10px] text-zinc-400">Adobe Illustrator CC (With Embedded Spot Layers) · 48.2 MB</span>
                        </div>
                        <Download className="w-4 h-4 text-zinc-400" />
                      </button>

                      <button
                        type="button"
                        onClick={() => showToast(`Downloaded press PDF for ${selectedItem.artCode}.pdf`)}
                        className="w-full p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-left hover:border-brand-500 hover:bg-brand-50/20 transition-all cursor-pointer flex items-center justify-between"
                      >
                        <div>
                          <span className="block font-bold text-xs text-zinc-800 dark:text-zinc-200">
                            {selectedItem.artCode}_Press_Ready_PDFX4.pdf
                          </span>
                          <span className="text-[10px] text-zinc-400">ISO 12647-2 Certified CMYK Press File · 14.8 MB</span>
                        </div>
                        <Download className="w-4 h-4 text-zinc-400" />
                      </button>

                      <button
                        type="button"
                        onClick={() => showToast(`Downloaded Color Separation sheet for ${selectedItem.artCode}`)}
                        className="w-full p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-left hover:border-brand-500 hover:bg-brand-50/20 transition-all cursor-pointer flex items-center justify-between"
                      >
                        <div>
                          <span className="block font-bold text-xs text-zinc-800 dark:text-zinc-200">
                            {selectedItem.artCode}_Ink_Coverage_Report.json
                          </span>
                          <span className="text-[10px] text-zinc-400">Total Ink Limit (TIL) & Pantone formulas</span>
                        </div>
                        <Download className="w-4 h-4 text-zinc-400" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Bar */}
            <div className="px-5 py-3 border-t border-zinc-200 dark:border-white/[0.08] bg-zinc-50/50 dark:bg-[#161822] flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2 text-xs text-zinc-500 font-mono">
                <span>Due Date: {selectedItem.dueDate}</span>
              </div>
              <button
                type="button"
                onClick={() => setIsInspectorOpen(false)}
                className="h-8 px-4 rounded-md bg-zinc-900 hover:bg-black dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-mono font-bold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreativeWorkDesk;
