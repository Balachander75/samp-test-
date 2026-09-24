import React from "react";
import { ProductSearchResult } from "../types";
import { Search, RotateCcw, Plus, Eye, Copy, Check, X } from "@/components/ui/icons";

export interface MaterialCodeSearchProps {
  query: string;
  onQueryChange: (val: string) => void;
  onSearch: () => void;
  isLoading: boolean;
  hasSearched: boolean;
  results: ProductSearchResult[];
  onAddProduct: (product: ProductSearchResult) => void;
  onPreviewSpecs: (product: ProductSearchResult) => void;
  onClose: () => void;
}

export const MaterialCodeSearch: React.FC<MaterialCodeSearchProps> = ({
  query,
  onQueryChange,
  onSearch,
  isLoading,
  hasSearched,
  results,
  onAddProduct,
  onPreviewSpecs,
}) => {
  const [copiedCode, setCopiedCode] = React.useState<string | null>(null);

  const handleCopy = (code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 1500);
  };

  const quickSamples = ["A1-", "NB-", "1505"];

  return (
    <div className="space-y-4">
      {/* Search Input Bar */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <Search size={14} />
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
              placeholder="Enter material code (e.g. A1-000001, NB-102)..."
              className="w-full h-10 pl-9 pr-8 text-xs sm:text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono font-medium transition-all"
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
            disabled={!query.trim() || isLoading}
            className="h-9 px-3.5 text-xs font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white disabled:opacity-50 transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer shadow-2xs select-none"
          >
            {isLoading ? (
              <RotateCcw size={13} className="animate-spin" />
            ) : (
              <Search size={13} />
            )}
            <span>Search</span>
          </button>
        </div>

        {/* Quick Suggestion Chips */}
        {!hasSearched && (
          <div className="flex items-center gap-1.5 text-xs text-slate-400 flex-wrap">
            <span className="text-[11px] text-slate-500">Suggested:</span>
            {quickSamples.map((prefix) => (
              <button
                key={prefix}
                type="button"
                onClick={() => {
                  onQueryChange(prefix);
                  setTimeout(() => onSearch(), 50);
                }}
                className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono text-[11px] font-medium transition-colors cursor-pointer"
              >
                {prefix}*
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Results Rendering */}
      {isLoading && (
        <div className="py-14 text-center space-y-2">
          <RotateCcw size={18} className="animate-spin text-indigo-600 mx-auto" />
          <p className="text-xs text-slate-400 font-medium">Searching matching specifications catalog...</p>
        </div>
      )}

      {!isLoading && hasSearched && results.length === 0 && (
        <div className="py-12 text-center rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700 space-y-1.5 p-6">
          <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">No products found</p>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            No notebook matched &ldquo;<span className="font-mono text-slate-600 dark:text-slate-300">{query}</span>&rdquo;. Try another code or browse by binding style.
          </p>
        </div>
      )}

      {!isLoading && results.length > 0 && (
        <div className="space-y-2.5">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-0.5 flex items-center justify-between">
            <span>Found {results.length} {results.length === 1 ? "match" : "matches"}</span>
            <span className="font-mono text-indigo-600 dark:text-indigo-400">378 Specifications</span>
          </div>

          <div className="space-y-2">
            {results.map((product) => (
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
                    {product.binding_type_1 && (
                      <span className="text-xs text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded font-medium">
                        {product.binding_type_1}
                      </span>
                    )}
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
                    <span>Plant: {product.target_plant || "1505- Khaniwade"}</span>
                    {product.customer && (
                      <>
                        <span>&bull;</span>
                        <span className="truncate max-w-[140px]">{product.customer}</span>
                      </>
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => onPreviewSpecs(product)}
                    className="h-8.5 px-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 transition-all flex items-center gap-1 cursor-pointer"
                    title="Inspect technical specifications"
                  >
                    <Eye size={12} className="text-indigo-600 dark:text-indigo-400" />
                    <span>Specs</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onAddProduct(product)}
                    className="h-7.5 px-3 text-xs font-medium rounded-md bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center gap-1 cursor-pointer shadow-2xs select-none"
                  >
                    <Plus size={13} className="stroke-[2.5]" />
                    <span>Stage</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
