import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  fetchSampleRequestsApi,
  updateSampleRequestApi,
} from "../api";
import { SampleRequestItem } from "../types";
import {
  ShieldCheck,
  Check,
  Clock,
  Search,
  RefreshCw,
  ChevronDown,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  XCircle,
  User,
  Calendar,
  FileText,
  X,
  Layers,
} from "@/components/ui/icons";

interface SamplingFeasibilityViewProps {
  currentUser?: { name?: string; userid?: string } | null;
}

type FeasibilityDecision = "Yes" | "No" | "Maybe";
type FilterTab = "pending" | "responded" | "all";

const DECISION_CONFIG: Record<
  FeasibilityDecision,
  { label: string; color: string; bg: string; border: string; icon: React.ReactNode }
> = {
  Yes: {
    label: "Feasible",
    color: "text-emerald-700 dark:text-emerald-300",
    bg: "bg-emerald-50 dark:bg-emerald-950/50",
    border: "border-emerald-400",
    icon: <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />,
  },
  No: {
    label: "Not Feasible",
    color: "text-rose-700 dark:text-rose-300",
    bg: "bg-rose-50 dark:bg-rose-950/50",
    border: "border-rose-400",
    icon: <XCircle size={16} className="text-rose-600 dark:text-rose-400 shrink-0" />,
  },
  Maybe: {
    label: "Conditional",
    color: "text-amber-700 dark:text-amber-300",
    bg: "bg-amber-50 dark:bg-amber-950/50",
    border: "border-amber-400",
    icon: <HelpCircle size={16} className="text-amber-600 dark:text-amber-400 shrink-0" />,
  },
};

function isFeasibilityRequest(req: SampleRequestItem): boolean {
  const desc = (req.productDescription || "").toLowerCase();
  const mode = (req.creationMode || "").toLowerCase();
  return (
    mode === "feasibility_check" ||
    desc.includes("feasibility") ||
    desc.includes("new category") ||
    desc.includes("new format") ||
    desc.includes("new finish") ||
    desc.includes("new accessories")
  );
}

function formatDate(d?: string): string {
  if (!d) return "â€”";
  try {
    return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  } catch { return d; }
}

// â”€â”€â”€ Skeleton Card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const SkeletonCard: React.FC = () => (
  <div className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
    <div className="h-0.5 w-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
    <div className="px-4 py-4 flex items-start gap-3">
      <div className="h-9 w-9 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-24 rounded-full bg-slate-100 dark:bg-slate-800 animate-pulse" />
        <div className="h-4 w-3/4 rounded-full bg-slate-100 dark:bg-slate-800 animate-pulse" />
        <div className="h-3 w-1/2 rounded-full bg-slate-100 dark:bg-slate-800 animate-pulse" />
      </div>
    </div>
  </div>
);

