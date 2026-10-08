import React from "react";
import { SampleRequestItem, AddProgramMaterialPayload } from "../../types";
import { ParsedFeasibilityDetails, ParsedImageRef, ParsedMatrixRow } from "../../utils/feasibilityParsers";
import { InspectorMaterialsTable } from "./InspectorMaterialsTable";
import { ExternalLink, Eye } from "lucide-react";
import { getRequestTypes } from "../../sampling/utils/requestTypeUtils";

export interface InspectorSpecsTabProps {
  trackType: string | null;
  request: SampleRequestItem;
  activeRequest: SampleRequestItem;
  feasibilityDetails: ParsedFeasibilityDetails;
  displayDescription: string;
  displayRemark: string;
  previewableImages: ParsedImageRef[];
  imageSourceFor: (url?: string) => string | undefined;
  onSelectPreviewImage: (url: string) => void;
  // Materials Table props (if trackType === "program_planning")
  unifiedMatrixRows: ParsedMatrixRow[];
  matrixRemarks: Record<string | number, string>;
  savingRemarkId: string | number | null;
  savedRemarkId: string | number | null;
  isAddingRow: boolean;
  isSavingNewRow: boolean;
  newRowData: AddProgramMaterialPayload;
  addRowFeedback: string | null;
  onRemarkChange: (rowId: string | number, value: string) => void;
  onSaveRemark: (rowId: string | number, index: number) => void;
  onStartAddRow: () => void;
  onCancelAddRow: () => void;
  onNewRowDataChange: (field: keyof AddProgramMaterialPayload, value: string) => void;
  onSaveNewRow: () => void;
}

