import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { UserProfile } from "@/features/auth";
import { SampleRequestItem } from "./types";
import {
  fetchSampleRequestsApi,
  fetchDesignRequestsApi,
  mapDesignRequestToSampleRequest,
  createSampleRequestApi,
  updateSampleRequestApi,
  deleteSampleRequestApi,
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
  Clock,
  RefreshCw,
} from "lucide-react";

export interface SampleRequestsDeskProps {
  user?: UserProfile | null;
}

const STAGES: { id: string; stepNumber: string; label: string }[] = [
  { id: "all", stepNumber: "ALL", label: "All Requests" },
  { id: "draft", stepNumber: "01", label: "Intake / Draft" },
  { id: "creative", stepNumber: "02", label: "Artwork & Creative" },
  { id: "studio", stepNumber: "03", label: "CAD & Dieline Studio" },
  { id: "costing", stepNumber: "04", label: "Costing" },
  { id: "samp", stepNumber: "05", label: "SAMP Team Work" },
  { id: "plant", stepNumber: "06", label: "Plant Execution" },
  { id: "dispatched", stepNumber: "07", label: "Dispatched / Closed" },
  { id: "deal", stepNumber: "08", label: "Actual Deal" },
];

export type RequestTrackType = "marketing_request" | "feasibility_check" | "program_planning";

