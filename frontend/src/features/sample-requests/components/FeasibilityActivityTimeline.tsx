import React from "react";
import {
  FileText,
  Eye,
  FlaskConical,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Calendar,
  User,
} from "lucide-react";
import { FeasibilityActivityItem, SampleRequestItem } from "../types";

export interface FeasibilityActivityTimelineProps {
  request: SampleRequestItem;
  activities?: FeasibilityActivityItem[];
}

export const FeasibilityActivityTimeline: React.FC<FeasibilityActivityTimelineProps> = ({
  request,
  activities = [],
}) => {
  const formatTime = (ts?: string | null) => {
    if (!ts) return "—";
    try {
      const d = new Date(ts);
      if (isNaN(d.getTime())) return ts;
      return d.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return ts;
    }
  };

  // Derive SLA delay or on-time delta
  const getSlaDeltaText = () => {
    if (!request.feasibilityClosedAt || !request.sampleRequiredDate) return null;
    const closedDate = new Date(request.feasibilityClosedAt);
    const requiredDate = new Date(request.sampleRequiredDate);
    // Compare date parts
    closedDate.setHours(0, 0, 0, 0);
    requiredDate.setHours(0, 0, 0, 0);
    const diffTime = closedDate.getTime() - requiredDate.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
      if (diffDays === 0) return "Responded on the exact required date (On-Time)";
      return `Responded ${Math.abs(diffDays)} day(s) before the required deadline (On-Time)`;
    }
    return `Responded ${diffDays} day(s) past the required target date (Delayed)`;
  };

  const slaDeltaText = getSlaDeltaText();
  const isOnTime = request.isRespondedOnTime ?? (
    request.feasibilityClosedAt && request.sampleRequiredDate
      ? new Date(request.feasibilityClosedAt).getTime() <= new Date(request.sampleRequiredDate).getTime() + 86400000
      : null
  );

  return (
    <div className="rounded-lg border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-[#0f1118] p-4 shadow-2xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-white/[0.06]">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-brand-600 dark:text-brand-400" />
          <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider font-mono">
            Communication &amp; Milestone Audit Trail
          </h4>
        </div>
        <span className="text-[10px] font-mono text-zinc-400">
          Immutable Log · {request.materialCode || request.srNumber}
        </span>
      </div>

      <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-[1.5px] before:bg-zinc-200 dark:before:bg-zinc-800">
        {/* MILESTONE 1: CREATION */}
        <div className="relative">
          <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <FileText className="w-2.5 h-2.5" />
          </div>

          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                Feasibility Check Created
              </span>
              <span className="text-[10px] font-mono text-zinc-400">
                {formatTime(request.createdAt || request.dateRequestCreated)}
              </span>
            </div>

            <p className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-0.5">
              Raised by <span className="font-semibold text-zinc-800 dark:text-zinc-200">{request.createdBy || "Marketing Specialist"}</span> for customer <span className="font-semibold text-zinc-800 dark:text-zinc-200">{request.customer}</span>.
            </p>

            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[10px] font-mono">
              <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                Type: {request.customFeasibilityType || request.feasibilityType || "New Category"}
              </span>
              <span className="px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>Required By: {request.sampleRequiredDate || "Not Specified"}</span>
              </span>
            </div>
          </div>
        </div>

        {/* MILESTONE 2: SAMP LAB REVIEW / VERDICT */}
        <div className="relative">
          <div className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center ${
            request.samplingFeasibilityResponse
              ? request.samplingFeasibilityResponse === "Yes"
                ? "bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 text-emerald-600"
                : request.samplingFeasibilityResponse === "No"
                ? "bg-rose-50 dark:bg-rose-950/60 border border-rose-300 text-rose-600"
                : "bg-amber-50 dark:bg-amber-950/60 border border-amber-300 text-amber-600"
              : "bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-400"
          }`}>
            <FlaskConical className="w-2.5 h-2.5" />
          </div>

          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                <span>SAMP Tech Lab Technical Evaluation</span>
                {request.samplingFeasibilityResponse && (
                  <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold ${
                    request.samplingFeasibilityResponse === "Yes"
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300/80"
                      : request.samplingFeasibilityResponse === "No"
                      ? "bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300/80"
                      : "bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300/80"
                  }`}>
                    {request.samplingFeasibilityResponse === "Yes" && "✓ FEASIBLE"}
                    {request.samplingFeasibilityResponse === "No" && "✕ NOT FEASIBLE"}
                    {request.samplingFeasibilityResponse === "Maybe" && "⚠️ CONDITIONAL"}
                  </span>
                )}
              </span>

              <span className="text-[10px] font-mono text-zinc-400">
                {request.feasibilityClosedAt ? formatTime(request.feasibilityClosedAt) : "Pending Review"}
              </span>
            </div>

            {request.samplingFeasibilityResponse ? (
              <div className="mt-2 space-y-2">
                {/* SLA performance pill */}
                {slaDeltaText && (
                  <div className={`p-2 rounded border text-[11px] font-mono flex items-center gap-2 ${
                    isOnTime
                      ? "bg-emerald-50/70 border-emerald-200/80 text-emerald-800 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-300"
                      : "bg-rose-50/70 border-rose-200/80 text-rose-800 dark:bg-rose-950/30 dark:border-rose-800 dark:text-rose-300"
                  }`}>
                    {isOnTime ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    )}
                    <span>{slaDeltaText}</span>
                  </div>
                )}

                {/* Technical Remarks */}
                <div className="p-2.5 rounded bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-zinc-800 text-[12px] text-zinc-800 dark:text-zinc-200 leading-relaxed font-sans">
                  <p className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-1">
                    Evaluator: {request.samplingFeasibilityApprovedBy || "SAMP Lab Engineer"}
                  </p>
                  <p className="whitespace-pre-wrap">
                    {request.samplingFeasibilityRemark || "No technical remarks provided."}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-1 italic">
                Awaiting technical verdict from SAMP Tech Lab. Required target deadline is {request.sampleRequiredDate || "Pending"}.
              </p>
            )}
          </div>
        </div>

        {/* MILESTONE 3: MARKETING FINAL DECISION */}
        <div className="relative">
          <div className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center ${
            request.marketingDecision
              ? request.marketingDecision === "Accepted"
                ? "bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 text-emerald-600"
                : "bg-zinc-100 dark:bg-zinc-800 border border-zinc-400 text-zinc-600"
              : "bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-400"
          }`}>
            <ShieldCheck className="w-2.5 h-2.5" />
          </div>

          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                <span>Marketing Final Commercial Decision</span>
                {request.marketingDecision && (
                  <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold ${
                    request.marketingDecision === "Accepted"
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300"
                      : "bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-300"
                  }`}>
                    {request.marketingDecision === "Accepted" ? "✓ ACCEPTED" : "✕ REJECTED"}
                  </span>
                )}
              </span>

              <span className="text-[10px] font-mono text-zinc-400">
                {request.marketingDecisionAt ? formatTime(request.marketingDecisionAt) : "Pending Decision"}
              </span>
            </div>

            {request.marketingDecision ? (
              <div className="mt-2 p-2.5 rounded bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-zinc-800 text-[12px] text-zinc-800 dark:text-zinc-200">
                <p className="text-[10px] font-mono text-zinc-400 mb-1">
                  Decided by: {request.marketingDecisionBy || "Marketing Team"}
                </p>
                {request.marketingDecisionRemark ? (
                  <p className="whitespace-pre-wrap">{request.marketingDecisionRemark}</p>
                ) : (
                  <p className="italic text-zinc-500 text-[11px]">No additional marketing notes recorded.</p>
                )}
              </div>
            ) : request.samplingFeasibilityResponse ? (
              <p className="text-[11px] text-brand-600 dark:text-brand-400 mt-1 font-semibold flex items-center gap-1">
                <span>⚡ Lab evaluation complete. Marketing commercial decision is required.</span>
              </p>
            ) : (
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Will unlock once SAMP Tech Lab logs their technical evaluation verdict.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeasibilityActivityTimeline;
