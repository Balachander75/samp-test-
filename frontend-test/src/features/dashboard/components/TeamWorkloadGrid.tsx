import React from "react";
import { SampleRequestItem } from "@/features/sample-requests/types";
import {
  Briefcase,
  Palette,
  Camera,
  Sparkles,
  Factory,
  Package,
  ChevronRight,
  CheckCircle2,
} from "@/components/ui/icons";

import { TeamMemberItem } from "../types";

export interface TeamWorkloadItem {
  id: string;
  step: number;
  name: string;
  stageName: string;
  icon: React.ElementType;
  description: string;
  theme: {
    badge: string;
    iconBg: string;
    iconColor: string;
    progressBar: string;
    selectedRing: string;
  };
}

const TEAMS_CONFIG: (TeamWorkloadItem & { cardClass: string; railColor: string; activeBg: string })[] = [
  {
    id: "sales",
    step: 1,
    name: "Commercial Sales",
    stageName: "Commercial Intake & Pre-SMT",
    icon: Briefcase,
    description: "Customer requirements intake, program specifications & initial commercial validation",
    cardClass: "card-jewel-cobalt",
    railColor: "bg-blue-600",
    activeBg: "bg-blue-50 text-blue-700 border-blue-200",
    theme: {
      badge: "bg-blue-50 text-blue-700 border-blue-200/80",
      iconBg: "bg-blue-100/70 text-blue-700 border-blue-200",
      iconColor: "text-blue-700",
      progressBar: "bg-gradient-to-r from-blue-500 to-blue-600",
      selectedRing: "border-blue-500 ring-2 ring-blue-500/25 shadow-md",
    },
  },
  {
    id: "creative",
    step: 2,
    name: "Creative Design",
    stageName: "Aesthetic Design & Visual Proofs",
    icon: Palette,
    description: "Cover aesthetics, typography styling, visual artwork validation & customer layout proofs",
    cardClass: "card-jewel-rose",
    railColor: "bg-rose-500",
    activeBg: "bg-rose-50 text-rose-700 border-rose-200",
    theme: {
      badge: "bg-rose-50 text-rose-700 border-rose-200/80",
      iconBg: "bg-rose-100/70 text-rose-700 border-rose-200",
      iconColor: "text-rose-700",
      progressBar: "bg-gradient-to-r from-rose-500 to-rose-600",
      selectedRing: "border-rose-500 ring-2 ring-rose-500/25 shadow-md",
    },
  },
  {
    id: "studio",
    step: 3,
    name: "Studio & CAD",
    stageName: "CAD Engineering & Pre-Press",
    icon: Camera,
    description: "Binding engineering, physical tolerances, dimension checks & prototype CAD modeling",
    cardClass: "card-jewel-violet",
    railColor: "bg-purple-600",
    activeBg: "bg-purple-50 text-purple-700 border-purple-200",
    theme: {
      badge: "bg-purple-50 text-purple-700 border-purple-200/80",
      iconBg: "bg-purple-100/70 text-purple-700 border-purple-200",
      iconColor: "text-purple-700",
      progressBar: "bg-gradient-to-r from-purple-500 to-purple-600",
      selectedRing: "border-purple-500 ring-2 ring-purple-500/25 shadow-md",
    },
  },
  {
    id: "samp",
    step: 4,
    name: "SAMP Review / PMT",
    stageName: "Quality Assurance & Sign-Off Gate",
    icon: Sparkles,
    description: "Pre-production quality control, technical compliance & mandatory PMT gatekeeping review",
    cardClass: "card-jewel-sky",
    railColor: "bg-sky-500",
    activeBg: "bg-sky-50 text-sky-700 border-sky-200",
    theme: {
      badge: "bg-sky-50 text-sky-700 border-sky-200/80",
      iconBg: "bg-sky-100/70 text-sky-700 border-sky-200",
      iconColor: "text-sky-700",
      progressBar: "bg-gradient-to-r from-sky-500 to-sky-600",
      selectedRing: "border-sky-500 ring-2 ring-sky-500/25 shadow-md",
    },
  },
  {
    id: "plant",
    step: 5,
    name: "Plant Operations",
    stageName: "Physical Fabrication & Line Trial",
    icon: Factory,
    description: "Physical sample fabrication, pilot batch execution & line trials across production plants",
    cardClass: "card-jewel-amber",
    railColor: "bg-amber-500",
    activeBg: "bg-amber-50 text-amber-800 border-amber-200",
    theme: {
      badge: "bg-amber-50 text-amber-800 border-amber-200/80",
      iconBg: "bg-amber-100/70 text-amber-800 border-amber-200",
      iconColor: "text-amber-800",
      progressBar: "bg-gradient-to-r from-amber-500 to-amber-600",
      selectedRing: "border-amber-500 ring-2 ring-amber-500/25 shadow-md",
    },
  },
  {
    id: "dispatch",
    step: 6,
    name: "Logistics & Dispatch",
    stageName: "Packaging & Delivery Handover",
    icon: Package,
    description: "Protective packaging, courier tracking, client dispatch handover & sample closure",
    cardClass: "card-jewel-teal",
    railColor: "bg-teal-500",
    activeBg: "bg-teal-50 text-teal-700 border-teal-200",
    theme: {
      badge: "bg-teal-50 text-teal-700 border-teal-200/80",
      iconBg: "bg-teal-100/70 text-teal-700 border-teal-200",
      iconColor: "text-teal-700",
      progressBar: "bg-gradient-to-r from-teal-500 to-teal-600",
      selectedRing: "border-teal-500 ring-2 ring-teal-500/25 shadow-md",
    },
  },
];

