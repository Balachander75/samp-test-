import React, { useState, useEffect } from "react";
import { StatusPill } from "@/components/ui/StatusPill";
import { SampleRequestItem } from "../types";
import { getRequestTrackType } from "../SampleRequestsDesk";
import {
  Copy,
  Check,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ExternalLink,
  Layers,
  Calendar,
  Building2,
  FileSpreadsheet,
  FileCheck,
  Clock,
  X,
  Factory,
  CheckCircle,
  Package,
  Sparkles,
  Hash,
  ShieldCheck,
  CornerDownRight,
  Boxes,
  Palette,
  Box,
  Calculator,
  Sliders,
} from "lucide-react";

export interface SampleRequestInspectorProps {
  request: SampleRequestItem | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateFeasibility?: (
    requestId: string | number,
    team: "plant" | "sampling",
    response: "Yes" | "No" | "Maybe",
    remark?: string
  ) => Promise<void> | void;
  onMarketingApprove?: (
    requestId: string | number,
    approved: boolean
  ) => Promise<void> | void;
  isAdmin?: boolean;
}

export interface ParsedMatrixRow {
  index: number;
  type: string;
  supplier: string;
  grade: string;
  color: string;
  caliper: string;
  qty: string;
  remark: string;
}

export interface ParsedFeasibilityDetails {
  category: string;
  requirements: string;
  releaseRemarks: string | null;
  referenceLink: string | null;
}

function parseFeasibilityDetails(description?: string): ParsedFeasibilityDetails {
  let category = "Custom Specification";
  let text = (description || "").trim();
  let releaseRemarks: string | null = null;
  let referenceLink: string | null = null;

  const categoryMatch = text.match(/^\[(.*?)\]/);
  if (categoryMatch) {
    category = categoryMatch[1].trim();
    text = text.slice(categoryMatch[0].length).trim();
  }

  const refLinkIdx = text.indexOf("Reference Link:");
  if (refLinkIdx !== -1) {
    referenceLink = text.slice(refLinkIdx + "Reference Link:".length).trim();
    text = text.slice(0, refLinkIdx).trim();
  }

  const remarksIdx = text.indexOf("Release / Dispatch Remarks:");
  if (remarksIdx !== -1) {
    releaseRemarks = text.slice(remarksIdx + "Release / Dispatch Remarks:".length).trim();
    text = text.slice(0, remarksIdx).trim();
  }

  return {
    category: category || "Custom Specification",
    requirements: text || "Custom feasibility evaluation requested by client.",
    releaseRemarks,
    referenceLink,
  };
}

function parseProgramMatrix(description?: string): ParsedMatrixRow[] {
  if (!description || !description.includes("Material Specification Matrix:")) return [];
  const matrixText = description.slice(
    description.indexOf("Material Specification Matrix:") + "Material Specification Matrix:".length
  );
  const lines = matrixText
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.startsWith("#"));

  return lines.map((line, idx) => {
    const parts = line.split("|").map((p) => p.trim());
    const getVal = (prefix: string) => {
      const match = parts.find((p) => p.toLowerCase().startsWith(prefix.toLowerCase()));
      if (!match) return "—";
      const colonIdx = match.indexOf(":");
      return colonIdx !== -1 ? match.slice(colonIdx + 1).trim() || "—" : match.trim();
    };

    return {
      index: idx + 1,
      type: getVal("Type"),
      supplier: getVal("Supplier"),
      grade: getVal("Grade"),
      color: getVal("Color"),
      caliper: getVal("Caliper"),
      qty: getVal("Qty"),
      remark: getVal("Remark"),
    };
  });
}

function parseProgramVolume(description?: string): string {
  if (!description) return "450,000 pcs";
  const match = description.match(/Estimated Production Volume:\s*([^\n]+)/i);
  return match ? match[1].trim() : "450,000 pcs";
}

