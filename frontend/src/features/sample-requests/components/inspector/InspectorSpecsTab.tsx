import React from "react";
import { SampleRequestItem, AddProgramMaterialPayload } from "../../types";
import { ParsedFeasibilityDetails, ParsedImageRef, ParsedMatrixRow } from "../../utils/feasibilityParsers";
import { InspectorMaterialsTable } from "./InspectorMaterialsTable";
import { ExternalLink } from "lucide-react";

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
  return (
    <div className="py-4 space-y-5">
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
      ) : trackType === "marketing_request" ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 border border-[#CED4DA] rounded bg-[#F8F9FA] dark:bg-zinc-900">
              <span className="font-mono text-[10px] uppercase font-bold text-neutral-400 block mb-1">
                01. Creative Art
              </span>
              <div className="font-bold text-neutral-800 dark:text-zinc-200">
                {request.trend || "Artwork Series"}
              </div>
              <div className="text-[10px] text-neutral-500 mt-1">
                {request.numberOfDesigns || 3} Artworks Required
              </div>
            </div>
            <div className="p-3 border border-[#CED4DA] rounded bg-[#F8F9FA] dark:bg-zinc-900">
              <span className="font-mono text-[10px] uppercase font-bold text-neutral-400 block mb-1">
                02. CAD Dummy
              </span>
              <div className="font-bold text-neutral-800 dark:text-zinc-200">
                {request.mockupRequired || "Standard Mockup"}
              </div>
              <div className="text-[10px] text-neutral-500 mt-1">Prototype verification</div>
            </div>
            <div className="p-3 border border-[#CED4DA] rounded bg-[#F8F9FA] dark:bg-zinc-900">
              <span className="font-mono text-[10px] uppercase font-bold text-neutral-400 block mb-1">
                03. Sampling
              </span>
              <div className="font-bold text-neutral-800 dark:text-zinc-200">
                {request.qtyForSampling || 6} Pieces
              </div>
              <div className="text-[10px] text-neutral-500 mt-1">Plant finished sample</div>
            </div>
            <div className="p-3 border border-[#CED4DA] rounded bg-[#F8F9FA] dark:bg-zinc-900">
              <span className="font-mono text-[10px] uppercase font-bold text-neutral-400 block mb-1">
                04. Costing
              </span>
              <div className="font-bold text-neutral-800 dark:text-zinc-200">
                {Number(request.qtyDesignCosting || 50000).toLocaleString()} Units
              </div>
              <div className="text-[10px] text-neutral-500 mt-1">BOM commercial run</div>
            </div>
          </div>
        </div>
      ) : (
        /* Feasibility Specifications & Scope */
        <div className="space-y-5">
          {/* Scope Metadata Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded border border-neutral-200 dark:border-zinc-800 bg-[#FBFBFC] dark:bg-zinc-900/50">
              <span className="font-mono text-[10px] uppercase font-bold text-neutral-400 block mb-1">
                Feasibility Category
              </span>
              <div className="font-bold text-xs text-neutral-800 dark:text-zinc-200 font-mono">
                {feasibilityDetails.category || "Custom Specification"}
              </div>
            </div>
            <div className="p-3 rounded border border-neutral-200 dark:border-zinc-800 bg-[#FBFBFC] dark:bg-zinc-900/50">
              <span className="font-mono text-[10px] uppercase font-bold text-neutral-400 block mb-1">
                Target Fulfillment
              </span>
              <div className="font-bold text-xs text-[#017E84] dark:text-teal-400">
                {activeRequest.targetPlant || "Plant 1 (Pune)"}
              </div>
            </div>
            <div className="p-3 rounded border border-neutral-200 dark:border-zinc-800 bg-[#FBFBFC] dark:bg-zinc-900/50">
              <span className="font-mono text-[10px] uppercase font-bold text-neutral-400 block mb-1">
                Target Order Volume
              </span>
              <div className="font-bold text-xs text-[#714B67] dark:text-purple-300 font-mono">
                {activeRequest.qtyDesignCosting
                  ? `${Number(activeRequest.qtyDesignCosting).toLocaleString()} Units`
                  : "Evaluation Prototype"}
              </div>
            </div>
            <div className="p-3 rounded border border-neutral-200 dark:border-zinc-800 bg-[#FBFBFC] dark:bg-zinc-900/50">
              <span className="font-mono text-[10px] uppercase font-bold text-neutral-400 block mb-1">
                Required By
              </span>
              <div className="font-bold text-xs text-neutral-800 dark:text-zinc-200 font-mono">
                {activeRequest.sampleRequiredDate || activeRequest.dateRequestCreated || "Flexible"}
              </div>
            </div>
          </div>

          {/* Technical Scope & Description */}
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-zinc-400 mb-2 font-mono flex items-center gap-1.5">
              <span>Technical Description & Product Scope</span>
            </div>
            <div className="p-3.5 rounded border border-[#CED4DA] dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs text-neutral-900 dark:text-zinc-100 leading-relaxed font-sans whitespace-pre-wrap">
              {displayDescription || "No technical description specified for this feasibility check."}
            </div>
          </div>

          {/* Marketing Remarks */}
          {displayRemark && (
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-zinc-400 mb-1.5 font-mono">
                Marketing Commercial Directives
              </div>
              <div className="p-3 rounded border border-amber-200 dark:border-amber-900/40 bg-amber-50/30 dark:bg-amber-950/10 text-xs text-amber-900 dark:text-amber-200 italic font-sans leading-relaxed">
                "{displayRemark}"
              </div>
            </div>
          )}

          {/* Reference Web Links */}
          {feasibilityDetails.referenceLinks.length > 0 && (
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-zinc-400 mb-2 font-mono">
                Client Reference URLs & Benchmark Links ({feasibilityDetails.referenceLinks.length})
              </div>
              <div className="flex flex-wrap gap-2">
                {feasibilityDetails.referenceLinks.map((url, i) => (
                  <a
                    key={i}
                    href={url.startsWith("http") ? url : `https://${url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-[#CED4DA] dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:border-[#714B67] hover:text-[#714B67] text-xs font-mono text-neutral-700 dark:text-zinc-300 transition shadow-2xs group"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-neutral-400 group-hover:text-[#714B67]" />
                    <span className="truncate max-w-xs">{url.replace(/^https?:\/\//, "")}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Direct Photo Thumbnails in Specs */}
          {previewableImages.length > 0 && (
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-zinc-400 mb-2 font-mono">
                Attached Product Photos ({previewableImages.length})
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {previewableImages.map((img, idx) => (
                  <div
                    key={img.id}
                    onClick={() => img.url && onSelectPreviewImage(img.url)}
                    className="group relative rounded border border-[#CED4DA] dark:border-zinc-700 bg-neutral-50 dark:bg-zinc-900 overflow-hidden cursor-pointer hover:border-[#714B67] transition shadow-2xs"
                  >
                    <div className="aspect-[4/3] w-full bg-neutral-100 dark:bg-zinc-800 overflow-hidden relative">
                      <img
                        src={imageSourceFor(img.url)}
                        alt={img.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                        <span className="text-[10px] font-medium text-white bg-black/70 px-2 py-0.5 rounded">
                          View Preview
                        </span>
                      </div>
                    </div>
                    <div className="p-1.5 flex items-center justify-between text-[10px] text-neutral-600 dark:text-zinc-400">
                      <span className="truncate">{img.name}</span>
                      <span className="font-mono text-neutral-400">#{idx + 1}</span>
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
