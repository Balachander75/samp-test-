import React, { useState, useEffect, useMemo, useCallback } from "react";
import { UserProfile } from "@/features/auth";
import { SampleRequestItem } from "@/features/sample-requests/types";
import {
  fetchFeasibilityRequestsApi,
  fetchSampleRequestsApi,
  fetchProgramRequestsApi,
  updateSampleRequestApi,
  updateFeasibilityRequestApi,
  updateSingleMaterialSampRemarkApi,
  recordFeasibilitySampVerdictApi,
  recordFeasibilityViewedApi,
} from "@/features/sample-requests/api";
import { FeasibilityActivityTimeline } from "@/features/sample-requests/components/FeasibilityActivityTimeline";
import { ProcessStageRibbon, StageStep } from "@/components/erp/ProcessStageRibbon";
import { MetricRibbon, MetricTileItem } from "@/components/erp/MetricRibbon";
import { DataTable, ColumnDef } from "@/components/erp/DataTable";
import { StatusPill } from "@/components/ui/StatusPill";
import {
  Search,
  X,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Download,
  Copy,
  Check,
  ShieldCheck,
  Boxes,
  CheckSquare,
  Square,
  ChevronRight,
  ExternalLink,
  Lock,
  Image as ImageIcon,
  Layers,
  FileSpreadsheet,
} from "lucide-react";
import {
  parseFeasibilityDetails,
  parseProgramMatrix,
} from "@/features/sample-requests/components/SampleRequestInspector";

export const formatIndianDateTime = (dateInput?: string | Date | null): string => {
  if (!dateInput) return "N/A";
  try {
    const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return String(dateInput);
    return (
      d.toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }) + " IST"
    );
  } catch {
    return String(dateInput);
  }
};

export interface SamplingTeamDeskProps {
  user?: UserProfile | null;
}

const SAMP_STAGES: { id: string; stepNumber: string; label: string }[] = [
  { id: "all", stepNumber: "ALL", label: "All Lab Tasks" },
  { id: "feasibility", stepNumber: "01", label: "Feasibility Reviews" },
  { id: "material_prep", stepNumber: "02", label: "Material & Board Prep" },
  { id: "prototyping", stepNumber: "03", label: "Machine Prototyping" },
  { id: "finishing", stepNumber: "04", label: "Finishing & Foiling" },
  { id: "qc", stepNumber: "05", label: "QC Inspection" },
];

