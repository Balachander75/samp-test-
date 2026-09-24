import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { SampleRequestItem } from "../types";
import {
  fetchSampleRequestsApi,
  fetchDesignRequestsApi,
  mapDesignRequestToSampleRequest,
  updateSampleRequestApi,
  deleteSampleRequestApi,
  deleteDesignRequestApi,
  fetchProductDetailsApi,
  ProductDetailItem,
} from "../api";
import { PlantManagementModal } from "./PlantManagementModal";
import { SampleRequestsStatsGrid, DetailedStageCounts } from "./SampleRequestsStatsGrid";
import { SampleRequestsFilterBar } from "./SampleRequestsFilterBar";
import { SampleRequestsTable } from "./SampleRequestsTable";
import { DraftPackagesView } from "./DraftPackagesView";
import { ProductSpecificationsDrawer } from "./ProductSpecificationsDrawer";
import { UserProfileInfo } from "@/features/dashboard";
import { Check } from "@/components/ui/icons";

interface SampleRequestsViewProps {
  user?: UserProfileInfo | null;
  onNavigateCreate?: () => void;
  onRegisterRefresh?: (fn: () => void) => void;
  onRefreshingChange?: (refreshing: boolean) => void;
}

const STAGE_TABS = [
  "All",
  "Draft (Pre-SMT)",
  "Creative",
  "Studio",
  "SAMP",
  "In Plant Work",
  "Dispatched / Closed",
  "Actual Deal",
];

