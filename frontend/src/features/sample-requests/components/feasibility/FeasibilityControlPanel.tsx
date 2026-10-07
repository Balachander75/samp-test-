import React from "react";
import { SampleRequestItem } from "../../types";
import { Copy, Check, Trash2, X, ChevronRight, CheckCircle2 } from "lucide-react";

export interface FeasibilityControlPanelProps {
  activeRequest: SampleRequestItem;
  copiedCode: boolean;
  onClose: () => void;
  onCopyCode: () => void;
  onDeleteRequest?: (req: SampleRequestItem) => void;
}

export const FeasibilityControlPanel: React.FC<FeasibilityControlPanelProps> = ({
  activeRequest,
  copiedCode,
  onClose,
  onCopyCode,
  onDeleteRequest,
}) => {
  // Stepper state computation
  const isScopeDone = true;
  const isReviewDone = Boolean(activeRequest.samplingFeasibilityResponse);
  const isReviewActive = !isReviewDone;
  
  const isDecisionDone = Boolean(activeRequest.marketingDecision);
  const isDecisionActive = isReviewDone && !isDecisionDone;

  const isConvertedDone = Boolean(activeRequest.convertedSrNumber);
  const isConvertedActive = isDecisionDone && activeRequest.marketingDecision === "Accepted" && !isConvertedDone;

  const steps = [
    {
      label: "1. Scope & Intake",
      status: "done" as const,
    },
    {
      label: "2. Technical Review",
      status: isReviewDone ? ("done" as const) : isReviewActive ? ("active" as const) : ("pending" as const),
      badge: activeRequest.samplingFeasibilityResponse,
    },
    {
      label: "3. Commercial Decision",
      status: isDecisionDone ? ("done" as const) : isDecisionActive ? ("active" as const) : ("pending" as const),
      badge: activeRequest.marketingDecision,
    },
    {
      label: isConvertedDone
        ? `4. Sample: ${activeRequest.convertedSrNumber}`
        : "4. Sampling Project",
      status: isConvertedDone ? ("done" as const) : isConvertedActive ? ("active" as const) : ("pending" as const),
    },
  ];

  return (
    <div className="bg-white/85 dark:bg-[#151824]/90 backdrop-blur-xl border-b border-slate-100/90 dark:border-white/5 px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-[0_2px_12px_rgba(11,28,48,0.02)]">
      {/* Left Action Buttons */}
      <div className="flex items-center space-x-2">
        <button
          type="button"
          onClick={onClose}
          className="bg-[#006d32] hover:bg-[#00883e] text-white px-4 py-1.5 rounded-xl text-xs font-display font-semibold flex items-center space-x-1.5 shadow-[0_4px_14px_rgba(0,109,50,0.25)] transition-all active:scale-95 cursor-pointer"
        >
          <span>Save &amp; Close</span>
        </button>

        <button
          type="button"
          onClick={onClose}
          className="bg-slate-100/70 hover:bg-slate-200/70 dark:bg-zinc-800/60 dark:hover:bg-zinc-700/60 text-slate-700 dark:text-zinc-300 px-3.5 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer"
        >
          Discard
        </button>

        <div className="h-4 w-px bg-slate-200 dark:bg-zinc-800 mx-1" />

        <button
          type="button"
          onClick={onCopyCode}
          className="text-slate-600 hover:text-[#006d32] dark:hover:text-[#00d166] hover:bg-[#eff4ff] dark:hover:bg-[#006d32]/10 font-medium px-2.5 py-1.5 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer transition"
          title="Copy request code"
        >
          {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
          <span>{copiedCode ? "Copied" : "Copy Code"}</span>
        </button>

        {onDeleteRequest && (
          <button
            type="button"
            onClick={() => onDeleteRequest(activeRequest)}
            className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 font-medium px-2.5 py-1.5 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer transition"
            title="Delete this request"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>
        )}
      </div>

      {/* Right: Modern Luminous Workflow Stepper */}
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-1.5 p-1 bg-slate-100/60 dark:bg-white/5 rounded-xl">
          {steps.map((st, i) => (
            <React.Fragment key={i}>
              <div
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-display transition-all select-none ${
                  st.status === "done"
                    ? "bg-[#eff4ff] dark:bg-[#006d32]/25 text-[#006d32] dark:text-[#00d166] font-bold"
                    : st.status === "active"
                    ? "bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 font-bold shadow-xs ring-1 ring-[#006d32]/30"
                    : "text-slate-400 dark:text-zinc-500 font-medium"
                }`}
              >
                {st.status === "done" ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#006d32] dark:text-[#00d166]" />
                ) : st.status === "active" ? (
                  <span className="w-2 h-2 rounded-full bg-[#006d32] animate-pulse" />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-zinc-700" />
                )}
                <span>{st.label}</span>
              </div>
              {i < steps.length - 1 && (
                <ChevronRight className="w-3 h-3 text-slate-300 dark:text-zinc-700 shrink-0" />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Modal Close [X] */}
        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer"
          title="Close (Esc)"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default FeasibilityControlPanel;
