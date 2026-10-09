import React, { useMemo, useRef, useEffect } from "react";
import { SampleRequestItem, FeasibilityActivityItem } from "../../types";
import { formatOdooLogDate } from "../../utils/dateUtils";
import { UserProfile } from "@/features/auth";

export interface FeasibilityChatterFeedProps {
  activeRequest: SampleRequestItem;
  classificationLabel: string;
  onAddNote?: (note: string) => Promise<void>;
  currentUser?: UserProfile | null;
}

interface ChatLogEvent {
  id: string | number;
  kind: "system_event" | "marketing_message" | "sampling_message";
  actorName: string;
  actorDepartment: string;
  title: string;
  summary: string;
  detailRemark?: string;
  timestamp: string;
  badge?: {
    text: string;
    variant: "emerald" | "amber" | "rose" | "sky" | "indigo" | "neutral";
  };
}

function getInitials(name?: any): string {
  if (!name) return "US";
  const clean = String(name).trim();
  if (!clean) return "US";
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return ((parts[0][0] || "") + (parts[1][0] || "")).toUpperCase() || "US";
  }
  return clean.slice(0, 2).toUpperCase() || "US";
}

function formatTimeOnly(dateInput?: string | Date | null): string {
  if (!dateInput) return "";
  try {
    const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return "";
    return d.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return "";
  }
}

