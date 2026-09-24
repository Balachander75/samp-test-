import React from "react";
import { useNavigate } from "react-router-dom";
import { TeamMemberItem } from "../types";
import { Users, ArrowRight } from "@/components/ui/icons";

interface TeamMembersSummaryWidgetProps {
  users: TeamMemberItem[];
  isLoading?: boolean;
}

export const TeamMembersSummaryWidget: React.FC<TeamMembersSummaryWidgetProps> = ({
  users,
  isLoading = false,
}) => {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs p-6 space-y-3 animate-pulse">
        <div className="h-6 w-48 bg-slate-100 dark:bg-slate-800 rounded-lg" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-slate-50 dark:bg-slate-800 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const activeCount = users.filter((u) => u.is_active).length;
  const frozenCount = users.length - activeCount;

  const depts = [
    { name: "Commercial Sales", color: "bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200/80 dark:border-blue-800/60" },
    { name: "Creative Design", color: "bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200/80 dark:border-rose-800/60" },
    { name: "Studio & CAD", color: "bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border-purple-200/80 dark:border-purple-800/60" },
    { name: "SAMP Review / PMT", color: "bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/60" },
    { name: "Plant Operations", color: "bg-violet-50 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 border-violet-200/80 dark:border-violet-800/60" },
    { name: "Logistics & Dispatch", color: "bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 border-teal-200/80 dark:border-teal-800/60" },
    { name: "Administrator", color: "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border-indigo-200/80 dark:border-indigo-800/60" },
  ];

  const getDeptCount = (deptName: string) => {
    const d = deptName.toLowerCase();
    return users.filter((u) => {
      const r = (u.role || "").toLowerCase();
      if (d.includes("sales")) return r.includes("sales");
      if (d.includes("creative")) return r.includes("creative");
      if (d.includes("studio")) return r.includes("studio");
      if (d.includes("samp") || d.includes("pmt")) return r.includes("samp") || r.includes("pmt") || r.includes("review");
      if (d.includes("plant")) return r.includes("plant") || r.includes("operation");
      if (d.includes("dispatch") || d.includes("logistics")) return r.includes("dispatch") || r.includes("logistics");
      if (d.includes("admin")) return r.includes("admin");
      return false;
    }).length;
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-card hover:shadow-card-hover transition-all p-5 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-200/60 dark:border-indigo-800/60 shrink-0">
            <Users size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                Staffing & Operational Directory
              </h3>
              <span className="text-[10px] font-semibold px-2 py-0.2 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono border border-slate-200/70 dark:border-slate-700">
                {users.length} Active
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Department assignees, reviewer governance, and plant access controls
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate("/members")}
          className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 px-2.5 py-1 rounded-lg bg-blue-50/70 dark:bg-blue-950/50 hover:bg-blue-100/70 border border-blue-200/70 dark:border-blue-900/60 inline-flex items-center gap-1.5 cursor-pointer self-start sm:self-center transition-all"
        >
          <span>View Directory</span>
          <ArrowRight size={12} />
        </button>
      </div>

      {/* Quick Summary Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-0.5">
          <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Active Staff</span>
          <div className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">
            {activeCount}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-0.5">
          <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Frozen Staff</span>
          <div className="text-lg font-bold font-mono text-slate-700 dark:text-slate-300">
            {frozenCount}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-0.5">
          <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Units Configured</span>
          <div className="text-lg font-bold font-mono text-indigo-600 dark:text-indigo-400">
            {depts.length}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-0.5">
          <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Review Leads</span>
          <div className="text-lg font-bold font-mono text-purple-600 dark:text-purple-400">
            {users.filter((u) => (u.role || "").toLowerCase().includes("admin") || (u.sub_role || "").toLowerCase().includes("lead")).length}
          </div>
        </div>
      </div>

      {/* Department Breakdown Chips */}
      <div className="space-y-2">
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
          Workforce by Department
        </span>
        <div className="flex items-center gap-1.5 flex-wrap">
          {depts.map((d) => {
            const count = getDeptCount(d.name);
            return (
              <div
                key={d.name}
                onClick={() => navigate("/members")}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer hover:shadow-2xs ${d.color}`}
              >
                <span>{d.name}</span>
                <span className="px-1.5 py-0.2 rounded font-mono text-[10px] font-bold bg-white/80 dark:bg-slate-900/80">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Team Avatars Footer */}
      <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex -space-x-1.5 overflow-hidden shrink-0">
            {users.slice(0, 6).map((u) => (
              <div
                key={u.id}
                className="inline-block h-6 w-6 rounded-full ring-2 ring-white dark:ring-slate-900 bg-slate-800 text-white text-[9px] font-bold flex items-center justify-center"
                title={`${u.name} (${u.role})`}
              >
                {getInitials(u.name)}
              </div>
            ))}
            {users.length > 6 && (
              <div className="inline-block h-6 w-6 rounded-full ring-2 ring-white dark:ring-slate-900 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-[9px] font-semibold flex items-center justify-center">
                +{users.length - 6}
              </div>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
            {activeCount} active operational staff across all plant & review lines
          </p>
        </div>
      </div>
    </div>
  );
};
