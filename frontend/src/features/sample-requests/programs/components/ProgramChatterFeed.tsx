import React, { useMemo, useRef, useEffect } from "react";
import { SampleRequestItem, ProgramActivityItem } from "../../types";
import { formatOdooLogDate } from "../../utils/dateUtils";
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Building2,
  Layers,
  Zap,
  Activity,
  ShieldCheck,
  Factory,
  Eye,
} from "lucide-react";
import { UserProfile } from "@/features/auth";

export interface ProgramMaterialReviewItem {
  id: number | string;
  materialType?: string;
  supplierName?: string;
  grade?: string;
  colorVariant?: string;
  caliperWt?: string;
  quantity?: string;
  unit?: string;
  remark?: string;
  highlightedCols: string[];
  sampRemarkText: string;
  createdAt?: string;
  isNewAdded?: boolean;
}

export interface ProgramChatterFeedProps {
  request: SampleRequestItem;
  materialRows: ProgramMaterialReviewItem[];
  isSamplingMode?: boolean;
  isPlantMode?: boolean;
  currentUser?: UserProfile | null;
}

// Calculate if a material row was added within the last 36 hours
export function isMaterialAddedRecently(createdAt?: string | Date | null): boolean {
  if (!createdAt) return false;
  try {
    const d = typeof createdAt === "string" ? new Date(createdAt) : createdAt;
    const diffMs = Date.now() - d.getTime();
    const thirtySixHoursMs = 36 * 60 * 60 * 1000;
    return diffMs >= -60000 && diffMs <= thirtySixHoursMs;
  } catch {
    return false;
  }
}

