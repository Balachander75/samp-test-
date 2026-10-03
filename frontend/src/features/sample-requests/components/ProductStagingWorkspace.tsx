import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ChevronRight,
  Plus,
  Trash2,
  Copy,
  Check,
  CheckCircle2,
  X,
  AlertCircle,
  Lock,
  Layers,
  Image as LucideImage,
  ImageIcon,
  UploadCloud,
  Link2,
  ExternalLink,
  Search,
  Info,
  Eye,
  Sparkles,
  Calendar,
  Tag,
  Users,
  FileText,
  Clock,
  BookOpen,
  Hash,
  Package,
} from "lucide-react";
import { UserProfile } from "@/features/auth";
import {
  createSampleRequestApi,
  createDesignRequestApi,
  searchProductsByMaterialApi,
  searchProductsByBindingApi,
  fetchBindingHierarchyApi,
} from "../api";
import { CreateSampleRequestForm, ProductSearchResult, BindingHierarchyResponse } from "../types";
import { useMasterData } from "../hooks/useMasterData";
import { OperationalDatePicker } from "@/components/erp";
import { getNextWorkingDate } from "@/lib/holidayUtils";
import { getCurrentBusinessYear } from "@/lib/businessYear";
import { autoSaveStagedProductsToDraft } from "../utils/autoSaveDraft";

export type DeliverableScopeId = "design" | "mockup" | "sample" | "costing";

interface DeliverableDefinition {
  id: DeliverableScopeId;
  label: string;
}

const DELIVERABLES: DeliverableDefinition[] = [
  { id: "design", label: "Design" },
  { id: "mockup", label: "Mockup" },
  { id: "sample", label: "Sampling" },
  { id: "costing", label: "Costing" },
];

export interface StagedProductItem {
  id: string;
  materialCode: string;
  productDescription: string;
  scopes: DeliverableScopeId[];
  timestamp: string;
  stagedDate?: string;
  designMetadata?: {
    numberOfDesigns: number;
    designRequiredDate: string;
    trend: string;
    targetAudience: string;
    remarks?: string;
    images: Array<{ id: string; url: string; name: string; size?: string }>;
    webLinks: string[];
    referenceImage: string;
  };
  samplingMetadata?: {
    sampleType: "full" | "partial";
    partialRequirements?: string;
    searchMode: "material_code" | "binding";
    sourceSampleId?: number;
    sourceSrNumber?: string;
    selectedMaterialCode?: string;
    bindingType1?: string;
    bindingType2?: string;
    customerReference?: string;
    targetPlant?: string;
  };
}

export interface ProductStagingWorkspaceProps {
  user?: UserProfile | null;
}

const cleanPlantName = (plant?: string): string => {
  if (!plant) return "Khaniwade";
  return plant.replace(/^\d{4}-?\s*/, "").trim() || "Khaniwade";
};

