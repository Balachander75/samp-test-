import React from "react";
import { useNavigate } from "react-router-dom";
import { UserProfileInfo, DashboardLayout } from "@/features/dashboard";
import {
  Palette,
  Camera,
  Briefcase,
  BarChart3,
  DollarSign,
  HelpCircle,
  Clock,
  ArrowRight,
  Home,
  FileText,
} from "@/components/ui/icons";

export interface WorkInProgressPageProps {
  user?: UserProfileInfo | null;
  onLogout?: () => void;
  title: string;
  moduleKey?: "creative" | "studio" | "samp" | "costing" | "analytics" | "help" | string;
}

interface ModuleThemeConfig {
  icon: React.ElementType;
  badge: string;
  subtitle: string;
  summary: string;
  stageNote: string;
  iconBg: string;
  iconBorder: string;
  iconColor: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  dotColor: string;
  primaryButton: string;
  cardBorder: string;
  cardGlow: string;
  statHighlight: string;
}

const MODULE_CONFIG: Record<string, ModuleThemeConfig> = {
  creative: {
    icon: Palette,
    badge: "Creative Design Studio",
    subtitle: "Digital artwork, packaging design, and visual asset preparation.",
    summary:
      "The Creative Work pipeline is currently in development. Creative staff will soon be able to review active pre-SMT briefs, attach high-resolution artwork, manage die-lines, and submit design packages for studio approval directly here.",
    stageNote: "Staged for Creative Suite Integration",
    iconBg: "bg-gradient-to-br from-rose-50 to-pink-100 dark:from-rose-950/80 dark:to-pink-900/40",
    iconBorder: "border-rose-200 dark:border-rose-800",
    iconColor: "text-rose-600 dark:text-rose-400",
    badgeBg: "bg-rose-50 dark:bg-rose-950/60",
    badgeBorder: "border-rose-200 dark:border-rose-800/80",
    badgeText: "text-rose-700 dark:text-rose-300",
    dotColor: "bg-rose-500",
    primaryButton:
      "bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white shadow-md shadow-rose-600/25",
    cardBorder: "border-rose-200/80 dark:border-rose-900/50",
    cardGlow: "shadow-xl shadow-rose-500/5",
    statHighlight: "text-rose-600 dark:text-rose-400",
  },
  studio: {
    icon: Camera,
    badge: "Studio & CAD Engineering",
    subtitle: "3D CAD modeling, render generation, and physical mockup photography.",
    summary:
      "The Studio Work workspace is currently in active progress. Soon you will be able to orchestrate CAD blueprint conversions, physical 3D simulations, structural folding mockups, and pre-press prepress approvals in this dedicated station.",
    stageNote: "Staged for Studio & CAD Workflows",
    iconBg: "bg-gradient-to-br from-purple-50 to-violet-100 dark:from-purple-950/80 dark:to-violet-900/40",
    iconBorder: "border-purple-200 dark:border-purple-800",
    iconColor: "text-purple-600 dark:text-purple-400",
    badgeBg: "bg-purple-50 dark:bg-purple-950/60",
    badgeBorder: "border-purple-200 dark:border-purple-800/80",
    badgeText: "text-purple-700 dark:text-purple-300",
    dotColor: "bg-purple-500",
    primaryButton:
      "bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white shadow-md shadow-purple-600/25",
    cardBorder: "border-purple-200/80 dark:border-purple-900/50",
    cardGlow: "shadow-xl shadow-purple-500/5",
    statHighlight: "text-purple-600 dark:text-purple-400",
  },
  samp: {
    icon: Briefcase,
    badge: "SAMP Review / PMT Unit",
    subtitle: "Product Management Team specification audits and technical sign-offs.",
    summary:
      "The SAMP Review and PMT technical governance module is currently being finalized. This portal will support multi-parameter paper specification verifications, batch tolerance approvals, and direct plant dispatch scheduling.",
    stageNote: "Staged for Technical Review Release",
    iconBg: "bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-950/80 dark:to-orange-900/40",
    iconBorder: "border-amber-200 dark:border-amber-800",
    iconColor: "text-amber-600 dark:text-amber-400",
    badgeBg: "bg-amber-50 dark:bg-amber-950/60",
    badgeBorder: "border-amber-200 dark:border-amber-800/80",
    badgeText: "text-amber-800 dark:text-amber-300",
    dotColor: "bg-amber-500",
    primaryButton:
      "bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-md shadow-amber-500/25",
    cardBorder: "border-amber-200/80 dark:border-amber-900/50",
    cardGlow: "shadow-xl shadow-amber-500/5",
    statHighlight: "text-amber-600 dark:text-amber-400",
  },
  costing: {
    icon: DollarSign,
    badge: "Costing & Commercial Estimation",
    subtitle: "BOM costing, material rate lookups, and margin calculations.",
    summary:
      "The Costing Team workspace is currently in active development. Costing specialists will soon be able to evaluate raw material breakdown sheets, calculate manufacturing estimates, assess shipping tariffs, and attach commercial proposals directly here.",
    stageNote: "Staged for Costing & Estimation Suite",
    iconBg: "bg-gradient-to-br from-cyan-50 to-teal-100 dark:from-cyan-950/80 dark:to-teal-900/40",
    iconBorder: "border-cyan-200 dark:border-cyan-800",
    iconColor: "text-cyan-600 dark:text-cyan-400",
    badgeBg: "bg-cyan-50 dark:bg-cyan-950/60",
    badgeBorder: "border-cyan-200 dark:border-cyan-800/80",
    badgeText: "text-cyan-800 dark:text-cyan-300",
    dotColor: "bg-cyan-500",
    primaryButton:
      "bg-gradient-to-r from-teal-500 via-cyan-600 to-teal-700 hover:from-teal-600 hover:via-cyan-700 hover:to-teal-800 text-white shadow-md shadow-cyan-600/25",
    cardBorder: "border-cyan-200/80 dark:border-cyan-900/50",
    cardGlow: "shadow-xl shadow-cyan-500/10",
    statHighlight: "text-cyan-600 dark:text-cyan-400",
  },
  analytics: {
    icon: BarChart3,
    badge: "Enterprise Business Intelligence",
    subtitle: "Turnaround velocity, plant capacity, and customer commercial metrics.",
    summary:
      "Advanced sampling analytics and executive reporting dashboards are under active construction. Real-time cycle time distributions, plant capacity utilization, and seasonal deal conversion graphs will appear in this workspace.",
    stageNote: "Staged for BI & Reporting Engine",
    iconBg: "bg-gradient-to-br from-emerald-50 to-green-100 dark:from-emerald-950/80 dark:to-green-900/40",
    iconBorder: "border-emerald-200 dark:border-emerald-800",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    badgeBg: "bg-emerald-50 dark:bg-emerald-950/60",
    badgeBorder: "border-emerald-200 dark:border-emerald-800/80",
    badgeText: "text-emerald-800 dark:text-emerald-300",
    dotColor: "bg-emerald-500",
    primaryButton:
      "bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white shadow-md shadow-emerald-600/30 active:scale-[0.98]",
    cardBorder: "border-emerald-200/80 dark:border-emerald-900/50",
    cardGlow: "shadow-xl shadow-emerald-500/10",
    statHighlight: "text-emerald-600 dark:text-emerald-400",
  },
  help: {
    icon: HelpCircle,
    badge: "Knowledge Base & SOPs",
    subtitle: "Guides, standard operating procedures, and technical documentation.",
    summary:
      "The integrated help center, SOP documentation, and support ticketing hub are currently being prepared for your enterprise team.",
    stageNote: "Staged for Documentation Release",
    iconBg: "bg-gradient-to-br from-slate-900 to-black text-white",
    iconBorder: "border-slate-700 dark:border-slate-700",
    iconColor: "text-white",
    badgeBg: "bg-slate-900 text-white dark:bg-black",
    badgeBorder: "border-slate-700",
    badgeText: "text-slate-100",
    dotColor: "bg-slate-400",
    primaryButton:
      "bg-gradient-to-r from-slate-900 via-slate-950 to-black hover:from-black hover:to-slate-900 text-white shadow-md shadow-black/30 border border-slate-700 active:scale-[0.98]",
    cardBorder: "border-slate-300 dark:border-slate-800",
    cardGlow: "shadow-xl shadow-black/10",
    statHighlight: "text-slate-900 dark:text-slate-100",
  },
};

