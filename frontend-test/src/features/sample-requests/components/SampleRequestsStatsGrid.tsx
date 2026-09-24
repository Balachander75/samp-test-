import React from "react";
import {
  Layers,
  Clock,
  Palette,
  Camera,
  ShieldCheck,
  Factory,
  CheckCircle2,
  DollarSign,
} from "@/components/ui/icons";

export interface DetailedStageCounts {
  all: number;
  draft: number;
  creative: number;
  studio: number;
  samp: number;
  inPlant: number;
  dispatched: number;
  actualDeal: number;
}

export interface SampleRequestsStatsGridProps {
  stageCounts: DetailedStageCounts;
  filterTab: string;
  onSelectTab: (tab: string) => void;
}

export const SampleRequestsStatsGrid: React.FC<SampleRequestsStatsGridProps> = ({
  stageCounts,
  filterTab,
  onSelectTab,
}) => {
  const total = Math.max(stageCounts.all, 1);
  const getPct = (count: number) => Math.round((count / total) * 100);

  const cards = [
    {
      id: "All",
      tab: "All",
      title: "Total Requests",
      count: stageCounts.all,
      pct: 100,
      subtitle: "Master Catalog",
      tagText: "100% Vol",
      icon: Layers,
      iconBg: "bg-blue-50 text-blue-600 dark:bg-blue-950/70 dark:text-blue-400 border border-blue-200/70 dark:border-blue-900/60",
      topBar: "bg-blue-600",
      barColor: "bg-blue-600",
      textColor: "text-blue-600 dark:text-blue-400",
      selectedRing: "border-blue-500 ring-2 ring-blue-500/25 shadow-card-hover bg-blue-50/20 dark:bg-blue-950/20",
    },
    {
      id: "Draft (Pre-SMT)",
      tab: "Draft (Pre-SMT)",
      title: "Draft (Pre-SMT)",
      count: stageCounts.draft,
      pct: getPct(stageCounts.draft),
      subtitle: "Intake & Setup",
      tagText: `${getPct(stageCounts.draft)}% share`,
      icon: Clock,
      iconBg: "bg-amber-50 text-amber-600 dark:bg-amber-950/70 dark:text-amber-400 border border-amber-200/70 dark:border-amber-900/60",
      topBar: "bg-amber-500",
      barColor: "bg-amber-500",
      textColor: "text-amber-600 dark:text-amber-400",
      selectedRing: "border-amber-500 ring-2 ring-amber-500/25 shadow-card-hover bg-amber-50/20 dark:bg-amber-950/20",
    },
    {
      id: "Creative",
      tab: "Creative",
      title: "Creative Work",
      count: stageCounts.creative,
      pct: getPct(stageCounts.creative),
      subtitle: "Artwork & Design",
      tagText: `${getPct(stageCounts.creative)}% share`,
      icon: Palette,
      iconBg: "bg-rose-50 text-rose-600 dark:bg-rose-950/70 dark:text-rose-400 border border-rose-200/70 dark:border-rose-900/60",
      topBar: "bg-rose-500",
      barColor: "bg-rose-500",
      textColor: "text-rose-600 dark:text-rose-400",
      selectedRing: "border-rose-500 ring-2 ring-rose-500/25 shadow-card-hover bg-rose-50/20 dark:bg-rose-950/20",
    },
    {
      id: "Studio",
      tab: "Studio",
      title: "Studio Work",
      count: stageCounts.studio,
      pct: getPct(stageCounts.studio),
      subtitle: "Photography & 3D",
      tagText: `${getPct(stageCounts.studio)}% share`,
      icon: Camera,
      iconBg: "bg-purple-50 text-purple-600 dark:bg-purple-950/70 dark:text-purple-400 border border-purple-200/70 dark:border-purple-900/60",
      topBar: "bg-purple-500",
      barColor: "bg-purple-500",
      textColor: "text-purple-600 dark:text-purple-400",
      selectedRing: "border-purple-500 ring-2 ring-purple-500/25 shadow-card-hover bg-purple-50/20 dark:bg-purple-950/20",
    },
    {
      id: "SAMP",
      tab: "SAMP",
      title: "SAMP Team Review",
      count: stageCounts.samp,
      pct: getPct(stageCounts.samp),
      subtitle: "Spec & PMT QC",
      tagText: `${getPct(stageCounts.samp)}% share`,
      icon: ShieldCheck,
      iconBg: "bg-orange-50 text-orange-600 dark:bg-orange-950/70 dark:text-orange-400 border border-orange-200/70 dark:border-orange-900/60",
      topBar: "bg-orange-500",
      barColor: "bg-orange-500",
      textColor: "text-orange-600 dark:text-orange-400",
      selectedRing: "border-orange-500 ring-2 ring-orange-500/25 shadow-card-hover bg-orange-50/20 dark:bg-orange-950/20",
    },
    {
      id: "In Plant Work",
      tab: "In Plant Work",
      title: "Plant Execution",
      count: stageCounts.inPlant,
      pct: getPct(stageCounts.inPlant),
      subtitle: "Manufacturing",
      tagText: `${getPct(stageCounts.inPlant)}% share`,
      icon: Factory,
      iconBg: "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/70 dark:text-indigo-400 border border-indigo-200/70 dark:border-indigo-900/60",
      topBar: "bg-indigo-500",
      barColor: "bg-indigo-500",
      textColor: "text-indigo-600 dark:text-indigo-400",
      selectedRing: "border-indigo-500 ring-2 ring-indigo-500/25 shadow-card-hover bg-indigo-50/20 dark:bg-indigo-950/20",
    },
    {
      id: "Dispatched / Closed",
      tab: "Dispatched / Closed",
      title: "Dispatched / Closed",
      count: stageCounts.dispatched,
      pct: getPct(stageCounts.dispatched),
      subtitle: "Delivered",
      tagText: `${getPct(stageCounts.dispatched)}% share`,
      icon: CheckCircle2,
      iconBg: "bg-teal-50 text-teal-600 dark:bg-teal-950/70 dark:text-teal-400 border border-teal-200/70 dark:border-teal-900/60",
      topBar: "bg-teal-500",
      barColor: "bg-teal-500",
      textColor: "text-teal-600 dark:text-teal-400",
      selectedRing: "border-teal-500 ring-2 ring-teal-500/25 shadow-card-hover bg-teal-50/20 dark:bg-teal-950/20",
    },
    {
      id: "Actual Deal",
      tab: "Actual Deal",
      title: "Actual Deals",
      count: stageCounts.actualDeal,
      pct: getPct(stageCounts.actualDeal),
      subtitle: "Commercial Wins",
      tagText: `${getPct(stageCounts.actualDeal)}% share`,
      icon: DollarSign,
      iconBg: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/70 dark:text-emerald-400 border border-emerald-200/70 dark:border-emerald-900/60",
      topBar: "bg-emerald-500",
      barColor: "bg-emerald-500",
      textColor: "text-emerald-600 dark:text-emerald-400",
      selectedRing: "border-emerald-500 ring-2 ring-emerald-500/25 shadow-card-hover bg-emerald-50/20 dark:bg-emerald-950/20",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5">
      {cards.map((c) => {
        const isSelected = filterTab === c.tab;
        const Icon = c.icon;

        return (
          <div
            key={c.id}
            role="button"
            tabIndex={0}
            onClick={() => onSelectTab(c.tab)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelectTab(c.tab);
              }
            }}
            className={`group relative p-3.5 sm:p-4 rounded-xl cursor-pointer transition-all border outline-none select-none ${
              isSelected
                ? `${c.selectedRing}`
                : "bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-850/50 shadow-sm"
            }`}
          >
            {/* Active top indicator hairline */}
            {isSelected && (
              <div className={`absolute top-0 left-0 right-0 h-0.5 ${c.topBar}`} />
            )}

            {/* Header: Icon + Title + Share */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${c.iconBg}`}>
                  <Icon size={14} className="stroke-[2.2]" />
                </div>
                <span className={`text-[11px] font-bold uppercase tracking-wider truncate ${isSelected ? "text-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200"}`}>
                  {c.title}
                </span>
              </div>
              <span className="font-mono text-[10px] font-semibold text-slate-400 dark:text-slate-500 shrink-0">
                {c.tagText}
              </span>
            </div>

            {/* Metric Count & Subtitle */}
            <div className="mt-2.5 flex items-baseline justify-between gap-2">
              <p className="text-2xl sm:text-[26px] font-bold font-mono text-slate-900 dark:text-slate-100 tracking-tight leading-none">
                {c.count.toLocaleString()}
              </p>
              <span className={`text-[11px] font-semibold truncate ${c.textColor}`}>
                {c.subtitle}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full rounded-full h-1 mt-2.5 bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className={`h-1 rounded-full transition-all duration-300 ${c.barColor}`}
                style={{ width: `${Math.min(c.pct, 100)}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};
