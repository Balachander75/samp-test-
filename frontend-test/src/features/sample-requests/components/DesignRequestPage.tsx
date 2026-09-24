import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Palette,
  Save,
  X,
} from "@/components/ui/icons";
import { createDesignRequestApi } from "../api";
import { CreateSampleRequestForm, DesignRequestForm } from "../types";

export interface DesignRequestPageProps {
  currentUser?: { name?: string; userid?: string } | null;
  onBack?: () => void;
}

const getTodayString = () => new Date().toISOString().split("T")[0];

function readProgramContext(): CreateSampleRequestForm {
  try {
    const saved = sessionStorage.getItem("samp_active_program_form");
    if (saved) return JSON.parse(saved) as CreateSampleRequestForm;
  } catch (error) {
    console.error("Failed to read active program context:", error);
  }
  return { customer: "", programName: "", programYear: "", targetPlant: "" };
}

const inputStyles =
  "h-11 w-full rounded-xl border border-slate-200/90 bg-slate-50/70 px-3.5 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-rose-500 focus:bg-white focus:ring-2 focus:ring-rose-500/20 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-rose-500 dark:focus:bg-slate-900";
const textareaStyles =
  "w-full rounded-xl border border-slate-200/90 bg-slate-50/70 px-3.5 py-3 text-sm font-medium leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-rose-500 focus:bg-white focus:ring-2 focus:ring-rose-500/20 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-rose-500 dark:focus:bg-slate-900 resize-y";
const fieldLabelStyles =
  "flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300";