interface ChatLogEvent {
  id: string | number;
  kind: "system_event" | "marketing_message" | "sampling_message" | "plant_message" | "material_added";
  actorName: string;
  actorDepartment: string;
  title: string;
  summary: string;
  detailRemark?: string;
  timestamp: string;
  materialDetails?: {
    type?: string;
    supplier?: string;
    grade?: string;
    color?: string;
    caliper?: string;
    qty?: string;
    unit?: string;
  };
  badge?: {
    text: string;
    variant: "emerald" | "amber" | "rose" | "sky" | "indigo" | "teal" | "neutral";
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

export const ProgramChatterFeed: React.FC<ProgramChatterFeedProps> = ({
  request,
  materialRows,
  isSamplingMode,
  isPlantMode,
}) => {
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Compile chronological timeline events matching Luminous Engine style
  const chatEvents = useMemo<ChatLogEvent[]>(() => {
    const events: ChatLogEvent[] = [];
    const recordedActions = new Set<string>();

    const rawActivities: ProgramActivityItem[] = Array.isArray(request.activities)
      ? (request.activities as unknown as ProgramActivityItem[])
      : [];

    // 1. Process persisted DB activities
    rawActivities.forEach((act) => {
      recordedActions.add(act.action);
      const payload = act.payload || {};

      if (act.action === "CREATED") {
        const author = act.actorName || request.createdBy || "Marketing Desk";
        events.push({
          id: act.id,
          kind: "marketing_message",
          actorName: author,
          actorDepartment: act.actorDepartment || "Marketing",
          title: "Seasonal Campaign Registered",
          summary: `Initialized program "${request.programName || payload.program_campaign_title || "Program"}" for ${
            request.customer || payload.customer_name || "Client"
          } with ${request.targetPlant || "designated plant"}.`,
          timestamp: act.createdAt || request.createdAt || "",
          badge: { text: "Intake", variant: "indigo" },
        });
      } else if (act.action === "MATERIAL_ADDED") {
        events.push({
          id: act.id,
          kind: "material_added",
          actorName: act.actorName || "Marketing Team",
          actorDepartment: act.actorDepartment || "Marketing",
          title: "New Material Specification Added",
          summary: `Added ${payload.material_type || "Material"} ${
            payload.supplier_name ? `(${payload.supplier_name})` : ""
          }`,
          timestamp: act.createdAt,
          materialDetails: {
            type: payload.material_type,
            supplier: payload.supplier_name,
            grade: payload.grade,
            color: payload.color_variant,
            caliper: payload.caliper_wt,
            qty: payload.quantity,
            unit: payload.unit || "pcs",
          },
          badge: { text: "⚡ Added", variant: "emerald" },
        });
      } else if (act.action === "MATERIAL_DELETED") {
        events.push({
          id: act.id,
          kind: "system_event",
          actorName: act.actorName || "Marketing Operator",
          actorDepartment: "Marketing",
          title: "Specification Line Removed",
          summary: `Removed line: ${payload.material_type || `Item #${payload.material_id}`}`,
          timestamp: act.createdAt,
          badge: { text: "Removed", variant: "rose" },
        });
      } else if (act.action === "SAMP_VIEWED") {
        events.push({
          id: act.id,
          kind: "system_event",
          actorName: act.actorName || "Sampling Team",
          actorDepartment: "Sampling",
          title: "Inspected by Sampling Team",
          summary: `Sampling Team inspected this program matrix`,
          timestamp: act.createdAt,
          badge: { text: "Seen", variant: "sky" },
        });
      } else if (act.action === "PLANT_VIEWED") {
        events.push({
          id: act.id,
          kind: "system_event",
          actorName: act.actorName || "Plant Desk",
          actorDepartment: "Plant Desk",
          title: "Inspected by Plant Team",
          summary: `Plant ${request.targetPlant || ""} inspected this program matrix`,
          timestamp: act.createdAt,
          badge: { text: "Seen", variant: "teal" },
        });
      } else if (act.action === "SAMP_REVIEWED") {
        const verdict = payload.verdict || request.samplingVerdict || "Feasible";
        const isOk = verdict.toLowerCase().includes("feasible") || verdict.toLowerCase().includes("approved");
        events.push({
          id: act.id,
          kind: "sampling_message",
          actorName: act.actorName || payload.reviewer || "Sampling Lead",
          actorDepartment: "Sampling Team",
          title: `Sampling Sign-Off: ${verdict}`,
          summary: isOk ? "Technical feasibility approved" : "Revision flagged",
          detailRemark: payload.remark || request.samplingRemark,
          timestamp: act.createdAt,
          badge: {
            text: isOk ? "Feasible" : "Revisions",
            variant: isOk ? "emerald" : "amber",
          },
        });
      } else if (act.action === "PLANT_REVIEWED") {
        const verdict = payload.verdict || request.plantVerdict || "Capacity Confirmed";
        const isOk =
          verdict.toLowerCase().includes("feasible") ||
          verdict.toLowerCase().includes("confirmed") ||
          verdict.toLowerCase().includes("approved");
        events.push({
          id: act.id,
          kind: "plant_message",
          actorName: act.actorName || payload.reviewer || "Plant Production Lead",
          actorDepartment: `Plant ${request.targetPlant || ""}`,
          title: `Plant Sign-Off: ${verdict}`,
          summary: isOk ? "Manufacturing capacity and tooling confirmed" : "Tooling / Schedule constraint noted",
          detailRemark: payload.remark || request.plantRemark,
          timestamp: act.createdAt,
          badge: {
            text: isOk ? "Confirmed" : "Constrained",
            variant: isOk ? "teal" : "amber",
          },
        });
      } else if (act.action === "SAMP_REMARK_UPDATED" || act.action === "SAMP_REMARKS_UPDATED") {
        events.push({
          id: act.id,
          kind: "sampling_message",
          actorName: act.actorName || "Sampling Specialist",
          actorDepartment: "Sampling Team",
          title: "Technical Remarks Updated",
          summary:
            act.action === "SAMP_REMARK_UPDATED"
              ? `Remark on #${payload.material_id}: "${payload.new_remark || "Updated"}"`
              : `Updated remarks across ${payload.updated_count || 1} material lines`,
          timestamp: act.createdAt,
          badge: { text: "Lab Remark", variant: "sky" },
        });
      } else if (act.action === "STATUS_UPDATED") {
        events.push({
          id: act.id,
          kind: "system_event",
          actorName: act.actorName || "System",
          actorDepartment: "System",
          title: "Status Advanced",
          summary: `Status updated to "${payload.new_status || request.status}"`,
          timestamp: act.createdAt,
          badge: { text: "Status", variant: "emerald" },
        });
      }
    });

    // 2. Synthesize baseline creation if not present in DB activities
    if (!recordedActions.has("CREATED")) {
      events.push({
        id: "synth-created",
        kind: "marketing_message",
        actorName: request.createdBy || "Marketing Desk",
        actorDepartment: "Marketing",
        title: "Seasonal Campaign Registered",
        summary: `Initialized program "${request.programName || "Program"}" for ${
          request.customer || "Client"
        } (Season: ${request.programYear || "2026-2027"}, Plant: ${request.targetPlant || "Plant 1"}).`,
        timestamp: request.createdAt || request.dateRequestCreated || "",
        badge: { text: "Intake", variant: "indigo" },
      });
    }

    // 3. Synthesize Sampling Review event if exists in request but not in DB
    if (!recordedActions.has("SAMP_REVIEWED") && request.samplingVerdict) {
      const isOk = request.samplingVerdict.toLowerCase().includes("feasible") || request.samplingVerdict.toLowerCase().includes("approved");
      events.push({
        id: "synth-samp-review",
        kind: "sampling_message",
        actorName: request.samplingSignedBy || "Sampling Lead",
        actorDepartment: "Sampling Team",
        title: `Sampling Sign-Off: ${request.samplingVerdict}`,
        summary: isOk ? "Technical feasibility confirmed" : "Revision flagged",
        detailRemark: request.samplingRemark || undefined,
        timestamp: request.samplingSignedAt || request.updatedAt || "",
        badge: {
          text: isOk ? "Feasible" : "Revisions",
          variant: isOk ? "emerald" : "amber",
        },
      });
    }

    // 4. Synthesize Plant Review event if exists in request but not in DB
    if (!recordedActions.has("PLANT_REVIEWED") && request.plantVerdict) {
      const isOk = request.plantVerdict.toLowerCase().includes("feasible") || request.plantVerdict.toLowerCase().includes("confirmed");
      events.push({
        id: "synth-plant-review",
        kind: "plant_message",
        actorName: request.plantSignedBy || "Plant Production Desk",
        actorDepartment: `Plant ${request.targetPlant || ""}`,
        title: `Plant Sign-Off: ${request.plantVerdict}`,
        summary: isOk ? "Manufacturing capacity confirmed" : "Tooling constrained",
        detailRemark: request.plantRemark || undefined,
        timestamp: request.plantSignedAt || request.updatedAt || "",
        badge: {
          text: isOk ? "Confirmed" : "Constrained",
          variant: isOk ? "teal" : "amber",
        },
      });
    }

    // Sort ascending (chronological: oldest at top, newest at bottom)
    return events.sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime() || 0;
      const timeB = new Date(b.timestamp).getTime() || 0;
      return timeA - timeB;
    });
  }, [request]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatEvents.length]);

  return (
    <div className="w-80 lg:w-[360px] bg-[#f8f9ff] dark:bg-[#131622] flex flex-col h-full overflow-hidden select-text border-l border-slate-100 dark:border-white/5 z-10 shrink-0">
      {/* ── 1. Top Header (Identical to Feasibility Check Style) ── */}
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

      {/* ── 2. Pure Chronological Audit Stream (NO CHAT SECTION) ── */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3 font-sans">
        {chatEvents.length === 0 ? (
          <div className="py-12 text-center text-slate-400 font-display text-xs">
            No activity records found.
          </div>
        ) : (
          chatEvents.map((evt) => {
            // Case A: System Event Pill (Seen, Intake, Line Removed)
            if (evt.kind === "system_event") {
              const isSeen = evt.title.includes("Inspected") || evt.title.includes("Seen");
              const isPlant = evt.title.includes("Plant");
              return (
                <div key={evt.id} className="flex justify-center my-2 select-none">
                  <div
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium shadow-2xs border ${
                      isSeen
                        ? isPlant
                          ? "bg-teal-50 text-teal-900 border-teal-200/80 dark:bg-teal-950/60 dark:text-teal-200"
                          : "bg-sky-50 text-sky-900 border-sky-200/80 dark:bg-sky-950/60 dark:text-sky-200"
                        : "bg-slate-100 text-slate-800 border-slate-200/80 dark:bg-zinc-800 dark:text-zinc-200"
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

            // Case B: Material Added Card
            if (evt.kind === "material_added") {
              const mat = evt.materialDetails || {};
              return (
                <div key={evt.id} className="flex flex-col items-start select-text max-w-[96%] animate-fadeIn">
                  <div className="w-full bg-white dark:bg-[#1a202c] rounded-2xl rounded-tl-xs p-3 border border-emerald-200/80 dark:border-emerald-800/50 shadow-[0_2px_8px_rgba(0,109,50,0.04)]">
                    {/* Header */}
                    <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-emerald-50 dark:border-white/5">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-5 h-5 rounded-full bg-[#006d32] text-white font-bold text-[9px] font-mono flex items-center justify-center shrink-0">
                          <Zap className="w-3 h-3" />
                        </div>
                        <span className="font-display font-bold text-xs text-slate-900 dark:text-zinc-100 truncate block">
                          {evt.actorName}
                        </span>
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold font-mono bg-emerald-100 text-[#006d32] dark:bg-emerald-950/60 dark:text-emerald-300">
                          Marketing
                        </span>
                      </div>
                      <span className="text-[9px] text-slate-400 dark:text-zinc-500 font-mono">
                        {formatOdooLogDate(evt.timestamp)}
                      </span>
                    </div>

                    {/* Spec Summary */}
                    <div className="mt-1.5 text-xs text-slate-800 dark:text-zinc-200">
                      <div className="font-semibold text-emerald-950 dark:text-emerald-100">
                        {mat.type || "Specification"}{" "}
                        {mat.supplier ? <span className="font-normal text-slate-500">({mat.supplier})</span> : ""}
                      </div>
                      <div className="text-[10.5px] font-mono text-slate-600 dark:text-zinc-400 mt-0.5">
                        Qty: <strong className="text-slate-800 dark:text-zinc-200">{mat.qty || "—"} {mat.unit || "pcs"}</strong>
                        {mat.grade ? ` • ${mat.grade}` : ""}
                        {mat.caliper ? ` • ${mat.caliper}` : ""}
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            // Case C: Marketing Message Bubble
            if (evt.kind === "marketing_message") {
              return (
                <div key={evt.id} className="flex flex-col items-start select-text max-w-[94%]">
                  <div className="w-full bg-white dark:bg-[#1a202c] rounded-2xl rounded-tl-xs p-3 border border-emerald-200/70 dark:border-emerald-900/30 shadow-[0_2px_8px_rgba(0,109,50,0.04)]">
                    <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-emerald-50 dark:border-white/5">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-5 h-5 rounded-full bg-[#006d32] text-white font-bold text-[9px] font-mono flex items-center justify-center shrink-0">
                          {getInitials(evt.actorName)}
                        </div>
                        <span className="font-display font-bold text-xs text-slate-900 dark:text-zinc-100 truncate block">
                          {evt.actorName}
                        </span>
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold font-mono bg-emerald-100 text-[#006d32] dark:bg-emerald-950/60 dark:text-emerald-300">
                          Marketing
                        </span>
                      </div>
                      <span className="text-[9px] text-slate-400 dark:text-zinc-500 font-mono">
                        {formatOdooLogDate(evt.timestamp)}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 dark:text-zinc-200 mt-1.5 leading-relaxed font-sans">
                      {evt.summary}
                    </p>
                  </div>
                </div>
              );
            }

            // Case D: Sampling Team Review Bubble
            if (evt.kind === "sampling_message") {
              return (
                <div key={evt.id} className="flex flex-col items-end select-text ml-auto max-w-[94%]">
                  <div className="w-full bg-[#f4f8ff] dark:bg-[#152033] rounded-2xl rounded-tr-xs p-3 border border-sky-200/70 dark:border-sky-900/40 shadow-[0_2px_8px_rgba(0,112,255,0.05)]">
                    <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-sky-100/80 dark:border-white/5">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-5 h-5 rounded-full bg-[#0070ff] text-white font-bold text-[9px] font-mono flex items-center justify-center shrink-0">
                          {getInitials(evt.actorName)}
                        </div>
                        <span className="font-display font-bold text-xs text-slate-900 dark:text-zinc-100 truncate block">
                          {evt.actorName}
                        </span>
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold font-mono bg-sky-100 text-[#0070ff] dark:bg-sky-950/60 dark:text-sky-300">
                          Sampling
                        </span>
                      </div>
                      <span className="text-[9px] text-slate-400 dark:text-zinc-500 font-mono">
                        {formatOdooLogDate(evt.timestamp)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-xs font-semibold text-slate-900 dark:text-zinc-100 font-sans">
                        Verdict:
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          evt.badge?.variant === "emerald"
                            ? "bg-emerald-50 text-[#006d32] border-emerald-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}
                      >
                        {evt.badge?.text || "Evaluated"}
                      </span>
                    </div>

                    {evt.detailRemark && (
                      <div className="mt-1.5 p-2 rounded-xl bg-white dark:bg-zinc-900 border border-sky-100 dark:border-sky-900/40 text-[11px] text-slate-800 dark:text-zinc-200 font-sans leading-relaxed shadow-2xs">
                        {evt.detailRemark}
                      </div>
                    )}
                  </div>
                </div>
              );
            }

            // Case E: Plant Team Review Bubble
            return (
              <div key={evt.id} className="flex flex-col items-end select-text ml-auto max-w-[94%]">
                <div className="w-full bg-[#f0fdfa] dark:bg-[#132e2b] rounded-2xl rounded-tr-xs p-3 border border-teal-200/70 dark:border-teal-800/40 shadow-[0_2px_8px_rgba(13,148,136,0.05)]">
                  <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-teal-100/80 dark:border-white/5">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-5 h-5 rounded-full bg-[#0d9488] text-white font-bold text-[9px] font-mono flex items-center justify-center shrink-0">
                        {getInitials(evt.actorName)}
                      </div>
                      <span className="font-display font-bold text-xs text-slate-900 dark:text-zinc-100 truncate block">
                        {evt.actorName}
                      </span>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold font-mono bg-teal-100 text-[#0d9488] dark:bg-teal-950/60 dark:text-teal-300">
                        Plant
                      </span>
                    </div>
                    <span className="text-[9px] text-slate-400 dark:text-zinc-500 font-mono">
                      {formatOdooLogDate(evt.timestamp)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-xs font-semibold text-slate-900 dark:text-zinc-100 font-sans">
                      Verdict:
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        evt.badge?.variant === "teal" || evt.badge?.variant === "emerald"
                          ? "bg-teal-50 text-[#0d9488] border-teal-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}
                    >
                      {evt.badge?.text || "Plant Review"}
                    </span>
                  </div>

                  {evt.detailRemark && (
                    <div className="mt-1.5 p-2 rounded-xl bg-white dark:bg-zinc-900 border border-teal-100 dark:border-teal-900/40 text-[11px] text-slate-800 dark:text-zinc-200 font-sans leading-relaxed shadow-2xs">
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

export default ProgramChatterFeed;
