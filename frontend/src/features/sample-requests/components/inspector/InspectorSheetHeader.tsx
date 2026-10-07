import React from "react";
import { SampleRequestItem } from "../../types";
import {
  Clock,
  Building2,
  FileText,
  Package,
  Sparkles,
  ThumbsUp,
  ClipboardCheck,
  Check,
  ExternalLink,
} from "lucide-react";
import { ParsedFeasibilityDetails } from "../../utils/feasibilityParsers";

export interface InspectorSheetHeaderProps {
  request: SampleRequestItem;
  activeRequest: SampleRequestItem;
  trackType: string | null;
  displayType: string;
  primaryTitle: string;
  feasibilityDetails: ParsedFeasibilityDetails;
  previewableImagesCount: number;
  isSubmitting: boolean;
  isConverting: boolean;
  onOpenReviewTab: () => void;
  onMarketingFinalApprove: (approved: boolean, remark?: string) => Promise<void>;
  onConvertToSampling: () => Promise<void>;
}

export const InspectorSheetHeader: React.FC<InspectorSheetHeaderProps> = ({
  request,
  activeRequest,
  trackType,
  displayType,
  primaryTitle,
  feasibilityDetails,
  previewableImagesCount,
  isSubmitting,
  isConverting,
  onOpenReviewTab,
  onMarketingFinalApprove,
  onConvertToSampling,
}) => {
  return (
    <>
      {/* Luminous Smart Stat Buttons Ribbon (Top-Right of Sheet) */}
      <div className="flex justify-between items-center bg-[#eff4ff] dark:bg-zinc-900/60 backdrop-blur-xl flex-wrap py-1.5 px-2">
        <div className="px-4 py-2 flex items-center gap-3 flex-wrap">
          <span className="font-display text-sm font-bold text-[#006d32] dark:text-[#00d166] tracking-tight">
            PMT No: {request.srNumber || `SR-${request.id}`}
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-zinc-700" />
          <span className="font-display text-xs text-slate-500 font-medium uppercase tracking-widest">
            {trackType === "feasibility_check"
              ? "Feasibility Check"
              : trackType === "program_planning"
              ? "Program Planning"
              : "Sampling"}
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-zinc-700" />
          <span className="bg-[#006d32]/10 dark:bg-[#00d166]/20 text-[#006d32] dark:text-[#00d166] text-[10px] font-display font-bold px-2 py-0.5 rounded-md">
            Active Snapshot: V1.0
          </span>
        </div>

        <div className="flex items-center flex-wrap gap-6 px-4">
          {/* Stat 1: SLA Target */}
          <div className="flex items-center gap-3" title="Target SLA Due Date">
            <div className="w-8 h-8 rounded-full bg-white dark:bg-zinc-800 shadow-[0_4px_12px_rgba(11,28,48,0.04)] flex items-center justify-center text-[#006d32]">
              <Clock className="w-4 h-4" />
            </div>
            <div className="leading-tight">
              <div className="font-bold text-xs text-slate-900 dark:text-zinc-100 font-display">
                {request.sampleRequiredDate || request.dateRequestCreated || "2026-10-12"}
              </div>
              <div className="text-[10px] text-slate-500 font-medium">Target SLA Date</div>
            </div>
          </div>

          {/* Stat 2: Facility */}
          <div className="flex items-center gap-3" title="Assigned Fulfillment Plant">
            <div className="w-8 h-8 rounded-full bg-white dark:bg-zinc-800 shadow-[0_4px_12px_rgba(11,28,48,0.04)] flex items-center justify-center text-[#006d32]">
              <Building2 className="w-4 h-4" />
            </div>
            <div className="leading-tight">
              <div className="font-bold text-xs text-slate-900 dark:text-zinc-100 font-display truncate max-w-[120px]">
                {request.targetPlant
                  ? request.targetPlant.replace(/^\d{4}-?\s*/, "").trim()
                  : "Plant 1 (Pune)"}
              </div>
              <div className="text-[10px] text-slate-500 font-medium">Plant Facility</div>
            </div>
          </div>

          {/* Stat 3: Attachments / Materials */}
          <div className="flex items-center gap-3" title="Evidence & Specifications">
            <div className="w-8 h-8 rounded-full bg-white dark:bg-zinc-800 shadow-[0_4px_12px_rgba(11,28,48,0.04)] flex items-center justify-center text-amber-600">
              <FileText className="w-4 h-4" />
            </div>
            <div className="leading-tight">
              <div className="font-bold text-xs text-slate-900 dark:text-zinc-100 font-display">
                {previewableImagesCount + feasibilityDetails.referenceLinks.length} Files
              </div>
              <div className="text-[10px] text-slate-500 font-medium">Attachments</div>
            </div>
          </div>
        </div>
      </div>



      {/* Opportunity / Sample Title and Rating */}
      <div className="px-8 pt-8 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="text-[10px] uppercase font-bold tracking-widest text-[#006d32] dark:text-[#00d166] mb-2 font-display bg-[#006d32]/10 dark:bg-[#00d166]/10 inline-block px-2 py-0.5 rounded-md">
              SAMPLE TITLE / OPPORTUNITY NAME
            </div>
            <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-zinc-100 tracking-tight leading-snug">
              {primaryTitle || `${request.customer || "General"} · ${displayType}`}
            </h1>
          </div>

          <div
            className="flex items-center space-x-0.5 text-amber-400 text-xl shrink-0 drop-shadow-sm"
            title="Priority Level: High"
          >
            <span>★</span>
            <span>★</span>
            <span>★</span>
            <span className="text-slate-200 dark:text-zinc-700">★</span>
          </div>
        </div>

        {/* 2-Column Master Data Grid - Tonal Depth, No Lines */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 pt-6 mt-6 border-t-0 bg-[#f8f9ff] dark:bg-zinc-900/40 p-5 rounded-2xl text-xs shadow-inner">
          {/* Left Column */}
          <div className="space-y-2">
            <div className="flex items-baseline">
              <span className="w-36 text-neutral-500 font-medium shrink-0">Customer</span>
              <span className="flex-1 font-semibold text-neutral-900 dark:text-zinc-100">
                {request.customer || "Unassigned Account"}
              </span>
            </div>

            <div className="flex items-baseline">
              <span className="w-36 text-slate-500 font-medium shrink-0">Category / Type</span>
              <span className="flex-1 font-semibold text-[#006d32] dark:text-[#00d166]">
                {displayType}
              </span>
            </div>

            <div className="flex items-baseline">
              <span className="w-36 text-neutral-500 font-medium shrink-0">Program Name</span>
              <span className="flex-1 text-neutral-800 dark:text-zinc-200">
                {request.programName || request.programCampaignTitle || "Annual Sampling Plan"}
              </span>
            </div>

            <div className="flex items-baseline">
              <span className="w-36 text-neutral-500 font-medium shrink-0">Sales Team Owner</span>
              <span className="flex-1 text-neutral-800 dark:text-zinc-200">
                {request.createdBy || "Parin D (Sales Team)"}
              </span>
            </div>

            {feasibilityDetails.referenceLinks.length > 0 && (
              <div className="flex items-baseline">
                <span className="w-36 text-neutral-500 font-medium shrink-0">Reference Link</span>
                <span className="flex-1 font-mono flex items-center gap-1.5 truncate">
                  <ExternalLink className="w-3.5 h-3.5 text-[#017E84] shrink-0" />
                  <a
                    href={
                      feasibilityDetails.referenceLinks[0].startsWith("http")
                        ? feasibilityDetails.referenceLinks[0]
                        : `https://${feasibilityDetails.referenceLinks[0]}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#006d32] hover:underline font-semibold truncate"
                    title={feasibilityDetails.referenceLinks[0]}
                  >
                    <span className="truncate">
                      {feasibilityDetails.referenceLinks[0].replace(/^https?:\/\//, "")}
                    </span>
                  </a>
                  {feasibilityDetails.referenceLinks.length > 1 && (
                    <span className="text-[10px] text-neutral-400 font-normal shrink-0">
                      (+{feasibilityDetails.referenceLinks.length - 1} more)
                    </span>
                  )}
                </span>
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-2">
            <div className="flex items-baseline">
              <span className="w-36 text-neutral-500 font-medium shrink-0">Assigned Plant</span>
              <span className="flex-1 text-neutral-800 dark:text-zinc-200">
                {request.targetPlant || "Plant 1 (Central Notebooks & Wiro)"}
              </span>
            </div>

            <div className="flex items-baseline">
              <span className="w-36 text-neutral-500 font-medium shrink-0">Requested Pieces</span>
              <span className="flex-1 font-mono text-neutral-800 dark:text-zinc-200">
                {request.qtyForSampling ? `${request.qtyForSampling} Finished Mockups` : "6 Finished Mockups"}
              </span>
            </div>

            <div className="flex items-baseline">
              <span className="w-36 text-neutral-500 font-medium shrink-0">Customer Due Date</span>
              <span className="flex-1 font-mono font-semibold text-[#017E84] dark:text-teal-400">
                {request.sampleRequiredDate || request.dateRequestCreated || "20-11-2026"}
              </span>
            </div>


          </div>
        </div>
      </div>
    </>
  );
};
