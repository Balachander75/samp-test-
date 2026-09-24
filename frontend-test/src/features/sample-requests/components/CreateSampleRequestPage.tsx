import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { CreateSampleRequestForm, CustomerItem } from "../types";
import { fetchCustomersApi } from "../api";
import { ProgramSetupStep } from "./ProgramSetupStep";
import { FeasibilityCheckStep } from "./FeasibilityCheckStep";
import { ProgramPlanningStep } from "./ProgramPlanningStep";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Plus,
} from "@/components/ui/icons";

export interface CreateSampleRequestPageProps {
  onBack?: () => void;
  currentUser?: { name?: string; userid?: string } | null;
}

export type MarketingWorkflowType = "marketing_request" | "feasibility_check" | "program_planning";

export const CreateSampleRequestPage: React.FC<CreateSampleRequestPageProps> = ({
  onBack,
  currentUser,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isFromStaging = Boolean(
    (location.state as { fromStaging?: boolean } | null)?.fromStaging
  );

  const getTodayString = () => new Date().toISOString().split("T")[0];
  const now = new Date();
  const currentYearNum = now.getFullYear();

  const programYearOptions = [
    String(currentYearNum),
    String(currentYearNum + 1),
    String(currentYearNum + 2),
  ];

  const [customerOptions, setCustomerOptions] = useState<CustomerItem[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);

  // If returning from staging, default directly to "marketing_request", otherwise show the 3 full-width track cards
  const [selectedWorkflow, setSelectedWorkflow] = useState<MarketingWorkflowType | null>(() => {
    return isFromStaging ? "marketing_request" : null;
  });

  const emptyForm: CreateSampleRequestForm = {
    year: `${currentYearNum}-${currentYearNum + 1}`,
    programYear: String(currentYearNum),
    customer: "",
    programName: "",
    productDescription: "",
    targetPlant: "1505- Khaniwade",
    materialCode: "",
    barcode: "",
    customerProductCode: "",
    sampleRequiredDate: "",
    dateRequestCreated: getTodayString(),
    createdBy: currentUser?.name || "Admin",
    status: "Draft (Pre-SMT)",
    creationMode: "marketing_request",
  };

  const [form, setForm] = useState<CreateSampleRequestForm>(() => {
    if (isFromStaging) {
      try {
        const saved = sessionStorage.getItem("samp_active_program_form");
        if (saved) {
          return JSON.parse(saved);
        }
      } catch (e) {
        console.error("Failed to parse cached program form:", e);
      }
    } else {
      sessionStorage.removeItem("samp_active_program_form");
    }
    return emptyForm;
  });

  useEffect(() => {
    fetchCustomersApi()
      .then((customers) => {
        if (customers && customers.length > 0) setCustomerOptions(customers);
      })
      .finally(() => setLoadingCustomers(false));
  }, []);

  const handleFormChange = (
    field: keyof CreateSampleRequestForm,
    value: string
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleProceedToAddProduct = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!form.customer?.trim() || !form.programName?.trim()) return;
    sessionStorage.setItem("samp_active_program_form", JSON.stringify(form));
    navigate("/sample-requests/add-product");
  };

  const handleProceedFromFeasibility = (initialData: Partial<CreateSampleRequestForm>) => {
    const updatedForm: CreateSampleRequestForm = {
      ...form,
      ...initialData,
      creationMode: "feasibility_check",
      customer: initialData.customer || form.customer || "General Customer",
      programName: initialData.programName || form.programName || "Feasibility Verified Program",
    };
    setForm(updatedForm);
    sessionStorage.setItem("samp_active_program_form", JSON.stringify(updatedForm));
    navigate("/sample-requests/add-product");
  };

  const handleProceedFromPlanning = (initialData: Partial<CreateSampleRequestForm>) => {
    const updatedForm: CreateSampleRequestForm = {
      ...form,
      ...initialData,
      creationMode: "program_planning",
      customer: initialData.customer || form.customer,
      programName: initialData.programName || form.programName,
    };
    setForm(updatedForm);
    sessionStorage.setItem("samp_active_program_form", JSON.stringify(updatedForm));
    navigate("/sample-requests/add-product");
  };

  const handleBack = () => {
    if (selectedWorkflow && !isFromStaging) {
      setSelectedWorkflow(null);
      return;
    }
    sessionStorage.removeItem("samp_active_program_form");
    if (onBack) onBack();
    else navigate("/sample-requests");
  };

  return (
    <div className="w-full space-y-6 py-2 animate-in fade-in duration-150">
      {/* Screen 1: Full-Width 3-Track Gateway Selection Grid */}
      {!selectedWorkflow && (
        <div className="w-full space-y-6">
          <PageHeader
            title="CREATE NEW REQUEST"
            subtitle="Choose one of the 3 tracks below to start sample creation, feasibility check, or seasonal line planning."
          />

          {/* 3 Full-Width Native App Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6 w-full items-stretch pt-2">
            {/* Card 1: NEW MARKETING REQUEST (Theme: Blue) */}
            <div
              onClick={() => {
                setForm((prev) => ({ ...prev, creationMode: "marketing_request" }));
                setSelectedWorkflow("marketing_request");
              }}
              className="group flex flex-col justify-between rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-blue-500/70 dark:hover:border-blue-500/70 p-6 shadow-sm hover:shadow-md transition-all duration-150 cursor-pointer select-none"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="h-10 w-10 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/70 dark:border-blue-900/70 flex items-center justify-center font-bold">
                    <Plus size={20} className="stroke-[2.5]" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors uppercase tracking-tight">
                    NEW MARKETING REQUEST
                  </h3>
                  <p className="text-xs sm:text-[13px] text-slate-500 dark:text-slate-400 leading-relaxed font-normal">
                    Create physical product samples for a customer account. Set program name, season cycle, and stage specifications.
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setForm((prev) => ({ ...prev, creationMode: "marketing_request" }));
                    setSelectedWorkflow("marketing_request");
                  }}
                  className="w-full h-9 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                >
                  START MARKETING REQUEST
                </button>
              </div>
            </div>

            {/* Card 2: FEASIBILITY CHECK (Theme: Emerald) */}
            <div
              onClick={() => {
                navigate("/sample-requests/feasibility-check");
              }}
              className="group flex flex-col justify-between rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-emerald-500/70 dark:hover:border-emerald-500/70 p-6 shadow-sm hover:shadow-md transition-all duration-150 cursor-pointer select-none"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="h-10 w-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/70 dark:border-emerald-900/70 flex items-center justify-center font-bold">
                    <ShieldCheck size={20} className="stroke-[2.2]" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors uppercase tracking-tight">
                    FEASIBILITY CHECK
                  </h3>
                  <p className="text-xs sm:text-[13px] text-slate-500 dark:text-slate-400 leading-relaxed font-normal">
                    Check if manufacturing plants (1505, 1506, 1507) can produce your target GSM, binding construction, and page count.
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate("/sample-requests/feasibility-check");
                  }}
                  className="w-full h-9 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                >
                  RUN FEASIBILITY CHECK
                </button>
              </div>
            </div>

            {/* Card 3: PROGRAM PLANNING (Theme: Purple / Violet) */}
            <div
              onClick={() => {
                navigate("/sample-requests/program-planning");
              }}
              className="group flex flex-col justify-between rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-purple-500/70 dark:hover:border-purple-500/70 p-6 shadow-sm hover:shadow-md transition-all duration-150 cursor-pointer select-none"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="h-10 w-10 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-200/70 dark:border-purple-900/70 flex items-center justify-center font-bold">
                    <Calendar size={20} className="stroke-[2.2]" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors uppercase tracking-tight">
                    PROGRAM PLANNING
                  </h3>
                  <p className="text-xs sm:text-[13px] text-slate-500 dark:text-slate-400 leading-relaxed font-normal">
                    Plan an entire seasonal line of products. Allocate SKU quantities, set target delivery dates, and choose product types.
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate("/sample-requests/program-planning");
                  }}
                  className="w-full h-9 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                >
                  START PROGRAM PLANNING
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Screen 2A: New Marketing Request (Step 1 Program Setup) */}
      {selectedWorkflow === "marketing_request" && (
        <div className="w-full space-y-4">
          <div className="w-full space-y-1">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Program Setup
            </h1>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-normal">
              Configure the customer account and seasonal cycle first, then stage the product specifications that belong in this request.
            </p>
          </div>

          <ProgramSetupStep
            form={form}
            customers={customerOptions}
            loadingCustomers={loadingCustomers}
            years={programYearOptions}
            selectedYear={(
              form.programYear || String(currentYearNum)
            ).replace(/BTS/gi, "").trim()}
            onChange={handleFormChange}
            onContinue={handleProceedToAddProduct}
          />
        </div>
      )}

      {/* Screen 2B: Feasibility Check Track */}
      {selectedWorkflow === "feasibility_check" && (
        <div className="w-full space-y-4">
          <div className="w-full space-y-1">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Manufacturing Feasibility Check
            </h1>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-normal">
              Audit binding tolerances and machine limitations before committing to physical sample production.
            </p>
          </div>

          <FeasibilityCheckStep
            customers={customerOptions}
            loadingCustomers={loadingCustomers}
            onProceedToRequest={handleProceedFromFeasibility}
            onBackToOptions={() => setSelectedWorkflow(null)}
          />
        </div>
      )}

      {/* Screen 2C: Program Planning Track */}
      {selectedWorkflow === "program_planning" && (
        <div className="w-full space-y-4">
          <div className="w-full space-y-1">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Seasonal Program Planning
            </h1>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-normal">
              Structure seasonal collection goals, target milestones, and planned SKU categories.
            </p>
          </div>

          <ProgramPlanningStep
            customers={customerOptions}
            loadingCustomers={loadingCustomers}
            years={programYearOptions}
            selectedYear={form.programYear || String(currentYearNum)}
            onProceedToStaging={handleProceedFromPlanning}
            onBackToOptions={() => setSelectedWorkflow(null)}
          />
        </div>
      )}
    </div>
  );
};
