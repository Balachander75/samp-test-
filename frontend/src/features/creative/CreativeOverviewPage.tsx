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
    <div className="flex-1 overflow-y-auto bg-[#F8F9FA] dark:bg-[#0b0c10] p-6 space-y-5 select-text">
      {/* ── 1. Identity Header (Aligned to Marketing Overview Standards) ── */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <Palette className="w-4 h-4 text-[#714B67]" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#714B67]">
              Creative HQ — Graphic Design &amp; Brand Command
            </span>
            <span className="px-1.5 py-0.2 text-[10px] font-mono font-bold rounded bg-[#714B67]/10 text-[#714B67] border border-[#714B67]/20">
              FY {selectedYear === "ALL" ? "Consolidated" : selectedYear}
            </span>
          </div>
          <h1 className="text-xl font-bold text-neutral-900 dark:text-white tracking-tight">
            Creative Overview Dashboard
          </h1>
          <p className="text-xs text-neutral-500 dark:text-zinc-400 mt-0.5">
            Graphic assets, brand design briefs, and unified sampling &amp; CAD mockup requests across all accounts.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#CED4DA] dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-neutral-50 text-xs font-semibold text-neutral-700 dark:text-zinc-200 shadow-2xs transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-neutral-400" />
            <span>Export</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigateToTab("design")}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#017E84] hover:bg-[#00666A] text-white text-xs font-bold transition cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Design Brief</span>
          </button>
        </div>
      </div>

      {/* ── 2. KPI Cards (5-Column Grid Aligned to Marketing) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {/* Total Intake */}
        <div className="p-4 rounded-xl border border-[#CED4DA] dark:border-white/[0.08] bg-white dark:bg-[#12141d] shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-500">
              Total Intake
            </span>
            <Activity className="w-3.5 h-3.5 text-[#714B67]" />
          </div>
          <div className="text-2xl font-bold font-mono text-neutral-900 dark:text-white">
            {isLoading ? "—" : totalPipelineCount}
          </div>
          <div className="text-[10px] text-neutral-400 font-mono mt-0.5">Designs &amp; mockups</div>
        </div>

        {/* Active Design Briefs */}
        <button
          type="button"
          onClick={() => onNavigateToTab("design")}
          className="p-4 rounded-xl border border-[#CED4DA] dark:border-white/[0.08] bg-white dark:bg-[#12141d] hover:border-[#714B67] text-left transition cursor-pointer shadow-2xs group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-500">
              Design Briefs
            </span>
            <Palette className="w-3.5 h-3.5 text-[#714B67] group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold font-mono text-neutral-900 dark:text-white">
            {isLoading ? "—" : totalDesignCount}
          </div>
          <div className="flex items-center justify-between mt-0.5">
            <span className="text-[10px] text-neutral-400 font-mono">Artworks &amp; covers</span>
            <ChevronRight className="w-3 h-3 text-neutral-300 group-hover:text-[#714B67] transition-colors" />
          </div>
        </button>

        {/* Sampling & Mockups Queue */}
        <button
          type="button"
          onClick={() => onNavigateToTab("sampling")}
          className="p-4 rounded-xl border border-[#CED4DA] dark:border-white/[0.08] bg-white dark:bg-[#12141d] hover:border-[#017E84] text-left transition cursor-pointer shadow-2xs group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-500">
              Sampling &amp; Mockup
            </span>
            <Box className="w-3.5 h-3.5 text-[#017E84] group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold font-mono text-neutral-900 dark:text-white">
            {isLoading ? "—" : totalSamplingMockupCount}
          </div>
          <div className="flex items-center justify-between mt-0.5">
            <span className="text-[10px] text-neutral-400 font-mono">Combined queue</span>
            <ChevronRight className="w-3 h-3 text-neutral-300 group-hover:text-[#017E84] transition-colors" />
          </div>
        </button>

        {/* In Review */}
        <button
          type="button"
          onClick={() => onNavigateToTab("design")}
          className="p-4 rounded-xl border border-[#CED4DA] dark:border-white/[0.08] bg-white dark:bg-[#12141d] hover:border-amber-500 text-left transition cursor-pointer shadow-2xs group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-500">
              Client Review
            </span>
            <Clock className="w-3.5 h-3.5 text-amber-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold font-mono text-neutral-900 dark:text-white">
            {isLoading ? "—" : inReviewCount}
          </div>
          <div className="flex items-center justify-between mt-0.5">
            <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 font-semibold">
              Proof sign-off pending
            </span>
            <ChevronRight className="w-3 h-3 text-neutral-300 group-hover:text-amber-500 transition-colors" />
          </div>
        </button>

        {/* Prepress Certified */}
        <div className="p-4 rounded-xl border border-[#CED4DA] dark:border-white/[0.08] bg-white dark:bg-[#12141d] shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-500">
              Prepress Certified
            </span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-neutral-900 dark:text-white">
            {isLoading ? "—" : prepressApprovedCount}
          </div>
          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
            CMYK &amp; bleed verified
          </div>
        </div>
      </div>

      {/* ── 3. Dedicated Workstreams (Two Master Cards Aligned to Marketing) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Stream 1: Graphic Design */}
        <div
          onClick={() => onNavigateToTab("design")}
          className="group flex items-center justify-between p-4 bg-white dark:bg-[#12141d] rounded-xl border border-[#CED4DA] dark:border-white/[0.08] hover:border-[#714B67] hover:shadow-sm transition cursor-pointer overflow-hidden relative"
        >
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#714B67] rounded-l-xl" />
          <div className="pl-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-purple-50 dark:bg-purple-950/40 text-[#714B67] dark:text-purple-300 uppercase">
                Creative Workstream 01
              </span>
              <span className="text-[10px] font-mono text-neutral-400">{totalDesignCount} active briefs</span>
            </div>
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white group-hover:text-[#714B67] transition-colors">
              Graphic Design &amp; Artwork Workspace
            </h3>
            <p className="text-[11px] text-neutral-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
              Cover ideation, typography proofing, client feedback cycles, and CMYK color certifications.
            </p>
          </div>
          <div className="shrink-0 flex items-center gap-2 pl-4">
            <span className="text-xs font-semibold text-[#714B67] font-mono whitespace-nowrap">Open Desk</span>
            <ArrowRight className="w-4 h-4 text-[#714B67] group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        {/* Stream 2: Sampling & Mockup Queue */}
        <div
          onClick={() => onNavigateToTab("sampling")}
          className="group flex items-center justify-between p-4 bg-white dark:bg-[#12141d] rounded-xl border border-[#CED4DA] dark:border-white/[0.08] hover:border-[#017E84] hover:shadow-sm transition cursor-pointer overflow-hidden relative"
        >
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#017E84] rounded-l-xl" />
          <div className="pl-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-teal-50 dark:bg-teal-950/40 text-[#017E84] dark:text-teal-300 uppercase">
                Creative Workstream 02
              </span>
              <span className="text-[10px] font-mono text-neutral-400">{totalSamplingMockupCount} combined</span>
            </div>
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white group-hover:text-[#017E84] transition-colors">
              Sampling &amp; Mockup Unified Desk
            </h3>
            <p className="text-[11px] text-neutral-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
              Physical dummy sample manufacturing and 3D CAD mockup requests synchronized into a unified workflow.
            </p>
          </div>
          <div className="shrink-0 flex items-center gap-2 pl-4">
            <span className="text-xs font-semibold text-[#017E84] font-mono whitespace-nowrap">Open Desk</span>
            <ArrowRight className="w-4 h-4 text-[#017E84] group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
      </div>

      {/* ── 4. Two Data Tables: Design Projects vs Sampling & Mockup Queue ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left: Active Design Projects */}
        <div className="bg-white dark:bg-[#12141d] rounded-xl border border-[#CED4DA] dark:border-white/[0.08] shadow-2xs overflow-hidden flex flex-col">
          <div className="p-3.5 border-b border-[#E2E8F0] dark:border-white/[0.08] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-[#714B67]" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white font-mono">
                Active Design Projects ({recentDesigns.length})
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigateToTab("design")}
              className="text-xs font-semibold font-mono text-[#714B67] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8F9FA] dark:bg-zinc-900/80 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider border-b border-[#E2E8F0] dark:border-white/[0.08]">
                <tr>
                  <th className="py-2.5 px-3">Ref Code</th>
                  <th className="py-2.5 px-3">Project Title</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3 text-center">Variants</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9] dark:divide-white/[0.04]">
                {recentDesigns.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => {
                      if (item.isBrief && item.rawBrief) onInspectBrief(item.rawBrief);
                      else if (!item.isBrief && item.rawReq) onInspectRequest(item.rawReq);
                    }}
                    className="hover:bg-neutral-50/80 dark:hover:bg-zinc-800/40 transition cursor-pointer"
                  >
                    <td className="py-2.5 px-3 font-mono font-bold text-[#714B67] whitespace-nowrap">
                      {item.refCode}
                    </td>
                    <td className="py-2.5 px-3 text-neutral-900 dark:text-zinc-100 font-medium max-w-[160px] truncate">
                      {item.title}
                    </td>
                    <td className="py-2.5 px-3 text-neutral-600 dark:text-zinc-400 whitespace-nowrap">
                      {item.customer}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono">
                      <span className="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-zinc-800 text-[10.5px]">
                        {item.designsCount}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <StatusPill status={item.status} size="sm" />
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <span className="text-[11px] font-mono text-[#017E84] hover:underline font-semibold">
                        Inspect
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Sampling & Mockup Unified Queue */}
        <div className="bg-white dark:bg-[#12141d] rounded-xl border border-[#CED4DA] dark:border-white/[0.08] shadow-2xs overflow-hidden flex flex-col">
          <div className="p-3.5 border-b border-[#E2E8F0] dark:border-white/[0.08] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Box className="w-4 h-4 text-[#017E84]" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white font-mono">
                Sampling &amp; Mockup Queue ({recentSamplingMockups.length})
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigateToTab("sampling")}
              className="text-xs font-semibold font-mono text-[#017E84] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8F9FA] dark:bg-zinc-900/80 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider border-b border-[#E2E8F0] dark:border-white/[0.08]">
                <tr>
                  <th className="py-2.5 px-3">SR Code</th>
                  <th className="py-2.5 px-3">Sample Title</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">Deliverables</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9] dark:divide-white/[0.04]">
                {recentSamplingMockups.map((r) => {
                  const scopes = r.requestTypes || [];
                  const hasMockup = scopes.includes("mockup") || r.mockupRequired === "Yes";
                  const hasSample = scopes.includes("sample");

                  return (
                    <tr
                      key={r.id}
                      onClick={() => onInspectRequest(r)}
                      className="hover:bg-neutral-50/80 dark:hover:bg-zinc-800/40 transition cursor-pointer"
                    >
                      <td className="py-2.5 px-3 font-mono font-bold text-[#017E84] whitespace-nowrap">
                        {r.srNumber || `SR-${r.id}`}
                      </td>
                      <td className="py-2.5 px-3 text-neutral-900 dark:text-zinc-100 font-medium max-w-[160px] truncate">
                        {r.productDescription || (r as any).opportunityName || "Sample Dummy"}
                      </td>
                      <td className="py-2.5 px-3 text-neutral-600 dark:text-zinc-400 whitespace-nowrap">
                        {r.customer || "General"}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          {hasMockup && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-amber-50 text-amber-700 border border-amber-200/80">
                              3D Mockup
                            </span>
                          )}
                          {hasSample && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-teal-50 text-[#017E84] border border-teal-200/80">
                              Sample
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <StatusPill status={r.status || "Creative"} size="sm" />
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <span className="text-[11px] font-mono text-[#017E84] hover:underline font-semibold">
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
