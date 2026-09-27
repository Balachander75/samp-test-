import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

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
      className={`flex items-stretch border-b border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-[#0f1118] shrink-0 overflow-x-auto select-none ${className}`}
    >
      {metrics.map((item, idx) => {
        const deltaTone = item.deltaTone ?? "neutral";

        const toneClasses = {
          positive: {
            text: "text-emerald-600 dark:text-emerald-400",
            icon: <TrendingUp className="w-3 h-3 shrink-0" />,
          },
          warning: {
            text: "text-amber-600 dark:text-amber-400",
            icon: <TrendingUp className="w-3 h-3 shrink-0" />,
          },
          critical: {
            text: "text-rose-600 dark:text-rose-400",
            icon: <TrendingDown className="w-3 h-3 shrink-0" />,
          },
          neutral: {
            text: "text-zinc-500 dark:text-zinc-400",
            icon: <Minus className="w-3 h-3 shrink-0" />,
          },
        }[deltaTone];

        return (
          <button
            key={item.id}
            type="button"
            onClick={item.onClick}
            disabled={!item.onClick}
            className={[
              "group relative flex flex-col justify-center gap-0.5 px-5 py-3 min-w-[140px] flex-1 text-left transition-colors duration-150 ease-out",
              idx > 0 ? "border-l border-zinc-200 dark:border-white/[0.08]" : "",
              item.onClick ? "cursor-pointer" : "cursor-default",
              item.isActive
                ? "bg-brand-50/60 dark:bg-brand-950/20"
                : "hover:bg-zinc-50/80 dark:hover:bg-white/[0.02]",
            ].join(" ")}
          >
            {/* Active left-border accent */}
            {item.isActive && (
              <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-brand-600 dark:bg-brand-400" />
            )}

            <span className="text-[10px] font-semibold uppercase tracking-[0.07em] text-zinc-500 dark:text-zinc-500 truncate">
              {item.label}
            </span>

            <div className="flex items-baseline gap-2">
              <span
                className={`text-[22px] font-bold font-mono tracking-tight tabular-nums leading-none ${
                  item.isActive
                    ? "text-brand-700 dark:text-brand-300"
                    : "text-zinc-900 dark:text-zinc-50"
                }`}
              >
                {item.value}
              </span>
            </div>

            {item.deltaText && (
              <div className={`flex items-center gap-1 ${toneClasses.text}`}>
                {toneClasses.icon}
                <span className="text-[10px] font-mono font-medium truncate">
                  {item.deltaText}
                </span>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default MetricRibbon;
