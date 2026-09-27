import React from "react";
import { ChevronRight } from "lucide-react";

export interface StageStep {
  id: string;
  stepNumber: string;
  label: string;
  count: number;
  sublabel?: string;
}

export interface ProcessStageRibbonProps {
  stages: StageStep[];
  selectedStageId: string;
  onSelectStage: (stageId: string) => void;
  className?: string;
}

export const ProcessStageRibbon: React.FC<ProcessStageRibbonProps> = ({
  stages,
  selectedStageId,
  onSelectStage,
  className = "",
}) => {
  return (
    <div
      className={`border-b border-zinc-200 dark:border-white/[0.07] bg-zinc-50/60 dark:bg-[#0a0b0f] px-4 sm:px-6 overflow-x-auto select-none ${className}`}
    >
      <div className="flex items-center min-w-max h-12 gap-1.5">
        {stages.map((stage, idx) => {
          const isSelected = selectedStageId === stage.id;
          const isAll = stage.id === "all" || stage.id === "All";

          return (
            <React.Fragment key={stage.id}>
              <button
                type="button"
                onClick={() => onSelectStage(stage.id)}
                className={[
                  "relative h-9 flex items-center gap-2 px-3 sm:px-3.5 rounded-md text-xs transition-all duration-150 cursor-pointer whitespace-nowrap",
                  isSelected
                    ? "bg-white dark:bg-zinc-800 text-brand-700 dark:text-brand-300 font-semibold shadow-xs border border-zinc-200/90 dark:border-white/10"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100/80 dark:hover:bg-white/[0.04]",
                ].join(" ")}
              >
                {!isAll && (
                  <span
                    className={[
                      "font-mono text-[10px] px-1.5 py-0.5 rounded font-bold leading-none",
                      isSelected
                        ? "bg-brand-600 text-white dark:bg-brand-500"
                        : "bg-zinc-200/80 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400",
                    ].join(" ")}
                  >
                    {stage.stepNumber}
                  </span>
                )}

                <span className="tracking-tight">{stage.label}</span>

                <span
                  className={[
                    "font-mono text-[11px] tabular-nums px-1.5 py-0.5 rounded font-bold leading-none transition-colors",
                    stage.count > 0
                      ? isSelected
                        ? "bg-brand-100 text-brand-800 dark:bg-brand-900/60 dark:text-brand-200 border border-brand-300 dark:border-brand-700"
                        : "bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300 border border-brand-200/80 dark:border-brand-800/60"
                      : "bg-zinc-100 dark:bg-zinc-800/60 text-zinc-400 dark:text-zinc-500",
                  ].join(" ")}
                >
                  {stage.count}
                </span>
              </button>

              {/* Separator: vertical line after 'ALL', directional chevron between pipeline stages */}
              {isAll ? (
                <span className="w-px h-5 bg-zinc-200 dark:bg-white/[0.1] mx-1 shrink-0" />
              ) : idx < stages.length - 1 ? (
                <ChevronRight className="w-3.5 h-3.5 text-zinc-300 dark:text-zinc-700 shrink-0 mx-0.5" />
              ) : null}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default ProcessStageRibbon;
