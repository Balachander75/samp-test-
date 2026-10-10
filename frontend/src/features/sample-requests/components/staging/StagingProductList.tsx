import React from "react";
import { Layers, Plus, Eye, Pencil, Copy, Trash2, Calendar, Clock, PlusCircle } from "lucide-react";
import { StagedProductItem, DELIVERABLES } from "../../types/staging";

export interface StagingProductListProps {
  stagedProducts: StagedProductItem[];
  onOpenAddModal: () => void;
  onInspectProduct: (item: StagedProductItem) => void;
  onEditProduct?: (item: StagedProductItem) => void;
  onDuplicateProduct: (item: StagedProductItem) => void;
  onRemoveProduct: (id: string) => void;
}

export const StagingProductList: React.FC<StagingProductListProps> = ({
  stagedProducts,
  onOpenAddModal,
  onInspectProduct,
  onEditProduct,
  onDuplicateProduct,
  onRemoveProduct,
}) => {
  if (stagedProducts.length === 0) {
    return (
      <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#161822] px-6 py-14 text-center shadow-sm">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#006d32]/10 text-[#006d32] dark:text-emerald-400">
          <Layers className="h-7 w-7 stroke-[2]" />
        </div>

        <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100 tracking-tight font-display">
          No Products Staged Yet
        </h3>
        <p className="mt-1.5 max-w-md text-xs leading-relaxed text-slate-500 dark:text-zinc-400">
          This sample request currently has no staged items. Add product specifications, configure artwork briefs or prototype samples, and assign deliverables.
        </p>

        <button
          type="button"
          onClick={onOpenAddModal}
          className="mt-5 inline-flex h-9 items-center gap-2 rounded-xl px-5 text-xs font-bold text-white shadow-[0_2px_10px_rgba(0,109,50,0.25)] hover:shadow-[0_4px_14px_rgba(0,109,50,0.35)] transition-all cursor-pointer active:scale-98"
          style={{ background: "linear-gradient(135deg, #006d32 0%, #00d166 100%)" }}
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add First Product</span>
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#161822] border border-slate-200/60 dark:border-white/[0.06] rounded-2xl shadow-sm overflow-hidden flex flex-col">
      {/* ── Table Header Bar ── */}
      <div className="flex items-center justify-between px-5 py-3 bg-[#f8f9ff] dark:bg-white/[0.02] border-b border-slate-100 dark:border-white/[0.06] select-none">
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 uppercase tracking-wider font-display">
            Staged Products Matrix
          </span>
          <span className="font-mono text-[10.5px] font-bold px-2 py-0.5 rounded-full bg-white dark:bg-zinc-800 border border-slate-200/60 dark:border-white/[0.08] text-slate-700 dark:text-zinc-300">
            {stagedProducts.length} line item{stagedProducts.length !== 1 ? "s" : ""}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400 dark:text-zinc-500 font-mono hidden sm:inline">
            Direct Material &amp; Scope Allocation Queue
          </span>
        </div>
      </div>

      {/* ── Staged Products Table ── */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-[#f8f9ff]/70 dark:bg-white/[0.03] text-[10.5px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 border-b border-slate-100 dark:border-white/[0.06] select-none">
              <th className="py-3 px-4 w-12 text-center font-mono">
                #
              </th>
              <th className="py-3 px-4 w-44 font-mono">
                Material / Ref Code
              </th>
              <th className="py-3 px-4">
                Product Nomenclature &amp; Specifications
              </th>
              <th className="py-3 px-4 w-60">
                Deliverables Scope
              </th>
              <th className="py-3 px-4 w-36 font-mono">
                Staged Date
              </th>
              <th className="py-3 px-4 text-center w-28">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
            {stagedProducts.map((prod, idx) => (
              <tr
                key={prod.id}
                className="hover:bg-slate-50/70 dark:hover:bg-white/[0.02] transition-colors"
              >
                {/* 1. Line # */}
                <td className="py-3 px-4 text-center font-mono text-[11px] font-semibold text-slate-400">
                  {String(idx + 1).padStart(2, "0")}
                </td>

                {/* 2. Material / Ref Code */}
                <td className="py-3 px-4 font-mono">
                  <button
                    type="button"
                    onClick={() => onInspectProduct(prod)}
                    className="text-xs font-bold text-[#006d32] dark:text-emerald-400 hover:underline cursor-pointer flex items-center gap-1.5"
                    title="Click to inspect this staged specification"
                  >
                    <span>{prod.materialCode}</span>
                  </button>
                </td>

                {/* 3. Product Nomenclature & Specs */}
                <td className="py-3 px-4">
                  <div
                    onClick={() => onInspectProduct(prod)}
                    className="cursor-pointer group"
                  >
                    <p className="font-bold text-xs text-slate-900 dark:text-zinc-100 group-hover:text-[#006d32] dark:group-hover:text-emerald-400 transition-colors">
                      {prod.productDescription}
                    </p>

                    {prod.designMetadata ? (
                      <div className="mt-1 text-[11px] text-slate-500 dark:text-zinc-400 flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-purple-700 dark:text-purple-300">
                          {prod.designMetadata.numberOfDesigns} Design Variant{prod.designMetadata.numberOfDesigns > 1 ? "s" : ""}
                        </span>
                        {prod.designMetadata.designRequiredDate && (
                          <span>• Due: {prod.designMetadata.designRequiredDate}</span>
                        )}
                        {(prod.designMetadata.images.length > 0 || prod.designMetadata.webLinks.length > 0) && (
                          <span>• {prod.designMetadata.images.length + prod.designMetadata.webLinks.length} reference file(s)</span>
                        )}
                      </div>
                    ) : prod.samplingMetadata ? (
                      <div className="mt-1 text-[11px] text-slate-500 dark:text-zinc-400 flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase font-mono ${
                            prod.samplingMetadata.sampleType === "full"
                              ? "bg-emerald-50 text-[#006d32] dark:bg-emerald-950/40 dark:text-emerald-300 border border-[#006d32]/20"
                              : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200"
                          }`}
                        >
                          {prod.samplingMetadata.sampleType === "full" ? "Full Sample" : "Partial Sample"}
                        </span>
                        {prod.samplingMetadata.bindingType1 && (
                          <span>• {prod.samplingMetadata.bindingType1} {prod.samplingMetadata.bindingType2 ? `(${prod.samplingMetadata.bindingType2})` : ""}</span>
                        )}
                        {prod.samplingMetadata.sourceSrNumber && (
                          <span className="font-mono text-[10.5px] text-slate-400">Ref: {prod.samplingMetadata.sourceSrNumber}</span>
                        )}
                      </div>
                    ) : prod.catalogMetadata ? (
                      <div className="mt-1 text-[11px] text-slate-500 dark:text-zinc-400 font-mono">
                        <span>Catalog Ref: {prod.catalogMetadata.sourceMaterialCode}</span>
                        {prod.catalogMetadata.sourceRequestNumber && (
                          <span> · {prod.catalogMetadata.sourceRequestNumber}</span>
                        )}
                      </div>
                    ) : (
                      <div className="mt-1 text-[10.5px] text-slate-400 font-mono">
                        Standard Request Line Item
                      </div>
                    )}
                    {prod.scopes.includes("costing") && (
                      <div className="mt-1 flex flex-wrap gap-x-2 text-[10.5px] text-teal-700 dark:text-teal-300">
                        <span>{prod.qtyDesignCosting || "—"} costing units</span>
                        <span>{prod.unitPcPack || "—"}{prod.unitPcPack === "Pack" ? ` · ${prod.qtyPerPack || "—"} pc/pack` : ""}</span>
                        {prod.customerProductCode && <span>SKU {prod.customerProductCode}</span>}
                      </div>
                    )}
                  </div>
                </td>

                {/* 4. Deliverables Scope Chips */}
                <td className="py-3 px-4">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {prod.scopes.map((scope) => {
                      const def = DELIVERABLES.find((d) => d.id === scope);
                      const isDesign = scope === "design";
                      const isMockup = scope === "mockup";
                      const isSample = scope === "sample";
                      const isCosting = scope === "costing";

                      const badgeStyle = isDesign
                        ? "bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-800/40"
                        : isMockup
                        ? "bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800/40"
                        : isSample
                        ? "bg-emerald-50 text-[#006d32] dark:bg-emerald-950/40 dark:text-emerald-300 border-[#006d32]/25"
                        : isCosting
                        ? "bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300 border-teal-200 dark:border-teal-800/40"
                        : "bg-slate-100 text-slate-800 border-slate-200";

                      return (
                        <span
                          key={scope}
                          className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${badgeStyle}`}
                        >
                          {def?.label.toUpperCase() || scope.toUpperCase()}
                        </span>
                      );
                    })}
                  </div>
                </td>

                {/* 5. Staged Date Column */}
                <td className="py-3 px-4 font-mono text-[11px]">
                  <div className="font-semibold text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{prod.stagedDate || "2026-10-01"}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                    <Clock className="w-3 h-3 shrink-0" />
                    <span>{prod.timestamp || "Just now"}</span>
                  </div>
                </td>

                {/* 6. Action Icons */}
                <td className="py-3 px-4 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onInspectProduct(prod)}
                      className="h-7 w-7 rounded-lg bg-slate-100 hover:bg-slate-200/80 text-slate-600 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer dark:bg-white/[0.06] dark:text-zinc-300 dark:hover:bg-white/10"
                      title="Inspect Specification"
                      aria-label="Inspect Specification"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    {onEditProduct && (
                      <button
                        type="button"
                        onClick={() => onEditProduct(prod)}
                        className="h-7 w-7 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-800 flex items-center justify-center transition-colors cursor-pointer dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-900/60"
                        title="Edit Specification"
                        aria-label="Edit Specification"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onDuplicateProduct(prod)}
                      className="h-7 w-7 rounded-lg bg-slate-100 hover:bg-slate-200/80 text-slate-600 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer dark:bg-white/[0.06] dark:text-zinc-300 dark:hover:bg-white/10"
                      title="Duplicate Line Item"
                      aria-label="Duplicate Line Item"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemoveProduct(prod.id)}
                      className="h-7 w-7 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 flex items-center justify-center transition-colors cursor-pointer dark:bg-rose-950/40 dark:text-rose-400 dark:hover:bg-rose-900/60"
                      title="Remove Item from Batch"
                      aria-label="Remove Item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Modern Bottom Action Bar ── */}
      <div className="p-3 bg-[#f8f9ff] dark:bg-white/[0.02] border-t border-slate-100 dark:border-white/[0.06]">
        <button
          type="button"
          onClick={onOpenAddModal}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#006d32] dark:text-emerald-400 hover:underline px-3 py-1.5 rounded-xl hover:bg-[#006d32]/10 transition-colors cursor-pointer"
        >
          <PlusCircle className="w-4 h-4 stroke-[2.2]" />
          <span>Add another product</span>
        </button>
      </div>
    </div>
  );
};

export default StagingProductList;
