import React, { useEffect, useMemo, useState } from "react";
import { ArrowRight, LoaderCircle } from "lucide-react";
import type { ProductSearchResult, SampleRequestItem } from "../../types";
import {
  sendMockupRequestToStudioApi,
  submitStudioMockupToMarketingApi,
} from "@/infrastructure/api/sampleRequestsApi";
import { CatalogProductInspectModal } from "./CatalogProductInspectModal";

export interface MockupWorkflowInspectorModalProps {
  request: SampleRequestItem | null;
  role: "creative" | "studio";
  actorName?: string;
  onClose: () => void;
  onRefresh?: () => Promise<void>;
}

export const MockupWorkflowInspectorModal: React.FC<MockupWorkflowInspectorModalProps> = ({
  request,
  role,
  actorName,
  onClose,
  onRefresh,
}) => {
  const [mockupUrl, setMockupUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setMockupUrl("");
    setError("");
    setIsSubmitting(false);
  }, [request?.id]);

  const product = useMemo<ProductSearchResult | null>(() => {
    if (!request) return null;
    const id = Number(request.id);
    if (!Number.isInteger(id) || id <= 0) return null;
    return {
      id,
      sr_number: request.srNumber,
      material_code: request.materialCode,
      product_description: request.productDescription,
      customer: request.customer,
      target_plant: request.targetPlant,
      product_category: request.productCategory,
      product_sub_category: request.productSubCategory,
      product_third_category: request.productThirdCategory,
    };
  }, [request]);

  if (!request) return null;

  const handleAction = async () => {
    if (!product) {
      setError("This request is missing its saved product record.");
      return;
    }
    if (role === "studio") {
      try {
        const parsed = new URL(mockupUrl.trim());
        if (!["http:", "https:"].includes(parsed.protocol)) throw new Error("Invalid protocol");
      } catch {
        setError("Enter a valid http or https mockup link.");
        return;
      }
    }

    setIsSubmitting(true);
    setError("");
    try {
      if (role === "creative") {
        await sendMockupRequestToStudioApi(request.id, actorName);
      } else {
        await submitStudioMockupToMarketingApi(request.id, mockupUrl.trim(), actorName);
      }
      await onRefresh?.();
      onClose();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Could not update the mockup request. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const footer = (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {role === "creative" ? (
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900 dark:text-zinc-100">Creative review complete?</p>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">Send this product brief and its saved specifications to Studio.</p>
        </div>
      ) : (
        <label className="min-w-0 flex-1">
          <span className="mb-1 block text-xs font-semibold text-slate-700 dark:text-zinc-300">Mockup file link</span>
          <input
            type="url"
            value={mockupUrl}
            onChange={(event) => setMockupUrl(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void handleAction();
              }
            }}
            placeholder="https://..."
            aria-label="Mockup file link"
            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-[#006d32] focus:ring-2 focus:ring-[#006d32]/15 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
        </label>
      )}
      <div className="flex shrink-0 items-center justify-end gap-3">
        {error && <p role="alert" className="max-w-sm text-xs text-rose-600 dark:text-rose-300">{error}</p>}
        <button
          type="button"
          onClick={() => void handleAction()}
          disabled={isSubmitting || (role === "studio" && !mockupUrl.trim())}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#006d32] px-4 text-sm font-semibold text-white transition hover:bg-[#005a29] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006d32] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
          {isSubmitting ? "Sending…" : role === "creative" ? "Send to Studio" : "Send mockup to Marketing"}
        </button>
      </div>
    </div>
  );

  if (!product) {
    return (
      <div className="fixed inset-0 z-[180] flex items-center justify-center bg-slate-950/65 p-4">
        <section role="dialog" aria-modal="true" className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-[#11141b]">
          <h2 className="text-base font-semibold text-slate-900 dark:text-zinc-100">Mockup request cannot be opened</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-zinc-400">This request does not have a valid saved product record.</p>
          <button type="button" onClick={onClose} className="mt-5 rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 dark:bg-zinc-800 dark:text-zinc-200">Close</button>
        </section>
      </div>
    );
  }

  return (
    <CatalogProductInspectModal
      product={product}
      onClose={onClose}
      heading="Mockup brief specifications"
      intro="Review the saved product category, classes and characteristics before passing this mockup to the next team."
      footer={footer}
    />
  );
};

export default MockupWorkflowInspectorModal;
