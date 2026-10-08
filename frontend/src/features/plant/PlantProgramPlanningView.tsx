import React, { useState, useMemo } from "react";
import { UserProfile } from "@/features/auth";
import { SampleRequestItem } from "@/features/sample-requests/types";
import { getRequestTrackType } from "@/features/sample-requests/utils/trackTypes";
import {
  Search,
  RefreshCw,
  FolderGit2,
  Building2,
  CheckCircle2,
  Clock,
  Download,
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Cog,
  Sparkles,
} from "lucide-react";
import { parseSampRemark } from "@/features/sample-requests/programs/utils/programRemarkUtils";
import { CopyBadge } from "@/components/ui/CopyBadge";
import { PaginationBar } from "@/components/erp/PaginationBar";
import { exportRecordsToCsv } from "@/lib/csvExport";

export interface PlantProgramPlanningViewProps {
  requests: SampleRequestItem[];
  isLoading: boolean;
  selectedPlant: string;
  uniquePlants: string[];
  user?: UserProfile | null;
  isAdmin: boolean;
  onInspectRequest: (req: SampleRequestItem) => void;
  onRefresh: () => Promise<void>;
  showToast: (msg: string) => void;
  onAdvancePlantStatus?: (req: SampleRequestItem, nextStatus: string) => Promise<void>;
}

export type PlantProgramTab = "all" | "awaiting_scheduling" | "ready_floor" | "in_production";

