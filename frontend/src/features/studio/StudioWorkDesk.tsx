import React, { useState, useMemo, useCallback, useEffect } from "react";
import { UserProfile } from "@/features/auth";
import { fetchStudioDielinesApi, updateStudioDielineApi } from "@/features/sample-requests/api";
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
  Eye,
  CheckSquare,
  Square,
  Sliders,
  Box,
  Boxes,
  FileCode2,
  FileCheck,
  ChevronRight,
  Maximize2,
} from "lucide-react";

export interface StudioWorkDeskProps {
  user?: UserProfile | null;
}

export interface DielineItem {
  id: string;
  dielineCode: string;
  srNumber: string;
  boxFormat: "Rigid Box" | "Folding Carton" | "Flute Corrugated" | "Blister / Sleeve";
  title: string;
  client: string;
  dimensions: string; // L x W x H mm
  substrate: string;
  caliperMicrons: number;
  machineCompatibility: string;
  status: "CAD Intake" | "Dieline Construction" | "3D Simulation" | "Plotter Sample Tested" | "Laser Die Cleared";
  dueDate: string;
  targetPlant: string;
  fluteGrade?: string;
  grainDirection: "Parallel to Spine" | "Perpendicular to Crease";
  fileFormats: string[];
}

const INITIAL_DIELINES: DielineItem[] = [];

const STUDIO_STAGES: { id: string; stepNumber: string; label: string }[] = [
  { id: "all", stepNumber: "ALL", label: "All Dieline Projects" },
  { id: "intake", stepNumber: "01", label: "CAD Intake" },
  { id: "construction", stepNumber: "02", label: "Dieline Construction" },
  { id: "simulation", stepNumber: "03", label: "3D Fold Simulation" },
  { id: "plotter", stepNumber: "04", label: "Plotter Sample Tested" },
  { id: "cleared", stepNumber: "05", label: "Laser Die Cleared" },
];

export const StudioWorkDesk: React.FC<StudioWorkDeskProps> = ({ user }) => {
  const [dielines, setDielines] = useState<DielineItem[]>(INITIAL_DIELINES);
  const [selectedStageId, setSelectedStageId] = useState<string>("all");
  const [quickFilter, setQuickFilter] = useState<"none" | "simulation" | "cleared" | "urgent">("none");
  const [selectedFormat, setSelectedFormat] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPlant, setSelectedPlant] = useState<string>("all");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync from cross-desk API on mount
  const loadDielines = useCallback(async () => {
    try {
      const live = await fetchStudioDielinesApi();
      if (Array.isArray(live)) {
        setDielines(live);
      }
    } catch {
      // Keep existing state
    }
  }, []);

  useEffect(() => {
    loadDielines();
  }, [loadDielines]);

  useEffect(() => {
    const handleRefresh = (event: Event) => {
      event.preventDefault();
      void loadDielines().finally(() => window.dispatchEvent(new Event("app:refresh-complete")));
    };
    window.addEventListener("app:refresh-requested", handleRefresh);
    return () => window.removeEventListener("app:refresh-requested", handleRefresh);
  }, [loadDielines]);

  // Inspector State
  const [selectedItem, setSelectedItem] = useState<DielineItem | null>(null);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [inspectorTab, setInspectorTab] = useState<"cad" | "folding" | "files">("cad");

  // Multi-select
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
    return STUDIO_STAGES.map((st) => {
      let count = 0;
      if (st.id === "all") count = dielines.length;
      else if (st.id === "intake") count = dielines.filter((d) => d.status === "CAD Intake").length;
      else if (st.id === "construction") count = dielines.filter((d) => d.status === "Dieline Construction").length;
      else if (st.id === "simulation") count = dielines.filter((d) => d.status === "3D Simulation").length;
      else if (st.id === "plotter") count = dielines.filter((d) => d.status === "Plotter Sample Tested").length;
      else if (st.id === "cleared") count = dielines.filter((d) => d.status === "Laser Die Cleared").length;

      return {
        id: st.id,
        stepNumber: st.stepNumber,
        label: st.label,
        count,
      };
    });
  }, [dielines]);

  // Metrics
  const metrics: MetricTileItem[] = useMemo(() => {
    const total = dielines.length;
    const simulation = dielines.filter((d) => d.status === "3D Simulation").length;
    const plotter = dielines.filter((d) => d.status === "Plotter Sample Tested").length;
    const cleared = dielines.filter((d) => d.status === "Laser Die Cleared").length;

    return [
      {
        id: "total",
        label: "Total Dieline Projects",
        value: total,
        deltaText: "Structural CAD Engineering",
        deltaTone: "neutral",
        isActive: selectedStageId === "all" && quickFilter === "none" && selectedFormat === "all",
        onClick: () => {
          setSelectedStageId("all");
          setQuickFilter("none");
          setSelectedFormat("all");
        },
      },
      {
        id: "simulation",
        label: "3D Fold & Fitment Check",
        value: simulation,
        deltaText: simulation > 0 ? "⚡ Collision Checks Active" : "All Checked",
        deltaTone: simulation > 0 ? "warning" : "positive",
        isActive: quickFilter === "simulation",
        onClick: () => {
          setQuickFilter((prev) => (prev === "simulation" ? "none" : "simulation"));
          setSelectedStageId("all");
        },
      },
      {
        id: "plotter",
        label: "Kongsberg Plotter Tests",
        value: plotter,
        deltaText: "Physical Table Verification",
        deltaTone: "neutral",
        isActive: selectedStageId === "plotter",
        onClick: () => {
          setSelectedStageId("plotter");
        },
      },
      {
        id: "cleared",
        label: "Laser Die Cleared",
        value: cleared,
        deltaText: "Ready for Plant Die Shop",
        deltaTone: "positive",
        isActive: quickFilter === "cleared",
        onClick: () => {
          setQuickFilter((prev) => (prev === "cleared" ? "none" : "cleared"));
          setSelectedStageId("all");
        },
      },
    ];
  }, [dielines, selectedStageId, quickFilter, selectedFormat]);

  // Filtering
  const filteredDielines = useMemo(() => {
    return dielines.filter((d) => {
      // Quick filter
      if (quickFilter === "simulation" && d.status !== "3D Simulation") return false;
      if (quickFilter === "cleared" && d.status !== "Laser Die Cleared") return false;

      // Stage filter
      if (selectedStageId !== "all") {
        if (selectedStageId === "intake" && d.status !== "CAD Intake") return false;
        if (selectedStageId === "construction" && d.status !== "Dieline Construction") return false;
        if (selectedStageId === "simulation" && d.status !== "3D Simulation") return false;
        if (selectedStageId === "plotter" && d.status !== "Plotter Sample Tested") return false;
        if (selectedStageId === "cleared" && d.status !== "Laser Die Cleared") return false;
      }

      // Format filter
      if (selectedFormat !== "all" && d.boxFormat !== selectedFormat) return false;

      // Plant filter
      if (selectedPlant !== "all" && d.targetPlant !== selectedPlant) return false;

      // Search Query
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const match =
          d.dielineCode.toLowerCase().includes(q) ||
          d.srNumber.toLowerCase().includes(q) ||
          d.title.toLowerCase().includes(q) ||
          d.client.toLowerCase().includes(q) ||
          d.dimensions.toLowerCase().includes(q) ||
          d.machineCompatibility.toLowerCase().includes(q);
        if (!match) return false;
      }

      return true;
    });
  }, [dielines, quickFilter, selectedStageId, selectedFormat, selectedPlant, searchTerm]);

  // Unique plants
  const uniquePlants = useMemo(() => {
    const set = new Set<string>();
    dielines.forEach((d) => set.add(d.targetPlant));
    return Array.from(set);
  }, [dielines]);

  // Handle open inspector
  const handleSelectRow = (item: DielineItem) => {
    setSelectedItem(item);
    setInspectorTab("cad");
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
    if (selectedIds.size === filteredDielines.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredDielines.map((d) => d.id)));
    }
  };

  // Action: Advance Structural Status
  const handleUpdateStatus = (newStatus: DielineItem["status"]) => {
    if (!selectedItem) return;
    setDielines((prev) =>
      prev.map((d) => (d.id === selectedItem.id ? { ...d, status: newStatus } : d))
    );
    setSelectedItem((prev) => (prev ? { ...prev, status: newStatus } : null));
    updateStudioDielineApi(selectedItem.id, { status: newStatus });
    showToast(`✓ Dieline ${selectedItem.dielineCode} updated to: ${newStatus}`);
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ["Dieline Code", "SR Number", "Format", "Title", "Client", "Dimensions", "Substrate", "Caliper (μm)", "Machine", "Status", "Plant"];
    const rows = filteredDielines.map((d) => [
      `"${d.dielineCode}"`,
      `"${d.srNumber}"`,
      `"${d.boxFormat}"`,
      `"${d.title}"`,
      `"${d.client}"`,
      `"${d.dimensions}"`,
      `"${d.substrate}"`,
      `"${d.caliperMicrons}"`,
      `"${d.machineCompatibility}"`,
      `"${d.status}"`,
      `"${d.targetPlant}"`,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = `navneet_studio_dielines_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    showToast(`Exported ${filteredDielines.length} structural dielines to CSV`);
  };

  // Table Columns
  const columns: ColumnDef<DielineItem>[] = useMemo(
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
              {selectedIds.size > 0 && selectedIds.size === filteredDielines.length ? (
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
        id: "dielineCode",
        header: "CAD Dieline Code",
        sortable: true,
        width: "w-[145px]",
        cell: (row) => (
          <div>
            <div className="flex items-center gap-1.5 font-mono text-[12px] font-semibold text-zinc-900 dark:text-zinc-100">
              <span>{row.dielineCode}</span>
              <button
                type="button"
                onClick={(e) => handleCopyCode(row.dielineCode, e)}
                className="p-0.5 rounded text-zinc-400 hover:text-brand-600 cursor-pointer"
              >
                {copiedCode === row.dielineCode ? (
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
        id: "boxFormat",
        header: "Box Geometry",
        width: "w-[140px]",
        cell: (row) => (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-200 dark:border-white/5 whitespace-nowrap">
            <Box className="w-3 h-3 text-brand-500 shrink-0" />
            {row.boxFormat}
          </span>
        ),
      },
      {
        id: "title",
        header: "Structural Specification",
        width: "min-w-[240px]",
        cell: (row) => (
          <div>
            <div className="font-medium text-zinc-900 dark:text-zinc-100 truncate max-w-[320px]">
              {row.title}
            </div>
            <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-sans mt-0.5">
              <span>Client: <strong className="font-semibold text-zinc-700 dark:text-zinc-300">{row.client}</strong></span>
              <span>·</span>
              <span className="font-mono text-zinc-600 dark:text-zinc-400">{row.substrate}</span>
            </div>
          </div>
        ),
      },
      {
        id: "dimensions",
        header: "Dimensions (L×W×H)",
        sortable: true,
        width: "w-[140px]",
        cell: (row) => (
          <span className="font-mono text-[12px] font-semibold text-zinc-800 dark:text-zinc-200 tnum">
            {row.dimensions}
          </span>
        ),
      },
      {
        id: "machineCompatibility",
        header: "Die-Cutter Route",
        width: "w-[170px]",
        cell: (row) => (
          <div className="flex flex-col gap-0.5 text-[11px]">
            <span className="font-medium text-zinc-800 dark:text-zinc-200 truncate">{row.machineCompatibility}</span>
            <span className="text-[10px] text-zinc-400 font-mono">{row.targetPlant}</span>
          </div>
        ),
      },
      {
        id: "status",
        header: "CAD Status",
        sortable: true,
        width: "w-[160px]",
        cell: (row) => <StatusPill status={row.status} size="xs" />,
      },
      {
        id: "dueDate",
        header: "SLA Date",
        sortable: true,
        width: "w-[105px]",
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
    [copiedCode, selectedIds, filteredDielines]
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
              placeholder="Search Dieline, Format, Machine… (Ctrl+K)"
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

          {/* Box Geometry Switcher */}
          <div className="inline-flex bg-zinc-100 dark:bg-zinc-800/80 p-0.5 rounded-md text-xs border border-zinc-200/60 dark:border-white/[0.05]">
            <button
              type="button"
              onClick={() => setSelectedFormat("all")}
              className={`h-8 px-3.5 rounded transition-colors text-xs font-medium cursor-pointer ${
                selectedFormat === "all"
                  ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-50 font-semibold shadow-xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              All Geometries
            </button>
            <button
              type="button"
              onClick={() => setSelectedFormat("Rigid Box")}
              className={`h-8 px-3.5 rounded transition-colors text-xs font-medium cursor-pointer ${
                selectedFormat === "Rigid Box"
                  ? "bg-white dark:bg-zinc-700 text-brand-700 dark:text-brand-300 font-semibold shadow-xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              Rigid Boxes
            </button>
            <button
              type="button"
              onClick={() => setSelectedFormat("Folding Carton")}
              className={`h-8 px-3.5 rounded transition-colors text-xs font-medium cursor-pointer ${
                selectedFormat === "Folding Carton"
                  ? "bg-white dark:bg-zinc-700 text-amber-700 dark:text-amber-300 font-semibold shadow-xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              Folding Cartons
            </button>
            <button
              type="button"
              onClick={() => setSelectedFormat("Flute Corrugated")}
              className={`h-8 px-3.5 rounded transition-colors text-xs font-medium cursor-pointer ${
                selectedFormat === "Flute Corrugated"
                  ? "bg-white dark:bg-zinc-700 text-emerald-700 dark:text-emerald-300 font-semibold shadow-xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              E-Flute
            </button>
          </div>

          {/* Plant Dropdown */}
          <select
            value={selectedPlant}
            onChange={(e) => setSelectedPlant(e.target.value)}
            className="h-9 px-3 rounded-md border border-zinc-200 dark:border-zinc-700/80 bg-zinc-50/60 dark:bg-zinc-900/60 text-xs text-zinc-700 dark:text-zinc-300 outline-none focus:border-brand-500 cursor-pointer max-w-[160px] truncate font-medium"
          >
            <option value="all">All Manufacturing Plants</option>
            {uniquePlants.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>

          {/* Reset */}
          {(searchTerm || selectedFormat !== "all" || selectedPlant !== "all" || selectedStageId !== "all" || quickFilter !== "none") && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                setSelectedFormat("all");
                setSelectedPlant("all");
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
        data={filteredDielines}
        columns={columns}
        keyExtractor={(row) => row.id}
        onRowClick={handleSelectRow}
        selectedRowId={selectedItem?.id}
        totalCount={filteredDielines.length}
        toolbarLeft={
          <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
            <span>
              Showing <span className="font-semibold text-zinc-900 dark:text-zinc-100 font-mono">{filteredDielines.length}</span> of{" "}
              <span className="font-semibold text-zinc-900 dark:text-zinc-100 font-mono">{dielines.length}</span> structural dielines
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
                  {selectedItem.dielineCode}
                </span>
                <span className="text-[11px] font-mono text-zinc-400">({selectedItem.boxFormat})</span>
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
                <span className="block text-[10px] uppercase font-bold text-zinc-400">Inner Dimensions</span>
                <span className="font-mono font-semibold text-zinc-900 dark:text-zinc-100 truncate block tabular-nums">
                  {selectedItem.dimensions}
                </span>
              </div>
              <div className="pl-3">
                <span className="block text-[10px] uppercase font-bold text-zinc-400">Die-Cut Machine</span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100 truncate block">
                  {selectedItem.machineCompatibility}
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
                onClick={() => setInspectorTab("cad")}
                className={`h-9 px-3.5 text-xs font-semibold border-b-2 cursor-pointer transition-colors ${
                  inspectorTab === "cad"
                    ? "border-brand-600 text-brand-600 dark:text-brand-400"
                    : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                }`}
              >
                CAD Blueprint Dieline
              </button>
              <button
                type="button"
                onClick={() => setInspectorTab("folding")}
                className={`h-9 px-3.5 text-xs font-semibold border-b-2 cursor-pointer transition-colors flex items-center gap-1.5 ${
                  inspectorTab === "folding"
                    ? "border-brand-600 text-brand-600 dark:text-brand-400"
                    : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                }`}
              >
                <Boxes className="w-3.5 h-3.5" />
                3D Fold & Fitment Sign-Off
              </button>
              <button
                type="button"
                onClick={() => setInspectorTab("files")}
                className={`h-9 px-3.5 text-xs font-semibold border-b-2 cursor-pointer transition-colors flex items-center gap-1.5 ${
                  inspectorTab === "files"
                    ? "border-brand-600 text-brand-600 dark:text-brand-400"
                    : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                }`}
              >
                <FileCode2 className="w-3.5 h-3.5" />
                CNC & Laser Die Exports
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
              {/* TAB 1: CAD BLUEPRINT VIEWER */}
              {inspectorTab === "cad" && (
                <div className="space-y-4">
                  {/* Interactive SVG CAD Dieline Blueprint Viewer */}
                  <div className="rounded-lg border border-zinc-200 dark:border-white/10 bg-[#090b14] p-4 flex flex-col items-center justify-center relative shadow-inner overflow-hidden">
                    <div className="w-full flex items-center justify-between pb-2 mb-2 border-b border-white/10 text-[10px] font-mono text-zinc-400">
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-brand-500" />
                        Solid Blue: Cut Line (Steel Rule 2pt)
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-500" />
                        Dashed Red: Crease / Fold Line
                      </span>
                    </div>

                    {/* SVG Vector Dieline Wireframe */}
                    <div className="w-full max-w-sm h-52 flex items-center justify-center">
                      <svg viewBox="0 0 400 280" className="w-full h-full stroke-[1.5] fill-none">
                        {/* Bleed Margin (Green dashed) */}
                        <rect x="20" y="20" width="360" height="240" stroke="#10b981" strokeDasharray="3 3" opacity="0.4" />
                        {/* Outer Cut Lines (Blue solid) */}
                        <path d="M 50,50 L 350,50 L 350,230 L 50,230 Z" stroke="#38bdf8" />
                        {/* Tuck flap left */}
                        <path d="M 50,80 L 30,95 L 30,145 L 50,160" stroke="#38bdf8" />
                        {/* Tuck flap right */}
                        <path d="M 350,80 L 370,95 L 370,145 L 350,160" stroke="#38bdf8" />
                        {/* Crease fold lines (Red dashed) */}
                        <line x1="120" y1="50" x2="120" y2="230" stroke="#f43f5e" strokeDasharray="4 3" />
                        <line x1="280" y1="50" x2="280" y2="230" stroke="#f43f5e" strokeDasharray="4 3" />
                        <line x1="50" y1="80" x2="350" y2="80" stroke="#f43f5e" strokeDasharray="4 3" />
                        <line x1="50" y1="200" x2="350" y2="200" stroke="#f43f5e" strokeDasharray="4 3" />
                        {/* Dimensions label in center */}
                        <text x="200" y="145" fill="#e4e4e7" fontSize="12" fontFamily="monospace" textAnchor="middle">
                          {selectedItem.dimensions}
                        </text>
                        <text x="200" y="165" fill="#a1a1aa" fontSize="9" fontFamily="monospace" textAnchor="middle">
                          Caliper: {selectedItem.caliperMicrons} μm
                        </text>
                      </svg>
                    </div>

                    <div className="w-full flex justify-between text-[10px] font-mono text-zinc-400 pt-2 border-t border-white/10 mt-2">
                      <span>Sheet Utilization: <strong>88.4%</strong></span>
                      <span>Grain: <strong className="text-emerald-400">{selectedItem.grainDirection}</strong></span>
                    </div>
                  </div>

                  {/* Machine Tooling Specifications */}
                  <div className="rounded-md border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-[#0f1118] p-4 space-y-3">
                    <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                      <Sliders className="w-4 h-4 text-brand-600" />
                      Die-Cutting Press & Stripping Setup:
                    </h4>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="p-2.5 rounded bg-zinc-50 dark:bg-[#161822] border border-zinc-200/60 dark:border-white/[0.08]">
                        <span className="block text-[10px] font-bold text-zinc-400 uppercase">Selected Die-Cutter</span>
                        <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                          {selectedItem.machineCompatibility}
                        </span>
                      </div>
                      <div className="p-2.5 rounded bg-zinc-50 dark:bg-[#161822] border border-zinc-200/60 dark:border-white/[0.08]">
                        <span className="block text-[10px] font-bold text-zinc-400 uppercase">Board Caliper</span>
                        <span className="font-mono font-semibold text-zinc-800 dark:text-zinc-200 tabular-nums">
                          {selectedItem.caliperMicrons} Microns ({selectedItem.substrate})
                        </span>
                      </div>
                      <div className="p-2.5 rounded bg-zinc-50 dark:bg-[#161822] border border-zinc-200/60 dark:border-white/[0.08]">
                        <span className="block text-[10px] font-bold text-zinc-400 uppercase">Crease Rule Specs</span>
                        <span className="font-mono font-semibold text-zinc-800 dark:text-zinc-200 tabular-nums">
                          23.80mm × 2pt Matrix Rule
                        </span>
                      </div>
                      <div className="p-2.5 rounded bg-zinc-50 dark:bg-[#161822] border border-zinc-200/60 dark:border-white/[0.08]">
                        <span className="block text-[10px] font-bold text-zinc-400 uppercase">Manufacturing Unit</span>
                        <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                          {selectedItem.targetPlant}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: 3D FOLD & FITMENT SIGN-OFF */}
              {inspectorTab === "folding" && (
                <div className="space-y-4">
                  <div className="rounded-md border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-[#0f1118] p-4 space-y-3.5 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                        <Boxes className="w-4 h-4 text-brand-600" />
                        CAD Structural Validation Verdict:
                      </span>
                      <span className="font-mono text-[10px] text-zinc-400">Current Status: {selectedItem.status}</span>
                    </div>

                    <div className="divide-y divide-zinc-100 dark:divide-white/5 font-mono text-[11px]">
                      <div className="py-2 flex justify-between">
                        <span className="text-zinc-500">90° Corner Locking Test:</span>
                        <span className="font-semibold text-emerald-600">✓ No Overlap Collision</span>
                      </div>
                      <div className="py-2 flex justify-between">
                        <span className="text-zinc-500">Tuck-Flap Resistance:</span>
                        <span className="font-semibold text-emerald-600">✓ 1.2N Smooth Insertion Force</span>
                      </div>
                      <div className="py-2 flex justify-between">
                        <span className="text-zinc-500">Inner Product Fitment Clearance:</span>
                        <span className="font-semibold text-emerald-600">✓ +1.5mm Tolerance Maintained</span>
                      </div>
                      <div className="py-2 flex justify-between">
                        <span className="text-zinc-500">Auto Folder-Gluer Speed Test:</span>
                        <span className="font-semibold text-zinc-800 dark:text-zinc-200">Rated for 35,000 pcs/hr</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5 pt-2">
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus("Laser Die Cleared")}
                        className="h-10 px-4 rounded-md bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-[13px] flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-colors"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Clear for Laser Die Shop</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleUpdateStatus("3D Simulation")}
                        className="h-10 px-4 rounded-md border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 hover:bg-amber-100 font-bold text-[13px] flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-colors"
                      >
                        <AlertTriangle className="w-4 h-4" />
                        <span>Request Fitment Tweak</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: CNC & LASER DIE EXPORTS */}
              {inspectorTab === "files" && (
                <div className="space-y-4">
                  <div className="rounded-md border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-[#0f1118] p-4 space-y-3">
                    <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                      <Download className="w-4 h-4 text-brand-600" />
                      Download Production CAD Dieline Files:
                    </h4>

                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => showToast(`Downloaded AutoCAD ${selectedItem.dielineCode}.dxf`)}
                        className="w-full p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-left hover:border-brand-500 hover:bg-brand-50/20 transition-all cursor-pointer flex items-center justify-between"
                      >
                        <div>
                          <span className="block font-bold text-xs text-zinc-800 dark:text-zinc-200">
                            {selectedItem.dielineCode}_Kongsberg_Cutting.dxf
                          </span>
                          <span className="text-[10px] text-zinc-400">Standard 2D Vector CAD Dieline with Layers · 2.4 MB</span>
                        </div>
                        <Download className="w-4 h-4 text-zinc-400" />
                      </button>

                      <button
                        type="button"
                        onClick={() => showToast(`Downloaded ArtiosCAD ${selectedItem.dielineCode}.ard`)}
                        className="w-full p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-left hover:border-brand-500 hover:bg-brand-50/20 transition-all cursor-pointer flex items-center justify-between"
                      >
                        <div>
                          <span className="block font-bold text-xs text-zinc-800 dark:text-zinc-200">
                            {selectedItem.dielineCode}_Parametric_Structural.ard
                          </span>
                          <span className="text-[10px] text-zinc-400">Esko ArtiosCAD 3D Parametric Folding Model · 4.8 MB</span>
                        </div>
                        <Download className="w-4 h-4 text-zinc-400" />
                      </button>

                      <button
                        type="button"
                        onClick={() => showToast(`Downloaded Laser Die ${selectedItem.dielineCode}.cf2`)}
                        className="w-full p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-left hover:border-brand-500 hover:bg-brand-50/20 transition-all cursor-pointer flex items-center justify-between"
                      >
                        <div>
                          <span className="block font-bold text-xs text-zinc-800 dark:text-zinc-200">
                            {selectedItem.dielineCode}_Laser_Board_Machining.cf2
                          </span>
                          <span className="text-[10px] text-zinc-400">CFF2 Production format for Plant Laser Die Shop · 1.6 MB</span>
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
                <span>Dieline: {selectedItem.dielineCode}</span>
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

export default StudioWorkDesk;
