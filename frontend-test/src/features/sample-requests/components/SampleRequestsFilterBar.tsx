import React, { useEffect, useRef } from "react";
import {
  Search,
  Plus,
  X,
  Layers,
  Clock,
  Palette,
  Camera,
  ShieldCheck,
  Factory,
  CheckCircle2,
  DollarSign,
  Filter,
} from "@/components/ui/icons";

export interface SampleRequestsFilterBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onExportCSV?: () => void;
  onFeasibilityCheck?: () => void;
  onProgramPlanning?: () => void;
  onNewRequest: () => void;
  filterTab: string;
  onSelectTab: (tab: string) => void;
  stageTabs: string[];
  stageCountsMap?: Record<string, number>;
}

interface StageTheme {
  icon: React.ComponentType<{ size?: number | string; className?: string }>;
  label: string;
  activePill: string;
  activeBadge: string;
}

function getStageColorTheme(tab: string): StageTheme {
  const t = tab.toLowerCase();
  if (t === "all") {
    return {
      icon: Layers,
      label: "All",
      activePill: "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm shadow-blue-500/30",
      activeBadge: "bg-blue-50 text-blue-700 border-blue-200/80 dark:bg-blue-950/70 dark:text-blue-300 dark:border-blue-800",
    };
  }
  if (t.includes("draft") || t.includes("smt")) {
    return {
      icon: Clock,
      label: "Draft (Pre-SMT)",
      activePill: "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm shadow-amber-500/30",
      activeBadge: "bg-amber-50 text-amber-800 border-amber-200/80 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-800",
    };
  }
  if (t.includes("creative")) {
    return {
      icon: Palette,
      label: "Creative",
      activePill: "bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-sm shadow-red-500/30",
      activeBadge: "bg-rose-50 text-rose-700 border-rose-200/80 dark:bg-rose-950/70 dark:text-rose-300 dark:border-rose-800",
    };
  }
  if (t.includes("studio")) {
    return {
      icon: Camera,
      label: "Studio",
      activePill: "bg-gradient-to-r from-purple-600 to-violet-600 text-white shadow-sm shadow-purple-500/30",
      activeBadge: "bg-purple-50 text-purple-700 border-purple-200/80 dark:bg-purple-950/70 dark:text-purple-300 dark:border-purple-800",
    };
  }
  if (t.includes("samp")) {
    return {
      icon: ShieldCheck,
      label: "SAMP Team Review",
      activePill: "bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-sm shadow-orange-500/30",
      activeBadge: "bg-orange-50 text-orange-800 border-orange-200/80 dark:bg-orange-950/70 dark:text-orange-300 dark:border-orange-800",
    };
  }
  if (t.includes("plant")) {
    return {
      icon: Factory,
      label: "In Plant Work",
      activePill: "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm shadow-indigo-500/30",
      activeBadge: "bg-indigo-50 text-indigo-700 border-indigo-200/80 dark:bg-indigo-950/70 dark:text-indigo-300 dark:border-indigo-800",
    };
  }
  if (t.includes("dispatch")) {
    return {
      icon: CheckCircle2,
      label: "Dispatched / Closed",
      activePill: "bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-sm shadow-teal-500/30",
      activeBadge: "bg-teal-50 text-teal-800 border-teal-200/80 dark:bg-teal-950/70 dark:text-teal-300 dark:border-teal-800",
    };
  }
  if (t.includes("deal") || t.includes("actual")) {
    return {
      icon: DollarSign,
      label: "Actual Deal",
      activePill: "bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-sm shadow-emerald-500/30",
      activeBadge: "bg-emerald-50 text-emerald-800 border-emerald-200/80 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800",
    };
  }
  return {
    icon: Layers,
    label: tab,
    activePill: "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm shadow-blue-500/30",
    activeBadge: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/70 dark:text-blue-300 dark:border-blue-800",
  };
}

