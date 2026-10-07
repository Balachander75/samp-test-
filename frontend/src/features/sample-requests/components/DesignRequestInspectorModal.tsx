import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
  X,
  Palette,
  ExternalLink,
  Copy,
  Check,
  Calendar,
  User,
  Clock,
  Sparkles,
  Link2,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Layers,
  ChevronRight,
  Send,
  Plus,
  Trash2,
  Maximize2,
  FolderOpen,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  Building,
  Tag,
  Hash,
  Users,
  Factory,
  Package,
} from "lucide-react";
import { SampleRequestItem } from "../types";
import {
  submitCreativeDesignOutputApi,
  recordMarketingDesignDecisionApi,
} from "@/infrastructure/api/sampleRequestsApi";
import { StatusPill } from "@/components/ui/StatusPill";

export interface DesignRequestInspectorModalProps {
  request: SampleRequestItem | null;
  isOpen: boolean;
  onClose: () => void;
  onRefresh?: () => Promise<void> | void;
  mode?: "marketing" | "creative";
  showToast?: (message: string) => void;
}

type TabType = "specs" | "references" | "deliverables" | "signoff";

interface ChatterMessage {
  id: string;
  actorName: string;
  actorDepartment: string;
  action: string;
  title: string;
  body: string;
  timestamp: string;
  badge?: {
    text: string;
    variant: "purple" | "teal" | "amber" | "emerald" | "rose" | "neutral";
  };
  isNote?: boolean;
}

function getDesignStageIndex(r: SampleRequestItem | null): number {
  if (!r) return 0;
  const s = String(r.designRequestStatus || r.status || "").toLowerCase();
  const decision = String(r.marketingDesignDecision || "").toLowerCase();
  if (s.includes("approved") || s.includes("closed") || decision === "accepted") return 3;
  if (
    s.includes("marketing review") ||
    decision === "awaiting_marketing_review" ||
    s.includes("client review") ||
    s.includes("awaiting")
  )
    return 2;
  if (
    s.includes("creative") ||
    s.includes("concept") ||
    s.includes("remaining requested") ||
    decision === "remaining_requested"
  )
    return 1;
  return 0;
}

function formatDate(val?: string | null): string {
  if (!val) return "—";
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return val;
    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(d);
  } catch {
    return val;
  }
}

