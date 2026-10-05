import { SampleRequestItem } from "../types";

export type RequestTrackType = "marketing_request" | "feasibility_check" | "program_planning";

export function getRequestTrackType(r: Partial<SampleRequestItem>): RequestTrackType {
  const mode = String(r.creationMode || (r as any)?.creation_mode || "").toLowerCase();
  const desc = String(r.productDescription || (r as any)?.product_description || "").toLowerCase();
  const mat = String(r.materialCode || (r as any)?.material_code || "").toLowerCase();
  const sr = String(r.srNumber || (r as any)?.sr_number || "").toLowerCase();
  const idStr = String(r.id || "");
  const kind = String(r.requestKind || "").toLowerCase();

  // 1. Feasibility Check (Strict separation: NEVER enters Draft)
  if (
    kind === "feasibility" ||
    idStr.startsWith("feasibility-") ||
    mode === "feasibility_check" ||
    mode === "feasibility" ||
    Boolean((r as any)?.feasibilityCategory) ||
    Boolean((r as any)?.feasibility_category) ||
    mat.startsWith("fc-") ||
    mat.startsWith("fc-ck") ||
    mat.startsWith("fs-ck") ||
    sr.startsWith("fc-") ||
    sr.startsWith("fs-") ||
    desc.includes("feasibility check") ||
    desc.startsWith("[new category]") ||
    desc.startsWith("[new format]") ||
    desc.startsWith("[new finish]") ||
    desc.startsWith("[new accessories]") ||
    desc.startsWith("[other custom]") ||
    desc.startsWith("[bespoke")
  ) {
    return "feasibility_check";
  }

  // 2. Program Planning (Strict separation: NEVER enters Draft)
  if (
    kind === "program" ||
    idStr.startsWith("program-") ||
    mode === "program_planning" ||
    mat.startsWith("pg-pl") ||
    sr.startsWith("pg-") ||
    desc.includes("seasonal program:") ||
    desc.includes("material specification matrix:")
  ) {
    return "program_planning";
  }

  // 3. Marketing Request (Only Marketing requests can enter Draft)
  return "marketing_request";
}

export function getRequestTrackBadge(r: Partial<SampleRequestItem>): {
  label: string;
  bg: string;
  text: string;
  border: string;
  className: string;
} {
  const track = getRequestTrackType(r);
  if (track === "feasibility_check") {
    return {
      label: "Feasibility NPD",
      bg: "bg-purple-50 dark:bg-purple-950/40",
      text: "text-purple-700 dark:text-purple-300",
      border: "border-purple-200 dark:border-purple-800",
      className:
        "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800",
    };
  }
  if (track === "program_planning") {
    return {
      label: "Program Planning",
      bg: "bg-indigo-50 dark:bg-indigo-950/40",
      text: "text-indigo-700 dark:text-indigo-300",
      border: "border-indigo-200 dark:border-indigo-800",
      className:
        "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800",
    };
  }
  return {
    label: "Sample Request",
    bg: "bg-brand-50 dark:bg-brand-950/40",
    text: "text-brand-700 dark:text-brand-300",
    border: "border-brand-200 dark:border-brand-800",
    className:
      "bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800",
  };
}

export function getStageIdForRequest(r: SampleRequestItem): string {
  const track = getRequestTrackType(r);
  const s = String(r.status || "").toLowerCase().trim();

  // 1. Feasibility Check: Active review in SAMP, or Closed
  if (track === "feasibility_check") {
    if (
      s.includes("complete") ||
      s.includes("close") ||
      s.includes("approved") ||
      s.includes("rejected")
    ) {
      return "dispatched"; // Closed / Sign-off Completed
    }
    return "samp"; // SAMP Team Work / Feasibility Evaluation
  }

  // 2. Program Planning: Active planning in SAMP, or Plant / Closed
  if (track === "program_planning") {
    if (s.includes("complete") || s.includes("close") || s.includes("dispatch")) {
      return "dispatched";
    }
    if (s.includes("plant") || s.includes("execution")) {
      return "plant";
    }
    return "samp"; // SAMP Team Work / Seasonal Matrix Review
  }

  // 3. Marketing Request: Only Marketing requests can be in "draft"
  if (s.includes("draft") || s.includes("smt") || s.includes("pending allocation")) {
    return "draft";
  }
  if (s.includes("creative")) return "creative";
  if (s.includes("studio")) return "studio";
  if (s.includes("cost") || s.includes("estimation")) return "costing";
  if (s.includes("plant") || s.includes("execution")) return "plant";
  if (s.includes("dispatch") || s.includes("close") || s.includes("complete")) return "dispatched";
  if (s.includes("deal") || s.includes("actual")) return "deal";
  if (s.includes("samp") || s.includes("review") || s.includes("pmt") || s.includes("qc")) return "samp";

  // Fallback for released marketing requests:
  const isDesign =
    (r.requestTypes || []).includes("design") ||
    String(r.materialCode || "").startsWith("DSG-") ||
    String(r.srNumber || "").includes("-DSG-");
  return isDesign ? "creative" : "samp";
}

export function isOpenFeasibilityReview(request: SampleRequestItem): boolean {
  if (getRequestTrackType(request) !== "feasibility_check") return false;
  if (request.samplingFeasibilityResponse) return false;
  const status = String(request.status || "").toLowerCase();
  return !["completed", "closed", "approved", "rejected"].some((term) => status.includes(term));
}
