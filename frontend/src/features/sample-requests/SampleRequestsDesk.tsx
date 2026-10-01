import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { UserProfile } from "@/features/auth";
import { SampleRequestItem, ProgramMaterialItem } from "./types";
import {
  fetchAllMarketingRequestsApi,
  createSampleRequestApi,
  createFeasibilityRequestApi,
  mapFeasibilityRequestToSampleRequest,
  updateSampleRequestApi,
  updateFeasibilityRequestApi,
  deleteSampleRequestApi,
  deleteAnyRequestApi,
  batchDeleteAnyRequestsApi,
} from "./api";
import { StatusPill } from "@/components/ui/StatusPill";
import { ProcessStageRibbon, StageStep } from "@/components/erp/ProcessStageRibbon";
import { MetricRibbon, MetricTileItem } from "@/components/erp/MetricRibbon";
import { DataTable, ColumnDef } from "@/components/erp/DataTable";
import { SampleRequestInspector } from "./components/SampleRequestInspector";
import { NewSampleRequestModal } from "./components/NewSampleRequestModal";
import {
  Search,
  Plus,
  Download,
  Copy,
  Check,
  Trash2,
  X,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  AlertCircle,
  ArrowRight,
  ExternalLink,
  Image as ImageIcon,
  Clock,
  Layers,
  Send,
} from "lucide-react";

export interface SampleRequestsDeskProps {
  user?: UserProfile | null;
}

const STAGES: { id: string; label: string }[] = [
  { id: "all", label: "All Requests" },
  { id: "draft", label: "Draft" },
  { id: "creative", label: "Creative" },
  { id: "studio", label: "Studio" },
  { id: "costing", label: "Costing" },
  { id: "samp", label: "SAMP Team Work" },
  { id: "plant", label: "Plant Execution" },
  { id: "dispatched", label: "Closed" },
  { id: "deal", label: "Deal" },
];

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

/**
 * Maps any sample request to its canonical process stage.
 * Strictly guarantees:
 * - Feasibility Check requests NEVER go to Draft.
 * - Program Planning requests NEVER go to Draft.
 * - ONLY Marketing requests in Draft status enter Draft stage.
 */
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

function isOpenFeasibilityReview(request: SampleRequestItem): boolean {
  if (getRequestTrackType(request) !== "feasibility_check") return false;
  if (request.samplingFeasibilityResponse) return false;
  const status = String(request.status || "").toLowerCase();
  return !["completed", "closed", "approved", "rejected"].some((term) => status.includes(term));
}

function getSlaCountdown(requiredDateStr?: string | null): { text: string; status: "overdue" | "today" | "upcoming"; days: number } | null {
  if (!requiredDateStr) return null;
  const target = new Date(requiredDateStr);
  if (isNaN(target.getTime())) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);

  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      text: `Overdue by ${Math.abs(diffDays)}d`,
      status: "overdue",
      days: diffDays,
    };
  } else if (diffDays === 0) {
    return {
      text: "Due Today",
      status: "today",
      days: 0,
    };
  } else {
    return {
      text: `${diffDays}d left`,
      status: "upcoming",
      days: diffDays,
    };
  }
}