// â”€â”€â”€ Feasibility Request Card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const FeasibilityRequestCard: React.FC<{
  req: SampleRequestItem;
  onSubmit: (id: string, decision: FeasibilityDecision, remark: string) => Promise<void>;
  isExpanded: boolean;
  onToggleExpand: () => void;
}> = ({ req, onSubmit, isExpanded, onToggleExpand }) => {
  const [decision, setDecision] = useState<FeasibilityDecision | null>(null);
  const [remark, setRemark] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const samplingResp = req.samplingFeasibilityResponse;
  const plantResp = req.plantFeasibilityResponse;
  const alreadyResponded = Boolean(samplingResp);
  const remarkRequired = decision === "No" || decision === "Maybe";
  const canSubmit = Boolean(decision) && (!remarkRequired || remark.trim().length > 0);

  const handleSubmit = async () => {
    if (!decision || !canSubmit) return;
    setIsSubmitting(true);
    try { await onSubmit(req.id, decision, remark); }
    finally { setIsSubmitting(false); }
  };

  const createdAt = formatDate(req.createdAt || req.dateRequestCreated);
  const requiredDate = req.sampleRequiredDate ? formatDate(req.sampleRequiredDate) : null;

  return (
    <div className={`w-full rounded-xl border bg-white dark:bg-slate-900 shadow-xs overflow-hidden transition-all duration-200 ${
      alreadyResponded
        ? "border-emerald-200 dark:border-emerald-900/60"
        : "border-slate-200 dark:border-slate-800 hover:border-violet-300 dark:hover:border-violet-800/60 hover:shadow-sm"
    }`}>
      {/* Accent line */}
      <div className={`h-0.5 w-full ${
        alreadyResponded ? "bg-emerald-500"
        : plantResp ? "bg-amber-400"
        : "bg-gradient-to-r from-violet-500 to-purple-500"
      }`} />

      {/* Header row */}
      <div
        className="px-4 py-3.5 flex items-start gap-3 cursor-pointer select-none group"
        onClick={onToggleExpand}
      >
        <div className={`shrink-0 h-9 w-9 rounded-lg flex items-center justify-center transition-colors ${
          alreadyResponded
            ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400"
            : "bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400"
        }`}>
          {alreadyResponded
            ? <CheckCircle2 size={17} strokeWidth={2.2} />
            : <ShieldCheck size={17} strokeWidth={2.2} />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-bold tracking-wider text-violet-600 dark:text-violet-400 uppercase font-mono">
              {req.srNumber}
            </span>
            {alreadyResponded && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60">
                <Check size={9} strokeWidth={3} />SAMP Responded
              </span>
            )}
            {plantResp && !alreadyResponded && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-[10px] font-bold text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60">
                <Clock size={9} />Plant Responded
              </span>
            )}
            {!alreadyResponded && !plantResp && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-violet-50 dark:bg-violet-950/60 text-[10px] font-bold text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-900/60 animate-pulse">
                <Clock size={9} />Awaiting Response
              </span>
            )}
          </div>
          <p className="mt-0.5 text-sm font-semibold text-slate-800 dark:text-slate-100 line-clamp-1">
            {req.productDescription?.split("\n")[0] || "No description"}
          </p>
          <div className="mt-1 flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 flex-wrap">
            <span className="flex items-center gap-1"><User size={10} />{req.customer || "â€”"}</span>
            <span className="flex items-center gap-1"><Calendar size={10} />{createdAt}</span>
            {requiredDate && (
              <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold">
                <Clock size={10} />Due: {requiredDate}
              </span>
            )}
            {req.createdBy && (
              <span className="flex items-center gap-1">by {req.createdBy}</span>
            )}
          </div>
        </div>

        <div className={`shrink-0 text-slate-400 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}>
          <ChevronDown size={16} />
        </div>
      </div>

      {/* Expanded panel */}
      {isExpanded && (
        <div className="border-t border-slate-100 dark:border-slate-800 animate-in slide-in-from-top-1 duration-150">
          {/* Description block */}
          <div className="px-4 py-3 bg-slate-50/60 dark:bg-slate-800/40">
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <FileText size={11} />Full Description
            </p>
            <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
              {req.productDescription || "No description provided."}
            </p>
          </div>

          {alreadyResponded ? (
            /* Recorded responses â€” read-only */
            <div className="px-4 py-4 space-y-3">
              <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 size={11} className="text-emerald-600" />Recorded Responses
              </p>
              {samplingResp && (
                <div className={`flex items-start gap-3 p-3.5 rounded-xl border ${DECISION_CONFIG[samplingResp].bg} ${DECISION_CONFIG[samplingResp].border}`}>
                  {DECISION_CONFIG[samplingResp].icon}
                  <div className="min-w-0">
                    <p className={`text-xs font-bold ${DECISION_CONFIG[samplingResp].color}`}>
                      SAMP Team: {DECISION_CONFIG[samplingResp].label}
                    </p>
                    {req.samplingFeasibilityRemark && (
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 italic">
                        "{req.samplingFeasibilityRemark}"
                      </p>
                    )}
                  </div>
                </div>
              )}
              {plantResp && (
                <div className={`flex items-start gap-3 p-3.5 rounded-xl border ${DECISION_CONFIG[plantResp].bg} ${DECISION_CONFIG[plantResp].border}`}>
                  {DECISION_CONFIG[plantResp].icon}
                  <div className="min-w-0">
                    <p className={`text-xs font-bold ${DECISION_CONFIG[plantResp].color}`}>
                      Plant Team: {DECISION_CONFIG[plantResp].label}
                    </p>
                    {req.plantFeasibilityRemark && (
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 italic">
                        "{req.plantFeasibilityRemark}"
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Response form */
            <div className="px-4 py-4 space-y-4">
              {/* Decision buttons */}
              <div>
                <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <ShieldCheck size={11} className="text-violet-500" />Your Decision (SAMP Team)
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {(["Yes", "No", "Maybe"] as FeasibilityDecision[]).map((d) => {
                    const cfg = DECISION_CONFIG[d];
                    const isSelected = decision === d;
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setDecision(d)}
                        className={`flex flex-col items-center gap-2 py-3.5 px-2 rounded-xl border-2 text-xs font-bold transition-all duration-150 cursor-pointer select-none active:scale-[0.97] ${
                          isSelected
                            ? `${cfg.bg} ${cfg.border} ${cfg.color} shadow-sm`
                            : "border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                        }`}
                      >
                        {cfg.icon}
                        <span className="text-center leading-tight">
                          {d === "Yes" ? "Yes â€” Feasible" : d === "No" ? "No â€” Reject" : "Maybe â€” Conditional"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Remarks textarea */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText size={11} className="text-slate-400" />
                  Remarks / Notes
                  {remarkRequired ? (
                    <span className="text-rose-500 font-semibold normal-case">â€” Required for No / Maybe</span>
                  ) : (
                    <span className="text-slate-400 font-normal normal-case">(Optional for Yes)</span>
                  )}
                </label>
                <textarea
                  rows={3}
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  placeholder={
                    remarkRequired
                      ? "Explain why this is not feasible or what conditions apply..."
                      : "Add any notes, conditions, or context for the requestor..."
                  }
                  className={`w-full p-3 rounded-xl border text-xs font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none transition-all resize-none leading-relaxed ${
                    remarkRequired && !remark.trim()
                      ? "border-rose-400 bg-rose-50/40 dark:bg-rose-950/20 dark:border-rose-800 focus:ring-2 focus:ring-rose-500/20"
                      : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                  }`}
                />
                {remarkRequired && !remark.trim() && (
                  <p className="text-[10px] text-rose-500 flex items-center gap-1 font-medium">
                    <AlertCircle size={10} />A remark is required when selecting No or Maybe.
                  </p>
                )}
              </div>

              {/* Plant already responded info */}
              {plantResp && (
                <div className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border text-xs ${DECISION_CONFIG[plantResp].bg} ${DECISION_CONFIG[plantResp].border}`}>
                  {DECISION_CONFIG[plantResp].icon}
                  <span className={`font-semibold ${DECISION_CONFIG[plantResp].color}`}>
                    Plant Team already responded: <strong>{DECISION_CONFIG[plantResp].label}</strong>
                  </span>
                </div>
              )}

              {/* Submit button */}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!canSubmit || isSubmitting}
                className={`w-full h-10 rounded-xl text-xs font-bold uppercase tracking-wider transition-all select-none ${
                  canSubmit && !isSubmitting
                    ? "bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-sm shadow-violet-500/20 cursor-pointer active:scale-[0.98]"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed"
                }`}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <RefreshCw size={13} className="animate-spin" />Submitting...
                  </span>
                ) : (
                  "Submit SAMP Team Response"
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// â”€â”€â”€ KPI Stats Cards â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const StatsCards: React.FC<{
  total: number;
  pending: number;
  responded: number;
  plantOnly: number;
  filterTab: FilterTab;
  onSelect: (tab: FilterTab) => void;
}> = ({ total, pending, responded, plantOnly, filterTab, onSelect }) => {
  const pct = (v: number) => total > 0 ? Math.round((v / total) * 100) : 0;
  const cards = [
    {
      id: "all" as FilterTab,
      title: "Total Requests", subtitle: "All Feasibility",
      value: total, pct: 100,
      tagText: "100%",
      iconBg: "bg-violet-50 text-violet-600 dark:bg-violet-950/70 dark:text-violet-400 border border-violet-200/70 dark:border-violet-900/60",
      topBar: "bg-violet-500", barColor: "bg-gradient-to-r from-violet-500 to-purple-600",
      textColor: "text-violet-600 dark:text-violet-400",
      selectedRing: "border-violet-500 ring-2 ring-violet-500/25 shadow-card-hover bg-violet-50/20 dark:bg-violet-950/20",
      icon: <Layers size={14} className="stroke-[2.2]" />,
    },
    {
      id: "pending" as FilterTab,
      title: "Awaiting SAMP", subtitle: "Need Response",
      value: pending, pct: pct(pending),
      tagText: `${pct(pending)}% share`,
      iconBg: "bg-amber-50 text-amber-600 dark:bg-amber-950/70 dark:text-amber-400 border border-amber-200/70 dark:border-amber-900/60",
      topBar: "bg-amber-500", barColor: "bg-gradient-to-r from-amber-500 to-orange-500",
      textColor: "text-amber-600 dark:text-amber-400",
      selectedRing: "border-amber-500 ring-2 ring-amber-500/25 shadow-card-hover bg-amber-50/20 dark:bg-amber-950/20",
      icon: <Clock size={14} className="stroke-[2.2]" />,
    },
    {
      id: "responded" as FilterTab,
      title: "SAMP Responded", subtitle: "Decisions Made",
      value: responded, pct: pct(responded),
      tagText: `${pct(responded)}% share`,
      iconBg: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/70 dark:text-emerald-400 border border-emerald-200/70 dark:border-emerald-900/60",
      topBar: "bg-emerald-500", barColor: "bg-gradient-to-r from-emerald-500 to-teal-600",
      textColor: "text-emerald-600 dark:text-emerald-400",
      selectedRing: "border-emerald-500 ring-2 ring-emerald-500/25 shadow-card-hover bg-emerald-50/20 dark:bg-emerald-950/20",
      icon: <CheckCircle2 size={14} className="stroke-[2.2]" />,
    },
    {
      id: "all" as FilterTab,
      title: "Plant Responded", subtitle: "Plant Only",
      value: plantOnly, pct: pct(plantOnly),
      tagText: `${pct(plantOnly)}% share`,
      iconBg: "bg-sky-50 text-sky-600 dark:bg-sky-950/70 dark:text-sky-400 border border-sky-200/70 dark:border-sky-900/60",
      topBar: "bg-sky-500", barColor: "bg-gradient-to-r from-sky-500 to-blue-600",
      textColor: "text-sky-600 dark:text-sky-400",
      selectedRing: "border-sky-500 ring-2 ring-sky-500/25",
      icon: <ShieldCheck size={14} className="stroke-[2.2]" />,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
      {cards.map((c, i) => {
        const isSelected = i < 3 && filterTab === c.id;
        return (
          <div
            key={`${c.id}-${i}`}
            role={i < 3 ? "button" : undefined}
            tabIndex={i < 3 ? 0 : undefined}
            onClick={i < 3 ? () => onSelect(c.id) : undefined}
            onKeyDown={i < 3 ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(c.id); } } : undefined}
            className={`group relative p-4 rounded-2xl border overflow-hidden outline-none select-none transition-all ${
              i < 3 ? "cursor-pointer" : "cursor-default"
            } ${
              isSelected
                ? c.selectedRing
                : "bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm hover:shadow-md hover:-translate-y-0.5"
            }`}
          >
            {isSelected && <div className={`absolute top-0 left-0 right-0 h-1 ${c.topBar}`} />}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${c.iconBg}`}>
                  {c.icon}
                </div>
                <span className={`text-[11px] font-bold uppercase tracking-wider truncate ${isSelected ? "text-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-400 group-hover:text-slate-800"}`}>
                  {c.title}
                </span>
              </div>
              <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 shrink-0">
                {c.tagText}
              </span>
            </div>
            <div className="mt-3 flex items-baseline justify-between gap-2">
              <p className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 dark:text-slate-100 tracking-tight">
                {c.value.toLocaleString()}
              </p>
              <span className={`text-[11px] font-semibold truncate ${c.textColor}`}>{c.subtitle}</span>
            </div>
            <div className="w-full rounded-full h-1.5 mt-3 bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div className={`h-1.5 rounded-full transition-all duration-500 ${c.barColor}`} style={{ width: `${Math.min(c.pct, 100)}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

// â”€â”€â”€ Main View â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const SamplingFeasibilityView: React.FC<SamplingFeasibilityViewProps> = ({
  currentUser,
}) => {
  const [allRequests, setAllRequests] = useState<SampleRequestItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTab, setFilterTab] = useState<FilterTab>("pending");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const loadRequests = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const all = await fetchSampleRequestsApi();
      setAllRequests(all);
    } catch (err) {
      console.error("Failed to load requests:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => { loadRequests(); }, [loadRequests]);

  const feasibilityRequests = useMemo(
    () => allRequests.filter(isFeasibilityRequest),
    [allRequests]
  );

  const stats = useMemo(() => {
    const pending = feasibilityRequests.filter((r) => !r.samplingFeasibilityResponse).length;
    const responded = feasibilityRequests.filter((r) => Boolean(r.samplingFeasibilityResponse)).length;
    const plantOnly = feasibilityRequests.filter(
      (r) => Boolean(r.plantFeasibilityResponse) && !r.samplingFeasibilityResponse
    ).length;
    return { total: feasibilityRequests.length, pending, responded, plantOnly };
  }, [feasibilityRequests]);

  const displayRequests = useMemo(() => {
    let list = feasibilityRequests;
    if (filterTab === "pending") list = list.filter((r) => !r.samplingFeasibilityResponse);
    else if (filterTab === "responded") list = list.filter((r) => Boolean(r.samplingFeasibilityResponse));
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (r) =>
          (r.srNumber || "").toLowerCase().includes(q) ||
          (r.productDescription || "").toLowerCase().includes(q) ||
          (r.customer || "").toLowerCase().includes(q) ||
          (r.createdBy || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [feasibilityRequests, filterTab, searchTerm]);

  const handleToggleExpand = (id: string) => setExpandedId((prev) => (prev === id ? null : id));

  const handleSubmitResponse = async (id: string, decision: FeasibilityDecision, remark: string) => {
    const payload: Partial<SampleRequestItem> = {
      samplingFeasibilityResponse: decision,
      samplingFeasibilityRemark: remark || null,
      feasibilityClosedAt: new Date().toISOString(),
      feasibilityClosedBy: "sampling",
      status: "Dispatched / Closed",
    };
    try {
      await updateSampleRequestApi(id, payload as any);
    } catch { /* local fallback */ }
    setAllRequests((prev) => prev.map((r) => (r.id === id ? { ...r, ...payload } : r)));
    const decisionText = decision === "Yes" ? "marked feasible âœ“" : decision === "No" ? "rejected âœ—" : "marked conditional ~";
    setToastMsg(`SAMP Team responded "${decision}" â€” Request ${decisionText}.`);
    setTimeout(() => setToastMsg(null), 4500);
    setExpandedId(null);
  };

  const TAB_OPTIONS: { key: FilterTab; label: string; count: number }[] = [
    { key: "pending", label: "Awaiting SAMP", count: stats.pending },
    { key: "responded", label: "Responded", count: stats.responded },
    { key: "all", label: "All Requests", count: stats.total },
  ];

  return (
    <div className="w-full space-y-5 animate-in fade-in duration-200">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-20 right-6 z-[120] flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-emerald-600 text-white shadow-xl shadow-emerald-600/30 text-xs font-semibold animate-in slide-in-from-top-4 duration-200 max-w-xs">
          <Check size={15} className="stroke-[3] shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Dark violet gradient header banner â€” matches Creative/SAMP Work */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 rounded-2xl bg-gradient-to-r from-violet-900 via-purple-950 to-slate-950 text-white p-4 sm:p-5 shadow-lg shadow-violet-950/20 border border-violet-800/40">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="h-8 w-8 rounded-xl bg-violet-500/30 text-violet-300 border border-violet-400/40 flex items-center justify-center">
              <ShieldCheck size={16} />
            </div>
            <h1 className="text-base sm:text-lg font-bold tracking-tight">
              Feasibility Inbox â€” SAMP Team
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-violet-500/20 text-violet-200 border border-violet-400/30">
              {stats.total} Total
            </span>
            {stats.pending > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/25 text-amber-200 border border-amber-400/30 animate-pulse">
                {stats.pending} Pending Response
              </span>
            )}
          </div>
          <p className="text-xs text-violet-200/80">
            {currentUser?.name ? `Welcome, ${currentUser.name} â€” ` : ""}
            Review incoming feasibility check requests and submit your SAMP team response.
          </p>
        </div>
        <button
          onClick={loadRequests}
          disabled={isRefreshing}
          className="h-9 px-3.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-xs inline-flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-60 shrink-0"
        >
          <RefreshCw size={13} className={isRefreshing ? "animate-spin" : ""} />
          <span>Refresh</span>
        </button>
      </div>

      {/* KPI Cards */}
      <StatsCards {...stats} filterTab={filterTab} onSelect={setFilterTab} />

      {/* Search + Tab filter bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by SR#, description, customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-9 pl-8 pr-8 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer">
              <X size={13} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
          {TAB_OPTIONS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilterTab(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer select-none ${
                filterTab === tab.key
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs font-bold"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                filterTab === tab.key
                  ? "bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300"
                  : "bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Content area */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : displayRequests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
          <div className="h-14 w-14 rounded-2xl bg-violet-50 dark:bg-violet-950/40 text-violet-400 flex items-center justify-center">
            {filterTab === "pending"
              ? <CheckCircle2 size={26} strokeWidth={1.5} />
              : <ShieldCheck size={26} strokeWidth={1.5} />}
          </div>
          <div>
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
              {filterTab === "pending"
                ? "All Caught Up!"
                : filterTab === "responded"
                ? "No Responses Recorded Yet"
                : "No Feasibility Requests Found"}
            </p>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
              {filterTab === "pending"
                ? "No feasibility requests are waiting for the SAMP team's response. Great work!"
                : searchTerm
                ? `No requests match "${searchTerm}". Try adjusting your search.`
                : "Try adjusting your filter to see more requests."}
            </p>
          </div>
          {(filterTab !== "pending" || searchTerm) && (
            <button
              onClick={() => { setFilterTab("pending"); setSearchTerm(""); }}
              className="px-4 py-2 rounded-xl border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-950/40 text-xs font-semibold text-violet-700 dark:text-violet-300 hover:bg-violet-100 dark:hover:bg-violet-900/50 cursor-pointer transition-colors"
            >
              View Pending Requests
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {displayRequests.map((req) => (
            <FeasibilityRequestCard
              key={req.id}
              req={req}
              isExpanded={expandedId === req.id}
              onToggleExpand={() => handleToggleExpand(req.id)}
              onSubmit={handleSubmitResponse}
            />
          ))}
          <p className="text-center text-[11px] text-slate-400 pt-1">
            Showing {displayRequests.length} request{displayRequests.length !== 1 ? "s" : ""}
            {searchTerm && ` matching "${searchTerm}"`}
          </p>
        </div>
      )}
    </div>
  );
};

export default SamplingFeasibilityView;
