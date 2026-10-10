import React, { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  LoaderCircle,
  Search,
  X,
} from "lucide-react";
import {
  fetchProductInspectionDetailsApi,
  ProductDetailItem,
  PRODUCT_CLASS_ORDER,
} from "@/infrastructure/api/masterApi";
import { ProductSearchResult } from "../../types";

interface CatalogProductInspectModalProps {
  product: ProductSearchResult | null;
  onClose: () => void;
  heading?: string;
  intro?: string;
  footer?: React.ReactNode;
}

const EMPTY_VALUES = new Set(["", "NA", "N/A", "NAN", "NULL", "NONE", "—", "-"]);

function hasConfiguredValue(value: string | null | undefined): boolean {
  return !EMPTY_VALUES.has(String(value || "").trim().toUpperCase());
}

function displayClassName(value: string): string {
  return value.replace(/_/g, " ").trim();
}

export const CatalogProductInspectModal: React.FC<CatalogProductInspectModalProps> = ({ product, onClose, heading, intro, footer }) => {
  const [details, setDetails] = useState<ProductDetailItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState("");
  const [view, setView] = useState<"configured" | "all">("all");
  const [characteristicQuery, setCharacteristicQuery] = useState("");
  const [activeClass, setActiveClass] = useState("ALL");
  const [expandedClasses, setExpandedClasses] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!product) return;
    let cancelled = false;
    setIsLoading(true);
    setDetails([]);
    setDetailsError("");
    setView("all");
    setCharacteristicQuery("");
    setActiveClass("ALL");
    setExpandedClasses(new Set());

    fetchProductInspectionDetailsApi(product.id)
      .then((loadedDetails) => {
        if (cancelled) return;
        setDetails(loadedDetails);
        setExpandedClasses(new Set(loadedDetails.map((item) => item.className).filter(Boolean)));
      })
      .catch(() => {
        if (!cancelled) setDetailsError("Could not load this product's specifications. Close this view and try again.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [product?.id]);

  useEffect(() => {
    if (!product) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [product, onClose]);

  const configuredCount = useMemo(
    () => details.filter((item) => hasConfiguredValue(item.value)).length,
    [details]
  );

  const classGroups = useMemo(() => {
    const groups = new Map<string, ProductDetailItem[]>();
    for (const item of details) {
      if (!item.className) continue;
      const group = groups.get(item.className) || [];
      group.push(item);
      groups.set(item.className, group);
    }
    return [...groups.entries()].sort(([a], [b]) => {
      const aIndex = PRODUCT_CLASS_ORDER.indexOf(a as typeof PRODUCT_CLASS_ORDER[number]);
      const bIndex = PRODUCT_CLASS_ORDER.indexOf(b as typeof PRODUCT_CLASS_ORDER[number]);
      return (aIndex === -1 ? PRODUCT_CLASS_ORDER.length : aIndex) - (bIndex === -1 ? PRODUCT_CLASS_ORDER.length : bIndex)
        || a.localeCompare(b);
    });
  }, [details]);

  const filteredClassGroups = useMemo(() => {
    const query = characteristicQuery.trim().toLocaleLowerCase();
    return classGroups
      .filter(([className]) => activeClass === "ALL" || activeClass === className)
      .map(([className, specs]) => [
        className,
        specs.filter((item) => {
          if (view === "configured" && !hasConfiguredValue(item.value)) return false;
          if (!query) return true;
          return `${className} ${item.characteristicName} ${item.value || ""} ${item.uom || ""}`
            .toLocaleLowerCase()
            .includes(query);
        }),
      ] as [string, ProductDetailItem[]])
      .filter(([, specs]) => specs.length > 0);
  }, [activeClass, characteristicQuery, classGroups, view]);

  if (!product) return null;

  const allVisibleExpanded = filteredClassGroups.length > 0
    && filteredClassGroups.every(([className]) => expandedClasses.has(className));

  const toggleClass = (className: string) => {
    setExpandedClasses((current) => {
      const next = new Set(current);
      if (next.has(className)) next.delete(className);
      else next.add(className);
      return next;
    });
  };

  return (
    <div
      className="fixed inset-0 z-[180] flex items-center justify-center bg-slate-950/65 p-2 backdrop-blur-[2px] sm:p-5"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="catalog-inspect-title"
        className="flex max-h-[94vh] w-full max-w-[1440px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_80px_rgba(2,6,23,0.32)] dark:border-zinc-700 dark:bg-[#11141b]"
      >
        <header className="shrink-0 border-b border-slate-200 bg-slate-50/90 px-4 py-4 dark:border-zinc-800 dark:bg-[#171a23] sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                {product.material_code && (
                  <span className="rounded-md border border-indigo-200 bg-indigo-50 px-2 py-1 font-mono text-xs font-bold text-indigo-700 dark:border-indigo-900 dark:bg-indigo-950/50 dark:text-indigo-300">
                    {product.material_code}
                  </span>
                )}
                <h2 id="catalog-inspect-title" className="min-w-0 text-base font-bold text-slate-900 dark:text-zinc-100 sm:text-lg">
                  {product.product_description || "Product specification"}
                </h2>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5 text-xs text-slate-600 dark:text-zinc-300">
                {product.customer && <span className="rounded-md bg-white px-2 py-1 dark:bg-zinc-900"><span className="text-slate-400">Customer:</span> {product.customer}</span>}
                {product.target_plant && <span className="rounded-md bg-white px-2 py-1 dark:bg-zinc-900"><span className="text-slate-400">Plant:</span> {product.target_plant}</span>}
                {product.sr_number && <span className="rounded-md bg-white px-2 py-1 font-mono dark:bg-zinc-900">{product.sr_number}</span>}
                {(product.product_category || product.product_sub_category || product.product_third_category) && (
                  <span className="rounded-md bg-white px-2 py-1 dark:bg-zinc-900">
                    <span className="text-slate-400">Category:</span>{" "}
                    {[product.product_category, product.product_sub_category, product.product_third_category].filter(Boolean).join(" / ")}
                  </span>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close product inspection"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-200 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006d32] dark:hover:bg-zinc-800 dark:hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto lg:flex lg:flex-col lg:overflow-hidden">
          <main className="lg:flex lg:min-h-0 lg:flex-1 lg:flex-col lg:overflow-hidden">
            <div className="space-y-3 border-b border-slate-200 p-4 dark:border-zinc-800 sm:p-5 lg:shrink-0">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">{heading || "Product specifications"}</h3>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">{intro || "All active catalog characteristics are listed by class. Blank values have not been saved on this product."}</p>
                </div>
                <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-1 dark:border-zinc-700 dark:bg-zinc-900" aria-label="Specification filter">
                  <button type="button" onClick={() => setView("configured")} aria-pressed={view === "configured"} className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${view === "configured" ? "bg-white text-[#006d32] shadow-sm dark:bg-zinc-800 dark:text-emerald-300" : "text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white"}`}>
                    Configured <span className="ml-1 tabular-nums">{configuredCount}</span>
                  </button>
                  <button type="button" onClick={() => setView("all")} aria-pressed={view === "all"} className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${view === "all" ? "bg-white text-[#006d32] shadow-sm dark:bg-zinc-800 dark:text-emerald-300" : "text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white"}`}>
                    All Specs <span className="ml-1 tabular-nums">{details.length}</span>
                  </button>
                </div>
              </div>
              <label className="relative block">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={characteristicQuery}
                  onChange={(event) => setCharacteristicQuery(event.target.value)}
                  placeholder="Filter classes and characteristics…"
                  aria-label="Filter classes and characteristics"
                  className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-[#006d32] focus:ring-2 focus:ring-[#006d32]/15 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500"
                />
              </label>
              {classGroups.length > 0 && (
                <div className="flex items-center gap-2">
                  <div className="flex min-w-0 flex-1 gap-1.5 overflow-x-auto pb-1 [scrollbar-width:thin]">
                    <button type="button" onClick={() => setActiveClass("ALL")} aria-pressed={activeClass === "ALL"} className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${activeClass === "ALL" ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-200 bg-white text-slate-700 hover:border-indigo-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"}`}>
                      All Classes <span className="ml-1 opacity-75">{classGroups.length}</span>
                    </button>
                    {classGroups.map(([className, specs]) => {
                      const classConfigured = specs.filter((item) => hasConfiguredValue(item.value)).length;
                      return (
                        <button key={className} type="button" onClick={() => setActiveClass(className)} aria-pressed={activeClass === className} title={`${displayClassName(className)}: ${classConfigured} of ${specs.length} values configured`} className={`max-w-56 shrink-0 truncate rounded-full border px-3 py-1.5 text-xs font-semibold transition ${activeClass === className ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-200 bg-white text-slate-700 hover:border-indigo-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"}`}>
                          {displayClassName(className)} <span className="ml-1 opacity-65">{specs.length}</span>
                        </button>
                      );
                    })}
                  </div>
                  <button type="button" onClick={() => setExpandedClasses(allVisibleExpanded ? new Set() : new Set(filteredClassGroups.map(([className]) => className)))} className="shrink-0 px-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-indigo-300">
                    {allVisibleExpanded ? "Collapse all" : "Expand all"}
                  </button>
                </div>
              )}
            </div>

            <div className="p-4 sm:p-5 lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
              {isLoading ? (
                <div className="flex h-48 items-center justify-center gap-2 text-sm text-slate-500 dark:text-zinc-400"><LoaderCircle className="h-4 w-4 animate-spin" /> Loading product details…</div>
              ) : detailsError ? (
                <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300">{detailsError}</div>
              ) : filteredClassGroups.length === 0 ? (
                <div className="flex min-h-48 flex-col items-center justify-center px-4 text-center text-sm text-slate-500 dark:text-zinc-400">
                  {view === "configured" && !characteristicQuery.trim() ? "No characteristic values are saved on this product." : "No specifications match this filter."}
                  {view === "configured" && details.length > configuredCount && <button type="button" onClick={() => setView("all")} className="mt-2 font-semibold text-indigo-600 underline underline-offset-2 dark:text-indigo-300">Show all specifications</button>}
                </div>
              ) : (
                <div className="space-y-2.5">
                  {filteredClassGroups.map(([className, specs]) => {
                    const allSpecsInClass = classGroups.find(([name]) => name === className)?.[1] || specs;
                    const configuredInClass = allSpecsInClass.filter((item) => hasConfiguredValue(item.value)).length;
                    const expanded = expandedClasses.has(className);
                    return (
                      <section key={className} className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/50">
                        <button type="button" aria-expanded={expanded} onClick={() => toggleClass(className)} className="flex min-h-12 w-full items-center justify-between gap-3 px-3.5 py-2.5 text-left transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#006d32] dark:hover:bg-zinc-800/70 sm:px-4">
                          <span className="min-w-0"><span className="font-semibold text-slate-800 dark:text-zinc-100">{displayClassName(className)}</span><span className="ml-2 text-xs text-slate-400 dark:text-zinc-500">{configuredInClass}/{allSpecsInClass.length} configured</span></span>
                          <span className="flex shrink-0 items-center gap-2">
                            <span className="hidden h-1.5 w-16 overflow-hidden rounded-full bg-slate-100 dark:bg-zinc-800 sm:block"><span className="block h-full rounded-full bg-emerald-500" style={{ width: `${allSpecsInClass.length ? (configuredInClass / allSpecsInClass.length) * 100 : 0}%` }} /></span>
                            {expanded ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
                          </span>
                        </button>
                        {expanded && (
                          <div className="border-t border-slate-200 dark:border-zinc-800">
                            <div className="grid grid-cols-[minmax(0,1fr)_minmax(120px,0.8fr)_72px] gap-3 bg-slate-50 px-3.5 py-2 text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:bg-zinc-900 dark:text-zinc-400 sm:px-4">
                              <span>Characteristic</span><span>Value</span><span>UOM</span>
                            </div>
                            {specs.map((item) => (
                              <div key={`${item.className}-${item.characteristicName}`} className="grid grid-cols-[minmax(0,1fr)_minmax(120px,0.8fr)_72px] gap-3 border-t border-slate-100 px-3.5 py-2.5 text-xs dark:border-zinc-800/80 sm:px-4">
                                <div className="min-w-0 break-words">
                                  <span className="font-medium text-slate-700 dark:text-zinc-200">{item.characteristicName}</span>

                                </div>
                                <span className={`min-w-0 break-words ${hasConfiguredValue(item.value) ? "font-semibold text-slate-900 dark:text-zinc-100" : "text-slate-400 dark:text-zinc-500"}`}>{hasConfiguredValue(item.value) ? item.value?.trim() : ""}</span>
                                <span className="text-slate-500 dark:text-zinc-400">{item.uom || ""}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </section>
                    );
                  })}
                </div>
              )}
            </div>
          </main>
        </div>
        {footer && (
          <footer className="shrink-0 border-t border-slate-200 bg-slate-50/80 px-4 py-3 dark:border-zinc-800 dark:bg-[#171a23] sm:px-6">
            {footer}
          </footer>
        )}
      </section>
    </div>
  );
};

export default CatalogProductInspectModal;
