import React from "react";
import { useNavigate } from "react-router-dom";
import { CreateSampleRequestForm } from "../types";
import { useCustomerOptions } from "../hooks/useCustomerOptions";
import { ProgramPlanningStep } from "./ProgramPlanningStep";
import { PageHeader } from "@/components/ui/PageHeader";

export interface ProgramPlanningPageProps {
  onBack?: () => void;
  currentUser?: { name?: string; userid?: string } | null;
}

export const ProgramPlanningPage: React.FC<ProgramPlanningPageProps> = ({
  onBack,
  currentUser,
}) => {
  const navigate = useNavigate();
  const now = new Date();
  const currentYearNum = now.getFullYear();
  const programYearOptions = [
    String(currentYearNum),
    String(currentYearNum + 1),
    String(currentYearNum + 2),
  ];

  const { customers, loading: loadingCustomers } = useCustomerOptions();

  const handleProceedToStaging = (initialData: Partial<CreateSampleRequestForm>) => {
    const payload: CreateSampleRequestForm = {
      year: `${currentYearNum}-${currentYearNum + 1}`,
      programYear: initialData.programYear || String(currentYearNum),
      customer: initialData.customer || "General Customer",
      programName: initialData.programName || "Seasonal Program Plan",
      productDescription: initialData.productDescription || "",
      targetPlant: "1505- Khaniwade",
      materialCode: "",
      barcode: "",
      customerProductCode: "",
      sampleRequiredDate: initialData.sampleRequiredDate || "",
      dateRequestCreated: new Date().toISOString().split("T")[0],
      createdBy: currentUser?.name || "Admin",
      status: "Draft (Pre-SMT)",
      creationMode: "program_planning",
    };

    sessionStorage.setItem("samp_active_program_form", JSON.stringify(payload));
    navigate("/sample-requests/add-product");
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate("/sample-requests/new");
    }
  };

  return (
    <div className="w-full space-y-4 py-2 animate-in fade-in duration-150">
      <PageHeader
        title="SEASONAL PROGRAM PLANNING"
        subtitle="Structure seasonal collection goals, target milestones, and planned SKU categories."
      />

      <ProgramPlanningStep
        customers={customers}
        loadingCustomers={loadingCustomers}
        years={programYearOptions}
        selectedYear={String(currentYearNum)}
        onProceedToStaging={handleProceedToStaging}
        onBackToOptions={handleBack}
      />
    </div>
  );
};

export default ProgramPlanningPage;
