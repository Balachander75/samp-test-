import React from "react";
import {
  X,
  Check,
  ChevronRight,
  Plus,
  Palette,
  Box,
  Layers3,
  Calculator,
  Search,
} from "lucide-react";
import { DeliverableScopeId, DELIVERABLES } from "../../types/staging";

const scopeDetails: Record<DeliverableScopeId, { description: string; Icon: typeof Palette; tagColor: string }> = {
  design: { description: "Artwork concepts, graphic designs & styling", Icon: Palette, tagColor: "bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-800/40" },
  mockup: { description: "Die-lines, dummy carton & structural prototype", Icon: Box, tagColor: "bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800/40" },
  sample: { description: "Physical production sample, binding & finishing", Icon: Layers3, tagColor: "bg-emerald-50 text-[#006d32] dark:bg-emerald-950/40 dark:text-emerald-300 border-[#006d32]/25" },
  costing: { description: "Factory bill of materials & unit costing estimate", Icon: Calculator, tagColor: "bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300 border-teal-200 dark:border-teal-800/40" },
};

export interface AddProductScopesStepProps {
  selectedScopes: DeliverableScopeId[];
  isScopeDisabled: (scope: DeliverableScopeId) => boolean;
  onToggleScope: (scope: DeliverableScopeId) => void;
  onClose: () => void;
  onProceed: (e: React.FormEvent) => void;
}

export const AddProductScopesStep: React.FC<AddProductScopesStepProps> = ({
  selectedScopes,
  isScopeDisabled,
  onToggleScope,
  onClose,
  onProceed,
}) => {
  return (
    <div className="relative flex max-h-[calc(100dvh-2rem)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-[#f8f9ff] dark:bg-[#12141a] shadow-2xl animate-smooth-modal">
      {/* Luminous Engine Modal Header */}
      <div className="flex shrink-0 items-center justify-between gap-4 border-b border-slate-100 dark:border-white/[0.06] bg-white dark:bg-[#161822] px-6 py-4.5 sm:px-7">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight font-display">
              Add Staged Product Deliverables
            </h3>
            <span className="shrink-0 rounded-full bg-[#006d32]/10 text-[#006d32] dark:text-emerald-400 border border-[#006d32]/20 px-2.5 py-0.5 text-[10px] font-mono font-bold tracking-wider uppercase">
              DELIVERABLES SPEC
            </span>
          </div>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">
            Select one or multiple commercial deliverables for this item
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="h-8 w-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-white transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <form onSubmit={onProceed} className="flex min-h-0 flex-col">
        <div className="min-h-0 space-y-4 overflow-y-auto p-5 sm:p-7">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 font-sans">
            Commercial Scope Selection
          </div>

          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            {DELIVERABLES.map((item) => {
              const isSelected = selectedScopes.includes(item.id);
              const disabled = isScopeDisabled(item.id);
              const { description, Icon, tagColor } = scopeDetails[item.id];

              return (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => onToggleScope(item.id)}
                  disabled={disabled}
                  aria-pressed={isSelected}
                  className={`group flex min-h-[116px] w-full items-start gap-4 rounded-2xl border p-4 text-left transition-all cursor-pointer ${
                    disabled
                      ? "cursor-not-allowed border-slate-200/50 bg-slate-50/50 opacity-40 dark:border-zinc-800 dark:bg-white/[0.02]"
                      : isSelected
                      ? "border-2 border-[#006d32] bg-[#eff4ff] dark:bg-[#006d32]/15 ring-2 ring-[#006d32]/20 shadow-xs"
                      : "border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50/50 dark:border-white/[0.08] dark:bg-[#161822] dark:hover:bg-white/[0.03]"
                  }`}
                >
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${
                      isSelected
                        ? "bg-[#006d32] text-white"
                        : disabled
                        ? "bg-slate-100 text-slate-400 dark:bg-zinc-800"
                        : "bg-[#006d32]/10 text-[#006d32] dark:text-emerald-400 group-hover:bg-[#006d32]/15"
                    }`}
                  >
                    <Icon className="h-4 w-4 stroke-[2]" aria-hidden="true" />
                  </span>

                  <span className="min-w-0 flex-1 pt-0.5">
                    <div className="flex items-center gap-2">
                      <span className={`block text-sm font-bold ${isSelected ? "text-[#006d32] dark:text-emerald-400" : "text-slate-900 dark:text-zinc-100"}`}>
                        {item.label}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[9.5px] font-mono font-bold border ${tagColor}`}>
                        {item.id.toUpperCase()}
                      </span>
                    </div>
                    <span className="mt-1.5 block text-xs leading-relaxed text-slate-500 dark:text-zinc-400">
                      {description}
                    </span>
                  </span>

                  <span
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
                      isSelected
                        ? "border-[#006d32] bg-[#006d32] text-white"
                        : "border-slate-300 bg-white text-transparent dark:border-zinc-600 dark:bg-zinc-800"
                    }`}
                  >
                    {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer Controls */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-slate-100 bg-white px-6 py-4 dark:border-white/[0.06] dark:bg-[#161822] sm:px-7">
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-5 rounded-xl bg-slate-100 dark:bg-white/[0.06] text-xs font-semibold text-slate-600 dark:text-zinc-300 hover:bg-slate-200/80 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={selectedScopes.length === 0}
            className="inline-flex h-10 items-center gap-1.5 rounded-xl px-5 text-xs font-bold text-white shadow-[0_2px_10px_rgba(0,109,50,0.25)] hover:shadow-[0_4px_14px_rgba(0,109,50,0.35)] transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 active:scale-98"
            style={{ background: "linear-gradient(135deg, #006d32 0%, #00d166 100%)" }}
          >
            {selectedScopes.includes("design") ? (
              <>
                <span>Configure Design Brief</span>
                <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
              </>
            ) : selectedScopes.includes("sample") ? (
              <>
                <span>Configure Sampling</span>
                <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
              </>
            ) : selectedScopes.includes("mockup") || selectedScopes.includes("costing") ? (
              <>
                <Search className="h-3.5 w-3.5" />
                <span>Select Catalog Product</span>
                <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Stage Product</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddProductScopesStep;
