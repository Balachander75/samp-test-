import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SampleRequestItem } from "@/features/sample-requests/types";
import {
  FileText,
  Eye,
  Copy,
  Check,
  ArrowRight,
  Clock,
} from "@/components/ui/icons";

export interface RecentRequestsStreamProps {
  sampleRequests: SampleRequestItem[];
  onInspectSpecs: (req: SampleRequestItem) => void;
}

function getStatusPill(status?: string | null) {
  const s = String(status || "").toLowerCase();
  if (s.includes("deal") || s.includes("actual")) {
    return { bg: "bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60", dot: "bg-emerald-500", label: status || "Actual Deal" };
  }
  if (s.includes("dispatch") || s.includes("close")) {
    return { bg: "bg-teal-50 dark:bg-teal-950/70 text-teal-800 dark:text-teal-300 border-teal-200 dark:border-teal-800/60", dot: "bg-teal-500", label: status || "Dispatched / Closed" };
  }
  if (s.includes("plant") || s.includes("execution")) {
    return { bg: "bg-blue-50 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800/60", dot: "bg-blue-500", label: status || "In Plant Work" };
  }
  if (s.includes("samp") || s.includes("review") || s.includes("pmt")) {
    return { bg: "bg-sky-50 dark:bg-sky-950/70 text-sky-800 dark:text-sky-300 border-sky-200 dark:border-sky-800/60", dot: "bg-sky-500", label: status || "SAMP Review" };
  }
  if (s.includes("studio")) {
    return { bg: "bg-purple-50 dark:bg-purple-950/70 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800/60", dot: "bg-purple-500", label: status || "Studio Work" };
  }
  if (s.includes("creative")) {
    return { bg: "bg-pink-50 dark:bg-pink-950/70 text-pink-800 dark:text-pink-300 border-pink-200 dark:border-pink-800/60", dot: "bg-pink-500", label: status || "Creative Design" };
  }
  return { bg: "bg-amber-50 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/60", dot: "bg-amber-500", label: status || "Draft (Pre-SMT)" };
}

export const RecentRequestsStream: React.FC<RecentRequestsStreamProps> = ({
  sampleRequests,
  onInspectSpecs,
}) => {
  const navigate = useNavigate();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const recentItems = sampleRequests.slice(0, 6);

  const handleCopy = (code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 1500);
  };

  return (
    <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-card hover:shadow-card-hover transition-all space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/70 dark:border-blue-900/60 flex items-center justify-center">
            <FileText size={15} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Live Operations Stream
            </h3>
            <p className="text-[11px] text-slate-400">
              Recent sample requests with 1-click technical specification inspection
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate("/sample-requests")}
          className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 inline-flex items-center gap-1 cursor-pointer self-start sm:self-center transition-colors"
        >
          <span>All Requests ({sampleRequests.length})</span>
          <ArrowRight size={13} />
        </button>
      </div>

      {/* Stream Items List */}
      {recentItems.length === 0 ? (
        <div className="py-8 text-center text-slate-400 text-xs font-medium">
          No sample requests currently registered in active pipeline.
        </div>
      ) : (
        <div className="space-y-2">
          {recentItems.map((req) => {
            const statusInfo = getStatusPill(req.status);

            return (
              <div
                key={req.id}
                onClick={() => onInspectSpecs(req)}
                className="group p-2.5 sm:p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-white dark:hover:bg-slate-800/80 shadow-2xs transition-all duration-150 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-2.5"
              >
                {/* Left Side: SR Code, Material, Title */}
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                      <span>{req.srNumber}</span>
                      <button
                        type="button"
                        onClick={(e) => handleCopy(req.srNumber, e)}
                        className="p-0.5 text-slate-400 hover:text-blue-600 transition-colors"
                        title="Copy code"
                      >
                        {copiedCode === req.srNumber ? (
                          <Check size={11} className="text-emerald-600 stroke-[3]" />
                        ) : (
                          <Copy size={11} />
                        )}
                      </button>
                    </span>

                    {req.materialCode && (
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-200/60 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold border border-slate-300/60 dark:border-slate-600">
                        {req.materialCode}
                      </span>
                    )}

                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.2 rounded-full text-[10px] font-semibold border font-mono ${statusInfo.bg}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`} />
                      <span>{statusInfo.label}</span>
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 truncate" title={req.productDescription}>
                    {req.productDescription || "Standard Catalog Notebook"}
                  </p>

                  <div className="flex items-center gap-2 text-[11px] text-slate-400 flex-wrap font-medium">
                    <span>Client: <strong className="text-slate-700 dark:text-slate-300 font-semibold">{req.customer || "General"}</strong></span>
                    <span>•</span>
                    <span>Plant: <strong className="text-slate-700 dark:text-slate-300 font-semibold">{req.targetPlant || "Khaniwade"}</strong></span>
                    {req.sampleRequiredDate && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400 font-mono">
                          <Clock size={11} className="text-slate-400" />
                          <span>Due: {req.sampleRequiredDate}</span>
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Right Side: 1-Click Inspect Specs CTA */}
                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onInspectSpecs(req);
                    }}
                    className="h-7.5 px-3 rounded-lg text-xs font-semibold bg-white dark:bg-slate-900 hover:bg-blue-50 dark:hover:bg-blue-950/50 text-slate-700 dark:text-slate-200 hover:text-blue-700 dark:hover:text-blue-300 border border-slate-200 dark:border-slate-700 hover:border-blue-300 transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <Eye size={13} className="text-blue-600 dark:text-blue-400" />
                    <span>Inspect Specs</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
