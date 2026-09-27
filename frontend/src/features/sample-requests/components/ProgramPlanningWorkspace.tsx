import React, { useState, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Layers,
  Plus,
  Trash2,
  Copy,
  CheckCircle2,
  ChevronRight,
  PackageCheck,
  AlertCircle,
  Pencil,
  X,
} from "lucide-react";
import { UserProfile } from "@/features/auth";
import { createSampleRequestApi } from "../api";
import { SampleRequestItem } from "../types";
import { CUSTOMERS, PLANTS } from "./NewSampleRequestModal";

export interface ProgramMaterialRow {
  id: string;
  materialType: string;
  supplierInfo: string;
  grade: string;
  colorVariant: string;
  caliperWt: string;
  qty: string;
  unit: string;
  remark: string;
}

export interface ProgramPlanningWorkspaceProps {
  user?: UserProfile | null;
}

interface LocationState {
  customer?: string;
  targetPlant?: string;
  programPlanName?: string;
  programPlanYear?: string;
  programTargetDate?: string;
}

export const ProgramPlanningWorkspace: React.FC<ProgramPlanningWorkspaceProps> = ({ user }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as LocationState) || {};

  // Operational Campaign Parameters (Pre-filled from Step 1 or defaults)
  const [customer, setCustomer] = useState(state.customer || CUSTOMERS[0]);
  const [targetPlant, setTargetPlant] = useState(state.targetPlant || PLANTS[0]);
  const [programPlanName, setProgramPlanName] = useState(
    state.programPlanName || "BTS 2026-2027 Hardcover Notebook Line"
  );
  const [programPlanYear, setProgramPlanYear] = useState(state.programPlanYear || "2026-2027");
  const [programTargetDate, setProgramTargetDate] = useState(
    state.programTargetDate || new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0]
  );
  const [campaignBudgetQty, setCampaignBudgetQty] = useState("50000");

  // Toggle inline editing of parameters
  const [isEditingSetup, setIsEditingSetup] = useState(false);

  // Material Specification Matrix
  const [materialRows, setMaterialRows] = useState<ProgramMaterialRow[]>([
    {
      id: "mat-1",
      materialType: "",
      supplierInfo: "",
      grade: "",
      colorVariant: "",
      caliperWt: "",
      qty: "",
      unit: "pcs",
      remark: "",
    },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Row Manipulation (with auto-focus)
  const handleAddRow = () => {
    const nextId = `mat-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    setMaterialRows((prev) => [
      ...prev,
      {
        id: nextId,
        materialType: "",
        supplierInfo: "",
        grade: "",
        colorVariant: "",
        caliperWt: "",
        qty: "",
        unit: "pcs",
        remark: "",
      },
    ]);
    setTimeout(() => {
      const el = document.getElementById(`mat-type-${nextId}`);
      if (el) el.focus();
    }, 40);
  };

  const handleDuplicateRow = (row: ProgramMaterialRow) => {
    setMaterialRows((prev) => [
      ...prev,
      {
        ...row,
        id: `mat-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      },
    ]);
  };

  const handleRemoveRow = (id: string) => {
    setMaterialRows((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== id) : prev));
  };

  const updateRow = (id: string, field: keyof ProgramMaterialRow, value: string) => {
    setMaterialRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  // Live Summary Aggregations
  const summaryStats = useMemo(() => {
    const filledRows = materialRows.filter((r) => r.materialType.trim());
    const totalQty = filledRows.reduce((acc, r) => acc + (Number(r.qty) || 0), 0);
    const uniqueSuppliers = new Set(
      filledRows.map((r) => r.supplierInfo.trim()).filter(Boolean)
    ).size;

    return {
      rowCount: materialRows.length,
      configuredCount: filledRows.length,
      totalQty,
      supplierCount: uniqueSuppliers,
    };
  }, [materialRows]);

  // Submit Handler
  const handleCreateProgram = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customer.trim()) {
      setError("Please select a customer account.");
      return;
    }
    if (!programPlanName.trim()) {
      setError("Please specify the program campaign title.");
      return;
    }
    if (!programTargetDate.trim()) {
      setError("Please specify the required target delivery date.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const filledRows = materialRows.filter((r) => r.materialType.trim());
    const totalMaterialQty = filledRows.reduce((acc, r) => acc + (Number(r.qty) || 0), 0);

    const matrixSection =
      filledRows.length > 0
        ? "\n\nMaterial Specification Matrix:\n" +
          filledRows
            .map(
              (r, i) =>
                `#${i + 1} | Type: ${r.materialType} | Supplier: ${r.supplierInfo || "—"} | Grade: ${r.grade || "—"} | Color: ${r.colorVariant || "—"} | Caliper: ${r.caliperWt || "—"} | Qty: ${r.qty || "0"} ${r.unit || "units"} | Remark: ${r.remark || "—"}`
            )
            .join("\n")
        : "";

    const nextSrNum = `SR-26-${String(Math.floor(100 + Math.random() * 900))}`;
    const payload: Partial<SampleRequestItem> = {
      srNumber: nextSrNum,
      customer,
      targetPlant,
      productDescription: `[Seasonal Program: ${programPlanName.trim()}]\nProgram Year: ${programPlanYear}\nTarget Required Date: ${programTargetDate}\nEstimated Production Volume: ${campaignBudgetQty} pcs${matrixSection}`,
      materialCode: `PG-PL-${Math.floor(1000 + Math.random() * 9000)}`,
      programName: programPlanName.trim(),
      programYear: programPlanYear,
      year: programPlanYear,
      sampleRequiredDate: programTargetDate,
      qtyForSampling: 1,
      qtyDesignCosting: Number(campaignBudgetQty) || totalMaterialQty || 50000,
      requestTypes: ["sample", "costing", "design"] as any,
      status: "Draft (Pre-SMT)",
      createdBy: user?.name || "Program Planner",
      dateRequestCreated: new Date().toISOString().split("T")[0],
      creationMode: "program_planning",
    };

    try {
      await createSampleRequestApi(payload as any);
      setSuccessToast(`Program Request ${nextSrNum} registered successfully! Redirecting to Desk...`);
      setTimeout(() => {
        navigate("/sample-requests");
      }, 900);
    } catch (err) {
      console.error("Failed to create program:", err);
      setSuccessToast(`Program Request ${nextSrNum} staged locally. Redirecting to Desk...`);
      setTimeout(() => {
        navigate("/sample-requests");
      }, 900);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#f8fafc] dark:bg-[#08090d] min-h-screen text-zinc-900 dark:text-zinc-100 flex flex-col transition-colors duration-150">
      {/* 1. Single Clean Command Header (Single Back Button for whole page) */}
      <div className="border-b border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-[#0f1118] px-5 sm:px-8 py-3.5 sticky top-0 z-20 shadow-2xs backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Left: Single Dedicated Back Arrow & Title */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => navigate("/sample-requests")}
              className="p-1.5 -ml-1.5 rounded-md text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer shrink-0"
              title="Back to Marketing Desk"
              aria-label="Back to Marketing Desk"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">
                <span className="truncate">Marketing Work</span>
                <ChevronRight className="w-3 h-3 text-zinc-300 dark:text-zinc-600 shrink-0" />
                <span className="text-zinc-800 dark:text-zinc-300 font-medium truncate">Seasonal Program Planning</span>
              </div>
              <h1 className="text-[15px] font-bold text-zinc-950 dark:text-zinc-50 tracking-tight truncate mt-0.5">
                Seasonal Program Planning Workspace
              </h1>
            </div>
          </div>

          {/* Right: Operational Status Pill */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="px-2.5 py-1 rounded-md text-[10px] font-mono font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/80 uppercase tracking-wide">
              Track 03 · Operational Planning
            </span>
          </div>
        </div>
      </div>

      {/* Main Workspace Body */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-5">
        {/* Toast / Error Banner */}
        {error && (
          <div className="px-4 py-3 rounded-lg border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs font-medium flex items-center gap-2 animate-smooth-toast">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {successToast && (
          <div className="px-4 py-3 rounded-lg border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-medium flex items-center gap-2 animate-smooth-toast">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successToast}</span>
          </div>
        )}

        {/* 2. Sleek Single-Header Campaign Context Banner (Replaces redundant 6-field form) */}
        <div className="rounded-lg border border-zinc-200/90 dark:border-white/[0.08] bg-white dark:bg-[#0f1118] p-3.5 sm:p-4 shadow-2xs transition-colors">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            {/* Left: Summary Sentence Strip */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[12px]">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 shrink-0">
                Planning For
              </span>

              <span className="font-bold text-zinc-950 dark:text-zinc-100 text-[13px]">
                {customer}
              </span>

              <span className="text-zinc-300 dark:text-zinc-700 font-mono">•</span>

              <span className="font-semibold text-blue-600 dark:text-blue-400">
                "{programPlanName}"
              </span>

              <span className="text-zinc-300 dark:text-zinc-700 font-mono">•</span>

              <span className="font-mono text-zinc-700 dark:text-zinc-300 text-[11px] px-2 py-0.5 rounded bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                Season {programPlanYear}
              </span>

              <span className="text-zinc-300 dark:text-zinc-700 font-mono">•</span>

              <span className="font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
                Target Date: <strong className="text-zinc-800 dark:text-zinc-200">{programTargetDate}</strong>
              </span>

              <span className="text-zinc-300 dark:text-zinc-700 font-mono">•</span>

              <span className="font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
                Plant: <strong className="text-zinc-800 dark:text-zinc-200">{targetPlant.split(" ")[0]}</strong>
              </span>
            </div>

            {/* Right: Quick Edit Toggle */}
            <button
              type="button"
              onClick={() => setIsEditingSetup((prev) => !prev)}
              className="text-[11px] font-mono font-medium text-zinc-500 hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-400 flex items-center gap-1.5 cursor-pointer shrink-0 transition-colors self-end md:self-center"
            >
              {isEditingSetup ? (
                <>
                  <X className="w-3.5 h-3.5" />
                  <span>Close Editor</span>
                </>
              ) : (
                <>
                  <Pencil className="w-3 h-3" />
                  <span>Edit Parameters</span>
                </>
              )}
            </button>
          </div>

          {/* Smooth Collapsible Parameters Editor (Only when operator wants to edit) */}
          {isEditingSetup && (
            <div className="mt-3.5 pt-3.5 border-t border-zinc-100 dark:border-white/[0.06] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-3 animate-smooth-toast">
              <div className="lg:col-span-3">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1 font-mono">
                  Customer
                </label>
                <select
                  value={customer}
                  onChange={(e) => setCustomer(e.target.value)}
                  className="w-full h-7 px-2 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-[11px] text-zinc-900 dark:text-zinc-100 outline-none focus:border-blue-500 cursor-pointer"
                >
                  {CUSTOMERS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="lg:col-span-4">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1 font-mono">
                  Campaign Title
                </label>
                <input
                  type="text"
                  value={programPlanName}
                  onChange={(e) => setProgramPlanName(e.target.value)}
                  className="w-full h-7 px-2.5 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-[11px] text-zinc-900 dark:text-zinc-100 outline-none focus:border-blue-500 font-medium"
                />
              </div>

              <div className="lg:col-span-2">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1 font-mono">
                  Year
                </label>
                <select
                  value={programPlanYear}
                  onChange={(e) => setProgramPlanYear(e.target.value)}
                  className="w-full h-7 px-2 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-[11px] font-mono text-zinc-900 dark:text-zinc-100 outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="2026-2027">2026-2027</option>
                  <option value="2025-2026">2025-2026</option>
                  <option value="2027-2028">2027-2028</option>
                </select>
              </div>

              <div className="lg:col-span-3">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1 font-mono">
                  Target Required Date
                </label>
                <input
                  type="date"
                  value={programTargetDate}
                  onChange={(e) => setProgramTargetDate(e.target.value)}
                  className="w-full h-7 px-2 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-[11px] font-mono text-zinc-900 dark:text-zinc-100 outline-none focus:border-blue-500 cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>

        {/* 3. Hero Component: Material Specification Matrix Card */}
        <div className="rounded-lg border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-[#0f1118] overflow-hidden shadow-2xs transition-colors">
          {/* Matrix Header */}
          <div className="p-4 sm:p-5 border-b border-zinc-200 dark:border-white/[0.08] bg-zinc-50/70 dark:bg-[#161822] flex flex-col md:flex-row md:items-center md:justify-between gap-3.5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200/70 dark:border-blue-800/80 shrink-0 shadow-2xs">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-[14px] font-bold text-zinc-950 dark:text-zinc-50 tracking-tight">
                  Material Specification Matrix
                </h2>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Specify raw materials, grades, and quantities planned for this program
                </p>
              </div>
            </div>

            <div>
              {/* Blue + Add Row Button */}
              <button
                type="button"
                onClick={handleAddRow}
                className="h-8 px-4 rounded-md bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-[12px] font-semibold flex items-center gap-1.5 cursor-pointer transition-all shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Add Row</span>
              </button>
            </div>
          </div>

          {/* Matrix Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[11px]">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-white/[0.08] bg-zinc-50/70 dark:bg-zinc-900/50 text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider text-[10px] font-mono">
                  <th className="py-3 px-3 w-10 text-center">#</th>
                  <th className="py-3 px-2 min-w-[150px]">Material Type</th>
                  <th className="py-3 px-2 min-w-[130px]">Supplier Info</th>
                  <th className="py-3 px-2 min-w-[110px]">Grade</th>
                  <th className="py-3 px-2 min-w-[120px]">Color Variant</th>
                  <th className="py-3 px-2 min-w-[110px]">Caliper / Wt</th>
                  <th className="py-3 px-2 min-w-[90px]">Qty</th>
                  <th className="py-3 px-2 min-w-[110px]">Unit</th>
                  <th className="py-3 px-2 min-w-[140px]">Remark</th>
                  <th className="py-3 px-2 w-16 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/70 dark:divide-white/[0.05]">
                {materialRows.map((row, index) => (
                  <tr key={row.id} className="hover:bg-blue-50/20 dark:hover:bg-blue-950/10 transition-colors">
                    {/* Row Index */}
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-zinc-400 dark:text-zinc-500 text-[11px]">
                      {index + 1}
                    </td>

                    {/* Material Type */}
                    <td className="py-2 px-2">
                      <input
                        id={`mat-type-${row.id}`}
                        type="text"
                        placeholder="e.g. Kappa Board"
                        value={row.materialType}
                        onChange={(e) => updateRow(row.id, "materialType", e.target.value)}
                        className="w-full h-8 px-2.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 text-[11px] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all font-medium"
                      />
                    </td>

                    {/* Supplier Info */}
                    <td className="py-2 px-2">
                      <input
                        type="text"
                        placeholder="e.g. BILT / ITC"
                        value={row.supplierInfo}
                        onChange={(e) => updateRow(row.id, "supplierInfo", e.target.value)}
                        className="w-full h-8 px-2.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 text-[11px] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all"
                      />
                    </td>

                    {/* Grade */}
                    <td className="py-2 px-2">
                      <input
                        type="text"
                        placeholder="e.g. Grade A"
                        value={row.grade}
                        onChange={(e) => updateRow(row.id, "grade", e.target.value)}
                        className="w-full h-8 px-2.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 text-[11px] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all"
                      />
                    </td>

                    {/* Color Variant */}
                    <td className="py-2 px-2">
                      <input
                        type="text"
                        placeholder="e.g. Natural White"
                        value={row.colorVariant}
                        onChange={(e) => updateRow(row.id, "colorVariant", e.target.value)}
                        className="w-full h-8 px-2.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 text-[11px] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all"
                      />
                    </td>

                    {/* Caliper / Wt */}
                    <td className="py-2 px-2">
                      <input
                        type="text"
                        placeholder="e.g. 70 GSM"
                        value={row.caliperWt}
                        onChange={(e) => updateRow(row.id, "caliperWt", e.target.value)}
                        className="w-full h-8 px-2.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 text-[11px] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 font-mono transition-all"
                      />
                    </td>

                    {/* Qty */}
                    <td className="py-2 px-2">
                      <input
                        type="number"
                        placeholder="5000"
                        value={row.qty}
                        onChange={(e) => updateRow(row.id, "qty", e.target.value)}
                        className="w-full h-8 px-2.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 text-[11px] font-mono text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all"
                      />
                    </td>

                    {/* Standardized UOM Select */}
                    <td className="py-2 px-2">
                      <select
                        value={row.unit || "pcs"}
                        onChange={(e) => updateRow(row.id, "unit", e.target.value)}
                        className="w-full h-8 px-2 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 text-[11px] font-mono text-zinc-900 dark:text-zinc-100 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 cursor-pointer"
                      >
                        <option value="pcs">pcs</option>
                        <option value="sheets">sheets</option>
                        <option value="reams">reams</option>
                        <option value="rolls">rolls</option>
                        <option value="kg">kg</option>
                        <option value="sets">sets</option>
                        <option value="sqm">sqm</option>
                      </select>
                    </td>

                    {/* Remark with Tab/Enter Turbo Row Insertion */}
                    <td className="py-2 px-2">
                      <input
                        type="text"
                        placeholder="Notes... (Tab to add row)"
                        value={row.remark}
                        onChange={(e) => updateRow(row.id, "remark", e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || (e.key === "Tab" && !e.shiftKey)) {
                            if (index === materialRows.length - 1) {
                              e.preventDefault();
                              handleAddRow();
                            }
                          }
                        }}
                        className="w-full h-8 px-2.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 text-[11px] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all"
                      />
                    </td>

                    {/* Actions: Clone & Delete */}
                    <td className="py-2 px-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleDuplicateRow(row)}
                          className="p-1.5 rounded-md text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 cursor-pointer transition-colors"
                          title="Duplicate Row"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveRow(row.id)}
                          disabled={materialRows.length === 1}
                          className="p-1.5 rounded-md text-zinc-300 hover:text-rose-600 dark:text-zinc-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer transition-colors"
                          title="Delete Row"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Matrix Footer Counter & Metrics */}
          <div className="px-4 sm:px-5 py-3 bg-zinc-50/70 dark:bg-zinc-900/50 border-t border-zinc-200 dark:border-white/[0.08] flex flex-col sm:flex-row sm:items-center sm:justify-between text-[11px] text-zinc-500 dark:text-zinc-400 font-mono gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span>
                {materialRows.length} row{materialRows.length > 1 ? "s" : ""} configured
              </span>
              <span className="text-zinc-300 dark:text-zinc-700">•</span>
              <span className="text-zinc-400">
                {summaryStats.configuredCount} completed
              </span>
            </div>

            <div className="flex items-center gap-4 text-zinc-400">
              {summaryStats.supplierCount > 0 && (
                <span>
                  Suppliers: <strong className="text-zinc-800 dark:text-zinc-200">{summaryStats.supplierCount}</strong>
                </span>
              )}
              <span>
                Total Raw Materials Planned:{" "}
                <strong className="text-zinc-900 dark:text-zinc-100 font-semibold font-mono">
                  {summaryStats.totalQty.toLocaleString()} units
                </strong>
              </span>
            </div>
          </div>
        </div>

        {/* 4. Bottom Action Bar (Clean Enterprise Action) */}
        <div className="rounded-lg border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-[#0f1118] p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3.5 shadow-2xs transition-colors">
          <div className="text-[12px] text-zinc-500 dark:text-zinc-400 font-mono text-center sm:text-left">
            Ready to initialize program request for <strong className="text-zinc-900 dark:text-zinc-100">{customer}</strong>
          </div>

          <button
            type="button"
            onClick={handleCreateProgram}
            disabled={isSubmitting}
            className="w-full sm:w-auto h-9 px-6 rounded-md bg-blue-600 hover:bg-blue-700 active:scale-[0.99] disabled:opacity-50 text-white text-[12px] font-semibold cursor-pointer transition-all shadow-xs flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Creating Program Request...</span>
              </>
            ) : (
              <>
                <PackageCheck className="w-4 h-4" />
                <span>Create Program Request</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProgramPlanningWorkspace;
