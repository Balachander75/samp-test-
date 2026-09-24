import React from "react";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = "", ...props }) => {
  return (
    <div
      className={`animate-pulse rounded-lg bg-slate-200/80 dark:bg-slate-800/80 ${className}`}
      {...props}
    />
  );
};

export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({
  rows = 6,
  columns = 8,
}) => {
  return (
    <div className="w-full space-y-3 p-4">
      {/* Header row skeleton */}
      <div className="flex items-center justify-between gap-4 pb-3 border-b border-slate-100 dark:border-slate-800">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className={`h-4 ${i === 0 ? "w-24" : i === 1 ? "w-44" : "w-20"}`} />
        ))}
      </div>
      {/* Data rows skeleton */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div
          key={rowIdx}
          className="flex items-center justify-between gap-4 py-3.5 border-b border-slate-50 dark:border-slate-800/40"
        >
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-16 font-mono rounded" />
            <Skeleton className="h-3 w-3 rounded" />
          </div>
          <Skeleton className="h-4 w-48 rounded" />
          <Skeleton className="h-4 w-20 rounded" />
          <Skeleton className="h-5 w-24 rounded-full" />
          <Skeleton className="h-4 w-28 rounded" />
          <Skeleton className="h-4 w-16 rounded" />
          <Skeleton className="h-5 w-20 rounded-md" />
          <div className="flex items-center gap-1.5 justify-end">
            <Skeleton className="h-7 w-14 rounded-lg" />
            <Skeleton className="h-7 w-7 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
};

export const StatsGridSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3"
        >
          <div className="flex items-center justify-between">
            <Skeleton className="h-3 w-20 rounded" />
            <Skeleton className="h-8 w-8 rounded-xl" />
          </div>
          <Skeleton className="h-7 w-16 rounded" />
          <Skeleton className="h-1.5 w-full rounded-full" />
          <div className="flex items-center justify-between">
            <Skeleton className="h-3 w-24 rounded" />
            <Skeleton className="h-3 w-12 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
};

export const FlowStepSkeleton: React.FC = () => {
  return (
    <div className="w-full max-w-2xl mx-auto rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-6 sm:p-8 space-y-6 shadow-sm">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="space-y-1.5">
          <Skeleton className="h-5 w-40 rounded" />
          <Skeleton className="h-3.5 w-64 rounded" />
        </div>
        <Skeleton className="h-6 w-20 rounded-md" />
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-3.5 w-28 rounded" />
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-3.5 w-32 rounded" />
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-3.5 w-24 rounded" />
          <div className="grid grid-cols-3 gap-2">
            <Skeleton className="h-10 rounded-xl" />
            <Skeleton className="h-10 rounded-xl" />
            <Skeleton className="h-10 rounded-xl" />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
        <Skeleton className="h-8 w-16 rounded-lg" />
        <Skeleton className="h-10 w-44 rounded-xl" />
      </div>
    </div>
  );
};
