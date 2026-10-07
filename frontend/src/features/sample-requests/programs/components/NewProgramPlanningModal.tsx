import React, { useState, useEffect, useMemo } from "react";
import { X, ArrowRight, FolderGit2, Calendar, Check, Sparkles } from "lucide-react";
import { useMasterData } from "../../hooks/useMasterData";
import { CustomerCombobox } from "@/components/erp";

export interface NewProgramPlanningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProceed: (params: {
    customer: string;
    targetPlant: string;
    programName: string;
    programYear: string;
  }) => void;
}

export const getProgramYearOptions = (): string[] => {
  const currentYear = new Date().getFullYear();
  return [String(currentYear), String(currentYear + 1), String(currentYear + 2)];
};

export const NewProgramPlanningModal: React.FC<NewProgramPlanningModalProps> = ({
  isOpen,
  onClose,
  onProceed,
}) => {
  const { customers, plants, isLoading: isMasterDataLoading } = useMasterData();
  const yearOptions = useMemo(() => getProgramYearOptions(), []);

  const [customer, setCustomer] = useState("");
  const [targetPlant, setTargetPlant] = useState("");
  const [programName, setProgramName] = useState("");
  const [programYear, setProgramYear] = useState(() => getProgramYearOptions()[0]);
  const [error, setError] = useState<string | null>(null);

  // Initialize defaults
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setProgramName("");
      setProgramYear(getProgramYearOptions()[0]);
      if (customers.length > 0) setCustomer(customers[0].name);
      if (plants.length > 0) setTargetPlant(plants[0].name);
      else setTargetPlant("Plant 1");
    }
  }, [isOpen, customers, plants]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer.trim()) {
      setError("Please select a customer account.");
      return;
    }
    if (!programName.trim()) {
      setError("Please provide a program campaign title.");
      return;
    }
    if (!programYear.trim()) {
      setError("Please specify the program year.");
      return;
    }

    setError(null);
    onProceed({
      customer: customer.trim(),
      targetPlant: targetPlant.trim() || "Plant 1",
      programName: programName.trim(),
      programYear: programYear.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 transition-opacity backdrop-blur-xs"
        onClick={onClose}
      />

      <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
        <div className="relative w-full max-w-2xl bg-white dark:bg-[#12141d] border border-zinc-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-smooth-modal flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-7 py-5 border-b border-zinc-200 dark:border-white/[0.08] bg-zinc-50/80 dark:bg-[#161822] shrink-0">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#017E84]/15 to-[#714B67]/15 text-[#017E84] dark:text-[#2dd4bf] flex items-center justify-center border border-[#017E84]/25 shadow-xs shrink-0">
                <FolderGit2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-zinc-950 dark:text-zinc-50 tracking-tight">
                    New Seasonal Program Planning
                  </h3>
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/50 text-[#017E84] dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                    <Sparkles className="w-3 h-3" /> Step 1 of 2
                  </span>
                </div>
                <p className="text-xs text-zinc-500 font-medium mt-0.5">
                  Define campaign master parameters and launch the material allocation matrix
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="h-8 w-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-7 space-y-5 text-sm">
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 font-semibold text-xs flex items-center gap-2">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* 1. Customer Account */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 font-mono">
                Customer Account <span className="text-rose-500">*</span>
              </label>
              <CustomerCombobox
                customers={customers}
                value={customer}
                onChange={setCustomer}
                disabled={isMasterDataLoading || customers.length === 0}
                className="w-full"
              />
              <p className="text-[11px] text-zinc-400">
                Select the customer account associated with this seasonal program line.
              </p>
            </div>

            {/* 2. Program Campaign Title */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 font-mono">
                Program Campaign Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={programName}
                onChange={(e) => setProgramName(e.target.value)}
                placeholder="e.g. Back to School 2026, Hardcover Notebooks Line, Corporate Diaries"
                className="w-full h-11 px-4 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900/80 text-sm font-semibold text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none focus:border-[#017E84] focus:ring-2 focus:ring-[#017E84]/20 transition-all shadow-xs"
              />
            </div>

            {/* 3. Program Year (Only current year + next 2 years) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 font-mono flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-zinc-400" />
                  <span>Program Year</span>
                  <span className="text-rose-500">*</span>
                </label>
                <span className="text-[10.5px] text-zinc-500 font-mono font-bold uppercase tracking-wider">
                  Active cycle + 2 year horizon
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {yearOptions.map((yr) => {
                  const isSelected = programYear === yr;
                  return (
                    <button
                      key={yr}
                      type="button"
                      onClick={() => setProgramYear(yr)}
                      className={`h-12 px-4 rounded-xl border text-sm font-bold font-mono transition-all flex items-center justify-center gap-2 cursor-pointer select-none ${
                        isSelected
                          ? "border-[#017E84] bg-teal-50 dark:bg-teal-950/40 text-[#017E84] dark:text-[#2dd4bf] shadow-xs ring-2 ring-[#017E84]/25"
                          : "border-zinc-200 dark:border-zinc-700 bg-zinc-50/70 dark:bg-zinc-900/60 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 hover:bg-white dark:hover:bg-zinc-800"
                      }`}
                    >
                      {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                      <span>{yr}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-between pt-5 border-t border-zinc-200 dark:border-white/[0.08]">
              <button
                type="button"
                onClick={onClose}
                className="h-10 px-5 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="h-10 px-6 rounded-xl bg-[#017E84] hover:bg-[#00666A] active:bg-[#005256] text-white text-xs font-bold transition-all shadow-xs hover:shadow-sm flex items-center gap-2 cursor-pointer tracking-tight active:scale-95"
              >
                <span>Proceed to Material Matrix</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
