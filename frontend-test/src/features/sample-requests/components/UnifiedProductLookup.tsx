import React, { useState, useEffect, useMemo, useRef } from "react";
import { ProductSearchResult, BindingHierarchyResponse } from "../types";
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
  Package,
  Filter,
} from "@/components/ui/icons";
import { CANONICAL_BINDING_1_STYLES } from "../constants/binding";

export interface UnifiedProductLookupProps {
  // Binding hierarchy master data
  bindingHierarchy: BindingHierarchyResponse;
  // Material search props
  query: string;
  onQueryChange: (q: string) => void;
  onSearch: () => void;
  isLoading: boolean;
  hasSearched: boolean;
  results: ProductSearchResult[];
  // Binding filter state & handlers
  selectedBinding1: string;
  selectedBinding2: string;
  onBinding1Change: (b1: string) => void;
  onBinding2Change: (b2: string) => void;
  isSearchingBinding: boolean;
  // Action callbacks
  onAddProduct: (product: ProductSearchResult) => void;
  onPreviewSpecs: (product: ProductSearchResult) => void;
  onClose?: () => void;
  addedProductCodes?: string[];
  modalTitle?: string;
  modalSubtitle?: string;
}

export const UnifiedProductLookup: React.FC<UnifiedProductLookupProps> = ({
  bindingHierarchy,
  query,
  onQueryChange,
  onSearch,
  isLoading,
  hasSearched,
  results,
  selectedBinding1,
  selectedBinding2,
  onBinding1Change,
  onBinding2Change,
  isSearchingBinding,
  onAddProduct,
  onPreviewSpecs,
  onClose,
  addedProductCodes = [],
}) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [searchMode, setSearchMode] = useState<"material" | "binding">(() =>
    selectedBinding1 ? "binding" : "material"
  );
  const [isB1Open, setIsB1Open] = useState(false);
  const [isB2Open, setIsB2Open] = useState(false);
  const [b1Search, setB1Search] = useState("");
  const [b2Search, setB2Search] = useState("");

  const [selectedC1Caliper, setSelectedC1Caliper] = useState("");
  const [selectedC2Material, setSelectedC2Material] = useState("");
  const [selectedC2Finish, setSelectedC2Finish] = useState("");

  const [isC1Open, setIsC1Open] = useState(false);
  const [isC2MOpen, setIsC2MOpen] = useState(false);
  const [isC2FOpen, setIsC2FOpen] = useState(false);

  const [c1Search, setC1Search] = useState("");
  const [c2MSearch, setC2MSearch] = useState("");
  const [c2FSearch, setC2FSearch] = useState("");

  const b1Ref = useRef<HTMLDivElement>(null);
  const b2Ref = useRef<HTMLDivElement>(null);
  const c1Ref = useRef<HTMLDivElement>(null);
  const c2MRef = useRef<HTMLDivElement>(null);
  const c2FRef = useRef<HTMLDivElement>(null);

  // Switch search modes cleanly without cross-contamination
  const handleSwitchMode = (newMode: "material" | "binding") => {
    setSearchMode(newMode);
    if (newMode === "material") {
      onBinding1Change("");
      onBinding2Change("");
      setSelectedC1Caliper("");
      setSelectedC2Material("");
      setSelectedC2Finish("");
      setIsB1Open(false);
      setIsB2Open(false);
      setIsC1Open(false);
      setIsC2MOpen(false);
      setIsC2FOpen(false);
    } else {
      onQueryChange("");
    }
  };

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (b1Ref.current && !b1Ref.current.contains(event.target as Node)) {
        setIsB1Open(false);
      }
      if (b2Ref.current && !b2Ref.current.contains(event.target as Node)) {
        setIsB2Open(false);
      }
      if (c1Ref.current && !c1Ref.current.contains(event.target as Node)) {
        setIsC1Open(false);
      }
      if (c2MRef.current && !c2MRef.current.contains(event.target as Node)) {
        setIsC2MOpen(false);
      }
      if (c2FRef.current && !c2FRef.current.contains(event.target as Node)) {
        setIsC2FOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Clear secondary filters when primary binding changes
  useEffect(() => {
    setSelectedC1Caliper("");
    setSelectedC2Material("");
    setSelectedC2Finish("");
  }, [selectedBinding1, selectedBinding2]);

  // Debounced auto-search on query input (only active in material mode)
  useEffect(() => {
    if (searchMode !== "material") return;
    const trimmed = query.trim();
    if (trimmed.length < 2) return;
    const timer = setTimeout(() => {
      onSearch();
    }, 350);
    return () => clearTimeout(timer);
  }, [query, searchMode]);

  const handleCopy = (code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 1500);
  };

  // Canonical Binding 1 Options
  const binding1Options = useMemo(() => {
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

  const binding2Options = useMemo(() => {
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
    if (!q) return binding1Options;
    return binding1Options.filter((opt) => opt.toLowerCase().includes(q));
  }, [binding1Options, b1Search]);

  const filteredB2Options = useMemo(() => {
    const q = b2Search.toLowerCase().trim();
    if (!q) return binding2Options;
    return binding2Options.filter((opt) => opt.toLowerCase().includes(q));
  }, [binding2Options, b2Search]);

  // Helper matchers for specification filtering
  const matchesC1Caliper = (p: ProductSearchResult, filterVal: string) => {
    if (!filterVal) return true;
    const val = (p.c1_caliper_weight || "NA").trim().toUpperCase();
    if (filterVal.toUpperCase() === "NA") {
      return val === "NA" || val === "" || val === "—";
    }
    return val === filterVal.trim().toUpperCase();
  };

  const matchesC2Material = (p: ProductSearchResult, filterVal: string) => {
    if (!filterVal) return true;
    const val = (p.c2_material_type || "NA").trim().toUpperCase();
    if (filterVal.toUpperCase() === "NA") {
      return val === "NA" || val === "" || val === "—";
    }
    return val === filterVal.trim().toUpperCase();
  };

  const matchesC2Finish = (p: ProductSearchResult, filterVal: string) => {
    if (!filterVal) return true;
    const val = (p.c2_cover_finish || "NA").trim().toUpperCase();
    if (filterVal.toUpperCase() === "NA") {
      return val === "NA" || val === "" || val === "—";
    }
    return val === filterVal.trim().toUpperCase();
  };

  // Products matching C2 Material & C2 Finish (used to calculate C1 Caliper options)
  const c1CandidateProducts = useMemo(() => {
    if (!results || results.length === 0) return [];
    return results.filter(
      (p) => matchesC2Material(p, selectedC2Material) && matchesC2Finish(p, selectedC2Finish)
    );
  }, [results, selectedC2Material, selectedC2Finish]);

  // Products matching C1 Caliper & C2 Finish (used to calculate C2 Material options)
  const c2MCandidateProducts = useMemo(() => {
    if (!results || results.length === 0) return [];
    return results.filter(
      (p) => matchesC1Caliper(p, selectedC1Caliper) && matchesC2Finish(p, selectedC2Finish)
    );
  }, [results, selectedC1Caliper, selectedC2Finish]);

  // Products matching C1 Caliper & C2 Material (used to calculate C2 Finish options)
  const c2FCandidateProducts = useMemo(() => {
    if (!results || results.length === 0) return [];
    return results.filter(
      (p) => matchesC1Caliper(p, selectedC1Caliper) && matchesC2Material(p, selectedC2Material)
    );
  }, [results, selectedC1Caliper, selectedC2Material]);

  // Component 1 Caliper / Weight options correlated with other active facets
  const c1CaliperOptions = useMemo(() => {
    if (c1CandidateProducts.length === 0) return [];
    const map = new Map<string, number>();
    let naCount = 0;
    for (const p of c1CandidateProducts) {
      const val = p.c1_caliper_weight;
      if (!val || val.trim() === "" || val.trim().toUpperCase() === "NA" || val.trim() === "—") {
        naCount++;
      } else {
        const key = val.trim();
        map.set(key, (map.get(key) || 0) + 1);
      }
    }
    const sortedKeys = Array.from(map.keys()).sort((a, b) => {
      const numA = parseFloat(a);
      const numB = parseFloat(b);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return a.localeCompare(b);
    });
    const list = sortedKeys.map((key) => ({ value: key, count: map.get(key) || 0 }));
    if (naCount > 0) {
      list.push({ value: "NA", count: naCount });
    }
    return list;
  }, [c1CandidateProducts]);

  // Component 2 Material Type options correlated with other active facets
  const c2MaterialOptions = useMemo(() => {
    if (c2MCandidateProducts.length === 0) return [];
    const map = new Map<string, number>();
    let naCount = 0;
    for (const p of c2MCandidateProducts) {
      const val = p.c2_material_type;
      if (!val || val.trim() === "" || val.trim().toUpperCase() === "NA" || val.trim() === "—") {
        naCount++;
      } else {
        const key = val.trim().toUpperCase();
        map.set(key, (map.get(key) || 0) + 1);
      }
    }
    const sortedKeys = Array.from(map.keys()).sort((a, b) => a.localeCompare(b));
    const list = sortedKeys.map((key) => ({ value: key, count: map.get(key) || 0 }));
    if (naCount > 0) {
      list.push({ value: "NA", count: naCount });
    }
    return list;
  }, [c2MCandidateProducts]);

  // Component 2 Cover Finish options correlated with other active facets
  const c2FinishOptions = useMemo(() => {
    if (c2FCandidateProducts.length === 0) return [];
    const map = new Map<string, number>();
    let naCount = 0;
    for (const p of c2FCandidateProducts) {
      const val = p.c2_cover_finish;
      if (!val || val.trim() === "" || val.trim().toUpperCase() === "NA" || val.trim() === "—") {
        naCount++;
      } else {
        const key = val.trim().toUpperCase();
        map.set(key, (map.get(key) || 0) + 1);
      }
    }
    const sortedKeys = Array.from(map.keys()).sort((a, b) => a.localeCompare(b));
    const list = sortedKeys.map((key) => ({ value: key, count: map.get(key) || 0 }));
    if (naCount > 0) {
      list.push({ value: "NA", count: naCount });
    }
    return list;
  }, [c2FCandidateProducts]);

  // Keep active selections valid if an upstream change eliminates them
  useEffect(() => {
    if (
      selectedC1Caliper &&
      c1CaliperOptions.length > 0 &&
      !c1CaliperOptions.some((o) => o.value.toUpperCase() === selectedC1Caliper.toUpperCase())
    ) {
      setSelectedC1Caliper("");
    }
  }, [c1CaliperOptions, selectedC1Caliper]);

  useEffect(() => {
    if (
      selectedC2Material &&
      c2MaterialOptions.length > 0 &&
      !c2MaterialOptions.some((o) => o.value.toUpperCase() === selectedC2Material.toUpperCase())
    ) {
      setSelectedC2Material("");
    }
  }, [c2MaterialOptions, selectedC2Material]);

  useEffect(() => {
    if (
      selectedC2Finish &&
      c2FinishOptions.length > 0 &&
      !c2FinishOptions.some((o) => o.value.toUpperCase() === selectedC2Finish.toUpperCase())
    ) {
      setSelectedC2Finish("");
    }
  }, [c2FinishOptions, selectedC2Finish]);

  const filteredC1Options = useMemo(() => {
    const q = c1Search.toLowerCase().trim();
    if (!q) return c1CaliperOptions;
    // startsWith match first, then contains, sorted so starts-with results appear first
    const startsWith = c1CaliperOptions.filter((opt) => opt.value.toLowerCase().startsWith(q));
    const contains = c1CaliperOptions.filter(
      (opt) => !opt.value.toLowerCase().startsWith(q) && opt.value.toLowerCase().includes(q)
    );
    return [...startsWith, ...contains];
  }, [c1CaliperOptions, c1Search]);

  const filteredC2MOptions = useMemo(() => {
    const q = c2MSearch.toLowerCase().trim();
    if (!q) return c2MaterialOptions;
    const startsWith = c2MaterialOptions.filter((opt) => opt.value.toLowerCase().startsWith(q));
    const contains = c2MaterialOptions.filter(
      (opt) => !opt.value.toLowerCase().startsWith(q) && opt.value.toLowerCase().includes(q)
    );
    return [...startsWith, ...contains];
  }, [c2MaterialOptions, c2MSearch]);

  const filteredC2FOptions = useMemo(() => {
    const q = c2FSearch.toLowerCase().trim();
    if (!q) return c2FinishOptions;
    const startsWith = c2FinishOptions.filter((opt) => opt.value.toLowerCase().startsWith(q));
    const contains = c2FinishOptions.filter(
      (opt) => !opt.value.toLowerCase().startsWith(q) && opt.value.toLowerCase().includes(q)
    );
    return [...startsWith, ...contains];
  }, [c2FinishOptions, c2FSearch]);

  // Filtered search results accounting for C1 Caliper, C2 Material, and C2 Cover Finish
  const displayedResults = useMemo(() => {
    if (searchMode !== "binding") return results;
    return results.filter(
      (p) =>
        matchesC1Caliper(p, selectedC1Caliper) &&
        matchesC2Material(p, selectedC2Material) &&
        matchesC2Finish(p, selectedC2Finish)
    );
  }, [results, searchMode, selectedC1Caliper, selectedC2Material, selectedC2Finish]);

  const isBusy = isLoading || isSearchingBinding;
  const hasActiveFilters =
    searchMode === "material"
      ? Boolean(query.trim())
      : Boolean(
          selectedBinding1 ||
          selectedBinding2 ||
          selectedC1Caliper ||
          selectedC2Material ||
          selectedC2Finish
        );

  const handleResetFilters = () => {
    if (searchMode === "material") {
      onQueryChange("");
    } else {
      onBinding1Change("");
      onBinding2Change("");
      setSelectedC1Caliper("");
      setSelectedC2Material("");
      setSelectedC2Finish("");
    }
  };

  const handleCreateCustomProductFromBinding = () => {
    if (!selectedBinding1) return;
    const customProd: ProductSearchResult = {
      id: 0,
      sr_number: `CUST-${Date.now().toString().slice(-4)}`,
      material_code: `A1-NEW-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      product_description: `${selectedBinding1}${selectedBinding2 && selectedBinding2 !== "NA" ? ` · ${selectedBinding2}` : ""} Custom Product`,
      binding_type_1: selectedBinding1,
      binding_type_2: selectedBinding2 || undefined,
      details_count: 378,
    };
    onAddProduct(customProd);
  };

  return (
    <div className="space-y-4">
      {/* 1. Search Mode Switcher & Filter Controls */}
      <div className="space-y-3.5 p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/90 dark:border-slate-800 shadow-2xs">
        {/* Mode Segmented Tab Selector */}
        <div className="flex items-center justify-between gap-2 flex-wrap pb-2 border-b border-slate-200/70 dark:border-slate-700/70">
          <div className="inline-flex items-center p-1 bg-slate-200/70 dark:bg-slate-800 rounded-xl shadow-2xs">
            <button
              type="button"
              onClick={() => handleSwitchMode("material")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                searchMode === "material"
                  ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <Search size={13} className="stroke-[2.2]" />
              <span>Search by Material Code</span>
            </button>
            <button
              type="button"
              onClick={() => handleSwitchMode("binding")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                searchMode === "binding"
                  ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <Layers size={13} className="stroke-[2.2]" />
              <span>Filter by Binding Style</span>
            </button>
          </div>

          <span className="text-[11px] text-slate-400 hidden sm:inline font-medium">
            {searchMode === "material"
              ? "Lookup exact material codes or product keywords"
              : "Discover catalog products by binding hierarchy"}
          </span>
        </div>

        {/* MODE A: Search by Material Code */}
        {searchMode === "material" && (
          <div className="space-y-3 animate-in fade-in duration-150">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <Search size={14} className="text-indigo-500" />
                </div>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => onQueryChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      onSearch();
                    }
                  }}
                  placeholder="Enter Material Code (e.g. 600000000, A1-000001) or product title..."
                  className="w-full h-10 pl-10 pr-9 text-xs sm:text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium transition-all shadow-2xs"
                  autoFocus
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => onQueryChange("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded cursor-pointer transition-colors"
                    title="Clear input"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={onSearch}
                disabled={!query.trim() || isBusy}
                className="h-9 px-4 text-xs font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white disabled:opacity-50 transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer shadow-2xs select-none"
              >
                {isBusy ? (
                  <RotateCcw size={13} className="animate-spin" />
                ) : (
                  <Search size={13} className="stroke-[2.2]" />
                )}
                <span>Search Catalog</span>
              </button>
            </div>

            {hasActiveFilters && (
              <div className="flex justify-end pt-0.5">
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                >
                  Reset Search
                </button>
              </div>
            )}
          </div>
        )}

        {/* MODE B: Filter by Binding Style */}
        {searchMode === "binding" && (
          <div className="space-y-3 animate-in fade-in duration-150">
            {/* Binding Filter Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Primary Binding Dropdown */}
              <div className="relative" ref={b1Ref}>
                <button
                  type="button"
                  onClick={() => {
                    setIsB1Open((prev) => !prev);
                    setIsB2Open(false);
                  }}
                  className={`w-full h-10 px-3 rounded-xl border transition-all flex items-center justify-between text-left cursor-pointer text-xs ${
                    isB1Open
                      ? "border-indigo-500 ring-2 ring-indigo-500/15 bg-white dark:bg-slate-900"
                      : selectedBinding1
                      ? "border-indigo-300 dark:border-indigo-700 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-900 dark:text-indigo-200 font-medium"
                      : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:border-slate-400 shadow-2xs"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Layers
                      size={14}
                      className={
                        selectedBinding1
                          ? "text-indigo-600 dark:text-indigo-400 shrink-0"
                          : "text-slate-400 shrink-0"
                      }
                    />
                    <span className="truncate font-medium">
                      {selectedBinding1 ? `Primary: ${selectedBinding1}` : "Select Primary Binding..."}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-1.5">
                    {selectedBinding1 && (
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          onBinding1Change("");
                        }}
                        className="p-0.5 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                        title="Clear Binding 1"
                      >
                        <X size={12} />
                      </span>
                    )}
                    <ChevronDown
                      size={13}
                      className={`text-slate-400 transition-transform ${isB1Open ? "rotate-180" : ""}`}
                    />
                  </div>
                </button>

                {isB1Open && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden animate-in zoom-in-[0.98] duration-150">
                    <div className="p-2 border-b border-slate-100 dark:border-slate-800">
                      <input
                        type="text"
                        value={b1Search}
                        onChange={(e) => setB1Search(e.target.value)}
                        placeholder="Search binding styles..."
                        className="w-full h-8 px-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        autoFocus
                      />
                    </div>
                    <div className="max-h-52 overflow-y-auto p-1 space-y-0.5">
                      <button
                        type="button"
                        onClick={() => {
                          onBinding1Change("");
                          setIsB1Open(false);
                        }}
                        className="w-full px-2.5 py-1.5 text-xs text-left text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                      >
                        All Binding Styles (No filter)
                      </button>
                      {filteredB1Options.map((opt) => {
                        const isSelected = selectedBinding1 === opt;
                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => {
                              onBinding1Change(opt);
                              setIsB1Open(false);
                              setB1Search("");
                            }}
                            className={`w-full px-2.5 py-1.5 text-xs font-medium rounded-lg text-left transition-colors flex items-center justify-between cursor-pointer ${
                              isSelected
                                ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold"
                                : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                            }`}
                          >
                            <span className="truncate">{opt}</span>
                            {isSelected && <Check size={12} className="text-indigo-600 stroke-[3]" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Secondary Binding Dropdown */}
              <div className="relative" ref={b2Ref}>
                <button
                  type="button"
                  disabled={!selectedBinding1 || binding2Options.length === 0}
                  onClick={() => {
                    if (!selectedBinding1) return;
                    setIsB2Open((prev) => !prev);
                    setIsB1Open(false);
                  }}
                  className={`w-full h-10 px-3 rounded-xl border transition-all flex items-center justify-between text-left text-xs ${
                    !selectedBinding1
                      ? "border-slate-200/80 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-800/40 text-slate-400 cursor-not-allowed shadow-2xs"
                      : isB2Open
                      ? "border-indigo-500 ring-2 ring-indigo-500/15 bg-white dark:bg-slate-900 cursor-pointer shadow-2xs"
                      : selectedBinding2
                      ? "border-indigo-300 dark:border-indigo-700 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-900 dark:text-indigo-200 font-medium cursor-pointer shadow-2xs"
                      : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:border-slate-400 cursor-pointer shadow-2xs"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Layers
                      size={14}
                      className={
                        selectedBinding2
                          ? "text-indigo-600 dark:text-indigo-400 shrink-0"
                          : "text-slate-400 shrink-0"
                      }
                    />
                    <span className="truncate font-medium">
                      {!selectedBinding1
                        ? "Select Primary Binding first..."
                        : selectedBinding2
                        ? `Secondary: ${selectedBinding2}`
                        : `Secondary Binding (${binding2Options.length} available)...`}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-1.5">
                    {selectedBinding2 && (
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          onBinding2Change("");
                        }}
                        className="p-0.5 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                        title="Clear Binding 2"
                      >
                        <X size={12} />
                      </span>
                    )}
                    <ChevronDown
                      size={13}
                      className={`text-slate-400 transition-transform ${isB2Open ? "rotate-180" : ""}`}
                    />
                  </div>
                </button>

                {isB2Open && selectedBinding1 && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden animate-in zoom-in-[0.98] duration-150">
                    <div className="p-2 border-b border-slate-100 dark:border-slate-800">
                      <input
                        type="text"
                        value={b2Search}
                        onChange={(e) => setB2Search(e.target.value)}
                        placeholder="Search sub-binding styles..."
                        className="w-full h-8 px-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        autoFocus
                      />
                    </div>
                    <div className="max-h-52 overflow-y-auto p-1 space-y-0.5">
                      <button
                        type="button"
                        onClick={() => {
                          onBinding2Change("");
                          setIsB2Open(false);
                        }}
                        className="w-full px-2.5 py-1.5 text-xs text-left text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                      >
                        All Sub-styles (No filter)
                      </button>
                      {filteredB2Options.map((opt) => {
                        const isSelected = selectedBinding2 === opt;
                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => {
                              onBinding2Change(opt);
                              setIsB2Open(false);
                              setB2Search("");
                            }}
                            className={`w-full px-2.5 py-1.5 text-xs font-medium rounded-lg text-left transition-colors flex items-center justify-between cursor-pointer ${
                              isSelected
                                ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold"
                                : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                            }`}
                          >
                            <span className="truncate">{opt}</span>
                            {isSelected && <Check size={12} className="text-indigo-600 stroke-[3]" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Extended Product Filters: C1 Caliper / Weight, C2 Material Type, C2 Cover Finish */}
            {selectedBinding1 && (
              <div className="space-y-2 pt-2.5 border-t border-slate-200/80 dark:border-slate-700/80 animate-in fade-in duration-150">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Filter size={12} className="text-indigo-500" />
                    <span>Filter Specifications</span>
                    <span className="text-slate-400 font-normal">
                      ({displayedResults.length} of {results.length} products)
                    </span>
                  </span>

                  {(selectedC1Caliper || selectedC2Material || selectedC2Finish) && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedC1Caliper("");
                        setSelectedC2Material("");
                        setSelectedC2Finish("");
                      }}
                      className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                    >
                      Clear Spec Filters
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* Dropdown 1: C1 Caliper / Weight */}
                  <div className="relative" ref={c1Ref}>
                    <button
                      type="button"
                      onClick={() => {
                        setIsC1Open((prev) => !prev);
                        setIsC2MOpen(false);
                        setIsC2FOpen(false);
                        setIsB1Open(false);
                        setIsB2Open(false);
                      }}
                      className={`w-full h-10 px-3 rounded-xl border transition-all flex items-center justify-between text-left cursor-pointer text-xs ${
                        isC1Open
                          ? "border-amber-500 ring-2 ring-amber-500/15 bg-white dark:bg-slate-900"
                          : selectedC1Caliper
                          ? "border-amber-300 dark:border-amber-700 bg-amber-50/60 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 font-medium"
                          : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:border-slate-400 shadow-2xs"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="truncate font-medium">
                          {selectedC1Caliper
                            ? `C1: ${selectedC1Caliper === "NA" ? "NA (No C1)" : `${selectedC1Caliper} GSM`}`
                            : "C1 Caliper / Weight (All)"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {selectedC1Caliper && (
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedC1Caliper("");
                            }}
                            className="p-0.5 rounded hover:bg-amber-200/50 dark:hover:bg-amber-900/50 text-amber-600 dark:text-amber-400"
                            title="Clear caliper filter"
                          >
                            <X size={12} />
                          </span>
                        )}
                        <ChevronDown
                          size={13}
                          className={`text-slate-400 transition-transform duration-150 ${
                            isC1Open ? "rotate-180 text-amber-600" : ""
                          }`}
                        />
                      </div>
                    </button>

                    {isC1Open && (
                      <div className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden animate-in zoom-in-[0.98] duration-150">
                        {c1CaliperOptions.length > 5 && (
                          <div className="p-2 border-b border-slate-100 dark:border-slate-800">
                            <input
                              type="text"
                              value={c1Search}
                              onChange={(e) => setC1Search(e.target.value)}
                              placeholder="Search caliper/weight..."
                              className="w-full h-8 px-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
                              autoFocus
                            />
                          </div>
                        )}
                        <div className="max-h-52 overflow-y-auto p-1 space-y-0.5">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedC1Caliper("");
                              setIsC1Open(false);
                              setC1Search("");
                            }}
                            className={`w-full px-2.5 py-1.5 text-xs rounded-lg text-left transition-colors flex items-center justify-between cursor-pointer ${
                              !selectedC1Caliper
                                ? "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-bold"
                                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                            }`}
                          >
                            <span>All Calipers ({c1CandidateProducts.length})</span>
                            {!selectedC1Caliper && <Check size={12} className="text-amber-600 stroke-[3]" />}
                          </button>
                          {filteredC1Options.map((opt) => {
                            const isSelected = selectedC1Caliper === opt.value;
                            return (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => {
                                  setSelectedC1Caliper(opt.value);
                                  setIsC1Open(false);
                                  setC1Search("");
                                }}
                                className={`w-full px-2.5 py-1.5 text-xs font-medium rounded-lg text-left transition-colors flex items-center justify-between cursor-pointer ${
                                  isSelected
                                    ? "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-bold"
                                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                                }`}
                              >
                                <span className="truncate">
                                  {opt.value === "NA" ? "NA (No Component 1)" : `${opt.value} GSM`}
                                </span>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <span className="text-[10px] text-slate-400 font-mono">({opt.count})</span>
                                  {isSelected && <Check size={12} className="text-amber-600 stroke-[3]" />}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Dropdown 2: C2 Material Type */}
                  <div className="relative" ref={c2MRef}>
                    <button
                      type="button"
                      onClick={() => {
                        setIsC2MOpen((prev) => !prev);
                        setIsC1Open(false);
                        setIsC2FOpen(false);
                        setIsB1Open(false);
                        setIsB2Open(false);
                      }}
                      className={`w-full h-10 px-3 rounded-xl border transition-all flex items-center justify-between text-left cursor-pointer text-xs ${
                        isC2MOpen
                          ? "border-sky-500 ring-2 ring-sky-500/15 bg-white dark:bg-slate-900"
                          : selectedC2Material
                          ? "border-sky-300 dark:border-sky-700 bg-sky-50/60 dark:bg-sky-950/30 text-sky-900 dark:text-sky-200 font-medium"
                          : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:border-slate-400 shadow-2xs"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="truncate font-medium">
                          {selectedC2Material
                            ? `C2 Material: ${selectedC2Material}`
                            : "C2 Material Type (All)"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {selectedC2Material && (
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedC2Material("");
                            }}
                            className="p-0.5 rounded hover:bg-sky-200/50 dark:hover:bg-sky-900/50 text-sky-600 dark:text-sky-400"
                            title="Clear material filter"
                          >
                            <X size={12} />
                          </span>
                        )}
                        <ChevronDown
                          size={13}
                          className={`text-slate-400 transition-transform duration-150 ${
                            isC2MOpen ? "rotate-180 text-sky-600" : ""
                          }`}
                        />
                      </div>
                    </button>

                    {isC2MOpen && (
                      <div className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden animate-in zoom-in-[0.98] duration-150">
                        {c2MaterialOptions.length > 5 && (
                          <div className="p-2 border-b border-slate-100 dark:border-slate-800">
                            <input
                              type="text"
                              value={c2MSearch}
                              onChange={(e) => setC2MSearch(e.target.value)}
                              placeholder="Search material type..."
                              className="w-full h-8 px-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-500"
                              autoFocus
                            />
                          </div>
                        )}
                        <div className="max-h-52 overflow-y-auto p-1 space-y-0.5">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedC2Material("");
                              setIsC2MOpen(false);
                              setC2MSearch("");
                            }}
                            className={`w-full px-2.5 py-1.5 text-xs rounded-lg text-left transition-colors flex items-center justify-between cursor-pointer ${
                              !selectedC2Material
                                ? "bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 font-bold"
                                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                            }`}
                          >
                            <span>All Materials ({c2MCandidateProducts.length})</span>
                            {!selectedC2Material && <Check size={12} className="text-sky-600 stroke-[3]" />}
                          </button>
                          {filteredC2MOptions.map((opt) => {
                            const isSelected = selectedC2Material === opt.value;
                            return (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => {
                                  setSelectedC2Material(opt.value);
                                  setIsC2MOpen(false);
                                  setC2MSearch("");
                                }}
                                className={`w-full px-2.5 py-1.5 text-xs font-medium rounded-lg text-left transition-colors flex items-center justify-between cursor-pointer ${
                                  isSelected
                                    ? "bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 font-bold"
                                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                                }`}
                              >
                                <span className="truncate">{opt.value}</span>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <span className="text-[10px] text-slate-400 font-mono">({opt.count})</span>
                                  {isSelected && <Check size={12} className="text-sky-600 stroke-[3]" />}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Dropdown 3: C2 Cover Finish */}
                  <div className="relative" ref={c2FRef}>
                    <button
                      type="button"
                      onClick={() => {
                        setIsC2FOpen((prev) => !prev);
                        setIsC1Open(false);
                        setIsC2MOpen(false);
                        setIsB1Open(false);
                        setIsB2Open(false);
                      }}
                      className={`w-full h-10 px-3 rounded-xl border transition-all flex items-center justify-between text-left cursor-pointer text-xs ${
                        isC2FOpen
                          ? "border-teal-500 ring-2 ring-teal-500/15 bg-white dark:bg-slate-900"
                          : selectedC2Finish
                          ? "border-teal-300 dark:border-teal-700 bg-teal-50/60 dark:bg-teal-950/30 text-teal-900 dark:text-teal-200 font-medium"
                          : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:border-slate-400 shadow-2xs"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="truncate font-medium">
                          {selectedC2Finish
                            ? `Finish: ${selectedC2Finish}`
                            : "C2 Cover Finish (All)"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {selectedC2Finish && (
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedC2Finish("");
                            }}
                            className="p-0.5 rounded hover:bg-teal-200/50 dark:hover:bg-teal-900/50 text-teal-600 dark:text-teal-400"
                            title="Clear finish filter"
                          >
                            <X size={12} />
                          </span>
                        )}
                        <ChevronDown
                          size={13}
                          className={`text-slate-400 transition-transform duration-150 ${
                            isC2FOpen ? "rotate-180 text-teal-600" : ""
                          }`}
                        />
                      </div>
                    </button>

                    {isC2FOpen && (
                      <div className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden animate-in zoom-in-[0.98] duration-150">
                        {c2FinishOptions.length > 5 && (
                          <div className="p-2 border-b border-slate-100 dark:border-slate-800">
                            <input
                              type="text"
                              value={c2FSearch}
                              onChange={(e) => setC2FSearch(e.target.value)}
                              placeholder="Search cover finish..."
                              className="w-full h-8 px-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-500"
                              autoFocus
                            />
                          </div>
                        )}
                        <div className="max-h-52 overflow-y-auto p-1 space-y-0.5">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedC2Finish("");
                              setIsC2FOpen(false);
                              setC2FSearch("");
                            }}
                            className={`w-full px-2.5 py-1.5 text-xs rounded-lg text-left transition-colors flex items-center justify-between cursor-pointer ${
                              !selectedC2Finish
                                ? "bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 font-bold"
                                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                            }`}
                          >
                            <span>All Cover Finishes ({c2FCandidateProducts.length})</span>
                            {!selectedC2Finish && <Check size={12} className="text-teal-600 stroke-[3]" />}
                          </button>
                          {filteredC2FOptions.map((opt) => {
                            const isSelected = selectedC2Finish === opt.value;
                            return (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => {
                                  setSelectedC2Finish(opt.value);
                                  setIsC2FOpen(false);
                                  setC2FSearch("");
                                }}
                                className={`w-full px-2.5 py-1.5 text-xs font-medium rounded-lg text-left transition-colors flex items-center justify-between cursor-pointer ${
                                  isSelected
                                    ? "bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 font-bold"
                                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                                }`}
                              >
                                <span className="truncate">{opt.value}</span>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <span className="text-[10px] text-slate-400 font-mono">({opt.count})</span>
                                  {isSelected && <Check size={12} className="text-teal-600 stroke-[3]" />}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {hasActiveFilters && (
              <div className="flex justify-end pt-0.5">
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                >
                  Reset Binding Filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. Loading State */}
      {isBusy && (
        <div className="py-12 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-2.5">
          <RotateCcw size={22} className="animate-spin text-indigo-600 mx-auto" />
          <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold">Searching matching technical specifications...</p>
          <p className="text-[11px] text-slate-400">Loading catalog items and characteristics</p>
        </div>
      )}


      {/* 4. No Results State */}
      {!isBusy && hasSearched && results.length === 0 && (
        <div className="py-10 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700 space-y-3 p-6">
          <div className="w-11 h-11 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto shadow-2xs">
            <Package size={22} />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              {searchMode === "material"
                ? `No products found for "${query}"`
                : `No existing catalog items match ${selectedBinding1}`}
            </p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {searchMode === "material"
                ? "Check your search keyword or try searching by Binding Style instead."
                : "No standard master specifications match this exact binding. You can create a new custom product with these binding parameters."}
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 pt-1 flex-wrap">
            {searchMode === "binding" && selectedBinding1 && (
              <button
                type="button"
                onClick={handleCreateCustomProductFromBinding}
                className="h-9 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer select-none"
              >
                <Plus size={14} className="stroke-[2.5]" />
                <span>Create Custom Product ({selectedBinding1})</span>
              </button>
            )}

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="h-9 px-4 rounded-lg border border-slate-200/90 dark:border-slate-750 bg-white dark:bg-slate-850 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-2xs cursor-pointer select-none"
              >
                Reset {searchMode === "material" ? "Search" : "Binding Filters"}
              </button>
            )}
          </div>
        </div>
      )}

      {/* 5. Results Section */}
      {!isBusy && results.length > 0 && (
        <div className="space-y-2">
          {/* Results header */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2 text-[11px]">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {displayedResults.length} {displayedResults.length === 1 ? "product" : "products"}
              </span>
              {displayedResults.length !== results.length && (
                <span className="text-slate-400">· filtered from {results.length}</span>
              )}
            </div>
            <span className="text-[11px] font-medium text-slate-400">378 specs each</span>
          </div>

          {displayedResults.length === 0 ? (
            <div className="py-8 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700 space-y-3 p-5">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                No products match these specification filters
              </p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {results.length} products exist for this binding, but none match the selected Caliper / Material / Finish combination.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedC1Caliper("");
                  setSelectedC2Material("");
                  setSelectedC2Finish("");
                }}
                className="h-8 px-3.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer mt-1 inline-flex items-center gap-1.5"
              >
                Clear Specification Filters
              </button>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden max-h-[460px] overflow-y-auto">
              {displayedResults.map((product, index) => {
                const isAlreadyAdded = addedProductCodes.includes(product.material_code);
                const isLast = index === displayedResults.length - 1;

                return (
                  <div
                    key={product.id}
                    className={`group relative flex items-center gap-4 px-4 py-3.5 bg-white dark:bg-slate-900 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 transition-colors duration-100 ${
                      !isLast ? "border-b border-slate-100 dark:border-slate-800" : ""
                    }`}
                  >
                    {/* Left accent line on hover */}
                    <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-150 rounded-r" />

                    {/* Product Info — takes full width */}
                    <div className="flex-1 min-w-0 space-y-1">
                      {/* Row 1: codes + badges */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono font-bold text-xs text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/80 px-2 py-0.5 rounded-md border border-indigo-200/70 dark:border-indigo-800/70">
                          {product.material_code}
                        </span>

                        <button
                          type="button"
                          onClick={(e) => handleCopy(product.material_code, e)}
                          className="p-0.5 rounded text-slate-300 dark:text-slate-700 hover:text-slate-500 dark:hover:text-slate-400 cursor-pointer transition-colors"
                          title="Copy material code"
                        >
                          {copiedCode === product.material_code ? (
                            <Check size={11} className="text-emerald-500 stroke-[3]" />
                          ) : (
                            <Copy size={11} />
                          )}
                        </button>

                        {product.binding_type_1 && (
                          <span className="text-[11px] text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded font-medium">
                            {product.binding_type_1}
                            {product.binding_type_2 && product.binding_type_2 !== "NA" ? ` · ${product.binding_type_2}` : ""}
                          </span>
                        )}

                        {product.c1_caliper_weight && product.c1_caliper_weight !== "NA" && (
                          <span className="text-[10px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 px-1.5 py-0.5 rounded font-semibold border border-amber-200/60 dark:border-amber-800/50">
                            {product.c1_caliper_weight} GSM
                          </span>
                        )}

                        {product.c2_material_type && product.c2_material_type !== "NA" && (
                          <span className="text-[10px] text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/50 px-1.5 py-0.5 rounded font-semibold border border-sky-200/60 dark:border-sky-800/50">
                            {product.c2_material_type}
                          </span>
                        )}

                        {product.c2_cover_finish && product.c2_cover_finish !== "NA" && (
                          <span className="text-[10px] text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/50 px-1.5 py-0.5 rounded font-semibold border border-teal-200/60 dark:border-teal-800/50">
                            {product.c2_cover_finish}
                          </span>
                        )}

                        {isAlreadyAdded && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800/60 inline-flex items-center gap-1">
                            <Check size={9} className="stroke-[3]" />
                            Added
                          </span>
                        )}
                      </div>

                      {/* Row 2: Product name */}
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate leading-tight" title={product.product_description}>
                        {product.product_description}
                      </p>

                      {/* Row 3: Meta */}
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                        <span>SR #{product.sr_number}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700 shrink-0" />
                        <span>{product.target_plant || "Khaniwade"}</span>
                        {product.customer && (
                          <>
                            <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700 shrink-0" />
                            <span className="truncate max-w-[140px]">{product.customer}</span>
                          </>
                        )}
                      </p>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                      <button
                        type="button"
                        onClick={() => onPreviewSpecs(product)}
                        className="h-7.5 px-2.5 text-[11px] font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md border border-slate-200/90 dark:border-slate-700 transition-colors flex items-center gap-1 cursor-pointer select-none shadow-2xs"
                        title="Preview specifications"
                      >
                        <Eye size={12} className="text-slate-400" />
                        <span>Specs</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onAddProduct(product)}
                        className={`h-7.5 px-3 text-[11px] font-medium rounded-md transition-colors flex items-center gap-1 cursor-pointer select-none shadow-2xs ${
                          isAlreadyAdded
                            ? "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200/90 dark:border-slate-700"
                            : "bg-blue-600 hover:bg-blue-700 text-white"
                        }`}
                      >
                        {isAlreadyAdded ? (
                          <span>Add Again</span>
                        ) : (
                          <>
                            <Plus size={12} className="stroke-[2.5]" />
                            <span>Add</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Always-visible add button when already added */}
                    {isAlreadyAdded && (
                      <div className="flex items-center gap-1.5 shrink-0 group-hover:hidden">
                        <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1">
                          <Check size={10} className="stroke-[3]" />
                          Added
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 6. Footer bar */}
      {onClose && (
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
          <span className="text-slate-400 font-medium">
            {addedProductCodes.length > 0
              ? `${addedProductCodes.length} ${addedProductCodes.length === 1 ? 'product' : 'products'} currently in program`
              : "Select or search products to add"}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer transition-colors shadow-2xs"
          >
            Done
          </button>
        </div>
      )}
    </div>
  );
};
