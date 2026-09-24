import React from "react";
import type { FormEvent } from "react";
import type { CreateSampleRequestForm, CustomerItem } from "../types";
import { CustomerSelectInput } from "./CustomerSelectInput";
import {
  AlertCircle,
  Building2,
  Calendar,
  Check,
  X,
} from "@/components/ui/icons";

export interface ProgramSetupStepProps {
  form: CreateSampleRequestForm;
  customers: CustomerItem[];
  loadingCustomers: boolean;
  years?: string[];
  selectedYear?: string;
  onChange: (field: keyof CreateSampleRequestForm, value: string) => void;
  onContinue: (event: FormEvent) => void;
}

const fieldLabelStyles =
  "text-xs sm:text-[13px] font-semibold tracking-tight text-slate-700 dark:text-slate-200 flex items-center gap-1.5";
const inputStyles =
  "w-full h-11 rounded-xl border border-slate-200/90 bg-slate-50/70 text-sm font-medium text-slate-900 placeholder:text-slate-400 shadow-2xs outline-none transition-all hover:border-slate-300 focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-600/20 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-blue-500 dark:focus:bg-slate-900";

export const ProgramSetupStep: React.FC<ProgramSetupStepProps> = ({
  form,
  customers,
  loadingCustomers,
  years,
  selectedYear,
  onChange,
  onContinue,
}) => {
  const currentYear = new Date().getFullYear();
  const availableYears =
    years && years.length > 0
      ? years
      : [String(currentYear), String(currentYear + 1), String(currentYear + 2)];

  const activeYear = (
    form.programYear || selectedYear || String(currentYear)
  )
    .replace(/BTS/gi, "")
    .trim();

  const isFormValid = Boolean(
    form.customer?.trim() && form.programName?.trim() && activeYear,
  );

  const completedCount =
    (form.customer?.trim() ? 1 : 0) +
    (form.programName?.trim() ? 1 : 0) +
    (activeYear ? 1 : 0);

  return (
    <div className="w-full">
      <form onSubmit={onContinue} className="w-full">
        <section className="w-full" aria-labelledby="program-details-title">
          <div className="overflow-hidden rounded-xl border border-slate-200/90 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-sm relative">
            {/* Top Glowing Gradient Accent Bar */}
            <div className="h-1 w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 shrink-0" />

            {/* Card Header with Consistent Hierarchy */}
            <div className="border-b border-slate-100 dark:border-slate-800 px-5 py-4 sm:px-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-sm shadow-blue-500/25 shrink-0">
                    <Building2 size={16} className="stroke-[2.2]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-blue-600 dark:text-blue-400">
                        Intake Setup
                      </span>
                      <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                      <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                        Step 1 of 2
                      </span>
                    </div>
                    <h2
                      id="program-details-title"
                      className="mt-0.5 text-sm sm:text-base font-bold tracking-tight text-slate-900 dark:text-white"
                    >
                      Start with the basics
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Select target customer account and season cycle to establish program context.
                    </p>
                  </div>
                </div>

                {/* Completion Status Chip */}
                <div className="flex items-center gap-2 self-start sm:self-center">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                      completedCount === 3
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
                        : "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        completedCount === 3 ? "bg-emerald-500" : "bg-blue-500"
                      }`}
                    />
                    <span>{completedCount} of 3 completed</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Form Fields Section */}
            <div className="space-y-5 px-5 py-5 sm:px-6 sm:py-6">
              {/* Field 1: Customer Account (Modular Reusable Component) */}
              <CustomerSelectInput
                value={form.customer || ""}
                onChange={(cust) => onChange("customer", cust)}
                customers={customers}
                loading={loadingCustomers}
                themeColor="blue"
                label="Customer account"
              />

              {/* Field 2: Program Name */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="program-name-input" className={fieldLabelStyles}>
                    <span>Program name</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500">Recognizable in pipeline</span>
                </div>
                <div className="relative">
                  <input
                    id="program-name-input"
                    type="text"
                    required
                    placeholder="e.g. Back to School 2027, Spring Promotional..."
                    value={form.programName || ""}
                    onChange={(event) => onChange("programName", event.target.value)}
                    className={`${inputStyles} px-4 pr-11`}
                  />
                  {form.programName && (
                    <button
                      type="button"
                      onClick={() => onChange("programName", "")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:hover:bg-slate-800 dark:hover:text-slate-200 cursor-pointer"
                      title="Clear program name"
                      aria-label="Clear program name"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Field 3: Season Year Selection Cards */}
              <fieldset className="space-y-1.5">
                <legend className={fieldLabelStyles}>
                  <span>Season year</span>
                  <span className="text-rose-500">*</span>
                </legend>
                <div
                  className="grid grid-cols-1 gap-2.5 sm:grid-cols-3"
                  role="radiogroup"
                  aria-label="Season year"
                >
                  {availableYears.map((year) => {
                    const cleanYear = year.replace(/BTS/gi, "").trim();
                    const isSelected = activeYear === cleanYear;
                    const isCurrent = cleanYear === String(currentYear);
                    return (
                      <button
                        key={year}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        onClick={() => onChange("programYear", cleanYear)}
                        className={`group relative flex h-11 items-center justify-between rounded-xl border px-3.5 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer select-none ${
                          isSelected
                            ? "border-blue-600 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm shadow-blue-500/25"
                            : "border-slate-200/90 bg-slate-50/70 text-slate-800 hover:border-blue-300 hover:bg-blue-50/40 dark:border-slate-700/90 dark:bg-slate-800/60 dark:text-slate-200 dark:hover:border-blue-700 dark:hover:bg-blue-950/30"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Calendar size={15} className={isSelected ? "text-white/90" : "text-slate-400 group-hover:text-blue-500"} />
                          <span className="text-xs sm:text-sm font-semibold tracking-tight">{cleanYear}</span>
                        </div>
                        {isCurrent && (
                          <span
                            className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                              isSelected
                                ? "bg-white/20 text-white border border-white/30"
                                : "bg-slate-200/80 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                            }`}
                          >
                            Current
                          </span>
                        )}
                        {isSelected && !isCurrent && (
                          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white/20">
                            <Check size={11} strokeWidth={3} className="text-white" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            </div>

            {/* Footer Action Bar */}
            <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/60 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 dark:border-slate-800/80 dark:bg-slate-900/50">
              <div
                className={`inline-flex items-center gap-2 text-xs sm:text-sm font-medium ${
                  isFormValid
                    ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                    : "text-slate-500 dark:text-slate-400"
                }`}
                aria-live="polite"
              >
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                    isFormValid
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300"
                      : "bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400"
                  }`}
                >
                  {isFormValid ? <Check size={11} strokeWidth={3} /> : <AlertCircle size={11} />}
                </span>
                <span>
                  {isFormValid
                    ? "Ready to proceed • Product staging will open next"
                    : "Enter customer account and program name to continue"}
                </span>
              </div>

              <button
                type="submit"
                disabled={!isFormValid}
                className={`inline-flex h-9 items-center justify-center rounded-lg px-5 text-xs sm:text-sm font-semibold transition-colors cursor-pointer select-none ${
                  isFormValid
                    ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                    : "cursor-not-allowed bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-600 shadow-none"
                }`}
              >
                Continue to product staging
              </button>
            </div>
          </div>
        </section>
      </form>
    </div>
  );
};

