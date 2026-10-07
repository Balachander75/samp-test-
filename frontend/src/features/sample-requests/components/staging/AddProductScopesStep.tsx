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
  design: { description: "Artwork concepts, graphic designs & styling", Icon: Palette, tagColor: "bg-[#F3E8EE] text-[#714B67] border-[#714B67]/25" },
  mockup: { description: "Die-lines, dummy carton & structural prototype", Icon: Box, tagColor: "bg-amber-50 text-amber-800 border-amber-200" },
  sample: { description: "Physical production sample, binding & finishing", Icon: Layers3, tagColor: "bg-purple-50 text-purple-700 border-purple-200" },
  costing: { description: "Factory bill of materials & unit costing estimate", Icon: Calculator, tagColor: "bg-teal-50 text-[#017E84] border-teal-200" },
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
    <div className="relative flex max-h-[calc(100dvh-2rem)] w-full max-w-3xl flex-col overflow-hidden rounded border border-[#CED4DA] dark:border-white/[0.08] bg-white dark:bg-[#12141d] shadow-2xl animate-smooth-modal">
      {/* Odoo 19 Modal Header */}
      <div className="flex shrink-0 items-center justify-between gap-4 border-b border-[#5B3C53] bg-[#714B67] px-6 py-4 text-white sm:px-7">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h3 className="text-sm font-bold text-white tracking-tight sm:text-base">
              Add Staged Product Deliverables
            </h3>
            <span className="shrink-0 rounded bg-white/20 px-2 py-0.5 text-[10px] font-mono font-bold text-white tracking-wider uppercase">
              STEP 1 OF 2
            </span>
          </div>
          <p className="mt-1 text-xs text-white/85">
            Select one or multiple commercial deliverables for this item
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="h-7 w-7 rounded flex items-center justify-center text-white/80 hover:text-white hover:bg-white/15 transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <form onSubmit={onProceed} className="flex min-h-0 flex-col">
        <div className="min-h-0 space-y-5 overflow-y-auto p-5 sm:p-7">
          <div className="text-[13px] font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
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
                  className={`group flex min-h-[116px] w-full items-start gap-4 rounded border p-4 text-left transition-all cursor-pointer ${
                    disabled
                      ? "cursor-not-allowed border-[#CED4DA] bg-zinc-50 opacity-40 dark:border-zinc-800 dark:bg-white/[0.02]"
                      : isSelected
                      ? "border-[#714B67] bg-[#714B67]/5 ring-1 ring-[#714B67]/30 dark:border-purple-300 dark:bg-[#3E2938]/30 shadow-2xs"
                      : "border-[#CED4DA] bg-white hover:border-[#714B67]/50 hover:bg-[#F8F9FA] dark:border-zinc-700 dark:bg-[#12141d] dark:hover:bg-white/[0.03]"
                  }`}
                >
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded border transition-colors ${
                      isSelected
                        ? "border-[#714B67]/20 bg-[#F3E8EE] text-[#714B67] dark:bg-[#50384A] dark:text-purple-100"
                        : disabled
                        ? "border-[#CED4DA] bg-zinc-100 text-zinc-400"
                        : "border-[#CED4DA] bg-zinc-50 text-zinc-500 group-hover:border-[#714B67]/30 group-hover:bg-[#F3E8EE] group-hover:text-[#714B67] dark:border-zinc-700 dark:bg-[#1A1C26] dark:text-zinc-400"
                    }`}
                  >
                    <Icon className="h-4 w-4 stroke-[2]" aria-hidden="true" />
                  </span>

                  <span className="min-w-0 flex-1 pt-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="block text-sm font-bold text-zinc-900 dark:text-zinc-100">
                        {item.label}
                      </span>
                      <span className={`px-1.5 py-0.2 rounded text-[9.5px] font-mono font-bold border ${tagColor}`}>
                        {item.id.toUpperCase()}
                      </span>
                    </div>
                    <span className="mt-1.5 block text-xs leading-relaxed text-[#64748B] dark:text-zinc-400">
                      {description}
                    </span>
                  </span>

                  <span
                    className={`mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border transition-colors ${
                      isSelected
                        ? "border-[#714B67] bg-[#714B67] text-white"
                        : "border-zinc-300 bg-white text-transparent dark:border-zinc-600 dark:bg-[#171923]"
                    }`}
                  >
                    {isSelected && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer Controls */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-[#CED4DA] bg-[#F8F9FA] px-6 py-4 dark:border-zinc-700 dark:bg-[#171923] sm:px-7">
          <button
            type="button"
            onClick={onClose}
            className="h-9 rounded border border-[#CED4DA] bg-white px-4 text-[13px] font-semibold text-zinc-700 hover:bg-[#F8F9FA] transition-colors cursor-pointer dark:border-zinc-700 dark:bg-[#12141d] dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={selectedScopes.length === 0}
            className="inline-flex h-9 items-center gap-1.5 rounded bg-[#017E84] hover:bg-[#00666A] active:bg-[#005256] px-4 text-[13px] font-bold text-white shadow-xs transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
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
                <ChevronRight className="h-3.5 w-3.5 stroke-[2.5]" />
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
