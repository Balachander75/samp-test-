import React from "react";
import { Check, ChevronRight } from "@/components/ui/icons";

export interface SampleRequestStepperProps {
  currentStep: 1 | 2;
  onNavigateStep?: (step: 1 | 2) => void;
  stagedCount?: number;
  customerName?: string;
  programName?: string;
}

export const SampleRequestStepper: React.FC<SampleRequestStepperProps> = ({
  currentStep,
  onNavigateStep,
  stagedCount = 0,
}) => {
  return (
    <div className="w-full">
      {/* 2-Step Minimal Progress Bar */}
      <div className="grid grid-cols-2 gap-2 mb-2">
        <div
          className={`h-1.5 rounded-full transition-all duration-300 ${
            currentStep >= 1 ? "bg-blue-600" : "bg-slate-200 dark:bg-slate-700"
          }`}
        />
        <div
          className={`h-1.5 rounded-full transition-all duration-300 ${
            currentStep === 2 ? "bg-blue-600" : "bg-slate-200 dark:bg-slate-700"
          }`}
        />
      </div>

      {/* Step Labels */}
      <div className="flex items-center justify-between text-xs px-0.5">
        <button
          type="button"
          onClick={() => currentStep === 2 && onNavigateStep && onNavigateStep(1)}
          disabled={currentStep === 1 || !onNavigateStep}
          className={`flex items-center gap-1.5 transition-colors ${
            currentStep === 1
              ? "text-blue-600 dark:text-blue-400 font-semibold"
              : currentStep > 1 && onNavigateStep
              ? "text-slate-600 dark:text-slate-300 hover:text-blue-600 cursor-pointer font-medium"
              : "text-slate-400 dark:text-slate-500"
          }`}
        >
          <span
            className={`w-4.5 h-4.5 rounded-full flex items-center justify-center text-[10px] font-bold ${
              currentStep === 2
                ? "bg-emerald-600 text-white"
                : "bg-blue-600 text-white"
            }`}
          >
            {currentStep === 2 ? <Check size={10} className="stroke-[3]" /> : "1"}
          </span>
          <span>Program Setup</span>
        </button>

        <div className="flex items-center gap-1 text-slate-300 dark:text-slate-600">
          <ChevronRight size={13} />
        </div>

        <div
          className={`flex items-center gap-1.5 ${
            currentStep === 2
              ? "text-blue-600 dark:text-blue-400 font-semibold"
              : "text-slate-400 dark:text-slate-500 font-normal"
          }`}
        >
          <span
            className={`w-4.5 h-4.5 rounded-full flex items-center justify-center text-[10px] font-bold ${
              currentStep === 2
                ? "bg-blue-600 text-white"
                : "bg-slate-200 dark:bg-slate-800 text-slate-500"
            }`}
          >
            2
          </span>
          <span>Product Staging</span>
          {currentStep === 2 && stagedCount > 0 && (
            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.2 rounded-md font-mono border border-blue-200/60 dark:border-blue-800/60">
              {stagedCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

