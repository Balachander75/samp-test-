import React from "react";
import { SampleRequestItem } from "@/features/sample-requests/types";
import { Users, Calendar } from "@/components/ui/icons";

export interface CustomerVelocityWidgetProps {
  sampleRequests: SampleRequestItem[];
}

export const CustomerVelocityWidget: React.FC<CustomerVelocityWidgetProps> = ({
  sampleRequests,
}) => {
  const { topCustomers, seasonsList, totalCustomersCount } = React.useMemo(() => {
    const custMap: Record<string, number> = {};
    const seasonsMap: Record<string, number> = {};

    for (const r of sampleRequests) {
      const c = (r.customer || "General Market").trim();
      custMap[c] = (custMap[c] || 0) + 1;

      const yr = (r.programYear || r.year || "2026-2027").replace(/BTS/gi, "").trim();
      seasonsMap[yr] = (seasonsMap[yr] || 0) + 1;
    }

    const total = Math.max(sampleRequests.length, 1);

    const sortedCustomers = Object.entries(custMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([name, count]) => ({
        name,
        count,
        pct: Math.round((count / total) * 100),
      }));

    const sortedSeasons = Object.entries(seasonsMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([season, count]) => ({
        season,
        count,
        pct: Math.round((count / total) * 100),
      }));

    return {
      topCustomers: sortedCustomers,
      seasonsList: sortedSeasons,
      totalCustomersCount: Object.keys(custMap).length,
    };
  }, [sampleRequests]);

  return (
    <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-card hover:shadow-card-hover transition-all flex flex-col justify-between space-y-3.5">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/70 dark:border-blue-900/60 flex items-center justify-center">
            <Users size={15} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Top Customer Accounts
            </h3>
            <p className="text-[11px] text-slate-400">
              {totalCustomersCount} commercial accounts active
            </p>
          </div>
        </div>

        <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono border border-slate-200/80 dark:border-slate-700">
          High Demand
        </span>
      </div>

      {/* Top Customers List */}
      <div className="space-y-2.5">
        {topCustomers.map((cust, idx) => (
          <div
            key={cust.name}
            className="p-2.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 space-y-1.5"
          >
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-5 h-5 rounded-md bg-slate-200/70 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-[10px] flex items-center justify-center shrink-0">
                  #{idx + 1}
                </span>
                <span className="font-semibold text-slate-900 dark:text-slate-100 truncate" title={cust.name}>
                  {cust.name}
                </span>
              </div>
              <span className="font-mono font-bold text-slate-900 dark:text-slate-100 shrink-0 ml-2">
                {cust.count} ({cust.pct}%)
              </span>
            </div>

            <div className="w-full bg-slate-200/80 dark:bg-slate-700 rounded-full h-1 overflow-hidden">
              <div
                className="h-1 rounded-full bg-blue-600 transition-all duration-300"
                style={{ width: `${Math.max(cust.pct, 4)}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Season Target Distribution Footer */}
      <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap text-xs">
        <span className="text-slate-400 text-[11px] font-medium flex items-center gap-1">
          <Calendar size={12} className="text-slate-400" />
          <span>Active Seasons:</span>
        </span>
        <div className="flex items-center gap-1 flex-wrap">
          {seasonsList.map((s) => (
            <span
              key={s.season}
              className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
            >
              {s.season}: {s.count}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
