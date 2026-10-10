import React, { useState, useMemo, useEffect } from "react";
import {
  Palette,
  Search,
  Plus,
  Download,
  Copy,
  Check,
  ExternalLink,
  ChevronRight,
  Sparkles,
  FileCheck,
  CheckCircle2,
  Clock,
  RefreshCw,
  LayoutGrid,
  List as ListIcon,
  Layers,
  Sliders,
  Image as ImageIcon,
  X,
} from "lucide-react";
import { CreativeBriefItem, SampleRequestItem } from "@/features/sample-requests/types";
import { StatusPill } from "@/components/ui/StatusPill";
import { CopyBadge } from "@/components/ui/CopyBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { WorkflowTabStrip } from "@/components/erp/WorkflowTabStrip";
import { exportRecordsToCsv } from "@/lib/csvExport";
import { mergeWithWorkflowState } from "@/features/sample-requests/utils/designWorkflowStorage";

export interface CreativeDesignPageProps {
  briefs: CreativeBriefItem[];
  designRequests: SampleRequestItem[];
  selectedYear: string;
  onOpenNewBriefModal?: () => void;
  onInspectBrief: (brief: CreativeBriefItem) => void;
  onInspectRequest: (req: SampleRequestItem) => void;
  onUpdateStatus?: (
    id: string,
    newStatus: CreativeBriefItem["proofStatus"],
    notes?: string
  ) => Promise<void>;
  onRefresh?: () => Promise<void>;
}