export const PlantProgramPlanningView: React.FC<PlantProgramPlanningViewProps> = ({
  requests,
  isLoading,
  selectedPlant,
  onInspectRequest,
  onRefresh,
  showToast,
  onAdvancePlantStatus,
}) => {
  const [filterTab, setFilterTab] = useState<PlantProgramTab>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [plantFilter, setPlantFilter] = useState("all");
  const [customerFilter, setCustomerFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isUpdatingId, setIsUpdatingId] = useState<string | null>(null);
  const PAGE_SIZE = 15;

  // Scoped strictly to program planning requests
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

  // Scoped plant-specific programs (if selectedPlant is not ALL, scope to active plant)
  const plantScopedRequests = useMemo(() => {
    if (!selectedPlant || selectedPlant === "ALL") {
      return programRequests;
    }
    const plantNorm = selectedPlant.toLowerCase().trim();
    return programRequests.filter((r) => {
      const target = String(r.targetPlant || "").toLowerCase().trim();
      return target.includes(plantNorm) || plantNorm.includes(target);
    });
  }, [programRequests, selectedPlant]);

  // Derived Customers List strictly from plantScopedRequests (isolated so no bleed from other desks)
  const customerList = useMemo(() => {
    const set = new Set<string>();
    plantScopedRequests.forEach((r) => {
      if (r.customer?.trim()) set.add(r.customer.trim());
    });
    return Array.from(set).sort();
  }, [plantScopedRequests]);

  // Derived Plants List strictly from programRequests
  const plantList = useMemo(() => {
    const set = new Set<string>();
    programRequests.forEach((r) => {
      if (r.targetPlant?.trim()) set.add(r.targetPlant.trim());
    });
    return Array.from(set).sort();
  }, [programRequests]);

  // Operational metrics for the Plant Desk
  const metrics = useMemo(() => {
    const total = plantScopedRequests.length;
    let awaitingScheduling = 0;
    let readyForFloor = 0;
    let inProduction = 0;
    let totalSKUs = 0;

    plantScopedRequests.forEach((r) => {
      const st = (r.status || "").toLowerCase();
      const materials = r.programMaterials || [];
      totalSKUs += materials.length > 0 ? materials.length : 1;

      if (st.includes("in prod") || st.includes("production")) {
        inProduction++;
      } else if (st.includes("reviewed") || st.includes("approved") || st.includes("ready")) {
        readyForFloor++;
      } else {
        awaitingScheduling++;
      }
    });

    return { total, awaitingScheduling, readyForFloor, inProduction, totalSKUs };
  }, [plantScopedRequests]);

  // Navigation tab definitions with live counters
  const navTabs: { id: PlantProgramTab; label: string; count: number }[] = [
    { id: "all", label: "All Assigned Programs", count: metrics.total },
    { id: "awaiting_scheduling", label: "Awaiting Scheduling", count: metrics.awaitingScheduling },
    { id: "ready_floor", label: "Ready for Floor", count: metrics.readyForFloor },
    { id: "in_production", label: "In Production", count: metrics.inProduction },
  ];

  // Filtered dataset
  const filteredRequests = useMemo(() => {
    return plantScopedRequests.filter((r) => {
      const st = (r.status || "").toLowerCase();

      if (filterTab === "awaiting_scheduling") {
        if (st.includes("in prod") || st.includes("production") || st.includes("reviewed") || st.includes("ready") || st.includes("approved")) {
          return false;
        }
      } else if (filterTab === "ready_floor") {
        if (!st.includes("reviewed") && !st.includes("ready") && !st.includes("approved")) return false;
        if (st.includes("in prod") || st.includes("production")) return false;
      } else if (filterTab === "in_production") {
        if (!st.includes("in prod") && !st.includes("production") && !st.includes("handoff")) return false;
      }

      if (plantFilter !== "all" && r.targetPlant !== plantFilter) {
        return false;
      }

      if (customerFilter !== "all" && r.customer !== customerFilter) {
        return false;
      }

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const code = (r.materialCode || r.srNumber || "").toLowerCase();
        const cust = (r.customer || "").toLowerCase();
        const title = (r.programName || r.productDescription || "").toLowerCase();
        const plant = (r.targetPlant || "").toLowerCase();
        if (!code.includes(q) && !cust.includes(q) && !title.includes(q) && !plant.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [plantScopedRequests, filterTab, plantFilter, customerFilter, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredRequests.length / PAGE_SIZE));
  const paginatedRequests = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredRequests.slice(start, start + PAGE_SIZE);
  }, [filteredRequests, currentPage]);

  const handleExportCsv = () => {
    const dateStr = new Date().toISOString().split("T")[0];
    exportRecordsToCsv({
      filename: `Plant_Program_Planning_${(selectedPlant || "all").toLowerCase()}_${dateStr}.csv`,
      columns: [
        { header: "Program ID", accessor: (r) => r.srNumber || `PG-${r.id}` },
        { header: "Program Code", accessor: (r) => r.materialCode || "" },
        { header: "Campaign Title", accessor: (r) => r.programName || r.productDescription || "" },
        { header: "Customer", accessor: (r) => r.customer || "" },
        { header: "Target Plant", accessor: (r) => r.targetPlant || "" },
        { header: "Program Year", accessor: (r) => r.programYear || "2026" },
        { header: "Status", accessor: (r) => r.status || "Pending SAMP Review" },
        { header: "Total SKUs", accessor: (r) => (r.programMaterials || []).length || 1 },
        { header: "Created By", accessor: (r) => r.createdBy || "Marketing" },
        { header: "Created Date", accessor: (r) => r.dateRequestCreated || r.createdAt || "" },
      ],
      data: filteredRequests,
    });
    showToast(`Exported ${filteredRequests.length} plant program records to CSV`);
  };

  const handleQuickStatusClick = async (req: SampleRequestItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onAdvancePlantStatus || isUpdatingId) return;

    const st = (req.status || "").toLowerCase();
    const nextStatus = st.includes("in prod")
      ? "Production Completed"
      : st.includes("reviewed") || st.includes("ready")
      ? "In Production"
      : "Ready for Production";

    setIsUpdatingId(String(req.id));
    try {
      await onAdvancePlantStatus(req, nextStatus);
      showToast(`Program updated to "${nextStatus}"`);
    } catch {
      showToast("Failed to update program status");
    } finally {
      setIsUpdatingId(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-white text-slate-800 select-text overflow-hidden">
      {/* ── 1. Compact Editorial Header (Maximized Space, The Luminous Engine) ── */}
      <header className="bg-white px-6 py-3 shrink-0 border-b border-slate-200/60 shadow-[0_1px_4px_rgba(11,28,48,0.02)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 font-display">
              Plant Seasonal Program Planning
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold font-mono bg-slate-100 text-slate-600">
              {metrics.total} Programs
            </span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold font-mono bg-[#006d32]/10 text-[#006d32] border border-[#006d32]/20">
              {metrics.totalSKUs} Total SKUs
            </span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold font-mono bg-slate-100 text-slate-700">
              Plant {selectedPlant || "ALL"}
            </span>
            {metrics.awaitingScheduling > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold font-mono bg-amber-50 text-amber-700 animate-pulse">
                ⚡ {metrics.awaitingScheduling} Awaiting Scheduling
              </span>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 shrink-0">
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
              onClick={handleExportCsv}
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

          {(selectedPlant === "ALL" || !selectedPlant) && plantList.length > 0 && (
            <select
              value={plantFilter}
              onChange={(e) => {
                setPlantFilter(e.target.value);
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

          {/* Clean Search Input */}
          <div className="relative w-48 sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search ref, campaign, SKU..."
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
          <thead className="sticky top-0 z-10 bg-[#f8fafc] border-b border-slate-200 select-none">
            <tr className="text-slate-600 font-mono text-[11px] uppercase tracking-wider select-none">
              <th className="py-3 pl-6 pr-4 font-semibold whitespace-nowrap">Program ID</th>
              <th className="py-3 px-4 font-semibold">Campaign Title &amp; Product Scope</th>
              <th className="py-3 px-4 font-semibold whitespace-nowrap">Customer</th>
              <th className="py-3 px-4 font-semibold whitespace-nowrap">Assigned Plant</th>
              <th className="py-3 px-4 font-semibold text-center whitespace-nowrap">Year</th>
              <th className="py-3 px-4 font-semibold text-center whitespace-nowrap">Matrix SKUs</th>
              <th className="py-3 px-4 font-semibold whitespace-nowrap">SAMP Technical Review</th>
              <th className="py-3 px-4 font-semibold whitespace-nowrap">Plant Readiness</th>
              <th className="py-3 px-4 font-semibold whitespace-nowrap">Target Date</th>
              <th className="py-3 pl-4 pr-6 font-semibold text-right whitespace-nowrap">Plant Action</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={10} className="py-16 text-center text-slate-400 font-mono">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto text-[#006d32] mb-2" />
                  <span>Loading plant program planning matrix...</span>
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
                    <p className="text-xs text-slate-500 mt-1 text-center">
                      {searchTerm || customerFilter !== "all" || filterTab !== "all" || plantFilter !== "all"
                        ? "No programs match your search or active filter criteria."
                        : `There are currently no seasonal program planning requests assigned to plant ${selectedPlant || "ALL"}.`}
                    </p>
                    {(searchTerm || customerFilter !== "all" || filterTab !== "all" || plantFilter !== "all") && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchTerm("");
                          setCustomerFilter("all");
                          setPlantFilter("all");
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
                const srCode = row.srNumber || row.materialCode || `PG-${row.id}`;
                const materials = row.programMaterials || [];
                const skuCount = materials.length > 0 ? materials.length : 1;
                const statusStr = (row.status || "").toLowerCase();
                const isReviewed = statusStr.includes("reviewed") || statusStr.includes("approved");
                const isInProduction = statusStr.includes("in prod") || statusStr.includes("production");
                const isReadyForFloor = isReviewed && !isInProduction;
                const targetDate = (row as any).programTargetDate || (row as any).targetDate || row.dateRequestCreated || "—";

                // Unique substrates
                const substrates = Array.from(
                  new Set(
                    materials
                      .map((m) => m.materialType?.trim())
                      .filter(Boolean) as string[]
                  )
                ).slice(0, 2);

                // Compute flagged columns by Sampling
                let flaggedCount = 0;
                materials.forEach((m) => {
                  const parsed = parseSampRemark(m.sampRemark);
                  flaggedCount += parsed.highlightedCols.length;
                });

                return (
                  <tr
                    key={row.id}
                    onClick={() => onInspectRequest(row)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                  >
                    {/* 1. Program ID */}
                    <td className="py-3 pl-6 pr-4 font-mono font-bold whitespace-nowrap">
                      <CopyBadge text={srCode} />
                    </td>

                    {/* 2. Title & Description */}
                    <td className="py-3 px-4 max-w-sm">
                      <div className="font-semibold text-slate-900 truncate">
                        {row.programName || row.programCampaignTitle || "Seasonal Program"}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate mt-0.5">
                        {row.productDescription || "Multi-SKU scholastic program range"}
                      </div>
                    </td>

                    {/* 3. Customer */}
                    <td className="py-3 px-4 font-semibold text-slate-900 whitespace-nowrap">
                      {row.customer || "—"}
                    </td>

                    {/* 4. Plant */}
                    <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>Plant {row.targetPlant || "1505"}</span>
                      </div>
                    </td>

                    {/* 5. Program Year */}
                    <td className="py-3 px-4 text-center font-mono font-bold whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px]">
                        {row.programYear || "2026"}
                      </span>
                    </td>

                    {/* 6. Matrix SKUs */}
                    <td className="py-3 px-4 text-center font-mono whitespace-nowrap">
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="px-2 py-0.5 rounded-full bg-[#006d32]/10 text-[#006d32] font-bold text-[11px]">
                          {skuCount} SKU{skuCount !== 1 ? "s" : ""}
                        </span>
                        {substrates.length > 0 && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            {substrates.join(" · ")}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 7. SAMP Technical Review Status */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {isReviewed ? (
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-emerald-50 text-emerald-700">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Reviewed by SAMP</span>
                          </span>
                          {flaggedCount > 0 && (
                            <div className="text-[10px] font-mono font-bold text-amber-600 pl-1">
                              ⚠️ {flaggedCount} Flagged Specs
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-amber-50 text-amber-700">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          <span>Pending SAMP Review</span>
                        </span>
                      )}
                    </td>

                    {/* 8. Plant Readiness */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {isInProduction ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-purple-50 text-purple-700">
                          <Cog className="w-3.5 h-3.5 text-purple-600 animate-spin" />
                          <span>In Production</span>
                        </span>
                      ) : isReadyForFloor ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-emerald-50 text-emerald-700">
                          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Ready for Floor</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-slate-100 text-slate-600">
                          <span>Material Staging</span>
                        </span>
                      )}
                    </td>

                    {/* 9. Target Date */}
                    <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{targetDate}</span>
                      </div>
                    </td>

                    {/* 10. Plant Action */}
                    <td className="py-3 pl-4 pr-6 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onInspectRequest(row);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white shadow-xs hover:shadow-[0_4px_12px_rgba(0,109,50,0.3)] transition-all cursor-pointer active:scale-95"
                        style={{ background: "linear-gradient(135deg, #006d32 0%, #00d166 100%)" }}
                        title="Inspect Program Material Specification Matrix"
                      >
                        <span>Inspect Matrix</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
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
            pageSize={PAGE_SIZE}
            onPageChange={(p) => setCurrentPage(p)}
            itemLabel="programs"
          />
        </div>
      </div>
    </div>
  );
};

export default PlantProgramPlanningView;
