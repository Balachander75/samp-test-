import React, { useEffect, useRef, useState } from "react";
import { X, AlertCircle, Check, Hash, BookOpen, Search, Plus, Layers3, ArrowLeft } from "lucide-react";
import { ProductSearchResult, BindingHierarchyResponse } from "../../types";

export interface AddProductSamplingStepProps {
  modalError: string | null;
  sampleType: "full" | "partial";
  partialRequirements: string;
  samplingSearchMode: "material_code" | "binding";
  materialSearchQuery: string;
  materialSearchResults: ProductSearchResult[];
  isSearchingMaterial: boolean;
  selectedDbSample: ProductSearchResult | null;
  bindingHierarchy: BindingHierarchyResponse;
  selectedBinding1: string;
  selectedBinding2: string;
  bindingSearchResults: ProductSearchResult[];
  isSearchingBinding: boolean;
  isSubmittingAll: boolean;
  onSetModalError: (val: string | null) => void;
  onSetSampleType: (val: "full" | "partial") => void;
  onSetPartialRequirements: (val: string) => void;
  onSetSamplingSearchMode: (val: "material_code" | "binding") => void;
  onSetMaterialSearchQuery: (val: string) => void;
  onSelectDbSample: (item: ProductSearchResult) => void;
  onSelectBinding1: (b1: string) => void;
  onSelectBinding2: (b2: string) => void;
  onBackToScopes: () => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

const BINDING_RESULT_ROW_HEIGHT = 60;
const BINDING_RESULT_VIEWPORT_HEIGHT = 240;

const BindingProductResults: React.FC<{
  items: ProductSearchResult[];
  selectedItem: ProductSearchResult | null;
  onSelect: (item: ProductSearchResult) => void;
}> = ({ items, selectedItem, onSelect }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [activeIndex, setActiveIndex] = useState(-1);

  useEffect(() => {
    setScrollTop(0);
    setActiveIndex(-1);
    if (containerRef.current) containerRef.current.scrollTop = 0;
  }, [items]);

  const moveActiveIndex = (nextIndex: number) => {
    const boundedIndex = Math.max(0, Math.min(items.length - 1, nextIndex));
    setActiveIndex(boundedIndex);
    if (containerRef.current) {
      containerRef.current.scrollTop = boundedIndex * BINDING_RESULT_ROW_HEIGHT;
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!items.length) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      moveActiveIndex(activeIndex < 0 ? 0 : activeIndex + 1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      moveActiveIndex(activeIndex < 0 ? items.length - 1 : activeIndex - 1);
    } else if (event.key === "Home") {
      event.preventDefault();
      moveActiveIndex(0);
    } else if (event.key === "End") {
      event.preventDefault();
      moveActiveIndex(items.length - 1);
    } else if ((event.key === "Enter" || event.key === " ") && activeIndex >= 0) {
      event.preventDefault();
      onSelect(items[activeIndex]);
    }
  };

  const firstVisible = Math.max(0, Math.floor(scrollTop / BINDING_RESULT_ROW_HEIGHT) - 3);
  const lastVisible = Math.min(
    items.length,
    Math.ceil((scrollTop + BINDING_RESULT_VIEWPORT_HEIGHT) / BINDING_RESULT_ROW_HEIGHT) + 3
  );
  const visibleItems = items.slice(firstVisible, lastVisible);

  return (
    <div
      ref={containerRef}
      role="listbox"
      tabIndex={0}
      aria-label="Products matching Binding 1"
      aria-activedescendant={activeIndex >= 0 ? `binding-product-${activeIndex}` : undefined}
      onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
      onKeyDown={handleKeyDown}
      className="h-60 overflow-y-auto divide-y divide-[#E2E8F0] dark:divide-zinc-800 bg-[#F8F9FA]/40 dark:bg-zinc-900/40"
    >
      <div role="presentation" aria-hidden="true" style={{ height: firstVisible * BINDING_RESULT_ROW_HEIGHT }} />
      {visibleItems.map((item, offset) => {
        const index = firstVisible + offset;
        const isSelected = selectedItem?.id === item.id;
        return (
          <div
            key={item.id}
            id={`binding-product-${index}`}
            role="option"
            aria-selected={isSelected}
            title={item.product_description}
            onClick={() => {
              setActiveIndex(index);
              onSelect(item);
            }}
            className={`h-[60px] px-3 text-left transition-colors flex items-center justify-between gap-3 cursor-pointer ${
              isSelected
                ? "bg-[#006d32]/10 text-zinc-900 dark:text-zinc-100"
                : "hover:bg-slate-50 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
            } ${activeIndex === index ? "ring-1 ring-inset ring-[#006d32]/40" : ""}`}
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10.5px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-[#006d32] dark:text-emerald-300 border border-[#006d32]/25 shrink-0">
                  {item.material_code || "—"}
                </span>
                <span className="text-xs font-bold truncate">{item.product_description}</span>
              </div>
              <div className="flex items-center gap-2 mt-0.5 text-[10.5px] text-[#64748B] dark:text-zinc-400 truncate">
                <span className="truncate">{item.customer || "Navneet Standard"}</span>
                {item.sr_number && <span className="shrink-0">· Ref: {item.sr_number}</span>}
              </div>
            </div>
            <span
              aria-hidden="true"
              className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                isSelected
                  ? "border-[#006d32] bg-[#006d32] text-white"
                  : "border-zinc-300 dark:border-zinc-600"
              }`}
            >
              {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
            </span>
          </div>
        );
      })}
      <div
        role="presentation"
        aria-hidden="true"
        style={{ height: Math.max(0, (items.length - lastVisible) * BINDING_RESULT_ROW_HEIGHT) }}
      />
    </div>
  );
};

export const AddProductSamplingStep: React.FC<AddProductSamplingStepProps> = ({
  modalError,
  sampleType,
  partialRequirements,
  samplingSearchMode,
  materialSearchQuery,
  materialSearchResults,
  isSearchingMaterial,
  selectedDbSample,
  bindingHierarchy,
  selectedBinding1,
  selectedBinding2,
  bindingSearchResults,
  isSearchingBinding,
  isSubmittingAll,
  onSetModalError,
  onSetSampleType,
  onSetPartialRequirements,
  onSetSamplingSearchMode,
  onSetMaterialSearchQuery,
  onSelectDbSample,
  onSelectBinding1,
  onSelectBinding2,
  onBackToScopes,
  onClose,
  onSubmit,
}) => {
  return (
    <div className="relative w-full max-w-3xl bg-white dark:bg-[#161822] border border-slate-200/80 dark:border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden animate-smooth-modal max-h-[92vh] flex flex-col">
      {/* Luminous Engine Modal Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-white dark:bg-[#161822] text-slate-900 dark:text-white shrink-0 border-b border-slate-100 dark:border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#006d32]/10 text-[#006d32] dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Layers3 className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight font-display">
                Configure Sampling Prototype
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#006d32]/10 text-[#006d32] dark:text-emerald-400 border border-[#006d32]/20 tracking-wider uppercase">
                SAMPLING SPEC
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              Specify physical prototype scope, binding options, and reference material
            </p>
          </div>
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

      {/* Form Error Message */}
      {modalError && (
        <div className="mx-6 mt-3.5 p-2.5 rounded bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{modalError}</span>
          </div>
          <button
            type="button"
            onClick={() => onSetModalError(null)}
            className="text-rose-600 hover:text-rose-800 dark:text-rose-400 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Form Body */}
      <form onSubmit={onSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-5 text-xs">
          {/* Scope Selection: Full Sample vs Partial Sample */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#64748B] dark:text-zinc-400 font-sans">
              Sample Scope <span className="text-rose-500">*</span>
            </label>

            <div className="grid grid-cols-2 gap-3">
              {/* Full Sample */}
              <div
                onClick={() => onSetSampleType("full")}
                className={`p-3 rounded border transition-all cursor-pointer select-none flex items-center justify-between ${
                  sampleType === "full"
                    ? "border-[#006d32] bg-[#006d32]/5 ring-1 ring-[#006d32]/30 text-zinc-900 dark:text-zinc-100"
                    : "border-[#CED4DA] dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:border-[#006d32]/50"
                }`}
              >
                <div>
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 block">
                    Full Sample
                  </span>
                  <span className="text-[10.5px] text-[#64748B]">Complete finished prototype</span>
                </div>
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    sampleType === "full"
                      ? "border-[#006d32] bg-[#006d32] text-white"
                      : "border-zinc-300 dark:border-zinc-600"
                  }`}
                >
                  {sampleType === "full" && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                </div>
              </div>

              {/* Partial Sample */}
              <div
                onClick={() => onSetSampleType("partial")}
                className={`p-3 rounded border transition-all cursor-pointer select-none flex items-center justify-between ${
                  sampleType === "partial"
                    ? "border-[#006d32] bg-[#006d32]/5 ring-1 ring-[#006d32]/30 text-zinc-900 dark:text-zinc-100"
                    : "border-[#CED4DA] dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:border-[#006d32]/50"
                }`}
              >
                <div>
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 block">
                    Partial Sample
                  </span>
                  <span className="text-[10.5px] text-[#64748B]">Cover / binding only</span>
                </div>
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    sampleType === "partial"
                      ? "border-[#006d32] bg-[#006d32] text-white"
                      : "border-zinc-300 dark:border-zinc-600"
                  }`}
                >
                  {sampleType === "partial" && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                </div>
              </div>
            </div>

            {/* Partial Sample Details */}
            {sampleType === "partial" && (
              <div className="space-y-1 pt-1.5 animate-smooth-toast">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#64748B] dark:text-zinc-400 font-sans">
                  Partial Sample Requirements <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  value={partialRequirements}
                  onChange={(e) => onSetPartialRequirements(e.target.value)}
                  placeholder="e.g. Spiral binding mockup without inner pages, only 4-color printed cover..."
                  className="w-full p-2.5 rounded border border-[#CED4DA] dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none focus:border-[#006d32] focus:ring-1 focus:ring-[#006d32] resize-none"
                />
              </div>
            )}
          </div>

          {/* Choose Sample: Material Code or Sequential Binding */}
          <div className="space-y-2">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#64748B] dark:text-zinc-400 font-sans">
              Prototype Database Reference <span className="text-rose-500">*</span>
            </label>

            {/* Mode Toggle Bar */}
            <div className="flex items-center gap-1 p-1 rounded bg-[#F8F9FA] dark:bg-zinc-800 border border-[#CED4DA] dark:border-zinc-700">
              <button
                type="button"
                onClick={() => onSetSamplingSearchMode("material_code")}
                className={`flex-1 h-7 rounded text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  samplingSearchMode === "material_code"
                    ? "bg-[#006d32] text-white shadow-xs"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
                }`}
              >
                <Hash className="w-3.5 h-3.5" />
                <span>Search by Material Code</span>
              </button>

              <button
                type="button"
                onClick={() => onSetSamplingSearchMode("binding")}
                className={`flex-1 h-7 rounded text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  samplingSearchMode === "binding"
                    ? "bg-[#006d32] text-white shadow-xs"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Search by Binding Type</span>
              </button>
            </div>

            {/* Mode 1: Material Code */}
            {samplingSearchMode === "material_code" && (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={materialSearchQuery}
                    onChange={(e) => onSetMaterialSearchQuery(e.target.value)}
                    placeholder="Search material code, SKU, or customer reference..."
                    className="w-full h-9 pl-9 pr-8 rounded border border-[#CED4DA] dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none focus:border-[#006d32] focus:ring-1 focus:ring-[#006d32]"
                  />
                  {materialSearchQuery && (
                    <button
                      type="button"
                      onClick={() => onSetMaterialSearchQuery("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 h-5 w-5 flex items-center justify-center cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <div className="border border-[#CED4DA] dark:border-zinc-700 rounded max-h-48 overflow-y-auto divide-y divide-[#E2E8F0] dark:divide-zinc-800 bg-[#F8F9FA]/40 dark:bg-zinc-900/40">
                  {isSearchingMaterial ? (
                    <div className="py-6 text-center text-xs text-zinc-400 font-mono">
                      Searching sampling database...
                    </div>
                  ) : materialSearchResults.length === 0 ? (
                    <div className="py-6 text-center text-xs text-zinc-400">
                      No matching samples found. Try typing a code like "01", "2026", or customer name.
                    </div>
                  ) : (
                    materialSearchResults.map((item) => {
                      const isSelected = selectedDbSample?.id === item.id;
                      return (
                        <div
                          key={item.id}
                          onClick={() => onSelectDbSample(item)}
                          className={`p-2.5 transition-colors cursor-pointer flex items-center justify-between gap-3 text-left ${
                            isSelected
                              ? "bg-[#006d32]/10 dark:bg-emerald-950/40 border-l-3 border-[#006d32]"
                              : "hover:bg-white dark:hover:bg-zinc-800"
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[10.5px] font-bold px-1.5 py-0.2 rounded bg-white dark:bg-zinc-800 text-[#006d32] dark:text-emerald-300 border border-[#006d32]/20">
                                {item.material_code || "—"}
                              </span>
                              <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                                {item.product_description}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 text-[10.5px] text-[#64748B]">
                              <span>{item.customer || "Navneet Standard"}</span>
                              {item.sr_number && <span>• Ref: {item.sr_number}</span>}
                            </div>
                          </div>

                          <div
                            className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                              isSelected
                                ? "border-[#006d32] bg-[#006d32] text-white"
                                : "border-zinc-300 dark:border-zinc-600"
                            }`}
                          >
                            {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* Mode 2: Sequential Binding */}
            {samplingSearchMode === "binding" && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Binding 1 */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#64748B] dark:text-zinc-400 mb-1 font-sans">
                      Binding 1 <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={selectedBinding1}
                      onChange={(e) => onSelectBinding1(e.target.value)}
                      className="w-full h-9 px-3 rounded border border-[#CED4DA] dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-semibold text-zinc-900 dark:text-zinc-100 outline-none focus:border-[#006d32] cursor-pointer"
                    >
                      <option value="">Select Binding 1...</option>
                      {bindingHierarchy.binding1_options.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Binding 2 */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#64748B] dark:text-zinc-400 mb-1 font-sans">
                      Binding 2
                    </label>
                    <select
                      disabled={!selectedBinding1}
                      value={selectedBinding2}
                      onChange={(e) => onSelectBinding2(e.target.value)}
                      className={`w-full h-9 px-3 rounded border text-xs font-semibold outline-none ${
                        !selectedBinding1
                          ? "border-[#CED4DA] dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800/40 text-zinc-400 cursor-not-allowed"
                          : "border-[#CED4DA] dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:border-[#006d32] cursor-pointer"
                      }`}
                    >
                      <option value="">
                        {!selectedBinding1 ? "Select Binding 1 first..." : "Select Binding 2..."}
                      </option>
                      {selectedBinding1 &&
                        (
                          (bindingHierarchy.hierarchy[selectedBinding1]?.length
                            ? bindingHierarchy.hierarchy[selectedBinding1]
                            : bindingHierarchy.binding2_options) || []
                        ).map((opt: string) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
                <p className="text-[10.5px] text-[#64748B] dark:text-zinc-400">
                  Matching products are filtered by Binding 1. Binding 2 specifies the requested variant.
                </p>

                {/* Products with that specific binding */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
                      Products matching Binding 1 ({bindingSearchResults.length})
                    </span>
                    {selectedBinding1 && (
                      <span className="text-[10.5px] text-[#006d32] font-mono font-semibold">
                        Binding 1: {selectedBinding1}
                      </span>
                    )}
                  </div>

                  <div className="border border-[#CED4DA] dark:border-zinc-700 rounded overflow-hidden bg-[#F8F9FA]/40 dark:bg-zinc-900/40">
                    {!selectedBinding1 ? (
                      <div className="py-6 text-center text-xs text-zinc-400">
                        Select Binding 1 to view matching products
                      </div>
                    ) : isSearchingBinding ? (
                      <div className="py-6 text-center text-xs text-zinc-400 font-mono">
                        Searching database...
                      </div>
                    ) : bindingSearchResults.length === 0 ? (
                      <div className="py-6 text-center text-xs text-zinc-400">
                        No saved products use this Binding 1. You can still stage a new product with it.
                      </div>
                    ) : (
                      <BindingProductResults
                        items={bindingSearchResults}
                        selectedItem={selectedDbSample}
                        onSelect={onSelectDbSample}
                      />
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-white dark:border-white/[0.06] dark:bg-[#161822] flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onBackToScopes}
            className="h-10 px-4 rounded-xl bg-slate-100 dark:bg-white/[0.06] text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:bg-slate-200/80 transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="h-10 px-4 rounded-xl bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-zinc-300 hover:bg-slate-200/80 text-xs font-semibold cursor-pointer transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmittingAll}
              className="h-10 px-5 rounded-xl text-white text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-[0_2px_10px_rgba(0,109,50,0.25)] hover:shadow-[0_4px_14px_rgba(0,109,50,0.35)] disabled:opacity-50 active:scale-98"
              style={{ background: "linear-gradient(135deg, #006d32 0%, #00d166 100%)" }}
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Stage Product</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AddProductSamplingStep;