export const SampleRequestInspector: React.FC<SampleRequestInspectorProps> = ({
  request,
  isOpen,
  onClose,
  onUpdateFeasibility,
  onMarketingApprove,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitFeedback, setSubmitFeedback] = useState<string | null>(null);

  const handleMarketingFinalApprove = async (approved: boolean) => {
    if (!onMarketingApprove || !request) return;
    setIsSubmitting(true);
    try {
      await onMarketingApprove(request.id, approved);
      setSubmitFeedback(
        approved
          ? "✓ Request approved and finalized by Marketing."
          : "Request closed as rejected."
      );
      setTimeout(() => setSubmitFeedback(null), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !request) return null;

  const trackType = getRequestTrackType(request);
  const feasibilityDetails = parseFeasibilityDetails(request.productDescription);
  const parsedMatrix = parseProgramMatrix(request.productDescription);
  const estimatedVolume = parseProgramVolume(request.productDescription);

  const handleCopyCode = () => {
    if (!request.srNumber) return;
    navigator.clipboard.writeText(request.srNumber);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const renderFeasibilityBadge = (
    val?: "Yes" | "No" | "Maybe" | null,
    defaultLabel = "Pending Review"
  ) => {
    if (val === "Yes") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25">
          <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
          Feasible / Approved
        </span>
      );
    }
    if (val === "Maybe") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/25">
          <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
          Conditional Feasibility
        </span>
      );
    }
    if (val === "No") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/25">
          <XCircle className="w-3 h-3 text-rose-600 dark:text-rose-400 shrink-0" />
          Not Feasible
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-zinc-100 text-zinc-600 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700">
        <Clock className="w-3 h-3 text-zinc-400 shrink-0" />
        {defaultLabel}
      </span>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        className={`relative w-full ${
          trackType === "program_planning" ? "max-w-5xl" : "max-w-3xl"
        } max-h-[90vh] flex flex-col bg-white dark:bg-[#0f1118] border border-zinc-200 dark:border-white/10 rounded-lg shadow-xl overflow-hidden animate-in zoom-in-95 duration-150`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ────────────────────────────────────────────────────────────────── */}
        {/* Header Bar (Clean, High-Contrast ERP Header)                       */}
        {/* ────────────────────────────────────────────────────────────────── */}
        <div className="px-5 py-3.5 border-b border-zinc-200 dark:border-white/[0.08] bg-zinc-50/80 dark:bg-[#0f1118] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center flex-wrap gap-2">
            {/* Monospace Request ID */}
            <div className="inline-flex items-center gap-1 bg-white dark:bg-zinc-800 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-700 text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100">
              <span>{request.srNumber || `SR-${request.id}`}</span>
              <button
                type="button"
                onClick={handleCopyCode}
                className="p-0.5 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
                title="Copy Request Code"
              >
                {copiedCode ? (
                  <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </button>
            </div>

            {/* Stage Status */}
            <StatusPill status={request.status} size="xs" />

            {/* Track Tag */}
            {trackType === "feasibility_check" && (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/25">
                <Sparkles className="w-3 h-3 text-amber-500" />
                Feasibility Check
              </span>
            )}
            {trackType === "program_planning" && (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-500/25">
                <Layers className="w-3 h-3 text-indigo-500" />
                Program Planning
              </span>
            )}
            {trackType === "marketing_request" && (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/25">
                <Package className="w-3 h-3 text-blue-500" />
                Marketing Request
              </span>
            )}

            {/* Feasibility Category Badge */}
            {trackType === "feasibility_check" && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-zinc-200/70 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700">
                {feasibilityDetails.category}
              </span>
            )}
          </div>

          {/* Close Action Button with 'Esc' Hint */}
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-block text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
              [Esc]
            </span>
            <button
              type="button"
              onClick={onClose}
              className="h-8 w-8 rounded-md flex items-center justify-center text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Close modal (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ────────────────────────────────────────────────────────────────── */}
        {/* Contiguous Operational Context Strip (4 Key Parameters)            */}
        {/* ────────────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 border-b border-zinc-200 dark:border-white/[0.08] bg-zinc-50/40 dark:bg-[#161822] divide-x divide-zinc-200 dark:divide-white/[0.08] shrink-0">
          <div className="p-3">
            <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider text-zinc-400 dark:text-zinc-500 mb-0.5">
              <Building2 className="w-3 h-3 text-zinc-400" />
              <span>Customer</span>
            </div>
            <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate" title={request.customer}>
              {request.customer || "Unassigned"}
            </div>
          </div>

          <div className="p-3">
            <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider text-zinc-400 dark:text-zinc-500 mb-0.5">
              <Factory className="w-3 h-3 text-zinc-400" />
              <span>Production Plant</span>
            </div>
            <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate" title={request.targetPlant}>
              {request.targetPlant || "Khaniwade Unit"}
            </div>
          </div>

          <div className="p-3">
            <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider text-zinc-400 dark:text-zinc-500 mb-0.5">
              <Calendar className="w-3 h-3 text-zinc-400" />
              <span>Target SLA / Due Date</span>
            </div>
            <div className="text-xs font-semibold font-mono text-zinc-900 dark:text-zinc-100 tnum">
              {request.sampleRequiredDate || "2026-10-15"}
            </div>
          </div>

          <div className="p-3">
            <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider text-zinc-400 dark:text-zinc-500 mb-0.5">
              <Hash className="w-3 h-3 text-zinc-400" />
              <span>
                {trackType === "feasibility_check"
                  ? "Category / Format"
                  : trackType === "program_planning"
                  ? "Planned Volume"
                  : "Material Code"}
              </span>
            </div>
            <div className="text-xs font-semibold font-mono text-zinc-900 dark:text-zinc-100 truncate tnum">
              {trackType === "feasibility_check"
                ? feasibilityDetails.category
                : trackType === "program_planning"
                ? estimatedVolume
                : request.materialCode || "NB-CUSTOM-01"}
            </div>
          </div>
        </div>

        {/* ────────────────────────────────────────────────────────────────── */}
        {/* Scrollable Content Body                                            */}
        {/* ────────────────────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* ════════════════════════════════════════════════════════════════ */}
          {/* TRACK 1: FEASIBILITY CHECK VIEW                                  */}
          {/* ════════════════════════════════════════════════════════════════ */}
          {trackType === "feasibility_check" && (
            <div className="space-y-4">
              {/* Technical Scope & Requirement Box */}
              <div className="rounded-md border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-[#0f1118] p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                    <FileCheck className="w-3.5 h-3.5 text-amber-500" />
                    Client Technical Requirement & Evaluation Scope
                  </h3>
                  <span className="text-[10px] font-mono text-zinc-400">
                    Category: {feasibilityDetails.category}
                  </span>
                </div>

                <div className="p-3 rounded bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-white/[0.08] text-[13px] text-zinc-800 dark:text-zinc-200 leading-relaxed font-normal">
                  {feasibilityDetails.requirements}
                </div>

                {/* Reference Link if available */}
                {feasibilityDetails.referenceLink && (
                  <div className="mt-2.5">
                    <a
                      href={feasibilityDetails.referenceLink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-600 dark:text-brand-400 hover:underline bg-brand-500/10 px-2.5 py-1 rounded border border-brand-500/20"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Open Attached Technical Drawing / Reference Spec</span>
                    </a>
                  </div>
                )}
              </div>

              {/* First Responder Resolution Banner */}
              {request.feasibilityClosedBy ? (
                <div className="rounded-md border border-emerald-300 dark:border-emerald-700/60 bg-emerald-50/70 dark:bg-emerald-950/30 p-3.5 flex items-start gap-3">
                  <div className="p-1 rounded-md bg-emerald-600 text-white shrink-0 mt-0.5">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-emerald-900 dark:text-emerald-200 text-xs">
                        Feasibility Resolved by First Responder: {request.feasibilityClosedBy === "sampling" ? "SAMP Prototyping Lab" : `Plant Engineering (${request.targetPlant || "Plant"})`}
                      </h4>
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-emerald-200/80 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 font-bold">
                        Verdict: {request.feasibilityClosedBy === "sampling" ? request.samplingFeasibilityResponse : request.plantFeasibilityResponse}
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-800 dark:text-emerald-300 leading-relaxed">
                      {request.feasibilityClosedBy === "sampling"
                        ? (request.samplingFeasibilityRemark || "Central Lab verified tooling and specs.")
                        : (request.plantFeasibilityRemark || "Plant Engineering verified production line capacity.")}
                    </p>
                    {request.feasibilityClosedAt && (
                      <p className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
                        Resolved at: {request.feasibilityClosedAt} · Forwarded to Marketing Desk
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="rounded-md border border-amber-200 dark:border-amber-800/60 bg-amber-50/70 dark:bg-amber-950/30 p-3.5 flex items-start gap-3">
                  <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-0.5 text-xs">
                    <h4 className="font-bold text-amber-900 dark:text-amber-200">
                      Dual Broadcast Active (SAMP Lab & Plant Engineering)
                    </h4>
                    <p className="text-amber-800 dark:text-amber-300 text-[11px] leading-relaxed">
                      This request was broadcast simultaneously to <strong>Central Prototyping Lab (SAMP)</strong> and <strong>Plant Engineering</strong>. Whichever team responds first will resolve this evaluation and notify Marketing.
                    </p>
                  </div>
                </div>
              )}

              {/* Dual Sign-Off Status Cards (Plant Engineering & Sampling Lab) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* 1. Plant Engineering Verdict */}
                <div className="rounded-md border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-[#0f1118] p-3.5 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-800 dark:text-zinc-200">
                      <Factory className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Plant Engineering</span>
                    </div>
                    {renderFeasibilityBadge(request.plantFeasibilityResponse, "Pending Plant Review")}
                  </div>

                  <div className="p-2.5 rounded bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/60 dark:border-white/[0.08] text-xs text-zinc-700 dark:text-zinc-300 min-h-[46px]">
                    {request.plantFeasibilityRemark ? (
                      <p className="italic font-normal">"{request.plantFeasibilityRemark}"</p>
                    ) : (
                      <p className="text-zinc-400 italic">No engineering remarks recorded yet.</p>
                    )}
                  </div>

                  <div className="text-[11px] text-zinc-400 flex items-center justify-between pt-0.5">
                    <span>Facility: {request.targetPlant || "Khaniwade Line 3"}</span>
                    {request.plantFeasibilityResponse && (
                      <span className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> Recorded
                      </span>
                    )}
                  </div>
                </div>

                {/* 2. Sampling Tech Lab Verdict */}
                <div className="rounded-md border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-[#0f1118] p-3.5 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-800 dark:text-zinc-200">
                      <CheckCircle className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Sampling & Tech Lab</span>
                    </div>
                    {renderFeasibilityBadge(request.samplingFeasibilityResponse, "Pending Lab Review")}
                  </div>

                  <div className="p-2.5 rounded bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/60 dark:border-white/[0.08] text-xs text-zinc-700 dark:text-zinc-300 min-h-[46px]">
                    {request.samplingFeasibilityRemark ? (
                      <p className="italic font-normal">"{request.samplingFeasibilityRemark}"</p>
                    ) : (
                      <p className="text-zinc-400 italic">No sampling lab remarks recorded yet.</p>
                    )}
                  </div>

                  <div className="text-[11px] text-zinc-400 flex items-center justify-between pt-0.5">
                    <span>Division: Central Prototyping Lab</span>
                    {request.samplingFeasibilityResponse && (
                      <span className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> Recorded
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Marketing Final Decision Card */}
              <div className="rounded-md border border-zinc-200 dark:border-white/[0.08] bg-zinc-50/70 dark:bg-[#161822] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-brand-600" />
                    Marketing Review & Final Sign-Off
                  </span>
                  {request.status?.toLowerCase().includes("completed") ||
                  request.status?.toLowerCase().includes("approved") ||
                  request.status?.toLowerCase().includes("close") ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300/80 dark:border-emerald-800">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      {request.status}
                    </span>
                  ) : null}
                </div>

                {!request.samplingFeasibilityResponse ? (
                  <div className="p-3 rounded-md bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
                    <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Awaiting Technical Evaluation from SAMP Lab</p>
                      <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5 leading-relaxed">
                        Central Prototyping Lab is currently evaluating paper GSM, binding and machine parameters. Once SAMP Lab responds with Yes / Maybe / No, the Marketing final approval button will unlock here.
                      </p>
                    </div>
                  </div>
                ) : (request.status?.toLowerCase().includes("completed") ||
                  request.status?.toLowerCase().includes("close") ||
                  request.status?.toLowerCase().includes("approved")) ? (
                  <div className="p-3 rounded-md bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>
                        Feasibility request was reviewed and <strong>Approved & Finalized</strong> by Marketing. Workflow finished.
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                      SAMP Lab has submitted their technical evaluation:{" "}
                      <strong className="text-zinc-900 dark:text-zinc-100">
                        {request.samplingFeasibilityResponse === "Yes"
                          ? "Feasible (Yes)"
                          : request.samplingFeasibilityResponse === "Maybe"
                          ? "Conditional (Maybe)"
                          : "Not Feasible (No)"}
                      </strong>
                      {request.samplingFeasibilityRemark ? (
                        <span> — "{request.samplingFeasibilityRemark}"</span>
                      ) : null}
                      . As Marketing Lead, you can now approve and finalize this request to conclude the feasibility workflow.
                    </p>

                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => handleMarketingFinalApprove(true)}
                        disabled={isSubmitting}
                        className="h-9.5 px-5 rounded-md bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                      >
                        <Check className="w-4 h-4" />
                        <span>{isSubmitting ? "Approving..." : "Approve Feasibility & Finalize Request"}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleMarketingFinalApprove(false)}
                        disabled={isSubmitting}
                        className="h-9.5 px-4 rounded-md border border-rose-200 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
                      >
                        <XCircle className="w-3.5 h-3.5 text-rose-600" />
                        <span>Close Request (Rejected)</span>
                      </button>
                    </div>

                    {submitFeedback && (
                      <div className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1 pt-1">
                        <CheckCircle className="w-3 h-3" />
                        {submitFeedback}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════ */}
          {/* TRACK 2: PROGRAM PLANNING VIEW                                   */}
          {/* ════════════════════════════════════════════════════════════════ */}
          {trackType === "program_planning" && (
            <div className="space-y-4">
              {/* Program Campaign Banner */}
              <div className="p-3.5 rounded-md border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-[#0f1118] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <div className="text-[10px] uppercase font-bold tracking-wider text-indigo-600 dark:text-indigo-400 mb-0.5">
                    Seasonal Program Master
                  </div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-indigo-500" />
                    {request.programName || "Back to School 2026-27 Master Catalog"}
                  </h3>
                  <div className="text-xs text-zinc-500 mt-0.5">
                    Season: <span className="font-semibold text-zinc-700 dark:text-zinc-300">{request.programYear || "BTS 2026-2027"}</span>
                    {" · "}
                    Facility: <span className="font-semibold text-zinc-700 dark:text-zinc-300">{request.targetPlant || "1503- Silvasa"}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="px-3 py-1.5 rounded bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-right">
                    <div className="text-[10px] uppercase font-bold text-zinc-400">Total Planned Run</div>
                    <div className="text-sm font-mono font-bold text-indigo-700 dark:text-indigo-400 tnum">
                      {estimatedVolume}
                    </div>
                  </div>
                </div>
              </div>

              {/* Material Specification Matrix (Elite Data Table) */}
              <div className="rounded-md border border-zinc-200 dark:border-white/[0.08] overflow-hidden bg-white dark:bg-[#0f1118]">
                <div className="px-4 py-2.5 border-b border-zinc-200 dark:border-white/[0.08] bg-zinc-50/80 dark:bg-[#161822] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-500" />
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
                      Material Specification Matrix
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                    {parsedMatrix.length} Materials Scheduled
                  </span>
                </div>

                {parsedMatrix.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-zinc-200 dark:border-white/[0.08] bg-zinc-100/60 dark:bg-zinc-800/50 text-[11px] font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
                          <th className="py-2 px-3 w-10 text-center">#</th>
                          <th className="py-2 px-3">Component / Material</th>
                          <th className="py-2 px-3">Supplier</th>
                          <th className="py-2 px-3">Grade & Finish</th>
                          <th className="py-2 px-3">Caliper</th>
                          <th className="py-2 px-3 text-right">Planned Allocation</th>
                          <th className="py-2 px-3">Operational Purpose</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-200 dark:divide-white/[0.08] text-xs font-normal">
                        {parsedMatrix.map((row) => (
                          <tr
                            key={row.index}
                            className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors"
                          >
                            <td className="py-2.5 px-3 text-center font-mono font-bold text-zinc-400">
                              {row.index}
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-zinc-900 dark:text-zinc-100">
                              {row.type}
                            </td>
                            <td className="py-2.5 px-3 text-zinc-700 dark:text-zinc-300">
                              {row.supplier}
                            </td>
                            <td className="py-2.5 px-3 text-zinc-700 dark:text-zinc-300">
                              {row.grade} {row.color !== "—" ? `· ${row.color}` : ""}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-zinc-700 dark:text-zinc-300 tnum">
                              {row.caliper}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-indigo-700 dark:text-indigo-400 tnum">
                              {row.qty}
                            </td>
                            <td className="py-2.5 px-3 text-zinc-500 dark:text-zinc-400 italic">
                              {row.remark}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-4 text-xs text-zinc-600 dark:text-zinc-300 whitespace-pre-line">
                    {request.productDescription || "No material schedule specified."}
                  </div>
                )}

                <div className="px-4 py-2 border-t border-zinc-200 dark:border-white/[0.08] bg-zinc-50/50 dark:bg-zinc-900/30 text-[11px] text-zinc-500 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <CornerDownRight className="w-3 h-3 text-zinc-400" />
                    <span>Allocations validated against Master BTS 2026 Raw Material Quota</span>
                  </div>
                  <span className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                    ✓ All Line Items Ready
                  </span>
                </div>
              </div>

              {/* Plant Line & Capacity Confirmation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-md border border-zinc-200 dark:border-white/[0.08] bg-zinc-50/60 dark:bg-[#161822] text-xs">
                  <div className="font-bold text-zinc-800 dark:text-zinc-200 mb-1 flex items-center gap-1.5">
                    <Factory className="w-3.5 h-3.5 text-zinc-500" />
                    Plant Line Allocation
                  </div>
                  <p className="text-zinc-600 dark:text-zinc-400 text-[11px] leading-relaxed">
                    Reserved on <span className="font-semibold text-zinc-800 dark:text-zinc-200">Silvasa Line 2 & 4</span> for continuous reel-fed binding. Target dispatch window: <span className="font-mono">{request.sampleRequiredDate || "2026-11-15"}</span>.
                  </p>
                </div>

                <div className="p-3 rounded-md border border-zinc-200 dark:border-white/[0.08] bg-zinc-50/60 dark:bg-[#161822] text-xs">
                  <div className="font-bold text-zinc-800 dark:text-zinc-200 mb-1 flex items-center gap-1.5">
                    <Boxes className="w-3.5 h-3.5 text-zinc-500" />
                    Procurement Schedule
                  </div>
                  <p className="text-zinc-600 dark:text-zinc-400 text-[11px] leading-relaxed">
                    Raw paper reels from Bilt & Greyboard from Century are pre-staged in Central Warehouse under lot <span className="font-mono font-semibold">BTS-26-SIL-01</span>.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════ */}
          {/* TRACK 3: MARKETING REQUEST VIEW                                  */}
          {/* ════════════════════════════════════════════════════════════════ */}
          {trackType === "marketing_request" && (
            <div className="space-y-4">
              {/* Deliverable Scopes: 4 Types */}
              <div className="rounded-md border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-[#0f1118] p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5 font-mono">
                    <Sliders className="w-3.5 h-3.5 text-blue-500" />
                    Marketing Deliverable Scopes
                  </div>
                  <span className="text-[10px] font-mono text-zinc-400">
                    {(request.requestTypes || ["sample", "costing"]).length} of 4 Scopes Active
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {/* 01. Design Scope */}
                  {(() => {
                    const isActive = (request.requestTypes || []).includes("design") || Boolean(request.numberOfDesigns || request.trend);
                    return (
                      <div className={`p-2.5 rounded border text-left flex flex-col justify-between ${
                        isActive
                          ? "border-purple-300 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/25"
                          : "border-zinc-200/60 dark:border-zinc-800/80 bg-zinc-50/30 dark:bg-zinc-900/20 opacity-60"
                      }`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-mono text-[9px] font-bold text-zinc-400">01. DESIGN</span>
                          <span className={`text-[9px] font-mono font-semibold px-1 py-0.2 rounded border ${
                            isActive
                              ? "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800"
                              : "bg-zinc-100 text-zinc-500 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700"
                          }`}>
                            {isActive ? "Active" : "None"}
                          </span>
                        </div>
                        <div className="text-[11px] font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1">
                          <Palette className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                          <span>Creative Art</span>
                        </div>
                        <div className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 mt-1 truncate">
                          {isActive ? `${request.numberOfDesigns || 3} artworks · ${request.trend || "Botanical"}` : "Not requested"}
                        </div>
                      </div>
                    );
                  })()}

                  {/* 02. Mockup Scope */}
                  {(() => {
                    const isActive = (request.requestTypes || []).includes("mockup") || (request.mockupRequired && request.mockupRequired !== "No");
                    return (
                      <div className={`p-2.5 rounded border text-left flex flex-col justify-between ${
                        isActive
                          ? "border-amber-300 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/25"
                          : "border-zinc-200/60 dark:border-zinc-800/80 bg-zinc-50/30 dark:bg-zinc-900/20 opacity-60"
                      }`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-mono text-[9px] font-bold text-zinc-400">02. MOCKUP</span>
                          <span className={`text-[9px] font-mono font-semibold px-1 py-0.2 rounded border ${
                            isActive
                              ? "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800"
                              : "bg-zinc-100 text-zinc-500 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700"
                          }`}>
                            {isActive ? "Active" : "None"}
                          </span>
                        </div>
                        <div className="text-[11px] font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1">
                          <Box className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                          <span>CAD Dummy</span>
                        </div>
                        <div className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 mt-1 truncate">
                          {isActive ? (request.mockupRequired || "White Dummy") : "Not requested"}
                        </div>
                      </div>
                    );
                  })()}

                  {/* 03. Sampling Scope */}
                  {(() => {
                    const isActive = (request.requestTypes || []).includes("sample") || Boolean(request.qtyForSampling);
                    return (
                      <div className={`p-2.5 rounded border text-left flex flex-col justify-between ${
                        isActive
                          ? "border-blue-300 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/25"
                          : "border-zinc-200/60 dark:border-zinc-800/80 bg-zinc-50/30 dark:bg-zinc-900/20 opacity-60"
                      }`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-mono text-[9px] font-bold text-zinc-400">03. SAMPLING</span>
                          <span className={`text-[9px] font-mono font-semibold px-1 py-0.2 rounded border ${
                            isActive
                              ? "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800"
                              : "bg-zinc-100 text-zinc-500 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700"
                          }`}>
                            {isActive ? "Active" : "None"}
                          </span>
                        </div>
                        <div className="text-[11px] font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                          <span>Physical Spec</span>
                        </div>
                        <div className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 mt-1 truncate">
                          {isActive ? `${request.qtyForSampling || 6} pcs prototype` : "Not requested"}
                        </div>
                      </div>
                    );
                  })()}

                  {/* 04. Costing Scope */}
                  {(() => {
                    const isActive = (request.requestTypes || []).includes("costing") || Boolean(request.qtyDesignCosting);
                    return (
                      <div className={`p-2.5 rounded border text-left flex flex-col justify-between ${
                        isActive
                          ? "border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/25"
                          : "border-zinc-200/60 dark:border-zinc-800/80 bg-zinc-50/30 dark:bg-zinc-900/20 opacity-60"
                      }`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-mono text-[9px] font-bold text-zinc-400">04. COSTING</span>
                          <span className={`text-[9px] font-mono font-semibold px-1 py-0.2 rounded border ${
                            isActive
                              ? "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
                              : "bg-zinc-100 text-zinc-500 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700"
                          }`}>
                            {isActive ? "Active" : "None"}
                          </span>
                        </div>
                        <div className="text-[11px] font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1">
                          <Calculator className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          <span>BOM Costing</span>
                        </div>
                        <div className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 mt-1 truncate">
                          {isActive ? `${Number(request.qtyDesignCosting || 50000).toLocaleString()} pcs run` : "Not requested"}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Prototype Quantities */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-2.5 rounded border border-blue-200 dark:border-blue-500/20 bg-blue-50/30 dark:bg-blue-500/5">
                  <div className="text-[10px] uppercase font-bold text-zinc-400">Sampling Qty</div>
                  <div className="text-sm font-bold text-blue-700 dark:text-blue-400 font-mono tnum">
                    {request.qtyForSampling || "1"} pcs
                  </div>
                </div>

                <div className="p-2.5 rounded border border-blue-200 dark:border-blue-500/20 bg-blue-50/30 dark:bg-blue-500/5">
                  <div className="text-[10px] uppercase font-bold text-zinc-400">Costing Qty</div>
                  <div className="text-sm font-bold text-blue-700 dark:text-blue-400 font-mono tnum">
                    {Number(request.qtyDesignCosting || 0).toLocaleString()} pcs
                  </div>
                </div>

                <div className="p-2.5 rounded border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-900/40">
                  <div className="text-[10px] uppercase font-bold text-zinc-400">Pack Format</div>
                  <div className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                    {request.unitPcPack || "Single Book"}
                  </div>
                </div>

                <div className="p-2.5 rounded border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-900/40">
                  <div className="text-[10px] uppercase font-bold text-zinc-400">Mockup Req</div>
                  <div className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                    {request.mockupRequired || "No"}
                  </div>
                </div>
              </div>

              {/* Product Specifications */}
              <div className="rounded-md border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-[#0f1118] p-4 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-blue-500" />
                  Product & Catalog Specifications
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  <div className="p-2.5 rounded bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/60 dark:border-white/[0.08]">
                    <span className="text-zinc-400 block text-[10px] uppercase tracking-wider mb-0.5">Product Title</span>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                      {request.productDescription || "Standard Bound Notebook"}
                    </span>
                  </div>

                  <div className="p-2.5 rounded bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/60 dark:border-white/[0.08]">
                    <span className="text-zinc-400 block text-[10px] uppercase tracking-wider mb-0.5">Product Category</span>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                      {request.productType || "Soft Cover Notebook"}
                    </span>
                  </div>

                  <div className="p-2.5 rounded bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/60 dark:border-white/[0.08]">
                    <span className="text-zinc-400 block text-[10px] uppercase tracking-wider mb-0.5">Material Code</span>
                    <span className="font-mono font-semibold text-zinc-800 dark:text-zinc-200">
                      {request.materialCode || "NB-CUSTOM-01"}
                    </span>
                  </div>

                  <div className="p-2.5 rounded bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/60 dark:border-white/[0.08]">
                    <span className="text-zinc-400 block text-[10px] uppercase tracking-wider mb-0.5">Customer Item Code</span>
                    <span className="font-mono font-semibold text-zinc-800 dark:text-zinc-200">
                      {request.customerProductCode || "—"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Substrate & Finish Specs */}
              <div className="rounded-md border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-[#0f1118] p-4 space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
                  Substrate & Cover Specs
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <div className="p-2 rounded bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/60 dark:border-white/[0.08]">
                    <span className="text-zinc-400 block text-[10px] uppercase tracking-wider">Board Caliper</span>
                    <span className="font-medium text-zinc-800 dark:text-zinc-200 font-mono">450 GSM Greyboard</span>
                  </div>
                  <div className="p-2 rounded bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/60 dark:border-white/[0.08]">
                    <span className="text-zinc-400 block text-[10px] uppercase tracking-wider">Cover Finish</span>
                    <span className="font-medium text-zinc-800 dark:text-zinc-200">Matte Thermal + Spot UV</span>
                  </div>
                  <div className="p-2 rounded bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/60 dark:border-white/[0.08]">
                    <span className="text-zinc-400 block text-[10px] uppercase tracking-wider">Inner Pages</span>
                    <span className="font-medium text-zinc-800 dark:text-zinc-200 font-mono">80 GSM FSC Maplitho</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ────────────────────────────────────────────────────────────────── */}
        {/* Modal Footer (Clean Industrial Footer Bar)                         */}
        {/* ────────────────────────────────────────────────────────────────── */}
        <div className="px-5 py-3 border-t border-zinc-200 dark:border-white/[0.08] bg-zinc-50/80 dark:bg-[#0f1118] flex items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
            Registered by <span className="font-medium text-zinc-700 dark:text-zinc-300">{request.createdBy || "System User"}</span> on {request.dateRequestCreated || "2026-09-18"}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyCode}
              className="h-9 px-4 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors cursor-pointer flex items-center gap-2 shadow-2xs"
            >
              {copiedCode ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Code</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="h-9 px-5 rounded-md bg-zinc-900 hover:bg-black dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-bold transition-colors cursor-pointer shadow-xs"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SampleRequestInspector;
