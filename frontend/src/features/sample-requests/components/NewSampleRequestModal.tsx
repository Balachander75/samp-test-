import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  X,
  ArrowLeft,
  ArrowRight,
  Palette,
  Box,
  Sparkles,
  Calculator,
  Check,
  CheckCircle2,
  Calendar,
  Layers,
  FileText,
  Sliders,
  Package,
  Building2,
} from "lucide-react";
import { SampleRequestItem } from "../types";

export interface NewSampleRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (newRequest: Partial<SampleRequestItem>) => void;
  initialTrack?: TrackType;
}

type TrackType = "gateway" | "marketing_request" | "feasibility_check" | "program_planning";

export const CUSTOMERS = [
  "Navneet Youva",
  "ITC Classmate",
  "Camlin Kokuyo",
  "Navneet HQ",
  "Sundaram Multi-pap",
  "Target Global Sourcing Limited",
  "Walmart, Inc",
  "Walmart canada Corp",
  "Staples,The Office Superstore, LLC",
  "Dollar General Corporation",
  "Dollar Tree Stores Canada, INC",
  "Family Dollar Services, LLC.",
  "Greenbrier International, INC",
  "Asda Stores Ltd",
  "Tedi GmbH & Co. KG",
  "Woolworth Gmbh",
];

export const PLANTS = [
  "1505- Khaniwade",
  "1503- Silvasa",
  "1003- Pariya",
  "Daman Facility",
];

export interface MarketingDeliverableType {
  id: "design" | "mockup" | "sample" | "costing";
  code: string;
  label: string;
  department: string;
  tag: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: {
    borderActive: string;
    bgActive: string;
    badge: string;
    text: string;
    ring: string;
  };
}

export const MARKETING_REQUEST_TYPES: MarketingDeliverableType[] = [
  {
    id: "design",
    code: "01",
    label: "Design",
    department: "Creative Studio",
    tag: "Artwork & Styling",
    desc: "Cover artwork, graphic themes, illustrations, typography & creative brief",
    icon: Palette,
    tone: {
      borderActive: "border-purple-500 dark:border-purple-500",
      bgActive: "bg-purple-50/70 dark:bg-purple-950/25",
      badge: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800/60",
      text: "text-purple-600 dark:text-purple-400",
      ring: "ring-purple-500/25",
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
      borderActive: "border-amber-500 dark:border-amber-500",
      bgActive: "bg-amber-50/70 dark:bg-amber-950/25",
      badge: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/60",
      text: "text-amber-600 dark:text-amber-400",
      ring: "ring-amber-500/25",
    },
  },
  {
    id: "sample",
    code: "03",
    label: "Sampling",
    department: "SAMP Tech Lab",
    tag: "Physical Finished Prototype",
    desc: "Finished physical prototype with actual binding, ruling, paper stock & cover finishes",
    icon: Sparkles,
    tone: {
      borderActive: "border-blue-500 dark:border-blue-500",
      bgActive: "bg-blue-50/70 dark:bg-blue-950/25",
      badge: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800/60",
      text: "text-blue-600 dark:text-blue-400",
      ring: "ring-blue-500/25",
    },
  },
  {
    id: "costing",
    code: "04",
    label: "Costing",
    department: "Commercial PMT",
    tag: "BOM & Volume Pricing",
    desc: "Comprehensive Bill of Materials costing, machine run-rates & volume tiered pricing",
    icon: Calculator,
    tone: {
      borderActive: "border-emerald-500 dark:border-emerald-500",
      bgActive: "bg-emerald-50/70 dark:bg-emerald-950/25",
      badge: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/60",
      text: "text-emerald-600 dark:text-emerald-400",
      ring: "ring-emerald-500/25",
    },
  },
];

