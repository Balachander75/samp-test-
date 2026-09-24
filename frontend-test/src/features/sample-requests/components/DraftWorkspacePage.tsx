import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";
import {
  SampleRequestItem,
  BindingHierarchyResponse,
  ProductSearchResult,
  CustomerItem,
  RequestType,
  RequestTypeSelectedAt,
} from "../types";
import {
  fetchSampleRequestsApi,
  fetchProductDetailsApi,
  saveProductDetailsApi,
  updateSampleRequestApi,
  batchUpdateStatusApi,
  deleteSampleRequestApi,
  batchDeleteSampleRequestsApi,
  createSampleRequestApi,
  fetchBindingHierarchyApi,
  searchProductsByMaterialApi,
  searchProductsByBindingApi,
  fetchCustomersApi,
  fetchProductClassesApi,
  ProductDetailItem,
} from "../api";
import { DraftPackageGroup } from "./DraftPackagesView";
import { DesignDraftWorkspace } from "./DesignDraftWorkspace";
import { ProductSpecificationsDrawer } from "./ProductSpecificationsDrawer";
import { UnifiedProductLookup } from "./UnifiedProductLookup";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Camera,
  Check,
  CheckCircle2,
  Copy,
  DollarSign,
  Edit3,
  Layers,
  Package,
  Palette,
  Plus,
  RefreshCw,
  Send,
  Sparkles,
  Trash2,
  User,
  X,
} from "@/components/ui/icons";

const REQUEST_TYPE_OPTIONS: Array<{
  id: RequestType;
  label: string;
  description: string;
  icon: typeof Palette;
  activeBorder: string;
  activeBg: string;
  activeRing: string;
  iconBg: string;
  badgeBg: string;
  checkBg: string;
}> = [
  {
    id: "design",
    label: "Design",
    description: "Artwork & creative design routing",
    icon: Palette,
    activeBorder: "border-rose-500/90 dark:border-rose-500",
    activeBg: "bg-rose-50/70 dark:bg-rose-950/30",
    activeRing: "ring-2 ring-rose-500/25",
    iconBg: "bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-sm shadow-rose-500/25",
    badgeBg: "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/70 dark:text-rose-300 dark:border-rose-800",
    checkBg: "bg-gradient-to-br from-rose-500 to-red-600 text-white border-transparent shadow-xs",
  },
  {
    id: "mockup",
    label: "Mockup",
    description: "Studio 3D & visual photography",
    icon: Camera,
    activeBorder: "border-purple-500/90 dark:border-purple-500",
    activeBg: "bg-purple-50/70 dark:bg-purple-950/30",
    activeRing: "ring-2 ring-purple-500/25",
    iconBg: "bg-gradient-to-br from-purple-500 to-violet-600 text-white shadow-sm shadow-purple-500/25",
    badgeBg: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950/70 dark:text-purple-300 dark:border-purple-800",
    checkBg: "bg-gradient-to-br from-purple-500 to-violet-600 text-white border-transparent shadow-xs",
  },
  {
    id: "sample",
    label: "Sample",
    description: "Physical sample prototype build",
    icon: Package,
    activeBorder: "border-blue-500/90 dark:border-blue-500",
    activeBg: "bg-blue-50/70 dark:bg-blue-950/30",
    activeRing: "ring-2 ring-blue-500/25",
    iconBg: "bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-sm shadow-blue-500/25",
    badgeBg: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/70 dark:text-blue-300 dark:border-blue-800",
    checkBg: "bg-gradient-to-br from-blue-600 to-indigo-600 text-white border-transparent shadow-xs",
  },
  {
    id: "costing",
    label: "Costing",
    description: "Commercial pricing & estimate",
    icon: DollarSign,
    activeBorder: "border-emerald-500/90 dark:border-emerald-500",
    activeBg: "bg-emerald-50/70 dark:bg-emerald-950/30",
    activeRing: "ring-2 ring-emerald-500/25",
    iconBg: "bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-sm shadow-emerald-500/25",
    badgeBg: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800",
    checkBg: "bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-transparent shadow-xs",
  },
];

export interface DraftWorkspacePageProps {
  currentUser?: { name?: string; userid?: string; role?: string } | null;
  onBack?: () => void;
}

