import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  Check,
  CheckCircle2,
  AlertCircle,
  Building2,
  Copy,
  Layers,
  MessageSquare,
  Highlighter,
  Clock,
  Trash2,
  Plus,
  Send,
  RefreshCw,
  Calendar,
  FileText,
  ExternalLink,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Info,
} from "lucide-react";
import { SampleRequestItem } from "../../types";
import {
  updateBatchProgramSampRemarksApi,
  updateSingleMaterialSampRemarkApi,
  updateProgramRequestStatusApi,
  addProgramMaterialApi,
  deleteProgramMaterialApi,
  addProgramNoteApi,
  mapProgramRequestToSampleRequest,
} from "@/infrastructure/api/programsApi";
import {
  ProgramChatterFeed,
  ProgramMaterialReviewItem,
  isMaterialAddedRecently,
} from "./ProgramChatterFeed";
import { UserProfile } from "@/features/auth";

export interface ProgramPlanningInspectorModalProps {
  request: SampleRequestItem | null;
  isOpen: boolean;
  onClose: () => void;
  onRefresh?: () => Promise<void>;
  mode?: "marketing" | "sampling";
  userRole?: string;
  user?: UserProfile | null;
  currentUser?: UserProfile | null;
  onDeleteRequest?: (req: SampleRequestItem) => void;
}

import { parseSampRemark, formatSampRemark } from "../utils/programRemarkUtils";
export { parseSampRemark, formatSampRemark };

