import React from "react";
import { ChevronRight } from "lucide-react";

export interface StageStep {
  id: string;
  stepNumber?: string;
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
      className={`border-b border-zinc-200/80 dark:border-white/[0.07] bg-[#fafbfc] dark:bg-[#0a0b0f] px-4 sm:px-6 overflow-x-auto select-none no-scrollbar ${className}`}
    >
      <div className="flex items-center min-w-max h-11 gap-1">
        {stages.map((stage, idx) => {
          const isSelected = selectedStageId === stage.id;
          const isAll = stage.id === "all" || stage.id === "All";

          return (
            <React.Fragment key={stage.id}>
              <button
                type="button"
                onClick={() => onSelectStage(stage.id)}
                className={[
                  "relative h-8 flex items-center gap-2 px-3 rounded-md text-xs transition-all duration-150 cursor-pointer whitespace-nowrap",
                  isSelected
                    ? "bg-white dark:bg-zinc-800 text-brand-700 dark:text-brand-300 font-semibold shadow-xs border border-zinc-200/90 dark:border-white/10"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/60 dark:hover:bg-white/[0.04]",
                ].join(" ")}
              >
                <span className="tracking-tight">{stage.label}</span>

                <span
                  className={[
                    "font-mono text-[11px] tabular-nums px-1.5 py-0.2 rounded-full font-bold leading-none transition-colors",
                    stage.count > 0
                      ? isSelected
                        ? "bg-brand-100 text-brand-800 dark:bg-brand-900/60 dark:text-brand-200 border border-brand-300/80 dark:border-brand-700"
                        : "bg-zinc-200/80 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                      : "bg-zinc-200/50 dark:bg-zinc-800/40 text-zinc-400 dark:text-zinc-500",
                  ].join(" ")}
                >
                  {stage.count}
                </span>
              </button>

              {/* Separator: vertical line after 'ALL', directional micro-chevron between pipeline stages */}
              {isAll ? (
                <span className="w-px h-4 bg-zinc-200 dark:bg-white/[0.1] mx-1.5 shrink-0" />
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
