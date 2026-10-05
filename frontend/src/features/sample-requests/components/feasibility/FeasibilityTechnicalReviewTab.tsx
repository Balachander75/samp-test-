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
    <div className="py-4 space-y-4">
      {activeRequest.samplingFeasibilityResponse ? (
        /* Evaluated Locked Card (Sampling Work Done) */
        <div className="p-4 rounded border bg-[#FBFBFC] dark:bg-zinc-900/60 border-neutral-200 dark:border-zinc-800 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-neutral-200 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-neutral-600 dark:text-zinc-400 font-mono">
                Technical Verdict:
              </span>
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs font-bold font-mono border ${
                  activeRequest.samplingFeasibilityResponse === "Yes"
                    ? "bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300"
                    : activeRequest.samplingFeasibilityResponse === "No"
                    ? "bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300"
                    : "bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300"
                }`}
              >
                {activeRequest.samplingFeasibilityResponse === "Yes" && "✓ Feasible (Yes)"}
                {activeRequest.samplingFeasibilityResponse === "No" && "✕ Not Feasible (No)"}
                {activeRequest.samplingFeasibilityResponse === "Maybe" && "⚠ Conditional Feasibility (Maybe)"}
              </span>
            </div>
            <div className="text-[11px] font-mono text-neutral-500">
              Evaluated by:{" "}
              <span className="font-semibold text-neutral-800 dark:text-zinc-200">
                {activeRequest.samplingFeasibilityApprovedBy || "SAMP Lab Team"}
              </span>
            </div>
          </div>

          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 block mb-1">
              Technical Assessment &amp; Findings:
            </span>
            <div className="text-xs text-neutral-900 dark:text-zinc-100 font-sans leading-relaxed whitespace-pre-wrap">
              {activeRequest.samplingFeasibilityRemark || "Technical specifications verified feasible."}
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-neutral-200 dark:border-zinc-800 flex items-center justify-between text-xs text-neutral-500 dark:text-zinc-400 font-mono">
            <span className="flex items-center gap-1.5 text-teal-700 dark:text-teal-400 font-semibold">
              <Check className="w-3.5 h-3.5" /> Technical evaluation completed &amp; recorded.
            </span>
            <span className="px-2 py-0.5 rounded bg-teal-50 dark:bg-teal-950/50 text-[#017E84] dark:text-teal-300 border border-teal-200 dark:border-teal-800 text-[10px] font-bold">
              Sampling Scope Complete
            </span>
          </div>
        </div>
      ) : canEvaluateTechnical ? (
        !activeRequest.takenBySamp ? (
          /* Step 1 for Sampling Team: Must Claim Task First */
          <div className="space-y-4">
            <div className="p-6 rounded-lg border-2 border-dashed border-amber-300 dark:border-amber-700/60 bg-amber-50/50 dark:bg-amber-950/20 text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 flex items-center justify-center mx-auto">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-amber-900 dark:text-amber-200 font-mono">
                  Task Claim Required Before Evaluation
                </h3>
                <p className="text-xs text-amber-800/90 dark:text-amber-300/80 mt-1 max-w-md mx-auto leading-relaxed">
                  To prevent duplicate work and ensure clear ownership, you must first claim this feasibility request.
                  Evaluation options will unlock immediately once claimed.
                </p>
              </div>
              <button
                type="button"
                onClick={onClaimTask}
                disabled={isClaiming}
                className="inline-flex items-center gap-2 bg-[#017E84] hover:bg-[#00666A] text-white text-xs font-bold px-5 py-2.5 rounded shadow-sm cursor-pointer transition disabled:opacity-50"
              >
                <Clock className={`w-4 h-4 ${isClaiming ? "animate-spin" : ""}`} />
                <span>{isClaiming ? "Claiming Ownership..." : "Take / Claim This Task"}</span>
              </button>
            </div>

            {/* Locked Preview of Evaluation Form */}
            <div className="opacity-50 pointer-events-none p-4 rounded border border-neutral-200 dark:border-zinc-800 bg-[#FBFBFC] dark:bg-zinc-900/40 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-neutral-500 font-mono">
                <Lock className="w-3.5 h-3.5" />
                <span>Technical Sign-Off Form (Locked until task is claimed)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="p-2.5 rounded border border-neutral-200 dark:border-zinc-800 text-xs font-mono font-bold text-neutral-400">
                  1. Yes (Feasible)
                </div>
                <div className="p-2.5 rounded border border-neutral-200 dark:border-zinc-800 text-xs font-mono font-bold text-neutral-400">
                  2. Maybe (Conditional)
                </div>
                <div className="p-2.5 rounded border border-neutral-200 dark:border-zinc-800 text-xs font-mono font-bold text-neutral-400">
                  3. No (Not Feasible)
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Step 2: Task Claimed — Active Evaluation Form */
          <div className="space-y-4 p-4 rounded border border-teal-200 dark:border-teal-900/50 bg-teal-50/30 dark:bg-teal-950/10">
            <div className="flex items-center justify-between pb-2 border-b border-teal-200 dark:border-teal-900/40">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="w-4 h-4 text-[#017E84]" />
                <span className="font-bold text-xs text-neutral-800 dark:text-zinc-200">
                  SAMP Team Technical Sign-Off Form
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#017E84] font-semibold bg-white dark:bg-zinc-900 px-2.5 py-1 rounded border border-teal-200 dark:border-teal-800">
                <Check className="w-3.5 h-3.5" />
                <span>Claimed by: {activeRequest.takenBySamp}</span>
              </div>
            </div>

            {/* 3 Verdict Options */}
            <div>
              <label className="block text-xs font-bold text-neutral-700 dark:text-zinc-300 mb-2 font-mono">
                Select Feasibility Response:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => onSampVerdictChoiceChange("Yes")}
                  className={`p-3 rounded border text-left transition cursor-pointer select-none ${
                    sampVerdictChoice === "Yes"
                      ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-bold ring-2 ring-emerald-500/30"
                      : "border-[#CED4DA] dark:border-zinc-700 bg-white dark:bg-zinc-800 text-neutral-700 dark:text-zinc-300 hover:bg-neutral-50"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold font-mono">Yes (Feasible)</span>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <p className="text-[10px] text-neutral-500 dark:text-zinc-400 font-normal">
                    Product is fully manufacturable with standard tooling &amp; materials.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => onSampVerdictChoiceChange("Maybe")}
                  className={`p-3 rounded border text-left transition cursor-pointer select-none ${
                    sampVerdictChoice === "Maybe"
                      ? "border-amber-600 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 font-bold ring-2 ring-amber-500/30"
                      : "border-[#CED4DA] dark:border-zinc-700 bg-white dark:bg-zinc-800 text-neutral-700 dark:text-zinc-300 hover:bg-neutral-50"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold font-mono">Maybe (Conditional)</span>
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  </div>
                  <p className="text-[10px] text-neutral-500 dark:text-zinc-400 font-normal">
                    Feasible conditionally with custom tooling, paper adjustments, or trial.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => onSampVerdictChoiceChange("No")}
                  className={`p-3 rounded border text-left transition cursor-pointer select-none ${
                    sampVerdictChoice === "No"
                      ? "border-rose-600 bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 font-bold ring-2 ring-rose-500/30"
                      : "border-[#CED4DA] dark:border-zinc-700 bg-white dark:bg-zinc-800 text-neutral-700 dark:text-zinc-300 hover:bg-neutral-50"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold font-mono">No (Not Feasible)</span>
                    <XCircle className="w-3.5 h-3.5 text-rose-600" />
                  </div>
                  <p className="text-[10px] text-neutral-500 dark:text-zinc-400 font-normal">
                    Cannot be manufactured due to machinery limits or material constraints.
                  </p>
                </button>
              </div>
            </div>

            {/* Compulsory Reason */}
            <div>
              <label className="block text-xs font-bold text-neutral-700 dark:text-zinc-300 mb-1 font-mono">
                Technical Explanation &amp; Findings:
                {(sampVerdictChoice === "No" || sampVerdictChoice === "Maybe") ? (
                  <span className="text-rose-600 dark:text-rose-400 ml-1 font-bold">
                    * (Compulsory for {sampVerdictChoice === "No" ? "Not Feasible" : "Conditional"})
                  </span>
                ) : (
                  <span className="text-neutral-400 ml-1 font-normal font-sans text-[11px]">
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
                    ? "Enter any tool, paper GSM, or operational notes (optional)..."
                    : "Provide compulsory technical reason, equipment constraints, or conditional requirements..."
                }
                className="w-full p-2.5 rounded border border-[#CED4DA] dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs text-neutral-900 dark:text-zinc-100 placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-[#017E84]"
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
                className="bg-[#017E84] hover:bg-[#00666A] text-white text-xs font-bold px-4 py-2 rounded shadow-xs cursor-pointer transition flex items-center gap-1.5 disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{isSubmittingSampVerdict ? "Submitting Verdict..." : "Submit Technical Verdict"}</span>
              </button>
            </div>
          </div>
        )
      ) : (
        /* Marketing Persona View: Awaiting SAMP Team Evaluation */
        <div className="p-6 rounded border border-amber-200 dark:border-amber-900/40 bg-amber-50/40 dark:bg-amber-950/20 text-center space-y-3">
          <Clock className="w-8 h-8 text-amber-600 mx-auto" />
          <div>
            <h3 className="text-sm font-bold text-amber-900 dark:text-amber-300 font-mono">
              Awaiting Technical Evaluation by SAMP Team
            </h3>
            <p className="text-xs text-amber-800/90 dark:text-amber-300/80 mt-1 max-w-md mx-auto font-sans leading-relaxed">
              Marketing has submitted this feasibility check. A SAMP Lab engineer must take/claim this task from
              the SAMP Desk and evaluate whether the requested product can be manufactured.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-zinc-900 border border-amber-300/80 text-xs font-mono text-neutral-700 dark:text-zinc-300">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            <span>
              Current Status:{" "}
              {activeRequest.takenBySamp
                ? `In Review by ${activeRequest.takenBySamp}`
                : "Awaiting SAMP Engineer Claim"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeasibilityTechnicalReviewTab;
