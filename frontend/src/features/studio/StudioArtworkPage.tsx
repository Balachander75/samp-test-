import React, { useState, useMemo } from "react";
import {
  FileCode2,
  Search,
  RefreshCw,
  Download,
  X,
  ChevronLeft,
  ChevronRight,
  Box,
  Scissors,
  Layers,
  Sparkles,
  Building2,
} from "lucide-react";
import { StatusPill } from "@/components/ui/StatusPill";
import { CopyBadge } from "@/components/ui/CopyBadge";
import { exportRecordsToCsv } from "@/lib/csvExport";
import { DielineItem } from "./types";

export interface StudioArtworkPageProps {
  dielines: DielineItem[];
  selectedYear: string;
  selectedPlant: string;
  mode?: "all" | "mockup" | "sampling";
  onInspectDieline: (dieline: DielineItem) => void;
  onExportCSV?: () => void;
  onRefresh?: () => Promise<void>;
}

export const StudioArtworkPage: React.FC<StudioArtworkPageProps> = ({
  dielines,
  selectedYear,
  selectedPlant,
  mode = "all",
  onInspectDieline,
  onExportCSV,
  onRefresh,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStage, setSelectedStage] = useState<string>("all");
  const [formatFilter, setFormatFilter] = useState<string>("all");
  const [plantFilter, setPlantFilter] = useState<string>("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 40;

  const handleToggleSelectRow = (id: string | number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.size === paginatedDielines.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedDielines.map((d) => d.id)));
    }
  };

  // Base dielines matching current mode
  const baseDielines = useMemo(() => {
    return dielines;
  }, [dielines]);

  // Stage filters matching current mode
  const stages = useMemo(() => {
    if (mode === "mockup") {
      return [
        { id: "all", label: "All Mockups", count: baseDielines.length },
        {
          id: "intake",
          label: "CAD Intake",
          count: baseDielines.filter((d) => d.status === "CAD Intake").length,
        },
        {
          id: "construction",
          label: "Dieline Construction",
          count: baseDielines.filter((d) => d.status === "Dieline Construction").length,
        },
        {
          id: "simulation",
          label: "3D Fold Simulation",
          count: baseDielines.filter((d) => d.status === "3D Simulation").length,
        },
        {
          id: "plotter",
          label: "Plotter Sample Tested",
          count: baseDielines.filter((d) => d.status === "Plotter Sample Tested").length,
        },
      ];
    }

    if (mode === "sampling") {
      return [
        { id: "all", label: "All Sampling CADs", count: baseDielines.length },
        {
          id: "plotter",
          label: "Plotter Cut Verified",
          count: baseDielines.filter((d) => d.status === "Plotter Sample Tested").length,
        },
        {
          id: "cleared",
          label: "Laser Die Cleared",
          count: baseDielines.filter((d) => d.status === "Laser Die Cleared").length,
        },
        {
          id: "construction",
          label: "CAD Engineering",
          count: baseDielines.filter((d) => d.status === "Dieline Construction").length,
        },
      ];
    }

    return [
      { id: "all", label: "All Dielines", count: baseDielines.length },
      {
        id: "intake",
        label: "CAD Intake",
        count: baseDielines.filter((d) => d.status === "CAD Intake").length,
      },
      {
        id: "construction",
        label: "Dieline Construction",
        count: baseDielines.filter((d) => d.status === "Dieline Construction").length,
      },
      {
        id: "simulation",
        label: "3D Fold Simulation",
        count: baseDielines.filter((d) => d.status === "3D Simulation").length,
      },
      {
        id: "plotter",
        label: "Plotter Tested",
        count: baseDielines.filter((d) => d.status === "Plotter Sample Tested").length,
      },
      {
        id: "cleared",
        label: "Laser Cleared",
        count: baseDielines.filter((d) => d.status === "Laser Die Cleared").length,
      },
    ];
  }, [baseDielines, mode]);

  // Unique formats for dropdown
  const uniqueFormats = useMemo(() => {
    const set = new Set<string>();
    baseDielines.forEach((d) => {
      if (d.boxFormat) set.add(d.boxFormat);
    });
    return Array.from(set).sort();
  }, [baseDielines]);

  // Unique plants for dropdown
  const uniquePlants = useMemo(() => {
    const set = new Set<string>();
    baseDielines.forEach((d) => {
      if (d.targetPlant) set.add(d.targetPlant);
    });
    return Array.from(set).sort();
  }, [baseDielines]);

  // Filtered dielines
  const filteredDielines = useMemo(() => {
    return baseDielines.filter((d) => {
      // Stage filter
      if (selectedStage !== "all") {
        if (selectedStage === "intake" && d.status !== "CAD Intake") return false;
        if (selectedStage === "construction" && d.status !== "Dieline Construction") return false;
        if (selectedStage === "simulation" && d.status !== "3D Simulation") return false;
        if (selectedStage === "plotter" && d.status !== "Plotter Sample Tested") return false;
        if (selectedStage === "cleared" && d.status !== "Laser Die Cleared") return false;
      }

      // Format filter
      if (formatFilter !== "all" && d.boxFormat !== formatFilter) return false;

      // Plant filter
      if (plantFilter !== "all" && d.targetPlant !== plantFilter) return false;

      // Search
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        return (
          d.dielineCode.toLowerCase().includes(q) ||
          d.title.toLowerCase().includes(q) ||
          d.client.toLowerCase().includes(q) ||
          d.dimensions.toLowerCase().includes(q) ||
          d.targetPlant.toLowerCase().includes(q) ||
          d.boxFormat.toLowerCase().includes(q)
        );
      }

      return true;
    });
  }, [baseDielines, selectedStage, formatFilter, plantFilter, searchTerm]);

  // Paginated items
  const paginatedDielines = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredDielines.slice(start, start + pageSize);
  }, [filteredDielines, currentPage, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredDielines.length / pageSize));

  const handleExportClick = () => {
    if (onExportCSV) {
      onExportCSV();
      return;
    }
    const dateStr = new Date().toISOString().split("T")[0];
    exportRecordsToCsv({
      filename: `studio_${mode}_dielines_${dateStr}.csv`,
      columns: [
        { header: "Dieline Code", accessor: (d) => d.dielineCode },
        { header: "Title", accessor: (d) => d.title },
        { header: "Client", accessor: (d) => d.client },
        { header: "Box Format", accessor: (d) => d.boxFormat },
        { header: "Dimensions", accessor: (d) => d.dimensions },
        { header: "Substrate", accessor: (d) => d.substrate },
        { header: "Caliper Microns", accessor: (d) => d.caliperMicrons },
        { header: "Machine", accessor: (d) => d.machineCompatibility },
        { header: "Status", accessor: (d) => d.status },
        { header: "Due Date", accessor: (d) => d.dueDate },
        { header: "Plant", accessor: (d) => d.targetPlant },
      ],
      data: filteredDielines,
    });
  };

  const handleRefreshClick = async () => {
    if (onRefresh) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }
  };

  const deskTitle =
    mode === "mockup"
      ? "CAD Mockup & 3D Simulation Workbench"
      : mode === "sampling"
      ? "Sampling Tooling & Laser Clearance Workbench"
      : "Artwork & Structural Dieline Engineering Workbench";

  const alertCount =
    mode === "mockup"
      ? baseDielines.filter((d) => d.status === "3D Simulation").length
      : mode === "sampling"
      ? baseDielines.filter((d) => d.status === "Laser Die Cleared").length
      : baseDielines.filter((d) => d.status === "Plotter Sample Tested").length;

  const alertLabel =
    mode === "mockup"
      ? `${alertCount} Simulations In Progress`
      : mode === "sampling"
      ? `${alertCount} Tooling Cleared`
      : `${alertCount} Plotter Tested`;

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-[#0c0d14] text-slate-800 dark:text-zinc-100 select-text overflow-hidden">
      {/* ── 1. Compact Editorial Header (Maximized Space for Records) ── */}
      <header className="bg-white dark:bg-[#121622] px-6 py-3 shrink-0 border-b border-slate-200/60 dark:border-white/[0.06] shadow-[0_1px_4px_rgba(11,28,48,0.02)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-zinc-100 font-display">
              {deskTitle}
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold font-mono bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-zinc-400">
              {baseDielines.length} {mode === "mockup" ? "Mockups" : mode === "sampling" ? "Tooling Specs" : "Dielines"}
            </span>
            {alertCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold font-mono bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40 animate-pulse">
                ⚡ {alertLabel}
              </span>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleRefreshClick}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] text-xs font-semibold text-slate-700 dark:text-zinc-300 transition cursor-pointer disabled:opacity-50"
              title="Refresh Records"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-[#006d32]" : "text-slate-500 dark:text-zinc-400"}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              type="button"
              onClick={handleExportClick}
              disabled={filteredDielines.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] text-xs font-semibold text-slate-700 dark:text-zinc-300 transition cursor-pointer disabled:opacity-50"
              title="Export Filtered CSV"
            >
              <Download className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />
              <span className="hidden sm:inline">Export</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── 2. Floating Filter & Search Strip ── */}
      <div className="px-6 py-2 bg-white dark:bg-[#0c0d14] shrink-0 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/50 dark:border-white/[0.06]">
        {/* Soft Segmented Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 select-none">
          {stages.map((t) => {
            const isActive = selectedStage === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setSelectedStage(t.id);
                  setCurrentPage(1);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer ${
                  isActive
                    ? "bg-[#006d32] text-white shadow-[0_2px_8px_rgba(0,109,50,0.25)]"
                    : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-100/80 dark:hover:bg-white/[0.06] bg-transparent"
                }`}
              >
                <span>{t.label}</span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full tabular-nums ${
                    isActive ? "bg-white/25 text-white" : "bg-slate-200/70 dark:bg-white/[0.08] text-slate-600 dark:text-zinc-400"
                  }`}
                >
                  {t.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right Search & Filter Dropdowns */}
        <div className="flex items-center gap-2 flex-1 sm:flex-initial justify-end">
          {uniqueFormats.length > 0 && (
            <select
              value={formatFilter}
              onChange={(e) => {
                setFormatFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="h-9 px-3 rounded-lg bg-slate-100/80 hover:bg-slate-200/60 dark:bg-white/[0.06] dark:hover:bg-white/[0.08] text-xs font-medium text-slate-700 dark:text-zinc-200 border border-slate-200/70 dark:border-white/[0.08] focus:outline-none focus:ring-2 focus:ring-[#006d32]/15 focus:border-[#006d32]/40 cursor-pointer transition"
            >
              <option value="all" className="dark:bg-[#121622] dark:text-zinc-200">All Box Formats</option>
              {uniqueFormats.map((f) => (
                <option key={f} value={f} className="dark:bg-[#121622] dark:text-zinc-200">
                  {f}
                </option>
              ))}
            </select>
          )}

          {uniquePlants.length > 0 && (
            <select
              value={plantFilter}
              onChange={(e) => {
                setPlantFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="h-9 px-3 rounded-lg bg-slate-100/80 hover:bg-slate-200/60 dark:bg-white/[0.06] dark:hover:bg-white/[0.08] text-xs font-medium text-slate-700 dark:text-zinc-200 border border-slate-200/70 dark:border-white/[0.08] focus:outline-none focus:ring-2 focus:ring-[#006d32]/15 focus:border-[#006d32]/40 cursor-pointer transition"
            >
              <option value="all" className="dark:bg-[#121622] dark:text-zinc-200">All Plants</option>
              {uniquePlants.map((p) => (
                <option key={p} value={p} className="dark:bg-[#121622] dark:text-zinc-200">
                  {p}
                </option>
              ))}
            </select>
          )}

          <div className="relative w-60 sm:w-72 group">
            <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 group-focus-within:text-[#006d32] transition-colors pointer-events-none" />
            <input
              type="text"
              placeholder="Search code, client, box format..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-9 pl-[34px] pr-8 rounded-lg bg-slate-100/80 hover:bg-slate-200/50 dark:bg-white/[0.06] dark:hover:bg-white/[0.08] focus:bg-white dark:focus:bg-[#121622] text-xs text-slate-800 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 border border-slate-200/70 dark:border-white/[0.08] focus:border-[#006d32]/40 focus:outline-none focus:ring-2 focus:ring-[#006d32]/15 shadow-2xs transition-all"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setCurrentPage(1);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-4.5 h-4.5 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-200/80 dark:hover:bg-white/[0.1] transition-colors cursor-pointer"
                title="Clear search"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── 3. Full-Bleed Table Workspace ── */}
      <div className="flex-1 min-h-0 overflow-auto bg-white dark:bg-[#0c0d14] flex flex-col">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-[#121622] border-b border-slate-200/70 dark:border-white/[0.08]">
            <tr className="text-slate-600 dark:text-zinc-400 font-mono text-[11px] uppercase tracking-wider select-none">
              <th className="py-3 pl-6 pr-3 w-8">
                <input
                  type="checkbox"
                  checked={
                    paginatedDielines.length > 0 &&
                    paginatedDielines.every((d) => selectedIds.has(d.id))
                  }
                  onChange={handleToggleSelectAll}
                  className="rounded text-[#006d32] focus:ring-[#006d32] cursor-pointer"
                />
              </th>
              <th className="py-3 px-4 font-semibold whitespace-nowrap">Dieline Code</th>
              <th className="py-3 px-4 font-semibold">Structural Design Title</th>
              <th className="py-3 px-4 font-semibold whitespace-nowrap">Client / Brand</th>
              <th className="py-3 px-4 font-semibold whitespace-nowrap">Packaging Format</th>
              <th className="py-3 px-4 font-semibold whitespace-nowrap">Dimensions (L×W×D)</th>
              <th className="py-3 px-4 font-semibold whitespace-nowrap">Substrate &amp; Caliper</th>
              <th className="py-3 px-4 font-semibold whitespace-nowrap">Machine Profile</th>
              <th className="py-3 px-4 font-semibold whitespace-nowrap">Plant</th>
              <th className="py-3 px-4 font-semibold whitespace-nowrap">Status</th>
              <th className="py-3 pl-4 pr-6 font-semibold text-right whitespace-nowrap">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
            {filteredDielines.length === 0 ? (
              <tr>
                <td colSpan={11} className="py-16 text-center">
                  <div className="max-w-sm mx-auto flex flex-col items-center">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/[0.06] text-slate-400 dark:text-zinc-500 flex items-center justify-center mb-3">
                      {mode === "mockup" ? (
                        <Box className="w-6 h-6" />
                      ) : mode === "sampling" ? (
                        <Scissors className="w-6 h-6" />
                      ) : (
                        <FileCode2 className="w-6 h-6" />
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-200">
                      No {mode === "mockup" ? "Mockup" : mode === "sampling" ? "Tooling Spec" : "Structural"} Dielines Found
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                      {searchTerm || formatFilter !== "all" || plantFilter !== "all" || selectedStage !== "all"
                        ? "No dielines match your search or active filter."
                        : "There are currently no structural dielines registered."}
                    </p>
                    {(searchTerm || formatFilter !== "all" || plantFilter !== "all" || selectedStage !== "all") && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchTerm("");
                          setFormatFilter("all");
                          setPlantFilter("all");
                          setSelectedStage("all");
                          setCurrentPage(1);
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
              paginatedDielines.map((d) => {
                const isSelected = selectedIds.has(d.id);

                return (
                  <tr
                    key={d.id}
                    onClick={() => onInspectDieline(d)}
                    className={`hover:bg-slate-50/80 dark:hover:bg-white/[0.03] transition-colors cursor-pointer group ${
                      isSelected ? "bg-emerald-50/40 dark:bg-emerald-950/20" : ""
                    }`}
                  >
                    <td
                      className="py-3.5 pl-6 pr-3 w-8"
                      onClick={(e) => handleToggleSelectRow(d.id, e)}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="rounded text-[#006d32] focus:ring-[#006d32] cursor-pointer"
                      />
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold whitespace-nowrap">
                      <CopyBadge text={d.dielineCode} />
                    </td>
                    <td className="py-3.5 px-4 text-slate-900 dark:text-zinc-100 font-medium max-w-xs">
                      <span className="line-clamp-1">{d.title}</span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-zinc-100 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[180px]" title={d.client}>
                          {d.client}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap font-mono">
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-white/[0.06] text-[10.5px] font-semibold text-slate-700 dark:text-zinc-300">
                        {d.boxFormat}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600 dark:text-zinc-400 whitespace-nowrap">
                      {d.dimensions}
                    </td>
                    <td className="py-3.5 px-4 text-[11px] text-slate-500 dark:text-zinc-400 whitespace-nowrap">
                      <span className="font-medium text-slate-700 dark:text-zinc-300">{d.substrate}</span>
                      <span className="ml-1 font-mono text-slate-400 dark:text-zinc-500">({d.caliperMicrons}µm)</span>
                    </td>
                    <td className="py-3.5 px-4 text-[11px] text-slate-500 dark:text-zinc-400 whitespace-nowrap">
                      {d.machineCompatibility}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-zinc-400 whitespace-nowrap">
                      {d.targetPlant}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <StatusPill status={d.status} size="sm" />
                    </td>
                    <td className="py-3.5 pl-4 pr-6 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onInspectDieline(d);
                        }}
                        className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] text-slate-700 dark:text-zinc-300 text-xs font-medium font-mono transition cursor-pointer"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── 4. Compact Footer / Status Strip ── */}
      <footer className="mt-auto px-6 py-2.5 bg-white dark:bg-[#121622] border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400 font-mono shrink-0">
        <span>
          Showing {filteredDielines.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
          {filteredDielines.length > 0 && <> – {Math.min(filteredDielines.length, currentPage * pageSize)}</>} of {filteredDielines.length} specifications
        </span>
        <div className="flex items-center gap-4">
          <span className="hidden sm:flex items-center gap-1.5 text-slate-400 dark:text-zinc-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Sorted by Latest Raised Intake
          </span>
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1 rounded-md border border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-white/[0.06] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 font-mono text-slate-600 dark:text-zinc-400">
                {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1 rounded-md border border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-white/[0.06] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </footer>
    </div>
  );
};

export default StudioArtworkPage;
