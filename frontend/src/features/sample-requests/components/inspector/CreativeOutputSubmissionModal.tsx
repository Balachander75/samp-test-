import React, { useState, useEffect } from "react";
import {
  FolderOpen,
  Link2,
  ExternalLink,
  Plus,
  Trash2,
  Sparkles,
  Layers,
  Send,
  AlertTriangle,
  Info,
  CheckCircle2,
  X,
} from "lucide-react";
import { CreativeDesignOutputRow } from "@/features/creative/types";

export interface CreativeOutputSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalRequested: number;
  deliveredCount: number;
  remainingCount: number;
  marketingBriefText: string;
  batchNumber: number;
  onSubmitBatch: (payload: {
    designFileUrl: string;
    rows: CreativeDesignOutputRow[];
  }) => Promise<void> | void;
}

export const CreativeOutputSubmissionModal: React.FC<CreativeOutputSubmissionModalProps> = ({
  isOpen,
  onClose,
  totalRequested,
  deliveredCount,
  remainingCount,
  marketingBriefText,
  batchNumber,
  onSubmitBatch,
}) => {
  const [designFileUrl, setDesignFileUrl] = useState("");
  const [outputCount, setOutputCount] = useState<number>(Math.max(1, remainingCount));
  const [outputRows, setOutputRows] = useState<CreativeDesignOutputRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize dynamic rows whenever count changes
  useEffect(() => {
    const safeCount = Math.max(1, Math.min(remainingCount || 10, outputCount));
    setOutputRows((prev) =>
      Array.from({ length: safeCount }, (_, index) => {
        const rowDesignNum = `D${deliveredCount + index + 1}`;
        if (prev[index]) {
          return {
            ...prev[index],
            designNumber: rowDesignNum,
          };
        }
        return {
          designNumber: rowDesignNum,
          description: marketingBriefText
            ? `${marketingBriefText} (${rowDesignNum})`
            : `Cover Artwork (${rowDesignNum})`,
          stockNumber: "",
          remarks: "",
        };
      })
    );
  }, [outputCount, deliveredCount, marketingBriefText, remainingCount]);

  if (!isOpen) return null;

  const handleApplyBriefToAll = () => {
    setOutputRows((curr) =>
      curr.map((r, i) => {
        const rowDesignNum = `D${deliveredCount + i + 1}`;
        return {
          ...r,
          description: marketingBriefText
            ? `${marketingBriefText} (${rowDesignNum})`
            : `Artwork (${rowDesignNum})`,
        };
      })
    );
  };

  const handleUpdateRow = (
    index: number,
    field: "description" | "stockNumber" | "remarks",
    value: string
  ) => {
    setOutputRows((curr) =>
      curr.map((r, i) => (i === index ? { ...r, [field]: value } : r))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!designFileUrl.trim()) {
      setError("Please provide a valid link where design files are available (Drive, Figma, etc.).");
      return;
    }
    const emptyDescIndex = outputRows.findIndex((r) => !r.description.trim());
    if (emptyDescIndex >= 0) {
      setError(`Artwork row D${deliveredCount + emptyDescIndex + 1} requires a description.`);
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmitBatch({
        designFileUrl: designFileUrl.trim(),
        rows: outputRows,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to submit creative output.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl border-2 border-[#714B67]/30 dark:border-purple-800/40 bg-white dark:bg-[#161822] shadow-xl overflow-hidden animate-smooth-modal">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-purple-50/80 to-white dark:from-purple-950/30 dark:to-[#161822] border-b border-purple-100 dark:border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#714B67] text-white flex items-center justify-center shrink-0 shadow-xs">
            <FolderOpen className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight font-display">
                Submit Creative Artwork Output (Batch #{batchNumber})
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-100 text-[#714B67] dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                OUTPUT MATRIX
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              Specify design file repository and artwork variants with stock asset numbers
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-white transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs">
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Section 1: Design File Repository Link */}
        <div className="space-y-1.5">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300 font-sans">
            1. Design Artwork Shareable URL <span className="text-rose-500">*</span>
          </label>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="url"
                required
                value={designFileUrl}
                onChange={(e) => setDesignFileUrl(e.target.value)}
                placeholder="https://drive.google.com/drive/folders/... or Figma / SharePoint share link"
                className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 outline-none focus:border-[#714B67] focus:ring-2 focus:ring-[#714B67]/15 transition font-mono"
              />
            </div>
            {designFileUrl.trim() && (
              <a
                href={designFileUrl}
                target="_blank"
                rel="noreferrer"
                className="h-10 px-3.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-[#714B67] dark:bg-purple-950/50 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-xs font-semibold flex items-center gap-1.5 shrink-0 transition"
                title="Verify link"
              >
                <span>Open</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
          <p className="text-[10.5px] text-slate-400 dark:text-zinc-500">
            Ensure public or organization view access is enabled so Marketing can inspect design files.
          </p>
        </div>

        {/* Section 2: Completed Artwork Count Selector */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-900/40 border border-slate-200/80 dark:border-zinc-800 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300 block font-sans">
                2. Artwork Deliverables Count in this Batch
              </span>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                Marketing requested <strong className="text-slate-800 dark:text-zinc-200">{totalRequested} designs</strong> total.{" "}
                <span className="font-mono text-[#006d32] dark:text-emerald-400 font-bold">
                  {remainingCount} artwork(s) remaining.
                </span>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600 dark:text-zinc-400">
                Number of Designs:
              </span>
              <select
                value={outputCount}
                onChange={(e) => setOutputCount(Number(e.target.value))}
                className="h-9 px-3 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-bold font-mono text-[#714B67] dark:text-purple-300 outline-none focus:border-[#714B67] cursor-pointer"
              >
                {Array.from({ length: Math.max(1, remainingCount) }, (_, i) => i + 1).map((num) => (
                  <option key={num} value={num}>
                    {num} Design{num > 1 ? "s" : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Section 3: Dynamic 3-Column Artwork Matrix */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300 font-sans">
              3. Artwork Variant Specifications ({outputRows.length} Rows Generated)
            </label>
            <button
              type="button"
              onClick={handleApplyBriefToAll}
              className="text-[11px] font-semibold text-[#714B67] hover:underline dark:text-purple-300 flex items-center gap-1 cursor-pointer"
            >
              <Sparkles className="w-3 h-3 text-[#714B67]" />
              <span>Reset to Marketing Brief Description</span>
            </button>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-zinc-800 shadow-2xs">
            {/* Table Header: 3 Columns */}
            <div className="grid grid-cols-[80px_1fr_1fr_1fr] gap-3 bg-slate-100/90 dark:bg-zinc-800/80 px-4 py-2.5 text-[11px] font-mono font-bold uppercase text-slate-600 dark:text-zinc-300 border-b border-slate-200 dark:border-zinc-800">
              <span>Code</span>
              <span>1. Artwork Description</span>
              <span>2. Shutterstock / Stock No.</span>
              <span>3. Remarks / Finishes</span>
            </div>

            {/* Dynamic Rows */}
            <div className="divide-y divide-slate-100 dark:divide-zinc-800/70 max-h-72 overflow-y-auto">
              {outputRows.map((row, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-[80px_1fr_1fr_1fr] gap-3 px-4 py-2.5 items-center bg-white dark:bg-[#161822] hover:bg-slate-50/50 dark:hover:bg-zinc-850/40 transition"
                >
                  {/* Badge */}
                  <div>
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-purple-50 text-[#714B67] dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800/60">
                      {row.designNumber}
                    </span>
                  </div>

                  {/* Column 1: Description (Prefilled with Marketing description + D1..Dn) */}
                  <div>
                    <input
                      type="text"
                      required
                      value={row.description}
                      onChange={(e) => handleUpdateRow(idx, "description", e.target.value)}
                      placeholder="e.g. Spiral Notebook - Floral Cover (D1)"
                      className="w-full h-8 px-2.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs text-slate-900 dark:text-zinc-100 outline-none focus:border-[#714B67] focus:ring-1 focus:ring-[#714B67]/20"
                    />
                  </div>

                  {/* Column 2: Shutterstock / Stock Number (Empty for Creative) */}
                  <div>
                    <input
                      type="text"
                      value={row.stockNumber}
                      onChange={(e) => handleUpdateRow(idx, "stockNumber", e.target.value)}
                      placeholder="e.g. Shutterstock #192837482"
                      className="w-full h-8 px-2.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-mono text-slate-900 dark:text-zinc-100 outline-none focus:border-[#714B67] focus:ring-1 focus:ring-[#714B67]/20"
                    />
                  </div>

                  {/* Column 3: Remarks (Empty for Creative) */}
                  <div>
                    <input
                      type="text"
                      value={row.remarks}
                      onChange={(e) => handleUpdateRow(idx, "remarks", e.target.value)}
                      placeholder="e.g. Foil stamping plate separated"
                      className="w-full h-8 px-2.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs text-slate-900 dark:text-zinc-100 outline-none focus:border-[#714B67] focus:ring-1 focus:ring-[#714B67]/20"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-white/[0.06]">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="h-10 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] text-slate-700 dark:text-zinc-300 text-xs font-semibold cursor-pointer transition"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={isSubmitting || !designFileUrl.trim()}
            className="h-10 px-6 rounded-xl bg-gradient-to-r from-[#006d32] to-[#00d166] hover:from-[#005324] hover:to-[#00b054] text-white text-xs font-bold shadow-md transition active:scale-98 cursor-pointer flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isSubmitting ? "Submitting Output..." : `Submit ${outputRows.length} Artwork(s) to Marketing`}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
