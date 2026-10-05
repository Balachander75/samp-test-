import React from "react";
import { SampleRequestItem } from "../../types";
import { Clock } from "lucide-react";

export interface InspectorReviewTabProps {
  trackType: string | null;
  activeRequest: SampleRequestItem;
}

export const InspectorReviewTab: React.FC<InspectorReviewTabProps> = ({
  trackType,
  activeRequest,
}) => {
  return (
    <div className="py-4 space-y-4">
      {trackType === "program_planning" ? (
        /* Plant Planning SCU Effort */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-[#F8F9FA] dark:bg-zinc-900 border border-[#CED4DA] dark:border-zinc-700 p-3 rounded">
            <div className="font-mono text-[10px] uppercase text-neutral-500 font-bold">
              Base Notebook Effort
            </div>
            <div className="text-base font-extrabold text-neutral-900 dark:text-zinc-100 font-mono mt-1">
              1.00 SCU
            </div>
            <div className="text-[11px] text-neutral-500 mt-0.5">
              Standard scholastic binding baseline.
            </div>
          </div>
          <div className="bg-[#F8F9FA] dark:bg-zinc-900 border border-[#CED4DA] dark:border-zinc-700 p-3 rounded">
            <div className="font-mono text-[10px] uppercase text-neutral-500 font-bold">
              Wiro + Tab Modifier
            </div>
            <div className="text-base font-extrabold text-[#017E84] font-mono mt-1">
              +0.50 SCU
            </div>
            <div className="text-[11px] text-neutral-500 mt-0.5">
              Twin loop wire insertion &amp; tabs.
            </div>
          </div>
          <div className="bg-[#F8F9FA] dark:bg-zinc-900 border border-[#CED4DA] dark:border-zinc-700 p-3 rounded">
            <div className="font-mono text-[10px] uppercase text-neutral-500 font-bold">
              Total Capacity Required
            </div>
            <div className="text-base font-extrabold text-[#714B67] dark:text-purple-300 font-mono mt-1">
              1.90 SCU
            </div>
            <div className="text-[11px] text-neutral-500 mt-0.5">
              Plant 01 Workcentre WC-30 (Finishing).
            </div>
          </div>
        </div>
      ) : (
        /* Feasibility Review: Dedicated SAMP Technical Evaluation */
        <div className="space-y-4">
          {activeRequest.samplingFeasibilityResponse ? (
            /* Evaluated View */
            <div className="space-y-4">
              <div className="p-4 rounded border bg-[#FBFBFC] dark:bg-zinc-900/60 border-neutral-200 dark:border-zinc-800">
                <div className="flex items-center justify-between flex-wrap gap-2 mb-2 pb-2 border-b border-neutral-200 dark:border-zinc-800">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-neutral-600 dark:text-zinc-400 font-mono">
                      Technical Verdict:
                    </span>
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs font-bold font-mono border ${
                        activeRequest.samplingFeasibilityResponse === "Yes"
                          ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                          : activeRequest.samplingFeasibilityResponse === "No"
                          ? "bg-rose-50 text-rose-800 border-rose-300"
                          : "bg-amber-50 text-amber-800 border-amber-300"
                      }`}
                    >
                      {activeRequest.samplingFeasibilityResponse === "Yes" && "✓ Feasible (Yes)"}
                      {activeRequest.samplingFeasibilityResponse === "No" && "✕ Not Feasible (No)"}
                      {activeRequest.samplingFeasibilityResponse === "Maybe" &&
                        "⚠ Conditional Feasibility (Maybe)"}
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-neutral-500">
                    Evaluated by:{" "}
                    <span className="font-semibold text-neutral-800 dark:text-zinc-200">
                      {activeRequest.samplingFeasibilityApprovedBy || "SAMP Team"}
                    </span>
                  </div>
                </div>

                <div className="mt-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 block mb-1">
                    Technical Explanation &amp; Feasibility Assessment:
                  </span>
                  <div className="text-xs text-neutral-900 dark:text-zinc-100 font-sans leading-relaxed whitespace-pre-wrap">
                    {activeRequest.samplingFeasibilityRemark || "Technical specifications verified feasible."}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Awaiting SAMP Team Evaluation */
            <div className="p-4 rounded border border-amber-200 dark:border-amber-900/40 bg-amber-50/40 dark:bg-amber-950/20 space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="font-bold text-xs text-amber-900 dark:text-amber-300 font-mono">
                  Awaiting Technical Evaluation by SAMP Team
                </span>
              </div>
              <p className="text-xs text-amber-800/90 dark:text-amber-300/80 leading-relaxed font-sans">
                Marketing has logged this request. A SAMP Lab engineer must claim this task from the SAMP Desk
                and determine whether the product is technically feasible before you can accept or reject.
              </p>
              <div className="text-[11px] font-mono text-neutral-500 pt-1">
                Status:{" "}
                {activeRequest.takenBySamp
                  ? `Claimed by ${activeRequest.takenBySamp} (In Review)`
                  : "Unclaimed in SAMP Queue"}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