export const CreativeDesignPage: React.FC<CreativeDesignPageProps> = ({
  briefs,
  designRequests,
  selectedYear,
  onOpenNewBriefModal,
  onInspectBrief,
  onInspectRequest,
  onUpdateStatus,
  onRefresh,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStage, setSelectedStage] = useState<string>("all");
  const [selectedTrend, setSelectedTrend] = useState<string>("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [workflowVersion, setWorkflowVersion] = useState(0);

  useEffect(() => {
    const handleStorageUpdate = () => {
      setWorkflowVersion((v) => v + 1);
    };
    window.addEventListener("samp:design-workflow-updated", handleStorageUpdate);
    return () => {
      window.removeEventListener("samp:design-workflow-updated", handleStorageUpdate);
    };
  }, []);

  // Merge and normalize briefs and design requests
  const unifiedDesigns = useMemo(() => {
    const list: Array<{
      id: string;
      refCode: string;
      title: string;
      customer: string;
      trend: string;
      targetAudience: string;
      referenceCount: number;
      program: string;
      variantsCount: number;
      designer: string;
      dueDate: string;
      proofStatus: CreativeBriefItem["proofStatus"];
      accentColor: string;
      isBrief: boolean;
      rawBrief?: CreativeBriefItem;
      rawReq?: SampleRequestItem;
    }> = [];

    // 1. From briefs
    briefs.forEach((b) => {
      list.push({
        id: b.id,
        refCode: b.artCode,
        title: b.title,
        customer: b.brand,
        trend: (b as any).trend || "",
        targetAudience: (b as any).targetAudience || "",
        referenceCount: 0,
        program: "",
        variantsCount: b.variantsCount,
        designer: b.designer,
        dueDate: b.dueDate,
        proofStatus: b.proofStatus,
        accentColor: b.accentColor || "#006d32",
        isBrief: true,
        rawBrief: b,
      });
    });

    // 2. From design-scoped requests
    designRequests.forEach((d) => {
      const merged = mergeWithWorkflowState(d);
      let status: CreativeBriefItem["proofStatus"] = "Brief Intake";
      const s = String(merged.status || "").toLowerCase();
      const workflowStatus = String(merged.designRequestStatus || merged.status || "").toLowerCase();
      if (s.includes("approved") || s.includes("released") || merged.marketingDesignDecision === "accepted") {
        status = "Prepress Approved";
      } else if (workflowStatus.includes("remaining requested") || merged.marketingDesignDecision === "remaining_requested") {
        status = "Revisions Requested";
      } else if (s.includes("review") || merged.marketingDesignDecision === "awaiting_marketing_review") {
        status = "Client Review";
      } else if (s.includes("creative")) {
        status = "In Concept";
      }

      const refCount = (merged.referenceImages?.length || 0) + (merged.referenceLinks?.length || 0) + (merged.productImagePath ? 1 : 0);

      list.push({
        id: String(merged.id),
        refCode: merged.srNumber || merged.requestCode || "",
        title: merged.productDescription || (merged as any).opportunityName || "",
        customer: merged.customer || "",
        trend: merged.trend || "",
        targetAudience: merged.targetAudience || "",
        referenceCount: refCount,
        program: merged.programName || merged.programYear || "",
        variantsCount: Number(merged.designsCustomerCreative || merged.productArtworkNos) || 1,
        designer: merged.claimedBy ? `${merged.claimedBy} (Claimed)` : "",
        dueDate: merged.isCounterDateActive && merged.proposedTargetDate
          ? `${merged.proposedTargetDate} (Counter)`
          : (merged.targetArtworkDateCreative || merged.sampleRequiredDate || ""),
        proofStatus: status,
        accentColor: "#006d32",
        isBrief: false,
        rawReq: merged,
      });
    });

    return list;
  }, [briefs, designRequests, workflowVersion]);

  // Stage filters matching Marketing structure
  const stages = useMemo(() => [
    { id: "all", label: "All Designs", count: unifiedDesigns.length, sub: "Total Graphic Assets" },
    {
      id: "intake",
      label: "Brief Intake",
      count: unifiedDesigns.filter((d) => d.proofStatus === "Brief Intake").length,
      sub: "Awaiting Ideation",
    },
    {
      id: "concept",
      label: "Concept Ideation",
      count: unifiedDesigns.filter((d) => d.proofStatus === "In Concept").length,
      sub: "Art Moodboard",
    },
    {
      id: "revisions",
      label: "Revisions",
      count: unifiedDesigns.filter((d) => d.proofStatus === "Revisions Requested").length,
      sub: "Art Tweaks",
    },
    {
      id: "review",
      label: "Client Review",
      count: unifiedDesigns.filter((d) => d.proofStatus === "Client Review").length,
      sub: "Proof Approval",
    },
    {
      id: "approved",
      label: "Prepress Certified",
      count: unifiedDesigns.filter((d) => d.proofStatus === "Prepress Approved").length,
      sub: "Ready for Print",
    },
  ], [unifiedDesigns]);

  // Unique themes/trends for dropdown
  const uniqueTrends = useMemo(() => {
    const set = new Set<string>();
    unifiedDesigns.forEach((d) => {
      if (d.trend && d.trend.trim() && d.trend !== "—") set.add(d.trend.trim());
    });
    return Array.from(set).sort();
  }, [unifiedDesigns]);

  // Filtered designs
  const filteredDesigns = useMemo(() => {
    return unifiedDesigns.filter((item) => {
      // Stage filter
      if (selectedStage !== "all") {
        if (selectedStage === "intake" && item.proofStatus !== "Brief Intake") return false;
        if (selectedStage === "concept" && item.proofStatus !== "In Concept") return false;
        if (selectedStage === "revisions" && item.proofStatus !== "Revisions Requested") return false;
        if (selectedStage === "review" && item.proofStatus !== "Client Review") return false;
        if (selectedStage === "approved" && item.proofStatus !== "Prepress Approved") return false;
      }

      // Trend filter
      if (selectedTrend !== "all" && item.trend !== selectedTrend) return false;

      // Search filter
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        return (
          item.refCode.toLowerCase().includes(q) ||
          item.title.toLowerCase().includes(q) ||
          item.customer.toLowerCase().includes(q) ||
          item.designer.toLowerCase().includes(q) ||
          item.trend.toLowerCase().includes(q) ||
          item.targetAudience.toLowerCase().includes(q)
        );
      }

      return true;
    });
  }, [unifiedDesigns, selectedStage, selectedTrend, searchTerm]);

  const handleExportCSV = () => {
    const dateStr = new Date().toISOString().split("T")[0];
    exportRecordsToCsv({
      filename: `creative_designs_${dateStr}.csv`,
      columns: [
        { header: "Ref Code", accessor: (d) => d.refCode },
        { header: "Title", accessor: (d) => d.title },
        { header: "Customer", accessor: (d) => d.customer },
        { header: "Theme / Trend", accessor: (d) => d.trend },
        { header: "Target Audience", accessor: (d) => d.targetAudience },
        { header: "Variants", accessor: (d) => d.variantsCount },
        { header: "Designer", accessor: (d) => d.designer },
        { header: "Due Date", accessor: (d) => d.dueDate },
        { header: "Status", accessor: (d) => d.proofStatus },
      ],
      data: filteredDesigns,
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
  };  return (
    <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-[#0c0d14] text-slate-800 dark:text-zinc-100 select-text overflow-hidden">
      {/* ── 1. Compact Editorial Header (Maximized Space for Requests) ── */}
      <header className="bg-white dark:bg-[#0e121a] px-6 py-3 shrink-0 border-b border-slate-200/60 dark:border-white/[0.06] shadow-[0_1px_4px_rgba(11,28,48,0.02)] dark:shadow-none">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white font-display">
              Artwork Design Briefs &amp; Graphic Assets
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold font-mono bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-zinc-300">
              {unifiedDesigns.length} Briefs
            </span>
            {unifiedDesigns.filter((d) => d.proofStatus === "Client Review").length > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold font-mono bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 animate-pulse">
                ⚡ {unifiedDesigns.filter((d) => d.proofStatus === "Client Review").length} In Review
              </span>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {onOpenNewBriefModal && (
              <button
                type="button"
                onClick={onOpenNewBriefModal}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white shadow-[0_2px_10px_rgba(0,109,50,0.25)] hover:shadow-[0_4px_14px_rgba(0,109,50,0.35)] transition-all cursor-pointer active:scale-98"
                style={{ background: "linear-gradient(135deg, #006d32 0%, #00d166 100%)" }}
                title="Create New Graphic Design Brief"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Design Brief</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleRefreshClick}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200/80 dark:hover:bg-white/[0.1] text-xs font-semibold text-slate-700 dark:text-zinc-200 transition cursor-pointer disabled:opacity-50"
              title="Refresh Records"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-[#006d32]" : "text-slate-500 dark:text-zinc-400"}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              disabled={filteredDesigns.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200/80 dark:hover:bg-white/[0.1] text-xs font-semibold text-slate-700 dark:text-zinc-200 transition cursor-pointer disabled:opacity-50"
              title="Export Filtered CSV"
            >
              <Download className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />
              <span className="hidden sm:inline">Export</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── 2. Floating Filter & Search Strip ── */}
      <div className="px-6 py-2 bg-white dark:bg-[#0e121a] shrink-0 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/50 dark:border-white/[0.06]">
        {/* Soft Segmented Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 select-none">
          {stages.map((t) => {
            const isActive = selectedStage === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelectedStage(t.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer ${
                  isActive
                    ? "bg-[#006d32] text-white shadow-[0_2px_8px_rgba(0,109,50,0.25)]"
                    : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-white/[0.06] bg-transparent"
                }`}
              >
                <span>{t.label}</span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full tabular-nums ${
                    isActive ? "bg-white/25 text-white" : "bg-slate-200/70 dark:bg-white/10 text-slate-600 dark:text-zinc-300"
                  }`}
                >
                  {t.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right Search & Filter Select */}
        <div className="flex items-center gap-2 flex-1 sm:flex-initial justify-end">
          {uniqueTrends.length > 0 && (
            <select
              value={selectedTrend}
              onChange={(e) => setSelectedTrend(e.target.value)}
              className="h-9 px-3 rounded-lg bg-slate-100/80 dark:bg-zinc-900 hover:bg-slate-200/60 dark:hover:bg-zinc-850 text-xs font-medium text-slate-700 dark:text-zinc-200 border border-slate-200/70 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-[#006d32]/15 focus:border-[#006d32]/40 cursor-pointer transition"
            >
              <option value="all">All Trends / Themes</option>
              {uniqueTrends.map((tr) => (
                <option key={tr} value={tr}>
                  {tr}
                </option>
              ))}
            </select>
          )}

          <div className="relative w-60 sm:w-72 group">
            <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#006d32] transition-colors pointer-events-none" />
            <input
              type="text"
              placeholder="Search code, title, customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-9 pl-[34px] pr-8 rounded-lg bg-slate-100/80 dark:bg-zinc-900 hover:bg-slate-200/50 dark:hover:bg-zinc-850 focus:bg-white dark:focus:bg-zinc-900 text-xs text-slate-800 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 border border-slate-200/70 dark:border-white/10 focus:border-[#006d32]/40 focus:outline-none focus:ring-2 focus:ring-[#006d32]/15 shadow-2xs transition-all"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-4.5 h-4.5 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/80 dark:hover:bg-white/10 transition-colors cursor-pointer"
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
          <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-[#121622] border-b border-slate-200/70 dark:border-white/[0.07]">
            <tr className="text-slate-600 dark:text-zinc-400 font-mono text-[11px] uppercase tracking-wider select-none">
              <th className="py-3 pl-6 pr-3 font-semibold whitespace-nowrap">Ref Code</th>
              <th className="py-3 px-4 font-semibold">Design Brief &amp; Title</th>
              <th className="py-3 px-4 font-semibold whitespace-nowrap">Customer / Brand</th>
              <th className="py-3 px-4 font-semibold whitespace-nowrap">Theme / Trend</th>
              <th className="py-3 px-4 font-semibold whitespace-nowrap">Target Audience</th>
              <th className="py-3 px-4 font-semibold text-center whitespace-nowrap">Variants</th>
              <th className="py-3 px-4 font-semibold whitespace-nowrap">Due Date</th>
              <th className="py-3 px-4 font-semibold whitespace-nowrap">Status</th>
              <th className="py-3 pl-4 pr-6 font-semibold text-right whitespace-nowrap">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
            {filteredDesigns.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-16 text-center">
                  <div className="max-w-sm mx-auto flex flex-col items-center">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/[0.05] text-slate-400 dark:text-zinc-500 flex items-center justify-center mb-3">
                      <Palette className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-200">No Design Briefs Found</h3>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                      {searchTerm || selectedTrend !== "all" || selectedStage !== "all"
                        ? "No design briefs match your search or active filter."
                        : "There are currently no graphic design briefs registered."}
                    </p>
                    {(searchTerm || selectedTrend !== "all" || selectedStage !== "all") && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchTerm("");
                          setSelectedTrend("all");
                          setSelectedStage("all");
                        }}
                        className="mt-3 text-xs font-semibold text-[#006d32] dark:text-emerald-400 hover:underline cursor-pointer"
                      >
                        Reset filters
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              filteredDesigns.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => {
                    if (item.isBrief && item.rawBrief) onInspectBrief(item.rawBrief);
                    else if (!item.isBrief && item.rawReq) onInspectRequest(item.rawReq);
                  }}
                  className="hover:bg-slate-50/80 dark:hover:bg-white/[0.025] transition-colors cursor-pointer"
                >
                  <td className="py-3 pl-6 pr-3 whitespace-nowrap">
                    <CopyBadge text={item.refCode} />
                  </td>
                  <td className="py-3 px-4 text-slate-900 dark:text-zinc-100 font-medium max-w-xs">
                    <span className="line-clamp-1">{item.title}</span>
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-zinc-300 whitespace-nowrap font-medium">
                    {item.customer}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-zinc-300 text-[11px] font-medium">
                      {item.trend}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-zinc-300 whitespace-nowrap">
                    {item.targetAudience}
                  </td>
                  <td className="py-3 px-4 text-center font-mono">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/10 text-[11px] font-semibold text-slate-700 dark:text-zinc-300">
                      {item.variantsCount} Artworks
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-500 dark:text-zinc-400 whitespace-nowrap">
                    <div>{item.dueDate}</div>
                    {item.rawReq?.isCounterDateActive && (
                      <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                        Counter Proposed
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <StatusPill status={item.proofStatus} size="sm" />
                      {!item.isBrief && (
                        item.rawReq?.claimedBy ? (
                          <span
                            className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-[#714B67] dark:bg-purple-950/60 dark:text-purple-300"
                            title={`Claimed by ${item.rawReq.claimedBy}`}
                          >
                            Claimed
                          </span>
                        ) : (
                          <span
                            className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                            title="Unclaimed task"
                          >
                            Unclaimed
                          </span>
                        )
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 pl-4 pr-6 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (item.isBrief && item.rawBrief) onInspectBrief(item.rawBrief);
                        else if (!item.isBrief && item.rawReq) onInspectRequest(item.rawReq);
                      }}
                      className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 text-slate-700 dark:text-zinc-200 text-xs font-medium font-mono transition cursor-pointer"
                    >
                      Inspect
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── 4. Compact Footer / Status Strip ── */}
      <footer className="mt-auto px-6 py-2.5 bg-white dark:bg-[#0e121a] border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400 font-mono shrink-0">
        <span>
          Showing {filteredDesigns.length} of {unifiedDesigns.length} design briefs
        </span>
        <div className="flex items-center gap-4">
          <span className="hidden sm:flex items-center gap-1.5 text-slate-400 dark:text-zinc-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Sorted by Latest Raised Intake
          </span>
        </div>
      </footer>
    </div>
  );
};

export default CreativeDesignPage;
