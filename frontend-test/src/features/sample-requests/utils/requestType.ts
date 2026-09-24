import { SampleRequestItem } from "../types";

export interface RequestTypeInfo {
  label: string;
  category: "marketing" | "feasibility" | "planning" | "design" | "material" | "binding";
  badgeClass: string;
  dotClass: string;
  subTypes?: string[];
}

export function getSampleRequestTypeInfo(req: SampleRequestItem): RequestTypeInfo {
  const mode = (req.creationMode || "").toLowerCase();
  const kind = (req.requestKind || "").toLowerCase();
  const sr = (req.srNumber || "").toLowerCase();

  if (kind === "design" || mode === "design" || sr.startsWith("dr-")) {
    return {
      label: "Design Request",
      category: "design",
      badgeClass: "bg-fuchsia-50 dark:bg-fuchsia-950/60 text-fuchsia-700 dark:text-fuchsia-300 border-fuchsia-200/80 dark:border-fuchsia-800/80",
      dotClass: "bg-fuchsia-500",
    };
  }

  if (
    mode === "feasibility_check" ||
    mode.includes("feasibility") ||
    Boolean(req.plantFeasibilityResponse || req.samplingFeasibilityResponse)
  ) {
    return {
      label: "Feasibility Check",
      category: "feasibility",
      badgeClass: "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/80",
      dotClass: "bg-amber-500",
    };
  }

  if (mode === "program_planning" || mode.includes("planning")) {
    return {
      label: "Program Planning",
      category: "planning",
      badgeClass: "bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border-cyan-200/80 dark:border-cyan-800/80",
      dotClass: "bg-cyan-500",
    };
  }

  if (mode === "material_code") {
    return {
      label: "Material Spec",
      category: "material",
      badgeClass: "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/80",
      dotClass: "bg-emerald-500",
      subTypes: req.requestTypes,
    };
  }

  if (mode === "binding") {
    return {
      label: "Binding Spec",
      category: "binding",
      badgeClass: "bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-200/80 dark:border-sky-800/80",
      dotClass: "bg-sky-500",
      subTypes: req.requestTypes,
    };
  }

  // Default: Marketing Request
  return {
    label: "Marketing Request",
    category: "marketing",
    badgeClass: "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200/80 dark:border-indigo-800/80",
    dotClass: "bg-indigo-500",
    subTypes: req.requestTypes,
  };
}