export const WorkInProgressPage: React.FC<WorkInProgressPageProps> = ({
  user,
  onLogout,
  title,
  moduleKey = "creative",
}) => {
  const navigate = useNavigate();
  const config = MODULE_CONFIG[moduleKey] || MODULE_CONFIG.creative;
  const Icon = config.icon;

  return (
    <DashboardLayout
      user={user}
      onLogout={onLogout}
      title={title}
      subtitle={config.subtitle}
    >
      <div className="flex flex-col items-center justify-center py-10 sm:py-16 px-4 animate-in fade-in duration-200">
        <div
          className={`w-full max-w-2xl rounded-3xl border bg-white dark:bg-slate-900 p-8 sm:p-12 text-center space-y-6 transition-all ${config.cardBorder} ${config.cardGlow}`}
        >
          {/* Header Icon + Work In Progress Tag */}
          <div className="flex flex-col items-center space-y-3.5">
            <div className="relative">
              <div
                className={`w-20 h-20 rounded-3xl border flex items-center justify-center shadow-lg transition-transform hover:scale-105 duration-200 ${config.iconBg} ${config.iconBorder} ${config.iconColor}`}
              >
                <Icon size={38} />
              </div>
              <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold shadow-md border-2 border-white dark:border-slate-900">
                <Clock size={14} className="text-amber-400" />
              </div>
            </div>

            <div
              className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border shadow-2xs ${config.badgeBg} ${config.badgeBorder} ${config.badgeText}`}
            >
              <span className={`w-2 h-2 rounded-full ${config.dotColor}`} />
              <span>Work in Progress</span>
              <span className="opacity-50">•</span>
              <span className="font-mono text-[11px] font-semibold">{config.badge}</span>
            </div>
          </div>

          {/* Title & Description */}
          <div className="space-y-3 max-w-lg mx-auto">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              {title} Module
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              {config.summary}
            </p>
          </div>

          {/* Quick Context Strip */}
          <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-850/80 border border-slate-200/70 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 flex items-center justify-between max-w-md mx-auto shadow-2xs">
            <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
              Target Milestone:
            </span>
            <span className={`font-bold font-mono text-xs ${config.statHighlight}`}>
              {config.stageNote}
            </span>
          </div>

          {/* Action CTAs: Rich Color Primary Button + Soft Sleek Secondary */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/sample-requests")}
              className={`h-10 px-5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-2 cursor-pointer shadow-2xs ${config.primaryButton}`}
            >
              <FileText size={15} />
              <span>Open Sample Requests</span>
              <ArrowRight size={14} />
            </button>

            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="h-10 px-4.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold border border-slate-200/80 dark:border-slate-700 transition-colors shadow-2xs flex items-center gap-2 cursor-pointer"
            >
              <Home size={15} />
              <span>Back to Dashboard</span>
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default WorkInProgressPage;
