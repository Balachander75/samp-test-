import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Check,
  CheckCircle2,
  AlertCircle,
  Copy,
  Clock,
  Trash2,
  Plus,
  RefreshCw,
  ShieldCheck,
  Zap,
  Factory,
  Eye,
  FileSpreadsheet,
  CheckSquare,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { SampleRequestItem } from "../../types";
import {
  updateBatchProgramSampRemarksApi,
  updateSingleMaterialSampRemarkApi,
  addProgramMaterialApi,
  deleteProgramMaterialApi,
  mapProgramRequestToSampleRequest,
  submitProgramReviewApi,
  markProgramSeenApi,
} from "@/infrastructure/api/programsApi";
import {
  ProgramChatterFeed,
  ProgramMaterialReviewItem,
  isMaterialAddedRecently,
} from "./ProgramChatterFeed";
import { UserProfile } from "@/features/auth";
import { formatOdooLogDate } from "../../utils/dateUtils";

export interface ProgramPlanningInspectorModalProps {
  request: SampleRequestItem | null;
  isOpen: boolean;
  onClose: () => void;
  onRefresh?: () => Promise<void>;
  mode?: "marketing" | "sampling" | "plant";
  userRole?: string;
  user?: UserProfile | null;
  currentUser?: UserProfile | null;
  onDeleteRequest?: (req: SampleRequestItem) => void;
}

import { parseSampRemark, formatSampRemark } from "../utils/programRemarkUtils";
export { parseSampRemark, formatSampRemark };

function formatDateAdded(dateStr?: string): string {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "—";
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const timeFormatted = d.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    if (isToday) {
      return `Today, ${timeFormatted}`;
    }
    return `${d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}, ${timeFormatted}`;
  } catch {
    return dateStr;
  }
}

