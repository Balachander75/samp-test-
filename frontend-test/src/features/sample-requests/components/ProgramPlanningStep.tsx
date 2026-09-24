import React, { useState } from "react";
import { CustomerItem, CreateSampleRequestForm } from "../types";
import { CustomerSelectInput } from "./CustomerSelectInput";
import {
  ProgramMaterialPlanningGrid,
  ProgramMaterialPlanningRow,
} from "./ProgramMaterialPlanningGrid";
import {
  Calendar,
  Tag,
  Check,
} from "@/components/ui/icons";

export interface ProgramPlanningStepProps {
  customers: CustomerItem[];
  loadingCustomers: boolean;
  years: string[];
  selectedYear: string;
  onProceedToStaging: (initialData: Partial<CreateSampleRequestForm>) => void;
  onBackToOptions: () => void;
}

const createEmptyMaterialRow = (): ProgramMaterialPlanningRow => ({
  id: `mat-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
  materialType: "",
  supplierInfo: "",
  grade: "",
  colorVariant: "",
  caliperWeight: "",
  quantity: "",
  unit: "",
  remark: "",
});

export const ProgramPlanningStep: React.FC<ProgramPlanningStepProps> = ({
  customers,
  loadingCustomers,
  years,
  selectedYear,
  onProceedToStaging,
  onBackToOptions,
}) => {
  const [customer, setCustomer] = useState("");
  const [programName, setProgramName] = useState("");
  const [seasonYear, setSeasonYear] = useState(selectedYear || "2027");
  const [targetDate, setTargetDate] = useState("");
  const [materialRows, setMaterialRows] = useState<ProgramMaterialPlanningRow[]>([
    createEmptyMaterialRow(),
  ]);

  const handleAddRow = () => {
    setMaterialRows((prev) => [...prev, createEmptyMaterialRow()]);
  };

  const handleUpdateRow = (
    id: string,
    field: keyof ProgramMaterialPlanningRow,
    value: string
  ) => {
    setMaterialRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  const handleDeleteRow = (id: string) => {
    if (materialRows.length <= 1) return;
    setMaterialRows((prev) => prev.filter((r) => r.id !== id));
  };

  const isFormValid = Boolean(customer.trim() && programName.trim());

  const handleStartProgramStaging = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    // Compile rows summary
    const materialSummary = materialRows
      .filter((r) => r.materialType.trim())
      .map(
        (r) =>
          `[${r.materialType || "Mat"} | ${r.grade || "Grade"} | ${r.caliperWeight || "GSM"} | Qty: ${r.quantity || "—"} ${r.unit || ""}${r.remark ? ` | Note: ${r.remark}` : ""}]`
      )
      .join("\n");

    onProceedToStaging({
      customer,
      programName,
      programYear: seasonYear,
      sampleRequiredDate: targetDate,
      productDescription: `Seasonal Program Plan (${seasonYear})${materialSummary ? `\n\nMaterials:\n${materialSummary}` : ""}`,
    });
  };

  return (
    <form onSubmit={handleStartProgramStaging} className="w-full space-y-6 animate-in fade-in duration-150">
      {/* Top Scope Card */}
      <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden space-y-0">
        {/* Top Glowing Purple Gradient Accent Bar */}
        <div className="h-1 w-full bg-gradient-to-r from-purple-600 via-fuchsia-600 to-indigo-600 shrink-0" />

        <div className="p-5 sm:p-6 space-y-5">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 text-white flex items-center justify-center font-bold shadow-sm shadow-purple-500/25 shrink-0">
                <Calendar size={18} className="stroke-[2.2]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-tight">
                  Program Scope & Header Information
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Set customer account, seasonal cycle, and target timeline for this planning package.
                </p>
              </div>
            </div>
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 font-mono border border-purple-200/60 dark:border-purple-800/60 shrink-0">
              Season {seasonYear}
            </span>
          </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
          {/* 1. Customer Account */}
          <div className="md:col-span-6">
            <CustomerSelectInput
              value={customer}
              onChange={setCustomer}
              customers={customers}
              loading={loadingCustomers}
              themeColor="purple"
              label="Customer Account"
            />
          </div>

          {/* 2. Program Campaign Title */}
          <div className="md:col-span-6 space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Tag size={13} className="text-slate-400" />
              <span>Program Campaign Title</span>
              <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g., Back to School 2027 Line Planning"
              value={programName}
              onChange={(e) => setProgramName(e.target.value)}
              className="w-full h-10 px-3.5 rounded-lg border border-slate-200/90 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 text-xs font-semibold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 outline-none transition-all"
            />
          </div>

          {/* 3. Season Cycle */}
          <div className="md:col-span-6 space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
              Season Cycle
            </label>
            <div className="flex gap-2">
              {years.map((y) => {
                const cleanY = y.replace(/BTS/gi, "").trim();
                const isSel = seasonYear === cleanY;
                return (
                  <button
                    key={y}
                    type="button"
                    onClick={() => setSeasonYear(cleanY)}
                    className={`flex-1 h-10 rounded-lg text-xs font-bold transition-all cursor-pointer select-none border ${
                      isSel
                        ? "bg-purple-600 text-white border-transparent shadow-xs"
                        : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                    }`}
                  >
                    {cleanY}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Target Sample Required Date */}
          <div className="md:col-span-6 space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar size={13} className="text-slate-400" />
              <span>Target Required Date</span>
            </label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-slate-200/90 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 outline-none transition-all cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>

      {/* Row-based Material Planning Matrix Grid */}
      <div className="w-full">
        <ProgramMaterialPlanningGrid
          rows={materialRows}
          onAddRow={handleAddRow}
          onUpdateRow={handleUpdateRow}
          onDeleteRow={handleDeleteRow}
        />
      </div>

      {/* Action Footer */}
      <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:px-6 flex items-center justify-between gap-3 shadow-xs">
        <button
          type="button"
          onClick={onBackToOptions}
          className="h-9 px-4 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          Change Workflow
        </button>

        <button
          type="submit"
          disabled={!isFormValid}
          className={`h-9 px-6 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors select-none ${
            isFormValid
              ? "bg-purple-600 hover:bg-purple-700 text-white shadow-xs cursor-pointer"
              : "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed shadow-none"
          }`}
        >
          INITIALIZE PROGRAM & STAGE PRODUCTS
        </button>
      </div>
    </form>
  );
};

