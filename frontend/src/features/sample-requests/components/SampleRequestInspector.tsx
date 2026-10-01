import React, { useState, useEffect, useMemo } from "react";
import { StatusPill } from "@/components/ui/StatusPill";
import {
  SampleRequestItem,
  ProgramMaterialItem,
  AddProgramMaterialPayload,
} from "../types";
import { getRequestTrackType } from "../SampleRequestsDesk";
import {
  updateSingleMaterialSampRemarkApi,
  addProgramMaterialApi,
  recordFeasibilityMarketingDecisionApi,
  recordFeasibilityViewedApi,
} from "../api";
import { FeasibilityActivityTimeline } from "./FeasibilityActivityTimeline";
import {
  Copy,
  Check,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ExternalLink,
  Layers,
  Calendar,
  FileSpreadsheet,
  Clock,
  X,
  CheckCircle,
  Package,
  Sparkles,
  ShieldCheck,
  Palette,
  Box,
  Calculator,
  Sliders,
  FlaskConical,
  Plus,
  Trash2,
  Send,
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
    approved: boolean,
    remark?: string
  ) => Promise<void> | void;
  onMaterialsUpdated?: (
    requestId: string | number,
    updatedMaterials: ProgramMaterialItem[]
  ) => void;
  onDeleteRequest?: (request: SampleRequestItem) => void;
  onReleaseDraft?: (request: SampleRequestItem) => Promise<void> | void;
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
  unit: string;
  remark: string;
  createdAt?: string;
}

export interface ParsedImageRef {
  id: string;
  name: string;
  url?: string;
}

export interface ParsedFeasibilityDetails {
  category: string;
  requirements: string;
  marketingRemarks: string | null;
  referenceLinks: string[];
  referenceImages: ParsedImageRef[];
}

export function parseFeasibilityDetails(
  description?: string,
  existingImages?: string[],
  existingLinks?: string[],
  productImagePath?: string
): ParsedFeasibilityDetails {
  let category = "Custom Specification";
  let text = (description || "").trim();
  let marketingRemarks: string | null = null;
  const links: string[] = existingLinks ? [...existingLinks] : [];
  const parsedImageNames: string[] = [];

  // 1. Extract category [Category Name]
  const categoryMatch = text.match(/^\[(.*?)\]/);
  if (categoryMatch) {
    category = categoryMatch[1].trim();
    text = text.slice(categoryMatch[0].length).trim();
  }

  // 2. Extract Attached Images block if present in text
  const imagesMatch = text.match(/Attached Images(?:\s*\(\d+\))?:\s*([\s\S]*?)(?=(?:Marketing Remarks:|Reference Web Links:|Reference Link:|Release \/ Dispatch Remarks:|$))/i);
  if (imagesMatch) {
    const rawImageLines = imagesMatch[1].trim().split("\n");
    rawImageLines.forEach((l) => {
      const cleanName = l.replace(/^\d+[\.\)]\s*/, "").trim();
      if (cleanName) {
        parsedImageNames.push(cleanName);
      }
    });
    text = text.replace(imagesMatch[0], "").trim();
  }

  // 3. Extract Reference Web Links block if present in text
  const linksMatch = text.match(/(?:Reference Web Links|Reference Link:?)(?:\s*\(\d+\))?:\s*([\s\S]*?)(?=(?:Marketing Remarks:|Attached Images:|Release \/ Dispatch Remarks:|$))/i);
  if (linksMatch) {
    const rawLinkLines = linksMatch[1].trim().split("\n");
    rawLinkLines.forEach((l) => {
      const cleanUrl = l.replace(/^\d+[\.\)]\s*/, "").trim();
      if (cleanUrl && !links.includes(cleanUrl)) {
        links.push(cleanUrl);
      }
    });
    text = text.replace(linksMatch[0], "").trim();
  }

  // 4. Extract Marketing Remarks block
  const remarksMatch = text.match(/(?:Marketing Remarks|Release \/ Dispatch Remarks):\s*([\s\S]*?)(?=(?:Attached Images:|Reference Web Links:|Reference Link:|$))/i);
  if (remarksMatch) {
    marketingRemarks = remarksMatch[1].trim();
    text = text.replace(remarksMatch[0], "").trim();
  }

  // Build combined images list
  const combinedImages: ParsedImageRef[] = [];
  const rawImageUrls: string[] = existingImages ? [...existingImages] : [];
  if (productImagePath && (productImagePath.startsWith("data:image") || /\.(png|jpe?g|webp|gif|svg)$/i.test(productImagePath))) {
    if (!rawImageUrls.includes(productImagePath)) {
      rawImageUrls.unshift(productImagePath);
    }
  }

  const maxLen = Math.max(parsedImageNames.length, rawImageUrls.length);
  for (let i = 0; i < maxLen; i++) {
    const url = rawImageUrls[i];
    const name = parsedImageNames[i] || (url ? (url.startsWith("data:") ? `Photo #${i + 1}` : url.split("/").pop() || `Photo #${i + 1}`) : `Photo #${i + 1}`);
    combinedImages.push({
      id: `img-${i}`,
      name,
      url,
    });
  }

  return {
    category: category || "Custom Specification",
    requirements: text || "Custom feasibility evaluation requested by client.",
    marketingRemarks,
    referenceLinks: Array.from(new Set(links.filter(Boolean))),
    referenceImages: combinedImages,
  };
}

const emptyNewRow: AddProgramMaterialPayload = {
  material_type: "",
  supplier_name: "",
  grade: "",
  color_variant: "",
  caliper_wt: "",
  quantity: "",
  unit: "sheets",
  remark: "",
  samp_remark: "",
};

export function formatAddedDate(dateStr?: string): string {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) {
      return dateStr.split("T")[0] || dateStr;
    }
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  } catch {
    return dateStr.split("T")[0] || dateStr;
  }
}

export function parseProgramMatrix(description?: string): ParsedMatrixRow[] {
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
      unit: getVal("Unit"),
      remark: getVal("Remark"),
    };
  });
}

