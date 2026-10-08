import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CheckCircle2, AlertCircle, X } from "lucide-react";
import { UserProfile } from "@/features/auth";
import {
  searchProductsByMaterialApi,
  searchProductsByBindingApi,
  fetchBindingHierarchyApi,
  updateSampleRequestApi,
  createDesignBriefFromSampleApi,
} from "@/infrastructure/api";
import { ProductSearchResult, BindingHierarchyResponse } from "../types";
import { useMasterData } from "../hooks/useMasterData";
import { getNextWorkingDate } from "@/lib/holidayUtils";
import { getCurrentBusinessYear } from "@/lib/businessYear";
import { autoSaveStagedProductsToDraft } from "../utils/autoSaveDraft";

// Re-export domain types and helpers for backward compatibility
export type { DeliverableScopeId, DeliverableDefinition, StagedProductItem } from "../types/staging";
export { DELIVERABLES, cleanPlantName } from "../types/staging";
import { DeliverableScopeId, StagedProductItem } from "../types/staging";

// Sub-components
import {
  StagingWorkspaceHeader,
  StagingProductList,
  StagedProductDrawer,
  AddProductScopesStep,
  AddProductCatalogStep,
  AddProductDesignStep,
  AddProductSamplingStep,
} from "./staging";

export interface ProductStagingWorkspaceProps {
  user?: UserProfile | null;
}

