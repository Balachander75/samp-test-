import React, { useState, useEffect, useMemo } from "react";
import { UserProfile } from "@/features/auth";
import { SampleRequestItem } from "../types";
import {
  claimFeasibilityTaskApi,
  recordFeasibilitySampVerdictApi,
  recordFeasibilityMarketingDecisionApi,
  convertFeasibilityToSamplingApi,
  cleanFeasibilityDescription,
  addFeasibilityNoteApi,
} from "@/infrastructure/api";
import {
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
  Sparkles,
  FileText,
} from "lucide-react";

// Modular Sub-Components
import {
  FeasibilityControlPanel,
  FeasibilitySheetHeader,
  FeasibilityTechnicalReviewTab,
  FeasibilityCommercialDecisionTab,
  FeasibilityChatterFeed,
} from "./feasibility";
import { ImageLightboxModal } from "./inspector";

// Domain Parsers & Types
import {
  ParsedImageRef,
  ParsedFeasibilityDetails,
  parseFeasibilityDetails,
} from "../utils/feasibilityParsers";

// Re-export for backward compatibility
export type { ParsedImageRef, ParsedFeasibilityDetails };
export { parseFeasibilityDetails };

export interface FeasibilityInspectorModalProps {
  request: SampleRequestItem | null;
  isOpen: boolean;
  onClose: () => void;
  onMarketingApprove?: (
    requestId: string | number,
    approved: boolean,
    remark?: string
  ) => Promise<void>;
  onDeleteRequest?: (req: SampleRequestItem) => void;
  user?: UserProfile | null;
  isAdmin?: boolean;
  sourceDesk?: "marketing" | "samp";
}

