import React from "react";
import { SampleRequestItem } from "../../types";
import {
  ClipboardCheck,
  Check,
  AlertTriangle,
  XCircle,
  Clock,
  UserCheck,
  Lock,
  ArrowRight,
  Sparkles,
  ShieldCheck,
} from "lucide-react";

export interface FeasibilityTechnicalReviewTabProps {
  activeRequest: SampleRequestItem;
  canEvaluateTechnical: boolean;
  isClaiming: boolean;
  sampVerdictChoice: "Yes" | "No" | "Maybe";
  sampVerdictRemark: string;
  sampVerdictError: string | null;
  isSubmittingSampVerdict: boolean;
  onClaimTask: () => void;
  onSampVerdictChoiceChange: (choice: "Yes" | "No" | "Maybe") => void;
  onSampVerdictRemarkChange: (remark: string) => void;
  onSubmitSampVerdict: () => void;
}

export const FeasibilityTechnicalReviewTab: React.FC<FeasibilityTechnicalReviewTabProps> = ({
  activeRequest,
  canEvaluateTechnical,
  isClaiming,
  sampVerdictChoice,
  sampVerdictRemark,
  sampVerdictError,
  isSubmittingSampVerdict,
  onClaimTask,
  onSampVerdictChoiceChange,
  onSampVerdictRemarkChange,
  onSubmitSampVerdict,
}) => {
  return (
    <div className="py-5 space-y-5">
      {activeRequest.samplingFeasibilityResponse ? (
        /* Evaluated Locked Card (SAMP Review Done) */
        <div className="p-5 rounded-2xl bg-[#eff4ff]/40 dark:bg-zinc-900/40 border border-slate-100/90 dark:border-white/5 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-200/60 dark:border-white/5">
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-display font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                Technical Verdict:
              </span>
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-display font-bold border ${
                  activeRequest.samplingFeasibilityResponse === "Yes"
                    ? "bg-emerald-50 text-[#006d32] border-emerald-200/60 dark:bg-emerald-950/40 dark:text-[#00d166]"
                    : activeRequest.samplingFeasibilityResponse === "No"
                    ? "bg-rose-50 text-rose-700 border-rose-200/60 dark:bg-rose-950/40 dark:text-rose-300"
                    : "bg-amber-50 text-amber-700 border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-300"
                }`}
              >
                {activeRequest.samplingFeasibilityResponse === "Yes" && <Check className="w-3.5 h-3.5" />}
                {activeRequest.samplingFeasibilityResponse === "No" && <XCircle className="w-3.5 h-3.5" />}
                {activeRequest.samplingFeasibilityResponse === "Maybe" && <AlertTriangle className="w-3.5 h-3.5" />}
                <span>
                  {activeRequest.samplingFeasibilityResponse === "Yes" && "Feasible (Full Scope)"}
                  {activeRequest.samplingFeasibilityResponse === "No" && "Not Feasible (Unsupported)"}
                  {activeRequest.samplingFeasibilityResponse === "Maybe" && "Conditional Feasibility"}
                </span>
              </span>
            </div>
            <div className="text-xs text-slate-500 font-display">
              Evaluated by:{" "}
              <span className="font-bold text-slate-900 dark:text-zinc-100">
                {activeRequest.samplingFeasibilityApprovedBy || "SAMP Lab Engineer"}
              </span>
            </div>
          </div>

          <div>
            <span className="text-[10.5px] font-display uppercase tracking-wider text-slate-400 block mb-1.5 font-semibold">
              Technical Assessment &amp; Findings:
            </span>
            <div className="text-xs text-slate-900 dark:text-zinc-100 font-sans leading-relaxed whitespace-pre-wrap p-3.5 rounded-xl bg-white dark:bg-zinc-800/80 border border-slate-100 dark:border-white/5 shadow-2xs">
              {activeRequest.samplingFeasibilityRemark || "Technical specifications verified feasible with plant tooling."}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200/60 dark:border-white/5 flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400 font-display">
            <span className="flex items-center gap-1.5 text-[#006d32] dark:text-[#00d166] font-semibold">
              <Check className="w-3.5 h-3.5" /> Technical sign-off recorded. Ready for commercial review.
            </span>
            <span className="px-2.5 py-0.5 rounded-lg bg-[#eff4ff] dark:bg-[#006d32]/25 text-[#006d32] dark:text-[#00d166] text-[10px] font-bold border border-[#006d32]/20">
              Verdict Logged
            </span>
          </div>
        </div>
      ) : canEvaluateTechnical ? (
        !activeRequest.takenBySamp ? (
          /* Step 1 for Sampling Team: Must Claim Task First */
          <div className="space-y-4">
            <div className="p-8 rounded-2xl border-2 border-dashed border-amber-300 dark:border-amber-700/60 bg-amber-50/40 dark:bg-amber-950/20 text-center space-y-3.5">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 flex items-center justify-center mx-auto shadow-2xs">
                <UserCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-display font-bold text-amber-950 dark:text-amber-100">
                  Task Claim Required to Begin Technical Review
                </h3>
                <p className="text-xs text-amber-800/90 dark:text-amber-300/80 mt-1 max-w-md mx-auto leading-relaxed">
                  To ensure single ownership and avoid duplicate efforts across the SAMP Team, please claim this feasibility check.
                  The verdict form unlocks immediately once claimed.
                </p>
              </div>
              <button
                type="button"
                onClick={onClaimTask}
                disabled={isClaiming}
                className="inline-flex items-center gap-2 bg-[#006d32] hover:bg-[#00883e] text-white text-xs font-display font-bold px-6 py-2.5 rounded-xl shadow-[0_4px_14px_rgba(0,109,50,0.25)] cursor-pointer transition active:scale-95 disabled:opacity-50"
              >
                <Clock className={`w-4 h-4 ${isClaiming ? "animate-spin" : ""}`} />
                <span>{isClaiming ? "Claiming Ownership..." : "Claim This Feasibility Check"}</span>
              </button>
            </div>

            {/* Locked Preview of Evaluation Form */}
            <div className="opacity-40 pointer-events-none p-5 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/40 space-y-3 select-none">
              <div className="flex items-center gap-2 text-xs font-display font-bold text-slate-500">
                <Lock className="w-3.5 h-3.5" />
                <span>Technical Sign-Off Form (Locked until task is claimed)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-zinc-800 text-xs font-display font-bold text-slate-400">
                  1. Feasible (Yes)
                </div>
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-zinc-800 text-xs font-display font-bold text-slate-400">
                  2. Conditional (Maybe)
                </div>
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-zinc-800 text-xs font-display font-bold text-slate-400">
                  3. Not Feasible (No)
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Step 2: Task Claimed — Active Evaluation Form */
          <div className="space-y-4 p-5 rounded-2xl border border-[#006d32]/20 dark:border-[#006d32]/30 bg-[#eff4ff]/40 dark:bg-[#006d32]/10">
            <div className="flex items-center justify-between pb-3 border-b border-[#006d32]/15">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="w-4 h-4 text-[#006d32] dark:text-[#00d166]" />
                <span className="font-display font-bold text-xs text-slate-900 dark:text-zinc-100">
                  SAMP Team Technical Sign-Off Form
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-display text-[#006d32] dark:text-[#00d166] font-semibold bg-white dark:bg-zinc-900 px-3 py-1 rounded-lg border border-[#006d32]/20">
                <Check className="w-3.5 h-3.5" />
                <span>Assigned to: {activeRequest.takenBySamp}</span>
              </div>
            </div>

            {/* 3 Verdict Options */}
            <div>
              <label className="block text-xs font-display font-bold text-slate-800 dark:text-zinc-200 mb-2">
                Select Technical Verdict:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => onSampVerdictChoiceChange("Yes")}
                  className={`p-4 rounded-xl border text-left transition cursor-pointer select-none ${
                    sampVerdictChoice === "Yes"
                      ? "border-[#006d32] bg-white dark:bg-zinc-850 text-slate-900 dark:text-zinc-100 ring-2 ring-[#006d32]/30 shadow-xs"
                      : "border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-display font-bold">Yes (Feasible)</span>
                    <Check className="w-3.5 h-3.5 text-[#006d32] dark:text-[#00d166]" />
                  </div>
                  <p className="text-[10.5px] text-slate-500 dark:text-zinc-400 font-normal leading-relaxed">
                    Standard manufacturability with existing plant machines, tooling, and materials.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => onSampVerdictChoiceChange("Maybe")}
                  className={`p-4 rounded-xl border text-left transition cursor-pointer select-none ${
                    sampVerdictChoice === "Maybe"
                      ? "border-amber-600 bg-white dark:bg-zinc-850 text-slate-900 dark:text-zinc-100 ring-2 ring-amber-500/30 shadow-xs"
                      : "border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-display font-bold">Maybe (Conditional)</span>
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  </div>
                  <p className="text-[10.5px] text-slate-500 dark:text-zinc-400 font-normal leading-relaxed">
                    Feasible conditionally with custom tooling, special material grade, or pilot batch.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => onSampVerdictChoiceChange("No")}
                  className={`p-4 rounded-xl border text-left transition cursor-pointer select-none ${
                    sampVerdictChoice === "No"
                      ? "border-rose-600 bg-white dark:bg-zinc-850 text-slate-900 dark:text-zinc-100 ring-2 ring-rose-500/30 shadow-xs"
                      : "border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-display font-bold">No (Not Feasible)</span>
                    <XCircle className="w-3.5 h-3.5 text-rose-600" />
                  </div>
                  <p className="text-[10.5px] text-slate-500 dark:text-zinc-400 font-normal leading-relaxed">
                    Unsupported by plant infrastructure or requires unfeasible machinery modifications.
                  </p>
                </button>
              </div>
            </div>

            {/* Technical Reason / Constraints */}
            <div>
              <label className="block text-xs font-display font-bold text-slate-800 dark:text-zinc-200 mb-1.5">
                Technical Explanation &amp; Findings:
                {sampVerdictChoice === "No" || sampVerdictChoice === "Maybe" ? (
                  <span className="text-rose-600 dark:text-rose-400 ml-1 font-semibold">
                    * (Compulsory for {sampVerdictChoice === "No" ? "Not Feasible" : "Conditional"})
                  </span>
                ) : (
                  <span className="text-slate-400 ml-1 font-normal text-[11px]">
                    (Optional notes)
                  </span>
                )}
              </label>
              <textarea
                rows={3}
                value={sampVerdictRemark}
                onChange={(e) => onSampVerdictRemarkChange(e.target.value)}
                placeholder={
                  sampVerdictChoice === "Yes"
                    ? "Specify recommended material grade, plant machine line, or standard tooling parameters (optional)..."
                    : "Detail specific machinery constraints, tooling requirements, or conditional parameters..."
                }
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#006d32]/20"
              />
              {sampVerdictError && (
                <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold mt-1">
                  {sampVerdictError}
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={onSubmitSampVerdict}
                disabled={isSubmittingSampVerdict}
                className="bg-[#006d32] hover:bg-[#00883e] text-white text-xs font-display font-bold px-5 py-2.5 rounded-xl shadow-[0_4px_14px_rgba(0,109,50,0.25)] cursor-pointer transition flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{isSubmittingSampVerdict ? "Submitting Verdict..." : "Submit Technical Verdict"}</span>
              </button>
            </div>
          </div>
        )
      ) : (
        /* Marketing Persona View: Awaiting SAMP Team Evaluation */
        <div className="p-8 rounded-2xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/40 dark:bg-amber-950/20 text-center space-y-3.5">
          <Clock className="w-8 h-8 text-amber-600 mx-auto" />
          <div>
            <h3 className="text-sm font-display font-bold text-amber-950 dark:text-amber-200">
              Awaiting Technical Evaluation by SAMP Team
            </h3>
            <p className="text-xs text-amber-800/90 dark:text-amber-300/80 mt-1 max-w-md mx-auto font-sans leading-relaxed">
              This feasibility check has been dispatched to the SAMP Team. A sampling engineer will claim this task
              and evaluate machine compatibility, tooling, and lead time.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-zinc-900 border border-amber-300/80 text-xs font-display text-slate-700 dark:text-zinc-300 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span>
              {activeRequest.takenBySamp
                ? `In Technical Review by ${activeRequest.takenBySamp}`
                : "Awaiting SAMP Team Engineer Claim"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeasibilityTechnicalReviewTab;
