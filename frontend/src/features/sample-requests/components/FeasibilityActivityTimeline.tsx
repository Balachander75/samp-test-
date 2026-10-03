import React from "react";
import { FeasibilityActivityItem, SampleRequestItem } from "../types";

export interface FeasibilityActivityTimelineProps {
  request: SampleRequestItem;
  activities?: FeasibilityActivityItem[];
}

export const FeasibilityActivityTimeline: React.FC<FeasibilityActivityTimelineProps> = ({
  request,
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

  const isEvaluated = Boolean(request.samplingFeasibilityResponse);
  const isDecided = Boolean(request.marketingDecision);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-2.5 border-b border-zinc-100 dark:border-white/[0.06]">
        <h4 className="text-[11px] font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider font-mono">
          Workflow Audit Log
        </h4>
        <span className="text-[10px] font-mono text-zinc-400">
          {request.materialCode || request.srNumber}
        </span>
      </div>

      <div className="relative pl-7 space-y-4 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-[1.5px] before:bg-zinc-200 dark:before:bg-zinc-800">
        {/* STEP 1: REQUEST CREATION */}
        <div className="relative">
          <div className="absolute -left-7 top-0.5 w-6 h-6 rounded-full bg-emerald-600 text-white font-mono text-[10px] font-bold flex items-center justify-center shrink-0 shadow-2xs">
            01
          </div>

          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 font-mono">
                Feasibility Request Raised
              </span>
              <span className="text-[10px] font-mono text-zinc-400">
                {formatTime(request.createdAt || request.dateRequestCreated)}
              </span>
            </div>

            <p className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-0.5">
              Initiated by <span className="font-semibold text-zinc-800 dark:text-zinc-200">{request.createdBy || "Marketing Specialist"}</span> for <span className="font-semibold text-zinc-800 dark:text-zinc-200">{request.customer}</span>.
            </p>
          </div>
        </div>

        {/* STEP 2: SAMP TEAM EVALUATION */}
        <div className="relative">
          <div
            className={`absolute -left-7 top-0.5 w-6 h-6 rounded-full font-mono text-[10px] font-bold flex items-center justify-center shrink-0 shadow-2xs ${
              isEvaluated
                ? request.samplingFeasibilityResponse === "Yes"
                  ? "bg-emerald-600 text-white"
                  : request.samplingFeasibilityResponse === "No"
                  ? "bg-rose-600 text-white"
                  : "bg-amber-600 text-white"
                : "bg-zinc-200 dark:bg-zinc-800 text-zinc-500 border border-zinc-300 dark:border-zinc-700"
            }`}
          >
            02
          </div>

          <div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 font-mono">
                  SAMP Team Technical Evaluation
                </span>
                {isEvaluated ? (
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold ${
                      request.samplingFeasibilityResponse === "Yes"
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300/80"
                        : request.samplingFeasibilityResponse === "No"
                        ? "bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300/80"
                        : "bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300/80"
                    }`}
                  >
                    {request.samplingFeasibilityResponse === "Yes" && "Feasible"}
                    {request.samplingFeasibilityResponse === "No" && "Not Feasible"}
                    {request.samplingFeasibilityResponse === "Maybe" && "Conditional"}
                  </span>
                ) : (
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border border-zinc-200 dark:border-zinc-700">
                    In Review
                  </span>
                )}
              </div>

              <span className="text-[10px] font-mono text-zinc-400">
                {request.feasibilityClosedAt ? formatTime(request.feasibilityClosedAt) : "Pending"}
              </span>
            </div>

            {isEvaluated ? (
              <div className="mt-2 space-y-1.5">
                <div className="p-2.5 rounded bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-zinc-800 text-[12px] text-zinc-800 dark:text-zinc-200 leading-relaxed font-sans">
                  <p className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-0.5">
                    Evaluator: {request.samplingFeasibilityApprovedBy || "SAMP Team"}
                  </p>
                  <p className="whitespace-pre-wrap">
                    {request.samplingFeasibilityRemark || "Technical specifications verified feasible."}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                Awaiting technical evaluation from SAMP Team. Target date:{" "}
                <span className="font-mono text-zinc-700 dark:text-zinc-300">{request.sampleRequiredDate || "Pending"}</span>.
              </p>
            )}
          </div>
        </div>

        {/* STEP 3: MARKETING COMMERCIAL DECISION */}
        <div className="relative">
          <div
            className={`absolute -left-7 top-0.5 w-6 h-6 rounded-full font-mono text-[10px] font-bold flex items-center justify-center shrink-0 shadow-2xs ${
              isDecided
                ? request.marketingDecision === "Accepted"
                  ? "bg-emerald-600 text-white"
                  : "bg-zinc-600 text-white"
                : "bg-zinc-200 dark:bg-zinc-800 text-zinc-500 border border-zinc-300 dark:border-zinc-700"
            }`}
          >
            03
          </div>

          <div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 font-mono">
                  Commercial Sign-Off
                </span>
                {isDecided ? (
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold ${
                      request.marketingDecision === "Accepted"
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300"
                        : "bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-300"
                    }`}
                  >
                    {request.marketingDecision === "Accepted" ? "Accepted" : "Dropped"}
                  </span>
                ) : (
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border border-zinc-200 dark:border-zinc-700">
                    Pending
                  </span>
                )}
              </div>

              <span className="text-[10px] font-mono text-zinc-400">
                {request.marketingDecisionAt ? formatTime(request.marketingDecisionAt) : "Pending"}
              </span>
            </div>

            {isDecided ? (
              <div className="mt-2 p-2.5 rounded bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-zinc-800 text-[12px] text-zinc-800 dark:text-zinc-200">
                <p className="text-[10px] font-mono text-zinc-400 mb-0.5">
                  Decided by: {request.marketingDecisionBy || "Marketing Team"}
                </p>
                {request.marketingDecisionRemark ? (
                  <p className="whitespace-pre-wrap">{request.marketingDecisionRemark}</p>
                ) : (
                  <p className="italic text-zinc-500 text-[11px]">No commercial remarks recorded.</p>
                )}
              </div>
            ) : isEvaluated ? (
              <p className="text-[11px] text-brand-600 dark:text-brand-400 mt-1 font-medium">
                SAMP Team evaluation complete. Final marketing commercial decision is required.
              </p>
            ) : (
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Unlocks once SAMP Team logs their technical evaluation verdict.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeasibilityActivityTimeline;