export const ProgramPlanningInspectorModal: React.FC<ProgramPlanningInspectorModalProps> = ({
  request,
  isOpen,
  onClose,
  onRefresh,
  mode = "marketing",
  userRole,
  user,
  currentUser,
  onDeleteRequest,
}) => {
  const isSamplingMode = mode === "sampling";

  // Tab State: 1. specs (Material Matrix), 2. scope (Campaign Scope), 3. plant (Plant Specs)
  const [activeTab, setActiveTab] = useState<"specs" | "scope" | "plant">("specs");

  // Keep synced internal request for immediate chatter & status updates
  const [internalRequest, setInternalRequest] = useState<SampleRequestItem | null>(null);

  // Local state for material matrix rows
  const [rows, setRows] = useState<ProgramMaterialReviewItem[]>([]);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savingRowId, setSavingRowId] = useState<number | string | null>(null);
  const [savedRowId, setSavedRowId] = useState<number | string | null>(null);
  const [deletingRowId, setDeletingRowId] = useState<number | string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Inline "Add a Line" Row state (Marketing capability)
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

  // Initialize internalRequest when prop changes
  useEffect(() => {
    if (request) {
      setInternalRequest(request);
    }
  }, [request]);

  // Single Source of Truth
  const activeRequest: SampleRequestItem | null = internalRequest || request;

  // Sync rows from activeRequest
  useEffect(() => {
    if (!activeRequest) return;
    setSaveSuccess(false);
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

  // Derived states
  const isReviewed = useMemo(() => {
    if (!activeRequest?.status) return false;
    const st = activeRequest.status.toLowerCase();
    return st.includes("reviewed") || st.includes("approved");
  }, [activeRequest?.status]);

  const isProduction = useMemo(() => {
    if (!activeRequest?.status) return false;
    const st = activeRequest.status.toLowerCase();
    return st.includes("prod") || st.includes("handoff") || st.includes("dispatch");
  }, [activeRequest?.status]);

  // Clean narrative for Tab 2
  const cleanNarrative = useMemo(() => {
    const raw = activeRequest?.productDescription || "";
    // Strip technical matrix serialization if present
    const splitIndex = raw.indexOf("\n\nMaterial Specification Matrix:");
    if (splitIndex !== -1) {
      return raw.substring(0, splitIndex).trim();
    }
    return raw;
  }, [activeRequest?.productDescription]);

  if (!isOpen || !activeRequest) return null;

  // Toggle highlight for a specific column in a row (Sampling Team capability)
  const toggleColumnHighlight = (rowId: number | string, colId: string) => {
    if (!isSamplingMode) return;
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== rowId) return r;
        const exists = r.highlightedCols.includes(colId);
        const nextCols = exists
          ? r.highlightedCols.filter((c) => c !== colId)
          : [...r.highlightedCols, colId];
        return { ...r, highlightedCols: nextCols };
      })
    );
  };

  // Update text remark for a row
  const updateSampRemarkText = (rowId: number | string, text: string) => {
    setRows((prev) =>
      prev.map((r) => (r.id === rowId ? { ...r, sampRemarkText: text } : r))
    );
  };

  // Append a quick tag to remark
  const appendQuickTag = (rowId: number | string, tag: string) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== rowId) return r;
        const current = r.sampRemarkText.trim();
        const nextText = current ? `${current} • [${tag}]` : `[${tag}]`;
        return { ...r, sampRemarkText: nextText };
      })
    );
  };

  const handleCopyCode = () => {
    const code = activeRequest.srNumber || activeRequest.materialCode || `PG-${activeRequest.id}`;
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 1500);
  };

  // Add communication note to program request chatter
  const handleAddNote = async (note: string) => {
    if (!activeRequest?.id) return;
    try {
      const updated = await addProgramNoteApi(activeRequest.id, note);
      const mapped = mapProgramRequestToSampleRequest(updated);
      setInternalRequest(mapped);
      if (onRefresh) {
        await onRefresh();
      }
    } catch (err: any) {
      console.error("Failed to add note to program request:", err);
      throw err;
    }
  };

  // Delete a material row specification
  const handleDeleteRow = async (rowId: number | string) => {
    if (!activeRequest?.id) return;
    setDeletingRowId(rowId);
    setErrorMessage(null);

    try {
      const updated = await deleteProgramMaterialApi(activeRequest.id, rowId);
      const mapped = mapProgramRequestToSampleRequest(updated);
      setInternalRequest(mapped);
      if (onRefresh) {
        await onRefresh();
      }
    } catch (err: any) {
      console.error("Failed to delete material row:", err);
      setErrorMessage(err?.message || "Failed to remove material line.");
    } finally {
      setDeletingRowId(null);
    }
  };

  // Save single row SAMP remark + flags
  const handleSaveSingleRowRemark = async (rowId: number | string) => {
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
        const mapped = mapProgramRequestToSampleRequest(updatedRecord);
        setInternalRequest(mapped);
      }

      setSavedRowId(rowId);
      setTimeout(() => setSavedRowId(null), 2500);

      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("samp:requests-changed"));
      }
      if (onRefresh) {
        await onRefresh();
      }
    } catch (err: any) {
      console.error("Failed to save row remark via API:", err);
      setErrorMessage(err?.message || "Failed to save sampling remark.");
    } finally {
      setSavingRowId(null);
    }
  };

  // Save new inline material row (Marketing "+ Add a Line")
  const handleSaveNewInlineRow = async () => {
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
      const mapped = mapProgramRequestToSampleRequest(updated);
      setInternalRequest(mapped);

      setIsAddingRow(false);
      setNewMaterialType("");
      setNewSupplierName("");
      setNewGrade("");
      setNewColorVariant("");
      setNewCaliperWt("");
      setNewQuantity("");
      setNewRemark("");

      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("samp:requests-changed"));
      }
      if (onRefresh) {
        await onRefresh();
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to add material row to program matrix.");
    } finally {
      setIsSavingNewRow(false);
    }
  };

  // Mark Program as Reviewed by SAMP Team (Final Sign-off)
  const handleMarkAsReviewed = async () => {
    if (!activeRequest?.id || isSaving) return;
    setIsSaving(true);
    setErrorMessage(null);
    try {
      // 1. Batch save all current remarks and highlighted column tags
      const payloadRemarks = rows
        .filter((r) => r.sampRemarkText.trim() || r.highlightedCols.length > 0)
        .map((r) => ({
          material_id: Number(r.id),
          samp_remark: formatSampRemark(r.sampRemarkText, r.highlightedCols),
        }));

      if (payloadRemarks.length > 0) {
        await updateBatchProgramSampRemarksApi(activeRequest.id, payloadRemarks);
      }

      // 2. Advance status to Reviewed by SAMP
      const updatedRecord = await updateProgramRequestStatusApi(activeRequest.id, "Reviewed by SAMP");
      if (updatedRecord) {
        const mapped = mapProgramRequestToSampleRequest(updatedRecord);
        setInternalRequest(mapped);
      }

      setSaveSuccess(true);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("samp:requests-changed"));
      }
      if (onRefresh) {
        await onRefresh();
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to mark program planning as reviewed.");
    } finally {
      setIsSaving(false);
    }
  };

  const totalFlaggedCols = rows.reduce((acc, r) => acc + r.highlightedCols.length, 0);
  const totalRemarksEntered = rows.filter((r) => r.sampRemarkText.trim() || r.highlightedCols.length > 0).length;


  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-[96vw] xl:max-w-7xl h-[92vh] max-h-[92vh] flex flex-col bg-slate-50 dark:bg-[#0c0d12] border border-zinc-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden select-text text-xs"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ══════════════════════════════════════════════════════════════════
            1. TOP CONTROL PANEL (MODERN THEME, PROCESS STEPPER)
        ══════════════════════════════════════════════════════════════════ */}
        <div className="bg-white dark:bg-[#161822] border-b border-zinc-200 dark:border-white/10 px-5 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* Left Action Buttons */}
          <div className="flex items-center gap-2">
            {isSamplingMode ? (
              <>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleMarkAsReviewed}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition active:scale-95 cursor-pointer disabled:opacity-50 ${
                    isReviewed
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                      : "bg-[#714B67] hover:bg-[#5B3C53] text-white"
                  }`}
                  title="Sign off and record technical evaluation by SAMP Team"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {isSaving
                      ? "Saving Sign-Off..."
                      : isReviewed
                      ? "✓ Update SAMP Sign-Off"
                      : "Sign-Off & Mark as Reviewed"}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer"
                >
                  Close
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                Close
              </button>
            )}

            <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-700 mx-1"></div>

            <button
              type="button"
              onClick={handleCopyCode}
              className="text-zinc-500 hover:text-[#714B67] dark:hover:text-purple-300 font-medium px-2 py-1 text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Copy request tracking reference code"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="font-mono">{copiedCode ? "Copied" : "Copy Reference"}</span>
            </button>

            {onDeleteRequest && (
              <button
                type="button"
                onClick={() => onDeleteRequest(activeRequest)}
                className="text-zinc-400 hover:text-rose-600 font-medium px-2 py-1 text-xs flex items-center gap-1 cursor-pointer transition-colors"
                title="Delete this program planning campaign"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            )}
          </div>

          {/* Right: Modern Linear Process Stepper */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 bg-zinc-50 dark:bg-zinc-900/60 p-1 rounded-xl border border-zinc-200 dark:border-white/[0.08] text-[11px] font-mono">
              {/* Step 1: Intake & Matrix */}
              <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-lg font-bold bg-white dark:bg-zinc-800 text-emerald-700 dark:text-emerald-400 shadow-2xs border border-zinc-200 dark:border-zinc-700">
                <Check className="w-3 h-3 stroke-[3]" />
                <span>1. Matrix Created</span>
              </div>

              <span className="text-zinc-300 dark:text-zinc-700">→</span>

              {/* Step 2: SAMP Review */}
              <div
                className={`flex items-center gap-1 px-2.5 py-0.5 rounded-lg font-bold transition-all ${
                  isReviewed
                    ? "bg-white dark:bg-zinc-800 text-emerald-700 dark:text-emerald-400 shadow-2xs border border-zinc-200 dark:border-zinc-700"
                    : "bg-[#714B67]/10 text-[#714B67] dark:text-purple-300 ring-1 ring-[#714B67]/30"
                }`}
              >
                {isReviewed ? <Check className="w-3 h-3 stroke-[3]" /> : <Clock className="w-3 h-3" />}
                <span>2. SAMP Review</span>
              </div>

              <span className="text-zinc-300 dark:text-zinc-700">→</span>

              {/* Step 3: Reviewed by SAMP Team */}
              <div
                className={`flex items-center gap-1 px-2.5 py-0.5 rounded-lg font-bold transition-all ${
                  isReviewed
                    ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500/30"
                    : "text-zinc-400 dark:text-zinc-600"
                }`}
              >
                {isReviewed && <Check className="w-3 h-3 stroke-[3]" />}
                <span>3. Reviewed by SAMP Team</span>
              </div>

              <span className="text-zinc-300 dark:text-zinc-700">→</span>

              {/* Step 4: Plant Production */}
              <div
                className={`flex items-center gap-1 px-2.5 py-0.5 rounded-lg font-bold transition-all ${
                  isProduction
                    ? "bg-purple-50 dark:bg-purple-950/40 text-[#714B67] dark:text-purple-300 ring-1 ring-purple-500/30"
                    : "text-zinc-400 dark:text-zinc-600"
                }`}
              >
                <span>4. Production Handoff</span>
              </div>
            </div>

            {/* Modal Close [X] */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Global Notifications */}
        {saveSuccess && (
          <div className="mx-6 mt-3 px-4 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                ✓ Technical review remarks saved &amp; Program marked as <strong>Reviewed by SAMP Team</strong>!
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSaveSuccess(false)}
              className="text-emerald-700 hover:text-emerald-900 font-mono text-[11px] underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {errorMessage && (
          <div className="mx-6 mt-3 px-4 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
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

        {/* ══════════════════════════════════════════════════════════════════
            2. MAIN WORKSPACE VIEWPORT (SPLIT: DOCUMENT SHEET + CHATTER FEED)
        ══════════════════════════════════════════════════════════════════ */}
        <div className="flex-1 flex overflow-hidden">
          {/* LEFT: FORM SHEET (SPACIOUS DOCUMENT CANVAS) */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
            <div className="max-w-5xl mx-auto rounded-2xl bg-white dark:bg-[#12141d] border border-zinc-200 dark:border-white/10 shadow-xs overflow-hidden">
              
              {/* Header Hero Banner */}
              <div className="p-6 border-b border-zinc-100 dark:border-white/[0.06] bg-zinc-50/50 dark:bg-[#161822]/60">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-[#714B67] dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded-lg border border-purple-200 dark:border-purple-800">
                        Ref: {activeRequest.srNumber || activeRequest.materialCode || `PG-${activeRequest.id}`}
                      </span>
                      <span className="text-zinc-300 dark:text-zinc-700">•</span>
                      <span className="text-xs font-semibold text-zinc-500">
                        Seasonal Program Planning
                      </span>
                      <span className="text-zinc-300 dark:text-zinc-700">•</span>
                      <span className="bg-teal-50 dark:bg-teal-950/40 text-[#017E84] dark:text-[#2dd4bf] text-xs font-mono font-bold px-2 py-0.5 rounded-lg border border-teal-200 dark:border-teal-800">
                        Season {activeRequest.programYear || "2026"}
                      </span>
                    </div>

                    <h1 className="text-xl sm:text-2xl font-bold text-zinc-950 dark:text-zinc-50 tracking-tight font-sans">
                      {activeRequest.programName || activeRequest.productDescription || "Seasonal Program Planning"}
                    </h1>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-zinc-600 dark:text-zinc-400 font-medium pt-1">
                      <div>
                        Customer Account: <strong className="text-zinc-950 dark:text-zinc-100">{activeRequest.customer}</strong>
                      </div>
                      <span>•</span>
                      <div>
                        Target Plant: <strong className="font-mono text-zinc-950 dark:text-zinc-100">{activeRequest.targetPlant || "1505-Nadiad"}</strong>
                      </div>
                      <span>•</span>
                      <div>
                        Created by: <span className="font-mono">{activeRequest.createdBy || "Marketing Specialist"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Status Badge & Metrics */}
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold font-mono border ${
                        isReviewed
                          ? "bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                          : "bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800"
                      }`}
                    >
                      {isReviewed ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Clock className="w-4 h-4 text-amber-600" />}
                      <span>{isReviewed ? "Reviewed by SAMP Team" : "Pending SAMP Review"}</span>
                    </span>

                    <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-500">
                      <span><strong>{rows.length}</strong> SKUs</span>
                      <span>•</span>
                      <span><strong>{totalRemarksEntered}</strong> Evaluated</span>
                      {totalFlaggedCols > 0 && (
                        <>
                          <span>•</span>
                          <span className="text-amber-600 font-bold">⚠️ {totalFlaggedCols} Flags</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* In-Context Spotlight Card for Marketing Mode when Signed Off */}
              {!isSamplingMode && isReviewed && (
                <div className="mx-6 mt-5 p-4 rounded-xl bg-gradient-to-r from-emerald-50/70 to-teal-50/70 dark:from-emerald-950/30 dark:to-teal-950/30 border border-emerald-200 dark:border-emerald-800/60 shadow-2xs">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-emerald-950 dark:text-emerald-100">
                            SAMP Team Technical Sign-Off Verified
                          </h4>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-200/60 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200">
                            Sign-Off Complete
                          </span>
                        </div>
                        <p className="text-xs text-emerald-800/90 dark:text-emerald-300/90 mt-0.5 leading-relaxed">
                          All {rows.length} material specification lines have been evaluated by the SAMP Team.
                          {totalFlaggedCols > 0 ? (
                            <span className="font-semibold text-amber-800 dark:text-amber-300 ml-1">
                              Note: {totalFlaggedCols} column{totalFlaggedCols > 1 ? "s were" : " was"} flagged for tolerance or grade adjustment.
                            </span>
                          ) : (
                            <span className="ml-1">No revision blockers were flagged. Ready for plant production handoff.</span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-emerald-700/80 dark:text-emerald-400/80 block">
                        Assigned Plant Center
                      </span>
                      <span className="text-sm font-bold font-mono text-emerald-900 dark:text-emerald-200">
                        {activeRequest.targetPlant || "1505-Nadiad"}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* In-Context Banner for SAMP Team Mode */}
              {isSamplingMode && (
                <div className="mx-6 mt-5 p-4 rounded-xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200/80 dark:border-purple-900/60 flex items-center justify-between gap-3 flex-wrap shadow-2xs">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#714B67] text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Highlighter className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
                        SAMP Team Evaluation Workbench
                      </h4>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                        Click any column to highlight/flag items for revision · Record remarks per row · Click Sign-Off when complete
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-[#714B67] dark:text-purple-300">
                      {totalRemarksEntered} of {rows.length} lines evaluated
                    </span>
                    {totalFlaggedCols > 0 && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 border border-amber-300">
                        {totalFlaggedCols} Flags
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Notebook Tab Strip */}
              <div className="px-6 pb-6 pt-4">
                <div className="border-b border-zinc-200 dark:border-white/10 flex items-center space-x-6 text-xs font-semibold overflow-x-auto">
                  <button
                    type="button"
                    onClick={() => setActiveTab("specs")}
                    className={`pb-3 border-b-2 transition cursor-pointer select-none flex items-center gap-2 whitespace-nowrap ${
                      activeTab === "specs"
                        ? "border-[#714B67] text-[#714B67] dark:text-purple-300 font-bold"
                        : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                    }`}
                  >
                    <span>1. Material Specification Matrix</span>
                    <span className="px-2 py-0.5 rounded-full text-[10.5px] font-mono bg-purple-100 dark:bg-purple-950/60 text-[#714B67] dark:text-purple-300 font-bold">
                      {rows.length} Lines
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("scope")}
                    className={`pb-3 border-b-2 transition cursor-pointer select-none flex items-center gap-1.5 whitespace-nowrap ${
                      activeTab === "scope"
                        ? "border-[#714B67] text-[#714B67] dark:text-purple-300 font-bold"
                        : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                    }`}
                  >
                    <span>2. Campaign Scope &amp; Fulfillment</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("plant")}
                    className={`pb-3 border-b-2 transition cursor-pointer select-none flex items-center gap-1.5 whitespace-nowrap ${
                      activeTab === "plant"
                        ? "border-[#714B67] text-[#714B67] dark:text-purple-300 font-bold"
                        : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                    }`}
                  >
                    <span>3. Plant Execution Center</span>
                  </button>
                </div>

                {/* ══════════════════════════════════════════════════════════════════
                    TAB 1: MATERIAL SPECIFICATIONS TABLE
                ══════════════════════════════════════════════════════════════════ */}
                {activeTab === "specs" && (
                  <div className="py-4 space-y-4">
                    {/* Controls Row */}
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2 text-xs text-zinc-500">
                        <span>Direct material allocations across paper, board, calipers, and accessories.</span>
                        {isSamplingMode && (
                          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono font-bold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-lg border border-amber-200">
                            💡 Tip: Click column cells to flag revision items
                          </span>
                        )}
                      </div>

                      {/* "+ Add a Line" Button (Marketing only) */}
                      {!isSamplingMode && !isAddingRow && (
                        <button
                          type="button"
                          onClick={() => setIsAddingRow(true)}
                          className="bg-[#017E84] hover:bg-[#00666A] text-white text-xs font-semibold px-3 py-1.5 rounded-xl shadow-xs flex items-center gap-1.5 transition cursor-pointer active:scale-95"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>+ Add a Line</span>
                        </button>
                      )}
                    </div>

                    {/* Table Container */}
                    <div className="border border-zinc-200 dark:border-zinc-700/80 rounded-xl overflow-x-auto shadow-xs bg-white dark:bg-[#12141d]">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-700/80 text-zinc-600 dark:text-zinc-300 font-bold text-[11px] select-none">
                            <th className="p-3 border-r border-zinc-200 dark:border-zinc-700/80 w-10 text-center">#</th>
                            <th className="p-3 border-r border-zinc-200 dark:border-zinc-700/80">Type</th>
                            <th className="p-3 border-r border-zinc-200 dark:border-zinc-700/80">Supplier</th>
                            <th className="p-3 border-r border-zinc-200 dark:border-zinc-700/80">Grade</th>
                            <th className="p-3 border-r border-zinc-200 dark:border-zinc-700/80">Color</th>
                            <th className="p-3 border-r border-zinc-200 dark:border-zinc-700/80">Caliper / Wt</th>
                            <th className="p-3 border-r border-zinc-200 dark:border-zinc-700/80 text-right">Qty</th>
                            <th className="p-3 border-r border-zinc-200 dark:border-zinc-700/80">Unit</th>
                            <th className="p-3 border-r border-zinc-200 dark:border-zinc-700/80 max-w-[140px]">Marketing Note</th>
                            <th className="p-3 min-w-[280px]">SAMP Technical Review &amp; Remarks</th>
                            {!isSamplingMode && (
                              <th className="p-3 border-l border-zinc-200 dark:border-zinc-700/80 w-12 text-center">Act</th>
                            )}
                          </tr>
                        </thead>

                        <tbody>
                          {rows.map((row, idx) => {
                            const isCellFlagged = (col: string) => row.highlightedCols.includes(col);
                            const isRecent = row.isNewAdded || isMaterialAddedRecently(row.createdAt);

                            return (
                              <tr
                                key={row.id}
                                className="border-b border-zinc-100 dark:border-zinc-800/80 hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors"
                              >
                                {/* Line # */}
                                <td className="p-3 border-r border-zinc-100 dark:border-zinc-800/80 text-center font-mono text-zinc-400">
                                  <span>{idx + 1}</span>
                                  {isRecent && (
                                    <span className="block text-[8px] font-mono font-bold bg-emerald-500 text-white px-0.5 rounded mt-0.5 uppercase">
                                      New
                                    </span>
                                  )}
                                </td>

                                {/* Type */}
                                <td
                                  onClick={() => toggleColumnHighlight(row.id, "material_type")}
                                  className={`p-3 border-r border-zinc-100 dark:border-zinc-800/80 font-semibold transition-colors ${
                                    isCellFlagged("material_type")
                                      ? "bg-amber-100 text-amber-950 dark:bg-amber-950/60 dark:text-amber-200 font-bold"
                                      : "text-zinc-900 dark:text-zinc-100"
                                  } ${isSamplingMode ? "cursor-pointer hover:bg-amber-50 dark:hover:bg-amber-950/40" : ""}`}
                                  title={isSamplingMode ? "Click to toggle revision flag" : undefined}
                                >
                                  <div className="flex items-center justify-between gap-1.5">
                                    <span>{row.materialType || "—"}</span>
                                    {isCellFlagged("material_type") && (
                                      <span className="text-[9px] px-1 rounded bg-amber-400 text-amber-950 font-mono font-bold shrink-0">
                                        Flag
                                      </span>
                                    )}
                                  </div>
                                </td>

                                {/* Supplier */}
                                <td
                                  onClick={() => toggleColumnHighlight(row.id, "supplier_name")}
                                  className={`p-3 border-r border-zinc-100 dark:border-zinc-800/80 transition-colors ${
                                    isCellFlagged("supplier_name")
                                      ? "bg-amber-100 text-amber-950 dark:bg-amber-950/60 dark:text-amber-200 font-bold"
                                      : "text-zinc-600 dark:text-zinc-400"
                                  } ${isSamplingMode ? "cursor-pointer hover:bg-amber-50 dark:hover:bg-amber-950/40" : ""}`}
                                  title={isSamplingMode ? "Click to toggle revision flag" : undefined}
                                >
                                  <div className="flex items-center justify-between gap-1.5">
                                    <span>{row.supplierName || "—"}</span>
                                    {isCellFlagged("supplier_name") && (
                                      <span className="text-[9px] px-1 rounded bg-amber-400 text-amber-950 font-mono font-bold shrink-0">
                                        Flag
                                      </span>
                                    )}
                                  </div>
                                </td>

                                {/* Grade */}
                                <td
                                  onClick={() => toggleColumnHighlight(row.id, "grade")}
                                  className={`p-3 border-r border-zinc-100 dark:border-zinc-800/80 font-mono transition-colors ${
                                    isCellFlagged("grade")
                                      ? "bg-amber-100 text-amber-950 dark:bg-amber-950/60 dark:text-amber-200 font-bold"
                                      : "text-zinc-600 dark:text-zinc-400"
                                  } ${isSamplingMode ? "cursor-pointer hover:bg-amber-50 dark:hover:bg-amber-950/40" : ""}`}
                                  title={isSamplingMode ? "Click to toggle revision flag" : undefined}
                                >
                                  <div className="flex items-center justify-between gap-1.5">
                                    <span>{row.grade || "—"}</span>
                                    {isCellFlagged("grade") && (
                                      <span className="text-[9px] px-1 rounded bg-amber-400 text-amber-950 font-mono font-bold shrink-0">
                                        Flag
                                      </span>
                                    )}
                                  </div>
                                </td>

                                {/* Color */}
                                <td
                                  onClick={() => toggleColumnHighlight(row.id, "color_variant")}
                                  className={`p-3 border-r border-zinc-100 dark:border-zinc-800/80 transition-colors ${
                                    isCellFlagged("color_variant")
                                      ? "bg-amber-100 text-amber-950 dark:bg-amber-950/60 dark:text-amber-200 font-bold"
                                      : "text-zinc-600 dark:text-zinc-400"
                                  } ${isSamplingMode ? "cursor-pointer hover:bg-amber-50 dark:hover:bg-amber-950/40" : ""}`}
                                  title={isSamplingMode ? "Click to toggle revision flag" : undefined}
                                >
                                  <div className="flex items-center justify-between gap-1.5">
                                    <span>{row.colorVariant || "—"}</span>
                                    {isCellFlagged("color_variant") && (
                                      <span className="text-[9px] px-1 rounded bg-amber-400 text-amber-950 font-mono font-bold shrink-0">
                                        Flag
                                      </span>
                                    )}
                                  </div>
                                </td>

                                {/* Caliper / WT */}
                                <td
                                  onClick={() => toggleColumnHighlight(row.id, "caliper_wt")}
                                  className={`p-3 border-r border-zinc-100 dark:border-zinc-800/80 font-mono transition-colors ${
                                    isCellFlagged("caliper_wt")
                                      ? "bg-amber-100 text-amber-950 dark:bg-amber-950/60 dark:text-amber-200 font-bold"
                                      : "text-zinc-600 dark:text-zinc-400"
                                  } ${isSamplingMode ? "cursor-pointer hover:bg-amber-50 dark:hover:bg-amber-950/40" : ""}`}
                                  title={isSamplingMode ? "Click to toggle revision flag" : undefined}
                                >
                                  <div className="flex items-center justify-between gap-1.5">
                                    <span>{row.caliperWt || "—"}</span>
                                    {isCellFlagged("caliper_wt") && (
                                      <span className="text-[9px] px-1 rounded bg-amber-400 text-amber-950 font-mono font-bold shrink-0">
                                        Flag
                                      </span>
                                    )}
                                  </div>
                                </td>

                                {/* Qty */}
                                <td
                                  onClick={() => toggleColumnHighlight(row.id, "quantity")}
                                  className={`p-3 border-r border-zinc-100 dark:border-zinc-800/80 text-right font-mono font-bold transition-colors ${
                                    isCellFlagged("quantity")
                                      ? "bg-amber-100 text-amber-950 dark:bg-amber-950/60 dark:text-amber-200 font-bold"
                                      : "text-zinc-900 dark:text-zinc-100"
                                  } ${isSamplingMode ? "cursor-pointer hover:bg-amber-50 dark:hover:bg-amber-950/40" : ""}`}
                                  title={isSamplingMode ? "Click to toggle revision flag" : undefined}
                                >
                                  <span>{row.quantity}</span>
                                </td>

                                {/* Unit */}
                                <td className="p-3 border-r border-zinc-100 dark:border-zinc-800/80 text-zinc-500 font-mono">
                                  <span>{row.unit}</span>
                                </td>

                                {/* Marketing Remark */}
                                <td className="p-3 border-r border-zinc-100 dark:border-zinc-800/80 text-zinc-600 dark:text-zinc-400 italic max-w-[140px] truncate">
                                  <span>{row.remark || "—"}</span>
                                </td>

                                {/* SAMP Technical Review & Remark Cell */}
                                <td className="p-3">
                                  {isSamplingMode ? (
                                    <div className="space-y-2">
                                      {/* Flagged summary chips */}
                                      {row.highlightedCols.length > 0 && (
                                        <div className="flex flex-wrap items-center gap-1.5">
                                          <span className="text-[10px] font-mono font-bold text-amber-800 dark:text-amber-300">
                                            ⚠️ Flagged:
                                          </span>
                                          {row.highlightedCols.map((c) => (
                                            <span
                                              key={c}
                                              className="px-1.5 py-0.5 rounded text-[9.5px] font-mono bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 border border-amber-300"
                                            >
                                              {c}
                                            </span>
                                          ))}
                                          <button
                                            type="button"
                                            onClick={() =>
                                              setRows((prev) =>
                                                prev.map((r) =>
                                                  r.id === row.id ? { ...r, highlightedCols: [] } : r
                                                )
                                              )
                                            }
                                            className="text-[9.5px] text-rose-600 hover:underline cursor-pointer ml-1 font-mono"
                                          >
                                            Clear
                                          </button>
                                        </div>
                                      )}

                                      {/* Input + Save Button */}
                                      <div className="flex items-center gap-2">
                                        <input
                                          type="text"
                                          value={row.sampRemarkText}
                                          onChange={(e) => updateSampRemarkText(row.id, e.target.value)}
                                          placeholder="Type technical remark (tolerances, mill stock, alternate grade)..."
                                          className="flex-1 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#714B67]/20 focus:border-[#714B67]"
                                        />
                                        <button
                                          type="button"
                                          disabled={savingRowId === row.id}
                                          onClick={() => handleSaveSingleRowRemark(row.id)}
                                          className="px-3 py-1.5 bg-[#714B67] hover:bg-[#5B3C53] text-white rounded-lg text-xs font-semibold cursor-pointer shrink-0 disabled:opacity-50 transition active:scale-95 flex items-center gap-1.5 shadow-2xs"
                                          title="Save remarks for this line"
                                        >
                                          {savingRowId === row.id ? (
                                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                          ) : (
                                            <Send className="w-3.5 h-3.5" />
                                          )}
                                          <span>{savingRowId === row.id ? "Saving..." : "Save"}</span>
                                        </button>
                                        {savedRowId === row.id && (
                                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                        )}
                                      </div>

                                      {/* Quick Preset Tags */}
                                      <div className="flex flex-wrap items-center gap-1.5">
                                        {[
                                          "Mill Stock Confirmed",
                                          "Not in Mill",
                                          "Alternate Caliper",
                                          "Lead Time 2 Wks",
                                        ].map((tag) => (
                                          <button
                                            key={tag}
                                            type="button"
                                            onClick={() => appendQuickTag(row.id, tag)}
                                            className="px-2 py-0.5 rounded-md border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-[10px] text-zinc-600 dark:text-zinc-300 hover:border-[#714B67] hover:text-[#714B67] cursor-pointer transition-colors"
                                          >
                                            + {tag}
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="space-y-1.5">
                                      {row.highlightedCols.length > 0 && (
                                        <div className="flex flex-wrap items-center gap-1.5">
                                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-50 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300">
                                            ⚠️ Revision Flagged: {row.highlightedCols.join(", ")}
                                          </span>
                                        </div>
                                      )}
                                      {row.sampRemarkText ? (
                                        <div className="text-xs text-zinc-900 dark:text-zinc-100 italic bg-purple-50/50 dark:bg-purple-950/30 p-2 rounded-lg border border-purple-100 dark:border-purple-900/40">
                                          &quot;{row.sampRemarkText}&quot;
                                        </div>
                                      ) : (
                                        <span className="text-[11px] font-mono text-zinc-400">
                                          Pending Technical Review
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </td>

                                {/* Action (Delete Line - Marketing only) */}
                                {!isSamplingMode && (
                                  <td className="p-3 border-l border-zinc-100 dark:border-zinc-800/80 text-center">
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteRow(row.id)}
                                      disabled={deletingRowId === row.id || rows.length <= 1}
                                      className="p-1.5 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                                      title={rows.length <= 1 ? "Cannot delete only remaining row" : "Delete specification row"}
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

                          {/* Inline Add Row Form */}
                          {!isSamplingMode && isAddingRow && (
                            <tr className="bg-teal-50/30 dark:bg-teal-950/20 border-b border-teal-200 dark:border-teal-900/40">
                              <td className="p-3 border-r text-center font-mono font-bold text-[#017E84]">
                                +
                              </td>
                              <td className="p-3 border-r">
                                <input
                                  type="text"
                                  placeholder="Type (e.g. Maplitho)"
                                  value={newMaterialType}
                                  onChange={(e) => setNewMaterialType(e.target.value)}
                                  className="w-full px-2 py-1 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs bg-white dark:bg-zinc-900"
                                />
                              </td>
                              <td className="p-3 border-r">
                                <input
                                  type="text"
                                  placeholder="Supplier"
                                  value={newSupplierName}
                                  onChange={(e) => setNewSupplierName(e.target.value)}
                                  className="w-full px-2 py-1 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs bg-white dark:bg-zinc-900"
                                />
                              </td>
                              <td className="p-3 border-r">
                                <input
                                  type="text"
                                  placeholder="Grade"
                                  value={newGrade}
                                  onChange={(e) => setNewGrade(e.target.value)}
                                  className="w-full px-2 py-1 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs bg-white dark:bg-zinc-900 font-mono"
                                />
                              </td>
                              <td className="p-3 border-r">
                                <input
                                  type="text"
                                  placeholder="Color"
                                  value={newColorVariant}
                                  onChange={(e) => setNewColorVariant(e.target.value)}
                                  className="w-full px-2 py-1 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs bg-white dark:bg-zinc-900"
                                />
                              </td>
                              <td className="p-3 border-r">
                                <input
                                  type="text"
                                  placeholder="Caliper"
                                  value={newCaliperWt}
                                  onChange={(e) => setNewCaliperWt(e.target.value)}
                                  className="w-full px-2 py-1 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs bg-white dark:bg-zinc-900 font-mono"
                                />
                              </td>
                              <td className="p-3 border-r">
                                <input
                                  type="text"
                                  placeholder="Qty"
                                  value={newQuantity}
                                  onChange={(e) => setNewQuantity(e.target.value)}
                                  className="w-full px-2 py-1 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs bg-white dark:bg-zinc-900 font-mono text-right"
                                />
                              </td>
                              <td className="p-3 border-r">
                                <input
                                  type="text"
                                  placeholder="Unit"
                                  value={newUnit}
                                  onChange={(e) => setNewUnit(e.target.value)}
                                  className="w-full px-2 py-1 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs bg-white dark:bg-zinc-900 font-mono"
                                />
                              </td>
                              <td className="p-3 border-r">
                                <input
                                  type="text"
                                  placeholder="Remark"
                                  value={newRemark}
                                  onChange={(e) => setNewRemark(e.target.value)}
                                  className="w-full px-2 py-1 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs bg-white dark:bg-zinc-900"
                                />
                              </td>
                              <td className="p-3">
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={handleSaveNewInlineRow}
                                    disabled={isSavingNewRow}
                                    className="px-3 py-1 bg-[#017E84] hover:bg-[#00666A] text-white rounded-lg text-xs font-bold cursor-pointer disabled:opacity-50 transition"
                                  >
                                    {isSavingNewRow ? "Saving..." : "Save Line"}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setIsAddingRow(false)}
                                    className="px-2.5 py-1 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-lg text-xs cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </td>
                              {!isSamplingMode && <td className="p-3 border-l"></td>}
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Footer Summary Strip */}
                    <div className="flex items-center justify-between text-xs text-zinc-500 font-mono pt-2 px-1">
                      <span>Total Matrix Line Items: <strong>{rows.length}</strong></span>
                      <span>Flagged for Revision: <strong className="text-amber-700 dark:text-amber-400">{totalFlaggedCols} columns</strong></span>
                      <span>SAMP Team Evaluated: <strong className="text-[#017E84]">{totalRemarksEntered} of {rows.length}</strong></span>
                    </div>

                    {/* Prominent Bottom Sign-Off Bar (SAMP Team Mode) */}
                    {isSamplingMode && (
                      <div className="mt-4 p-4 rounded-xl border border-purple-200 dark:border-purple-900/60 bg-purple-50/40 dark:bg-purple-950/20 flex items-center justify-between gap-3 flex-wrap shadow-2xs">
                        <div className="flex items-center gap-2.5">
                          <CheckCircle2 className="w-5 h-5 text-[#714B67] dark:text-purple-300 shrink-0" />
                          <div>
                            <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                              Ready to finalize technical sign-off?
                            </div>
                            <div className="text-[11px] text-zinc-500">
                              Submitting sign-off will lock matrix remarks and advance campaign status to &quot;Reviewed by SAMP Team&quot;.
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          disabled={isSaving}
                          onClick={handleMarkAsReviewed}
                          className="px-5 py-2 rounded-xl bg-[#714B67] hover:bg-[#5B3C53] text-white text-xs font-bold shadow-xs transition active:scale-95 cursor-pointer disabled:opacity-50 flex items-center gap-2"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>{isSaving ? "Saving..." : isReviewed ? "✓ Update Technical Sign-Off" : "Sign-Off & Complete Review"}</span>
                        </button>
                      </div>
                    )}

                  </div>
                )}

                {/* ══════════════════════════════════════════════════════════════════
                    TAB 2: PROGRAM SCOPE & FULFILLMENT
                ══════════════════════════════════════════════════════════════════ */}
                {activeTab === "scope" && (
                  <div className="py-4 space-y-4">
                    <div className="p-5 rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900/40 space-y-2">
                      <div className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-mono">
                        Campaign Overview &amp; Specifications
                      </div>
                      <div className="text-sm text-zinc-900 dark:text-zinc-100 leading-relaxed font-sans whitespace-pre-wrap">
                        {cleanNarrative || "Seasonal scholastic program planning campaign defined for customer order allocation."}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50/60 dark:bg-zinc-900/40 space-y-2">
                        <span className="text-[10.5px] font-mono uppercase font-bold text-zinc-400 block">
                          Customer Account
                        </span>
                        <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                          {activeRequest.customer}
                        </div>
                        <p className="text-xs text-zinc-500">
                          Enterprise scholastic partner for annual print &amp; stationery cycles.
                        </p>
                      </div>

                      <div className="p-4 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50/60 dark:bg-zinc-900/40 space-y-2">
                        <span className="text-[10.5px] font-mono uppercase font-bold text-zinc-400 block">
                          Fulfillment Facility Center
                        </span>
                        <div className="text-sm font-bold text-[#714B67] dark:text-purple-300 font-mono">
                          {activeRequest.targetPlant || "1505-Nadiad"}
                        </div>
                        <p className="text-xs text-zinc-500">
                          Designated manufacturing plant for raw material reservations &amp; trial lot execution.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* ══════════════════════════════════════════════════════════════════
                    TAB 3: PLANT EXECUTION SPECS
                ══════════════════════════════════════════════════════════════════ */}
                {activeTab === "plant" && (
                  <div className="py-4 space-y-4">
                    <div className="p-5 rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900/40 space-y-3">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-[#017E84]" />
                        <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider font-mono">
                          Manufacturing Fulfillment Center
                        </h4>
                      </div>
                      <div className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
                        Assigned Plant: <strong className="text-zinc-950 dark:text-zinc-50 font-mono text-sm">{activeRequest.targetPlant || "1505-Nadiad"}</strong>
                      </div>
                      <div className="text-xs text-zinc-500 leading-relaxed">
                        All raw material allocations in this matrix are scheduled for technical evaluation, mill stock checks, and capacity planning at this facility.
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>

          {/* RIGHT: CHATTER / AUDIT TRAIL FEED */}
          <ProgramChatterFeed
            request={activeRequest}
            materialRows={rows}
            isSamplingMode={isSamplingMode}
            onAddNote={handleAddNote}
            currentUser={currentUser || user}
          />
        </div>

      </div>
    </div>
  );
};

export default ProgramPlanningInspectorModal;
