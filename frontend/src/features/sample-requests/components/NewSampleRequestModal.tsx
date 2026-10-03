import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  X,
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
  FlaskConical,
  Image as ImageIcon,
  Link2,
  ExternalLink,
  Plus,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { CustomerCombobox, OperationalDatePicker } from "@/components/erp";
import { isDateRestricted, getNextWorkingDate } from "@/lib/holidayUtils";
import { getBusinessYearInfo, getCurrentBusinessYear } from "@/lib/businessYear";
import { SampleRequestItem } from "../types";
import { useMasterData } from "../hooks/useMasterData";

export interface NewSampleRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (newRequest: Partial<SampleRequestItem>) => Promise<boolean>;
  initialTrack?: TrackType;
  requestCreatedBy?: string;
}

type TrackType = "gateway" | "marketing_request" | "feasibility_check" | "program_planning";

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
      borderActive: "border-brand-600 dark:border-brand-500",
      bgActive: "bg-brand-50/50 dark:bg-brand-950/25",
      badge: "bg-brand-50 text-brand-800 border-brand-200 dark:bg-brand-950/60 dark:text-brand-300 dark:border-brand-800/80",
      text: "text-brand-600 dark:text-brand-400",
      ring: "ring-brand-500/20",
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
      borderActive: "border-brand-600 dark:border-brand-500",
      bgActive: "bg-brand-50/50 dark:bg-brand-950/25",
      badge: "bg-brand-50 text-brand-800 border-brand-200 dark:bg-brand-950/60 dark:text-brand-300 dark:border-brand-800/80",
      text: "text-brand-600 dark:text-brand-400",
      ring: "ring-brand-500/20",
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
      borderActive: "border-brand-600 dark:border-brand-500",
      bgActive: "bg-brand-50/50 dark:bg-brand-950/25",
      badge: "bg-brand-50 text-brand-800 border-brand-200 dark:bg-brand-950/60 dark:text-brand-300 dark:border-brand-800/80",
      text: "text-brand-600 dark:text-brand-400",
      ring: "ring-brand-500/20",
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
      borderActive: "border-brand-600 dark:border-brand-500",
      bgActive: "bg-brand-50/50 dark:bg-brand-950/25",
      badge: "bg-brand-50 text-brand-800 border-brand-200 dark:bg-brand-950/60 dark:text-brand-300 dark:border-brand-800/80",
      text: "text-brand-600 dark:text-brand-400",
      ring: "ring-brand-500/20",
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
  requestCreatedBy,
}) => {
  const navigate = useNavigate();
  const [selectedTrack, setSelectedTrack] = useState<TrackType>(initialTrack || "gateway");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    customers,
    plants,
    isLoading: isMasterDataLoading,
    error: masterDataError,
  } = useMasterData(isOpen);

  // Common fields
  const [customer, setCustomer] = useState("");
  const [targetPlant, setTargetPlant] = useState("");

  // Dynamic Business Year Information (Oct–Sep cycle)
  const byInfo = useMemo(() => getBusinessYearInfo(), [isOpen]);

  // Track 1: Marketing Request Intake fields (Step 1: Program Setup)
  const [marketingCustomer, setMarketingCustomer] = useState("");
  const [marketingProgramName, setMarketingProgramName] = useState("");
  const [marketingProgramYear, setMarketingProgramYear] = useState(() => getBusinessYearInfo().seasonYearOptions[0]);
  const [marketingPlant, setMarketingPlant] = useState("");

  // Track 2: Feasibility Check fields
  const [selectedFeasibilityType, setSelectedFeasibilityType] = useState<string>("new_category");
  const [customTypeOther, setCustomTypeOther] = useState("");
  const [feasibilityDescription, setFeasibilityDescription] = useState("");
  const [releaseRemarks, setReleaseRemarks] = useState("");
  const [feasibilityTargetDate, setFeasibilityTargetDate] = useState(() => getNextWorkingDate(new Date(), 7));

  // Multi-Image & Multi-Link State (combined max 5 items total)
  const [uploadedImages, setUploadedImages] = useState<Array<{ id: string; url: string; name: string; size?: string }>>([]);
  const [webLinks, setWebLinks] = useState<string[]>([]);
  const [linkInput, setLinkInput] = useState<string>("");
  const [mediaTab, setMediaTab] = useState<"files" | "links">("files");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalAttachments = uploadedImages.length + webLinks.length;

  // Track 3: Program Planning fields (Setup step 1 parameters)
  const [programPlanName, setProgramPlanName] = useState("");
  const [programPlanYear, setProgramPlanYear] = useState(() => getBusinessYearInfo().businessYearStr);

  // Reset all fields whenever modal opens so every new request starts completely fresh and empty
  useEffect(() => {
    if (isOpen) {
      setSelectedTrack(initialTrack || "gateway");
      setError(null);
      setMarketingCustomer("");
      setMarketingProgramName("");
      setMarketingProgramYear(byInfo.seasonYearOptions[0]);
      setMarketingPlant("");
      setCustomer("");
      setTargetPlant("");
      setProgramPlanName("");
      setProgramPlanYear(byInfo.businessYearStr);
      setFeasibilityDescription("");
      setReleaseRemarks("");
      setUploadedImages([]);
      setWebLinks([]);
      setLinkInput("");
    }
  }, [isOpen, initialTrack, byInfo]);

  // Default plant selection once plants master data loads (if not already set)
  useEffect(() => {
    if (!isOpen || !plants.length) return;
    const firstPlant = plants[0]?.name || "";
    setTargetPlant((current) => current || firstPlant);
    setMarketingPlant((current) => current || firstPlant);
  }, [isOpen, plants]);

  useEffect(() => {
    if (isOpen && masterDataError) setError(masterDataError);
  }, [isOpen, masterDataError]);

  // Compress to a database-safe JPEG size before including the image in the create request.
  const compressImageFile = (file: File, maxDim = 800): Promise<{ url: string; sizeKb: number }> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
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
            for (const quality of [0.5, 0.4, 0.3]) {
              const dataUrl = canvas.toDataURL("image/jpeg", quality);
              const encoded = dataUrl.slice(dataUrl.indexOf(",") + 1);
              const sizeBytes = Math.floor(encoded.length * 3 / 4);
              if (sizeBytes <= 1_048_576) {
                resolve({ url: dataUrl, sizeKb: Math.max(1, Math.ceil(sizeBytes / 1024)) });
                return;
              }
            }
            resolve({ url: "", sizeKb: 0 });
          } else {
            resolve({ url: "", sizeKb: 0 });
          }
        };
        img.onerror = () => resolve({ url: "", sizeKb: 0 });
        img.src = e.target?.result as string;
      };
      reader.onerror = () => resolve({ url: "", sizeKb: 0 });
      reader.readAsDataURL(file);
    });
  };

  // Allow up to 2 compressed images and 1 web link per feasibility request.
  const handleMultipleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const remainingSlots = 2 - uploadedImages.length;
    if (remainingSlots <= 0) {
      setError("Maximum 2 images are allowed.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    const filesToProcess = files.slice(0, remainingSlots);
    if (files.length > remainingSlots) {
      setError(`Only ${remainingSlots} more image slot(s) available. Added ${remainingSlots} image(s).`);
    } else {
      setError(null);
    }

    for (const file of filesToProcess) {
      const { url, sizeKb } = await compressImageFile(file);
      if (!url) {
        setError(`${file.name} could not be compressed below the 1 MB image limit. Try a smaller image.`);
        continue;
      }
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

  // Allow one reference link in addition to the two image attachments.
  const handleAddWebLink = (e: React.FormEvent | React.MouseEvent) => {
    e.preventDefault();
    const trimmed = linkInput.trim();
    if (!trimmed) return;
    if (webLinks.length >= 1) {
      setError("Maximum 1 reference link is allowed.");
      return;
    }
    const formatted = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    if (webLinks.includes(formatted)) {
      setError("This web link has already been added.");
      return;
    }
    setWebLinks((prev) => [...prev, formatted]);
    setLinkInput("");
    setError(null);
  };

  const handleRemoveWebLink = (idx: number) => {
    setWebLinks((prev) => prev.filter((_, i) => i !== idx));
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
    if (!marketingPlant.trim()) {
      setError("Please select a manufacturing plant.");
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
  const handleSubmitFeasibility = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
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
    if (isDateRestricted(feasibilityTargetDate)) {
      setError("The selected required date falls on a factory holiday (Sundays and even Saturdays are plant off days). Please select an active working day.");
      return;
    }

    const sections: string[] = [
      feasibilityDescription.trim(),
    ];

    if (releaseRemarks.trim()) {
      sections.push(`Marketing Remarks:\n${releaseRemarks.trim()}`);
    }

    if (webLinks.length > 0) {
      sections.push(
        `Reference Web Links (${webLinks.length}):\n` +
        webLinks.map((l, i) => `${i + 1}. ${l}`).join("\n")
      );
    }

    if (uploadedImages.length > 0) {
      sections.push(
        `Attached Images (${uploadedImages.length}):\n` +
        uploadedImages.map((img, i) => `${i + 1}. ${img.name}`).join("\n")
      );
    }

    const payload: Partial<SampleRequestItem> = {
      customer,
      productDescription: feasibilityDescription.trim(),
      programName: `${customer} · ${effectiveTypeLabel}`,
      programYear: byInfo.businessYearStr,
      year: byInfo.businessYearStr,
      sampleRequiredDate: feasibilityTargetDate || undefined,
      qtyForSampling: 1,
      qtyDesignCosting: 0,
      requestTypes: ["sample"] as any,
      status: "Pending Feasibility",
      samplingFeasibilityResponse: null,
      samplingFeasibilityRemark: null,
      feasibilityClosedBy: null,
      feasibilityClosedAt: null,
      createdBy: requestCreatedBy || "Marketing Team (Corporate)",
      dateRequestCreated: new Date().toISOString().split("T")[0],
      creationMode: "feasibility_check",
      productImagePath: uploadedImages[0]?.url || (webLinks[0]?.startsWith("http") ? webLinks[0] : undefined),
      referenceImages: uploadedImages.map((img) => img.url),
      referenceImageNames: uploadedImages.map((img) => img.name),
      referenceLinks: webLinks,
      feasibilityType: selectedFeasibilityType,
      customFeasibilityType: selectedFeasibilityType === "other" ? customTypeOther.trim() : null,
      feasibilityDescription: feasibilityDescription.trim(),
      marketingRemarks: releaseRemarks.trim() || null,
    };

    setIsSubmitting(true);
    try {
      const saved = await onSubmit(payload);
      if (saved) onClose();
      else setError("The feasibility request could not be saved. Please check the details and try again.");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "The feasibility request could not be saved.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Proceed Handler: Track 3 -> Navigate to Dedicated Planning Page
  const handleProceedToPlanning = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer.trim()) {
      setError("Please select a customer account.");
      return;
    }
    if (!targetPlant.trim()) {
      setError("Please select a target plant.");
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
    setError(null);
    onClose();
    navigate("/sample-requests/program-planning", {
      state: {
        customer,
        targetPlant,
        programPlanName,
        programPlanYear,
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="flex min-h-full items-center justify-center p-3 sm:p-5">
        <div
          className={`relative w-full ${
            selectedTrack === "feasibility_check"
              ? "max-w-4xl"
              : "max-w-2xl"
          } bg-white dark:bg-[#0f1118] border border-zinc-200 dark:border-white/[0.08] rounded-lg shadow-xl select-text overflow-hidden transition-all duration-200`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-white/[0.08] bg-zinc-50/70 dark:bg-[#161822] shrink-0">
            <div className="flex items-center gap-2.5">
              <div>
              <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50 tracking-tight flex items-center gap-2">
                  {selectedTrack === "gateway" && "Create New Request"}
                  {selectedTrack === "marketing_request" && (
                    <>
                      <span>New Marketing Request</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 border border-brand-200/80 dark:border-brand-800">
                        Step 1: Program Setup
                      </span>
                    </>
                  )}
                  {selectedTrack === "feasibility_check" && (
                    <span>Feasibility Check</span>
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
                    "Technical sampling feasibility assessment & prototype specification evaluation"}
                  {selectedTrack === "program_planning" &&
                    "Specify customer account, target plant, campaign title, and season year"}
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
          <div className="p-6 sm:p-7 max-h-[82vh] overflow-y-auto">
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
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/60 uppercase">
                        Direct Intake · 4 Scopes
                      </span>
                    </div>
                    <p className="text-[12px] text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                      Initiate commercial prototype requests covering Creative Design, Structural CAD Mockup, Finished Sampling, and BOM Costing.
                    </p>

                    {/* Step Sequence Badges */}
                    <div className="flex items-center gap-2 mt-2.5">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 border border-brand-200/80 dark:border-brand-800/60">
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
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/60 border border-brand-200/80 dark:border-brand-800/60 uppercase">
                        Sampling Desk
                      </span>
                    </div>
                    <p className="text-[12px] text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                      Verify whether SAMP Team can execute specific paper GSM, novel binding structures, custom finishes, or prototypes.
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
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/60 uppercase">
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
                <div className="space-y-4">
                  {/* Customer Account */}
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 font-mono mb-1.5">
                      Customer Account <span className="text-rose-500">*</span>
                    </label>
                    <CustomerCombobox
                      customers={customers}
                      value={marketingCustomer}
                      onChange={setMarketingCustomer}
                      disabled={isMasterDataLoading || customers.length === 0}
                      placeholder="Select target customer account..."
                      className="w-full"
                    />
                  </div>

                  {/* Program Name */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 font-mono">
                        Program Name <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">Recognizable in pipeline</span>
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="e.g. BTS 2026-2027 Notebook Collection..."
                      value={marketingProgramName}
                      onChange={(e) => setMarketingProgramName(e.target.value)}
                      className="w-full h-10 px-3.5 rounded-md border border-zinc-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-900/80 text-[13px] font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600/20 transition-all font-sans"
                    />
                  </div>

                  {/* Season Year Options */}
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 font-mono mb-1.5">
                      Season Year <span className="text-rose-500">*</span>
                    </label>
                    <div className="grid grid-cols-3 gap-2.5">
                      {byInfo.seasonYearOptions.map((year) => {
                        const isSelected = marketingProgramYear === year;
                        return (
                          <button
                            key={year}
                            type="button"
                            onClick={() => setMarketingProgramYear(year)}
                            className={`h-10 px-3.5 rounded-md border text-xs font-semibold transition-all flex items-center justify-between cursor-pointer select-none ${
                              isSelected
                                ? "border-brand-600 bg-brand-50/70 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 font-bold shadow-2xs"
                                : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
                            }`}
                          >
                            <span className="font-mono text-[13px]">{year}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400 stroke-[2.5]" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Target Plant */}
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 font-mono mb-1.5">
                      Manufacturing Plant
                    </label>
                    <select
                      value={marketingPlant}
                      disabled={isMasterDataLoading || plants.length === 0}
                      onChange={(e) => setMarketingPlant(e.target.value)}
                      className="w-full h-10 px-3.5 rounded-md border border-zinc-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-900/80 text-[13px] font-medium text-zinc-900 dark:text-zinc-100 outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600/20 cursor-pointer transition-all font-sans"
                    >
                      {plants.map((item) => (
                        <option key={item.id} value={item.name}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="pt-4 border-t border-zinc-200 dark:border-white/[0.08] flex items-center justify-between mt-5">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTrack("gateway");
                      setError(null);
                    }}
                    className="h-10 px-4 rounded-md border border-zinc-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700/60 transition-colors cursor-pointer shadow-2xs"
                  >
                    Back to Tracks
                  </button>

                  <button
                    type="submit"
                    className="h-11 px-6 rounded-md bg-brand-600 hover:bg-brand-700 active:bg-brand-800 dark:bg-brand-600 dark:hover:bg-brand-500 text-white text-[13px] font-bold tracking-tight shadow-sm hover:shadow transition-all cursor-pointer select-none inline-flex items-center justify-center"
                  >
                    Continue to product staging
                  </button>
                </div>
              </form>
            )}

            {/* SCREEN 3: FEASIBILITY CHECK FORM (Optimized, Unified Brand Theme, Clean Balanced Grid) */}
            {selectedTrack === "feasibility_check" && (
              <form onSubmit={handleSubmitFeasibility} className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                  
                  {/* Left Column (7 cols): Customer, Feasibility Category & Technical Notes */}
                  <div className="lg:col-span-7 space-y-4">
                    {/* 1. Customer Account */}
                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1">
                          Customer Account <span className="text-rose-500">*</span>
                        </label>
                        <CustomerCombobox
                          customers={customers}
                          value={customer}
                          onChange={setCustomer}
                          disabled={isMasterDataLoading || customers.length === 0}
                          className="w-full"
                        />
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
                                "p-2.5 rounded border text-left cursor-pointer select-none flex flex-col justify-between gap-1",
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
                                  <span className="w-1.5 h-1.5 rounded-xs bg-brand-600" />
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
                        <div className="mt-2">
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
                      <OperationalDatePicker
                        label="Required Target Date"
                        required
                        value={feasibilityTargetDate}
                        onChange={(val) => {
                          setFeasibilityTargetDate(val);
                          if (error) setError(null);
                        }}
                        minDate={new Date().toISOString().split("T")[0]}
                        placeholder="Select required target date..."
                      />
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

                    {/* 6. Media Reference: Up to 2 compressed images and 1 link */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                          Reference Attachments
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

                      {/* Slim Mode Toggle & Action Row */}
                      <div className="space-y-2">
                        {/* Segmented control */}
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
                            <span>Image Upload</span>
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
                            <span>Web URL Link</span>
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
                                  {2 - uploadedImages.length} image slot{2 - uploadedImages.length === 1 ? "" : "s"} left
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
                                  : "Paste URL (e.g. drive.google.com, figma, etc.)"
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

                        {/* Unified Attached Items List */}
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

                {/* Actions Footer - Equalized button heights & robust styling */}
                <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-white/[0.07] mt-5">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTrack("gateway");
                      setError(null);
                    }}
                    className="h-10 px-4 rounded-md border border-zinc-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700/60 transition-colors cursor-pointer shadow-2xs"
                  >
                    Back to Tracks
                  </button>
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={onClose}
                      className="h-10 px-4 rounded-md border border-zinc-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs font-semibold cursor-pointer transition-colors shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="h-10 px-5 rounded-md bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white text-xs font-semibold cursor-pointer transition-colors shadow-sm flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-wait"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{isSubmitting ? "Saving Feasibility Check…" : "Submit Feasibility Check"}</span>
                    </button>
                  </div>
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
                    <CustomerCombobox
                      customers={customers}
                      value={customer}
                      onChange={setCustomer}
                      disabled={isMasterDataLoading || customers.length === 0}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1">
                      Target Plant <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={targetPlant}
                      disabled={isMasterDataLoading || plants.length === 0}
                      onChange={(e) => setTargetPlant(e.target.value)}
                      className="w-full h-9 px-3 rounded-md border border-zinc-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-900/80 text-xs text-zinc-900 dark:text-zinc-100 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20 font-mono transition-colors cursor-pointer"
                    >
                      {plants.map((item) => (
                        <option key={item.id} value={item.name}>{item.name}</option>
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

                {/* 3. Program Year */}
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1">
                    Program Year <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={programPlanYear}
                    onChange={(e) => setProgramPlanYear(e.target.value)}
                    className="w-full h-9 px-3 rounded-md border border-zinc-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-900/80 text-xs font-mono text-zinc-900 dark:text-zinc-100 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20 cursor-pointer transition-colors"
                  >
                    {byInfo.businessYearOptions.map((by) => (
                      <option key={by} value={by}>{by}</option>
                    ))}
                  </select>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-white/[0.07] mt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTrack("gateway");
                      setError(null);
                    }}
                    className="h-10 px-4 rounded-md border border-zinc-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700/60 transition-colors cursor-pointer shadow-2xs"
                  >
                    Back to Tracks
                  </button>
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={onClose}
                      className="h-10 px-4 rounded-md border border-zinc-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs font-semibold cursor-pointer transition-colors shadow-2xs"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="h-10 px-4 rounded-md bg-brand-600 hover:bg-brand-700 active:bg-brand-800 dark:bg-brand-600 dark:hover:bg-brand-500 text-white text-xs font-semibold cursor-pointer transition-colors shadow-xs inline-flex items-center justify-center select-none"
                    >
                      Go to Planning
                    </button>
                  </div>
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
