import React, { useState, useMemo, useCallback } from "react";
import { UserProfile } from "@/features/auth";
import { SampleRequestItem } from "@/features/sample-requests/types";
import {
  cleanFeasibilityDescription,
  claimFeasibilityTaskApi,
  recordFeasibilitySampVerdictApi,
  recordFeasibilityViewedApi,
} from "@/infrastructure/api";
import { FeasibilityInspectorModal } from "@/features/sample-requests/components/FeasibilityInspectorModal";
import { StatusPill } from "@/components/ui/StatusPill";
import { formatOdooDate, formatOdooLogDate } from "@/features/sample-requests/utils/dateUtils";
import {
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  ClipboardCheck,
  ExternalLink,
  RefreshCw,
  Check,
  UserCheck,
  ShieldCheck,
  LayoutGrid,
  List as ListIcon,
  Download,
  Copy,
  Eye,
  Filter,
  Sparkles,
  ChevronRight,
  User,
  ArrowUpRight,
  Building2,
  ThumbsUp,
  Send,
} from "lucide-react";
import { CopyBadge } from "@/components/ui/CopyBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { WorkflowTabStrip } from "@/components/erp/WorkflowTabStrip";
import { exportRecordsToCsv } from "@/lib/csvExport";

export interface SampFeasibilityReviewPageProps {
  requests: SampleRequestItem[];
  isLoading: boolean;
  selectedYear: string;
  selectedPlant: string;
  uniquePlants: string[];
  uniqueCustomers: string[];
  user?: UserProfile | null;
  isAdmin: boolean;
  onRefresh: () => Promise<void>;
  showToast: (msg: string) => void;
}

type FeasibilityFilterTab =
  | "all"
  | "awaiting_claim"
  | "in_review"
  | "my_claimed"
  | "feasible"
  | "conditional"
  | "rejected"
  | "finalized";



