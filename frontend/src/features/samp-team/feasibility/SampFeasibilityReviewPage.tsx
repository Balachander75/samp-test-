import React, { useState, useMemo } from "react";
import { UserProfile } from "@/features/auth";
import { SampleRequestItem } from "@/features/sample-requests/types";
import {
  cleanFeasibilityDescription,
  claimFeasibilityTaskApi,
  recordFeasibilityViewedApi,
} from "@/infrastructure/api";
import { FeasibilityInspectorModal } from "@/features/sample-requests/components/FeasibilityInspectorModal";
import { formatOdooDate } from "@/features/sample-requests/utils/dateUtils";
import {
  Search,
  X,
  Download,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  ClipboardCheck,
  RefreshCw,
  UserCheck,
} from "lucide-react";
import { CopyBadge } from "@/components/ui/CopyBadge";
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

export type FeasibilityFilterTab =
  | "all"
  | "awaiting_claim"
  | "in_review"
  | "my_claimed"
  | "feasible"
  | "conditional"
  | "rejected";

export const SampFeasibilityReviewPage: React.FC<SampFeasibilityReviewPageProps> = ({
  requests,
  isLoading,
  uniqueCustomers,
  user,
  isAdmin,
  onRefresh,
  showToast,
}) => {
  const [filterTab, setFilterTab] = useState<FeasibilityFilterTab>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [customerFilter, setCustomerFilter] = useState("all");
  const [selectedRequest, setSelectedRequest] = useState<SampleRequestItem | null>(null);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [claimingId, setClaimingId] = useState<string | number | null>(null);

  // Filter requests to strictly feasibility evaluation checks
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
    let myClaimed = 0;
    let feasible = 0;
    let conditional = 0;
    let rejected = 0;

    const currentUserName = (user?.name || "").toLowerCase();

    feasibilityRequests.forEach((r) => {
      const hasVerdict = Boolean(r.samplingFeasibilityResponse);
      const isClaimed = Boolean(r.takenBySamp);
      const claimedBy = (r.takenBySamp || "").toLowerCase();

      if (!isClaimed && !hasVerdict) {
        awaitingClaim++;
      } else if (isClaimed && !hasVerdict) {
        inReview++;
        if (currentUserName && claimedBy === currentUserName) {
          myClaimed++;
        }
      }

      if (r.samplingFeasibilityResponse === "Yes") feasible++;
      if (r.samplingFeasibilityResponse === "Maybe") conditional++;
      if (r.samplingFeasibilityResponse === "No") rejected++;
    });

    const evaluatedWithSla = feasibilityRequests.filter(
      (r) =>
        Boolean(r.samplingFeasibilityResponse) &&
        r.isRespondedOnTime !== null &&
        r.isRespondedOnTime !== undefined
    );
    const onTimeCount = evaluatedWithSla.filter((r) => r.isRespondedOnTime === true).length;
    const slaPercent =
      evaluatedWithSla.length > 0
        ? Math.round((onTimeCount / evaluatedWithSla.length) * 100)
        : 100;

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

  // Tab definitions with dynamic live counters
  const navTabs: { id: FeasibilityFilterTab; label: string; count: number }[] = [
    { id: "all", label: "All Feasibility", count: metrics.total },
    { id: "awaiting_claim", label: "Needs Claim", count: metrics.awaitingClaim },
    { id: "in_review", label: "Under Review", count: metrics.inReview },
    { id: "my_claimed", label: "Claimed by Me", count: metrics.myClaimed },
    { id: "feasible", label: "Feasible", count: metrics.feasible },
    { id: "conditional", label: "Conditional", count: metrics.conditional },
    { id: "rejected", label: "Rejected", count: metrics.rejected },
  ];

  // Filtered dataset
  const filteredRequests = useMemo(() => {
    const currentUserName = (user?.name || "").toLowerCase();

    return feasibilityRequests.filter((r) => {
      // Tab filter
      if (filterTab === "awaiting_claim" && (r.takenBySamp || r.samplingFeasibilityResponse)) {
        return false;
      }
      if (filterTab === "in_review" && (!r.takenBySamp || r.samplingFeasibilityResponse)) {
        return false;
      }
      if (filterTab === "my_claimed") {
        if (!r.takenBySamp || r.samplingFeasibilityResponse) return false;
        if (!currentUserName || (r.takenBySamp || "").toLowerCase() !== currentUserName) {
          return false;
        }
      }
      if (filterTab === "feasible" && r.samplingFeasibilityResponse !== "Yes") return false;
      if (filterTab === "conditional" && r.samplingFeasibilityResponse !== "Maybe") return false;
      if (filterTab === "rejected" && r.samplingFeasibilityResponse !== "No") return false;

      // Customer filter
      if (customerFilter !== "all" && r.customer !== customerFilter) return false;

      // Search filter
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const code = (r.materialCode || "").toLowerCase();
        const sr = (r.srNumber || "").toLowerCase();
        const cust = (r.customer || "").toLowerCase();
        const desc = (r.productDescription || r.feasibilityDescription || "").toLowerCase();
        const samp = (r.takenBySamp || "").toLowerCase();
        const fType = (r.customFeasibilityType || r.feasibilityType || "").toLowerCase();
        return (
          code.includes(q) ||
          sr.includes(q) ||
          cust.includes(q) ||
          desc.includes(q) ||
          samp.includes(q) ||
          fType.includes(q)
        );
      }

      return true;
    });
  }, [feasibilityRequests, filterTab, customerFilter, searchTerm, user?.name]);

  // Open inspector modal
  const handleOpenInspect = (req: SampleRequestItem) => {
    recordFeasibilityViewedApi(req.id).catch(() => {});
    setSelectedRequest(req);
    setIsInspectorOpen(true);
  };

  // 1-Click inline claim
  const handleInlineClaim = async (req: SampleRequestItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (claimingId) return;
    setClaimingId(req.id);
    try {
      await claimFeasibilityTaskApi(req.id);
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
        {
          header: "Feasibility Category",
          accessor: (r) => r.customFeasibilityType || r.feasibilityType || "Standard",
        },
        { header: "Target SLA Date", accessor: (r) => r.sampleRequiredDate || "" },
        { header: "Claimed By (SAMP)", accessor: (r) => r.takenBySamp || "Unclaimed" },
        {
          header: "Technical Verdict",
          accessor: (r) => r.samplingFeasibilityResponse || "Pending",
        },
        { header: "Verdict Remark", accessor: (r) => r.samplingFeasibilityRemark || "" },
        { header: "Marketing Decision", accessor: (r) => r.marketingDecision || "Pending" },
        { header: "Created Date", accessor: (r) => r.dateRequestCreated || r.createdAt || "" },
      ],
      data: filteredRequests,
    });
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-white text-slate-800 select-text overflow-hidden">
      {/* ── 1. Compact Editorial Header ── */}
      <header className="bg-white px-6 py-3 shrink-0 border-b border-slate-200/60 shadow-[0_1px_4px_rgba(11,28,48,0.02)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 font-display">
              Technical Feasibility Evaluation Workbench
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold font-mono bg-[#006d32]/10 text-[#006d32]">
              SAMP Team
            </span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold font-mono bg-slate-100 text-slate-600">
              {metrics.total} Tasks
            </span>
            {metrics.awaitingClaim > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold font-mono bg-amber-50 text-amber-700 animate-pulse">
                ⚡ {metrics.awaitingClaim} Needs Claim
              </span>
            )}
            <span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold font-mono bg-emerald-50 text-emerald-700">
              SLA: {metrics.slaPercent}%
            </span>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Refresh */}
            <button
              type="button"
              onClick={onRefresh}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-xs font-semibold text-slate-700 transition cursor-pointer disabled:opacity-50"
              title="Refresh Queue"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-[#006d32]" : "text-slate-500"}`}
              />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            {/* Export CSV */}
            <button
              type="button"
              onClick={handleExportCSV}
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
              placeholder="Search SR, Code, Customer..."
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
              <th className="py-3 pl-6 pr-4 font-semibold whitespace-nowrap">Request / Code</th>
              <th className="py-3 px-4 font-semibold">Classification & Scope</th>
              <th className="py-3 px-4 font-semibold whitespace-nowrap">Customer</th>
              <th className="py-3 px-4 font-semibold whitespace-nowrap">Target SLA Date</th>
              <th className="py-3 px-4 font-semibold whitespace-nowrap">SAMP Claim Status</th>
              <th className="py-3 px-4 font-semibold whitespace-nowrap">Technical Verdict</th>
              <th className="py-3 px-4 font-semibold whitespace-nowrap">Marketing Decision</th>
              <th className="py-3 pl-4 pr-6 font-semibold text-right whitespace-nowrap">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredRequests.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-20 text-center">
                  <div className="max-w-sm mx-auto flex flex-col items-center">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
                      <ClipboardCheck className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-800">No Feasibility Tasks Found</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      {searchTerm || customerFilter !== "all" || filterTab !== "all"
                        ? "No tasks match your search or active filter tab."
                        : "There are currently no feasibility check tasks in this category."}
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
                    ? req.feasibilityType
                        .replace(/_/g, " ")
                        .replace(/\b\w/g, (c) => c.toUpperCase())
                    : "New Category");
                const hasLink = req.referenceLinks && req.referenceLinks.length > 0;
                const hasPhotos = req.referenceImages && req.referenceImages.length > 0;

                return (
                  <tr
                    key={req.id}
                    onClick={() => handleOpenInspect(req)}
                    className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                  >
                    {/* Request Code & SR Number */}
                    <td className="py-3.5 pl-6 pr-4 font-mono font-bold whitespace-nowrap">
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
                        {hasPhotos && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            📷 {req.referenceImages?.length}
                          </span>
                        )}
                        {hasLink && (
                          <span className="text-[10px] text-[#006d32] font-mono">
                            🔗 {req.referenceLinks?.length}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-600 truncate max-w-xs" title={cleanDesc}>
                        {cleanDesc || "Technical feasibility review"}
                      </div>
                    </td>

                    {/* Customer */}
                    <td className="py-3.5 px-4 font-semibold text-slate-900 whitespace-nowrap">
                      {req.customer || "—"}
                    </td>

                    {/* Target SLA Date */}
                    <td className="py-3.5 px-4 whitespace-nowrap font-mono text-slate-600">
                      <div className="font-medium text-slate-700">
                        {req.sampleRequiredDate ? formatOdooDate(req.sampleRequiredDate) : "Flexible"}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Raised: {formatOdooDate(req.dateRequestCreated || req.createdAt)}
                      </div>
                    </td>

                    {/* SAMP Claim Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {req.takenBySamp ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold bg-sky-50 text-sky-700">
                          <UserCheck className="w-3.5 h-3.5 text-sky-600" />
                          <span>{req.takenBySamp}</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => handleInlineClaim(req, e)}
                          disabled={claimingId === req.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-[11px] font-bold font-mono transition cursor-pointer active:scale-95 shadow-2xs"
                          title="Claim this task for technical evaluation"
                        >
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          <span>{claimingId === req.id ? "Claiming..." : "Claim Task"}</span>
                        </button>
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
                          Pending Evaluation
                        </span>
                      )}
                    </td>

                    {/* Marketing Decision */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {req.marketingDecision === "Accepted" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-emerald-100 text-emerald-800">
                          ✓ Accepted
                        </span>
                      ) : req.marketingDecision === "Rejected" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-rose-100 text-rose-800">
                          ✕ Rejected
                        </span>
                      ) : (
                        <span className="text-[11px] font-mono text-slate-400">
                          Awaiting Sign-off
                        </span>
                      )}
                    </td>

                    {/* Evaluation Action */}
                    <td className="py-3.5 pl-4 pr-6 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => handleOpenInspect(req)}
                          className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium font-mono transition cursor-pointer"
                        >
                          {req.samplingFeasibilityResponse ? "View Verdict" : "Evaluate"}
                        </button>
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
            Showing {filteredRequests.length} of {feasibilityRequests.length} feasibility tasks
          </span>
          <span>Sorted by Latest Raised Intake</span>
        </div>
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