export const FeasibilityChatterFeed: React.FC<FeasibilityChatterFeedProps> = ({
  activeRequest,
  classificationLabel,
}) => {
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Compile chronological WhatsApp-style timeline events
  const chatEvents = useMemo<ChatLogEvent[]>(() => {
    const events: ChatLogEvent[] = [];
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
            kind: "marketing_message",
            actorName: author,
            actorDepartment: act.actorDepartment || "Marketing",
            title: "Feasibility Inquiry Raised",
            summary: `Submitted feasibility inquiry for ${activeRequest.customer || "General Client"}. Scope: ${classificationLabel}.`,
            timestamp: act.createdAt || activeRequest.createdAt || activeRequest.dateRequestCreated || "",
            badge: { text: "Intake", variant: "indigo" },
          });
        } else if (act.action === "TASK_CLAIMED") {
          const assignee = act.actorName || payload.claimed_by || activeRequest.takenBySamp || "SAMP Engineer";
          events.push({
            id: act.id,
            kind: "system_event",
            actorName: assignee,
            actorDepartment: "SAMP",
            title: "Claimed Task",
            summary: `${assignee} joined to evaluate this feasibility`,
            timestamp: act.createdAt || activeRequest.takenAtSamp || "",
            badge: { text: "Assigned", variant: "sky" },
          });
        } else if (act.action === "SAMP_EVALUATED") {
          const verdict = payload.verdict || activeRequest.samplingFeasibilityResponse || "Yes";
          const remark = payload.remark || activeRequest.samplingFeasibilityRemark || "";
          const reviewer = act.actorName || activeRequest.samplingFeasibilityApprovedBy || "SAMP Team";
          events.push({
            id: act.id,
            kind: "sampling_message",
            actorName: reviewer,
            actorDepartment: "SAMP Team",
            title: `Technical Verdict: ${verdict}`,
            summary: verdict === "Maybe" ? "Chose Maybe" : verdict === "Yes" ? "Feasible" : "Not Feasible",
            detailRemark: remark,
            timestamp: act.createdAt || activeRequest.feasibilityClosedAt || "",
            badge: {
              text: verdict === "Yes" ? "Feasible" : verdict === "No" ? "Not Feasible" : "Maybe",
              variant: verdict === "Yes" ? "emerald" : verdict === "No" ? "rose" : "amber",
            },
          });
        } else if (act.action === "MARKETING_DECIDED") {
          const decision = payload.decision || activeRequest.marketingDecision || "Accepted";
          const remark = payload.remark || activeRequest.marketingDecisionRemark || "";
          const decider = act.actorName || activeRequest.marketingDecisionBy || "Marketing Authority";
          events.push({
            id: act.id,
            kind: "marketing_message",
            actorName: decider,
            actorDepartment: "Marketing",
            title: `Commercial Decision: ${decision}`,
            summary: decision === "Accepted" ? "Commercial Approved" : "Commercial Dropped",
            detailRemark: remark,
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
            kind: "system_event",
            actorName: act.actorName || activeRequest.convertedBy || "Marketing Lead",
            actorDepartment: "Operations",
            title: "Converted to Sample",
            summary: `Commissioned official sample request ${srNum}`,
            timestamp: act.createdAt || activeRequest.convertedAt || "",
            badge: { text: srNum ? `Sample: ${srNum}` : "Converted", variant: "emerald" },
          });
        } else if (act.action === "NOTE_ADDED") {
          const dept = (act.actorDepartment || "").toLowerCase();
          const isSamp = dept.includes("samp");
          events.push({
            id: act.id,
            kind: isSamp ? "sampling_message" : "marketing_message",
            actorName: act.actorName || "Team Member",
            actorDepartment: act.actorDepartment || (isSamp ? "SAMP Team" : "Marketing"),
            title: "Internal Note",
            summary: payload.note || "",
            timestamp: act.createdAt || "",
            badge: { text: "Note", variant: "neutral" },
          });
        }
      });

    // 2. Synthesize canonical timeline events if not present in DB activities
    if (!recordedActions.has("CREATED")) {
      const author = activeRequest.createdBy || "Marketing Desk";
      events.push({
        id: "synth-create",
        kind: "marketing_message",
        actorName: author,
        actorDepartment: "Marketing",
        title: "Feasibility Inquiry Raised",
        summary: `Submitted feasibility inquiry for ${activeRequest.customer || "General Client"}. Scope: ${classificationLabel}.`,
        timestamp: activeRequest.createdAt || activeRequest.dateRequestCreated || "",
        badge: { text: "Intake", variant: "indigo" },
      });
    }

    if (!recordedActions.has("TASK_CLAIMED") && activeRequest.takenBySamp) {
      events.push({
        id: "synth-claim",
        kind: "system_event",
        actorName: activeRequest.takenBySamp,
        actorDepartment: "SAMP Team",
        title: "Claimed Assessment",
        summary: `${activeRequest.takenBySamp} joined to evaluate this feasibility`,
        timestamp: activeRequest.takenAtSamp || activeRequest.createdAt || "",
        badge: { text: "Under Review", variant: "sky" },
      });
    }

    if (!recordedActions.has("SAMP_EVALUATED") && activeRequest.samplingFeasibilityResponse) {
      const verdict = activeRequest.samplingFeasibilityResponse;
      events.push({
        id: "synth-evaluated",
        kind: "sampling_message",
        actorName: activeRequest.samplingFeasibilityApprovedBy || "SAMP Team",
        actorDepartment: "SAMP Team",
        title: `Technical Verdict: ${verdict}`,
        summary: verdict === "Maybe" ? "Chose Maybe" : verdict === "Yes" ? "Feasible" : "Not Feasible",
        detailRemark: activeRequest.samplingFeasibilityRemark || undefined,
        timestamp: activeRequest.feasibilityClosedAt || activeRequest.takenAtSamp || "",
        badge: {
          text: verdict === "Yes" ? "Feasible" : verdict === "No" ? "Not Feasible" : "Maybe",
          variant: verdict === "Yes" ? "emerald" : verdict === "No" ? "rose" : "amber",
        },
      });
    }

    if (!recordedActions.has("MARKETING_DECIDED") && activeRequest.marketingDecision) {
      const decision = activeRequest.marketingDecision;
      events.push({
        id: "synth-decision",
        kind: "marketing_message",
        actorName: activeRequest.marketingDecisionBy || "Marketing Authority",
        actorDepartment: "Marketing",
        title: `Commercial Decision: ${decision}`,
        summary: decision === "Accepted" ? "Commercial Approved" : "Commercial Dropped",
        detailRemark: activeRequest.marketingDecisionRemark || undefined,
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
        kind: "system_event",
        actorName: activeRequest.convertedBy || "Marketing Lead",
        actorDepartment: "Operations",
        title: "Converted to Sample",
        summary: `Commissioned official sample request ${activeRequest.convertedSrNumber}`,
        timestamp: activeRequest.convertedAt || "",
        badge: { text: `Sample: ${activeRequest.convertedSrNumber}`, variant: "emerald" },
      });
    }

    // Sort ascending (chronological: oldest at top, newest at bottom like WhatsApp)
    return events.sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime() || 0;
      const timeB = new Date(b.timestamp).getTime() || 0;
      return timeA - timeB;
    });
  }, [activeRequest, classificationLabel]);

  // Scroll to bottom on load or new events
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatEvents.length]);


  return (
    <div className="w-80 lg:w-[390px] bg-[#f8f9ff] dark:bg-[#131622] flex flex-col h-full overflow-hidden select-text shadow-[-12px_0_36px_rgba(11,28,48,0.03)] z-10 relative">
      {/* ── 1. Top Header ── */}
      <div className="px-4 py-3 bg-white dark:bg-[#161826] flex items-center justify-between sticky top-0 z-20 border-b border-slate-100 dark:border-white/5 shadow-[0_2px_10px_rgba(11,28,48,0.02)]">
        <div>
          <h2 className="font-display font-bold text-xs text-slate-900 dark:text-zinc-100 tracking-tight leading-none">
            Activity &amp; Communication Log
          </h2>
          <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-sans mt-0.5 block">
            Marketing &amp; SAMP Team Handoff
          </span>
        </div>

        <span className="text-[10.5px] font-mono text-[#006d32] dark:text-[#00d166] bg-[#eff4ff] dark:bg-[#006d32]/20 px-2.5 py-0.5 rounded-full font-bold border border-[#006d32]/20">
          {chatEvents.length} {chatEvents.length === 1 ? "Event" : "Events"}
        </span>
      </div>

      {/* ── 2. WhatsApp-Style Chronological Stream ── */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3 font-sans">
        {chatEvents.length === 0 ? (
          <div className="py-12 text-center text-slate-400 font-display text-xs">
            No activity records found.
          </div>
        ) : (
          chatEvents.map((evt) => {
            // Case A: WhatsApp System Event Pill (Task Claimed, Converted to Sampling)
            if (evt.kind === "system_event") {
              const isClaim = evt.title.includes("Claim");
              return (
                <div key={evt.id} className="flex justify-center my-2.5 select-none">
                  <div
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium shadow-2xs border ${isClaim
                        ? "bg-sky-50 text-sky-900 border-sky-200/80 dark:bg-sky-950/60 dark:text-sky-200 dark:border-sky-800/40"
                        : "bg-emerald-50 text-emerald-900 border-emerald-200/80 dark:bg-emerald-950/60 dark:text-emerald-200 dark:border-emerald-800/40"
                      }`}
                  >
                    <span>{evt.summary}</span>
                    <span className="text-[9.5px] opacity-75 font-mono ml-0.5">
                      · {formatTimeOnly(evt.timestamp)}
                    </span>
                  </div>
                </div>
              );
            }

            // Case B: Marketing Desk Message Bubble
            if (evt.kind === "marketing_message") {
              const isCreate = evt.badge?.text === "Intake";
              return (
                <div key={evt.id} className="flex flex-col items-start select-text max-w-[94%]">
                  <div className="w-full bg-white dark:bg-[#1a202c] rounded-2xl rounded-tl-xs p-3.5 border border-emerald-200/70 dark:border-emerald-900/30 shadow-[0_2px_8px_rgba(0,109,50,0.04)]">
                    {/* Header */}
                    <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-emerald-50 dark:border-white/5">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-6 h-6 rounded-full bg-[#006d32] text-white font-bold text-[10px] font-mono flex items-center justify-center shrink-0 shadow-2xs">
                          {getInitials(evt.actorName)}
                        </div>
                        <div className="min-w-0 truncate">
                          <span className="font-display font-bold text-xs text-slate-900 dark:text-zinc-100 truncate block">
                            {evt.actorName}
                          </span>
                        </div>
                        <span className="px-1.5 py-0.2 rounded text-[9.5px] font-bold font-mono bg-emerald-100/80 text-[#006d32] dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40 shrink-0">
                          Marketing
                        </span>
                      </div>
                      <span className="text-[9.5px] text-slate-400 dark:text-zinc-500 font-mono whitespace-nowrap">
                        {formatOdooLogDate(evt.timestamp)}
                      </span>
                    </div>

                    {/* Status / Content */}
                    {isCreate ? (
                      <p className="text-xs text-slate-700 dark:text-zinc-200 mt-2 leading-relaxed font-sans">
                        {evt.summary}
                      </p>
                    ) : (
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs font-semibold text-slate-900 dark:text-zinc-100 font-sans">
                          Decision:
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${evt.badge?.variant === "emerald"
                              ? "bg-emerald-50 text-[#006d32] border-emerald-200"
                              : "bg-rose-50 text-rose-700 border-rose-200"
                            }`}
                        >
                          {evt.badge?.text || "Decided"}
                        </span>
                      </div>
                    )}

                    {/* Remark */}
                    {evt.detailRemark && (
                      <div className="mt-2 p-2.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 text-[11.5px] text-emerald-950 dark:text-emerald-200 font-sans leading-relaxed">
                        {evt.detailRemark}
                      </div>
                    )}
                  </div>
                </div>
              );
            }

            // Case C: Sampling Team (SAMP Team) Message Bubble
            return (
              <div key={evt.id} className="flex flex-col items-end select-text ml-auto max-w-[94%]">
                <div className="w-full bg-[#f4f8ff] dark:bg-[#152033] rounded-2xl rounded-tr-xs p-3.5 border border-sky-200/70 dark:border-sky-900/40 shadow-[0_2px_8px_rgba(0,112,255,0.05)]">
                  {/* Header */}
                  <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-sky-100/80 dark:border-white/5">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-full bg-[#0070ff] text-white font-bold text-[10px] font-mono flex items-center justify-center shrink-0 shadow-2xs">
                        {getInitials(evt.actorName)}
                      </div>
                      <div className="min-w-0 truncate">
                        <span className="font-display font-bold text-xs text-slate-900 dark:text-zinc-100 truncate block">
                          {evt.actorName}
                        </span>
                      </div>
                      <span className="px-1.5 py-0.2 rounded text-[9.5px] font-bold font-mono bg-sky-100 text-[#0070ff] dark:bg-sky-950/60 dark:text-sky-300 border border-sky-200 dark:border-sky-800/40 shrink-0">
                        SAMP Team
                      </span>
                    </div>
                    <span className="text-[9.5px] text-slate-400 dark:text-zinc-500 font-mono whitespace-nowrap">
                      {formatOdooLogDate(evt.timestamp)}
                    </span>
                  </div>

                  {/* Verdict Line */}
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs font-semibold text-slate-900 dark:text-zinc-100 font-sans">
                      Verdict:
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${evt.badge?.variant === "emerald"
                          ? "bg-emerald-50 text-[#006d32] border-emerald-200"
                          : evt.badge?.variant === "rose"
                            ? "bg-rose-50 text-rose-700 border-rose-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}
                    >
                      {evt.badge?.text || "Evaluated"}
                    </span>
                  </div>

                  {/* Detail Technical Remark */}
                  {evt.detailRemark && (
                    <div className="mt-2 p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-sky-100 dark:border-sky-900/40 text-[11.5px] text-slate-800 dark:text-zinc-200 font-sans leading-relaxed shadow-2xs">
                      {evt.detailRemark}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default FeasibilityChatterFeed;
