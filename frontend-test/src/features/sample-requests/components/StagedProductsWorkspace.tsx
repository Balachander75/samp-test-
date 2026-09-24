import React, { useState } from "react";
import { createPortal } from "react-dom";
import {
  CreateSampleRequestForm,
  StagedProductItem,
  ProductSearchResult,
  BindingHierarchyResponse,
  RequestType,
  RequestTypeSelectedAt,
} from "../types";
import { ProductDetailItem } from "../api";
import { UnifiedProductLookup } from "./UnifiedProductLookup";
import { ProductSpecificationsDrawer } from "./ProductSpecificationsDrawer";
import {
  Package,
  Palette,
  Layers,
  Building2,
  Calendar,
  Check,
  Camera,
  DollarSign,
  FileText,
  Plus,
  Trash2,
  Edit3,
  X,
  ArrowLeft,
  ArrowRight,
  Copy,
  RotateCcw,
  Sparkles,
} from "@/components/ui/icons";

export interface StagedProductsWorkspaceProps {
  form: CreateSampleRequestForm;
  stagedProducts: StagedProductItem[];
  bindingHierarchy: BindingHierarchyResponse;
  onUpdateForm: (field: keyof CreateSampleRequestForm, val: string) => void;
  onAddStagedProduct: (item: StagedProductItem) => void;
  onUpdateStagedProduct: (item: StagedProductItem) => void;
  onRemoveStagedProduct: (id: string) => void;
  onCreateAll: () => Promise<void>;
  isCreatingAll: boolean;
  onBackToStep1?: () => void;
  onDesignOnly?: () => void;
  // Search state & handlers
  materialQuery: string;
  onMaterialQueryChange: (q: string) => void;
  onSearchMaterial: () => void;
  isSearchingMaterial: boolean;
  hasSearchedMaterial: boolean;
  materialResults: ProductSearchResult[];
  selectedBinding1: string;
  selectedBinding2: string;
  onBinding1Change: (b1: string) => void;
  onBinding2Change: (b2: string) => void;
  isSearchingBinding: boolean;
  bindingResults: ProductSearchResult[];
  // Preview
  onFetchDetails: (requestId: number) => Promise<ProductDetailItem[]>;
  allClasses: string[];
}

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