export const FeasibilityInspectorModal: React.FC<FeasibilityInspectorModalProps> = ({
  request,
  isOpen,
  onClose,
  onMarketingApprove,
  onDeleteRequest,
  user,
  isAdmin = false,
  sourceDesk = "marketing",
}) => {
  const [localOverride, setLocalOverride] = useState<SampleRequestItem | null>(null);

  useEffect(() => {
    setLocalOverride(null);
  }, [request?.id]);

  const activeRequest = localOverride || request;

  // Feasibility flow states
  const [isClaiming, setIsClaiming] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [sampVerdictChoice, setSampVerdictChoice] = useState<"Yes" | "No" | "Maybe">("Yes");
  const [sampVerdictRemark, setSampVerdictRemark] = useState("");
  const [sampVerdictError, setSampVerdictError] = useState<string | null>(null);
  const [isSubmittingSampVerdict, setIsSubmittingSampVerdict] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isSubmittingDecision, setIsSubmittingDecision] = useState(false);
  const [decisionRemark, setDecisionRemark] = useState("");
  const [selectedPreviewImage, setSelectedPreviewImage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"specs" | "review" | "decision">(
    sourceDesk === "samp" ? "review" : "specs"
  );

  useEffect(() => {
    setActiveTab(sourceDesk === "samp" ? "review" : "specs");
  }, [request?.id, sourceDesk]);

  // Strict role permissions based on active operational desk persona
  const isMarketingDesk = sourceDesk === "marketing";
  const canEvaluateTechnical = sourceDesk === "samp";
  const canMakeCommercialDecision = isMarketingDesk;

  // Parse feasibility technical data
  const feasibilityDetails = useMemo(() => {
    if (!activeRequest) {
      return {
        category: "",
        requirements: "",
        marketingRemarks: "",
        referenceLinks: [],
        referenceImages: [],
      };
    }
    const rawImages = [
      ...(Array.isArray(activeRequest.referenceImages) ? activeRequest.referenceImages : []),
      ...(Array.isArray((activeRequest as any).attached_images)
        ? (activeRequest as any).attached_images
        : []),
      ...(Array.isArray((activeRequest as any).reference_images)
        ? (activeRequest as any).reference_images
        : []),
    ];
    const rawLinks = [
      ...(Array.isArray(activeRequest.referenceLinks) ? activeRequest.referenceLinks : []),
      ...(Array.isArray((activeRequest as any).reference_links)
        ? (activeRequest as any).reference_links
        : []),
      ...(Array.isArray((activeRequest as any).webLinks) ? (activeRequest as any).webLinks : []),
    ];
    const rawImageNames = [
      ...(Array.isArray(activeRequest.referenceImageNames)
        ? activeRequest.referenceImageNames
        : []),
      ...(Array.isArray((activeRequest as any).image_names)
        ? (activeRequest as any).image_names
        : []),
    ];

    return parseFeasibilityDetails(
      activeRequest.productDescription,
      rawImages,
      rawLinks,
      null,
      rawImageNames
    );
  }, [activeRequest]);

  // Previewable image assets
  const previewableImages = useMemo(() => {
    const list: { id: string; url: string; name: string }[] = [];
    (feasibilityDetails.referenceImages || []).forEach((img, idx) => {
      const url = typeof img === "string" ? img : img.url;
      const name = typeof img === "string" ? `Attachment ${idx + 1}` : img.name || `Attachment ${idx + 1}`;
      if (url) {
        list.push({ id: `parsed-${idx}`, url, name });
      }
    });

    if (activeRequest?.productImagePath) {
      const isAlreadyIncluded = list.some((item) => item.url === activeRequest.productImagePath);
      if (!isAlreadyIncluded) {
        list.unshift({
          id: "primary-photo",
          url: activeRequest.productImagePath,
          name: "Primary Product Photo",
        });
      }
    }
    return list;
  }, [feasibilityDetails.referenceImages, activeRequest?.productImagePath]);

  const classificationLabel = useMemo(() => {
    return (
      feasibilityDetails.category ||
      activeRequest?.productTypeNavneet ||
      activeRequest?.productType ||
      "New Category"
    );
  }, [feasibilityDetails.category, activeRequest]);

  // Clean description and remarks
  const displayDescription = useMemo(() => {
    return cleanFeasibilityDescription(
      feasibilityDetails.requirements || activeRequest?.productDescription || ""
    );
  }, [feasibilityDetails.requirements, activeRequest?.productDescription]);

  const displayRemark = useMemo(() => {
    const raw =
      feasibilityDetails.marketingRemarks ||
      (activeRequest as any)?.marketingRemarks ||
      (activeRequest as any)?.remarks ||
      "";
    return typeof raw === "string" ? raw.trim() : "";
  }, [feasibilityDetails.marketingRemarks, activeRequest]);

  // Actions
  const handleCopyCode = () => {
    const code = activeRequest?.srNumber || activeRequest?.materialCode || `FS-${activeRequest?.id}`;
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // SAMP Claim Task
  const handleClaimTask = async () => {
    if (!activeRequest?.id || isClaiming || !canEvaluateTechnical) return;
    setIsClaiming(true);
    try {
      const updated = await claimFeasibilityTaskApi(activeRequest.id);
      setLocalOverride(updated);
      window.dispatchEvent(new CustomEvent("samp:requests-changed"));
    } catch (err) {
      console.error("Failed to claim feasibility task:", err);
    } finally {
      setIsClaiming(false);
    }
  };

  // SAMP Technical Verdict Submission
  const handleSubmitSampVerdict = async () => {
    if (!activeRequest?.id || isSubmittingSampVerdict || !canEvaluateTechnical) return;
    if ((sampVerdictChoice === "No" || sampVerdictChoice === "Maybe") && !sampVerdictRemark.trim()) {
      setSampVerdictError(`A detailed technical explanation is required when selecting "${sampVerdictChoice}".`);
      return;
    }
    setSampVerdictError(null);
    setIsSubmittingSampVerdict(true);
    try {
      const updated = await recordFeasibilitySampVerdictApi(activeRequest.id, {
        response: sampVerdictChoice,
        remark: sampVerdictRemark.trim() || undefined,
      });
      setLocalOverride(updated);
      window.dispatchEvent(new CustomEvent("samp:requests-changed"));
    } catch (err: any) {
      console.error("Failed to submit SAMP verdict:", err);
      setSampVerdictError(err.message || "Failed to submit technical verdict.");
    } finally {
      setIsSubmittingSampVerdict(false);
    }
  };

  // Marketing Final Decision (Accept / Reject)
  const handleMarketingFinalApprove = async (approved: boolean) => {
    if (!activeRequest?.id || isSubmittingDecision || !canMakeCommercialDecision) return;
    setIsSubmittingDecision(true);
    try {
      const decisionStr = approved ? "Accepted" : "Rejected";
      const decider = user?.name || user?.userid || "Marketing Authority";
      const updated = await recordFeasibilityMarketingDecisionApi(activeRequest.id, {
        decision: decisionStr,
        decision_remark: decisionRemark.trim() || undefined,
      });

      if (onMarketingApprove) {
        await onMarketingApprove(activeRequest.id, approved, decisionRemark.trim());
      }

      setLocalOverride({
        ...updated,
        marketingDecision: decisionStr,
        marketingDecisionBy: updated.marketingDecisionBy || decider,
        marketingDecisionAt: updated.marketingDecisionAt || new Date().toISOString(),
        marketingDecisionRemark: decisionRemark.trim(),
        status: approved ? "Feasibility Approved" : "Feasibility Rejected",
      });
      window.dispatchEvent(new CustomEvent("samp:requests-changed"));
    } catch (err) {
      console.error("Failed to record marketing decision:", err);
    } finally {
      setIsSubmittingDecision(false);
    }
  };

  // Convert to Commercial Sampling Request
  const handleConvertToSampling = async () => {
    if (!activeRequest?.id || isConverting || !canMakeCommercialDecision) return;
    setIsConverting(true);
    try {
      const converter = user?.name || user?.userid || "Marketing Team";
      const result = await convertFeasibilityToSamplingApi(activeRequest.id);
      if (result && result.sampleSrNumber) {
        setLocalOverride({
          ...activeRequest,
          convertedSampleRequestId: result.sampleRequestId,
          convertedSrNumber: result.sampleSrNumber,
          convertedBy: converter,
          convertedAt: new Date().toISOString(),
          status: "Converted to Sampling",
        });
        window.dispatchEvent(new CustomEvent("samp:requests-changed"));
      }
    } catch (err) {
      console.error("Failed to convert feasibility to sampling request:", err);
    } finally {
      setIsConverting(false);
    }
  };

  // Chatter Note Creation
  const handleAddNote = async (note: string) => {
    if (!activeRequest?.id) return;
    try {
      const updated = await addFeasibilityNoteApi(activeRequest.id, note);
      setLocalOverride(updated);
      window.dispatchEvent(new CustomEvent("samp:requests-changed"));
    } catch (err) {
      console.error("Failed to post chatter note:", err);
    }
  };

  const imageSourceFor = (url?: string) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) {
      return url;
    }
    const cleanPath = url.replace(/^\/+/, "");
    return `http://127.0.0.1:8001/${cleanPath}`;
  };

  const movePreview = (direction: -1 | 1) => {
    const currentIndex = previewableImages.findIndex((image) => image.url === selectedPreviewImage);
    if (previewableImages.length < 2 || currentIndex < 0) return;
    const nextIndex = (currentIndex + direction + previewableImages.length) % previewableImages.length;
    setSelectedPreviewImage(previewableImages[nextIndex].url || null);
  };

  if (!isOpen || !activeRequest) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-[96vw] xl:max-w-7xl h-[92vh] max-h-[92vh] flex flex-col bg-[#f8f9ff] dark:bg-[#0f121d] border border-slate-200/80 dark:border-white/10 rounded-2xl shadow-[0_24px_70px_-12px_rgba(11,28,48,0.25)] overflow-hidden select-text text-xs"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. TOP CONTROL PANEL */}
        <FeasibilityControlPanel
          activeRequest={activeRequest}
          copiedCode={copiedCode}
          onClose={onClose}
          onCopyCode={handleCopyCode}
          onDeleteRequest={onDeleteRequest}
        />

        {/* 2. MAIN WORKSPACE VIEWPORT (SPLIT: FORM SHEET + TIME LOG) */}
        <div className="flex-1 flex overflow-hidden">
          {/* LEFT: FORM SHEET (DOCUMENT BODY) */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-[#f8f9ff] dark:bg-[#0f121d]">
            <div className="max-w-4xl mx-auto rounded-2xl bg-white dark:bg-[#161928] border border-slate-100 dark:border-white/5 shadow-[0_8px_30px_rgba(11,28,48,0.04)] overflow-hidden">
              <FeasibilitySheetHeader
                activeRequest={activeRequest}
                classificationLabel={classificationLabel}
                previewableImagesCount={previewableImages.length}
                referenceLinks={feasibilityDetails.referenceLinks}
                canEvaluateTechnical={canEvaluateTechnical}
                canMakeCommercialDecision={canMakeCommercialDecision}
                isClaiming={isClaiming}
                isSubmittingDecision={isSubmittingDecision}
                isConverting={isConverting}
                onClaimTask={handleClaimTask}
                onOpenReviewTab={() => setActiveTab("review")}
                onMarketingFinalApprove={handleMarketingFinalApprove}
                onConvertToSampling={handleConvertToSampling}
              />

              {/* Notebook Tab Strip */}
              <div className="px-8 pb-6 pt-3">
                <div className="border-b border-slate-100 dark:border-white/10 flex items-center space-x-6 text-xs font-semibold overflow-x-auto">
                  <button
                    type="button"
                    onClick={() => setActiveTab("specs")}
                    className={`pb-3 border-b-2 font-display transition cursor-pointer select-none flex items-center gap-2 whitespace-nowrap ${
                      activeTab === "specs"
                        ? "border-[#006d32] text-[#006d32] dark:text-[#00d166] font-bold"
                        : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200"
                    }`}
                  >
                    <span>1. Scope &amp; Specifications</span>
                    {(previewableImages.length > 0 || feasibilityDetails.referenceLinks.length > 0) && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-[#eff4ff] dark:bg-[#006d32]/25 text-[#006d32] dark:text-[#00d166] font-bold border border-[#006d32]/20">
                        {previewableImages.length + feasibilityDetails.referenceLinks.length}
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("review")}
                    className={`pb-3 border-b-2 font-display transition cursor-pointer select-none flex items-center gap-2 whitespace-nowrap ${
                      activeTab === "review"
                        ? "border-[#006d32] text-[#006d32] dark:text-[#00d166] font-bold"
                        : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200"
                    }`}
                  >
                    <span>2. SAMP Technical Review</span>
                    {activeRequest.samplingFeasibilityResponse ? (
                      <span
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-display font-bold ${
                          activeRequest.samplingFeasibilityResponse === "Yes"
                            ? "bg-emerald-50 text-[#006d32] dark:bg-emerald-950/60 dark:text-[#00d166]"
                            : activeRequest.samplingFeasibilityResponse === "No"
                            ? "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300"
                            : "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                        }`}
                      >
                        {activeRequest.samplingFeasibilityResponse}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-display font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
                        {activeRequest.takenBySamp ? "In Review" : "Pending Claim"}
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("decision")}
                    className={`pb-3 border-b-2 font-display transition cursor-pointer select-none flex items-center gap-2 whitespace-nowrap ${
                      activeTab === "decision"
                        ? "border-[#006d32] text-[#006d32] dark:text-[#00d166] font-bold"
                        : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200"
                    }`}
                  >
                    <span>3. Commercial Decision &amp; Sampling</span>
                    {activeRequest.convertedSrNumber ? (
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-display font-bold bg-[#eff4ff] dark:bg-[#006d32]/25 text-[#006d32] dark:text-[#00d166] border border-[#006d32]/20">
                        ✓ {activeRequest.convertedSrNumber}
                      </span>
                    ) : activeRequest.marketingDecision ? (
                      <span
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-display font-bold ${
                          activeRequest.marketingDecision === "Accepted"
                            ? "bg-emerald-50 text-[#006d32]"
                            : "bg-rose-50 text-rose-700"
                        }`}
                      >
                        {activeRequest.marketingDecision}
                      </span>
                    ) : activeRequest.samplingFeasibilityResponse ? (
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-display font-bold bg-[#eff4ff] text-[#006d32] dark:bg-[#006d32]/20 dark:text-[#00d166] animate-pulse">
                        Ready
                      </span>
                    ) : null}
                  </button>
                </div>

                {/* Tab 1: Scope & Specifications */}
                {activeTab === "specs" && (
                  <div className="py-5 space-y-5">
                    {/* Primary Technical Description */}
                    <div>
                      <div className="text-[11px] font-display font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-400 mb-2">
                        Technical Description &amp; Product Scope
                      </div>
                      <div className="p-4 rounded-2xl border border-slate-100 dark:border-white/5 bg-[#eff4ff]/35 dark:bg-zinc-900/40 text-xs text-slate-800 dark:text-zinc-100 leading-relaxed font-sans whitespace-pre-wrap">
                        {displayDescription || "No technical description specified."}
                      </div>
                    </div>

                    {/* Marketing Directives & Commercial Notes (Render ONLY if filled!) */}
                    {displayRemark && (
                      <div>
                        <div className="text-[11px] font-display font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-400 mb-2">
                          Marketing Directives &amp; Commercial Notes
                        </div>
                        <div className="p-4 rounded-2xl border border-amber-200/60 dark:border-amber-900/40 bg-amber-50/40 dark:bg-amber-950/15 text-xs text-amber-950 dark:text-amber-200 italic font-sans leading-relaxed">
                          "{displayRemark}"
                        </div>
                      </div>
                    )}

                    {/* Benchmark URLs & Links (Render ONLY if filled!) */}
                    {feasibilityDetails.referenceLinks.length > 0 && (
                      <div>
                        <div className="text-[11px] font-display font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-400 mb-2">
                          Client Reference URLs &amp; Benchmark Links ({feasibilityDetails.referenceLinks.length})
                        </div>
                        <div className="flex flex-wrap gap-2.5">
                          {feasibilityDetails.referenceLinks.map((url, i) => (
                            <a
                              key={i}
                              href={url.startsWith("http") ? url : `https://${url}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:border-[#006d32] hover:text-[#006d32] dark:hover:text-[#00d166] text-xs font-mono text-slate-700 dark:text-zinc-300 transition shadow-2xs group"
                            >
                              <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#006d32] dark:group-hover:text-[#00d166]" />
                              <span className="truncate max-w-xs">{url.replace(/^https?:\/\//, "")}</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Attached Reference Images (Render ONLY if filled!) */}
                    {previewableImages.length > 0 && (
                      <div>
                        <div className="text-[11px] font-display font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-400 mb-2.5">
                          Attached Reference Images ({previewableImages.length})
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                          {previewableImages.map((img, idx) => (
                            <div
                              key={img.id}
                              onClick={() => img.url && setSelectedPreviewImage(img.url)}
                              className="group relative rounded-2xl border border-slate-200/80 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 overflow-hidden cursor-pointer hover:border-[#006d32] dark:hover:border-[#00d166] transition shadow-xs"
                            >
                              <div className="aspect-[4/3] w-full bg-slate-100 dark:bg-zinc-800 overflow-hidden relative">
                                <img
                                  src={imageSourceFor(img.url)}
                                  alt={img.name}
                                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                />
                                <div className="absolute inset-0 bg-slate-950/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                  <span className="text-[11px] font-display font-semibold text-white bg-black/60 px-2.5 py-1 rounded-lg backdrop-blur-xs">
                                    View Full Image
                                  </span>
                                </div>
                              </div>
                              <div className="p-2 flex items-center justify-between text-[10.5px] text-slate-600 dark:text-zinc-400 font-display">
                                <span className="truncate">{img.name}</span>
                                <span className="font-mono text-slate-400">#{idx + 1}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* ── In-Context SAMP Team Technical Verdict Spotlight (Immediately visible to Marketing) ── */}
                    {activeRequest.samplingFeasibilityResponse && (
                      <div className="p-5 rounded-2xl border border-emerald-200/70 dark:border-emerald-900/60 bg-[#eff4ff]/60 dark:bg-[#006d32]/10 space-y-3 mt-3">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-display font-bold text-slate-800 dark:text-zinc-200">
                              SAMP Team Response:
                            </span>
                            <span
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-display font-bold border ${
                                activeRequest.samplingFeasibilityResponse === "Yes"
                                  ? "bg-emerald-50 text-[#006d32] border-emerald-200/70 dark:bg-emerald-950/50 dark:text-[#00d166]"
                                  : activeRequest.samplingFeasibilityResponse === "No"
                                  ? "bg-rose-50 text-rose-700 border-rose-200/70 dark:bg-rose-950/50 dark:text-rose-300"
                                  : "bg-amber-50 text-amber-700 border-amber-200/70 dark:bg-amber-950/50 dark:text-amber-300"
                              }`}
                            >
                              {activeRequest.samplingFeasibilityResponse === "Yes" && <CheckCircle2 className="w-3.5 h-3.5 text-[#006d32] dark:text-[#00d166]" />}
                              {activeRequest.samplingFeasibilityResponse === "No" && <XCircle className="w-3.5 h-3.5 text-rose-600" />}
                              {activeRequest.samplingFeasibilityResponse === "Maybe" && <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />}
                              <span>
                                {activeRequest.samplingFeasibilityResponse === "Yes" && "Feasible (Full Scope)"}
                                {activeRequest.samplingFeasibilityResponse === "No" && "Not Feasible"}
                                {activeRequest.samplingFeasibilityResponse === "Maybe" && "Conditional"}
                              </span>
                            </span>
                          </div>
                          <span className="text-[11px] font-display text-slate-500">
                            Evaluated by: <span className="font-bold text-slate-800 dark:text-zinc-200">{activeRequest.samplingFeasibilityApprovedBy || "SAMP Team"}</span>
                          </span>
                        </div>

                        {activeRequest.samplingFeasibilityRemark && (
                          <p className="text-xs text-slate-800 dark:text-zinc-200 bg-white dark:bg-zinc-900 p-3 rounded-xl border border-slate-100 dark:border-zinc-800 leading-relaxed font-sans shadow-2xs">
                            {activeRequest.samplingFeasibilityRemark}
                          </p>
                        )}

                        <div className="flex items-center justify-between pt-1 text-xs">
                          <button
                            type="button"
                            onClick={() => setActiveTab("review")}
                            className="text-[#006d32] dark:text-[#00d166] hover:underline font-display font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                          >
                            <span>View Full Technical Sign-Off</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>

                          {canMakeCommercialDecision && !activeRequest.marketingDecision && (
                            <button
                              type="button"
                              onClick={() => setActiveTab("decision")}
                              className="px-4 py-2 rounded-xl bg-[#006d32] hover:bg-[#00883e] text-white text-xs font-display font-bold flex items-center gap-1.5 cursor-pointer transition shadow-[0_4px_14px_rgba(0,109,50,0.25)] active:scale-95"
                            >
                              <span>Take Commercial Decision</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Tab 2: SAMP Technical Review */}
                {activeTab === "review" && (
                  <FeasibilityTechnicalReviewTab
                    activeRequest={activeRequest}
                    canEvaluateTechnical={canEvaluateTechnical}
                    isClaiming={isClaiming}
                    sampVerdictChoice={sampVerdictChoice}
                    sampVerdictRemark={sampVerdictRemark}
                    sampVerdictError={sampVerdictError}
                    isSubmittingSampVerdict={isSubmittingSampVerdict}
                    onClaimTask={handleClaimTask}
                    onSampVerdictChoiceChange={(choice) => {
                      setSampVerdictChoice(choice);
                      setSampVerdictError(null);
                    }}
                    onSampVerdictRemarkChange={(remark) => {
                      setSampVerdictRemark(remark);
                      if (sampVerdictError) setSampVerdictError(null);
                    }}
                    onSubmitSampVerdict={handleSubmitSampVerdict}
                  />
                )}

                {/* Tab 3: Commercial Decision & Sampling */}
                {activeTab === "decision" && (
                  <FeasibilityCommercialDecisionTab
                    activeRequest={activeRequest}
                    canMakeCommercialDecision={canMakeCommercialDecision}
                    decisionRemark={decisionRemark}
                    isSubmittingDecision={isSubmittingDecision}
                    isConverting={isConverting}
                    onDecisionRemarkChange={setDecisionRemark}
                    onMarketingFinalApprove={handleMarketingFinalApprove}
                    onConvertToSampling={handleConvertToSampling}
                  />
                )}
              </div>
            </div>
          </div>

          {/* RIGHT: TIME LOG AUDIT TRAIL PANEL */}
          <FeasibilityChatterFeed
            activeRequest={activeRequest}
            classificationLabel={classificationLabel}
            onAddNote={handleAddNote}
            currentUser={user}
          />
        </div>
      </div>

      {/* Full Resolution Image Lightbox Modal */}
      <ImageLightboxModal
        selectedImage={selectedPreviewImage}
        images={previewableImages}
        onClose={() => setSelectedPreviewImage(null)}
        onNavigate={movePreview}
      />
    </div>
  );
};

export default FeasibilityInspectorModal;