export const SampleRequestsFilterBar: React.FC<SampleRequestsFilterBarProps> = ({
  searchTerm,
  onSearchChange,
  onExportCSV,
  onFeasibilityCheck,
  onProgramPlanning,
  onNewRequest,
  filterTab,
  onSelectTab,
  stageTabs,
  stageCountsMap,
}) => {
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Global '/' keyboard shortcut to focus search, and 'Escape' to clear
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (
        e.key === "/" &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === "Escape" && document.activeElement === searchInputRef.current) {
        if (searchTerm) {
          onSearchChange("");
        } else {
          searchInputRef.current?.blur();
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [searchTerm, onSearchChange]);

  const hasActiveFilters = Boolean(searchTerm.trim() || filterTab !== "All");
  const activeStageTheme = getStageColorTheme(filterTab);

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-card space-y-3.5">
      {/* Search & Actions Header */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-xl">
          <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <Search size={15} className="stroke-[2.2]" />
          </div>
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search material code, description, SR code, customer, plant... (Press '/' to focus)"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full h-9 pl-10 pr-11 text-xs bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/90 dark:border-slate-700/90 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all font-medium shadow-2xs"
          />
          {searchTerm ? (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded-md cursor-pointer"
              title="Clear search (Esc)"
            >
              <X size={13} />
            </button>
          ) : (
            <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 hidden sm:inline-flex h-4.5 items-center px-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-[9px] font-medium text-slate-400 shadow-2xs">
              /
            </kbd>
          )}
        </div>

        {/* Action Controls: Compact, Proportional & Ergonomic */}
        <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
          <button
            type="button"
            onClick={onNewRequest}
            className="group h-9 px-4 text-xs font-bold inline-flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-sm shadow-blue-500/25 active:scale-[0.98] transition-all cursor-pointer shrink-0 select-none"
          >
            <Plus size={14} className="stroke-[2.5] text-white" />
            <span>Create New Request</span>
          </button>
        </div>
      </div>

      {/* Stage Tab Filters with Unique Department Theming Colors */}
      <div className="tabs-fade-right flex items-center gap-1.5 overflow-x-auto pb-1 border-t border-slate-100 dark:border-slate-800 pt-3">
        {stageTabs.map((tab) => {
          const isSel = filterTab === tab;
          const count = stageCountsMap ? stageCountsMap[tab] : undefined;
          const stageTheme = getStageColorTheme(tab);
          const StageIcon = stageTheme.icon;

          return (
            <button
              key={tab}
              type="button"
              onClick={() => onSelectTab(tab)}
              className={`group inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer select-none ${
                isSel
                  ? `${stageTheme.activePill} scale-[1.01]`
                  : "bg-slate-50/80 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/90 dark:border-slate-750"
              }`}
            >
              <StageIcon
                size={13}
                className={isSel ? "text-white" : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors"}
              />
              <span>{stageTheme.label}</span>
              {typeof count === "number" && (
                <span
                  className={`text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded-md ${
                    isSel
                      ? "bg-white/20 text-white"
                      : "bg-slate-200/70 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Active Filter Chips Strip with Theme Color Badges */}
      {hasActiveFilters && (
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/60 text-[11px]">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-slate-400 font-medium flex items-center gap-1">
              <Filter size={11} />
              <span>Active filters:</span>
            </span>

            {filterTab !== "All" && (
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${activeStageTheme.activeBadge}`}>
                <span>Stage:</span>
                <strong className="font-bold">{activeStageTheme.label}</strong>
                <button
                  type="button"
                  onClick={() => onSelectTab("All")}
                  className="hover:opacity-75 transition-opacity ml-0.5 cursor-pointer"
                  title="Remove stage filter"
                >
                  ✕
                </button>
              </span>
            )}

            {searchTerm.trim() && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-medium border border-blue-200/80 dark:border-blue-900/60">
                <span>Query:</span>
                <strong className="font-semibold truncate max-w-[140px]">"{searchTerm}"</strong>
                <button
                  type="button"
                  onClick={() => onSearchChange("")}
                  className="hover:text-rose-500 transition-colors ml-0.5 cursor-pointer"
                  title="Remove search filter"
                >
                  ✕
                </button>
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              onSearchChange("");
              onSelectTab("All");
            }}
            className="text-[11px] font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 cursor-pointer shrink-0 transition-colors"
          >
            Reset all
          </button>
        </div>
      )}
    </div>
  );
};
