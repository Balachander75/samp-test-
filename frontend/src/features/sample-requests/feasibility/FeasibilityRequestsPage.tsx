import React, { useState, useMemo } from "react";
import { UserProfile } from "@/features/auth";
import { SampleRequestItem } from "../types";
import { getRequestTrackType } from "../utils/trackTypes";
import { cleanFeasibilityDescription } from "@/infrastructure/api";
import { formatOdooDate } from "../utils/dateUtils";
import {
  Search,
  Plus,
  Download,
  Copy,
  Check,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  ClipboardCheck,
  ExternalLink,
  Calendar,
  RefreshCw,
  LayoutGrid,
  List as ListIcon,
  Zap,
  UserCheck,
  ShieldCheck,
  Package,
  Building2,
  Star,
  ThumbsUp,
  Send,
} from "lucide-react";
import { CopyBadge } from "@/components/ui/CopyBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { WorkflowTabStrip } from "@/components/erp/WorkflowTabStrip";

export interface FeasibilityRequestsPageProps {
  requests: SampleRequestItem[];
  isLoading: boolean;
  selectedYear: string;
  selectedPlant: string;
  uniquePlants: string[];
  uniqueCustomers: string[];
  user?: UserProfile | null;
  isAdmin: boolean;
  onOpenNewModal: () => void;
  onInspectRequest: (req: SampleRequestItem) => void;
  onMarketingApproveFeasibility: (
    requestId: string | number,
    approved: boolean,
    remark?: string
  ) => Promise<void>;
  onDeleteRequest: (req: SampleRequestItem, e?: React.MouseEvent) => Promise<void>;
  onBatchDelete: (selectedIds: Set<string | number>) => Promise<void>;
  onRefresh: () => Promise<void>;
  onExportCSV: () => void;
  onUpdateStatus?: (reqId: string | number, newStatus: string) => Promise<void>;
}

export type MarketingFeasibilityTab =
  | "all"
  | "awaiting_claim"
  | "in_review"
  | "awaiting_decision"
  | "feasible"
  | "conditional"
  | "approved"
  | "converted"
  | "rejected";



