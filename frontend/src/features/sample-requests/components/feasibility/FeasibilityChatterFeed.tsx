import React, { useMemo } from "react";
import { SampleRequestItem, FeasibilityActivityItem } from "../../types";
import { formatOdooLogDate } from "../../utils/dateUtils";
import { cleanFeasibilityDescription } from "@/infrastructure/api";
import { Clock } from "lucide-react";
import { UserProfile } from "@/features/auth";

export interface FeasibilityChatterFeedProps {
  activeRequest: SampleRequestItem;
  classificationLabel: string;
  onAddNote?: (note: string) => Promise<void>;
  currentUser?: UserProfile | null;
}

interface TimeLogEvent {
  id: string | number;
  actorName: string;
  actorDepartment: string;
  title: string;
  summary: string;
  timestamp: string;
  badge?: {
    text: string;
    variant: "emerald" | "amber" | "rose" | "sky" | "indigo" | "neutral";
  };
}

function getInitials(name?: string): string {
  if (!name) return "US";
  const clean = name.trim();
  const parts = clean.split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return clean.slice(0, 2).toUpperCase();
}

export const FeasibilityChatterFeed: React.FC<FeasibilityChatterFeedProps> = ({
  activeRequest,
  classificationLabel,
}) => {
  // Compile concise, 1-2 line chronological time log entries
  const logEvents = useMemo<TimeLogEvent[]>(() => {
    const events: TimeLogEvent[] = [];
    const recordedActions = new Set<string>();

    const rawActivities: FeasibilityActivityItem[] = Array.isArray(activeRequest.activities)
      ? activeRequest.activities
      : [];

    // 1. Process persisted DB activities (excluding VIEWED)
    rawActivities
      .filter((act) => act.action !== "VIEWED")
      .forEach((act) => {
        recordedActions.add(act.action);
        const payload = act.payload || {};

        if (act.action === "CREATED") {
          const author = act.actorName || activeRequest.createdBy || "Marketing Desk";
          events.push({
            id: act.id,
            actorName: author,
            actorDepartment: act.actorDepartment || "Marketing",
            title: "Raised Request",
            summary: `Submitted feasibility inquiry for ${activeRequest.customer || "Client"} (${classificationLabel}).`,
            timestamp: act.createdAt || activeRequest.createdAt || activeRequest.dateRequestCreated || "",
            badge: { text: "Intake", variant: "indigo" },
          });
        } else if (act.action === "TASK_CLAIMED") {
          const assignee = act.actorName || activeRequest.takenBySamp || "SAMP Lab Engineer";
          events.push({
            id: act.id,
            actorName: assignee,
            actorDepartment: act.actorDepartment || "SAMP Team",
            title: "Claimed Assessment",
            summary: "Assigned for manufacturing capability & tooling feasibility review.",
            timestamp: act.createdAt || activeRequest.takenAtSamp || "",
            badge: { text: "Under Review", variant: "sky" },
          });
        } else if (act.action === "SAMP_EVALUATED") {
          const verdict = payload.verdict || activeRequest.samplingFeasibilityResponse || "Yes";
          const remark = payload.remark || activeRequest.samplingFeasibilityRemark || "Technical specs verified feasible.";
          const reviewer = act.actorName || activeRequest.samplingFeasibilityApprovedBy || "SAMP Lab";
          events.push({
            id: act.id,
            actorName: reviewer,
            actorDepartment: act.actorDepartment || "SAMP Team",
            title: `Technical Verdict: ${verdict}`,
            summary: remark,
            timestamp: act.createdAt || activeRequest.feasibilityClosedAt || "",
            badge: {
              text: verdict === "Yes" ? "Feasible" : verdict === "No" ? "Not Feasible" : "Conditional",
              variant: verdict === "Yes" ? "emerald" : verdict === "No" ? "rose" : "amber",
            },
          });
        } else if (act.action === "MARKETING_DECIDED") {
          const decision = payload.decision || activeRequest.marketingDecision || "Accepted";
          const remark = payload.remark || activeRequest.marketingDecisionRemark || "Commercial sign-off concluded.";
          const decider = act.actorName || activeRequest.marketingDecisionBy || "Marketing Authority";
          events.push({
            id: act.id,
            actorName: decider,
            actorDepartment: act.actorDepartment || "Marketing",
            title: `Commercial: ${decision}`,
            summary: remark,
            timestamp: act.createdAt || activeRequest.marketingDecisionAt || "",
            badge: {
              text: decision === "Accepted" ? "Approved" : "Dropped",
              variant: decision === "Accepted" ? "emerald" : "rose",
            },
          });
        } else if (act.action === "CONVERTED_TO_SAMPLING") {
          const srNum = payload.sample_sr_number || activeRequest.convertedSrNumber || "";
          events.push({
            id: act.id,
            actorName: act.actorName || activeRequest.convertedBy || "Marketing",
            actorDepartment: act.actorDepartment || "Operations",
            title: "Converted to Sample",
            summary: `Commissioned official sample request ${srNum}.`,
            timestamp: act.createdAt || activeRequest.convertedAt || "",
            badge: { text: srNum ? `Sample: ${srNum}` : "Converted", variant: "emerald" },
          });
        } else if (act.action === "NOTE_ADDED") {
          events.push({
            id: act.id,
            actorName: act.actorName || "Team Member",
            actorDepartment: act.actorDepartment || "Operations",
            title: "Internal Note",
            summary: payload.note || "",
            timestamp: act.createdAt || "",
            badge: { text: "Note", variant: "neutral" },
          });
        }
      });

    // 2. Synthesize canonical timeline events if not recorded in DB activities
    if (!recordedActions.has("CREATED")) {
      const author = activeRequest.createdBy || "Marketing Desk";
      events.push({
        id: "synth-create",
        actorName: author,
        actorDepartment: "Marketing",
        title: "Raised Request",
        summary: `Submitted feasibility inquiry for ${activeRequest.customer || "General Client"} (${classificationLabel}).`,
        timestamp: activeRequest.createdAt || activeRequest.dateRequestCreated || "",
        badge: { text: "Intake", variant: "indigo" },
      });
    }

    if (!recordedActions.has("TASK_CLAIMED") && activeRequest.takenBySamp) {
      events.push({
        id: "synth-claim",
        actorName: activeRequest.takenBySamp,
        actorDepartment: "SAMP Team",
        title: "Claimed Assessment",
        summary: "Assigned for manufacturing capability & tooling feasibility review.",
        timestamp: activeRequest.takenAtSamp || activeRequest.createdAt || "",
        badge: { text: "Under Review", variant: "sky" },
      });
    }

    if (!recordedActions.has("SAMP_EVALUATED") && activeRequest.samplingFeasibilityResponse) {
      const verdict = activeRequest.samplingFeasibilityResponse;
      events.push({
        id: "synth-evaluated",
        actorName: activeRequest.samplingFeasibilityApprovedBy || "SAMP Lab",
        actorDepartment: "SAMP Team",
        title: `Technical Verdict: ${verdict}`,
        summary: activeRequest.samplingFeasibilityRemark || "Technical specs verified feasible with plant tooling.",
        timestamp: activeRequest.feasibilityClosedAt || activeRequest.takenAtSamp || "",
        badge: {
          text: verdict === "Yes" ? "Feasible" : verdict === "No" ? "Not Feasible" : "Conditional",
          variant: verdict === "Yes" ? "emerald" : verdict === "No" ? "rose" : "amber",
        },
      });
    }

    if (!recordedActions.has("MARKETING_DECIDED") && activeRequest.marketingDecision) {
      const decision = activeRequest.marketingDecision;
      events.push({
        id: "synth-decision",
        actorName: activeRequest.marketingDecisionBy || "Marketing Authority",
        actorDepartment: "Marketing",
        title: `Commercial: ${decision}`,
        summary: activeRequest.marketingDecisionRemark || "Commercial sign-off concluded.",
        timestamp: activeRequest.marketingDecisionAt || "",
        badge: {
          text: decision === "Accepted" ? "Approved" : "Dropped",
          variant: decision === "Accepted" ? "emerald" : "rose",
        },
      });
    }

    if (!recordedActions.has("CONVERTED_TO_SAMPLING") && activeRequest.convertedSrNumber) {
      events.push({
        id: "synth-converted",
        actorName: activeRequest.convertedBy || "Marketing",
        actorDepartment: "Operations",
        title: "Converted to Sample",
        summary: `Commissioned official sample request ${activeRequest.convertedSrNumber}.`,
        timestamp: activeRequest.convertedAt || "",
        badge: { text: `Sample: ${activeRequest.convertedSrNumber}`, variant: "emerald" },
      });
    }

    // Sort descending by timestamp
    return events.sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime() || 0;
      const timeB = new Date(b.timestamp).getTime() || 0;
      return timeB - timeA;
    });
  }, [activeRequest, classificationLabel]);

  // Color variants mapping
  const badgeStyles = {
    emerald: "bg-emerald-50 dark:bg-emerald-950/40 text-[#006d32] dark:text-[#00d166] border-emerald-200/60 dark:border-emerald-800/40",
    amber: "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200/60 dark:border-amber-800/40",
    rose: "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200/60 dark:border-rose-800/40",
    sky: "bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400 border-sky-200/60 dark:border-sky-800/40",
    indigo: "bg-[#eff4ff] dark:bg-[#006d32]/15 text-[#006d32] dark:text-[#00d166] border-[#006d32]/20 dark:border-[#006d32]/30",
    neutral: "bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-700",
  };

  return (
    <div className="w-80 lg:w-[390px] bg-[#f8f9ff] dark:bg-[#131622] flex flex-col h-full overflow-hidden select-none shadow-[-12px_0_36px_rgba(11,28,48,0.03)] z-10 relative">
      {/* ── Time Log Header ── */}
      <div className="px-5 py-3.5 bg-white/80 dark:bg-[#161826]/80 backdrop-blur-xl flex items-center justify-between sticky top-0 z-20 border-b border-slate-100 dark:border-white/5 shadow-[0_2px_10px_rgba(11,28,48,0.02)]">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#006d32] dark:text-[#00d166]" />
          <h2 className="font-display font-bold text-sm text-slate-900 dark:text-zinc-100 tracking-tight leading-none">
            Time Log
          </h2>
        </div>

        <span className="text-[11px] font-display text-[#006d32] dark:text-[#00d166] bg-[#eff4ff] dark:bg-[#006d32]/20 px-2.5 py-0.5 rounded-full font-bold">
          {logEvents.length} {logEvents.length === 1 ? "Record" : "Records"}
        </span>
      </div>

      {/* ── Chronological Time Log Stream (Max 1-2 lines per entry) ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3.5">
        {logEvents.length === 0 ? (
          <div className="py-12 text-center text-slate-400 font-display text-xs">
            No time log records found.
          </div>
        ) : (
          logEvents.map((evt, idx) => {
            return (
              <div key={evt.id} className="relative flex items-start gap-2.5 select-text group">
                {/* Connecting Vertical Line */}
                {idx !== logEvents.length - 1 && (
                  <div className="absolute left-3.5 top-7 bottom-[-14px] w-px bg-slate-200 dark:bg-white/10" />
                )}

                {/* User Initials Avatar (No icon) */}
                <div
                  className="w-7 h-7 rounded-full bg-[#eff4ff] dark:bg-[#006d32]/25 text-[#006d32] dark:text-[#00d166] font-display font-bold text-[10.5px] flex items-center justify-center shrink-0 border border-[#006d32]/20 shadow-2xs z-10"
                  title={`${evt.actorName} (${evt.actorDepartment})`}
                >
                  {getInitials(evt.actorName)}
                </div>

                {/* Compact 1-2 Line Card */}
                <div className="flex-1 min-w-0 bg-white dark:bg-[#1a1d2c] px-3.5 py-2 rounded-xl border border-slate-100/90 dark:border-white/5 shadow-[0_2px_8px_rgba(11,28,48,0.03)] hover:shadow-xs transition-shadow">
                  {/* Line 1: User Name + Action Title + Timestamp */}
                  <div className="flex items-center justify-between gap-1.5 min-w-0">
                    <div className="flex items-center gap-1.5 min-w-0 truncate">
                      <span className="font-display font-bold text-[12px] text-slate-900 dark:text-zinc-100 truncate">
                        {evt.actorName}
                      </span>
                      <span className="text-slate-300 dark:text-zinc-600">·</span>
                      <span className="font-display font-medium text-[11px] text-slate-600 dark:text-zinc-300 truncate">
                        {evt.title}
                      </span>
                    </div>
                    <span className="text-[9.5px] text-slate-400 dark:text-zinc-500 font-medium shrink-0 whitespace-nowrap">
                      {formatOdooLogDate(evt.timestamp)}
                    </span>
                  </div>

                  {/* Line 2: Badge + 1-Line Description */}
                  <div className="flex items-center gap-2 mt-1 min-w-0">
                    {evt.badge && (
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded border shrink-0 ${
                          badgeStyles[evt.badge.variant] || badgeStyles.neutral
                        }`}
                      >
                        {evt.badge.text}
                      </span>
                    )}
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate leading-snug font-sans">
                      {evt.summary}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default FeasibilityChatterFeed;
