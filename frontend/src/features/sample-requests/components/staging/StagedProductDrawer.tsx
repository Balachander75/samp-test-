import React from "react";
import { createPortal } from "react-dom";
import { X, Copy, Trash2, ExternalLink, Pencil } from "lucide-react";
import { StagedProductItem, DELIVERABLES } from "../../types/staging";

export interface StagedProductDrawerProps {
  inspectingProduct: StagedProductItem | null;
  programYear: string;
  onClose: () => void;
  onRemoveProduct: (id: string) => void;
  onDuplicateProduct: (item: StagedProductItem) => void;
  onEditProduct?: (item: StagedProductItem) => void;
}

export const StagedProductDrawer: React.FC<StagedProductDrawerProps> = ({
  inspectingProduct,
  programYear,
  onClose,
  onRemoveProduct,
  onDuplicateProduct,
  onEditProduct,
}) => {
  if (!inspectingProduct) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] overflow-y-auto" role="dialog" aria-modal="true">
      <div className="fixed inset-0 bg-slate-950/70 transition-opacity" onClick={onClose} />

      <div className="flex min-h-full items-center justify-center p-3 sm:p-5">
        <div className="relative w-full max-w-3xl bg-white dark:bg-[#161822] border border-slate-200/80 dark:border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden animate-smooth-modal flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="px-6 py-4 bg-white dark:bg-[#161822] text-slate-900 dark:text-white flex items-center justify-between shrink-0 border-b border-slate-100 dark:border-white/[0.06]">
            <div className="flex items-center gap-2.5">
              <span className="font-mono font-bold text-xs bg-[#006d32]/10 text-[#006d32] dark:text-emerald-400 px-2.5 py-0.5 rounded-full border border-[#006d32]/20">
                {inspectingProduct.materialCode}
              </span>
              <span className="text-sm font-bold text-slate-900 dark:text-white tracking-tight font-display">
                Staged Product Specification
              </span>
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

          {/* Body */}
          <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
            {/* Product Title & Metadata Subtitle */}
            <div>
              <h3 className="text-base font-bold text-zinc-950 dark:text-zinc-50 tracking-tight leading-snug">
                {inspectingProduct.productDescription}
              </h3>
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 mt-1 text-[11px] text-zinc-400 font-mono">
                <span>
                  Staged: {inspectingProduct.stagedDate || "2026-10-01"} {inspectingProduct.timestamp}
                </span>
                <span>•</span>
                <span>Season: {programYear}</span>
              </div>
            </div>

            {/* Assigned Deliverables */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              {inspectingProduct.scopes.map((scope) => {
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
                    className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold border ${badgeStyle}`}
                  >
                    {def?.label.toUpperCase() || scope.toUpperCase()}
                  </span>
                );
              })}
            </div>

            {/* Design Specifications (Clean Key-Value 2x2 Grid) */}
            {inspectingProduct.designMetadata && (
              <div className="space-y-3 pt-3 border-t border-zinc-100 dark:border-white/[0.06]">
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="p-3 rounded-lg border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/50">
                    <span className="text-[10px] font-mono text-zinc-400 block uppercase font-medium">
                      Artwork Variants
                    </span>
                    <span className="font-mono font-bold text-sm text-zinc-900 dark:text-zinc-100 mt-0.5 block">
                      {inspectingProduct.designMetadata.numberOfDesigns} Design(s)
                    </span>
                  </div>

                  <div className="p-3 rounded-lg border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/50">
                    <span className="text-[10px] font-mono text-zinc-400 block uppercase font-medium">
                      Target Due Date
                    </span>
                    <span className="font-mono font-bold text-sm text-zinc-900 dark:text-zinc-100 mt-0.5 block">
                      {inspectingProduct.designMetadata.designRequiredDate || "Not specified"}
                    </span>
                  </div>

                  <div className="p-3 rounded-lg border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/50">
                    <span className="text-[10px] font-mono text-zinc-400 block uppercase font-medium">
                      Trend / Theme
                    </span>
                    <span className="font-medium text-xs text-zinc-900 dark:text-zinc-100 mt-0.5 block break-words">
                      {inspectingProduct.designMetadata.trend || "None specified"}
                    </span>
                  </div>

                  <div className="p-3 rounded-lg border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/50">
                    <span className="text-[10px] font-mono text-zinc-400 block uppercase font-medium">
                      Target Demographic
                    </span>
                    <span className="font-medium text-xs text-zinc-900 dark:text-zinc-100 mt-0.5 block break-words">
                      {inspectingProduct.designMetadata.targetAudience || "General Audience"}
                    </span>
                  </div>
                </div>

                {/* Remarks / Special Instructions */}
                {inspectingProduct.designMetadata.remarks && (
                  <div className="p-3 rounded-lg border border-amber-200/80 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20">
                    <span className="text-[10px] font-mono uppercase font-semibold text-amber-700 dark:text-amber-400 block mb-1">
                      Special Instructions / Remarks
                    </span>
                    <p className="text-xs text-zinc-800 dark:text-zinc-200 leading-relaxed whitespace-pre-wrap break-words">
                      {inspectingProduct.designMetadata.remarks}
                    </p>
                  </div>
                )}

                {/* Moodboard / Attachments Preview */}
                {(inspectingProduct.designMetadata.images.length > 0 ||
                  inspectingProduct.designMetadata.webLinks.length > 0) && (
                  <div>
                    <span className="text-[10px] font-mono uppercase text-zinc-400 block mb-1.5 font-medium">
                      Reference Attachments ({inspectingProduct.designMetadata.images.length} image(s),{" "}
                      {inspectingProduct.designMetadata.webLinks.length} link(s))
                    </span>
                    <div className="space-y-2">
                      {inspectingProduct.designMetadata.images.length > 0 && (
                        <div className="grid grid-cols-2 gap-2">
                          {inspectingProduct.designMetadata.images.map((img) => (
                            <div
                              key={img.id}
                              className="p-2 rounded-md border border-zinc-200 dark:border-zinc-800 flex items-center gap-2.5 bg-zinc-50/50 dark:bg-zinc-900/50"
                            >
                              <img
                                src={img.url}
                                alt={img.name}
                                className="w-10 h-10 rounded object-cover border border-zinc-200 dark:border-zinc-700 shrink-0"
                              />
                              <div className="min-w-0 flex-1">
                                <p className="font-medium truncate text-zinc-800 dark:text-zinc-200" title={img.name}>
                                  {img.name}
                                </p>
                                <span className="text-[10px] text-zinc-400 font-mono">{img.size}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {inspectingProduct.designMetadata.webLinks.length > 0 && (
                        <div className="space-y-1">
                          {inspectingProduct.designMetadata.webLinks.map((url, idx) => (
                            <a
                              key={"inspect-link-" + idx}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-brand-600 dark:text-brand-400 hover:underline font-mono text-[11px] bg-zinc-50/50 dark:bg-zinc-900/50"
                            >
                              <span className="truncate">{url}</span>
                              <ExternalLink className="w-3 h-3 shrink-0 ml-1.5 opacity-60" />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {inspectingProduct.catalogMetadata && (
              <div className="rounded-md border border-zinc-200 bg-zinc-50/70 p-3 dark:border-zinc-800 dark:bg-zinc-900/50">
                <span className="mb-2 block text-[10px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Catalog reference
                </span>
                <p className="font-mono text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                  {inspectingProduct.catalogMetadata.sourceMaterialCode}
                  {inspectingProduct.catalogMetadata.sourceRequestNumber &&
                    " / " + inspectingProduct.catalogMetadata.sourceRequestNumber}
                </p>
                <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-300">
                  {inspectingProduct.catalogMetadata.sourceDescription}
                </p>
                {(inspectingProduct.catalogMetadata.bindingType1 ||
                  inspectingProduct.catalogMetadata.bindingType2) && (
                  <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                    Binding: {[
                      inspectingProduct.catalogMetadata.bindingType1,
                      inspectingProduct.catalogMetadata.bindingType2,
                    ].filter(Boolean).join(" / ")}
                  </p>
                )}
              </div>
            )}
            {/* Sampling Specifications */}
            {inspectingProduct.samplingMetadata && (
              <div className="space-y-3 pt-3 border-t border-zinc-100 dark:border-white/[0.06]">
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="p-3 rounded-lg border border-blue-200/80 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/30">
                    <span className="text-[10px] font-mono text-blue-600 dark:text-blue-400 block uppercase font-medium">
                      Sample Scope Type
                    </span>
                    <span className="font-mono font-bold text-sm text-blue-950 dark:text-blue-100 mt-0.5 block">
                      {inspectingProduct.samplingMetadata.sampleType === "full"
                        ? "Full Sample (Finished Unit)"
                        : "Partial Sample (Component / Dummy)"}
                    </span>
                  </div>

                  <div className="p-3 rounded-lg border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/50">
                    <span className="text-[10px] font-mono text-zinc-400 block uppercase font-medium">
                      Selection Source
                    </span>
                    <span className="font-mono font-bold text-sm text-zinc-900 dark:text-zinc-100 mt-0.5 block">
                      {inspectingProduct.samplingMetadata.searchMode === "material_code"
                        ? "Material Code Search"
                        : "Binding Structure"}
                    </span>
                  </div>

                  <div className="p-3 rounded-lg border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/50">
                    <span className="text-[10px] font-mono text-zinc-400 block uppercase font-medium">
                      Binding 1 (Primary)
                    </span>
                    <span className="font-medium text-xs text-zinc-900 dark:text-zinc-100 mt-0.5 block">
                      {inspectingProduct.samplingMetadata.bindingType1 || "Standard / As Per Sample"}
                    </span>
                  </div>

                  <div className="p-3 rounded-lg border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/50">
                    <span className="text-[10px] font-mono text-zinc-400 block uppercase font-medium">
                      Binding 2 (Spine)
                    </span>
                    <span className="font-medium text-xs text-zinc-900 dark:text-zinc-100 mt-0.5 block">
                      {inspectingProduct.samplingMetadata.bindingType2 || "Standard / None"}
                    </span>
                  </div>
                </div>

                {inspectingProduct.samplingMetadata.partialRequirements && (
                  <div className="p-3 rounded-lg border border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/20 text-xs font-sans">
                    <span className="text-[10px] font-mono text-amber-700 dark:text-amber-400 block uppercase font-medium mb-1">
                      Partial Sample Details:
                    </span>
                    <p className="text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap">
                      {inspectingProduct.samplingMetadata.partialRequirements}
                    </p>
                  </div>
                )}

                {inspectingProduct.samplingMetadata.sourceSrNumber && (
                  <div className="p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-xs font-mono text-zinc-600 dark:text-zinc-400 flex items-center justify-between">
                    <span>Database Source Sample Ref:</span>
                    <strong className="text-zinc-900 dark:text-zinc-100">
                      {inspectingProduct.samplingMetadata.sourceSrNumber}
                    </strong>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-3.5 border-t border-slate-100 dark:border-white/[0.06] bg-[#f8f9ff] dark:bg-white/[0.02] flex items-center justify-between shrink-0">
            <button
              type="button"
              onClick={() => {
                const toDelete = inspectingProduct.id;
                onClose();
                onRemoveProduct(toDelete);
              }}
              className="h-8 px-3 rounded-xl text-rose-600 hover:bg-rose-50 text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1.5 dark:text-rose-400 dark:hover:bg-rose-950/40"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Remove from Batch</span>
            </button>

            <div className="flex items-center gap-2">
              {onEditProduct && (
                <button
                  type="button"
                  onClick={() => {
                    const toEdit = inspectingProduct;
                    onClose();
                    onEditProduct(toEdit);
                  }}
                  className="h-8 px-3.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-900/60 text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1.5 border border-blue-200/80 dark:border-blue-800/40"
                  title="Edit this staged specification"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  const toDuplicate = inspectingProduct;
                  onClose();
                  onDuplicateProduct(toDuplicate);
                }}
                className="h-8 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-white/[0.06] dark:text-zinc-300 dark:hover:bg-white/10 text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Duplicate</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="h-8 px-4 rounded-xl text-white text-xs font-bold cursor-pointer transition-all shadow-[0_2px_10px_rgba(0,109,50,0.25)] hover:shadow-[0_4px_14px_rgba(0,109,50,0.35)]"
                style={{ background: "linear-gradient(135deg, #006d32 0%, #00d166 100%)" }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
