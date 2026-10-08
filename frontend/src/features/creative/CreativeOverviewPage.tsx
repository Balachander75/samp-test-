import React, { useMemo, useState } from "react";
import {
  Palette,
  Box,
  Layers,
  Sparkles,
  CheckCircle2,
  Clock,
  ArrowRight,
  Search,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Activity,
  Download,
  Plus,
  Eye,
  Building2,
  Factory,
} from "lucide-react";
import { CreativeBriefItem, SampleRequestItem } from "@/features/sample-requests/types";
import { StatusPill } from "@/components/ui/StatusPill";
import { useNavigate } from "react-router-dom";

export interface CreativeOverviewPageProps {
  briefs: CreativeBriefItem[];
  designRequests: SampleRequestItem[];
  samplingMockupRequests: SampleRequestItem[];
  isLoading: boolean;
  selectedYear: string;
  selectedPlant: string;
  onNavigateToTab: (tab: "design" | "sampling") => void;
  onInspectBrief: (brief: CreativeBriefItem) => void;
  onInspectRequest: (req: SampleRequestItem) => void;
}

export const CreativeOverviewPage: React.FC<CreativeOverviewPageProps> = ({
  briefs,
  designRequests,
  samplingMockupRequests,
  isLoading,
  selectedYear,
  selectedPlant,
  onNavigateToTab,
  onInspectBrief,
  onInspectRequest,
}) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  // Telemetry KPIs
  const totalDesignCount = briefs.length + designRequests.length;
  const totalSamplingMockupCount = samplingMockupRequests.length;
  const totalPipelineCount = totalDesignCount + totalSamplingMockupCount;

  const prepressApprovedCount =
    briefs.filter((b) => b.proofStatus === "Prepress Approved").length +
    designRequests.filter((d) => String(d.status || "").toLowerCase().includes("approved")).length;

  const inReviewCount =
    briefs.filter((b) => b.proofStatus === "Client Review" || b.proofStatus === "In Concept").length +
    designRequests.filter((d) => String(d.status || "").toLowerCase().includes("creative")).length;

  // Filtered recent design projects
  const recentDesigns = useMemo(() => {
    let combined = [
      ...briefs.map((b) => ({
        id: b.id,
        refCode: b.artCode,
        title: b.title,
        customer: b.brand,
        designsCount: b.variantsCount,
        dueDate: b.dueDate,
        status: b.proofStatus,
        isBrief: true as const,
        rawBrief: b,
      })),
      ...designRequests.map((d) => ({
        id: String(d.id),
        refCode: d.srNumber || `DSG-${d.id}`,
        title: d.productDescription || (d as any).opportunityName || d.programName || "Graphic Design Request",
        customer: d.customer || "General",
        designsCount: Number(d.designsCustomerCreative || d.productArtworkNos) || 1,
        dueDate: d.sampleRequiredDate || d.targetArtworkDateCreative || "Standard SLA",
        status: d.status || "Creative",
        isBrief: false as const,
        rawReq: d,
      })),
    ];

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      combined = combined.filter(
        (item) =>
          item.refCode.toLowerCase().includes(q) ||
          item.title.toLowerCase().includes(q) ||
          item.customer.toLowerCase().includes(q)
      );
    }

    return combined.slice(0, 6);
  }, [briefs, designRequests, searchTerm]);

  // Filtered recent combined sampling & mockup items
  const recentSamplingMockups = useMemo(() => {
    let items = [...samplingMockupRequests];
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      items = items.filter(
        (r) =>
          (r.srNumber || "").toLowerCase().includes(q) ||
          (r.productDescription || "").toLowerCase().includes(q) ||
          (r.customer || "").toLowerCase().includes(q)
      );
    }
    return items.slice(0, 6);
  }, [samplingMockupRequests, searchTerm]);

  const handleExportCSV = () => {
    const headers = ["Ref Code", "Title", "Customer", "Designs", "Status", "Due Date"];
    const rows = recentDesigns.map((d) => [
      `"${d.refCode}"`,
      `"${d.title}"`,
      `"${d.customer}"`,
      `"${d.designsCount}"`,
      `"${d.status}"`,
      `"${d.dueDate}"`,
    ]);
    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `creative_overview_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#f8f9ff] dark:bg-[#0c0d14] p-6 space-y-6 select-text">
      {/* ── 1. Identity Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Palette className="w-4 h-4 text-[#006d32] dark:text-[#00d166]" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#006d32] dark:text-[#00d166]">
              Creative HQ — Graphic Design &amp; Brand Command
            </span>
            <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-[#006d32] dark:text-[#00d166] border border-emerald-200/60 dark:border-emerald-800/40">
              FY {selectedYear === "ALL" ? "Consolidated" : selectedYear}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Creative Overview Dashboard
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
            Graphic assets, brand design briefs, and unified sampling &amp; CAD mockup requests across all accounts.
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#12141d] hover:bg-slate-50 dark:hover:bg-zinc-800 text-xs font-semibold text-slate-700 dark:text-zinc-200 shadow-sm transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* ── 2. KPI Cards (5-Column Grid Aligned to App Theme) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        {/* Total Intake */}
        <div className="p-4 rounded-2xl border border-slate-200/70 dark:border-white/[0.08] bg-white dark:bg-[#12141d] shadow-sm card-hover-lift">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
              Total Intake
            </span>
            <Activity className="w-4 h-4 text-[#006d32] dark:text-[#00d166]" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
            {isLoading ? "—" : totalPipelineCount}
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">Designs &amp; mockups</div>
        </div>

        {/* Active Design Briefs */}
        <button
          type="button"
          onClick={() => onNavigateToTab("design")}
          className="p-4 rounded-2xl border border-slate-200/70 dark:border-white/[0.08] bg-white dark:bg-[#12141d] hover:border-[#006d32]/60 text-left transition cursor-pointer shadow-sm hover:shadow-md group card-hover-lift"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
              Design Briefs
            </span>
            <Palette className="w-4 h-4 text-[#006d32] dark:text-[#00d166] group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
            {isLoading ? "—" : totalDesignCount}
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-[11px] text-slate-500 font-medium">Artworks &amp; covers</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#006d32] transition-colors" />
          </div>
        </button>

        {/* Sampling & Mockups Queue */}
        <button
          type="button"
          onClick={() => onNavigateToTab("sampling")}
          className="p-4 rounded-2xl border border-slate-200/70 dark:border-white/[0.08] bg-white dark:bg-[#12141d] hover:border-emerald-500/60 text-left transition cursor-pointer shadow-sm hover:shadow-md group card-hover-lift"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
              Sampling &amp; Mockup
            </span>
            <Box className="w-4 h-4 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
            {isLoading ? "—" : totalSamplingMockupCount}
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-[11px] text-slate-500 font-medium">Combined queue</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 transition-colors" />
          </div>
        </button>

        {/* In Review */}
        <button
          type="button"
          onClick={() => onNavigateToTab("design")}
          className="p-4 rounded-2xl border border-slate-200/70 dark:border-white/[0.08] bg-white dark:bg-[#12141d] hover:border-amber-500/60 text-left transition cursor-pointer shadow-sm hover:shadow-md group card-hover-lift"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
              Client Review
            </span>
            <Clock className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
            {isLoading ? "—" : inReviewCount}
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
              Proof sign-off pending
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-500 transition-colors" />
          </div>
        </button>

        {/* Prepress Certified */}
        <div className="p-4 rounded-2xl border border-slate-200/70 dark:border-white/[0.08] bg-white dark:bg-[#12141d] shadow-sm card-hover-lift">

          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
              Prepress Certified
            </span>
            <CheckCircle2 className="w-4 h-4 text-[#006d32] dark:text-[#00d166]" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
            {isLoading ? "—" : prepressApprovedCount}
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
            CMYK &amp; bleed verified
          </div>
        </div>
      </div>


      {/* ── 4. Two Data Tables: Design Projects vs Sampling & Mockup Queue ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left: Active Design Projects */}
        <div className="bg-white dark:bg-[#12141d] rounded-2xl border border-slate-200/70 dark:border-white/[0.08] shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 dark:border-white/[0.08] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-[#006d32] dark:text-[#00d166]" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Active Design Projects ({recentDesigns.length})
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigateToTab("design")}
              className="text-xs font-semibold text-[#006d32] dark:text-[#00d166] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/70 dark:bg-zinc-900/60 text-[11px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider border-b border-slate-100 dark:border-white/[0.08]">
                <tr>
                  <th className="py-2.5 px-3">Ref Code</th>
                  <th className="py-2.5 px-3">Project Title</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3 text-center">Variants</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                {recentDesigns.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => {
                      if (item.isBrief && item.rawBrief) onInspectBrief(item.rawBrief);
                      else if (!item.isBrief && item.rawReq) onInspectRequest(item.rawReq);
                    }}
                    className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/40 transition cursor-pointer"
                  >
                    <td className="py-2.5 px-3 font-mono font-bold text-[#006d32] dark:text-[#00d166] whitespace-nowrap">
                      {item.refCode}
                    </td>
                    <td className="py-2.5 px-3 text-slate-900 dark:text-zinc-100 font-medium max-w-[160px] truncate">
                      {item.title}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 dark:text-zinc-400 whitespace-nowrap">
                      {item.customer}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-[11px] font-semibold">
                        {item.designsCount}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <StatusPill status={item.status} size="sm" />
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <span className="text-[11px] font-semibold text-[#006d32] dark:text-[#00d166] hover:underline">
                        Open
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Sampling & Mockup Unified Queue */}
        <div className="bg-white dark:bg-[#12141d] rounded-2xl border border-slate-200/70 dark:border-white/[0.08] shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 dark:border-white/[0.08] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Box className="w-4 h-4 text-[#006d32] dark:text-[#00d166]" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Sampling &amp; Mockup Queue ({recentSamplingMockups.length})
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigateToTab("sampling")}
              className="text-xs font-semibold text-[#006d32] dark:text-[#00d166] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/70 dark:bg-zinc-900/60 text-[11px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider border-b border-slate-100 dark:border-white/[0.08]">
                <tr>
                  <th className="py-2.5 px-3">SR Code</th>
                  <th className="py-2.5 px-3">Sample Title</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">Deliverables</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                {recentSamplingMockups.map((r) => {
                  const scopes = r.requestTypes || [];
                  const hasMockup = scopes.includes("mockup") || r.mockupRequired === "Yes";
                  const hasSample = scopes.includes("sample");

                  return (
                    <tr
                      key={r.id}
                      onClick={() => onInspectRequest(r)}
                      className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/40 transition cursor-pointer"
                    >
                      <td className="py-2.5 px-3 font-mono font-bold text-[#006d32] dark:text-[#00d166] whitespace-nowrap">
                        {r.srNumber || `SR-${r.id}`}
                      </td>
                      <td className="py-2.5 px-3 text-slate-900 dark:text-zinc-100 font-medium max-w-[160px] truncate">
                        {r.productDescription || (r as any).opportunityName || "Sample Dummy"}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-zinc-400 whitespace-nowrap">
                        {r.customer || "General"}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {hasMockup && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200/80">
                              3D Mockup
                            </span>
                          )}
                          {hasSample && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                              Sample
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <StatusPill status={r.status || "Creative"} size="sm" />
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <span className="text-[11px] font-semibold text-[#006d32] dark:text-[#00d166] hover:underline">
                          Inspect
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreativeOverviewPage;