interface TeamWorkloadGridProps {
  sampleRequests: SampleRequestItem[];
  users?: TeamMemberItem[];
  selectedTeam: string | null;
  onSelectTeam: (teamId: string | null) => void;
}

export const TeamWorkloadGrid: React.FC<TeamWorkloadGridProps> = ({
  sampleRequests,
  users = [],
  selectedTeam,
  onSelectTeam,
}) => {
  const totalRequests = sampleRequests.length || 1;

  // Memoize counts per team for optimal rendering performance
  const teamCounts = React.useMemo(() => {
    const counts: Record<string, number> = {
      sales: 0,
      creative: 0,
      studio: 0,
      samp: 0,
      plant: 0,
      dispatch: 0,
    };

    for (const r of sampleRequests) {
      const s = String(r.status || "").toLowerCase();
      if (s.includes("draft") || s.includes("smt")) counts.sales++;
      else if (s.includes("creative")) counts.creative++;
      else if (s.includes("studio")) counts.studio++;
      else if (s.includes("samp") || s.includes("pmt") || s.includes("qc") || s.includes("review")) counts.samp++;
      else if (s.includes("plant") || s.includes("execution")) counts.plant++;
      else if (s.includes("dispatch") || s.includes("close") || s.includes("deal") || s.includes("actual")) counts.dispatch++;
      else counts.sales++; // fallback to commercial draft
    }

    return counts;
  }, [sampleRequests]);

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-800">
              Department Workloads & Review Stages
            </h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
              6 Review Units
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Sequential workflow pipeline tracking batch progress from customer intake to client dispatch
          </p>
        </div>

        <div className="flex items-center gap-2">
          {selectedTeam && (
            <button
              onClick={() => onSelectTeam(null)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
            >
              <span>Filter: <strong className="uppercase">{selectedTeam}</strong></span>
              <span className="text-indigo-400">✕</span>
            </button>
          )}
          <span className="text-xs font-semibold text-slate-500 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
            Total Active: <strong className="text-slate-900">{sampleRequests.length.toLocaleString()}</strong>
          </span>
        </div>
      </div>

      {/* 3x2 Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {TEAMS_CONFIG.map((team) => {
          const count = teamCounts[team.id] || 0;
          const percent = totalRequests > 0 ? Math.round((count / totalRequests) * 100) : 0;
          const isSelected = selectedTeam === team.id;
          const IconComp = team.icon;

          return (
            <div
              key={team.id}
              onClick={() => onSelectTeam(isSelected ? null : team.id)}
              className={`group relative rounded-2xl p-5 transition-all duration-200 cursor-pointer overflow-hidden hover:-translate-y-0.5 hover:shadow-md ${team.cardClass} ${
                isSelected
                  ? team.theme.selectedRing
                  : ""
              }`}
            >
              {/* Left Accent Rail */}
              <div className={`absolute left-0 top-3 bottom-3 w-1 rounded-r-full ${team.railColor}`} />

              {/* Top Header Row */}
              <div className="flex items-start justify-between gap-3 mb-3 pl-1">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-xl border flex items-center justify-center shadow-xs shrink-0 ${team.theme.iconBg}`}>
                    <IconComp className={`h-5 w-5 ${team.theme.iconColor}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-slate-400 font-mono">
                        0{team.step}
                      </span>
                      <h3 className="text-xs font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {team.name}
                      </h3>
                    </div>
                    <p className="text-[10px] font-medium text-slate-500 mt-0.5">
                      {team.stageName}
                    </p>
                  </div>
                </div>

                {/* Queue status badge */}
                {count > 0 ? (
                  <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full border shadow-2xs shrink-0 ${team.activeBg}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${team.railColor}`} />
                    In Review
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white text-slate-400 border border-slate-200/80 shadow-2xs shrink-0">
                    <CheckCircle2 className="h-3 w-3 text-slate-400" />
                    Ready
                  </span>
                )}
              </div>

              {/* Functional description */}
              <p className="text-[11px] text-slate-600 line-clamp-2 min-h-[34px] mb-3.5 leading-relaxed pl-1">
                {team.description}
              </p>

              {/* Progress & Count Metrics Card */}
              <div className="bg-white/80 backdrop-blur-xs p-3 rounded-xl border border-slate-200/60 mb-3.5 shadow-2xs ml-1">
                <div className="flex items-baseline justify-between mb-2">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-black text-slate-900 tracking-tight">
                      {count.toLocaleString()}
                    </span>
                    <span className="text-[11px] font-bold text-slate-500">
                      {count === 1 ? "Sample" : "Samples"}
                    </span>
                  </div>
                  <span className="text-[11px] font-black text-slate-700 font-mono">
                    {percent}% Share
                  </span>
                </div>

                <div className="w-full bg-slate-200/70 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-1.5 rounded-full transition-all duration-500 ${
                      count > 0 ? team.theme.progressBar : "bg-transparent"
                    }`}
                    style={{ width: `${Math.min(percent, 100)}%` }}
                  />
                </div>
              </div>

              {/* Footer: Stage Lead & Filter Action */}
              {(() => {
                const assignedLead = users.find((u) => {
                  const r = (u.role || "").toLowerCase();
                  const sr = (u.sub_role || "").toLowerCase();
                  if (team.id === "sales") {
                    if (sr.includes("executive") || sr.includes("lead")) return true;
                    return r.includes("sales");
                  }
                  if (team.id === "creative") {
                    if (sr.includes("lead")) return true;
                    return r.includes("creative");
                  }
                  if (team.id === "studio") {
                    if (sr.includes("lead") || sr.includes("engineer")) return true;
                    return r.includes("studio");
                  }
                  if (team.id === "samp") {
                    if (sr.includes("lead")) return true;
                    return r.includes("samp") || r.includes("pmt") || r.includes("review");
                  }
                  if (team.id === "plant") {
                    if (sr.includes("head")) return true;
                    return r.includes("plant") || r.includes("operation");
                  }
                  if (team.id === "dispatch") {
                    if (sr.includes("lead") || sr.includes("manager")) return true;
                    return r.includes("dispatch") || r.includes("logistics");
                  }
                  return false;
                });

                const initials = assignedLead
                  ? assignedLead.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)
                  : "";

                return (
                  <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 text-xs">
                    <div className="flex items-center gap-1.5 min-w-0">
                      {assignedLead ? (
                        <>
                          <div className="h-5 w-5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center text-[9px] font-bold shrink-0">
                            {initials}
                          </div>
                          <div className="min-w-0 truncate">
                            <span className="text-[11px] font-bold text-slate-800 truncate block">
                              {assignedLead.name}
                            </span>
                          </div>
                        </>
                      ) : (
                        <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                          Unassigned Lead
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      className={`inline-flex items-center gap-0.5 text-[11px] font-bold px-2 py-0.5 rounded-md transition-colors ${
                        isSelected
                          ? "bg-indigo-600 text-white shadow-2xs"
                          : "text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                      }`}
                    >
                      {isSelected ? "Filtered" : "Inspect"}
                      <ChevronRight className="h-3 w-3" />
                    </button>
                  </div>
                );
              })()}
            </div>
          );
        })}
      </div>
    </div>
  );
};