export const ProgramPlanningInspectorModal: React.FC<ProgramPlanningInspectorModalProps> = ({
  request,
  isOpen,
  onClose,
  onRefresh,
  mode = "marketing",
  user,
  currentUser,
  onDeleteRequest,
}) => {
  const isSamplingMode = mode === "sampling";
  const isPlantMode = mode === "plant";
  const effectiveUser = currentUser || user;

  // Internal synchronized request
  const [internalRequest, setInternalRequest] = useState<SampleRequestItem | null>(null);

  // Active Section Navigation Tab State ("matrix" | "sampling" | "plant" | "all")
  const [activeSection, setActiveSection] = useState<"matrix" | "sampling" | "plant" | "all">(
    isSamplingMode ? "sampling" : isPlantMode ? "plant" : "matrix"
  );

  useEffect(() => {
    if (isSamplingMode) {
      setActiveSection("sampling");
    } else if (isPlantMode) {
      setActiveSection("plant");
    } else {
      setActiveSection("matrix");
    }
  }, [isSamplingMode, isPlantMode]);

  // Local state for material matrix rows
  const [rows, setRows] = useState<ProgramMaterialReviewItem[]>([]);
  const [copiedCode, setCopiedCode] = useState(false);
  const [savingRowId, setSavingRowId] = useState<number | string | null>(null);
  const [savedRowId, setSavedRowId] = useState<number | string | null>(null);
  const [deletingRowId, setDeletingRowId] = useState<number | string | null>(null);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sampling Review form state
  const [samplingVerdictInput, setSamplingVerdictInput] = useState<"Feasible" | "Revisions Required" | "Not Feasible">("Feasible");
  const [samplingRemarkInput, setSamplingRemarkInput] = useState("");
  const [isSubmittingSampReview, setIsSubmittingSampReview] = useState(false);

  // Plant Review form state
  const [plantVerdictInput, setPlantVerdictInput] = useState<"Capacity Confirmed" | "Tooling Constrained" | "Not Feasible">("Capacity Confirmed");
  const [plantRemarkInput, setPlantRemarkInput] = useState("");
  const [isSubmittingPlantReview, setIsSubmittingPlantReview] = useState(false);

  // Add Specification Drawer state
  const [isAddingRow, setIsAddingRow] = useState(false);
  const [newMaterialType, setNewMaterialType] = useState("");
  const [newSupplierName, setNewSupplierName] = useState("");
  const [newGrade, setNewGrade] = useState("");
  const [newColorVariant, setNewColorVariant] = useState("");
  const [newCaliperWt, setNewCaliperWt] = useState("");
  const [newQuantity, setNewQuantity] = useState("");
  const [newUnit, setNewUnit] = useState("pcs");
  const [newRemark, setNewRemark] = useState("");
  const [isSavingNewRow, setIsSavingNewRow] = useState(false);

  useEffect(() => {
    if (request) {
      setInternalRequest(request);
      if (request.samplingRemark) setSamplingRemarkInput(request.samplingRemark);
      if (request.plantRemark) setPlantRemarkInput(request.plantRemark);
    }
  }, [request]);

  const activeRequest: SampleRequestItem | null = internalRequest || request;

  // Auto-record Seen timestamp when opened by Sampling or Plant team
  useEffect(() => {
    if (!isOpen || !activeRequest?.id) return;
    const actorName = effectiveUser?.name || (isSamplingMode ? "Sampling Specialist" : isPlantMode ? "Plant Engineer" : null);

    if (isSamplingMode && !activeRequest.samplingSeenAt) {
      markProgramSeenApi(activeRequest.id, {
        department: "sampling",
        actor_name: actorName,
      })
        .then((updated) => setInternalRequest(mapProgramRequestToSampleRequest(updated)))
        .catch(() => {});
    } else if (isPlantMode && !activeRequest.plantSeenAt) {
      markProgramSeenApi(activeRequest.id, {
        department: "plant",
        actor_name: actorName,
      })
        .then((updated) => setInternalRequest(mapProgramRequestToSampleRequest(updated)))
        .catch(() => {});
    }
  }, [isOpen, isSamplingMode, isPlantMode, activeRequest?.id]);

  // Sync rows
  useEffect(() => {
    if (!activeRequest) return;
    setSaveSuccessMessage(null);
    setErrorMessage(null);
    setCopiedCode(false);
    setIsAddingRow(false);

    const materials = activeRequest.programMaterials || [];
    if (materials.length > 0) {
      setRows(
        materials.map((m, idx) => {
          const { text, highlightedCols } = parseSampRemark(m.sampRemark);
          return {
            id: m.id != null ? m.id : idx + 1,
            materialType: m.materialType || "",
            supplierName: m.supplierName || "",
            grade: m.grade || "",
            colorVariant: m.colorVariant || "",
            caliperWt: m.caliperWt || "",
            quantity: m.quantity || "",
            unit: m.unit || "pcs",
            remark: m.remark || "",
            createdAt: m.createdAt,
            highlightedCols,
            sampRemarkText: text,
          };
        })
      );
    } else {
      setRows([
        {
          id: 1,
          materialType: activeRequest.materialCode || "Main Material Specification",
          supplierName: "Pending Assignment",
          grade: "Standard",
          colorVariant: "Standard",
          caliperWt: "Standard",
          quantity: "5000",
          unit: "pcs",
          remark: "Initial matrix specification",
          createdAt: activeRequest.createdAt,
          highlightedCols: [],
          sampRemarkText: "",
        },
      ]);
    }
  }, [activeRequest?.id, activeRequest?.updatedAt]);

  const samplingOk = useMemo(() => {
    const v = (activeRequest?.samplingVerdict || "").toLowerCase();
    return v.includes("feasible") || v.includes("approved");
  }, [activeRequest?.samplingVerdict]);

  const plantOk = useMemo(() => {
    const v = (activeRequest?.plantVerdict || "").toLowerCase();
    return v.includes("feasible") || v.includes("confirmed") || v.includes("approved");
  }, [activeRequest?.plantVerdict]);

  const isDualSignOffCompleted = useMemo(() => {
    return samplingOk && plantOk;
  }, [samplingOk, plantOk]);

  const recentCount = useMemo(() => {
    return rows.filter((r) => r.isNewAdded || isMaterialAddedRecently(r.createdAt)).length;
  }, [rows]);

  const totalQuantity = useMemo(() => {
    return rows.reduce((acc, row) => acc + (Number(row.quantity) || 0), 0);
  }, [rows]);

  const updateSampRemarkText = useCallback((rowId: number | string, text: string) => {
    setRows((prev) =>
      prev.map((r) => (r.id === rowId ? { ...r, sampRemarkText: text } : r))
    );
  }, []);

  const handleCopyCode = useCallback(() => {
    if (!activeRequest) return;
    const code = activeRequest.srNumber || activeRequest.materialCode || `PG-${activeRequest.id}`;
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 1500);
  }, [activeRequest]);

  const handleDeleteRow = useCallback(async (rowId: number | string) => {
    if (!activeRequest?.id) return;
    setDeletingRowId(rowId);
    setErrorMessage(null);

    try {
      const updated = await deleteProgramMaterialApi(activeRequest.id, rowId);
      setInternalRequest(mapProgramRequestToSampleRequest(updated));
      if (onRefresh) await onRefresh();
    } catch (err: any) {
      console.error("Failed to delete material row:", err);
      setErrorMessage(err?.message || "Failed to remove material line.");
    } finally {
      setDeletingRowId(null);
    }
  }, [activeRequest?.id, onRefresh]);

  const handleSaveSingleRowRemark = useCallback(async (rowId: number | string) => {
    const targetRow = rows.find((r) => r.id === rowId);
    if (!targetRow || !activeRequest?.id) return;

    setSavingRowId(rowId);
    setErrorMessage(null);

    try {
      const formattedRemark = formatSampRemark(targetRow.sampRemarkText, targetRow.highlightedCols);
      let updatedRecord;
      if (typeof targetRow.id === "number" || !isNaN(Number(targetRow.id))) {
        updatedRecord = await updateSingleMaterialSampRemarkApi(activeRequest.id, Number(targetRow.id), formattedRemark);
      } else {
        updatedRecord = await updateBatchProgramSampRemarksApi(activeRequest.id, [
          {
            material_id: Number(targetRow.id) || 1,
            samp_remark: formattedRemark,
          },
        ]);
      }

      if (updatedRecord) {
        setInternalRequest(mapProgramRequestToSampleRequest(updatedRecord));
      }

      setSavedRowId(rowId);
      setTimeout(() => setSavedRowId(null), 2500);

      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("samp:requests-changed"));
      }
      if (onRefresh) await onRefresh();
    } catch (err: any) {
      console.error("Failed to save row remark via API:", err);
      setErrorMessage(err?.message || "Failed to save sampling remark.");
    } finally {
      setSavingRowId(null);
    }
  }, [activeRequest?.id, onRefresh, rows]);

  const handleSaveNewInlineRow = useCallback(async () => {
    if (!newMaterialType.trim()) {
      setErrorMessage("Please specify a Material Type.");
      return;
    }
    if (!activeRequest?.id) return;

    setIsSavingNewRow(true);
    setErrorMessage(null);

    const payload = {
      material_type: newMaterialType.trim(),
      supplier_name: newSupplierName.trim() || null,
      grade: newGrade.trim() || null,
      color_variant: newColorVariant.trim() || null,
      caliper_wt: newCaliperWt.trim() || null,
      quantity: newQuantity.trim() || "1",
      unit: newUnit.trim() || "pcs",
      remark: newRemark.trim() || null,
    };

    try {
      const updated = await addProgramMaterialApi(activeRequest.id, payload);
      setInternalRequest(mapProgramRequestToSampleRequest(updated));

      setIsAddingRow(false);
      setNewMaterialType("");
      setNewSupplierName("");
      setNewGrade("");
      setNewColorVariant("");
      setNewCaliperWt("");
      setNewQuantity("");
      setNewRemark("");
      setSaveSuccessMessage("✓ New material specification added and highlighted for 36 hours.");
      setTimeout(() => setSaveSuccessMessage(null), 3000);

      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("samp:requests-changed"));
      }
      if (onRefresh) await onRefresh();
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to add material row to program matrix.");
    } finally {
      setIsSavingNewRow(false);
    }
  }, [activeRequest?.id, newCaliperWt, newColorVariant, newGrade, newMaterialType, newQuantity, newRemark, newSupplierName, newUnit, onRefresh]);

  const handleSubmitSamplingReview = useCallback(async () => {
    if (!activeRequest?.id || isSubmittingSampReview) return;
    setIsSubmittingSampReview(true);
    setErrorMessage(null);
    try {
      const reviewerName = effectiveUser?.name || "Sampling Specialist";
      const updatedRecord = await submitProgramReviewApi(activeRequest.id, {
        department: "sampling",
        verdict: samplingVerdictInput,
        remark: samplingRemarkInput.trim() || null,
        actor_name: reviewerName,
      });

      setInternalRequest(mapProgramRequestToSampleRequest(updatedRecord));
      setSaveSuccessMessage("✓ Sampling Team technical review recorded.");
      setTimeout(() => setSaveSuccessMessage(null), 3000);

      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("samp:requests-changed"));
      }
      if (onRefresh) await onRefresh();
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to submit Sampling Team sign-off review.");
    } finally {
      setIsSubmittingSampReview(false);
    }
  }, [activeRequest?.id, effectiveUser?.name, isSubmittingSampReview, onRefresh, samplingRemarkInput, samplingVerdictInput]);

  const handleSubmitPlantReview = useCallback(async () => {
    if (!activeRequest?.id || isSubmittingPlantReview) return;
    setIsSubmittingPlantReview(true);
    setErrorMessage(null);
    try {
      const reviewerName = effectiveUser?.name || "Plant Engineer";
      const updatedRecord = await submitProgramReviewApi(activeRequest.id, {
        department: "plant",
        verdict: plantVerdictInput,
        remark: plantRemarkInput.trim() || null,
        actor_name: reviewerName,
      });

      setInternalRequest(mapProgramRequestToSampleRequest(updatedRecord));
      setSaveSuccessMessage("✓ Plant Team manufacturing review recorded.");
      setTimeout(() => setSaveSuccessMessage(null), 3000);

      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("samp:requests-changed"));
      }
      if (onRefresh) await onRefresh();
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to submit Plant Team sign-off review.");
    } finally {
      setIsSubmittingPlantReview(false);
    }
  }, [activeRequest?.id, effectiveUser?.name, isSubmittingPlantReview, onRefresh, plantRemarkInput, plantVerdictInput]);

  if (!isOpen || !activeRequest) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs select-text font-sans animate-fadeIn"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-[98vw] xl:max-w-[1400px] h-[94vh] max-h-[94vh] flex flex-col bg-[#f8f9ff] dark:bg-[#0c0d12] border border-slate-200/70 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden text-xs"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── 1. Top Control Bar (Pristine Luminous Engine Aesthetics) ── */}
        <div className="bg-white/85 dark:bg-[#151824]/90 backdrop-blur-xl border-b border-slate-100/90 dark:border-white/5 px-6 py-2.5 flex items-center justify-between gap-3 shrink-0 shadow-[0_2px_12px_rgba(11,28,48,0.02)]">
          {/* Left Actions */}
          <div className="flex items-center space-x-2">
            <span className="font-mono text-xs font-bold text-[#006d32] dark:text-[#00d166] bg-[#eff4ff] dark:bg-[#006d32]/20 px-3 py-1 rounded-xl border border-[#006d32]/20">
              {activeRequest.srNumber || activeRequest.materialCode || `PG-${activeRequest.id}`}
            </span>

            <button
              type="button"
              onClick={handleCopyCode}
              className="text-slate-600 hover:text-[#006d32] dark:hover:text-[#00d166] hover:bg-[#eff4ff] dark:hover:bg-[#006d32]/10 font-medium px-2.5 py-1.5 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer transition"
              title="Copy request tracking reference code"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span>{copiedCode ? "Copied" : "Copy Code"}</span>
            </button>

            {onDeleteRequest && (
              <button
                type="button"
                onClick={() => onDeleteRequest(activeRequest)}
                className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 font-medium px-2.5 py-1.5 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer transition"
                title="Delete this request"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            )}
          </div>

          {/* Right: Stepper & Close */}
          <div className="flex items-center gap-3">
            {/* Interactive Section Stepper */}
            <div className="hidden md:flex items-center gap-1.5 text-[11px] font-mono select-none">
              <button
                type="button"
                onClick={() => setActiveSection("matrix")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold border transition cursor-pointer ${
                  activeSection === "matrix"
                    ? "bg-[#006d32] text-white border-[#006d32] shadow-2xs"
                    : "bg-emerald-50 text-[#006d32] border-emerald-200 hover:bg-emerald-100"
                }`}
                title="Switch to Section 1: Matrix"
              >
                <Check className="w-3 h-3" /> 1. Matrix
              </button>
              <span className="text-slate-300">→</span>
              <button
                type="button"
                onClick={() => setActiveSection("sampling")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold border transition cursor-pointer ${
                  activeSection === "sampling"
                    ? "bg-sky-700 text-white border-sky-700 shadow-2xs"
                    : samplingOk
                    ? "bg-emerald-50 text-[#006d32] border-emerald-200 hover:bg-emerald-100"
                    : "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
                }`}
                title="Switch to Section 2: Sampling Review"
              >
                {samplingOk ? <Check className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                2. Sampling Review
              </button>
              <span className="text-slate-300">→</span>
              <button
                type="button"
                onClick={() => setActiveSection("plant")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold border transition cursor-pointer ${
                  activeSection === "plant"
                    ? "bg-teal-700 text-white border-teal-700 shadow-2xs"
                    : plantOk
                    ? "bg-teal-50 text-teal-800 border-teal-200 hover:bg-teal-100"
                    : "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
                }`}
                title="Switch to Section 3: Plant Review"
              >
                {plantOk ? <Check className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                3. Plant Review
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="bg-slate-100/80 hover:bg-slate-200/80 text-slate-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-200 px-3.5 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>

        {/* Global Notifications */}
        {saveSuccessMessage && (
          <div className="mx-6 mt-3 px-4 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[#006d32] dark:text-emerald-300 text-xs font-medium flex items-center justify-between shadow-2xs animate-fadeIn">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{saveSuccessMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setSaveSuccessMessage(null)}
              className="text-emerald-700 hover:text-emerald-900 font-mono text-[11px] underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {errorMessage && (
          <div className="mx-6 mt-3 px-4 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-medium flex items-center justify-between shadow-2xs animate-fadeIn">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-rose-700 hover:text-rose-900 font-mono text-[11px] underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* ── 2. Split Workspace: Left 3 Sections, Right Pure Audit Log ── */}
        <div className="flex-1 flex overflow-hidden">
          {/* LEFT: Spacious Document Canvas (3 Explicit Sections) */}
          <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-6">
            
            {/* Hero Header Card */}
            <div className="bg-white dark:bg-[#12141d] rounded-2xl border border-slate-200/60 dark:border-white/5 p-6 shadow-[0_2px_12px_rgba(11,28,48,0.02)] space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-slate-500">
                      Seasonal Program Planning
                    </span>
                    <span className="text-slate-300 dark:text-zinc-700">•</span>
                    <span className="bg-[#eff4ff] text-[#006d32] dark:bg-[#006d32]/20 dark:text-[#00d166] text-xs font-mono font-bold px-2.5 py-0.5 rounded-lg border border-[#006d32]/20">
                      Season {activeRequest.programYear || "2026-2027"}
                    </span>
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 dark:text-zinc-50 tracking-tight leading-tight">
                    {activeRequest.programName || activeRequest.productDescription || "Seasonal Program"}
                  </h1>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-zinc-400 pt-1">
                    <div>
                      Client Account: <strong className="text-slate-900 dark:text-zinc-100">{activeRequest.customer}</strong>
                    </div>
                    <span>•</span>
                    <div>
                      Designated Facility: <strong className="font-mono text-slate-900 dark:text-zinc-100">{activeRequest.targetPlant || "1505-Nadiad"}</strong>
                    </div>
                    <span>•</span>
                    <div>
                      Raised by: <span className="font-mono">{activeRequest.createdBy || "Marketing Desk"}</span>
                    </div>
                  </div>
                </div>

                {/* Dual Review Status Badges */}
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`px-3 py-1 rounded-xl border flex items-center gap-1.5 font-bold text-xs ${
                        samplingOk
                          ? "bg-emerald-50 text-[#006d32] border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300"
                          : "bg-slate-100 text-slate-600 border-slate-200 dark:bg-zinc-800 dark:text-zinc-300"
                      }`}
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Sampling: {activeRequest.samplingVerdict || "Pending"}</span>
                    </span>

                    <span
                      className={`px-3 py-1 rounded-xl border flex items-center gap-1.5 font-bold text-xs ${
                        plantOk
                          ? "bg-teal-50 text-teal-800 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300"
                          : "bg-slate-100 text-slate-600 border-slate-200 dark:bg-zinc-800 dark:text-zinc-300"
                      }`}
                    >
                      <Factory className="w-3.5 h-3.5" />
                      <span>Plant: {activeRequest.plantVerdict || "Pending"}</span>
                    </span>
                  </div>

                  {isDualSignOffCompleted ? (
                    <span className="text-[11px] font-mono font-bold text-[#006d32] dark:text-[#00d166] flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Dual Sign-Off Complete • Ready for Production Floor
                    </span>
                  ) : (
                    <span className="text-[11px] font-mono text-slate-400">
                      Both Sampling &amp; Plant reviews required
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* ── Section Division Notebook Tab Strip (Matching Feasibility Check Architecture) ── */}
            <div className="bg-white dark:bg-[#12141d] rounded-2xl border border-slate-200/60 dark:border-white/5 px-6 pt-3 shadow-[0_2px_12px_rgba(11,28,48,0.02)]">
              <div className="border-b border-slate-100 dark:border-white/10 flex items-center space-x-6 text-xs font-semibold overflow-x-auto select-none">
                <button
                  type="button"
                  onClick={() => setActiveSection("matrix")}
                  className={`pb-3.5 border-b-2 font-display transition cursor-pointer select-none flex items-center gap-2 whitespace-nowrap ${
                    activeSection === "matrix"
                      ? "border-[#006d32] text-[#006d32] dark:text-[#00d166] font-bold"
                      : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200"
                  }`}
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>1. Material Specification Matrix</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-[#eff4ff] dark:bg-[#006d32]/25 text-[#006d32] dark:text-[#00d166] font-bold border border-[#006d32]/20">
                    {rows.length} {rows.length === 1 ? "Line" : "Lines"}
                  </span>
                  {recentCount > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-mono font-bold bg-[#006d32] text-white">
                      <Zap className="w-2.5 h-2.5" />
                      +{recentCount} (36h)
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveSection("sampling")}
                  className={`pb-3.5 border-b-2 font-display transition cursor-pointer select-none flex items-center gap-2 whitespace-nowrap ${
                    activeSection === "sampling"
                      ? "border-sky-600 text-sky-700 dark:text-sky-300 font-bold"
                      : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200"
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>2. Sampling Team Review</span>
                  {samplingOk ? (
                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-emerald-50 text-[#006d32] border border-emerald-200 dark:bg-emerald-950/60 dark:text-[#00d166]">
                      ✓ {activeRequest.samplingVerdict}
                    </span>
                  ) : activeRequest.samplingVerdict ? (
                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200">
                      ⚠️ {activeRequest.samplingVerdict}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-slate-100 text-slate-600 dark:bg-zinc-800">
                      Pending
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveSection("plant")}
                  className={`pb-3.5 border-b-2 font-display transition cursor-pointer select-none flex items-center gap-2 whitespace-nowrap ${
                    activeSection === "plant"
                      ? "border-teal-600 text-teal-700 dark:text-teal-300 font-bold"
                      : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200"
                  }`}
                >
                  <Factory className="w-4 h-4" />
                  <span>3. Plant Manufacturing Review</span>
                  {plantOk ? (
                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-teal-50 text-teal-800 border border-teal-200 dark:bg-teal-950/60 dark:text-teal-300">
                      ✓ {activeRequest.plantVerdict}
                    </span>
                  ) : activeRequest.plantVerdict ? (
                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200">
                      ⚠️ {activeRequest.plantVerdict}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-slate-100 text-slate-600 dark:bg-zinc-800">
                      Pending
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveSection("all")}
                  className={`pb-3.5 border-b-2 font-display transition cursor-pointer select-none flex items-center gap-1.5 whitespace-nowrap ${
                    activeSection === "all"
                      ? "border-slate-800 text-slate-900 dark:border-white dark:text-white font-bold"
                      : "border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-zinc-300"
                  }`}
                >
                  <span>All Sections</span>
                </button>
              </div>
            </div>

            {/* ════════════════════════════════════════════════════════════════
                SECTION 1: MATERIAL SPECIFICATION MATRIX
            ════════════════════════════════════════════════════════════════ */}
            {(activeSection === "matrix" || activeSection === "all") && (
            <div className="bg-white dark:bg-[#12141d] rounded-2xl border border-slate-200/60 dark:border-white/5 p-6 shadow-[0_2px_12px_rgba(11,28,48,0.02)] space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-100 dark:border-white/5">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-xs font-bold text-[#006d32] bg-[#eff4ff] px-2 py-0.5 rounded-lg border border-[#006d32]/20">
                    01
                  </span>
                  <div>
                    <h2 className="font-display font-bold text-base text-slate-900 dark:text-zinc-100 tracking-tight leading-none">
                      Material Specification Matrix
                    </h2>
                    <span className="text-[11px] text-slate-400 mt-0.5 block">
                      Substrate specifications, calipers, paper allocations, and SKU quantities
                    </span>
                  </div>
                  <span className="ml-2 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-[#eff4ff] text-[#006d32] border border-[#006d32]/20">
                    {rows.length} {rows.length === 1 ? "Line" : "Lines"}
                  </span>
                  {recentCount > 0 && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-mono font-bold bg-[#006d32] text-white shadow-2xs">
                      <Zap className="w-3 h-3" />
                      {recentCount} New (36h)
                    </span>
                  )}
                </div>

                {!isSamplingMode && !isPlantMode && !isAddingRow && (
                  <button
                    type="button"
                    onClick={() => setIsAddingRow(true)}
                    className="bg-[#006d32] hover:bg-[#00883e] text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-[0_4px_14px_rgba(0,109,50,0.25)] flex items-center gap-1.5 transition cursor-pointer active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Material Specification</span>
                  </button>
                )}
              </div>

              {/* Clean Expandable Add Specification Form */}
              {isAddingRow && (
                <div className="p-5 rounded-2xl bg-[#f8f9ff] dark:bg-zinc-900/60 border border-slate-200/80 dark:border-zinc-700/60 space-y-4 animate-fadeIn shadow-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-display font-bold text-sm text-slate-900 dark:text-zinc-100 block">
                        Add New Material Specification Line
                      </span>
                      <span className="text-xs text-slate-500">
                        Will be highlighted with an active badge for 36 hours for Sampling &amp; Plant teams
                      </span>
                    </div>
                    <span className="text-[11px] font-mono font-bold text-[#006d32] bg-[#eff4ff] px-2 py-0.5 rounded-md">
                      Auto-Logged
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                        Material Type *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Maplitho / SBS Board"
                        value={newMaterialType}
                        onChange={(e) => setNewMaterialType(e.target.value)}
                        className="w-full p-2.5 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-[#006d32]/20 focus:border-[#006d32] transition"
                        autoFocus
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                        Supplier Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. JK Paper / ITC"
                        value={newSupplierName}
                        onChange={(e) => setNewSupplierName(e.target.value)}
                        className="w-full p-2.5 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-[#006d32]/20 focus:border-[#006d32] transition"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                        Grade
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Super White A+"
                        value={newGrade}
                        onChange={(e) => setNewGrade(e.target.value)}
                        className="w-full p-2.5 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-[#006d32]/20 focus:border-[#006d32] transition"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                        Color Variant
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Natural White"
                        value={newColorVariant}
                        onChange={(e) => setNewColorVariant(e.target.value)}
                        className="w-full p-2.5 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-[#006d32]/20 focus:border-[#006d32] transition"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                        Caliper / Weight
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 70 GSM / 280 PT"
                        value={newCaliperWt}
                        onChange={(e) => setNewCaliperWt(e.target.value)}
                        className="w-full p-2.5 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-[#006d32]/20 focus:border-[#006d32] transition"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                        Quantity
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 15000"
                        value={newQuantity}
                        onChange={(e) => setNewQuantity(e.target.value)}
                        className="w-full p-2.5 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 font-mono text-right outline-none focus:ring-2 focus:ring-[#006d32]/20 focus:border-[#006d32] transition"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                        Unit
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. pcs / kg"
                        value={newUnit}
                        onChange={(e) => setNewUnit(e.target.value)}
                        className="w-full p-2.5 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 font-mono outline-none focus:ring-2 focus:ring-[#006d32]/20 focus:border-[#006d32] transition"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                        Marketing Note
                      </label>
                      <input
                        type="text"
                        placeholder="Optional note..."
                        value={newRemark}
                        onChange={(e) => setNewRemark(e.target.value)}
                        className="w-full p-2.5 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-[#006d32]/20 focus:border-[#006d32] transition"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsAddingRow(false)}
                      className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-200 text-xs font-medium transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={isSavingNewRow}
                      onClick={handleSaveNewInlineRow}
                      className="px-5 py-2 bg-[#006d32] hover:bg-[#00883e] text-white rounded-xl text-xs font-semibold shadow-[0_4px_14px_rgba(0,109,50,0.25)] transition cursor-pointer disabled:opacity-50"
                    >
                      {isSavingNewRow ? "Saving..." : "Save Specification"}
                    </button>
                  </div>
                </div>
              )}

              {/* Spacious Clean Matrix Table */}
              <div className="border border-slate-200/80 dark:border-zinc-700/80 rounded-2xl overflow-x-auto shadow-xs bg-white dark:bg-[#12141d]">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/90 dark:bg-zinc-800/60 border-b border-slate-200/80 dark:border-zinc-700/80 text-slate-600 dark:text-zinc-300 font-bold text-[11px] select-none">
                      <th className="p-3 border-r border-slate-200/80 dark:border-zinc-700/80 w-10 text-center">#</th>
                      <th className="p-3 border-r border-slate-200/80 dark:border-zinc-700/80 min-w-[130px]">
                        DATE ADDED
                      </th>
                      <th className="p-3 border-r border-slate-200/80 dark:border-zinc-700/80 min-w-[130px]">
                        MATERIAL TYPE
                      </th>
                      <th className="p-3 border-r border-slate-200/80 dark:border-zinc-700/80">SUPPLIER</th>
                      <th className="p-3 border-r border-slate-200/80 dark:border-zinc-700/80">GRADE</th>
                      <th className="p-3 border-r border-slate-200/80 dark:border-zinc-700/80">COLOR</th>
                      <th className="p-3 border-r border-slate-200/80 dark:border-zinc-700/80">CALIPER / WT</th>
                      <th className="p-3 border-r border-slate-200/80 dark:border-zinc-700/80 text-right">QTY</th>
                      <th className="p-3 border-r border-slate-200/80 dark:border-zinc-700/80">UNIT</th>
                      <th className="p-3 border-r border-slate-200/80 dark:border-zinc-700/80 max-w-[140px]">NOTE</th>
                      <th className="p-3 min-w-[260px]">SAMP TECHNICAL REVIEW</th>
                      {!isSamplingMode && !isPlantMode && (
                        <th className="p-3 border-l border-slate-200/80 dark:border-zinc-700/80 w-12 text-center">ACT</th>
                      )}
                    </tr>
                  </thead>

                  <tbody>
                    {rows.map((row, idx) => {
                      const isRecent = row.isNewAdded || isMaterialAddedRecently(row.createdAt);

                      return (
                        <tr
                          key={row.id}
                          className={`border-b border-slate-100 dark:border-zinc-800/80 transition-colors ${
                            isRecent
                              ? "bg-emerald-50/40 dark:bg-emerald-950/20 hover:bg-emerald-50/70 border-l-4 border-l-[#006d32]"
                              : "hover:bg-slate-50/80 dark:hover:bg-zinc-800/40"
                          }`}
                        >
                          <td className="p-3 border-r border-slate-100 dark:border-zinc-800/80 text-center font-mono text-slate-400">
                            {idx + 1}
                          </td>

                          {/* Date Added Column with Clean 36h Badge */}
                          <td className="p-3 border-r border-slate-100 dark:border-zinc-800/80 font-mono text-[11px] whitespace-nowrap">
                            <div className="flex flex-col gap-0.5">
                              <span className="text-slate-700 dark:text-zinc-300">
                                {formatDateAdded(row.createdAt)}
                              </span>
                              {isRecent && (
                                <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold bg-[#006d32] text-white px-1.5 py-0.2 rounded w-fit shadow-2xs">
                                  <Zap className="w-2.5 h-2.5" />
                                  <span>NEW (36h)</span>
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="p-3 border-r border-slate-100 dark:border-zinc-800/80 font-semibold text-slate-900 dark:text-zinc-100">
                            {row.materialType || "—"}
                          </td>

                          <td className="p-3 border-r border-slate-100 dark:border-zinc-800/80 text-slate-600 dark:text-zinc-400">
                            {row.supplierName || "—"}
                          </td>

                          <td className="p-3 border-r border-slate-100 dark:border-zinc-800/80 font-mono text-slate-600 dark:text-zinc-400">
                            {row.grade || "—"}
                          </td>

                          <td className="p-3 border-r border-slate-100 dark:border-zinc-800/80 text-slate-600 dark:text-zinc-400">
                            {row.colorVariant || "—"}
                          </td>

                          <td className="p-3 border-r border-slate-100 dark:border-zinc-800/80 font-mono text-slate-600 dark:text-zinc-400">
                            {row.caliperWt || "—"}
                          </td>

                          <td className="p-3 border-r border-slate-100 dark:border-zinc-800/80 text-right font-mono font-bold text-slate-900 dark:text-zinc-100">
                            {row.quantity}
                          </td>

                          <td className="p-3 border-r border-slate-100 dark:border-zinc-800/80 text-slate-500 font-mono">
                            {row.unit}
                          </td>

                          <td className="p-3 border-r border-slate-100 dark:border-zinc-800/80 text-slate-600 dark:text-zinc-400 italic max-w-[140px] truncate">
                            {row.remark || "—"}
                          </td>

                          {/* Technical Review Cell */}
                          <td className="p-3">
                            {isSamplingMode ? (
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={row.sampRemarkText}
                                  onChange={(e) => updateSampRemarkText(row.id, e.target.value)}
                                  placeholder="Technical lab remark..."
                                  className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs text-slate-900 dark:text-zinc-100 outline-none focus:ring-1 focus:ring-[#006d32]"
                                />
                                <button
                                  type="button"
                                  disabled={savingRowId === row.id}
                                  onClick={() => handleSaveSingleRowRemark(row.id)}
                                  className="px-3 py-1.5 bg-[#006d32] hover:bg-[#00883e] text-white rounded-xl text-xs font-semibold cursor-pointer shrink-0 disabled:opacity-50 transition"
                                >
                                  {savingRowId === row.id ? "Saving..." : "Save"}
                                </button>
                                {savedRowId === row.id && (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                )}
                              </div>
                            ) : (
                              <div className="text-xs text-slate-800 dark:text-zinc-200">
                                {row.sampRemarkText ? (
                                  <span className="italic bg-sky-50/80 dark:bg-sky-950/30 px-2.5 py-1 rounded-lg text-sky-900 dark:text-sky-200 border border-sky-100 dark:border-sky-900/40 block">
                                    &quot;{row.sampRemarkText}&quot;
                                  </span>
                                ) : (
                                  <span className="text-[11px] text-slate-400 font-mono">Pending review</span>
                                )}
                              </div>
                            )}
                          </td>

                          {!isSamplingMode && !isPlantMode && (
                            <td className="p-3 border-l border-slate-100 dark:border-zinc-800/80 text-center">
                              <button
                                type="button"
                                onClick={() => handleDeleteRow(row.id)}
                                disabled={deletingRowId === row.id || rows.length <= 1}
                                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition cursor-pointer disabled:opacity-30"
                                title="Delete row"
                              >
                                {deletingRowId === row.id ? (
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-rose-500" />
                                ) : (
                                  <Trash2 className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Bottom Section 1 Navigator */}
              {activeSection === "matrix" && (
                <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-white/5 flex-wrap gap-2">
                  <span className="text-xs text-slate-500 font-sans">
                    Configured {rows.length} {rows.length === 1 ? "substrate line" : "substrate lines"} ({totalQuantity.toLocaleString()} {rows[0]?.unit || "pcs"})
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveSection("sampling")}
                    className="px-4 py-2 rounded-xl bg-white dark:bg-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 text-xs font-semibold flex items-center gap-2 transition cursor-pointer shadow-2xs hover:border-[#006d32]"
                  >
                    <span>Proceed to 2. Sampling Team Technical Review</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#006d32] dark:text-[#00d166]" />
                  </button>
                </div>
              )}
            </div>
            )}

            {/* ════════════════════════════════════════════════════════════════
                SECTION 2: SAMPLING TEAM REVIEW
            ════════════════════════════════════════════════════════════════ */}
            {(activeSection === "sampling" || activeSection === "all") && (
            <div className="bg-white dark:bg-[#12141d] rounded-2xl border border-slate-200/60 dark:border-white/5 p-6 shadow-[0_2px_12px_rgba(11,28,48,0.02)] space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-100 dark:border-white/5">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-xs font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-lg border border-sky-200">
                    02
                  </span>
                  <div>
                    <h2 className="font-display font-bold text-base text-slate-900 dark:text-zinc-100 tracking-tight leading-none">
                      Sampling Team Technical Review
                    </h2>
                    <span className="text-[11px] text-slate-400 mt-0.5 block">
                      Substrate evaluation, mill stock checks, and technical feasibility verdict
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] font-mono font-medium border ${
                      activeRequest.samplingSeenAt
                        ? "bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300"
                        : "bg-slate-100 text-slate-600 border-slate-200 dark:bg-zinc-800"
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>
                      {activeRequest.samplingSeenAt
                        ? `Seen: ${formatDateAdded(activeRequest.samplingSeenAt)}`
                        : "Awaiting Sampling Inspection"}
                    </span>
                  </span>

                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] font-mono font-bold border ${
                      samplingOk
                        ? "bg-emerald-50 text-[#006d32] border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300"
                        : activeRequest.samplingVerdict
                        ? "bg-amber-50 text-amber-800 border-amber-200"
                        : "bg-slate-100 text-slate-600 border-slate-200 dark:bg-zinc-800"
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{activeRequest.samplingVerdict || "Pending Sign-Off"}</span>
                  </span>
                </div>
              </div>

              {/* Remarks View Card */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-zinc-900/40 border border-slate-200/60 dark:border-white/5 space-y-1.5">
                  <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">
                    Review Status &amp; Signee
                  </span>
                  <div className="font-semibold text-slate-900 dark:text-zinc-100 text-sm">
                    {activeRequest.samplingVerdict || "Awaiting Technical Sign-off"}
                    {activeRequest.samplingSignedBy && (
                      <span className="text-xs text-slate-500 font-normal">
                        {" "}— signed by <strong>{activeRequest.samplingSignedBy}</strong>
                      </span>
                    )}
                  </div>
                  {activeRequest.samplingSignedAt && (
                    <div className="text-[11px] text-slate-500 font-mono">
                      Timestamp: {formatOdooLogDate(activeRequest.samplingSignedAt)}
                    </div>
                  )}
                </div>

                <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-zinc-900/40 border border-slate-200/60 dark:border-white/5 space-y-1.5">
                  <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">
                    Technical Observations &amp; Remarks
                  </span>
                  <div className="text-slate-800 dark:text-zinc-200 leading-relaxed font-sans">
                    {activeRequest.samplingRemark || (
                      <span className="italic text-slate-400">No technical remarks recorded yet by Sampling Team.</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Operator Submission Form */}
              {isSamplingMode && (
                <div className="p-4 rounded-2xl bg-sky-50/50 dark:bg-sky-950/20 border border-sky-200/80 dark:border-sky-900/60 space-y-3.5">
                  <span className="font-display font-bold text-xs text-sky-950 dark:text-sky-200 block">
                    Submit Technical Sign-Off as Sampling Team
                  </span>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                        Sign-off Decision
                      </label>
                      <select
                        value={samplingVerdictInput}
                        onChange={(e) => setSamplingVerdictInput(e.target.value as any)}
                        className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100"
                      >
                        <option value="Feasible">✓ Feasible &amp; Signed Off</option>
                        <option value="Revisions Required">⚠️ Revisions Required</option>
                        <option value="Not Feasible">✕ Not Feasible</option>
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                        Technical Observations &amp; Lab Notes
                      </label>
                      <input
                        type="text"
                        value={samplingRemarkInput}
                        onChange={(e) => setSamplingRemarkInput(e.target.value)}
                        placeholder="e.g. Grammage verified, mill stock confirmed, tolerances approved..."
                        className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      disabled={isSubmittingSampReview}
                      onClick={handleSubmitSamplingReview}
                      className="px-5 py-2 bg-[#006d32] hover:bg-[#00883e] text-white rounded-xl text-xs font-semibold shadow-[0_4px_14px_rgba(0,109,50,0.25)] transition cursor-pointer disabled:opacity-50"
                    >
                      {isSubmittingSampReview ? "Submitting..." : "Submit Technical Sign-Off"}
                    </button>
                  </div>
                </div>
              )}

              {/* Material Substrates In-Context Summary Table */}
              <div className="pt-2 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono uppercase font-bold text-slate-500">
                    Program Material Substrates to Review ({rows.length} Lines)
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveSection("matrix")}
                    className="text-xs text-[#006d32] dark:text-[#00d166] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <span>Open Full Specification Matrix Grid</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="border border-slate-200/80 dark:border-zinc-700/80 rounded-xl overflow-hidden bg-slate-50/50 dark:bg-zinc-900/30">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100/70 dark:bg-zinc-800/60 text-slate-600 dark:text-zinc-300 font-bold text-[10.5px]">
                        <th className="p-2.5 border-r border-slate-200 dark:border-zinc-700 w-8 text-center">#</th>
                        <th className="p-2.5 border-r border-slate-200 dark:border-zinc-700">Material Type</th>
                        <th className="p-2.5 border-r border-slate-200 dark:border-zinc-700">Supplier / Grade</th>
                        <th className="p-2.5 border-r border-slate-200 dark:border-zinc-700">Caliper / Wt</th>
                        <th className="p-2.5 border-r border-slate-200 dark:border-zinc-700 text-right">Qty</th>
                        <th className="p-2.5">Technical Lab Remark</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row, idx) => (
                        <tr key={row.id} className="border-t border-slate-100 dark:border-zinc-800">
                          <td className="p-2.5 border-r border-slate-100 dark:border-zinc-800 text-center font-mono text-slate-400 text-[11px]">
                            {idx + 1}
                          </td>
                          <td className="p-2.5 border-r border-slate-100 dark:border-zinc-800 font-semibold text-slate-900 dark:text-zinc-100">
                            {row.materialType || "—"}
                          </td>
                          <td className="p-2.5 border-r border-slate-100 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 font-mono text-[11px]">
                            {row.supplierName || "—"} {row.grade ? `(${row.grade})` : ""}
                          </td>
                          <td className="p-2.5 border-r border-slate-100 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 font-mono text-[11px]">
                            {row.caliperWt || "—"}
                          </td>
                          <td className="p-2.5 border-r border-slate-100 dark:border-zinc-800 text-right font-mono font-bold text-slate-900 dark:text-zinc-100">
                            {row.quantity} {row.unit}
                          </td>
                          <td className="p-2.5 text-xs text-slate-700 dark:text-zinc-300">
                            {isSamplingMode ? (
                              <input
                                type="text"
                                value={row.sampRemarkText}
                                onChange={(e) => updateSampRemarkText(row.id, e.target.value)}
                                onBlur={() => handleSaveSingleRowRemark(row.id)}
                                placeholder="Add lab remark..."
                                className="w-full px-2.5 py-1 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs"
                              />
                            ) : row.sampRemarkText ? (
                              <span className="italic text-sky-900 dark:text-sky-200">&quot;{row.sampRemarkText}&quot;</span>
                            ) : (
                              <span className="text-slate-400 text-[11px] font-mono">Pending lab check</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Bottom Section 2 Navigator */}
              {activeSection === "sampling" && (
                <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-white/5 flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveSection("matrix")}
                    className="px-4 py-2 rounded-xl bg-white dark:bg-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 text-xs font-semibold flex items-center gap-2 transition cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to 1. Material Matrix</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveSection("plant")}
                    className="px-4 py-2 rounded-xl bg-white dark:bg-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 text-xs font-semibold flex items-center gap-2 transition cursor-pointer shadow-2xs hover:border-[#006d32]"
                  >
                    <span>Proceed to 3. Plant Manufacturing Review</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#006d32] dark:text-[#00d166]" />
                  </button>
                </div>
              )}
            </div>
            )}

            {/* ════════════════════════════════════════════════════════════════
                SECTION 3: PLANT TEAM REVIEW
            ════════════════════════════════════════════════════════════════ */}
            {(activeSection === "plant" || activeSection === "all") && (
            <div className="bg-white dark:bg-[#12141d] rounded-2xl border border-slate-200/60 dark:border-white/5 p-6 shadow-[0_2px_12px_rgba(11,28,48,0.02)] space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-100 dark:border-white/5">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-xs font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-lg border border-teal-200">
                    03
                  </span>
                  <div>
                    <h2 className="font-display font-bold text-base text-slate-900 dark:text-zinc-100 tracking-tight leading-none">
                      Plant Team Manufacturing Review
                    </h2>
                    <span className="text-[11px] text-slate-400 mt-0.5 block">
                      Target Plant: <strong>{activeRequest.targetPlant || "1505-Nadiad"}</strong> · Tooling dies, press bed sizing &amp; shop-floor feasibility
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] font-mono font-medium border ${
                      activeRequest.plantSeenAt
                        ? "bg-teal-50 text-teal-800 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300"
                        : "bg-slate-100 text-slate-600 border-slate-200 dark:bg-zinc-800"
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>
                      {activeRequest.plantSeenAt
                        ? `Seen: ${formatDateAdded(activeRequest.plantSeenAt)}`
                        : "Awaiting Plant Inspection"}
                    </span>
                  </span>

                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] font-mono font-bold border ${
                      plantOk
                        ? "bg-teal-50 text-teal-800 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300"
                        : activeRequest.plantVerdict
                        ? "bg-amber-50 text-amber-800 border-amber-200"
                        : "bg-slate-100 text-slate-600 border-slate-200 dark:bg-zinc-800"
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{activeRequest.plantVerdict || "Pending Sign-Off"}</span>
                  </span>
                </div>
              </div>

              {/* Plant Shop-Floor Capacity Metric Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-zinc-900/40 border border-slate-200/60 dark:border-white/5">
                  <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">Assigned Plant</span>
                  <div className="font-bold text-slate-900 dark:text-zinc-100 text-sm mt-0.5">{activeRequest.targetPlant || "1505-Nadiad"}</div>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-zinc-900/40 border border-slate-200/60 dark:border-white/5">
                  <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">Total Program Volume</span>
                  <div className="font-bold text-slate-900 dark:text-zinc-100 text-sm mt-0.5">{totalQuantity.toLocaleString()} pcs</div>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-zinc-900/40 border border-slate-200/60 dark:border-white/5">
                  <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">SKU Specifications</span>
                  <div className="font-bold text-slate-900 dark:text-zinc-100 text-sm mt-0.5">{rows.length} Material Types</div>
                </div>
              </div>

              {/* Remarks View Card */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-zinc-900/40 border border-slate-200/60 dark:border-white/5 space-y-1.5">
                  <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">
                    Manufacturing Assessment
                  </span>
                  <div className="font-semibold text-slate-900 dark:text-zinc-100 text-sm">
                    {activeRequest.plantVerdict || "Awaiting Manufacturing Assessment"}
                    {activeRequest.plantSignedBy && (
                      <span className="text-xs text-slate-500 font-normal">
                        {" "}— signed by <strong>{activeRequest.plantSignedBy}</strong>
                      </span>
                    )}
                  </div>
                  {activeRequest.plantSignedAt && (
                    <div className="text-[11px] text-slate-500 font-mono">
                      Timestamp: {formatOdooLogDate(activeRequest.plantSignedAt)}
                    </div>
                  )}
                </div>

                <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-zinc-900/40 border border-slate-200/60 dark:border-white/5 space-y-1.5">
                  <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">
                    Tooling &amp; Production Remarks
                  </span>
                  <div className="text-slate-800 dark:text-zinc-200 leading-relaxed font-sans">
                    {activeRequest.plantRemark || (
                      <span className="italic text-slate-400">No manufacturing remarks recorded yet by Plant Team.</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Plant Operator Submission Form */}
              {isPlantMode && (
                <div className="p-4 rounded-2xl bg-teal-50/50 dark:bg-teal-950/20 border border-teal-200/80 dark:border-teal-900/60 space-y-3.5">
                  <span className="font-display font-bold text-xs text-teal-950 dark:text-teal-200 block">
                    Submit Manufacturing Sign-Off as Plant Desk ({activeRequest.targetPlant || "1505-Nadiad"})
                  </span>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                        Manufacturing Decision
                      </label>
                      <select
                        value={plantVerdictInput}
                        onChange={(e) => setPlantVerdictInput(e.target.value as any)}
                        className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100"
                      >
                        <option value="Capacity Confirmed">✓ Capacity Confirmed</option>
                        <option value="Tooling Constrained">⚠️ Tooling Constrained</option>
                        <option value="Not Feasible">✕ Not Feasible</option>
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                        Production Remarks &amp; Tooling Dies
                      </label>
                      <input
                        type="text"
                        value={plantRemarkInput}
                        onChange={(e) => setPlantRemarkInput(e.target.value)}
                        placeholder="e.g. Tooling dies ready, press bed scheduled for trial, confirmed runnability..."
                        className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      disabled={isSubmittingPlantReview}
                      onClick={handleSubmitPlantReview}
                      className="px-5 py-2 bg-[#006d32] hover:bg-[#00883e] text-white rounded-xl text-xs font-semibold shadow-[0_4px_14px_rgba(0,109,50,0.25)] transition cursor-pointer disabled:opacity-50"
                    >
                      {isSubmittingPlantReview ? "Submitting..." : "Submit Plant Sign-Off"}
                    </button>
                  </div>
                </div>
              )}

              {/* Bottom Section 3 Navigator */}
              {activeSection === "plant" && (
                <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-white/5 flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveSection("sampling")}
                    className="px-4 py-2 rounded-xl bg-white dark:bg-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 text-xs font-semibold flex items-center gap-2 transition cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to 2. Sampling Review</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveSection("matrix")}
                    className="px-4 py-2 rounded-xl bg-white dark:bg-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 text-xs font-semibold flex items-center gap-2 transition cursor-pointer"
                  >
                    <span>View Full Material Matrix</span>
                  </button>
                </div>
              )}
            </div>
            )}

          </div>

          {/* RIGHT: PURE ACTIVITY & AUDIT LOG (NO CHAT SECTION) */}
          <ProgramChatterFeed
            request={activeRequest}
            materialRows={rows}
            isSamplingMode={isSamplingMode}
            isPlantMode={isPlantMode}
            currentUser={effectiveUser}
          />
        </div>
      </div>
    </div>
  );
};

export default ProgramPlanningInspectorModal;
