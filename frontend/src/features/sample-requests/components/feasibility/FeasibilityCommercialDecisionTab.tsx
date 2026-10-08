import React from "react";
import { SampleRequestItem } from "../../types";
import { Clock, Package, Check, X, ShieldCheck, ArrowRight } from "lucide-react";

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
    <div className="py-5 space-y-6">
      {!activeRequest.samplingFeasibilityResponse ? (
        <div className="p-8 rounded-2xl border border-slate-100 dark:border-white/5 bg-[#eff4ff]/40 dark:bg-zinc-900/40 text-center text-slate-500 dark:text-zinc-400 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-white dark:bg-zinc-800 text-slate-400 flex items-center justify-center mx-auto shadow-xs">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-display font-bold text-sm text-slate-800 dark:text-zinc-200">
              Technical Review Must Be Completed First
            </h3>
            <p className="text-xs text-slate-400 dark:text-zinc-400 max-w-md mx-auto mt-1 leading-relaxed">
              Commercial sign-off unlocks as soon as the SAMP Team records their technical verdict (Yes / Conditional / No).
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Commercial Decision Status & Form */}
          <div className="p-5 rounded-2xl bg-[#eff4ff]/40 dark:bg-zinc-900/40 border border-slate-100/90 dark:border-white/5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 dark:border-white/5">
              <span className="font-display font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                Commercial Decision Status
              </span>
              {activeRequest.marketingDecision ? (
                <span
                  className={`px-3 py-1 rounded-xl text-xs font-display font-bold ${
                    activeRequest.marketingDecision === "Accepted"
                      ? "bg-emerald-50 dark:bg-emerald-950/40 text-[#006d32] dark:text-[#00d166] border border-emerald-200/60"
                      : "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200/60"
                  }`}
                >
                  {activeRequest.marketingDecision === "Accepted"
                    ? "✓ Accepted by Marketing"
                    : "✕ Rejected / Dropped"}
                </span>
              ) : (
                <span className="px-3 py-1 rounded-xl text-xs font-display bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 font-bold">
                  Action Required
                </span>
              )}
            </div>

            {activeRequest.marketingDecision ? (
              <div className="space-y-3 text-xs">
                <div className="text-slate-600 dark:text-zinc-400">
                  Decided by:{" "}
                  <span className="font-display font-bold text-slate-900 dark:text-zinc-100">
                    {activeRequest.marketingDecisionBy || "Marketing Authority"}
                  </span>
                </div>
                {activeRequest.marketingDecisionRemark && (
                  <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-800/80 border border-slate-100 dark:border-white/5 text-slate-800 dark:text-zinc-200 font-sans leading-relaxed">
                    {activeRequest.marketingDecisionRemark}
                  </div>
                )}
              </div>
            ) : canMakeCommercialDecision ? (
              <div className="space-y-4">
                <div className="text-xs text-slate-600 dark:text-zinc-400 bg-white dark:bg-zinc-800/80 p-3 rounded-xl border border-slate-100 dark:border-white/5">
                  SAMP Technical Verdict:{" "}
                  <span className="font-display font-bold text-slate-900 dark:text-zinc-100">
                    {activeRequest.samplingFeasibilityResponse}
                  </span>
                  {activeRequest.samplingFeasibilityRemark && (
                    <span className="ml-1.5 text-slate-500">
                      — {activeRequest.samplingFeasibilityRemark}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-display uppercase tracking-wider font-semibold text-slate-500 mb-1.5">
                    Commercial Remarks &amp; Client Justification (Optional):
                  </label>
                  <input
                    type="text"
                    value={decisionRemark}
                    onChange={(e) => onDecisionRemarkChange(e.target.value)}
                    placeholder="e.g. Approved for customer line; prototype required for buyer sign-off..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#006d32]/20"
                  />
                </div>

                <div className="flex items-center gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => onMarketingFinalApprove(true)}
                    disabled={isSubmittingDecision}
                    className="bg-[#006d32] hover:bg-[#00883e] text-white text-xs font-display font-bold px-5 py-2.5 rounded-xl shadow-[0_4px_14px_rgba(0,109,50,0.25)] cursor-pointer transition active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Accept Feasibility</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onMarketingFinalApprove(false)}
                    disabled={isSubmittingDecision}
                    className="bg-white dark:bg-zinc-800 text-rose-600 border border-rose-200 hover:bg-rose-50 px-4 py-2.5 rounded-xl text-xs font-display font-semibold cursor-pointer transition active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Reject / Drop</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-500 py-2">
                Awaiting commercial decision from Marketing authority.
              </div>
            )}
          </div>

          {/* Commercial Sampling Request Conversion Card */}
          {activeRequest.marketingDecision === "Accepted" && (
            <div className="p-5 rounded-2xl border border-[#006d32]/20 dark:border-[#006d32]/30 bg-[#eff4ff]/60 dark:bg-[#006d32]/10 space-y-3.5">
              <div className="flex items-center gap-2 text-xs font-display font-bold text-[#006d32] dark:text-[#00d166]">
                <Package className="w-4 h-4 text-[#006d32] dark:text-[#00d166]" />
                <span>Commercial Sampling Request Creation</span>
              </div>

              {activeRequest.convertedSrNumber ? (
                <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-slate-100 dark:border-white/5 flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <span className="font-display font-bold text-sm text-[#006d32] dark:text-[#00d166]">
                      Official Sample Request Code: {activeRequest.convertedSrNumber}
                    </span>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Converted by {activeRequest.convertedBy || "Marketing"} into active physical prototype production.
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-[#eff4ff] dark:bg-[#006d32]/25 text-[#006d32] dark:text-[#00d166] font-display text-[11px] font-bold rounded-lg border border-[#006d32]/20">
                    ✓ Active Sample Project
                  </span>
                </div>
              ) : canMakeCommercialDecision ? (
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <p className="text-xs text-slate-600 dark:text-zinc-400 max-w-lg">
                    Technical feasibility is confirmed &amp; accepted. Ready to commission an official Commercial Sample
                    Request for physical prototype production?
                  </p>
                  <button
                    type="button"
                    onClick={onConvertToSampling}
                    disabled={isConverting}
                    className="bg-[#006d32] hover:bg-[#00883e] text-white text-xs font-display font-bold px-5 py-2.5 rounded-xl shadow-[0_4px_14px_rgba(0,109,50,0.25)] cursor-pointer transition flex items-center gap-2 active:scale-95 disabled:opacity-50"
                  >
                    <Package className={`w-3.5 h-3.5 ${isConverting ? "animate-spin" : ""}`} />
                    <span>{isConverting ? "Generating Project..." : "Commission Sampling Project"}</span>
                  </button>
                </div>
              ) : (
                <div className="text-xs text-slate-500">
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

export default FeasibilityCommercialDecisionTab;
