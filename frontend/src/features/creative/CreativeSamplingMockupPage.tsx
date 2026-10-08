import React, { useState, useMemo } from "react";
import {
  Box,
  Search,
  RefreshCw,
  Download,
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Layers,
  Building2,
} from "lucide-react";
import { SampleRequestItem } from "@/features/sample-requests/types";
import { StatusPill } from "@/components/ui/StatusPill";
import { CopyBadge } from "@/components/ui/CopyBadge";
import { exportRecordsToCsv } from "@/lib/csvExport";

export interface CreativeSamplingMockupPageProps {
  requests: SampleRequestItem[];
  selectedYear: string;
  selectedPlant: string;
  onInspectRequest: (req: SampleRequestItem) => void;
  onExportCSV?: () => void;
  onRefresh?: () => Promise<void>;
}

export const CreativeSamplingMockupPage: React.FC<CreativeSamplingMockupPageProps> = ({
  requests,
  selectedYear,
  selectedPlant,
  onInspectRequest,
  onExportCSV,
  onRefresh,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [scopeFilter, setScopeFilter] = useState<"all" | "both" | "mockup_only" | "sample_only">("all");
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
    if (selectedIds.size === paginatedItems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedItems.map((r) => r.id)));
    }
  };

  // Filter requests that have sample or mockup scopes
  const samplingMockupItems = useMemo(() => {
    return requests.filter((r) => {
      const srCode = String(r.srNumber || "").toUpperCase();
      const materialCode = String(r.materialCode || "").toUpperCase();
      if (
        r.requestKind === "program" ||
        r.creationMode === "program_planning" ||
        srCode.includes("-PG-") ||
        srCode.startsWith("PG-") ||
        materialCode.startsWith("PG-")
      ) {
        return false;
      }
      const scopes = r.requestTypes || [];
      const hasMockup = scopes.includes("mockup") || r.mockupRequired === "Yes";
      const hasSample = scopes.includes("sample");
      return hasMockup || hasSample;
    });
  }, [requests]);

  // Telemetry metrics
  const totalCombined = samplingMockupItems.length;
  const mockupCount = useMemo(
    () =>
      samplingMockupItems.filter(
        (r) => (r.requestTypes || []).includes("mockup") || r.mockupRequired === "Yes"
      ).length,
    [samplingMockupItems]
  );
  const sampleCount = useMemo(
    () => samplingMockupItems.filter((r) => (r.requestTypes || []).includes("sample")).length,
    [samplingMockupItems]
  );
  const bothCount = useMemo(
    () =>
      samplingMockupItems.filter((r) => {
        const scopes = r.requestTypes || [];
        return (scopes.includes("mockup") || r.mockupRequired === "Yes") && scopes.includes("sample");
      }).length,
    [samplingMockupItems]
  );

  // Scope filter tabs
  const scopeTabs: { id: "all" | "both" | "mockup_only" | "sample_only"; label: string; count: number }[] = useMemo(
    () => [
      { id: "all", label: "All Deliverables", count: totalCombined },
      { id: "both", label: "Sample + Mockup Both", count: bothCount },
      { id: "mockup_only", label: "CAD Mockups", count: mockupCount },
      { id: "sample_only", label: "Physical Samples", count: sampleCount },
    ],
    [totalCombined, bothCount, mockupCount, sampleCount]
  );

  // Unique plants for dropdown
  const uniquePlants = useMemo(() => {
    const set = new Set<string>();
    samplingMockupItems.forEach((r) => {
      if (r.targetPlant?.trim()) set.add(r.targetPlant.trim());
    });
    return Array.from(set).sort();
  }, [samplingMockupItems]);

  // Filtered requests
  const filteredItems = useMemo(() => {
    return samplingMockupItems.filter((r) => {
      const scopes = r.requestTypes || [];
      const hasMockup = scopes.includes("mockup") || r.mockupRequired === "Yes";
      const hasSample = scopes.includes("sample");

      // Scope filter
      if (scopeFilter === "both" && !(hasMockup && hasSample)) return false;
      if (scopeFilter === "mockup_only" && !hasMockup) return false;
      if (scopeFilter === "sample_only" && !hasSample) return false;

      // Plant filter
      if (plantFilter !== "all" && (r.targetPlant || "").trim() !== plantFilter) return false;

      // Search filter
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        return (
          (r.srNumber || "").toLowerCase().includes(q) ||
          (r.productDescription || "").toLowerCase().includes(q) ||
          (r.customer || "").toLowerCase().includes(q) ||
          (r.targetPlant || "").toLowerCase().includes(q)
        );
      }

      return true;
    });
  }, [samplingMockupItems, scopeFilter, plantFilter, searchTerm]);

  // Paginated items
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, currentPage, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));

  const handleExportClick = () => {
    if (onExportCSV) {
      onExportCSV();
      return;
    }
    const dateStr = new Date().toISOString().split("T")[0];
    exportRecordsToCsv({
      filename: `sampling_mockup_queue_${dateStr}.csv`,
      columns: [
        { header: "SR Code", accessor: (r) => r.srNumber || r.id },
        { header: "Sample Description", accessor: (r) => r.productDescription },
        { header: "Customer", accessor: (r) => r.customer },
        { header: "Scopes", accessor: (r) => (r.requestTypes || []).join("+") },
        { header: "Mockup Required", accessor: (r) => r.mockupRequired || "No" },
        { header: "Quantity", accessor: (r) => (r as any).quantity || r.qtyForSampling || 1 },
        { header: "Plant", accessor: (r) => r.targetPlant },
        { header: "Due Date", accessor: (r) => r.sampleRequiredDate },
        { header: "Status", accessor: (r) => r.status },
      ],
      data: filteredItems,
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

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-[#0c0d14] text-slate-800 dark:text-zinc-100 select-text overflow-hidden">
      {/* ── 1. Compact Editorial Header (Maximized Space for Requests) ── */}
      <header className="bg-white dark:bg-[#121622] px-6 py-3 shrink-0 border-b border-slate-200/60 dark:border-white/[0.06] shadow-[0_1px_4px_rgba(11,28,48,0.02)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-zinc-100 font-display">
              Sampling &amp; CAD Mockup Unified Operations Desk
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold font-mono bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-zinc-400">
              {samplingMockupItems.length} Deliverables
            </span>
            {mockupCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold font-mono bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40 animate-pulse">
                ⚡ {mockupCount} CAD Simulations Active
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
              disabled={filteredItems.length === 0}
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
          {scopeTabs.map((t) => {
            const isActive = scopeFilter === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setScopeFilter(t.id);
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
          {uniquePlants.length > 0 && (
            <select
              value={plantFilter}
              onChange={(e) => {
                setPlantFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="h-9 px-3 rounded-lg bg-slate-100/80 hover:bg-slate-200/60 dark:bg-white/[0.06] dark:hover:bg-white/[0.08] text-xs font-medium text-slate-700 dark:text-zinc-200 border border-slate-200/70 dark:border-white/[0.08] focus:outline-none focus:ring-2 focus:ring-[#006d32]/15 focus:border-[#006d32]/40 cursor-pointer transition"
            >
              <option value="all" className="dark:bg-[#121622] dark:text-zinc-200">All Manufacturing Plants</option>
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
              placeholder="Search SR, product, customer..."
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
                    paginatedItems.length > 0 &&
                    paginatedItems.every((r) => selectedIds.has(r.id))
                  }
                  onChange={handleToggleSelectAll}
                  className="rounded text-[#006d32] focus:ring-[#006d32] cursor-pointer"
                />
              </th>
              <th className="py-3 px-4 font-semibold whitespace-nowrap">SR Code</th>
              <th className="py-3 px-4 font-semibold">Sample Description</th>
              <th className="py-3 px-4 font-semibold whitespace-nowrap">Customer / Brand</th>
              <th className="py-3 px-4 font-semibold whitespace-nowrap">Deliverable Scopes</th>
              <th className="py-3 px-4 font-semibold text-center whitespace-nowrap">Mockup / Qty</th>
              <th className="py-3 px-4 font-semibold whitespace-nowrap">Plant</th>
              <th className="py-3 px-4 font-semibold whitespace-nowrap">Required Date</th>
              <th className="py-3 px-4 font-semibold whitespace-nowrap">Status</th>
              <th className="py-3 pl-4 pr-6 font-semibold text-right whitespace-nowrap">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-16 text-center">
                  <div className="max-w-sm mx-auto flex flex-col items-center">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/[0.06] text-slate-400 dark:text-zinc-500 flex items-center justify-center mb-3">
                      <Box className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-200">No Sampling Deliverables Found</h3>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                      {searchTerm || plantFilter !== "all" || scopeFilter !== "all"
                        ? "No sample or mockup requests match your search or active filter."
                        : "There are currently no sampling or mockup requests in the queue."}
                    </p>
                    {(searchTerm || plantFilter !== "all" || scopeFilter !== "all") && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchTerm("");
                          setPlantFilter("all");
                          setScopeFilter("all");
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
              paginatedItems.map((r) => {
                const scopes = r.requestTypes || [];
                const hasMockup = scopes.includes("mockup") || r.mockupRequired === "Yes";
                const hasSample = scopes.includes("sample");
                const hasDesign = scopes.includes("design");
                const qty = (r as any).quantity || r.qtyForSampling || 1;
                const isSelected = selectedIds.has(r.id);

                return (
                  <tr
                    key={r.id}
                    onClick={() => onInspectRequest(r)}
                    className={`hover:bg-slate-50/80 dark:hover:bg-white/[0.03] transition-colors cursor-pointer group ${
                      isSelected ? "bg-emerald-50/40 dark:bg-emerald-950/20" : ""
                    }`}
                  >
                    <td
                      className="py-3.5 pl-6 pr-3 w-8"
                      onClick={(e) => handleToggleSelectRow(r.id, e)}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="rounded text-[#006d32] focus:ring-[#006d32] cursor-pointer"
                      />
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold whitespace-nowrap">
                      <CopyBadge text={r.srNumber || `SR-${r.id}`} />
                    </td>
                    <td className="py-3.5 px-4 text-slate-900 dark:text-zinc-100 font-medium max-w-xs">
                      <span className="line-clamp-1">
                        {r.productDescription || (r as any).opportunityName || "Commercial Sample Dummy"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-zinc-100 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[180px]" title={r.customer || ""}>
                          {r.customer || "—"}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {hasDesign && (
                          <span className="px-2 py-0.5 rounded-full text-[10.5px] font-mono font-bold bg-emerald-50 dark:bg-emerald-950/40 text-[#006d32] dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/40">
                            🎨 Design
                          </span>
                        )}
                        {hasMockup && (
                          <span className="px-2 py-0.5 rounded-full text-[10.5px] font-mono font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/80 dark:border-amber-800/40">
                            📦 Mockup
                          </span>
                        )}
                        {hasSample && (
                          <span className="px-2 py-0.5 rounded-full text-[10.5px] font-mono font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/40">
                            🏭 Sample
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono">
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-white/[0.06] text-[11px] font-semibold text-slate-700 dark:text-zinc-300">
                        {hasMockup ? "CAD + " : ""}{qty} units
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-zinc-400 whitespace-nowrap">
                      {r.targetPlant || "Khaniwade"}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-zinc-400 whitespace-nowrap">
                      {r.sampleRequiredDate || "Standard SLA"}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <StatusPill status={r.status || "Creative"} size="sm" />
                    </td>
                    <td className="py-3.5 pl-4 pr-6 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onInspectRequest(r);
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
          Showing {filteredItems.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
          {filteredItems.length > 0 && <> – {Math.min(filteredItems.length, currentPage * pageSize)}</>} of {filteredItems.length} deliverables
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

export default CreativeSamplingMockupPage;
