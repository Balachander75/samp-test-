import React, { useEffect, useRef, useState } from "react";
import {
  X,
  AlertCircle,
  Check,
  Search,
  Plus,
  ArrowLeft,
  ChevronDown,
  Eye,
} from "lucide-react";
import { ProductSearchResult, BindingHierarchyResponse } from "../../types";
import { ProductCategoryItem } from "@/types/master";
import { DeliverableScopeId } from "../../types/staging";

export interface AddProductSamplingStepProps {
  selectedScopes?: DeliverableScopeId[];
  modalError: string | null;
  sampleType: "full" | "partial";
  partialRequirements: string;
  samplingSearchMode: "new" | "material_code" | "binding";
  isEditing?: boolean;
  designNeeded: boolean | null;
  designBriefComplete: boolean;
  productDescription: string;
  qtyDesignCosting: string;
  customerProductCode: string;
  barcode: string;
  brandName: string;
  unitPcPack: string;
  qtyPerPack: string;
  costingRequiredDate: string;
  materialSearchQuery: string;
  materialSearchResults: ProductSearchResult[];
  isSearchingMaterial: boolean;
  selectedDbSample: ProductSearchResult | null;
  bindingHierarchy: BindingHierarchyResponse;
  isLoadingBindingHierarchy: boolean;
  selectedBinding1: string;
  selectedBinding2: string;
  productCategories: ProductCategoryItem[];
  selectedCategory: string;
  selectedSubCategory: string;
  selectedThirdCategory: string;
  bindingSearchResults: ProductSearchResult[];
  isSearchingBinding: boolean;
  isSubmittingAll: boolean;
  onSetModalError: (val: string | null) => void;
  onSetSampleType: (val: "full" | "partial") => void;
  onSetPartialRequirements: (val: string) => void;
  onSetSamplingSearchMode: (val: "new" | "material_code" | "binding") => void;
  onSetDesignNeeded: (val: boolean) => void;
  onSetProductDescription: (val: string) => void;
  onSetQtyDesignCosting: (val: string) => void;
  onSetCustomerProductCode: (val: string) => void;
  onSetBarcode: (val: string) => void;
  onSetBrandName: (val: string) => void;
  onSetUnitPcPack: (val: string) => void;
  onSetQtyPerPack: (val: string) => void;
  onSetCostingRequiredDate: (val: string) => void;
  onSetMaterialSearchQuery: (val: string) => void;
  onSelectDbSample: (item: ProductSearchResult) => void;
  onInspectProduct: (item: ProductSearchResult) => void;
  onSelectCategory: (val: string) => void;
  onSelectSubCategory: (val: string) => void;
  onSelectThirdCategory: (val: string) => void;
  onSelectBinding1: (b1: string) => void;
  onSelectBinding2: (b2: string) => void;
  onBackToScopes: () => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

const BINDING_RESULT_ROW_HEIGHT = 72;
const BINDING_RESULT_VIEWPORT_HEIGHT = 280;

const BindingProductResults: React.FC<{
  items: ProductSearchResult[];
  selectedItem: ProductSearchResult | null;
  onSelect: (item: ProductSearchResult) => void;
  onInspect: (item: ProductSearchResult) => void;
  viewportHeight?: number;
}> = ({ items, selectedItem, onSelect, onInspect, viewportHeight = BINDING_RESULT_VIEWPORT_HEIGHT }) => {
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
    Math.ceil((scrollTop + viewportHeight) / BINDING_RESULT_ROW_HEIGHT) + 3
  );
  const visibleItems = items.slice(firstVisible, lastVisible);

