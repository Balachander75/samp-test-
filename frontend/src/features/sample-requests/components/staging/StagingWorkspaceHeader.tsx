import React from "react";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Building2,
  Calendar,
  Package,
  Palette,
  Box,
  Layers,
  Calculator,
  ChevronRight,
  BookmarkCheck,
  Send,
} from "lucide-react";
import { StagedProductItem } from "../../types/staging";

export interface StagingWorkspaceHeaderProps {
  programContext: {
    customer: string;
    programName: string;
    programYear: string;
    year: string;
    parentRequestId?: string | number;
    parentSrNumber?: string;
    openedFromDraft?: boolean;
  };
  stagedProducts: StagedProductItem[];
  isSubmittingAll: boolean;
  isReleasing?: boolean;
  onNavigateBack: () => void;
  onOpenAddModal: () => void;
  onClearAll: () => void;
  onSaveAsDraft: () => void;
  onSubmitAll: () => void;
  onReleaseRequest?: () => void;
}

export const StagingWorkspaceHeader: React.FC<StagingWorkspaceHeaderProps> = ({
  programContext,
  stagedProducts,
  isSubmittingAll,
  isReleasing = false,
  onNavigateBack,
  onOpenAddModal,
  onClearAll,
  onSaveAsDraft,
  onSubmitAll,
  onReleaseRequest,
}) => {
  const designCount = stagedProducts.filter((product) => product.scopes.includes("design")).length;
  const mockupCount = stagedProducts.filter((product) => product.scopes.includes("mockup")).length;
  const samplingCount = stagedProducts.filter((product) => product.scopes.includes("sample")).length;
  const costingCount = stagedProducts.filter((product) => product.scopes.includes("costing")).length;

  return (
    <div className="bg-white dark:bg-[#12141d] border border-[#CED4DA] dark:border-white/[0.08] rounded shadow-2xs overflow-hidden">
      {/* ── 1. Top Bar: Breadcrumb, Document Title & Odoo Pipeline Stepper ── */}
      <div className="px-4 py-2.5 border-b border-[#E2E8F0] dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3 bg-[#FBFBFC] dark:bg-zinc-900/40">
        {/* Left: Return Arrow + Breadcrumb & Title */}
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={onNavigateBack}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded border border-[#CED4DA] bg-white text-zinc-600 transition-colors hover:border-[#714B67] hover:bg-[#F3E8EE] hover:text-[#714B67] cursor-pointer dark:border-zinc-700 dark:bg-[#171923] dark:text-zinc-300 dark:hover:text-purple-200"
            title="Return to Requests Desk"
            aria-label="Return to Requests Desk"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400 font-sans leading-none">
              <button
                type="button"
                onClick={onNavigateBack}
                className="hover:text-[#714B67] hover:underline cursor-pointer"
              >
                Requests Desk
              </button>
              <ChevronRight className="w-2.5 h-2.5 text-zinc-400 shrink-0" />
              <span className="text-zinc-600 dark:text-zinc-300">Commercial Sampling</span>
              <ChevronRight className="w-2.5 h-2.5 text-zinc-400 shrink-0" />
              <span className="font-bold text-[#714B67] dark:text-[#E8D7E3]">Product Staging</span>
            </div>

            <div className="flex items-center gap-2 mt-1">
              <h1 className="truncate text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-50 tracking-tight leading-none">
                {programContext.programName || "Commercial Sample Request"}
              </h1>
              <span className="px-1.5 py-0.2 rounded text-[9.5px] font-mono font-bold bg-[#F3E8EE] text-[#714B67] border border-[#714B67]/25 dark:bg-[#3E2938] dark:text-[#E8D7E3]">
                BATCH STAGING
              </span>
            </div>
          </div>
        </div>

        {/* Right: Odoo Pipeline Stage Status Bar */}
        <div className="flex items-center border border-[#CED4DA] dark:border-zinc-700 rounded overflow-hidden text-[10.5px] font-semibold bg-[#F8F9FA] dark:bg-zinc-900/60 divide-x divide-[#CED4DA] dark:divide-zinc-700 select-none">
          <div className="px-2.5 py-1 text-zinc-400 dark:text-zinc-500">1. Draft</div>
          <div className="px-3 py-1 bg-[#714B67] text-white font-bold flex items-center gap-1.5 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>2. Product Staging</span>
          </div>
          <div className="px-2.5 py-1 text-zinc-400 dark:text-zinc-500">3. Sampling</div>
        </div>
      </div>

      {/* ── 2. Unified Action Bar & Streamlined Metadata Ribbon ── */}
      <div className="px-4 py-2 flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-[#12141d]">
        {/* Left: Primary Workflow Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenAddModal}
            className="inline-flex h-7 items-center gap-1.5 rounded bg-[#714B67] hover:bg-[#5B3C53] active:bg-[#4b3145] px-3 text-xs font-bold text-white shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
            <span>Add Product</span>
          </button>

          {(stagedProducts.length > 0 || programContext.parentRequestId) && (
            <button
              type="button"
              onClick={onSaveAsDraft}
              disabled={isSubmittingAll || isReleasing}
              className="inline-flex h-7 items-center gap-1.5 rounded border border-[#CED4DA] bg-white px-2.5 text-xs font-semibold text-zinc-700 hover:bg-[#F8F9FA] transition-colors cursor-pointer dark:border-zinc-700 dark:bg-[#12141d] dark:text-zinc-300 dark:hover:bg-zinc-800 disabled:opacity-50"
              title="Save staged products into Draft queue"
            >
              <BookmarkCheck className="h-3.5 w-3.5 text-zinc-500" />
              <span>Save as Draft</span>
            </button>
          )}

          {programContext.openedFromDraft && (stagedProducts.length > 0 || programContext.parentRequestId) && (
            <button
              type="button"
              onClick={onReleaseRequest || onSubmitAll}
              disabled={isSubmittingAll || isReleasing}
              className="inline-flex h-7 items-center gap-1.5 rounded bg-[#017E84] hover:bg-[#00666A] active:bg-[#005256] px-3 text-xs font-bold text-white shadow-xs transition-colors cursor-pointer disabled:cursor-wait disabled:opacity-60"
              title="Release this request to active PMT / Creative workflow"
            >
              <Send className="h-3 w-3" />
              <span>
                {isReleasing
                  ? "Releasing Request…"
                  : programContext.parentSrNumber
                  ? `Release Request (${programContext.parentSrNumber})`
                  : "Release Request"}
              </span>
            </button>
          )}

          {stagedProducts.length > 0 && (
            <button
              type="button"
              onClick={onClearAll}
              className="inline-flex h-7 items-center gap-1 rounded text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2 text-[11px] font-semibold transition-colors cursor-pointer dark:text-rose-400 dark:hover:bg-rose-950/40 ml-1"
            >
              <Trash2 className="h-3 w-3" />
              <span>Clear</span>
            </button>
          )}
        </div>

        {/* Center / Right: Compact Metadata Chips */}
        <div className="flex items-center gap-3 text-xs text-zinc-600 dark:text-zinc-300 flex-wrap">
          {programContext.customer && (
            <div className="flex items-center gap-1 font-medium bg-neutral-50 dark:bg-zinc-800/60 px-2 py-0.5 rounded border border-neutral-200 dark:border-zinc-700">
              <Building2 className="w-3 h-3 text-[#714B67]" />
              <span className="text-zinc-400 text-[10.5px]">Account:</span>
              <span className="font-bold text-zinc-900 dark:text-zinc-100 truncate max-w-[180px]">
                {programContext.customer}
              </span>
            </div>
          )}

          <div className="flex items-center gap-1 font-medium bg-neutral-50 dark:bg-zinc-800/60 px-2 py-0.5 rounded border border-neutral-200 dark:border-zinc-700">
            <Calendar className="w-3 h-3 text-[#714B67]" />
            <span className="text-zinc-400 text-[10.5px]">Season:</span>
            <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
              {programContext.programYear || "2026"} (BY {programContext.year || "2026-27"})
            </span>
          </div>

          {/* Odoo Smart Stat Pills */}
          <div className="flex items-center gap-1 pl-1 border-l border-neutral-200 dark:border-zinc-700">
            <span
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#F3E8EE] text-[#714B67] dark:bg-[#3E2938] dark:text-[#E8D7E3] border border-[#714B67]/20"
              title="Total Staged Products"
            >
              <Package className="w-2.5 h-2.5" />
              {stagedProducts.length} Staged
            </span>
            {designCount > 0 && (
              <span
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-50 text-purple-700 border border-purple-200"
                title="Design Deliverables"
              >
                <Palette className="w-2.5 h-2.5" />
                {designCount} Design
              </span>
            )}
            {mockupCount > 0 && (
              <span
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-50 text-amber-700 border border-amber-200"
                title="Mockup Deliverables"
              >
                <Box className="w-2.5 h-2.5" />
                {mockupCount} Mockup
              </span>
            )}
            {samplingCount > 0 && (
              <span
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-violet-50 text-violet-700 border border-violet-200"
                title="Sample Deliverables"
              >
                <Layers className="w-2.5 h-2.5" />
                {samplingCount} Sample
              </span>
            )}
            {costingCount > 0 && (
              <span
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-teal-50 text-[#017E84] border border-teal-200"
                title="Costing Deliverables"
              >
                <Calculator className="w-2.5 h-2.5" />
                {costingCount} Costing
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StagingWorkspaceHeader;
