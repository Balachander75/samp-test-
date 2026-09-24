import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  CreateSampleRequestForm,
  BindingHierarchyResponse,
  ProductSearchResult,
  StagedProductItem,
} from "../types";
import {
  fetchBindingHierarchyApi,
  fetchProductClassesApi,
  searchProductsByMaterialApi,
  searchProductsByBindingApi,
  fetchProductDetailsApi,
  createSampleRequestBatchApi,
} from "../api";
import { StagedProductsWorkspace } from "./StagedProductsWorkspace";

export interface AddProductPageProps {
  currentUser?: { name?: string; userid?: string } | null;
  onBack?: () => void;
  onDesignOnly?: () => void;
}

export const AddProductPage: React.FC<AddProductPageProps> = ({
  currentUser,
  onBack,
  onDesignOnly,
}) => {
  const navigate = useNavigate();
  const getTodayString = () => new Date().toISOString().split("T")[0];
  const now = new Date();
  const currentYearNum = now.getFullYear();

  // Load active program form from sessionStorage
  const [form, setForm] = useState<CreateSampleRequestForm>(() => {
    try {
      const saved = sessionStorage.getItem("samp_active_program_form");
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error("Failed to parse active program form from session:", e);
    }
    return {
      year: "2026-2027",
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
    };
  });

  // If customer or program name is missing, redirect back to create screen
  useEffect(() => {
    if (!form.customer?.trim() || !form.programName?.trim()) {
      navigate("/sample-requests/new", { replace: true });
    }
  }, [form.customer, form.programName, navigate]);

  const [bindingHierarchy, setBindingHierarchy] = useState<BindingHierarchyResponse>({
    binding1_options: [],
    hierarchy: {},
  });
  const [allClasses, setAllClasses] = useState<string[]>([]);

  // Staging Workspace State
  const [stagedProducts, setStagedProducts] = useState<StagedProductItem[]>([]);
  const [isCreatingAll, setIsCreatingAll] = useState(false);

  // Material Code Search State
  const [materialQuery, setMaterialQuery] = useState("");
  const [isSearchingMaterial, setIsSearchingMaterial] = useState(false);
  const [hasSearchedMaterial, setHasSearchedMaterial] = useState(false);
  const [materialResults, setMaterialResults] = useState<ProductSearchResult[]>([]);

  // Cascading Binding Search State
  const [selectedBinding1, setSelectedBinding1] = useState("");
  const [selectedBinding2, setSelectedBinding2] = useState("");
  const [isSearchingBinding, setIsSearchingBinding] = useState(false);
  const [bindingResults, setBindingResults] = useState<ProductSearchResult[]>([]);
  const bindingSearchRequestRef = useRef(0);

  // Load Master Data on Mount
  useEffect(() => {
    let isCurrent = true;
    void Promise.all([fetchBindingHierarchyApi(), fetchProductClassesApi()]).then(
      ([hierarchy, classes]) => {
        if (!isCurrent) return;
        setBindingHierarchy(hierarchy);
        setAllClasses(classes);
      },
    );
    return () => {
      isCurrent = false;
    };
  }, []);

  const handleFormChange = (field: keyof CreateSampleRequestForm, value: string) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      sessionStorage.setItem("samp_active_program_form", JSON.stringify(next));
      return next;
    });
  };

  // Search Material Code
  const handleSearchMaterial = async () => {
    const term = materialQuery.trim();
    if (!term) return;
    setIsSearchingMaterial(true);
    setHasSearchedMaterial(true);
    try {
      const results = await searchProductsByMaterialApi(term);
      setMaterialResults(results);
    } finally {
      setIsSearchingMaterial(false);
    }
  };

  // Cascading Binding Handlers
  const handleBinding1Change = async (b1: string) => {
    setSelectedBinding1(b1);
    setSelectedBinding2("");
    const requestId = ++bindingSearchRequestRef.current;
    if (!b1) {
      setBindingResults([]);
      setIsSearchingBinding(false);
      return;
    }
    setIsSearchingBinding(true);
    try {
      const results = await searchProductsByBindingApi(b1);
      if (requestId === bindingSearchRequestRef.current) setBindingResults(results);
    } finally {
      if (requestId === bindingSearchRequestRef.current) setIsSearchingBinding(false);
    }
  };

  const handleBinding2Change = async (b2: string) => {
    setSelectedBinding2(b2);
    if (!selectedBinding1) return;
    const requestId = ++bindingSearchRequestRef.current;
    setIsSearchingBinding(true);
    try {
      const results = await searchProductsByBindingApi(selectedBinding1, b2);
      if (requestId === bindingSearchRequestRef.current) setBindingResults(results);
    } finally {
      if (requestId === bindingSearchRequestRef.current) setIsSearchingBinding(false);
    }
  };

  // Staged Products Management
  const handleAddStagedProduct = (item: StagedProductItem) => {
    setStagedProducts((prev) => [...prev, item]);
  };

  const handleUpdateStagedProduct = (item: StagedProductItem) => {
    setStagedProducts((prev) => prev.map((p) => (p.id === item.id ? item : p)));
  };

  const handleRemoveStagedProduct = (id: string) => {
    setStagedProducts((prev) => prev.filter((p) => p.id !== id));
  };

  // Submit Batch Creation
  const handleCreateAllSamples = async () => {
    if (!stagedProducts.length || isCreatingAll) return;
    setIsCreatingAll(true);
    try {
      const result = await createSampleRequestBatchApi({
        customer: form.customer,
        program_name: form.programName || "",
        program_year: form.programYear || form.year || "",
        target_plant: form.targetPlant || "",
        created_by: form.createdBy,
        date_request_created: form.dateRequestCreated,
        sample_required_date: form.sampleRequiredDate || undefined,
        items: stagedProducts.map((item) => ({
          material_code: item.materialCode,
          product_description: item.productDescription,
          barcode: item.barcode || (form.barcode ? form.barcode.trim() : null),
          customer_product_code:
            item.customerProductCode ||
            (form.customerProductCode ? form.customerProductCode.trim() : null),
          product_type: item.productType,
          source_sample_request_id: item.sourceSampleRequestId,
          creation_mode: item.creationMode === "binding" ? "binding" : "material_code",
          custom_binding_1: item.bindingType1,
          custom_binding_2: item.bindingType2,
          custom_details: item.editedDetails
            ? item.editedDetails.map((d) => ({
                class_name: d.className,
                characteristic_name: d.characteristicName,
                value: d.value,
                uom: d.uom ?? null,
              }))
            : undefined,
          request_types: item.requestTypes,
          request_type_selected_at: item.requestTypeSelectedAt,
        })),
      });

      if (result?.success) {
        sessionStorage.removeItem("samp_active_program_form");
        setStagedProducts([]);
        navigate("/sample-requests");
      }
    } catch (err) {
      console.error("Failed to batch create sample requests:", err);
    } finally {
      setIsCreatingAll(false);
    }
  };

  const handleBackToSetup = () => {
    if (onBack) onBack();
    else navigate("/sample-requests/new", { state: { fromStaging: true } });
  };

  return (
    <div className="w-full space-y-6 py-1 animate-in fade-in duration-200">
      <StagedProductsWorkspace
        form={form}
        stagedProducts={stagedProducts}
        bindingHierarchy={bindingHierarchy}
        onUpdateForm={handleFormChange}
        onAddStagedProduct={handleAddStagedProduct}
        onUpdateStagedProduct={handleUpdateStagedProduct}
        onRemoveStagedProduct={handleRemoveStagedProduct}
        onCreateAll={handleCreateAllSamples}
        isCreatingAll={isCreatingAll}
        onBackToStep1={handleBackToSetup}
        onDesignOnly={onDesignOnly}
        materialQuery={materialQuery}
        onMaterialQueryChange={setMaterialQuery}
        onSearchMaterial={handleSearchMaterial}
        isSearchingMaterial={isSearchingMaterial}
        hasSearchedMaterial={hasSearchedMaterial}
        materialResults={materialResults}
        selectedBinding1={selectedBinding1}
        selectedBinding2={selectedBinding2}
        onBinding1Change={handleBinding1Change}
        onBinding2Change={handleBinding2Change}
        isSearchingBinding={isSearchingBinding}
        bindingResults={bindingResults}
        onFetchDetails={(reqId) => fetchProductDetailsApi(reqId, false)}
        allClasses={allClasses}
      />
    </div>
  );
};
