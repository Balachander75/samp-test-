import React, { useState, useMemo } from "react";
import {
  Box,
  Layers,
  Search,
  Copy,
  Check,
  ChevronRight,
  Factory,
  Building2,
  Calendar,
  AlertTriangle,
  Clock,
  RefreshCw,
  LayoutGrid,
  List as ListIcon,
  Palette,
  Calculator,
  Download,
} from "lucide-react";
import { SampleRequestItem } from "@/features/sample-requests/types";
import { StatusPill } from "@/components/ui/StatusPill";
import { CopyBadge } from "@/components/ui/CopyBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { WorkflowTabStrip } from "@/components/erp/WorkflowTabStrip";
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
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filter requests that have sample or mockup scopes
  const samplingMockupItems = useMemo(() => {
    return requests.filter((r) => {
      const scopes = r.requestTypes || [];
      const hasMockup = scopes.includes("mockup") || r.mockupRequired === "Yes";
      const hasSample = scopes.includes("sample");
      return hasMockup || hasSample;
    });
  }, [requests]);

  // Telemetry metrics
  const totalCombined = samplingMockupItems.length;
  const mockupCount = samplingMockupItems.filter(
    (r) => (r.requestTypes || []).includes("mockup") || r.mockupRequired === "Yes"
  ).length;
  const sampleCount = samplingMockupItems.filter((r) => (r.requestTypes || []).includes("sample")).length;
  const bothCount = samplingMockupItems.filter((r) => {
    const scopes = r.requestTypes || [];
    return (scopes.includes("mockup") || r.mockupRequired === "Yes") && scopes.includes("sample");
  }).length;

  // Scope filter tabs
  const scopeTabs = [
    { id: "all", label: "All Combined Specs", count: totalCombined, sub: "Total Queue" },
    { id: "both", label: "Sample + Mockup Both", count: bothCount, sub: "Dual Deliverables" },
    { id: "mockup_only", label: "CAD Mockup Required", count: mockupCount, sub: "3D CAD Simulations" },
    { id: "sample_only", label: "Physical Samples", count: sampleCount, sub: "Machine Floor Units" },
  ];

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

      // Status filter
      if (statusFilter !== "all" && (r.status || "") !== statusFilter) return false;

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
  }, [samplingMockupItems, scopeFilter, plantFilter, statusFilter, searchTerm]);

  // Unique plants for dropdown
  const uniquePlants = useMemo(() => {
    const set = new Set<string>();
    samplingMockupItems.forEach((r) => {
      if (r.targetPlant?.trim()) set.add(r.targetPlant.trim());
    });
    return Array.from(set).sort();
  }, [samplingMockupItems]);

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
    <div className="flex-1 flex flex-col min-h-0 bg-[#F8F9FA] dark:bg-[#0b0c10] select-text">
      {/* ── 1. Compact Page Header (Aligned to Marketing Desk Standards) ── */}
      <div className="bg-white dark:bg-[#12141d] border-b border-[#E2E8F0] dark:border-white/[0.08] px-6 py-3 shrink-0">
        <div className="flex items-center justify-between gap-4">
          {/* Title + Desk Badge */}
          <div className="flex items-center gap-2.5 min-w-0">
            <h1 className="text-sm font-bold text-neutral-900 dark:text-white truncate">
              Sampling &amp; CAD Mockup Unified Operations Desk
            </h1>
            <span className="shrink-0 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#714B67]/10 text-[#714B67] dark:bg-purple-950/40 dark:text-purple-300 border border-[#714B67]/20">
              Creative Desk
            </span>
          </div>

          {/* Action Buttons & View Switcher */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleRefreshClick}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-[#CED4DA] dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-neutral-50 dark:hover:bg-zinc-700 text-xs font-semibold text-neutral-700 dark:text-zinc-200 shadow-2xs transition cursor-pointer disabled:opacity-50"
              title="Refresh Records"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-[#017E84]" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              type="button"
              onClick={handleExportClick}
              disabled={filteredItems.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-[#CED4DA] dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-neutral-50 dark:hover:bg-zinc-700 text-xs font-semibold text-neutral-700 dark:text-zinc-200 shadow-2xs transition cursor-pointer disabled:opacity-50"
              title="Export Filtered CSV"
            >
              <Download className="w-3.5 h-3.5 text-neutral-500" />
              <span className="hidden sm:inline">Export</span>
            </button>

          </div>
        </div>

        {/* ── 2. KPI Metric Cards Ribbon (Exact Executive Cards Aligned to Marketing) ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-3 pt-3 border-t border-[#F1F5F9] dark:border-white/[0.05]">
          {scopeTabs.map((tab) => {
            const isSelected = scopeFilter === tab.id;
            return (
              <div
                key={tab.id}
                onClick={() => setScopeFilter(tab.id as any)}
                className={`p-2.5 rounded-lg border transition cursor-pointer ${
                  isSelected
                    ? "border-[#714B67] bg-[#714B67]/5 dark:bg-[#714B67]/20 shadow-2xs"
                    : "border-[#E2E8F0] dark:border-white/[0.06] bg-neutral-50/60 dark:bg-zinc-900/40 hover:border-neutral-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10.5px] uppercase font-bold text-neutral-500 dark:text-zinc-400 font-mono tracking-wider">
                    {tab.label}
                  </span>
                  <Box className="w-3.5 h-3.5 text-neutral-400" />
                </div>
                <div className="text-xl font-bold font-mono text-neutral-900 dark:text-zinc-100 mt-0.5">
                  {tab.count}
                </div>
                <div className="text-[10px] text-neutral-400 font-mono">{tab.sub}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 3. Segmented Filter Pills & Control Strip (Aligned to Marketing Desk) ── */}
      <div className="bg-white dark:bg-[#12141d] border-b border-[#E2E8F0] dark:border-white/[0.08] px-6 py-2.5 shrink-0 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Odoo Segmented Scope Filter Pills */}
        <WorkflowTabStrip
          tabs={scopeTabs}
          activeTab={scopeFilter}
          onSelectTab={(id) => setScopeFilter(id as any)}
          compact
        />

        {/* Right: Search & Plant Dropdown */}
        <div className="flex items-center gap-2 flex-1 sm:flex-initial justify-end flex-wrap">
          {uniquePlants.length > 0 && (
            <select
              value={plantFilter}
              onChange={(e) => setPlantFilter(e.target.value)}
              className="h-8 px-2.5 rounded border border-[#CED4DA] dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-neutral-700 dark:text-zinc-200 focus:outline-none focus:border-[#714B67] cursor-pointer"
            >
              <option value="all">All Plants</option>
              {uniquePlants.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          )}

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search SR, product, customer..."
              className="h-8 pl-8 pr-3 w-48 sm:w-64 rounded border border-[#CED4DA] dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-neutral-900 dark:text-zinc-100 placeholder-neutral-400 focus:outline-none focus:border-[#714B67]"
            />
          </div>
        </div>
      </div>

      {/* ── 4. Main Body: Table View ── */}
      <div className="flex-1 overflow-y-auto p-6 min-h-0">
        {filteredItems.length === 0 ? (
          <EmptyState
            icon={Box}
            title="No sampling or mockup requests match the selected filters"
            description="Try adjusting your scope filter tab, plant selector, or search query."
            onResetFilters={() => {
              setScopeFilter("all");
              setPlantFilter("all");
              setSearchTerm("");
            }}
          />
        ) : (
          /* Odoo ERP Table View */
          <div className="bg-white dark:bg-[#12141d] rounded-xl border border-[#E2E8F0] dark:border-white/[0.08] shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8F9FA] dark:bg-zinc-900/80 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider border-b border-[#E2E8F0] dark:border-white/[0.08]">
                  <tr>
                    <th className="py-2.5 px-3">SR Code</th>
                    <th className="py-2.5 px-3">Sample Description</th>
                    <th className="py-2.5 px-3">Customer</th>
                    <th className="py-2.5 px-3">Deliverable Scopes</th>
                    <th className="py-2.5 px-3 text-center">Mockup / Qty</th>
                    <th className="py-2.5 px-3">Plant</th>
                    <th className="py-2.5 px-3">Due Date</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9] dark:divide-white/[0.04]">
                  {filteredItems.map((r) => {
                    const scopes = r.requestTypes || [];
                    const hasMockup = scopes.includes("mockup") || r.mockupRequired === "Yes";
                    const hasSample = scopes.includes("sample");
                    const hasDesign = scopes.includes("design");
                    const qty = (r as any).quantity || r.qtyForSampling || 1;

                    return (
                      <tr
                        key={r.id}
                        onClick={() => onInspectRequest(r)}
                        className="hover:bg-neutral-50/80 dark:hover:bg-zinc-800/40 transition cursor-pointer"
                      >
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <CopyBadge text={r.srNumber || `SR-${r.id}`} />
                        </td>
                        <td className="py-2.5 px-3 text-neutral-900 dark:text-zinc-100 font-medium">
                          {r.productDescription || (r as any).opportunityName || "Sample Dummy"}
                        </td>
                        <td className="py-2.5 px-3 text-neutral-600 dark:text-zinc-400 whitespace-nowrap">
                          {r.customer || "General"}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <div className="flex items-center gap-1 flex-wrap">
                            {hasDesign && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-purple-50 text-[#714B67] border border-purple-200/80">
                                🎨 Design
                              </span>
                            )}
                            {hasMockup && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-amber-50 text-amber-700 border border-amber-200/80">
                                📦 Mockup
                              </span>
                            )}
                            {hasSample && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-teal-50 text-[#017E84] border border-teal-200/80">
                                🏭 Sample
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono">
                          <span className="px-2 py-0.5 rounded bg-neutral-100 dark:bg-zinc-800 text-[11px] font-semibold text-neutral-700 dark:text-zinc-300">
                            {hasMockup ? "CAD + " : ""}{qty} units
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-neutral-600 dark:text-zinc-400 whitespace-nowrap">
                          {r.targetPlant || "Khaniwade"}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-neutral-500 whitespace-nowrap">
                          {r.sampleRequiredDate || "Standard SLA"}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <StatusPill status={r.status || "Creative"} size="sm" />
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onInspectRequest(r);
                            }}
                            className="px-2.5 py-1 rounded border border-[#CED4DA] dark:border-zinc-700 hover:bg-neutral-100 dark:hover:bg-zinc-800 text-[11px] font-semibold text-neutral-700 dark:text-zinc-200 shadow-2xs transition cursor-pointer"
                          >
                            Inspect
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreativeSamplingMockupPage;
