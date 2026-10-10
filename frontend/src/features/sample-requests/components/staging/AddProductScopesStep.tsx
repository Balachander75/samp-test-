import React from "react";
import { X, Check, ChevronRight } from "lucide-react";
import { DeliverableScopeId, DELIVERABLES } from "../../types/staging";

const SCOPES_METADATA: Record<
  DeliverableScopeId,
  {
    description: string;
    badge: string;
    badgeColor: string;
  }
> = {
  design: {
    description: "Artwork concepts, graphic designs & styling",
    badge: "DESIGN",
    badgeColor: "bg-purple-50 text-purple-700 border-purple-200/80 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/40",
  },
  mockup: {
    description: "Die-lines, dummy carton & structural prototype",
    badge: "MOCKUP",
    badgeColor: "bg-amber-50 text-amber-800 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/40",
  },
  sample: {
    description: "Physical production sample, binding & finishing",
    badge: "SAMPLE",
    badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40",
  },
  costing: {
    description: "Factory bill of materials & unit costing estimate",
    badge: "COSTING",
    badgeColor: "bg-teal-50 text-teal-800 border-teal-200/80 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800/40",
  },
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
    <div className="relative flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-200/90 dark:border-white/[0.08] bg-white dark:bg-[#12141a] shadow-2xl animate-smooth-modal">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between gap-4 border-b border-slate-100 dark:border-white/[0.06] px-6 py-4.5 sm:px-7">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight font-display">
              Add Staged Product Deliverables
            </h3>
            <span className="rounded-full bg-[#006d32]/10 text-[#006d32] dark:text-emerald-400 border border-[#006d32]/20 px-2 py-0.5 text-[9.5px] font-mono font-bold tracking-wider">
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
          className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-white transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Scopes Grid */}
      <form onSubmit={onProceed} className="flex min-h-0 flex-col">
        <div className="min-h-0 space-y-3 overflow-y-auto p-5 sm:p-6 bg-slate-50/40 dark:bg-[#0c0d12]">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
            Commercial Scope Selection
          </div>
          {selectedScopes.includes("mockup") && (
            <p className="-mt-2 text-xs leading-relaxed text-slate-500 dark:text-zinc-400">
              Design is decided after product selection: required for brand-new products, and a yes/no choice for existing products.
            </p>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {DELIVERABLES.map((item) => {
              const isSelected = selectedScopes.includes(item.id);
              const disabled = isScopeDisabled(item.id);
              const designDeferred = selectedScopes.includes("mockup") && item.id === "design";
              const meta = SCOPES_METADATA[item.id];

              return (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => onToggleScope(item.id)}
                  disabled={disabled}
                  aria-pressed={isSelected}
                  className={`group relative flex flex-col justify-between rounded-xl border p-4 text-left transition-all duration-150 cursor-pointer ${
                    disabled
                      ? designDeferred
                        ? isSelected
                          ? "cursor-not-allowed border-2 border-[#006d32] bg-emerald-50/50 dark:bg-[#006d32]/10 shadow-xs"
                          : "cursor-not-allowed border-purple-200/70 bg-purple-50/40 dark:border-purple-900/50 dark:bg-purple-950/15"
                        : "cursor-not-allowed border-slate-200/50 bg-slate-50/50 opacity-40 dark:border-zinc-800 dark:bg-white/[0.02]"
                      : isSelected
                      ? "border-2 border-[#006d32] bg-emerald-50/50 dark:bg-[#006d32]/10 shadow-xs"
                      : "border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-xs dark:border-white/[0.08] dark:bg-[#161822] dark:hover:bg-white/[0.02]"
                  }`}
                >
                  {/* Top: Title + Badge + Checkbox */}
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold ${isSelected ? "text-[#006d32] dark:text-emerald-400" : "text-slate-900 dark:text-white"}`}>
                        {item.label}
                      </span>
                      <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold border ${meta.badgeColor}`}>
                        {meta.badge}
                      </span>
                      {designDeferred && (
                        <span className="rounded bg-purple-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-purple-800 dark:bg-purple-900/50 dark:text-purple-200">
                          After product
                        </span>
                      )}
                    </div>

                    {/* Circular Check Indicator */}
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all ${
                        isSelected
                          ? "border-[#006d32] bg-[#006d32] text-white"
                          : "border-slate-300 bg-white text-transparent group-hover:border-slate-400 dark:border-zinc-600 dark:bg-zinc-800"
                      }`}
                    >
                      {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-zinc-400">
                    {item.id === "design" && selectedScopes.includes("mockup")
                      ? "Required for brand-new products; choose yes or no for existing products."
                      : meta.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-slate-100 bg-white px-6 py-3.5 dark:border-white/[0.06] dark:bg-[#161822] sm:px-7">
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-4 rounded-lg bg-slate-100 hover:bg-slate-200/80 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] text-xs font-semibold text-slate-600 dark:text-zinc-300 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={selectedScopes.length === 0}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg px-4.5 text-xs font-bold text-white shadow-xs transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 active:scale-98"
            style={{ background: "linear-gradient(135deg, #006d32 0%, #00d166 100%)" }}
          >
            <span>
              {selectedScopes.length === 1 && selectedScopes[0] === "design"
                ? "Configure Design Brief"
                : selectedScopes.includes("sample")
                ? "Configure Sampling"
                : selectedScopes.includes("mockup")
                ? "Configure Mockup Brief"
                : selectedScopes.includes("costing")
                ? "Select Catalog Product"
                : "Stage Product"}
            </span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddProductScopesStep;
