import React from "react";

export interface MetricTileItem {
  id: string;
  label: string;
  value: string | number;
  deltaText?: string;
  deltaTone?: "positive" | "warning" | "critical" | "neutral";
  isActive?: boolean;
  onClick?: () => void;
}

export interface MetricRibbonProps {
  metrics: MetricTileItem[];
  className?: string;
}

export const MetricRibbon: React.FC<MetricRibbonProps> = ({ metrics, className = "" }) => {
  return (
    <div
      className={`flex items-stretch border-b border-zinc-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0f1118] shrink-0 overflow-x-auto select-none no-scrollbar ${className}`}
    >
      {metrics.map((item, idx) => {
        return (
          <button
            key={item.id}
            type="button"
            onClick={item.onClick}
            disabled={!item.onClick}
            className={[
              "group relative flex flex-col justify-center px-4 sm:px-5 py-2.5 min-w-[125px] flex-1 text-left transition-colors duration-150",
              idx > 0 ? "border-l border-zinc-200/80 dark:border-white/[0.07]" : "",
              item.onClick ? "cursor-pointer" : "cursor-default",
              item.isActive
                ? "bg-brand-50/60 dark:bg-brand-950/20"
                : "hover:bg-zinc-50/80 dark:hover:bg-white/[0.02]",
            ].join(" ")}
          >
            {/* Active bottom-border accent indicator */}
            {item.isActive && (
              <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-brand-600 dark:bg-brand-400" />
            )}

            <span
                className={`text-[11px] font-semibold uppercase tracking-[0.06em] transition-colors truncate ${
                item.isActive
                  ? "text-brand-700 dark:text-brand-300 font-bold"
                  : "text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-200"
              }`}
            >
              {item.label}
            </span>

            <div className="flex items-baseline gap-2 mt-0.5">
              <span
                className={`text-[20px] font-semibold tabular-nums leading-none transition-colors ${
                  item.isActive
                    ? "text-brand-700 dark:text-brand-300"
                    : "text-zinc-900 dark:text-zinc-100 group-hover:text-black dark:group-hover:text-white"
                }`}
              >
                {item.value}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default MetricRibbon;