export const SampleRequestInspector: React.FC<SampleRequestInspectorProps> = ({
  request,
  isOpen,
  onClose,
  onUpdateFeasibility,
  onMarketingApprove,
  onMaterialsUpdated,
  onDeleteRequest,
  onReleaseDraft,
}) => {
  const trackType = request ? getRequestTrackType(request) : null;
  const [copiedCode, setCopiedCode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReleasing, setIsReleasing] = useState(false);
  const [submitFeedback, setSubmitFeedback] = useState<string | null>(null);
  const [selectedPreviewImage, setSelectedPreviewImage] = useState<string | null>(null);
  const [activeFeasibilityTab, setActiveFeasibilityTab] = useState<"specs" | "sampling_work">("specs");
  const [decisionPromptAction, setDecisionPromptAction] = useState<"accept" | "reject" | null>(null);
  const [decisionRemark, setDecisionRemark] = useState("");

  // Local state for material specification rows and SAMP remarks
  const [localMaterials, setLocalMaterials] = useState<ProgramMaterialItem[]>(request?.programMaterials || []);
  const [matrixRemarks, setMatrixRemarks] = useState<Record<string | number, string>>({});
  const [savingRemarkId, setSavingRemarkId] = useState<string | number | null>(null);
  const [savedRemarkId, setSavedRemarkId] = useState<string | number | null>(null);

  // State for adding a new material row directly from the Inspector
  const [isAddingRow, setIsAddingRow] = useState(false);
  const [isSavingNewRow, setIsSavingNewRow] = useState(false);
  const [newRowData, setNewRowData] = useState<AddProgramMaterialPayload>(emptyNewRow);
  const [addRowFeedback, setAddRowFeedback] = useState<string | null>(null);

  // Synchronize localMaterials and reset adding row whenever request changes
  useEffect(() => {
    setLocalMaterials(request?.programMaterials || []);
    setIsAddingRow(false);
    setNewRowData(emptyNewRow);
    setAddRowFeedback(null);
  }, [request?.id, request?.programMaterials]);

  // Unified matrix items (from localMaterials or request?.programMaterials or parsedMatrix)
  const unifiedMatrixRows = useMemo(() => {
    if (!request) return [];
    const sourceMaterials =
      localMaterials && localMaterials.length > 0
        ? localMaterials
        : request.programMaterials && request.programMaterials.length > 0
        ? request.programMaterials
        : null;

    if (sourceMaterials && sourceMaterials.length > 0) {
      return sourceMaterials.map((m, idx) => ({
        id: m.id ?? idx + 1,
        index: idx + 1,
        type: m.materialType || "—",
        supplier: m.supplierName || "—",
        grade: m.grade || "—",
        color: m.colorVariant || "—",
        caliper: m.caliperWt || "—",
        qty: m.quantity || "—",
        unit: m.unit || "—",
        remark: m.remark || "—",
        sampRemark: m.sampRemark || "",
        createdAt: m.createdAt,
      }));
    }
    const fallbackParsed = request.productDescription ? parseProgramMatrix(request.productDescription) : [];
    return fallbackParsed.map((p) => ({
      id: p.index,
      index: p.index,
      type: p.type,
      supplier: p.supplier,
      grade: p.grade,
      color: p.color,
      caliper: p.caliper,
      qty: p.qty,
      unit: p.unit || "—",
      remark: p.remark,
      sampRemark: "",
      createdAt: p.createdAt,
    }));
  }, [localMaterials, request?.programMaterials, request?.productDescription]);

  useEffect(() => {
    if (isOpen) {
      setActiveFeasibilityTab("specs");
    }
  }, [isOpen, request?.id]);

  useEffect(() => {
    if (unifiedMatrixRows.length > 0) {
      const initial: Record<string | number, string> = {};
      unifiedMatrixRows.forEach((r) => {
        initial[r.id] = r.sampRemark || "";
      });
      setMatrixRemarks(initial);
    } else {
      setMatrixRemarks({});
    }
  }, [request?.id, unifiedMatrixRows]);

  const handleMarketingFinalApprove = async (approved: boolean, remark?: string) => {
    if (!request) return;
    setIsSubmitting(true);
    try {
      if (trackType === "feasibility_check") {
        await recordFeasibilityMarketingDecisionApi(request.id, {
          decision: approved ? "Accepted" : "Rejected",
          decision_remark: remark || null,
          decision_by: "Marketing Specialist",
        });
      }
      if (onMarketingApprove) {
        await onMarketingApprove(request.id, approved, remark);
      }
      setDecisionPromptAction(null);
      setDecisionRemark("");
      setSubmitFeedback(
        approved
          ? "✓ Feasibility approved and finalized by Marketing."
          : "Feasibility request dropped / rejected."
      );
      setTimeout(() => setSubmitFeedback(null), 3000);
    } catch (err: any) {
      console.error("Failed to record marketing decision:", err);
      setSubmitFeedback(err?.message || "Failed to record marketing decision.");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (isOpen && request?.id && trackType === "feasibility_check") {
      recordFeasibilityViewedApi(request.id, "Marketing Specialist", "Marketing");
    }
  }, [isOpen, request?.id, trackType]);

  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (selectedPreviewImage) {
          setSelectedPreviewImage(null);
        } else if (isOpen) {
          onClose();
        }
      }

      if (selectedPreviewImage && (e.key === "ArrowLeft" || e.key === "ArrowRight") && request) {
        const details = parseFeasibilityDetails(
          request.productDescription,
          request.referenceImages,
          request.referenceLinks,
          request.productImagePath
        );
        const images = details.referenceImages.filter((image) => Boolean(image.url));
        const currentIndex = images.findIndex((image) => image.url === selectedPreviewImage);
        if (images.length > 1 && currentIndex >= 0) {
          const nextIndex = e.key === "ArrowRight"
            ? (currentIndex + 1) % images.length
            : (currentIndex - 1 + images.length) % images.length;
          setSelectedPreviewImage(images[nextIndex].url || null);
        }
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
  }, [isOpen, onClose, request, selectedPreviewImage]);

  if (!isOpen || !request) return null;

  const feasibilityDetails = parseFeasibilityDetails(
    request.productDescription,
    request.referenceImages,
    request.referenceLinks,
    request.productImagePath
  );
  const parsedMatrix = parseProgramMatrix(request.productDescription);
  const previewableImages = feasibilityDetails.referenceImages.filter((image) => Boolean(image.url));
  const selectedPreviewIndex = previewableImages.findIndex((image) => image.url === selectedPreviewImage);
  const isFeasibilityFinalized = ["completed", "closed", "approved", "rejected"].some((term) =>
    String(request.status || "").toLowerCase().includes(term)
  );

  const handleSaveMaterialSampRemark = async (materialId: number | string, index: number) => {
    const remarkValue = matrixRemarks[materialId] ?? "";
    setSavingRemarkId(materialId);
    try {
      const rawReqId = String(request?.id || "").replace(/^program-/, "");
      if (typeof materialId === "number" || (!isNaN(Number(materialId)) && Number(materialId) > 0)) {
        await updateSingleMaterialSampRemarkApi(rawReqId, materialId, remarkValue);
      }
      setSavedRemarkId(materialId);
      setTimeout(() => setSavedRemarkId(null), 2500);
    } catch (err) {
      console.error("Failed to save SAMP remark:", err);
      setSavedRemarkId(materialId);
      setTimeout(() => setSavedRemarkId(null), 2500);
    } finally {
      setSavingRemarkId(null);
    }
  };

  const handleSaveNewMaterialRow = async () => {
    if (!request) return;
    setIsSavingNewRow(true);
    setAddRowFeedback(null);
    try {
      const rawReqId = String(request.id).replace(/^program-/, "");
      const res = await addProgramMaterialApi(rawReqId, {
        material_type: newRowData.material_type?.trim() || null,
        supplier_name: newRowData.supplier_name?.trim() || null,
        grade: newRowData.grade?.trim() || null,
        color_variant: newRowData.color_variant?.trim() || null,
        caliper_wt: newRowData.caliper_wt?.trim() || null,
        quantity: newRowData.quantity?.trim() || null,
        unit: newRowData.unit?.trim() || null,
        remark: newRowData.remark?.trim() || null,
        samp_remark: newRowData.samp_remark?.trim() || null,
      });

      setLocalMaterials(res.materials);
      if (onMaterialsUpdated) {
        onMaterialsUpdated(request.id, res.materials);
      }
      setIsAddingRow(false);
      setNewRowData(emptyNewRow);
      setAddRowFeedback("Material row successfully recorded and saved to database.");
      setTimeout(() => setAddRowFeedback(null), 3500);
    } catch (err: any) {
      console.error("Failed to add material row:", err);
      setAddRowFeedback(err?.message || "Failed to save material row to database.");
    } finally {
      setIsSavingNewRow(false);
    }
  };

  const movePreview = (direction: -1 | 1) => {
    if (previewableImages.length < 2 || selectedPreviewIndex < 0) return;
    const nextIndex = (selectedPreviewIndex + direction + previewableImages.length) % previewableImages.length;
    setSelectedPreviewImage(previewableImages[nextIndex].url || null);
  };

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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        className={`relative w-full ${
          trackType === "feasibility_check" || trackType === "program_planning" ? "max-w-5xl" : "max-w-3xl"
        } max-h-[94vh] flex flex-col bg-white dark:bg-[#0f1118] border border-zinc-200 dark:border-white/10 rounded-xl shadow-2xl overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ────────────────────────────────────────────────────────────────── */}
        {/* Header Bar (Clean, High-Contrast ERP Header)                       */}
        {/* ────────────────────────────────────────────────────────────────── */}
        <div className="px-5 py-3.5 border-b border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-[#0f1118] flex items-center justify-between gap-3 shrink-0">
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
            <StatusPill
              status={request.status}
              size="xs"
              tone={trackType === "feasibility_check" ? "info" : undefined}
            />

            {/* Track Tag */}
            {trackType === "feasibility_check" && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
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
        {/* Contiguous Operational Context Strip (4 Distinct Parameters)       */}
        {/* ────────────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 border-b border-zinc-200 dark:border-white/[0.08] bg-zinc-50/60 dark:bg-[#161822] divide-x divide-zinc-200 dark:divide-white/[0.08] shrink-0">
          {/* Parameter 1: Customer */}
          <div className="p-3">
            <div className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 dark:text-zinc-500 mb-0.5">Customer</div>
            <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate" title={request.customer}>
              {request.customer || "Unassigned"}
            </div>
          </div>

          {/* Parameter 2: Production Plant or Requester */}
          <div className="p-3">
            <div className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 dark:text-zinc-500 mb-0.5">
              {trackType === "feasibility_check" ? "Requested By" : "Production Plant"}
            </div>
            <div
              className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate"
              title={trackType === "feasibility_check" ? (request.createdBy || "Marketing Team") : (request.targetPlant || "Khaniwade")}
            >
              {trackType === "feasibility_check"
                ? (request.createdBy || "Marketing Team")
                : (request.targetPlant?.replace(/^\d{4}-?\s*/, "").trim() || "Khaniwade")}
            </div>
          </div>

          {/* Parameter 3: Feasibility Type or Program Campaign or Material Code */}
          <div className="p-3">
            <div className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 dark:text-zinc-500 mb-0.5">
              {trackType === "feasibility_check"
                ? "Feasibility Type"
                : trackType === "program_planning"
                ? "Program Campaign"
                : "Material Code"}
            </div>
            <div
              className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate"
              title={trackType === "program_planning" ? (request.programCampaignTitle || request.programName || "—") : undefined}
            >
              {trackType === "feasibility_check"
                ? feasibilityDetails.category
                : trackType === "program_planning"
                ? (request.programCampaignTitle || request.programName || "—")
                : (request.materialCode || "NB-CUSTOM-01")}
            </div>
          </div>

          {/* Parameter 4: Target Due Date, Date Created or Program Year */}
          <div className="p-3">
            <div className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 dark:text-zinc-500 mb-0.5">
              {trackType === "program_planning"
                ? "Program Year"
                : request.sampleRequiredDate
                ? "Required Target Date"
                : "Request Date"}
            </div>
            <div className="text-xs font-semibold font-mono text-zinc-900 dark:text-zinc-100 tnum">
              {trackType === "program_planning"
                ? (request.programYear || "—")
                : (request.sampleRequiredDate || request.dateRequestCreated || "—")}
            </div>
          </div>
        </div>

        {/* Draft Stage Release Banner (Only for Marketing Requests in Draft) */}
        {trackType === "marketing_request" &&
          (String(request.status || "").toLowerCase().includes("draft") ||
           String(request.status || "").toLowerCase().includes("smt") ||
           String(request.status || "").toLowerCase().includes("pending allocation")) && (
          <div className="px-5 py-3 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-b border-amber-500/25 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <span>Staged in Draft Pipeline</span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300/60 dark:border-amber-700/60">
                    Draft (Pre-SMT)
                  </span>
                </div>
                <div className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-0.5">
                  Marketing setup complete. Release this request to transfer it into the active operational workflow.
                </div>
              </div>
            </div>
            {onReleaseDraft && (
              <button
                type="button"
                onClick={async () => {
                  setIsReleasing(true);
                  try {
                    await onReleaseDraft(request);
                  } finally {
                    setIsReleasing(false);
                  }
                }}
                disabled={isReleasing}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white text-xs font-semibold shadow-xs cursor-pointer transition-all disabled:opacity-50 shrink-0"
              >
                <Send className={`w-3.5 h-3.5 ${isReleasing ? "animate-pulse" : ""}`} />
                <span>{isReleasing ? "Releasing to Workflow..." : "Release to Workflow"}</span>
              </button>
            )}
          </div>
        )}

        {/* ────────────────────────────────────────────────────────────────── */}
        {/* Scrollable Content Body                                            */}
        {/* ────────────────────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto bg-zinc-50/40 dark:bg-[#11131b] p-5 space-y-5">
          {/* ════════════════════════════════════════════════════════════════ */}
          {/* TRACK 1: FEASIBILITY CHECK VIEW                                  */}
          {/* ════════════════════════════════════════════════════════════════ */}
          {trackType === "feasibility_check" && (
            <div className="space-y-4">
              {/* Segmented Tab Navigation: Switch between Specs & Sampling Team Work */}
              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-white/[0.08] pb-3">
                <div className="inline-flex rounded-lg bg-zinc-100/80 dark:bg-zinc-900 p-1 text-xs border border-zinc-200/70 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setActiveFeasibilityTab("specs")}
                    className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer flex items-center gap-2 ${
                      activeFeasibilityTab === "specs"
                        ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-2xs font-semibold"
                        : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 font-medium"
                    }`}
                  >
                    <span>1. Request Specs &amp; Scope</span>
                    {(feasibilityDetails.referenceImages.length > 0 || feasibilityDetails.referenceLinks.length > 0) && (
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-200/80 dark:bg-zinc-600 text-zinc-700 dark:text-zinc-300 font-semibold">
                        {feasibilityDetails.referenceImages.length + feasibilityDetails.referenceLinks.length}
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveFeasibilityTab("sampling_work")}
                    className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer flex items-center gap-2 ${
                      activeFeasibilityTab === "sampling_work"
                        ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-2xs font-semibold"
                        : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 font-medium"
                    }`}
                  >
                    <span>2. Sampling Lab Work</span>
                    {request.samplingFeasibilityResponse ? (
                      <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300/60">
                        ✓ {request.samplingFeasibilityResponse}
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300/60">
                        Pending
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* ──────────────────────────────────────────────────────────── */}
              {/* TAB 1: MARKETING INPUT SPECS & SCOPE                         */}
              {/* ──────────────────────────────────────────────────────────── */}
              {activeFeasibilityTab === "specs" && (
                <div className="space-y-4">
                  {/* 1. Client Technical Scope & Requirement */}
                  <div className="rounded-xl border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-[#0f1118] p-5 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between pb-2.5 border-b border-zinc-100 dark:border-white/[0.06]">
                      <div>
                        <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                          Technical Requirement &amp; Scope
                        </h3>
                        <p className="text-[10.5px] text-zinc-400 mt-1">Client evaluation parameters &amp; specifications</p>
                      </div>
                    </div>

                    <div className="p-3 rounded-md bg-zinc-50/80 dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-zinc-800 text-[13px] text-zinc-800 dark:text-zinc-200 leading-relaxed font-normal whitespace-pre-wrap">
                      {feasibilityDetails.requirements}
                    </div>
                  </div>

                  {/* 2. Marketing Remarks / Internal Notes (if provided) */}
                  {feasibilityDetails.marketingRemarks && (
                    <div className="rounded-xl border border-blue-200/70 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-950/20 p-4 space-y-2">
                      <div className="text-[10px] uppercase tracking-wider font-bold text-blue-900 dark:text-blue-200">
                        Marketing Remarks &amp; Client Context
                      </div>
                      <div className="p-3 rounded-lg bg-white/80 dark:bg-zinc-900/80 border border-blue-200/50 dark:border-blue-800/40 text-[12px] text-zinc-800 dark:text-zinc-200 leading-relaxed font-normal whitespace-pre-wrap">
                        {feasibilityDetails.marketingRemarks}
                      </div>
                    </div>
                  )}

                  {/* 3. Attached Reference Photos Gallery */}
                  {feasibilityDetails.referenceImages.length > 0 && (
                    <div className="rounded-xl border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-[#0f1118] p-5 shadow-2xs space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                            Attached Reference Photos ({feasibilityDetails.referenceImages.length})
                          </h4>
                          <p className="text-[10.5px] text-zinc-400 mt-1">Select a photo to view it at full resolution.</p>
                        </div>
                        <span className="text-[10px] font-mono text-zinc-400">{previewableImages.length} available</span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {feasibilityDetails.referenceImages.map((img, idx) => (
                          <div
                            key={img.id}
                            onClick={() => img.url && setSelectedPreviewImage(img.url)}
                            className={`group relative rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 overflow-hidden flex flex-col shadow-2xs transition-all ${
                              img.url ? "cursor-pointer hover:border-brand-300 dark:hover:border-brand-700 hover:shadow-md" : ""
                            }`}
                          >
                            {img.url ? (
                              <div className="aspect-[4/3] w-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden relative">
                                <img
                                  src={img.url}
                                  alt={img.name}
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-zinc-950/55 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <span className="rounded-md border border-white/30 bg-white/15 px-2.5 py-1.5 text-[10px] font-semibold text-white backdrop-blur-sm">View photo</span>
                                </div>
                              </div>
                            ) : (
                              <div className="aspect-4/3 w-full bg-zinc-100 dark:bg-zinc-800/60 flex flex-col items-center justify-center gap-1.5 p-2 text-zinc-400">
                                <span className="text-[10px] font-semibold uppercase tracking-wider">Unavailable</span>
                                <span className="text-[10px] font-mono text-center truncate w-full">Image File</span>
                              </div>
                            )}
                            <div className="p-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-1">
                              <span className="text-[11px] font-medium text-zinc-800 dark:text-zinc-200 truncate" title={img.name}>
                                {img.name}
                              </span>
                              <span className="text-[9px] font-mono font-bold px-1 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 shrink-0">
                                #{idx + 1}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 4. Reference Web Links */}
                  {feasibilityDetails.referenceLinks.length > 0 && (
                    <div className="rounded-xl border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-[#0f1118] p-5 shadow-2xs space-y-3">
                      <div>
                        <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                          Reference Web Links ({feasibilityDetails.referenceLinks.length})
                        </h4>
                        <p className="text-[10.5px] text-zinc-400 mt-1">External product or reference material supplied with the request.</p>
                      </div>

                      <div className="space-y-1.5">
                        {feasibilityDetails.referenceLinks.map((url, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between gap-2 px-3 py-2 rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/50 hover:bg-zinc-100/70 transition-colors"
                          >
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <span className="text-[10px] font-mono font-bold text-zinc-400 shrink-0">
                                #{idx + 1}
                              </span>
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 shrink-0">
                                URL
                              </span>
                              <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-brand-600 dark:text-brand-400 hover:underline truncate font-mono"
                                title={url}
                              >
                                {url}
                              </a>
                            </div>
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 hover:text-brand-600 transition-colors shrink-0 cursor-pointer"
                            >
                              <span>Open</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ──────────────────────────────────────────────────────────── */}
              {/* TAB 2: SAMPLING TEAM WORK & VERDICT (Dedicated Progress View)*/}
              {/* ──────────────────────────────────────────────────────────── */}
              {activeFeasibilityTab === "sampling_work" && (
                <div className="space-y-4">
                  {/* SLA Status Banner */}
                  {request.samplingFeasibilityResponse && (
                    <div className={`p-3 rounded-lg border flex items-center justify-between gap-3 ${
                      request.isRespondedOnTime !== false
                        ? "bg-emerald-50/80 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300"
                        : "bg-rose-50/80 border-rose-200 dark:bg-rose-950/30 dark:border-rose-800 text-rose-900 dark:text-rose-300"
                    }`}>
                      <div className="flex items-center gap-2">
                        {request.isRespondedOnTime !== false ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                        )}
                        <div>
                          <p className="text-xs font-bold font-mono">
                            {request.isRespondedOnTime !== false ? "SLA Status: Responded On-Time" : "SLA Status: Delayed Response"}
                          </p>
                          <p className="text-[11px] opacity-80 mt-0.5">
                            Target deadline: {request.sampleRequiredDate || "—"} · Evaluated on: {request.feasibilityClosedAt ? new Date(request.feasibilityClosedAt).toLocaleDateString("en-IN") : "—"}
                          </p>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                        request.isRespondedOnTime !== false
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 border border-emerald-300/60"
                          : "bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-300 border border-rose-300/60"
                      }`}>
                        {request.isRespondedOnTime !== false ? "On-Time" : "Late"}
                      </span>
                    </div>
                  )}

                  {/* Sampling Lab Technical Evaluation Card */}
                  <div className="rounded-lg border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-[#0f1118] p-4 space-y-4 shadow-2xs">
                    {/* Header */}
                    <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-white/[0.06] flex-wrap gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className={`p-1.5 rounded ${
                          request.samplingFeasibilityResponse
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                        }`}>
                          <FlaskConical className="w-4 h-4" />
                        </span>
                        <div>
                          <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                            Sampling Lab Technical Evaluation
                          </h4>
                          <p className="text-[10.5px] text-zinc-400">
                            Substrate, tooling &amp; manufacturing feasibility
                          </p>
                        </div>
                      </div>

                      {/* Verdict Pill */}
                      {renderFeasibilityBadge(request.samplingFeasibilityResponse, "Pending Lab Review")}
                    </div>

                    {/* Body */}
                    {request.samplingFeasibilityResponse ? (
                      <div className="space-y-3">
                        <div className="p-3.5 rounded-md bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/70 dark:border-zinc-800 space-y-1.5">
                          <p className="font-semibold text-zinc-500 dark:text-zinc-400 text-[10px] uppercase tracking-wider">
                            Sampling Engineer Technical Remarks:
                          </p>
                          <p className="text-xs font-normal text-zinc-800 dark:text-zinc-200 leading-relaxed whitespace-pre-wrap">
                            {request.samplingFeasibilityRemark || "No additional commentary provided."}
                          </p>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1 border-t border-zinc-100 dark:border-zinc-800 font-mono">
                          <span>Evaluator: Central Sampling Tech Lab</span>
                          {request.samplingFeasibilityApprovedBy && (
                            <span>Accepted by: {request.samplingFeasibilityApprovedBy}</span>
                          )}
                          {request.feasibilityClosedAt && (
                            <span>Completed: {request.feasibilityClosedAt}</span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="p-6 rounded-md border border-dashed border-zinc-200 dark:border-zinc-800 text-center space-y-2">
                        <div className="w-7 h-7 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto border border-amber-500/20">
                          <Clock className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                            Awaiting Evaluation from Sampling Team
                          </p>
                          <p className="text-[11px] text-zinc-400 max-w-md mx-auto mt-1 leading-relaxed">
                            Central Sampling Lab is assessing paper GSM, structural folds, and machine tolerances.
                            Their verdict and technical remarks will be logged here.
                          </p>
                        </div>
                        <div className="inline-flex items-center gap-1.5 text-[10px] font-mono text-amber-700 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/25 mt-1">
                          <Calendar className="w-3 h-3" />
                          <span>Target SLA: {request.sampleRequiredDate || "Pending"}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Marketing Review & Final Sign-Off Card */}
                  <div className="rounded-lg border border-zinc-200 dark:border-white/[0.08] bg-zinc-50/70 dark:bg-[#161822] p-4 space-y-3 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5 font-mono">
                        <ShieldCheck className="w-4 h-4 text-brand-600" />
                        Marketing Final Commercial Decision
                      </span>
                      {request.marketingDecision ? (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          request.marketingDecision === "Accepted"
                            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25"
                            : "bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-300"
                        }`}>
                          {request.marketingDecision === "Accepted" ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>✓ Accepted &amp; Approved</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 text-rose-600" />
                              <span>✕ Dropped / Rejected</span>
                            </>
                          )}
                        </span>
                      ) : null}
                    </div>

                    {!request.samplingFeasibilityResponse && !isFeasibilityFinalized ? (
                      <div className="p-3 rounded-md bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
                        <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold">Awaiting Technical Evaluation from Sampling Lab</p>
                          <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5 leading-relaxed">
                            Once the sampling lab logs their verdict, the Marketing commercial decision action will unlock here for final sign-off.
                          </p>
                        </div>
                      </div>
                    ) : request.marketingDecision ? (
                      <div className="p-3 rounded-md bg-white dark:bg-zinc-900/60 border border-zinc-200/70 dark:border-zinc-800 space-y-1 text-xs">
                        <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500">
                          <span>Decision by: <strong className="text-zinc-800 dark:text-zinc-200">{request.marketingDecisionBy || "Marketing Specialist"}</strong></span>
                          {request.marketingDecisionAt && <span>{new Date(request.marketingDecisionAt).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true })}</span>}
                        </div>
                        {request.marketingDecisionRemark && (
                          <p className="text-zinc-700 dark:text-zinc-300 pt-1 border-t border-zinc-100 dark:border-zinc-800 leading-relaxed">
                            "{request.marketingDecisionRemark}"
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                          SAMP Lab has recorded their evaluation ({request.samplingFeasibilityResponse}). Review the findings and conclude whether Marketing accepts or drops this request.
                        </p>

                        {decisionPromptAction ? (
                          <div className="p-3 rounded-md border border-brand-200 dark:border-brand-800 bg-white dark:bg-zinc-900 space-y-2.5">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 font-mono">
                                {decisionPromptAction === "accept"
                                  ? "✓ Confirm Feasibility Acceptance"
                                  : "✕ Confirm Feasibility Rejection"}
                              </span>
                              <button
                                type="button"
                                onClick={() => setDecisionPromptAction(null)}
                                className="text-zinc-400 hover:text-zinc-600 text-xs"
                              >
                                Cancel
                              </button>
                            </div>

                            <textarea
                              rows={2}
                              value={decisionRemark}
                              onChange={(e) => setDecisionRemark(e.target.value)}
                              placeholder={
                                decisionPromptAction === "accept"
                                  ? "Commercial notes / proceed to sampling instructions (optional)..."
                                  : "Reason for rejection / drop (e.g. client budget mismatch, technical alternative rejected)..."
                              }
                              className="w-full p-2 text-xs rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 outline-none focus:border-brand-500"
                            />

                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => setDecisionPromptAction(null)}
                                className="px-3 py-1.5 rounded text-xs text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                              >
                                Back
                              </button>
                              <button
                                type="button"
                                disabled={isSubmitting}
                                onClick={() =>
                                  handleMarketingFinalApprove(
                                    decisionPromptAction === "accept",
                                    decisionRemark
                                  )
                                }
                                className={`px-4 py-1.5 rounded text-xs font-semibold text-white shadow-2xs transition-colors flex items-center gap-1.5 ${
                                  decisionPromptAction === "accept"
                                    ? "bg-emerald-600 hover:bg-emerald-700"
                                    : "bg-rose-600 hover:bg-rose-700"
                                }`}
                              >
                                {isSubmitting ? "Saving..." : decisionPromptAction === "accept" ? "Confirm Accept" : "Confirm Reject"}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 pt-1">
                            <button
                              type="button"
                              disabled={isSubmitting}
                              onClick={() => {
                                setDecisionPromptAction("accept");
                                setDecisionRemark("");
                              }}
                              className="h-9 px-4 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer disabled:opacity-50 transition-colors flex items-center gap-1.5 shadow-2xs font-mono"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Accept Feasibility</span>
                            </button>
                            <button
                              type="button"
                              disabled={isSubmitting}
                              onClick={() => {
                                setDecisionPromptAction("reject");
                                setDecisionRemark("");
                              }}
                              className="h-9 px-3.5 rounded-md border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 text-xs font-medium cursor-pointer disabled:opacity-50 transition-colors font-mono"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Reject / Drop</span>
                            </button>
                          </div>
                        )}

                        {submitFeedback && (
                          <div className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1 pt-1 font-mono">
                            <CheckCircle className="w-3 h-3" />
                            {submitFeedback}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Milestone Activity Timeline Component */}
                  <FeasibilityActivityTimeline request={request} activities={request.activities} />
                </div>
              )}
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
                    {request.programCampaignTitle || request.programName || "Seasonal Program"}
                  </h3>
                  <div className="text-xs text-zinc-500 mt-0.5">
                    Season: <span className="font-semibold text-zinc-700 dark:text-zinc-300">{request.programYear || "—"}</span>
                    {" · "}
                    Facility: <span className="font-semibold text-zinc-700 dark:text-zinc-300">{request.targetPlant || "Unassigned"}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="px-3 py-1.5 rounded bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-right">
                    <div className="text-[10px] uppercase font-bold text-zinc-400">Total Materials</div>
                    <div className="text-sm font-mono font-bold text-indigo-700 dark:text-indigo-400 tnum">
                      {unifiedMatrixRows.length} {unifiedMatrixRows.length === 1 ? "Item" : "Items"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Material Specification Matrix (Data Table) */}
              <div className="rounded-md border border-zinc-200 dark:border-white/[0.08] overflow-hidden bg-white dark:bg-[#0f1118]">
                <div className="px-4 py-2.5 border-b border-zinc-200 dark:border-white/[0.08] bg-zinc-50/80 dark:bg-[#161822] flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-500" />
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
                      Material Specification Matrix
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                      {unifiedMatrixRows.length} {unifiedMatrixRows.length === 1 ? "Material Scheduled" : "Materials Scheduled"}
                    </span>
                    {!isAddingRow && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingRow(true);
                          setAddRowFeedback(null);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white text-[11px] font-semibold transition-all shadow-xs cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Material</span>
                      </button>
                    )}
                  </div>
                </div>

                {addRowFeedback && (
                  <div className="px-4 py-2 bg-emerald-50 dark:bg-emerald-950/40 border-b border-emerald-200 dark:border-emerald-800 text-[11px] font-medium text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      {addRowFeedback}
                    </span>
                    <button
                      type="button"
                      onClick={() => setAddRowFeedback(null)}
                      className="text-emerald-700 dark:text-emerald-400 hover:underline text-[10px] font-mono cursor-pointer"
                    >
                      Dismiss
                    </button>
                  </div>
                )}

                {unifiedMatrixRows.length > 0 || isAddingRow ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-zinc-200 dark:border-white/[0.08] bg-zinc-100/60 dark:bg-zinc-800/50 text-[11px] font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
                          <th className="py-2.5 px-3 w-10 text-center font-mono">#</th>
                          <th className="py-2.5 px-3">Material Type</th>
                          <th className="py-2.5 px-3">Supplier Name</th>
                          <th className="py-2.5 px-3">Grade</th>
                          <th className="py-2.5 px-3">Color Variant</th>
                          <th className="py-2.5 px-3">Caliper / Wt</th>
                          <th className="py-2.5 px-3 text-right">Quantity</th>
                          <th className="py-2.5 px-3">Unit</th>
                          <th className="py-2.5 px-3">Remark</th>
                          <th className="py-2.5 px-3 font-mono">Date Added</th>
                          <th className="py-2.5 px-3 min-w-[240px] bg-blue-50/50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 font-bold border-l border-blue-200/60 dark:border-blue-800/40">
                            SAMP Lab Remark / Sign-Off
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-200 dark:divide-white/[0.08] text-xs font-normal">
                        {unifiedMatrixRows.map((row) => (
                          <tr
                            key={row.id}
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
                              {row.grade}
                            </td>
                            <td className="py-2.5 px-3 text-zinc-700 dark:text-zinc-300">
                              {row.color}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-zinc-700 dark:text-zinc-300 tnum">
                              {row.caliper}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-indigo-700 dark:text-indigo-400 tnum">
                              {row.qty}
                            </td>
                            <td className="py-2.5 px-3 font-medium text-zinc-700 dark:text-zinc-300">
                              {row.unit}
                            </td>
                            <td className="py-2.5 px-3 text-zinc-500 dark:text-zinc-400 italic">
                              {row.remark}
                            </td>
                            <td
                              className="py-2.5 px-3 font-mono text-[11px] text-zinc-600 dark:text-zinc-400 whitespace-nowrap"
                              title={row.createdAt || undefined}
                            >
                              {formatAddedDate(row.createdAt)}
                            </td>
                            <td className="py-2 px-3 bg-blue-50/20 dark:bg-blue-950/10 border-l border-blue-100 dark:border-blue-900/30">
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="text"
                                  placeholder="Add SAMP lab remark..."
                                  value={matrixRemarks[row.id] ?? row.sampRemark}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setMatrixRemarks((prev) => ({ ...prev, [row.id]: val }));
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      handleSaveMaterialSampRemark(row.id, row.index);
                                    }
                                  }}
                                  className="w-full h-7 px-2 text-[11px] rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 font-sans"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleSaveMaterialSampRemark(row.id, row.index)}
                                  disabled={savingRemarkId === row.id}
                                  className="h-7 px-2.5 rounded bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer transition-all disabled:opacity-50 shrink-0 shadow-2xs"
                                  title="Save SAMP Remark"
                                >
                                  {savingRemarkId === row.id ? (
                                    <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                  ) : savedRemarkId === row.id ? (
                                    <>
                                      <Check className="w-3 h-3 text-emerald-300" />
                                      <span>Saved</span>
                                    </>
                                  ) : (
                                    <span>Save</span>
                                  )}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}

                        {/* Inline New Material Row Entry */}
                        {isAddingRow && (
                          <tr className="bg-indigo-50/50 dark:bg-indigo-950/25 border-y-2 border-indigo-400/60 dark:border-indigo-600/60">
                            <td className="py-2 px-2 text-center">
                              <span className="px-1.5 py-0.5 rounded bg-indigo-600 text-white font-mono font-bold text-[9px] uppercase tracking-wider">
                                NEW
                              </span>
                            </td>
                            <td className="py-2 px-1.5">
                              <input
                                type="text"
                                placeholder="Material type"
                                value={newRowData.material_type || ""}
                                onChange={(e) =>
                                  setNewRowData((prev) => ({ ...prev, material_type: e.target.value }))
                                }
                                onKeyDown={(e) => e.key === "Enter" && handleSaveNewMaterialRow()}
                                className="w-full h-7 px-2 text-xs rounded border border-indigo-300 dark:border-indigo-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
                                autoFocus
                              />
                            </td>
                            <td className="py-2 px-1.5">
                              <input
                                type="text"
                                placeholder="Supplier"
                                value={newRowData.supplier_name || ""}
                                onChange={(e) =>
                                  setNewRowData((prev) => ({ ...prev, supplier_name: e.target.value }))
                                }
                                onKeyDown={(e) => e.key === "Enter" && handleSaveNewMaterialRow()}
                                className="w-full h-7 px-2 text-xs rounded border border-indigo-300 dark:border-indigo-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
                              />
                            </td>
                            <td className="py-2 px-1.5">
                              <input
                                type="text"
                                placeholder="Grade"
                                value={newRowData.grade || ""}
                                onChange={(e) =>
                                  setNewRowData((prev) => ({ ...prev, grade: e.target.value }))
                                }
                                onKeyDown={(e) => e.key === "Enter" && handleSaveNewMaterialRow()}
                                className="w-full h-7 px-2 text-xs rounded border border-indigo-300 dark:border-indigo-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
                              />
                            </td>
                            <td className="py-2 px-1.5">
                              <input
                                type="text"
                                placeholder="Color"
                                value={newRowData.color_variant || ""}
                                onChange={(e) =>
                                  setNewRowData((prev) => ({ ...prev, color_variant: e.target.value }))
                                }
                                onKeyDown={(e) => e.key === "Enter" && handleSaveNewMaterialRow()}
                                className="w-full h-7 px-2 text-xs rounded border border-indigo-300 dark:border-indigo-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
                              />
                            </td>
                            <td className="py-2 px-1.5">
                              <input
                                type="text"
                                placeholder="Caliper / Wt"
                                value={newRowData.caliper_wt || ""}
                                onChange={(e) =>
                                  setNewRowData((prev) => ({ ...prev, caliper_wt: e.target.value }))
                                }
                                onKeyDown={(e) => e.key === "Enter" && handleSaveNewMaterialRow()}
                                className="w-full h-7 px-2 text-xs rounded border border-indigo-300 dark:border-indigo-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                              />
                            </td>
                            <td className="py-2 px-1.5">
                              <input
                                type="text"
                                placeholder="Qty"
                                value={newRowData.quantity || ""}
                                onChange={(e) =>
                                  setNewRowData((prev) => ({ ...prev, quantity: e.target.value }))
                                }
                                onKeyDown={(e) => e.key === "Enter" && handleSaveNewMaterialRow()}
                                className="w-full h-7 px-2 text-xs rounded border border-indigo-300 dark:border-indigo-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-right"
                              />
                            </td>
                            <td className="py-2 px-1.5">
                              <input
                                type="text"
                                list="modal-unit-options"
                                placeholder="Unit"
                                value={newRowData.unit || ""}
                                onChange={(e) =>
                                  setNewRowData((prev) => ({ ...prev, unit: e.target.value }))
                                }
                                onKeyDown={(e) => e.key === "Enter" && handleSaveNewMaterialRow()}
                                className="w-20 h-7 px-2 text-xs rounded border border-indigo-300 dark:border-indigo-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
                              />
                              <datalist id="modal-unit-options">
                                <option value="sheets" />
                                <option value="reams" />
                                <option value="pcs" />
                                <option value="kg" />
                                <option value="rolls" />
                                <option value="sets" />
                              </datalist>
                            </td>
                            <td className="py-2 px-1.5">
                              <input
                                type="text"
                                placeholder="Remark"
                                value={newRowData.remark || ""}
                                onChange={(e) =>
                                  setNewRowData((prev) => ({ ...prev, remark: e.target.value }))
                                }
                                onKeyDown={(e) => e.key === "Enter" && handleSaveNewMaterialRow()}
                                className="w-full h-7 px-2 text-xs rounded border border-indigo-300 dark:border-indigo-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
                              />
                            </td>
                            <td className="py-2 px-3 font-mono text-[11px] text-zinc-500 dark:text-zinc-400 whitespace-nowrap italic">
                              Auto (Today)
                            </td>
                            <td className="py-2 px-3 bg-blue-50/20 dark:bg-blue-950/10 border-l border-blue-100 dark:border-blue-900/30">
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={handleSaveNewMaterialRow}
                                  disabled={isSavingNewRow}
                                  className="h-7 px-2.5 rounded bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer transition-all disabled:opacity-50 shrink-0 shadow-2xs"
                                  title="Save new row to database"
                                >
                                  {isSavingNewRow ? (
                                    <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                  ) : (
                                    <Check className="w-3 h-3" />
                                  )}
                                  <span>Save to DB</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setIsAddingRow(false);
                                    setNewRowData(emptyNewRow);
                                  }}
                                  disabled={isSavingNewRow}
                                  className="h-7 px-2 rounded bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-[10px] font-mono font-semibold cursor-pointer transition-all shrink-0"
                                >
                                  Cancel
                                </button>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-6 text-center space-y-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
                      <FileSpreadsheet className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                        No Material Specifications Scheduled
                      </p>
                      <p className="text-[11px] text-zinc-400 max-w-sm mx-auto mt-0.5">
                        Add material specification rows (paper, board, caliper, quantity) directly to this program request.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingRow(true);
                        setAddRowFeedback(null);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add First Material</span>
                    </button>
                  </div>
                )}
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
            {onDeleteRequest && (
              <button
                type="button"
                onClick={() => onDeleteRequest(request)}
                className="h-9 px-3.5 rounded-md border border-rose-200 dark:border-rose-900/60 bg-rose-50/70 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 text-xs font-semibold hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs mr-auto"
                title="Delete this request permanently from database (testing mode)"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                <span>Delete Request (Testing)</span>
              </button>
            )}

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

      {/* Full Resolution Image Lightbox Modal */}
      {selectedPreviewImage && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Reference photo preview"
          className="fixed inset-0 z-[60] bg-zinc-950/90 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6"
          onClick={() => setSelectedPreviewImage(null)}
        >
          <div
            className="relative w-full max-w-6xl max-h-[94vh] bg-zinc-950 rounded-xl overflow-hidden border border-white/15 shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white truncate">
                  {selectedPreviewIndex >= 0 ? previewableImages[selectedPreviewIndex].name : "Reference photo"}
                </p>
                <p className="text-[10px] text-zinc-400 mt-0.5">
                  {selectedPreviewIndex >= 0 ? `${selectedPreviewIndex + 1} of ${previewableImages.length}` : "Preview"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPreviewImage(null)}
                aria-label="Close image preview"
                className="h-8 w-8 rounded-md flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Close preview (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="relative min-h-0 flex-1 p-3 sm:p-6 flex items-center justify-center">
              <img
                src={selectedPreviewImage}
                alt={selectedPreviewIndex >= 0 ? previewableImages[selectedPreviewIndex].name : "Enlarged reference preview"}
                className="max-w-full max-h-[78vh] object-contain rounded-lg"
              />
              {previewableImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => movePreview(-1)}
                    aria-label="Previous reference photo"
                    className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/10 border border-white/15 text-white hover:bg-white/20 transition-colors cursor-pointer"
                  >
                    <span aria-hidden="true" className="text-2xl leading-none">‹</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => movePreview(1)}
                    aria-label="Next reference photo"
                    className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/10 border border-white/15 text-white hover:bg-white/20 transition-colors cursor-pointer"
                  >
                    <span aria-hidden="true" className="text-2xl leading-none">›</span>
                  </button>
                </>
              )}
            </div>
            <div className="flex items-center justify-between px-4 py-3 border-t border-white/10 text-[10px] text-zinc-400">
              <span>Use ← / → to browse</span>
              <span>Press Esc to close</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SampleRequestInspector;
