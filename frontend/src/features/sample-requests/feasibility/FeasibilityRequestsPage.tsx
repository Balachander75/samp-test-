import React, { useState, useMemo } from "react";
import { UserProfile } from "@/features/auth";
import { SampleRequestItem } from "../types";
import { getRequestTrackType } from "../utils/trackTypes";
import { cleanFeasibilityDescription } from "@/infrastructure/api";
import { formatOdooDate } from "../utils/dateUtils";
import {
  Search,
  X,
  Plus,
  Download,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  ClipboardCheck,
  RefreshCw,
  UserCheck,
  ShieldCheck,
  Check,
  ArrowRight,
  Sparkles,
  FlaskConical,
  FileCheck2,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { CopyBadge } from "@/components/ui/CopyBadge";
import { EmptyState } from "@/components/ui/EmptyState";

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
}) => {
  const [filterTab, setFilterTab] = useState<MarketingFeasibilityTab>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [customerFilter, setCustomerFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());

  // Strict separation for feasibility requests
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

  // Derived Customers List strictly from feasibility requests
  const customerList = useMemo(() => {
    const set = new Set<string>();
    feasibilityRequests.forEach((r) => {
      if (r.customer && r.customer.trim()) set.add(r.customer.trim());
    });
    return Array.from(set).sort();
  }, [feasibilityRequests]);

  // Operational metrics
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

  // Filtered requests
  const filteredRequests = useMemo(() => {
    return feasibilityRequests.filter((r) => {
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

      if (customerFilter !== "all" && r.customer !== customerFilter) {
        return false;
      }

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

  // Nav tabs list with live counts
  const navTabs: { id: MarketingFeasibilityTab; label: string; count: number; alert?: boolean }[] = [
    { id: "all", label: "All Feasibility", count: metrics.total },
    { id: "awaiting_claim", label: "Needs Claim", count: metrics.awaitingClaim },
    { id: "in_review", label: "Under Review", count: metrics.inReview },
    { id: "awaiting_decision", label: "Needs Sign-off", count: metrics.awaitingDecision, alert: metrics.awaitingDecision > 0 },
    { id: "feasible", label: "Feasible", count: metrics.feasible },
    { id: "conditional", label: "Conditional", count: metrics.conditional },
    { id: "approved", label: "Approved", count: metrics.approved },
    { id: "converted", label: "In Sampling", count: metrics.converted },
    { id: "rejected", label: "Dropped / Rejected", count: metrics.rejected },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-white text-slate-800 select-text overflow-hidden">

      {/* ── 1. Compact Editorial Header (Maximized Space for Requests) ── */}
      <header className="bg-white px-6 py-3 shrink-0 border-b border-slate-200/60 shadow-[0_1px_4px_rgba(11,28,48,0.02)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 font-display">
              Technical Feasibility Evaluation
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold font-mono bg-slate-100 text-slate-600">
              {metrics.total} Requests
            </span>
            {metrics.awaitingDecision > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold font-mono bg-emerald-50 text-emerald-700 animate-pulse">
                ⚡ {metrics.awaitingDecision} Sign-off Needed
              </span>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Register New Request Button */}
            <button
              type="button"
              onClick={onOpenNewModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white shadow-[0_2px_10px_rgba(0,109,50,0.25)] hover:shadow-[0_4px_14px_rgba(0,109,50,0.35)] transition-all cursor-pointer active:scale-98"
              style={{ background: "linear-gradient(135deg, #006d32 0%, #00d166 100%)" }}
              title="Submit New Technical Feasibility Request"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Feasibility Check</span>
            </button>

            {/* Refresh */}
            <button
              type="button"
              onClick={onRefresh}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-xs font-semibold text-slate-700 transition cursor-pointer disabled:opacity-50"
              title="Refresh Queue"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-[#006d32]" : "text-slate-500"}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            {/* Export CSV */}
            <button
              type="button"
              onClick={onExportCSV}
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
      <div className="px-6 py-2 bg-white/80 backdrop-blur-xs shrink-0 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/50">
        {/* Soft Segmented Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 select-none">
          {navTabs.map((t) => {
            const isActive = filterTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setFilterTab(t.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer ${
                  isActive
                    ? "bg-[#006d32] text-white shadow-[0_2px_8px_rgba(0,109,50,0.25)]"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 bg-transparent"
                }`}
              >
                <span>{t.label}</span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full tabular-nums ${
                    isActive
                      ? "bg-white/25 text-white"
                      : "bg-slate-200/70 text-slate-600"
                  }`}
                >
                  {t.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right Search & Customer Select */}
        <div className="flex items-center gap-2 flex-1 sm:flex-initial justify-end">
          {selectedIds.size > 0 && isAdmin && (
            <button
              type="button"
              onClick={() => onBatchDelete(selectedIds)}
              className="h-9 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete ({selectedIds.size})</span>
            </button>
          )}

          {customerList.length > 0 && (
            <select
              value={customerFilter}
              onChange={(e) => setCustomerFilter(e.target.value)}
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

          <div className="relative w-60 sm:w-72 group">
            <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#006d32] transition-colors pointer-events-none" />
            <input
              type="text"
              placeholder="Search code, customer, spec..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-9 pl-[34px] pr-8 rounded-lg bg-slate-100/80 hover:bg-slate-200/50 focus:bg-white text-xs text-slate-800 placeholder:text-slate-400 border border-slate-200/70 focus:border-[#006d32]/40 focus:outline-none focus:ring-2 focus:ring-[#006d32]/15 shadow-2xs transition-all"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-4.5 h-4.5 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/80 transition-colors cursor-pointer"
                title="Clear search"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── 3. Full-Bleed Table Workspace (Seamlessly Blended into Full UI) ── */}
      <div className="flex-1 min-h-0 overflow-auto bg-white flex flex-col">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="sticky top-0 z-10 bg-slate-50/90 backdrop-blur-xs border-b border-slate-200/70">
            <tr className="text-slate-600 font-mono text-[11px] uppercase tracking-wider select-none">
              <th className="py-3 pl-6 pr-3 w-8">
                <input
                  type="checkbox"
                  checked={selectedIds.size === filteredRequests.length && filteredRequests.length > 0}
                  onChange={handleToggleSelectAll}
                  className="rounded text-[#006d32] focus:ring-[#006d32]"
                />
              </th>
              <th className="py-3 px-4 font-semibold whitespace-nowrap">Request / Code</th>
              <th className="py-3 px-4 font-semibold">Classification & Scope</th>
              <th className="py-3 px-4 font-semibold whitespace-nowrap">Customer</th>
              <th className="py-3 px-4 font-semibold whitespace-nowrap">Target SLA Date</th>
              <th className="py-3 px-4 font-semibold whitespace-nowrap">SAMP Team Claim</th>
              <th className="py-3 px-4 font-semibold whitespace-nowrap">Technical Verdict</th>
              <th className="py-3 px-4 font-semibold whitespace-nowrap">Commercial Status</th>
              <th className="py-3 pl-4 pr-6 font-semibold text-right whitespace-nowrap">Commercial Action</th>
            </tr>
          </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-16 text-center">
                      <div className="max-w-sm mx-auto flex flex-col items-center">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
                          <ClipboardCheck className="w-6 h-6" />
                        </div>
                        <h3 className="text-sm font-bold text-slate-800">No Feasibility Requests Found</h3>
                        <p className="text-xs text-slate-500 mt-1">
                          {searchTerm || customerFilter !== "all" || filterTab !== "all"
                            ? "No requests match your search or active filter tab."
                            : "There are currently no feasibility check requests submitted."}
                        </p>
                        {(searchTerm || customerFilter !== "all" || filterTab !== "all") && (
                          <button
                            type="button"
                            onClick={() => {
                              setSearchTerm("");
                              setCustomerFilter("all");
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
                  filteredRequests.map((req) => {
                    const cleanDesc = cleanFeasibilityDescription(
                      req.feasibilityDescription || req.productDescription
                    );
                    const category =
                      req.customFeasibilityType ||
                      (req.feasibilityType
                        ? req.feasibilityType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
                        : "New Category");
                    const isSelected = selectedIds.has(req.id);
                    const needsMarketingSignoff = Boolean(
                      req.samplingFeasibilityResponse && !req.marketingDecision
                    );

                    return (
                      <tr
                        key={req.id}
                        onClick={() => onInspectRequest(req)}
                        className={`hover:bg-slate-50/80 transition-colors cursor-pointer group ${
                          needsMarketingSignoff
                            ? "bg-emerald-50/20"
                            : isSelected
                            ? "bg-emerald-50/40"
                            : ""
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="py-3.5 pl-6 pr-3 w-8" onClick={(e) => handleToggleSelectRow(req.id, e)}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="rounded text-[#006d32] focus:ring-[#006d32]"
                          />
                        </td>

                        {/* Request Code & SR Number */}
                        <td className="py-3.5 px-4 font-mono font-bold whitespace-nowrap">
                          <CopyBadge text={req.materialCode || req.srNumber} />
                          {req.srNumber && req.materialCode && req.srNumber !== req.materialCode && (
                            <div className="text-[10px] font-normal text-slate-400 font-mono mt-0.5">
                              {req.srNumber}
                            </div>
                          )}
                        </td>

                        {/* Product Classification & Scope */}
                        <td className="py-3.5 px-4 max-w-xs">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-slate-100 text-slate-700">
                              {category}
                            </span>
                          </div>
                          <div className="text-xs text-slate-600 truncate max-w-xs">
                            {cleanDesc || "Technical feasibility review"}
                          </div>
                        </td>

                        {/* Customer */}
                        <td className="py-3.5 px-4 font-semibold text-slate-900 whitespace-nowrap">
                          {req.customer || "—"}
                        </td>

                        {/* SLA Date */}
                        <td className="py-3.5 px-4 whitespace-nowrap font-mono text-slate-600">
                          {req.sampleRequiredDate ? formatOdooDate(req.sampleRequiredDate) : "Flexible"}
                        </td>

                        {/* SAMP Lab Claim */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {req.takenBySamp ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold bg-sky-50 text-sky-700">
                              <UserCheck className="w-3.5 h-3.5 text-sky-600" />
                              <span>{req.takenBySamp}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-medium bg-amber-50 text-amber-700">
                              <Clock className="w-3.5 h-3.5 text-amber-500" />
                              <span>Unclaimed</span>
                            </span>
                          )}
                        </td>

                        {/* Technical Verdict */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {req.samplingFeasibilityResponse === "Yes" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-emerald-50 text-emerald-700">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Feasible</span>
                            </span>
                          ) : req.samplingFeasibilityResponse === "Maybe" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-amber-50 text-amber-700">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                              <span>Conditional</span>
                            </span>
                          ) : req.samplingFeasibilityResponse === "No" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-rose-50 text-rose-700">
                              <XCircle className="w-3.5 h-3.5 text-rose-600" />
                              <span>Rejected</span>
                            </span>
                          ) : (
                            <span className="text-[11px] font-mono text-slate-400">
                              Pending Review
                            </span>
                          )}
                        </td>

                        {/* Commercial Decision */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {req.marketingDecision === "Accepted" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-emerald-100 text-emerald-800">
                              ✓ Approved
                            </span>
                          ) : req.marketingDecision === "Rejected" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-rose-100 text-rose-800">
                              ✕ Dropped
                            </span>
                          ) : needsMarketingSignoff ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-purple-100 text-purple-800 animate-pulse">
                              ⚡ Needs Sign-off
                            </span>
                          ) : (
                            <span className="text-[11px] font-mono text-slate-400">
                              In Evaluation
                            </span>
                          )}
                        </td>

                        {/* Action Buttons */}
                        <td className="py-3.5 pl-4 pr-6 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                            {req.convertedSrNumber ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-slate-100 text-slate-700">
                                {req.convertedSrNumber}
                              </span>
                            ) : needsMarketingSignoff ? (
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => onMarketingApproveFeasibility(req.id, true)}
                                  className="px-2.5 py-1 rounded-lg text-white text-xs font-bold font-mono transition shadow-xs hover:shadow-sm cursor-pointer"
                                  style={{ background: "linear-gradient(135deg, #006d32 0%, #00d166 100%)" }}
                                  title="Accept Verdict & Convert to Commercial Prototype"
                                >
                                  Accept
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onMarketingApproveFeasibility(req.id, false)}
                                  className="px-2 py-1 rounded-lg text-rose-600 hover:bg-rose-50 text-xs font-mono font-semibold transition cursor-pointer"
                                  title="Drop Feasibility Request"
                                >
                                  Drop
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => onInspectRequest(req)}
                                className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium font-mono transition cursor-pointer"
                              >
                                Inspect
                              </button>
                            )}

                            {isAdmin && (
                              <button
                                type="button"
                                onClick={(e) => onDeleteRequest(req, e)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 transition cursor-pointer rounded-lg hover:bg-rose-50"
                                title="Delete Record"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>

            {/* Table Footer info */}
            <div className="mt-auto px-6 py-2.5 bg-white border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-mono shrink-0">
              <span>
                Showing {filteredRequests.length} of {feasibilityRequests.length} feasibility requests
              </span>
              <span>Sorted by Latest Raised Intake</span>
        </div>
      </div>
    </div>
  );
};

export default FeasibilityRequestsPage;