export function getRequestTrackType(r: Partial<SampleRequestItem>): RequestTrackType {
  const mode = String(r.creationMode || (r as any)?.creation_mode || "").toLowerCase();
  const desc = String(r.productDescription || (r as any)?.product_description || "").toLowerCase();
  const mat = String(r.materialCode || (r as any)?.material_code || "").toLowerCase();
  const sr = String(r.srNumber || (r as any)?.sr_number || "").toLowerCase();

  // 1. Feasibility Check
  if (
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

  // 2. Program Planning
  if (
    mode === "program_planning" ||
    mat.startsWith("pg-pl") ||
    sr.startsWith("pg-") ||
    desc.includes("seasonal program:") ||
    desc.includes("material specification matrix:")
  ) {
    return "program_planning";
  }

  // 3. Marketing Request (Standard direct prototype)
  return "marketing_request";
}

export const SampleRequestsDesk: React.FC<SampleRequestsDeskProps> = ({ user }) => {
  const isAdmin =
    String(user?.role || "").toLowerCase() === "admin" ||
    user?.userid === "admin" ||
    user?.role === "Administrator";

  const [requests, setRequests] = useState<SampleRequestItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStageId, setSelectedStageId] = useState<string>("all");
  const [quickFilter, setQuickFilter] = useState<"none" | "pending_feasibility" | "urgent" | "active_workflow">("none");
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
  }, [location.state]);

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
      const [sampleRequests, designRequests] = await Promise.all([
        fetchSampleRequestsApi(),
        fetchDesignRequestsApi(),
      ]);
      const merged = [
        ...sampleRequests,
        ...designRequests.map(mapDesignRequestToSampleRequest),
      ].sort((a, b) => {
        const da = new Date(a.createdAt || a.dateRequestCreated || 0).getTime();
        const db = new Date(b.createdAt || b.dateRequestCreated || 0).getTime();
        return db - da;
      });
      setRequests(merged);
    } catch (err) {
      console.error("Failed to load sample requests:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  // Stage counts for Ribbon
  const stageSteps: StageStep[] = useMemo(() => {
    const counts: Record<string, number> = {
      all: requests.length,
      draft: 0,
      creative: 0,
      studio: 0,
      costing: 0,
      samp: 0,
      plant: 0,
      dispatched: 0,
      deal: 0,
    };

    requests.forEach((r) => {
      const s = (r.status || "").toLowerCase();
      if (s.includes("draft") || s.includes("smt")) counts.draft++;
      else if (s.includes("creative")) counts.creative++;
      else if (s.includes("studio")) counts.studio++;
      else if (s.includes("cost")) counts.costing++;
      else if (s.includes("samp") || s.includes("review") || s.includes("pmt") || s.includes("qc"))
        counts.samp++;
      else if (s.includes("plant") || s.includes("execution")) counts.plant++;
      else if (s.includes("dispatch") || s.includes("close")) counts.dispatched++;
      else if (s.includes("deal") || s.includes("actual")) counts.deal++;
      else counts.draft++;
    });

    return STAGES.map((st) => ({
      ...st,
      count: counts[st.id] || 0,
    }));
  }, [requests]);

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
        if (!r.plantFeasibilityResponse || !r.samplingFeasibilityResponse) {
          pendingFeas++;
        }
      } else if (t === "program_planning") program++;
    });
    return { marketing, feasibility, program, pendingFeas };
  }, [requests]);

  // Metric Ribbon Data: Real Operational Health & Telemetry
  const metrics: MetricTileItem[] = useMemo(() => {
    const closed = requests.filter((r) => {
      const s = (r.status || "").toLowerCase();
      return s.includes("dispatch") || s.includes("deal") || s.includes("close");
    }).length;

    const inWorkflow = requests.filter((r) => {
      const s = (r.status || "").toLowerCase();
      return (
        s.includes("creative") ||
        s.includes("studio") ||
        s.includes("cost") ||
        s.includes("samp") ||
        s.includes("review")
      );
    }).length;

    const plantCount = requests.filter((r) => {
      const s = (r.status || "").toLowerCase();
      return s.includes("plant") || s.includes("execution");
    }).length;

    const now = new Date();
    const threeDaysLater = new Date(now.getTime() + 3 * 86400000);
    const urgentCount = requests.filter((r) => {
      if (!r.sampleRequiredDate) return false;
      const d = new Date(r.sampleRequiredDate);
      const isClosed =
        (r.status || "").toLowerCase().includes("dispatch") ||
        (r.status || "").toLowerCase().includes("deal");
      return d <= threeDaysLater && !isClosed;
    }).length;

    return [
      {
        id: "total",
        label: "Total Requests",
        value: requests.length,
        deltaText: "All Active Pipeline",
        deltaTone: "neutral",
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
        deltaText: "Design & Sampling",
        deltaTone: "neutral",
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
        deltaText: typeCounts.pendingFeas > 0 ? `${typeCounts.pendingFeas} Sign-Offs Needed` : "All Cleared",
        deltaTone: typeCounts.pendingFeas > 0 ? "warning" : "positive",
        isActive: quickFilter === "pending_feasibility",
        onClick: () => {
          setQuickFilter((prev) => (prev === "pending_feasibility" ? "none" : "pending_feasibility"));
          setCurrentPage(1);
        },
      },
      {
        id: "urgent",
        label: "Critical SLA (<72h)",
        value: urgentCount,
        deltaText: urgentCount > 0 ? "Urgent Attention" : "On Schedule",
        deltaTone: urgentCount > 0 ? "critical" : "positive",
        isActive: quickFilter === "urgent",
        onClick: () => {
          setQuickFilter((prev) => (prev === "urgent" ? "none" : "urgent"));
          setCurrentPage(1);
        },
      },
      {
        id: "plant",
        label: "Plant Execution",
        value: plantCount,
        deltaText: plantCount > 0 ? "On Factory Floor" : "Idle Production",
        deltaTone: plantCount > 0 ? "positive" : "neutral",
        isActive: selectedStageId === "plant",
        onClick: () => {
          setSelectedStageId((prev) => (prev === "plant" ? "all" : "plant"));
          setQuickFilter("none");
          setCurrentPage(1);
        },
      },
      {
        id: "closed",
        label: "Dispatched / Deals",
        value: closed,
        deltaText: "Commercial Ready",
        deltaTone: "positive",
        isActive: selectedStageId === "dispatched" || selectedStageId === "deal",
        onClick: () => {
          setQuickFilter("none");
          setSelectedStageId("dispatched");
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
        if (r.plantFeasibilityResponse || r.samplingFeasibilityResponse) return false;
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
      if (quickFilter === "urgent") {
        if (!r.sampleRequiredDate) return false;
        const now = new Date();
        const threeDaysLater = new Date(now.getTime() + 3 * 86400000);
        const d = new Date(r.sampleRequiredDate);
        const isClosed =
          (r.status || "").toLowerCase().includes("dispatch") ||
          (r.status || "").toLowerCase().includes("deal");
        if (d > threeDaysLater || isClosed) return false;
      }

      // Stage Filter
      if (selectedStageId !== "all") {
        const s = (r.status || "").toLowerCase();
        if (selectedStageId === "draft" && !s.includes("draft") && !s.includes("smt")) return false;
        if (selectedStageId === "creative" && !s.includes("creative")) return false;
        if (selectedStageId === "studio" && !s.includes("studio")) return false;
        if (selectedStageId === "costing" && !s.includes("cost") && !s.includes("estimation")) return false;
        if (
          selectedStageId === "samp" &&
          !s.includes("samp") &&
          !s.includes("review") &&
          !s.includes("pmt") &&
          !s.includes("qc")
        )
          return false;
        if (selectedStageId === "plant" && !s.includes("plant") && !s.includes("execution"))
          return false;
        if (selectedStageId === "dispatched" && !s.includes("dispatch") && !s.includes("close"))
          return false;
        if (selectedStageId === "deal" && !s.includes("deal") && !s.includes("actual"))
          return false;
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
    const closedStamp = new Date().toISOString().replace("T", " ").substring(0, 19);
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
      await updateSampleRequestApi(requestId, payload as any);
    } catch {
      // Local fallback
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
    approved: boolean
  ) => {
    const newStatus = approved ? "Completed" : "Closed (Rejected)";
    const payload: Partial<SampleRequestItem> = {
      status: newStatus,
    };

    try {
      await updateSampleRequestApi(requestId, payload as any);
    } catch {
      // Local fallback
    }

    setRequests((prev) =>
      prev.map((r) =>
        String(r.id) === String(requestId)
          ? {
              ...r,
              ...payload,
              status: newStatus,
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
              status: newStatus,
            }
          : null
      );
    }

    showToast(
      approved
        ? `✓ Feasibility request approved and completed by Marketing.`
        : `Feasibility request closed (rejected) by Marketing.`
    );
  };

  // Delete Request
  const handleDeleteRequest = async (req: SampleRequestItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Delete sample request ${req.srNumber}?`)) return;

    try {
      await deleteSampleRequestApi(Number(req.id));
      setRequests((prev) => prev.filter((r) => r.id !== req.id));
      if (selectedRequest?.id === req.id) {
        setIsInspectorOpen(false);
        setSelectedRequest(null);
      }
      showToast(`Request ${req.srNumber} deleted.`);
    } catch (err) {
      console.error("Failed to delete request:", err);
    }
  };

  // Create Request Handler
  const handleCreateRequest = async (newForm: Partial<SampleRequestItem>) => {
    const nextSrNum = `SR-26-${String(Math.floor(100 + Math.random() * 900))}`;
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
        const localItem: SampleRequestItem = {
          id: `local-${Date.now()}`,
          srNumber: nextSrNum,
          productDescription: newForm.productDescription || "Sample Book",
          customer: newForm.customer || "Target Global Sourcing",
          targetPlant: newForm.targetPlant || "1505- Khaniwade",
          dateRequestCreated: new Date().toISOString().split("T")[0],
          createdBy: user?.name || "Admin",
          materialCode: newForm.materialCode || "NB-CB-A5-0900",
          sampleRequiredDate: newForm.sampleRequiredDate || "2026-10-30",
          status: "Draft (Pre-SMT)",
          year: "2026-2027",
          createdAt: new Date().toISOString(),
          qtyForSampling: newForm.qtyForSampling || 6,
          qtyDesignCosting: newForm.qtyDesignCosting || 50000,
          ...newForm,
        };
        setRequests((prev) => [localItem, ...prev]);
      }
      showToast(`Sample Request ${nextSrNum} registered successfully!`);
    } catch (err) {
      console.error("Error creating request:", err);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (filteredRequests.length === 0) return;
    const headers = [
      "Sample Code",
      "Material Code",
      "Product Description",
      "Customer",
      "Plant",
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

  // Table Column Definitions
  const columns: ColumnDef<SampleRequestItem>[] = useMemo(
    () => [
      {
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
                title="Copy sample code"
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
      },
      {
        id: "requestType",
        header: "Type",
        sortable: true,
        width: "min-w-[140px] w-[145px]",
        cell: (row) => {
          const type = getRequestTrackType(row);
          if (type === "feasibility_check") {
            return (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-amber-50 text-amber-800 border border-amber-200/90 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60 whitespace-nowrap">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                Feasibility Check
              </span>
            );
          }
          if (type === "program_planning") {
            return (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-purple-50 text-purple-800 border border-purple-200/90 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/60 whitespace-nowrap">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0" />
                Program Planning
              </span>
            );
          }
          const activeScopes = row.requestTypes || [];
          return (
            <div className="flex flex-col gap-0.5">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-blue-50 text-blue-800 border border-blue-200/90 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60 whitespace-nowrap">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                Marketing Request
              </span>
              {activeScopes.length > 0 && (
                <div className="flex items-center gap-1 pl-1">
                  {activeScopes.includes("design") && (
                    <span className="text-[8px] font-mono font-bold text-purple-600 dark:text-purple-400" title="Design Scope Active">
                      DES
                    </span>
                  )}
                  {activeScopes.includes("mockup") && (
                    <span className="text-[8px] font-mono font-bold text-amber-600 dark:text-amber-400" title="Mockup Scope Active">
                      MCK
                    </span>
                  )}
                  {activeScopes.includes("sample") && (
                    <span className="text-[8px] font-mono font-bold text-blue-600 dark:text-blue-400" title="Sampling Scope Active">
                      SMP
                    </span>
                  )}
                  {activeScopes.includes("costing") && (
                    <span className="text-[8px] font-mono font-bold text-emerald-600 dark:text-emerald-400" title="Costing Scope Active">
                      CST
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        },
      },
      {
        id: "productDescription",
        header: "Product Specification",
        sortable: true,
        width: "min-w-[260px]",
        cell: (row) => (
          <div>
            <div
              className="font-medium text-zinc-900 dark:text-zinc-100 truncate max-w-[340px]"
              title={row.productDescription || undefined}
            >
              {row.productDescription || "—"}
            </div>
            {row.programName && (
              <div className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate max-w-[280px]">
                {row.programName} ({row.programYear || row.year || "2026"})
              </div>
            )}
          </div>
        ),
      },
      {
        id: "customer",
        header: "Customer Account",
        sortable: true,
        width: "min-w-[180px] w-[200px]",
        cell: (row) => (
          <div
            className="font-medium text-zinc-800 dark:text-zinc-200 truncate max-w-[190px]"
            title={row.customer}
          >
            {row.customer || "—"}
          </div>
        ),
      },
      {
        id: "targetPlant",
        header: "Plant",
        sortable: true,
        width: "min-w-[110px] w-[120px]",
        cell: (row) => (
          <span className="font-sans text-[12px] font-medium text-zinc-700 dark:text-zinc-300">
            {row.targetPlant?.replace("1503- ", "")?.replace("1505- ", "")?.replace("1003- ", "") || "Silvasa"}
          </span>
        ),
      },
      {
        id: "sampleRequiredDate",
        header: "Due Date",
        sortable: true,
        width: "min-w-[105px] w-[110px]",
        cell: (row) =>
          row.sampleRequiredDate ? (
            <span className="font-sans font-medium text-[12px] text-zinc-700 dark:text-zinc-300 tabular-nums">
              {row.sampleRequiredDate}
            </span>
          ) : (
            <span className="text-zinc-400 font-sans text-[11px]">—</span>
          ),
      },
      {
        id: "qtyForSampling",
        header: "Qty",
        sortable: true,
        align: "right",
        width: "w-[65px]",
        cell: (row) => (
          <span className="font-sans font-semibold text-[12px] text-zinc-800 dark:text-zinc-200 tabular-nums">
            {row.qtyForSampling || 1}
          </span>
        ),
      },
      {
        id: "feasibility",
        header: "Feasibility Sign-Off",
        width: "w-[170px]",
        cell: (row) => {
          const type = getRequestTrackType(row);
          if (type !== "feasibility_check") {
            return <span className="text-zinc-300 dark:text-zinc-600 font-sans text-xs">—</span>;
          }

          const plantResp = row.plantFeasibilityResponse;
          const sampResp = row.samplingFeasibilityResponse;
          const closedBy = row.feasibilityClosedBy;

          if (!plantResp && !sampResp) {
            return (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-50 text-amber-700 border border-amber-200/90 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60 whitespace-nowrap animate-pulse">
                <Clock className="w-3 h-3 text-amber-500" />
                Awaiting Sign-Off
              </span>
            );
          }

          const firstVerdict = closedBy === "sampling" ? (sampResp || plantResp) : (plantResp || sampResp);
          const getToneClass = (resp?: string | null) => {
            if (resp === "Yes")
              return "text-emerald-700 bg-emerald-50 border-emerald-200/90 dark:text-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-800/60";
            if (resp === "No")
              return "text-rose-700 bg-rose-50 border-rose-200/90 dark:text-rose-300 dark:bg-rose-950/40 dark:border-rose-800/60";
            if (resp === "Maybe")
              return "text-amber-700 bg-amber-50 border-amber-200/90 dark:text-amber-300 dark:bg-amber-950/40 dark:border-amber-800/60";
            return "text-zinc-400 bg-zinc-50 border-zinc-200 dark:text-zinc-500 dark:bg-zinc-850 dark:border-zinc-700/50";
          };

          return (
            <div className="flex flex-col gap-0.5 font-mono">
              <div className="flex items-center gap-1.5">
                <span
                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-bold ${getToneClass(
                    firstVerdict
                  )}`}
                >
                  {firstVerdict === "Yes" ? (
                    <>
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>Feasible</span>
                    </>
                  ) : firstVerdict === "No" ? (
                    <>
                      <XCircle className="w-3 h-3 text-rose-600" />
                      <span>Rejected</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-3 h-3 text-amber-600" />
                      <span>Conditional</span>
                    </>
                  )}
                </span>
                <span className="text-[9px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                  via {closedBy === "sampling" ? "SAMP" : "Plant"}
                </span>
              </div>
              <div className="text-[9px] text-zinc-400 truncate max-w-[160px]">
                {closedBy === "sampling" ? "SAMP Lab responded first" : "Plant responded first"}
              </div>
            </div>
          );
        },
      },
      {
        id: "status",
        header: "Status",
        sortable: true,
        width: "min-w-[140px] w-[150px]",
        cell: (row) => <StatusPill status={row.status} size="xs" />,
      },
      {
        id: "actions",
        header: "",
        sticky: "right",
        align: "right",
        width: "w-[44px]",
        cell: (row) => (
          <div
            className="flex items-center justify-end"
            onClick={(e) => e.stopPropagation()}
          >
            {isAdmin && (
              <button
                type="button"
                onClick={(e) => handleDeleteRequest(row, e)}
                className="h-7.5 w-7.5 rounded-md flex items-center justify-center text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                title="Delete request"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ),
      },
    ],
    [copiedId, isAdmin]
  );

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
      <div className="px-4 sm:px-6 py-2.5 bg-white dark:bg-[#0f1118] border-b border-zinc-200 dark:border-white/[0.08] shrink-0 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Filters & Search */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Search Input */}
          <div className="relative">
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
              className="h-9 w-60 sm:w-72 pl-9 pr-8 rounded-md border border-zinc-200 dark:border-zinc-700/80 bg-zinc-50/60 dark:bg-zinc-900/60 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none focus:border-brand-500 focus:bg-white dark:focus:bg-zinc-900 focus:ring-1 focus:ring-brand-500/20 transition-all font-sans"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Request Type Segmented Filter Pills */}
          <div className="inline-flex bg-zinc-100 dark:bg-zinc-800/80 p-0.5 rounded-md text-xs border border-zinc-200/60 dark:border-white/[0.05]">
            <button
              type="button"
              onClick={() => {
                setSelectedType("all");
                setCurrentPage(1);
              }}
              className={`h-8 px-3.5 rounded transition-colors text-xs font-medium cursor-pointer ${
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
              className={`h-8 px-3.5 rounded transition-colors text-xs font-medium cursor-pointer flex items-center gap-1.5 ${
                selectedType === "marketing_request"
                  ? "bg-white dark:bg-zinc-700 text-blue-700 dark:text-blue-300 font-semibold shadow-xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              Marketing ({typeCounts.marketing})
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedType("feasibility_check");
                setCurrentPage(1);
              }}
              className={`h-8 px-3.5 rounded transition-colors text-xs font-medium cursor-pointer flex items-center gap-1.5 ${
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
              className={`h-8 px-3.5 rounded transition-colors text-xs font-medium cursor-pointer flex items-center gap-1.5 ${
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
            className="h-9 px-3 rounded-md border border-zinc-200 dark:border-zinc-700/80 bg-zinc-50/60 dark:bg-zinc-900/60 text-xs text-zinc-700 dark:text-zinc-300 outline-none focus:border-brand-500 cursor-pointer max-w-[160px] truncate font-medium"
          >
            <option value="all">All Customers</option>
            {uniqueCustomers.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Reset Filters */}
          {(searchTerm ||
            selectedType !== "all" ||
            selectedCustomer !== "all" ||
            selectedStageId !== "all" ||
            quickFilter !== "none") && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                setSelectedType("all");
                setSelectedCustomer("all");
                setSelectedStageId("all");
                setQuickFilter("none");
                setCurrentPage(1);
              }}
              className="h-9 px-3.5 rounded-md border border-zinc-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-900 text-xs text-zinc-600 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-200 dark:hover:border-rose-800/60 flex items-center gap-1.5 cursor-pointer transition-colors font-medium"
            >
              <X className="w-3.5 h-3.5" />
              Reset
            </button>
          )}
        </div>

        {/* Right: Operational Actions (Refresh, Export, New Request) */}
        <div className="flex items-center gap-2 shrink-0 ml-auto">
          <button
            type="button"
            onClick={loadRequests}
            disabled={isLoading}
            className="h-9 px-3.5 rounded-md border border-zinc-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center gap-1.5 text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
            title="Reload pipeline data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="h-9 px-4 rounded-md border border-zinc-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            title="Download CSV export"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>

          <button
            type="button"
            onClick={() => setIsNewModalOpen(true)}
            className="h-9 px-4 rounded-md bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>New Request</span>
          </button>
        </div>
      </div>

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
          <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
            <span>
              Showing <span className="font-semibold text-zinc-900 dark:text-zinc-100 font-mono">{paginatedRequests.length}</span> of{" "}
              <span className="font-semibold text-zinc-900 dark:text-zinc-100 font-mono">{filteredRequests.length}</span> requests
            </span>
            {selectedType !== "all" && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 capitalize">
                Filtered: {selectedType.replace("_", " ")}
              </span>
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
      />
    </div>
  );
};

export default SampleRequestsDesk;