export const DraftWorkspacePage: React.FC<DraftWorkspacePageProps> = ({
  currentUser,
  onBack,
}) => {
  const location = useLocation();
  const navigate = useNavigate();

  // Load initial group from route state or sessionStorage
  const [draftGroup, setDraftGroup] = useState<DraftPackageGroup | null>(() => {
    const fromState = (location.state as { group?: DraftPackageGroup })?.group;
    if (fromState) {
      sessionStorage.setItem("samp_active_draft_group", JSON.stringify(fromState));
      return fromState;
    }
    const cached = sessionStorage.getItem("samp_active_draft_group");
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        console.error("Failed to parse cached draft group:", e);
      }
    }
    return null;
  });
  const initialDraftLoadRef = useRef(false);

  const [products, setProducts] = useState<SampleRequestItem[]>(
    draftGroup?.items || []
  );
  const [isLoading, setIsLoading] = useState(!draftGroup);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Multi-Selection State
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  // Specifications Drawer State
  const [selectedProductForSpecs, setSelectedProductForSpecs] =
    useState<SampleRequestItem | null>(null);
  const [specsDetails, setSpecsDetails] = useState<ProductDetailItem[]>([]);
  const [initialBaseDetails, setInitialBaseDetails] = useState<ProductDetailItem[]>([]);
  const [isLoadingSpecs, setIsLoadingSpecs] = useState(false);
  const [isSpecsDrawerReadOnly, setIsSpecsDrawerReadOnly] = useState(false);

  // Product Meta Edit Modal State
  const [editingProduct, setEditingProduct] = useState<SampleRequestItem | null>(null);
  const [editProductForm, setEditProductForm] = useState({
    materialCode: "",
    productDescription: "",
    customerProductCode: "",
    barcode: "",
    unitPcPack: "",
    qtyForSampling: "",
  });
  const [isSavingProductMeta, setIsSavingProductMeta] = useState(false);
  const [allClasses, setAllClasses] = useState<string[]>([]);

  // Program Meta Edit Modal State
  const [isEditingProgram, setIsEditingProgram] = useState(false);
  const [programForm, setProgramForm] = useState({
    customer: draftGroup?.customer || "",
    programName: draftGroup?.programName || "",
    programYear: draftGroup?.programYear || "2026",
    sampleRequiredDate: draftGroup?.sampleRequiredDate || "",
  });
  const [customerOptions, setCustomerOptions] = useState<CustomerItem[]>([]);
  const [isSavingProgram, setIsSavingProgram] = useState(false);

  // Unified Product Search State & Request Type Intake
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [isChoosingRequestType, setIsChoosingRequestType] = useState(true);
  const [selectedRequestTypes, setSelectedRequestTypes] = useState<RequestType[]>(["sample"]);
  const [requestTypeSelectedAt, setRequestTypeSelectedAt] = useState<RequestTypeSelectedAt>({
    sample: new Date().toISOString(),
  });
  const [materialQuery, setMaterialQuery] = useState("");
  const [isSearchingMaterial, setIsSearchingMaterial] = useState(false);
  const [hasSearchedMaterial, setHasSearchedMaterial] = useState(false);
  const [materialResults, setMaterialResults] = useState<ProductSearchResult[]>([]);

  const [bindingHierarchy, setBindingHierarchy] = useState<BindingHierarchyResponse>({
    binding1_options: [],
    hierarchy: {},
  });
  const [selectedBinding1, setSelectedBinding1] = useState("");
  const [selectedBinding2, setSelectedBinding2] = useState("");
  const [isSearchingBinding, setIsSearchingBinding] = useState(false);
  const [bindingResults, setBindingResults] = useState<ProductSearchResult[]>([]);
  const [isAddingNewProduct, setIsAddingNewProduct] = useState(false);

  const handleOpenAddProductModal = () => {
    setIsChoosingRequestType(true);
    setSelectedRequestTypes(["sample"]);
    const now = new Date().toISOString();
    setRequestTypeSelectedAt({ sample: now, costing: null, design: null, mockup: null });
    setMaterialQuery("");
    setMaterialResults([]);
    setSelectedBinding1("");
    setSelectedBinding2("");
    setBindingResults([]);
    setIsAddProductModalOpen(true);
  };

  const toggleRequestType = (type: RequestType) => {
    const now = new Date().toISOString();
    if (type === "design") {
      if (selectedRequestTypes.includes("design")) {
        setSelectedRequestTypes(["sample"]);
        setRequestTypeSelectedAt({ sample: now, design: null, mockup: null, costing: null });
      } else {
        setSelectedRequestTypes(["design"]);
        setRequestTypeSelectedAt({ design: now, mockup: null, sample: null, costing: null });
      }
    } else if (type === "mockup") {
      if (selectedRequestTypes.includes("mockup")) {
        setSelectedRequestTypes(["design"]);
        setRequestTypeSelectedAt({ design: now, mockup: null, sample: null, costing: null });
      } else {
        setSelectedRequestTypes(["design", "mockup"]);
        setRequestTypeSelectedAt({ design: now, mockup: now, sample: null, costing: null });
      }
    } else if (type === "sample") {
      if (selectedRequestTypes.includes("sample")) {
        const next = selectedRequestTypes.filter((t) => t !== "sample");
        if (next.length === 0) return;
        setSelectedRequestTypes(next);
        setRequestTypeSelectedAt((prev) => ({ ...prev, sample: null }));
      } else {
        const next: RequestType[] = ["sample", ...(selectedRequestTypes.includes("costing") ? (["costing"] as RequestType[]) : [])];
        setSelectedRequestTypes(next);
        setRequestTypeSelectedAt({ sample: now, costing: selectedRequestTypes.includes("costing") ? now : null, design: null, mockup: null });
      }
    } else if (type === "costing") {
      if (selectedRequestTypes.includes("costing")) {
        const next = selectedRequestTypes.filter((t) => t !== "costing");
        if (next.length === 0) {
          setSelectedRequestTypes(["sample"]);
          setRequestTypeSelectedAt({ sample: now, costing: null, design: null, mockup: null });
          return;
        }
        setSelectedRequestTypes(next);
        setRequestTypeSelectedAt((prev) => ({ ...prev, costing: null }));
      } else {
        const next: RequestType[] = ["sample", "costing"];
        setSelectedRequestTypes(next);
        setRequestTypeSelectedAt({ sample: now, costing: now, design: null, mockup: null });
      }
    }
  };

  const handleContinueFromRequestType = () => {
    if (!draftGroup) return;
    if (selectedRequestTypes.length === 1 && selectedRequestTypes[0] === "design") {
      sessionStorage.setItem(
        "samp_active_program_form",
        JSON.stringify({
          customer: draftGroup.customer,
          programName: draftGroup.programName,
          programYear: draftGroup.programYear,
          targetPlant: draftGroup.targetPlant,
          sampleRequiredDate: draftGroup.sampleRequiredDate || "",
        })
      );
      sessionStorage.setItem("samp_active_draft_group", JSON.stringify(draftGroup));
      setIsAddProductModalOpen(false);
      navigate("/sample-requests/create-design");
      return;
    }
    setIsChoosingRequestType(false);
  };

  // Release Modal State
  const [isReleaseModalOpen, setIsReleaseModalOpen] = useState(false);
  const [releaseTargetIds, setReleaseTargetIds] = useState<string[]>([]);
  const [isReleasing, setIsReleasing] = useState(false);

  // Bulk Delete Confirmation Modal State
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const normalizeYear = (y?: string | null) => {
    if (!y) return "2026";
    const cleaned = String(y).replace(/BTS/gi, "").trim();
    return cleaned.split("-")[0].trim() || "2026";
  };

  // Load fresh requests for this draft group from API
  const refreshDraftProducts = useCallback(async (overrideGroup?: DraftPackageGroup) => {
    const targetGroup = overrideGroup || draftGroup;
    if (!targetGroup) return;
    setIsLoading(true);
    try {
      const allRequests = await fetchSampleRequestsApi();
      const targetCust = (targetGroup.customer || "").trim().toLowerCase();
      const targetProg = (targetGroup.programName || "").trim().toLowerCase();
      const targetYr = normalizeYear(targetGroup.programYear);

      const matched = allRequests.filter((r) => {
        const s = (r.status || "").toLowerCase();
        const isDraft = s.includes("draft") || s.includes("smt");
        if (!isDraft) return false;

        const cust = (r.customer || "").trim().toLowerCase();
        const prog = (r.programName || "").trim().toLowerCase();
        const yr = normalizeYear(r.programYear || r.year);

        return cust === targetCust && prog === targetProg && yr === targetYr;
      });

      setProducts(matched);
      // Clean up selectedProductIds that no longer exist
      setSelectedProductIds((prev) => prev.filter((id) => matched.some((m) => m.id === id)));
      setDraftGroup((prev) => {
        const base = overrideGroup || prev;
        return base ? { ...base, items: matched } : null;
      });
    } catch (err) {
      console.error("Failed to refresh draft products:", err);
    } finally {
      setIsLoading(false);
    }
  }, [draftGroup]);

  useEffect(() => {
    if (initialDraftLoadRef.current) return;
    initialDraftLoadRef.current = true;
    if (!draftGroup) {
      navigate("/sample-requests", { replace: true });
      return;
    }
    void refreshDraftProducts();
  }, [draftGroup, navigate, refreshDraftProducts]);

  // Pre-load customers, classes, and binding master data
  useEffect(() => {
    fetchCustomersApi().then(setCustomerOptions);
    fetchBindingHierarchyApi().then(setBindingHierarchy);
    fetchProductClassesApi().then(setAllClasses);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleBack = () => {
    if (onBack) onBack();
    else navigate("/sample-requests");
  };

  // Selection handlers
  const handleToggleSelectProduct = (id: string, e: React.MouseEvent | React.ChangeEvent) => {
    e.stopPropagation();
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((pId) => pId !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    if (selectedProductIds.length === products.length) {
      setSelectedProductIds([]);
    } else {
      setSelectedProductIds(products.map((p) => p.id));
    }
  };

  // 1. Open Specifications Drawer for a Product in Draft
  const handleOpenSpecs = async (prod: SampleRequestItem) => {
    setIsSpecsDrawerReadOnly(false);
    setSelectedProductForSpecs(prod);
    setIsLoadingSpecs(true);
    try {
      const details = await fetchProductDetailsApi(Number(prod.id), false);
      setSpecsDetails(details);

      let base = details;
      const lookupCode =
        prod.sourceSampleCode || (!prod.materialCode.startsWith("A1-") ? prod.materialCode : null);

      if (prod.sourceRequestId) {
        try {
          base = await fetchProductDetailsApi(prod.sourceRequestId, false);
        } catch {
          base = details;
        }
      } else if (lookupCode) {
        try {
          const results = await searchProductsByMaterialApi(lookupCode);
          const match =
            results.find(
              (r: ProductSearchResult) => r.material_code.trim().toUpperCase() === lookupCode.trim().toUpperCase()
            ) || results[0];
          if (match && match.id) {
            base = await fetchProductDetailsApi(match.id, false);
          }
        } catch {
          base = details;
        }
      }
      setInitialBaseDetails(base);
    } catch (err) {
      console.error("Failed to load product specifications:", err);
      setSpecsDetails([]);
      setInitialBaseDetails([]);
    } finally {
      setIsLoadingSpecs(false);
    }
  };

  // 2. Save Updated Specifications from Drawer (Supports Clone vs New Product Auto-detection)
  const handleSaveSpecs = async (updatedDetails: ProductDetailItem[], isCustomized: boolean) => {
    if (!selectedProductForSpecs) return;
    try {
      await saveProductDetailsApi(Number(selectedProductForSpecs.id), updatedDetails);
      setSpecsDetails(updatedDetails);

      const targetCreationMode = isCustomized ? "binding" : "material_code";
      const originalCode =
        selectedProductForSpecs.sourceSampleCode || selectedProductForSpecs.materialCode;
      const needsCodeUpdate =
        isCustomized && !selectedProductForSpecs.materialCode.startsWith("A1-");

      const targetMaterialCode = isCustomized
        ? needsCodeUpdate
          ? `A1-${String(Date.now()).slice(-6)}`
          : selectedProductForSpecs.materialCode
        : originalCode && !originalCode.startsWith("A1-")
        ? originalCode
        : selectedProductForSpecs.materialCode;

      await updateSampleRequestApi(selectedProductForSpecs.id, {
        creationMode: targetCreationMode,
        materialCode: targetMaterialCode,
        sourceSampleCode: originalCode,
      });

      showToast(
        isCustomized
          ? `Customized specifications saved for ${targetMaterialCode} (New Product).`
          : `Catalog specifications saved for ${targetMaterialCode} (Clone Reference).`
      );
      await refreshDraftProducts();
    } catch (err) {
      console.error("Failed to save product specifications:", err);
      throw err;
    }
  };

  // 3. Open Product Meta Edit Modal
  const handleOpenEditProductMeta = (prod: SampleRequestItem) => {
    setEditingProduct(prod);
    setEditProductForm({
      materialCode: prod.materialCode || "",
      productDescription: prod.productDescription || "",
      customerProductCode: prod.customerProductCode || "",
      barcode: prod.barcode || "",
      unitPcPack: prod.unitPcPack != null ? String(prod.unitPcPack) : "",
      qtyForSampling: prod.qtyForSampling != null ? String(prod.qtyForSampling) : "",
    });
  };

  // 4. Save Product Meta
  const handleSaveProductMeta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    setIsSavingProductMeta(true);
    try {
      await updateSampleRequestApi(editingProduct.id, {
        materialCode: editProductForm.materialCode.trim() || undefined,
        productDescription: editProductForm.productDescription.trim(),
        customerProductCode: editProductForm.customerProductCode.trim() || undefined,
        barcode: editProductForm.barcode.trim() || undefined,
        unitPcPack: editProductForm.unitPcPack.trim() || undefined,
        qtyForSampling: editProductForm.qtyForSampling.trim() || undefined,
      });

      showToast(`Updated details for ${editProductForm.materialCode || editingProduct.materialCode}`);
      setEditingProduct(null);
      await refreshDraftProducts();
    } catch (err) {
      console.error("Failed to update product info:", err);
      alert("Failed to update product info. Please try again.");
    } finally {
      setIsSavingProductMeta(false);
    }
  };

  // 5. Delete Product from Draft
  const handleDeleteProduct = async (prod: SampleRequestItem) => {
    if (!window.confirm(`Are you sure you want to remove ${prod.materialCode} from this draft?`)) return;
    try {
      const ok = await deleteSampleRequestApi(prod.id);
      if (ok) {
        showToast(`Removed product ${prod.materialCode}`);
        setProducts((prev) => prev.filter((p) => p.id !== prod.id));
        setSelectedProductIds((prev) => prev.filter((id) => id !== prod.id));
        await refreshDraftProducts();
      }
    } catch (err) {
      console.error("Failed to delete product:", err);
    }
  };

  // 6. Clone Product in Draft
  const handleCloneDraftProduct = async (prod: SampleRequestItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!draftGroup) return;
    try {
      const cloned = await createSampleRequestApi({
        customer: draftGroup.customer,
        programName: draftGroup.programName,
        programYear: draftGroup.programYear,
        year: "2026-2027",
        targetPlant: draftGroup.targetPlant,
        createdBy: currentUser?.name || "Admin",
        dateRequestCreated: new Date().toISOString().split("T")[0],
        sampleRequiredDate: draftGroup.sampleRequiredDate || "",
        materialCode: prod.materialCode,
        productDescription: `${prod.productDescription || "Product"} (Copy)`,
        sourceRequestId: prod.sourceRequestId || Number(prod.id),
        creationMode: prod.creationMode || "material_code",
        status: "Draft (Pre-SMT)",
        customerProductCode: prod.customerProductCode,
        barcode: prod.barcode,
        unitPcPack: prod.unitPcPack != null ? String(prod.unitPcPack) : undefined,
        qtyForSampling: prod.qtyForSampling != null ? String(prod.qtyForSampling) : undefined,
      });

      if (prod.creationMode === "binding" && cloned?.id) {
        const originalSpecs = await fetchProductDetailsApi(Number(prod.id), false);
        if (originalSpecs && originalSpecs.length > 0) {
          await saveProductDetailsApi(Number(cloned.id), originalSpecs);
        }
      }

      showToast(`Cloned product ${prod.materialCode}`);
      await refreshDraftProducts();
    } catch (err) {
      console.error("Failed to clone product:", err);
    }
  };

  // 7. Save Program Info Across all products in this draft
  const handleSaveProgramInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!programForm.customer || !programForm.programName) return;
    setIsSavingProgram(true);
    try {
      await Promise.all(
        products.map((p) =>
          updateSampleRequestApi(p.id, {
            customer: programForm.customer,
            programName: programForm.programName,
            programYear: programForm.programYear,
            sampleRequiredDate: programForm.sampleRequiredDate || undefined,
          })
        )
      );

      const updatedGroup: DraftPackageGroup = {
        ...(draftGroup || ({} as DraftPackageGroup)),
        customer: programForm.customer,
        programName: programForm.programName,
        programYear: programForm.programYear,
        sampleRequiredDate: programForm.sampleRequiredDate,
      };

      setDraftGroup(updatedGroup);
      sessionStorage.setItem("samp_active_draft_group", JSON.stringify(updatedGroup));
      setIsEditingProgram(false);
      showToast("Updated program parameters.");
      await refreshDraftProducts(updatedGroup);
    } catch (err) {
      console.error("Failed to update program info:", err);
      alert("Failed to update program parameters.");
    } finally {
      setIsSavingProgram(false);
    }
  };

  // 8. Search Handlers for Unified Lookup
  const handleSearchMaterial = async () => {
    if (!materialQuery.trim()) return;
    setIsSearchingMaterial(true);
    setHasSearchedMaterial(true);
    try {
      const res = await searchProductsByMaterialApi(materialQuery.trim());
      setMaterialResults(res);
    } finally {
      setIsSearchingMaterial(false);
    }
  };

  const handleBinding1Change = async (b1: string) => {
    setSelectedBinding1(b1);
    setSelectedBinding2("");
    if (!b1) {
      setBindingResults([]);
      return;
    }
    setIsSearchingBinding(true);
    try {
      const res = await searchProductsByBindingApi(b1);
      setBindingResults(res);
    } finally {
      setIsSearchingBinding(false);
    }
  };

  const handleBinding2Change = async (b2: string) => {
    setSelectedBinding2(b2);
    if (!selectedBinding1) return;
    setIsSearchingBinding(true);
    try {
      const res = await searchProductsByBindingApi(selectedBinding1, b2);
      setBindingResults(res);
    } finally {
      setIsSearchingBinding(false);
    }
  };

  const combinedSearchResults = useMemo(() => {
    if (selectedBinding1) {
      if (!materialQuery.trim()) return bindingResults;
      const q = materialQuery.toLowerCase().trim();
      return bindingResults.filter(
        (p) =>
          p.material_code.toLowerCase().includes(q) ||
          p.product_description.toLowerCase().includes(q) ||
          (p.customer || "").toLowerCase().includes(q)
      );
    }
    return materialResults;
  }, [selectedBinding1, bindingResults, materialResults, materialQuery]);

  // Preview catalog product specifications during Search (Read-only Preview)
  const handlePreviewCatalogSpecs = async (prod: ProductSearchResult) => {
    setIsSpecsDrawerReadOnly(true);
    const dummyItem: SampleRequestItem = {
      id: String(prod.id),
      srNumber: prod.sr_number,
      materialCode: prod.material_code,
      productDescription: prod.product_description,
      customer: prod.customer || "",
      targetPlant: prod.target_plant || "",
      year: "2026-2027",
      dateRequestCreated: new Date().toISOString().split("T")[0],
      createdBy: "",
      status: "Draft Preview",
      createdAt: new Date().toISOString(),
      creationMode: "material_code",
    };
    setSelectedProductForSpecs(dummyItem);
    setIsLoadingSpecs(true);
    try {
      const details = await fetchProductDetailsApi(prod.id, false);
      setSpecsDetails(details);
      setInitialBaseDetails(details);
    } catch (err) {
      console.error("Failed to load product specifications:", err);
      setSpecsDetails([]);
      setInitialBaseDetails([]);
    } finally {
      setIsLoadingSpecs(false);
    }
  };

  // Add Product to Draft (Direct or after customizing in drawer)
  const handleAddNewProductToDraft = async (
    result: ProductSearchResult,
    mode: "material_code" | "binding" = "material_code"
  ) => {
    if (!draftGroup) return;
    setIsAddingNewProduct(true);
    try {
      const isCustomBinding = result.id === 0 || mode === "binding" || Boolean(result.binding_type_1);
      const effectiveMode = isCustomBinding && result.id === 0 ? "binding" : mode;
      await createSampleRequestApi({
        customer: draftGroup.customer,
        programName: draftGroup.programName,
        programYear: draftGroup.programYear,
        year: "2026-2027",
        targetPlant: draftGroup.targetPlant,
        createdBy: currentUser?.name || "Admin",
        dateRequestCreated: new Date().toISOString().split("T")[0],
        sampleRequiredDate: draftGroup.sampleRequiredDate || "",
        materialCode: result.material_code,
        sourceSampleCode: result.material_code,
        productDescription: result.product_description,
        sourceRequestId: result.id > 0 ? result.id : undefined,
        creationMode: effectiveMode,
        customBinding1: result.binding_type_1,
        customBinding2: result.binding_type_2,
        requestTypes: selectedRequestTypes,
        requestTypeSelectedAt: requestTypeSelectedAt,
        mockupRequired: selectedRequestTypes.includes("mockup") ? "Yes" : "No",
        status: "Draft (Pre-SMT)",
      });

      showToast(`Added product ${result.material_code} to draft package.`);
      setIsAddProductModalOpen(false);
      setMaterialQuery("");
      setMaterialResults([]);
      await refreshDraftProducts();
    } catch (err) {
      console.error("Failed to add product to draft:", err);
      alert("Failed to add product to draft. Please try again.");
    } finally {
      setIsAddingNewProduct(false);
    }
  };

  // Add customized previewed product from drawer to draft
  const handleAddCustomizedSearchResultToDraft = async (
    searchItem: SampleRequestItem,
    updatedDetails: ProductDetailItem[],
    isCustomized: boolean
  ) => {
    if (!draftGroup) return;
    setIsAddingNewProduct(true);
    try {
      const assignedCode = isCustomized
        ? `A1-${String(Date.now()).slice(-6)}`
        : searchItem.materialCode;
      const sourceReqId = Number(searchItem.id) > 0 ? Number(searchItem.id) : undefined;

      const newReq = await createSampleRequestApi({
        customer: draftGroup.customer,
        programName: draftGroup.programName,
        programYear: draftGroup.programYear,
        year: "2026-2027",
        targetPlant: draftGroup.targetPlant,
        createdBy: currentUser?.name || "Admin",
        dateRequestCreated: new Date().toISOString().split("T")[0],
        sampleRequiredDate: draftGroup.sampleRequiredDate || "",
        materialCode: assignedCode,
        productDescription: searchItem.productDescription,
        sourceRequestId: sourceReqId,
        creationMode: isCustomized ? "binding" : "material_code",
        requestTypes: selectedRequestTypes,
        requestTypeSelectedAt: requestTypeSelectedAt,
        mockupRequired: selectedRequestTypes.includes("mockup") ? "Yes" : "No",
        status: "Draft (Pre-SMT)",
      });

      if (isCustomized && newReq?.id) {
        await saveProductDetailsApi(Number(newReq.id), updatedDetails);
      }

      showToast(
        isCustomized
          ? `Added ${assignedCode} to draft with customized specifications.`
          : `Added ${assignedCode} to draft as catalog reference clone.`
      );
      setSelectedProductForSpecs(null);
      setIsAddProductModalOpen(false);
      await refreshDraftProducts();
    } catch (err) {
      console.error("Failed to add customized product to draft:", err);
      alert("Failed to add product to draft. Please try again.");
    } finally {
      setIsAddingNewProduct(false);
    }
  };

  // Release Draft to SMT Handlers
  const handleOpenReleaseModal = (ids?: string[]) => {
    const targetIds = ids && ids.length > 0 ? ids : products.map((p) => p.id);
    if (!targetIds.length) return;
    setReleaseTargetIds(targetIds);
    setIsReleaseModalOpen(true);
  };

  const handleConfirmReleaseToSMT = async () => {
    if (!releaseTargetIds.length) return;
    setIsReleasing(true);
    try {
      const res = await batchUpdateStatusApi(releaseTargetIds, "Creative");
      if (res.success) {
        showToast(
          `Successfully released ${releaseTargetIds.length} ${
            releaseTargetIds.length === 1 ? "product" : "products"
          } to Creative / SMT!`
        );
        sessionStorage.removeItem("samp_active_draft_group");
        setIsReleaseModalOpen(false);
        setTimeout(() => {
          navigate("/sample-requests");
        }, 1200);
      }
    } catch (err) {
      console.error("Failed to release draft to SMT:", err);
      alert("Failed to release draft. Please check your network and try again.");
    } finally {
      setIsReleasing(false);
    }
  };

  // Bulk Delete
  const handleConfirmBulkDelete = async () => {
    if (!selectedProductIds.length) return;
    setIsBulkDeleting(true);
    try {
      const ok = await batchDeleteSampleRequestsApi(selectedProductIds);
      if (ok) {
        showToast(`Removed ${selectedProductIds.length} selected products.`);
        setSelectedProductIds([]);
        setIsBulkDeleteModalOpen(false);
        await refreshDraftProducts();
      }
    } catch (err) {
      console.error("Failed to bulk delete products:", err);
      alert("Failed to delete selected products.");
    } finally {
      setIsBulkDeleting(false);
    }
  };

  if (!draftGroup) {
    return null;
  }

  if (draftGroup.requestKind === "design") {
    return (
      <DesignDraftWorkspace
        group={draftGroup}
        onBack={onBack}
      />
    );
  }

  const isAllSelected = products.length > 0 && selectedProductIds.length === products.length;

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-[160] flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-emerald-600 text-white shadow-xl shadow-emerald-600/30 text-xs font-semibold animate-in slide-in-from-top-4 duration-200 max-w-sm">
          <CheckCircle2 size={16} className="stroke-[3] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navigation & Breadcrumb */}
      <div className="flex items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer py-1"
        >
          <ArrowLeft size={14} />
          <span>Back to Draft Packages</span>
        </button>

        <div className="hidden sm:flex items-center gap-2 text-xs font-medium">
          <span>Sample Requests</span>
          <span>/</span>
          <span className="text-amber-600 dark:text-amber-400 font-semibold">Draft Packages</span>
          <span>/</span>
          <span className="text-slate-900 dark:text-slate-100 font-bold truncate max-w-xs">
            {draftGroup.programName}
          </span>
        </div>
      </div>

      {/* Program Hero Banner Card */}
      <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-2xs space-y-4">
        {/* Top Badges & Meta Info */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs px-2.5 py-1 rounded-lg font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-2xs">
              {draftGroup.customer}
            </span>
            <span className="text-xs px-2.5 py-1 rounded-lg font-mono font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 shadow-2xs">
              Season {draftGroup.programYear}
            </span>
            <span className="text-xs px-2.5 py-1 rounded-lg font-semibold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
              Draft (Pre-SMT)
            </span>
          </div>

          <div className="flex items-center gap-2.5 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
              <Calendar size={13} className="text-slate-400" />
              <span>Created: <strong className="text-slate-800 dark:text-slate-200">{draftGroup.dateRequestCreated || "Recent"}</strong></span>
            </span>

            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
              <User size={13} className="text-slate-400" />
              <span>By <strong className="text-slate-800 dark:text-slate-200">{draftGroup.createdBy || "Admin"}</strong></span>
            </span>

            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60 text-indigo-800 dark:text-indigo-300 font-semibold">
              <Layers size={13} className="text-indigo-600 dark:text-indigo-400" />
              <span>{products.length} {products.length === 1 ? "Product" : "Products"}</span>
            </span>
          </div>
        </div>

        {/* Title and Action Button Group */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 leading-tight">
              {draftGroup.programName}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Review and configure technical specifications, SKU codes, quantities, and release to SMT active workflow.
            </p>
          </div>

          {/* Unified, Cohesive Action Buttons */}
          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <button
              type="button"
              onClick={() => setIsEditingProgram(true)}
              className="h-9 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs shadow-2xs inline-flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Edit3 size={13} />
              <span>Edit Program</span>
            </button>

            <button
              type="button"
              onClick={handleOpenAddProductModal}
              className="h-9 px-3.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-semibold text-xs shadow-2xs inline-flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus size={14} />
              <span>Add Product</span>
            </button>

            <button
              type="button"
              disabled={products.length === 0}
              onClick={() => handleOpenReleaseModal()}
              className="h-9 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-xs shadow-xs hover:shadow transition-all inline-flex items-center gap-1.5 cursor-pointer active:scale-[0.98]"
            >
              <Send size={13} />
              <span>Release to SMT</span>
            </button>
          </div>
        </div>
      </div>

      {/* Staged Products Section */}
      <div className="space-y-3">
        {/* Section Header & Bulk Action Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 px-0.5">
          <div className="flex items-center gap-3">
            <label className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={handleToggleSelectAll}
                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <span>Staged Products in Program ({products.length})</span>
            </label>
          </div>

          {/* Bulk Selection Bar */}
          {selectedProductIds.length > 0 && (
            <div className="flex items-center gap-2 p-1.5 px-3 rounded-xl bg-indigo-50/90 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 text-xs animate-in zoom-in-[0.98] duration-150">
              <span className="font-bold text-indigo-700 dark:text-indigo-300">
                {selectedProductIds.length} Selected
              </span>
              <span className="text-indigo-300 dark:text-indigo-700">&bull;</span>
              <button
                type="button"
                onClick={() => handleOpenReleaseModal(selectedProductIds)}
                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] inline-flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
              >
                <Send size={11} />
                <span>Release Selected</span>
              </button>
              <button
                type="button"
                onClick={() => setIsBulkDeleteModalOpen(true)}
                className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 font-semibold text-[11px] inline-flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Trash2 size={11} />
                <span>Remove</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedProductIds([])}
                className="text-[11px] font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 px-1 cursor-pointer"
              >
                Deselect
              </button>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-xs text-slate-400 animate-pulse rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800">
            Loading products...
          </div>
        ) : products.length === 0 ? (
          <div className="saas-empty-state rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 p-8 text-center space-y-3">
            <Package size={28} className="mx-auto text-slate-400" />
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">No products in this draft</h4>
              <p className="text-xs text-slate-500">Click &ldquo;Add Product&rdquo; to search and stage products for this program.</p>
            </div>
            <button
              type="button"
              onClick={handleOpenAddProductModal}
              className="h-8.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs cursor-pointer inline-flex items-center gap-1.5"
            >
              <Plus size={14} />
              <span>Add Product</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {products.map((prod, idx) => {
              const isSelected = selectedProductIds.includes(prod.id);
              const isCustomized = prod.creationMode === "binding";

              return (
                <div
                  key={prod.id}
                  onClick={(e) => handleToggleSelectProduct(prod.id, e)}
                  className={`group rounded-2xl border transition-all duration-150 p-3.5 sm:p-4 shadow-2xs hover:shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 cursor-pointer ${
                    isSelected
                      ? "border-indigo-500 bg-indigo-50/25 dark:bg-indigo-950/20 ring-1 ring-indigo-500/20"
                      : "border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    {/* Checkbox */}
                    <div className="pt-0.5" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => handleToggleSelectProduct(prod.id, e)}
                        className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                    </div>

                    {/* Number Index */}
                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-mono font-bold text-xs text-slate-700 dark:text-slate-300 shrink-0">
                      {idx + 1}
                    </div>

                    {/* Product Metadata & Title */}
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-xs px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 shadow-2xs">
                          {prod.materialCode}
                        </span>

                        <span className="font-mono text-[11px] text-slate-400 font-semibold">
                          {prod.srNumber}
                        </span>

                        {isCustomized ? (
                          <span className="text-[11px] px-2 py-0.5 rounded font-semibold bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 flex items-center gap-1">
                            <Sparkles size={10} />
                            <span>Custom Spec &bull; New Product</span>
                          </span>
                        ) : (
                          <span className="text-[11px] px-2 py-0.5 rounded font-medium bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                            <Copy size={10} />
                            <span>Catalog Reference &bull; Clone</span>
                          </span>
                        )}

                        {prod.customerProductCode && (
                          <span className="text-[11px] px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-medium border border-blue-200 dark:border-blue-800">
                            SKU: {prod.customerProductCode}
                          </span>
                        )}

                        {prod.barcode && (
                          <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono">
                            Barcode: {prod.barcode}
                          </span>
                        )}

                        {prod.requestTypes && prod.requestTypes.length > 0 && (
                          <div className="flex items-center gap-1">
                            {prod.requestTypes.map((t) => {
                              const opt = REQUEST_TYPE_OPTIONS.find((o) => o.id === t);
                              if (!opt) return null;
                              return (
                                <span
                                  key={t}
                                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${opt.badgeBg}`}
                                >
                                  {opt.label}
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-snug">
                        {prod.productDescription || "Notebook Product"}
                      </h4>

                      <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                        {prod.unitPcPack && (
                          <span>Unit Pack: <strong className="text-slate-700 dark:text-slate-300">{prod.unitPcPack} pcs</strong></span>
                        )}
                        {prod.qtyForSampling && (
                          <span>Sample Qty: <strong className="text-slate-700 dark:text-slate-300">{prod.qtyForSampling}</strong></span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions per Product */}
                  <div
                    className="flex items-center gap-2 shrink-0 self-end sm:self-center pt-2 sm:pt-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => handleOpenEditProductMeta(prod)}
                      className="h-8.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      title="Edit SKU, Barcode, or Quantities"
                    >
                      <Edit3 size={12} />
                      <span>Edit Info</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleCloneDraftProduct(prod, e)}
                      className="h-8.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      title="Duplicate this product in draft"
                    >
                      <Copy size={12} />
                      <span>Clone</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenSpecs(prod)}
                      className={`h-8.5 px-3.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer ${
                        isCustomized
                          ? "bg-purple-600 hover:bg-purple-700 text-white"
                          : "bg-indigo-600 hover:bg-indigo-700 text-white"
                      }`}
                      title="Configure technical specifications (allows editing & clone/custom conversion)"
                    >
                      <Layers size={13} />
                      <span>Configure Specs</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteProduct(prod)}
                      className="h-8.5 w-8.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-slate-400 hover:text-rose-600 transition-colors flex items-center justify-center cursor-pointer border border-transparent hover:border-rose-200 dark:hover:border-rose-800"
                      title="Remove product from draft"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Unified Specifications Drawer */}
      {selectedProductForSpecs && (
        <ProductSpecificationsDrawer
          product={selectedProductForSpecs}
          details={specsDetails}
          initialBaseDetails={initialBaseDetails}
          isLoading={isLoadingSpecs}
          specMode={isSpecsDrawerReadOnly ? "view" : "binding"}
          allowEdit={!isSpecsDrawerReadOnly && Boolean(products.some((p) => p.id === selectedProductForSpecs.id))}
          allProductClasses={allClasses}
          onSave={async (updatedDetails, isCustomized) => {
            const existingDraftProduct = products.find((p) => p.id === selectedProductForSpecs.id);
            if (!existingDraftProduct) {
              await handleAddCustomizedSearchResultToDraft(
                selectedProductForSpecs,
                updatedDetails,
                isCustomized
              );
            } else {
              await handleSaveSpecs(updatedDetails, isCustomized);
            }
          }}
          onClose={() => {
            setSelectedProductForSpecs(null);
            setIsSpecsDrawerReadOnly(false);
          }}
        />
      )}

      {/* Edit Product Meta Modal */}
      {editingProduct &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm animate-in fade-in duration-150"
            onClick={() => !isSavingProductMeta && setEditingProduct(null)}
          >
            <div
              className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in zoom-in-[0.98] duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center">
                    <Edit3 size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      Edit Product Information
                    </h3>
                    <span className="font-mono text-xs text-indigo-600 dark:text-indigo-400 font-bold">
                      {editingProduct.materialCode}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSaveProductMeta} className="space-y-3.5 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">Material Code</label>
                    <input
                      type="text"
                      required
                      value={editProductForm.materialCode}
                      onChange={(e) =>
                        setEditProductForm((prev) => ({ ...prev, materialCode: e.target.value }))
                      }
                      className="w-full h-9 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-mono font-bold focus:outline-none focus:ring-1.5 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">Product Description</label>
                    <input
                      type="text"
                      required
                      value={editProductForm.productDescription}
                      onChange={(e) =>
                        setEditProductForm((prev) => ({ ...prev, productDescription: e.target.value }))
                      }
                      className="w-full h-9 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1.5 focus:ring-indigo-500 font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">Customer SKU / Product Code</label>
                    <input
                      type="text"
                      value={editProductForm.customerProductCode}
                      onChange={(e) =>
                        setEditProductForm((prev) => ({ ...prev, customerProductCode: e.target.value }))
                      }
                      placeholder="e.g. WM-NB-2027"
                      className="w-full h-9 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1.5 focus:ring-indigo-500 font-medium"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">Barcode</label>
                    <input
                      type="text"
                      value={editProductForm.barcode}
                      onChange={(e) =>
                        setEditProductForm((prev) => ({ ...prev, barcode: e.target.value }))
                      }
                      placeholder="e.g. 890123456789"
                      className="w-full h-9 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1.5 focus:ring-indigo-500 font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">No. of Pcs in Unit/Sale Pack</label>
                    <input
                      type="text"
                      value={editProductForm.unitPcPack}
                      onChange={(e) =>
                        setEditProductForm((prev) => ({ ...prev, unitPcPack: e.target.value }))
                      }
                      placeholder="e.g. 1, 6, 12"
                      className="w-full h-9 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1.5 focus:ring-indigo-500 font-medium"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">Qty for Sampling</label>
                    <input
                      type="text"
                      value={editProductForm.qtyForSampling}
                      onChange={(e) =>
                        setEditProductForm((prev) => ({ ...prev, qtyForSampling: e.target.value }))
                      }
                      placeholder="e.g. 2, 5"
                      className="w-full h-9 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1.5 focus:ring-indigo-500 font-medium"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setEditingProduct(null)}
                    className="h-9 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingProductMeta}
                    className="h-9 px-4.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50 active:scale-[0.98]"
                  >
                    {isSavingProductMeta ? "Saving..." : "Save Product Details"}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* Edit Program Meta Modal */}
      {isEditingProgram &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm animate-in fade-in duration-150"
            onClick={() => !isSavingProgram && setIsEditingProgram(false)}
          >
            <div
              className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in zoom-in-[0.98] duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center">
                    <Edit3 size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      Edit Program Information
                    </h3>
                    <p className="text-xs text-slate-500">
                      Update parameters across all products in this draft package
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditingProgram(false)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSaveProgramInfo} className="space-y-3.5 text-xs">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Customer</label>
                  <select
                    value={programForm.customer}
                    onChange={(e) =>
                      setProgramForm((prev) => ({ ...prev, customer: e.target.value }))
                    }
                    required
                    className="w-full h-9 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1.5 focus:ring-indigo-500 font-medium cursor-pointer"
                  >
                    <option value="">Select Customer...</option>
                    {customerOptions.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Program Title</label>
                  <input
                    type="text"
                    required
                    value={programForm.programName}
                    onChange={(e) =>
                      setProgramForm((prev) => ({ ...prev, programName: e.target.value }))
                    }
                    placeholder="e.g. Back to School 2027"
                    className="w-full h-9 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1.5 focus:ring-indigo-500 font-medium"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">Season Year</label>
                    <input
                      type="text"
                      value={programForm.programYear}
                      onChange={(e) =>
                        setProgramForm((prev) => ({ ...prev, programYear: e.target.value }))
                      }
                      placeholder="e.g. 2027"
                      className="w-full h-9 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1.5 focus:ring-indigo-500 font-medium"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">Sample Required Date</label>
                    <input
                      type="date"
                      value={programForm.sampleRequiredDate}
                      onChange={(e) =>
                        setProgramForm((prev) => ({ ...prev, sampleRequiredDate: e.target.value }))
                      }
                      className="w-full h-9 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1.5 focus:ring-indigo-500 font-medium"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3.5 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsEditingProgram(false)}
                    className="h-9 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingProgram}
                    className="h-9 px-4.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50 active:scale-[0.98]"
                  >
                    {isSavingProgram ? "Saving..." : "Apply to Program"}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* Add New Product to Draft Modal (Two-step flow: 1. Request Types Intake -> 2. Unified Lookup) */}
      {isAddProductModalOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 p-3 sm:p-5 backdrop-blur-sm animate-in fade-in duration-150"
            onClick={() => !isAddingNewProduct && setIsAddProductModalOpen(false)}
          >
            <div
              className={`w-full ${
                isChoosingRequestType ? "max-w-2xl" : "max-w-4xl"
              } max-h-[88vh] flex flex-col rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200/90 dark:border-slate-800 animate-in zoom-in-[0.98] duration-200 overflow-hidden transition-all`}
              onClick={(e) => e.stopPropagation()}
            >
              {isChoosingRequestType ? (
                <>
                  {/* Step 1 Header: Clean Deliverables Intake */}
                  <div className="px-6 py-4.5 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                          Select Deliverables
                        </h3>
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-semibold border border-slate-200 dark:border-slate-700">
                          {draftGroup.programName}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Choose the services required for this product in {draftGroup.customer} ({draftGroup.programYear}).
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsAddProductModalOpen(false)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Close (Esc)"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  {/* Step 1 Body: 4 Clean Option Cards */}
                  <div className="p-6 overflow-y-auto flex-1 space-y-4">
                    {/* 4 Cards Grid */}
                    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                      {REQUEST_TYPE_OPTIONS.map((opt) => {
                        const isSelected = selectedRequestTypes.includes(opt.id);
                        const isDesignTrack = selectedRequestTypes.includes("design") || selectedRequestTypes.includes("mockup");
                        const isSampleTrack = selectedRequestTypes.includes("sample") || selectedRequestTypes.includes("costing");
                        const isMuted =
                          (isDesignTrack && (opt.id === "sample" || opt.id === "costing")) ||
                          (isSampleTrack && (opt.id === "design" || opt.id === "mockup"));

                        const Icon = opt.icon;

                        return (
                          <button
                            key={opt.id}
                            type="button"
                            aria-pressed={isSelected}
                            onClick={() => toggleRequestType(opt.id)}
                            className={`group relative flex min-h-[88px] items-center gap-3.5 rounded-2xl border p-4 text-left transition-all duration-150 focus:outline-none focus:ring-4 focus:ring-blue-500/10 cursor-pointer select-none ${
                              isSelected
                                ? "border-blue-500 bg-blue-50/70 shadow-sm shadow-blue-500/10 dark:border-blue-600 dark:bg-blue-950/40"
                                : isMuted
                                ? "border-slate-200/60 bg-slate-50/40 dark:border-slate-800/60 dark:bg-slate-900/30 opacity-70 hover:opacity-100 hover:border-slate-300"
                                : "border-slate-200 bg-white hover:border-blue-200 hover:bg-slate-50/80 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-900 dark:hover:bg-slate-800/60"
                            }`}
                          >
                            {/* Card Icon */}
                            <div
                              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-all ${
                                isSelected
                                  ? "bg-blue-600 text-white shadow-sm shadow-blue-500/25"
                                  : "bg-slate-100 text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600 dark:bg-slate-800 dark:text-slate-400 dark:group-hover:bg-slate-700"
                              }`}
                            >
                              <Icon size={20} className="stroke-[2.2]" />
                            </div>

                            {/* Card Title & Description */}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <span className="block text-sm font-bold tracking-tight text-slate-900 dark:text-slate-100">
                                  {opt.label}
                                </span>
                                {opt.id === "mockup" && isSelected && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
                                    + Design
                                  </span>
                                )}
                              </div>
                              <span className="mt-0.5 block text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                                {opt.description}
                              </span>
                            </div>

                            {/* Styled Checkbox */}
                            <span
                              className={`flex h-5.5 w-5.5 shrink-0 items-center justify-center rounded-full border transition-all ${
                                isSelected
                                  ? "border-blue-600 bg-blue-600 text-white shadow-xs"
                                  : "border-slate-300 bg-slate-50 group-hover:border-slate-400 dark:border-slate-600 dark:bg-slate-800"
                              }`}
                            >
                              {isSelected && <Check size={12} strokeWidth={3} />}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Step 1 Footer Controls */}
                  <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 px-5 py-3.5 bg-slate-50/50 dark:bg-slate-800/40">
                    <button
                      type="button"
                      onClick={() => setIsAddProductModalOpen(false)}
                      className="h-9 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>

                    <div className="flex items-center gap-2">
                      {selectedRequestTypes.length === 0 ? (
                        <button
                          type="button"
                          disabled
                          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-slate-100 px-5 text-xs font-semibold text-slate-400 cursor-not-allowed dark:bg-slate-800 dark:text-slate-600"
                        >
                          <span>Select an option</span>
                          <ArrowRight size={13} />
                        </button>
                      ) : selectedRequestTypes.length === 1 && selectedRequestTypes[0] === "design" ? (
                        <button
                          type="button"
                          onClick={handleContinueFromRequestType}
                          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 px-5 text-xs font-bold text-white shadow-sm shadow-blue-500/20 transition-all cursor-pointer active:scale-[0.98]"
                        >
                          <span>Continue to Design Request</span>
                          <ArrowRight size={13} className="stroke-[2.5]" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleContinueFromRequestType}
                          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 px-5 text-xs font-bold text-white shadow-sm shadow-blue-500/20 transition-all cursor-pointer active:scale-[0.98]"
                        >
                          <span>Continue to Product Search</span>
                          <ArrowRight size={13} className="stroke-[2.5]" />
                        </button>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Step 2 Header: Back button, deliverable tags & search title */}
                  <div className="px-5 py-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        type="button"
                        onClick={() => setIsChoosingRequestType(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer shrink-0"
                      >
                        <ArrowLeft size={13} />
                        <span>Change types</span>
                      </button>

                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                            Search & Configure Product
                          </h3>
                          <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-semibold border border-indigo-200/80 dark:border-indigo-800/60 shadow-2xs">
                            {draftGroup.programName}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs text-slate-500 dark:text-slate-400 mr-1">Types:</span>
                          {selectedRequestTypes.map((t) => {
                            const opt = REQUEST_TYPE_OPTIONS.find((o) => o.id === t);
                            if (!opt) return null;
                            return (
                              <span
                                key={t}
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${opt.badgeBg}`}
                              >
                                {opt.label}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsAddProductModalOpen(false)}
                      className="h-8.5 w-8.5 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-700/60 transition-colors cursor-pointer shrink-0"
                      title="Close dialog"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  {/* Step 2 Body: Unified Product Lookup */}
                  <div className="p-4 sm:p-5 overflow-y-auto flex-1 relative">
                    {isAddingNewProduct && (
                      <div className="absolute inset-0 z-20 bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xs flex items-center justify-center">
                        <div className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                          <RefreshCw size={14} className="animate-spin" />
                          <span>Adding product to program draft...</span>
                        </div>
                      </div>
                    )}
                    <UnifiedProductLookup
                      bindingHierarchy={bindingHierarchy}
                      selectedBinding1={selectedBinding1}
                      selectedBinding2={selectedBinding2}
                      onBinding1Change={handleBinding1Change}
                      onBinding2Change={handleBinding2Change}
                      isSearchingBinding={isSearchingBinding}
                      query={materialQuery}
                      onQueryChange={setMaterialQuery}
                      onSearch={handleSearchMaterial}
                      isLoading={isSearchingMaterial}
                      hasSearched={hasSearchedMaterial || !!selectedBinding1}
                      results={combinedSearchResults}
                      onAddProduct={(prod: ProductSearchResult) =>
                        handleAddNewProductToDraft(
                          prod,
                          selectedBinding1 || prod.id === 0 ? "binding" : "material_code"
                        )
                      }
                      onPreviewSpecs={(prod: ProductSearchResult) => handlePreviewCatalogSpecs(prod)}
                      onClose={() => setIsAddProductModalOpen(false)}
                      addedProductCodes={products.map((p) => p.materialCode)}
                    />
                  </div>
                </>
              )}
            </div>
          </div>,
          document.body
        )}

      {/* Release to SMT Confirmation Modal */}
      {isReleaseModalOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm animate-in fade-in duration-150"
            onClick={() => !isReleasing && setIsReleaseModalOpen(false)}
          >
            <div
              className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in zoom-in-[0.98] duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center shrink-0 shadow-sm shadow-emerald-600/10">
                  <Sparkles size={22} />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                    Release to Creative / SMT
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Submit {releaseTargetIds.length} {releaseTargetIds.length === 1 ? "product" : "products"} to active workflow?
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Customer:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                    {draftGroup.customer}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Program:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {draftGroup.programName} ({draftGroup.programYear})
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Products Included:</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">
                    {releaseTargetIds.length} {releaseTargetIds.length === 1 ? "Product" : "Products"}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  disabled={isReleasing}
                  onClick={() => setIsReleaseModalOpen(false)}
                  className="h-9 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isReleasing}
                  onClick={handleConfirmReleaseToSMT}
                  className="h-9 px-4.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50 active:scale-[0.98]"
                >
                  {isReleasing ? (
                    <>
                      <RefreshCw size={13} className="animate-spin" />
                      <span>Releasing...</span>
                    </>
                  ) : (
                    <>
                      <Send size={13} />
                      <span>Confirm & Release</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Bulk Delete Confirmation Modal */}
      {isBulkDeleteModalOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm animate-in fade-in duration-150"
            onClick={() => !isBulkDeleting && setIsBulkDeleteModalOpen(false)}
          >
            <div
              className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in zoom-in-[0.98] duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 flex items-center justify-center shrink-0 shadow-sm shadow-rose-600/10">
                  <Trash2 size={22} className="stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                    Remove Selected Products
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Remove {selectedProductIds.length} selected {selectedProductIds.length === 1 ? "product" : "products"} from this draft?
                  </p>
                </div>
              </div>

              {/* Summary of items to be removed */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Program Package:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {draftGroup.programName}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Removing:</span>
                  <span className="font-bold text-rose-600 dark:text-rose-400">
                    {selectedProductIds.length} {selectedProductIds.length === 1 ? "Product row" : "Product rows"}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/60 text-xs text-rose-800 dark:text-rose-300 flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-600 dark:bg-rose-400 mt-1.5 shrink-0" />
                <p>
                  This action cannot be undone. Technical specifications customized for these products will be permanently removed.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  disabled={isBulkDeleting}
                  onClick={() => setIsBulkDeleteModalOpen(false)}
                  className="h-9 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isBulkDeleting}
                  onClick={handleConfirmBulkDelete}
                  className="h-9 px-4.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm shadow-rose-600/20 transition-all cursor-pointer disabled:opacity-50 active:scale-[0.98]"
                >
                  {isBulkDeleting ? (
                    <>
                      <RefreshCw size={13} className="animate-spin" />
                      <span>Removing...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 size={13} />
                      <span>Yes, Remove Selected</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
