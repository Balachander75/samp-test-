import React from "react";
import { SampleRequestItem } from "../../types";
import { formatOdooDate } from "../../utils/dateUtils";
import {
  Calendar,
  Clock,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Package,
  Factory,
  Sparkles,
  ShieldCheck,
  Building2,
} from "lucide-react";

export interface FeasibilitySheetHeaderProps {
  activeRequest: SampleRequestItem;
  classificationLabel: string;
  previewableImagesCount: number;
  referenceLinks: string[];
  canEvaluateTechnical: boolean;
  canMakeCommercialDecision: boolean;
  isClaiming: boolean;
  isSubmittingDecision: boolean;
  isConverting: boolean;
  onClaimTask: () => void;
  onOpenReviewTab: () => void;
  onMarketingFinalApprove: (approved: boolean) => void;
  onConvertToSampling: () => void;
}

export const FeasibilitySheetHeader: React.FC<FeasibilitySheetHeaderProps> = ({
  activeRequest,
  classificationLabel,
}) => {
  const code = activeRequest.srNumber || activeRequest.materialCode || `FS-${activeRequest.id}`;
  const isEvaluated = Boolean(activeRequest.samplingFeasibilityResponse);
  const isClaimed = Boolean(activeRequest.takenBySamp);
  const isDecided = Boolean(activeRequest.marketingDecision);
  const isConverted = Boolean(activeRequest.convertedSrNumber);

  return (
    <div className="bg-white/80 dark:bg-[#161928]/80 backdrop-blur-xl border-b border-slate-100 dark:border-white/5">
      {/* ── Top Bar: Reference Code & Flow Progression ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-8 py-3 bg-[#f8f9ff]/70 dark:bg-zinc-900/40 border-b border-slate-100/80 dark:border-white/5">
        <div className="flex items-center gap-2.5">
          <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-lg bg-[#eff4ff] dark:bg-[#006d32]/20 text-[#006d32] dark:text-[#00d166] border border-[#006d32]/20">
            {code}
          </span>
          <span className="text-slate-300 dark:text-zinc-700">/</span>
          <span className="text-xs font-display font-semibold text-slate-500 dark:text-zinc-400">
            Feasibility Specification Sheet
          </span>
        </div>

        {/* Status Badges Group */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Classification Badge */}
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-display font-semibold bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-zinc-200">
            {classificationLabel}
          </span>

          {/* Technical Verdict Badge */}
          {activeRequest.samplingFeasibilityResponse === "Yes" ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-display font-bold bg-[#eff4ff] text-[#006d32] dark:bg-[#006d32]/25 dark:text-[#00d166] border border-[#006d32]/20">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#006d32] dark:text-[#00d166]" />
              <span>Feasible (Approved)</span>
            </span>
          ) : activeRequest.samplingFeasibilityResponse === "Maybe" ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-display font-bold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span>Conditional Review</span>
            </span>
          ) : activeRequest.samplingFeasibilityResponse === "No" ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-display font-bold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300">
              <XCircle className="w-3.5 h-3.5 text-rose-600" />
              <span>Not Feasible</span>
            </span>
          ) : activeRequest.takenBySamp ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-display font-semibold bg-sky-50 text-sky-700 border border-sky-200 dark:bg-sky-950/40 dark:text-sky-300">
              <UserCheck className="w-3.5 h-3.5 text-sky-600" />
              <span>Under Review ({activeRequest.takenBySamp})</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-display font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>Awaiting Lab Claim</span>
            </span>
          )}

          {/* Converted Sampling Badge */}
          {activeRequest.convertedSrNumber && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-display font-bold bg-[#006d32] text-white shadow-xs">
              <Package className="w-3.5 h-3.5" />
              <span>Sampling: {activeRequest.convertedSrNumber}</span>
            </span>
          )}
        </div>
      </div>

      {/* ── Document Hero Section ── */}
      <div className="px-8 py-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight text-slate-900 dark:text-zinc-50">
              {activeRequest.customer || "General Customer Account"}
            </h1>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 flex items-center gap-1.5">
              <span>Initiated by</span>
              <span className="font-semibold text-slate-800 dark:text-zinc-200">
                {activeRequest.createdBy || "Marketing Desk"}
              </span>
              <span>·</span>
              <span>on {formatOdooDate(activeRequest.dateRequestCreated || activeRequest.createdAt)}</span>
            </p>
          </div>
        </div>

        {/* ── 4-Card Executive Metrics Strip ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-5">
          {/* Card 1: Target Required Date */}
          <div className="p-3.5 rounded-2xl bg-[#eff4ff]/60 dark:bg-white/5 border border-slate-100/80 dark:border-white/5 space-y-1">
            <span className="text-[10px] font-display uppercase tracking-wider text-slate-400 dark:text-zinc-400 block font-semibold">
              Required Target Date
            </span>
            <div className="flex items-center gap-1.5 font-display font-bold text-xs text-slate-900 dark:text-zinc-100">
              <Calendar className="w-3.5 h-3.5 text-[#006d32] dark:text-[#00d166] shrink-0" />
              <span>
                {activeRequest.sampleRequiredDate
                  ? formatOdooDate(activeRequest.sampleRequiredDate)
                  : "Flexible Turnaround"}
              </span>
            </div>
          </div>

          {/* Card 2: SAMP Team Assignee */}
          <div className="p-3.5 rounded-2xl bg-[#eff4ff]/60 dark:bg-white/5 border border-slate-100/80 dark:border-white/5 space-y-1">
            <span className="text-[10px] font-display uppercase tracking-wider text-slate-400 dark:text-zinc-400 block font-semibold">
              SAMP Lab Assignee
            </span>
            <div className="flex items-center gap-1.5 font-display font-bold text-xs">
              <UserCheck className="w-3.5 h-3.5 text-[#006d32] dark:text-[#00d166] shrink-0" />
              {activeRequest.takenBySamp ? (
                <span className="text-slate-900 dark:text-zinc-100 truncate">
                  {activeRequest.takenBySamp}
                </span>
              ) : (
                <span className="text-amber-600 dark:text-amber-400 font-medium italic">
                  Unclaimed
                </span>
              )}
            </div>
          </div>

          {/* Card 3: Target Plant */}
          <div className="p-3.5 rounded-2xl bg-[#eff4ff]/60 dark:bg-white/5 border border-slate-100/80 dark:border-white/5 space-y-1">
            <span className="text-[10px] font-display uppercase tracking-wider text-slate-400 dark:text-zinc-400 block font-semibold">
              Target Facility
            </span>
            <div className="flex items-center gap-1.5 font-display font-bold text-xs text-slate-900 dark:text-zinc-100">
              <Factory className="w-3.5 h-3.5 text-[#006d32] dark:text-[#00d166] shrink-0" />
              <span className="truncate">{activeRequest.targetPlant || "1505- Khaniwade"}</span>
            </div>
          </div>

          {/* Card 4: Commercial Status */}
          <div className="p-3.5 rounded-2xl bg-[#eff4ff]/60 dark:bg-white/5 border border-slate-100/80 dark:border-white/5 space-y-1">
            <span className="text-[10px] font-display uppercase tracking-wider text-slate-400 dark:text-zinc-400 block font-semibold">
              Commercial State
            </span>
            <div className="flex items-center gap-1.5 font-display font-bold text-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-[#006d32] dark:text-[#00d166] shrink-0" />
              {activeRequest.convertedSrNumber ? (
                <span className="text-[#006d32] dark:text-[#00d166]">Converted to Sample</span>
              ) : activeRequest.marketingDecision ? (
                <span className={activeRequest.marketingDecision === "Accepted" ? "text-[#006d32] dark:text-[#00d166]" : "text-rose-600"}>
                  {activeRequest.marketingDecision}
                </span>
              ) : isEvaluated ? (
                <span className="text-sky-600 dark:text-sky-400">Ready for Decision</span>
              ) : (
                <span className="text-slate-500 font-medium">Pending Lab Sign-Off</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeasibilitySheetHeader;