export const SamplingTeamDesk: React.FC<SamplingTeamDeskProps> = ({ user }) => {
  const [requests, setRequests] = useState<SampleRequestItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStageId, setSelectedStageId] = useState<string>("all");
  const [quickFilter, setQuickFilter] = useState<"none" | "pending_feasibility" | "active_lab" | "urgent" | "ready">("none");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPlant, setSelectedPlant] = useState<string>("all");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Inspector & Sign-Off State
  const [selectedItem, setSelectedItem] = useState<SampleRequestItem | null>(null);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [inspectorTab, setInspectorTab] = useState<"spec" | "feasibility" | "milestones">("spec");
  const [selectedPreviewImage, setSelectedPreviewImage] = useState<string | null>(null);
  
  // Matrix remarks state for Program Planning in SAMP Desk
  const [sampMatrixRemarks, setSampMatrixRemarks] = useState<Record<string | number, string>>({});
  const [savingSampRemarkId, setSavingSampRemarkId] = useState<string | number | null>(null);
  const [savedSampRemarkId, setSavedSampRemarkId] = useState<string | number | null>(null);

  // Feasibility Form
  const [signOffResponse, setSignOffResponse] = useState<"Yes" | "No" | "Maybe">("Yes");
  const [signOffRemark, setSignOffRemark] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Multi-select state
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());

  // Copy SR Number feedback
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const handleCopyCode = (code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedId(code);
    setTimeout(() => setCopiedId(null), 1200);
  };

  // Table pagination & sorting
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;
  const [sortField, setSortField] = useState<string>("sampleRequiredDate");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }, []);

  const loadRequests = useCallback(async () => {
    setIsLoading(true);
    try {
      const [sampleRequests, feasibilityRequests, programRequests] = await Promise.all([
        fetchSampleRequestsApi(),
        fetchFeasibilityRequestsApi(),
        fetchProgramRequestsApi().catch(() => []),
      ]);
      setRequests([...feasibilityRequests, ...programRequests, ...sampleRequests]);
    } catch (err) {
      console.error("Failed to load sampling requests:", err);
      showToast("Failed to fetch sampling work data");
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  useEffect(() => {
    const handleRefresh = (event: Event) => {
      event.preventDefault();
      void loadRequests().finally(() => window.dispatchEvent(new Event("app:refresh-complete")));
    };
    window.addEventListener("app:refresh-requested", handleRefresh);
    return () => window.removeEventListener("app:refresh-requested", handleRefresh);
  }, [loadRequests]);

  useEffect(() => {
    if (!isInspectorOpen && !selectedPreviewImage) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (selectedPreviewImage) setSelectedPreviewImage(null);
        else setIsInspectorOpen(false);
      }

      if (selectedPreviewImage && selectedItem) {
        const details = parseFeasibilityDetails(
          selectedItem.productDescription,
          selectedItem.referenceImages,
          selectedItem.referenceLinks,
          selectedItem.productImagePath
        );
        const images = details.referenceImages.filter((image) => Boolean(image.url));
        const currentIndex = images.findIndex((image) => image.url === selectedPreviewImage);
        if (images.length > 1 && currentIndex >= 0 && (event.key === "ArrowLeft" || event.key === "ArrowRight")) {
          const nextIndex = event.key === "ArrowRight"
            ? (currentIndex + 1) % images.length
            : (currentIndex - 1 + images.length) % images.length;
          setSelectedPreviewImage(images[nextIndex].url || null);
        }
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isInspectorOpen, selectedItem, selectedPreviewImage]);

  // Stage counts for ProcessStageRibbon
  const stageSteps: StageStep[] = useMemo(() => {
    return SAMP_STAGES.map((st) => {
      let count = 0;
      if (st.id === "all") {
        count = requests.length;
      } else if (st.id === "feasibility") {
        count = requests.filter(
          (r) => String(r.creationMode || "").toLowerCase() === "feasibility_check"
        ).length;
      } else if (st.id === "material_prep") {
        count = requests.filter((r) => {
          const s = (r.status || "").toLowerCase();
          return s.includes("draft") || s.includes("creative") || s.includes("prep");
        }).length;
      } else if (st.id === "prototyping") {
        count = requests.filter((r) => {
          const s = (r.status || "").toLowerCase();
          return s.includes("samp") || s.includes("studio") || s.includes("in plant") || s.includes("machine");
        }).length;
      } else if (st.id === "finishing") {
        count = requests.filter((r) => {
          const s = (r.status || "").toLowerCase();
          return s.includes("finishing") || s.includes("foil") || s.includes("cost");
        }).length;
      } else if (st.id === "qc") {
        count = requests.filter((r) => {
          const s = (r.status || "").toLowerCase();
          return s.includes("qc") || s.includes("inspection");
        }).length;
      }

      return {
        id: st.id,
        stepNumber: st.stepNumber,
        label: st.label,
        count,
      };
    });
  }, [requests]);

  // Metric Ribbon items
  const metrics: MetricTileItem[] = useMemo(() => {
    const total = requests.length;
    const pendingFeasibility = requests.filter(
      (r) =>
        String(r.creationMode || "").toLowerCase() === "feasibility_check" &&
        !r.samplingFeasibilityResponse
    ).length;

    const inLab = requests.filter((r) => {
      const s = (r.status || "").toLowerCase();
      return (
        s.includes("samp") ||
        s.includes("creative") ||
        s.includes("studio") ||
        s.includes("in plant") ||
        s.includes("machine") ||
        s.includes("prep")
      );
    }).length;

    const readyOrDispatched = requests.filter((r) => {
      const s = (r.status || "").toLowerCase();
      return s.includes("dispatch") || s.includes("closed") || s.includes("approved");
    }).length;

    return [
      {
        id: "total",
        label: "Total Lab Tasks",
        value: total,
        deltaText: "Central Prototyping Pool",
        deltaTone: "neutral",
        isActive: selectedStageId === "all" && quickFilter === "none" && selectedType === "all",
        onClick: () => {
          setSelectedStageId("all");
          setQuickFilter("none");
          setSelectedType("all");
          setCurrentPage(1);
        },
      },
      {
        id: "pending_feasibility",
        label: "Pending Feasibility",
        value: pendingFeasibility,
        deltaText: pendingFeasibility > 0 ? "Awaiting lab verdicts" : "All feasibility cleared",
        deltaTone: pendingFeasibility > 0 ? "warning" : "positive",
        isActive: quickFilter === "pending_feasibility",
        onClick: () => {
          setQuickFilter((prev) => (prev === "pending_feasibility" ? "none" : "pending_feasibility"));
          setSelectedStageId("all");
          setCurrentPage(1);
        },
      },
      {
        id: "in_lab",
        label: "In Fabrication",
        value: inLab,
        deltaText: "Machine & Hand Assembly",
        deltaTone: "neutral",
        isActive: quickFilter === "active_lab",
        onClick: () => {
          setQuickFilter((prev) => (prev === "active_lab" ? "none" : "active_lab"));
          setSelectedStageId("all");
          setCurrentPage(1);
        },
      },
      {
        id: "ready",
        label: "QC Passed & Dispatched",
        value: readyOrDispatched,
        deltaText: "Client Courier Ready",
        deltaTone: "positive",
        isActive: quickFilter === "ready",
        onClick: () => {
          setQuickFilter((prev) => (prev === "ready" ? "none" : "ready"));
          setSelectedStageId("all");
          setCurrentPage(1);
        },
      },
    ];
  }, [requests, selectedStageId, quickFilter, selectedType]);

  // Filtering
  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      const isFeas = String(r.creationMode || "").toLowerCase() === "feasibility_check";
      const s = (r.status || "").toLowerCase();

      // Quick filter
      if (quickFilter === "pending_feasibility") {
        if (!isFeas || Boolean(r.samplingFeasibilityResponse)) return false;
      } else if (quickFilter === "active_lab") {
        if (!s.includes("samp") && !s.includes("creative") && !s.includes("studio") && !s.includes("in plant") && !s.includes("prep"))
          return false;
      } else if (quickFilter === "urgent") {
        // SLA due within 48h
        if (!r.sampleRequiredDate) return false;
        const diff = (new Date(r.sampleRequiredDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24);
        if (diff > 2) return false;
      } else if (quickFilter === "ready") {
        if (!s.includes("dispatch") && !s.includes("closed") && !s.includes("approved")) return false;
      }

      // Stage Ribbon filter
      if (selectedStageId !== "all") {
        if (selectedStageId === "feasibility" && !isFeas) return false;
        if (selectedStageId === "material_prep" && !s.includes("draft") && !s.includes("creative") && !s.includes("prep")) return false;
        if (
          selectedStageId === "prototyping" &&
          !s.includes("samp") &&
          !s.includes("studio") &&
          !s.includes("in plant") &&
          !s.includes("machine")
        )
          return false;
        if (selectedStageId === "finishing" && !s.includes("finishing") && !s.includes("foil") && !s.includes("cost")) return false;
        if (selectedStageId === "qc" && !s.includes("qc") && !s.includes("inspection")) return false;
        if (
          selectedStageId === "dispatched" &&
          !s.includes("dispatch") &&
          !s.includes("closed") &&
          !s.includes("approved")
        )
          return false;
      }

      // Type filter
      if (selectedType === "feasibility_check" && !isFeas) return false;
      if (selectedType === "standard_sample" && isFeas) return false;

      // Plant filter
      if (selectedPlant !== "all" && r.targetPlant !== selectedPlant) return false;

      // Search Query
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const match =
          (r.srNumber || "").toLowerCase().includes(q) ||
          (r.materialCode || "").toLowerCase().includes(q) ||
          (r.customer || "").toLowerCase().includes(q) ||
          (r.productDescription || "").toLowerCase().includes(q) ||
          (r.targetPlant || "").toLowerCase().includes(q) ||
          (r.programName || "").toLowerCase().includes(q);
        if (!match) return false;
      }

      return true;
    });
  }, [requests, quickFilter, selectedStageId, selectedType, selectedPlant, searchTerm]);

  // Sorting
  const sortedRequests = useMemo(() => {
    if (!sortField) return filteredRequests;
    return [...filteredRequests].sort((a, b) => {
      let valA = (a as any)[sortField] ?? "";
      let valB = (b as any)[sortField] ?? "";
      if (typeof valA === "number" && typeof valB === "number") {
        return sortDirection === "asc" ? valA - valB : valB - valA;
      }
      valA = String(valA).toLowerCase();
      valB = String(valB).toLowerCase();
      const comp = valA.localeCompare(valB, undefined, { numeric: true });
      return sortDirection === "asc" ? comp : -comp;
    });
  }, [filteredRequests, sortField, sortDirection]);

  // Paginated rows
  const paginatedRequests = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedRequests.slice(start, start + pageSize);
  }, [sortedRequests, currentPage, pageSize]);

  // Unique plants
  const uniquePlants = useMemo(() => {
    const set = new Set<string>();
    requests.forEach((r) => {
      if (r.targetPlant) set.add(r.targetPlant);
    });
    return Array.from(set);
  }, [requests]);

  // Handle open inspector
  const handleSelectRow = (item: SampleRequestItem) => {
    setSelectedItem(item);
    setSignOffResponse(item.samplingFeasibilityResponse || "Yes");
    setSignOffRemark(item.samplingFeasibilityRemark || "");
    const isFeas = String(item.creationMode || "").toLowerCase() === "feasibility_check" || item.requestKind === "feasibility";
    if (isFeas) {
      recordFeasibilityViewedApi(item.id, user?.name || user?.userid || "SAMP Lab Engineer", "SAMP Lab");
    }
    setInspectorTab(isFeas ? "feasibility" : "spec");
    setIsInspectorOpen(true);
  };

  // Toggle row selection
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

  // Submit Feasibility Sign-Off
  const handleSubmitSignOff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    // User Rule: 'Yes' me remark optional hai, but 'No' aur 'Maybe' me mandatory hai!
    if ((signOffResponse === "No" || signOffResponse === "Maybe") && !signOffRemark.trim()) {
      showToast(`Technical remarks are mandatory when selecting "${signOffResponse === "No" ? "Not Feasible (No)" : "Conditional Feasibility (Maybe)"}".`);
      return;
    }

    setIsSubmitting(true);
    try {
      let updated: SampleRequestItem | null = null;
      if (isSelectedItemFeasibility) {
        updated = await recordFeasibilitySampVerdictApi(selectedItem.id, {
          response: signOffResponse,
          remark: signOffRemark.trim() || null,
          approved_by: user?.name || user?.userid || "SAMP Lab Lead",
        });
      } else {
        const closedAt = new Date().toISOString();
        let newStatus = "Feasibility Responded";
        if (signOffResponse === "Yes") newStatus = "Feasible (SAMP Verified)";
        else if (signOffResponse === "No") newStatus = "Feasibility Rejected";
        else newStatus = "Conditional Feasibility";

        const payload = {
          samplingFeasibilityResponse: signOffResponse,
          samplingFeasibilityRemark: signOffRemark.trim() || "Specifications verified feasible by Central Sampling Lab.",
          samplingFeasibilityApprovedBy: user?.name || user?.userid || "SAMP Team",
          feasibilityClosedBy: "sampling",
          feasibilityClosedAt: closedAt,
          status: newStatus,
        } as const;
        updated = await updateSampleRequestApi(selectedItem.id, payload);
      }

      if (updated) {
        setRequests((prev) => prev.map((r) => (r.id === updated!.id ? updated! : r)));
        setSelectedItem(updated);
      }
      showToast(`✓ SAMP Lab verdict (${signOffResponse}) recorded and broadcast to Marketing Desk.`);
    } catch (err: any) {
      console.error("Failed to sign off feasibility:", err);
      showToast(err?.message || "Error recording feasibility sign-off");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Milestone Update
  const handleUpdatePrototypingStage = async (newStage: string) => {
    if (!selectedItem) return;
    try {
      const updated = await updateSampleRequestApi(selectedItem.id, {
        status: newStage,
      });
      if (updated) {
        setRequests((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
        setSelectedItem(updated);
      }
      showToast(`✓ Fabrication milestone updated to: ${newStage}`);
    } catch (err) {
      console.error("Failed to update milestone:", err);
      showToast("Error updating prototyping stage");
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (filteredRequests.length === 0) {
      showToast("No records to export");
      return;
    }

    const headers = [
      "SR Number",
      "Material Code",
      "Track",
      "Customer",
      "Queue / Plant",
      "Specification",
      "Required Date",
      "SAMP Feasibility Verdict",
      "Status",
    ];

    const csvRows = filteredRequests.map((r) => [
      `"${r.srNumber || ""}"`,
      `"${r.materialCode || ""}"`,
      `"${r.creationMode || "Standard Prototype"}"`,
      `"${r.customer || ""}"`,
      `"${String(r.creationMode || "").toLowerCase() === "feasibility_check" ? "SAMP Team" : (r.targetPlant || "")}"`,
      `"${(r.productDescription || "").replace(/"/g, '""')}"`,
      `"${r.sampleRequiredDate || ""}"`,
      `"${r.samplingFeasibilityResponse || "Pending"}"`,
      `"${r.status || ""}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...csvRows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `navneet_sampling_tasks_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported ${filteredRequests.length} tasks to CSV`);
  };

  // Helper to calculate SLA urgency badge
  const isTerminalWorkStatus = (status?: string) => {
    const normalizedStatus = String(status || "").toLowerCase();
    return ["completed", "closed", "approved", "rejected", "dispatched"].some((term) =>
      normalizedStatus.includes(term)
    );
  };

  const getSlaUrgency = (dateStr?: string) => {
    if (!dateStr) return null;
    const target = new Date(dateStr).getTime();
    const now = new Date().getTime();
    const diffDays = Math.ceil((target - now) / (1000 * 3600 * 24));

    if (diffDays < 0) {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60">
          <AlertTriangle className="w-2.5 h-2.5 text-rose-600" />
          Overdue ({Math.abs(diffDays)}d)
        </span>
      );
    }
    if (diffDays <= 2) {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60">
          <Clock className="w-2.5 h-2.5 text-amber-600" />
          Due {diffDays === 0 ? "Today" : `${diffDays}d`}
        </span>
      );
    }
    return (
      <span className="text-[10px] text-zinc-400 font-mono">
        {diffDays}d left
      </span>
    );
  };

  // Table Columns
  const columns: ColumnDef<SampleRequestItem>[] = useMemo(
    () => [
      {
        id: "select",
        header: (
          <div className="flex items-center justify-center pl-1">
            <button
              type="button"
              onClick={handleToggleSelectAll}
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
            >
              {selectedIds.size > 0 && selectedIds.size === paginatedRequests.length ? (
                <CheckSquare className="w-3.5 h-3.5 text-brand-600" />
              ) : (
                <Square className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        ),
        width: "w-[36px]",
        align: "center",
        cell: (row) => (
          <div className="flex items-center justify-center pl-1" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => handleToggleSelectRow(row.id)}
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
            >
              {selectedIds.has(row.id) ? (
                <CheckSquare className="w-3.5 h-3.5 text-brand-600" />
              ) : (
                <Square className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        ),
      },
      {
        id: "srNumber",
        header: "Lab Task #",
        sortable: true,
        width: "min-w-[130px] w-[140px]",
        cell: (row) => (
          <div>
            <div className="flex items-center gap-1.5 font-mono text-[12px] font-semibold text-zinc-900 dark:text-zinc-100">
              <span>{row.srNumber}</span>
              <button
                type="button"
                onClick={(e) => handleCopyCode(row.srNumber, e)}
                className="p-0.5 rounded text-zinc-400 hover:text-brand-600 transition-colors cursor-pointer"
                title="Copy lab code"
              >
                {copiedId === row.srNumber ? (
                  <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </button>
            </div>
            {row.materialCode && (
              <div className="text-[10px] text-zinc-400 font-mono tracking-tight truncate max-w-[125px]">
                {row.materialCode}
              </div>
            )}
          </div>
        ),
      },
      {
        id: "type",
        header: "Type",
        width: "w-[145px]",
        cell: (row) => {
          const isFeas = String(row.creationMode || "").toLowerCase() === "feasibility_check";
          if (isFeas) {
            return (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-brand-50 text-brand-800 border border-brand-200/90 dark:bg-brand-950/40 dark:text-brand-300 dark:border-brand-800/60 whitespace-nowrap">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-500 shrink-0" />
                Feasibility Check
              </span>
            );
          }
          return (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-blue-50 text-blue-800 border border-blue-200/90 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60 whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
              Standard Prototype
            </span>
          );
        },
      },
      {
        id: "productDescription",
        header: "Specification & Client",
        width: "min-w-[260px]",
        cell: (row) => (
          <div>
            <div
              className="font-medium text-zinc-900 dark:text-zinc-100 truncate max-w-[340px]"
              title={row.productDescription || undefined}
            >
              {row.productDescription || "—"}
            </div>
            <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-sans mt-0.5">
              <span>Customer: <strong className="font-semibold text-zinc-700 dark:text-zinc-300">{row.customer}</strong></span>
              {row.programName && (
                <>
                  <span>·</span>
                  <span className="truncate max-w-[160px] text-zinc-500">{row.programName}</span>
                </>
              )}
            </div>
          </div>
        ),
      },
      {
        id: "targetPlant",
        header: "Queue / Plant",
        sortable: true,
        width: "w-[125px]",
        cell: (row) => (
          <span className="text-[12px] font-medium text-zinc-700 dark:text-zinc-300 truncate block">
            {String(row.creationMode || "").toLowerCase() === "feasibility_check"
              ? "SAMP Team"
              : row.targetPlant
              ? row.targetPlant.replace(/^\d+-\s*/, "")
              : "Unassigned"}
          </span>
        ),
      },
      {
        id: "sampleRequiredDate",
        header: "Target SLA",
        sortable: true,
        width: "w-[130px]",
        cell: (row) => (
          <div className="flex flex-col gap-0.5">
            <span className="font-mono text-[12px] text-zinc-800 dark:text-zinc-200 tnum">
              {row.sampleRequiredDate || "—"}
            </span>
            {!isTerminalWorkStatus(row.status) && getSlaUrgency(row.sampleRequiredDate)}
          </div>
        ),
      },
      {
        id: "feasibilitySignOff",
        header: "Technical Sign-Off",
        width: "w-[170px]",
        cell: (row) => {
          const isFeas = String(row.creationMode || "").toLowerCase() === "feasibility_check";
          if (!isFeas) {
            return <span className="text-zinc-300 dark:text-zinc-600 font-sans text-xs">—</span>;
          }

          const resp = row.samplingFeasibilityResponse;
          const closedBy = row.feasibilityClosedBy;

          if (!resp) {
            return (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-brand-50 text-brand-800 border border-brand-200/90 dark:bg-brand-950/40 dark:text-brand-300 dark:border-brand-800/60 whitespace-nowrap">
                <Clock className="w-3 h-3 text-brand-500" />
                Awaiting SAMP Verdict
              </span>
            );
          }

          const isFirst = closedBy === "sampling";

          if (resp === "Yes") {
            return (
              <div className="flex flex-col gap-0.5 font-mono">
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-bold text-emerald-700 bg-emerald-50 border-emerald-200/90 dark:text-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-800/60 w-fit">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Feasible (Approved)
                </span>
                <span className="text-[9px] text-brand-600 dark:text-brand-400 font-bold uppercase">
                  {isFirst ? "★ Responded First" : "Recorded"}
                </span>
              </div>
            );
          }
          if (resp === "No") {
            return (
              <div className="flex flex-col gap-0.5 font-mono">
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-bold text-rose-700 bg-rose-50 border-rose-200/90 dark:text-rose-300 dark:bg-rose-950/40 dark:border-rose-800/60 w-fit">
                  <XCircle className="w-3 h-3 text-rose-600" />
                  Not Feasible
                </span>
                <span className="text-[9px] text-zinc-400">
                  {isFirst ? "★ Responded First" : "Recorded"}
                </span>
              </div>
            );
          }
          return (
            <div className="flex flex-col gap-0.5 font-mono">
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-bold text-amber-700 bg-amber-50 border-amber-200/90 dark:text-amber-300 dark:bg-amber-950/40 dark:border-amber-800/60 w-fit">
                <AlertTriangle className="w-3 h-3 text-amber-600" />
                Conditional
              </span>
              <span className="text-[9px] text-zinc-400">
                {isFirst ? "★ Responded First" : "Recorded"}
              </span>
            </div>
          );
        },
      },
      {
        id: "status",
        header: "Status",
        sortable: true,
        width: "w-[145px]",
        cell: (row) => <StatusPill status={row.status} size="xs" />,
      },
      {
        id: "action",
        header: "",
        width: "w-[90px]",
        align: "right",
        cell: (row) => {
          const isFeas = String(row.creationMode || "").toLowerCase() === "feasibility_check";
          const hasResponded = Boolean(row.samplingFeasibilityResponse);

          return (
            <div className="flex items-center justify-end" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => handleSelectRow(row)}
                className={`h-8.5 px-3.5 rounded-md text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all shadow-2xs ${
                  isFeas && !hasResponded
                    ? "bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white font-bold"
                    : "border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700"
                }`}
              >
                {isFeas && !hasResponded ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-white/80" />
                    <span>Sign-Off</span>
                  </>
                ) : (
                  <span>Inspect</span>
                )}
              </button>
            </div>
          );
        },
      },
    ],
    [copiedId, selectedIds, paginatedRequests]
  );

  const isSelectedItemFeasibility = Boolean(
    selectedItem &&
      (String(selectedItem.creationMode || "").toLowerCase() === "feasibility_check" ||
        String(selectedItem.materialCode || "").toLowerCase().startsWith("fc-"))
  );

  const selectedItemFeasibilityDetails = selectedItem
    ? parseFeasibilityDetails(
        selectedItem.productDescription,
        selectedItem.referenceImages,
        selectedItem.referenceLinks,
        selectedItem.productImagePath
      )
    : null;
  const previewableImages = selectedItemFeasibilityDetails?.referenceImages.filter((image) => Boolean(image.url)) || [];
  const selectedPreviewIndex = previewableImages.findIndex((image) => image.url === selectedPreviewImage);

  const movePreview = (direction: -1 | 1) => {
    if (previewableImages.length < 2 || selectedPreviewIndex < 0) return;
    const nextIndex = (selectedPreviewIndex + direction + previewableImages.length) % previewableImages.length;
    setSelectedPreviewImage(previewableImages[nextIndex].url || null);
  };

  return (
    <div className="flex flex-col flex-1 h-full min-h-0 overflow-hidden bg-white dark:bg-[#0b0c10] select-text">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 right-5 z-[60] flex items-center gap-2.5 px-4 py-2.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-2xl text-[12px] font-semibold border border-zinc-800 dark:border-zinc-200/80 max-w-sm animate-smooth-toast">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Process Stage Ribbon */}
      <ProcessStageRibbon
        stages={stageSteps}
        selectedStageId={selectedStageId}
        onSelectStage={(id) => {
          setSelectedStageId(id);
          setQuickFilter("none");
          setCurrentPage(1);
        }}
      />

      {/* 2. High-Density Metric Ribbon */}
      <MetricRibbon metrics={metrics} />

      {/* 3. Operational Command & Filter Toolbar */}
      <div className="px-4 sm:px-6 py-2.5 bg-white dark:bg-[#0f1118] border-b border-zinc-200 dark:border-white/[0.08] shrink-0 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Filters & Search */}
        <div className="flex items-center flex-wrap gap-2.5">
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

          {/* Segmented Type Switcher */}
          <div className="inline-flex bg-zinc-100 dark:bg-zinc-800/80 p-1 rounded-md text-xs border border-zinc-200/60 dark:border-white/[0.05]">
            <button
              type="button"
              onClick={() => {
                setSelectedType("all");
                setCurrentPage(1);
              }}
              className={`h-8 px-3.5 rounded-md transition-colors text-xs font-medium cursor-pointer ${
                selectedType === "all"
                  ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-50 font-semibold shadow-xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              All Tasks ({requests.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedType("feasibility_check");
                setCurrentPage(1);
              }}
              className={`h-8 px-3.5 rounded-md transition-colors text-xs font-medium cursor-pointer flex items-center gap-1.5 ${
                selectedType === "feasibility_check"
                  ? "bg-white dark:bg-zinc-700 text-brand-700 dark:text-brand-300 font-semibold shadow-xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              Feasibility Reviews
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedType("standard_sample");
                setCurrentPage(1);
              }}
              className={`h-8 px-3.5 rounded-md transition-colors text-xs font-medium cursor-pointer flex items-center gap-1.5 ${
                selectedType === "standard_sample"
                  ? "bg-white dark:bg-zinc-700 text-blue-700 dark:text-blue-300 font-semibold shadow-xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              Physical Prototypes
            </button>
          </div>

          {/* Plant Dropdown */}
          <select
            value={selectedPlant}
            onChange={(e) => {
              setSelectedPlant(e.target.value);
              setCurrentPage(1);
            }}
            className="h-9 px-3 rounded-md border border-zinc-200 dark:border-zinc-700/80 bg-zinc-50/60 dark:bg-zinc-900/60 text-xs text-zinc-700 dark:text-zinc-300 outline-none focus:border-brand-500 cursor-pointer max-w-[170px] truncate font-medium"
          >
            <option value="all">All Plant Facilities</option>
            {uniquePlants.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>

          {/* Reset Filters */}
          {(searchTerm || selectedType !== "all" || selectedPlant !== "all" || selectedStageId !== "all" || quickFilter !== "none") && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                setSelectedType("all");
                setSelectedPlant("all");
                setSelectedStageId("all");
                setQuickFilter("none");
                setCurrentPage(1);
              }}
              className="h-9 px-3.5 rounded-md border border-zinc-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-900 text-xs text-zinc-600 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-200 flex items-center gap-1.5 cursor-pointer transition-colors font-medium shadow-2xs"
            >
              <X className="w-3.5 h-3.5" />
              Reset
            </button>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 shrink-0 ml-auto">
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2 px-3 py-1 bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800/60 rounded-md text-xs">
              <span className="font-mono font-bold text-brand-700 dark:text-brand-300">
                {selectedIds.size} selected
              </span>
              <button
                type="button"
                onClick={() => showToast(`Bulk action queued for ${selectedIds.size} tasks`)}
                className="h-7 px-3 bg-brand-600 hover:bg-brand-700 text-white rounded-md font-semibold text-xs cursor-pointer shadow-2xs"
              >
                Advance Stage
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={handleExportCSV}
            className="h-9 px-4 rounded-md border border-zinc-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer shadow-2xs"
            title="Download CSV export"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 4. Dense Data Table */}
      <DataTable
        data={paginatedRequests}
        columns={columns}
        keyExtractor={(row) => row.id}
        isLoading={isLoading}
        onRowClick={handleSelectRow}
        selectedRowId={selectedItem?.id}
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
              <span className="font-semibold text-zinc-900 dark:text-zinc-100 font-mono">{filteredRequests.length}</span> sampling tasks
            </span>
          </div>
        }
      />

      {/* 5. Master-Detail Inspector Drawer for Sampling Lab */}
      {isInspectorOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex justify-end bg-zinc-950/45 backdrop-blur-[2px]">
          <div className="bg-white dark:bg-[#0f1118] border-l border-zinc-200 dark:border-white/[0.08] w-full max-w-2xl h-full shadow-2xl flex flex-col overflow-hidden">
            {/* Drawer Top Header */}
            <div className="px-5 py-4 border-b border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-[#0f1118] flex items-center justify-between shrink-0">
              <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 font-mono tracking-tight">
                      {selectedItem.srNumber}
                    </h3>
                    <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700">
                      {selectedItem.materialCode || "FC-CK-TBD"}
                    </span>
                    {isSelectedItemFeasibility && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-brand-50 text-brand-800 dark:bg-brand-950/50 dark:text-brand-300 border border-brand-200 dark:border-brand-800/80">
                        Feasibility Assessment
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Central Prototyping Laboratory · Technical assessment workspace
                  </p>
              </div>
              <button
                type="button"
                onClick={() => setIsInspectorOpen(false)}
                className="h-8 w-8 rounded-md flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                title="Close drawer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Context Strip: 4 Key Operational Columns */}
            <div className="grid grid-cols-2 sm:grid-cols-4 border-b border-zinc-200 dark:border-white/[0.08] bg-zinc-50/60 dark:bg-[#161822] divide-y sm:divide-y-0 sm:divide-x divide-zinc-200 dark:divide-white/[0.08] shrink-0 text-xs p-3 gap-2 sm:gap-0">
              <div className="sm:pr-3">
                <span className="block text-[10px] uppercase font-bold text-zinc-400">Customer Account</span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100 truncate block">
                  {selectedItem.customer}
                </span>
              </div>
              <div className="sm:px-3 pt-1.5 sm:pt-0">
                <span className="block text-[10px] uppercase font-bold text-zinc-400">
                  {isSelectedItemFeasibility ? "Review Queue" : "Target Plant"}
                </span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100 truncate block">
                  {isSelectedItemFeasibility ? "SAMP Team" : (selectedItem.targetPlant || "Unassigned")}
                </span>
              </div>
              <div className="sm:px-3 pt-1.5 sm:pt-0">
                <span className="block text-[10px] uppercase font-bold text-zinc-400">
                  {isSelectedItemFeasibility ? "Feasibility Type" : "Requested By"}
                </span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100 truncate block">
                  {isSelectedItemFeasibility && selectedItemFeasibilityDetails
                    ? selectedItemFeasibilityDetails.category
                    : (selectedItem.createdBy || "Marketing Team")}
                </span>
              </div>
              <div className="sm:pl-3 pt-1.5 sm:pt-0">
                <span className="block text-[10px] uppercase font-bold text-zinc-400">
                  {isSelectedItemFeasibility ? "Required Target Date" : "SLA Due Date"}
                </span>
                <span className="font-mono font-semibold text-zinc-900 dark:text-zinc-100 truncate block tabular-nums">
                  {selectedItem.sampleRequiredDate || "Pending"}
                </span>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-[#0f1118] px-3 shrink-0 gap-1">
              <button
                type="button"
                onClick={() => setInspectorTab("spec")}
                className={`h-9 px-3.5 text-xs font-semibold border-b-2 cursor-pointer transition-colors ${
                  inspectorTab === "spec"
                    ? "border-brand-600 text-brand-700 dark:text-brand-400"
                    : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                }`}
              >
                Overview &amp; Specs
              </button>
              {String(selectedItem.creationMode || "").toLowerCase() === "feasibility_check" ||
              String(selectedItem.materialCode || "").toLowerCase().startsWith("fc-") ? (
                <button
                  type="button"
                  onClick={() => setInspectorTab("feasibility")}
                  className={`h-9 px-3.5 text-xs font-semibold border-b-2 cursor-pointer transition-colors flex items-center gap-1.5 ${
                    inspectorTab === "feasibility"
                      ? "border-brand-600 text-brand-700 dark:text-brand-400 font-bold"
                      : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                  }`}
                >
                  Feasibility Sign-Off
                  {selectedItem.samplingFeasibilityResponse && (
                    <span className="ml-1 w-2 h-2 rounded-full bg-emerald-500" title="Verdict Recorded" />
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setInspectorTab("milestones")}
                  className={`h-9 px-3.5 text-xs font-semibold border-b-2 cursor-pointer transition-colors flex items-center gap-1.5 ${
                    inspectorTab === "milestones"
                      ? "border-brand-600 text-brand-600 dark:text-brand-400"
                      : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                  }`}
                >
                  <Boxes className="w-3.5 h-3.5" />
                  Milestone Stepper
                </button>
              )}
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto bg-zinc-50/50 dark:bg-[#11131b] p-5 space-y-4 text-xs">
              {/* TAB 1: SPECIFICATION & BLUEPRINT */}
              {inspectorTab === "spec" && (
                <div className="space-y-4">
                  {/* Scope & Requester Bar */}
                  <div className="p-4 rounded-lg border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-[#0f1118] space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-brand-50 text-brand-800 dark:bg-brand-950/50 dark:text-brand-300 border border-brand-200 dark:border-brand-800/70">
                          {isSelectedItemFeasibility && selectedItemFeasibilityDetails
                            ? selectedItemFeasibilityDetails.category
                            : "Physical Prototyping"}
                        </span>
                      <span className="text-[11px] text-zinc-600 dark:text-zinc-400">
                          Scope: <strong className="text-zinc-900 dark:text-zinc-200">{isSelectedItemFeasibility ? "Technical Feasibility Assessment" : "Prototype Fabrication"}</strong>
                        </span>
                      </div>
                      <StatusPill status={selectedItem.status || "Pending Feasibility"} />
                    </div>

                    <div className="text-[11px] text-zinc-600 dark:text-zinc-400 flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800 flex-wrap gap-2">
                      <span>
                        Marketing Requester: <strong className="text-zinc-900 dark:text-zinc-200">{selectedItem.createdBy || "Marketing Team (Corporate)"}</strong>
                      </span>
                      <span className="font-mono text-[10px] text-zinc-500">
                        Date Raised: {formatIndianDateTime(selectedItem.dateRequestCreated || selectedItem.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Technical Requirement Brief (clean user-filled text) */}
                  <div className="rounded-lg border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-[#0f1118] p-4 space-y-2.5">
                    <span className="block text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                      Technical Description &amp; Requirements:
                    </span>
                    <div className="p-3.5 rounded bg-white dark:bg-[#0f1118] border border-zinc-200/80 dark:border-white/[0.08] text-zinc-800 dark:text-zinc-200 font-sans text-xs leading-relaxed whitespace-pre-wrap max-h-56 overflow-y-auto">
                      {isSelectedItemFeasibility && selectedItemFeasibilityDetails
                        ? selectedItemFeasibilityDetails.requirements
                        : selectedItem.productDescription}
                    </div>
                  </div>

                  {/* Marketing Remarks / Context (if entered) */}
                  {isSelectedItemFeasibility && selectedItemFeasibilityDetails?.marketingRemarks && (
                    <div className="rounded-lg border border-blue-200/80 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-950/20 p-4 space-y-2">
                      <span className="block text-[10px] uppercase font-bold text-blue-700 dark:text-blue-300 tracking-wider">
                        Marketing Remarks / Client Context:
                      </span>
                      <div className="p-3 rounded-md bg-white/80 dark:bg-[#0f1118] border border-blue-200/50 dark:border-blue-800/40 text-xs text-zinc-800 dark:text-zinc-200 leading-relaxed whitespace-pre-wrap">
                        {selectedItemFeasibilityDetails.marketingRemarks}
                      </div>
                    </div>
                  )}

                  {/* Reference Photos Gallery (all user uploaded photos) */}
                  {isSelectedItemFeasibility &&
                    selectedItemFeasibilityDetails &&
                    selectedItemFeasibilityDetails.referenceImages.length > 0 && (
                      <div className="rounded-lg border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-[#0f1118] p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="block text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                            Attached Reference Photos ({selectedItemFeasibilityDetails.referenceImages.length}):
                          </span>
                          <span className="text-[10px] font-mono text-zinc-400">Select a photo to enlarge</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {selectedItemFeasibilityDetails.referenceImages.map((img, idx) => (
                            <div
                              key={img.id || idx}
                              onClick={() => img.url && setSelectedPreviewImage(img.url)}
                              className={`group relative rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 overflow-hidden flex flex-col transition-all ${
                                img.url ? "cursor-pointer hover:border-brand-300 dark:hover:border-brand-700 hover:shadow-md" : ""
                              }`}
                            >
                              {img.url ? (
                                <div className="aspect-[4/3] w-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden relative">
                                  <img
                                    src={img.url}
                                    alt={img.name}
                                    className="w-full h-full object-cover"
                                  />
                                  <div className="absolute inset-0 bg-zinc-950/55 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <span className="rounded-md border border-white/30 bg-white/15 px-2 py-1 text-[10px] font-semibold text-white backdrop-blur-sm">View photo</span>
                                  </div>
                                </div>
                              ) : (
                                <div className="aspect-4/3 w-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400">
                                  <span className="text-[10px] font-semibold uppercase tracking-wider">Unavailable</span>
                                </div>
                              )}
                              <div className="p-1.5 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-1 text-[11px]">
                                <span className="truncate text-zinc-700 dark:text-zinc-300 font-medium" title={img.name}>
                                  {img.name}
                                </span>
                                <span className="text-[9px] font-mono text-zinc-400 shrink-0">#{idx + 1}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* Reference Web Links */}
                  {isSelectedItemFeasibility &&
                    selectedItemFeasibilityDetails &&
                    selectedItemFeasibilityDetails.referenceLinks.length > 0 && (
                      <div className="rounded-md border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-[#0f1118] p-3.5 space-y-2">
                        <span className="block text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                          Reference Web Links ({selectedItemFeasibilityDetails.referenceLinks.length}):
                        </span>
                        <div className="space-y-1.5">
                          {selectedItemFeasibilityDetails.referenceLinks.map((url, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between gap-2 px-3 py-1.5 rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/50"
                            >
                              <span className="text-xs text-brand-600 dark:text-brand-400 truncate font-mono">
                                {url}
                              </span>
                              <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 hover:text-brand-600 transition-colors shrink-0"
                              >
                                <span>Open</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* For regular non-feasibility items: standard visual preview if any */}
                  {!isSelectedItemFeasibility && selectedItem.productImagePath && (
                    <div className="rounded-md border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-[#0f1118] p-3.5 space-y-2">
                      <span className="block text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                        Marketing Visual Reference / Sketch:
                      </span>
                      <div className="flex items-center gap-3">
                        <img
                          src={selectedItem.productImagePath}
                          alt="Visual reference"
                          className="h-20 w-20 object-cover rounded-md border border-zinc-200 dark:border-zinc-700"
                        />
                        <div className="text-xs text-zinc-600 dark:text-zinc-400">
                          <p className="font-semibold text-zinc-800 dark:text-zinc-200">
                            Reference asset provided by Marketing
                          </p>
                          <a
                            href={selectedItem.productImagePath}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-brand-600 dark:text-brand-400 hover:underline mt-1 font-medium"
                          >
                            Open full image in new tab <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Sign-Off Callout Action */}
                  <div className="p-3.5 rounded-lg border border-zinc-200 dark:border-white/[0.08] bg-zinc-50 dark:bg-zinc-900/60 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                        {selectedItem.samplingFeasibilityResponse
                          ? `Verdict Submitted: ${selectedItem.samplingFeasibilityResponse}`
                          : "Feasibility Sign-Off Pending"}
                      </p>
                      <p className="text-[11px] text-zinc-500">
                        {selectedItem.samplingFeasibilityResponse
                          ? "Official verdict is locked and visible to Marketing desk."
                          : "Review specifications and record technical sign-off."}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setInspectorTab("feasibility")}
                      className="px-3.5 py-1.5 rounded-md bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <span>{selectedItem.samplingFeasibilityResponse ? "View Locked Verdict" : "Proceed to Sign-Off"}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: FEASIBILITY & FIRST RESPONDER */}
              {inspectorTab === "feasibility" && (
                <div className="space-y-4">
                  {/* CASE 1: VERDICT ALREADY SUBMITTED -> LOCKED VIEW (CANNOT BE CHANGED) */}
                  {selectedItem.samplingFeasibilityResponse ? (
                    <div className="rounded-lg border border-emerald-300 dark:border-emerald-800/80 bg-emerald-50/70 dark:bg-emerald-950/30 p-4 space-y-4 shadow-xs">
                      <div className="flex items-center justify-between pb-3 border-b border-emerald-200 dark:border-emerald-800/70">
                        <div className="flex items-center gap-2">
                          <div className="p-1 rounded bg-emerald-600 text-white">
                            <Lock className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-emerald-950 dark:text-emerald-100 uppercase tracking-wider">
                              Official Verdict Recorded &amp; Locked
                            </h4>
                            <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                              Statement permanently recorded in audit trail and broadcast to Marketing Desk.
                            </p>
                          </div>
                        </div>

                        <span className={`px-2.5 py-1 rounded text-xs font-bold border ${
                          selectedItem.samplingFeasibilityResponse === "Yes"
                            ? "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/60 dark:text-emerald-200 dark:border-emerald-700"
                            : selectedItem.samplingFeasibilityResponse === "Maybe"
                            ? "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/60 dark:text-amber-200 dark:border-amber-700"
                            : "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-900/60 dark:text-rose-200 dark:border-rose-700"
                        }`}>
                          Verdict: {selectedItem.samplingFeasibilityResponse === "Yes" ? "Feasible (Yes)" : selectedItem.samplingFeasibilityResponse === "Maybe" ? "Conditional (Maybe)" : "Not Feasible (No)"}
                        </span>
                      </div>

                      {/* Technical Remarks Display */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">
                          SAMP Lab Technical Evaluation Statement:
                        </span>
                        <div className="p-3.5 rounded-md bg-white dark:bg-[#0f1118] border border-zinc-200/80 dark:border-white/[0.08] text-xs text-zinc-800 dark:text-zinc-200 leading-relaxed font-sans whitespace-pre-wrap">
                          "{selectedItem.samplingFeasibilityRemark || "Tooling, materials, and binding verified feasible."}"
                        </div>
                      </div>

                      {/* Audit Details */}
                      <div className="grid grid-cols-2 gap-3 pt-2 text-[11px] border-t border-emerald-200/80 dark:border-emerald-800/60 text-zinc-600 dark:text-zinc-400">
                        <div>
                          <span className="font-semibold text-zinc-800 dark:text-zinc-200">Evaluated By:</span> Central Prototyping Lab (SAMP)
                          {selectedItem.samplingFeasibilityApprovedBy && (
                            <span className="block mt-1"><span className="font-semibold text-zinc-800 dark:text-zinc-200">Accepted By:</span> {selectedItem.samplingFeasibilityApprovedBy}</span>
                          )}
                        </div>
                        <div>
                          <span className="font-semibold text-zinc-800 dark:text-zinc-200">Recorded At:</span>{" "}
                          <span className="font-mono text-zinc-800 dark:text-zinc-200">
                            {formatIndianDateTime(selectedItem.feasibilityClosedAt || selectedItem.createdAt || selectedItem.dateRequestCreated)}
                          </span>
                        </div>
                      </div>

                      <div className="p-2.5 rounded bg-zinc-100 dark:bg-zinc-900/80 text-[11px] text-zinc-600 dark:text-zinc-400 flex items-center gap-2 border border-zinc-200/60 dark:border-zinc-800">
                        <Lock className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                        <span>This response is officially locked. Prototyping team cannot alter the submitted evaluation.</span>
                      </div>
                    </div>
                  ) : (
                    /* CASE 2: VERDICT PENDING -> INTERACTIVE SIGN-OFF FORM */
                    <form onSubmit={handleSubmitSignOff} className="rounded-lg border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-[#0f1118] p-5 space-y-5 shadow-xs">
                      <div>
                        <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                          Record SAMP Lab Technical Verdict:
                        </span>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                          Evaluate if this specification can be manufactured. Your response will lock and transmit to Marketing.
                        </p>
                      </div>

                      {/* 3 Verdict Buttons */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <button
                          type="button"
                          onClick={() => setSignOffResponse("Yes")}
                          className={`min-h-14 px-3 rounded-md border text-xs font-bold flex flex-col items-center justify-center gap-1 cursor-pointer transition-all shadow-2xs select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 ${
                            signOffResponse === "Yes"
                              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500 ring-2 ring-emerald-500/30"
                              : "bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-emerald-500/40"
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>Feasible (Yes)</span>
                          </div>
                          <span className="text-[9px] font-normal text-emerald-600 dark:text-emerald-400 font-sans">
                            Ready to produce
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSignOffResponse("Maybe")}
                          className={`min-h-14 px-3 rounded-md border text-xs font-bold flex flex-col items-center justify-center gap-1 cursor-pointer transition-all shadow-2xs select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40 ${
                            signOffResponse === "Maybe"
                              ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500 ring-2 ring-amber-500/30"
                              : "bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-amber-500/40"
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <AlertTriangle className="w-4 h-4 text-amber-600" />
                            <span>Conditional (Maybe)</span>
                          </div>
                          <span className="text-[9px] font-normal text-amber-600 dark:text-amber-400 font-sans">
                            Requires changes
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSignOffResponse("No")}
                          className={`min-h-14 px-3 rounded-md border text-xs font-bold flex flex-col items-center justify-center gap-1 cursor-pointer transition-all shadow-2xs select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/40 ${
                            signOffResponse === "No"
                              ? "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500 ring-2 ring-rose-500/30"
                              : "bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-rose-500/40"
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <XCircle className="w-4 h-4 text-rose-600" />
                            <span>Not Feasible (No)</span>
                          </div>
                          <span className="text-[9px] font-normal text-rose-600 dark:text-rose-400 font-sans">
                            Cannot manufacture
                          </span>
                        </button>
                      </div>

                      {/* Spacious Textarea for Technical Remarks */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                            Lab Technical Remarks
                          </label>
                          {signOffResponse !== "Yes" ? (
                            <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400">
                              * Strictly Mandatory for {signOffResponse}
                            </span>
                          ) : (
                            <span className="text-[10px] text-zinc-400 font-sans">
                              (Optional for Yes)
                            </span>
                          )}
                        </div>
                        <textarea
                          rows={4}
                          required={signOffResponse !== "Yes"}
                          value={signOffRemark}
                          onChange={(e) => setSignOffRemark(e.target.value)}
                          placeholder={
                            signOffResponse === "Yes"
                              ? "Enter optional technical clearance notes (e.g. Die-block available, tooling verified on Kolbus wrapper, paper stock in house)..."
                              : signOffResponse === "Maybe"
                              ? "Explain required technical conditions or modifications (e.g. Substrate GSM must be reduced to 300 GSM for folding tolerance)..."
                              : "State the exact technical reasons why this cannot be manufactured (e.g. Die radius too tight for machine plotter, unsupported coating)..."
                          }
                          className="w-full p-3 rounded-md border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900 text-xs text-zinc-900 dark:text-zinc-100 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20 leading-relaxed resize-y min-h-[96px]"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full h-10 px-4 rounded-md bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50 transition-colors"
                      >
                        <CheckCircle2 className="w-4 h-4 text-white/80" />
                        <span>{isSubmitting ? "Recording in Audit Trail..." : "Submit Feasibility Verdict & Send to Marketing"}</span>
                      </button>

                      <p className="text-[10px] text-zinc-400 text-center font-mono">
                        Note: Once submitted, your statement is locked in Indian Standard Time (IST) and cannot be edited.
                      </p>
                    </form>
                  )}

                  {/* Milestone Activity Timeline Component */}
                  <FeasibilityActivityTimeline request={selectedItem} activities={selectedItem.activities} />
                </div>
              )}

              {/* TAB 3: FABRICATION SHOP FLOOR STEPPER */}
              {inspectorTab === "milestones" && (
                <div className="space-y-4">
                  <div className="rounded-md border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-[#0f1118] p-4 space-y-3">
                    <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                      <Boxes className="w-4 h-4 text-brand-600" />
                      Advance Prototyping Milestone:
                    </h4>

                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => handleUpdatePrototypingStage("Material Preparation")}
                        className="w-full p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-left hover:border-brand-500 hover:bg-brand-50/20 transition-all cursor-pointer flex items-center justify-between"
                      >
                        <div>
                          <span className="block font-bold text-xs text-zinc-800 dark:text-zinc-200">1. Board & Paper Staging</span>
                          <span className="text-[10px] text-zinc-400">Substrate cut to machine sheet size & grain aligned</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-zinc-400" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleUpdatePrototypingStage("SAMP Prototyping")}
                        className="w-full p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-left hover:border-brand-500 hover:bg-brand-50/20 transition-all cursor-pointer flex items-center justify-between"
                      >
                        <div>
                          <span className="block font-bold text-xs text-zinc-800 dark:text-zinc-200">2. Sample Machine Run & Die Cutting</span>
                          <span className="text-[10px] text-zinc-400">Digital proof press & automated plotter creasing</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-zinc-400" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleUpdatePrototypingStage("Finishing & Embellishment")}
                        className="w-full p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-left hover:border-brand-500 hover:bg-brand-50/20 transition-all cursor-pointer flex items-center justify-between"
                      >
                        <div>
                          <span className="block font-bold text-xs text-zinc-800 dark:text-zinc-200">3. Finishing & Foil Embellishment</span>
                          <span className="text-[10px] text-zinc-400">Hot stamping foil, embossing & spot gloss varnish</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-zinc-400" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleUpdatePrototypingStage("QC Inspection")}
                        className="w-full p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-left hover:border-brand-500 hover:bg-brand-50/20 transition-all cursor-pointer flex items-center justify-between"
                      >
                        <div>
                          <span className="block font-bold text-xs text-zinc-800 dark:text-zinc-200">4. Physical QC Tolerance Check</span>
                          <span className="text-[10px] text-zinc-400">Caliper & spine tolerance test passed</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-zinc-400" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Full Resolution Image Lightbox Modal */}
      {selectedPreviewImage && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Reference photo preview"
          className="fixed inset-0 z-[60] bg-zinc-950/90 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6"
          onClick={() => setSelectedPreviewImage(null)}
        >
          <div
            className="relative w-full max-w-6xl max-h-[94vh] bg-zinc-950 rounded-xl overflow-hidden border border-white/15 shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white truncate">
                  {selectedPreviewIndex >= 0 ? previewableImages[selectedPreviewIndex].name : "Reference photo"}
                </p>
                <p className="text-[10px] text-zinc-400 mt-0.5">
                  {selectedPreviewIndex >= 0 ? `${selectedPreviewIndex + 1} of ${previewableImages.length}` : "Preview"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPreviewImage(null)}
                aria-label="Close image preview"
                className="h-8 w-8 rounded-md flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Close preview (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="relative min-h-0 flex-1 p-3 sm:p-6 flex items-center justify-center">
              <img
                src={selectedPreviewImage}
                alt={selectedPreviewIndex >= 0 ? previewableImages[selectedPreviewIndex].name : "Enlarged reference preview"}
                className="max-w-full max-h-[78vh] object-contain rounded-lg"
              />
              {previewableImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => movePreview(-1)}
                    aria-label="Previous reference photo"
                    className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/10 border border-white/15 text-white hover:bg-white/20 transition-colors cursor-pointer"
                  >
                    <span aria-hidden="true" className="text-2xl leading-none">‹</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => movePreview(1)}
                    aria-label="Next reference photo"
                    className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/10 border border-white/15 text-white hover:bg-white/20 transition-colors cursor-pointer"
                  >
                    <span aria-hidden="true" className="text-2xl leading-none">›</span>
                  </button>
                </>
              )}
            </div>
            <div className="flex items-center justify-between px-4 py-3 border-t border-white/10 text-[10px] text-zinc-400">
              <span>Use ← / → to browse</span>
              <span>Press Esc to close</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SamplingTeamDesk;
