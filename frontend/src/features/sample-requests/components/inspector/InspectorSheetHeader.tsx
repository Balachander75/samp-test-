import React from "react";
import { SampleRequestItem } from "../../types";
import { formatOdooDate } from "../../utils/dateUtils";
import { StatusPill } from "@/components/ui/StatusPill";
import { getRequestTypes } from "../../sampling/utils/requestTypeUtils";
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
}) => {
  const code = request.srNumber || activeRequest.srNumber || `SR-${request.id}`;
  const requestTypes = getRequestTypes(activeRequest);

  return (
    <div className="bg-white/80 dark:bg-[#161928]/80 backdrop-blur-xl border-b border-slate-100 dark:border-white/5">
      {/* ── Top Bar: Reference Code & Flow Progression ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-8 py-3 bg-[#f8f9ff]/70 dark:bg-zinc-900/40 border-b border-slate-100/80 dark:border-white/5">
        <div className="flex items-center gap-2.5">
          <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-lg bg-[#eff4ff] dark:bg-[#006d32]/20 text-[#006d32] dark:text-[#00d166] border border-[#006d32]/20">
            {code}
          </span>
          <span className="text-slate-300 dark:text-zinc-700">/</span>
          <span className="text-xs font-display font-semibold text-slate-500 dark:text-zinc-400">
            {trackType === "program_planning"
              ? "Seasonal Program Specification Sheet"
              : trackType === "feasibility_check"
              ? "Feasibility Evaluation Sheet"
              : "Commercial Sample Specification Sheet"}
          </span>
        </div>

        {/* Right Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          {requestTypes.map((type) => (
            <span
              key={type}
              className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-display font-semibold bg-[#eff4ff] dark:bg-[#006d32]/20 text-[#006d32] dark:text-[#00d166] border border-[#006d32]/25 capitalize"
            >
              {type}
            </span>
          ))}
          <StatusPill status={activeRequest.status || "Draft"} />
        </div>
      </div>

      {/* ── Document Hero Section ── */}
      <div className="px-8 py-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight text-slate-900 dark:text-zinc-50">
              {activeRequest.customer || "General Commercial Account"}
            </h1>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 flex items-center gap-1.5 flex-wrap">
              <span>Initiated by</span>
              <span className="font-semibold text-slate-800 dark:text-zinc-200">
                {activeRequest.createdBy || "Marketing Desk"}
              </span>
              <span>·</span>
              <span>
                on{" "}
                {formatOdooDate(
                  activeRequest.dateRequestCreated || activeRequest.createdAt
                )}
              </span>
              {activeRequest.brandName && (
                <>
                  <span>·</span>
                  <span className="font-mono text-slate-600 dark:text-slate-300">
                    Brand: {activeRequest.brandName}
                  </span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* ── 4-Card Executive Metrics Strip (Clean Tonal Depth, Zero Random Icons) ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-5">
          {/* Card 1: Product Title / Description */}
          <div className="p-3.5 rounded-2xl bg-[#eff4ff]/60 dark:bg-white/5 border border-slate-100/80 dark:border-white/5 space-y-1">
            <span className="text-[10px] font-display uppercase tracking-wider text-slate-400 dark:text-zinc-400 block font-semibold">
              Product Scope
            </span>
            <div
              className="font-display font-bold text-xs text-slate-900 dark:text-zinc-100 truncate"
              title={primaryTitle}
            >
              {primaryTitle || displayType}
            </div>
          </div>

          {/* Card 2: Required Target SLA */}
          <div className="p-3.5 rounded-2xl bg-[#eff4ff]/60 dark:bg-white/5 border border-slate-100/80 dark:border-white/5 space-y-1">
            <span className="text-[10px] font-display uppercase tracking-wider text-slate-400 dark:text-zinc-400 block font-semibold">
              Target SLA Date
            </span>
            <div className="font-display font-bold text-xs text-slate-900 dark:text-zinc-100 font-mono">
              {activeRequest.sampleRequiredDate
                ? formatOdooDate(activeRequest.sampleRequiredDate)
                : "Flexible Turnaround"}
            </div>
          </div>

          {/* Card 3: Manufacturing Facility */}
          <div className="p-3.5 rounded-2xl bg-[#eff4ff]/60 dark:bg-white/5 border border-slate-100/80 dark:border-white/5 space-y-1">
            <span className="text-[10px] font-display uppercase tracking-wider text-slate-400 dark:text-zinc-400 block font-semibold">
              Assigned Plant
            </span>
            <div className="font-display font-bold text-xs text-slate-900 dark:text-zinc-100 truncate">
              {activeRequest.targetPlant
                ? `Plant ${activeRequest.targetPlant}`
                : "Plant 1 (Central)"}
            </div>
          </div>

          {/* Card 4: Sampling Quantity */}
          <div className="p-3.5 rounded-2xl bg-[#eff4ff]/60 dark:bg-white/5 border border-slate-100/80 dark:border-white/5 space-y-1">
            <span className="text-[10px] font-display uppercase tracking-wider text-slate-400 dark:text-zinc-400 block font-semibold">
              Required Units
            </span>
            <div className="font-display font-bold text-xs text-slate-900 dark:text-zinc-100 font-mono">
              {activeRequest.qtyForSampling
                ? `${activeRequest.qtyForSampling} Finished Pieces`
                : activeRequest.qtyDesignCosting
                ? `${Number(activeRequest.qtyDesignCosting).toLocaleString()} Units`
                : "Prototype Sample"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InspectorSheetHeader;
