import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CreateSampleRequestForm } from "../types";
import { useCustomerOptions } from "../hooks/useCustomerOptions";
import { FeasibilityCheckStep } from "./FeasibilityCheckStep";
import { PageHeader } from "@/components/ui/PageHeader";
import { createSampleRequestApi } from "../api";
import { Check, ArrowRight, ShieldCheck } from "@/components/ui/icons";

export interface FeasibilityCheckPageProps {
  onBack?: () => void;
  currentUser?: { name?: string; userid?: string } | null;
}

export const FeasibilityCheckPage: React.FC<FeasibilityCheckPageProps> = ({
  onBack,
  currentUser,
}) => {
  const navigate = useNavigate();
  const { customers, loading: loadingCustomers } = useCustomerOptions();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [createdSR, setCreatedSR] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleProceedToRequest = async (initialData: Partial<CreateSampleRequestForm>) => {
    const now = new Date();
    const currentYearNum = now.getFullYear();
    const payload: CreateSampleRequestForm = {
      year: `${currentYearNum}-${currentYearNum + 1}`,
      programYear: String(currentYearNum),
      customer: initialData.customer || "General Customer",
      programName: initialData.programName || "Feasibility Verified Program",
      productDescription: initialData.productDescription || "",
      targetPlant: "1505- Khaniwade",
      materialCode: "",
      barcode: "",
      customerProductCode: "",
      sampleRequiredDate: initialData.sampleRequiredDate || "",
      dateRequestCreated: now.toISOString().split("T")[0],
      createdBy: currentUser?.name || "Admin",
      status: "SAMP",
      creationMode: "feasibility_check",
      productImagePath: initialData.productImagePath,
    };

    setIsSubmitting(true);
    setError(null);
    try {
      const result = await createSampleRequestApi(payload);
      if (result) {
        setCreatedSR(result.srNumber || result.id);
        setSubmitted(true);
      } else {
        setError("Failed to submit feasibility request. Please try again.");
      }
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate("/sample-requests/new");
    }
  };

  if (submitted) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-16 gap-6 animate-in fade-in duration-200">
        <div className="w-full max-w-md rounded-2xl border border-emerald-200 dark:border-emerald-900/60 bg-white dark:bg-slate-900 shadow-lg overflow-hidden">
          <div className="h-1 w-full bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-500" />
          <div className="p-8 flex flex-col items-center gap-5 text-center">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/25">
              <Check size={32} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                Feasibility Request Submitted!
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                Your request has been sent to both the <strong>Plant Engineering</strong> and <strong>SAMP Team</strong> for concurrent review.
              </p>
            </div>

            {createdSR && (
              <div className="w-full px-4 py-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50">
                <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-0.5">Request ID</p>
                <p className="text-base font-black text-emerald-800 dark:text-emerald-200 font-mono">{createdSR}</p>
              </div>
            )}

            <div className="w-full space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <ShieldCheck size={14} className="text-violet-600 dark:text-violet-400 shrink-0" />
                <span>SAMP Team notified — respond at <strong>SAMP Team Work → Feasibility Inbox</strong></span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <Check size={14} className="text-emerald-600 shrink-0" />
                <span>Once either team responds, the request will be automatically closed.</span>
              </div>
            </div>

            <div className="w-full flex flex-col gap-2 pt-1">
              <button
                onClick={() => navigate("/sampling/feasibility")}
                className="w-full h-10 rounded-xl bg-gradient-to-r from-violet-600 to-purple-700 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer hover:from-violet-700 hover:to-purple-800 transition-colors"
              >
                <ShieldCheck size={14} />
                Open SAMP Feasibility Inbox
                <ArrowRight size={14} />
              </button>
              <button
                onClick={() => navigate("/sample-requests")}
                className="w-full h-9 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Back to All Requests
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4 py-2 animate-in fade-in duration-150">
      <PageHeader
        title="MANUFACTURING FEASIBILITY CHECK"
        subtitle="Audit technical parameters, machine capabilities, and custom binding structures before physical production."
      />

      {error && (
        <div className="w-full px-4 py-3 rounded-xl border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/30 text-xs font-semibold text-rose-700 dark:text-rose-300">
          {error}
        </div>
      )}

      <FeasibilityCheckStep
        customers={customers}
        loadingCustomers={loadingCustomers}
        isSubmitting={isSubmitting}
        onProceedToRequest={handleProceedToRequest}
        onBackToOptions={handleBack}
      />
    </div>
  );
};

export default FeasibilityCheckPage;