export const ProductStagingWorkspace: React.FC<ProductStagingWorkspaceProps> = ({ user }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { customers, plants, error: masterDataError } = useMasterData();

  // Load Program Setup from location state or cached session
  const [programContext, setProgramContext] = useState(() => {
    const state = location.state as {
      customer?: string;
      programName?: string;
      programYear?: string;
      year?: string;
      targetPlant?: string;
      parentRequestId?: string | number;
      parentSrNumber?: string;
      openedFromDraft?: boolean;
    } | null;

    if (state?.customer || state?.programName) {
      return {
        customer: state.customer || "",
        programName: state.programName || "",
        programYear: state.programYear || "2026",
        year: state.year || getCurrentBusinessYear(),
        targetPlant: state.targetPlant || "",
        parentRequestId: state.parentRequestId,
        parentSrNumber: state.parentSrNumber || "",
        openedFromDraft: Boolean(state.openedFromDraft),
      };
    }

    try {
      const cached = sessionStorage.getItem("samp_active_program_form");
      if (cached) {
        const parsed = JSON.parse(cached);
        return {
          customer: parsed.customer || "",
          programName: parsed.programName || "",
          programYear: parsed.programYear || "2026",
          year: parsed.year || getCurrentBusinessYear(),
          targetPlant: parsed.targetPlant || "",
          parentRequestId: parsed.parentRequestId,
          parentSrNumber: parsed.parentSrNumber || "",
          openedFromDraft: Boolean(parsed.openedFromDraft),
        };
      }
    } catch {
      // Fallback
    }

    return {
      customer: "",
      programName: "",
      programYear: "2026",
      year: getCurrentBusinessYear(),
      targetPlant: "",
      parentRequestId: undefined,
      parentSrNumber: "",
      openedFromDraft: false,
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
  const [addModalStep, setAddModalStep] = useState<
    "scopes" | "design_brief" | "sampling_config" | "product_search"
  >("scopes");
  const [selectedScopes, setSelectedScopes] = useState<DeliverableScopeId[]>([]);
  const [scopeTimestamps, setScopeTimestamps] = useState<Record<string, string>>({});

  // Design Fields
  const [designDesc, setDesignDesc] = useState("");
  const [designCount, setDesignCount] = useState<number | "">("");
  const [designDueDate, setDesignDueDate] = useState("");
  const [designTrend, setDesignTrend] = useState("");
  const [designAudience, setDesignAudience] = useState("");
  const [designRemarks, setDesignRemarks] = useState("");

  // Reference Attachments (Up to 2 images and 1 link)
  const [uploadedImages, setUploadedImages] = useState<Array<{ id: string; url: string; name: string; size?: string }>>([]);
  const [webLinks, setWebLinks] = useState<string[]>([]);
  const [linkInput, setLinkInput] = useState<string>("");
  const [mediaTab, setMediaTab] = useState<"files" | "links">("files");
  const [modalError, setModalError] = useState<string | null>(null);

  // Sampling Configuration State
  const [sampleType, setSampleType] = useState<"full" | "partial">("full");
  const [partialRequirements, setPartialRequirements] = useState("");
  const [samplingSearchMode, setSamplingSearchMode] = useState<"material_code" | "binding">("material_code");

  // Mode A: Search by Material Code
  const [materialSearchQuery, setMaterialSearchQuery] = useState("");
  const [materialSearchResults, setMaterialSearchResults] = useState<ProductSearchResult[]>([]);
  const [isSearchingMaterial, setIsSearchingMaterial] = useState(false);
  const [selectedDbSample, setSelectedDbSample] = useState<ProductSearchResult | null>(null);
  const materialSearchSequenceRef = useRef(0);

  // Mode B: Search by Binding (Binding 1 & Binding 2)
  const [bindingHierarchy, setBindingHierarchy] = useState<BindingHierarchyResponse>({
    binding1_options: [],
    hierarchy: {},
  });
  const [selectedBinding1, setSelectedBinding1] = useState("");
  const [selectedBinding2, setSelectedBinding2] = useState("");
  const [bindingSearchResults, setBindingSearchResults] = useState<ProductSearchResult[]>([]);
  const [isSearchingBinding, setIsSearchingBinding] = useState(false);
  const bindingSearchSequenceRef = useRef(0);

  // Staged product description for sampling item
  const [samplingDescription, setSamplingDescription] = useState("");
  const [catalogProductDescription, setCatalogProductDescription] = useState("");

  // Toast / Notifications
  const [toastMsg, setToastMsg] = useState<{ text: string; tone: "success" | "error" } | null>(null);
  const [isSubmittingAll, setIsSubmittingAll] = useState(false);
  const [isReleasing, setIsReleasing] = useState(false);
  const [inspectingProduct, setInspectingProduct] = useState<StagedProductItem | null>(null);
  const [editingProduct, setEditingProduct] = useState<StagedProductItem | null>(null);

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
    setCatalogProductDescription("");
    setBindingSearchResults([]);
    setModalError(null);
  };

  const resetDesignState = () => {
    setDesignDesc("");
    setDesignCount("");
    setDesignDueDate("");
    setDesignTrend("");
    setDesignAudience("");
    setDesignRemarks("");
    setUploadedImages([]);
    setWebLinks([]);
    setLinkInput("");
    setMediaTab("files");
    setModalError(null);
  };

  // Open modal starting in Step 1 (Deliverables Selection)
  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setAddModalStep("scopes");
    setSelectedScopes([]);
    setScopeTimestamps({});
    resetDesignState();
    resetSamplingState();
    setIsAddModalOpen(true);
  };

  // Edit existing staged product specification
  const handleEditProduct = (item: StagedProductItem) => {
    setEditingProduct(item);
    setSelectedScopes([...item.scopes]);
    const cleanedTimestamps: Record<string, string> = {};
    if (item.requestTypeTimestamps) {
      Object.entries(item.requestTypeTimestamps).forEach(([k, v]) => {
        if (v) cleanedTimestamps[k] = v;
      });
    }
    setScopeTimestamps(cleanedTimestamps);
    setModalError(null);

    if (item.designMetadata) {
      setDesignDesc(item.productDescription);
      setDesignCount(item.designMetadata.numberOfDesigns);
      setDesignDueDate(item.designMetadata.designRequiredDate);
      setDesignTrend(item.designMetadata.trend || "");
      setDesignAudience(item.designMetadata.targetAudience || "");
      setDesignRemarks(item.designMetadata.remarks || "");
      setUploadedImages(item.designMetadata.images || []);
      setWebLinks(item.designMetadata.webLinks || []);
    } else {
      setDesignDesc(item.productDescription);
    }

    if (item.samplingMetadata) {
      setSamplingDescription(item.productDescription);
      setSampleType(item.samplingMetadata.sampleType || "full");
      setPartialRequirements(item.samplingMetadata.partialRequirements || "");
      setSelectedBinding1(item.samplingMetadata.bindingType1 || item.customBinding1 || "");
      setSelectedBinding2(item.samplingMetadata.bindingType2 || item.customBinding2 || "");
    }

    if (item.catalogMetadata) {
      setCatalogProductDescription(item.productDescription);
      setSelectedBinding1(item.catalogMetadata.bindingType1 || item.customBinding1 || "");
      setSelectedBinding2(item.catalogMetadata.bindingType2 || item.customBinding2 || "");
    }

    if (item.scopes.includes("design") && item.scopes.length === 1) {
      setAddModalStep("design_brief");
    } else if (item.scopes.includes("sample")) {
      setAddModalStep("sampling_config");
    } else if (item.scopes.includes("mockup") || item.scopes.includes("costing")) {
      setAddModalStep("product_search");
    } else {
      setAddModalStep("scopes");
    }

    setIsAddModalOpen(true);
  };

  // Fetch binding hierarchy and initial database materials on demand
  useEffect(() => {
    if (
      isAddModalOpen &&
      (addModalStep === "sampling_config" || addModalStep === "product_search")
    ) {
      if (bindingHierarchy.binding1_options.length === 0) {
        fetchBindingHierarchyApi()
          .then((res) => {
            setBindingHierarchy(res);
          })
          .catch((err) => console.error("Failed to fetch binding hierarchy:", err));
      }
    }
  }, [isAddModalOpen, addModalStep]);

  // Debounced live material code search
  useEffect(() => {
    if (
      !isAddModalOpen ||
      (addModalStep !== "sampling_config" && addModalStep !== "product_search") ||
      samplingSearchMode !== "material_code"
    ) {
      materialSearchSequenceRef.current += 1;
      setIsSearchingMaterial(false);
      return;
    }
    const requestSequence = ++materialSearchSequenceRef.current;
    const timer = setTimeout(() => {
      setIsSearchingMaterial(true);
      searchProductsByMaterialApi(materialSearchQuery)
        .then((res) => {
          if (materialSearchSequenceRef.current === requestSequence) {
            setMaterialSearchResults(res.slice(0, 30));
          }
        })
        .catch((err) => console.error("Search material error:", err))
        .finally(() => {
          if (materialSearchSequenceRef.current === requestSequence) {
            setIsSearchingMaterial(false);
          }
        });
    }, 250);
    return () => {
      clearTimeout(timer);
      if (materialSearchSequenceRef.current === requestSequence) {
        materialSearchSequenceRef.current += 1;
      }
    };
  }, [materialSearchQuery, addModalStep, samplingSearchMode, isAddModalOpen]);

  // Dynamic filter for Binding 1 & Binding 2
  useEffect(() => {
    if (
      !isAddModalOpen ||
      (addModalStep !== "sampling_config" && addModalStep !== "product_search") ||
      samplingSearchMode !== "binding"
    ) {
      bindingSearchSequenceRef.current += 1;
      setIsSearchingBinding(false);
      return;
    }
    if (!selectedBinding1) {
      setBindingSearchResults([]);
      setIsSearchingBinding(false);
      return;
    }
    const requestSequence = ++bindingSearchSequenceRef.current;
    setIsSearchingBinding(true);
    // The sampling prototype list is filtered by Binding 1. Binding 2 can
    // still describe the requested variant, but must not hide matching products.
    const binding2Filter = addModalStep === "sampling_config" ? undefined : selectedBinding2;
    const resultLimit = addModalStep === "sampling_config" ? undefined : 100;
    searchProductsByBindingApi(selectedBinding1, binding2Filter, undefined, undefined, undefined, resultLimit)
      .then((res) => {
        if (bindingSearchSequenceRef.current === requestSequence) {
          setBindingSearchResults(res);
        }
      })
      .catch((err) => console.error("Search binding error:", err))
      .finally(() => {
        if (bindingSearchSequenceRef.current === requestSequence) {
          setIsSearchingBinding(false);
        }
      });
    return () => {
      if (bindingSearchSequenceRef.current === requestSequence) {
        bindingSearchSequenceRef.current += 1;
      }
    };
  }, [selectedBinding1, selectedBinding2, addModalStep, samplingSearchMode, isAddModalOpen]);

  const handleSelectDbSample = (item: ProductSearchResult) => {
    setSelectedDbSample(item);
    setSamplingDescription(item.product_description || "");
    if (item.binding_type_1) setSelectedBinding1(item.binding_type_1);
    if (item.binding_type_2) setSelectedBinding2(item.binding_type_2);
  };

  const handleSelectCatalogProduct = (item: ProductSearchResult) => {
    handleSelectDbSample(item);
    setCatalogProductDescription(
      item.product_description ? `Copy of ${item.product_description}` : ""
    );
    setModalError(null);
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
  };

  const handleRemoveImage = (id: string) => {
    setUploadedImages((prev) => prev.filter((img) => img.id !== id));
  };

  // Reference Link Handler
  const handleAddWebLink = (e: React.FormEvent | React.MouseEvent | React.KeyboardEvent) => {
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

  const isScopeDisabled = (_scopeId: DeliverableScopeId): boolean => {
    // Up to all four scopes (Design, Mockup, Sample, Costing) may be selected
    return false;
  };

  const handleToggleScope = (scopeId: DeliverableScopeId) => {
    setSelectedScopes((prev) => {
      if (prev.includes(scopeId)) {
        setScopeTimestamps((st) => {
          const next = { ...st };
          delete next[scopeId];
          return next;
        });
        return prev.filter((s) => s !== scopeId);
      }
      setScopeTimestamps((st) => ({
        ...st,
        [scopeId]: new Date().toISOString(),
      }));
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

    // Selecting ONLY Design branches to design-only flow instead of product lookup
    if (selectedScopes.length === 1 && selectedScopes[0] === "design") {
      setAddModalStep("design_brief");
      setModalError(null);
      return;
    }

    if (selectedScopes.includes("sample")) {
      setAddModalStep("sampling_config");
      setModalError(null);
      return;
    }
    setAddModalStep("product_search");
    setModalError(null);
  };

  // Step 2: Submit Design Brief and Stage Product
  const handleStageDesignBrief = async (e: React.FormEvent) => {
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
      setModalError("Design required date is mandatory. Please select a date.");
      showToast("Please select the design required date.", "error");
      return;
    }

    if (selectedScopes.includes("mockup")) {
      setModalError(null);
      setAddModalStep("product_search");
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

    let nextItem: StagedProductItem;
    let nextProducts: StagedProductItem[];

    if (editingProduct) {
      nextItem = {
        ...editingProduct,
        productDescription: designDesc.trim(),
        scopes: [...selectedScopes],
        requestTypeTimestamps: { ...scopeTimestamps },
        designMetadata: {
          numberOfDesigns: Number(designCount) || 1,
          designRequiredDate: designDueDate.trim(),
          trend: designTrend.trim(),
          targetAudience: designAudience.trim(),
          remarks: designRemarks.trim(),
          images: [...uploadedImages],
          webLinks: [...webLinks],
          referenceImage: uploadedImages[0]?.url || webLinks[0] || "",
        },
      };
      nextProducts = stagedProducts.map((p) => (p.id === editingProduct.id ? nextItem : p));
      setEditingProduct(null);
      showToast(`Updated "${nextItem.productDescription}".`);
    } else {
      nextItem = {
        id: `staged-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        materialCode: generatedMaterialCode,
        productDescription: designDesc.trim(),
        scopes: [...selectedScopes],
        requestTypeTimestamps: { ...scopeTimestamps },
        creationMode: "material_code",
        stagedDate: formattedDate,
        timestamp: formattedTime,
        isDraftSaved: false,
        designMetadata: {
          numberOfDesigns: Number(designCount) || 1,
          designRequiredDate: designDueDate.trim(),
          trend: designTrend.trim(),
          targetAudience: designAudience.trim(),
          remarks: designRemarks.trim(),
          images: [...uploadedImages],
          webLinks: [...webLinks],
          referenceImage: uploadedImages[0]?.url || webLinks[0] || "",
        },
      };
      nextProducts = [...stagedProducts, nextItem];
      showToast(`Added "${nextItem.productDescription}" to Product Staging.`);
    }

    setStagedProducts(nextProducts);
    sessionStorage.setItem("samp_active_staged_products", JSON.stringify(nextProducts));
    setIsAddModalOpen(false);
    resetDesignState();

    // Persist staged product directly into Draft in the background
    autoSaveStagedProductsToDraft(nextProducts, programContext, user)
      .then((res) => {
        if (res.success) {
          nextItem.isDraftSaved = true;
          if (res.requestId && !programContext.parentRequestId) {
            setProgramContext((prev) => ({
              ...prev,
              parentRequestId: res.requestId,
              parentSrNumber: res.srNumber || prev.parentSrNumber,
            }));
            const cached = sessionStorage.getItem("samp_active_program_form");
            if (cached) {
              const parsed = JSON.parse(cached);
              parsed.parentRequestId = res.requestId;
              if (res.srNumber) parsed.parentSrNumber = res.srNumber;
              sessionStorage.setItem("samp_active_program_form", JSON.stringify(parsed));
            }
          }
          showToast(`✓ Staged product saved to Draft (${res.srNumber || programContext.parentSrNumber || "Draft queue"}).`);
        }
      })
      .catch((err) => {
        console.error("Auto-save staged product to draft error:", err);
      });
  };

  // Stage the selected catalog product for Mockup or Costing (with the design brief when paired).
  const handleStageCatalogProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDbSample) {
      setModalError("Select a product from the search results to continue.");
      return;
    }

    const productDescription = selectedScopes.includes("design")
      ? designDesc.trim()
      : catalogProductDescription.trim();
    if (!productDescription) {
      setModalError("Enter a description for the new product.");
      return;
    }

    const now = new Date();
    const plantCode = programContext.targetPlant
      ? programContext.targetPlant.split(/[-–\s]/)[0]
      : "1505";
    const materialPrefix = selectedScopes.includes("design")
      ? "DSG"
      : selectedScopes.includes("mockup")
        ? "MUP"
        : "CST";
    const materialCode = `${materialPrefix}-${plantCode}-${Math.floor(1000 + Math.random() * 9000)}`;
    let nextItem: StagedProductItem;
    let nextProducts: StagedProductItem[];

    if (editingProduct) {
      nextItem = {
        ...editingProduct,
        productDescription,
        scopes: [...selectedScopes],
        requestTypeTimestamps: { ...scopeTimestamps },
        sourceSampleRequestId: selectedDbSample.id,
        sourceSampleCode: selectedDbSample.material_code,
        customBinding1: selectedDbSample.binding_type_1 || selectedBinding1 || undefined,
        customBinding2: selectedDbSample.binding_type_2 || selectedBinding2 || undefined,
        catalogMetadata: {
          sourceProductId: selectedDbSample.id,
          sourceRequestNumber: selectedDbSample.sr_number,
          sourceMaterialCode: selectedDbSample.material_code,
          sourceDescription: selectedDbSample.product_description,
          bindingType1: selectedDbSample.binding_type_1 || selectedBinding1 || undefined,
          bindingType2: selectedDbSample.binding_type_2 || selectedBinding2 || undefined,
        },
      };
      nextProducts = stagedProducts.map((p) => (p.id === editingProduct.id ? nextItem : p));
      setEditingProduct(null);
      showToast(`Updated "${nextItem.productDescription}".`);
    } else {
      nextItem = {
        id: `staged-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        materialCode,
        productDescription,
        scopes: [...selectedScopes],
        requestTypeTimestamps: { ...scopeTimestamps },
        creationMode: "material_code",
        sourceSampleRequestId: selectedDbSample.id,
        sourceSampleCode: selectedDbSample.material_code,
        customBinding1: selectedDbSample.binding_type_1 || selectedBinding1 || undefined,
        customBinding2: selectedDbSample.binding_type_2 || selectedBinding2 || undefined,
        stagedDate: now.toISOString().split("T")[0],
        timestamp: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        ...(selectedScopes.includes("design") && {
          designMetadata: {
            numberOfDesigns: Number(designCount) || 1,
            designRequiredDate: designDueDate.trim(),
            trend: designTrend.trim(),
            targetAudience: designAudience.trim(),
            remarks: designRemarks.trim(),
            images: uploadedImages,
            webLinks,
            referenceImage: uploadedImages[0]?.url || webLinks[0] || "",
          },
        }),
        catalogMetadata: {
          sourceProductId: selectedDbSample.id,
          sourceRequestNumber: selectedDbSample.sr_number,
          sourceMaterialCode: selectedDbSample.material_code,
          sourceDescription: selectedDbSample.product_description,
          bindingType1: selectedDbSample.binding_type_1 || selectedBinding1 || undefined,
          bindingType2: selectedDbSample.binding_type_2 || selectedBinding2 || undefined,
        },
      };
      nextProducts = [...stagedProducts, nextItem];
      showToast(`Added "${nextItem.productDescription}" to Product Staging.`);
    }

    setStagedProducts(nextProducts);
    sessionStorage.setItem("samp_active_staged_products", JSON.stringify(nextProducts));
    setIsAddModalOpen(false);
    resetSamplingState();

    // Persist staged product directly into Draft
    autoSaveStagedProductsToDraft(nextProducts, programContext, user)
      .then((res) => {
        if (res.success) {
          nextItem.isDraftSaved = true;
          showToast(`✓ Staged product saved to Draft (${res.srNumber || programContext.parentSrNumber || "Draft queue"}).`);
        }
      })
      .catch((err) => console.error("Auto-save draft error:", err));
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
    const isCustom = samplingSearchMode === "binding";

    let nextItem: StagedProductItem;
    let nextProducts: StagedProductItem[];

    if (editingProduct) {
      nextItem = {
        ...editingProduct,
        productDescription: desc,
        scopes: [...selectedScopes],
        requestTypeTimestamps: { ...scopeTimestamps },
        sourceSampleRequestId: selectedDbSample?.id || editingProduct.sourceSampleRequestId,
        sourceSampleCode: selectedDbSample?.material_code || editingProduct.sourceSampleCode,
        customBinding1: selectedBinding1 || selectedDbSample?.binding_type_1 || editingProduct.customBinding1,
        customBinding2: selectedBinding2 || selectedDbSample?.binding_type_2 || editingProduct.customBinding2,
        samplingMetadata: {
          sampleType,
          partialRequirements: partialRequirements.trim() || undefined,
          searchMode: samplingSearchMode,
          sourceSampleId: selectedDbSample?.id || editingProduct.samplingMetadata?.sourceSampleId,
          sourceSrNumber: selectedDbSample?.sr_number || editingProduct.samplingMetadata?.sourceSrNumber,
          selectedMaterialCode: selectedDbSample?.material_code || editingProduct.samplingMetadata?.selectedMaterialCode,
          bindingType1: selectedBinding1 || selectedDbSample?.binding_type_1 || editingProduct.samplingMetadata?.bindingType1,
          bindingType2: selectedBinding2 || selectedDbSample?.binding_type_2 || editingProduct.samplingMetadata?.bindingType2,
          customerReference: selectedDbSample?.customer || editingProduct.samplingMetadata?.customerReference,
          targetPlant: selectedDbSample?.target_plant || editingProduct.samplingMetadata?.targetPlant,
        },
      };
      nextProducts = stagedProducts.map((p) => (p.id === editingProduct.id ? nextItem : p));
      setEditingProduct(null);
      showToast(`Updated "${nextItem.productDescription}".`);
    } else {
      nextItem = {
        id: `staged-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        materialCode: isCustom && !selectedDbSample ? "" : matCode,
        productDescription: desc,
        scopes: [...selectedScopes],
        requestTypeTimestamps: { ...scopeTimestamps },
        creationMode: isCustom ? "binding" : "material_code",
        sourceSampleRequestId: selectedDbSample?.id,
        sourceSampleCode: selectedDbSample?.material_code,
        customBinding1: selectedBinding1 || selectedDbSample?.binding_type_1,
        customBinding2: selectedBinding2 || selectedDbSample?.binding_type_2,
        stagedDate: formattedDate,
        timestamp: formattedTime,
        isDraftSaved: false,
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
      nextProducts = [...stagedProducts, nextItem];
      showToast(
        `Added Sampling (${sampleType === "full" ? "Full Sample" : "Partial Sample"}): "${nextItem.productDescription}" to Product Staging.`
      );
    }

    setStagedProducts(nextProducts);
    sessionStorage.setItem("samp_active_staged_products", JSON.stringify(nextProducts));
    setIsAddModalOpen(false);
    resetSamplingState();

    // Persist staged product directly into Draft
    autoSaveStagedProductsToDraft(nextProducts, programContext, user)
      .then((res) => {
        if (res.success) {
          nextItem.isDraftSaved = true;
          showToast(`✓ Staged product saved to Draft (${res.srNumber || programContext.parentSrNumber || "Draft queue"}).`);
        }
      })
      .catch((err) => console.error("Auto-save draft error:", err));
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
      materialCode:
        item.scopes.includes("design") && item.scopes.length === 1
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

  // Save current staged products to Drafts explicitly
  const handleSaveAsDraft = async () => {
    if (stagedProducts.length === 0) return;
    setIsSubmittingAll(true);
    hasAutoSavedRef.current = true;

    try {
      sessionStorage.removeItem("samp_active_program_form");
      sessionStorage.removeItem("samp_active_staged_products");

      const res = await autoSaveStagedProductsToDraft(stagedProducts, programContext, user);
      if (res.success) {
        showToast(`Successfully saved ${res.count} specification(s) to Draft queue!`);
        setTimeout(() => {
          navigate("/sample-requests", { state: { refresh: Date.now(), stage: "draft" } });
        }, 700);
      } else {
        throw new Error("Draft save failed");
      }
    } catch {
      showToast("Failed to save staged products to Drafts.", "error");
    } finally {
      setIsSubmittingAll(false);
    }
  };

  // Submit all staged products into Sample Requests & Design pipelines
  const handleSubmitBatch = async () => {
    if (stagedProducts.length === 0) return;
    if (!programContext.customer) {
      showToast("A customer is required before saving products.", "error");
      return;
    }
    setIsSubmittingAll(true);
    hasAutoSavedRef.current = true;

    try {
      sessionStorage.removeItem("samp_active_program_form");
      sessionStorage.removeItem("samp_active_staged_products");
      sessionStorage.removeItem("samp_active_staged_items");
      setStagedProducts([]);

      const res = await autoSaveStagedProductsToDraft(stagedProducts, programContext, user);
      if (res.success) {
      showToast(`Successfully saved ${res.count} product(s) to ${programContext.parentSrNumber || "the request"}. Returning to desk...`);
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

  // Explicitly release the staged draft request to active PMT or Creative workflow
  const handleReleaseRequest = async () => {
    if (!programContext.openedFromDraft) return;
    if (!programContext.customer && !programContext.parentRequestId) {
      showToast("Customer account is required.", "error");
      return;
    }
    if (stagedProducts.length === 0 && !programContext.parentRequestId) {
      showToast("Please add at least one product before releasing.", "error");
      return;
    }

    setIsReleasing(true);
    hasAutoSavedRef.current = true;

    try {
      let targetRequestId = programContext.parentRequestId;
      let targetSrNumber = programContext.parentSrNumber;

      // 1. If there are staged products in memory, persist them to draft first
      if (stagedProducts.length > 0) {
        const res = await autoSaveStagedProductsToDraft(stagedProducts, programContext, user);
        if (res.success) {
          if (res.requestId) targetRequestId = targetRequestId || res.requestId;
          if (res.srNumber) targetSrNumber = targetSrNumber || res.srNumber;
        }
      }

      // 2. Determine target workflow status
      const isDesign = stagedProducts.some((p) => p.scopes.includes("design"));
      const newStatus = isDesign ? "Creative" : "Sampling Review (PMT)";

      // 3. Update status in backend
      if (targetRequestId) {
        await updateSampleRequestApi(targetRequestId, { status: newStatus });
      }

      // 4. Clear staging session storage
      sessionStorage.removeItem("samp_active_program_form");
      sessionStorage.removeItem("samp_active_staged_products");

      const label = targetSrNumber ? `Request ${targetSrNumber}` : "Draft request";
      showToast(`✓ ${label} released into ${newStatus}!`);

      setTimeout(() => {
        navigate("/sample-requests", {
          state: {
            refresh: Date.now(),
            stage: isDesign ? "creative" : "pmt",
          },
        });
      }, 700);
    } catch (err) {
      console.error("Failed to release request from staging:", err);
      showToast("Error releasing request from draft.", "error");
    } finally {
      setIsReleasing(false);
    }
  };

  return (
    <div className="flex-1 flex min-h-0 flex-col overflow-y-auto bg-[#f8f9ff] text-slate-900 dark:bg-[#0c0d14] dark:text-zinc-100">
      {/* Main Container */}
      <div className="mx-auto w-full max-w-[1680px] flex-1 space-y-4 px-4 py-4 sm:px-6 lg:px-8">

        {/* 1. Master Workspace Header (Navigation, Program Context & Action Ribbon) */}
        <StagingWorkspaceHeader
          programContext={programContext}
          stagedProducts={stagedProducts}
          isSubmittingAll={isSubmittingAll}
          isReleasing={isReleasing}
          onNavigateBack={handleReturnToDesk}
          onOpenAddModal={handleOpenAddProduct}
          onClearAll={() => setStagedProducts([])}
          onSaveAsDraft={handleSaveAsDraft}
          onSubmitAll={handleSubmitBatch}
          onReleaseRequest={handleReleaseRequest}
        />

        {/* 2. Staged Products Queue & Table */}
        <StagingProductList
          stagedProducts={stagedProducts}
          onOpenAddModal={handleOpenAddProduct}
          onInspectProduct={(prod) => setInspectingProduct(prod)}
          onEditProduct={handleEditProduct}
          onDuplicateProduct={handleDuplicateStagedItem}
          onRemoveProduct={handleRemoveStagedItem}
        />
      </div>

      {/* 3. Add Product Modal Flow (Steps 1, 2, 3) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
          <div
            className="fixed inset-0 bg-black/60 transition-opacity"
            onClick={() => setIsAddModalOpen(false)}
          />

          <div className="flex min-h-full items-center justify-center p-3 sm:p-5">
            {addModalStep === "scopes" && (
              <AddProductScopesStep
                selectedScopes={selectedScopes}
                isScopeDisabled={isScopeDisabled}
                onToggleScope={handleToggleScope}
                onClose={() => setIsAddModalOpen(false)}
                onProceed={handleProceedFromScopes}
              />
            )}

            {addModalStep === "design_brief" && (
              <AddProductDesignStep
                programContext={programContext}
                selectedScopes={selectedScopes}
                isEditing={Boolean(editingProduct)}
                designDesc={designDesc}
                designCount={designCount}
                designDueDate={designDueDate}
                designTrend={designTrend}
                designAudience={designAudience}
                designRemarks={designRemarks}
                uploadedImages={uploadedImages}
                webLinks={webLinks}
                linkInput={linkInput}
                mediaTab={mediaTab}
                modalError={modalError}
                isSubmitting={isSubmittingAll}
                onSetDesignDesc={setDesignDesc}
                onSetDesignCount={setDesignCount}
                onSetDesignDueDate={setDesignDueDate}
                onSetDesignTrend={setDesignTrend}
                onSetDesignAudience={setDesignAudience}
                onSetDesignRemarks={setDesignRemarks}
                onSetLinkInput={setLinkInput}
                onSetMediaTab={setMediaTab}
                onSetModalError={setModalError}
                onMultipleImageUpload={handleMultipleImageUpload}
                onRemoveImage={handleRemoveImage}
                onAddWebLink={handleAddWebLink}
                onRemoveWebLink={handleRemoveWebLink}
                onBackToScopes={() => {
                  setAddModalStep("scopes");
                  setModalError(null);
                }}
                onClose={() => setIsAddModalOpen(false)}
                onSubmit={handleStageDesignBrief}
              />
            )}

            {addModalStep === "sampling_config" && (
              <AddProductSamplingStep
                modalError={modalError}
                sampleType={sampleType}
                partialRequirements={partialRequirements}
                samplingSearchMode={samplingSearchMode}
                materialSearchQuery={materialSearchQuery}
                materialSearchResults={materialSearchResults}
                isSearchingMaterial={isSearchingMaterial}
                selectedDbSample={selectedDbSample}
                bindingHierarchy={bindingHierarchy}
                selectedBinding1={selectedBinding1}
                selectedBinding2={selectedBinding2}
                bindingSearchResults={bindingSearchResults}
                isSearchingBinding={isSearchingBinding}
                isSubmittingAll={isSubmittingAll}
                onSetModalError={setModalError}
                onSetSampleType={setSampleType}
                onSetPartialRequirements={setPartialRequirements}
                onSetSamplingSearchMode={setSamplingSearchMode}
                onSetMaterialSearchQuery={(query) => {
                  setMaterialSearchQuery(query);
                  setSelectedDbSample(null);
                  setModalError(null);
                }}
                onSelectDbSample={handleSelectDbSample}
                onSelectBinding1={(b1) => {
                  setSelectedBinding1(b1);
                  setSelectedBinding2("");
                  setSelectedDbSample(null);
                  if (b1 && !samplingDescription) {
                    setSamplingDescription(`${b1} Notebook`);
                  }
                }}
                onSelectBinding2={(b2) => {
                  setSelectedBinding2(b2);
                  setSelectedDbSample(null);
                  if (selectedBinding1 && b2) {
                    setSamplingDescription(`${selectedBinding1} Notebook (${b2})`);
                  }
                }}
                onBackToScopes={() => {
                  setAddModalStep("scopes");
                  setModalError(null);
                }}
                onClose={() => setIsAddModalOpen(false)}
                onSubmit={handleStageSamplingProduct}
              />
            )}

            {addModalStep === "product_search" && (
              <AddProductCatalogStep
                purpose={selectedScopes.includes("mockup") ? "mockup" : "costing"}
                includesDesign={selectedScopes.includes("design")}
                selectedScopes={selectedScopes}
                modalError={modalError}
                searchMode={samplingSearchMode}
                materialSearchQuery={materialSearchQuery}
                materialSearchResults={materialSearchResults}
                isSearchingMaterial={isSearchingMaterial}
                selectedProduct={selectedDbSample}
                newProductDescription={catalogProductDescription}
                bindingHierarchy={bindingHierarchy}
                selectedBinding1={selectedBinding1}
                selectedBinding2={selectedBinding2}
                bindingSearchResults={bindingSearchResults}
                isSearchingBinding={isSearchingBinding}
                onSetSearchMode={setSamplingSearchMode}
                onSetMaterialSearchQuery={setMaterialSearchQuery}
                onSelectProduct={handleSelectCatalogProduct}
                onSetNewProductDescription={setCatalogProductDescription}
                onSelectBinding1={(binding1) => {
                  setSelectedBinding1(binding1);
                  setSelectedBinding2("");
                  setSelectedDbSample(null);
                }}
                onSelectBinding2={(binding2) => {
                  setSelectedBinding2(binding2);
                  setSelectedDbSample(null);
                }}
                onBack={() => {
                  setModalError(null);
                  setAddModalStep(selectedScopes.includes("design") ? "design_brief" : "scopes");
                }}
                onClose={() => setIsAddModalOpen(false)}
                onSubmit={handleStageCatalogProduct}
              />
            )}
          </div>
        </div>
      )}

      {/* 4. Inspect Specification Modal Drawer */}
      <StagedProductDrawer
        inspectingProduct={inspectingProduct}
        programYear={programContext.programYear}
        onClose={() => setInspectingProduct(null)}
        onRemoveProduct={(id) => {
          setInspectingProduct(null);
          handleRemoveStagedItem(id);
        }}
        onDuplicateProduct={(item) => {
          setInspectingProduct(null);
          handleDuplicateStagedItem(item);
        }}
        onEditProduct={(item) => {
          setInspectingProduct(null);
          handleEditProduct(item);
        }}
      />

      {/* 5. Floating Bottom Popup Toast Notification */}
      {toastMsg && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-6 right-6 z-[100] max-w-md px-4 py-3 rounded-2xl shadow-2xl border text-xs font-semibold flex items-center justify-between gap-3 transition-all duration-200 ${
            toastMsg.tone === "success"
              ? "border-emerald-200 dark:border-emerald-900/60 bg-white dark:bg-[#161822] text-emerald-800 dark:text-emerald-300 shadow-[0_8px_30px_rgba(0,109,50,0.15)]"
              : "border-rose-200 dark:border-rose-900/60 bg-white dark:bg-[#161822] text-rose-800 dark:text-rose-300 shadow-[0_8px_30px_rgba(225,29,72,0.15)]"
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {toastMsg.tone === "success" ? (
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
              </span>
            ) : (
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-xl bg-rose-100 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400">
                <AlertCircle className="w-4 h-4 stroke-[2.5]" />
              </span>
            )}
            <span className="truncate leading-snug">{toastMsg.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMsg(null)}
            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 shrink-0"
            aria-label="Close notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default ProductStagingWorkspace;
