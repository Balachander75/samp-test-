import React from "react";
import { LucideIcon, Package, RotateCcw } from "lucide-react";

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  onResetFilters?: () => void;
  resetLabel?: string;
  action?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  compact?: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Package,
  title,
  description,
  onResetFilters,
  resetLabel = "Reset All Filters",
  action,
  children,
  className = "",
  compact = false,
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center max-w-xl mx-auto ${
        compact ? "py-8 px-4" : "py-14 px-4"
      } ${className}`}
    >
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#714B67]/15 to-[#714B67]/5 dark:from-[#714B67]/30 dark:to-transparent border border-[#714B67]/20 flex items-center justify-center text-[#714B67] dark:text-purple-300 mb-4 shadow-2xs">
        <Icon className="w-8 h-8" />
      </div>

      <h3 className="text-base font-bold text-neutral-900 dark:text-zinc-100 mb-1.5">
        {title}
      </h3>

      {description && (
        <p className="text-xs text-neutral-500 dark:text-zinc-400 max-w-md mb-6 leading-relaxed">
          {description}
        </p>
      )}

      {(onResetFilters || action) && (
        <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
          {onResetFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-[#714B67]/40 dark:border-purple-400/40 text-xs font-semibold text-[#714B67] dark:text-purple-300 hover:bg-[#714B67]/10 dark:hover:bg-purple-900/30 transition shadow-2xs cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{resetLabel}</span>
            </button>
          )}
          {action}
        </div>
      )}

      {children}
    </div>
  );
};

export default EmptyState;