const FEASIBILITY_TYPES = [
  {
    id: "new_category",
    label: "New Category",
    desc: "Introduce new product lines or unlisted classifications",
  },
  {
    id: "new_format",
    label: "New Format",
    desc: "Custom sizes, unique binding structures, or novel layouts",
  },
  {
    id: "new_finish",
    label: "New Finish",
    desc: "Special cover treatments, foil, embossing, or lamination effects",
  },
  {
    id: "new_accessories",
    label: "New Accessories",
    desc: "Custom ribbons, elastic bands, pockets, stickers, or clasps",
  },
  {
    id: "other",
    label: "Other Custom",
    desc: "Specific bespoke requirement or custom manufacturing check",
  },
];

export const NewSampleRequestModal: React.FC<NewSampleRequestModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialTrack,
}) => {
  const navigate = useNavigate();
  const [selectedTrack, setSelectedTrack] = useState<TrackType>(initialTrack || "gateway");
  const [error, setError] = useState<string | null>(null);

  // Common fields
  const [customer, setCustomer] = useState(CUSTOMERS[0]);
  const [targetPlant, setTargetPlant] = useState(PLANTS[0]);

  // Track 1: Marketing Request Intake fields (Step 1: Program Setup)
  const [marketingCustomer, setMarketingCustomer] = useState(CUSTOMERS[0]);
  const [marketingProgramName, setMarketingProgramName] = useState("BTS 2026-2027 Notebook Collection");
  const [marketingProgramYear, setMarketingProgramYear] = useState("2026-2027");
  const [marketingPlant, setMarketingPlant] = useState(PLANTS[0]);

  // Track 2: Feasibility Check fields
  const [selectedFeasibilityType, setSelectedFeasibilityType] = useState<string>("new_category");
  const [customTypeOther, setCustomTypeOther] = useState("");
  const [feasibilityDescription, setFeasibilityDescription] = useState("");
  const [releaseRemarks, setReleaseRemarks] = useState("");
  const [feasibilityTargetDate, setFeasibilityTargetDate] = useState("");
  const [imageMode, setImageMode] = useState<"file" | "url">("file");
  const [imageUrl, setImageUrl] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFileName, setImageFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Track 3: Program Planning fields (Setup step 1 parameters)
  const [programPlanName, setProgramPlanName] = useState("");
  const [programPlanYear, setProgramPlanYear] = useState("2026-2027");
  const [programTargetDate, setProgramTargetDate] = useState("");

  // Reset to gateway or initialTrack whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedTrack(initialTrack || "gateway");
      setError(null);
    }
  }, [isOpen, initialTrack]);

  // Image handling
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFileName(file.name);
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setImageFileName(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const effectiveTypeLabel = useMemo(() => {
    if (selectedFeasibilityType === "other") {
      return customTypeOther.trim() || "Bespoke / Custom";
    }
    const found = FEASIBILITY_TYPES.find((t) => t.id === selectedFeasibilityType);
    return found ? found.label : "Feasibility Check";
  }, [selectedFeasibilityType, customTypeOther]);

  if (!isOpen) return null;


  // Proceed Handler: Track 1 (Marketing Request -> Program Setup -> Product Staging)
  const handleProceedToMarketingStaging = (e: React.FormEvent) => {
    e.preventDefault();
    if (!marketingCustomer.trim()) {
      setError("Please select a customer account.");
      return;
    }
    if (!marketingProgramName.trim()) {
      setError("Please enter a program name.");
      return;
    }
    setError(null);
    const payload = {
      customer: marketingCustomer,
      programName: marketingProgramName,
      programYear: marketingProgramYear,
      targetPlant: marketingPlant,
    };
    sessionStorage.setItem("samp_active_program_form", JSON.stringify(payload));
    onClose();
    navigate("/sample-requests/product-staging", {
      state: payload,
    });
  };

  // Submit Handler: Track 2 (Feasibility Check)
  const handleSubmitFeasibility = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer.trim()) {
      setError("Please select a customer account.");
      return;
    }
    if (selectedFeasibilityType === "other" && !customTypeOther.trim()) {
      setError("Please specify the custom requirement.");
      return;
    }
    if (!feasibilityDescription.trim()) {
      setError("Please provide description and technical notes.");
      return;
    }
    if (!feasibilityTargetDate.trim()) {
      setError("Please select a required target date.");
      return;
    }

    const sections: string[] = [
      `[${effectiveTypeLabel}] ${feasibilityDescription.trim()}`,
    ];

    if (releaseRemarks.trim()) {
      sections.push(`Marketing Remarks:\n${releaseRemarks.trim()}`);
    }

    if (imageMode === "url" && imageUrl.trim()) {
      sections.push(`Reference Link: ${imageUrl.trim()}`);
    }

    const payload: Partial<SampleRequestItem> = {
      customer,
      targetPlant,
      productDescription: sections.join("\n\n"),
      materialCode: `FC-CK-${Math.floor(1000 + Math.random() * 9000)}`,
      programName: `${customer} · ${effectiveTypeLabel}`,
      programYear: "2026-2027",
      year: "2026-2027",
      sampleRequiredDate: feasibilityTargetDate || undefined,
      qtyForSampling: 1,
      qtyDesignCosting: 0,
      requestTypes: ["sample"] as any,
      status: "Pending Feasibility",
      plantFeasibilityResponse: null,
      plantFeasibilityRemark: null,
      samplingFeasibilityResponse: null,
      samplingFeasibilityRemark: null,
      feasibilityClosedBy: null,
      feasibilityClosedAt: null,
      createdBy: "Marketing Team (Corporate)",
      dateRequestCreated: new Date().toISOString().split("T")[0],
      creationMode: "feasibility_check",
      productImagePath:
        imageMode === "url" && imageUrl.trim()
          ? imageUrl.trim()
          : (imagePreview || undefined),
    };

    onSubmit(payload);
    onClose();
  };

  // Proceed Handler: Track 3 -> Navigate to Dedicated Planning Page
  const handleProceedToPlanning = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer.trim()) {
      setError("Please select a customer account.");
      return;
    }
    if (!programPlanName.trim()) {
      setError("Please provide a program campaign title.");
      return;
    }
    if (!programPlanYear.trim()) {
      setError("Please specify the program year.");
      return;
    }
    if (!programTargetDate.trim()) {
      setError("Please specify the target required date.");
      return;
    }
    setError(null);
    onClose();
    navigate("/sample-requests/program-planning", {
      state: {
        customer,
        targetPlant,
        programPlanName,
        programPlanYear,
        programTargetDate,
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/45 dark:bg-black/80 backdrop-blur-[2px] animate-smooth-backdrop"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="flex min-h-full items-center justify-center p-3 sm:p-5">
        <div
          className={`relative w-full ${
            selectedTrack === "feasibility_check" || selectedTrack === "marketing_request"
              ? "max-w-4xl"
              : "max-w-2xl"
          } bg-white dark:bg-[#0f1118] border border-zinc-200 dark:border-white/[0.08] rounded-lg shadow-2xl select-text overflow-hidden animate-smooth-modal transition-all duration-150`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-200 dark:border-white/[0.08] bg-zinc-50/70 dark:bg-[#161822] shrink-0">
            <div className="flex items-center gap-2.5">
              {selectedTrack !== "gateway" && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTrack("gateway");
                    setError(null);
                  }}
                  className="p-1 rounded text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                  title="Back to workflow selection"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              )}
              <div>
                <h3 className="text-[13px] font-bold text-zinc-950 dark:text-zinc-50 tracking-tight flex items-center gap-2">
                  {selectedTrack === "gateway" && "Create New Request"}
                  {selectedTrack === "marketing_request" && (
                    <>
                      <span>New Marketing Request</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800">
                        Step 1: Program Setup
                      </span>
                    </>
                  )}
                  {selectedTrack === "feasibility_check" && (
                    <>
                      <span>Feasibility Check</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 border border-brand-200/80 dark:border-brand-800">
                        Plant Review
                      </span>
                    </>
                  )}
                  {selectedTrack === "program_planning" && (
                    <>
                      <span>Seasonal Program Planning</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 border border-brand-200/80 dark:border-brand-800">
                        Campaign Setup
                      </span>
                    </>
                  )}
                </h3>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-500 font-mono mt-0.5">
                  {selectedTrack === "gateway" && "Select an operational workflow track to initiate"}
                  {selectedTrack === "marketing_request" &&
                    "Select target customer account, program name, and season cycle. Product staging & deliverables will open next."}
                  {selectedTrack === "feasibility_check" &&
                    "Technical plant feasibility assessment & manufacturing specification review"}
                  {selectedTrack === "program_planning" &&
                    "Specify customer account, campaign title, season year, and required target date"}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="h-8 w-8 rounded-md flex items-center justify-center border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/[0.06] transition-colors duration-150 cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-5 max-h-[82vh] overflow-y-auto">
            {error && (
              <div className="mb-4 px-3 py-2 rounded border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-[12px]">
                {error}
              </div>
            )}

            {/* SCREEN 1: 3-TRACK SELECTION GATEWAY (Clean, Unified Theme, No Icon Spam) */}
            {selectedTrack === "gateway" && (
              <div className="space-y-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-2 font-mono">
                  Select Workflow Track
                </div>

                {/* Track 1: Marketing Request */}
                <div
                  onClick={() => {
                    setSelectedTrack("marketing_request");
                    setError(null);
                  }}
                  className="group relative flex items-start gap-3.5 p-4 rounded-lg border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-zinc-900/40 hover:border-brand-500/80 dark:hover:border-brand-500/80 hover:bg-brand-50/20 dark:hover:bg-brand-950/15 transition-all duration-150 cursor-pointer select-none"
                >
                  <span className="text-[12px] font-mono font-bold text-zinc-400 dark:text-zinc-500 group-hover:text-brand-600 dark:group-hover:text-brand-400 shrink-0 w-6 pt-0.5">
                    01
                  </span>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-[13px] font-bold text-zinc-950 dark:text-zinc-50 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                        Marketing Request
                      </h4>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-medium text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/60 uppercase">
                        Direct Intake · 4 Scopes
                      </span>
                    </div>
                    <p className="text-[12px] text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                      Initiate commercial prototype requests covering Creative Design, Structural CAD Mockup, Finished Sampling, and BOM Costing.
                    </p>

                    {/* Step Sequence Badges */}
                    <div className="flex items-center gap-2 mt-2.5">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/60">
                        Step 1: Program Setup
                      </span>
                      <span className="text-[10px] text-zinc-400 font-mono">→</span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                        Step 2: Product Staging (4 Scopes)
                      </span>
                    </div>
                  </div>

                  <div className="self-center shrink-0 text-zinc-400 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>

                {/* Track 2: Feasibility Check */}
                <div
                  onClick={() => {
                    setSelectedTrack("feasibility_check");
                    setError(null);
                  }}
                  className="group relative flex items-start gap-3.5 p-4 rounded-lg border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-zinc-900/40 hover:border-brand-500/80 dark:hover:border-brand-500/80 hover:bg-brand-50/20 dark:hover:bg-brand-950/15 transition-all duration-150 cursor-pointer select-none"
                >
                  <span className="text-[12px] font-mono font-bold text-zinc-400 dark:text-zinc-500 group-hover:text-brand-600 dark:group-hover:text-brand-400 shrink-0 w-6 pt-0.5">
                    02
                  </span>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-[13px] font-bold text-zinc-950 dark:text-zinc-50 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                        Feasibility Check
                      </h4>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-medium text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/60 uppercase">
                        Plant Audit
                      </span>
                    </div>
                    <p className="text-[12px] text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                      Verify whether manufacturing plants (1505 Khaniwade, 1503 Silvassa, 1003 Pariya) can execute specific paper GSM, binding structures, or special finishes.
                    </p>
                  </div>

                  <div className="self-center shrink-0 text-zinc-400 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>

                {/* Track 3: Program Planning */}
                <div
                  onClick={() => {
                    setSelectedTrack("program_planning");
                    setError(null);
                  }}
                  className="group relative flex items-start gap-3.5 p-4 rounded-lg border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-zinc-900/40 hover:border-brand-500/80 dark:hover:border-brand-500/80 hover:bg-brand-50/20 dark:hover:bg-brand-950/15 transition-all duration-150 cursor-pointer select-none"
                >
                  <span className="text-[12px] font-mono font-bold text-zinc-400 dark:text-zinc-500 group-hover:text-brand-600 dark:group-hover:text-brand-400 shrink-0 w-6 pt-0.5">
                    03
                  </span>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-[13px] font-bold text-zinc-950 dark:text-zinc-50 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                        Program Planning
                      </h4>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-medium text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/60 uppercase">
                        Seasonal Line
                      </span>
                    </div>
                    <p className="text-[12px] text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                      Plan seasonal product programs (e.g. BTS 2026-27), allocate SKU matrices, set delivery schedules, and organize bulk production pipelines.
                    </p>
                  </div>

                  <div className="self-center shrink-0 text-zinc-400 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            )}

            {/* SCREEN 2: MARKETING REQUEST (STEP 1: PROGRAM SETUP) */}
            {selectedTrack === "marketing_request" && (
              <form onSubmit={handleProceedToMarketingStaging} className="space-y-4">
                {/* Visual Header Strip */}
                <div className="p-3.5 rounded-lg border border-blue-200/80 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/30 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-md bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-blue-950 dark:text-blue-200">
                        Start with the basics
                      </h4>
                      <p className="text-[11px] text-blue-700/80 dark:text-blue-400">
                        Select target customer account and season cycle to establish program context. Product staging will open next.
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300">
                    Step 1 of 2
                  </span>
                </div>

                <div className="space-y-4 pt-1">
                  {/* Customer Account */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1">
                      Customer Account <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={marketingCustomer}
                      onChange={(e) => setMarketingCustomer(e.target.value)}
                      className="w-full h-9 px-3 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-medium text-zinc-900 dark:text-zinc-100 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 cursor-pointer"
                    >
                      {CUSTOMERS.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Program Name */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                        Program Name <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-[10px] text-zinc-400 font-mono">Recognizable in pipeline</span>
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Back to School 2027, Spring Promotional Collection..."
                      value={marketingProgramName}
                      onChange={(e) => setMarketingProgramName(e.target.value)}
                      className="w-full h-9 px-3 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20"
                    />
                  </div>

                  {/* Season Year Options */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5">
                      Season Year <span className="text-rose-500">*</span>
                    </label>
                    <div className="grid grid-cols-3 gap-2.5">
                      {["2026", "2027", "2028"].map((year) => {
                        const cleanYear = year;
                        const isSelected = marketingProgramYear.includes(cleanYear);
                        return (
                          <button
                            key={year}
                            type="button"
                            onClick={() => setMarketingProgramYear(cleanYear)}
                            className={`h-9 px-3 rounded-lg border text-xs font-bold transition-all flex items-center justify-between cursor-pointer select-none ${
                              isSelected
                                ? "border-blue-600 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 shadow-2xs"
                                : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300"
                            }`}
                          >
                            <span className="font-mono">{cleanYear}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 stroke-[3]" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Target Plant */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1">
                      Manufacturing Plant
                    </label>
                    <select
                      value={marketingPlant}
                      onChange={(e) => setMarketingPlant(e.target.value)}
                      className="w-full h-9 px-3 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-medium text-zinc-900 dark:text-zinc-100 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 cursor-pointer"
                    >
                      {PLANTS.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="pt-4 border-t border-zinc-200 dark:border-white/[0.08] flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTrack("gateway");
                      setError(null);
                    }}
                    className="h-9 px-4 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 cursor-pointer shadow-2xs"
                  >
                    Back to Tracks
                  </button>

                  <button
                    type="submit"
                    className="h-9.5 px-5 rounded-md bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold flex items-center gap-2 shadow-sm cursor-pointer select-none"
                  >
                    <span>Continue to product staging</span>
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </button>
                </div>
              </form>
            )}

            {/* SCREEN 3: FEASIBILITY CHECK FORM (Optimized, Unified Brand Theme, Clean Balanced Grid) */}
            {selectedTrack === "feasibility_check" && (
              <form onSubmit={handleSubmitFeasibility} className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                  
                  {/* Left Column (7 cols): Parameters, Feasibility Category & Technical Notes */}
                  <div className="lg:col-span-7 space-y-4">
                    {/* 1. Customer Name & Target Plant */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1">
                          Customer Account <span className="text-rose-500">*</span>
                        </label>
                        <select
                          value={customer}
                          onChange={(e) => setCustomer(e.target.value)}
                          className="w-full h-8 px-2.5 rounded-md border border-zinc-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-900/80 text-[12px] text-zinc-900 dark:text-zinc-100 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20 font-medium transition-colors cursor-pointer"
                        >
                          {CUSTOMERS.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1">
                          Target Plant <span className="text-rose-500">*</span>
                        </label>
                        <select
                          value={targetPlant}
                          onChange={(e) => setTargetPlant(e.target.value)}
                          className="w-full h-8 px-2.5 rounded-md border border-zinc-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-900/80 text-[12px] text-zinc-900 dark:text-zinc-100 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20 font-mono transition-colors cursor-pointer"
                        >
                          {PLANTS.map((p) => (
                            <option key={p} value={p}>{p}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* 2. Feasibility Type Selection Tiles */}
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5">
                        Feasibility Type <span className="text-rose-500">*</span>
                      </label>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {FEASIBILITY_TYPES.map((type) => {
                          const isSelected = selectedFeasibilityType === type.id;
                          return (
                            <div
                              key={type.id}
                              onClick={() => setSelectedFeasibilityType(type.id)}
                              className={[
                                "p-2.5 rounded-lg border text-left cursor-pointer transition-all duration-150 select-none flex flex-col justify-between gap-1",
                                isSelected
                                  ? "border-brand-500 bg-brand-50/40 dark:bg-brand-950/20 text-zinc-900 dark:text-zinc-100 shadow-[inset_2px_0_0_0_#2563eb]"
                                  : "border-zinc-200 dark:border-white/[0.08] hover:border-zinc-300 dark:hover:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/30 text-zinc-700 dark:text-zinc-300",
                              ].join(" ")}
                            >
                              <div className="flex items-center justify-between">
                                <span className={`text-[11px] font-semibold tracking-tight ${
                                  isSelected ? "text-brand-700 dark:text-brand-300 font-bold" : ""
                                }`}>
                                  {type.label}
                                </span>
                                {isSelected && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-brand-600" />
                                )}
                              </div>
                              <span className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-tight">
                                {type.desc}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Custom input when 'other' is chosen */}
                      {selectedFeasibilityType === "other" && (
                        <div className="mt-2 animate-smooth-toast">
                          <input
                            type="text"
                            required
                            placeholder="Specify bespoke requirement (e.g., Embossed Metallic Foil Spine, Novel Die Cut)..."
                            value={customTypeOther}
                            onChange={(e) => setCustomTypeOther(e.target.value)}
                            className="w-full h-8 px-3 rounded-md border border-brand-500 dark:border-brand-500 bg-white dark:bg-zinc-900 text-[12px] font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none focus:ring-1 focus:ring-brand-500/20"
                          />
                        </div>
                      )}
                    </div>

                    {/* 3. Description & Technical Notes */}
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1">
                        Technical Description &amp; Notes <span className="text-rose-500">*</span>
                      </label>
                      <textarea
                        required
                        rows={4}
                        placeholder="Provide complete technical context, material GSM, binding dimensions, special coatings, machine tolerances, and manufacturing evaluation criteria..."
                        value={feasibilityDescription}
                        onChange={(e) => setFeasibilityDescription(e.target.value)}
                        className="w-full p-2.5 rounded-md border border-zinc-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-900/80 text-[12px] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20 outline-none transition-colors resize-none leading-relaxed"
                      />
                    </div>
                  </div>

                  {/* Right Column (5 cols): Target Date, Release Remarks & Visual Reference */}
                  <div className="lg:col-span-5 space-y-4">
                    {/* 4. Required Target Date */}
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1">
                        Required Target Date <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        value={feasibilityTargetDate}
                        onChange={(e) => setFeasibilityTargetDate(e.target.value)}
                        className="w-full h-8 px-2.5 rounded-md border border-zinc-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-900/80 text-[12px] font-mono text-zinc-900 dark:text-zinc-100 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20 cursor-pointer transition-colors"
                      />
                      <p className="text-[10px] text-zinc-400 font-mono mt-1">
                        Target feedback deadline for plant engineering evaluation
                      </p>
                    </div>

                    {/* 5. Marketing Remarks / Notes */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                          Marketing Remarks / Notes
                        </label>
                        <span className="text-[10px] text-zinc-400 font-mono">
                          Optional
                        </span>
                      </div>
                      <textarea
                        rows={3}
                        placeholder="Enter any additional marketing remarks, client constraints, or special evaluation instructions..."
                        value={releaseRemarks}
                        onChange={(e) => setReleaseRemarks(e.target.value)}
                        className="w-full p-2.5 rounded-md border border-zinc-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-900/80 text-[12px] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20 outline-none transition-colors resize-none leading-relaxed"
                      />
                    </div>

                    {/* 6. Image Reference (Optional) */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                          Image Reference (Optional)
                        </label>

                        {/* Mode switcher: Upload vs Link */}
                        <div className="inline-flex rounded-md bg-zinc-100 dark:bg-zinc-800 p-0.5 text-[11px] font-semibold">
                          <button
                            type="button"
                            onClick={() => setImageMode("file")}
                            className={`px-2.5 py-0.5 rounded text-[10px] transition-colors cursor-pointer ${
                              imageMode === "file"
                                ? "bg-white dark:bg-zinc-700 text-brand-600 dark:text-brand-400 shadow-2xs font-bold"
                                : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400"
                            }`}
                          >
                            Upload File
                          </button>
                          <button
                            type="button"
                            onClick={() => setImageMode("url")}
                            className={`px-2.5 py-0.5 rounded text-[10px] transition-colors cursor-pointer ${
                              imageMode === "url"
                                ? "bg-white dark:bg-zinc-700 text-brand-600 dark:text-brand-400 shadow-2xs font-bold"
                                : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400"
                            }`}
                          >
                            Web Link
                          </button>
                        </div>
                      </div>

                      {imageMode === "file" ? (
                        <>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                          />

                          {imagePreview ? (
                            <div className="rounded-lg border border-zinc-200 dark:border-white/[0.08] p-3 bg-zinc-50/50 dark:bg-zinc-900/40 space-y-2.5">
                              <div className="flex items-center gap-3 min-w-0">
                                <img
                                  src={imagePreview}
                                  alt="Reference preview"
                                  className="h-14 w-14 rounded-md object-cover border border-zinc-200 dark:border-zinc-700 shrink-0"
                                />
                                <div className="min-w-0 flex-1">
                                  <p className="text-[11px] font-bold text-zinc-900 dark:text-zinc-100 truncate">
                                    {imageFileName}
                                  </p>
                                  <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
                                    Visual reference for plant audit
                                  </p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={handleRemoveImage}
                                className="w-full py-1 rounded text-[11px] font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 transition-colors cursor-pointer text-center"
                              >
                                Remove Image
                              </button>
                            </div>
                          ) : (
                            <div
                              onClick={() => fileInputRef.current?.click()}
                              className="rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 hover:border-brand-500 dark:hover:border-brand-500 p-4 text-center cursor-pointer transition-colors bg-zinc-50/40 dark:bg-zinc-900/30 hover:bg-brand-50/10"
                            >
                              <p className="text-[11px] font-medium text-zinc-800 dark:text-zinc-200">
                                Upload reference photo or technical sketch
                              </p>
                              <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
                                PNG, JPG, WEBP up to 10MB
                              </p>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="space-y-2">
                          <div className="relative">
                            <input
                              type="url"
                              placeholder="Paste image URL (https://...)..."
                              value={imageUrl}
                              onChange={(e) => setImageUrl(e.target.value)}
                              className="w-full h-8 pl-3 pr-8 rounded-md border border-zinc-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-900 text-[11px] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:border-brand-500 outline-none"
                            />
                            {imageUrl && (
                              <button
                                type="button"
                                onClick={() => setImageUrl("")}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 cursor-pointer"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                          {imageUrl && (
                            <div className="rounded-md border border-zinc-200 dark:border-zinc-800 p-2 flex items-center gap-2 bg-zinc-50 dark:bg-zinc-900/50">
                              <img
                                src={imageUrl}
                                alt="Web preview"
                                onError={(e) => {
                                  (e.currentTarget as HTMLImageElement).src =
                                    "https://placehold.co/100x100?text=Invalid+Link";
                                }}
                                className="h-10 w-10 rounded-md object-cover border border-zinc-200 shrink-0"
                              />
                              <span className="text-[10px] text-zinc-500 truncate font-mono">
                                {imageUrl}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions Footer - Single Back in Header, Clear Action Buttons */}
                <div className="flex items-center justify-end gap-2.5 pt-3.5 border-t border-zinc-100 dark:border-white/[0.07] mt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="h-9 px-4 rounded-md border border-zinc-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs font-semibold cursor-pointer transition-colors shadow-2xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="h-9.5 px-5 rounded-md bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white text-xs font-bold cursor-pointer transition-colors shadow-sm"
                  >
                    Submit Feasibility Check
                  </button>
                </div>
              </form>
            )}

            {/* SCREEN 4: PROGRAM PLANNING TRACK (Campaign Setup -> Navigates to Planning Workspace) */}
            {selectedTrack === "program_planning" && (
              <form onSubmit={handleProceedToPlanning} className="space-y-4">
                {/* 1. Customer Name & Target Plant */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1">
                      Customer Name <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={customer}
                      onChange={(e) => setCustomer(e.target.value)}
                      className="w-full h-9 px-3 rounded-md border border-zinc-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-900/80 text-xs text-zinc-900 dark:text-zinc-100 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20 font-medium transition-colors cursor-pointer"
                    >
                      {CUSTOMERS.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1">
                      Target Plant <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={targetPlant}
                      onChange={(e) => setTargetPlant(e.target.value)}
                      className="w-full h-9 px-3 rounded-md border border-zinc-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-900/80 text-xs text-zinc-900 dark:text-zinc-100 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20 font-mono transition-colors cursor-pointer"
                    >
                      {PLANTS.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 2. Program Campaign Title */}
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1">
                    Program Campaign Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={programPlanName}
                    onChange={(e) => setProgramPlanName(e.target.value)}
                    placeholder="e.g. Back-to-School 2026-2027 Hardcover Line"
                    className="w-full h-9 px-3 rounded-md border border-zinc-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-900/80 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20 transition-colors"
                  />
                </div>

                {/* 3. Program Year & 4. Target Required Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1">
                      Program Year <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={programPlanYear}
                      onChange={(e) => setProgramPlanYear(e.target.value)}
                      className="w-full h-9 px-3 rounded-md border border-zinc-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-900/80 text-xs font-mono text-zinc-900 dark:text-zinc-100 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20 cursor-pointer transition-colors"
                    >
                      <option value="2026-2027">2026-2027</option>
                      <option value="2025-2026">2025-2026</option>
                      <option value="2027-2028">2027-2028</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1">
                      Target Required Date <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={programTargetDate}
                      onChange={(e) => setProgramTargetDate(e.target.value)}
                      className="w-full h-9 px-3 rounded-md border border-zinc-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-900/80 text-xs font-mono text-zinc-900 dark:text-zinc-100 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20 cursor-pointer transition-colors"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-2.5 pt-3.5 border-t border-zinc-100 dark:border-white/[0.07] mt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="h-9 px-4 rounded-md border border-zinc-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs font-semibold cursor-pointer transition-colors shadow-2xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="h-9.5 px-5 rounded-md bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white text-xs font-bold cursor-pointer transition-colors shadow-sm flex items-center gap-2"
                  >
                    <span>Go to Planning</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default NewSampleRequestModal;