export const SampleRequestsView: React.FC<SampleRequestsViewProps> = ({
  user,
  onNavigateCreate,
  onRegisterRefresh,
  onRefreshingChange,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = String(user?.role || "").toLowerCase() === "admin" || user?.userid === "admin";

  const initialTab = (location.state as { initialFilterTab?: string } | null)?.initialFilterTab;
  const [requests, setRequests] = useState<SampleRequestItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterTab, setFilterTab] = useState<string>(() => {
    if (initialTab && STAGE_TABS.includes(initialTab)) return initialTab;
    return "All";
  });
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (initialTab && STAGE_TABS.includes(initialTab)) {
      setFilterTab(initialTab);
    }
  }, [initialTab]);

  // Modals & Inspection State
  const [isPlantModalOpen, setIsPlantModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<SampleRequestItem | null>(null);
  const [requestDetails, setRequestDetails] = useState<ProductDetailItem[]>([]);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;

  const loadRequests = useCallback(async () => {
    setIsLoading(true);
    try {
      const [sampleRequests, designRequests] = await Promise.all([
        fetchSampleRequestsApi(),
        fetchDesignRequestsApi(),
      ]);
      setRequests([
        ...sampleRequests,
        ...designRequests.map(mapDesignRequestToSampleRequest),
      ].sort((a, b) => {
        const dateA = new Date(a.createdAt || a.dateRequestCreated || 0).getTime();
        const dateB = new Date(b.createdAt || b.dateRequestCreated || 0).getTime();
        return dateB - dateA;
      }));
    } catch (err) {
      console.error("Failed to load sample requests:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  useEffect(() => {
    if (onRegisterRefresh) {
      onRegisterRefresh(loadRequests);
    }
  }, [loadRequests, onRegisterRefresh]);

  useEffect(() => {
    if (onRefreshingChange) {
      onRefreshingChange(isLoading);
    }
  }, [isLoading, onRefreshingChange]);

  // Stage KPI Counts (Detailed for all 8 stages)
  const stageCounts: DetailedStageCounts = useMemo(() => {
    let draft = 0;
    let creative = 0;
    let studio = 0;
    let samp = 0;
    let inPlant = 0;
    let dispatched = 0;
    let actualDeal = 0;

    requests.forEach((r) => {
      const s = (r.status || "").toLowerCase();
      if (s.includes("draft") || s.includes("smt")) draft++;
      else if (s.includes("creative")) creative++;
      else if (s.includes("studio")) studio++;
      else if (s.includes("samp") || s.includes("review") || s.includes("pmt") || s.includes("qc")) samp++;
      else if (s.includes("plant") || s.includes("execution")) inPlant++;
      else if (s.includes("dispatch") || s.includes("close")) dispatched++;
      else if (s.includes("deal") || s.includes("actual")) actualDeal++;
      else draft++;
    });

    return {
      all: requests.length,
      draft,
      creative,
      studio,
      samp,
      inPlant,
      dispatched,
      actualDeal,
    };
  }, [requests]);

  // Map of counts per each STAGE_TAB for filter chips
  const stageCountsMap = useMemo(() => {
    const map: Record<string, number> = { All: requests.length };
    STAGE_TABS.forEach((tab) => {
      if (tab === "All") return;
      map[tab] = requests.filter((r) => {
        const s = (r.status || "").toLowerCase();
        if (tab === "In Plant Work") {
          return ["creative", "studio", "samp", "in plant", "execution"].some((term) => s.includes(term));
        } else if (tab === "Dispatched / Closed") {
          return s.includes("dispatch") || s.includes("close");
        } else if (tab === "Actual Deal") {
          return s.includes("deal") || s.includes("actual");
        } else {
          return s.includes(tab.toLowerCase());
        }
      }).length;
    });
    return map;
  }, [requests]);

  // Filtered requests based on search and tab
  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      // Stage Tab Filter
      if (filterTab !== "All") {
        const s = (r.status || "").toLowerCase();
        if (filterTab === "In Plant Work") {
          if (!["creative", "studio", "samp", "in plant", "execution"].some((term) => s.includes(term)))
            return false;
        } else if (filterTab === "Dispatched / Closed") {
          if (!s.includes("dispatch") && !s.includes("close")) return false;
        } else if (filterTab === "Actual Deal") {
          if (!s.includes("deal") && !s.includes("actual")) return false;
        } else {
          if (!s.includes(filterTab.toLowerCase())) return false;
        }
      }

      // Search Filter
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const mat = (r.materialCode || "").toLowerCase();
        const desc = (r.productDescription || "").toLowerCase();
        const sr = (r.srNumber || "").toLowerCase();
        const cust = (r.customer || "").toLowerCase();
        const plant = (r.targetPlant || "").toLowerCase();
        const createdBy = (r.createdBy || "").toLowerCase();
        const brand = (r.brandName || "").toLowerCase();
        const sku = (r.customerProductCode || "").toLowerCase();
        return (
          mat.includes(q) ||
          desc.includes(q) ||
          sr.includes(q) ||
          cust.includes(q) ||
          plant.includes(q) ||
          createdBy.includes(q) ||
          brand.includes(q) ||
          sku.includes(q)
        );
      }

      return true;
    });
  }, [requests, filterTab, searchTerm]);

  // Paginated Slices
  const totalPages = Math.ceil(filteredRequests.length / pageSize) || 1;
  const paginatedRequests = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRequests.slice(start, start + pageSize);
  }, [filteredRequests, currentPage, pageSize]);

  // Reset to page 1 on filter/search change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterTab, searchTerm]);

  // Open Details Drawer
  const handleSelectRequest = async (req: SampleRequestItem) => {
    setSelectedRequest(req);
    if (req.requestKind === "design") {
      setRequestDetails([]);
      setIsLoadingDetails(false);
      return;
    }
    setIsLoadingDetails(true);
    try {
      const details = await fetchProductDetailsApi(Number(req.id), false);
      setRequestDetails(details);
    } catch (err) {
      console.error("Failed to load details for request", req.id, err);
      setRequestDetails([]);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleCloseDetails = () => {
    setSelectedRequest(null);
    setRequestDetails([]);
  };

  // Handle Feasibility Response from Plant or Sampling Team
  const handleUpdateFeasibilityResponse = async (
    requestId: string | number,
    team: "plant" | "sampling",
    response: "Yes" | "No" | "Maybe",
    remark?: string
  ) => {
    const updatedStatus = "Dispatched / Closed";
    const closedStamp = new Date().toISOString();

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
      feasibilityClosedAt: closedStamp,
      feasibilityClosedBy: team,
      status: updatedStatus,
    };

    try {
      await updateSampleRequestApi(requestId, payload as any);
    } catch {
      // Local fallback in case backend does not have specific columns
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

    setActionSuccessMessage(
      `Feasibility check closed by ${team === "plant" ? "Plant Team" : "SAMP Team"} with decision: ${response}.`
    );
    setTimeout(() => setActionSuccessMessage(null), 4000);
  };

  // Delete Request (Admin only)
  const handleDeleteRequest = async (req: SampleRequestItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete sample request ${req.srNumber}?`)) return;
    try {
      const ok = req.requestKind === "design" && req.designRequestId
        ? await deleteDesignRequestApi(req.designRequestId)
        : await deleteSampleRequestApi(Number(req.id));
      if (ok) {
        setRequests((prev) => prev.filter((r) => r.id !== req.id));
        setActionSuccessMessage(`${req.requestKind === "design" ? "Design request" : "Sample request"} ${req.srNumber} deleted successfully.`);
        setTimeout(() => setActionSuccessMessage(null), 4000);
      }
    } catch (err) {
      console.error("Failed to delete request:", err);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (filteredRequests.length === 0) return;
    const headers = [
      "Sample Code",
      "Material Code",
      "Description",
      "Customer",
      "Program",
      "Year",
      "Plant",
      "Created By",
      "Required Date",
      "Status",
    ];
    const rows = filteredRequests.map((r) => [
      `"${r.srNumber}"`,
      `"${r.materialCode}"`,
      `"${(r.productDescription || "").replace(/"/g, '""')}"`,
      `"${(r.customer || "").replace(/"/g, '""')}"`,
      `"${(r.programName || "").replace(/"/g, '""')}"`,
      `"${r.programYear || r.year || ""}"`,
      `"${r.targetPlant || ""}"`,
      `"${r.createdBy || ""}"`,
      `"${r.sampleRequiredDate || ""}"`,
      `"${r.status || ""}"`,
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
  };

  return (
    <div className="space-y-4 sm:space-y-4.5 animate-in fade-in duration-150">
      {/* Toast Notification */}
      {actionSuccessMessage && (
        <div className="fixed top-20 right-6 z-[120] flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-emerald-600 text-white shadow-xl shadow-emerald-600/30 text-xs font-semibold animate-in slide-in-from-top-4 duration-200 max-w-xs">
          <Check size={16} className="stroke-[3] shrink-0" />
          <span>{actionSuccessMessage}</span>
        </div>
      )}

      {/* 1. KPI Stats Grid */}
      <SampleRequestsStatsGrid
        stageCounts={stageCounts}
        filterTab={filterTab}
        onSelectTab={setFilterTab}
      />

      {/* 2. Filter & Actions Bar */}
      <SampleRequestsFilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onNewRequest={() => {
          sessionStorage.removeItem("samp_active_program_form");
          if (onNavigateCreate) onNavigateCreate();
          else navigate("/sample-requests/new");
        }}
        filterTab={filterTab}
        onSelectTab={setFilterTab}
        stageTabs={STAGE_TABS}
        stageCountsMap={stageCountsMap}
      />

      {/* 3. Main Stage Content: Grouped Draft Packages vs Standard Requests Table */}
      {filterTab === "Draft (Pre-SMT)" ? (
        <DraftPackagesView
          requests={requests}
          searchTerm={searchTerm}
          onOpenDraftWorkspace={(group) => {
            sessionStorage.setItem("samp_active_draft_group", JSON.stringify(group));
            navigate("/sample-requests/draft-workspace", { state: { group } });
          }}
          onRefresh={loadRequests}
          isAdmin={isAdmin}
        />
      ) : (
        /* Standard Stage Requests Table */
        <SampleRequestsTable
          requests={paginatedRequests}
          totalFilteredCount={filteredRequests.length}
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onSelectRequest={handleSelectRequest}
          onDeleteRequest={handleDeleteRequest}
          isAdmin={isAdmin}
          isLoading={isLoading}
          onResetFilters={() => {
            setSearchTerm("");
            setFilterTab("All");
          }}
        />
      )}

      {/* 4. Unified Specifications Drawer (View-Only Mode on Main Page) */}
      {selectedRequest && (
        <ProductSpecificationsDrawer
          product={selectedRequest}
          details={requestDetails}
          isLoading={isLoadingDetails}
          specMode="view"
          allowEdit={false}
          onUpdateFeasibilityResponse={handleUpdateFeasibilityResponse}
          onClose={handleCloseDetails}
        />
      )}



      {/* 6. Plant Management Modal */}
      <PlantManagementModal
        isOpen={isPlantModalOpen}
        onClose={() => setIsPlantModalOpen(false)}
        currentUser={user}
      />
    </div>
  );
};
