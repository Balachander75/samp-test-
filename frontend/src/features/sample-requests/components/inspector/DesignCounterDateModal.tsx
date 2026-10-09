import React, { useState } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Calendar,
  Clock,
  AlertTriangle,
  ArrowRight,
  Send,
  Lock,
  Sparkles,
} from "lucide-react";
import { OperationalDatePicker } from "@/components/erp";

export interface DesignCounterDateModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalDate: string;
  isSlaEligible: boolean;
  slaLabel: string;
  onSubmitCounterDate: (proposedDate: string, reason: string) => Promise<void> | void;
}

export const DesignCounterDateModal: React.FC<DesignCounterDateModalProps> = ({
  isOpen,
  onClose,
  originalDate,
  isSlaEligible,
  slaLabel,
  onSubmitCounterDate,
}) => {
  const [proposedDate, setProposedDate] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSlaEligible) {
      setError("The 48-hour window to propose a counter date has expired.");
      return;
    }
    if (!proposedDate.trim()) {
      setError("Please select a proposed target date.");
      return;
    }
    if (!reason.trim()) {
      setError("Please explain why the requested date is not feasible.");
      return;
    }
    if (originalDate && proposedDate <= originalDate) {
      setError("Proposed target date must be later than the original required date.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmitCounterDate(proposedDate.trim(), reason.trim());
      onClose();
    } catch (err: any) {
      setError(err?.message || "Could not submit counter date proposal.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[120] overflow-y-auto flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 select-text"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="fixed inset-0 bg-transparent"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-lg bg-white dark:bg-[#161822] border border-slate-200/90 dark:border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden animate-smooth-modal">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-white dark:bg-[#161822] border-b border-slate-100 dark:border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Calendar className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight font-display">
                  Propose Counter Required Date
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50">
                  48H SLA
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                Negotiate deliverable timeline with Marketing
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* SLA Status Strip */}
        <div
          className={`px-6 py-2.5 flex items-center justify-between text-xs border-b ${
            isSlaEligible
              ? "bg-amber-50/70 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 border-amber-100 dark:border-amber-900/30"
              : "bg-rose-50/70 dark:bg-rose-950/20 text-rose-800 dark:text-rose-300 border-rose-100 dark:border-rose-900/30"
          }`}
        >
          <div className="flex items-center gap-2">
            {isSlaEligible ? (
              <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
            ) : (
              <Lock className="w-3.5 h-3.5 text-rose-600" />
            )}
            <span className="font-semibold">{slaLabel}</span>
          </div>
          <span className="text-[10.5px] font-mono opacity-80">
            {isSlaEligible ? "Within 2-day policy" : "Extension locked"}
          </span>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Current vs Proposed Date Comparison */}
          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-[#12141d] border border-slate-200/80 dark:border-zinc-800">
            <div>
              <span className="text-[10px] font-mono uppercase text-slate-500 dark:text-zinc-400 block font-bold">
                Marketing Target Date
              </span>
              <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 font-mono mt-1 block">
                {originalDate || "Not specified"}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase text-[#006d32] dark:text-emerald-400 block font-bold">
                Counter Proposed Date <span className="text-rose-500">*</span>
              </span>
              <div className="mt-1">
                <OperationalDatePicker
                  value={proposedDate}
                  onChange={setProposedDate}
                  placeholder="Select new target date"
                  disabled={!isSlaEligible || isSubmitting}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Justification Reason */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300 mb-1.5 font-sans">
              Operational Justification / Reason <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={!isSlaEligible || isSubmitting}
              placeholder="Explain why the required date is not feasible (e.g. Studio queue at capacity; 10 artwork concepts require 12 business days for proofing)..."
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 outline-none focus:border-[#714B67] focus:ring-2 focus:ring-[#714B67]/15 transition resize-none"
            />
            <p className="text-[10.5px] text-slate-400 dark:text-zinc-500 mt-1">
              This message will be shown directly to Marketing for acceptance or rejection.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-white/[0.06]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="h-9 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/10 text-slate-700 dark:text-zinc-300 text-xs font-semibold cursor-pointer transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={!isSlaEligible || isSubmitting || !proposedDate || !reason.trim()}
              className="h-9 px-4 rounded-xl bg-gradient-to-r from-[#714B67] to-[#5B3C53] hover:from-[#5B3C53] hover:to-[#482E42] text-white text-xs font-bold shadow-md transition active:scale-98 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? "Submitting..." : "Send Counter Date"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