export const FeasibilityRequestsPage: React.FC<FeasibilityRequestsPageProps> = ({
  requests,
  isLoading,
  selectedYear,
  selectedPlant,
  uniquePlants,
  uniqueCustomers,
  user,
  isAdmin,
  onOpenNewModal,
  onInspectRequest,
  onMarketingApproveFeasibility,
  onDeleteRequest,
  onBatchDelete,
  onRefresh,
  onExportCSV,
  onUpdateStatus,
}) => {
  const [filterTab, setFilterTab] = useState<MarketingFeasibilityTab>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [customerFilter, setCustomerFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());

  // Only consider feasibility requests
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
        Boolean(r.customFeasibilityType) ||
        getRequestTrackType(r) === "feasibility_check"
      );
    });
  }, [requests]);

  // Telemetry metrics
  const metrics = useMemo(() => {
    const total = feasibilityRequests.length;
    let awaitingClaim = 0;
    let inReview = 0;
    let awaitingDecision = 0;
    let feasible = 0;
    let conditional = 0;
    let approved = 0;
    let converted = 0;
    let rejected = 0;

    feasibilityRequests.forEach((r) => {
      const hasSampVerdict = Boolean(r.samplingFeasibilityResponse);
      const dec = (r.marketingDecision || "").toLowerCase();
      const status = (r.status || "").toLowerCase();

      if (!r.takenBySamp && !hasSampVerdict) {
        awaitingClaim++;
      } else if (r.takenBySamp && !hasSampVerdict) {
        inReview++;
      }

      if (hasSampVerdict && !r.marketingDecision) {
        awaitingDecision++;
      }

      if (r.samplingFeasibilityResponse === "Yes") feasible++;
      if (r.samplingFeasibilityResponse === "Maybe") conditional++;

      if (dec === "accepted" || status.includes("approved")) {
        approved++;
      }
      if (dec === "rejected" || status.includes("rejected") || status.includes("closed")) {
        rejected++;
      }
      if (Boolean(r.convertedSrNumber || r.convertedSampleRequestId)) {
        converted++;
      }
    });

    // SLA compliance rate
    const evaluatedWithSla = feasibilityRequests.filter(
      (r) => Boolean(r.samplingFeasibilityResponse) && r.isRespondedOnTime !== null && r.isRespondedOnTime !== undefined
    );
    const onTimeCount = evaluatedWithSla.filter((r) => r.isRespondedOnTime === true).length;
    const slaPercent = evaluatedWithSla.length > 0 ? Math.round((onTimeCount / evaluatedWithSla.length) * 100) : 100;

    return {
      total,
      awaitingClaim,
      inReview,
      awaitingDecision,
      feasible,
      conditional,
      approved,
      converted,
      rejected,
      slaPercent,
    };
  }, [feasibilityRequests]);

  // Tab counts
  const tabCounts = useMemo(() => {
    return {
      all: feasibilityRequests.length,
      awaiting_claim: metrics.awaitingClaim,
      in_review: metrics.inReview,
      awaiting_decision: metrics.awaitingDecision,
      feasible: metrics.feasible,
      conditional: metrics.conditional,
      approved: metrics.approved,
      converted: metrics.converted,
      rejected: metrics.rejected,
    };
  }, [feasibilityRequests, metrics]);

  const feasibilityTabs = useMemo(
    () => [
      { id: "all", label: "All Feasibility", count: tabCounts.all },
      { id: "awaiting_claim", label: "Awaiting Claim", count: tabCounts.awaiting_claim },
      { id: "in_review", label: "Under Review", count: tabCounts.in_review },
      { id: "awaiting_decision", label: "Needs Decision", count: tabCounts.awaiting_decision },
      { id: "feasible", label: "Feasible", count: tabCounts.feasible },
      { id: "conditional", label: "Conditional", count: tabCounts.conditional },
      { id: "approved", label: "Approved", count: tabCounts.approved },
      { id: "converted", label: "In Sampling", count: tabCounts.converted },
      { id: "rejected", label: "Rejected", count: tabCounts.rejected },
    ],
    [tabCounts]
  );

  // Filtered requests
  const filteredRequests = useMemo(() => {
    return feasibilityRequests.filter((r) => {
      // Filter tab
      if (filterTab === "awaiting_claim") {
        if (r.takenBySamp || r.samplingFeasibilityResponse) return false;
      } else if (filterTab === "in_review") {
        if (!r.takenBySamp || r.samplingFeasibilityResponse) return false;
      } else if (filterTab === "awaiting_decision") {
        if (!r.samplingFeasibilityResponse || r.marketingDecision) return false;
      } else if (filterTab === "feasible") {
        if (r.samplingFeasibilityResponse !== "Yes") return false;
      } else if (filterTab === "conditional") {
        if (r.samplingFeasibilityResponse !== "Maybe") return false;
      } else if (filterTab === "approved") {
        const dec = (r.marketingDecision || "").toLowerCase();
        const st = (r.status || "").toLowerCase();
        if (dec !== "accepted" && !st.includes("approved")) return false;
      } else if (filterTab === "converted") {
        if (!r.convertedSrNumber && !r.convertedSampleRequestId) return false;
      } else if (filterTab === "rejected") {
        const dec = (r.marketingDecision || "").toLowerCase();
        const st = (r.status || "").toLowerCase();
        if (dec !== "rejected" && !st.includes("rejected") && !st.includes("closed")) return false;
      }

      // Customer filter
      if (customerFilter !== "all" && r.customer !== customerFilter) {
        return false;
      }

      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const sr = (r.srNumber || "").toLowerCase();
        const mat = (r.materialCode || "").toLowerCase();
        const desc = (r.productDescription || r.feasibilityDescription || "").toLowerCase();
        const cust = (r.customer || "").toLowerCase();
        const samp = (r.takenBySamp || "").toLowerCase();
        return sr.includes(q) || mat.includes(q) || desc.includes(q) || cust.includes(q) || samp.includes(q);
      }

      return true;
    });
  }, [feasibilityRequests, filterTab, customerFilter, searchTerm]);



  // Row selection
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
    if (selectedIds.size === filteredRequests.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredRequests.map((r) => r.id)));
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#F8F9FA] dark:bg-[#0b0c10] select-text">
      {/* ── Compact Page Header (Matched to SAMP Workbench) ── */}
      <div className="bg-white dark:bg-[#12141d] border-b border-[#E2E8F0] dark:border-white/[0.08] px-6 py-3 shrink-0">
        <div className="flex items-center justify-between gap-4">
          {/* Title + badge */}
          <div className="flex items-center gap-2.5 min-w-0">
            <h1 className="text-sm font-bold text-neutral-900 dark:text-white truncate">
              Technical Feasibility Evaluation Workbench
            </h1>
            <span className="shrink-0 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#714B67]/10 text-[#714B67] dark:bg-purple-950/40 dark:text-purple-300 border border-[#714B67]/20">
              Marketing Desk
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {/* New Feasibility Registration */}
            <button
              type="button"
              onClick={onOpenNewModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#017E84] hover:bg-[#00666A] text-white text-xs font-semibold shadow-xs transition active:scale-95 cursor-pointer"
              title="Register New Technical Feasibility Check"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New</span>
            </button>

            {/* Refresh */}
            <button
              type="button"
              onClick={onRefresh}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-[#CED4DA] dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-neutral-50 dark:hover:bg-zinc-700 text-xs font-semibold text-neutral-700 dark:text-zinc-200 shadow-2xs transition cursor-pointer disabled:opacity-50"
              title="Refresh Records"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-[#017E84]" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            {/* Export CSV */}
            <button
              type="button"
              onClick={onExportCSV}
              disabled={filteredRequests.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-[#CED4DA] dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-neutral-50 dark:hover:bg-zinc-700 text-xs font-semibold text-neutral-700 dark:text-zinc-200 shadow-2xs transition cursor-pointer disabled:opacity-50"
              title="Export CSV"
            >
              <Download className="w-3.5 h-3.5 text-neutral-500" />
              <span className="hidden sm:inline">Export</span>
            </button>

          </div>
        </div>

        {/* ── KPI Metric Cards Ribbon (Exact 6 Cards Matching SAMP Workbench) ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 mt-3 pt-3 border-t border-[#F1F5F9] dark:border-white/[0.05]">
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
              {isLoading ? "—" : metrics.total}
            </div>
            <div className="text-[10px] text-neutral-400 font-mono">From Marketing</div>
          </div>

          {/* Card 2: Needs Claim */}
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
              {isLoading ? "—" : metrics.awaitingClaim}
            </div>
            <div className="text-[10px] text-amber-700/80 dark:text-amber-400/80 font-mono">
              Unclaimed Tasks
            </div>
          </div>

          {/* Card 3: Under Review in Lab */}
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
              {isLoading ? "—" : metrics.inReview}
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
              {isLoading ? "—" : metrics.feasible}
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
              {isLoading ? "—" : metrics.conditional}
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

      {/* ── Search & Filter Pill Control Strip (Exact Matching SAMP Workbench) ── */}
      <div className="bg-white dark:bg-[#12141d] border-b border-[#E2E8F0] dark:border-white/[0.08] px-6 py-2.5 shrink-0 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Odoo Segmented Filter Pills */}
        <WorkflowTabStrip
          tabs={feasibilityTabs}
          activeTab={filterTab}
          onSelectTab={(id) => setFilterTab(id as MarketingFeasibilityTab)}
          compact
        />

        {/* Right: Search & Customer Filter */}
        <div className="flex items-center gap-2 flex-1 sm:flex-initial justify-end">
          {/* Batch delete button if items selected */}
          {selectedIds.size > 0 && isAdmin && (
            <button
              type="button"
              onClick={() => onBatchDelete(selectedIds)}
              className="h-8 px-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-semibold flex items-center gap-1 shadow-2xs cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete ({selectedIds.size})</span>
            </button>
          )}

          {/* Customer Filter Dropdown */}
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
          <div className="relative min-w-[200px] max-w-xs flex-1">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search SR, Code, Customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-8 pl-8 pr-7 rounded border border-[#CED4DA] dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-neutral-800 dark:text-zinc-200 placeholder:text-neutral-400 focus:outline-none focus:border-[#714B67]"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 text-xs cursor-pointer"
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
                ? "No feasibility requests match your active filter criteria. Try resetting your search or selecting another tab."
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
            /* ── Table View ── */
          <div className="bg-white dark:bg-[#12141d] rounded-lg border border-[#CED4DA] dark:border-white/[0.08] shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#E2E8F0] dark:border-white/[0.08] bg-[#F8F9FA] dark:bg-zinc-900/60 text-neutral-500 dark:text-zinc-400 font-mono text-[11px] uppercase tracking-wider select-none">
                    <th className="py-2.5 px-3 w-8">
                      <input
                        type="checkbox"
                        checked={selectedIds.size === filteredRequests.length && filteredRequests.length > 0}
                        onChange={handleToggleSelectAll}
                        className="rounded border-neutral-300 text-[#714B67] focus:ring-[#714B67]"
                      />
                    </th>
                    <th className="py-2.5 px-4 font-semibold">Request / SR</th>
                    <th className="py-2.5 px-4 font-semibold">Product Classification</th>
                    <th className="py-2.5 px-4 font-semibold">Customer</th>
                    <th className="py-2.5 px-4 font-semibold">Target SLA Date</th>
                    <th className="py-2.5 px-4 font-semibold">SAMP Claim Status</th>
                    <th className="py-2.5 px-4 font-semibold">Technical Verdict</th>
                    <th className="py-2.5 px-4 font-semibold">Marketing Decision</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Commercial Action</th>
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
                    const isSelected = selectedIds.has(req.id);

                    return (
                      <tr
                        key={req.id}
                        onClick={() => onInspectRequest(req)}
                        className={`hover:bg-neutral-50/80 dark:hover:bg-white/[0.02] transition-colors cursor-pointer group ${
                          isSelected ? "bg-purple-50/40 dark:bg-purple-950/20" : ""
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="py-3 px-3 w-8" onClick={(e) => handleToggleSelectRow(req.id, e)}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="rounded border-neutral-300 text-[#714B67] focus:ring-[#714B67]"
                          />
                        </td>

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
                          </div>
                          <div className="text-xs text-neutral-600 dark:text-zinc-300 truncate max-w-xs">
                            {cleanDesc || "Technical feasibility review"}
                          </div>
                        </td>

                        {/* Customer */}
                        <td className="py-3 px-4 font-medium text-neutral-800 dark:text-zinc-200 whitespace-nowrap">
                          {req.customer || "—"}
                        </td>

                        {/* SLA Date */}
                        <td className="py-3 px-4 whitespace-nowrap font-mono text-neutral-600 dark:text-zinc-300">
                          {req.sampleRequiredDate ? formatOdooDate(req.sampleRequiredDate) : "Flexible"}
                        </td>

                        {/* SAMP Claim Status */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          {req.takenBySamp ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10.5px] font-mono font-semibold bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                              <UserCheck className="w-3 h-3 text-sky-600" />
                              <span>{req.takenBySamp}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10.5px] font-mono font-medium bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border border-amber-200/80">
                              <Clock className="w-3 h-3 text-amber-500" />
                              <span>Unclaimed</span>
                            </span>
                          )}
                        </td>

                        {/* Technical Verdict */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          {req.samplingFeasibilityResponse === "Yes" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-mono font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300/80">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Feasible</span>
                            </span>
                          ) : req.samplingFeasibilityResponse === "Maybe" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-mono font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-300/80">
                              <AlertTriangle className="w-3 h-3 text-amber-600" />
                              <span>Conditional</span>
                            </span>
                          ) : req.samplingFeasibilityResponse === "No" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-mono font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-300/80">
                              <XCircle className="w-3 h-3 text-rose-600" />
                              <span>Rejected</span>
                            </span>
                          ) : (
                            <span className="text-[11px] font-mono text-neutral-400">
                              Pending
                            </span>
                          )}
                        </td>

                        {/* Marketing Decision */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          {req.marketingDecision === "Accepted" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-mono font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border border-emerald-300">
                              ✓ Accepted
                            </span>
                          ) : req.marketingDecision === "Rejected" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-mono font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200 border border-rose-300">
                              ✕ Dropped
                            </span>
                          ) : req.samplingFeasibilityResponse ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-mono font-bold bg-purple-100 dark:bg-purple-950/60 text-[#714B67] dark:text-purple-300 border border-purple-300 animate-pulse">
                              Needs Sign-off
                            </span>
                          ) : (
                            <span className="text-[11px] font-mono text-neutral-400">
                              Awaiting SAMP
                            </span>
                          )}
                        </td>

                        {/* Action buttons */}
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                            {req.convertedSrNumber ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-100 text-[#714B67] border border-purple-200">
                                {req.convertedSrNumber}
                              </span>
                            ) : req.samplingFeasibilityResponse && !req.marketingDecision ? (
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => onMarketingApproveFeasibility(req.id, true)}
                                  className="px-2 py-0.5 rounded bg-[#017E84] hover:bg-[#00666A] text-white text-[10.5px] font-bold font-mono transition cursor-pointer"
                                >
                                  Accept
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onMarketingApproveFeasibility(req.id, false)}
                                  className="px-2 py-0.5 rounded border border-rose-300 text-rose-600 hover:bg-rose-50 text-[10.5px] font-mono transition cursor-pointer"
                                >
                                  Drop
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => onInspectRequest(req)}
                                className="px-2.5 py-1 rounded border border-[#CED4DA] dark:border-zinc-700 hover:border-[#714B67] text-neutral-700 dark:text-zinc-300 hover:text-[#714B67] text-[11px] font-medium font-mono transition cursor-pointer"
                              >
                                Inspect
                              </button>
                            )}

                            {isAdmin && (
                              <button
                                type="button"
                                onClick={(e) => onDeleteRequest(req, e)}
                                className="p-1 text-neutral-400 hover:text-rose-600 transition cursor-pointer"
                                title="Delete Record"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
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

export default FeasibilityRequestsPage;
