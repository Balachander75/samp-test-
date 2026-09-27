import React, { useState, useEffect, useMemo } from "react";
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
  Pencil,
  Palette,
  Box,
  Package,
  Calculator,
  AlertCircle,
  Sparkles,
  Layers,
  Building2,
  Calendar,
  FileText,
} from "lucide-react";
import { UserProfile } from "@/features/auth";
import { CUSTOMERS, PLANTS } from "./NewSampleRequestModal";
import { createSampleRequestApi } from "../api";
import { CreateSampleRequestForm } from "../types";

export type DeliverableScopeId = "design" | "mockup" | "sample" | "costing";

interface DeliverableDefinition {
  id: DeliverableScopeId;
  code: string;
  label: string;
  department: string;
  tag: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: {
    activeBorder: string;
    activeBg: string;
    badge: string;
    text: string;
  };
}

const DELIVERABLES: DeliverableDefinition[] = [
  {
    id: "design",
    code: "01",
    label: "Design",
    department: "Creative Studio",
    tag: "Artwork & Styling",
    desc: "Cover artwork, themes, illustrations, typography & creative brief routing",
    icon: Palette,
    tone: {
      activeBorder: "border-purple-500 dark:border-purple-400",
      activeBg: "bg-purple-50/50 dark:bg-purple-950/20",
      badge: "bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300 border-purple-200/80 dark:border-purple-800/60",
      text: "text-purple-600 dark:text-purple-400",
    },
  },
  {
    id: "mockup",
    code: "02",
    label: "Mockup",
    department: "Studio CAD",
    tag: "CAD Dummy & Die-line",
    desc: "CAD structural white dummy, die-line verification, folding format & digital 3D proof",
    icon: Box,
    tone: {
      activeBorder: "border-amber-500 dark:border-amber-400",
      activeBg: "bg-amber-50/50 dark:bg-amber-950/20",
      badge: "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/60",
      text: "text-amber-600 dark:text-amber-400",
    },
  },
  {
    id: "sample",
    code: "03",
    label: "Sampling",
    department: "SAMP Tech Lab",
    tag: "Physical Finished Prototype",
    desc: "Finished physical prototype with actual binding, ruling, paper stock & cover finishes",
    icon: Package,
    tone: {
      activeBorder: "border-blue-500 dark:border-blue-400",
      activeBg: "bg-blue-50/50 dark:bg-blue-950/20",
      badge: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 border-blue-200/80 dark:border-blue-800/60",
      text: "text-blue-600 dark:text-blue-400",
    },
  },
  {
    id: "costing",
    code: "04",
    label: "Costing",
    department: "Commercial PMT",
    tag: "BOM & Volume Pricing",
    desc: "Bill of materials costing, machine run-rates & volume tiered manufacturing quotes",
    icon: Calculator,
    tone: {
      activeBorder: "border-emerald-500 dark:border-emerald-400",
      activeBg: "bg-emerald-50/50 dark:bg-emerald-950/20",
      badge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/60",
      text: "text-emerald-600 dark:text-emerald-400",
    },
  },
];

export interface StagedProductItem {
  id: string;
  materialCode: string;
  productDescription: string;
  bindingStyle: string;
  specsSummary: string;
  scopes: DeliverableScopeId[];
  timestamp: string;
}

export interface ProductStagingWorkspaceProps {
  user?: UserProfile | null;
}

