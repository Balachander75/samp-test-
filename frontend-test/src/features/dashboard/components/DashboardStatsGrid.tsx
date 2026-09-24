import React from "react";
import {
  FileText,
  Clock,
  Factory,
  CheckCircle2,
  TrendingUp,
} from "@/components/ui/icons";

export interface DashboardStatsGridProps {
  totalRequests: number;
  activePipeline: number;
  inPlantCount: number;
  completedCount: number;
  totalMembers: number;
  totalCustomers: number;
  isLoading?: boolean;
  onSelectStage?: (stage: string) => void;
}

export const DashboardStatsGrid: React.FC<DashboardStatsGridProps> = ({
  totalRequests,
  activePipeline,
  inPlantCount,
  completedCount,
  totalCustomers,
  isLoading = false,
  onSelectStage,
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 h-36 animate-pulse space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-4 w-24 bg-slate-200/80 dark:bg-slate-800 rounded" />
              <div className="h-10 w-10 bg-slate-200/80 dark:bg-slate-800 rounded-xl" />
            </div>
            <div className="h-8 w-24 bg-slate-200/80 dark:bg-slate-800 rounded mt-2" />
            <div className="h-1.5 w-full bg-slate-200/80 dark:bg-slate-800 rounded-full mt-4" />
          </div>
        ))}
      </div>
    );
  }

  const pipelinePercent = totalRequests > 0 ? Math.round((activePipeline / totalRequests) * 100) : 0;
  const inPlantPercent = totalRequests > 0 ? Math.round((inPlantCount / totalRequests) * 100) : 0;
  const winRatePercent = totalRequests > 0 ? Math.round((completedCount / totalRequests) * 100) : 0;

  const stats = [
    {
      title: "Total Sample Requests",
      value: totalRequests.toLocaleString(),
      subtext: `${totalCustomers} Commercial Accounts`,
      icon: FileText,
      jewelClass: "card-jewel-cobalt",
      iconBox: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 shadow-xs",
      barColor: "bg-blue-600",
      barPercent: 100,
      badge: "Master Catalog",
      badgeColor: "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60",
      trendIcon: TrendingUp,
      targetStage: "All",
    },
    {
      title: "Active Pipeline (In-Review)",
      value: activePipeline.toLocaleString(),
      subtext: `${pipelinePercent}% of Total Volume`,
      icon: Clock,
      jewelClass: "card-jewel-sky",
      iconBox: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 shadow-xs",
      barColor: "bg-sky-500",
      barPercent: pipelinePercent,
      badge: "In Progress",
      badgeColor: "bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border border-sky-200/60 dark:border-sky-800/60",
      trendIcon: TrendingUp,
      targetStage: "SAMP",
    },
    {
      title: "Plant Execution Batches",
      value: inPlantCount.toLocaleString(),
      subtext: `${inPlantPercent}% in Production`,
      icon: Factory,
      jewelClass: "card-jewel-amber",
      iconBox: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shadow-xs",
      barColor: "bg-amber-500",
      barPercent: inPlantPercent,
      badge: "Manufacturing",
      badgeColor: "bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60",
      trendIcon: TrendingUp,
      targetStage: "In Plant Work",
    },
    {
      title: "Dispatched & Deals Won",
      value: completedCount.toLocaleString(),
      subtext: `${winRatePercent}% Conversion Rate`,
      icon: CheckCircle2,
      jewelClass: "card-jewel-emerald",
      iconBox: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-xs",
      barColor: "bg-emerald-500",
      barPercent: winRatePercent,
      badge: "Completed",
      badgeColor: "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60",
      trendIcon: TrendingUp,
      targetStage: "Dispatched / Closed",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((st) => {
        const Icon = st.icon;
        const Trend = st.trendIcon;

        return (
          <div
            key={st.title}
            role={onSelectStage ? "button" : undefined}
            tabIndex={onSelectStage ? 0 : undefined}
            onClick={() => onSelectStage && onSelectStage(st.targetStage)}
            onKeyDown={(e) => {
              if ((e.key === "Enter" || e.key === " ") && onSelectStage) {
                e.preventDefault();
                onSelectStage(st.targetStage);
              }
            }}
            className={`p-4 sm:p-5 rounded-2xl ${st.jewelClass} shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between select-none ${
              onSelectStage ? "cursor-pointer group" : ""
            }`}
          >
            <div>
              {/* Header row */}
              <div className="flex items-center justify-between mb-3.5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${st.iconBox}`}>
                  <Icon size={17} />
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md font-mono flex items-center gap-1 shadow-2xs ${st.badgeColor}`}>
                  {Trend && <Trend size={11} className="stroke-[3]" />}
                  <span>{st.badge}</span>
                </span>
              </div>

              {/* Title & Value */}
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                {st.title}
              </span>
              <p className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 dark:text-slate-100 tracking-tight">
                {st.value}
              </p>
            </div>

            {/* Bottom Progress Bar & Subtext */}
            <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800/80 space-y-2">
              <div className="w-full bg-slate-200/60 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-1.5 rounded-full ${st.barColor} transition-all duration-300 shadow-xs`}
                  style={{ width: `${Math.max(st.barPercent, 4)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                <span>{st.subtext}</span>
                {onSelectStage && (
                  <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold group-hover:translate-x-0.5 transition-transform">
                    Explore →
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
