import React, { useState } from "react";
import {
  X,
  CheckCircle2,
  AlertTriangle,
  Download,
  Copy,
  Check,
  CheckCheck,
  Clock,
  Sparkles,
  Layers,
  Palette,
  FileCheck,
  Send,
  Eye,
  ExternalLink,
} from "lucide-react";
import { CreativeBriefItem } from "@/features/sample-requests/types";
import { SampleRequestItem } from "@/features/sample-requests/types";

export interface CreativeInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  brief: CreativeBriefItem | null;
  request?: SampleRequestItem | null;
  onUpdateStatus?: (newStatus: CreativeBriefItem["proofStatus"], notes?: string) => Promise<void>;
}

export const CreativeInspectorModal: React.FC<CreativeInspectorModalProps> = ({
  isOpen,
  onClose,
  brief,
  request,
  onUpdateStatus,
}) => {
  const [inspectorTab, setInspectorTab] = useState<"proof" | "review" | "assets">("proof");
  const [clientNoteInput, setClientNoteInput] = useState("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  if (!isOpen || (!brief && !request)) return null;

  // Normalized display values
  const artCode = brief?.artCode || request?.materialCode || request?.srNumber || "ART-SPEC";
  const title = brief?.title || request?.productDescription || (request as any)?.opportunityName || request?.programName || "Creative Artwork";
  const brand = brief?.brand || request?.customer || "Navneet Commercial";
  const designer = brief?.designer || request?.createdBy || "Creative Studio";
  const dimensions = brief?.dimensions || "210 x 297 mm (A4)";
  const dueDate = brief?.dueDate || request?.sampleRequiredDate || request?.targetArtworkDateCreative || "Standard SLA";
  const accentColor = brief?.accentColor || "#714B67";
  const proofVersion = brief?.proofVersion || "V1.0-RC";
  const proofStatus = brief?.proofStatus || (request?.status === "Creative" ? "In Concept" : "Brief Intake");
  const cmykPassed = brief ? brief.cmykCheckPassed : true;
  const resolutionDpi = brief?.resolutionDpi || 300;
  const bleedMm = brief?.bleedMm || 3;
  const finishingNotes = brief?.finishingNotes || request?.descriptionNotes || "Spot UV on embossed logo areas; Matte Lamination";
  const colorSpecs = brief?.colorSpecs || "CMYK + PMS 871C (Gold Metallic)";
  const referenceImages = request?.referenceImages || [];
  const referenceLinks = request?.referenceLinks || [];

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 1200);
  };

  const handleApplyStatus = async (status: CreativeBriefItem["proofStatus"]) => {
    if (!onUpdateStatus) return;
    setIsUpdatingStatus(true);
    try {
      await onUpdateStatus(status, clientNoteInput);
      setClientNoteInput("");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 select-none animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-5xl max-h-[94vh] flex flex-col bg-white dark:bg-[#0f1118] border border-[#CED4DA] dark:border-white/10 rounded-xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Control Bar (Odoo Plum Accent) */}
        <div className="px-5 py-3.5 border-b border-[#CED4DA] dark:border-white/[0.08] bg-[#F8F9FA] dark:bg-[#12141d] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center flex-wrap gap-2.5">
            <span className="inline-flex items-center gap-1.5 bg-white dark:bg-zinc-800 px-2.5 py-1 rounded border border-[#CED4DA] dark:border-zinc-700 text-xs font-mono font-bold text-[#714B67] dark:text-purple-300 shadow-2xs">
              {artCode}
              <button
                type="button"
                onClick={() => handleCopyCode(artCode)}
                className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer ml-1"
                title="Copy Reference Code"
              >
                {copiedCode === artCode ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              </button>
            </span>
            <span className="text-[11px] font-mono text-zinc-500 font-semibold">({brand})</span>
            <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate max-w-md">{title}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-8 w-8 rounded flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Close (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Context Strip */}
        <div className="grid grid-cols-4 border-b border-[#CED4DA] dark:border-white/[0.08] bg-white dark:bg-[#161822] divide-x divide-[#CED4DA] dark:divide-white/[0.08] shrink-0 text-xs p-3">
          <div>
            <span className="block text-[10px] uppercase font-bold text-zinc-400">Designer / Owner</span>
            <span className="font-semibold text-zinc-900 dark:text-zinc-100 truncate block mt-0.5">{designer}</span>
          </div>
          <div className="pl-3">
            <span className="block text-[10px] uppercase font-bold text-zinc-400">Dimensions</span>
            <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100 truncate block mt-0.5">{dimensions}</span>
          </div>
          <div className="pl-3">
            <span className="block text-[10px] uppercase font-bold text-zinc-400">Color Profile</span>
            <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100 truncate block mt-0.5">{colorSpecs}</span>
          </div>
          <div className="pl-3">
            <span className="block text-[10px] uppercase font-bold text-zinc-400">Due Date</span>
            <span className="font-mono font-bold text-[#714B67] dark:text-purple-300 truncate block mt-0.5">{dueDate}</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#CED4DA] dark:border-white/[0.08] bg-[#F8F9FA] dark:bg-[#0f1118] px-4 shrink-0 gap-2">
          <button
            type="button"
            onClick={() => setInspectorTab("proof")}
            className={`h-9 px-3 text-xs font-bold border-b-2 cursor-pointer transition-colors ${
              inspectorTab === "proof"
                ? "border-[#714B67] text-[#714B67] dark:text-purple-300"
                : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
            }`}
          >
            Artwork Proof Canvas
          </button>
          <button
            type="button"
            onClick={() => setInspectorTab("review")}
            className={`h-9 px-3 text-xs font-bold border-b-2 cursor-pointer transition-colors flex items-center gap-1.5 ${
              inspectorTab === "review"
                ? "border-[#714B67] text-[#714B67] dark:text-purple-300"
                : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
            }`}
          >
            <CheckCheck className="w-3.5 h-3.5" />
            Proof Sign-Off Workflow
          </button>
          <button
            type="button"
            onClick={() => setInspectorTab("assets")}
            className={`h-9 px-3 text-xs font-bold border-b-2 cursor-pointer transition-colors flex items-center gap-1.5 ${
              inspectorTab === "assets"
                ? "border-[#714B67] text-[#714B67] dark:text-purple-300"
                : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            Vector Assets & Specifications
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {inspectorTab === "proof" && (
            <div className="space-y-4">
              {/* Graphic Simulator Card */}
              <div className="rounded-lg border border-[#CED4DA] dark:border-white/10 bg-zinc-900 p-6 flex flex-col items-center justify-center text-center relative overflow-hidden shadow-inner">
                <div
                  className="w-52 h-68 rounded-md shadow-2xl border-4 border-white/20 p-4 flex flex-col justify-between transition-transform hover:scale-[1.02]"
                  style={{
                    background: `linear-gradient(135deg, ${accentColor} 0%, #18181b 100%)`,
                  }}
                >
                  <div className="flex justify-between items-start text-white/80">
                    <span className="font-mono text-[9px] font-bold bg-black/40 px-1.5 py-0.5 rounded backdrop-blur-xs">
                      {proofVersion}
                    </span>
                    <span className="text-[10px] tracking-wider uppercase font-mono font-semibold">{brand}</span>
                  </div>

                  <div className="my-auto text-left text-white px-1">
                    <p className="text-[11px] font-mono tracking-widest uppercase text-white/70">Packaging Artwork</p>
                    <h4 className="text-sm font-bold leading-tight mt-1 truncate">{title}</h4>
                    <p className="text-[10px] text-white/80 mt-1 font-mono">{dimensions}</p>
                  </div>

                  <div className="flex justify-between items-end text-white/90 font-mono text-[9px] border-t border-white/15 pt-2">
                    <span>{colorSpecs.split("+")[0]?.trim() || "CMYK"}</span>
                    <span>{bleedMm}mm Bleed</span>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-black/50 text-white/90 font-mono text-[11px] border border-white/10">
                    <Eye className="w-3.5 h-3.5 text-purple-400" />
                    Hi-Res CMYK Vector Render ({resolutionDpi} DPI)
                  </span>
                </div>
              </div>

              {/* Technical Specifications Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 bg-[#F8F9FA] dark:bg-zinc-800/60 rounded border border-[#CED4DA] dark:border-zinc-700">
                  <span className="text-[10px] text-zinc-400 font-bold uppercase">Prepress CMYK Check</span>
                  <div className="flex items-center gap-1.5 mt-1 font-bold text-xs">
                    {cmykPassed ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span className="text-emerald-700 dark:text-emerald-400">PASSED (Zero RGB)</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                        <span className="text-amber-700 dark:text-amber-400">NEEDS CONVERSION</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="p-3 bg-[#F8F9FA] dark:bg-zinc-800/60 rounded border border-[#CED4DA] dark:border-zinc-700">
                  <span className="text-[10px] text-zinc-400 font-bold uppercase">Raster Resolution</span>
                  <div className="font-mono font-bold text-xs text-zinc-900 dark:text-zinc-100 mt-1">
                    {resolutionDpi} DPI (Press Quality)
                  </div>
                </div>

                <div className="p-3 bg-[#F8F9FA] dark:bg-zinc-800/60 rounded border border-[#CED4DA] dark:border-zinc-700">
                  <span className="text-[10px] text-zinc-400 font-bold uppercase">Bleed Margin</span>
                  <div className="font-mono font-bold text-xs text-zinc-900 dark:text-zinc-100 mt-1">
                    {bleedMm}.0 mm All Sides
                  </div>
                </div>

                <div className="p-3 bg-[#F8F9FA] dark:bg-zinc-800/60 rounded border border-[#CED4DA] dark:border-zinc-700">
                  <span className="text-[10px] text-zinc-400 font-bold uppercase">Proof Status</span>
                  <div className="font-bold text-xs text-[#714B67] dark:text-purple-300 mt-1">
                    {proofStatus}
                  </div>
                </div>
              </div>

              {/* Finishing & Embellishment Notes */}
              <div className="p-3.5 bg-[#F8F9FA] dark:bg-zinc-800/40 rounded border border-[#CED4DA] dark:border-zinc-700 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                  Finishing &amp; Embellishment Specification
                </span>
                <p className="text-xs text-zinc-800 dark:text-zinc-200">{finishingNotes}</p>
              </div>

              {/* Reference Links & Images if available */}
              {(referenceImages.length > 0 || referenceLinks.length > 0) && (
                <div className="p-3.5 bg-[#F8F9FA] dark:bg-zinc-800/40 rounded border border-[#CED4DA] dark:border-zinc-700 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    Client Attachments &amp; Moodboard References
                  </span>
                  {referenceImages.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {referenceImages.map((img, i) => (
                        <a
                          key={i}
                          href={img}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-white dark:bg-zinc-800 border border-[#CED4DA] text-xs text-[#714B67] hover:underline"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Reference Asset #{i + 1}</span>
                        </a>
                      ))}
                    </div>
                  )}
                  {referenceLinks.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {referenceLinks.map((link, i) => (
                        <a
                          key={i}
                          href={link}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-white dark:bg-zinc-800 border border-[#CED4DA] text-xs text-teal-700 hover:underline"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span className="truncate max-w-xs">{link}</span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {inspectorTab === "review" && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg border border-[#CED4DA] dark:border-zinc-700 bg-white dark:bg-[#12141d] space-y-3">
                <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <CheckCheck className="w-4 h-4 text-[#714B67]" />
                  Client Sign-Off &amp; Studio Proof Approval
                </h4>
                <p className="text-xs text-zinc-500">
                  Update proofing status across the graphic workflow. Once certified, packaging dielines and print plates can be released to Studio &amp; Plant execution.
                </p>

                <div className="space-y-2 pt-2">
                  <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
                    Sign-Off Remarks / Revision Notes:
                  </label>
                  <textarea
                    rows={3}
                    value={clientNoteInput}
                    onChange={(e) => setClientNoteInput(e.target.value)}
                    placeholder="e.g. Brand director signed off color proof on 27-Sep; ready to release to Studio dieline..."
                    className="w-full p-2.5 text-xs rounded border border-[#CED4DA] dark:border-zinc-700 bg-white dark:bg-[#181a24] text-zinc-900 dark:text-zinc-100 outline-none focus:border-[#714B67]"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                  <button
                    type="button"
                    disabled={isUpdatingStatus}
                    onClick={() => handleApplyStatus("Prepress Approved")}
                    className="px-3.5 py-1.5 rounded bg-[#017E84] hover:bg-[#00666A] text-white text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Certify Prepress Approved</span>
                  </button>

                  <button
                    type="button"
                    disabled={isUpdatingStatus}
                    onClick={() => handleApplyStatus("Client Review")}
                    className="px-3 py-1.5 rounded bg-white hover:bg-[#F8F9FA] text-zinc-700 border border-[#CED4DA] text-xs font-semibold transition cursor-pointer"
                  >
                    Mark in Client Review
                  </button>

                  <button
                    type="button"
                    disabled={isUpdatingStatus}
                    onClick={() => handleApplyStatus("Revisions Requested")}
                    className="px-3 py-1.5 rounded bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 text-xs font-semibold transition cursor-pointer"
                  >
                    Request Design Revisions
                  </button>
                </div>
              </div>
            </div>
          )}

          {inspectorTab === "assets" && (
            <div className="space-y-3">
              <div className="p-4 bg-[#F8F9FA] dark:bg-zinc-800/40 rounded border border-[#CED4DA] dark:border-zinc-700 space-y-2">
                <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  Vector Production Deliverables
                </h4>
                <p className="text-xs text-zinc-500">
                  Production-ready Illustrator artwork layers with spot Pantone separations, dieline cut/crease guides, and trapping offsets.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => alert(`Downloading high-resolution print PDF for ${artCode}...`)}
                    className="p-3 bg-white dark:bg-zinc-800 rounded border border-[#CED4DA] dark:border-zinc-700 text-left hover:border-[#714B67] transition cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <span className="block font-bold text-xs text-zinc-900 dark:text-zinc-100">
                        Print Ready PDF/X-4
                      </span>
                      <span className="text-[10px] text-zinc-400 font-mono">CMYK + Spot Varnish · 48.2 MB</span>
                    </div>
                    <Download className="w-4 h-4 text-[#714B67]" />
                  </button>

                  <button
                    type="button"
                    onClick={() => alert(`Downloading Adobe Illustrator source package for ${artCode}...`)}
                    className="p-3 bg-white dark:bg-zinc-800 rounded border border-[#CED4DA] dark:border-zinc-700 text-left hover:border-[#714B67] transition cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <span className="block font-bold text-xs text-zinc-900 dark:text-zinc-100">
                        Packaged Illustrator (.AI)
                      </span>
                      <span className="text-[10px] text-zinc-400 font-mono">Linked Typefaces &amp; Assets · 112 MB</span>
                    </div>
                    <Download className="w-4 h-4 text-[#714B67]" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-[#CED4DA] dark:border-white/[0.08] bg-[#F8F9FA] dark:bg-[#12141d] flex items-center justify-between shrink-0">
          <span className="text-[11px] font-mono text-zinc-500">
            Reference: {artCode} · Snapshot Active
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-white hover:bg-zinc-100 text-zinc-700 border border-[#CED4DA] text-xs font-semibold cursor-pointer shadow-2xs"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
