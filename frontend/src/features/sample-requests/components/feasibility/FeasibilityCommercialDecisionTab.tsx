import React from "react";
import { SampleRequestItem } from "../../types";
import { Clock, Package } from "lucide-react";

export interface FeasibilityCommercialDecisionTabProps {
  activeRequest: SampleRequestItem;
  canMakeCommercialDecision: boolean;
  decisionRemark: string;
  isSubmittingDecision: boolean;
  isConverting: boolean;
  onDecisionRemarkChange: (val: string) => void;
  onMarketingFinalApprove: (approved: boolean) => void;
  onConvertToSampling: () => void;
}

export const FeasibilityCommercialDecisionTab: React.FC<FeasibilityCommercialDecisionTabProps> = ({
  activeRequest,
  canMakeCommercialDecision,
  decisionRemark,
  isSubmittingDecision,
  isConverting,
  onDecisionRemarkChange,
  onMarketingFinalApprove,
  onConvertToSampling,
}) => {
  return (
    <div className="py-4 space-y-5">
      {!activeRequest.samplingFeasibilityResponse ? (
        <div className="p-8 rounded border border-neutral-200 dark:border-zinc-800 bg-[#FBFBFC] dark:bg-zinc-900 text-center text-neutral-500 space-y-2">
          <Clock className="w-8 h-8 text-neutral-400 mx-auto" />
          <p className="font-semibold text-sm text-neutral-700 dark:text-zinc-300">
            Step 2 (SAMP Technical Review) Must Be Completed First
          </p>
          <p className="text-xs text-neutral-400 max-w-md mx-auto">
            Marketing commercial sign-off unlocks as soon as the SAMP team logs their technical verdict (Yes /
            No / Maybe).
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Commercial Decision Status & Form */}
          <div className="p-4 rounded border border-neutral-200 dark:border-zinc-800 bg-[#FBFBFC] dark:bg-zinc-900/50 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-200 dark:border-zinc-800">
              <span className="font-mono font-bold text-xs uppercase text-neutral-500">
                Commercial Decision Status
              </span>
              {activeRequest.marketingDecision ? (
                <span
                  className={`px-2.5 py-0.5 rounded text-xs font-mono font-bold ${
                    activeRequest.marketingDecision === "Accepted"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-rose-100 text-rose-800"
                  }`}
                >
                  {activeRequest.marketingDecision === "Accepted"
                    ? "✓ Accepted by Marketing"
                    : "✕ Rejected / Dropped"}
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded text-xs font-mono bg-amber-100 text-amber-800 font-bold">
                  Action Required
                </span>
              )}
            </div>

            {activeRequest.marketingDecision ? (
              <div className="space-y-2 text-xs">
                <div className="text-neutral-600 dark:text-zinc-400">
                  Decided by:{" "}
                  <span className="font-semibold text-neutral-800 dark:text-zinc-200">
                    {activeRequest.marketingDecisionBy || "Marketing Authority"}
                  </span>
                </div>
                {activeRequest.marketingDecisionRemark && (
                  <div className="p-2.5 rounded bg-white dark:bg-zinc-850 border border-neutral-200 dark:border-zinc-800 text-neutral-800 dark:text-zinc-200 italic">
                    "{activeRequest.marketingDecisionRemark}"
                  </div>
                )}
              </div>
            ) : canMakeCommercialDecision ? (
              <div className="space-y-3">
                <div className="text-xs text-neutral-600 dark:text-zinc-400">
                  SAMP Verdict:{" "}
                  <span className="font-bold text-neutral-900 dark:text-zinc-100">
                    {activeRequest.samplingFeasibilityResponse}
                  </span>
                  {activeRequest.samplingFeasibilityRemark && (
                    <span className="italic ml-1">
                      ("{activeRequest.samplingFeasibilityRemark}")
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-neutral-500 mb-1">
                    Commercial Remarks / Client Justification (Optional):
                  </label>
                  <input
                    type="text"
                    value={decisionRemark}
                    onChange={(e) => onDecisionRemarkChange(e.target.value)}
                    placeholder="e.g. Approved for customer line; prototype required for buyer sign-off..."
                    className="w-full px-3 py-1.5 rounded border border-[#CED4DA] dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => onMarketingFinalApprove(true)}
                    disabled={isSubmittingDecision}
                    className="bg-[#017E84] hover:bg-[#00666A] text-white text-xs font-bold px-4 py-2 rounded shadow-xs cursor-pointer transition disabled:opacity-50"
                  >
                    Accept Feasibility
                  </button>
                  <button
                    type="button"
                    onClick={() => onMarketingFinalApprove(false)}
                    disabled={isSubmittingDecision}
                    className="bg-white dark:bg-zinc-800 text-rose-600 border border-rose-300 hover:bg-rose-50 px-3.5 py-2 rounded text-xs font-semibold cursor-pointer transition disabled:opacity-50"
                  >
                    Reject / Drop
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-xs text-neutral-500 py-2">
                Awaiting commercial decision from Marketing team.
              </div>
            )}
          </div>

          {/* Commercial Sampling Request Conversion Card */}
          {activeRequest.marketingDecision === "Accepted" && (
            <div className="p-4 rounded border border-purple-200 dark:border-purple-900/50 bg-purple-50/30 dark:bg-purple-950/10 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-[#714B67] dark:text-purple-300 font-mono">
                <Package className="w-4 h-4 text-[#714B67]" />
                <span>Commercial Sampling Request Creation</span>
              </div>

              {activeRequest.convertedSrNumber ? (
                <div className="p-3 bg-white dark:bg-zinc-900 rounded border border-[#714B67]/30 flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <span className="font-bold font-mono text-sm text-[#714B67] dark:text-purple-300">
                      Sample Request Code: {activeRequest.convertedSrNumber}
                    </span>
                    <p className="text-[11px] text-neutral-500 mt-0.5">
                      Converted by {activeRequest.convertedBy || "Marketing"} into active physical sampling
                      pipeline.
                    </p>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-mono text-[11px] font-bold rounded">
                    ✓ Active Commercial Sample Created
                  </span>
                </div>
              ) : canMakeCommercialDecision ? (
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <p className="text-xs text-neutral-600 dark:text-zinc-400 max-w-lg">
                    Technical feasibility is confirmed &amp; accepted. Ready to commission an official Commercial Sample
                    Request for physical prototypes?
                  </p>
                  <button
                    type="button"
                    onClick={onConvertToSampling}
                    disabled={isConverting}
                    className="bg-[#714B67] hover:bg-[#5B3C53] text-white text-xs font-bold px-4 py-2 rounded shadow-xs cursor-pointer transition flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
                  >
                    <Package className={`w-3.5 h-3.5 ${isConverting ? "animate-spin" : ""}`} />
                    <span>{isConverting ? "Creating Sample..." : "Request Sampling (Convert)"}</span>
                  </button>
                </div>
              ) : (
                <div className="text-xs text-neutral-500">
                  Ready for commercial sampling conversion by Marketing authority.
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