export const SampleRequestsDesk: React.FC<SampleRequestsDeskProps> = ({ user }) => {
  const isAdmin =
    String(user?.role || "").toLowerCase() === "admin" ||
    user?.userid === "admin" ||
    user?.role === "Administrator";

  const [requests, setRequests] = useState<SampleRequestItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStageId, setSelectedStageId] = useState<string>("all");
  const [quickFilter, setQuickFilter] = useState<"none" | "pending_feasibility" | "active_workflow">("none");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedCustomer, setSelectedCustomer] = useState<string>("all");

  // Selection & Inspector
  const [selectedRequest, setSelectedRequest] = useState<SampleRequestItem | null>(null);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [modalInitialTrack, setModalInitialTrack] = useState<"gateway" | "marketing_request" | "feasibility_check" | "program_planning">("gateway");
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());

  const location = useLocation();
  useEffect(() => {
    if ((location.state as any)?.openMarketingSetup) {
      setModalInitialTrack("marketing_request");
      setIsNewModalOpen(true);
    }
    if ((location.state as any)?.stage) {
      setSelectedStageId((location.state as any).stage);
    }
  }, [location.state]);

  // When switching away from Marketing to Feasibility or Program, auto-reset stage if on Draft
  useEffect(() => {
    if (
      (selectedType === "feasibility_check" || selectedType === "program_planning") &&
      selectedStageId === "draft"
    ) {
      setSelectedStageId("all");
    }
  }, [selectedType, selectedStageId]);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }, []);

  // Copy SR Number feedback (inline checkmark, no screen-blocking toast)
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const handleCopyCode = (code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedId(code);
    setTimeout(() => setCopiedId(null), 1200);
  };

  // Pagination & Sorting
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;
  const [sortField, setSortField] = useState<string | null>("srNumber");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Fetch Requests
  const loadRequests = useCallback(async () => {
    setIsLoading(true);
    try {
      const merged = await fetchAllMarketingRequestsApi();
      setRequests(merged);
    } catch (err) {
      console.error("Failed to load sample requests:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests, location.state]);

  useEffect(() => {
    const handleRefresh = (event: Event) => {
      event.preventDefault();
      void loadRequests().finally(() => {
        window.dispatchEvent(new Event("app:refresh-complete"));
      });
    };
    window.addEventListener("app:refresh-requested", handleRefresh);
    return () => window.removeEventListener("app:refresh-requested", handleRefresh);
  }, [loadRequests]);

  // Filter requests by active request-type tab for stage telemetry
  const scopedRequests = useMemo(() => {
    if (selectedType === "all") return requests;
    return requests.filter((r) => getRequestTrackType(r) === selectedType);
  }, [requests, selectedType]);

  // Stage counts for Ribbon (strictly synchronized with getStageIdForRequest)
  const stageSteps: StageStep[] = useMemo(() => {
    const counts: Record<string, number> = {
      all: scopedRequests.length,
      draft: 0,
      creative: 0,
      studio: 0,
      costing: 0,
      samp: 0,
      plant: 0,
      dispatched: 0,
      deal: 0,
    };

    scopedRequests.forEach((r) => {
      const stage = getStageIdForRequest(r);
      if (counts[stage] !== undefined) {
        counts[stage]++;
      }
    });

    return STAGES.map((st) => ({
      ...st,
      count: counts[st.id] || 0,
    }));
  }, [scopedRequests]);

  // Unique plants and customers for filters
  const uniquePlants = useMemo(() => {
    const set = new Set<string>();
    requests.forEach((r) => {
      if (r.targetPlant && r.targetPlant.trim()) set.add(r.targetPlant.trim());
    });
    return Array.from(set).sort();
  }, [requests]);

  const uniqueCustomers = useMemo(() => {
    const set = new Set<string>();
    requests.forEach((r) => {
      if (r.customer && r.customer.trim()) set.add(r.customer.trim());
    });
    return Array.from(set).sort();
  }, [requests]);

  // Counts for the 3 distinct Request Types
  const typeCounts = useMemo(() => {
    let marketing = 0;
    let feasibility = 0;
    let program = 0;
    let pendingFeas = 0;
    requests.forEach((r) => {
      const t = getRequestTrackType(r);
      if (t === "marketing_request") marketing++;
      else if (t === "feasibility_check") {
        feasibility++;
        if (isOpenFeasibilityReview(r)) {
          pendingFeas++;
        }
      } else if (t === "program_planning") program++;
    });
    return { marketing, feasibility, program, pendingFeas };
  }, [requests]);

  // Requests where SAMP has responded and Marketing Commercial Decision is Pending
  const pendingMarketingDecisions = useMemo(() => {
    return requests.filter(
      (r) =>
        getRequestTrackType(r) === "feasibility_check" &&
        Boolean(r.samplingFeasibilityResponse) &&
        !r.marketingDecision
    );
  }, [requests]);

  // Metric Ribbon Data: Real Operational Health & Telemetry
  const metrics: MetricTileItem[] = useMemo(() => {
    const closedCount = requests.filter((r) => {
      const s = (r.status || "").toLowerCase();
      return (s.includes("dispatch") || s.includes("close")) && !s.includes("deal");
    }).length;

    const dealCount = requests.filter((r) => {
      const s = (r.status || "").toLowerCase();
      return s.includes("deal") || s.includes("actual");
    }).length;

    const inWorkflow = requests.filter((r) => {
      const s = (r.status || "").toLowerCase();
      return (
        s.includes("creative") ||
        s.includes("studio") ||
        s.includes("cost") ||
        s.includes("samp") ||
        s.includes("review") ||
        (getRequestTrackType(r) === "feasibility_check" && s.includes("pending feasibility"))
      );
    }).length;

    const plantCount = requests.filter((r) => {
      const s = (r.status || "").toLowerCase();
      return s.includes("plant") || s.includes("execution");
    }).length;

    return [
      {
        id: "total",
        label: "Total Requests",
        value: requests.length,
        isActive: selectedType === "all" && quickFilter === "none" && selectedStageId === "all",
        onClick: () => {
          setSelectedType("all");
          setQuickFilter("none");
          setSelectedStageId("all");
          setCurrentPage(1);
        },
      },
      {
        id: "workflow",
        label: "Active Workflow",
        value: inWorkflow,
        isActive: quickFilter === "active_workflow",
        onClick: () => {
          setQuickFilter((prev) => (prev === "active_workflow" ? "none" : "active_workflow"));
          setSelectedStageId("all");
          setCurrentPage(1);
        },
      },
      {
        id: "pending_action",
        label: "Pending Action",
        value: typeCounts.pendingFeas,
        isActive: quickFilter === "pending_feasibility",
        onClick: () => {
          setQuickFilter((prev) => (prev === "pending_feasibility" ? "none" : "pending_feasibility"));
          setCurrentPage(1);
        },
      },
      {
        id: "plant",
        label: "Plant Execution",
        value: plantCount,
        isActive: selectedStageId === "plant",
        onClick: () => {
          setSelectedStageId((prev) => (prev === "plant" ? "all" : "plant"));
          setQuickFilter("none");
          setCurrentPage(1);
        },
      },
      {
        id: "closed",
        label: "Closed",
        value: closedCount,
        isActive: selectedStageId === "dispatched",
        onClick: () => {
          setQuickFilter("none");
          setSelectedStageId((prev) => (prev === "dispatched" ? "all" : "dispatched"));
          setCurrentPage(1);
        },
      },
      {
        id: "deal",
        label: "Deal",
        value: dealCount,
        isActive: selectedStageId === "deal",
        onClick: () => {
          setQuickFilter("none");
          setSelectedStageId((prev) => (prev === "deal" ? "all" : "deal"));
          setCurrentPage(1);
        },
      },
    ];
  }, [requests, selectedType, selectedStageId, quickFilter, typeCounts]);

  // Filtering
  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      // Quick Filter (from Metric Ribbon Telemetry)
      if (quickFilter === "pending_feasibility") {
        if (!isOpenFeasibilityReview(r)) return false;
      }
      if (quickFilter === "active_workflow") {
        const s = (r.status || "").toLowerCase();
        const isActive =
          s.includes("creative") ||
          s.includes("studio") ||
          s.includes("cost") ||
          s.includes("samp") ||
          s.includes("review");
        if (!isActive) return false;
      }

      // Stage Filter (strictly aligned with stageSteps and getStageIdForRequest)
      if (selectedStageId !== "all") {
        const itemStage = getStageIdForRequest(r);
        if (itemStage !== selectedStageId) return false;
      }

      // Request Type Filter (Marketing Request / Feasibility Check / Program Planning)
      if (selectedType !== "all") {
        const track = getRequestTrackType(r);
        if (track !== selectedType) return false;
      }

      // Customer Filter
      if (selectedCustomer !== "all" && r.customer !== selectedCustomer) {
        return false;
      }

      // Search Query Filter
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const sr = (r.srNumber || "").toLowerCase();
        const mat = (r.materialCode || "").toLowerCase();
        const desc = (r.productDescription || "").toLowerCase();
        const cust = (r.customer || "").toLowerCase();
        const plant = (r.targetPlant || "").toLowerCase();
        const brand = (r.brandName || "").toLowerCase();
        const prog = (r.programName || "").toLowerCase();

        return (
          sr.includes(q) ||
          mat.includes(q) ||
          desc.includes(q) ||
          cust.includes(q) ||
          plant.includes(q) ||
          brand.includes(q) ||
          prog.includes(q)
        );
      }

      return true;
    });
  }, [requests, selectedStageId, quickFilter, selectedType, selectedCustomer, searchTerm]);

  // Sorting
  const sortedRequests = useMemo(() => {
    if (!sortField) return filteredRequests;
    return [...filteredRequests].sort((a, b) => {
      let valA = sortField === "requestType" ? getRequestTrackType(a) : (a as any)[sortField] ?? "";
      let valB = sortField === "requestType" ? getRequestTrackType(b) : (b as any)[sortField] ?? "";
      if (typeof valA === "number" && typeof valB === "number") {
        return sortDirection === "asc" ? valA - valB : valB - valA;
      }
      valA = String(valA).toLowerCase();
      valB = String(valB).toLowerCase();
      const comp = valA.localeCompare(valB, undefined, { numeric: true });
      return sortDirection === "asc" ? comp : -comp;
    });
  }, [filteredRequests, sortField, sortDirection]);

  // Paginated Slice
  const paginatedRequests = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedRequests.slice(start, start + pageSize);
  }, [sortedRequests, currentPage, pageSize]);

  // Selection Handlers
  const handleToggleSelectRow = (id: string | number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.size === paginatedRequests.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedRequests.map((r) => r.id)));
    }
  };

  // Inspect Row Handler
  const handleSelectRow = (req: SampleRequestItem) => {
    setSelectedRequest(req);
    setIsInspectorOpen(true);
  };

  // Feasibility Update Handler
  const handleUpdateFeasibility = async (
    requestId: string | number,
    team: "plant" | "sampling",
    response: "Yes" | "No" | "Maybe",
    remark?: string
  ) => {
    const closedStamp = new Date().toISOString();
    const currentItem = requests.find((r) => String(r.id) === String(requestId));
    const isFirst = !currentItem?.feasibilityClosedBy;
    const closedBy = currentItem?.feasibilityClosedBy || team;

    let updatedStatus = currentItem?.status || "Pending Feasibility";
    if (isFirst) {
      if (response === "Yes") {
        updatedStatus = team === "sampling" ? "Feasible (SAMP Approved)" : "Feasible (Plant Approved)";
      } else if (response === "Maybe") {
        updatedStatus = "Conditional Feasibility";
      } else {
        updatedStatus = "Feasibility Rejected";
      }
    }

    const payload: Partial<SampleRequestItem> = {
      ...(team === "plant"
        ? {
            plantFeasibilityResponse: response,
            plantFeasibilityRemark: remark || null,
          }
        : {
            samplingFeasibilityResponse: response,
            samplingFeasibilityRemark: remark || null,
          }),
      feasibilityClosedAt: currentItem?.feasibilityClosedAt || closedStamp,
      feasibilityClosedBy: closedBy,
      status: updatedStatus,
    };

    try {
      if (currentItem && getRequestTrackType(currentItem) === "feasibility_check") {
        await updateFeasibilityRequestApi(requestId, payload as any);
      } else {
        await updateSampleRequestApi(requestId, payload as any);
      }
    } catch {
      showToast("Could not save the feasibility decision to the backend.");
      return;
    }

    setRequests((prev) =>
      prev.map((r) =>
        String(r.id) === String(requestId)
          ? {
              ...r,
              ...payload,
              status: updatedStatus,
            }
          : r
      )
    );

    if (selectedRequest && String(selectedRequest.id) === String(requestId)) {
      setSelectedRequest((prev) =>
        prev
          ? {
              ...prev,
              ...payload,
              status: updatedStatus,
            }
          : null
      );
    }

    showToast(
      isFirst
        ? `⚡ Technical evaluation (${team === "sampling" ? "SAMP Lab" : "Plant"}) recorded: ${response}`
        : `Feasibility decision recorded: ${response} by ${team.toUpperCase()}`
    );
  };

  // Marketing Final Feasibility Sign-off / Closure
  const handleMarketingApproveFeasibility = async (
    requestId: string | number,
    approved: boolean,
    remark?: string
  ) => {
    const newStatus = approved ? "Completed" : "Closed (Rejected)";
    const decision = approved ? "Accepted" : "Rejected";
    const nowIso = new Date().toISOString();
    const payload: Partial<SampleRequestItem> = {
      status: newStatus,
      marketingDecision: decision,
      marketingDecisionBy: user?.name || user?.userid || "Marketing Specialist",
      marketingDecisionAt: nowIso,
      marketingDecisionRemark: remark || null,
    };

    setRequests((prev) =>
      prev.map((r) =>
        String(r.id) === String(requestId)
          ? {
              ...r,
              ...payload,
            }
          : r
      )
    );

    if (selectedRequest && String(selectedRequest.id) === String(requestId)) {
      setSelectedRequest((prev) =>
        prev
          ? {
              ...prev,
              ...payload,
            }
          : null
      );
    }

    try {
      await loadRequests();
    } catch (err) {
      console.error("Failed to reload requests after marketing approval:", err);
    }

    showToast(
      approved
        ? `✓ Feasibility request approved and completed by Marketing.`
        : `Feasibility request closed (rejected) by Marketing.`
    );
  };

  // Delete Request from Database (Testing feature for Marketing)
  const handleDeleteRequest = async (req: SampleRequestItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!window.confirm(`Permanently delete request ${req.srNumber} (${req.customer}) from database and reset sample codes? (Testing mode)`)) return;

    try {
      const ok = await deleteAnyRequestApi(req);
      if (ok) {
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(req.id);
          return next;
        });
        if (selectedRequest?.id === req.id) {
          setIsInspectorOpen(false);
          setSelectedRequest(null);
        }
        // Immediately reload from database to reflect resequenced sample codes
        await loadRequests();
        showToast(`✓ Request ${req.srNumber} deleted and sample codes reset.`);
      } else {
        showToast(`Failed to delete request ${req.srNumber} from database.`);
      }
    } catch (err) {
      console.error("Failed to delete request:", err);
      showToast(`Error deleting request ${req.srNumber}.`);
    }
  };

  // Batch Delete Selected Requests from Database (Testing feature for Marketing)
  const handleBatchDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    const selectedList = requests.filter((r) => selectedIds.has(r.id));
    if (
      !window.confirm(
        `Permanently delete ${selectedList.length} selected request(s) from database? (Testing mode)`
      )
    )
      return;

    try {
      await batchDeleteAnyRequestsApi(selectedList);
      setSelectedIds(new Set());
      if (selectedRequest && selectedIds.has(selectedRequest.id)) {
        setIsInspectorOpen(false);
        setSelectedRequest(null);
      }
      // Immediately reload from database to reflect resequenced sample codes
      await loadRequests();
      showToast(`✓ ${selectedList.length} request(s) deleted and sample codes reset.`);
    } catch (err) {
      console.error("Failed to batch delete requests:", err);
      showToast("Error deleting selected requests from database.");
    }
  };

  // Release Marketing Request from Draft into Active Workflow
  const handleReleaseDraft = async (requestItem: SampleRequestItem) => {
    if (getRequestTrackType(requestItem) !== "marketing_request") {
      showToast("Only Marketing draft requests can be released to workflow.");
      return;
    }

    const isDesign =
      (requestItem.requestTypes || []).includes("design") ||
      String(requestItem.materialCode || "").startsWith("DSG-") ||
      String(requestItem.srNumber || "").includes("-DSG-");

    const newStatus = isDesign ? "Creative" : "Sampling Review (PMT)";

    try {
      const updated = await updateSampleRequestApi(requestItem.id, {
        status: newStatus,
      });

      if (!updated) {
        showToast("Failed to release request from draft.");
        return;
      }

      setRequests((prev) =>
        prev.map((r) =>
          String(r.id) === String(requestItem.id)
            ? { ...r, status: newStatus }
            : r
        )
      );

      if (selectedRequest && String(selectedRequest.id) === String(requestItem.id)) {
        setSelectedRequest((prev) => (prev ? { ...prev, status: newStatus } : null));
      }

      showToast(`✓ Request ${requestItem.srNumber} released from Draft into ${newStatus}!`);
    } catch (err) {
      console.error("Failed to release draft request:", err);
      showToast("Error releasing request from draft.");
    }
  };

  // Batch Release Selected Draft Requests
  const handleBatchReleaseDraft = async () => {
    const draftItems = requests.filter(
      (r) =>
        selectedIds.has(r.id) &&
        getRequestTrackType(r) === "marketing_request" &&
        getStageIdForRequest(r) === "draft"
    );

    if (draftItems.length === 0) return;

    try {
      for (const item of draftItems) {
        const isDesign =
          (item.requestTypes || []).includes("design") ||
          String(item.materialCode || "").startsWith("DSG-") ||
          String(item.srNumber || "").includes("-DSG-");
        const newStatus = isDesign ? "Creative" : "Sampling Review (PMT)";
        await updateSampleRequestApi(item.id, { status: newStatus });
      }

      await loadRequests();
      showToast(`✓ Released ${draftItems.length} request(s) from Draft to active workflow.`);
    } catch (err) {
      console.error("Failed to batch release draft requests:", err);
      showToast("Error releasing selected requests from draft.");
    }
  };


  // Create Request Handler
  const handleCreateRequest = async (newForm: Partial<SampleRequestItem>) => {
    if (newForm.creationMode === "feasibility_check") {
      try {
        const created = await createFeasibilityRequestApi({
          customer: newForm.customer || "",
          feasibilityType: newForm.feasibilityType || "new_category",
          customFeasibilityType: newForm.customFeasibilityType,
          descriptionNotes: newForm.feasibilityDescription || newForm.productDescription || "",
          requiredDate: newForm.sampleRequiredDate || "",
          marketingRemarks: newForm.marketingRemarks,
          referenceImages: newForm.referenceImages || [],
          referenceLinks: newForm.referenceLinks || [],
          createdBy: newForm.createdBy,
        });
        setRequests((prev) => [mapFeasibilityRequestToSampleRequest(created), ...prev]);
        showToast(`Feasibility ${created.requestCode} registered with ${created.srNumber}.`);
      } catch (err) {
        console.error("Error creating feasibility request:", err);
        showToast(err instanceof Error ? err.message : "The feasibility request could not be saved.");
      }
      return;
    }

    const yr = new Date().getFullYear() % 100;
    const nextIndex = requests.length + 1;
    const nextSrNum = `SR-${yr}-${String(nextIndex).padStart(3, "0")}`;
    const payload: any = {
      ...newForm,
      srNumber: nextSrNum,
      sr_number: nextSrNum,
      createdAt: new Date().toISOString(),
    };

    try {
      const created = await createSampleRequestApi(payload);
      if (created) {
        setRequests((prev) => [created, ...prev]);
      } else {
        showToast("The sample request could not be saved to the backend.");
        return;
      }
      showToast(`Sample Request ${nextSrNum} registered successfully!`);
    } catch (err) {
      console.error("Error creating request:", err);
      showToast("The sample request could not be saved to the backend.");
    }
  };

  const handleMaterialsUpdated = (requestId: string | number, updatedMaterials: ProgramMaterialItem[]) => {
    setRequests((prev) =>
      prev.map((req) => {
        if (req.id === requestId || String(req.id) === String(requestId)) {
          return {
            ...req,
            programMaterials: updatedMaterials,
          };
        }
        return req;
      })
    );
    setSelectedRequest((prev) => {
      if (!prev) return null;
      if (prev.id === requestId || String(prev.id) === String(requestId)) {
        return {
          ...prev,
          programMaterials: updatedMaterials,
        };
      }
      return prev;
    });
  };

  // Export CSV
  const handleExportCSV = () => {
    if (filteredRequests.length === 0) return;
    const headers = [
      "Sample Code",
      "Material Code",
      "Product Description",
      "Customer",
      "Plant / Queue",
      "Request Date",
      "Required Date",
      "Status",
      "Feasibility (Plant)",
      "Feasibility (SAMP)",
    ];
    const rows = filteredRequests.map((r) => [
      `"${r.srNumber}"`,
      `"${r.materialCode}"`,
      `"${(r.productDescription || "").replace(/"/g, '""')}"`,
      `"${(r.customer || "").replace(/"/g, '""')}"`,
      `"${r.targetPlant || ""}"`,
      `"${r.dateRequestCreated || ""}"`,
      `"${r.sampleRequiredDate || ""}"`,
      `"${r.status || ""}"`,
      `"${r.plantFeasibilityResponse || "Pending"}"`,
      `"${r.samplingFeasibilityResponse || "Pending"}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `sample_requests_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported ${filteredRequests.length} records to CSV`);
  };

  // Table Column Definitions — Common across all views + specialized per track
  const columns: ColumnDef<SampleRequestItem>[] = useMemo(() => {
    // 1. Common: Sample Code
    const colCode: ColumnDef<SampleRequestItem> = {
      id: "srNumber",
      header: "Sample Code",
      sortable: true,
      width: "min-w-[150px] w-[160px]",
      cell: (row) => (
        <div>
          <div className="flex items-center gap-1.5 font-mono">
            <span className="font-bold text-zinc-950 dark:text-zinc-50 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
              {row.srNumber}
            </span>
            <button
              type="button"
              onClick={(e) => handleCopyCode(row.srNumber, e)}
              className="p-0.5 rounded text-zinc-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors cursor-pointer"
              title="Copy code"
            >
              {copiedId === row.srNumber ? (
                <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400 stroke-[3]" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </button>
          </div>
          {row.materialCode && (
            <div className="text-[10px] text-zinc-400 font-mono tracking-tight truncate max-w-[130px]">
              {row.materialCode}
            </div>
          )}
        </div>
      ),
    };

    // 2. Common: Request Type (Differentiate between Marketing, Feasibility, Program Planning)
    const colRequestType: ColumnDef<SampleRequestItem> = {
      id: "requestType",
      header: "Request Type",
      sortable: true,
      width: "min-w-[140px] w-[150px]",
      cell: (row) => {
        const type = getRequestTrackType(row);
        if (type === "feasibility_check") {
          return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-amber-50 text-amber-800 border border-amber-200/90 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60 whitespace-nowrap shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
              Feasibility
            </span>
          );
        }
        if (type === "program_planning") {
          return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-purple-50 text-purple-800 border border-purple-200/90 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/60 whitespace-nowrap shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0" />
              Program Planning
            </span>
          );
        }
        // marketing_request
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-blue-50 text-blue-800 border border-blue-200/90 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60 whitespace-nowrap shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
            Sampling Request
          </span>
        );
      },
    };

    // 3. Common: Customer Name
    const colCustomer: ColumnDef<SampleRequestItem> = {
      id: "customer",
      header: "Customer Name",
      sortable: true,
      width: "min-w-[160px] w-[180px]",
      cell: (row) => (
        <div
          className="font-medium text-zinc-900 dark:text-zinc-100 truncate max-w-[180px]"
          title={row.customer}
        >
          {row.customer || "—"}
        </div>
      ),
    };

    // 4. Common: Product Description
    const colProductDescription: ColumnDef<SampleRequestItem> = {
      id: "productDescription",
      header: "Product Description",
      sortable: true,
      width: "min-w-[240px]",
      cell: (row) => (
        <div>
          <div
            className="font-medium text-zinc-900 dark:text-zinc-100 truncate max-w-[320px]"
            title={row.productDescription || undefined}
          >
            {row.productDescription || "—"}
          </div>
          {row.brandName && (
            <div className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate max-w-[240px]">
              Brand: {row.brandName}
            </div>
          )}
        </div>
      ),
    };

    // 5a. Common: Request Date (Date Request Created in SAMP ECO DB)
    const colRequestDate: ColumnDef<SampleRequestItem> = {
      id: "dateRequestCreated",
      header: "Request Date",
      sortable: true,
      width: "min-w-[110px] w-[120px]",
      cell: (row) => {
        const d = row.dateRequestCreated || (row.createdAt ? row.createdAt.split("T")[0] : "");
        return d ? (
          <span className="font-mono font-medium text-[12px] text-zinc-700 dark:text-zinc-300 tabular-nums">
            {d.includes("T") ? d.split("T")[0] : d}
          </span>
        ) : (
          <span className="text-zinc-400 font-sans text-[11px]">—</span>
        );
      },
    };

    // 5b. Common: Required Date (Only when explicitly specified, e.g. for new requests)
    const colRequiredDate: ColumnDef<SampleRequestItem> = {
      id: "sampleRequiredDate",
      header: "Required Date",
      sortable: true,
      width: "min-w-[110px] w-[120px]",
      cell: (row) => {
        const d = row.sampleRequiredDate;
        return d ? (
          <span className="font-mono font-medium text-[12px] text-zinc-700 dark:text-zinc-300 tabular-nums">
            {d.includes("T") ? d.split("T")[0] : d}
          </span>
        ) : (
          <span className="text-zinc-400 font-sans text-[11px]">—</span>
        );
      },
    };

    // 6. Common: Status
    const colStatus: ColumnDef<SampleRequestItem> = {
      id: "status",
      header: "Status",
      sortable: true,
      width: "min-w-[130px] w-[140px]",
      cell: (row) => <StatusPill status={row.status} size="xs" />,
    };

    // 7. Common: Plant / Queue
    const colPlant: ColumnDef<SampleRequestItem> = {
      id: "targetPlant",
      header: "Plant / Queue",
      sortable: true,
      width: "min-w-[110px] w-[120px]",
      cell: (row) => {
        const isDesignOnly =
          (row.requestTypes?.length === 1 && row.requestTypes[0] === "design") ||
          row.materialCode?.startsWith("DSG-") ||
          row.srNumber?.includes("-DSG-") ||
          row.requestKind === "design";
        if (isDesignOnly) {
          return (
            <span className="font-sans text-[12px] font-medium text-purple-700 dark:text-purple-300">
              Creative Studio
            </span>
          );
        }
        return (
          <span className="font-sans text-[12px] font-medium text-zinc-700 dark:text-zinc-300">
            {getRequestTrackType(row) === "feasibility_check"
              ? "SAMP Team"
              : (row.targetPlant?.replace(/^\d{4}-?\s*/, "").trim() || "Khaniwade")}
          </span>
        );
      },
    };

    // 8. Common: Actions
    const colActions: ColumnDef<SampleRequestItem> = {
      id: "actions",
      header: "",
      sticky: "right",
      align: "right",
      width: "w-[120px]",
      cell: (row) => {
        const isDraft = getStageIdForRequest(row) === "draft";
        return (
          <div
            className="flex items-center justify-end gap-1.5"
            onClick={(e) => e.stopPropagation()}
          >
            {isDraft && (
              <button
                type="button"
                onClick={() => handleReleaseDraft(row)}
                className="inline-flex items-center gap-1 px-2 py-1 rounded bg-brand-50 hover:bg-brand-100 text-brand-700 dark:bg-brand-950/60 dark:hover:bg-brand-900/80 dark:text-brand-300 border border-brand-200 dark:border-brand-800 text-[11px] font-semibold transition-all cursor-pointer shadow-2xs mr-0.5"
                title="Release this request from Draft to active workflow"
              >
                <Send className="w-3 h-3" />
                <span>Release</span>
              </button>
            )}
            <button
              type="button"
              onClick={(e) => handleDeleteRequest(row, e)}
              className="h-7.5 w-7.5 rounded-md flex items-center justify-center text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
              title="Delete request from database"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      },
    };

    // Specialized: Feasibility Code
    const colFeasibilityCode: ColumnDef<SampleRequestItem> = {
      id: "srNumber",
      header: "Feasibility Code",
      sortable: true,
      width: "min-w-[150px] w-[160px]",
      cell: (row) => (
        <div>
          <div className="flex items-center gap-1.5 font-mono">
            <span className="font-bold text-zinc-950 dark:text-zinc-50 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
              {row.srNumber}
            </span>
            <button
              type="button"
              onClick={(e) => handleCopyCode(row.srNumber, e)}
              className="p-0.5 rounded text-zinc-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors cursor-pointer"
              title="Copy code"
            >
              {copiedId === row.srNumber ? (
                <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400 stroke-[3]" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </button>
          </div>
          {row.materialCode && (
            <div className="text-[10px] text-zinc-400 font-mono tracking-tight truncate max-w-[130px]">
              {row.materialCode}
            </div>
          )}
        </div>
      ),
    };

    // Specialized: Feasibility Type
    const colFeasibilityType: ColumnDef<SampleRequestItem> = {
      id: "feasibilityType",
      header: "Feasibility Type",
      sortable: true,
      width: "min-w-[150px] w-[160px]",
      cell: (row) => {
        let label = row.customFeasibilityType;
        if (!label) {
          const ft = row.feasibilityType;
          const typeMap: Record<string, string> = {
            new_category: "New Category",
            new_format: "New Format",
            new_finish: "New Finish",
            new_accessories: "New Accessories",
            other: "Other Custom",
          };
          if (ft && typeMap[ft]) label = typeMap[ft];
          else if (ft) label = ft.replace(/_/g, " ");
          else {
            const desc = (row.productDescription || "").toLowerCase();
            if (desc.startsWith("new_category") || desc.includes("[new category]")) label = "New Category";
            else if (desc.startsWith("new_format") || desc.includes("[new format]")) label = "New Format";
            else if (desc.startsWith("new_finish") || desc.includes("[new finish]")) label = "New Finish";
            else if (desc.startsWith("new_accessories") || desc.includes("[new accessories]")) label = "New Accessories";
            else if (desc.startsWith("other") || desc.includes("[other custom]")) label = "Other Custom";
            else label = "Custom Evaluation";
          }
        }
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-amber-50 text-amber-900 border border-amber-200/80 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800/50">
            {label}
          </span>
        );
      },
    };

    // Specialized: Feasibility Description & Technical Scope
    const colFeasibilityDescription: ColumnDef<SampleRequestItem> = {
      id: "feasibilityDescription",
      header: "Description & Technical Notes",
      sortable: true,
      width: "min-w-[280px]",
      cell: (row) => {
        let cleanText = row.productDescription || "";
        cleanText = cleanText.replace(/^\[.*?\]\s*/, "");
        cleanText = cleanText.split(/Attached Images:|Reference Web Links:|Marketing Remarks:/i)[0].trim();

        const imgCount = row.referenceImages?.length || 0;
        const linkCount = row.referenceLinks?.length || 0;

        return (
          <div className="space-y-1">
            <div
              className="font-medium text-zinc-900 dark:text-zinc-100 truncate max-w-[340px]"
              title={cleanText || row.productDescription || undefined}
            >
              {cleanText || row.productDescription || "—"}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {row.marketingRemarks && (
                <span
                  className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate max-w-[220px] italic"
                  title={`Marketing Remark: ${row.marketingRemarks}`}
                >
                  "{row.marketingRemarks}"
                </span>
              )}
              {imgCount > 0 && (
                <span className="inline-flex items-center gap-1 text-[9px] font-mono font-semibold px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                  <ImageIcon className="w-2.5 h-2.5" />
                  {imgCount} {imgCount === 1 ? "photo" : "photos"}
                </span>
              )}
              {linkCount > 0 && (
                <span className="inline-flex items-center gap-1 text-[9px] font-mono font-semibold px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                  <ExternalLink className="w-2.5 h-2.5" />
                  {linkCount} {linkCount === 1 ? "link" : "links"}
                </span>
              )}
            </div>
          </div>
        );
      },
    };

    // Specialized: Feasibility Target Date & SLA Countdown
    const colFeasibilityDeadline: ColumnDef<SampleRequestItem> = {
      id: "sampleRequiredDate",
      header: "Required Date & SLA",
      sortable: true,
      width: "min-w-[155px] w-[170px]",
      cell: (row) => {
        if (!row.sampleRequiredDate) {
          return <span className="text-zinc-400 font-sans text-[11px]">—</span>;
        }

        const isResponded = Boolean(row.samplingFeasibilityResponse);
        const countdown = getSlaCountdown(row.sampleRequiredDate);

        return (
          <div className="space-y-0.5">
            <div className="font-mono font-medium text-[12px] text-zinc-800 dark:text-zinc-200 tabular-nums">
              {row.sampleRequiredDate}
            </div>
            {!isResponded && countdown && (
              <div>
                <span
                  className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-mono font-bold ${
                    countdown.status === "overdue"
                      ? "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/60"
                      : countdown.status === "today"
                      ? "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/60"
                      : "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/60"
                  }`}
                >
                  <Clock className="w-2.5 h-2.5" />
                  {countdown.text}
                </span>
              </div>
            )}
          </div>
        );
      },
    };

    // Specialized: Feasibility Raised By & At
    const colRaisedBy: ColumnDef<SampleRequestItem> = {
      id: "createdBy",
      header: "Raised By & At",
      sortable: true,
      width: "min-w-[140px] w-[150px]",
      cell: (row) => (
        <div className="space-y-0.5">
          <div className="text-xs font-medium text-zinc-900 dark:text-zinc-100 truncate max-w-[130px]">
            {row.createdBy || "Marketing"}
          </div>
          <div className="text-[10px] font-mono text-zinc-400 truncate">
            {row.createdAt ? new Date(row.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : row.dateRequestCreated || "—"}
          </div>
        </div>
      ),
    };

    // Specialized: Feasibility SAMP Team Verdict
    const colSAMPVerdict: ColumnDef<SampleRequestItem> = {
      id: "samplingFeasibilityResponse",
      header: "SAMP Verdict",
      sortable: true,
      width: "min-w-[165px] w-[180px]",
      cell: (row) => {
        const resp = row.samplingFeasibilityResponse;
        if (!resp) {
          return (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-amber-50 text-amber-800 border border-amber-200/90 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60 animate-pulse whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
              Pending Review
            </span>
          );
        }

        const remark = row.samplingFeasibilityRemark;

        if (resp === "Yes") {
          return (
            <div className="space-y-0.5">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/90 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Feasible (Yes)
              </span>
              {remark && (
                <div className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate max-w-[160px]" title={remark}>
                  {remark}
                </div>
              )}
            </div>
          );
        }

        if (resp === "No") {
          return (
            <div className="space-y-0.5">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-rose-50 text-rose-800 border border-rose-200/90 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60">
                <XCircle className="w-3 h-3 text-rose-600" />
                Not Feasible (No)
              </span>
              {remark && (
                <div className="text-[10px] text-rose-600/80 dark:text-rose-400/80 truncate max-w-[160px]" title={remark}>
                  {remark}
                </div>
              )}
            </div>
          );
        }

        // Maybe
        return (
          <div className="space-y-0.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200/90 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60">
              <AlertTriangle className="w-3 h-3 text-amber-600" />
              Conditional (Maybe)
            </span>
            {remark && (
              <div className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate max-w-[160px]" title={remark}>
                {remark}
              </div>
            )}
          </div>
        );
      },
    };

    // Specialized: Feasibility SLA Performance
    const colSLAPerformance: ColumnDef<SampleRequestItem> = {
      id: "isRespondedOnTime",
      header: "SLA Perf.",
      sortable: true,
      width: "min-w-[110px] w-[120px]",
      cell: (row) => {
        if (!row.samplingFeasibilityResponse) {
          return <span className="text-[11px] font-mono text-zinc-400">—</span>;
        }

        const onTime = row.isRespondedOnTime !== false;
        return (
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
              onTime
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200/90 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60"
                : "bg-rose-50 text-rose-800 border border-rose-200/90 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60"
            }`}
          >
            {onTime ? "On-Time" : "Delayed"}
          </span>
        );
      },
    };

    // Specialized: Feasibility Marketing Commercial Decision
    const colMarketingDecision: ColumnDef<SampleRequestItem> = {
      id: "marketingDecision",
      header: "Commercial Decision",
      sortable: true,
      width: "min-w-[160px] w-[170px]",
      cell: (row) => {
        if (!row.samplingFeasibilityResponse) {
          return (
            <span className="text-[11px] font-mono text-zinc-400 dark:text-zinc-500">
              Awaiting Lab
            </span>
          );
        }

        if (row.marketingDecision === "Accepted") {
          return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/90 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              Accepted
            </span>
          );
        }

        if (row.marketingDecision === "Rejected") {
          return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-zinc-100 text-zinc-700 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700">
              <XCircle className="w-3 h-3 text-zinc-500" />
              Dropped
            </span>
          );
        }

        // Lab responded, but marketing hasn't taken action yet
        return (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleSelectRow(row);
            }}
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-blue-50 text-blue-800 border border-blue-300 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-700/80 animate-pulse hover:bg-blue-100 transition-colors cursor-pointer shadow-2xs"
            title="Click to inspect and record Marketing Decision"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
            Action Needed
          </button>
        );
      },
    };

    // Specialized: Program / Season
    const colProgramSeason: ColumnDef<SampleRequestItem> = {
      id: "programName",
      header: "Program / Season",
      sortable: true,
      width: "min-w-[170px] w-[190px]",
      cell: (row) => (
        <div>
          <div className="font-semibold text-zinc-900 dark:text-zinc-100 truncate max-w-[180px]" title={row.programName || undefined}>
            {row.programName || "Annual Program"}
          </div>
          {row.programCampaignTitle && (
            <div className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate max-w-[180px]">
              {row.programCampaignTitle}
            </div>
          )}
        </div>
      ),
    };

    // Specialized: Program Fiscal Year
    const colProgramYear: ColumnDef<SampleRequestItem> = {
      id: "programYear",
      header: "Fiscal Year",
      sortable: true,
      width: "min-w-[105px] w-[115px]",
      cell: (row) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/80 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/60">
          FY {row.programYear || row.year || "2026"}
        </span>
      ),
    };

    // Specialized: Program Materials Matrix Count
    const colMaterialsCount: ColumnDef<SampleRequestItem> = {
      id: "materialsCount",
      header: "Materials",
      sortable: false,
      width: "min-w-[120px] w-[130px]",
      cell: (row) => {
        const count = row.programMaterials?.length || 0;
        if (count === 0) {
          return <span className="text-zinc-400 font-sans text-[11px]">—</span>;
        }
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
            <Layers className="w-3 h-3 text-indigo-500" />
            {count} {count === 1 ? "Item" : "Items"}
          </span>
        );
      },
    };

    // Specialized: Marketing Brand
    const colBrand: ColumnDef<SampleRequestItem> = {
      id: "brandName",
      header: "Brand",
      sortable: true,
      width: "min-w-[120px] w-[130px]",
      cell: (row) => (
        <span className="text-[12px] font-medium text-zinc-800 dark:text-zinc-200 truncate block max-w-[120px]">
          {row.brandName || "—"}
        </span>
      ),
    };

    // Specialized: Marketing Product Type / Classification
    const colProductType: ColumnDef<SampleRequestItem> = {
      id: "productType",
      header: "Product Type",
      sortable: true,
      width: "min-w-[140px] w-[150px]",
      cell: (row) => {
        const pt = row.productType || row.productTypeNavneet || row.productTypeNewCustomer;
        return (
          <span className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300 truncate block max-w-[140px]">
            {pt || "—"}
          </span>
        );
      },
    };

    // Specialized: Marketing Scope of Work
    const colScopeOfWork: ColumnDef<SampleRequestItem> = {
      id: "scopeOfWork",
      header: "Scope of Work",
      width: "min-w-[150px] w-[160px]",
      cell: (row) => {
        const activeScopes = row.requestTypes || [];
        if (activeScopes.length === 0) {
          return <span className="text-[11px] text-zinc-400 font-sans">Full Prototype</span>;
        }
        return (
          <div className="flex items-center gap-1">
            {activeScopes.includes("design") && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/60" title="Artwork & Creative Design">
                DES
              </span>
            )}
            {activeScopes.includes("mockup") && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60" title="CAD & Mockup">
                MCK
              </span>
            )}
            {activeScopes.includes("sample") && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60" title="SAMP Physical Sampling">
                SMP
              </span>
            )}
            {activeScopes.includes("costing") && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60" title="Costing & Estimation">
                CST
              </span>
            )}
          </div>
        );
      },
    };

    // Specialized: Marketing Designs Count
    const colDesignsCount: ColumnDef<SampleRequestItem> = {
      id: "numberOfDesigns",
      header: "Designs",
      sortable: true,
      align: "center",
      width: "w-[75px]",
      cell: (row) => {
        const count = row.numberOfDesigns || row.productArtworkNos || (row as any)?.designsCustomerCreative;
        if (!count) return <span className="text-zinc-400 font-sans text-[11px]">—</span>;
        return (
          <span className="inline-flex items-center justify-center font-mono font-bold text-[11px] px-1.5 py-0.2 rounded bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/60">
            {count}
          </span>
        );
      },
    };

    // Specialized: Marketing Qty
    const colQty: ColumnDef<SampleRequestItem> = {
      id: "qtyForSampling",
      header: "Qty",
      sortable: true,
      align: "right",
      width: "w-[65px]",
      cell: (row) => {
        if (!row.qtyForSampling) {
          return <span className="text-zinc-400 font-sans text-[11px]">—</span>;
        }
        return (
          <span className="font-sans font-semibold text-[12px] text-zinc-800 dark:text-zinc-200 tabular-nums">
            {row.qtyForSampling}
          </span>
        );
      },
    };

    // --- CASE A: MARKETING REQUEST VIEW ---
    if (selectedType === "marketing_request") {
      return [
        colCode,
        colRequestType,
        colCustomer,
        colBrand,
        colProductDescription,
        colProductType,
        colScopeOfWork,
        colDesignsCount,
        colQty,
        colPlant,
        colRequestDate,
        colRequiredDate,
        colStatus,
        colActions,
      ];
    }

    // --- CASE B: FEASIBILITY CHECK VIEW ---
    if (selectedType === "feasibility_check") {
      return [
        colFeasibilityCode,
        colCustomer,
        colFeasibilityType,
        colFeasibilityDescription,
        colFeasibilityDeadline,
        colRaisedBy,
        colSAMPVerdict,
        colSLAPerformance,
        colMarketingDecision,
        colActions,
      ];
    }

    // --- CASE C: PROGRAM PLANNING VIEW ---
    if (selectedType === "program_planning") {
      return [
        colCode,
        colRequestType,
        colCustomer,
        colProgramSeason,
        colProgramYear,
        colProductDescription,
        colMaterialsCount,
        colPlant,
        colRequestDate,
        colRequiredDate,
        colStatus,
        colActions,
      ];
    }

    // --- CASE D: ALL REQUESTS (OVERVIEW) ---
    return [
      colCode,
      colRequestType,
      colCustomer,
      colProductDescription,
      colPlant,
      colRequestDate,
      colRequiredDate,
      colStatus,
      colActions,
    ];
  }, [selectedType, copiedId, isAdmin]);

  return (
    <div className="flex flex-col flex-1 h-full min-h-0 overflow-hidden select-text bg-white dark:bg-[#0b0c10]">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 right-5 z-[60] flex items-center gap-2.5 px-4 py-2.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-2xl text-[12px] font-semibold border border-zinc-800 dark:border-zinc-200/80 max-w-xs animate-smooth-toast">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
          <span className="truncate">{toastMessage}</span>
        </div>
      )}

      {/* 1. Process Stage Chevron Ribbon */}
      <ProcessStageRibbon
        stages={stageSteps}
        selectedStageId={selectedStageId}
        onSelectStage={(id) => {
          setSelectedStageId(id);
          setCurrentPage(1);
        }}
      />

      {/* 2. High-Density Metric Ribbon */}
      <MetricRibbon metrics={metrics} />

      {/* 3. Operational Command & Filter Toolbar */}
      <div className="px-4 sm:px-6 py-2.5 bg-zinc-50/70 dark:bg-[#0b0c10] border-b border-zinc-200 dark:border-white/[0.08] shrink-0 flex flex-wrap items-center justify-between gap-3 transition-colors duration-150">
        {/* Left: Filters & Search */}
        <div className="flex w-full sm:w-auto items-center flex-wrap gap-2.5">
          {/* Search Input */}
          <div className="relative w-full sm:w-auto">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="global-search-input"
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search SR#, SKU, Customer… (Ctrl+K)"
              className="h-9 w-full sm:w-60 lg:w-72 pl-9 pr-8 rounded-md border border-zinc-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-900/60 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none transition-[border-color,box-shadow,background-color] duration-150 focus:border-brand-500 focus:bg-white dark:focus:bg-zinc-900 focus:ring-2 focus:ring-brand-500/15 font-sans"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 rounded flex items-center justify-center text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 dark:hover:text-zinc-200 dark:hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Request Type Segmented Filter Pills */}
          <div className="inline-flex max-w-full overflow-x-auto no-scrollbar bg-zinc-100 dark:bg-zinc-800/80 p-0.5 rounded-md text-xs border border-zinc-200/60 dark:border-white/[0.05]">
            <button
              type="button"
              onClick={() => {
                setSelectedType("all");
                setCurrentPage(1);
              }}
              className={`h-8 px-3.5 rounded whitespace-nowrap transition-[color,background-color,box-shadow,transform] duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 text-xs font-medium cursor-pointer ${
                selectedType === "all"
                  ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-50 font-semibold shadow-xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              All ({requests.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedType("marketing_request");
                setCurrentPage(1);
              }}
              className={`h-8 px-3.5 rounded whitespace-nowrap transition-[color,background-color,box-shadow,transform] duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 text-xs font-medium cursor-pointer flex items-center gap-1.5 ${
                selectedType === "marketing_request"
                  ? "bg-white dark:bg-zinc-700 text-blue-700 dark:text-blue-300 font-semibold shadow-xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              Sampling Requests ({typeCounts.marketing})
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedType("feasibility_check");
                setCurrentPage(1);
              }}
              className={`h-8 px-3.5 rounded whitespace-nowrap transition-[color,background-color,box-shadow,transform] duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 text-xs font-medium cursor-pointer flex items-center gap-1.5 ${
                selectedType === "feasibility_check"
                  ? "bg-white dark:bg-zinc-700 text-amber-700 dark:text-amber-300 font-semibold shadow-xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              Feasibility ({typeCounts.feasibility})
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedType("program_planning");
                setCurrentPage(1);
              }}
              className={`h-8 px-3.5 rounded whitespace-nowrap transition-[color,background-color,box-shadow,transform] duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 text-xs font-medium cursor-pointer flex items-center gap-1.5 ${
                selectedType === "program_planning"
                  ? "bg-white dark:bg-zinc-700 text-indigo-700 dark:text-indigo-300 font-semibold shadow-xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              Program ({typeCounts.program})
            </button>
          </div>

          {/* Customer Dropdown */}
          <select
            value={selectedCustomer}
            onChange={(e) => {
              setSelectedCustomer(e.target.value);
              setCurrentPage(1);
            }}
            className="h-9 px-3 rounded-md border border-zinc-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-900/60 text-xs text-zinc-700 dark:text-zinc-300 outline-none transition-[border-color,box-shadow,background-color] duration-150 hover:border-zinc-300 dark:hover:border-zinc-600 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15 cursor-pointer max-w-[160px] truncate font-medium"
          >
            <option value="all">All Customers</option>
            {uniqueCustomers.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Right: Operational Actions (Export, New Request) */}
        <div className="flex items-center gap-2 shrink-0 ml-auto">
          <button
            type="button"
            onClick={handleExportCSV}
            className="h-9 px-4 rounded-md border border-zinc-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 text-xs font-semibold flex items-center gap-1.5 transition-[color,background-color,border-color,transform] duration-150 cursor-pointer shadow-2xs"
            title="Download CSV export"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>

          <button
            type="button"
            onClick={() => setIsNewModalOpen(true)}
            className="h-9 px-4 rounded-md bg-brand-600 hover:bg-brand-700 active:bg-brand-800 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#0b0c10] text-white text-xs font-semibold flex items-center gap-1.5 transition-[background-color,transform,box-shadow] duration-150 cursor-pointer shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>New Request</span>
          </button>
        </div>
      </div>

      {/* 4. Attention Required: Marketing Commercial Decisions on SAMP Evaluated Feasibilities */}
      {pendingMarketingDecisions.length > 0 && (
        <div className="mx-4 sm:mx-6 mt-2.5 px-4 py-2.5 rounded-lg bg-blue-50/90 dark:bg-blue-950/40 border border-blue-200/90 dark:border-blue-800/80 flex flex-wrap items-center justify-between gap-3 shadow-2xs shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-md bg-blue-600 text-white flex items-center justify-center shrink-0">
              <AlertCircle className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-blue-950 dark:text-blue-100 flex items-center gap-2">
                <span>Attention Required: SAMP Lab Evaluated Feasibility</span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-blue-200/80 text-blue-900 dark:bg-blue-900 dark:text-blue-200">
                  {pendingMarketingDecisions.length} {pendingMarketingDecisions.length === 1 ? "Request" : "Requests"}
                </span>
              </div>
              <p className="text-[11px] text-blue-800 dark:text-blue-300/90 truncate mt-0.5">
                Central Sampling Lab has completed technical evaluation. Marketing commercial decision (Accept / Drop) is pending.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setSelectedType("feasibility_check");
              setCurrentPage(1);
            }}
            className="px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold shrink-0 cursor-pointer shadow-2xs transition-colors flex items-center gap-1.5 font-mono"
          >
            <span>Review Now</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 5. Enterprise Data Table */}
      <DataTable
        data={paginatedRequests}
        columns={columns}
        keyExtractor={(row) => row.id}
        isLoading={isLoading}
        onRowClick={handleSelectRow}
        selectedRowId={selectedRequest?.id}
        enableSelection={true}
        selectedIds={selectedIds}
        onToggleSelectRow={handleToggleSelectRow}
        onToggleSelectAll={handleToggleSelectAll}
        sortField={sortField}
        sortDirection={sortDirection}
        onSortChange={(field) => {
          if (sortField === field) {
            setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
          } else {
            setSortField(field);
            setSortDirection("asc");
          }
        }}
        currentPage={currentPage}
        pageSize={pageSize}
        totalCount={filteredRequests.length}
        onPageChange={setCurrentPage}
        toolbarLeft={
          <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
            <span>
              Showing <span className="font-semibold text-zinc-900 dark:text-zinc-100 font-mono">{paginatedRequests.length}</span> of{" "}
              <span className="font-semibold text-zinc-900 dark:text-zinc-100 font-mono">{filteredRequests.length}</span> requests
            </span>
            {selectedType !== "all" && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 capitalize">
                Filtered: {selectedType === "marketing_request" ? "Sampling Requests" : selectedType.replace("_", " ")}
              </span>
            )}
            {selectedIds.size > 0 && (
              <div className="flex items-center gap-2 pl-2 border-l border-zinc-200 dark:border-zinc-800">
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                  {selectedIds.size} selected
                </span>
                {requests.filter((r) => selectedIds.has(r.id) && getStageIdForRequest(r) === "draft").length > 0 && (
                  <button
                    type="button"
                    onClick={handleBatchReleaseDraft}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-brand-50 hover:bg-brand-100 dark:bg-brand-950 dark:hover:bg-brand-900 text-brand-700 dark:text-brand-300 text-[10px] font-semibold border border-brand-200 dark:border-brand-800 cursor-pointer transition-all"
                    title="Release selected draft requests into active workflow"
                  >
                    <Send className="w-3 h-3" />
                    <span>
                      Release Draft ({requests.filter((r) => selectedIds.has(r.id) && getStageIdForRequest(r) === "draft").length})
                    </span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleBatchDeleteSelected}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 text-[10px] font-semibold border border-rose-200 dark:border-rose-800 cursor-pointer transition-all"
                  title="Permanently delete selected requests from database (testing mode)"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Delete Selected (Testing)</span>
                </button>
              </div>
            )}
          </div>
        }
      />

      {/* 6. Master-Detail Inspector Drawer */}
      <SampleRequestInspector
        request={selectedRequest}
        isOpen={isInspectorOpen}
        onClose={() => setIsInspectorOpen(false)}
        onUpdateFeasibility={handleUpdateFeasibility}
        onMarketingApprove={handleMarketingApproveFeasibility}
        onMaterialsUpdated={handleMaterialsUpdated}
        onDeleteRequest={(req) => handleDeleteRequest(req)}
        onReleaseDraft={handleReleaseDraft}
        isAdmin={isAdmin}
      />

      {/* 7. New Sample Request Modal */}
      <NewSampleRequestModal
        isOpen={isNewModalOpen}
        onClose={() => {
          setIsNewModalOpen(false);
          setModalInitialTrack("gateway");
        }}
        onSubmit={handleCreateRequest}
        initialTrack={modalInitialTrack}
        requestCreatedBy={user?.name || user?.userid}
      />
    </div>
  );
};

export default SampleRequestsDesk;