export const DesignRequestPage: React.FC<DesignRequestPageProps> = ({
  currentUser,
  onBack,
}) => {
  const navigate = useNavigate();
  const context = useMemo(() => readProgramContext(), []);
  const createInitialForm = (): DesignRequestForm => ({
    customerName: context.customer || "",
    programName: context.programName || "",
    programYear: context.programYear || context.year || "",
    numberOfDesigns: "1",
    trend: "",
    targetAudience: "",
    referenceImage: "",
    productDescription: "",
    designRequiredDate: "",
  });

  const [form, setForm] = useState<DesignRequestForm>(createInitialForm);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const updateField = <K extends keyof DesignRequestForm>(
    field: K,
    value: DesignRequestForm[K]
  ) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleReset = () => {
    setForm(createInitialForm());
    setError("");
  };

  const handleBack = () => {
    if (onBack) onBack();
    else navigate("/sample-requests/add-product");
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    if (
      !form.customerName.trim() ||
      !form.programName.trim() ||
      !form.programYear.trim()
    ) {
      setError("Customer account, program name, and program year are required.");
      return;
    }
    if (
      !Number.isInteger(Number(form.numberOfDesigns)) ||
      Number(form.numberOfDesigns) < 1
    ) {
      setError("Please enter at least 1 design requirement.");
      return;
    }
    if (!form.productDescription.trim() || !form.designRequiredDate) {
      setError("Product description and design required date are required.");
      return;
    }

    setIsSaving(true);
    try {
      await createDesignRequestApi(form);
      sessionStorage.removeItem("samp_active_program_form");
      navigate("/sample-requests");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Could not save the design request."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const hasPreview = /^https?:\/\//i.test(form.referenceImage.trim());

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4 py-4 animate-in fade-in duration-150">
      {/* Back button & Page Title */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={handleBack}
          className="group inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors cursor-pointer"
        >
          <ArrowLeft
            size={14}
            className="transition-transform group-hover:-translate-x-0.5 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200"
          />
          <span>Back</span>
        </button>

        <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200/80 bg-rose-50 px-2.5 py-0.5 text-[11px] font-bold text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/60 dark:text-rose-300">
          <Palette size={12} />
          <span>Creative Design</span>
        </span>
      </div>

      {/* Main Form Card */}
      <form
        onSubmit={handleSubmit}
        className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="h-1 w-full bg-gradient-to-r from-rose-500 to-red-600" />

        {/* Card Header with Program Context */}
        <div className="border-b border-slate-100 px-6 py-4 dark:border-slate-800/80">
          <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Create Design Request
          </h1>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            {form.customerName ? (
              <span>
                <strong className="font-semibold text-slate-700 dark:text-slate-300">{form.customerName}</strong>
                {" • "}
                <span>{form.programName || "Program"}</span>
                {form.programYear ? ` (${form.programYear})` : ""}
              </span>
            ) : (
              "Specify the artwork and design details for this program."
            )}
          </p>
        </div>

        <div className="p-6 space-y-4">
          {/* Row 1: Quantity & Date */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="num-designs" className={fieldLabelStyles}>
                <span>Number of designs</span>
                <span className="text-rose-500">*</span>
              </label>
              <input
                id="num-designs"
                className={inputStyles}
                type="number"
                min="1"
                step="1"
                required
                placeholder="1"
                value={form.numberOfDesigns}
                onChange={(e) => updateField("numberOfDesigns", e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="design-date" className={fieldLabelStyles}>
                <span>Required date</span>
                <span className="text-rose-500">*</span>
              </label>
              <input
                id="design-date"
                className={inputStyles}
                type="date"
                min={getTodayString()}
                required
                value={form.designRequiredDate}
                onChange={(e) =>
                  updateField("designRequiredDate", e.target.value)
                }
              />
            </div>
          </div>

          {/* Row 2: Description */}
          <div className="space-y-1.5">
            <label htmlFor="product-desc" className={fieldLabelStyles}>
              <span>Design description</span>
              <span className="text-rose-500">*</span>
            </label>
            <textarea
              id="product-desc"
              rows={3}
              className={textareaStyles}
              required
              value={form.productDescription}
              onChange={(e) =>
                updateField("productDescription", e.target.value)
              }
              placeholder="Describe the artwork theme, cover concept, or design instructions..."
            />
          </div>

          {/* Row 3: Trend & Audience (Optional) */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="trend-dir" className={fieldLabelStyles}>
                <span>Trend / Style</span>
                <span className="text-[11px] font-normal text-slate-400">(optional)</span>
              </label>
              <input
                id="trend-dir"
                className={inputStyles}
                type="text"
                value={form.trend}
                onChange={(e) => updateField("trend", e.target.value)}
                placeholder="e.g. Minimalist, Floral, Pastel"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="target-audience" className={fieldLabelStyles}>
                <span>Target audience</span>
                <span className="text-[11px] font-normal text-slate-400">(optional)</span>
              </label>
              <input
                id="target-audience"
                className={inputStyles}
                type="text"
                value={form.targetAudience}
                onChange={(e) =>
                  updateField("targetAudience", e.target.value)
                }
                placeholder="e.g. Students, Kids, Executive"
              />
            </div>
          </div>

          {/* Row 4: Reference Image (Optional) */}
          <div className="space-y-1.5">
            <label htmlFor="reference-img" className={fieldLabelStyles}>
              <span>Reference image link</span>
              <span className="text-[11px] font-normal text-slate-400">(optional)</span>
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  id="reference-img"
                  className={`${inputStyles} ${form.referenceImage ? "pr-8" : ""}`}
                  type="url"
                  value={form.referenceImage}
                  onChange={(e) =>
                    updateField("referenceImage", e.target.value)
                  }
                  placeholder="Paste an image URL..."
                />
                {form.referenceImage && (
                  <button
                    type="button"
                    onClick={() => updateField("referenceImage", "")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    title="Clear"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {hasPreview && (
                <img
                  src={form.referenceImage}
                  alt="Preview"
                  className="h-11 w-11 shrink-0 rounded-xl border border-slate-200 dark:border-slate-700 object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              )}
            </div>
          </div>

          {/* Error Notice */}
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-semibold text-rose-700 dark:border-rose-900/70 dark:bg-rose-950/40 dark:text-rose-300">
              {error}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 bg-slate-50/60 px-6 py-3.5 dark:border-slate-800 dark:bg-slate-900/50">
          <button
            type="button"
            onClick={handleBack}
            className="h-9 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 px-5 text-xs font-bold text-white shadow-sm shadow-rose-500/25 transition-all cursor-pointer select-none active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save size={14} />
                <span>Submit Request</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
