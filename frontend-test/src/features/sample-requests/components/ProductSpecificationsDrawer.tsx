import React, { useMemo, useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { ProductDetailItem, fetchDesignRequestApi } from "../api";
import { DesignRequest, SampleRequestItem } from "../types";
import { getSampleRequestTypeInfo } from "../utils/requestType";
import specMappingData from "../data/specMapping.json";
import {
  X,
  Search,
  Eye,
  Check,
  Copy,
  ChevronDown,
  Edit3,
  Sparkles,
  Palette,
  Calendar,
  Building2,
  Users,
  FileText,
  ExternalLink,
} from "@/components/ui/icons";

export interface UniversalSpecificationProduct {
  id: number | string;
  srNumber?: string;
  sr_number?: string;
  materialCode?: string;
  material_code?: string;
  productDescription?: string;
  product_description?: string;
  customer?: string;
  targetPlant?: string;
  target_plant?: string;
  bindingType1?: string;
  binding_type_1?: string;
  bindingType2?: string;
  binding_type_2?: string;
  createdBy?: string;
  created_by?: string;
  sampleRequiredDate?: string;
  sample_required_date?: string;
  programName?: string;
  program_name?: string;
  programYear?: string;
  program_year?: string;
  status?: string;
  requestKind?: string;
  request_kind?: string;
  designRequestId?: number;
  design_request_id?: number;
  numberOfDesigns?: number | string;
  number_of_designs?: number | string;
  trend?: string | null;
  targetAudience?: string | null;
  target_audience?: string | null;
  referenceImage?: string | null;
  reference_image?: string | null;
  createdAt?: string;
  created_at?: string;
  plantFeasibilityResponse?: "Yes" | "No" | "Maybe" | null;
  plant_feasibility_response?: "Yes" | "No" | "Maybe" | null;
  plantFeasibilityRemark?: string | null;
  plant_feasibility_remark?: string | null;
  samplingFeasibilityResponse?: "Yes" | "No" | "Maybe" | null;
  sampling_feasibility_response?: "Yes" | "No" | "Maybe" | null;
  samplingFeasibilityRemark?: string | null;
  sampling_feasibility_remark?: string | null;
  feasibilityClosedAt?: string | null;
  feasibility_closed_at?: string | null;
  feasibilityClosedBy?: "plant" | "sampling" | null;
  feasibility_closed_by?: "plant" | "sampling" | null;
  creationMode?: string;
  creation_mode?: string;
}

export interface ProductSpecificationsDrawerProps {
  product: UniversalSpecificationProduct;
  details: ProductDetailItem[];
  initialBaseDetails?: ProductDetailItem[];
  isLoading: boolean;
  specMode?: "material" | "binding" | "view" | "edit";
  allowEdit?: boolean;
  allProductClasses?: string[];
  addedClasses?: string[];
  onAddClass?: (className: string) => void;
  onRemoveClass?: (className: string) => void;
  onDetailChange?: (item: ProductDetailItem, newValue: string) => void;
  onSave?: (updatedDetails: ProductDetailItem[], isCustomized: boolean) => Promise<void> | void;
  onUpdateFeasibilityResponse?: (
    requestId: string | number,
    team: "plant" | "sampling",
    response: "Yes" | "No" | "Maybe",
    remark?: string
  ) => Promise<void> | void;
  onClose: () => void;
}


const SPECIAL_ACRONYMS = new Set([
  "GSM", "UOM", "ID", "PVC", "UV", "FSC", "EUTR", "EUDR", "OPP", "BOPP", "PE",
  "PUR", "A4", "A5", "A6", "B5", "MM", "CM", "PT", "QC", "PMT", "SMT", "SR",
  "NA", "N/A", "SAP", "ERP", "MDF", "C1", "C2", "C3", "C4", "C5", "C6", "C7",
  "D1", "D2", "P1", "P2", "NB", "SKU"
]);

export function toDisplayTitle(str: string): string {
  if (!str) return "";
  const normalized = str.replace(/_/g, " ").replace(/\s+/g, " ").trim();
  return normalized
    .split(" ")
    .map((word, idx) => {
      if (word === "/" || word === "&") return word;
      const upper = word.toUpperCase();
      if (upper === "NO" || upper === "NO.") return "No.";
      if (idx > 0 && ["OF", "ON", "FOR", "AND", "IN", "TO", "BY"].includes(upper)) return word.toLowerCase();

      const clean = word.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
      if (SPECIAL_ACRONYMS.has(clean)) {
        return word.toUpperCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}

const typedClasses = specMappingData.classes as Record<string, { displayName: string; sequence: number }>;
const typedCharacteristics = specMappingData.characteristics as Record<
  string,
  { displayName: string; className: string; sequence: number }
>;

export function getFriendlyClassName(cls: string): string {
  if (!cls) return "";
  const mapped = typedClasses[cls];
  if (mapped?.displayName) {
    return toDisplayTitle(mapped.displayName);
  }
  return toDisplayTitle(cls);
}

export function getClassSequence(cls: string, fallback = 999): number {
  const mapped = typedClasses[cls];
  return mapped?.sequence ?? fallback;
}

export function getFriendlyCharName(charName: string): string {
  if (!charName) return "";
  const mapped = typedCharacteristics[charName];
  if (mapped?.displayName) {
    return toDisplayTitle(mapped.displayName);
  }
  return toDisplayTitle(charName);
}

export function getCharSequence(charName: string, fallback = 999): number {
  const mapped = typedCharacteristics[charName];
  return mapped?.sequence ?? fallback;
}

export function getClassDynamicLabel(className: string, details: ProductDetailItem[]): string {
  const isValValid = (val?: string | null) => {
    if (!val) return false;
    const v = val.trim().toUpperCase();
    return v !== "" && !["NA", "N/A", "NAN", "NULL", "NONE", "—", "-"].includes(v);
  };

  const getCharVal = (...charNames: string[]): string | null => {
    const normalizedTargets = charNames.map((n) => n.replace(/[^a-zA-Z0-9]/g, "").toUpperCase());
    const targetClassClean = (className || "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase();

    for (const d of details) {
      const itemClassClean = (d.className || "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
      if (itemClassClean !== targetClassClean) continue;
      const normalizedChar = (d.characteristicName || "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
      if (normalizedTargets.includes(normalizedChar) && isValValid(d.value)) {
        return d.value!.trim();
      }
    }
    return null;
  };

  const cleanClass = (className || "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase();

  // 1. PRODUCT_CLASS: PRODUCT_CLOSE_SIZE_LENGTH X PRODUCT_CLOSE_SIZE_WIDTH CM
  if (cleanClass.includes("PRODUCTCLASS") || cleanClass === "PRODUCT") {
    const len = getCharVal("PRODUCTCLOSESIZELENGTH", "PRODUCT_CLOSE_SIZE_LENGTH", "PRODUCTSIZELENGTH");
    const wid = getCharVal("PRODUCTCLOSESIZEWIDTH", "PRODUCT_CLOSE_SIZE_WIDTH", "PRODUCTSIZEWIDTH");
    if (len && wid) {
      return `${len} X ${wid} CM`;
    }
    if (len) return `${len} CM`;
    if (wid) return `${wid} CM`;
    return getFriendlyClassName(className);
  }

  // 2. NB_BINDING: BINDINGTYPE1 / BINDINGTYPE2 / SPECIALBINDING
  if (cleanClass.includes("BINDING")) {
    const b1 = getCharVal("BINDINGTYPE1", "BINDING_TYPE_1", "BINDINGTYPE");
    const b2 = getCharVal("BINDINGTYPE2", "BINDING_TYPE_2");
    const special = getCharVal("SPECIALBINDING", "SPECIAL_BINDING", "SPECIALBINDINGTYPE");

    if (b1) {
      const b1Upper = b1.toUpperCase();
      if ((b1Upper.includes("SPECIAL") || b1Upper.includes("REFER TO SPECIAL")) && special) {
        return special;
      }
      return b1;
    }
    if (b2) {
      const b2Upper = b2.toUpperCase();
      if ((b2Upper.includes("SPECIAL") || b2Upper.includes("REFER TO SPECIAL")) && special) {
        return special;
      }
      return b2;
    }
    if (special) return special;
    return getFriendlyClassName(className);
  }

  // 3. NB_COMPONENT_1: COMPONENT1NAME
  if (cleanClass.includes("COMPONENT1") || cleanClass === "C1" || cleanClass.includes("COMPONENT_1")) {
    const name = getCharVal("COMPONENT1NAME", "COMPONENT_1_NAME", "C1NAME", "COMPONENTNAME");
    return name || getFriendlyClassName(className);
  }

  // 4. NB_COMPONENT_2 to NB_COMPONENT_6: COMPONENT_X_NAME
  if (cleanClass.includes("COMPONENT2") || cleanClass === "C2" || cleanClass.includes("COMPONENT_2")) {
    const name = getCharVal("COMPONENT2NAME", "COMPONENT_2_NAME", "C2NAME");
    return name || getFriendlyClassName(className);
  }
  if (cleanClass.includes("COMPONENT3") || cleanClass === "C3" || cleanClass.includes("COMPONENT_3")) {
    const name = getCharVal("COMPONENT3NAME", "COMPONENT_3_NAME", "C3NAME");
    return name || getFriendlyClassName(className);
  }
  if (cleanClass.includes("COMPONENT4") || cleanClass === "C4" || cleanClass.includes("COMPONENT_4")) {
    const name = getCharVal("COMPONENT4NAME", "COMPONENT_4_NAME", "C4NAME");
    return name || getFriendlyClassName(className);
  }
  if (cleanClass.includes("COMPONENT5") || cleanClass === "C5" || cleanClass.includes("COMPONENT_5")) {
    const name = getCharVal("COMPONENT5NAME", "COMPONENT_5_NAME", "C5NAME");
    return name || getFriendlyClassName(className);
  }
  if (cleanClass.includes("COMPONENT6") || cleanClass === "C6" || cleanClass.includes("COMPONENT_6")) {
    const name = getCharVal("COMPONENT6NAME", "COMPONENT_6_NAME", "C6NAME");
    return name || getFriendlyClassName(className);
  }

  // 5. NB_COMPONENT_7: PRODUCT_TYPE (C7PRODUCT_TYPE)
  if (cleanClass.includes("COMPONENT7") || cleanClass === "C7" || cleanClass.includes("COMPONENT_7")) {
    const ptype = getCharVal("C7PRODUCT_TYPE", "C7PRODUCTTYPE", "PRODUCT_TYPE", "PRODUCTTYPE", "COMPONENT7NAME");
    return ptype || getFriendlyClassName(className);
  }

  // 6. NB_DIVIDER_SPECS: DIVIDERS_TYPE (DIVIDERSTYPE1 / DIVIDERSTYPE2)
  if (cleanClass.includes("DIVIDER")) {
    const divType = getCharVal("DIVIDERSTYPE1", "DIVIDERS_TYPE_1", "DIVIDERSTYPE2", "DIVIDERS_TYPE", "DIVIDERTYPE");
    return divType || getFriendlyClassName(className);
  }

  // 7. PACKAGING_SPECS_1: PACKING_TYPE_1 (PACKAGETYPE1 / PACKAGETYPE2)
  if (cleanClass.includes("PACKAGINGSPECS") || cleanClass.includes("PACKAGINGSPEC") || cleanClass.includes("PACKAGING_SPECS")) {
    const pkgType = getCharVal("PACKAGETYPE1", "PACKAGING_TYPE_1", "PACKAGETYPE2", "PACKAGINGTYPE", "PACKAGING_TYPE");
    return pkgType || getFriendlyClassName(className);
  }

  // 8. PACKING_DETAILS: Strictly RETAIL_PACK_TYPE (RETAILPACKTYPE) - NOT RETAILPACK_SALEUNITPACK (No. of Pcs)
  if (cleanClass.includes("PACKINGDETAILS") || cleanClass.includes("PACKINGDETAIL") || cleanClass.includes("PACKING_DETAILS")) {
    const retailPack = getCharVal("RETAILPACKTYPE", "RETAIL_PACK_TYPE", "RETAILPACK_TYPE");
    return retailPack || getFriendlyClassName(className);
  }

  // 9. RULLING_DETAILS: RULLING_DISTANCE in MM
  if (cleanClass.includes("RULLING") || cleanClass.includes("RULING")) {
    const dist = getCharVal("RULLING_DISTANCE", "RULLINGDISTANCE", "RULING_DISTANCE", "RULINGDISTANCE");
    if (dist) {
      if (dist.toLowerCase().includes("mm")) return dist;
      return `${dist} mm`;
    }
    return getFriendlyClassName(className);
  }

  return getFriendlyClassName(className);
}

function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query || !query.trim()) return text;
  const q = query.trim().toLowerCase();
  const lower = text.toLowerCase();
  const index = lower.indexOf(q);
  if (index === -1) return text;
  return (
    <>
      {text.substring(0, index)}
      <mark className="bg-amber-200/90 dark:bg-amber-900/60 text-amber-950 dark:text-amber-100 px-0.5 rounded font-bold">
        {text.substring(index, index + q.length)}
      </mark>
      {highlightMatch(text.substring(index + q.length), query)}
    </>
  );
}

interface AutoResizeTextareaProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
}

const AutoResizeTextarea: React.FC<AutoResizeTextareaProps> = ({
  value,
  onChange,
  placeholder,
  className,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = () => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      const newHeight = Math.min(120, Math.max(28, el.scrollHeight));
      el.style.height = `${newHeight}px`;
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [value]);

  return (
    <div className="relative w-full">
      <textarea
        ref={textareaRef}
        rows={1}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          adjustHeight();
        }}
        placeholder={placeholder || "Enter value..."}
        className={`w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-xs text-slate-900 dark:text-slate-100 outline-none focus:ring-1.5 focus:ring-indigo-500/30 focus:border-indigo-500 font-medium leading-snug resize-none transition-all break-words ${
          value ? "pr-6" : ""
        } ${className || ""}`}
        style={{ minHeight: "28px" }}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-1.5 top-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded cursor-pointer transition-colors"
          title="Clear"
        >
          <X size={11} />
        </button>
      )}
    </div>
  );
};

interface CharacteristicSpecRowProps {
  item: ProductDetailItem;
  idx: number;
  search: string;
  isRowEditable: boolean;
  onValueChange: (item: ProductDetailItem, val: string) => void;
}

const CharacteristicSpecRow: React.FC<CharacteristicSpecRowProps> = ({
  item,
  idx,
  search,
  isRowEditable,
  onValueChange,
}) => {
  const rawVal = item.value || "";
  const val = rawVal.trim();
  const isNA = !val || ["NA", "N/A", "NAN", "NULL", "NONE", "—", "-"].includes(val.toUpperCase());
  const friendlyName = getFriendlyCharName(item.characteristicName);

  // Compute matched option and complete option list for dropdown
  const { matchedValue, availableOptions } = useMemo(() => {
    if (!item.options || item.options.length === 0) {
      return { matchedValue: rawVal, availableOptions: [] };
    }

    const optionsList = [...item.options];
    if (!val) {
      return { matchedValue: "", availableOptions: optionsList };
    }

    const upperVal = val.toUpperCase();
    // Check if current value matches any option case-insensitively
    const matchedOpt = optionsList.find(
      (opt) => opt.trim().toUpperCase() === upperVal
    );

    if (matchedOpt) {
      return { matchedValue: matchedOpt, availableOptions: optionsList };
    }

    // If current value is not in standard options and not NA, add it so custom value is preserved and displayed
    if (!isNA && !optionsList.some((opt) => opt.trim().toUpperCase() === upperVal)) {
      optionsList.unshift(rawVal);
    }

    return { matchedValue: rawVal, availableOptions: optionsList };
  }, [item.options, rawVal, val, isNA]);

  return (
    <div
      className={`grid grid-cols-12 px-3.5 py-1.5 text-xs items-start gap-2 transition-colors ${
        idx % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-slate-50/40 dark:bg-slate-800/20"
      } hover:bg-slate-50 dark:hover:bg-slate-800/40`}
    >
      {/* Characteristic Name: Clean Friendly Title */}
      <div className="col-span-5 sm:col-span-4 pr-2 pt-0.5">
        <span
          className="font-semibold text-xs text-slate-800 dark:text-slate-200 leading-snug break-words"
          title={friendlyName}
        >
          {highlightMatch(friendlyName, search)}
        </span>
      </div>

      {/* Configured Value / Editing Field */}
      <div className="col-span-6 sm:col-span-7 pr-2">
        {isRowEditable ? (
          availableOptions.length > 0 ? (
            <div className="relative w-full">
              <select
                value={matchedValue}
                onChange={(e) => onValueChange(item, e.target.value)}
                className="h-7 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-xs text-slate-900 dark:text-slate-100 outline-none focus:ring-1.5 focus:ring-indigo-500/30 focus:border-indigo-500 font-medium transition-all cursor-pointer appearance-none pr-6 leading-tight"
              >
                <option value="">Select option...</option>
                {availableOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400">
                <ChevronDown size={12} />
              </div>
            </div>
          ) : (
            <AutoResizeTextarea
              value={val === "NA" ? "" : item.value || ""}
              onChange={(newVal) => onValueChange(item, newVal)}
              placeholder="Enter value..."
            />
          )
        ) : isNA ? (
          <span className="text-slate-400 dark:text-slate-500 font-mono text-[11px] pt-1 inline-block">
            N/A
          </span>
        ) : (
          <span className="inline-block max-w-full font-semibold text-xs text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 break-words whitespace-pre-wrap leading-snug">
            {highlightMatch(val, search)}
          </span>
        )}
      </div>

      {/* UOM */}
      <div className="col-span-1 sm:col-span-1 text-right font-mono text-[11px] text-slate-400 pt-1 truncate">
        {item.uom || "—"}
      </div>
    </div>
  );
};

export const ProductSpecificationsDrawer: React.FC<ProductSpecificationsDrawerProps> = ({
  product,
  details,
  initialBaseDetails,
  isLoading,
  allowEdit = true,
  allProductClasses = [],
  onDetailChange,
  onSave,
  onUpdateFeasibilityResponse,
  onClose,
}) => {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [hideNA, setHideNA] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);
  const [expandedClasses, setExpandedClasses] = useState<Record<string, boolean>>({});

  // Base snapshot to detect whether specs were modified vs original
  const [baseSnapshot, setBaseSnapshot] = useState<ProductDetailItem[]>(initialBaseDetails || details);
  const [localDetails, setLocalDetails] = useState<ProductDetailItem[]>(details);
  const [isEditing, setIsEditing] = useState(Boolean(allowEdit));
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Feasibility Check review state
  const isFeasibilityItem = useMemo(() => {
    const p = product as any;
    const mode = (p.creationMode || p.creation_mode || "").toLowerCase();
    const desc = (p.productDescription || p.product_description || "").toLowerCase();
    return mode.includes("feasibility") || desc.includes("feasibility check") || desc.includes("[new category]") || desc.includes("[new format]") || desc.includes("[new finish]") || desc.includes("[new accessories]");
  }, [product]);

  const [activeFeasibilityTeam, setActiveFeasibilityTeam] = useState<"plant" | "sampling">("plant");
  const [feasibilityDecision, setFeasibilityDecision] = useState<"Yes" | "No" | "Maybe" | null>(null);
  const [feasibilityRemark, setFeasibilityRemark] = useState("");
  const [isSubmittingFeasibility, setIsSubmittingFeasibility] = useState(false);
  const [feasibilityFeedbackSuccess, setFeasibilityFeedbackSuccess] = useState<string | null>(null);

  // Sync edit mode with allowEdit prop
  useEffect(() => {
    setIsEditing(Boolean(allowEdit));
  }, [allowEdit]);

  // Close on Escape key press
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Sync local details and base snapshot
  useEffect(() => {
    setLocalDetails(details);
    if (initialBaseDetails && initialBaseDetails.length > 0) {
      setBaseSnapshot(initialBaseDetails);
    } else if (details && details.length > 0 && baseSnapshot.length === 0) {
      setBaseSnapshot(details);
    }
  }, [details, initialBaseDetails]);

  // Compute number of modified characteristics
  const modifiedCount = useMemo(() => {
    let count = 0;
    const baseMap = new Map<string, string>();
    (baseSnapshot.length > 0 ? baseSnapshot : details).forEach((d) => {
      const key = `${d.className}::${d.characteristicName}`;
      baseMap.set(key, (d.value || "").trim().toUpperCase());
    });

    localDetails.forEach((d) => {
      const key = `${d.className}::${d.characteristicName}`;
      const baseVal = baseMap.get(key) ?? "";
      const currVal = (d.value || "").trim().toUpperCase();
      const isBaseNA = !baseVal || ["NA", "N/A", "NAN", "NULL", "NONE", "—", "-"].includes(baseVal);
      const isCurrNA = !currVal || ["NA", "N/A", "NAN", "NULL", "NONE", "—", "-"].includes(currVal);
      if (isBaseNA && isCurrNA) return;
      if (baseVal !== currVal) {
        count++;
      }
    });
    return count;
  }, [localDetails, baseSnapshot, details]);

  const isCustomizedProduct = modifiedCount > 0;

  // Extract display information
  const code = product.materialCode || product.material_code || product.srNumber || product.sr_number || "SPEC";
  const desc = product.productDescription || product.product_description || "Product Specification";
  const customer = product.customer || "";
  const binding1 = product.bindingType1 || product.binding_type_1 || "";
  const binding2 = product.bindingType2 || product.binding_type_2 || "";
  const plant = product.targetPlant || product.target_plant || "";
  const createdBy = product.createdBy || product.created_by || "";
  const reqDate = product.sampleRequiredDate || product.sample_required_date || "";

  // Check whether this is a Creative Design Request
  const isDesign = useMemo(() => {
    const p = product as any;
    const mat = (p.materialCode || p.material_code || "").toUpperCase();
    const sr = (p.srNumber || p.sr_number || "").toUpperCase();
    return (
      p.requestKind === "design" ||
      p.request_kind === "design" ||
      mat.startsWith("DESIGN-") ||
      sr.startsWith("DR-") ||
      Boolean(p.designRequestId || p.design_request_id)
    );
  }, [product]);

  const [copiedBrief, setCopiedBrief] = useState(false);
  const [designDetails, setDesignDetails] = useState<DesignRequest | null>(null);

  useEffect(() => {
    if (!isDesign) return;
    const p = product as any;
    if (p.trend || p.referenceImage || p.targetAudience) {
      setDesignDetails({
        id: Number(p.designRequestId || String(p.id).replace("design-", "") || 1),
        customerName: p.customer || "",
        programName: p.programName || p.program_name || "",
        programYear: p.programYear || p.program_year || p.year || "",
        numberOfDesigns: Number(p.numberOfDesigns || p.number_of_designs || 1),
        trend: p.trend || "",
        targetAudience: p.targetAudience || "",
        referenceImage: p.referenceImage || "",
        productDescription: p.productDescription || p.product_description || "",
        designRequiredDate: p.sampleRequiredDate || p.sample_required_date || "",
        status: p.status || "Creative",
        createdBy: p.createdBy || p.created_by || "",
        updatedBy: p.updatedBy || "",
        createdAt: p.createdAt || "",
        updatedAt: p.updatedAt || "",
      });
      return;
    }

    const rawId = Number(
      p.designRequestId ||
      p.design_request_id ||
      String(p.id).replace("design-", "") ||
      (p.materialCode || "").replace("DESIGN-", "")
    );
    if (rawId && !isNaN(rawId)) {
      fetchDesignRequestApi(rawId)
        .then((res) => setDesignDetails(res))
        .catch((err) => console.error("Could not fetch design request details:", err));
    }
  }, [isDesign, product]);

  const effectiveNumberOfDesigns =
    designDetails?.numberOfDesigns ||
    (product as any).numberOfDesigns ||
    (product as any).number_of_designs ||
    1;
  const effectiveTrend = designDetails?.trend ?? (product as any).trend ?? "";
  const effectiveTargetAudience =
    designDetails?.targetAudience ?? (product as any).targetAudience ?? (product as any).target_audience ?? "";
  const effectiveReferenceImage =
    designDetails?.referenceImage ?? (product as any).referenceImage ?? (product as any).reference_image ?? "";
  const effectiveProgramName =
    designDetails?.programName || product.programName || (product as any).program_name || "";
  const effectiveProgramYear =
    designDetails?.programYear || product.programYear || (product as any).program_year || (product as any).year || "";

  const handleCopyDesignBrief = () => {
    const lines = [
      `Design Request: ${code} - ${desc}`,
      customer ? `Customer: ${customer}` : "",
      effectiveProgramName ? `Program: ${effectiveProgramName}` : "",
      effectiveProgramYear ? `Season: ${effectiveProgramYear}` : "",
      `Designs Needed: ${effectiveNumberOfDesigns}`,
      reqDate ? `Required Date: ${reqDate}` : "",
      product.status ? `Status: ${product.status}` : "",
      createdBy ? `Created By: ${createdBy}` : "",
      effectiveTrend ? `Trend / Style: ${effectiveTrend}` : "",
      effectiveTargetAudience ? `Target Audience: ${effectiveTargetAudience}` : "",
      effectiveReferenceImage ? `Reference Image: ${effectiveReferenceImage}` : "",
    ].filter(Boolean);

    navigator.clipboard.writeText(lines.join("\n"));
    setCopiedBrief(true);
    setTimeout(() => setCopiedBrief(false), 2000);
  };

  // Per-category total count in localDetails (all specs belonging to this class for this product)
  const categoryTotalCount = useMemo(() => {
    const map: Record<string, number> = {};
    localDetails.forEach((d) => {
      map[d.className] = (map[d.className] || 0) + 1;
    });
    return map;
  }, [localDetails]);

  // Per-category active count (configured, non-NA specs)
  const categoryActiveCount = useMemo(() => {
    const map: Record<string, number> = {};
    localDetails.forEach((d) => {
      const v = (d.value || "").trim().toUpperCase();
      const isConfigured = v && !["NA", "N/A", "NAN", "NULL", "NONE", "—", "-"].includes(v);
      if (isConfigured) {
        map[d.className] = (map[d.className] || 0) + 1;
      }
    });
    return map;
  }, [localDetails]);

  // Group classes and counts based on localDetails, sorted strictly by Excel Class Sequence
  const categories = useMemo(() => {
    const classSet = new Set<string>();
    localDetails.forEach((d) => {
      classSet.add(d.className);
    });
    if (!hideNA && Array.isArray(allProductClasses)) {
      allProductClasses.forEach((cls) => classSet.add(cls));
    }
    return Array.from(classSet)
      .map((className) => ({
        className,
        count: categoryTotalCount[className] || 0,
        configuredCount: categoryActiveCount[className] || 0,
      }))
      .sort((a, b) => {
        const orderA = getClassSequence(a.className);
        const orderB = getClassSequence(b.className);
        return orderA - orderB;
      });
  }, [localDetails, hideNA, allProductClasses, categoryTotalCount, categoryActiveCount]);

  // Auto-reset selectedCategory if the currently selected class is not in the present categories
  useEffect(() => {
    if (selectedCategory !== "ALL" && !categories.some((c) => c.className === selectedCategory)) {
      setSelectedCategory("ALL");
    }
  }, [categories, selectedCategory]);


  const activeSpecsCount = useMemo(() => {
    return localDetails.filter((d) => {
      const v = (d.value || "").trim().toUpperCase();
      return v && !["NA", "N/A", "NAN", "NULL", "NONE", "—", "-"].includes(v);
    }).length;
  }, [localDetails]);

  const filteredDetails = useMemo(() => {
    const filtered = localDetails.filter((item) => {
      if (selectedCategory !== "ALL" && item.className !== selectedCategory) return false;
      const val = (item.value || "").trim().toUpperCase();
      const isNA = !val || ["NA", "N/A", "NAN", "NULL", "NONE", "—", "-"].includes(val);
      if (hideNA && isNA) return false;
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const charName = String(item.characteristicName || "").toLowerCase();
        const friendlyChar = getFriendlyCharName(item.characteristicName).toLowerCase();
        const itemVal = String(item.value || "").toLowerCase();
        const clsName = String(item.className || "").toLowerCase();
        const friendlyCls = getFriendlyClassName(item.className).toLowerCase();
        return (
          charName.includes(q) ||
          friendlyChar.includes(q) ||
          itemVal.includes(q) ||
          clsName.includes(q) ||
          friendlyCls.includes(q)
        );
      }
      return true;
    });

    return filtered.sort((a, b) => {
      if (selectedCategory === "ALL") {
        const clsA = getClassSequence(a.className);
        const clsB = getClassSequence(b.className);
        if (clsA !== clsB) return clsA - clsB;
      }
      const seqA = getCharSequence(a.characteristicName);
      const seqB = getCharSequence(b.characteristicName);
      return seqA - seqB;
    });
  }, [localDetails, selectedCategory, hideNA, search]);

  // Per-category matching count when search is active
  const categoryMatchCount = useMemo(() => {
    if (!search.trim()) return {};
    const map: Record<string, number> = {};
    filteredDetails.forEach((d) => {
      map[d.className] = (map[d.className] || 0) + 1;
    });
    return map;
  }, [filteredDetails, search]);

  // Group items by category class for accordion view, ordered strictly by Excel sequence
  const groupedDetails = useMemo(() => {
    const map: Record<string, ProductDetailItem[]> = {};
    filteredDetails.forEach((item) => {
      if (!map[item.className]) {
        map[item.className] = [];
      }
      map[item.className].push(item);
    });
    Object.keys(map).forEach((cls) => {
      map[cls].sort((a, b) => {
        const seqA = getCharSequence(a.characteristicName);
        const seqB = getCharSequence(b.characteristicName);
        return seqA - seqB;
      });
    });
    return map;
  }, [filteredDetails]);

  const toggleClassExpansion = (className: string) => {
    setExpandedClasses((prev) => ({
      ...prev,
      [className]: !prev[className],
    }));
  };

  const handleExpandAll = () => {
    const allExpanded: Record<string, boolean> = {};
    categories.forEach((c) => {
      allExpanded[c.className] = true;
    });
    setExpandedClasses(allExpanded);
  };

  const handleCollapseAll = () => {
    setExpandedClasses({});
  };

  const handleCopyCode = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 1500);
  };

  const handleCopyAllSpecs = (e: React.MouseEvent) => {
    e.stopPropagation();
    const active = localDetails.filter((d) => {
      const v = (d.value || "").trim().toUpperCase();
      return v && !["NA", "N/A", "NAN", "NULL", "NONE", "—", "-"].includes(v);
    });
    if (active.length === 0) return;
    const text = [
      `Product: ${code} - ${desc}`,
      customer ? `Customer: ${customer}` : "",
      `Total Configured Specs: ${active.length}`,
      "----------------------------------------",
      ...active.map(
        (d) => `${d.className} > ${d.characteristicName}: ${d.value || "—"} ${d.uom || ""}`.trim()
      ),
    ]
      .filter(Boolean)
      .join("\n");

    navigator.clipboard.writeText(text);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleLocalChange = (item: ProductDetailItem, newValue: string) => {
    setLocalDetails((prev) =>
      prev.map((d) =>
        d.className === item.className && d.characteristicName === item.characteristicName
          ? { ...d, value: newValue }
          : d
      )
    );
    if (onDetailChange) {
      onDetailChange(item, newValue);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (onSave) {
        await onSave(localDetails, isCustomizedProduct);
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.error("Failed to save specifications:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleFeasibilitySubmit = async () => {
    if (!feasibilityDecision) return;
    if ((feasibilityDecision === "No" || feasibilityDecision === "Maybe") && !feasibilityRemark.trim()) {
      alert(`A remark is required when responding "${feasibilityDecision}". Please provide your reasoning.`);
      return;
    }

    setIsSubmittingFeasibility(true);
    try {
      if (onUpdateFeasibilityResponse) {
        await onUpdateFeasibilityResponse(
          product.id,
          activeFeasibilityTeam,
          feasibilityDecision,
          feasibilityRemark.trim() || undefined
        );
      }
      setFeasibilityFeedbackSuccess(`Response "${feasibilityDecision}" recorded from ${activeFeasibilityTeam === "plant" ? "Plant Team" : "SAMP Team"}. Feasibility request closed.`);
      setTimeout(() => setFeasibilityFeedbackSuccess(null), 4000);
    } catch (err) {
      console.error("Failed to submit feasibility response:", err);
      alert("Failed to submit feasibility response. Please try again.");
    } finally {
      setIsSubmittingFeasibility(false);
    }
  };

  const isSearching = Boolean(search.trim());

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/75 p-3 sm:p-5 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={`flex h-[min(840px,calc(100vh-2rem))] w-full ${isDesign ? "max-w-3xl" : "max-w-5xl"} flex-col overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl animate-in zoom-in-[0.98] duration-200`}>
        {isDesign ? (
          <div className="flex h-full w-full flex-col overflow-hidden bg-white dark:bg-slate-900">
            {/* Creative Glowing Top Accent */}
            <div className="h-1.5 w-full bg-gradient-to-r from-rose-500 via-pink-500 to-red-600 shrink-0" />

            {/* Header */}
            <div className="px-6 py-4 bg-slate-50/80 dark:bg-slate-850/60 border-b border-slate-200/80 dark:border-slate-800 shrink-0">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200/80 dark:border-rose-900/60 flex items-center gap-1.5 shadow-2xs">
                    <Palette size={13} className="text-rose-600" />
                    <span>{code}</span>
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      className="text-rose-400 hover:text-rose-700 dark:hover:text-rose-200 cursor-pointer transition-colors"
                      title="Copy code"
                    >
                      {copiedCode ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                    </button>
                  </span>

                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-rose-100/70 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
                    Creative Design Brief
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleCopyDesignBrief}
                    className="group h-8 px-3 text-xs font-semibold rounded-lg border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs select-none"
                    title="Copy design brief"
                  >
                    {copiedBrief ? (
                      <Check size={12} className="text-emerald-600 stroke-[2.5]" />
                    ) : (
                      <Copy size={12} className="text-slate-400 group-hover:text-slate-600" />
                    )}
                    <span>{copiedBrief ? "Copied Brief!" : "Copy Brief"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={onClose}
                    className="h-8 w-8 rounded-lg flex items-center justify-center border border-slate-200/80 dark:border-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shadow-2xs"
                    title="Close"
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>

              {/* Title & Program Info */}
              <div className="mt-2.5 space-y-1">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
                  {desc}
                </h2>
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                  {customer && (
                    <span>
                      <strong className="font-semibold text-slate-700 dark:text-slate-300">{customer}</strong>
                    </span>
                  )}
                  {effectiveProgramName && (
                    <>
                      <span>•</span>
                      <span>{effectiveProgramName}</span>
                    </>
                  )}
                  {effectiveProgramYear && (
                    <>
                      <span>•</span>
                      <span>{effectiveProgramYear}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Scrollable Body Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* 4 Quick Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                    Designs Needed
                  </span>
                  <span className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1 block">
                    {effectiveNumberOfDesigns} {Number(effectiveNumberOfDesigns) === 1 ? "Design" : "Designs"}
                  </span>
                </div>

                <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                    Required Date
                  </span>
                  <span className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1 block">
                    {reqDate || "Not set"}
                  </span>
                </div>

                <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                    Created By
                  </span>
                  <span className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1 block truncate" title={createdBy || "—"}>
                    {createdBy || "—"}
                  </span>
                </div>

                <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                    Current Stage
                  </span>
                  <span className="text-sm font-bold text-rose-600 dark:text-rose-400 mt-1 block">
                    {product.status || "Creative"}
                  </span>
                </div>
              </div>

              {/* Artwork Description Card */}
              <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30 p-4 space-y-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <FileText size={13} className="text-rose-500" />
                  <span>Artwork & Design Requirements</span>
                </span>
                <p className="text-sm font-medium leading-relaxed text-slate-900 dark:text-slate-100 whitespace-pre-wrap">
                  {desc}
                </p>
              </div>

              {/* Trend / Style & Target Audience (2 Columns) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-1.5">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Sparkles size={13} className="text-purple-500" />
                    <span>Trend / Visual Direction</span>
                  </span>
                  <p className="text-xs font-medium leading-relaxed text-slate-800 dark:text-slate-200">
                    {effectiveTrend || <span className="text-slate-400 italic">No specific trend specified</span>}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-1.5">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Users size={13} className="text-blue-500" />
                    <span>Target Audience</span>
                  </span>
                  <p className="text-xs font-medium leading-relaxed text-slate-800 dark:text-slate-200">
                    {effectiveTargetAudience || <span className="text-slate-400 italic">General consumer market</span>}
                  </p>
                </div>
              </div>

              {/* Reference Image Section */}
              <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Eye size={13} className="text-rose-500" />
                    <span>Reference Image / Moodboard</span>
                  </span>
                  {effectiveReferenceImage && (
                    <a
                      href={effectiveReferenceImage}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      <span>Open full size</span>
                      <ExternalLink size={12} />
                    </a>
                  )}
                </div>

                {effectiveReferenceImage ? (
                  <div className="flex flex-col sm:flex-row items-start gap-4">
                    <img
                      src={effectiveReferenceImage}
                      alt="Reference Artwork"
                      className="max-h-56 max-w-full sm:max-w-sm rounded-xl border border-slate-200 dark:border-slate-700 object-cover shadow-xs"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                    <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400">
                      <p className="font-semibold text-slate-700 dark:text-slate-300">Reference link:</p>
                      <a
                        href={effectiveReferenceImage}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 dark:text-blue-400 hover:underline break-all block"
                      >
                        {effectiveReferenceImage}
                      </a>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No reference image attached to this request.</p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 flex items-center justify-between gap-3 shrink-0">
              <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Palette size={13} className="text-rose-500 shrink-0" />
                <span>Creative Design Request • Does not require factory binding specifications.</span>
              </span>

              <button
                type="button"
                onClick={onClose}
                className="h-9 px-5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Unified Executive Header */}
            <div className="px-4 sm:px-5 py-3.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex flex-col gap-2.5 shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0 flex-wrap">
              <span className="font-mono font-bold text-xs px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-800 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/60 flex items-center gap-1.5 shadow-2xs">
                <span>{code}</span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-200 cursor-pointer transition-colors"
                  title="Copy code"
                >
                  {copiedCode ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                </button>
              </span>

              {binding1 && (
                <span className="text-xs px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 font-medium">
                  {binding1} {binding2 && binding2 !== "NA" ? `• ${binding2}` : ""}
                </span>
              )}

              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate max-w-sm" title={desc}>
                {desc}
              </span>
            </div>

            {/* Action Buttons in Header */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleCopyAllSpecs}
                className="group h-8 px-2.5 text-xs font-medium rounded-lg border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs select-none"
                title="Copy all configured specs to clipboard"
              >
                {copiedAll ? <Check size={12} className="text-emerald-600 dark:text-emerald-400 stroke-[2.5]" /> : <Copy size={12} className="text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />}
                <span className="hidden sm:inline">{copiedAll ? "Copied!" : "Copy Specs"}</span>
              </button>

              {/* Editing Mode Toggle */}
              {allowEdit && (
                <div className="flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => {
                      if (isEditing) {
                        setLocalDetails(details);
                        setIsEditing(false);
                      }
                    }}
                    className={`h-7 px-2.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 cursor-pointer select-none ${
                      !isEditing
                        ? "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-2xs font-semibold"
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                    }`}
                    title="Switch to view-only mode"
                  >
                    <Eye size={12} />
                    <span>View</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className={`h-7 px-2.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 cursor-pointer select-none ${
                      isEditing
                        ? "bg-slate-900 text-white dark:bg-blue-600 dark:text-white shadow-2xs font-semibold"
                        : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                    }`}
                    title="Enable editing mode"
                  >
                    <Edit3 size={12} />
                    <span>Edit</span>
                  </button>
                </div>
              )}

              {allowEdit && isEditing && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setLocalDetails(details);
                      setIsEditing(false);
                    }}
                    className="h-8 px-2.5 text-xs font-medium rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="h-8 px-3 text-xs font-medium rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 select-none"
                  >
                    {isSaving ? (
                      <>
                        <span className="saas-spinner-sm border-white border-t-transparent" />
                        <span>Saving...</span>
                      </>
                    ) : saveSuccess ? (
                      <>
                        <Check size={12} className="stroke-[3]" />
                        <span>Saved!</span>
                      </>
                    ) : (
                      <>
                        <Check size={12} className="stroke-[2.5]" />
                        <span>Save</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={onClose}
                className="h-8 w-8 rounded-lg flex items-center justify-center border border-slate-200/80 dark:border-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer ml-1 shadow-2xs"
                title="Close specifications"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Secondary Context Row */}
          <div className="flex items-center justify-between gap-2 text-xs flex-wrap pt-0.5">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 flex-wrap">
              {customer && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                  <span className="text-slate-400">Customer:</span> {customer}
                </span>
              )}
              {plant && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                  <span className="text-slate-400">Plant:</span> {plant}
                </span>
              )}
              {createdBy && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                  <span className="text-slate-400">By:</span> {createdBy}
                </span>
              )}
              {reqDate && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                  <span className="text-slate-400">Req:</span> {reqDate}
                </span>
              )}
              {!allowEdit ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-0.5 rounded border bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700">
                  <Eye size={11} className="text-slate-400" />
                  <span>Catalog Specification &bull; Read-Only Preview</span>
                </span>
              ) : isCustomizedProduct ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded border bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800 animate-in zoom-in-[0.98] duration-150">
                  <Edit3 size={11} className="text-purple-600 dark:text-purple-400" />
                  <span>Customized Spec &bull; New Product ({modifiedCount} modified)</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-0.5 rounded border bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700">
                  <Copy size={11} className="text-slate-400" />
                  <span>Catalog Reference &bull; Clone (Unmodified)</span>
                </span>
              )}
            </div>

            <div className="text-right">
              <span className="text-[11px] text-slate-400">
                Active: <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{activeSpecsCount}</span> / {localDetails.length}
              </span>
            </div>
          </div>
        </div>

        {/* Feasibility Check Audit & Response Panel (For Feasibility Requests) */}
        {isFeasibilityItem && (
          <div className="px-4 sm:px-5 py-3.5 bg-gradient-to-r from-emerald-50/70 via-teal-50/50 to-blue-50/60 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-blue-950/40 border-b border-emerald-200/80 dark:border-emerald-800/60 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                  Feasibility Review &bull; Plant &amp; Sampling Routing
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 border border-emerald-300/80 dark:border-emerald-800">
                  Either Team Closes Request
                </span>
              </div>

              {/* Status if already responded */}
              {((product as any).feasibilityClosedAt || (product as any).plantFeasibilityResponse || (product as any).samplingFeasibilityResponse) && (
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-900 text-white dark:bg-emerald-500 dark:text-slate-950 shadow-2xs">
                  Closed by {((product as any).feasibilityClosedBy || "Reviewer").toUpperCase()} Team: {((product as any).plantFeasibilityResponse || (product as any).samplingFeasibilityResponse || "Decided")}
                </span>
              )}
            </div>

            {/* Current Recorded Responses Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/70 border border-slate-200/90 dark:border-slate-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 dark:text-slate-300">Plant Engineering</span>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                    (product as any).plantFeasibilityResponse === "Yes"
                      ? "bg-emerald-100 text-emerald-800"
                      : (product as any).plantFeasibilityResponse === "No"
                      ? "bg-rose-100 text-rose-800"
                      : (product as any).plantFeasibilityResponse === "Maybe"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-slate-100 text-slate-500"
                  }`}>
                    {(product as any).plantFeasibilityResponse || "Awaiting Response"}
                  </span>
                </div>
                {(product as any).plantFeasibilityRemark && (
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 italic">
                    Remark: "{(product as any).plantFeasibilityRemark}"
                  </p>
                )}
              </div>

              <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/70 border border-slate-200/90 dark:border-slate-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 dark:text-slate-300">SAMP Review Team</span>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                    (product as any).samplingFeasibilityResponse === "Yes"
                      ? "bg-emerald-100 text-emerald-800"
                      : (product as any).samplingFeasibilityResponse === "No"
                      ? "bg-rose-100 text-rose-800"
                      : (product as any).samplingFeasibilityResponse === "Maybe"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-slate-100 text-slate-500"
                  }`}>
                    {(product as any).samplingFeasibilityResponse || "Awaiting Response"}
                  </span>
                </div>
                {(product as any).samplingFeasibilityRemark && (
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 italic">
                    Remark: "{(product as any).samplingFeasibilityRemark}"
                  </p>
                )}
              </div>
            </div>

            {/* Interactive Feedback Submission Form */}
            {!(product as any).feasibilityClosedAt && (
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-emerald-300/80 dark:border-emerald-800/80 space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Respond as:</span>
                    <div className="inline-flex rounded-lg bg-slate-100 dark:bg-slate-800 p-0.5 text-xs font-semibold">
                      <button
                        type="button"
                        onClick={() => setActiveFeasibilityTeam("plant")}
                        className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                          activeFeasibilityTeam === "plant"
                            ? "bg-emerald-600 text-white shadow-xs font-bold"
                            : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                        }`}
                      >
                        Plant Team
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveFeasibilityTeam("sampling")}
                        className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                          activeFeasibilityTeam === "sampling"
                            ? "bg-emerald-600 text-white shadow-xs font-bold"
                            : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                        }`}
                      >
                        Sampling (SAMP) Team
                      </button>
                    </div>
                  </div>

                  {/* Decision Buttons: Yes / No / Maybe */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setFeasibilityDecision("Yes")}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer select-none ${
                        feasibilityDecision === "Yes"
                          ? "bg-emerald-600 text-white ring-2 ring-emerald-500/30 shadow-xs"
                          : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-300/80 dark:bg-emerald-950/60 dark:text-emerald-300"
                      }`}
                    >
                      ✓ Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => setFeasibilityDecision("Maybe")}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer select-none ${
                        feasibilityDecision === "Maybe"
                          ? "bg-amber-600 text-white ring-2 ring-amber-500/30 shadow-xs"
                          : "bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-300/80 dark:bg-amber-950/60 dark:text-amber-300"
                      }`}
                    >
                      ? Maybe (Remark Req.)
                    </button>
                    <button
                      type="button"
                      onClick={() => setFeasibilityDecision("No")}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer select-none ${
                        feasibilityDecision === "No"
                          ? "bg-rose-600 text-white ring-2 ring-rose-500/30 shadow-xs"
                          : "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-300/80 dark:bg-rose-950/60 dark:text-rose-300"
                      }`}
                    >
                      ✕ No (Remark Req.)
                    </button>
                  </div>
                </div>

                {/* Conditional Remark Field (Required for No & Maybe, optional for Yes) */}
                {feasibilityDecision && (
                  <div className="space-y-2 pt-1 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {feasibilityDecision === "Yes" ? "Optional Decision Remark:" : `${feasibilityDecision} Explanation & Remark (Required):`}
                      </span>
                      {feasibilityDecision !== "Yes" && (
                        <span className="text-rose-500 font-bold">* Required to proceed</span>
                      )}
                    </div>
                    <textarea
                      rows={2}
                      required={feasibilityDecision !== "Yes"}
                      value={feasibilityRemark}
                      onChange={(e) => setFeasibilityRemark(e.target.value)}
                      placeholder={
                        feasibilityDecision === "Yes"
                          ? "Any additional technical suggestions or equipment notes (optional)..."
                          : `Explain why ${activeFeasibilityTeam === "plant" ? "plant" : "sampling"} responded "${feasibilityDecision}" (e.g., machine limitation, material shortage)...`
                      }
                      className="w-full p-2.5 rounded-lg border border-slate-200/90 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 text-xs font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none transition-all resize-none"
                    />

                    <div className="flex items-center justify-between pt-1">
                      <p className="text-[10px] text-slate-400">
                        Submitting this response closes the feasibility audit and stamps the decision across the request.
                      </p>

                      <button
                        type="button"
                        onClick={handleFeasibilitySubmit}
                        disabled={
                          isSubmittingFeasibility ||
                          ((feasibilityDecision === "No" || feasibilityDecision === "Maybe") && !feasibilityRemark.trim())
                        }
                        className={`h-8 px-4 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer select-none ${
                          (feasibilityDecision === "No" || feasibilityDecision === "Maybe") && !feasibilityRemark.trim()
                            ? "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                            : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs active:scale-[0.98]"
                        }`}
                      >
                        {isSubmittingFeasibility ? "Recording..." : `Submit Decision (${feasibilityDecision}) & Close`}
                      </button>
                    </div>
                  </div>
                )}

                {feasibilityFeedbackSuccess && (
                  <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 pt-1">
                    ✓ {feasibilityFeedbackSuccess}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Dynamic Clone vs Custom Spec Status Banner */}
        {allowEdit && isEditing && (
          <div className="px-4 sm:px-5 py-2 bg-indigo-50/70 dark:bg-indigo-950/40 border-b border-indigo-100 dark:border-indigo-900/40 flex items-center justify-between text-xs gap-3">
            <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-200">
              <Sparkles size={13} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span>
                {isCustomizedProduct ? (
                  <strong>
                    Custom specifications active ({modifiedCount} modified). Saving will create a new product specification.
                  </strong>
                ) : (
                  <span>
                    Editing any characteristic converts this into a <strong>Customized Spec (New Product)</strong>. Leaving values unmodified preserves the original catalog clone reference.
                  </span>
                )}
              </span>
            </div>
            {isCustomizedProduct && (
              <button
                type="button"
                onClick={() => {
                  setLocalDetails(baseSnapshot.length > 0 ? baseSnapshot : details);
                }}
                className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 underline shrink-0 cursor-pointer"
              >
                Reset to Original Specs
              </button>
            )}
          </div>
        )}

        {/* Filter & Search Bar */}
        <div className="px-4 sm:px-5 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-col gap-2.5 shrink-0">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            {/* Search Input with Clear Button and Match Badge */}
            <div className="relative flex-1 max-w-lg">
              <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <Search size={14} />
              </div>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter characteristics (e.g. GSM, Size, Paper, Ruling)..."
                className="w-full h-9 pl-10 pr-16 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium transition-all"
              />
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                {search.trim() && (
                  <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                    {filteredDetails.length}
                  </span>
                )}
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                    title="Clear search"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>

            {/* Segmented Mode Switch: Configured vs All Specs */}
            <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
              <div className="inline-flex items-center rounded-xl bg-slate-100 dark:bg-slate-800/80 p-0.5 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setHideNA(true)}
                  className={`h-7 px-3 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    hideNA
                      ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                  title="Only display characteristics that have configured values"
                >
                  <Check size={11} className={hideNA ? "text-indigo-600 dark:text-indigo-400 stroke-[3]" : "opacity-0"} />
                  <span>Configured ({activeSpecsCount})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setHideNA(false)}
                  className={`h-7 px-3 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    !hideNA
                      ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                  title="Display all characteristics belonging to present product classes"
                >
                  <span>All Specs ({localDetails.length})</span>
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Categories Navigation Bar */}
        <div className="px-4 sm:px-5 py-2 bg-slate-50/70 dark:bg-slate-800/30 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-thin">
            <button
              type="button"
              onClick={() => setSelectedCategory("ALL")}
              className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 select-none ${
                selectedCategory === "ALL"
                  ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-2xs font-semibold"
                  : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200/90 dark:border-slate-700 shadow-2xs"
              }`}
            >
              <span>All Classes</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-medium ${
                  selectedCategory === "ALL"
                    ? "bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-900"
                    : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
                }`}
              >
                {categories.length}
              </span>
              {search.trim() && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-mono font-semibold border border-amber-200 dark:border-amber-800">
                  {filteredDetails.length} matches
                </span>
              )}
            </button>
            {categories.map((c) => {
              const matchCount = categoryMatchCount[c.className] || 0;
              const configuredCount = categoryActiveCount[c.className] || 0;
              const isMuted = search.trim() && matchCount === 0;
              const isSelected = selectedCategory === c.className;
              const dynamicLabel = getClassDynamicLabel(c.className, localDetails);
              const friendlyName = getFriendlyClassName(c.className);

              return (
                <button
                  key={c.className}
                  type="button"
                  onClick={() => setSelectedCategory(c.className)}
                  title={`${c.className} • ${friendlyName}`}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 select-none ${
                    isSelected
                      ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-2xs font-semibold"
                      : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200/90 dark:border-slate-700 shadow-2xs"
                  } ${isMuted ? "opacity-40 hover:opacity-80" : ""}`}
                >
                  <span className="truncate max-w-[150px] sm:max-w-[200px]">{dynamicLabel}</span>
                  {search.trim() ? (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-semibold ${
                        matchCount > 0
                          ? "bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200"
                          : "bg-slate-200 dark:bg-slate-700 text-slate-500"
                      }`}
                    >
                      {matchCount}
                    </span>
                  ) : (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-medium ${
                        isSelected
                          ? "bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-900"
                          : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
                      }`}
                    >
                      {hideNA ? configuredCount : `${configuredCount}/${c.count}`}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick Expand / Collapse All when in ALL mode */}
          {selectedCategory === "ALL" && (
            <div className="flex items-center gap-2 shrink-0 text-xs">
              <button
                type="button"
                onClick={handleExpandAll}
                className="text-[11px] font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                Expand All
              </button>
              <span className="text-slate-300 dark:text-slate-700">&bull;</span>
              <button
                type="button"
                onClick={handleCollapseAll}
                className="text-[11px] font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                Collapse All
              </button>
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5">
          {isLoading ? (
            <div className="space-y-3 animate-pulse p-1">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-slate-200/90 dark:border-slate-800 p-3.5 bg-white dark:bg-slate-900 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-5 w-24 bg-slate-200/80 dark:bg-slate-800 rounded" />
                      <div className="h-4 w-36 bg-slate-200/80 dark:bg-slate-800 rounded" />
                    </div>
                    <div className="h-4 w-20 bg-slate-200/80 dark:bg-slate-800 rounded" />
                  </div>
                  <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800/60">
                    <div className="flex items-center justify-between">
                      <div className="h-3.5 w-40 bg-slate-200/80 dark:bg-slate-800 rounded" />
                      <div className="h-7 w-48 bg-slate-200/80 dark:bg-slate-800 rounded-lg" />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="h-3.5 w-32 bg-slate-200/80 dark:bg-slate-800 rounded" />
                      <div className="h-7 w-48 bg-slate-200/80 dark:bg-slate-800 rounded-lg" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>

              {/* Empty Search State */}
              {filteredDetails.length === 0 ? (
                <div className="saas-empty-state rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 shadow-xs">
                  <div className="saas-empty-state-icon">
                    <Search size={22} />
                  </div>
                  <div className="space-y-1 max-w-sm mx-auto">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      No matching specifications found
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {search.trim()
                        ? `No characteristics match "${search}" with the current filters.`
                        : "No configured specifications found for this product."}
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-2 pt-1 flex-wrap">
                    {search.trim() && (
                      <button
                        type="button"
                        onClick={() => setSearch("")}
                        className="h-8 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer select-none"
                      >
                        Clear Search Filter
                      </button>
                    )}
                    {hideNA && (
                      <button
                        type="button"
                        onClick={() => setHideNA(false)}
                        className="h-8 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-xs font-medium transition-colors cursor-pointer shadow-2xs select-none"
                      >
                        View All Specs ({localDetails.length})
                      </button>
                    )}
                  </div>
                </div>
              ) : selectedCategory === "ALL" ? (
                <div className="space-y-2.5">
                  {categories.map((cat) => {
                    const items = groupedDetails[cat.className] || [];
                    if (items.length === 0 && (hideNA || isSearching)) return null;

                    const isExpanded = (isSearching && items.length > 0) || Boolean(expandedClasses[cat.className]);
                    const activeCount = categoryActiveCount[cat.className] || 0;
                    const totalCount = categoryTotalCount[cat.className] || cat.count || 0;
                    const dynamicLabel = getClassDynamicLabel(cat.className, localDetails);
                    const friendlyName = getFriendlyClassName(cat.className);

                    return (
                      <div
                        key={cat.className}
                        className="rounded-xl border border-slate-200/90 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 shadow-2xs transition-all"
                      >
                        {/* Accordion Header (Tap to Expand) */}
                        <button
                          type="button"
                          onClick={() => toggleClassExpansion(cat.className)}
                          className={`w-full px-3.5 py-2 flex items-center justify-between text-left cursor-pointer transition-colors ${
                            isExpanded
                              ? "bg-slate-50/90 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800"
                              : "hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-wrap">
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                              {dynamicLabel}
                            </span>
                            {dynamicLabel !== friendlyName && (
                              <span className="text-[11px] text-slate-400 font-medium">
                                ({friendlyName})
                              </span>
                            )}
                            <span className="text-[11px] text-slate-400">
                              ({items.length} {items.length === 1 ? "spec" : "specs"})
                            </span>
                            {search.trim() && (
                              <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                {items.length} {items.length === 1 ? "match" : "matches"}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <div className="flex items-center gap-2">
                              <div className="text-right">
                                <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                                  <span className={activeCount > 0 ? "font-bold text-emerald-600 dark:text-emerald-400" : ""}>
                                    {activeCount}
                                  </span>
                                  /{totalCount} configured
                                </span>
                              </div>
                              <div className="hidden sm:block w-12 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                <div
                                  className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                                  style={{ width: `${Math.min(100, Math.round((activeCount / Math.max(1, totalCount)) * 100))}%` }}
                                />
                              </div>
                            </div>

                            <ChevronDown
                              size={14}
                              className={`text-slate-400 transition-transform duration-200 ${
                                isExpanded ? "rotate-180 text-slate-800 dark:text-white" : ""
                              }`}
                            />
                          </div>
                        </button>

                        {/* Accordion Body (Expanded Specs Table) */}
                        {isExpanded && (
                          <div className="divide-y divide-slate-100 dark:divide-slate-800">
                            <div className="grid grid-cols-12 px-4 py-2 bg-slate-50/80 dark:bg-slate-800/50 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200/80 dark:border-slate-800 items-center">
                              <div className="col-span-5 sm:col-span-4">Characteristic</div>
                              <div className="col-span-6 sm:col-span-7">
                                {allowEdit && isEditing ? "Editable Value / Options" : "Configured Value"}
                              </div>
                              <div className="col-span-1 sm:col-span-1 text-right">UOM</div>
                            </div>

                            {items.length === 0 ? (
                              <div className="px-4 py-3 text-xs text-slate-400 italic">
                                No configured specifications in this category.
                              </div>
                            ) : (
                              items.map((item, idx) => (
                                <CharacteristicSpecRow
                                  key={`${item.className}-${item.characteristicName}-${idx}`}
                                  item={item}
                                  idx={idx}
                                  search={search}
                                  isRowEditable={allowEdit && isEditing}
                                  onValueChange={handleLocalChange}
                                />
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* View Mode 2: Single Selected Category View */
                <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 overflow-hidden shadow-2xs bg-white dark:bg-slate-900">
                  {/* Category Header Banner */}
                  <div className="px-3.5 py-2 bg-slate-50/90 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0 flex-wrap">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {getClassDynamicLabel(selectedCategory, localDetails)}
                      </span>
                      {getClassDynamicLabel(selectedCategory, localDetails) !== getFriendlyClassName(selectedCategory) && (
                        <span className="text-[11px] text-slate-400 font-medium">
                          ({getFriendlyClassName(selectedCategory)})
                        </span>
                      )}
                      <span className="text-[11px] text-slate-400">
                        ({filteredDetails.length} {filteredDetails.length === 1 ? "spec" : "specs"})
                      </span>
                      {search.trim() && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                          {filteredDetails.length} {filteredDetails.length === 1 ? "match" : "matches"}
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                        <span className={(categoryActiveCount[selectedCategory] || 0) > 0 ? "font-bold text-emerald-600 dark:text-emerald-400" : ""}>
                          {categoryActiveCount[selectedCategory] || 0}
                        </span>
                        /{categoryTotalCount[selectedCategory] || 0} configured
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-12 px-4 py-2 bg-slate-50/80 dark:bg-slate-800/50 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200/80 dark:border-slate-800 sticky top-0 z-10 items-center">
                    <div className="col-span-5 sm:col-span-4">Characteristic</div>
                    <div className="col-span-6 sm:col-span-7">
                      {allowEdit && isEditing ? "Editable Value / Options" : "Configured Value"}
                    </div>
                    <div className="col-span-1 sm:col-span-1 text-right">UOM</div>
                  </div>

                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredDetails.length === 0 ? (
                      <div className="px-4 py-8 text-center text-xs text-slate-400 italic">
                        No configured specifications in this category. Switch to "All Specs" to view unconfigured characteristics.
                      </div>
                    ) : (
                      filteredDetails.map((item, idx) => (
                        <CharacteristicSpecRow
                          key={`${item.className}-${item.characteristicName}-${idx}`}
                          item={item}
                          idx={idx}
                          search={search}
                          isRowEditable={allowEdit && isEditing}
                          onValueChange={handleLocalChange}
                        />
                      ))
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </>
    )}
  </div>
    </div>,
    document.body
  );
};
