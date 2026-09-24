import React from "react";
import { SampleRequestItem } from "@/features/sample-requests/types";
import { Factory, Settings } from "@/components/ui/icons";

export interface PlantCapacityWidgetProps {
  sampleRequests: SampleRequestItem[];
  onManagePlants?: () => void;
}

export const PlantCapacityWidget: React.FC<PlantCapacityWidgetProps> = ({
  sampleRequests,
  onManagePlants,
}) => {
  const plantStats = React.useMemo(() => {
    const plantsMap: Record<
      string,
      { name: string; code: string; total: number; inPlant: number; completed: number }
    > = {
      khaniwade: { name: "Khaniwade Central", code: "PLANT-1505", total: 0, inPlant: 0, completed: 0 },
      palghar: { name: "Palghar Factory", code: "PLANT-1510", total: 0, inPlant: 0, completed: 0 },
      daman: { name: "Daman Facility", code: "PLANT-1520", total: 0, inPlant: 0, completed: 0 },
      vasai: { name: "Vasai Hub", code: "PLANT-1530", total: 0, inPlant: 0, completed: 0 },
    };

    for (const r of sampleRequests) {
      const p = String(r.targetPlant || "").toLowerCase();
      const s = String(r.status || "").toLowerCase();
      const isInPlant = s.includes("plant") || s.includes("execution");
      const isDone = s.includes("dispatch") || s.includes("close") || s.includes("deal") || s.includes("actual");

      if (p.includes("1505") || p.includes("khaniwade")) {
        plantsMap.khaniwade.total++;
        if (isInPlant) plantsMap.khaniwade.inPlant++;
        if (isDone) plantsMap.khaniwade.completed++;
      } else if (p.includes("1510") || p.includes("palghar")) {
        plantsMap.palghar.total++;
        if (isInPlant) plantsMap.palghar.inPlant++;
        if (isDone) plantsMap.palghar.completed++;
      } else if (p.includes("1520") || p.includes("daman")) {
        plantsMap.daman.total++;
        if (isInPlant) plantsMap.daman.inPlant++;
        if (isDone) plantsMap.daman.completed++;
      } else if (p.includes("1530") || p.includes("vasai")) {
        plantsMap.vasai.total++;
        if (isInPlant) plantsMap.vasai.inPlant++;
        if (isDone) plantsMap.vasai.completed++;
      } else {
        plantsMap.khaniwade.total++;
        if (isInPlant) plantsMap.khaniwade.inPlant++;
        if (isDone) plantsMap.khaniwade.completed++;
      }
    }

    const totalRequests = Math.max(sampleRequests.length, 1);

    return Object.values(plantsMap).map((pl) => ({
      ...pl,
      sharePct: Math.round((pl.total / totalRequests) * 100),
    }));
  }, [sampleRequests]);

  return (
    <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-card hover:shadow-card-hover transition-all flex flex-col justify-between space-y-3.5">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200/70 dark:border-amber-900/60 flex items-center justify-center">
            <Factory size={15} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Plant Manufacturing Load
            </h3>
            <p className="text-[11px] text-slate-400">
              Allocations across production facilities
            </p>
          </div>
        </div>

        {onManagePlants && (
          <button
            type="button"
            onClick={onManagePlants}
            className="h-7.5 w-7.5 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-center shadow-2xs cursor-pointer"
            title="Configure Plant Allocations"
          >
            <Settings size={14} />
          </button>
        )}
      </div>

      {/* Plants List */}
      <div className="space-y-2.5">
        {plantStats.map((pl) => (
          <div
            key={pl.code}
            className="p-2.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 space-y-1.5"
          >
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {pl.name}
                </span>
                <span className="text-[10px] font-mono text-slate-400 px-1.5 py-0.2 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  {pl.code}
                </span>
              </div>
              <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                {pl.total.toLocaleString()} ({pl.sharePct}%)
              </span>
            </div>

            {/* Capacity Progress Bar */}
            <div className="w-full bg-slate-200/80 dark:bg-slate-700 rounded-full h-1 overflow-hidden">
              <div
                className="h-1 rounded-full bg-amber-500 transition-all duration-300"
                style={{ width: `${Math.max(pl.sharePct, 4)}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span>{pl.inPlant} in sampling</span>
              <span>{pl.completed} completed</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
