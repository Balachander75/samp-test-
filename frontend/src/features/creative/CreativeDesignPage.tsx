import React, { useState, useMemo } from "react";
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
  Eye,
  Sliders,
  Image as ImageIcon,
} from "lucide-react";
import { CreativeBriefItem, SampleRequestItem } from "@/features/sample-requests/types";
import { StatusPill } from "@/components/ui/StatusPill";
import { CopyBadge } from "@/components/ui/CopyBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { WorkflowTabStrip } from "@/components/erp/WorkflowTabStrip";
import { exportRecordsToCsv } from "@/lib/csvExport";

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
        trend: b.colorSpecs || "Standard CMYK",
        targetAudience: b.category || "General",
        referenceCount: 0,
        program: "Creative Studio",
        variantsCount: b.variantsCount,
        designer: b.designer,
        dueDate: b.dueDate,
        proofStatus: b.proofStatus,
        accentColor: b.accentColor || "#714B67",
        isBrief: true,
        rawBrief: b,
      });
    });

    // 2. From design-scoped requests
    designRequests.forEach((d) => {
      let status: CreativeBriefItem["proofStatus"] = "Brief Intake";
      const s = String(d.status || "").toLowerCase();
      const workflowStatus = String(d.designRequestStatus || d.status || "").toLowerCase();
      if (s.includes("approved") || s.includes("released")) status = "Prepress Approved";
      else if (workflowStatus.includes("remaining requested")) status = "Revisions Requested";
      else if (s.includes("review")) status = "Client Review";
      else if (s.includes("creative")) status = "In Concept";

      const refCount = (d.referenceImages?.length || 0) + (d.referenceLinks?.length || 0) + (d.productImagePath ? 1 : 0);

      list.push({
        id: String(d.id),
        refCode: d.srNumber || `DSG-${d.id}`,
        title: d.productDescription || (d as any).opportunityName || d.programName || "Graphic Design Request",
        customer: d.customer || "General Customer",
        trend: d.trend || "Contemporary Trend",
        targetAudience: d.targetAudience || "General Audience",
        referenceCount: refCount,
        program: d.programName || d.programYear || "General Program",
        variantsCount: Number(d.designsCustomerCreative || d.productArtworkNos) || 1,
        designer: d.createdBy || "Marketing Specialist",
        dueDate: d.sampleRequiredDate || d.targetArtworkDateCreative || "Standard SLA",
        proofStatus: status,
        accentColor: "#017E84",
        isBrief: false,
        rawReq: d,
      });
    });

    return list;
  }, [briefs, designRequests]);

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
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#F8F9FA] dark:bg-[#0b0c10] select-text">
      {/* ── 1. Compact Page Header (Aligned to Marketing Desk Standards) ── */}
      <div className="bg-white dark:bg-[#12141d] border-b border-[#E2E8F0] dark:border-white/[0.08] px-6 py-3 shrink-0">
        <div className="flex items-center justify-between gap-4">
          {/* Title + Desk Badge */}
          <div className="flex items-center gap-2.5 min-w-0">
            <h1 className="text-sm font-bold text-neutral-900 dark:text-white truncate">
              Artwork Design Briefs &amp; Graphic Assets Workbench
            </h1>
            <span className="shrink-0 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#714B67]/10 text-[#714B67] dark:bg-purple-950/40 dark:text-purple-300 border border-[#714B67]/20">
              Creative Desk
            </span>
          </div>

          {/* Action Buttons & View Switcher */}
          <div className="flex items-center gap-2 shrink-0">
            {onOpenNewBriefModal && (
              <button
                type="button"
                onClick={onOpenNewBriefModal}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#017E84] hover:bg-[#00666A] text-white text-xs font-semibold shadow-xs transition active:scale-95 cursor-pointer"
                title="Create New Graphic Design Brief"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New</span>
              </button>
            )}

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
              onClick={handleExportCSV}
              disabled={filteredDesigns.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-[#CED4DA] dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-neutral-50 dark:hover:bg-zinc-700 text-xs font-semibold text-neutral-700 dark:text-zinc-200 shadow-2xs transition cursor-pointer disabled:opacity-50"
              title="Export Filtered CSV"
            >
              <Download className="w-3.5 h-3.5 text-neutral-500" />
              <span className="hidden sm:inline">Export</span>
            </button>

          </div>
        </div>

        {/* ── 2. KPI Metric Cards Ribbon (Exact 6 Executive Cards Aligned to Marketing) ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 mt-3 pt-3 border-t border-[#F1F5F9] dark:border-white/[0.05]">
          {stages.map((stage) => {
            const isSelected = selectedStage === stage.id;
            return (
              <div
                key={stage.id}
                onClick={() => setSelectedStage(stage.id)}
                className={`p-2.5 rounded-lg border transition cursor-pointer ${
                  isSelected
                    ? "border-[#714B67] bg-[#714B67]/5 dark:bg-[#714B67]/20 shadow-2xs"
                    : "border-[#E2E8F0] dark:border-white/[0.06] bg-neutral-50/60 dark:bg-zinc-900/40 hover:border-neutral-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10.5px] uppercase font-bold text-neutral-500 dark:text-zinc-400 font-mono tracking-wider">
                    {stage.label}
                  </span>
                  <Palette className="w-3.5 h-3.5 text-neutral-400" />
                </div>
                <div className="text-xl font-bold font-mono text-neutral-900 dark:text-zinc-100 mt-0.5">
                  {stage.count}
                </div>
                <div className="text-[10px] text-neutral-400 font-mono">{stage.sub}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 3. Segmented Filter Pills & Control Strip (Aligned to Marketing Desk) ── */}
      <div className="bg-white dark:bg-[#12141d] border-b border-[#E2E8F0] dark:border-white/[0.08] px-6 py-2.5 shrink-0 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Odoo Segmented Stage Filter Pills */}
        <WorkflowTabStrip
          tabs={stages}
          activeTab={selectedStage}
          onSelectTab={setSelectedStage}
          compact
        />

        {/* Right: Search & Trend Dropdown */}
        <div className="flex items-center gap-2 flex-1 sm:flex-initial justify-end flex-wrap">
          {uniqueTrends.length > 0 && (
            <select
              value={selectedTrend}
              onChange={(e) => setSelectedTrend(e.target.value)}
              className="h-8 px-2.5 rounded border border-[#CED4DA] dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-neutral-700 dark:text-zinc-200 focus:outline-none focus:border-[#714B67] cursor-pointer"
            >
              <option value="all">All Themes / Trends</option>
              {uniqueTrends.map((t) => (
                <option key={t} value={t}>
                  {t}
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
              placeholder="Search code, title, customer..."
              className="h-8 pl-8 pr-3 w-48 sm:w-64 rounded border border-[#CED4DA] dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-neutral-900 dark:text-zinc-100 placeholder-neutral-400 focus:outline-none focus:border-[#714B67]"
            />
          </div>
        </div>
      </div>

      {/* ── 4. Main Body: Table View ── */}
      <div className="flex-1 overflow-y-auto p-6 min-h-0">
        {filteredDesigns.length === 0 ? (
          <EmptyState
            icon={Palette}
            title="No design briefs match the selected filters"
            description="Try adjusting your stage, trend dropdown, or search query."
            onResetFilters={() => {
              setSelectedStage("all");
              setSelectedTrend("all");
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
                    <th className="py-2.5 px-3">Ref Code</th>
                    <th className="py-2.5 px-3">Design Brief &amp; Title</th>
                    <th className="py-2.5 px-3">Customer / Brand</th>
                    <th className="py-2.5 px-3">Theme / Trend</th>
                    <th className="py-2.5 px-3">Target Audience</th>
                    <th className="py-2.5 px-3 text-center">Variants</th>
                    <th className="py-2.5 px-3">References</th>
                    <th className="py-2.5 px-3">Due Date</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9] dark:divide-white/[0.04]">
                  {filteredDesigns.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => {
                        if (item.isBrief && item.rawBrief) onInspectBrief(item.rawBrief);
                        else if (!item.isBrief && item.rawReq) onInspectRequest(item.rawReq);
                      }}
                      className="hover:bg-neutral-50/80 dark:hover:bg-zinc-800/40 transition cursor-pointer"
                    >
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <CopyBadge text={item.refCode} />
                      </td>
                      <td className="py-2.5 px-3 text-neutral-900 dark:text-zinc-100 font-medium max-w-xs">
                        <span className="line-clamp-1">{item.title}</span>
                      </td>
                      <td className="py-2.5 px-3 text-neutral-600 dark:text-zinc-400 whitespace-nowrap font-medium">
                        {item.customer}
                      </td>
                      <td className="py-2.5 px-3 text-neutral-700 dark:text-zinc-300 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950/40 text-[#714B67] dark:text-purple-300 border border-[#714B67]/20 text-[11px] font-semibold">
                          {item.trend}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-neutral-600 dark:text-zinc-400 whitespace-nowrap">
                        {item.targetAudience}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono">
                        <span className="px-2 py-0.5 rounded bg-neutral-100 dark:bg-zinc-800 text-[11px] font-semibold text-neutral-700 dark:text-zinc-300">
                          {item.variantsCount} Artworks
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-neutral-500 whitespace-nowrap">
                        {item.referenceCount > 0 ? (
                          <span className="inline-flex items-center gap-1 text-[#017E84] font-semibold">
                            <ImageIcon className="w-3 h-3" />
                            {item.referenceCount} File{item.referenceCount > 1 ? "s" : ""}
                          </span>
                        ) : (
                          <span className="text-neutral-400">—</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-neutral-500 whitespace-nowrap">
                        {item.dueDate}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <StatusPill status={item.proofStatus} size="sm" />
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (item.isBrief && item.rawBrief) onInspectBrief(item.rawBrief);
                            else if (!item.isBrief && item.rawReq) onInspectRequest(item.rawReq);
                          }}
                          className="px-2.5 py-1 rounded border border-[#CED4DA] dark:border-zinc-700 hover:bg-neutral-100 dark:hover:bg-zinc-800 text-[11px] font-semibold text-neutral-700 dark:text-zinc-200 shadow-2xs transition cursor-pointer"
                        >
                          Open
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreativeDesignPage;