export const DesignRequestInspectorModal: React.FC<DesignRequestInspectorModalProps> = ({
  request,
  isOpen,
  onClose,
  onRefresh,
  mode = "marketing",
  showToast,
}) => {
  // ── HOOKS DECLARED UNCONDITIONALLY AT THE TOP ──
  const [activeTab, setActiveTab] = useState<TabType>("specs");
  const [copiedCode, setCopiedCode] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Creative Submission Form State
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [designFileUrl, setDesignFileUrl] = useState("");
  const [outputCount, setOutputCount] = useState<number>(1);
  const [outputRows, setOutputRows] = useState<
    Array<{ description: string; stockNumber: string; remarks: string }>
  >([]);
  const [isSubmittingOutput, setIsSubmittingOutput] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Marketing Decision State
  const [isDeciding, setIsDeciding] = useState(false);
  const [decisionError, setDecisionError] = useState<string | null>(null);

  // Chatter State
  const [noteInput, setNoteInput] = useState("");
  const [chatterFilter, setChatterFilter] = useState<"all" | "audit" | "notes">("all");
  const [internalNotes, setInternalNotes] = useState<ChatterMessage[]>([]);

  // Computed Values
  const effectiveDesignId = useMemo(() => {
    if (!request) return null;
    if (typeof request.designRequestId === "number" && request.designRequestId > 0) {
      return request.designRequestId;
    }
    const idStr = String(request.id || "");
    if (idStr.startsWith("design-")) {
      const num = parseInt(idStr.replace("design-", ""), 10);
      if (!isNaN(num) && num > 0) return num;
    }
    const numericOnly = parseInt(idStr.replace(/\D+/g, ""), 10);
    if (!isNaN(numericOnly) && numericOnly > 0) return numericOnly;
    return null;
  }, [request]);

  const activeStage = useMemo(() => getDesignStageIndex(request), [request]);

  const refCode = useMemo(() => {
    if (!request) return "";
    return request.srNumber || `DSG-${request.id}`;
  }, [request]);

  const requestedCount = useMemo(() => {
    if (!request) return 1;
    return Number(request.numberOfDesigns || request.productArtworkNos || request.designsCustomerCreative || 1);
  }, [request]);

  const submissions = useMemo(() => {
    return request?.creativeSubmissions || [];
  }, [request]);

  const deliveredCount = useMemo(() => {
    return submissions.reduce((sum, batch) => sum + (batch.rows?.length || 0), 0);
  }, [submissions]);

  const remainingCount = useMemo(() => {
    return Math.max(0, requestedCount - deliveredCount);
  }, [requestedCount, deliveredCount]);

  // Marketing brief description provided by the marketing guy
  const marketingBriefText = useMemo(() => {
    return request?.productDescription || request?.programName || "Commercial Cover Artwork";
  }, [request]);

  // Initialize/prefill output rows using the marketing description!
  useEffect(() => {
    const safeRemaining = Math.max(1, remainingCount);
    setOutputCount(safeRemaining > 0 ? 1 : 1);
    setOutputRows(
      Array.from({ length: 1 }, (_, index) => ({
        description: marketingBriefText ? `${marketingBriefText} (Artwork ${deliveredCount + index + 1})` : "",
        stockNumber: "",
        remarks: "",
      }))
    );
  }, [request?.id, remainingCount, deliveredCount, marketingBriefText]);

  // Load persisted internal notes from localStorage
  useEffect(() => {
    if (!request?.id) return;
    try {
      const stored = localStorage.getItem(`samp_design_notes_${request.id}`);
      if (stored) {
        setInternalNotes(JSON.parse(stored));
      } else {
        setInternalNotes([]);
      }
    } catch {
      setInternalNotes([]);
    }
  }, [request?.id]);

  const references = useMemo(() => {
    if (!request) return [];
    const list: Array<{ url: string; label: string; kind: "image" | "link" }> = [];
    if (request.productImagePath) {
      list.push({ url: request.productImagePath, label: "Product Reference Image", kind: "image" });
    }
    if (request.referenceImage) {
      list.push({ url: request.referenceImage, label: "Primary Moodboard Image", kind: "image" });
    }
    (request.referenceImages || []).forEach((url, i) => {
      if (url && !list.some((item) => item.url === url)) {
        list.push({ url, label: `Moodboard Ref ${i + 1}`, kind: "image" });
      }
    });
    (request.referenceLinks || []).forEach((url, i) => {
      if (url) {
        list.push({ url, label: `Reference Link ${i + 1}`, kind: "link" });
      }
    });
    return list;
  }, [request]);

  // Dynamic Chatter Stream Compilation
  const chatterEvents = useMemo<ChatterMessage[]>(() => {
    if (!request) return [];
    const events: ChatterMessage[] = [];

    // 1. Brief Creation Event
    events.push({
      id: "event-intake",
      actorName: request.createdBy || "Marketing Team (Corporate)",
      actorDepartment: "Marketing",
      action: "INTAKE_CREATED",
      title: "Design Brief Logged into System",
      body: `Initial graphic design brief submitted for review (${requestedCount} artwork variants requested).`,
      timestamp: request.createdAt || request.dateRequestCreated || new Date().toISOString(),
      badge: { text: "Intake", variant: "purple" },
    });

    // 2. Submissions Events
    submissions.forEach((batch, idx) => {
      events.push({
        id: `event-batch-${idx}`,
        actorName: "Creative Studio",
        actorDepartment: "Creative Studio",
        action: "DELIVERABLE_SUBMITTED",
        title: `Artwork Batch #${idx + 1} Submitted`,
        body: `${batch.rows.length} artwork(s) uploaded to ${batch.designFileUrl || "cloud repository"}.`,
        timestamp: batch.submittedAt || new Date().toISOString(),
        badge: { text: "Submitted", variant: "teal" },
      });
    });

    // 3. Marketing Review Decision Event
    if (request.marketingDesignDecision === "accepted" || activeStage === 3) {
      events.push({
        id: "event-approved",
        actorName: "Marketing Specialist",
        actorDepartment: "Marketing",
        action: "MARKETING_APPROVED",
        title: "Commercial Decision: Accepted & Closed",
        body: "All creative deliverables verified and approved for production.",
        timestamp: request.updatedAt || new Date().toISOString(),
        badge: { text: "Accepted", variant: "emerald" },
      });
    } else if (request.marketingDesignDecision === "remaining_requested") {
      events.push({
        id: "event-revision",
        actorName: "Marketing Specialist",
        actorDepartment: "Marketing",
        action: "REVISION_REQUESTED",
        title: "Remaining Artworks Requested",
        body: `Marketing returned ${remainingCount} remaining artwork(s) to Creative Studio for completion.`,
        timestamp: request.updatedAt || new Date().toISOString(),
        badge: { text: "Revisions", variant: "amber" },
      });
    }

    // 4. Merge Internal Notes
    internalNotes.forEach((n) => events.push(n));

    // Sort descending by timestamp
    return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [request, requestedCount, submissions, activeStage, remainingCount, internalNotes]);

  const filteredChatter = useMemo(() => {
    if (chatterFilter === "audit") return chatterEvents.filter((e) => !e.isNote);
    if (chatterFilter === "notes") return chatterEvents.filter((e) => e.isNote);
    return chatterEvents;
  }, [chatterEvents, chatterFilter]);

  // Adjust count in submission form
  const handleOutputCountChange = useCallback(
    (count: number) => {
      const safe = Math.max(1, Math.min(remainingCount || 10, count));
      setOutputCount(safe);
      setOutputRows((curr) =>
        Array.from({ length: safe }, (_, i) => {
          if (curr[i]) return curr[i];
          return {
            description: marketingBriefText ? `${marketingBriefText} (Artwork ${deliveredCount + i + 1})` : "",
            stockNumber: "",
            remarks: "",
          };
        })
      );
    },
    [remainingCount, marketingBriefText, deliveredCount]
  );

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(refCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 1500);
    } catch {
      setCopiedCode(false);
    }
  };

  // Add Internal Chatter Note
  const handlePostNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteInput.trim() || !request?.id) return;
    const newNote: ChatterMessage = {
      id: `note-${Date.now()}`,
      actorName: mode === "creative" ? "Creative Designer" : "Marketing Specialist",
      actorDepartment: mode === "creative" ? "Creative Studio" : "Marketing",
      action: "NOTE_POSTED",
      title: "Internal Note",
      body: noteInput.trim(),
      timestamp: new Date().toISOString(),
      isNote: true,
      badge: { text: "Note", variant: "neutral" },
    };
    const updated = [newNote, ...internalNotes];
    setInternalNotes(updated);
    try {
      localStorage.setItem(`samp_design_notes_${request.id}`, JSON.stringify(updated));
    } catch {}
    setNoteInput("");
  };

  // Creative Submit Deliverables Handler
  const handleSubmitOutput = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!effectiveDesignId) {
      setSubmitError("Design request reference ID could not be resolved.");
      return;
    }
    if (!designFileUrl.trim()) {
      setSubmitError("Please provide a valid design file URL (Google Drive, Figma, OneDrive, etc.).");
      return;
    }
    const emptyRowIndex = outputRows.findIndex(
      (r) => !r.description.trim() || (!r.stockNumber.trim() && !r.remarks.trim())
    );
    if (emptyRowIndex >= 0) {
      setSubmitError(
        `Artwork item D${deliveredCount + emptyRowIndex + 1} requires a description and a Shutterstock ID or remark.`
      );
      return;
    }

    setIsSubmittingOutput(true);
    setSubmitError(null);
    try {
      await submitCreativeDesignOutputApi(effectiveDesignId, {
        designFileUrl: designFileUrl.trim(),
        rows: outputRows,
      });
      if (showToast) {
        showToast("Design deliverables submitted to Marketing for review!");
      }
      setShowSubmitForm(false);
      setDesignFileUrl("");
      if (onRefresh) await onRefresh();
    } catch (err) {
      console.error("Creative submit output failed:", err);
      setSubmitError("Could not submit design output. Please verify and try again.");
    } finally {
      setIsSubmittingOutput(false);
    }
  };

  // Marketing Decision Handler
  const handleMarketingDecision = async (decision: "accept" | "request_remaining") => {
    if (!effectiveDesignId) {
      setDecisionError("Design request reference ID could not be resolved.");
      return;
    }
    setIsDeciding(true);
    setDecisionError(null);
    try {
      await recordMarketingDesignDecisionApi(effectiveDesignId, decision);
      if (showToast) {
        showToast(
          decision === "accept"
            ? "Artwork approved & closed! Design ready for production."
            : `Returned ${remainingCount} remaining design(s) to Creative Studio.`
        );
      }
      if (onRefresh) await onRefresh();
      onClose();
    } catch (err) {
      console.error("Marketing decision failed:", err);
      setDecisionError("Could not record design decision. Please try again.");
    } finally {
      setIsDeciding(false);
    }
  };

  // ── EARLY RETURN AFTER ALL HOOKS ──
  if (!isOpen || !request) return null;

  const isAwaitingReview =
    request.marketingDesignDecision === "awaiting_marketing_review" ||
    activeStage === 2;
  const isClosed = activeStage === 3;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-[2px]"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="design-inspector-title"
        className="relative w-full max-w-[96vw] xl:max-w-7xl h-[92vh] max-h-[92vh] flex flex-col bg-[#F8F9FA] dark:bg-[#12141a] border border-zinc-300 dark:border-white/10 rounded-lg shadow-2xl overflow-hidden select-text text-xs"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── 1. TOP CONTROL PANEL (IMAGE 1 STYLE) ── */}
        <div className="bg-white dark:bg-[#1a1c24] border-b border-[#D8DADD] dark:border-white/10 px-4 py-2 flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-2xs">
          {/* Left Action Buttons */}
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="bg-[#714B67] hover:bg-[#5B3C53] text-white px-3 py-1 rounded text-xs font-semibold flex items-center space-x-1.5 shadow-xs transition active:scale-95 cursor-pointer"
            >
              <span>Save &amp; Close</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="bg-white dark:bg-zinc-800 hover:bg-neutral-50 dark:hover:bg-zinc-700 text-neutral-600 dark:text-zinc-300 border border-[#CED4DA] dark:border-zinc-700 px-2.5 py-1 rounded text-xs font-medium transition cursor-pointer"
            >
              Discard
            </button>

            <div className="h-4 w-px bg-neutral-300 dark:bg-zinc-700 mx-1"></div>

            <button
              type="button"
              onClick={handleCopyCode}
              className="text-neutral-500 hover:text-[#714B67] dark:hover:text-purple-300 font-medium px-2 py-1 text-xs flex items-center gap-1 cursor-pointer"
              title="Copy request code"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCode ? "Copied" : "Copy Code"}</span>
            </button>
          </div>

          {/* Right: Authentic Odoo Statusbar Polygon Stepper (Chevrons) */}
          <div className="flex items-center gap-2">
            <div className="o_statusbar_status select-none">
              <div className="o_arrow_button done">1. Brief Intake</div>
              <div className={`o_arrow_button ${activeStage >= 1 ? (activeStage > 1 ? "done" : "active") : ""}`}>
                2. Creative Studio
              </div>
              <div className={`o_arrow_button ${activeStage >= 2 ? (activeStage > 2 ? "done" : "active") : ""}`}>
                3. Marketing Review
              </div>
              <div className={`o_arrow_button ${activeStage >= 3 ? "done active" : ""}`}>
                4. Approved &amp; Closed
              </div>
            </div>

            {/* Modal Close [X] */}
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded text-neutral-400 hover:text-neutral-700 dark:hover:text-white transition cursor-pointer ml-1"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── 2. MAIN WORKSPACE VIEWPORT (SPLIT: FORM SHEET + CHATTER) ── */}
        <div className="flex-1 flex overflow-hidden">
          {/* ── LEFT: FORM SHEET (DOCUMENT BODY) ── */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-[#F8F9FA] dark:bg-[#12141a]">
            <div className="o_form_sheet max-w-4xl mx-auto rounded-lg bg-white dark:bg-[#1a1c24] border border-zinc-200 dark:border-white/10 shadow-sm overflow-hidden">
              {/* Sheet Header */}
              <div className="border-b border-zinc-200 dark:border-white/10 bg-white dark:bg-[#161822]">
                {/* Reference & Mini Progress */}
                <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-2.5 bg-zinc-50/80 dark:bg-zinc-900/40 border-b border-zinc-200/80 dark:border-white/5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#714B67] dark:text-purple-300">
                      {refCode}
                    </span>
                    <span className="text-zinc-300 dark:text-zinc-700">/</span>
                    <span className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">
                      Design Request
                    </span>
                  </div>

                  {/* 4-Step Linear Pipeline Progression */}
                  <div className="flex items-center gap-1 sm:gap-2 text-[10.5px] font-mono select-none">
                    <div className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-bold">
                      <span className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-[9px]">
                        <Check className="w-2.5 h-2.5" />
                      </span>
                      <span>Intake</span>
                    </div>

                    <span className="text-zinc-300 dark:text-zinc-700 font-sans">→</span>

                    <div
                      className={`flex items-center gap-1 ${
                        activeStage >= 1
                          ? activeStage > 1
                            ? "text-emerald-700 dark:text-emerald-400 font-bold"
                            : "text-[#714B67] dark:text-purple-300 font-bold"
                          : "text-zinc-400 dark:text-zinc-600"
                      }`}
                    >
                      <span
                        className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] ${
                          activeStage > 1
                            ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700"
                            : activeStage === 1
                            ? "bg-purple-100 dark:bg-purple-950 text-[#714B67]"
                            : "bg-zinc-200 dark:bg-zinc-800 text-zinc-500"
                        }`}
                      >
                        {activeStage > 1 ? <Check className="w-2.5 h-2.5" /> : "2"}
                      </span>
                      <span>Creative Studio</span>
                    </div>

                    <span className="text-zinc-300 dark:text-zinc-700 font-sans">→</span>

                    <div
                      className={`flex items-center gap-1 ${
                        activeStage >= 2
                          ? activeStage > 2
                            ? "text-emerald-700 dark:text-emerald-400 font-bold"
                            : "text-amber-700 dark:text-amber-400 font-bold"
                          : "text-zinc-400 dark:text-zinc-600"
                      }`}
                    >
                      <span
                        className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] ${
                          activeStage > 2
                            ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700"
                            : activeStage === 2
                            ? "bg-amber-100 dark:bg-amber-950 text-amber-700"
                            : "bg-zinc-200 dark:bg-zinc-800 text-zinc-500"
                        }`}
                      >
                        {activeStage > 2 ? <Check className="w-2.5 h-2.5" /> : "3"}
                      </span>
                      <span>Marketing Review</span>
                    </div>

                    <span className="text-zinc-300 dark:text-zinc-700 font-sans">→</span>

                    <div
                      className={`flex items-center gap-1 ${
                        activeStage >= 3
                          ? "text-purple-700 dark:text-purple-300 font-bold"
                          : "text-zinc-400 dark:text-zinc-600"
                      }`}
                    >
                      <span
                        className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] ${
                          activeStage >= 3
                            ? "bg-purple-100 dark:bg-purple-950 text-purple-700"
                            : "bg-zinc-200 dark:bg-zinc-800 text-zinc-500"
                        }`}
                      >
                        {activeStage >= 3 ? <Check className="w-2.5 h-2.5" /> : "4"}
                      </span>
                      <span>Closed</span>
                    </div>
                  </div>
                </div>

                {/* Document Hero & Primary Details */}
                <div className="px-6 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50 font-sans">
                        {request.customer || "General Customer Account"}
                      </h1>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                        Initiated by{" "}
                        <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                          {request.createdBy || "Marketing Team (Corporate)"}
                        </span>{" "}
                        on {formatDate(request.dateRequestCreated || request.createdAt)}
                      </p>
                    </div>

                    {/* Context Badges */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold bg-purple-50 text-[#714B67] dark:bg-purple-950/50 dark:text-purple-300 border border-[#714B67]/20">
                        Design Request
                      </span>
                      <StatusPill
                        status={request.designRequestStatus || request.status || "Creative"}
                        size="md"
                      />
                    </div>
                  </div>

                  {/* 4-Point Metadata Strip */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3.5 mt-3 border-t border-zinc-200/80 dark:border-white/10 text-xs">
                    <div>
                      <span className="text-[11px] text-zinc-500 font-medium block">
                        Required Target Date
                      </span>
                      <div className="flex items-center gap-1.5 mt-0.5 font-semibold text-zinc-900 dark:text-zinc-100">
                        <Calendar className="w-3.5 h-3.5 text-[#017E84]" />
                        <span>
                          {formatDate(request.targetArtworkDateCreative || request.sampleRequiredDate)}
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[11px] text-zinc-500 font-medium block">
                        Artworks Required
                      </span>
                      <div className="flex items-center gap-1.5 mt-0.5 font-semibold text-[#714B67] dark:text-[#d5bdd0]">
                        <Palette className="w-3.5 h-3.5 text-[#714B67]" />
                        <span>{requestedCount} Artworks</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[11px] text-zinc-500 font-medium block">
                        Theme / Trend
                      </span>
                      <div className="flex items-center gap-1.5 mt-0.5 text-zinc-800 dark:text-zinc-200 font-medium">
                        <Sparkles className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                        <span className="truncate">{request.trend || "Contemporary Trend"}</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[11px] text-zinc-500 font-medium block">
                        Target Audience
                      </span>
                      <div className="flex items-center gap-1.5 mt-0.5 text-zinc-800 dark:text-zinc-200 font-medium">
                        <Users className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                        <span className="truncate">{request.targetAudience || "General Audience"}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notebook Tab Strip */}
                <div className="px-6 pb-0 pt-1">
                  <div className="border-b border-zinc-200 dark:border-white/10 flex items-center space-x-6 text-xs font-semibold overflow-x-auto">
                    <button
                      type="button"
                      onClick={() => setActiveTab("specs")}
                      className={`pb-2.5 border-b-2 transition cursor-pointer select-none flex items-center gap-1.5 whitespace-nowrap ${
                        activeTab === "specs"
                          ? "border-[#714B67] text-[#714B67] dark:text-purple-300 font-bold"
                          : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>1. Scope &amp; Design Brief</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab("references")}
                      className={`pb-2.5 border-b-2 transition cursor-pointer select-none flex items-center gap-1.5 whitespace-nowrap ${
                        activeTab === "references"
                          ? "border-[#714B67] text-[#714B67] dark:text-purple-300 font-bold"
                          : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                      }`}
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>2. References &amp; Moodboard</span>
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300">
                        {references.length}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab("deliverables")}
                      className={`pb-2.5 border-b-2 transition cursor-pointer select-none flex items-center gap-1.5 whitespace-nowrap ${
                        activeTab === "deliverables"
                          ? "border-[#714B67] text-[#714B67] dark:text-purple-300 font-bold"
                          : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>3. Creative Deliverables &amp; Review</span>
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300">
                        {deliveredCount}/{requestedCount}
                      </span>
                      {isAwaitingReview && (
                        <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-white animate-pulse">
                          Pending
                        </span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab("signoff")}
                      className={`pb-2.5 border-b-2 transition cursor-pointer select-none flex items-center gap-1.5 whitespace-nowrap ${
                        activeTab === "signoff"
                          ? "border-[#714B67] text-[#714B67] dark:text-purple-300 font-bold"
                          : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                      }`}
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>4. Commercial Sign-Off</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Tab Contents Area */}
              <div className="p-6 space-y-6">
                {/* ── TAB 1: SCOPE & DESIGN BRIEF ── */}
                {activeTab === "specs" && (
                  <div className="space-y-6">
                    {/* Technical Description & Scope Box (Matches Image 1) */}
                    <div>
                      <h3 className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-500 mb-2">
                        Technical Description &amp; Product Scope
                      </h3>
                      <div className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-white/[0.02] text-sm text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap leading-relaxed min-h-[70px]">
                        {request.productDescription || "No design brief description was provided."}
                      </div>
                    </div>

                    {/* Additional Direction & Finishing Specifications */}
                    <div>
                      <h3 className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-500 mb-2">
                        Additional Direction &amp; Finishing Specifications
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 space-y-2">
                          <div className="text-xs text-zinc-500 font-medium">Program Specification</div>
                          <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                            {request.programName || "Standard Season Program"}
                          </div>
                          <div className="text-xs text-zinc-500 font-mono">
                            Year: {request.programYear || request.year || "2026-27"}
                          </div>
                        </div>

                        <div className="p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 space-y-2">
                          <div className="text-xs text-zinc-500 font-medium">Finishing Notes / Remarks</div>
                          <div className="text-sm text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap">
                            {request.designRemarks || "Standard cover finishes (UV / Spot gloss as per production line)."}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── TAB 2: REFERENCES & MOODBOARD ── */}
                {activeTab === "references" && (
                  <div className="space-y-5">
                    <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
                      <div>
                        <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                          Moodboard Visuals &amp; Reference Assets
                        </h3>
                        <p className="text-xs text-zinc-500">
                          Attachments submitted by Marketing for design style and concept guidance
                        </p>
                      </div>
                      <span className="font-mono text-xs font-bold text-[#714B67] dark:text-purple-300">
                        {references.length} Attachments
                      </span>
                    </div>

                    {references.length === 0 ? (
                      <div className="p-8 text-center border border-dashed border-zinc-300 dark:border-zinc-800 rounded-lg">
                        <ImageIcon className="mx-auto h-8 w-8 text-zinc-400 mb-2" />
                        <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                          No reference files or links attached.
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {references.map((ref, idx) => (
                          <div
                            key={`${ref.url}-${idx}`}
                            className="group overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-2xs dark:border-zinc-800 dark:bg-zinc-900/40 flex flex-col"
                          >
                            {ref.kind === "image" ? (
                              <div className="relative aspect-4/3 w-full bg-zinc-100 dark:bg-zinc-900 overflow-hidden">
                                <img
                                  src={ref.url}
                                  alt={ref.label}
                                  className="h-full w-full object-cover transition duration-300 group-hover:scale-105 cursor-pointer"
                                  onClick={() => setLightboxImage(ref.url)}
                                  loading="lazy"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setLightboxImage(ref.url)}
                                    className="p-1.5 rounded bg-white text-zinc-900 text-xs font-semibold shadow-md flex items-center gap-1 cursor-pointer"
                                  >
                                    <Maximize2 className="w-3.5 h-3.5" />
                                    <span>Zoom</span>
                                  </button>
                                  <a
                                    href={ref.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-1.5 rounded bg-white text-zinc-900 text-xs font-semibold shadow-md flex items-center gap-1"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </a>
                                </div>
                              </div>
                            ) : (
                              <div className="aspect-4/3 w-full bg-[#714B67]/5 flex flex-col items-center justify-center p-4 text-center">
                                <Link2 className="w-8 h-8 text-[#714B67]" />
                                <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mt-2 line-clamp-2">
                                  {ref.label}
                                </span>
                                <a
                                  href={ref.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="mt-3 inline-flex items-center gap-1 px-3 py-1 rounded bg-[#714B67] text-white text-xs font-semibold"
                                >
                                  <span>Open Link</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              </div>
                            )}
                            <div className="p-2.5 border-t border-zinc-100 dark:border-zinc-800 text-xs font-medium text-zinc-800 dark:text-zinc-200 truncate">
                              {ref.label}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ── TAB 3: CREATIVE DELIVERABLES & REVIEW ── */}
                {activeTab === "deliverables" && (
                  <div className="space-y-6">
                    {/* Deliverable Progress Card */}
                    <div className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <div className="text-[11px] font-mono font-bold uppercase text-zinc-500">
                            Deliverable Fulfillment
                          </div>
                          <div className="text-base font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">
                            {deliveredCount} of {requestedCount} Artworks Completed
                          </div>
                        </div>

                        {mode === "creative" && remainingCount > 0 && (
                          <button
                            type="button"
                            onClick={() => setShowSubmitForm(!showSubmitForm)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#714B67] hover:bg-[#5B3C53] text-white text-xs font-bold shadow-xs transition cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>{showSubmitForm ? "Hide Form" : "Submit Artwork Batch"}</span>
                          </button>
                        )}
                      </div>

                      {/* Progress Bar */}
                      <div className="mt-3 h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#017E84] rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(100, Math.round((deliveredCount / Math.max(1, requestedCount)) * 100))}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Creative Submission Form (With Marketing Description Pre-filled!) */}
                    {mode === "creative" && showSubmitForm && remainingCount > 0 && (
                      <form
                        onSubmit={handleSubmitOutput}
                        className="rounded-lg border border-[#714B67]/30 bg-[#714B67]/[0.03] p-4.5 dark:border-[#714B67]/40 dark:bg-[#714B67]/10 space-y-4"
                      >
                        <div className="flex items-center justify-between pb-2 border-b border-[#714B67]/20">
                          <div className="flex items-center gap-2 text-xs font-bold text-[#714B67] dark:text-[#d5bdd0]">
                            <FolderOpen className="w-4 h-4" />
                            <span>Submit Artwork Output (Batch #{submissions.length + 1})</span>
                          </div>
                          <span className="text-xs font-mono text-zinc-500">
                            {remainingCount} Artwork(s) remaining
                          </span>
                        </div>

                        {/* Marketing Brief Display / Fast Apply */}
                        <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-xs">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="font-bold text-zinc-500 shrink-0">Marketing Brief:</span>
                            <span className="font-medium text-zinc-800 dark:text-zinc-200 truncate">
                              {marketingBriefText}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setOutputRows((curr) =>
                                curr.map((r, i) => ({
                                  ...r,
                                  description: marketingBriefText
                                    ? `${marketingBriefText} (Artwork ${deliveredCount + i + 1})`
                                    : r.description,
                                }))
                              );
                            }}
                            className="text-[11px] font-semibold text-[#714B67] hover:underline shrink-0 ml-2 cursor-pointer"
                          >
                            Apply to All Rows
                          </button>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-[1fr_200px]">
                          <div>
                            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
                              Design Files Cloud Link <span className="text-rose-500">*</span>
                            </label>
                            <input
                              type="url"
                              required
                              value={designFileUrl}
                              onChange={(e) => setDesignFileUrl(e.target.value)}
                              placeholder="https://drive.google.com/... or Figma link"
                              className="mt-1 h-8.5 w-full rounded border border-zinc-300 bg-white px-2.5 text-xs outline-none focus:border-[#714B67] dark:border-zinc-700 dark:bg-[#1a1c26]"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
                              Completed in this Batch
                            </label>
                            <input
                              type="number"
                              min={1}
                              max={remainingCount}
                              value={outputCount}
                              onChange={(e) => handleOutputCountChange(Number(e.target.value))}
                              className="mt-1 h-8.5 w-full rounded border border-zinc-300 bg-white px-2.5 text-xs font-mono outline-none focus:border-[#714B67] dark:border-zinc-700 dark:bg-[#1a1c26]"
                            />
                          </div>
                        </div>

                        {/* Dynamic Rows */}
                        <div className="overflow-hidden rounded border border-zinc-200 dark:border-zinc-700">
                          <div className="grid grid-cols-[60px_1fr_1fr_1fr] gap-2 bg-zinc-100/80 px-3 py-2 text-[11px] font-bold uppercase text-zinc-500 dark:bg-zinc-800">
                            <span>Code</span>
                            <span>Description (Editable)</span>
                            <span>Shutterstock ID</span>
                            <span>Remarks</span>
                          </div>
                          {outputRows.map((row, index) => (
                            <div
                              key={index}
                              className="grid grid-cols-[60px_1fr_1fr_1fr] gap-2 border-t border-zinc-200 p-2.5 dark:border-zinc-800 bg-white dark:bg-[#12141d]"
                            >
                              <span className="font-mono text-xs font-bold text-[#714B67] dark:text-[#d5bdd0] self-center">
                                D{deliveredCount + index + 1}
                              </span>
                              <input
                                type="text"
                                required
                                placeholder="Artwork description"
                                value={row.description}
                                onChange={(e) =>
                                  setOutputRows((curr) =>
                                    curr.map((r, i) => (i === index ? { ...r, description: e.target.value } : r))
                                  )
                                }
                                className="h-8 rounded border border-zinc-300 px-2 text-xs outline-none focus:border-[#714B67] dark:border-zinc-700 dark:bg-[#1a1c26]"
                              />
                              <input
                                type="text"
                                placeholder="e.g. 192847192"
                                value={row.stockNumber}
                                onChange={(e) =>
                                  setOutputRows((curr) =>
                                    curr.map((r, i) => (i === index ? { ...r, stockNumber: e.target.value } : r))
                                  )
                                }
                                className="h-8 rounded border border-zinc-300 px-2 text-xs outline-none focus:border-[#714B67] dark:border-zinc-700 dark:bg-[#1a1c26]"
                              />
                              <input
                                type="text"
                                placeholder="Production notes"
                                value={row.remarks}
                                onChange={(e) =>
                                  setOutputRows((curr) =>
                                    curr.map((r, i) => (i === index ? { ...r, remarks: e.target.value } : r))
                                  )
                                }
                                className="h-8 rounded border border-zinc-300 px-2 text-xs outline-none focus:border-[#714B67] dark:border-zinc-700 dark:bg-[#1a1c26]"
                              />
                            </div>
                          ))}
                        </div>

                        {submitError && (
                          <div className="flex items-center gap-2 rounded bg-rose-50 p-2 text-xs font-semibold text-rose-700 dark:bg-rose-950/30 dark:text-rose-300">
                            <AlertTriangle className="w-4 h-4 shrink-0" />
                            <span>{submitError}</span>
                          </div>
                        )}

                        <div className="flex items-center justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setShowSubmitForm(false)}
                            className="px-3 py-1 rounded border border-zinc-300 text-xs font-medium text-zinc-700 hover:bg-zinc-100 transition cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={isSubmittingOutput}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded bg-[#714B67] hover:bg-[#5B3C53] text-white text-xs font-bold shadow-xs transition disabled:opacity-50 cursor-pointer"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>{isSubmittingOutput ? "Submitting..." : "Submit to Marketing"}</span>
                          </button>
                        </div>
                      </form>
                    )}

                    {/* Marketing Review Verdict Spotlight */}
                    {mode === "marketing" && isAwaitingReview && (
                      <div className="p-4 rounded-lg border border-[#714B67]/30 bg-[#714B67]/[0.03] dark:border-[#714B67]/40 dark:bg-[#714B67]/10 space-y-3">
                        <div className="flex items-center gap-2 text-xs font-bold text-[#714B67] dark:text-[#d5bdd0]">
                          <ShieldCheck className="w-4 h-4" />
                          <span>Marketing Review &amp; Commercial Sign-Off</span>
                        </div>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400">
                          Creative Studio submitted <strong>{deliveredCount} of {requestedCount}</strong> requested artworks. Please review the deliverables and select your verdict.
                        </p>

                        {decisionError && (
                          <div className="flex items-center gap-2 rounded bg-rose-50 p-2 text-xs font-semibold text-rose-700">
                            <AlertTriangle className="w-4 h-4 shrink-0" />
                            <span>{decisionError}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="button"
                            disabled={isDeciding}
                            onClick={() => handleMarketingDecision("accept")}
                            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded bg-[#714B67] hover:bg-[#5B3C53] text-white text-xs font-bold shadow-xs transition cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>{isDeciding ? "Processing..." : "Accept & Close Request"}</span>
                          </button>

                          <button
                            type="button"
                            disabled={isDeciding || remainingCount === 0}
                            onClick={() => handleMarketingDecision("request_remaining")}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-[#714B67]/40 bg-white text-[#714B67] hover:bg-neutral-50 text-xs font-bold transition cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Request Remaining Artworks ({remainingCount})</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Submissions History List */}
                    {submissions.length === 0 ? (
                      <div className="p-8 text-center border border-dashed border-zinc-300 dark:border-zinc-800 rounded-lg">
                        <Layers className="mx-auto h-8 w-8 text-zinc-400 mb-2" />
                        <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                          No artwork outputs submitted yet.
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {submissions.map((batch, bIdx) => (
                          <div
                            key={bIdx}
                            className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/40 overflow-hidden"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 bg-zinc-50/70 px-4 py-2.5 dark:border-zinc-800 dark:bg-zinc-800/40">
                              <div className="flex items-center gap-2 text-xs">
                                <span className="font-bold text-zinc-900 dark:text-zinc-100">
                                  Batch #{bIdx + 1}
                                </span>
                                <span className="text-zinc-400">•</span>
                                <span className="text-zinc-500 font-mono">
                                  {formatDate(batch.submittedAt)}
                                </span>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#017E84]/10 text-[#017E84]">
                                  {batch.rows.length} Artworks
                                </span>
                              </div>

                              {batch.designFileUrl && (
                                <a
                                  href={batch.designFileUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#714B67] hover:bg-[#5B3C53] text-white text-[11px] font-semibold transition"
                                >
                                  <span>Open Artwork Files</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </div>

                            <table className="w-full text-left text-xs">
                              <thead className="bg-zinc-50 dark:bg-zinc-900/40 text-[10.5px] uppercase font-mono text-zinc-500 border-b border-zinc-100 dark:border-zinc-800">
                                <tr>
                                  <th className="px-3.5 py-2 w-16">Code</th>
                                  <th className="px-3.5 py-2">Artwork Description</th>
                                  <th className="px-3.5 py-2 w-36">Shutterstock ID</th>
                                  <th className="px-3.5 py-2">Remarks</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                {batch.rows.map((row: any) => (
                                  <tr key={row.designNumber}>
                                    <td className="px-3.5 py-2.5 font-mono font-bold text-[#714B67] dark:text-[#d5bdd0]">
                                      {row.designNumber}
                                    </td>
                                    <td className="px-3.5 py-2.5 font-medium text-zinc-900 dark:text-zinc-100">
                                      {row.description}
                                    </td>
                                    <td className="px-3.5 py-2.5 font-mono text-zinc-600 dark:text-zinc-400">
                                      {row.stockNumber || "—"}
                                    </td>
                                    <td className="px-3.5 py-2.5 text-zinc-600 dark:text-zinc-400">
                                      {row.remarks || "—"}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ── TAB 4: COMMERCIAL SIGN-OFF ── */}
                {activeTab === "signoff" && (
                  <div className="space-y-4">
                    {isClosed ? (
                      <div className="p-6 rounded-lg border border-emerald-200 bg-emerald-50/70 text-center dark:border-emerald-900/50 dark:bg-emerald-950/20">
                        <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600 mb-2" />
                        <h4 className="text-base font-bold text-emerald-900 dark:text-emerald-200">
                          Design Package Approved &amp; Released
                        </h4>
                        <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1 max-w-md mx-auto">
                          Marketing has finalized and closed this design request. All graphic assets are confirmed ready for prepress production.
                        </p>
                      </div>
                    ) : (
                      <div className="p-6 rounded-lg border border-zinc-200 bg-zinc-50 text-center dark:border-zinc-800 dark:bg-zinc-900/40">
                        <Clock className="mx-auto h-8 w-8 text-zinc-400 mb-2" />
                        <h4 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                          Awaiting Production Sign-Off
                        </h4>
                        <p className="text-xs text-zinc-500 mt-1">
                          Commercial sign-off will take effect once Marketing accepts the submitted creative outputs.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── RIGHT: AUDIT TRAIL & CHATTER (IMAGE 1 EXACT DESIGN) ── */}
          <div className="w-80 md:w-96 border-l border-zinc-200 dark:border-white/10 bg-white dark:bg-[#161822] flex flex-col h-full shrink-0">
            {/* Chatter Header with Indicator & Filter Tabs */}
            <div className="px-4 py-2.5 border-b border-zinc-200/80 dark:border-white/10 flex items-center justify-between bg-zinc-50/60 dark:bg-zinc-900/40">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="font-semibold text-xs text-zinc-800 dark:text-zinc-200">
                  Audit Trail &amp; Chatter
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                  {chatterEvents.length}
                </span>
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-1 bg-zinc-200/60 dark:bg-zinc-800 p-0.5 rounded text-[10px] font-mono">
                <button
                  type="button"
                  onClick={() => setChatterFilter("all")}
                  className={`px-2 py-0.5 rounded transition cursor-pointer ${
                    chatterFilter === "all"
                      ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-bold shadow-2xs"
                      : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setChatterFilter("audit")}
                  className={`px-2 py-0.5 rounded transition cursor-pointer ${
                    chatterFilter === "audit"
                      ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-bold shadow-2xs"
                      : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
                  }`}
                >
                  Audit
                </button>
                <button
                  type="button"
                  onClick={() => setChatterFilter("notes")}
                  className={`px-2 py-0.5 rounded transition cursor-pointer ${
                    chatterFilter === "notes"
                      ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-bold shadow-2xs"
                      : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
                  }`}
                >
                  Notes
                </button>
              </div>
            </div>

            {/* Note Composer */}
            <form
              onSubmit={handlePostNote}
              className="p-3 border-b border-zinc-200/80 dark:border-white/10 bg-zinc-50/50 dark:bg-zinc-900/20"
            >
              <div className="relative">
                <input
                  type="text"
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  placeholder="Log internal note or directive..."
                  className="w-full pl-3 pr-8 py-2 text-xs rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-[#714B67]"
                />
                <button
                  type="submit"
                  disabled={!noteInput.trim()}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-[#714B67] disabled:opacity-30 cursor-pointer transition"
                  title="Post note"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex items-center justify-between mt-1 px-1 text-[10px] text-zinc-400 font-mono">
                <span>Visible to Marketing &amp; Creative Studio</span>
                <span>Press Enter to send</span>
              </div>
            </form>

            {/* Chronological Stream */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
              {filteredChatter.length === 0 ? (
                <div className="py-12 text-center text-zinc-400 font-mono text-[11px]">
                  No chatter entries found.
                </div>
              ) : (
                filteredChatter.map((evt) => {
                  const isMarketing =
                    evt.actorDepartment.toLowerCase().includes("marketing") ||
                    evt.action.includes("INTAKE");
                  const avatarBg = evt.isNote
                    ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                    : isMarketing
                    ? "bg-purple-100 text-[#714B67] dark:bg-purple-950/60 dark:text-purple-300"
                    : "bg-teal-100 text-[#017E84] dark:bg-teal-950/60 dark:text-teal-300";

                  const initials = evt.actorName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .substring(0, 2)
                    .toUpperCase();

                  return (
                    <div key={evt.id} className="flex items-start gap-2.5 text-xs select-text group">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-[9px] font-bold shrink-0 mt-0.5 ${avatarBg}`}
                      >
                        {initials || "AG"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 flex-wrap">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                              {evt.actorName}
                            </span>
                            <span className="text-[10px] text-zinc-400 font-mono">
                              • {evt.actorDepartment}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-zinc-400">
                            {formatDate(evt.timestamp)}
                          </span>
                        </div>

                        <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                            {evt.title}
                          </span>
                          {evt.badge && (
                            <span
                              className={`text-[9.5px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                                evt.badge.variant === "purple"
                                  ? "bg-purple-50 text-[#714B67] border-purple-200"
                                  : evt.badge.variant === "emerald"
                                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                  : evt.badge.variant === "teal"
                                  ? "bg-teal-50 text-teal-800 border-teal-200"
                                  : evt.badge.variant === "amber"
                                  ? "bg-amber-50 text-amber-800 border-amber-200"
                                  : "bg-zinc-100 text-zinc-600 border-zinc-200"
                              }`}
                            >
                              {evt.badge.text}
                            </span>
                          )}
                        </div>

                        {evt.body && (
                          <div className="mt-1 text-zinc-600 dark:text-zinc-400 leading-relaxed text-[11px] bg-zinc-50/70 dark:bg-zinc-900/30 p-2 rounded border border-zinc-100 dark:border-zinc-800/80">
                            {evt.body}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox Image Preview Modal */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightboxImage(null)}
        >
          <div className="relative max-h-[90vh] max-w-[90vw] overflow-hidden rounded-xl bg-black">
            <button
              type="button"
              onClick={() => setLightboxImage(null)}
              className="absolute top-3 right-3 p-2 rounded-full bg-black/60 text-white hover:bg-black transition"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={lightboxImage}
              alt="Reference preview"
              className="max-h-[85vh] max-w-[85vw] object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default DesignRequestInspectorModal;