export const InspectorSpecsTab: React.FC<InspectorSpecsTabProps> = ({
  trackType,
  request,
  activeRequest,
  feasibilityDetails,
  displayDescription,
  displayRemark,
  previewableImages,
  imageSourceFor,
  onSelectPreviewImage,
  unifiedMatrixRows,
  matrixRemarks,
  savingRemarkId,
  savedRemarkId,
  isAddingRow,
  isSavingNewRow,
  newRowData,
  addRowFeedback,
  onRemarkChange,
  onSaveRemark,
  onStartAddRow,
  onCancelAddRow,
  onNewRowDataChange,
  onSaveNewRow,
}) => {
  const requestTypes = getRequestTypes(activeRequest);

  return (
    <div className="py-4 space-y-6">
      {trackType === "program_planning" ? (
        <InspectorMaterialsTable
          unifiedMatrixRows={unifiedMatrixRows}
          matrixRemarks={matrixRemarks}
          savingRemarkId={savingRemarkId}
          savedRemarkId={savedRemarkId}
          isAddingRow={isAddingRow}
          isSavingNewRow={isSavingNewRow}
          newRowData={newRowData}
          addRowFeedback={addRowFeedback}
          onRemarkChange={onRemarkChange}
          onSaveRemark={onSaveRemark}
          onStartAddRow={onStartAddRow}
          onCancelAddRow={onCancelAddRow}
          onNewRowDataChange={onNewRowDataChange}
          onSaveNewRow={onSaveNewRow}
        />
      ) : (
        <div className="space-y-6">
          {/* ── 1. Requested Deliverable Scopes Matrix ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-[#eff4ff]/60 dark:bg-white/5 border border-slate-100/80 dark:border-white/5">
              <span className="font-display text-[10px] uppercase font-bold text-slate-400 dark:text-zinc-400 block mb-1">
                Creative Design
              </span>
              <div className="font-display font-bold text-xs text-slate-900 dark:text-zinc-100">
                {requestTypes.includes("design") ? "Required" : "Not Required"}
              </div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                {request.numberOfDesigns || 1} Artwork Files
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#eff4ff]/60 dark:bg-white/5 border border-slate-100/80 dark:border-white/5">
              <span className="font-display text-[10px] uppercase font-bold text-slate-400 dark:text-zinc-400 block mb-1">
                Studio CAD / Dieline
              </span>
              <div className="font-display font-bold text-xs text-slate-900 dark:text-zinc-100">
                {requestTypes.includes("mockup") ? "Required" : "Standard"}
              </div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                CAD verification
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#eff4ff]/60 dark:bg-white/5 border border-slate-100/80 dark:border-white/5">
              <span className="font-display text-[10px] uppercase font-bold text-slate-400 dark:text-zinc-400 block mb-1">
                Physical Sampling
              </span>
              <div className="font-display font-bold text-xs text-slate-900 dark:text-zinc-100">
                {requestTypes.includes("sample") ? "Required" : "Optional"}
              </div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                {request.qtyForSampling || 6} Prototype Units
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#eff4ff]/60 dark:bg-white/5 border border-slate-100/80 dark:border-white/5">
              <span className="font-display text-[10px] uppercase font-bold text-slate-400 dark:text-zinc-400 block mb-1">
                Commercial Costing
              </span>
              <div className="font-display font-bold text-xs text-slate-900 dark:text-zinc-100">
                {requestTypes.includes("costing") ? "BOM Required" : "Standard"}
              </div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                {Number(request.qtyDesignCosting || 10000).toLocaleString()} Run Size
              </div>
            </div>
          </div>

          {/* ── 2. Technical Scope & Specifications Card ── */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#161928] border border-slate-100 dark:border-white/5 shadow-[0_4px_20px_rgba(11,28,48,0.02)] space-y-4">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-2 font-display">
                Technical Specification &amp; Product Description
              </div>
              <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-zinc-900/40 border border-slate-100/80 dark:border-white/5 text-xs text-slate-800 dark:text-zinc-200 leading-relaxed font-sans whitespace-pre-wrap">
                {displayDescription || "No detailed technical description recorded for this item."}
              </div>
            </div>

            {/* Marketing Remarks / Directives */}
            {displayRemark && (
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1.5 font-display">
                  Marketing Directives &amp; Commercial Notes
                </div>
                <div className="p-3.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/30 text-xs text-amber-900 dark:text-amber-200 font-sans leading-relaxed italic">
                  "{displayRemark}"
                </div>
              </div>
            )}

            {/* Key-Value Specifications Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 pt-2 border-t border-slate-100 dark:border-white/5 text-xs">
              {activeRequest.materialCode && (
                <div className="flex items-baseline py-1">
                  <span className="w-36 text-slate-400 font-medium shrink-0">Material Code</span>
                  <span className="flex-1 font-mono font-bold text-slate-800 dark:text-zinc-200">
                    {activeRequest.materialCode}
                  </span>
                </div>
              )}
              {activeRequest.brandName && (
                <div className="flex items-baseline py-1">
                  <span className="w-36 text-slate-400 font-medium shrink-0">Brand Name</span>
                  <span className="flex-1 font-semibold text-slate-800 dark:text-zinc-200">
                    {activeRequest.brandName}
                  </span>
                </div>
              )}
              {activeRequest.targetPlant && (
                <div className="flex items-baseline py-1">
                  <span className="w-36 text-slate-400 font-medium shrink-0">Target Facility</span>
                  <span className="flex-1 text-slate-800 dark:text-zinc-200">
                    Plant {activeRequest.targetPlant}
                  </span>
                </div>
              )}
              {activeRequest.sampleRequiredDate && (
                <div className="flex items-baseline py-1">
                  <span className="w-36 text-slate-400 font-medium shrink-0">Customer Due Date</span>
                  <span className="flex-1 font-mono font-bold text-[#006d32] dark:text-[#00d166]">
                    {activeRequest.sampleRequiredDate}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* ── 3. Reference URLs & Links ── */}
          {feasibilityDetails.referenceLinks.length > 0 && (
            <div className="space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 font-display">
                Client Reference URLs &amp; Benchmark Links ({feasibilityDetails.referenceLinks.length})
              </div>
              <div className="flex flex-wrap gap-2">
                {feasibilityDetails.referenceLinks.map((url, i) => (
                  <a
                    key={i}
                    href={url.startsWith("http") ? url : `https://${url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100/70 hover:bg-slate-200/70 dark:bg-zinc-800/60 dark:hover:bg-zinc-700/60 text-xs font-mono text-slate-700 dark:text-zinc-300 transition group"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#006d32]" />
                    <span className="truncate max-w-xs">{url.replace(/^https?:\/\//, "")}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* ── 4. Attached Photos & Mockup Gallery ── */}
          {previewableImages.length > 0 && (
            <div className="space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 font-display">
                Attached Reference Images &amp; Mockups ({previewableImages.length})
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {previewableImages.map((img, idx) => (
                  <div
                    key={img.id}
                    onClick={() => img.url && onSelectPreviewImage(img.url)}
                    className="group relative rounded-2xl bg-slate-100/60 dark:bg-zinc-900 border border-slate-200/60 dark:border-white/5 overflow-hidden cursor-pointer transition hover:shadow-md"
                  >
                    <div className="aspect-[4/3] w-full bg-slate-100 dark:bg-zinc-800 overflow-hidden relative">
                      <img
                        src={imageSourceFor(img.url)}
                        alt={img.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                        <span className="text-[11px] font-semibold text-white bg-black/75 px-2.5 py-1 rounded-lg flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5" />
                          <span>Preview</span>
                        </span>
                      </div>
                    </div>
                    <div className="p-2 flex items-center justify-between text-[11px] text-slate-600 dark:text-zinc-400">
                      <span className="truncate font-medium">{img.name}</span>
                      <span className="font-mono text-[10px] text-slate-400">#{idx + 1}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default InspectorSpecsTab;
