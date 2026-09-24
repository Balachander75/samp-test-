import React from "react";
import { useNavigate } from "react-router-dom";
import { SampleRequestItem } from "@/features/sample-requests/types";
import {
  Briefcase,
  Palette,
  Camera,
  CheckCircle2,
  Factory,
  DollarSign,
  ArrowUpRight,
} from "@/components/ui/icons";

export interface PipelineVelocityTrackerProps {
  sampleRequests: SampleRequestItem[];
  onSelectStage?: (stageName: string) => void;
}

export const PipelineVelocityTracker: React.FC<PipelineVelocityTrackerProps> = ({
  sampleRequests,
  onSelectStage,
}) => {
  const navigate = useNavigate();

  // Compute breakdown across the 6 major workflow gates
  const stageStats = React.useMemo(() => {
    let draft = 0;
    let creative = 0;
    let studio = 0;
    let samp = 0;
    let inPlant = 0;
    let completed = 0;

    for (const r of sampleRequests) {
      const s = String(r.status || "").toLowerCase();
      if (s.includes("draft") || s.includes("smt")) draft++;
      else if (s.includes("creative")) creative++;
      else if (s.includes("studio")) studio++;
      else if (s.includes("samp") || s.includes("pmt") || s.includes("review")) samp++;
      else if (s.includes("plant") || s.includes("execution")) inPlant++;
      else if (s.includes("dispatch") || s.includes("close") || s.includes("deal") || s.includes("actual")) completed++;
      else draft++;
    }

    const total = Math.max(sampleRequests.length, 1);
    const getPct = (cnt: number) => Math.round((cnt / total) * 100);

    return [
      {
        id: "Draft (Pre-SMT)",
        step: "01",
        title: "Intake (Pre-SMT)",
        count: draft,
        pct: getPct(draft),
        icon: Briefcase,
        color: "bg-blue-600 dark:bg-blue-500",
        iconBox: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-900/60",
        hoverBorder: "hover:border-blue-300 dark:hover:border-blue-750",
      },
      {
        id: "Creative",
        step: "02",
        title: "Creative Artwork",
        count: creative,
        pct: getPct(creative),
        icon: Palette,
        color: "bg-rose-500 dark:bg-rose-500",
        iconBox: "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 border border-rose-200/80 dark:border-rose-900/60",
        hoverBorder: "hover:border-rose-300 dark:hover:border-rose-750",
      },
      {
        id: "Studio",
        step: "03",
        title: "Studio & CAD",
        count: studio,
        pct: getPct(studio),
        icon: Camera,
        color: "bg-purple-600 dark:bg-purple-500",
        iconBox: "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 border border-purple-200/80 dark:border-purple-900/60",
        hoverBorder: "hover:border-purple-300 dark:hover:border-purple-750",
      },
      {
        id: "SAMP",
        step: "04",
        title: "SAMP Review / PMT",
        count: samp,
        pct: getPct(samp),
        icon: CheckCircle2,
        color: "bg-sky-500 dark:bg-sky-400",
        iconBox: "text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60 border border-sky-200/80 dark:border-sky-900/60",
        hoverBorder: "hover:border-sky-300 dark:hover:border-sky-750",
      },
      {
        id: "In Plant Work",
        step: "05",
        title: "Plant Operations",
        count: inPlant,
        pct: getPct(inPlant),
        icon: Factory,
        color: "bg-amber-500 dark:bg-amber-400",
        iconBox: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border border-amber-200/80 dark:border-amber-900/60",
        hoverBorder: "hover:border-amber-300 dark:hover:border-amber-750",
      },
      {
        id: "Dispatched / Closed",
        step: "06",
        title: "Dispatched / Deals",
        count: completed,
        pct: getPct(completed),
        icon: DollarSign,
        color: "bg-emerald-600 dark:bg-emerald-500",
        iconBox: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-900/60",
        hoverBorder: "hover:border-emerald-300 dark:hover:border-emerald-750",
      },
    ];
  }, [sampleRequests]);

  const handleStageClick = (stageId: string) => {
    if (onSelectStage) {
      onSelectStage(stageId);
    } else {
      navigate("/sample-requests", { state: { initialFilterTab: stageId } });
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-card hover:shadow-card-hover transition-all space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[10px] font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/70 px-2 py-0.5 rounded font-mono uppercase">
              Pipeline Gates
            </span>
            <span className="text-xs text-slate-400 font-medium">
              6 Workflow Stages
            </span>
          </div>
          <h2 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
            Pipeline Throughput & Stage Velocity
          </h2>
        </div>

        <button
          type="button"
          onClick={() => navigate("/sample-requests")}
          className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 inline-flex items-center gap-1 cursor-pointer self-start sm:self-center transition-colors"
        >
          <span>View Master Catalog</span>
          <ArrowUpRight size={13} className="stroke-[2.5]" />
        </button>
      </div>

      {/* Funnel Stage Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2.5">
        {stageStats.map((st) => {
          const Icon = st.icon;

          return (
            <div
              key={st.id}
              onClick={() => handleStageClick(st.id)}
              className={`group p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-800/80 shadow-2xs transition-all duration-150 cursor-pointer flex flex-col justify-between space-y-2.5 ${st.hoverBorder}`}
            >
              {/* Top Row: Step # and Icon */}
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-mono font-bold text-slate-400 dark:text-slate-500">
                  GATE {st.step}
                </span>
                <div className={`w-6 h-6 rounded-lg ${st.iconBox} flex items-center justify-center`}>
                  <Icon size={12} />
                </div>
              </div>

              {/* Center: Stage Title */}
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate leading-snug">
                  {st.title}
                </h3>
              </div>

              {/* Bottom: Count & Progress */}
              <div className="space-y-1 pt-1.5 border-t border-slate-200/60 dark:border-slate-700/60">
                <div className="flex items-baseline justify-between">
                  <span className="text-lg font-bold font-mono text-slate-900 dark:text-slate-100">
                    {st.count.toLocaleString()}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400 font-mono">
                    {st.pct}%
                  </span>
                </div>

                <div className="w-full bg-slate-200/70 dark:bg-slate-700 rounded-full h-1 overflow-hidden">
                  <div
                    className={`h-1 rounded-full ${st.color} transition-all duration-300`}
                    style={{ width: `${Math.min(st.pct, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
