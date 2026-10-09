import { SampleRequestItem } from "../types";
import { CreativeDesignOutputRow, CreativeDesignSubmission } from "@/features/creative/types";

export interface DesignWorkflowState {
  claimedBy?: string | null;
  claimedAt?: string | null;
  releasedAt?: string | null;
  isCounterDateActive?: boolean;
  proposedTargetDate?: string | null;
  counterDateReason?: string | null;
  counterDateRequestedAt?: string | null;
  counterDateDecision?: "pending" | "accepted" | "rejected" | null;
  counterDateDecisionAt?: string | null;
  counterDateDecisionNotes?: string | null;
  designRequiredDate?: string | null;
  status?: string;
  creativeSubmissions?: CreativeDesignSubmission[];
  marketingDesignDecision?: "awaiting_marketing_review" | "remaining_requested" | "accepted" | null;
  remainingDesignCount?: number;
  trend?: string | null;
  targetAudience?: string | null;
  numberOfDesigns?: number;
  designRemarks?: string | null;
}

const STORAGE_PREFIX = "samp_design_workflow_";

export function normalizeWorkflowId(id: string | number): string {
  if (!id) return "";
  const s = String(id).trim();
  if (s.startsWith("design-")) return s.replace("design-", "");
  return s;
}

/** Load persistent workflow overrides from localStorage */
export function getDesignWorkflowState(id: string | number): DesignWorkflowState {
  if (!id) return {};
  const norm = normalizeWorkflowId(id);
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${norm}`) || localStorage.getItem(`${STORAGE_PREFIX}${id}`);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.warn("Could not read design workflow state:", err);
  }
  return {};
}

/** Save workflow updates and broadcast reactive event */
export function saveDesignWorkflowState(
  id: string | number,
  updates: Partial<DesignWorkflowState>
): DesignWorkflowState {
  if (!id) return {};
  const norm = normalizeWorkflowId(id);
  try {
    const current = getDesignWorkflowState(norm);
    const merged: DesignWorkflowState = { ...current, ...updates };
    const serialized = JSON.stringify(merged);
    localStorage.setItem(`${STORAGE_PREFIX}${norm}`, serialized);
    if (String(id) !== norm) {
      localStorage.setItem(`${STORAGE_PREFIX}${id}`, serialized);
    }

    // Dispatch reactive event so other components immediately update without reload
    window.dispatchEvent(
      new CustomEvent("samp:design-workflow-updated", {
        detail: { id: String(id), requestId: String(id), normalizedId: norm, updates: merged },
      })
    );
    return merged;
  } catch (err) {
    console.warn("Could not save design workflow state:", err);
    return updates;
  }
}

/** Merge base request with persisted workflow state */
export function mergeWithWorkflowState(req: SampleRequestItem): SampleRequestItem {
  if (!req?.id) return req;
  const saved = getDesignWorkflowState(req.id);
  return {
    ...req,
    claimedBy: saved.claimedBy !== undefined ? saved.claimedBy : req.claimedBy,
    claimedAt: saved.claimedAt !== undefined ? saved.claimedAt : req.claimedAt,
    releasedAt: saved.releasedAt !== undefined ? saved.releasedAt : req.releasedAt || req.createdAt,
    isCounterDateActive:
      saved.isCounterDateActive !== undefined ? saved.isCounterDateActive : req.isCounterDateActive,
    proposedTargetDate:
      saved.proposedTargetDate !== undefined ? saved.proposedTargetDate : req.proposedTargetDate,
    counterDateReason:
      saved.counterDateReason !== undefined ? saved.counterDateReason : req.counterDateReason,
    counterDateRequestedAt:
      saved.counterDateRequestedAt !== undefined
        ? saved.counterDateRequestedAt
        : req.counterDateRequestedAt,
    counterDateDecision:
      saved.counterDateDecision !== undefined ? saved.counterDateDecision : req.counterDateDecision,
    counterDateDecisionAt:
      saved.counterDateDecisionAt !== undefined
        ? saved.counterDateDecisionAt
        : req.counterDateDecisionAt,
    counterDateDecisionNotes:
      saved.counterDateDecisionNotes !== undefined
        ? saved.counterDateDecisionNotes
        : req.counterDateDecisionNotes,
    designRequiredDate:
      saved.designRequiredDate !== undefined ? saved.designRequiredDate : req.sampleRequiredDate || req.targetArtworkDateCreative,
    status: saved.status !== undefined ? saved.status : req.designRequestStatus || req.status,
    creativeSubmissions:
      saved.creativeSubmissions !== undefined ? saved.creativeSubmissions : req.creativeSubmissions,
    marketingDesignDecision:
      saved.marketingDesignDecision !== undefined
        ? saved.marketingDesignDecision
        : req.marketingDesignDecision,
    remainingDesignCount:
      saved.remainingDesignCount !== undefined ? saved.remainingDesignCount : req.remainingDesignCount,
    trend: saved.trend !== undefined && saved.trend !== null ? saved.trend : req.trend,
    targetAudience:
      saved.targetAudience !== undefined && saved.targetAudience !== null
        ? saved.targetAudience
        : req.targetAudience,
    numberOfDesigns:
      saved.numberOfDesigns !== undefined ? saved.numberOfDesigns : req.numberOfDesigns,
    designRemarks:
      saved.designRemarks !== undefined && saved.designRemarks !== null
        ? saved.designRemarks
        : req.designRemarks,
  };
}

/** Check 2-day (48 hours) counter-date SLA rule */
export function checkCounterDateSla(
  request: SampleRequestItem
): {
  isEligible: boolean;
  hoursRemaining: number;
  label: string;
  deadlineIso: string;
} {
  const baseTimeStr = request.releasedAt || request.createdAt || new Date().toISOString();
  let baseTime = new Date(baseTimeStr).getTime();
  if (isNaN(baseTime)) baseTime = Date.now();

  const deadline = baseTime + 48 * 60 * 60 * 1000; // 48 hours in milliseconds
  const diffMs = deadline - Date.now();
  const deadlineIso = new Date(deadline).toISOString();

  if (diffMs <= 0) {
    return {
      isEligible: false,
      hoursRemaining: 0,
      label: "48h Window Expired (Locked)",
      deadlineIso,
    };
  }

  const hoursRemaining = Math.max(0, Math.ceil(diffMs / (60 * 60 * 1000)));
  const days = Math.floor(hoursRemaining / 24);
  const remHours = hoursRemaining % 24;

  let label = "";
  if (days > 0) {
    label = `${days}d ${remHours}h left`;
  } else {
    label = `${hoursRemaining}h left`;
  }

  return {
    isEligible: true,
    hoursRemaining,
    label: `Counter Window: ${label}`,
    deadlineIso,
  };
}

function toId(idOrReq: string | number | SampleRequestItem): string | number {
  if (typeof idOrReq === "object" && idOrReq !== null) {
    return idOrReq.id;
  }
  return idOrReq;
}

/** Claim task helper */
export function claimDesignTask(
  idOrReq: string | number | SampleRequestItem,
  designerName: string = "Creative Designer"
): DesignWorkflowState {
  const id = toId(idOrReq);
  const now = new Date().toISOString();
  return saveDesignWorkflowState(id, {
    claimedBy: designerName,
    claimedAt: now,
    status: "Creative Studio",
  });
}

/** Unclaim/Release task helper */
export function unclaimDesignTask(idOrReq: string | number | SampleRequestItem): DesignWorkflowState {
  const id = toId(idOrReq);
  return saveDesignWorkflowState(id, {
    claimedBy: null,
    claimedAt: null,
  });
}

/** Propose counter date */
export function submitCounterDateProposal(
  idOrReq: string | number | SampleRequestItem,
  proposedDate: string,
  reason: string,
  _requestedBy?: string
): DesignWorkflowState {
  const id = toId(idOrReq);
  return saveDesignWorkflowState(id, {
    isCounterDateActive: true,
    proposedTargetDate: proposedDate,
    counterDateReason: reason,
    counterDateRequestedAt: new Date().toISOString(),
    counterDateDecision: "pending",
    status: "Target Date Counter Proposed",
  });
}

/** Marketing decision on counter date (Accept / Reject) */
export function submitCounterDateDecision(
  idOrReq: string | number | SampleRequestItem,
  decision: "accept" | "accepted" | "reject" | "rejected",
  notes?: string
): DesignWorkflowState {
  const id = toId(idOrReq);
  const current = getDesignWorkflowState(id);
  const now = new Date().toISOString();
  const isAccepted = decision === "accept" || decision === "accepted";

  if (isAccepted && current.proposedTargetDate) {
    return saveDesignWorkflowState(id, {
      isCounterDateActive: false,
      counterDateDecision: "accepted",
      counterDateDecisionAt: now,
      counterDateDecisionNotes: notes || "Accepted by Marketing",
      designRequiredDate: current.proposedTargetDate,
      status: "Creative Studio",
    });
  } else {
    return saveDesignWorkflowState(id, {
      isCounterDateActive: false,
      counterDateDecision: "rejected",
      counterDateDecisionAt: now,
      counterDateDecisionNotes: notes || "Rejected by Marketing. Original deadline holds.",
      status: "Creative Studio",
    });
  }
}

/** Creative Output submission helper - flexible signature supporting both (id, fileUrl, rows) and (id, total, batch) */
export function submitCreativeOutputBatch(
  idOrReq: string | number | SampleRequestItem,
  arg2: string | number,
  arg3: CreativeDesignOutputRow[] | { designFileUrl: string; rows: CreativeDesignOutputRow[] },
  arg4?: CreativeDesignOutputRow[]
): DesignWorkflowState {
  const id = toId(idOrReq);
  const current = getDesignWorkflowState(id);
  const existingSubmissions = current.creativeSubmissions || [];

  let designFileUrl = "";
  let rows: CreativeDesignOutputRow[] = [];
  let totalRequested = 1;

  if (typeof arg2 === "string") {
    designFileUrl = arg2;
    rows = (Array.isArray(arg3) ? arg3 : []) as CreativeDesignOutputRow[];
  } else {
    totalRequested = arg2;
    if (typeof arg3 === "object" && !Array.isArray(arg3)) {
      designFileUrl = arg3.designFileUrl;
      rows = arg3.rows || [];
    } else if (Array.isArray(arg4)) {
      rows = arg4;
    }
  }

  const newSubmission: CreativeDesignSubmission = {
    submittedAt: new Date().toISOString(),
    designFileUrl,
    rows,
  };
  const updatedSubmissions = [...existingSubmissions, newSubmission];
  const delivered = updatedSubmissions.reduce((sum, s) => sum + (s.rows?.length || 0), 0);
  const remaining = Math.max(0, totalRequested - delivered);

  return saveDesignWorkflowState(id, {
    creativeSubmissions: updatedSubmissions,
    remainingDesignCount: remaining,
    marketingDesignDecision: "awaiting_marketing_review",
    status: "Awaiting Marketing Review",
  });
}

/** Marketing final decision on creative deliverables */
export function submitMarketingDeliverablesDecision(
  idOrReq: string | number | SampleRequestItem,
  decision: "accept" | "request_remaining",
  remainingCount: number = 0
): DesignWorkflowState {
  const id = toId(idOrReq);
  if (decision === "accept") {
    return saveDesignWorkflowState(id, {
      marketingDesignDecision: "accepted",
      status: "Approved / Closed",
      remainingDesignCount: 0,
    });
  } else {
    return saveDesignWorkflowState(id, {
      marketingDesignDecision: "remaining_requested",
      status: "Creative Remaining Requested",
      remainingDesignCount: remainingCount,
    });
  }
}
