import React, { useMemo, useState, useRef, useEffect } from "react";
import { BindingHierarchyResponse, ProductSearchResult } from "../types";
import {
  Search,
  RotateCcw,
  Layers,
  Eye,
  Check,
  ChevronDown,
  X,
  Copy,
  Plus,
} from "@/components/ui/icons";
import { CANONICAL_BINDING_1_STYLES } from "../constants/binding";

export interface BindingHierarchySearchProps {
  bindingHierarchy: BindingHierarchyResponse;
  selectedBinding1: string;
  selectedBinding2: string;
  onBinding1Change: (b1: string) => void;
  onBinding2Change: (b2: string) => void;
  isLoading: boolean;
  results: ProductSearchResult[];
  onAddCustomProduct: (product: ProductSearchResult) => void;
  onPreviewSpecs: (product: ProductSearchResult) => void;
}

export const BindingHierarchySearch: React.FC<BindingHierarchySearchProps> = ({
  bindingHierarchy,
  selectedBinding1,
  selectedBinding2,
  onBinding1Change,
  onBinding2Change,
  isLoading,
  results,
  onAddCustomProduct,
  onPreviewSpecs,
}) => {
  const [filterQuery, setFilterQuery] = useState("");
  const [isBinding1Open, setIsBinding1Open] = useState(false);
  const [isBinding2Open, setIsBinding2Open] = useState(false);
  const [b1Search, setB1Search] = useState("");
  const [b2Search, setB2Search] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const b1Ref = useRef<HTMLDivElement>(null);
  const b2Ref = useRef<HTMLDivElement>(null);

  const handleCopy = (code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 1500);
  };

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (b1Ref.current && !b1Ref.current.contains(event.target as Node)) {
        setIsBinding1Open(false);
      }
      if (b2Ref.current && !b2Ref.current.contains(event.target as Node)) {
        setIsBinding2Open(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Canonical binding 1 options
  const binding1OptionsWithNA = useMemo(() => {
    const set = new Set([
      ...CANONICAL_BINDING_1_STYLES,
      ...(bindingHierarchy.binding1_options || []),
    ]);
    return Array.from(set).sort((a, b) => {
      if (a === "NA") return 1;
      if (b === "NA") return -1;
      return a.localeCompare(b);
    });
  }, [bindingHierarchy.binding1_options]);

  const availableBinding2Options = useMemo(() => {
    if (!selectedBinding1) return [];
    const list = [...(bindingHierarchy.hierarchy[selectedBinding1] || [])];
    if (!list.includes("NA")) {
      list.push("NA");
    }
    return Array.from(new Set(list)).sort((a, b) => {
      if (a === "NA") return 1;
      if (b === "NA") return -1;
      return a.localeCompare(b);
    });
  }, [selectedBinding1, bindingHierarchy]);

  const filteredB1Options = useMemo(() => {
    const q = b1Search.toLowerCase().trim();
    if (!q) return binding1OptionsWithNA;
    return binding1OptionsWithNA.filter((opt) => opt.toLowerCase().includes(q));
  }, [binding1OptionsWithNA, b1Search]);

  const filteredB2Options = useMemo(() => {
    const q = b2Search.toLowerCase().trim();
    if (!q) return availableBinding2Options;
    return availableBinding2Options.filter((opt) => opt.toLowerCase().includes(q));
  }, [availableBinding2Options, b2Search]);

  const filteredResults = useMemo(() => {
    const q = filterQuery.toLowerCase().trim();
    if (!q) return results;
    return results.filter((p) => {
      const mat = String(p.material_code || "").toLowerCase();
      const desc = String(p.product_description || "").toLowerCase();
      const cust = String(p.customer || "").toLowerCase();
      const b1 = String(p.binding_type_1 || "").toLowerCase();
      const b2 = String(p.binding_type_2 || "").toLowerCase();
      return mat.includes(q) || desc.includes(q) || cust.includes(q) || b1.includes(q) || b2.includes(q);
    });
  }, [results, filterQuery]);

  return (
    <div className="space-y-4">
      {/* 1. Cascading Binding Selectors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Binding 1 Trigger */}
        <div className="relative space-y-1.5" ref={b1Ref}>
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Primary Binding (Binding 1)
            </label>
            <span className="text-[11px] text-slate-400 font-medium">
              {binding1OptionsWithNA.length} options
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              setIsBinding1Open((prev) => !prev);
              setIsBinding2Open(false);
            }}
            className={`w-full h-10 px-3 rounded-xl border transition-all flex items-center justify-between text-left cursor-pointer ${
              isBinding1Open
                ? "border-indigo-500 ring-2 ring-indigo-500/15 bg-white dark:bg-slate-900"
                : selectedBinding1
                ? "border-indigo-300 dark:border-indigo-700 bg-indigo-50/40 dark:bg-indigo-950/20 text-slate-900 dark:text-slate-100 font-medium"
                : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-500 hover:border-slate-400"
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <Layers
                size={14}
                className={selectedBinding1 ? "text-indigo-600 dark:text-indigo-400 shrink-0" : "text-slate-400 shrink-0"}
              />
              <span className={`text-xs sm:text-sm truncate ${selectedBinding1 ? "font-semibold text-slate-900 dark:text-slate-100" : "text-slate-400"}`}>
                {selectedBinding1 || "Choose Primary Binding..."}
              </span>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {selectedBinding1 && (
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    onBinding1Change("");
                    onBinding2Change("");
                  }}
                  className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  title="Clear selection"
                >
                  <X size={13} />
                </span>
              )}
              <ChevronDown
                size={14}
                className={`text-slate-400 transition-transform duration-150 ${isBinding1Open ? "rotate-180 text-indigo-600" : ""}`}
              />
            </div>
          </button>

          {/* Binding 1 Popover Menu */}
          {isBinding1Open && (
            <div className="absolute left-0 right-0 top-full mt-1 z-50 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden">
              <div className="p-2 border-b border-slate-100 dark:border-slate-800">
                <div className="relative">
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={b1Search}
                    onChange={(e) => setB1Search(e.target.value)}
                    placeholder="Filter styles..."
                    className="w-full h-8 pl-8 pr-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                    autoFocus
                  />
                </div>
              </div>

              <div className="max-h-56 overflow-y-auto p-1 space-y-0.5">
                {filteredB1Options.map((b1) => {
                  const isSelected = selectedBinding1 === b1;
                  const subCount = (bindingHierarchy.hierarchy[b1] || []).length;
                  return (
                    <button
                      key={b1}
                      type="button"
                      onClick={() => {
                        onBinding1Change(b1);
                        setIsBinding1Open(false);
                        setB1Search("");
                      }}
                      className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? "bg-indigo-600 text-white font-semibold"
                          : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      <span className="flex items-center gap-1.5 truncate">
                        {isSelected && <Check size={12} className="stroke-[3]" />}
                        <span>{b1}</span>
                      </span>
                      {b1 === "NA" ? (
                        <span className="text-[10px] px-1.5 py-0.2 rounded font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-500">
                          N/A
                        </span>
                      ) : (
                        subCount > 0 && (
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                              isSelected ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                            }`}
                          >
                            {subCount}
                          </span>
                        )
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Binding 2 Trigger */}
        <div className="relative space-y-1.5" ref={b2Ref}>
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Sub-Binding (Binding 2 - Optional)
            </label>
            <span className="text-[11px] text-slate-400 font-medium">
              {selectedBinding1 ? `${availableBinding2Options.length} variations` : "Requires Binding 1"}
            </span>
          </div>

          <button
            type="button"
            disabled={!selectedBinding1}
            onClick={() => {
              if (!selectedBinding1) return;
              setIsBinding2Open((prev) => !prev);
              setIsBinding1Open(false);
            }}
            className={`w-full h-10 px-3 rounded-xl border transition-all flex items-center justify-between text-left ${
              !selectedBinding1
                ? "bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-slate-400 cursor-not-allowed"
                : isBinding2Open
                ? "border-indigo-500 ring-2 ring-indigo-500/15 bg-white dark:bg-slate-900 cursor-pointer"
                : selectedBinding2
                ? "border-indigo-300 dark:border-indigo-700 bg-indigo-50/40 dark:bg-indigo-950/20 text-slate-900 dark:text-slate-100 font-medium cursor-pointer"
                : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-500 hover:border-slate-400 cursor-pointer"
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className={`text-xs sm:text-sm truncate ${selectedBinding2 ? "font-semibold text-slate-900 dark:text-slate-100" : "text-slate-400"}`}>
                {selectedBinding2 || (selectedBinding1 ? "All Variations (optional filter)..." : "Choose Binding 1 first")}
              </span>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {selectedBinding2 && (
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    onBinding2Change("");
                  }}
                  className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  title="Clear selection"
                >
                  <X size={13} />
                </span>
              )}
              <ChevronDown
                size={14}
                className={`text-slate-400 transition-transform duration-150 ${isBinding2Open ? "rotate-180 text-indigo-600" : ""}`}
              />
            </div>
          </button>

          {/* Binding 2 Popover Menu */}
          {isBinding2Open && selectedBinding1 && (
            <div className="absolute left-0 right-0 top-full mt-1 z-50 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden">
              {availableBinding2Options.length > 5 && (
                <div className="p-2 border-b border-slate-100 dark:border-slate-800">
                  <div className="relative">
                    <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      value={b2Search}
                      onChange={(e) => setB2Search(e.target.value)}
                      placeholder="Filter variations..."
                      className="w-full h-8 pl-8 pr-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                      autoFocus
                    />
                  </div>
                </div>
              )}

              <div className="max-h-56 overflow-y-auto p-1 space-y-0.5">
                <button
                  type="button"
                  onClick={() => {
                    onBinding2Change("");
                    setIsBinding2Open(false);
                    setB2Search("");
                  }}
                  className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-between cursor-pointer ${
                    !selectedBinding2
                      ? "bg-indigo-600 text-white font-semibold"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <span>All Variations ({availableBinding2Options.length})</span>
                  {!selectedBinding2 && <Check size={12} className="stroke-[3]" />}
                </button>

                {filteredB2Options.map((b2) => {
                  const isSelected = selectedBinding2 === b2;
                  return (
                    <button
                      key={b2}
                      type="button"
                      onClick={() => {
                        onBinding2Change(b2);
                        setIsBinding2Open(false);
                        setB2Search("");
                      }}
                      className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? "bg-indigo-600 text-white font-semibold"
                          : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      <span className="flex items-center gap-1.5 truncate">
                        {isSelected && <Check size={12} className="stroke-[3]" />}
                        <span>{b2}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. When No Binding 1 is selected yet: Clean Grid */}
      {!selectedBinding1 && (
        <div className="space-y-2.5 pt-1">
          <div className="flex items-center justify-between px-0.5">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Browse All {binding1OptionsWithNA.length} Binding Styles
            </span>
            <span className="text-[11px] text-slate-400">
              Select a style to view products
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {binding1OptionsWithNA.map((b1) => {
              const variations = (bindingHierarchy.hierarchy[b1] || []).length;
              return (
                <button
                  key={b1}
                  type="button"
                  onClick={() => onBinding1Change(b1)}
                  className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:shadow-xs transition-all text-left group flex flex-col justify-between h-20 cursor-pointer active:scale-[0.98]"
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      <Layers size={13} />
                    </span>
                    {b1 === "NA" ? (
                      <span className="text-[10px] px-1.5 py-0.2 rounded font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-500">
                        N/A
                      </span>
                    ) : variations > 0 ? (
                      <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                        {variations} var
                      </span>
                    ) : null}
                  </div>
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 truncate w-full" title={b1}>
                    {b1}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Results Section when Binding 1 is selected */}
      {selectedBinding1 && (
        <div className="space-y-3 pt-0.5">
          {/* Active selection bar */}
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs min-w-0">
              <span className="text-slate-500">Selected:</span>
              <span className="font-semibold px-2 py-0.5 rounded bg-indigo-600 text-white truncate text-xs shadow-2xs">
                {selectedBinding1}
              </span>
              {selectedBinding2 && (
                <>
                  <span className="text-slate-400">&rarr;</span>
                  <span className="font-semibold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 truncate text-xs">
                    {selectedBinding2}
                  </span>
                </>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                onBinding1Change("");
                onBinding2Change("");
              }}
              className="text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white px-2 py-0.5 rounded hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-colors shrink-0 cursor-pointer flex items-center gap-1"
            >
              <RotateCcw size={11} />
              <span>Reset</span>
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Matching Products ({filteredResults.length})
            </span>
            <div className="relative w-full sm:w-64">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                placeholder="Filter matching products..."
                className="w-full h-8.5 pl-8 pr-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
              />
            </div>
          </div>

          {isLoading && (
            <div className="py-14 text-center space-y-2">
              <RotateCcw size={18} className="animate-spin text-indigo-600 mx-auto" />
              <p className="text-xs text-slate-400 font-medium">Querying products matching binding styles...</p>
            </div>
          )}

          {!isLoading && filteredResults.length === 0 && (
            <div className="py-10 px-4 text-center rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700 space-y-2.5">
              <div className="space-y-1">
                <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
                  No catalog products match this binding
                </p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  You can start a custom notebook configured with {selectedBinding1}.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  onAddCustomProduct({
                    id: 0,
                    sr_number: "CUSTOM",
                    material_code: `SPEC-${Date.now().toString().slice(-5)}`,
                    product_description: `${selectedBinding1} Custom Notebook`,
                    customer: "",
                    target_plant: "",
                    binding_type_1: selectedBinding1,
                    binding_type_2: selectedBinding2 || "NA",
                    details_count: 378,
                  })
                }
                className="h-8.5 px-3.5 text-xs font-medium rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white transition-colors inline-flex items-center gap-1 cursor-pointer shadow-2xs select-none"
              >
                <Plus size={13} />
                <span>Start Custom Spec</span>
              </button>
            </div>
          )}

          {!isLoading && filteredResults.length > 0 && (
            <div className="space-y-2">
              {filteredResults.map((product) => (
                <div
                  key={product.id}
                  className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-900/60 hover:shadow-xs shadow-2xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-xs text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/70 px-2 py-0.5 rounded border border-indigo-200/70 dark:border-indigo-800/60 shadow-2xs">
                        {product.material_code}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleCopy(product.material_code, e)}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                        title="Copy code"
                      >
                        {copiedCode === product.material_code ? (
                          <Check size={12} className="text-emerald-500 stroke-[3]" />
                        ) : (
                          <Copy size={12} />
                        )}
                      </button>
                      <span className="text-xs text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded font-medium">
                        {product.binding_type_1 || "—"}
                      </span>
                      {product.binding_type_2 && (
                        <span className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                          {product.binding_type_2}
                        </span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 truncate" title={product.product_description}>
                      {product.product_description}
                    </p>
                    <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
                      <span>SR: {product.sr_number}</span>
                      <span>&bull;</span>
                      <span>Customer: {product.customer || "Standard Spec"}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => onPreviewSpecs(product)}
                      className="h-7.5 px-2.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md border border-slate-200/90 dark:border-slate-700 transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                      title="Inspect specifications"
                    >
                      <Eye size={12} className="text-slate-400" />
                      <span>Specs</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onAddCustomProduct(product)}
                      className="h-7.5 px-3 text-xs font-medium rounded-md bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center gap-1 cursor-pointer shadow-2xs select-none"
                      title="Use this base product and configure specifications"
                    >
                      <Plus size={13} className="stroke-[2.5]" />
                      <span>Use Base</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