export const SampFeasibilityReviewPage: React.FC<SampFeasibilityReviewPageProps> = ({
  requests,
  isLoading,
  selectedYear,
  selectedPlant,
  uniquePlants,
  uniqueCustomers,
  user,
  isAdmin,
  onRefresh,
  showToast,
}) => {
  const [filterTab, setFilterTab] = useState<FeasibilityFilterTab>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [customerFilter, setCustomerFilter] = useState("all");
  const [plantFilter, setPlantFilter] = useState("all");
  const [selectedRequest, setSelectedRequest] = useState<SampleRequestItem | null>(null);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [claimingId, setClaimingId] = useState<string | number | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filter requests to only feasibility checks
  const feasibilityRequests = useMemo(() => {
    return requests.filter((r) => {
      const mode = String(r.creationMode || "").toLowerCase();
      const kind = String(r.requestKind || "").toLowerCase();
      const mat = String(r.materialCode || "").toLowerCase();
      const sr = String(r.srNumber || "").toLowerCase();
      const idStr = String(r.id || "");
      return (
        kind === "feasibility" ||
        idStr.startsWith("feasibility-") ||
        mode === "feasibility_check" ||
        mode === "feasibility" ||
        mat.startsWith("fc-") ||
        sr.startsWith("fc-") ||
        sr.startsWith("fs-") ||
        Boolean(r.feasibilityType) ||
        Boolean(r.customFeasibilityType)
      );
    });
  }, [requests]);

  // Metric Ribbon Calculations (Odoo Live KPI Counters)
  const metrics = useMemo(() => {
    const total = feasibilityRequests.length;
    const awaitingClaim = feasibilityRequests.filter(
      (r) => !r.takenBySamp && !r.samplingFeasibilityResponse
    ).length;
    const inReview = feasibilityRequests.filter(
      (r) => r.takenBySamp && !r.samplingFeasibilityResponse
    ).length;
    const myClaimed = feasibilityRequests.filter(
      (r) =>
        r.takenBySamp &&
        user?.name &&
        r.takenBySamp.toLowerCase() === user.name.toLowerCase() &&
        !r.samplingFeasibilityResponse
    ).length;
    const feasible = feasibilityRequests.filter(
      (r) => r.samplingFeasibilityResponse === "Yes"
    ).length;
    const conditional = feasibilityRequests.filter(
      (r) => r.samplingFeasibilityResponse === "Maybe"
    ).length;
    const rejected = feasibilityRequests.filter(
      (r) => r.samplingFeasibilityResponse === "No"
    ).length;

    // SLA On-time rate
    const evaluatedWithSla = feasibilityRequests.filter(
      (r) => Boolean(r.samplingFeasibilityResponse) && r.isRespondedOnTime !== null && r.isRespondedOnTime !== undefined
    );
    const onTimeCount = evaluatedWithSla.filter((r) => r.isRespondedOnTime === true).length;
    const slaPercent = evaluatedWithSla.length > 0 ? Math.round((onTimeCount / evaluatedWithSla.length) * 100) : 100;

    return {
      total,
      awaitingClaim,
      inReview,
      myClaimed,
      feasible,
      conditional,
      rejected,
      slaPercent,
    };
  }, [feasibilityRequests, user?.name]);

  // Tab count helper
  const tabCounts = useMemo(() => {
    return {
      all: feasibilityRequests.length,
      awaiting_claim: metrics.awaitingClaim,
      in_review: metrics.inReview,
      my_claimed: metrics.myClaimed,
      feasible: metrics.feasible,
      conditional: metrics.conditional,
      rejected: metrics.rejected,
      finalized: feasibilityRequests.filter((r) => Boolean(r.marketingDecision)).length,
    };
  }, [feasibilityRequests, metrics]);

  const sampReviewTabs = useMemo(
    () => [
      { id: "all", label: "All Feasibility", count: tabCounts.all },
      { id: "awaiting_claim", label: "Awaiting Claim", count: tabCounts.awaiting_claim },
      { id: "in_review", label: "Under Review", count: tabCounts.in_review },
      { id: "my_claimed", label: "Claimed by Me", count: tabCounts.my_claimed },
      { id: "feasible", label: "Feasible", count: tabCounts.feasible },
      { id: "conditional", label: "Conditional", count: tabCounts.conditional },
      { id: "rejected", label: "Rejected", count: tabCounts.rejected },
    ],
    [tabCounts]
  );

  // Filtered requests based on active tab, search, and filters
  const filteredRequests = useMemo(() => {
    return feasibilityRequests.filter((r) => {
      // Tab filter
      if (filterTab === "awaiting_claim" && (r.takenBySamp || r.samplingFeasibilityResponse)) return false;
      if (filterTab === "in_review" && (!r.takenBySamp || r.samplingFeasibilityResponse)) return false;
      if (filterTab === "my_claimed") {
        if (!r.takenBySamp || r.samplingFeasibilityResponse) return false;
        if (!user?.name || r.takenBySamp.toLowerCase() !== user.name.toLowerCase()) return false;
      }
      if (filterTab === "feasible" && r.samplingFeasibilityResponse !== "Yes") return false;
      if (filterTab === "conditional" && r.samplingFeasibilityResponse !== "Maybe") return false;
      if (filterTab === "rejected" && r.samplingFeasibilityResponse !== "No") return false;
      if (filterTab === "finalized" && !r.marketingDecision) return false;

      // Customer filter
      if (customerFilter !== "all" && r.customer !== customerFilter) return false;

      // Plant filter
      if (plantFilter !== "all" && r.targetPlant !== plantFilter) return false;

      // Search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesCode = (r.materialCode || "").toLowerCase().includes(term);
        const matchesSr = (r.srNumber || "").toLowerCase().includes(term);
        const matchesCust = (r.customer || "").toLowerCase().includes(term);
        const matchesDesc = (r.productDescription || "").toLowerCase().includes(term);
        const matchesEng = (r.takenBySamp || "").toLowerCase().includes(term);
        const matchesType = (r.customFeasibilityType || r.feasibilityType || "").toLowerCase().includes(term);
        return matchesCode || matchesSr || matchesCust || matchesDesc || matchesEng || matchesType;
      }

      return true;
    });
  }, [feasibilityRequests, filterTab, customerFilter, plantFilter, searchTerm, user?.name]);

  // Inspect Request
  const handleOpenInspect = (req: SampleRequestItem) => {
    recordFeasibilityViewedApi(req.id).catch(() => {});
    setSelectedRequest(req);
    setIsInspectorOpen(true);
  };

  // 1-Click Inline Claim Task
  const handleInlineClaim = async (req: SampleRequestItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (claimingId) return;
    setClaimingId(req.id);
    try {
      const updated = await claimFeasibilityTaskApi(req.id);
      showToast(`Task ${req.materialCode || req.srNumber} claimed by ${user?.name || "you"}.`);
      await onRefresh();
    } catch (err) {
      console.error("Failed to claim task:", err);
      showToast(err instanceof Error ? err.message : "Failed to claim task");
    } finally {
      setClaimingId(null);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const dateStr = new Date().toISOString().split("T")[0];
    exportRecordsToCsv({
      filename: `SAMP_Feasibility_Review_${dateStr}.csv`,
      columns: [
        { header: "Request Code", accessor: (r) => r.materialCode || "" },
        { header: "SR Number", accessor: (r) => r.srNumber || "" },
        { header: "Customer", accessor: (r) => r.customer || "" },
        { header: "Feasibility Category", accessor: (r) => r.customFeasibilityType || r.feasibilityType || "New Category" },
        { header: "Target Date", accessor: (r) => r.sampleRequiredDate || "" },
        { header: "Claimed By (SAMP)", accessor: (r) => r.takenBySamp || "Unclaimed" },
        { header: "Technical Verdict", accessor: (r) => r.samplingFeasibilityResponse || "Pending" },
        { header: "Verdict Remark", accessor: (r) => r.samplingFeasibilityRemark || "" },
        { header: "Marketing Decision", accessor: (r) => r.marketingDecision || "Pending" },
        { header: "Created Date", accessor: (r) => r.dateRequestCreated || r.createdAt || "" },
      ],
      data: filteredRequests,
    });
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#F8F9FA] dark:bg-[#0b0c10] select-text">
      {/* ── Compact Page Header ── */}
      <div className="bg-white dark:bg-[#12141d] border-b border-[#E2E8F0] dark:border-white/[0.08] px-6 py-3 shrink-0">
        <div className="flex items-center justify-between gap-4">
          {/* Title + badge */}
          <div className="flex items-center gap-2.5 min-w-0">
            <h1 className="text-sm font-bold text-neutral-900 dark:text-white truncate">
              Technical Feasibility Evaluation Workbench
            </h1>
            <span className="shrink-0 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#017E84]/10 text-[#017E84] dark:bg-teal-950/40 dark:text-teal-300 border border-[#017E84]/20">
              SAMP Team
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onRefresh}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-[#CED4DA] dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-neutral-50 dark:hover:bg-zinc-700 text-xs font-semibold text-neutral-700 dark:text-zinc-200 shadow-2xs transition cursor-pointer disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-[#017E84]" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              disabled={filteredRequests.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-[#CED4DA] dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-neutral-50 dark:hover:bg-zinc-700 text-xs font-semibold text-neutral-700 dark:text-zinc-200 shadow-2xs transition cursor-pointer disabled:opacity-50"
              title="Export CSV"
            >
              <Download className="w-3.5 h-3.5 text-neutral-500" />
              <span className="hidden sm:inline">Export</span>
            </button>

          </div>
        </div>


        {/* ── KPI Metric Cards Ribbon ── */}

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5 mt-3 pt-3 border-t border-[#F1F5F9] dark:border-white/[0.05]">
          {/* Card 1: Total Queue */}
          <div
            onClick={() => setFilterTab("all")}
            className={`p-2.5 rounded-lg border transition cursor-pointer ${
              filterTab === "all"
                ? "border-[#714B67] bg-[#714B67]/5 dark:bg-[#714B67]/20 shadow-2xs"
                : "border-[#E2E8F0] dark:border-white/[0.06] bg-neutral-50/60 dark:bg-zinc-900/40 hover:border-neutral-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] uppercase font-bold text-neutral-500 dark:text-zinc-400 font-mono tracking-wider">
                Total Intake
              </span>
              <ClipboardCheck className="w-3.5 h-3.5 text-neutral-400" />
            </div>
            <div className="text-xl font-bold font-mono text-neutral-900 dark:text-zinc-100 mt-0.5">
              {metrics.total}
            </div>
            <div className="text-[10px] text-neutral-400 font-mono">From Marketing</div>
          </div>

          {/* Card 2: Awaiting SAMP Claim */}
          <div
            onClick={() => setFilterTab("awaiting_claim")}
            className={`p-2.5 rounded-lg border transition cursor-pointer ${
              filterTab === "awaiting_claim"
                ? "border-amber-400 bg-amber-500/10 dark:bg-amber-950/30 shadow-2xs"
                : "border-[#E2E8F0] dark:border-white/[0.06] bg-neutral-50/60 dark:bg-zinc-900/40 hover:border-amber-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] uppercase font-bold text-amber-700 dark:text-amber-300 font-mono tracking-wider">
                Needs Claim
              </span>
              <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="text-xl font-bold font-mono text-amber-900 dark:text-amber-200 mt-0.5">
              {metrics.awaitingClaim}
            </div>
            <div className="text-[10px] text-amber-700/80 dark:text-amber-400/80 font-mono">
              Unclaimed Tasks
            </div>
          </div>

          {/* Card 3: In Technical Review */}
          <div
            onClick={() => setFilterTab("in_review")}
            className={`p-2.5 rounded-lg border transition cursor-pointer ${
              filterTab === "in_review"
                ? "border-sky-400 bg-sky-500/10 dark:bg-sky-950/30 shadow-2xs"
                : "border-[#E2E8F0] dark:border-white/[0.06] bg-neutral-50/60 dark:bg-zinc-900/40 hover:border-sky-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] uppercase font-bold text-sky-700 dark:text-sky-300 font-mono tracking-wider">
                Under Review
              </span>
              <UserCheck className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
            </div>
            <div className="text-xl font-bold font-mono text-sky-900 dark:text-sky-200 mt-0.5">
              {metrics.inReview}
            </div>
            <div className="text-[10px] text-sky-700/80 dark:text-sky-400/80 font-mono">
              Claimed in Lab
            </div>
          </div>

          {/* Card 4: Feasible (Yes) */}
          <div
            onClick={() => setFilterTab("feasible")}
            className={`p-2.5 rounded-lg border transition cursor-pointer ${
              filterTab === "feasible"
                ? "border-emerald-400 bg-emerald-500/10 dark:bg-emerald-950/30 shadow-2xs"
                : "border-[#E2E8F0] dark:border-white/[0.06] bg-neutral-50/60 dark:bg-zinc-900/40 hover:border-emerald-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] uppercase font-bold text-emerald-700 dark:text-emerald-300 font-mono tracking-wider">
                Feasible (Yes)
              </span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="text-xl font-bold font-mono text-emerald-900 dark:text-emerald-200 mt-0.5">
              {metrics.feasible}
            </div>
            <div className="text-[10px] text-emerald-700/80 dark:text-emerald-400/80 font-mono">
              Ready for Sample
            </div>
          </div>

          {/* Card 5: Conditional (Maybe) */}
          <div
            onClick={() => setFilterTab("conditional")}
            className={`p-2.5 rounded-lg border transition cursor-pointer ${
              filterTab === "conditional"
                ? "border-amber-400 bg-amber-500/10 dark:bg-amber-950/30 shadow-2xs"
                : "border-[#E2E8F0] dark:border-white/[0.06] bg-neutral-50/60 dark:bg-zinc-900/40 hover:border-amber-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] uppercase font-bold text-amber-700 dark:text-amber-300 font-mono tracking-wider">
                Conditional
              </span>
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="text-xl font-bold font-mono text-amber-900 dark:text-amber-200 mt-0.5">
              {metrics.conditional}
            </div>
            <div className="text-[10px] text-amber-700/80 dark:text-amber-400/80 font-mono">
              Remarks Attached
            </div>
          </div>

          {/* Card 6: SLA Response Compliance */}
          <div className="p-2.5 rounded-lg border border-[#E2E8F0] dark:border-white/[0.06] bg-neutral-50/60 dark:bg-zinc-900/40">
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] uppercase font-bold text-neutral-500 dark:text-zinc-400 font-mono tracking-wider">
                SLA Compliance
              </span>
              <ShieldCheck className="w-3.5 h-3.5 text-[#017E84]" />
            </div>
            <div className="text-xl font-bold font-mono text-[#017E84] dark:text-teal-400 mt-0.5">
              {metrics.slaPercent}%
            </div>
            <div className="text-[10px] text-neutral-400 font-mono">Evaluated on time</div>
          </div>
        </div>
      </div>

      {/* ── Search & Filter Pill Control Strip ── */}
      <div className="bg-white dark:bg-[#12141d] border-b border-[#E2E8F0] dark:border-white/[0.08] px-6 py-2.5 shrink-0 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Odoo Segmented Filter Pills */}
        <WorkflowTabStrip
          tabs={sampReviewTabs}
          activeTab={filterTab}
          onSelectTab={(id) => setFilterTab(id as FeasibilityFilterTab)}
          compact
        />

        {/* Right: Search & Dropdown Filters */}
        <div className="flex items-center gap-2 flex-1 sm:flex-initial justify-end">
          {/* Customer Filter */}
          {uniqueCustomers.length > 0 && (
            <select
              value={customerFilter}
              onChange={(e) => setCustomerFilter(e.target.value)}
              className="h-8 px-2.5 rounded border border-[#CED4DA] dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-neutral-700 dark:text-zinc-200 focus:outline-none focus:border-[#714B67]"
            >
              <option value="all">All Customers</option>
              {uniqueCustomers.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}

          {/* Search Box */}
          <div className="relative min-w-[200px] max-w-xs flex-1 group">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#006d32] transition-colors pointer-events-none" />
            <input
              type="text"
              placeholder="Search SR, Code, Customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-9 pl-9 pr-8 rounded-xl bg-slate-50/50 hover:bg-slate-100/50 focus:bg-white text-xs font-medium text-slate-800 placeholder:text-slate-400 border border-slate-200/80 focus:border-[#006d32]/40 focus:outline-none focus:ring-4 focus:ring-[#006d32]/[0.08] shadow-2xs transition-all"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/80 transition-colors cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Main Work Area ── */}
      <div className="flex-1 overflow-y-auto p-6">
        {filteredRequests.length === 0 ? (
          <EmptyState
            icon={ClipboardCheck}
            title="No Feasibility Tasks Found"
            description={
              searchTerm || customerFilter !== "all" || filterTab !== "all"
                ? "No tasks match your active filter criteria. Try resetting your search or selecting another tab."
                : "There are currently no feasibility check requests submitted by Marketing in this category."
            }
            onResetFilters={
              searchTerm || customerFilter !== "all" || filterTab !== "all"
                ? () => {
                    setSearchTerm("");
                    setCustomerFilter("all");
                    setFilterTab("all");
                  }
                : undefined
            }
          />
        ) : (
            /* ── Table View (Authentic Odoo Master Sheet) ── */
            <div className="bg-white dark:bg-[#12141d] rounded-lg border border-[#CED4DA] dark:border-white/[0.08] shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#E2E8F0] dark:border-white/[0.08] bg-[#F8F9FA] dark:bg-zinc-900/60 text-neutral-500 dark:text-zinc-400 font-mono text-[11px] uppercase tracking-wider select-none">
                    <th className="py-2.5 px-4 font-semibold">Request / SR</th>
                    <th className="py-2.5 px-4 font-semibold">Product Classification</th>
                    <th className="py-2.5 px-4 font-semibold">Customer</th>
                    <th className="py-2.5 px-4 font-semibold">Target SLA Date</th>
                    <th className="py-2.5 px-4 font-semibold">SAMP Claim Status</th>
                    <th className="py-2.5 px-4 font-semibold">Technical Verdict</th>
                    <th className="py-2.5 px-4 font-semibold">Marketing Decision</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Evaluation Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9] dark:divide-white/[0.04]">
                  {filteredRequests.map((req) => {
                    const cleanDesc = cleanFeasibilityDescription(
                      req.feasibilityDescription || req.productDescription
                    );
                    const category =
                      req.customFeasibilityType ||
                      (req.feasibilityType
                        ? req.feasibilityType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
                        : "New Category");
                    const hasLink =
                      req.referenceLinks && req.referenceLinks.length > 0;
                    const hasPhotos =
                      req.referenceImages && req.referenceImages.length > 0;
                    const isClaimedByMe =
                      req.takenBySamp &&
                      user?.name &&
                      req.takenBySamp.toLowerCase() === user.name.toLowerCase();

                    return (
                      <tr
                        key={req.id}
                        onClick={() => handleOpenInspect(req)}
                        className="hover:bg-neutral-50/80 dark:hover:bg-white/[0.02] transition-colors cursor-pointer group"
                      >
                        {/* Request Code & SR Number */}
                        <td className="py-3 px-4 font-mono font-bold whitespace-nowrap">
                          <CopyBadge text={req.materialCode || req.srNumber} />
                          {req.srNumber && req.materialCode && req.srNumber !== req.materialCode && (
                            <div className="text-[10.5px] font-normal text-neutral-400 font-mono mt-0.5">
                              {req.srNumber}
                            </div>
                          )}
                        </td>

                        {/* Product Scope / Classification */}
                        <td className="py-3 px-4 max-w-xs">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-[#714B67]/10 text-[#714B67] dark:bg-purple-950/40 dark:text-purple-300 border border-[#714B67]/20">
                              {category}
                            </span>
                            {hasPhotos && (
                              <span className="text-[10px] text-neutral-400 font-mono">
                                📷 {req.referenceImages?.length}
                              </span>
                            )}
                            {hasLink && (
                              <span className="text-[10px] text-[#017E84] font-mono flex items-center gap-0.5">
                                <ExternalLink className="w-2.5 h-2.5" />
                                {req.referenceLinks?.length}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-neutral-800 dark:text-zinc-200 truncate font-sans font-medium" title={cleanDesc}>
                            {cleanDesc || "Custom feasibility evaluation requested."}
                          </div>
                        </td>

                        {/* Customer */}
                        <td className="py-3 px-4 font-semibold text-neutral-900 dark:text-zinc-100 whitespace-nowrap">
                          {req.customer || "Unassigned Client"}
                        </td>

                        {/* Target SLA Date */}
                        <td className="py-3 px-4 whitespace-nowrap font-mono text-xs">
                          <div className="text-neutral-800 dark:text-zinc-200 font-medium">
                            {formatOdooDate(req.sampleRequiredDate || req.dateRequestCreated)}
                          </div>
                          <div className="text-[10px] text-neutral-400">
                            Raised: {formatOdooDate(req.dateRequestCreated || req.createdAt)}
                          </div>
                        </td>

                        {/* SAMP Claim Status */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          {req.takenBySamp ? (
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-semibold border ${
                                  isClaimedByMe
                                    ? "bg-purple-50 text-purple-800 border-purple-300 dark:bg-purple-950/40 dark:text-purple-300"
                                    : "bg-neutral-100 text-neutral-700 border-neutral-300 dark:bg-zinc-800 dark:text-zinc-300"
                                }`}
                              >
                                <User className="w-3 h-3" />
                                <span>{req.takenBySamp}</span>
                              </span>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => handleInlineClaim(req, e)}
                              disabled={claimingId === req.id}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 text-[11px] font-bold font-mono transition shadow-2xs cursor-pointer active:scale-95"
                              title="Click to claim this task for evaluation"
                            >
                              <Clock className="w-3 h-3 text-amber-600" />
                              <span>{claimingId === req.id ? "Claiming..." : "Claim Task"}</span>
                            </button>
                          )}
                        </td>

                        {/* Technical Verdict */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          {req.samplingFeasibilityResponse === "Yes" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold font-mono bg-emerald-50 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Feasible (Yes)</span>
                            </span>
                          ) : req.samplingFeasibilityResponse === "Maybe" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold font-mono bg-amber-50 text-amber-800 border border-amber-300 dark:bg-amber-950/40 dark:text-amber-300">
                              <AlertTriangle className="w-3 h-3 text-amber-600" />
                              <span>Conditional (Maybe)</span>
                            </span>
                          ) : req.samplingFeasibilityResponse === "No" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold font-mono bg-rose-50 text-rose-800 border border-rose-300 dark:bg-rose-950/40 dark:text-rose-300">
                              <XCircle className="w-3 h-3 text-rose-600" />
                              <span>Not Feasible (No)</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono text-neutral-500 bg-neutral-100 dark:bg-zinc-800 border border-neutral-200 dark:border-zinc-700">
                              <Clock className="w-3 h-3" />
                              <span>Pending Verdict</span>
                            </span>
                          )}
                        </td>

                        {/* Marketing Decision */}
                        <td className="py-3 px-4 whitespace-nowrap font-mono text-xs">
                          {req.marketingDecision === "Accepted" ? (
                            <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              <span>Marketing Accepted</span>
                            </span>
                          ) : req.marketingDecision === "Rejected" ? (
                            <span className="text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1">
                              <XCircle className="w-3 h-3" />
                              <span>Marketing Rejected</span>
                            </span>
                          ) : (
                            <span className="text-neutral-400">Awaiting Sign-off</span>
                          )}
                        </td>

                        {/* Action */}
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenInspect(req);
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-white dark:bg-zinc-800 hover:bg-[#017E84] hover:text-white border border-[#CED4DA] dark:border-zinc-700 hover:border-[#017E84] text-xs font-semibold text-neutral-700 dark:text-zinc-200 transition shadow-2xs cursor-pointer group-hover:border-[#017E84]"
                          >
                            <ClipboardCheck className="w-3.5 h-3.5 text-[#017E84] group-hover:text-white" />
                            <span>{req.samplingFeasibilityResponse ? "View Verdict" : "Inspect & Evaluate"}</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Table Footer info */}
            <div className="px-4 py-2.5 bg-[#F8F9FA] dark:bg-zinc-900/60 border-t border-[#E2E8F0] dark:border-white/[0.08] flex items-center justify-between text-xs text-neutral-500 font-mono">
              <span>Showing {filteredRequests.length} of {feasibilityRequests.length} feasibility tasks</span>
              <span>Sorted by Latest Raised Intake</span>
            </div>
          </div>
        )}
      </div>

      {/* ── SAMP Technical Inspector & Verdict Modal ── */}
      {selectedRequest && (
        <FeasibilityInspectorModal
          request={selectedRequest}
          isOpen={isInspectorOpen}
          onClose={() => {
            setIsInspectorOpen(false);
            onRefresh();
          }}
          user={user}
          isAdmin={isAdmin}
          sourceDesk="samp"
        />
      )}
    </div>
  );
};

export default SampFeasibilityReviewPage;