export const ProductStagingWorkspace: React.FC<ProductStagingWorkspaceProps> = ({ user }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    customers,
    plants,
    error: masterDataError,
  } = useMasterData();

  // Load Program Setup from location state or cached session
  const [programContext, setProgramContext] = useState(() => {
    const state = location.state as {
      customer?: string;
      programName?: string;
      programYear?: string;
      targetPlant?: string;
    } | null;

    if (state?.customer || state?.programName) {
      return {
        customer: state.customer || "",
        programName: state.programName || "",
        programYear: state.programYear || getCurrentBusinessYear(),
        targetPlant: state.targetPlant || "",
      };
    }

    try {
      const cached = sessionStorage.getItem("samp_active_program_form");
      if (cached) {
        const parsed = JSON.parse(cached);
        return {
          customer: parsed.customer || "",
          programName: parsed.programName || "",
          programYear: parsed.programYear || getCurrentBusinessYear(),
          targetPlant: parsed.targetPlant || "",
        };
      }
    } catch {
      // Fallback
    }

    return {
      customer: "",
      programName: "",
      programYear: getCurrentBusinessYear(),
      targetPlant: "",
    };
  });

  // Staged Products in current batch (persisted across page reloads)
  const [stagedProducts, setStagedProducts] = useState<StagedProductItem[]>(() => {
    try {
      const cached = sessionStorage.getItem("samp_active_staged_products");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // Fallback
    }
    return [];
  });

  // Sync stagedProducts to sessionStorage whenever updated
  useEffect(() => {
    sessionStorage.setItem("samp_active_staged_products", JSON.stringify(stagedProducts));
  }, [stagedProducts]);

  // Add Product Modal & Flow State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addModalStep, setAddModalStep] = useState<"scopes" | "design_brief" | "sampling_config">("scopes");
  const [selectedScopes, setSelectedScopes] = useState<DeliverableScopeId[]>([]);

  // ONLY THE DECIDED FIELDS FOR DESIGN:
  // 1. Product Description (MANDATORY)
  // 2. Number of Designs (MANDATORY)
  // 3. Design Required Date (MANDATORY)
  // 4. Trend / Theme (OPTIONAL)
  // 5. Target Audience (OPTIONAL)
  // 6. Reference Attachments: Image upload or link (both options)
  const [designDesc, setDesignDesc] = useState("");
  const [designCount, setDesignCount] = useState<number | "">("");
  const [designDueDate, setDesignDueDate] = useState(() => getNextWorkingDate(new Date(), 7));
  const [designTrend, setDesignTrend] = useState("");
  const [designAudience, setDesignAudience] = useState("");
  const [designRemarks, setDesignRemarks] = useState("");

  // Reference Attachments (Up to 2 images and 1 link)
  const [uploadedImages, setUploadedImages] = useState<Array<{ id: string; url: string; name: string; size?: string }>>([]);
  const [webLinks, setWebLinks] = useState<string[]>([]);
  const [linkInput, setLinkInput] = useState<string>("");
  const [mediaTab, setMediaTab] = useState<"files" | "links">("files");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  // SAMPLING CONFIGURATION STATE (Option 03 Sampling - SAMP Tech Lab)
  // Question 1: Sample Type (Full Sample vs Partial Sample)
  const [sampleType, setSampleType] = useState<"full" | "partial">("full");
  const [partialRequirements, setPartialRequirements] = useState("");

  // Question 2: Sample Source & Selection Method
  const [samplingSearchMode, setSamplingSearchMode] = useState<"material_code" | "binding">("material_code");

  // Mode A: Search by Material Code
  const [materialSearchQuery, setMaterialSearchQuery] = useState("");
  const [materialSearchResults, setMaterialSearchResults] = useState<ProductSearchResult[]>([]);
  const [isSearchingMaterial, setIsSearchingMaterial] = useState(false);
  const [selectedDbSample, setSelectedDbSample] = useState<ProductSearchResult | null>(null);

  // Mode B: Search by Binding (Binding 1 & Binding 2)
  const [bindingHierarchy, setBindingHierarchy] = useState<BindingHierarchyResponse>({
    binding1_options: [],
    hierarchy: {},
  });
  const [selectedBinding1, setSelectedBinding1] = useState("");
  const [selectedBinding2, setSelectedBinding2] = useState("");
  const [bindingSearchResults, setBindingSearchResults] = useState<ProductSearchResult[]>([]);
  const [isSearchingBinding, setIsSearchingBinding] = useState(false);
  const [isLoadingBindingData, setIsLoadingBindingData] = useState(false);

  // Staged product description for sampling item
  const [samplingDescription, setSamplingDescription] = useState("");

  // Toast / Notifications
  const [toastMsg, setToastMsg] = useState<{ text: string; tone: "success" | "error" } | null>(null);
  const [isSubmittingAll, setIsSubmittingAll] = useState(false);
  const [inspectingProduct, setInspectingProduct] = useState<StagedProductItem | null>(null);

  // Auto-save refs to guarantee zero data loss if user navigates away or switches tabs
  const hasAutoSavedRef = useRef(false);
  const stagedProductsRef = useRef(stagedProducts);
  stagedProductsRef.current = stagedProducts;
  const programContextRef = useRef(programContext);
  programContextRef.current = programContext;

  const showToast = (text: string, tone: "success" | "error" = "success") => {
    setToastMsg({ text, tone });
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Sync to sessionStorage
  useEffect(() => {
    sessionStorage.setItem("samp_active_program_form", JSON.stringify(programContext));
  }, [programContext]);

  // If user navigates away / unmounts with staged products that haven't been saved yet, auto-save to draft
  useEffect(() => {
    return () => {
      if (!hasAutoSavedRef.current && stagedProductsRef.current.length > 0) {
        const cached = sessionStorage.getItem("samp_active_staged_products");
        if (cached) {
          sessionStorage.removeItem("samp_active_staged_products");
          sessionStorage.removeItem("samp_active_program_form");
          hasAutoSavedRef.current = true;
          autoSaveStagedProductsToDraft(
            stagedProductsRef.current,
            programContextRef.current,
            user
          ).then((res) => {
            if (res.success) {
              window.dispatchEvent(
                new CustomEvent("app:show-toast", {
                  detail: {
                    message: `✓ Auto-saved ${res.count} staged product(s) for "${res.programName || res.customer}" directly to Drafts.`,
                    tone: "success",
                  },
                })
              );
            }
          }).catch((err) => {
            console.error("Unmount auto-save draft error:", err);
          });
        }
      }
    };
  }, [user]);

  // Master data fallback only when context is empty
  useEffect(() => {
    if (!customers.length || !plants.length) return;
    setProgramContext((prev) => ({
      ...prev,
      customer: prev.customer || (customers[0]?.name ?? ""),
      targetPlant: prev.targetPlant || (plants[0]?.name ?? ""),
    }));
  }, [customers, plants]);

  useEffect(() => {
    if (masterDataError) showToast(masterDataError, "error");
  }, [masterDataError]);

  const resetSamplingState = () => {
    setSampleType("full");
    setPartialRequirements("");
    setSamplingSearchMode("material_code");
    setMaterialSearchQuery("");
    setSelectedDbSample(null);
    setSelectedBinding1("");
    setSelectedBinding2("");
    setSamplingDescription("");
    setBindingSearchResults([]);
    setModalError(null);
  };

  // Open modal starting in Step 1 (Deliverables Selection)
  const handleOpenAddProduct = () => {
    setAddModalStep("scopes");
    setSelectedScopes([]);
    setDesignDesc("");
    setDesignCount("");
    setDesignDueDate(getNextWorkingDate(new Date(), 7));
    setDesignTrend("");
    setDesignAudience("");
    setDesignRemarks("");
    setUploadedImages([]);
    setWebLinks([]);
    setLinkInput("");
    setMediaTab("files");
    setModalError(null);
    resetSamplingState();
    setIsAddModalOpen(true);
  };

  // Fetch binding hierarchy and initial database materials on demand
  useEffect(() => {
    if (isAddModalOpen && (addModalStep === "sampling_config" || selectedScopes.includes("sample"))) {
      if (bindingHierarchy.binding1_options.length === 0) {
        setIsLoadingBindingData(true);
        fetchBindingHierarchyApi()
          .then((res) => {
            setBindingHierarchy(res);
          })
          .catch((err) => console.error("Failed to fetch binding hierarchy:", err))
          .finally(() => setIsLoadingBindingData(false));
      }
      if (materialSearchResults.length === 0) {
        setIsSearchingMaterial(true);
        searchProductsByMaterialApi()
          .then((res) => setMaterialSearchResults(res.slice(0, 20)))
          .catch((err) => console.error("Failed to load initial material samples:", err))
          .finally(() => setIsSearchingMaterial(false));
      }
    }
  }, [isAddModalOpen, addModalStep, selectedScopes]);

  // Debounced live material code search
  useEffect(() => {
    if (addModalStep !== "sampling_config" || samplingSearchMode !== "material_code") return;
    const timer = setTimeout(() => {
      setIsSearchingMaterial(true);
      searchProductsByMaterialApi(materialSearchQuery)
        .then((res) => setMaterialSearchResults(res.slice(0, 30)))
        .catch((err) => console.error("Search material error:", err))
        .finally(() => setIsSearchingMaterial(false));
    }, 250);
    return () => clearTimeout(timer);
  }, [materialSearchQuery, addModalStep, samplingSearchMode]);

  // Dynamic filter for Binding 1 & Binding 2
  useEffect(() => {
    if (addModalStep !== "sampling_config" || samplingSearchMode !== "binding") return;
    if (!selectedBinding1) {
      setBindingSearchResults([]);
      return;
    }
    setIsSearchingBinding(true);
    searchProductsByBindingApi(selectedBinding1, selectedBinding2)
      .then((res) => setBindingSearchResults(res.slice(0, 50)))
      .catch((err) => console.error("Search binding error:", err))
      .finally(() => setIsSearchingBinding(false));
  }, [selectedBinding1, selectedBinding2, addModalStep, samplingSearchMode]);

  const handleSelectDbSample = (item: ProductSearchResult) => {
    setSelectedDbSample(item);
    setSamplingDescription(item.product_description || "");
    if (item.binding_type_1) setSelectedBinding1(item.binding_type_1);
    if (item.binding_type_2) setSelectedBinding2(item.binding_type_2);
  };

  // Compress image file to JPEG before storing
  const compressImageFile = (file: File, maxDim = 800, quality = 0.5): Promise<{ url: string; sizeKb: number }> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new window.Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const dataUrl = canvas.toDataURL("image/jpeg", quality);
            const sizeKb = Math.max(1, Math.round((dataUrl.length * 3) / 4 / 1024));
            resolve({ url: dataUrl, sizeKb });
          } else {
            const rawUrl = (e.target?.result as string) || "";
            resolve({ url: rawUrl, sizeKb: Math.round(file.size / 1024) });
          }
        };
        img.onerror = () => {
          const rawUrl = (e.target?.result as string) || "";
          resolve({ url: rawUrl, sizeKb: Math.round(file.size / 1024) });
        };
        img.src = e.target?.result as string;
      };
      reader.onerror = () => resolve({ url: "", sizeKb: 0 });
      reader.readAsDataURL(file);
    });
  };

  // Reference Image Upload Handler
  const handleMultipleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const remainingSlots = 2 - uploadedImages.length;
    if (remainingSlots <= 0) {
      setModalError("Maximum 2 images are allowed.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    const filesToProcess = files.slice(0, remainingSlots);
    if (files.length > remainingSlots) {
      setModalError(`Only ${remainingSlots} more image slot(s) available. Added ${remainingSlots} image(s).`);
    } else {
      setModalError(null);
    }

    for (const file of filesToProcess) {
      const { url, sizeKb } = await compressImageFile(file);
      if (!url) continue;
      setUploadedImages((prev) => {
        if (prev.length >= 2) return prev;
        return [
          ...prev,
          {
            id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            url,
            name: file.name,
            size: `${sizeKb} KB`,
          },
        ];
      });
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemoveImage = (id: string) => {
    setUploadedImages((prev) => prev.filter((img) => img.id !== id));
  };

  // Reference Link Handler
  const handleAddWebLink = (e: React.FormEvent | React.MouseEvent) => {
    e.preventDefault();
    const trimmed = linkInput.trim();
    if (!trimmed) return;
    if (webLinks.length >= 1) {
      setModalError("Maximum 1 reference link is allowed.");
      return;
    }
    const formatted = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    if (webLinks.includes(formatted)) {
      setModalError("This web link has already been added.");
      return;
    }
    setWebLinks((prev) => [...prev, formatted]);
    setLinkInput("");
    setModalError(null);
  };

  const handleRemoveWebLink = (idx: number) => {
    setWebLinks((prev) => prev.filter((_, i) => i !== idx));
  };

  /**
   * BUSINESS RULES:
   * 1. Design can ONLY be chosen alone: ["design"] or paired with CAD Mockup: ["design", "mockup"].
   *    Design CANNOT be combined with Physical Prototype (Sampling) or BOM Costing.
   * 2. Mockup, Sampling, and Costing can be chosen together or alone in ANY combination:
   *    ["mockup"], ["sample"], ["costing"],
   *    ["mockup", "sample"], ["mockup", "costing"], ["sample", "costing"],
   *    ["mockup", "sample", "costing"].
   * 3. Users can freely uncheck any selected scope down to empty [].
   */
  const isScopeDisabled = (scopeId: DeliverableScopeId): boolean => {
    // If it's already selected, user can always toggle it OFF
    if (selectedScopes.includes(scopeId)) return false;

    const hasDesign = selectedScopes.includes("design");
    const hasSample = selectedScopes.includes("sample");
    const hasCosting = selectedScopes.includes("costing");

    // Design cannot be selected if Sample or Costing is currently active
    if (scopeId === "design") {
      return hasSample || hasCosting;
    }

    // Sample and Costing cannot be selected if Design is currently active
    if (scopeId === "sample" || scopeId === "costing") {
      return hasDesign;
    }

    // Mockup can always be combined with Design, or with Sample/Costing
    return false;
  };

  const handleToggleScope = (scopeId: DeliverableScopeId) => {
    setSelectedScopes((prev) => {
      // 1. UNCHECK / REMOVE
      if (prev.includes(scopeId)) {
        return prev.filter((s) => s !== scopeId);
      }

      // 2. CHECK / ADD - validate compatibility
      if (scopeId === "design" && (prev.includes("sample") || prev.includes("costing"))) {
        return prev;
      }
      if ((scopeId === "sample" || scopeId === "costing") && prev.includes("design")) {
        return prev;
      }

      // Maintain consistent pipeline sequence: 01 Design -> 02 Mockup -> 03 Sample -> 04 Costing
      const pipelineOrder: DeliverableScopeId[] = ["design", "mockup", "sample", "costing"];
      const next = [...prev, scopeId];
      return pipelineOrder.filter((id) => next.includes(id));
    });
  };

  // Step 1: Proceed from Deliverables Scopes to next step
  const handleProceedFromScopes = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedScopes.length === 0) {
      showToast("Please select at least one deliverable scope.", "error");
      return;
    }

    // If Design is selected, proceed to dedicated Design Brief page
    if (selectedScopes.includes("design")) {
      setAddModalStep("design_brief");
      setModalError(null);
      return;
    }

    // If Sampling is selected, proceed to dedicated Sampling Configuration page
    if (selectedScopes.includes("sample")) {
      setAddModalStep("sampling_config");
      setModalError(null);
      return;
    }

    // Otherwise, stage non-design product directly
    const nextCount = stagedProducts.length + 1;
    const plantCode = programContext.targetPlant
      ? programContext.targetPlant.split(/[-–\s]/)[0]
      : "1505";
    const randomNum = Math.floor(1000 + Math.random() * 9000);

    const nextItem: StagedProductItem = {
      id: `staged-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      materialCode: `NB-${plantCode}-${randomNum}`,
      productDescription: `Product Spec #${nextCount}`,
      scopes: [...selectedScopes],
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setStagedProducts((prev) => [...prev, nextItem]);
    setIsAddModalOpen(false);
    showToast(`Added "${nextItem.productDescription}" to batch.`);
  };

  // Step 2: Submit Design Brief and Stage Product
  const handleStageDesignBrief = (e: React.FormEvent) => {
    e.preventDefault();

    if (!designDesc.trim()) {
      setModalError("Product description is mandatory.");
      showToast("Product description is required.", "error");
      return;
    }
    if (designCount === "" || Number(designCount) < 1) {
      setModalError("Please enter the number of designs (minimum 1).");
      showToast("Number of designs is required.", "error");
      return;
    }
    if (!designDueDate.trim()) {
      setModalError("Design required date is mandatory.");
      showToast("Design required date is mandatory.", "error");
      return;
    }

    const plantCode = programContext.targetPlant
      ? programContext.targetPlant.split(/[-–\s]/)[0]
      : "1505";
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const generatedMaterialCode = `DSG-${plantCode}-${randomNum}`;

    const now = new Date();
    const formattedDate = now.toISOString().split("T")[0];
    const formattedTime = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const nextItem: StagedProductItem = {
      id: `staged-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      materialCode: generatedMaterialCode,
      productDescription: designDesc.trim(),
      scopes: [...selectedScopes],
      stagedDate: formattedDate,
      timestamp: formattedTime,
      designMetadata: {
        numberOfDesigns: Number(designCount) || 1,
        designRequiredDate: designDueDate.trim(),
        trend: designTrend.trim(),
        targetAudience: designAudience.trim(),
        remarks: designRemarks.trim(),
        images: uploadedImages,
        webLinks: webLinks,
        referenceImage: uploadedImages[0]?.url || webLinks[0] || "",
      },
    };

    setStagedProducts((prev) => [...prev, nextItem]);
    setIsAddModalOpen(false);
    showToast(`Added "${nextItem.productDescription}" to batch.`);
  };

  // Step 3: Submit Sampling Configuration and Stage Product
  const handleStageSamplingProduct = (e: React.FormEvent) => {
    e.preventDefault();

    if (sampleType === "partial" && !partialRequirements.trim()) {
      setModalError("Partial sample details are mandatory.");
      showToast("Partial sample details are required.", "error");
      return;
    }

    const desc =
      samplingDescription.trim() ||
      selectedDbSample?.product_description ||
      (selectedBinding1
        ? `${selectedBinding1} Notebook${selectedBinding2 ? ` (${selectedBinding2})` : ""}`
        : "");

    if (!desc) {
      setModalError("Please select a sample from the database or enter a product description.");
      showToast("Please choose a sample or enter product description.", "error");
      return;
    }

    const matCode =
      selectedDbSample?.material_code ||
      (programContext.targetPlant
        ? `SMP-${programContext.targetPlant.split(/[-–\s]/)[0]}-${Math.floor(1000 + Math.random() * 9000)}`
        : `SMP-1505-${Math.floor(1000 + Math.random() * 9000)}`);

    const now = new Date();
    const formattedDate = now.toISOString().split("T")[0];
    const formattedTime = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const nextItem: StagedProductItem = {
      id: `staged-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      materialCode: matCode,
      productDescription: desc,
      scopes: [...selectedScopes],
      stagedDate: formattedDate,
      timestamp: formattedTime,
      samplingMetadata: {
        sampleType,
        partialRequirements: partialRequirements.trim() || undefined,
        searchMode: samplingSearchMode,
        sourceSampleId: selectedDbSample?.id,
        sourceSrNumber: selectedDbSample?.sr_number,
        selectedMaterialCode: selectedDbSample?.material_code,
        bindingType1: selectedBinding1 || selectedDbSample?.binding_type_1,
        bindingType2: selectedBinding2 || selectedDbSample?.binding_type_2,
        customerReference: selectedDbSample?.customer,
        targetPlant: selectedDbSample?.target_plant,
      },
    };

    setStagedProducts((prev) => [...prev, nextItem]);
    setIsAddModalOpen(false);
    resetSamplingState();
    showToast(
      `Added Sampling (${sampleType === "full" ? "Full Sample" : "Partial Sample"}): "${nextItem.productDescription}" to batch.`
    );
  };

  const handleRemoveStagedItem = (id: string) => {
    setStagedProducts((prev) => prev.filter((item) => item.id !== id));
  };

  const handleDuplicateStagedItem = (item: StagedProductItem) => {
    const plantCode = programContext.targetPlant
      ? programContext.targetPlant.split(/[-–\s]/)[0]
      : "1505";
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const now = new Date();

    const clone: StagedProductItem = {
      ...item,
      id: `staged-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      materialCode: item.scopes.includes("design") && item.scopes.length === 1
        ? `DSG-${plantCode}-${randomNum}`
        : `NB-${plantCode}-${randomNum}`,
      productDescription: `${item.productDescription} (Copy)`,
      stagedDate: now.toISOString().split("T")[0],
      timestamp: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setStagedProducts((prev) => [...prev, clone]);
    showToast(`Duplicated "${item.productDescription}".`);
  };

  // Return to Sample Requests desk with automatic draft preservation if items staged
  const handleReturnToDesk = async () => {
    if (stagedProducts.length > 0) {
      hasAutoSavedRef.current = true;
      sessionStorage.removeItem("samp_active_staged_products");
      sessionStorage.removeItem("samp_active_program_form");
      showToast(`Auto-saving ${stagedProducts.length} product(s) directly to Drafts...`);
      autoSaveStagedProductsToDraft(stagedProducts, programContext, user).then((res) => {
        if (res.success) {
          window.dispatchEvent(
            new CustomEvent("app:show-toast", {
              detail: {
                message: `✓ Auto-saved ${res.count} staged product(s) for "${res.programName || res.customer}" directly to Drafts.`,
                tone: "success",
              },
            })
          );
        }
      });
      navigate("/sample-requests", { state: { refresh: Date.now(), stage: "draft" } });
      return;
    }
    navigate("/sample-requests");
  };

  // Submit all staged products into Sample Requests & Design pipelines
  const handleSubmitBatch = async () => {
    if (stagedProducts.length === 0) return;
    if (!programContext.customer || !programContext.targetPlant) {
      showToast("Customer and manufacturing plant are required.", "error");
      return;
    }
    setIsSubmittingAll(true);
    hasAutoSavedRef.current = true;

    try {
      sessionStorage.removeItem("samp_active_program_form");
      sessionStorage.removeItem("samp_active_staged_products");

      const res = await autoSaveStagedProductsToDraft(stagedProducts, programContext, user);
      if (res.success) {
        showToast(`Successfully registered ${res.count} request(s) into Draft queue! Returning to desk...`);
        setTimeout(() => {
          navigate("/sample-requests", { state: { refresh: Date.now(), stage: "draft" } });
        }, 700);
      } else {
        throw new Error("Draft save failed");
      }
    } catch {
      showToast(`The staged request(s) could not be saved to the backend. Returning to desk...`, "error");
      setTimeout(() => {
        navigate("/sample-requests");
      }, 800);
    } finally {
      setIsSubmittingAll(false);
    }
  };



  const totalAttachments = uploadedImages.length + webLinks.length;

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#f8fafc] dark:bg-[#08090d] text-zinc-900 dark:text-zinc-100 overflow-y-auto">
      {/* 1. Master Command Header */}
      <header className="border-b border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-[#0f1118] px-5 sm:px-8 py-3 sticky top-0 z-20 shadow-2xs backdrop-blur-md">
        <div className="w-full flex items-center justify-between gap-4">
          {/* Left: Back Arrow & Breadcrumb */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={handleReturnToDesk}
              className="p-1.5 -ml-1 rounded-md text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer shrink-0"
              title="Return to Sample Requests Desk"
              aria-label="Return to Sample Requests Desk"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">
                <span
                  onClick={handleReturnToDesk}
                  className="hover:text-brand-600 dark:hover:text-brand-400 cursor-pointer transition-colors truncate"
                >
                  Marketing Desk
                </span>
                <ChevronRight className="w-3 h-3 text-zinc-400 dark:text-zinc-600 shrink-0" />
                <span>Intake</span>
                <ChevronRight className="w-3 h-3 text-zinc-400 dark:text-zinc-600 shrink-0" />
                <span className="text-zinc-900 dark:text-zinc-100 font-medium truncate">Product Staging</span>
              </div>
              <h1 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50 tracking-tight truncate mt-0.5">
                Marketing Request Staging Workspace
              </h1>
            </div>
          </div>

          {/* Right: Master Command Actions */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleOpenAddProduct}
              className="h-8 px-3.5 rounded-md bg-brand-600 hover:bg-brand-500 active:bg-brand-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer tracking-tight"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Add Product</span>
            </button>

            {stagedProducts.length > 0 && (
              <button
                type="button"
                onClick={handleSubmitBatch}
                disabled={isSubmittingAll}
                className="h-8 px-3.5 rounded-md bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white font-semibold text-xs shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer tracking-tight"
              >
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Submit Batch ({stagedProducts.length})</span>
              </button>
            )}

            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700/80 font-mono text-[11px]">
              <span>Staged: {stagedProducts.length}</span>
            </span>
          </div>
        </div>
      </header>

      {/* Main Container - Full-size edge-to-edge for multi-product bulk staging */}
      <div className="flex-1 w-full px-5 sm:px-8 py-4 space-y-4">
        {/* Toast Banner */}
        {toastMsg && (
          <div
            className={`px-4 py-3 rounded-lg border text-xs font-medium flex items-center justify-between animate-smooth-toast ${
              toastMsg.tone === "success"
                ? "border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300"
                : "border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300"
            }`}
          >
            <div className="flex items-center gap-2">
              {toastMsg.tone === "success" ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              )}
              <span>{toastMsg.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setToastMsg(null)}
              className="p-1 hover:opacity-75 transition-opacity cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* 2. Program Context Strip (Clean, 1-line metadata) */}
        <div className="rounded-lg border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-[#0f1118] px-4 py-2.5 shadow-2xs">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-mono text-zinc-400 dark:text-zinc-500">Customer:</span>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                {programContext.customer || "Unspecified"}
              </span>
            </div>

            <span className="text-zinc-200 dark:text-zinc-800 hidden sm:inline">|</span>

            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-mono text-zinc-400 dark:text-zinc-500">Program:</span>
              <span className="font-medium text-brand-600 dark:text-brand-400">
                {programContext.programName || "General Program"}
              </span>
            </div>

            <span className="text-zinc-200 dark:text-zinc-800 hidden sm:inline">|</span>

            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-mono text-zinc-400 dark:text-zinc-500">Season:</span>
              <span className="font-mono font-medium text-zinc-800 dark:text-zinc-200">
                {programContext.programYear}
              </span>
            </div>

            <span className="text-zinc-200 dark:text-zinc-800 hidden sm:inline">|</span>

            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-mono text-zinc-400 dark:text-zinc-500">Plant:</span>
              <span className="font-mono font-medium text-zinc-800 dark:text-zinc-200">
                {cleanPlantName(programContext.targetPlant)}
              </span>
            </div>
          </div>
        </div>

        {/* 3. Operational Toolbar - Clean section title, no duplicate buttons */}
        <div className="flex items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 font-mono">
              Staged Products Queue
            </h2>
            <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
              {stagedProducts.length} Specification{stagedProducts.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {/* 4. Staged Products Queue & Table (or Clean Focused Empty State) */}
        {stagedProducts.length === 0 ? (
          <div className="rounded-lg border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-[#0f1118] p-10 flex flex-col items-center justify-center text-center shadow-xs">
            <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800/80 text-zinc-400 dark:text-zinc-500 flex items-center justify-center border border-zinc-200 dark:border-zinc-700/80 mb-3">
              <Layers className="w-5 h-5 stroke-[1.8]" />
            </div>

            <h3 className="text-[13px] font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
              No Products Staged Yet
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm leading-relaxed">
              Add product specifications to this program to configure deliverables across Design, Mockup, Sampling, or Costing.
            </p>

            <button
              type="button"
              onClick={handleOpenAddProduct}
              className="mt-4 h-8 px-4 rounded-md bg-brand-600 hover:bg-brand-500 active:bg-brand-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer tracking-tight"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Add Product</span>
            </button>
          </div>
        ) : (
          <div className="rounded-lg border border-zinc-200/90 dark:border-white/[0.08] bg-white dark:bg-[#0f1118] overflow-hidden shadow-xs">
            {/* Table Header */}
            <div className="border-b border-zinc-200/90 dark:border-white/[0.08] bg-zinc-50/80 dark:bg-zinc-900/60 px-4 py-2.5 grid grid-cols-12 gap-3 text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 items-center">
              <span className="col-span-1 text-center">#</span>
              <span className="col-span-2">Material Code</span>
              <span className="col-span-5">Product Nomenclature &amp; Specifications</span>
              <span className="col-span-2">Assigned Deliverables</span>
              <span className="col-span-1">Staged Date</span>
              <span className="col-span-1 text-right">Actions</span>
            </div>

            {/* Table Rows */}
            <div className="divide-y divide-zinc-100 dark:divide-white/[0.05] text-[12px]">
              {stagedProducts.map((prod, idx) => (
                <div
                  key={prod.id}
                  className="px-4 py-3.5 grid grid-cols-12 gap-3 items-center hover:bg-zinc-50/70 dark:hover:bg-zinc-900/40 transition-colors"
                >
                  {/* Line # */}
                  <div className="col-span-1 text-center font-mono text-[11px] text-zinc-400 font-semibold">
                    {String(idx + 1).padStart(2, "0")}
                  </div>

                  {/* Material Code */}
                  <div className="col-span-2 min-w-0">
                    <button
                      type="button"
                      onClick={() => setInspectingProduct(prod)}
                      className="font-mono font-bold text-xs text-brand-700 dark:text-brand-300 hover:text-brand-800 dark:hover:text-brand-200 hover:underline cursor-pointer truncate flex items-center gap-1.5 group text-left"
                      title="Click to inspect this request"
                    >
                      <span className="truncate">{prod.materialCode}</span>
                    </button>
                  </div>

                  {/* Product Nomenclature - Expanded wider */}
                  <div className="col-span-5 min-w-0 pr-3">
                    <p
                      onClick={() => setInspectingProduct(prod)}
                      className="font-semibold text-zinc-950 dark:text-zinc-100 hover:text-brand-600 dark:hover:text-brand-400 cursor-pointer truncate transition-colors text-[13px]"
                      title={prod.productDescription}
                    >
                      {prod.productDescription}
                    </p>

                    {prod.designMetadata ? (
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono mt-0.5 truncate">
                        {prod.designMetadata.numberOfDesigns} Design{prod.designMetadata.numberOfDesigns > 1 ? "s" : ""}
                        {prod.designMetadata.designRequiredDate ? ` • Due: ${prod.designMetadata.designRequiredDate}` : ""}
                        {(prod.designMetadata.images.length > 0 || prod.designMetadata.webLinks.length > 0) ? ` • ${prod.designMetadata.images.length + prod.designMetadata.webLinks.length} file(s)` : ""}
                      </p>
                    ) : prod.samplingMetadata ? (
                      <div className="text-[11px] font-mono mt-0.5 flex items-center gap-1.5 flex-wrap">
                        <span className={`font-semibold uppercase tracking-wider px-1.5 py-0.2 rounded text-[10px] ${
                          prod.samplingMetadata.sampleType === "full"
                            ? "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                            : "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                        }`}>
                          {prod.samplingMetadata.sampleType === "full" ? "Full Sample" : "Partial Sample"}
                        </span>
                        {prod.samplingMetadata.partialRequirements && (
                          <span className="text-amber-800 dark:text-amber-300 text-[10px] truncate max-w-xs">
                            ({prod.samplingMetadata.partialRequirements})
                          </span>
                        )}
                        {prod.samplingMetadata.bindingType1 && (
                          <span className="text-zinc-600 dark:text-zinc-400">• {prod.samplingMetadata.bindingType1}{prod.samplingMetadata.bindingType2 ? ` / ${prod.samplingMetadata.bindingType2}` : ""}</span>
                        )}
                        {prod.samplingMetadata.sourceSrNumber && (
                          <span className="text-zinc-400 dark:text-zinc-500">• Ref: {prod.samplingMetadata.sourceSrNumber}</span>
                        )}
                      </div>
                    ) : (
                      <p className="text-[11px] text-zinc-400 dark:text-zinc-500 font-mono mt-0.5">
                        Batch Item #{idx + 1}
                      </p>
                    )}
                  </div>

                  {/* Deliverables Scope Chips */}
                  <div className="col-span-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {prod.scopes.map((scope) => {
                        const def = DELIVERABLES.find((d) => d.id === scope);
                        return (
                          <span
                            key={scope}
                            className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700"
                          >
                            {def?.label.toUpperCase() || scope.toUpperCase()}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {/* Staged Date Column */}
                  <div className="col-span-1 min-w-0">
                    <div className="flex flex-col font-mono text-[11px]">
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-zinc-400 shrink-0" />
                        <span className="truncate">{prod.stagedDate || "2026-10-01"}</span>
                      </span>
                      <span className="text-[10px] text-zinc-400 dark:text-zinc-500 flex items-center gap-1 mt-0.5">
                        <Clock className="w-2.5 h-2.5 shrink-0" />
                        <span className="truncate">{prod.timestamp || "Just now"}</span>
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="col-span-1 flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => setInspectingProduct(prod)}
                      className="h-7 px-2 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700/60 text-zinc-700 dark:text-zinc-200 text-[11px] font-semibold flex items-center gap-1 shadow-2xs transition-colors cursor-pointer hover:border-brand-300 dark:hover:border-brand-700 hover:text-brand-600 dark:hover:text-brand-400"
                      title="Inspect Specification Details"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span className="hidden xl:inline">Inspect</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDuplicateStagedItem(prod)}
                      className="h-7 w-7 rounded-md flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                      title="Duplicate Spec"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRemoveStagedItem(prod.id)}
                      className="h-7 w-7 rounded-md flex items-center justify-center text-rose-600/70 hover:text-rose-700 hover:bg-rose-50 dark:text-rose-400/70 dark:hover:text-rose-300 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                      title="Remove from Batch"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 5. ADD PRODUCT MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
          <div
            className="fixed inset-0 bg-black/60 transition-opacity"
            onClick={() => setIsAddModalOpen(false)}
          />

          <div className="flex min-h-full items-center justify-center p-3 sm:p-5">
            {/* ============================================================== */}
            {/* SCREEN 1: 4 DELIVERABLE SCOPE CARDS                            */}
            {/* ============================================================== */}
            {addModalStep === "scopes" && (
              <div className="relative w-full max-w-lg bg-white dark:bg-[#0f1118] border border-zinc-200 dark:border-white/[0.08] rounded-lg shadow-xl overflow-hidden animate-smooth-modal flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-white/[0.08] bg-zinc-50/70 dark:bg-[#161822] shrink-0">
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50 tracking-tight flex items-center gap-2">
                      <span>Select Deliverables</span>
                    </h3>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-500 font-mono mt-0.5">
                      Choose required deliverables for this product specification
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="h-8 w-8 rounded-md flex items-center justify-center border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/[0.06] transition-colors duration-150 cursor-pointer"
                    aria-label="Close modal"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Form Body - 4 Clean Cards: Design, Mockup, Sampling, Costing */}
                <form onSubmit={handleProceedFromScopes} className="flex flex-col">
                  <div className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      {DELIVERABLES.map((item) => {
                        const isSelected = selectedScopes.includes(item.id);
                        const disabled = isScopeDisabled(item.id);

                        return (
                          <div
                            key={item.id}
                            onClick={() => {
                              if (!disabled) handleToggleScope(item.id);
                            }}
                            className={`p-3.5 rounded-lg border transition-all duration-150 select-none flex items-center justify-between cursor-pointer ${
                              disabled
                                ? "opacity-35 bg-zinc-50/60 dark:bg-zinc-900/20 border-zinc-200/60 dark:border-zinc-800/50 cursor-not-allowed pointer-events-none"
                                : isSelected
                                ? "border-brand-600 bg-brand-50/50 dark:bg-brand-950/25 ring-1 ring-brand-500/20"
                                : "border-zinc-200 dark:border-white/[0.08] hover:border-brand-500/80 bg-white dark:bg-zinc-900/40 text-zinc-700 dark:text-zinc-300"
                            }`}
                          >
                            <span
                              className={`text-[13px] font-semibold tracking-tight ${
                                disabled ? "text-zinc-400 dark:text-zinc-600" : "text-zinc-950 dark:text-zinc-50"
                              }`}
                            >
                              {item.label}
                            </span>

                            <div
                              className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                                isSelected
                                  ? "bg-brand-600 border-brand-600 text-white"
                                  : disabled
                                  ? "border-zinc-200 dark:border-zinc-800 bg-zinc-100/40 dark:bg-zinc-900/40"
                                  : "border-zinc-300 dark:border-zinc-600 bg-transparent"
                              }`}
                            >
                              {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Footer Controls */}
                  <div className="px-6 py-3.5 border-t border-zinc-200 dark:border-white/[0.08] bg-zinc-50/70 dark:bg-[#161822] flex items-center justify-between shrink-0">
                    <button
                      type="button"
                      onClick={() => setIsAddModalOpen(false)}
                      className="h-8 px-4 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700/60 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={selectedScopes.length === 0}
                      className="h-8 px-4 rounded-md bg-brand-600 hover:bg-brand-500 active:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer select-none tracking-tight"
                    >
                      {selectedScopes.includes("design") ? (
                        <>
                          <span>Configure Design Brief</span>
                          <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
                        </>
                      ) : selectedScopes.includes("sample") ? (
                        <>
                          <span>Configure Sampling</span>
                          <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>Stage Product</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ========================================================================================= */}
            {/* SCREEN 2: DEDICATED DESIGN SPECIFICATION VIEW (ONLY THE DECIDED FIELDS)                  */}
            {/* ========================================================================================= */}
            {addModalStep === "design_brief" && (
              <div className="relative w-full max-w-4xl bg-white dark:bg-[#0f1118] border border-zinc-200 dark:border-white/[0.08] rounded-lg shadow-xl overflow-hidden animate-smooth-modal max-h-[92vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-white/[0.08] bg-zinc-50/70 dark:bg-[#161822] shrink-0">
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50 tracking-tight flex items-center gap-2">
                      <span>Creative Design Brief</span>
                    </h3>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-500 font-mono mt-0.5">
                      Specify product description, variants, required date &amp; reference moodboard
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="h-8 w-8 rounded-md flex items-center justify-center border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/[0.06] transition-colors duration-150 cursor-pointer"
                    aria-label="Close modal"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Form Error Message */}
                {modalError && (
                  <div className="mx-6 mt-4 p-2.5 rounded-md bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                      <span>{modalError}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setModalError(null)}
                      className="p-1 hover:opacity-75 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Form Body - Balanced 2-Column Grid */}
                <form onSubmit={handleStageDesignBrief} className="p-6 space-y-4 overflow-y-auto flex-1">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                    
                    {/* LEFT COLUMN (7 COLS): Customer Account, Product Description, Trend & Audience, Remarks */}
                    <div className="lg:col-span-7 space-y-3.5">
                      {/* 1. Customer Account (Pre-collected in Step 1, Locked) */}
                      <div>
                        <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1">
                          Customer Account &amp; Program
                        </label>
                        <div className="w-full h-8 px-3 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/90 text-[12px] font-medium text-zinc-900 dark:text-zinc-100 flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                              {programContext.customer || "General Account"}
                            </span>
                            <span className="text-zinc-400 dark:text-zinc-500 font-mono text-[11px] truncate">
                              • {programContext.programName} ({programContext.programYear})
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 uppercase tracking-wider px-1.5 py-0.5 rounded bg-zinc-200/60 dark:bg-zinc-800 shrink-0 flex items-center gap-1">
                            <Lock className="w-2.5 h-2.5" /> Locked
                          </span>
                        </div>
                      </div>

                      {/* 2. Product Description (MANDATORY) */}
                      <div>
                        <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1">
                          Product Description <span className="text-rose-500">*</span>
                        </label>
                        <textarea
                          required
                          rows={3}
                          placeholder="Provide detailed product description, cover specifications, ruling/page requirements, finish accents (foil, deboss, spot UV), and creative direction..."
                          value={designDesc}
                          onChange={(e) => setDesignDesc(e.target.value)}
                          className="w-full p-2.5 rounded-md border border-zinc-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-900/80 text-[12px] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20 outline-none transition-colors resize-none leading-relaxed"
                        />
                      </div>

                      {/* 3. Trend / Theme & Target Audience (OPTIONAL) */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Trend / Theme */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 truncate">
                              Trend / Theme
                            </label>
                            <span className="text-[9.5px] text-zinc-400 font-mono">Optional</span>
                          </div>
                          <input
                            type="text"
                            placeholder="e.g. Botanical Floral, Geometric Minimalist"
                            value={designTrend}
                            onChange={(e) => setDesignTrend(e.target.value)}
                            className="w-full h-8 px-2.5 rounded-md border border-zinc-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-900 text-[12px] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20"
                          />
                        </div>

                        {/* Target Audience */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 truncate">
                              Target Audience
                            </label>
                            <span className="text-[9.5px] text-zinc-400 font-mono">Optional</span>
                          </div>
                          <input
                            type="text"
                            placeholder="e.g. College Students, Kids (6-12)"
                            value={designAudience}
                            onChange={(e) => setDesignAudience(e.target.value)}
                            className="w-full h-8 px-2.5 rounded-md border border-zinc-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-900 text-[12px] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20"
                          />
                        </div>
                      </div>

                      {/* 4. Remarks / Special Notes (OPTIONAL) */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                            Remarks / Special Notes
                          </label>
                          <span className="text-[9.5px] text-zinc-400 font-mono">Optional</span>
                        </div>
                        <textarea
                          rows={2}
                          placeholder="Specific instructions, special packaging requirements, or design notes..."
                          value={designRemarks}
                          onChange={(e) => setDesignRemarks(e.target.value)}
                          className="w-full p-2.5 rounded-md border border-zinc-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-900 text-[12px] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20 outline-none transition-colors resize-none leading-relaxed"
                        />
                      </div>
                    </div>

                    {/* RIGHT COLUMN (5 COLS): Number of Designs, Design Required Date, Reference Attachments */}
                    <div className="lg:col-span-5 space-y-4">
                      {/* 4. Number of Designs (MANDATORY) */}
                      <div>
                        <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1">
                          Number of Designs <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min={1}
                            max={100}
                            placeholder="e.g. 3"
                            required
                            value={designCount}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === "") {
                                setDesignCount("");
                              } else {
                                const parsed = parseInt(val, 10);
                                setDesignCount(isNaN(parsed) ? "" : Math.max(1, parsed));
                              }
                            }}
                            className="w-full h-8 px-2.5 rounded-md border border-zinc-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-900 text-[12px] font-mono font-bold text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 placeholder:font-sans placeholder:font-normal outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20"
                          />
                          {designCount !== "" && (
                            <span className="absolute right-2.5 top-1.5 text-[10px] font-mono text-zinc-400 pointer-events-none">
                              variant{Number(designCount) > 1 ? "s" : ""}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* 5. Design Required Date (MANDATORY, OperationalDatePicker) */}
                      <div>
                        <OperationalDatePicker
                          label="Design Required Date"
                          required
                          value={designDueDate}
                          onChange={(val) => {
                            setDesignDueDate(val);
                            if (modalError) setModalError(null);
                          }}
                          minDate={new Date().toISOString().split("T")[0]}
                          placeholder="Select required date..."
                        />
                      </div>

                      {/* 6. Reference Attachments: Dual option (Image Upload OR Web Link) */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                            Reference Image / Moodboard
                          </label>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded font-mono transition-colors ${
                              uploadedImages.length >= 2 && webLinks.length >= 1
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300/40"
                                : totalAttachments > 0
                                ? "bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 border border-brand-200/50"
                                : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                            }`}
                          >
                            {uploadedImages.length}/2 images · {webLinks.length}/1 link
                          </span>
                        </div>

                        {/* Segmented Mode Control */}
                        <div className="space-y-2">
                          <div className="inline-flex w-full rounded-md bg-zinc-100 dark:bg-zinc-800/80 p-0.5 text-[11px]">
                            <button
                              type="button"
                              onClick={() => setMediaTab("files")}
                              className={`flex-1 py-1 rounded text-[10.5px] transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                                mediaTab === "files"
                                  ? "bg-white dark:bg-zinc-700 text-brand-600 dark:text-brand-300 shadow-2xs font-semibold"
                                  : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 font-medium"
                              }`}
                            >
                              <ImageIcon className="w-3 h-3" />
                              <span>Upload Image</span>
                              {uploadedImages.length > 0 && (
                                <span className="ml-1 text-[9.5px] font-mono px-1 rounded bg-brand-100 dark:bg-brand-900/60 text-brand-700 dark:text-brand-300">
                                  {uploadedImages.length}
                                </span>
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => setMediaTab("links")}
                              className={`flex-1 py-1 rounded text-[10.5px] transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                                mediaTab === "links"
                                  ? "bg-white dark:bg-zinc-700 text-brand-600 dark:text-brand-300 shadow-2xs font-semibold"
                                  : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 font-medium"
                              }`}
                            >
                              <Link2 className="w-3 h-3" />
                              <span>Paste Web Link</span>
                              {webLinks.length > 0 && (
                                <span className="ml-1 text-[9.5px] font-mono px-1 rounded bg-brand-100 dark:bg-brand-900/60 text-brand-700 dark:text-brand-300">
                                  {webLinks.length}
                                </span>
                              )}
                            </button>
                          </div>

                          {/* File Upload Trigger */}
                          {mediaTab === "files" && (
                            <div>
                              <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={handleMultipleImageUpload}
                                className="hidden"
                              />
                              {uploadedImages.length < 2 ? (
                                <button
                                  type="button"
                                  onClick={() => fileInputRef.current?.click()}
                                  className="w-full h-8 px-3 rounded-md border border-dashed border-zinc-300 dark:border-zinc-700 hover:border-brand-500 dark:hover:border-brand-500 bg-zinc-50/60 dark:bg-zinc-900/40 hover:bg-brand-50/10 text-zinc-600 dark:text-zinc-400 hover:text-brand-600 dark:hover:text-brand-400 flex items-center justify-between text-[11px] font-medium transition-colors cursor-pointer group"
                                >
                                  <div className="flex items-center gap-2">
                                    <UploadCloud className="w-3.5 h-3.5 text-zinc-400 group-hover:text-brand-600 transition-colors" />
                                    <span>Choose photos (PNG, JPG, WEBP)</span>
                                  </div>
                                  <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500">
                                    {2 - uploadedImages.length} slot{2 - uploadedImages.length === 1 ? "" : "s"} left
                                  </span>
                                </button>
                              ) : (
                                <div className="w-full h-8 px-3 rounded-md bg-zinc-100 dark:bg-zinc-800/60 text-zinc-500 dark:text-zinc-400 text-[11px] font-mono flex items-center justify-center border border-zinc-200 dark:border-zinc-700/60">
                                  Maximum 2 images reached
                                </div>
                              )}
                            </div>
                          )}

                          {/* Web Link Input */}
                          {mediaTab === "links" && (
                            <div className="flex items-center gap-1.5">
                              <input
                                type="url"
                                placeholder={
                                  webLinks.length >= 1
                                    ? "Maximum 1 reference link reached"
                                    : "Paste URL (e.g. drive.google.com, pinterest, etc.)"
                                }
                                disabled={webLinks.length >= 1}
                                value={linkInput}
                                onChange={(e) => setLinkInput(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    handleAddWebLink(e);
                                  }
                                }}
                                className="flex-1 h-8 px-2.5 rounded-md border border-zinc-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-900 text-[11px] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:border-brand-500 outline-none disabled:opacity-50"
                              />
                              <button
                                type="button"
                                onClick={handleAddWebLink}
                                disabled={webLinks.length >= 1 || !linkInput.trim()}
                                className="h-8 px-3 rounded-md bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-white text-white dark:text-zinc-900 text-[11px] font-semibold shrink-0 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                              >
                                <Plus className="w-3 h-3" />
                                <span>Add</span>
                              </button>
                            </div>
                          )}

                          {/* Attached Items List */}
                          {totalAttachments > 0 ? (
                            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-0.5">
                              {/* Images */}
                              {uploadedImages.map((img) => (
                                <div
                                  key={img.id}
                                  className="flex items-center justify-between gap-2 px-2 py-1 rounded-md border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/90 text-[11px] shadow-2xs group"
                                >
                                  <div className="flex items-center gap-2 min-w-0 flex-1">
                                    <img
                                      src={img.url}
                                      alt={img.name}
                                      className="w-6 h-6 rounded object-cover border border-zinc-200 dark:border-zinc-800 shrink-0"
                                    />
                                    <span className="text-[10px] font-bold px-1 py-0.2 rounded bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 border border-brand-200/50 shrink-0">
                                      IMG
                                    </span>
                                    <span className="truncate font-medium text-zinc-800 dark:text-zinc-200" title={img.name}>
                                      {img.name}
                                    </span>
                                    {img.size && (
                                      <span className="text-[9.5px] text-zinc-400 font-mono shrink-0">
                                        ({img.size})
                                      </span>
                                    )}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveImage(img.id)}
                                    title="Remove image"
                                    className="p-1 rounded text-rose-600/70 hover:text-rose-700 hover:bg-rose-50 dark:text-rose-400/70 dark:hover:text-rose-300 dark:hover:bg-rose-950/40 transition-colors shrink-0 cursor-pointer"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ))}

                              {/* Web Links */}
                              {webLinks.map((url, idx) => (
                                <div
                                  key={`link-${idx}`}
                                  className="flex items-center justify-between gap-2 px-2 py-1 rounded-md border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/90 text-[11px] shadow-2xs group"
                                >
                                  <div className="flex items-center gap-2 min-w-0 flex-1">
                                    <span className="text-[10px] font-bold px-1 py-0.2 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 shrink-0">
                                      URL
                                    </span>
                                    <a
                                      href={url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="truncate text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1 font-mono text-[10.5px]"
                                      title={url}
                                    >
                                      <span className="truncate">{url}</span>
                                      <ExternalLink className="w-2.5 h-2.5 shrink-0 opacity-60" />
                                    </a>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveWebLink(idx)}
                                    title="Remove link"
                                    className="p-1 rounded text-rose-600/70 hover:text-rose-700 hover:bg-rose-50 dark:text-rose-400/70 dark:hover:text-rose-300 dark:hover:bg-rose-950/40 transition-colors shrink-0 cursor-pointer"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="px-2.5 py-1.5 rounded-md border border-dashed border-zinc-200 dark:border-zinc-800/80 text-center">
                              <span className="text-[10px] text-zinc-400 font-mono">
                                No attachments yet (optional · up to 2 images and 1 link)
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer: Back to Deliverables (left), Cancel & Add (right) */}
                  <div className="px-6 py-3.5 border-t border-zinc-200 dark:border-white/[0.08] bg-zinc-50/70 dark:bg-[#161822] flex items-center justify-between shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setAddModalStep("scopes");
                        setModalError(null);
                      }}
                      className="h-8 px-4 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700/60 transition-colors cursor-pointer"
                    >
                      Back to Deliverables
                    </button>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsAddModalOpen(false)}
                        className="h-8 px-4 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs font-semibold cursor-pointer transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmittingAll}
                        className="h-8 px-4 rounded-md bg-brand-600 hover:bg-brand-500 active:bg-brand-700 text-white text-xs font-bold cursor-pointer transition-colors flex items-center gap-1.5 disabled:opacity-50 tracking-tight"
                      >
                        <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Add</span>
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}

            {/* ========================================================================================= */}
            {/* SCREEN 3: SAMPLING SPECIFICATION VIEW (CLEAN & DIRECT)                                    */}
            {/* ========================================================================================= */}
            {addModalStep === "sampling_config" && (
              <div className="relative w-full max-w-2xl bg-white dark:bg-[#0f1118] border border-zinc-200 dark:border-white/[0.08] rounded-lg shadow-xl overflow-hidden animate-smooth-modal max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-white/[0.08] bg-zinc-50/70 dark:bg-[#161822] shrink-0">
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50 tracking-tight flex items-center gap-2">
                      <span>Sampling</span>
                    </h3>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-500 font-mono mt-0.5">
                      Configure prototype specifications, sample type &amp; database reference
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="h-8 w-8 rounded-md flex items-center justify-center border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/[0.06] transition-colors duration-150 cursor-pointer"
                    aria-label="Close modal"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Form Error Message */}
                {modalError && (
                  <div className="mx-6 mt-4 p-2.5 rounded-md bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                      <span>{modalError}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setModalError(null)}
                      className="text-rose-600 hover:text-rose-800 dark:text-rose-400 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Form Body */}
                <form onSubmit={handleStageSamplingProduct} className="flex-1 flex flex-col min-h-0 overflow-hidden">
                  <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {/* Scope Selection: Full Sample vs Partial Sample */}
                    <div className="space-y-2">
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                        Sample Scope <span className="text-rose-500">*</span>
                      </label>

                      <div className="grid grid-cols-2 gap-3">
                        {/* Full Sample */}
                        <div
                          onClick={() => setSampleType("full")}
                          className={`p-3.5 rounded-lg border transition-all cursor-pointer select-none flex items-center justify-between ${
                            sampleType === "full"
                              ? "border-brand-600 bg-brand-50/50 dark:bg-brand-950/25 ring-1 ring-brand-500/20"
                              : "border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-zinc-900/40 hover:border-brand-500/80"
                          }`}
                        >
                          <span className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-100">
                            Full Sample
                          </span>
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            sampleType === "full" ? "border-brand-600 bg-brand-600 text-white" : "border-zinc-300 dark:border-zinc-600"
                          }`}>
                            {sampleType === "full" && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          </div>
                        </div>

                        {/* Partial Sample */}
                        <div
                          onClick={() => setSampleType("partial")}
                          className={`p-3.5 rounded-lg border transition-all cursor-pointer select-none flex items-center justify-between ${
                            sampleType === "partial"
                              ? "border-brand-600 bg-brand-50/50 dark:bg-brand-950/25 ring-1 ring-brand-500/20"
                              : "border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-zinc-900/40 hover:border-brand-500/80"
                          }`}
                        >
                          <span className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-100">
                            Partial Sample
                          </span>
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            sampleType === "partial" ? "border-brand-600 bg-brand-600 text-white" : "border-zinc-300 dark:border-zinc-600"
                          }`}>
                            {sampleType === "partial" && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          </div>
                        </div>
                      </div>

                      {/* ONLY MANDATORY INPUT FIELD WHEN PARTIAL IS CHOSEN */}
                      {sampleType === "partial" && (
                        <div className="space-y-1 pt-1">
                          <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                            Partial Sample Details <span className="text-rose-500">*</span>
                          </label>
                          <textarea
                            required
                            rows={3}
                            value={partialRequirements}
                            onChange={(e) => setPartialRequirements(e.target.value)}
                            placeholder="Enter partial sample requirements..."
                            className="w-full p-2.5 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-[12px] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20 resize-none leading-relaxed"
                          />
                        </div>
                      )}
                    </div>

                  {/* Choose Sample: Material Code or Sequential Binding */}
                  <div className="space-y-2.5">
                    <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                      Select Sample <span className="text-rose-500">*</span>
                    </label>

                    {/* Mode Toggle Bar */}
                    <div className="flex items-center gap-1 p-1 rounded-lg bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200/80 dark:border-white/[0.05]">
                      <button
                        type="button"
                        onClick={() => setSamplingSearchMode("material_code")}
                        className={`flex-1 h-8 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          samplingSearchMode === "material_code"
                            ? "bg-white dark:bg-zinc-700 text-zinc-950 dark:text-zinc-50 shadow-xs"
                            : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
                        }`}
                      >
                        <Hash className="w-3.5 h-3.5" />
                        <span>Material Code</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSamplingSearchMode("binding")}
                        className={`flex-1 h-8 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          samplingSearchMode === "binding"
                            ? "bg-white dark:bg-zinc-700 text-zinc-950 dark:text-zinc-50 shadow-xs"
                            : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
                        }`}
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Binding (Binding 1 &amp; 2)</span>
                      </button>
                    </div>

                    {/* Mode 1: Material Code */}
                    {samplingSearchMode === "material_code" && (
                      <div className="space-y-2">
                        <div className="relative">
                          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            type="text"
                            value={materialSearchQuery}
                            onChange={(e) => setMaterialSearchQuery(e.target.value)}
                            placeholder="Search material code, SKU, or customer..."
                            className="w-full h-9 pl-9 pr-8 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none focus:border-brand-600"
                          />
                          {materialSearchQuery && (
                            <button
                              type="button"
                              onClick={() => setMaterialSearchQuery("")}
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 h-5 w-5 flex items-center justify-center cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>

                        <div className="border border-zinc-200 dark:border-white/[0.08] rounded-lg max-h-52 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/80 bg-zinc-50/30 dark:bg-zinc-900/30">
                          {isSearchingMaterial ? (
                            <div className="py-6 text-center text-xs text-zinc-400">
                              Searching samples...
                            </div>
                          ) : materialSearchResults.length === 0 ? (
                            <div className="py-6 text-center text-xs text-zinc-400">
                              No matching samples found.
                            </div>
                          ) : (
                            materialSearchResults.map((item) => {
                              const isSelected = selectedDbSample?.id === item.id;
                              return (
                                <div
                                  key={item.id}
                                  onClick={() => handleSelectDbSample(item)}
                                  className={`p-2.5 transition-colors cursor-pointer flex items-center justify-between gap-3 text-left ${
                                    isSelected
                                      ? "bg-brand-50/70 dark:bg-brand-950/40 border-l-2 border-brand-600"
                                      : "hover:bg-white dark:hover:bg-zinc-800/60"
                                  }`}
                                >
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                      <span className="font-mono text-[11px] font-bold px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700">
                                        {item.material_code || "—"}
                                      </span>
                                      <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                                        {item.product_description}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-zinc-400">
                                      <span>{item.customer || "Navneet"}</span>
                                      <span>• Plant: {item.target_plant || "1505"}</span>
                                      {item.sr_number && <span>• Ref: {item.sr_number}</span>}
                                    </div>
                                  </div>

                                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                                    isSelected ? "border-brand-600 bg-brand-600 text-white" : "border-zinc-300 dark:border-zinc-600"
                                  }`}>
                                    {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}

                    {/* Mode 2: Sequential Binding (Binding 1 then Binding 2) */}
                    {samplingSearchMode === "binding" && (
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {/* Binding 1 */}
                          <div>
                            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                              Binding 1 <span className="text-rose-500">*</span>
                            </label>
                            <select
                              value={selectedBinding1}
                              onChange={(e) => {
                                const newB1 = e.target.value;
                                setSelectedBinding1(newB1);
                                setSelectedBinding2("");
                                setSelectedDbSample(null);
                                if (newB1 && !samplingDescription) {
                                  setSamplingDescription(`${newB1} Notebook`);
                                }
                              }}
                              className="w-full h-9 px-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-medium text-zinc-900 dark:text-zinc-100 outline-none focus:border-brand-600 cursor-pointer"
                            >
                              <option value="">Select Binding 1...</option>
                              {bindingHierarchy.binding1_options.map((opt) => (
                                <option key={opt} value={opt}>
                                  {opt}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Binding 2 */}
                          <div>
                            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                              Binding 2
                            </label>
                            <select
                              disabled={!selectedBinding1}
                              value={selectedBinding2}
                              onChange={(e) => {
                                const newB2 = e.target.value;
                                setSelectedBinding2(newB2);
                                setSelectedDbSample(null);
                                if (selectedBinding1 && newB2) {
                                  setSamplingDescription(`${selectedBinding1} Notebook (${newB2})`);
                                }
                              }}
                              className={`w-full h-9 px-3 rounded-lg border text-xs font-medium outline-none ${
                                !selectedBinding1
                                  ? "border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800/40 text-zinc-400 cursor-not-allowed"
                                  : "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:border-brand-600 cursor-pointer"
                              }`}
                            >
                              <option value="">
                                {!selectedBinding1 ? "Select Binding 1 first..." : "Select Binding 2..."}
                              </option>
                              {selectedBinding1 &&
                                (
                                  (bindingHierarchy.hierarchy[selectedBinding1]?.length
                                    ? bindingHierarchy.hierarchy[selectedBinding1]
                                    : bindingHierarchy.binding2_options) || []
                                ).map((opt: string) => (
                                  <option key={opt} value={opt}>
                                    {opt}
                                  </option>
                                ))}
                            </select>
                          </div>
                        </div>

                        {/* Products with that specific binding */}
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                              Products with this Binding ({bindingSearchResults.length})
                            </span>
                            {selectedBinding1 && (
                              <span className="text-[11px] text-zinc-500 font-mono">
                                {selectedBinding1}{selectedBinding2 ? ` / ${selectedBinding2}` : ""}
                              </span>
                            )}
                          </div>

                          <div className="border border-zinc-200 dark:border-white/[0.08] rounded-lg max-h-52 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/80 bg-zinc-50/30 dark:bg-zinc-900/30">
                            {!selectedBinding1 ? (
                              <div className="py-6 text-center text-xs text-zinc-400">
                                Select Binding 1 to view matching products
                              </div>
                            ) : isSearchingBinding ? (
                              <div className="py-6 text-center text-xs text-zinc-400">
                                Searching database...
                              </div>
                            ) : bindingSearchResults.length === 0 ? (
                              <div className="py-6 text-center text-xs text-zinc-400">
                                No matching products found. You can proceed with this binding directly.
                              </div>
                            ) : (
                              bindingSearchResults.map((item) => {
                                const isSelected = selectedDbSample?.id === item.id;
                                return (
                                  <div
                                    key={item.id}
                                    onClick={() => handleSelectDbSample(item)}
                                    className={`p-2.5 transition-colors cursor-pointer flex items-center justify-between gap-3 text-left ${
                                      isSelected
                                        ? "bg-brand-50/70 dark:bg-brand-950/40 border-l-2 border-brand-600"
                                        : "hover:bg-white dark:hover:bg-zinc-800/60"
                                    }`}
                                  >
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center gap-2">
                                        <span className="font-mono text-[11px] font-bold px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700">
                                          {item.material_code || "—"}
                                        </span>
                                        <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                                          {item.product_description}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2 mt-0.5 text-[10px] text-zinc-400">
                                        <span>{item.customer || "Navneet"}</span>
                                        <span>• Plant: {item.target_plant || "1505"}</span>
                                        {item.sr_number && <span>• Ref: {item.sr_number}</span>}
                                      </div>
                                    </div>

                                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                                      isSelected ? "border-brand-600 bg-brand-600 text-white" : "border-zinc-300 dark:border-zinc-600"
                                    }`}>
                                      {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Product Title */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                      Product Title <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={samplingDescription}
                      onChange={(e) => setSamplingDescription(e.target.value)}
                      placeholder="Enter product title..."
                      className="w-full h-8.5 px-3 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-[12px] font-medium text-zinc-900 dark:text-zinc-100 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20"
                    />
                  </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="px-6 py-3.5 border-t border-zinc-200 dark:border-white/[0.08] bg-zinc-50/70 dark:bg-[#161822] flex items-center justify-between shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setAddModalStep("scopes");
                        setModalError(null);
                      }}
                      className="h-8 px-4 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700/60 transition-colors cursor-pointer"
                    >
                      Back
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsAddModalOpen(false)}
                        className="h-8 px-4 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs font-semibold cursor-pointer transition-colors"
                      >
                        Cancel
                      </button>

                      <button
                        type="submit"
                        disabled={isSubmittingAll}
                        className="h-8 px-4 rounded-md bg-brand-600 hover:bg-brand-500 active:bg-brand-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer select-none tracking-tight"
                      >
                        <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Stage Product</span>
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
      {/* 6. INSPECT SPECIFICATION MODAL */}
      {inspectingProduct && (
        <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
          <div
            className="fixed inset-0 bg-black/60 transition-opacity"
            onClick={() => setInspectingProduct(null)}
          />

          <div className="flex min-h-full items-center justify-center p-3 sm:p-5">
            <div className="relative w-full max-w-3xl bg-white dark:bg-[#0f1118] border border-zinc-200 dark:border-white/[0.08] rounded-lg shadow-xl overflow-hidden animate-smooth-modal flex flex-col max-h-[90vh]">
              {/* Header */}
              <div className="px-6 py-4 border-b border-zinc-200 dark:border-white/[0.08] bg-zinc-50/70 dark:bg-[#161822] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-950/60 px-2 py-0.5 rounded border border-brand-200 dark:border-brand-800">
                    {inspectingProduct.materialCode}
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800">
                    Staged Specification
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setInspectingProduct(null)}
                  className="h-8 w-8 rounded-md flex items-center justify-center border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/[0.06] transition-colors duration-150 cursor-pointer"
                  aria-label="Close modal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
                {/* Product Title & Metadata Subtitle */}
                <div>
                  <h3 className="text-base font-bold text-zinc-950 dark:text-zinc-50 tracking-tight leading-snug">
                    {inspectingProduct.productDescription}
                  </h3>
                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 mt-1 text-[11px] text-zinc-400 font-mono">
                    <span>Staged: {inspectingProduct.stagedDate || "2026-10-01"} {inspectingProduct.timestamp}</span>
                    <span>•</span>
                    <span>Plant: {cleanPlantName(programContext.targetPlant)}</span>
                    <span>•</span>
                    <span>Season: {programContext.programYear}</span>
                  </div>
                </div>

                {/* Assigned Deliverables */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  {inspectingProduct.scopes.map((scope) => {
                    const def = DELIVERABLES.find((d) => d.id === scope);
                    return (
                      <span
                        key={scope}
                        className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700"
                      >
                        {def?.label.toUpperCase() || scope.toUpperCase()}
                      </span>
                    );
                  })}
                </div>

                {/* Design Specifications (Clean Key-Value 2x2 Grid) */}
                {inspectingProduct.designMetadata && (
                  <div className="space-y-3 pt-3 border-t border-zinc-100 dark:border-white/[0.06]">
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="p-3 rounded-lg border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/50">
                        <span className="text-[10px] font-mono text-zinc-400 block uppercase font-medium">Artwork Variants</span>
                        <span className="font-mono font-bold text-sm text-zinc-900 dark:text-zinc-100 mt-0.5 block">
                          {inspectingProduct.designMetadata.numberOfDesigns} Design(s)
                        </span>
                      </div>

                      <div className="p-3 rounded-lg border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/50">
                        <span className="text-[10px] font-mono text-zinc-400 block uppercase font-medium">Target Due Date</span>
                        <span className="font-mono font-bold text-sm text-zinc-900 dark:text-zinc-100 mt-0.5 block">
                          {inspectingProduct.designMetadata.designRequiredDate || "Not specified"}
                        </span>
                      </div>

                      <div className="p-3 rounded-lg border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/50">
                        <span className="text-[10px] font-mono text-zinc-400 block uppercase font-medium">Trend / Theme</span>
                        <span className="font-medium text-xs text-zinc-900 dark:text-zinc-100 mt-0.5 block break-words">
                          {inspectingProduct.designMetadata.trend || "None specified"}
                        </span>
                      </div>

                      <div className="p-3 rounded-lg border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/50">
                        <span className="text-[10px] font-mono text-zinc-400 block uppercase font-medium">Target Demographic</span>
                        <span className="font-medium text-xs text-zinc-900 dark:text-zinc-100 mt-0.5 block break-words">
                          {inspectingProduct.designMetadata.targetAudience || "General Audience"}
                        </span>
                      </div>
                    </div>

                    {/* Remarks / Special Instructions */}
                    {inspectingProduct.designMetadata.remarks && (
                      <div className="p-3 rounded-lg border border-amber-200/80 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20">
                        <span className="text-[10px] font-mono uppercase font-semibold text-amber-700 dark:text-amber-400 block mb-1">
                          Special Instructions / Remarks
                        </span>
                        <p className="text-xs text-zinc-800 dark:text-zinc-200 leading-relaxed whitespace-pre-wrap break-words">
                          {inspectingProduct.designMetadata.remarks}
                        </p>
                      </div>
                    )}

                    {/* Moodboard / Attachments Preview */}
                    {(inspectingProduct.designMetadata.images.length > 0 || inspectingProduct.designMetadata.webLinks.length > 0) && (
                      <div>
                        <span className="text-[10px] font-mono uppercase text-zinc-400 block mb-1.5 font-medium">
                          Reference Attachments ({inspectingProduct.designMetadata.images.length} image(s), {inspectingProduct.designMetadata.webLinks.length} link(s))
                        </span>

                        <div className="space-y-2">
                          {/* Images */}
                          {inspectingProduct.designMetadata.images.length > 0 && (
                            <div className="grid grid-cols-2 gap-2">
                              {inspectingProduct.designMetadata.images.map((img) => (
                                <div
                                  key={img.id}
                                  className="p-2 rounded-md border border-zinc-200 dark:border-zinc-800 flex items-center gap-2.5 bg-zinc-50/50 dark:bg-zinc-900/50"
                                >
                                  <img
                                    src={img.url}
                                    alt={img.name}
                                    className="w-10 h-10 rounded object-cover border border-zinc-200 dark:border-zinc-700 shrink-0"
                                  />
                                  <div className="min-w-0 flex-1">
                                    <p className="font-medium truncate text-zinc-800 dark:text-zinc-200" title={img.name}>
                                      {img.name}
                                    </p>
                                    <span className="text-[10px] text-zinc-400 font-mono">{img.size}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Web Links */}
                          {inspectingProduct.designMetadata.webLinks.length > 0 && (
                            <div className="space-y-1">
                              {inspectingProduct.designMetadata.webLinks.map((url, idx) => (
                                <a
                                  key={`inspect-link-${idx}`}
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-2.5 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-brand-600 dark:text-brand-400 hover:underline font-mono text-[11px] bg-zinc-50/50 dark:bg-zinc-900/50"
                                >
                                  <span className="truncate">{url}</span>
                                  <ExternalLink className="w-3 h-3 shrink-0 ml-1.5 opacity-60" />
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Sampling Specifications (Full vs Partial, Binding 1 & 2, Source Material Ref) */}
                {inspectingProduct.samplingMetadata && (
                  <div className="space-y-3 pt-3 border-t border-zinc-100 dark:border-white/[0.06]">
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="p-3 rounded-lg border border-blue-200/80 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/30">
                        <span className="text-[10px] font-mono text-blue-600 dark:text-blue-400 block uppercase font-medium">Sample Scope Type</span>
                        <span className="font-mono font-bold text-sm text-blue-950 dark:text-blue-100 mt-0.5 block">
                          {inspectingProduct.samplingMetadata.sampleType === "full" ? "Full Sample (Finished Unit)" : "Partial Sample (Component / Dummy)"}
                        </span>
                      </div>

                      <div className="p-3 rounded-lg border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/50">
                        <span className="text-[10px] font-mono text-zinc-400 block uppercase font-medium">Selection Source</span>
                        <span className="font-mono font-bold text-sm text-zinc-900 dark:text-zinc-100 mt-0.5 block">
                          {inspectingProduct.samplingMetadata.searchMode === "material_code" ? "Material Code Search" : "Binding Structure"}
                        </span>
                      </div>

                      <div className="p-3 rounded-lg border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/50">
                        <span className="text-[10px] font-mono text-zinc-400 block uppercase font-medium">Binding 1 (Primary)</span>
                        <span className="font-medium text-xs text-zinc-900 dark:text-zinc-100 mt-0.5 block">
                          {inspectingProduct.samplingMetadata.bindingType1 || "Standard / As Per Sample"}
                        </span>
                      </div>

                      <div className="p-3 rounded-lg border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/50">
                        <span className="text-[10px] font-mono text-zinc-400 block uppercase font-medium">Binding 2 (Spine)</span>
                        <span className="font-medium text-xs text-zinc-900 dark:text-zinc-100 mt-0.5 block">
                          {inspectingProduct.samplingMetadata.bindingType2 || "Standard / None"}
                        </span>
                      </div>
                    </div>

                    {inspectingProduct.samplingMetadata.partialRequirements && (
                      <div className="p-3 rounded-lg border border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/20 text-xs font-sans">
                        <span className="text-[10px] font-mono text-amber-700 dark:text-amber-400 block uppercase font-medium mb-1">Partial Sample Details:</span>
                        <p className="text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap">{inspectingProduct.samplingMetadata.partialRequirements}</p>
                      </div>
                    )}

                    {inspectingProduct.samplingMetadata.sourceSrNumber && (
                      <div className="p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-xs font-mono text-zinc-600 dark:text-zinc-400 flex items-center justify-between">
                        <span>Database Source Sample Ref:</span>
                        <strong className="text-zinc-900 dark:text-zinc-100">{inspectingProduct.samplingMetadata.sourceSrNumber}</strong>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-3 border-t border-zinc-200 dark:border-white/[0.08] bg-zinc-50/70 dark:bg-[#161822] flex items-center justify-between shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    const toDelete = inspectingProduct.id;
                    setInspectingProduct(null);
                    handleRemoveStagedItem(toDelete);
                  }}
                  className="h-8 px-3 rounded-md text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const toDuplicate = inspectingProduct;
                      setInspectingProduct(null);
                      handleDuplicateStagedItem(toDuplicate);
                    }}
                    className="h-8 px-3.5 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1.5 shadow-2xs"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Duplicate</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setInspectingProduct(null)}
                    className="h-8 px-4 rounded-md bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-white text-white dark:text-zinc-900 text-xs font-bold cursor-pointer transition-colors shadow-xs"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductStagingWorkspace;