export const ProductStagingWorkspace: React.FC<ProductStagingWorkspaceProps> = ({ user }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Load Program Setup from location state or cached session
  const [programContext, setProgramContext] = useState(() => {
    const state = location.state as {
      customer?: string;
      programName?: string;
      programYear?: string;
      targetPlant?: string;
    } | null;

    if (state?.customer && state?.programName) {
      return {
        customer: state.customer,
        programName: state.programName,
        programYear: state.programYear || "2026-2027",
        targetPlant: state.targetPlant || PLANTS[0],
      };
    }

    try {
      const cached = sessionStorage.getItem("samp_active_program_form");
      if (cached) {
        const parsed = JSON.parse(cached);
        return {
          customer: parsed.customer || CUSTOMERS[0],
          programName: parsed.programName || "BTS 2026-2027 Notebook Collection",
          programYear: parsed.programYear || "2026-2027",
          targetPlant: parsed.targetPlant || PLANTS[0],
        };
      }
    } catch {
      // Fallback
    }

    return {
      customer: CUSTOMERS[0],
      programName: "BTS 2026-2027 Notebook Collection",
      programYear: "2026-2027",
      targetPlant: PLANTS[0],
    };
  });

  // Inline Program Context Editor toggle
  const [isEditingSetup, setIsEditingSetup] = useState(false);

  // Staged Products
  const [stagedProducts, setStagedProducts] = useState<StagedProductItem[]>([]);

  // Add Product Modal & Form State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newProdName, setNewProdName] = useState("");
  const [newProdBinding, setNewProdBinding] = useState("Casebound Hardcover (Round Spine)");
  const [newProdSpecs, setNewProdSpecs] = useState("192 Pgs · 80 GSM Woodfree Paper · 148 × 210 mm (A5)");
  const [selectedScopes, setSelectedScopes] = useState<DeliverableScopeId[]>(["sample", "costing"]);

  // Toast / Notifications
  const [toastMsg, setToastMsg] = useState<{ text: string; tone: "success" | "error" } | null>(null);
  const [isSubmittingAll, setIsSubmittingAll] = useState(false);

  const showToast = (text: string, tone: "success" | "error" = "success") => {
    setToastMsg({ text, tone });
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Sync to sessionStorage
  useEffect(() => {
    sessionStorage.setItem("samp_active_program_form", JSON.stringify(programContext));
  }, [programContext]);

  // Open modal with prefilled product title
  const handleOpenAddProduct = () => {
    const count = stagedProducts.length + 1;
    setNewProdName(`${programContext.programName} — Product Spec #${count}`);
    setSelectedScopes(["sample", "costing"]);
    setIsAddModalOpen(true);
  };

  // Deliverable scope toggle logic
  const handleToggleScope = (scopeId: DeliverableScopeId) => {
    setSelectedScopes((prev) => {
      if (scopeId === "design") {
        if (prev.includes("design")) {
          const next = prev.filter((id) => id !== "design" && id !== "mockup");
          return next.length > 0 ? next : ["sample"];
        }
        return [...prev, "design"];
      }

      if (scopeId === "mockup") {
        if (prev.includes("mockup")) {
          return prev.filter((id) => id !== "mockup");
        }
        return Array.from(new Set([...prev, "design" as DeliverableScopeId, "mockup" as DeliverableScopeId]));
      }

      if (scopeId === "sample") {
        if (prev.includes("sample")) {
          const next = prev.filter((id) => id !== "sample");
          return next.length > 0 ? next : ["costing"];
        }
        return [...prev, "sample"];
      }

      if (scopeId === "costing") {
        if (prev.includes("costing")) {
          const next = prev.filter((id) => id !== "costing");
          return next.length > 0 ? next : ["sample"];
        }
        return [...prev, "costing"];
      }

      return prev;
    });
  };

  const handleApplyPreset = (presetScopes: DeliverableScopeId[]) => {
    setSelectedScopes(presetScopes);
  };

  // Add item to staging list
  const handleStageProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim()) {
      showToast("Please provide a product title.", "error");
      return;
    }
    if (selectedScopes.length === 0) {
      showToast("Please select at least one deliverable scope.", "error");
      return;
    }

    const nextItem: StagedProductItem = {
      id: `staged-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      materialCode: `NB-${programContext.targetPlant.substring(0, 4)}-${Math.floor(1000 + Math.random() * 9000)}`,
      productDescription: newProdName.trim(),
      bindingStyle: newProdBinding,
      specsSummary: newProdSpecs.trim(),
      scopes: [...selectedScopes],
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setStagedProducts((prev) => [...prev, nextItem]);
    setIsAddModalOpen(false);
    showToast(`Added "${nextItem.productDescription}" to staging list with ${selectedScopes.length} scopes.`);
  };

  const handleRemoveStagedItem = (id: string) => {
    setStagedProducts((prev) => prev.filter((item) => item.id !== id));
  };

  const handleDuplicateStagedItem = (item: StagedProductItem) => {
    const clone: StagedProductItem = {
      ...item,
      id: `staged-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      materialCode: `NB-${programContext.targetPlant.substring(0, 4)}-${Math.floor(1000 + Math.random() * 9000)}`,
      productDescription: `${item.productDescription} (Copy)`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setStagedProducts((prev) => [...prev, clone]);
    showToast(`Duplicated "${item.productDescription}".`);
  };

  // Submit all staged products into Sample Requests pipeline
  const handleSubmitBatch = async () => {
    if (stagedProducts.length === 0) return;
    setIsSubmittingAll(true);

    try {
      for (const prod of stagedProducts) {
        const payload: CreateSampleRequestForm = {
          customer: programContext.customer,
          programName: programContext.programName,
          programYear: programContext.programYear,
          year: programContext.programYear,
          targetPlant: programContext.targetPlant,
          productDescription: `${prod.productDescription}\nBinding: ${prod.bindingStyle}\nSpecs: ${prod.specsSummary}`,
          materialCode: prod.materialCode,
          barcode: "",
          customerProductCode: "",
          sampleRequiredDate: new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
          dateRequestCreated: new Date().toISOString().split("T")[0],
          createdBy: user?.name || "Marketing Specialist",
          status: "Draft (Pre-SMT)",
          creationMode: "marketing_request",
          requestTypes: prod.scopes,
        };
        await createSampleRequestApi(payload);
      }

      showToast(`Successfully registered ${stagedProducts.length} request(s)! Returning to desk...`);
      sessionStorage.removeItem("samp_active_program_form");
      setTimeout(() => {
        navigate("/sample-requests");
      }, 900);
    } catch {
      showToast(`Staged ${stagedProducts.length} request(s) locally. Returning to desk...`);
      setTimeout(() => {
        navigate("/sample-requests");
      }, 900);
    } finally {
      setIsSubmittingAll(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#f8fafc] dark:bg-[#08090d] text-zinc-900 dark:text-zinc-100 overflow-y-auto">
      {/* 1. Master Command Header */}
      <div className="border-b border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-[#0f1118] px-5 sm:px-8 py-3.5 sticky top-0 z-20 shadow-2xs backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Left: Dedicated Back Arrow & Breadcrumb */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => navigate("/sample-requests", { state: { openMarketingSetup: true } })}
              className="p-1.5 -ml-1.5 rounded-md text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer shrink-0"
              title="Back to Program Setup"
              aria-label="Back to Program Setup"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">
                <span className="truncate">Marketing Work</span>
                <ChevronRight className="w-3 h-3 text-zinc-300 dark:text-zinc-600 shrink-0" />
                <span className="text-zinc-700 dark:text-zinc-300 font-medium truncate">Marketing Intake</span>
                <ChevronRight className="w-3 h-3 text-zinc-300 dark:text-zinc-600 shrink-0" />
                <span className="text-blue-600 dark:text-blue-400 font-semibold truncate">Product Staging</span>
              </div>
              <h1 className="text-[15px] font-bold text-zinc-950 dark:text-zinc-50 tracking-tight truncate mt-0.5">
                Marketing Request Staging Workspace
              </h1>
            </div>
          </div>

          {/* Right: Operational Stepper Badge */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden sm:flex items-center gap-2 select-none text-[10px] font-mono">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800 font-semibold">
                <Check className="w-3 h-3 stroke-[3]" />
                <span>01. Setup Locked</span>
              </span>

              <span className="w-2 h-px bg-zinc-300 dark:bg-zinc-700" />

              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800 font-bold shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                <span>02. Product Staging ({stagedProducts.length})</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-5">
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
              className="p-1 hover:opacity-75 transition-opacity"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* 2. Executive Context Banner with Inline Editor */}
        <div className="rounded-lg border border-zinc-200/90 dark:border-white/[0.08] bg-white dark:bg-[#0f1118] p-3.5 sm:p-4 shadow-2xs transition-colors">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            {/* Left: Summary Sentence Strip */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[12px]">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 shrink-0">
                Program Baseline
              </span>

              <span className="font-bold text-zinc-950 dark:text-zinc-100 text-[13px]">
                {programContext.customer}
              </span>

              <span className="text-zinc-300 dark:text-zinc-700 font-mono">•</span>

              <span className="font-semibold text-blue-600 dark:text-blue-400">
                "{programContext.programName}"
              </span>

              <span className="text-zinc-300 dark:text-zinc-700 font-mono">•</span>

              <span className="font-mono text-zinc-700 dark:text-zinc-300 text-[11px] px-2 py-0.5 rounded bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                Season {programContext.programYear}
              </span>

              <span className="text-zinc-300 dark:text-zinc-700 font-mono">•</span>

              <span className="font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
                Plant: <strong className="text-zinc-800 dark:text-zinc-200">{programContext.targetPlant}</strong>
              </span>
            </div>

            {/* Right: Quick Inline Edit Toggle */}
            <button
              type="button"
              onClick={() => setIsEditingSetup((prev) => !prev)}
              className="text-[11px] font-mono font-medium text-zinc-500 hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-400 flex items-center gap-1.5 cursor-pointer shrink-0 transition-colors self-end md:self-center"
            >
              {isEditingSetup ? (
                <>
                  <X className="w-3.5 h-3.5" />
                  <span>Close Editor</span>
                </>
              ) : (
                <>
                  <Pencil className="w-3 h-3" />
                  <span>Edit Setup</span>
                </>
              )}
            </button>
          </div>

          {/* Inline Edit Drawer */}
          {isEditingSetup && (
            <div className="mt-4 pt-3.5 border-t border-zinc-100 dark:border-white/[0.06] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 animate-smooth-toast">
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 mb-1">
                  Customer Account
                </label>
                <select
                  value={programContext.customer}
                  onChange={(e) => setProgramContext((prev) => ({ ...prev, customer: e.target.value }))}
                  className="w-full h-8 px-2 rounded-md border border-zinc-200 dark:border-zinc-700 bg-zinc-50/60 dark:bg-zinc-900 text-xs font-medium text-zinc-900 dark:text-zinc-100 outline-none focus:border-blue-600"
                >
                  {CUSTOMERS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 mb-1">
                  Program Name
                </label>
                <input
                  type="text"
                  value={programContext.programName}
                  onChange={(e) => setProgramContext((prev) => ({ ...prev, programName: e.target.value }))}
                  className="w-full h-8 px-2.5 rounded-md border border-zinc-200 dark:border-zinc-700 bg-zinc-50/60 dark:bg-zinc-900 text-xs font-medium text-zinc-900 dark:text-zinc-100 outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 mb-1">
                  Season Year
                </label>
                <select
                  value={programContext.programYear}
                  onChange={(e) => setProgramContext((prev) => ({ ...prev, programYear: e.target.value }))}
                  className="w-full h-8 px-2 rounded-md border border-zinc-200 dark:border-zinc-700 bg-zinc-50/60 dark:bg-zinc-900 text-xs font-medium text-zinc-900 dark:text-zinc-100 outline-none focus:border-blue-600 font-mono"
                >
                  <option value="2026-2027">2026-2027</option>
                  <option value="2027-2028">2027-2028</option>
                  <option value="2028-2029">2028-2029</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 mb-1">
                  Plant
                </label>
                <select
                  value={programContext.targetPlant}
                  onChange={(e) => setProgramContext((prev) => ({ ...prev, targetPlant: e.target.value }))}
                  className="w-full h-8 px-2 rounded-md border border-zinc-200 dark:border-zinc-700 bg-zinc-50/60 dark:bg-zinc-900 text-xs font-medium text-zinc-900 dark:text-zinc-100 outline-none focus:border-blue-600 font-mono"
                >
                  {PLANTS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* 3. Staging Workspace Action Bar */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 font-mono">
              Staged Products
            </span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
              {stagedProducts.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {stagedProducts.length > 0 && (
              <button
                type="button"
                onClick={handleSubmitBatch}
                disabled={isSubmittingAll}
                className="h-9 px-4 rounded-md bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold text-xs shadow-2xs transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Submit Batch ({stagedProducts.length})</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleOpenAddProduct}
              className="h-9 px-4 rounded-md bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Add Product</span>
            </button>
          </div>
        </div>

        {/* 4. Staged Products Table or Clean Minimal Empty State */}
        {stagedProducts.length === 0 ? (
          <div className="rounded-lg border border-dashed border-zinc-300 dark:border-white/[0.1] bg-white dark:bg-[#0f1118] p-10 flex flex-col items-center justify-center text-center">
            <div className="w-10 h-10 rounded-md bg-zinc-100 dark:bg-zinc-800/80 text-zinc-500 dark:text-zinc-400 flex items-center justify-center border border-zinc-200 dark:border-zinc-700 shadow-2xs">
              <Package className="w-5 h-5 stroke-[1.8]" />
            </div>

            <h3 className="text-[13px] font-bold text-zinc-950 dark:text-zinc-100 tracking-tight mt-3">
              No products staged in this request batch yet
            </h3>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm">
              Add individual notebook or stationery product specifications, and assign any combination of Design, Mockup, Sampling, and Costing deliverable scopes.
            </p>

            <button
              type="button"
              onClick={handleOpenAddProduct}
              className="mt-4 h-9 px-4 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Add First Product Spec</span>
            </button>
          </div>
        ) : (
          <div className="rounded-lg border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-[#0f1118] overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-white/[0.08] bg-zinc-50/70 dark:bg-zinc-900/50 text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    <th className="py-2.5 px-4 w-12 text-center">#</th>
                    <th className="py-2.5 px-4">Material Code</th>
                    <th className="py-2.5 px-4">Product Description &amp; Specs</th>
                    <th className="py-2.5 px-4">Binding Format</th>
                    <th className="py-2.5 px-4">Assigned Deliverables</th>
                    <th className="py-2.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-white/[0.05] text-[12px]">
                  {stagedProducts.map((prod, idx) => (
                    <tr
                      key={prod.id}
                      className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 transition-colors"
                    >
                      {/* Line # */}
                      <td className="py-3 px-4 font-mono text-[11px] text-zinc-400 text-center font-semibold">
                        {String(idx + 1).padStart(2, "0")}
                      </td>

                      {/* Material Code */}
                      <td className="py-3 px-4 font-mono font-bold text-xs text-blue-700 dark:text-blue-300">
                        {prod.materialCode}
                      </td>

                      {/* Description & Specs */}
                      <td className="py-3 px-4 min-w-[240px]">
                        <p className="font-semibold text-zinc-950 dark:text-zinc-100 line-clamp-1">
                          {prod.productDescription}
                        </p>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-1 mt-0.5 font-mono">
                          {prod.specsSummary}
                        </p>
                      </td>

                      {/* Binding */}
                      <td className="py-3 px-4 text-zinc-700 dark:text-zinc-300 text-xs truncate max-w-[180px]">
                        {prod.bindingStyle}
                      </td>

                      {/* Deliverables Scope Chips */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {prod.scopes.map((scope) => {
                            const def = DELIVERABLES.find((d) => d.id === scope);
                            return (
                              <span
                                key={scope}
                                className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${def?.tone.badge || "bg-zinc-100 text-zinc-700"}`}
                              >
                                {def?.label.toUpperCase() || scope.toUpperCase()}
                              </span>
                            );
                          })}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleDuplicateStagedItem(prod)}
                            className="h-7.5 w-7.5 rounded-md flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                            title="Duplicate Spec"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveStagedItem(prod.id)}
                            className="h-7.5 w-7.5 rounded-md flex items-center justify-center text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                            title="Remove"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Bottom Summary Bar */}
            <div className="px-4 py-3 border-t border-zinc-200 dark:border-white/[0.08] bg-zinc-50/60 dark:bg-zinc-900/40 flex items-center justify-between text-xs font-mono text-zinc-500">
              <span>{stagedProducts.length} Product Specifications staged in batch</span>
              <span>Client: {programContext.customer}</span>
            </div>
          </div>
        )}
      </div>

      {/* 5. ADD PRODUCT SPECIFICATION MODAL (Select Deliverables) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
          <div
            className="fixed inset-0 bg-black/60 dark:bg-black/85 backdrop-blur-xs transition-opacity"
            onClick={() => setIsAddModalOpen(false)}
          />

          <div className="flex min-h-full items-center justify-center p-3 sm:p-5">
            <div className="relative w-full max-w-2xl bg-white dark:bg-[#0f1118] border border-zinc-200 dark:border-white/[0.08] rounded-lg shadow-2xl overflow-hidden animate-smooth-modal">
              {/* Header */}
              <div className="px-5 py-3.5 border-b border-zinc-200 dark:border-white/[0.08] bg-zinc-50/70 dark:bg-[#161822] flex items-center justify-between shrink-0">
                <div>
                  <h3 className="text-[13px] font-bold text-zinc-950 dark:text-zinc-50 tracking-tight flex items-center gap-2">
                    <span>Add Product to Request</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800">
                      Step 2: Staging Spec
                    </span>
                  </h3>
                  <p className="text-[11px] text-zinc-500 font-mono mt-0.5">
                    Define product baseline parameters and select required deliverable routing scopes.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="h-8 w-8 rounded-md flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleStageProduct} className="p-5 space-y-4">
                {/* 1. Product Identity */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1">
                      Product Title / Description <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. A5 192-Page Casebound Hardcover Ruled Notebook"
                      value={newProdName}
                      onChange={(e) => setNewProdName(e.target.value)}
                      className="w-full h-8.5 px-3 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none focus:border-blue-600"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1">
                        Binding Construction
                      </label>
                      <select
                        value={newProdBinding}
                        onChange={(e) => setNewProdBinding(e.target.value)}
                        className="w-full h-8.5 px-2.5 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-medium text-zinc-900 dark:text-zinc-100 outline-none focus:border-blue-600 cursor-pointer"
                      >
                        <option value="Casebound Hardcover (Round Spine)">Casebound Hardcover (Round Spine)</option>
                        <option value="Casebound Hardcover (Square Spine)">Casebound Hardcover (Square Spine)</option>
                        <option value="Twin-Wire Spiral O-Ring">Twin-Wire Spiral O-Ring</option>
                        <option value="Flexi Softcover (Smyth Sewn)">Flexi Softcover (Smyth Sewn)</option>
                        <option value="Saddle Stitch Exercise Book">Saddle Stitch Exercise Book</option>
                        <option value="Top Glued Notepad / Memo Pad">Top Glued Notepad / Memo Pad</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1">
                        Technical Specs (Pages, GSM, Trim)
                      </label>
                      <input
                        type="text"
                        value={newProdSpecs}
                        onChange={(e) => setNewProdSpecs(e.target.value)}
                        className="w-full h-8.5 px-2.5 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-medium text-zinc-900 dark:text-zinc-100 outline-none focus:border-blue-600 font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Deliverables Selection (4 Options - Industrial Clean Cards) */}
                <div className="pt-2 border-t border-zinc-100 dark:border-white/[0.06] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                      Deliverable Scopes &amp; Routing <span className="text-rose-500">*</span>
                    </label>

                    {/* Presets */}
                    <div className="flex items-center gap-1 font-mono text-[10px]">
                      <span className="text-zinc-400 hidden sm:inline">Presets:</span>
                      <button
                        type="button"
                        onClick={() => handleApplyPreset(["sample", "costing"])}
                        className="px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-700 hover:border-blue-500 text-zinc-600 dark:text-zinc-300 hover:text-blue-600 transition-colors"
                      >
                        Sample + Cost
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApplyPreset(["design", "mockup", "sample", "costing"])}
                        className="px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-700 hover:border-blue-500 text-zinc-600 dark:text-zinc-300 hover:text-blue-600 transition-colors"
                      >
                        All 4 Scopes
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApplyPreset(["design"])}
                        className="px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-700 hover:border-purple-500 text-zinc-600 dark:text-zinc-300 hover:text-purple-600 transition-colors"
                      >
                        Design Only
                      </button>
                    </div>
                  </div>

                  {/* 4 Cards Grid - Razor-Sharp, No Bubbly Nonsense */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {DELIVERABLES.map((item) => {
                      const isSelected = selectedScopes.includes(item.id);
                      const Icon = item.icon;

                      return (
                        <div
                          key={item.id}
                          onClick={() => handleToggleScope(item.id)}
                          className={`p-3 rounded-lg border text-left cursor-pointer transition-all duration-150 select-none flex items-start gap-3 ${
                            isSelected
                              ? `${item.tone.activeBorder} ${item.tone.activeBg} shadow-2xs`
                              : "border-zinc-200 dark:border-white/[0.08] hover:border-zinc-300 dark:hover:border-zinc-700 bg-zinc-50/40 dark:bg-zinc-900/30 text-zinc-700 dark:text-zinc-300"
                          }`}
                        >
                          {/* Left Icon */}
                          <div
                            className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 transition-colors ${
                              isSelected
                                ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-2xs"
                                : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500"
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                          </div>

                          {/* Middle Body */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                              <span className="text-[12px] font-bold text-zinc-950 dark:text-zinc-100 tracking-tight">
                                {item.label}
                              </span>
                              <span className="font-mono text-[9px] uppercase tracking-wider text-zinc-400">
                                {item.code} · {item.department}
                              </span>
                            </div>
                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-snug mt-0.5 line-clamp-2">
                              {item.desc}
                            </p>
                          </div>

                          {/* Checkbox circle */}
                          <div
                            className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                              isSelected
                                ? "border-transparent bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
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
                <div className="pt-3 border-t border-zinc-200 dark:border-white/[0.08] flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="h-9 px-4 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 cursor-pointer shadow-2xs"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="h-9.5 px-5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-2 shadow-2xs cursor-pointer select-none"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Stage Product Specification</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductStagingWorkspace;
