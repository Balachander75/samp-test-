import React, { useMemo, useState } from "react";
import {
  Box,
  Layers,
  Sparkles,
  CheckCircle2,
  Clock,
  ArrowRight,
  Search,
  ChevronRight,
  TrendingUp,
  FileCode2,
  Download,
  Scissors,
  X,
} from "lucide-react";
import { DielineItem } from "@/features/sample-requests/types";
import { StatusPill } from "@/components/ui/StatusPill";
import { CopyBadge } from "@/components/ui/CopyBadge";
import { exportRecordsToCsv } from "@/lib/csvExport";

export interface StudioOverviewPageProps {
  dielines: DielineItem[];
  isLoading: boolean;
  selectedYear: string;
  selectedPlant: string;
  onNavigateToMockup: () => void;
  onNavigateToSampling: () => void;
  onInspectDieline: (dieline: DielineItem) => void;
}

export const StudioOverviewPage: React.FC<StudioOverviewPageProps> = ({
  dielines,
  isLoading,
  selectedYear,
  selectedPlant,
  onNavigateToMockup,
  onNavigateToSampling,
  onInspectDieline,
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  const totalDielines = dielines.length;
  const inSimulation = dielines.filter((d) => d.status === "3D Simulation").length;
  const inPlotter = dielines.filter((d) => d.status === "Plotter Sample Tested").length;
  const clearedCount = dielines.filter((d) => d.status === "Laser Die Cleared").length;

  // Format distribution
  const formatCounts = useMemo(() => {
    return {
      rigid: dielines.filter((d) => d.boxFormat === "Rigid Box").length,
      folding: dielines.filter((d) => d.boxFormat === "Folding Carton").length,
      flute: dielines.filter((d) => d.boxFormat === "Flute Corrugated").length,
      blister: dielines.filter((d) => d.boxFormat === "Blister / Sleeve").length,
    };
  }, [dielines]);

  // Recent dielines
  const filteredDielines = useMemo(() => {
    let items = [...dielines];
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      items = items.filter(
        (d) =>
          d.dielineCode.toLowerCase().includes(q) ||
          d.title.toLowerCase().includes(q) ||
          d.client.toLowerCase().includes(q) ||
          d.targetPlant.toLowerCase().includes(q) ||
          d.boxFormat.toLowerCase().includes(q)
      );
    }
    return items;
  }, [dielines, searchTerm]);

  const handleExportCSV = () => {
    const dateStr = new Date().toISOString().split("T")[0];
    exportRecordsToCsv({
      filename: `studio_engineering_overview_${dateStr}.csv`,
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

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-[#0c0d14] text-slate-800 dark:text-zinc-100 select-text overflow-hidden">
      {/* ── 1. Compact Editorial Header (Maximized Space for Requests) ── */}
      <header className="bg-white dark:bg-[#121622] px-6 py-3 shrink-0 border-b border-slate-200/60 dark:border-white/[0.06] shadow-[0_1px_4px_rgba(11,28,48,0.02)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-zinc-100 font-display">
              Studio Structural CAD &amp; Engineering Command
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold font-mono bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-zinc-400">
              {totalDielines} Specifications
            </span>
            {inSimulation > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold font-mono bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40 animate-pulse">
                ⚡ {inSimulation} 3D Fold Simulations Active
              </span>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleExportCSV}
              disabled={filteredDielines.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] text-xs font-semibold text-slate-700 dark:text-zinc-300 transition cursor-pointer disabled:opacity-50"
              title="Export Filtered CSV"
            >
              <Download className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── 2. Scrollable Body with Clean Architecture ── */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* KPI Summary Tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            type="button"
            onClick={onNavigateToMockup}
            className="p-3.5 rounded-xl border border-slate-200/80 dark:border-white/[0.06] bg-slate-50/60 dark:bg-[#121622]/60 hover:bg-white dark:hover:bg-[#161a26] hover:border-[#006d32] hover:shadow-sm text-left transition cursor-pointer group card-hover-lift"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                Total Structural CAD
              </span>
              <Box className="w-4 h-4 text-[#006d32] group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-xl font-bold font-mono text-slate-900 dark:text-zinc-100 mt-1">
              {isLoading ? "—" : totalDielines}
            </div>
            <div className="flex items-center justify-between mt-0.5">
              <span className="text-[10.5px] text-slate-500 dark:text-zinc-400">Active blueprints</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 group-hover:text-[#006d32]" />
            </div>
          </button>

          <button
            type="button"
            onClick={onNavigateToMockup}
            className="p-3.5 rounded-xl border border-slate-200/80 dark:border-white/[0.06] bg-slate-50/60 dark:bg-[#121622]/60 hover:bg-white dark:hover:bg-[#161a26] hover:border-amber-500 hover:shadow-sm text-left transition cursor-pointer group card-hover-lift"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                3D Fold Simulations
              </span>
              <Sparkles className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-xl font-bold font-mono text-slate-900 dark:text-zinc-100 mt-1">
              {isLoading ? "—" : inSimulation}
            </div>
            <div className="flex items-center justify-between mt-0.5">
              <span className="text-[10.5px] font-semibold text-amber-600 dark:text-amber-400">Kinematics check</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 group-hover:text-amber-500" />
            </div>
          </button>

          <button
            type="button"
            onClick={onNavigateToMockup}
            className="p-3.5 rounded-xl border border-slate-200/80 dark:border-white/[0.06] bg-slate-50/60 dark:bg-[#121622]/60 hover:bg-white dark:hover:bg-[#161a26] hover:border-sky-500 hover:shadow-sm text-left transition cursor-pointer group card-hover-lift"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                Plotter Cut Tested
              </span>
              <Clock className="w-4 h-4 text-sky-500 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-xl font-bold font-mono text-slate-900 dark:text-zinc-100 mt-1">
              {isLoading ? "—" : inPlotter}
            </div>
            <div className="flex items-center justify-between mt-0.5">
              <span className="text-[10.5px] text-slate-500 dark:text-zinc-400">Kongsberg sample</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 group-hover:text-sky-500" />
            </div>
          </button>

          <button
            type="button"
            onClick={onNavigateToSampling}
            className="p-3.5 rounded-xl border border-slate-200/80 dark:border-white/[0.06] bg-slate-50/60 dark:bg-[#121622]/60 hover:bg-white dark:hover:bg-[#161a26] hover:border-emerald-500 hover:shadow-sm text-left transition cursor-pointer group card-hover-lift"
          >

            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                Laser Die Cleared
              </span>
              <CheckCircle2 className="w-4 h-4 text-[#006d32] dark:text-emerald-400 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-xl font-bold font-mono text-slate-900 dark:text-zinc-100 mt-1">
              {isLoading ? "—" : clearedCount}
            </div>
            <div className="flex items-center justify-between mt-0.5">
              <span className="text-[10.5px] font-semibold text-emerald-700 dark:text-emerald-400">Tooling certified</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 group-hover:text-emerald-700" />
            </div>
          </button>
        </div>


        {/* Packaging Format Breakdown */}
        <div>
          <div className="flex items-center gap-2 mb-2.5">
            <TrendingUp className="w-3.5 h-3.5 text-[#006d32] dark:text-emerald-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300">
              Packaging Format Engineering Distribution
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-50/70 dark:bg-[#121622]/60 rounded-xl border border-slate-200/70 dark:border-white/[0.06]">
              <span className="text-[10.5px] uppercase font-bold text-slate-500 dark:text-zinc-400 font-mono tracking-wider">Rigid Box</span>
              <div className="text-lg font-bold font-mono text-slate-900 dark:text-zinc-100 mt-0.5">{formatCounts.rigid}</div>
              <div className="text-[11px] text-slate-400 dark:text-zinc-500">Kappa board &amp; wraps</div>
            </div>
            <div className="p-3 bg-slate-50/70 dark:bg-[#121622]/60 rounded-xl border border-slate-200/70 dark:border-white/[0.06]">
              <span className="text-[10.5px] uppercase font-bold text-slate-500 dark:text-zinc-400 font-mono tracking-wider">Folding Carton</span>
              <div className="text-lg font-bold font-mono text-slate-900 dark:text-zinc-100 mt-0.5">{formatCounts.folding}</div>
              <div className="text-[11px] text-slate-400 dark:text-zinc-500">FBB / SBS paperboards</div>
            </div>
            <div className="p-3 bg-slate-50/70 dark:bg-[#121622]/60 rounded-xl border border-slate-200/70 dark:border-white/[0.06]">
              <span className="text-[10.5px] uppercase font-bold text-slate-500 dark:text-zinc-400 font-mono tracking-wider">Flute Corrugated</span>
              <div className="text-lg font-bold font-mono text-slate-900 dark:text-zinc-100 mt-0.5">{formatCounts.flute}</div>
              <div className="text-[11px] text-slate-400 dark:text-zinc-500">E-Flute / Kraft Mailers</div>
            </div>
            <div className="p-3 bg-slate-50/70 dark:bg-[#121622]/60 rounded-xl border border-slate-200/70 dark:border-white/[0.06]">
              <span className="text-[10.5px] uppercase font-bold text-slate-500 dark:text-zinc-400 font-mono tracking-wider">Blister / Sleeve</span>
              <div className="text-lg font-bold font-mono text-slate-900 dark:text-zinc-100 mt-0.5">{formatCounts.blister}</div>
              <div className="text-[11px] text-slate-400 dark:text-zinc-500">PET &amp; header cards</div>
            </div>
          </div>
        </div>

        {/* Recent Structural CAD Table */}
        <div className="rounded-xl border border-slate-200/80 dark:border-white/[0.06] bg-white dark:bg-[#121622] shadow-2xs overflow-hidden flex flex-col">
          <div className="px-6 py-3 border-b border-slate-100 dark:border-white/[0.06] flex items-center justify-between gap-4 flex-wrap bg-slate-50/50 dark:bg-white/[0.02]">
            <div className="flex items-center gap-2">
              <FileCode2 className="w-4 h-4 text-[#006d32] dark:text-emerald-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-zinc-200">
                Recent Structural Dielines &amp; Tooling Specs ({filteredDielines.length})
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative w-48 sm:w-60 group">
                <Search className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2 group-focus-within:text-[#006d32] transition-colors pointer-events-none" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search dielines, client..."
                  className="w-full h-8.5 pl-[32px] pr-7 rounded-lg bg-white dark:bg-white/[0.06] border border-slate-200 dark:border-white/[0.08] text-xs text-slate-800 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#006d32]/15 focus:border-[#006d32]/40 transition"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-white/[0.1] transition-colors cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={onNavigateToMockup}
                className="text-xs font-semibold text-[#006d32] dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>View All Mockups</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 z-10 bg-slate-50/90 dark:bg-[#121622] backdrop-blur-xs border-b border-slate-200/70 dark:border-white/[0.08]">
                <tr className="text-slate-600 dark:text-zinc-400 font-mono text-[11px] uppercase tracking-wider select-none">
                  <th className="py-3 pl-6 pr-3 font-semibold whitespace-nowrap">Dieline Code</th>
                  <th className="py-3 px-4 font-semibold">Packaging Title</th>
                  <th className="py-3 px-4 font-semibold whitespace-nowrap">Client</th>
                  <th className="py-3 px-4 font-semibold whitespace-nowrap">Box Format</th>
                  <th className="py-3 px-4 font-semibold whitespace-nowrap">Dimensions (L×W×D)</th>
                  <th className="py-3 px-4 font-semibold whitespace-nowrap">Caliper</th>
                  <th className="py-3 px-4 font-semibold whitespace-nowrap">Plant</th>
                  <th className="py-3 px-4 font-semibold whitespace-nowrap">Status</th>
                  <th className="py-3 pl-4 pr-6 font-semibold text-right whitespace-nowrap">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                {filteredDielines.slice(0, 10).map((d) => (
                  <tr
                    key={d.id}
                    onClick={() => onInspectDieline(d)}
                    className="hover:bg-slate-50/80 dark:hover:bg-white/[0.03] transition-colors cursor-pointer"
                  >
                    <td className="py-3 pl-6 pr-3 whitespace-nowrap">
                      <CopyBadge text={d.dielineCode} />
                    </td>
                    <td className="py-3 px-4 text-slate-900 dark:text-zinc-100 font-medium max-w-[200px] truncate">
                      {d.title}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-zinc-400 whitespace-nowrap font-medium">
                      {d.client}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-mono">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/[0.06] text-[10.5px] font-semibold text-slate-700 dark:text-zinc-300">
                        {d.boxFormat}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600 dark:text-zinc-400 whitespace-nowrap">
                      {d.dimensions}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500 dark:text-zinc-400 whitespace-nowrap">
                      {d.caliperMicrons}µm
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-zinc-400 whitespace-nowrap">
                      {d.targetPlant}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <StatusPill status={d.status} size="sm" />
                    </td>
                    <td className="py-3 pl-4 pr-6 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onInspectDieline(d);
                        }}
                        className="px-3 py-1 rounded-lg border border-slate-200 dark:border-white/[0.08] hover:bg-slate-100 dark:hover:bg-white/[0.06] text-[11px] font-semibold text-slate-700 dark:text-zinc-300 shadow-2xs transition cursor-pointer"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudioOverviewPage;
