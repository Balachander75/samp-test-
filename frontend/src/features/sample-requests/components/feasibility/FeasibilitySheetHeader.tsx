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
  Check,
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
    <div className="border-b border-zinc-200 dark:border-white/10 bg-white dark:bg-[#161822]">
      {/* ── Top Bar: Reference & Process Progression ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-2.5 bg-zinc-50/80 dark:bg-zinc-900/40 border-b border-zinc-200/80 dark:border-white/5">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-[#714B67] dark:text-purple-300">
            {code}
          </span>
          <span className="text-zinc-300 dark:text-zinc-700">/</span>
          <span className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">
            Feasibility Request
          </span>
        </div>

        {/* 4-Step Linear Pipeline Progression */}
        <div className="flex items-center gap-1 sm:gap-2 text-[10.5px] font-mono select-none">
          {/* Step 1: Intake */}
          <div className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-bold">
            <span className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-[9px]">
              <Check className="w-2.5 h-2.5" />
            </span>
            <span>Intake</span>
          </div>

          <span className="text-zinc-300 dark:text-zinc-700 font-sans">→</span>

          {/* Step 2: SAMP Review */}
          <div
            className={`flex items-center gap-1 ${
              isEvaluated
                ? "text-emerald-700 dark:text-emerald-400 font-bold"
                : isClaimed
                ? "text-sky-700 dark:text-sky-300 font-bold"
                : "text-amber-700 dark:text-amber-400 font-semibold"
            }`}
          >
            <span
              className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] ${
                isEvaluated
                  ? "bg-emerald-100 dark:bg-emerald-950"
                  : isClaimed
                  ? "bg-sky-100 dark:bg-sky-950"
                  : "bg-amber-100 dark:bg-amber-950"
              }`}
            >
              {isEvaluated ? <Check className="w-2.5 h-2.5" /> : "2"}
            </span>
            <span>SAMP Review</span>
          </div>

          <span className="text-zinc-300 dark:text-zinc-700 font-sans">→</span>

          {/* Step 3: Decision */}
          <div
            className={`flex items-center gap-1 ${
              isDecided
                ? "text-emerald-700 dark:text-emerald-400 font-bold"
                : isEvaluated
                ? "text-[#714B67] dark:text-purple-300 font-bold"
                : "text-zinc-400 dark:text-zinc-600"
            }`}
          >
            <span
              className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] ${
                isDecided
                  ? "bg-emerald-100 dark:bg-emerald-950"
                  : isEvaluated
                  ? "bg-purple-100 dark:bg-purple-950"
                  : "bg-zinc-200 dark:bg-zinc-800 text-zinc-500"
              }`}
            >
              {isDecided ? <Check className="w-2.5 h-2.5" /> : "3"}
            </span>
            <span>Decision</span>
          </div>

          <span className="text-zinc-300 dark:text-zinc-700 font-sans">→</span>

          {/* Step 4: Sampling */}
          <div
            className={`flex items-center gap-1 ${
              isConverted
                ? "text-purple-700 dark:text-purple-300 font-bold"
                : "text-zinc-400 dark:text-zinc-600"
            }`}
          >
            <span
              className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] ${
                isConverted
                  ? "bg-purple-100 dark:bg-purple-950"
                  : "bg-zinc-200 dark:bg-zinc-800 text-zinc-500"
              }`}
            >
              {isConverted ? <Check className="w-2.5 h-2.5" /> : "4"}
            </span>
            <span>Sampling</span>
          </div>
        </div>
      </div>

      {/* ── Document Hero & Primary Details ── */}
      <div className="px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50 font-sans">
              {activeRequest.customer || "General Customer Account"}
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Initiated by{" "}
              <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                {activeRequest.createdBy || "Marketing"}
              </span>{" "}
              on {formatOdooDate(activeRequest.dateRequestCreated || activeRequest.createdAt)}
            </p>
          </div>

          {/* Context Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Feasibility Category Badge (Rendered once cleanly) */}
            <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold bg-purple-50 text-[#714B67] dark:bg-purple-950/50 dark:text-purple-300 border border-[#714B67]/20">
              {classificationLabel}
            </span>

            {/* Technical Verdict / Review State Badge */}
            {activeRequest.samplingFeasibilityResponse === "Yes" ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Feasible (Yes)</span>
              </span>
            ) : activeRequest.samplingFeasibilityResponse === "Maybe" ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300 dark:bg-amber-950/50 dark:text-amber-300">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>Conditional (Maybe)</span>
              </span>
            ) : activeRequest.samplingFeasibilityResponse === "No" ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs font-bold bg-rose-50 text-rose-800 border border-rose-300 dark:bg-rose-950/50 dark:text-rose-300">
                <XCircle className="w-3.5 h-3.5 text-rose-600" />
                <span>Not Feasible (No)</span>
              </span>
            ) : activeRequest.takenBySamp ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold bg-sky-50 text-sky-800 border border-sky-300 dark:bg-sky-950/50 dark:text-sky-300">
                <UserCheck className="w-3.5 h-3.5 text-sky-600" />
                <span>Under Review ({activeRequest.takenBySamp})</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-300 dark:bg-amber-950/50 dark:text-amber-300">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>Awaiting SAMP Team Claim</span>
              </span>
            )}

            {/* Converted Reference Badge */}
            {activeRequest.convertedSrNumber && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs font-bold bg-[#714B67] text-white shadow-2xs">
                <Package className="w-3.5 h-3.5" />
                <span>Sampling: {activeRequest.convertedSrNumber}</span>
              </span>
            )}
          </div>
        </div>

        {/* ── Concise 4-Point Metadata Strip (Zero Redundancy) ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3.5 mt-3 border-t border-zinc-200/80 dark:border-white/10 text-xs">
          {/* Item 1: Target Required Date */}
          <div>
            <span className="text-[11px] text-zinc-500 font-medium block">Required Target Date</span>
            <div className="flex items-center gap-1.5 mt-0.5 font-semibold text-zinc-900 dark:text-zinc-100">
              <Calendar className="w-3.5 h-3.5 text-[#017E84]" />
              <span>
                {activeRequest.sampleRequiredDate
                  ? formatOdooDate(activeRequest.sampleRequiredDate)
                  : "Flexible"}
              </span>
            </div>
          </div>

          {/* Item 2: SAMP Team Assignee */}
          <div>
            <span className="text-[11px] text-zinc-500 font-medium block">SAMP Team Assignee</span>
            <div className="mt-0.5 font-semibold">
              {activeRequest.takenBySamp ? (
                <span className="text-sky-700 dark:text-sky-300">
                  {activeRequest.takenBySamp}
                </span>
              ) : (
                <span className="text-amber-600 dark:text-amber-400 italic">Unclaimed</span>
              )}
            </div>
          </div>

          {/* Item 3: Target Plant / Execution Unit */}
          <div>
            <span className="text-[11px] text-zinc-500 font-medium block">Plant Assignment</span>
            <div className="flex items-center gap-1.5 mt-0.5 text-zinc-800 dark:text-zinc-200 font-medium">
              <Factory className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <span className="truncate">{activeRequest.targetPlant || "1505- Khaniwade"}</span>
            </div>
          </div>

          {/* Item 4: Commercial Status */}
          <div>
            <span className="text-[11px] text-zinc-500 font-medium block">Commercial State</span>
            <div className="mt-0.5 font-semibold text-zinc-800 dark:text-zinc-200">
              {activeRequest.convertedSrNumber ? (
                <span className="text-[#714B67] dark:text-purple-300">Converted</span>
              ) : activeRequest.marketingDecision ? (
                <span className={activeRequest.marketingDecision === "Accepted" ? "text-emerald-700" : "text-rose-700"}>
                  {activeRequest.marketingDecision}
                </span>
              ) : isEvaluated ? (
                <span className="text-teal-700 dark:text-teal-400">Ready for Decision</span>
              ) : (
                <span className="text-zinc-500">Under Technical Review</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeasibilitySheetHeader;