export const StagedProductsWorkspace: React.FC<StagedProductsWorkspaceProps> = ({
  form,
  stagedProducts,
  bindingHierarchy,
  onAddStagedProduct,
  onUpdateStagedProduct,
  onRemoveStagedProduct,
  onCreateAll,
  isCreatingAll,
  onBackToStep1,
  onDesignOnly,
  materialQuery,
  onMaterialQueryChange,
  onSearchMaterial,
  isSearchingMaterial,
  hasSearchedMaterial,
  materialResults,
  selectedBinding1,
  selectedBinding2,
  onBinding1Change,
  onBinding2Change,
  isSearchingBinding,
  bindingResults,
  onFetchDetails,
  allClasses,
}) => {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isChoosingRequestType, setIsChoosingRequestType] = useState(false);
  const [selectedRequestTypes, setSelectedRequestTypes] = useState<RequestType[]>([]);
  const [requestTypeSelectedAt, setRequestTypeSelectedAt] = useState<RequestTypeSelectedAt>({});

  // Specifications Drawer State
  const [inspectingProduct, setInspectingProduct] = useState<ProductSearchResult | StagedProductItem | null>(null);
  const [inspectingDetails, setInspectingDetails] = useState<ProductDetailItem[]>([]);
  const [initialBaseDetails, setInitialBaseDetails] = useState<ProductDetailItem[]>([]);
  const [isLoadingSpecs, setIsLoadingSpecs] = useState(false);
  const [addedClasses, setAddedClasses] = useState<string[]>([]);
  const [activeStagedItemId, setActiveStagedItemId] = useState<string | null>(null);

  // Edit Staged Product Info Modal
  const [editingStagedProduct, setEditingStagedProduct] = useState<StagedProductItem | null>(null);

  const openAddProduct = () => {
    setSelectedRequestTypes(["sample"]);
    const now = new Date().toISOString();
    setRequestTypeSelectedAt({
      sample: now,
    });
    setIsChoosingRequestType(true);
    setIsAddOpen(true);
  };

  const toggleRequestType = (requestType: RequestType) => {
    const now = new Date().toISOString();

    if (requestType === "design") {
      // If design is currently selected:
      if (selectedRequestTypes.includes("design")) {
        // Unselecting design removes both design and mockup, and falls back to sample
        setSelectedRequestTypes(["sample"]);
        setRequestTypeSelectedAt({ sample: now, design: null, mockup: null, costing: null });
      } else {
        // Selecting design clears sampling and costing, leaves only design
        setSelectedRequestTypes(["design"]);
        setRequestTypeSelectedAt({ design: now, mockup: null, sample: null, costing: null });
      }
    } else if (requestType === "mockup") {
      // If mockup is currently selected:
      if (selectedRequestTypes.includes("mockup")) {
        // Unselecting mockup leaves design
        setSelectedRequestTypes(["design"]);
        setRequestTypeSelectedAt({ design: now, mockup: null, sample: null, costing: null });
      } else {
        // Selecting mockup MUST also include design, and clear sampling & costing
        setSelectedRequestTypes(["design", "mockup"]);
        setRequestTypeSelectedAt({ design: now, mockup: now, sample: null, costing: null });
      }
    } else if (requestType === "sample") {
      // If sample is currently selected:
      if (selectedRequestTypes.includes("sample")) {
        // If costing is also selected, keep costing
        const next = selectedRequestTypes.filter((t) => t !== "sample");
        if (next.length === 0) {
          // Keep at least sample
          return;
        }
        setSelectedRequestTypes(next);
        setRequestTypeSelectedAt((prev) => ({ ...prev, sample: null }));
      } else {
        // Selecting sample clears design & mockup, keeps/adds sample
        const next: RequestType[] = ["sample", ...(selectedRequestTypes.includes("costing") ? (["costing"] as RequestType[]) : [])];
        setSelectedRequestTypes(next);
        setRequestTypeSelectedAt({ sample: now, costing: selectedRequestTypes.includes("costing") ? now : null, design: null, mockup: null });
      }
    } else if (requestType === "costing") {
      // If costing is currently selected:
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
        // Selecting costing clears design & mockup, keeps/adds costing with sample
        const next: RequestType[] = ["sample", "costing"];
        setSelectedRequestTypes(next);
        setRequestTypeSelectedAt({ sample: now, costing: now, design: null, mockup: null });
      }
    }
  };

  // Combined Results (if search or binding filter is applied)
  const combinedSearchResults = React.useMemo(() => {
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

  // Add Product to Staged List (defaults as Catalog Reference / Clone, or binding for custom)
  const handleAddProduct = (product: ProductSearchResult) => {
    const isCustom = product.id === 0 || Boolean(selectedBinding1);
    const newItem: StagedProductItem = {
      id: `staged-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      materialCode: product.material_code,
      sourceSampleCode: product.material_code,
      productDescription: product.product_description || `${form.programName} Notebook Spec`,
      sourceSampleRequestId: product.id > 0 ? product.id : undefined,
      creationMode: isCustom ? "binding" : "material_code",
      bindingType1: product.binding_type_1 || "—",
      bindingType2: product.binding_type_2 || "—",
      detailsCount: product.details_count || 378,
      customer: product.customer || form.customer,
      targetPlant: product.target_plant || form.targetPlant,
      srNumber: product.sr_number,
      requestTypes: selectedRequestTypes,
      requestTypeSelectedAt,
    };
    onAddStagedProduct(newItem);
    setIsAddOpen(false);
  };

  // Open Specs Drawer for Search Result
  const handleOpenSearchSpecs = async (product: ProductSearchResult) => {
    setActiveStagedItemId(null);
    setInspectingProduct(product);
    setIsLoadingSpecs(true);
    try {
      const details = await onFetchDetails(product.id);
      setInspectingDetails(details);
      setInitialBaseDetails(details);
    } catch {
      setInspectingDetails([]);
      setInitialBaseDetails([]);
    } finally {
      setIsLoadingSpecs(false);
    }
  };

  // Open Specs Drawer for an already Staged Product Item
  const handleOpenStagedSpecs = async (item: StagedProductItem) => {
    setActiveStagedItemId(item.id);
    setInspectingProduct(item);
    setIsLoadingSpecs(true);
    try {
      let base: ProductDetailItem[] = [];
      if (item.sourceSampleRequestId && item.sourceSampleRequestId > 0) {
        base = await onFetchDetails(item.sourceSampleRequestId);
        setInitialBaseDetails(base);
      } else {
        base = await onFetchDetails(0);
        if (item.bindingType1 && item.bindingType1 !== "—") {
          base = base.map((d) => {
            if (d.characteristicName === "BINDINGTYPE1") {
              return { ...d, value: item.bindingType1 };
            }
            if (d.characteristicName === "BINDINGTYPE2" && item.bindingType2 && item.bindingType2 !== "—") {
              return { ...d, value: item.bindingType2 };
            }
            return d;
          });
        }
        setInitialBaseDetails(base);
      }
      if (item.editedDetails && item.editedDetails.length > 0) {
        setInspectingDetails(
          item.editedDetails.map((d, idx) => ({
            id: d.id ?? idx,
            sampleRequestId: d.sampleRequestId ?? (item.sourceSampleRequestId || 0),
            className: d.className,
            characteristicName: d.characteristicName,
            value: d.value,
            uom: d.uom ?? null,
            options: d.options ?? [],
          }))
        );
      } else {
        setInspectingDetails(base);
      }
    } catch {
      setInspectingDetails([]);
      setInitialBaseDetails([]);
    } finally {
      setIsLoadingSpecs(false);
    }
  };

  // Save specifications from Drawer
  const handleSaveDrawerSpecs = async (
    updatedDetails: ProductDetailItem[],
    isCustomized: boolean
  ) => {
    setInspectingDetails(updatedDetails);

    if (activeStagedItemId) {
      // Modifying an existing staged item
      const current = stagedProducts.find((p) => p.id === activeStagedItemId);
      if (current) {
        const originalCode = current.sourceSampleCode || current.materialCode;
        const updatedItem: StagedProductItem = {
          ...current,
          editedDetails: isCustomized ? updatedDetails : undefined,
          creationMode: isCustomized ? "binding" : "material_code",
          materialCode: isCustomized
            ? (!current.materialCode.startsWith("A1-")
                ? `A1-${String(Date.now()).slice(-6)}`
                : current.materialCode)
            : (originalCode && !originalCode.startsWith("A1-")
                ? originalCode
                : current.materialCode),
          sourceSampleCode: originalCode,
        };
        onUpdateStagedProduct(updatedItem);
      }
    } else if (inspectingProduct) {
      // User customized a search result in drawer and clicked save -> Stage as product
      const res = inspectingProduct as ProductSearchResult;
      const assignedCode = isCustomized
        ? `A1-${String(Date.now()).slice(-6)}`
        : res.material_code;
      const newItem: StagedProductItem = {
        id: `staged-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        materialCode: assignedCode,
        productDescription: res.product_description || `${form.programName} Notebook Spec`,
        sourceSampleRequestId: res.id,
        creationMode: isCustomized ? "binding" : "material_code",
        bindingType1: res.binding_type_1 || "—",
        bindingType2: res.binding_type_2 || "—",
        detailsCount: 378,
        customer: res.customer || form.customer,
        targetPlant: res.target_plant || form.targetPlant,
        srNumber: res.sr_number,
        editedDetails: isCustomized ? updatedDetails : undefined,
        requestTypes: selectedRequestTypes,
        requestTypeSelectedAt,
      };
      onAddStagedProduct(newItem);
      setIsAddOpen(false);
    }
  };

  // Clone a staged product
  const handleCloneStagedProduct = (item: StagedProductItem) => {
    const clonedItem: StagedProductItem = {
      ...item,
      id: `staged-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      productDescription: `${item.productDescription} (Copy)`,
    };
    onAddStagedProduct(clonedItem);
  };

  return (
    <div className="space-y-5">
      {/* 1. Header & Step 2 Navigation */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 dark:border-slate-800/80 pb-4">
          {onBackToStep1 ? (
            <button
              type="button"
              onClick={onBackToStep1}
              className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-600 dark:text-slate-300 transition-all hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs cursor-pointer w-fit"
            >
              <ArrowLeft size={13} className="transition-transform group-hover:-translate-x-0.5 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200" />
              <span>Back to Program Setup</span>
            </button>
          ) : (
            <div />
          )}

          {/* Stepper Progress */}
          <div className="flex items-center gap-2 text-xs select-none">
            {onBackToStep1 ? (
              <button
                type="button"
                onClick={onBackToStep1}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-emerald-300/80 bg-emerald-50/80 dark:bg-emerald-950/60 font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100/70 transition-colors cursor-pointer"
                title="Edit Program Details"
              >
                <Check size={11} strokeWidth={3} className="text-emerald-600" />
                <span>Step 1: Program Setup</span>
              </button>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-emerald-300/80 bg-emerald-50/80 dark:bg-emerald-950/60 font-semibold text-emerald-700 dark:text-emerald-300">
                <Check size={11} strokeWidth={3} className="text-emerald-600" />
                <span>Step 1: Program Setup</span>
              </div>
            )}

            <span className="w-4 h-[1.5px] bg-slate-300 dark:bg-slate-700" />

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-500/30 bg-blue-50/80 dark:bg-blue-950/70 font-bold text-blue-700 dark:text-blue-300 shadow-2xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
              </span>
              <span>Step 2: Product Staging</span>
            </div>
          </div>
        </div>

        {/* Title, Program Summary & Primary Action */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Product Staging
            </h1>
            <p className="mt-0.5 text-xs font-medium text-slate-500 dark:text-slate-400">
              Stage and configure product specifications that belong in this marketing request batch.
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={openAddProduct}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-3.5 text-xs font-bold text-white shadow-sm shadow-blue-500/25 transition-all hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 active:scale-[0.98] cursor-pointer"
            >
              <Plus size={14} className="stroke-[2.5]" />
              <span>Add product</span>
            </button>

            {stagedProducts.length > 0 && (
              <button
                type="button"
                onClick={onCreateAll}
                disabled={isCreatingAll}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 px-3.5 text-xs font-bold text-white shadow-sm shadow-emerald-500/25 transition-all hover:from-emerald-700 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
              >
                {isCreatingAll ? (
                  <>
                    <RotateCcw size={13} className="animate-spin stroke-[2.5]" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Check size={13} strokeWidth={3} />
                    <span>Submit Request ({stagedProducts.length})</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Executive Program Context Strip */}
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 overflow-hidden rounded-xl border border-slate-200/90 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-sm"
          aria-label="Sample request context"
        >
          {/* Customer */}
          <div className="flex min-w-0 items-center gap-3 border-b sm:border-b-0 border-r border-slate-100 dark:border-slate-800 px-4 py-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/60 dark:to-indigo-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60 shadow-2xs">
              <Building2 size={16} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Customer Account</p>
              <p className="mt-0.5 truncate text-xs font-bold text-slate-900 dark:text-slate-100" title={form.customer || "Customer not selected"}>
                {form.customer || "Customer not selected"}
              </p>
            </div>
          </div>

          {/* Program */}
          <div className="flex min-w-0 items-center gap-3 border-b sm:border-b-0 border-r border-slate-100 dark:border-slate-800 px-4 py-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-50 to-fuchsia-50 dark:from-purple-950/60 dark:to-fuchsia-950/60 text-purple-600 dark:text-purple-400 border border-purple-200/60 dark:border-purple-800/60 shadow-2xs">
              <FileText size={16} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Program Name</p>
              <p className="mt-0.5 truncate text-xs font-bold text-slate-900 dark:text-slate-100" title={form.programName || "Program not named"}>
                {form.programName || "Program not named"}
              </p>
            </div>
          </div>

          {/* Season & Plant */}
          <div className="flex min-w-0 items-center gap-3 border-b lg:border-b-0 border-r border-slate-100 dark:border-slate-800 px-4 py-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/60 dark:to-orange-950/60 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/60 shadow-2xs">
              <Calendar size={16} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Season & Plant</p>
              <p className="mt-0.5 truncate text-xs font-bold text-slate-900 dark:text-slate-100">
                {form.programYear || form.year || "2026"} • {form.targetPlant || "Khaniwade"}
              </p>
            </div>
          </div>

          {/* Edit Action */}
          <div className="flex items-center justify-between px-4 py-3 bg-slate-50/50 dark:bg-slate-800/30">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Context Status</p>
              <p className="mt-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <Check size={11} strokeWidth={3} />
                <span>Program Locked</span>
              </p>
            </div>
            {onBackToStep1 && (
              <button
                type="button"
                onClick={onBackToStep1}
                className="text-[11px] font-semibold px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white shadow-2xs hover:bg-slate-50 cursor-pointer transition-all"
              >
                Edit
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Add Products Modal Window */}
      {isAddOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-3 sm:p-5 animate-in fade-in duration-150"
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsAddOpen(false);
            }}
          >
              <div className={`flex ${isChoosingRequestType ? "h-auto max-h-[85vh] max-w-2xl" : "h-[740px] max-h-[90vh] max-w-4xl"} w-full flex-col overflow-hidden rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl animate-in zoom-in-[0.98] duration-200 transition-all`}>
              {/* Modal Header */}
              <div className="px-6 py-4.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0 bg-white dark:bg-slate-900">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                    {isChoosingRequestType ? "Select Deliverables" : "Add Product to Request"}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {isChoosingRequestType
                      ? "Choose the services required for this product."
                      : "Search catalog products by Material Code or explore options by Binding Style hierarchy."}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {!isChoosingRequestType && (
                    <button
                      type="button"
                      onClick={() => setIsChoosingRequestType(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                    >
                      <ArrowLeft size={13} />
                      <span>Change types</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsAddOpen(false)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Close (Esc)"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto flex-1">
                {isChoosingRequestType ? (
                  <div className="w-full space-y-4">
                    {/* 4 Cards Grid - Direct, Clean & Ultra Crisp */}
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

                    {/* Modal Footer Controls */}
                    <div className="flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => setIsAddOpen(false)}
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
                            onClick={() => {
                              setIsAddOpen(false);
                              if (onDesignOnly) onDesignOnly();
                            }}
                            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 px-5 text-xs font-bold text-white shadow-sm shadow-blue-500/20 transition-all cursor-pointer active:scale-[0.98]"
                          >
                            <span>Continue to Design Request</span>
                            <ArrowRight size={13} className="stroke-[2.5]" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setIsChoosingRequestType(false)}
                            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 px-5 text-xs font-bold text-white shadow-sm shadow-blue-500/20 transition-all cursor-pointer active:scale-[0.98]"
                          >
                            <span>Continue to Product Search</span>
                            <ArrowRight size={13} className="stroke-[2.5]" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <UnifiedProductLookup
                    bindingHierarchy={bindingHierarchy}
                    query={materialQuery}
                    onQueryChange={onMaterialQueryChange}
                    onSearch={onSearchMaterial}
                    isLoading={isSearchingMaterial}
                    hasSearched={hasSearchedMaterial || Boolean(selectedBinding1)}
                    results={combinedSearchResults}
                    selectedBinding1={selectedBinding1}
                    selectedBinding2={selectedBinding2}
                    onBinding1Change={onBinding1Change}
                    onBinding2Change={onBinding2Change}
                    isSearchingBinding={isSearchingBinding}
                    onAddProduct={handleAddProduct}
                    onPreviewSpecs={handleOpenSearchSpecs}
                    onClose={() => setIsAddOpen(false)}
                  />
                )}
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* 3. Staged Products List */}
      <div className="space-y-3">
        {stagedProducts.length === 0 ? (
          <div className="flex min-h-[260px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center shadow-card dark:border-slate-800 dark:bg-slate-900 sm:min-h-[280px]">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-600 dark:border-blue-900/50 dark:bg-blue-950/60 dark:text-blue-400 shadow-2xs">
              <Package size={18} />
            </div>
            <div className="mt-3.5 max-w-sm space-y-1">
              <h3 className="text-sm font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Your staging list is empty
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Search by material code or binding style, then add products to this request.
              </p>
            </div>
            <button
              type="button"
              onClick={openAddProduct}
              className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-3.5 text-xs font-bold text-white shadow-sm shadow-blue-500/25 transition-all hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 active:scale-[0.98] cursor-pointer"
            >
              <Plus size={14} className="stroke-[2.5]" />
              <span>Add first product</span>
            </button>
          </div>
        ) : (
          <>
            {/* Products count strip */}
            <div className="flex items-center justify-between gap-3 px-0.5">
              <div>
                <h2 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">Staged products</h2>
                <p className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">
                  {stagedProducts.length} {stagedProducts.length === 1 ? "product" : "products"} ready for this request
                </p>
              </div>
              <button
                type="button"
                onClick={openAddProduct}
                className="inline-flex h-7.5 items-center gap-1.5 rounded-lg border border-slate-200/90 bg-white px-2.5 text-xs font-semibold text-slate-700 transition-colors hover:border-blue-200 hover:bg-slate-50 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-blue-800 dark:hover:bg-slate-800 dark:hover:text-blue-300 cursor-pointer shadow-2xs"
              >
                <Plus size={12} />
                <span>Add another</span>
              </button>
            </div>

            <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden">
              {stagedProducts.map((item, idx) => {
                const isCustomized = item.creationMode === "binding" || Boolean(item.editedDetails && item.editedDetails.length > 0);
                const isLast = idx === stagedProducts.length - 1;
                return (
                  <div
                    key={item.id}
                    className={`group relative flex items-center gap-4 px-4 py-4 bg-white dark:bg-slate-900 hover:bg-blue-50/30 dark:hover:bg-blue-950/10 transition-colors duration-100 ${
                      !isLast ? "border-b border-slate-100 dark:border-slate-800" : ""
                    }`}
                  >
                    {/* Left accent on hover */}
                    <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-150 rounded-r" />

                    {/* Index */}
                    <span className="text-[11px] font-mono font-bold text-slate-300 dark:text-slate-700 w-5 shrink-0 text-right select-none">
                      {idx + 1}
                    </span>

                    {/* Main content */}
                    <div className="flex-1 min-w-0 space-y-1">
                      {/* Badges row */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono font-bold text-xs text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/80 px-2 py-0.5 rounded-md border border-blue-200/70 dark:border-blue-800/60 shrink-0">
                          {item.materialCode}
                        </span>
                        {item.bindingType1 && item.bindingType1 !== "—" && (
                          <span className="text-[11px] text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded font-medium truncate max-w-[220px]">
                            {item.bindingType1}{item.bindingType2 && item.bindingType2 !== "—" ? ` · ${item.bindingType2}` : ""}
                          </span>
                        )}
                        {isCustomized ? (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border border-violet-200/60 dark:border-violet-800/50 inline-flex items-center gap-1 shrink-0">
                            <Sparkles size={9} />
                            Custom
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-400 inline-flex items-center gap-1 shrink-0">
                            <Copy size={9} />
                            Catalog Ref
                          </span>
                        )}
                        {item.requestTypes && item.requestTypes.length > 0 && (
                          <span className="inline-flex shrink-0 items-center rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                            {item.requestTypes
                              .map((type) => REQUEST_TYPE_OPTIONS.find((option) => option.id === type)?.label || type)
                              .join(" · ")}
                          </span>
                        )}
                      </div>

                      {/* Product name */}
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate leading-tight">
                        {item.productDescription}
                      </p>

                      {/* Meta */}
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500">
                        <span>378 specs</span>
                        <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700 shrink-0" />
                        <span>{item.sourceSampleRequestId ? `SR #${item.sourceSampleRequestId}` : "Custom build"}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700 shrink-0" />
                        <span>{item.targetPlant || form.targetPlant || "Khaniwade"}</span>
                      </div>
                    </div>

                    {/* Actions — reveal on hover */}
                    <div className="flex shrink-0 items-center gap-1 opacity-100 transition-opacity duration-150 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                      <button
                        type="button"
                        onClick={() => handleOpenStagedSpecs(item)}
                        className="h-8 px-2.5 rounded-lg text-[11px] font-semibold bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200/70 dark:border-blue-800/60 transition-colors flex items-center gap-1 cursor-pointer"
                        title="Configure specifications"
                      >
                        <Layers size={11} />
                        <span>Specs</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setEditingStagedProduct(item)}
                        className="h-8 px-2.5 text-[11px] font-semibold rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors flex items-center gap-1 cursor-pointer"
                        title="Edit details"
                      >
                        <Edit3 size={11} />
                        <span className="hidden sm:inline">Edit</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCloneStagedProduct(item)}
                        className="h-8 px-2.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
                        title="Duplicate"
                      >
                        <Copy size={11} />
                        <span className="hidden sm:inline">Clone</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onRemoveStagedProduct(item.id)}
                        className="h-8 w-8 flex items-center justify-center text-slate-300 dark:text-slate-700 hover:text-rose-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg border border-transparent hover:border-rose-200 dark:hover:border-rose-900/60 transition-all cursor-pointer"
                        title="Remove"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* 4. Specifications Drawer */}
      {inspectingProduct && (
        <ProductSpecificationsDrawer
          product={inspectingProduct}
          details={inspectingDetails}
          initialBaseDetails={initialBaseDetails}
          isLoading={isLoadingSpecs}
          specMode={activeStagedItemId ? "binding" : "view"}
          allowEdit={Boolean(activeStagedItemId)}
          allProductClasses={allClasses}
          addedClasses={addedClasses}
          onAddClass={(cls) => setAddedClasses((prev) => [...prev, cls])}
          onRemoveClass={(cls) => setAddedClasses((prev) => prev.filter((c) => c !== cls))}
          onSave={handleSaveDrawerSpecs}
          onClose={() => {
            setInspectingProduct(null);
            setInspectingDetails([]);
            setInitialBaseDetails([]);
            setActiveStagedItemId(null);
          }}
        />
      )}

      {/* 5. Edit Staged Product Info Modal */}
      {editingStagedProduct &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="flex max-h-[calc(100vh-2rem)] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl animate-in zoom-in-[0.98] duration-200">
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Edit3 size={14} className="text-blue-600 dark:text-blue-400" />
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Edit Product Details
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingStagedProduct(null)}
                  className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="p-4 space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Product Description
                  </label>
                  <input
                    type="text"
                    value={editingStagedProduct.productDescription}
                    onChange={(e) =>
                      setEditingStagedProduct({
                        ...editingStagedProduct,
                        productDescription: e.target.value,
                      })
                    }
                    className="w-full h-10 px-3 text-xs sm:text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Barcode</label>
                    <input
                      type="text"
                      value={editingStagedProduct.barcode || ""}
                      onChange={(e) =>
                        setEditingStagedProduct({ ...editingStagedProduct, barcode: e.target.value })
                      }
                      placeholder="Optional barcode"
                      className="w-full h-9 px-3 text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Product Type</label>
                    <input
                      type="text"
                      value={editingStagedProduct.productType || ""}
                      onChange={(e) =>
                        setEditingStagedProduct({
                          ...editingStagedProduct,
                          productType: e.target.value,
                        })
                      }
                      placeholder="Optional type"
                      className="w-full h-9 px-3 text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                    />
                  </div>
                </div>
              </div>

              <div className="p-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2 bg-slate-50/50 dark:bg-slate-850/30">
                <button
                  type="button"
                  onClick={() => setEditingStagedProduct(null)}
                  className="h-9 px-3.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onUpdateStagedProduct(editingStagedProduct);
                    setEditingStagedProduct(null);
                  }}
                  className="h-9 px-4 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs cursor-pointer active:scale-98"
                >
                  Apply Changes
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
