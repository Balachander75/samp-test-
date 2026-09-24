import React, { useState, useMemo, useRef } from "react";
import { CustomerItem, CreateSampleRequestForm } from "../types";
import { CustomerSelectInput } from "./CustomerSelectInput";
import {
  ShieldCheck,
  Calendar,
  ImageIcon,
  Upload,
  Check,
  FileText,
  Layers,
  ExternalLink as LinkIcon,
  X,
  RefreshCw,
} from "@/components/ui/icons";

export interface FeasibilityCheckStepProps {
  customers: CustomerItem[];
  loadingCustomers: boolean;
  isSubmitting?: boolean;
  onProceedToRequest: (initialData: Partial<CreateSampleRequestForm>) => void;
  onBackToOptions: () => void;
}

const FEASIBILITY_TYPES = [
  { id: "new_category", label: "New Category", desc: "Introduce new product lines or unlisted classifications" },
  { id: "new_format", label: "New Format", desc: "Custom sizes, unique binding structures, or novel layouts" },
  { id: "new_finish", label: "New Finish", desc: "Special cover treatments, foil, embossing, or lamination effects" },
  { id: "new_accessories", label: "New Accessories", desc: "Custom ribbons, elastic bands, pockets, stickers, or clasps" },
  { id: "other", label: "Other", desc: "Specific bespoke requirement or custom manufacturing check" },
];

