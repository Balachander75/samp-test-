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
        /* Evaluated Locked Card (SAMP Review Done) */
        <div className="p-5 rounded-lg border bg-zinc-50/70 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 space-y-3.5 shadow-2xs">
          <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 font-mono">
                Technical Verdict:
              </span>
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs font-bold font-mono border ${
                  activeRequest.samplingFeasibilityResponse === "Yes"
                    ? "bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300"
                    : activeRequest.samplingFeasibilityResponse === "No"
                    ? "bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-950/50 dark:text-rose-300"
                    : "bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/50 dark:text-amber-300"
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
            <div className="text-xs text-zinc-500 font-mono">
              Evaluated by:{" "}
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                {activeRequest.samplingFeasibilityApprovedBy || "SAMP Team"}
              </span>
            </div>
          </div>

          <div>
            <span className="text-[10.5px] font-mono uppercase tracking-wider text-zinc-400 block mb-1">
              Technical Assessment &amp; Findings:
            </span>
            <div className="text-xs text-zinc-900 dark:text-zinc-100 font-sans leading-relaxed whitespace-pre-wrap p-3 rounded bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800">
              {activeRequest.samplingFeasibilityRemark || "Technical specifications verified feasible with plant tooling."}
            </div>
          </div>

          <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 font-mono">
            <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-semibold">
              <Check className="w-3.5 h-3.5" /> Technical sign-off recorded. Ready for commercial review.
            </span>
            <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold">
              Verdict Logged
            </span>
          </div>
        </div>
      ) : canEvaluateTechnical ? (
        !activeRequest.takenBySamp ? (
          /* Step 1 for Sampling Team: Must Claim Task First */
          <div className="space-y-4">
            <div className="p-6 rounded-lg border-2 border-dashed border-amber-300 dark:border-amber-700/60 bg-amber-50/50 dark:bg-amber-950/20 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 flex items-center justify-center mx-auto shadow-2xs">
                <UserCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-amber-950 dark:text-amber-100 font-sans">
                  Task Claim Required to Begin Technical Review
                </h3>
                <p className="text-xs text-amber-800/90 dark:text-amber-300/80 mt-1 max-w-md mx-auto leading-relaxed">
                  To ensure single ownership and avoid duplicate efforts across the SAMP Team, please claim this feasibility request.
                  The technical verdict form unlocks immediately once claimed.
                </p>
              </div>
              <button
                type="button"
                onClick={onClaimTask}
                disabled={isClaiming}
                className="inline-flex items-center gap-2 bg-[#017E84] hover:bg-[#00666A] text-white text-xs font-bold px-5 py-2.5 rounded-md shadow-xs cursor-pointer transition disabled:opacity-50"
              >
                <Clock className={`w-4 h-4 ${isClaiming ? "animate-spin" : ""}`} />
                <span>{isClaiming ? "Claiming Ownership..." : "Claim This Feasibility Check"}</span>
              </button>
            </div>

            {/* Locked Preview of Evaluation Form */}
            <div className="opacity-40 pointer-events-none p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40 space-y-3 select-none">
              <div className="flex items-center gap-2 text-xs font-bold text-zinc-500 font-mono">
                <Lock className="w-3.5 h-3.5" />
                <span>Technical Sign-Off Form (Locked until task is claimed)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="p-3 rounded border border-zinc-200 dark:border-zinc-800 text-xs font-mono font-bold text-zinc-400">
                  1. Feasible (Yes)
                </div>
                <div className="p-3 rounded border border-zinc-200 dark:border-zinc-800 text-xs font-mono font-bold text-zinc-400">
                  2. Conditional (Maybe)
                </div>
                <div className="p-3 rounded border border-zinc-200 dark:border-zinc-800 text-xs font-mono font-bold text-zinc-400">
                  3. Not Feasible (No)
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Step 2: Task Claimed — Active Evaluation Form */
          <div className="space-y-4 p-5 rounded-lg border border-teal-200 dark:border-teal-900/50 bg-teal-50/20 dark:bg-teal-950/10">
            <div className="flex items-center justify-between pb-3 border-b border-teal-200/80 dark:border-teal-900/40">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="w-4 h-4 text-[#017E84]" />
                <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100 font-sans">
                  SAMP Team Technical Sign-Off Form
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#017E84] font-semibold bg-white dark:bg-zinc-900 px-2.5 py-1 rounded border border-teal-200 dark:border-teal-800">
                <Check className="w-3.5 h-3.5" />
                <span>Assigned to: {activeRequest.takenBySamp}</span>
              </div>
            </div>

            {/* 3 Verdict Options */}
            <div>
              <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-2">
                Select Technical Verdict:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => onSampVerdictChoiceChange("Yes")}
                  className={`p-3.5 rounded-lg border text-left transition cursor-pointer select-none ${
                    sampVerdictChoice === "Yes"
                      ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-bold ring-2 ring-emerald-500/20"
                      : "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold font-mono">Yes (Feasible)</span>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <p className="text-[10.5px] text-zinc-500 dark:text-zinc-400 font-normal leading-relaxed">
                    Standard manufacturability with existing plant machines, tooling, and materials.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => onSampVerdictChoiceChange("Maybe")}
                  className={`p-3.5 rounded-lg border text-left transition cursor-pointer select-none ${
                    sampVerdictChoice === "Maybe"
                      ? "border-amber-600 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 font-bold ring-2 ring-amber-500/20"
                      : "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold font-mono">Maybe (Conditional)</span>
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  </div>
                  <p className="text-[10.5px] text-zinc-500 dark:text-zinc-400 font-normal leading-relaxed">
                    Feasible conditionally with custom dieline tooling, special GSM paper, or trial batch.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => onSampVerdictChoiceChange("No")}
                  className={`p-3.5 rounded-lg border text-left transition cursor-pointer select-none ${
                    sampVerdictChoice === "No"
                      ? "border-rose-600 bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 font-bold ring-2 ring-rose-500/20"
                      : "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold font-mono">No (Not Feasible)</span>
                    <XCircle className="w-3.5 h-3.5 text-rose-600" />
                  </div>
                  <p className="text-[10.5px] text-zinc-500 dark:text-zinc-400 font-normal leading-relaxed">
                    Unsupported by plant infrastructure or requires unfeasible machinery modifications.
                  </p>
                </button>
              </div>
            </div>

            {/* Technical Reason / Constraints */}
            <div>
              <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                Technical Explanation &amp; Findings:
                {sampVerdictChoice === "No" || sampVerdictChoice === "Maybe" ? (
                  <span className="text-rose-600 dark:text-rose-400 ml-1 font-semibold">
                    * (Compulsory for {sampVerdictChoice === "No" ? "Not Feasible" : "Conditional"})
                  </span>
                ) : (
                  <span className="text-zinc-400 ml-1 font-normal text-[11px]">
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
                    ? "Specify recommended paper GSM, plant machine line, or standard tooling parameters (optional)..."
                    : "Detail specific machinery constraints, tooling requirements, or conditional parameters..."
                }
                className="w-full p-2.5 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-[#017E84]"
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
                className="bg-[#017E84] hover:bg-[#00666A] text-white text-xs font-bold px-4 py-2 rounded-md shadow-xs cursor-pointer transition flex items-center gap-1.5 disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{isSubmittingSampVerdict ? "Submitting Verdict..." : "Submit Technical Verdict"}</span>
              </button>
            </div>
          </div>
        )
      ) : (
        /* Marketing Persona View: Awaiting SAMP Team Evaluation */
        <div className="p-6 rounded-lg border border-amber-200 dark:border-amber-900/40 bg-amber-50/40 dark:bg-amber-950/20 text-center space-y-3">
          <Clock className="w-8 h-8 text-amber-600 mx-auto" />
          <div>
            <h3 className="text-sm font-bold text-amber-950 dark:text-amber-200 font-sans">
              Awaiting Technical Evaluation by SAMP Team
            </h3>
            <p className="text-xs text-amber-800/90 dark:text-amber-300/80 mt-1 max-w-md mx-auto font-sans leading-relaxed">
              This feasibility check has been dispatched to the SAMP Team. A sampling engineer will claim this task
              and evaluate machine compatibility, tooling, and lead time.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-zinc-900 border border-amber-300/80 text-xs font-mono text-zinc-700 dark:text-zinc-300 shadow-2xs">
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