  return (
    <div
      ref={containerRef}
      role="listbox"
      tabIndex={0}
      aria-label="Products matching criteria"
      aria-activedescendant={activeIndex >= 0 ? `binding-product-${activeIndex}` : undefined}
      onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
      onKeyDown={handleKeyDown}
      style={{ height: viewportHeight }}
      className="overflow-y-auto divide-y divide-slate-100 dark:divide-zinc-800/80 bg-white/60 dark:bg-zinc-900/60"
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
            className={`h-[72px] px-3.5 text-left transition-all flex items-center justify-between gap-3 cursor-pointer ${
              isSelected
                ? "bg-emerald-500/10 dark:bg-emerald-500/15 border-l-3 border-[#006d32] text-zinc-900 dark:text-zinc-100"
                : "hover:bg-slate-50/80 dark:hover:bg-zinc-800/60 text-zinc-900 dark:text-zinc-100"
            } ${activeIndex === index ? "ring-1 ring-inset ring-[#006d32]/40" : ""}`}
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                {item.material_code && (
                  <span className="font-mono text-[10.5px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-[#006d32] dark:text-emerald-300 border border-[#006d32]/25 shrink-0">
                    {item.material_code}
                  </span>
                )}
                <span className="text-xs font-bold truncate text-slate-900 dark:text-zinc-100">
                  {item.product_description}
                </span>
              </div>
              {(item.customer || item.sr_number || item.product_category) && (
                <div className="flex items-center gap-2 mt-1 text-[11px] text-[#64748B] dark:text-zinc-400 truncate">
                  {item.customer && <span className="truncate font-medium">{item.customer}</span>}
                  {item.sr_number && <span className="shrink-0 font-mono">Ref: {item.sr_number}</span>}
                  {item.product_category && (
                    <span className="shrink-0 text-emerald-700 dark:text-emerald-400 font-medium">
                      {item.product_category}{item.product_sub_category && ` › ${item.product_sub_category}`}
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onInspect(item);
                }}
                aria-label={`Inspect ${item.material_code || item.product_description}`}
                title="Inspect product specifications"
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-[11px] font-semibold text-slate-600 transition hover:border-indigo-300 hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:text-indigo-300"
              >
                <Eye className="h-3.5 w-3.5" />
                <span>Inspect</span>
              </button>
              <span
              aria-hidden="true"
              className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                isSelected
                  ? "border-[#006d32] bg-[#006d32] text-white shadow-2xs"
                  : "border-zinc-300 dark:border-zinc-600 hover:border-zinc-400"
              }`}
            >
              {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
              </span>
            </div>
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
  selectedScopes = ["sample"],
  modalError,
  sampleType,
  partialRequirements,
  samplingSearchMode,
  isEditing = false,
  designNeeded,
  designBriefComplete,
  productDescription,
  qtyDesignCosting,
  customerProductCode,
  barcode,
  brandName,
  unitPcPack,
  qtyPerPack,
  costingRequiredDate,
  materialSearchQuery,
  materialSearchResults,
  isSearchingMaterial,
  selectedDbSample,
  bindingHierarchy,
  isLoadingBindingHierarchy,
  selectedBinding1,
  selectedBinding2,
  productCategories,
  selectedCategory,
  selectedSubCategory,
  selectedThirdCategory,
  bindingSearchResults,
  isSearchingBinding,
  isSubmittingAll,
  onSetModalError,
  onSetSampleType,
  onSetPartialRequirements,
  onSetSamplingSearchMode,
  onSetDesignNeeded,
  onSetProductDescription,
  onSetQtyDesignCosting,
  onSetCustomerProductCode,
  onSetBarcode,
  onSetBrandName,
  onSetUnitPcPack,
  onSetQtyPerPack,
  onSetCostingRequiredDate,
  onSetMaterialSearchQuery,
  onSelectDbSample,
  onInspectProduct,
  onSelectCategory,
  onSelectSubCategory,
  onSelectThirdCategory,
  onSelectBinding1,
  onSelectBinding2,
  onBackToScopes,
  onClose,
  onSubmit,
}) => {
  const includesSample = selectedScopes.includes("sample");
  const includesMockup = selectedScopes.includes("mockup");
  const includesCosting = selectedScopes.includes("costing");
  const includesDesign = selectedScopes.includes("design");
  const hasExistingMockupProduct =
    includesMockup && samplingSearchMode !== "new" && Boolean(selectedDbSample || isEditing);
  const needsDesignDecision = hasExistingMockupProduct && designNeeded === null;
  const needsDesignBrief =
    includesMockup && (samplingSearchMode === "new" || designNeeded === true) && !designBriefComplete;

  // Derive cascading taxonomy options based on current selections
  const currentCategoryItem = productCategories.find((c) => c.name === selectedCategory);
  const subCategoryOptions = currentCategoryItem?.subcategories || [];
  const currentSubCategoryItem = subCategoryOptions.find((s) => s.name === selectedSubCategory);
  const thirdCategoryOptions = currentSubCategoryItem?.third_categories || [];

  // Derive cascading binding 2 options
  const binding2Options = selectedBinding1
    ? bindingHierarchy.hierarchy[selectedBinding1] ?? bindingHierarchy.binding2_options ?? []
    : [];
  const activeBindingFilters = [
    selectedCategory,
    selectedSubCategory,
    selectedThirdCategory,
    selectedBinding1,
    selectedBinding2,
  ].filter(Boolean);

  const modalTitle = includesSample
    ? "Configure Sampling Prototype"
    : includesMockup
      ? "Configure Mockup Request"
      : includesCosting
        ? "Configure Costing Specification"
        : "Configure Product Specification";

  return (
    <div className="relative w-full max-w-5xl bg-white dark:bg-[#161822] border border-slate-200/80 dark:border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden animate-smooth-modal max-h-[92vh] flex flex-col">
      {/* Modal Header */}
      <div className="flex items-center justify-between gap-4 px-6 py-4 bg-white dark:bg-[#161822] text-slate-900 dark:text-white shrink-0 border-b border-slate-100 dark:border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
              {modalTitle}
            </h3>
            <div className="flex items-center gap-1">
              {includesSample && (
                <span className="px-2 py-0.5 rounded-full text-[9.5px] font-mono font-bold bg-[#006d32]/10 text-[#006d32] dark:text-emerald-400 border border-[#006d32]/25 tracking-wider uppercase">
                  SAMPLE
                </span>
              )}
              {includesMockup && (
                <span className="px-2 py-0.5 rounded-full text-[9.5px] font-mono font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 tracking-wider uppercase">
                  MOCKUP
                </span>
              )}
              {includesCosting && (
                <span className="px-2 py-0.5 rounded-full text-[9.5px] font-mono font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 tracking-wider uppercase">
                  COSTING
                </span>
              )}
              {includesDesign && (
                <span className="px-2 py-0.5 rounded-full text-[9.5px] font-mono font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 tracking-wider uppercase">
                  DESIGN
                </span>
              )}
            </div>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
            {includesMockup
              ? "Choose an existing product by Material Code or Category & Binding, or add a Brand New Product."
              : "Choose an existing product reference or describe a new prototype specification."}
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-white transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Form Error Message */}
      {modalError && (
        <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span className="font-medium">{modalError}</span>
          </div>
          <button
            type="button"
            onClick={() => onSetModalError(null)}
            className="text-rose-600 hover:text-rose-800 dark:text-rose-400 cursor-pointer p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Form Body */}
      <form onSubmit={onSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto px-6 py-5 sm:px-7 sm:py-6 space-y-4 text-xs">
          {/* Scope Selection: Full Sample vs Partial Sample */}
          {includesSample && (
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400 font-sans">
                Sample Scope <span className="text-rose-500">*</span>
              </label>

              <div className="grid w-full max-w-3xl grid-cols-1 gap-3 sm:grid-cols-2">
                {/* Full Sample */}
                <div
                  onClick={() => onSetSampleType("full")}
                  className={`min-h-[3.5rem] p-3 rounded-xl border transition-all cursor-pointer select-none flex items-center justify-between gap-3 ${
                    sampleType === "full"
                      ? "border-[#006d32] bg-[#006d32]/5 ring-1 ring-[#006d32]/30 text-zinc-900 dark:text-zinc-100"
                      : "border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900/60 hover:border-[#006d32]/40"
                  }`}
                >
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-zinc-100 block">
                      Full Sample
                    </span>
                    <span className="text-[10.5px] text-slate-500 dark:text-zinc-400">Complete finished prototype</span>
                  </div>
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
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
                  className={`min-h-[3.5rem] p-3 rounded-xl border transition-all cursor-pointer select-none flex items-center justify-between gap-3 ${
                    sampleType === "partial"
                      ? "border-[#006d32] bg-[#006d32]/5 ring-1 ring-[#006d32]/30 text-zinc-900 dark:text-zinc-100"
                      : "border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900/60 hover:border-[#006d32]/40"
                  }`}
                >
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-zinc-100 block">
                      Partial Sample
                    </span>
                    <span className="text-[10.5px] text-slate-500 dark:text-zinc-400">Cover / binding only</span>
                  </div>
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
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
                <div className="space-y-1 pt-1 animate-smooth-toast">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400 font-sans">
                    Partial Sample Requirements <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={partialRequirements}
                    onChange={(e) => onSetPartialRequirements(e.target.value)}
                    placeholder="e.g. Spiral binding mockup without inner pages, only 4-color printed cover..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none focus:border-[#006d32] focus:ring-1 focus:ring-[#006d32] resize-none"
                  />
                </div>
              )}
            </div>
          )}

          {/* Product source tabs: New | Material Code | Category */}
          <div className="space-y-2.5">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400 font-sans">
              Product Source
            </label>

            <div className="grid w-full max-w-3xl grid-cols-3 gap-1 p-1 rounded-xl bg-slate-100 dark:bg-zinc-800/80 border border-slate-200/80 dark:border-white/[0.06]">
              <button
                type="button"
                aria-pressed={samplingSearchMode === "new"}
                onClick={() => onSetSamplingSearchMode("new")}
                className={`min-h-9 px-1.5 py-2 rounded-lg text-center text-[10px] leading-tight font-bold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006d32] sm:px-3 sm:text-xs ${
                  samplingSearchMode === "new"
                    ? "bg-[#006d32] text-white shadow-2xs"
                    : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200"
                }`}
              >
                Brand New
              </button>

              <button
                type="button"
                aria-pressed={samplingSearchMode === "material_code"}
                onClick={() => onSetSamplingSearchMode("material_code")}
                className={`min-h-9 px-1.5 py-2 rounded-lg text-center text-[10px] leading-tight font-bold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006d32] sm:px-3 sm:text-xs ${
                  samplingSearchMode === "material_code"
                    ? "bg-[#006d32] text-white shadow-2xs"
                    : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200"
                }`}
              >
                Material Code
              </button>

              <button
                type="button"
                aria-pressed={samplingSearchMode === "binding"}
                onClick={() => onSetSamplingSearchMode("binding")}
                className={`min-h-9 px-1.5 py-2 rounded-lg text-center text-[10px] leading-tight font-bold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006d32] sm:px-3 sm:text-xs ${
                  samplingSearchMode === "binding"
                    ? "bg-[#006d32] text-white shadow-2xs"
                    : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200"
                }`}
              >
                Category & Binding
              </button>
            </div>

            {/* ══════════════════════════════════════════════════════════════
                1. NEW PRODUCT SECTION
               ══════════════════════════════════════════════════════════════ */}
            {samplingSearchMode === "new" && (
              <div className="space-y-3 pt-0.5">
                {/* Product Description */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300">
                    Product Description <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={productDescription}
                    onChange={(e) => onSetProductDescription(e.target.value)}
                    placeholder="Enter product title or prototype description (e.g. A5 Spiral Notebook, 160 pages)..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none focus:border-[#006d32] focus:ring-1 focus:ring-[#006d32] resize-none"
                  />
                </div>

                {/* Category Hierarchy */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300">
                      Category Hierarchy
                    </label>
                    {(selectedCategory || selectedSubCategory || selectedThirdCategory) && (
                      <button
                        type="button"
                        onClick={() => {
                          onSelectCategory("");
                          onSelectSubCategory("");
                          onSelectThirdCategory("");
                        }}
                        className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 cursor-pointer"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {/* Category */}
                    <div>
                      <label className="block text-[10.5px] font-medium text-slate-500 dark:text-zinc-400 mb-0.5">
                        Category
                      </label>
                      <div className="relative">
                        <select
                          value={selectedCategory}
                          onChange={(e) => {
                            onSelectCategory(e.target.value);
                            onSelectSubCategory("");
                            onSelectThirdCategory("");
                          }}
                          className="w-full h-9 pl-3 pr-8 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-medium text-zinc-900 dark:text-zinc-100 outline-none focus:border-[#006d32] focus:ring-1 focus:ring-[#006d32] cursor-pointer appearance-none"
                        >
                          <option value="">Select Category...</option>
                          {productCategories.map((c) => (
                            <option key={c.name} value={c.name}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 text-zinc-400 pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
                      </div>
                    </div>

                    {/* Sub Category */}
                    <div>
                      <label className="block text-[10.5px] font-medium text-slate-500 dark:text-zinc-400 mb-0.5">
                        Sub Category
                      </label>
                      <div className="relative">
                        <select
                          disabled={!selectedCategory || subCategoryOptions.length === 0}
                          value={selectedSubCategory}
                          onChange={(e) => {
                            onSelectSubCategory(e.target.value);
                            onSelectThirdCategory("");
                          }}
                          className={`w-full h-9 pl-3 pr-8 rounded-xl border text-xs font-medium outline-none appearance-none ${
                            !selectedCategory || subCategoryOptions.length === 0
                              ? "border-slate-200/60 dark:border-zinc-800 bg-slate-100/70 dark:bg-zinc-800/40 text-slate-400 dark:text-zinc-500 cursor-not-allowed"
                              : "border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:border-[#006d32] focus:ring-1 focus:ring-[#006d32] cursor-pointer"
                          }`}
                        >
                          <option value="">
                            {!selectedCategory
                              ? "Select Category first"
                              : subCategoryOptions.length === 0
                                ? "No sub-categories"
                                : "Select Sub Category..."}
                          </option>
                          {subCategoryOptions.map((s) => (
                            <option key={s.name} value={s.name}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 text-zinc-400 pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
                      </div>
                    </div>

                    {/* Third Category */}
                    <div>
                      <label className="block text-[10.5px] font-medium text-slate-500 dark:text-zinc-400 mb-0.5">
                        Third Category
                      </label>
                      <div className="relative">
                        <select
                          disabled={!selectedSubCategory || thirdCategoryOptions.length === 0}
                          value={selectedThirdCategory}
                          onChange={(e) => onSelectThirdCategory(e.target.value)}
                          className={`w-full h-9 pl-3 pr-8 rounded-xl border text-xs font-medium outline-none appearance-none ${
                            !selectedSubCategory || thirdCategoryOptions.length === 0
                              ? "border-slate-200/60 dark:border-zinc-800 bg-slate-100/70 dark:bg-zinc-800/40 text-slate-400 dark:text-zinc-500 cursor-not-allowed"
                              : "border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:border-[#006d32] focus:ring-1 focus:ring-[#006d32] cursor-pointer"
                          }`}
                        >
                          <option value="">
                            {!selectedSubCategory
                              ? "Select Sub Category first"
                              : thirdCategoryOptions.length === 0
                                ? "None"
                                : "Select Third Category..."}
                          </option>
                          {thirdCategoryOptions.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 text-zinc-400 pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ══════════════════════════════════════════════════════════════
                2. MATERIAL CODE SECTION
               ══════════════════════════════════════════════════════════════ */}
            {samplingSearchMode === "material_code" && (
              <div className="space-y-2 pt-0.5">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={materialSearchQuery}
                    onChange={(e) => onSetMaterialSearchQuery(e.target.value)}
                    placeholder="Search material code or product description..."
                    className="w-full h-9 pl-9 pr-8 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none focus:border-[#006d32] focus:ring-1 focus:ring-[#006d32]"
                  />
                  {materialSearchQuery && (
                    <button
                      type="button"
                      onClick={() => onSetMaterialSearchQuery("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 p-1 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className={`border border-slate-200 dark:border-zinc-700 rounded-xl ${includesMockup ? "max-h-72" : "max-h-48"} overflow-y-auto divide-y divide-slate-100 dark:divide-zinc-800 bg-slate-50/40 dark:bg-zinc-900/40`}>
                  {isSearchingMaterial ? (
                    <div className="py-6 text-center text-xs text-zinc-400 font-mono">
                      Searching product catalog...
                    </div>
                  ) : materialSearchResults.length === 0 ? (
                    <div className="py-6 px-3 text-center text-xs text-slate-400 dark:text-zinc-500">
                      {materialSearchQuery.trim()
                        ? "No matching products found."
                        : "Enter a material code or description to search."}
                    </div>
                  ) : (
                    materialSearchResults.map((item) => {
                      const isSelected = selectedDbSample?.id === item.id;
                      return (
                        <div
                          key={item.id}
                          className={`p-2.5 transition-colors flex items-center justify-between gap-3 text-left ${
                            isSelected
                              ? "bg-emerald-500/10 dark:bg-emerald-950/40 border-l-3 border-[#006d32]"
                              : "hover:bg-white dark:hover:bg-zinc-800"
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => onSelectDbSample(item)}
                            aria-pressed={isSelected}
                            className="min-w-0 flex-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#006d32]"
                          >
                            <div className="flex items-center gap-2">
                              {item.material_code && (
                                <span className="font-mono text-[10.5px] font-bold px-1.5 py-0.2 rounded bg-white dark:bg-zinc-800 text-[#006d32] dark:text-emerald-300 border border-[#006d32]/20">
                                  {item.material_code}
                                </span>
                              )}
                              <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                                {item.product_description}
                              </span>
                            </div>
                            {(item.customer || item.sr_number || item.product_category) && (
                              <div className="flex items-center gap-2 mt-0.5 text-[10.5px] text-[#64748B] dark:text-zinc-400">
                                {item.customer && <span>{item.customer}</span>}
                                {item.sr_number && <span>• Ref: {item.sr_number}</span>}
                                {item.product_category && (
                                  <span className="shrink-0 text-emerald-700 dark:text-emerald-400 font-medium">
                                    • {item.product_category}{item.product_sub_category && ` › ${item.product_sub_category}`}
                                  </span>
                                )}
                              </div>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => onInspectProduct(item)}
                            aria-label={`Inspect ${item.material_code || item.product_description}`}
                            title="Inspect product specifications"
                            className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-[11px] font-semibold text-slate-600 transition hover:border-indigo-300 hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:text-indigo-300"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>Inspect</span>
                          </button>

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

            {/* ══════════════════════════════════════════════════════════════
                3. CATEGORY & BINDING SECTION
               ══════════════════════════════════════════════════════════════ */}
            {samplingSearchMode === "binding" && (
              <div className="space-y-3 pt-0.5">
                <p className="-mt-1 text-[11px] text-slate-500 dark:text-zinc-400">
                  Narrow saved products by category first, then refine by their recorded binding values.
                </p>
                {/* Category Hierarchy */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300">
                      Category Hierarchy
                    </label>
                    {(selectedCategory || selectedSubCategory || selectedThirdCategory) && (
                      <button
                        type="button"
                        onClick={() => {
                          onSelectCategory("");
                          onSelectSubCategory("");
                          onSelectThirdCategory("");
                        }}
                        className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 cursor-pointer"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {/* Category */}
                    <div>
                      <label className="block text-[10.5px] font-medium text-slate-500 dark:text-zinc-400 mb-0.5">
                        Category
                      </label>
                      <div className="relative">
                        <select
                          value={selectedCategory}
                          onChange={(e) => {
                            onSelectCategory(e.target.value);
                            onSelectSubCategory("");
                            onSelectThirdCategory("");
                          }}
                          className="w-full h-9 pl-3 pr-8 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-medium text-zinc-900 dark:text-zinc-100 outline-none focus:border-[#006d32] focus:ring-1 focus:ring-[#006d32] cursor-pointer appearance-none"
                        >
                          <option value="">All Categories...</option>
                          {productCategories.map((c) => (
                            <option key={c.name} value={c.name}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 text-zinc-400 pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
                      </div>
                    </div>

                    {/* Sub Category */}
                    <div>
                      <label className="block text-[10.5px] font-medium text-slate-500 dark:text-zinc-400 mb-0.5">
                        Sub Category
                      </label>
                      <div className="relative">
                        <select
                          disabled={!selectedCategory || subCategoryOptions.length === 0}
                          value={selectedSubCategory}
                          onChange={(e) => {
                            onSelectSubCategory(e.target.value);
                            onSelectThirdCategory("");
                          }}
                          className={`w-full h-9 pl-3 pr-8 rounded-xl border text-xs font-medium outline-none appearance-none ${
                            !selectedCategory || subCategoryOptions.length === 0
                              ? "border-slate-200/60 dark:border-zinc-800 bg-slate-100/70 dark:bg-zinc-800/40 text-slate-400 dark:text-zinc-500 cursor-not-allowed"
                              : "border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:border-[#006d32] focus:ring-1 focus:ring-[#006d32] cursor-pointer"
                          }`}
                        >
                          <option value="">
                            {!selectedCategory
                              ? "Select Category first"
                              : subCategoryOptions.length === 0
                                ? "No sub-categories"
                                : "All Sub Categories..."}
                          </option>
                          {subCategoryOptions.map((s) => (
                            <option key={s.name} value={s.name}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 text-zinc-400 pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
                      </div>
                    </div>

                    {/* Third Category */}
                    <div>
                      <label className="block text-[10.5px] font-medium text-slate-500 dark:text-zinc-400 mb-0.5">
                        Third Category
                      </label>
                      <div className="relative">
                        <select
                          disabled={!selectedSubCategory || thirdCategoryOptions.length === 0}
                          value={selectedThirdCategory}
                          onChange={(e) => onSelectThirdCategory(e.target.value)}
                          className={`w-full h-9 pl-3 pr-8 rounded-xl border text-xs font-medium outline-none appearance-none ${
                            !selectedSubCategory || thirdCategoryOptions.length === 0
                              ? "border-slate-200/60 dark:border-zinc-800 bg-slate-100/70 dark:bg-zinc-800/40 text-slate-400 dark:text-zinc-500 cursor-not-allowed"
                              : "border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:border-[#006d32] focus:ring-1 focus:ring-[#006d32] cursor-pointer"
                          }`}
                        >
                          <option value="">
                            {!selectedSubCategory
                              ? "Select Sub Category first"
                              : thirdCategoryOptions.length === 0
                                ? "None"
                                : "All Third Categories..."}
                          </option>
                          {thirdCategoryOptions.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 text-zinc-400 pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Binding Selection */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300">
                      Binding
                    </label>
                    <span className="text-[10px] text-slate-500 dark:text-zinc-400">Options from NB_BINDING</span>
                    {(selectedBinding1 || selectedBinding2) && (
                      <button
                        type="button"
                        onClick={() => {
                          onSelectBinding1("");
                          onSelectBinding2("");
                        }}
                        className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 cursor-pointer"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {/* Binding 1 */}
                    <div className="space-y-1">
                      <label className="block text-[10.5px] font-medium text-slate-500 dark:text-zinc-400">
                        Binding 1
                      </label>
                      <div className="relative">
                        <select
                          value={selectedBinding1}
                          disabled={isLoadingBindingHierarchy}
                          onChange={(e) => onSelectBinding1(e.target.value)}
                          className={`w-full h-9 pl-3 pr-8 rounded-xl border text-xs font-medium outline-none appearance-none ${
                            isLoadingBindingHierarchy
                              ? "border-slate-200/60 dark:border-zinc-800 bg-slate-100/70 dark:bg-zinc-800/40 text-slate-400 dark:text-zinc-500 cursor-wait"
                              : "border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:border-[#006d32] focus:ring-1 focus:ring-[#006d32] cursor-pointer"
                          }`}
                        >
                          <option value="">
                            {isLoadingBindingHierarchy
                              ? "Loading binding options..."
                              : selectedCategory && bindingHierarchy.binding1_options.length === 0
                                ? "No NB_BINDING options available"
                                : "All Binding 1 Types..."}
                          </option>
                          {bindingHierarchy.binding1_options.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 text-zinc-400 pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
                      </div>
                    </div>

                    {/* Binding 2 */}
                    <div className="space-y-1">
                      <label className="block text-[10.5px] font-medium text-slate-500 dark:text-zinc-400">
                        Binding 2
                      </label>
                      <div className="relative">
                        <select
                          disabled={isLoadingBindingHierarchy || !selectedBinding1 || binding2Options.length === 0}
                          value={selectedBinding2}
                          onChange={(e) => onSelectBinding2(e.target.value)}
                          className={`w-full h-9 pl-3 pr-8 rounded-xl border text-xs font-medium outline-none appearance-none ${
                            isLoadingBindingHierarchy || !selectedBinding1 || binding2Options.length === 0
                              ? "border-slate-200/60 dark:border-zinc-800 bg-slate-100/70 dark:bg-zinc-800/40 text-slate-400 dark:text-zinc-500 cursor-not-allowed"
                              : "border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:border-[#006d32] focus:ring-1 focus:ring-[#006d32] cursor-pointer"
                          }`}
                        >
                          <option value="">
                            {isLoadingBindingHierarchy
                              ? "Loading binding options..."
                              : !selectedBinding1
                                ? "Select Binding 1 first..."
                                : binding2Options.length === 0
                                  ? "No Binding 2 options"
                                  : "All Binding 2 Types..."}
                          </option>
                          {binding2Options.map((opt: string) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 text-zinc-400 pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
                      </div>
                    </div>
                  </div>
                  <p className="text-[10.5px] leading-relaxed text-slate-500 dark:text-zinc-400">
                    Product results require saved NB_BINDING values that match these catalog choices.
                  </p>
                </div>

                {/* Matching Products (Unlimited) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                        Matching Products
                      </span>
                      <span className="px-1.5 py-0.2 rounded font-mono text-[10.5px] font-bold bg-[#006d32]/10 text-[#006d32] dark:text-emerald-400">
                        {isSearchingBinding ? "..." : bindingSearchResults.length}
                      </span>
                    </div>

                    {activeBindingFilters.length > 0 && (
                      <span
                        title={activeBindingFilters.join(" · ")}
                        className="text-[10.5px] text-slate-500 dark:text-zinc-400 truncate max-w-[45%] text-right"
                      >
                        {activeBindingFilters.join(" · ")}
                      </span>
                    )}
                  </div>

                  <div className="border border-slate-200 dark:border-zinc-700 rounded-xl overflow-hidden bg-slate-50/40 dark:bg-zinc-900/40">
                    {activeBindingFilters.length === 0 ? (
                      <div className="py-8 text-center text-xs text-slate-400 dark:text-zinc-500">
                        Choose a Category or Binding type above
                      </div>
                    ) : isSearchingBinding ? (
                      <div className="py-8 text-center text-xs text-slate-400 dark:text-zinc-500 font-mono">
                        Searching products...
                      </div>
                    ) : bindingSearchResults.length === 0 ? (
                      <div className="py-8 px-3 text-center text-xs text-slate-400 dark:text-zinc-500">
                        {selectedBinding1 || selectedBinding2
                          ? "No saved products match these NB_BINDING values in the selected category path."
                          : "No products match these category filters."}
                      </div>
                    ) : (
                      <BindingProductResults
                        items={bindingSearchResults}
                        selectedItem={selectedDbSample}
                        onSelect={onSelectDbSample}
                        onInspect={onInspectProduct}
                        viewportHeight={includesMockup ? 360 : BINDING_RESULT_VIEWPORT_HEIGHT}
                      />
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {hasExistingMockupProduct && (
            <section className="rounded-xl border border-amber-200/80 bg-amber-50/60 p-3 dark:border-amber-800/50 dark:bg-amber-950/20">
              <div className="mb-2">
                <h4 className="text-xs font-bold text-slate-900 dark:text-zinc-100">Is Design Needed?</h4>
                <p className="mt-0.5 text-[11px] text-slate-600 dark:text-zinc-400">
                  Choose whether this existing product also needs a design request.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[true, false].map((needed) => (
                  <button
                    key={String(needed)}
                    type="button"
                    aria-pressed={designNeeded === needed}
                    onClick={() => onSetDesignNeeded(needed)}
                    className={`h-8.5 rounded-lg border text-xs font-bold transition-colors ${
                      designNeeded === needed
                        ? "border-[#006d32] bg-[#006d32] text-white"
                        : "border-slate-200 bg-white text-slate-700 hover:border-[#006d32]/50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
                    }`}
                  >
                    {needed ? "Yes, add Design" : "No, Design not needed"}
                  </button>
                ))}
              </div>
            </section>
          )}

          {includesMockup && samplingSearchMode === "new" && (
            <section className="rounded-xl border border-purple-200/80 bg-purple-50/60 p-3 dark:border-purple-800/50 dark:bg-purple-950/20">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-purple-600 text-white dark:bg-purple-400 dark:text-purple-950">
                    <Check className="h-3 w-3 stroke-[3]" />
                  </span>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-zinc-100">Design Needed</h4>
                </div>
                <span className="shrink-0 rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-purple-800 dark:bg-purple-900/60 dark:text-purple-200">
                  Yes · Required
                </span>
              </div>
              <p className="mt-1.5 text-[11px] leading-relaxed text-slate-600 dark:text-zinc-400">
                Brand-new Mockup products always include a Design brief. Complete it before staging.
              </p>
            </section>
          )}

          {/* Selected Product Summary Card */}
          {selectedDbSample && samplingSearchMode !== "new" && (
            <div className="rounded-xl border border-[#006d32]/25 bg-emerald-50/60 p-2.5 dark:border-emerald-500/20 dark:bg-emerald-950/25 flex items-center justify-between gap-2 animate-smooth-toast">
              <div className="min-w-0 flex-1 flex items-center gap-2">
                <span className="font-bold text-xs text-[#006d32] dark:text-emerald-400 shrink-0">
                  Selected:
                </span>
                {(selectedDbSample.material_code || selectedDbSample.sr_number) && (
                  <span className="font-mono font-bold text-xs text-zinc-900 dark:text-zinc-100 shrink-0">
                    {selectedDbSample.material_code || selectedDbSample.sr_number}
                  </span>
                )}
                <span className="text-xs text-zinc-700 dark:text-zinc-300 truncate">
                  {selectedDbSample.product_description}
                </span>
              </div>
              {selectedDbSample.product_category && (
                <span className="shrink-0 text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-100/70 text-[#006d32] dark:bg-emerald-900/60 dark:text-emerald-300">
                  {selectedDbSample.product_category}
                </span>
              )}
            </div>
          )}

          {includesCosting && (
            <section className="space-y-4 rounded-2xl border border-teal-200/80 bg-teal-50/40 p-4 dark:border-teal-800/50 dark:bg-teal-950/15 sm:p-5">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-zinc-100">Costing Details</h4>
                <p className="mt-1 text-xs text-slate-600 dark:text-zinc-400">
                  Complete the customer and quantity information before sending this request to Costing.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <label className="space-y-1 text-[11px] font-semibold text-slate-700 dark:text-zinc-300">
                  <span>Costing required date <span className="text-rose-500">*</span></span>
                  <input required type="date" value={costingRequiredDate} onChange={(event) => onSetCostingRequiredDate(event.target.value)} className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-900 outline-none focus:border-[#006d32] focus:ring-2 focus:ring-[#006d32]/15 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100" />
                </label>
                <label className="space-y-1 text-[11px] font-semibold text-slate-700 dark:text-zinc-300">
                  <span>Quantity for costing <span className="text-rose-500">*</span></span>
                  <input required min="1" step="1" type="number" inputMode="numeric" value={qtyDesignCosting} onChange={(event) => onSetQtyDesignCosting(event.target.value)} placeholder="e.g. 10000" className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-900 outline-none focus:border-[#006d32] focus:ring-2 focus:ring-[#006d32]/15 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100" />
                </label>
                <label className="space-y-1 text-[11px] font-semibold text-slate-700 dark:text-zinc-300">
                  <span>Customer SKU <span className="text-rose-500">*</span></span>
                  <input required value={customerProductCode} onChange={(event) => onSetCustomerProductCode(event.target.value)} placeholder="Customer product code" className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-900 outline-none focus:border-[#006d32] focus:ring-2 focus:ring-[#006d32]/15 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100" />
                </label>
                <label className="space-y-1 text-[11px] font-semibold text-slate-700 dark:text-zinc-300">
                  <span>Barcode <span className="text-rose-500">*</span></span>
                  <input required value={barcode} onChange={(event) => onSetBarcode(event.target.value)} placeholder="Barcode" className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-900 outline-none focus:border-[#006d32] focus:ring-2 focus:ring-[#006d32]/15 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100" />
                </label>
                <label className="space-y-1 text-[11px] font-semibold text-slate-700 dark:text-zinc-300">
                  <span>Brand <span className="text-rose-500">*</span></span>
                  <input required value={brandName} onChange={(event) => onSetBrandName(event.target.value)} placeholder="Brand name" className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-900 outline-none focus:border-[#006d32] focus:ring-2 focus:ring-[#006d32]/15 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100" />
                </label>
                <label className="space-y-1 text-[11px] font-semibold text-slate-700 dark:text-zinc-300">
                  <span>Unit <span className="text-rose-500">*</span></span>
                  <select required value={unitPcPack} onChange={(event) => onSetUnitPcPack(event.target.value)} className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-900 outline-none focus:border-[#006d32] focus:ring-2 focus:ring-[#006d32]/15 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100">
                    <option value="PC">PC</option>
                    <option value="Pack">Pack</option>
                  </select>
                </label>
                {unitPcPack === "Pack" && (
                  <label className="space-y-1 text-[11px] font-semibold text-slate-700 dark:text-zinc-300">
                    <span>Pieces per pack <span className="text-rose-500">*</span></span>
                    <input required min="1" step="1" type="number" inputMode="numeric" value={qtyPerPack} onChange={(event) => onSetQtyPerPack(event.target.value)} placeholder="e.g. 10" className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-900 outline-none focus:border-[#006d32] focus:ring-2 focus:ring-[#006d32]/15 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100" />
                  </label>
                )}
              </div>
              {unitPcPack === "PC" && <p className="text-[11px] text-slate-500 dark:text-zinc-400">Pieces per pack is 1 for PC units.</p>}
            </section>
          )}
        </div>

        {/* Actions Footer */}
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-white px-6 py-4 dark:border-white/[0.06] dark:bg-[#161822]">
          <button
            type="button"
            onClick={onBackToScopes}
            className="h-9 px-3 rounded-xl bg-slate-100 dark:bg-white/[0.06] text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:bg-slate-200/80 transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>

          <div className="ml-auto flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-3 rounded-xl bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-zinc-300 hover:bg-slate-200/80 text-xs font-semibold cursor-pointer transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmittingAll || needsDesignDecision}
              className="h-9 px-3.5 rounded-xl text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-[0_2px_10px_rgba(0,109,50,0.25)] hover:shadow-[0_4px_14px_rgba(0,109,50,0.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006d32] focus-visible:ring-offset-2 disabled:opacity-50 active:scale-98"
              style={{ background: "linear-gradient(135deg, #006d32 0%, #00d166 100%)" }}
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>
                {needsDesignDecision
                  ? "Choose Design Need"
                  : needsDesignBrief
                    ? "Continue to Design Brief"
                    : includesCosting && selectedScopes.length === 1
                      ? "Add Costing Request"
                      : "Stage Product"}
              </span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AddProductSamplingStep;