export const FeasibilityCheckStep: React.FC<FeasibilityCheckStepProps> = ({
  customers,
  loadingCustomers,
  isSubmitting = false,
  onProceedToRequest,
  onBackToOptions,
}) => {
  const [customer, setCustomer] = useState("");
  const [selectedType, setSelectedType] = useState<string>("new_category");
  const [customTypeOther, setCustomTypeOther] = useState("");
  const [description, setDescription] = useState("");
  const [releaseRemarks, setReleaseRemarks] = useState("");
  const [requiredDate, setRequiredDate] = useState("");
  const [imageMode, setImageMode] = useState<"file" | "url">("file");
  const [imageUrl, setImageUrl] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFileName, setImageFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFileName(file.name);
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setImageFileName(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const effectiveTypeLabel = useMemo(() => {
    if (selectedType === "other") {
      return customTypeOther.trim() || "Custom Type";
    }
    const found = FEASIBILITY_TYPES.find((t) => t.id === selectedType);
    return found ? found.label : "Feasibility Check";
  }, [selectedType, customTypeOther]);

  const isFormValid = Boolean(
    customer.trim() &&
    (selectedType !== "other" || customTypeOther.trim()) &&
    description.trim()
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    const sections: string[] = [
      `[${effectiveTypeLabel}] ${description.trim()}`,
    ];

    if (releaseRemarks.trim()) {
      sections.push(`Release / Dispatch Remarks:\n${releaseRemarks.trim()}`);
    }

    if (imageMode === "url" && imageUrl.trim()) {
      sections.push(`Reference Image URL: ${imageUrl.trim()}`);
    }

    onProceedToRequest({
      customer: customer.trim(),
      programName: `${customer.trim()} - ${effectiveTypeLabel}`,
      productDescription: sections.join("\n\n"),
      productImagePath: imageMode === "url" && imageUrl.trim() ? imageUrl.trim() : (imagePreview || undefined),
      sampleRequiredDate: requiredDate || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-6 animate-in fade-in duration-150">
      <div className="w-full rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        {/* Top Glowing Emerald Gradient Accent Bar */}
        <div className="h-1 w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 shrink-0" />

        {/* Header Bar */}
        <div className="border-b border-slate-100 dark:border-slate-800 px-5 py-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-emerald-600 to-teal-600 text-white flex items-center justify-center font-bold shadow-sm shadow-emerald-500/25">
              <ShieldCheck size={18} className="stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 uppercase tracking-tight">
                FEASIBILITY CHECK AUDIT
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Audited concurrently by Plant Engineering &amp; SAMP Teams. Response from either team (Yes/No/Maybe) concludes the review.
              </p>
            </div>
          </div>
        </div>

        {/* Form Body - Organized 2-Column Responsive Layout */}
        <div className="p-5 sm:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Essential Audit Parameters (7 cols) */}
            <div className="lg:col-span-7 space-y-5">
              {/* 1. Customer Name (Modular Reusable Component) */}
              <CustomerSelectInput
                value={customer}
                onChange={setCustomer}
                customers={customers}
                loading={loadingCustomers}
                themeColor="emerald"
                label="Customer Name"
              />

              {/* 2. Feasibility Type Selection */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers size={13} className="text-slate-400" />
                  <span>Feasibility Type</span>
                  <span className="text-rose-500">*</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {FEASIBILITY_TYPES.map((type) => {
                    const isSelected = selectedType === type.id;
                    return (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setSelectedType(type.id)}
                        className={`p-3 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between gap-1 select-none ${
                          isSelected
                            ? "border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200 shadow-xs"
                            : "border-slate-200/90 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-white dark:hover:bg-slate-800"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold uppercase tracking-tight">{type.label}</span>
                          {isSelected && (
                            <span className="h-4 w-4 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                              <Check size={10} strokeWidth={3} />
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                          {type.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Custom Input when 'Other' is chosen */}
                {selectedType === "other" && (
                  <div className="pt-1.5 animate-in fade-in duration-100">
                    <input
                      type="text"
                      required
                      placeholder="Specify custom feasibility requirement (e.g., Embossed Metallic Foil Spine)..."
                      value={customTypeOther}
                      onChange={(e) => setCustomTypeOther(e.target.value)}
                      className="w-full h-10 px-3.5 rounded-lg border border-emerald-500/80 dark:border-emerald-500/80 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all shadow-xs"
                    />
                  </div>
                )}
              </div>

              {/* 3. Description & Technical Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText size={13} className="text-slate-400" />
                  <span>Description & Technical Notes</span>
                  <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Provide complete technical context, material GSM, binding dimensions, and manufacturing criteria..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-3 rounded-lg border border-slate-200/90 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 text-xs font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none transition-all resize-none"
                />
              </div>

              {/* 4. Release & Dispatch Remarks */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText size={13} className="text-slate-400" />
                    <span>Release / Dispatch Remarks</span>
                  </label>
                  <span className="text-[10px] text-slate-400">Optional plant / release instructions</span>
                </div>
                <textarea
                  rows={2}
                  placeholder="Enter remarks, dispatch constraints, packaging requirements, or special instructions for plant release..."
                  value={releaseRemarks}
                  onChange={(e) => setReleaseRemarks(e.target.value)}
                  className="w-full p-3 rounded-lg border border-slate-200/90 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 text-xs font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none transition-all resize-none"
                />
              </div>
            </div>

            {/* Right Column: Visual Reference & Deadline (5 cols) */}
            <div className="lg:col-span-5 space-y-5">
              {/* 4. Image Reference Attachment */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <ImageIcon size={13} className="text-slate-400" />
                    <span>Image Reference (Optional)</span>
                  </label>

                  {/* Mode switcher: Upload vs Link */}
                  <div className="inline-flex rounded-lg bg-slate-100 dark:bg-slate-800 p-0.5 text-[11px] font-semibold">
                    <button
                      type="button"
                      onClick={() => setImageMode("file")}
                      className={`flex items-center gap-1 px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                        imageMode === "file"
                          ? "bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs font-bold"
                          : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
                      }`}
                    >
                      <Upload size={11} />
                      <span>Upload File</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageMode("url")}
                      className={`flex items-center gap-1 px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                        imageMode === "url"
                          ? "bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs font-bold"
                          : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
                      }`}
                    >
                      <LinkIcon size={11} />
                      <span>Web Link</span>
                    </button>
                  </div>
                </div>

                {imageMode === "file" ? (
                  <>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />

                    {imagePreview ? (
                      <div className="relative rounded-lg border border-slate-200 dark:border-slate-700 p-3 bg-slate-50/50 dark:bg-slate-800/40 space-y-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={imagePreview}
                            alt="Reference preview"
                            className="h-16 w-16 rounded-md object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{imageFileName}</p>
                            <p className="text-[11px] text-slate-400">Attached visual reference for plant audit</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="w-full py-1.5 rounded-md text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/60 transition-colors cursor-pointer text-center"
                        >
                          Remove Attached Image
                        </button>
                      </div>
                    ) : (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 p-5 text-center cursor-pointer transition-colors bg-slate-50/40 dark:bg-slate-800/30 hover:bg-emerald-50/20 dark:hover:bg-emerald-950/10"
                      >
                        <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-1.5">
                          <Upload size={16} />
                        </div>
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          Upload reference photo or sketch
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          PNG, JPG, WEBP up to 10MB
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="space-y-3">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <LinkIcon size={14} />
                      </div>
                      <input
                        type="url"
                        placeholder="Paste image URL link (e.g. https://example.com/sketch.png)..."
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        className="w-full h-10 pl-9 pr-9 rounded-lg border border-slate-200/90 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 text-xs font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none transition-all"
                      />
                      {imageUrl && (
                        <button
                          type="button"
                          onClick={() => setImageUrl("")}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-rose-500 cursor-pointer"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>

                    {imageUrl.trim() ? (
                      <div className="relative rounded-lg border border-slate-200 dark:border-slate-700 p-2.5 bg-slate-50/50 dark:bg-slate-800/40 flex items-center gap-3">
                        <img
                          src={imageUrl}
                          alt="URL preview"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = "https://placehold.co/100x100?text=Invalid+URL";
                          }}
                          className="h-14 w-14 rounded-md object-cover border border-slate-200 dark:border-slate-700 shrink-0 bg-white"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">Web Image Linked</p>
                          <p className="text-[11px] text-slate-400 truncate">{imageUrl}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-400">
                        Enter a direct link to any CAD blueprint, design mock, or reference image.
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* 5. Required Date */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar size={13} className="text-slate-400" />
                  <span>Required Target Date</span>
                </label>
                <input
                  type="date"
                  value={requiredDate}
                  onChange={(e) => setRequiredDate(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-slate-200/90 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none transition-all cursor-pointer"
                />
                <p className="text-[11px] text-slate-400">Target feedback deadline for plant engineering team</p>
              </div>

              {/* Summary Audit Card */}
              <div className="p-3.5 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 space-y-2 text-xs">
                <div className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px] flex items-center justify-between">
                  <span>Audit Routing</span>
                  <span className="text-[10px] font-normal text-emerald-600 dark:text-emerald-400">Concurrent Review</span>
                </div>
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                  <span>Customer:</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{customer || "—"}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                  <span>Track Type:</span>
                  <span className="font-semibold text-emerald-600">{effectiveTypeLabel}</span>
                </div>
                <div className="pt-1.5 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Reviewers:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Plant Team + SAMP Team</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-tight">
                  Once either team submits a decision (Yes / No / Maybe), the request is automatically evaluated and finalized.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Footer */}
        <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-850 px-5 py-3.5 sm:px-6 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBackToOptions}
            className="h-9 px-4 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Change Workflow
          </button>

          <button
            type="submit"
            disabled={!isFormValid || isSubmitting}
            className={`h-9 px-6 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors select-none ${
              isFormValid && !isSubmitting
                ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer"
                : "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed shadow-none"
            }`}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <RefreshCw size={13} className="animate-spin" />
                Submitting...
              </span>
            ) : (
              "SUBMIT FEASIBILITY CHECK"
            )}
          </button>
        </div>
      </div>
    </form>
  );
};
