import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { UserProfile } from "@/features/auth";
import { SampleRequestItem, ProgramMaterialItem } from "./types";
import {
  fetchAllMarketingRequestsApi,
  createSampleRequestApi,
  createFeasibilityRequestApi,
  recordFeasibilityMarketingDecisionApi,
  mapFeasibilityRequestToSampleRequest,
  updateSampleRequestApi,
  deleteAnyRequestApi,
  batchDeleteAnyRequestsApi,
} from "@/infrastructure/api";
import {
  getRequestTrackType,
  getRequestTrackBadge,
  getStageIdForRequest,
  isOpenFeasibilityReview,
  isDesignRequest,
} from "./utils/trackTypes";
import { useBusinessYear } from "@/context/BusinessYearContext";
import { exportRecordsToCsv } from "@/lib/csvExport";

// Modular Sub-Desks
import { MarketingOverviewPage } from "./overview/MarketingOverviewPage";
import { SamplingRequestsPage } from "./sampling/SamplingRequestsPage";
import { FeasibilityRequestsPage } from "./feasibility/FeasibilityRequestsPage";
import { ProgramPlanningPage } from "./programs/ProgramPlanningPage";

// Code-split heavy modal sheets & dialogs for fast initial load
const SampleRequestInspector = React.lazy(() =>
  import("./components/SampleRequestInspector").then((m) => ({ default: m.SampleRequestInspector }))
);
const DesignRequestInspectorModal = React.lazy(() =>
  import("./components/DesignRequestInspectorModal").then((m) => ({ default: m.DesignRequestInspectorModal }))
);
const FeasibilityInspectorModal = React.lazy(() =>
  import("./components/FeasibilityInspectorModal").then((m) => ({ default: m.FeasibilityInspectorModal }))
);
const NewSampleRequestModal = React.lazy(() =>
  import("./components/NewSampleRequestModal").then((m) => ({ default: m.NewSampleRequestModal }))
);
const NewProgramPlanningModal = React.lazy(() =>
  import("./programs/components/NewProgramPlanningModal").then((m) => ({ default: m.NewProgramPlanningModal }))
);
const ProgramPlanningInspectorModal = React.lazy(() =>
  import("./programs/components/ProgramPlanningInspectorModal").then((m) => ({ default: m.ProgramPlanningInspectorModal }))
);

// Re-export for any external consumers
export {
  getRequestTrackType,
  getRequestTrackBadge,
  getStageIdForRequest,
  isOpenFeasibilityReview,
};

export interface SampleRequestsDeskProps {
  user?: UserProfile | null;
}

export type MarketingSubView = "overview" | "sampling" | "feasibility" | "programs";

export const SampleRequestsDesk: React.FC<SampleRequestsDeskProps> = ({ user }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const isAdmin =
    String(user?.role || "").toLowerCase() === "admin" ||
    user?.userid === "admin" ||
    user?.role === "Administrator";

  const { selectedYear } = useBusinessYear();

  // Active Plant state (synced with global app:plant-changed)
  const [selectedPlant, setSelectedPlant] = useState<string>(() => {
    try {
      return localStorage.getItem("samp_active_plant") || "ALL";
    } catch {
      return "ALL";
    }
  });

  useEffect(() => {
    const handlePlantChanged = (e: Event) => {
      const customEvent = e as CustomEvent<{ plant: string; label?: string }>;
      if (customEvent.detail?.plant) {
        setSelectedPlant(customEvent.detail.plant);
      }
    };
    window.addEventListener("app:plant-changed", handlePlantChanged);
    return () => window.removeEventListener("app:plant-changed", handlePlantChanged);
  }, []);

  // Primary Data State
  const [requests, setRequests] = useState<SampleRequestItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Inspector & Modal State
  const [selectedRequest, setSelectedRequest] = useState<SampleRequestItem | null>(null);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [isDesignReviewOpen, setIsDesignReviewOpen] = useState(false);
  const [isDesignRequestInspectorOpen, setIsDesignRequestInspectorOpen] = useState(false);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isNewProgramModalOpen, setIsNewProgramModalOpen] = useState(false);
  const [modalInitialTrack, setModalInitialTrack] = useState<
    "marketing_request" | "feasibility_check" | "program_planning"
  >("feasibility_check");

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }, []);

  // Determine active view based on path or query param
  const activeView: MarketingSubView = useMemo(() => {
    const path = location.pathname;
    if (path.includes("/sampling")) return "sampling";
    if (path.includes("/feasibility")) return "feasibility";
    if (path.includes("/programs")) return "programs";

    const queryView = searchParams.get("view");
    if (queryView === "sampling") return "sampling";
    if (queryView === "feasibility") return "feasibility";
    if (queryView === "programs") return "programs";

    return "overview";
  }, [location.pathname, searchParams]);

  // Handle external navigation states (e.g. from Dashboard, Quick Actions, or Program Workspace)
  useEffect(() => {
    if ((location.state as any)?.openMarketingSetup) {
      setModalInitialTrack("marketing_request");
      setIsNewModalOpen(true);
    }
    if ((location.state as any)?.toastMessage) {
      showToast((location.state as any).toastMessage);
    }
  }, [location.state, showToast]);

  // Fetch Requests from Backend API
  const loadRequests = useCallback(async () => {
    setIsLoading(true);
    try {
      const merged = await fetchAllMarketingRequestsApi(selectedYear);
      setRequests(merged);
    } catch (err) {
      console.error("Failed to load sample requests:", err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedYear]);

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

  // Unique plants and customers dynamically derived from active DB records
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

  // Open Inspector (or route Drafts directly to Product Staging)
  const handleInspectRequest = (req: SampleRequestItem) => {
    if (getStageIdForRequest(req) === "draft") {
      const stagingContext = {
        customer: req.customer || "",
        programName: req.programName || req.productDescription || "",
        programYear: req.programYear || "2026",
        year: req.year || "2026-27",
        targetPlant: req.targetPlant || "",
        parentRequestId: req.id,
        parentSrNumber: req.srNumber || `SR-${req.id}`,
      };
      sessionStorage.setItem("samp_active_program_form", JSON.stringify(stagingContext));
      navigate("/sample-requests/product-staging", { state: stagingContext });
      return;
    }
    setSelectedRequest(req);
    if (isDesignRequest(req)) {
      setIsDesignRequestInspectorOpen(true);
      return;
    }
    setIsInspectorOpen(true);
  };

  // Open Modal with specific track
  const handleOpenNewModal = (
    track: "marketing_request" | "feasibility_check" | "program_planning" = "feasibility_check"
  ) => {
    if (track === "program_planning") {
      setIsNewProgramModalOpen(true);
      return;
    }
    setModalInitialTrack(track);
    setIsNewModalOpen(true);
  };

  // Marketing Feasibility Sign-off / Verdict Action
  const handleMarketingApproveFeasibility = async (
    requestId: string | number,
    approved: boolean,
    remark?: string
  ) => {
    const newStatus = approved ? "Approved by Marketing" : "Closed (Rejected)";
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
      await recordFeasibilityMarketingDecisionApi(requestId, {
        decision,
        decision_remark: remark || null,
      });
      await loadRequests();
    } catch (err) {
      console.error("Failed to record marketing decision to backend:", err);
    }

    showToast(
      approved
        ? `✓ Feasibility request approved and completed by Marketing.`
        : `Feasibility request closed (rejected) by Marketing.`
    );
  };

  // Delete Request from Database
  const handleDeleteRequest = async (req: SampleRequestItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (
      !window.confirm(
        `Permanently delete request ${req.srNumber} (${req.customer}) from database and reset sample codes? (Testing mode)`
      )
    )
      return;

    try {
      const ok = await deleteAnyRequestApi(req);
      if (ok) {
        if (selectedRequest?.id === req.id) {
          setIsInspectorOpen(false);
          setSelectedRequest(null);
        }
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

  // Batch Delete Selected Requests
  const handleBatchDelete = async (selectedIds: Set<string | number>) => {
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
      if (selectedRequest && selectedIds.has(selectedRequest.id)) {
        setIsInspectorOpen(false);
        setSelectedRequest(null);
      }
      await loadRequests();
      showToast(`✓ ${selectedList.length} request(s) deleted and sample codes reset.`);
    } catch (err) {
      console.error("Failed to batch delete requests:", err);
      showToast("Error deleting selected requests from database.");
    }
  };

  // Direct Status Update Handler (for quick status change)
  const handleUpdateStatus = async (reqId: string | number, newStatus: string) => {
    setRequests((prev) =>
      prev.map((r) =>
        String(r.id) === String(reqId) ? { ...r, status: newStatus } : r
      )
    );
    if (selectedRequest && String(selectedRequest.id) === String(reqId)) {
      setSelectedRequest((prev) => (prev ? { ...prev, status: newStatus } : null));
    }
    try {
      await updateSampleRequestApi(reqId, { status: newStatus });
      await loadRequests();
      showToast(`✓ Request status updated to "${newStatus}"`);
    } catch (err) {
      console.error("Failed to update request status:", err);
      showToast("Error updating request status.");
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
          String(r.id) === String(requestItem.id) ? { ...r, status: newStatus } : r
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

  // Batch Release Draft Requests
  const handleBatchReleaseDraft = async (selectedIds: Set<string | number>) => {
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
  const handleCreateRequest = async (
    newForm: Partial<SampleRequestItem>
  ): Promise<boolean | SampleRequestItem> => {
    if (newForm.creationMode === "feasibility_check") {
      try {
        const created = await createFeasibilityRequestApi({
          customer: newForm.customer || "",
          feasibilityType: newForm.feasibilityType || "new_category",
          customFeasibilityType: newForm.customFeasibilityType,
          descriptionNotes: (newForm as any).descriptionNotes || newForm.feasibilityDescription || newForm.productDescription || "",
          requiredDate: newForm.sampleRequiredDate || "",
          marketingRemarks: newForm.marketingRemarks,
          referenceImages: newForm.referenceImages || [],
          referenceImageNames: newForm.referenceImageNames || [],
          referenceLinks: newForm.referenceLinks || [],
        });
        setRequests((prev) => [mapFeasibilityRequestToSampleRequest(created), ...prev]);
        showToast(`Feasibility ${created.requestCode} registered with ${created.srNumber}.`);
        return true;
      } catch (err) {
        console.error("Error creating feasibility request:", err);
        showToast(err instanceof Error ? err.message : "The feasibility request could not be saved.");
        return false;
      }
    }

    const payload: any = {
      ...newForm,
      createdAt: new Date().toISOString(),
    };

    try {
      const created = await createSampleRequestApi(payload);
      if (created) {
        setRequests((prev) => [created, ...prev]);
      } else {
        showToast("The sample request could not be saved to the backend.");
        return false;
      }
      showToast(`Sample Request ${created.srNumber} registered successfully!`);
      return created;
    } catch (err) {
      console.error("Error creating request:", err);
      showToast("The sample request could not be saved to the backend.");
      return false;
    }
  };

  const handleMaterialsUpdated = (
    requestId: string | number,
    updatedMaterials: ProgramMaterialItem[]
  ) => {
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
    if (requests.length === 0) return;
    const dateStr = new Date().toISOString().split("T")[0];
    exportRecordsToCsv({
      filename: `sample_requests_${dateStr}.csv`,
      columns: [
        { header: "Sample Code", accessor: (r) => r.srNumber },
        { header: "Material Code", accessor: (r) => r.materialCode },
        { header: "Product Description", accessor: (r) => r.productDescription },
        { header: "Customer", accessor: (r) => r.customer },
        { header: "Plant / Queue", accessor: (r) => r.targetPlant },
        { header: "Request Date", accessor: (r) => r.dateRequestCreated },
        { header: "Required Date", accessor: (r) => r.sampleRequiredDate },
        { header: "Status", accessor: (r) => r.status },
        { header: "Feasibility (Plant)", accessor: (r) => r.plantFeasibilityResponse || "Pending" },
        { header: "Feasibility (SAMP)", accessor: (r) => r.samplingFeasibilityResponse || "Pending" },
      ],
      data: requests,
    });
    showToast(`Exported ${requests.length} records to CSV`);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#fafafa] dark:bg-[#08090d] overflow-hidden select-none relative">
      {/* Toast Notification Popup */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-[100] max-w-md bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-[12px] font-semibold px-4 py-3 rounded-2xl shadow-2xl border border-zinc-700/50 dark:border-zinc-300 flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-3 duration-200"
        >
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Render Active Sub-Page */}
      {activeView === "overview" && (
        <MarketingOverviewPage
          requests={requests}
          isLoading={isLoading}
          selectedYear={selectedYear}
          selectedPlant={selectedPlant}
          onOpenNewModal={handleOpenNewModal}
          onInspectRequest={handleInspectRequest}
          onExportCSV={handleExportCSV}
        />
      )}

      {activeView === "sampling" && (
        <SamplingRequestsPage
          requests={requests}
          isLoading={isLoading}
          selectedYear={selectedYear}
          selectedPlant={selectedPlant}
          uniquePlants={uniquePlants}
          uniqueCustomers={uniqueCustomers}
          user={user}
          isAdmin={isAdmin}
          onOpenNewModal={() => handleOpenNewModal("marketing_request")}
          onInspectRequest={handleInspectRequest}
          onReleaseDraft={handleReleaseDraft}
          onBatchReleaseDraft={handleBatchReleaseDraft}
          onDeleteRequest={handleDeleteRequest}
          onBatchDelete={handleBatchDelete}
          onRefresh={loadRequests}
          onExportCSV={handleExportCSV}
          onUpdateStatus={handleUpdateStatus}
          showToast={showToast}
        />
      )}

      {activeView === "feasibility" && (
        <FeasibilityRequestsPage
          requests={requests}
          isLoading={isLoading}
          selectedYear={selectedYear}
          selectedPlant={selectedPlant}
          uniquePlants={uniquePlants}
          uniqueCustomers={uniqueCustomers}
          user={user}
          isAdmin={isAdmin}
          onOpenNewModal={() => handleOpenNewModal("feasibility_check")}
          onInspectRequest={handleInspectRequest}
          onMarketingApproveFeasibility={handleMarketingApproveFeasibility}
          onDeleteRequest={handleDeleteRequest}
          onBatchDelete={handleBatchDelete}
          onRefresh={loadRequests}
          onExportCSV={handleExportCSV}
          onUpdateStatus={handleUpdateStatus}
        />
      )}

      {activeView === "programs" && (
        <ProgramPlanningPage
          requests={requests}
          isLoading={isLoading}
          selectedYear={selectedYear}
          selectedPlant={selectedPlant}
          uniquePlants={uniquePlants}
          uniqueCustomers={uniqueCustomers}
          user={user}
          isAdmin={isAdmin}
          onOpenNewModal={() => handleOpenNewModal("program_planning")}
          onInspectRequest={handleInspectRequest}
          onDeleteRequest={handleDeleteRequest}
          onRefresh={loadRequests}
        />
      )}

      {/* Master Detail Inspector Drawer & Dialog Modals */}
      <React.Suspense fallback={null}>
        {selectedRequest && isDesignRequest(selectedRequest) ? (
          <DesignRequestInspectorModal
            request={selectedRequest}
            isOpen={isDesignRequestInspectorOpen || isDesignReviewOpen}
            onClose={() => {
              setIsDesignRequestInspectorOpen(false);
              setIsDesignReviewOpen(false);
            }}
            onRefresh={loadRequests}
            mode="marketing"
            showToast={showToast}
          />
        ) : selectedRequest && getRequestTrackType(selectedRequest) === "feasibility_check" ? (
          <FeasibilityInspectorModal
            request={selectedRequest}
            isOpen={isInspectorOpen}
            onClose={() => setIsInspectorOpen(false)}
            onMarketingApprove={handleMarketingApproveFeasibility}
            onDeleteRequest={(req) => handleDeleteRequest(req)}
            user={user}
            isAdmin={isAdmin}
            sourceDesk="marketing"
          />
        ) : selectedRequest && getRequestTrackType(selectedRequest) === "program_planning" ? (
          <ProgramPlanningInspectorModal
            request={selectedRequest}
            isOpen={isInspectorOpen}
            onClose={() => setIsInspectorOpen(false)}
            onRefresh={loadRequests}
            mode="marketing"
            userRole="Marketing Specialist"
            currentUser={user}
          />
        ) : (
          <SampleRequestInspector
            request={selectedRequest}
            isOpen={isInspectorOpen}
            onClose={() => setIsInspectorOpen(false)}
            onMarketingApprove={handleMarketingApproveFeasibility}
            onMaterialsUpdated={handleMaterialsUpdated}
            onDeleteRequest={(req) => handleDeleteRequest(req)}
            onReleaseDraft={handleReleaseDraft}
            isAdmin={isAdmin}
          />
        )}

        {/* New Sample Request Modal */}
        <NewSampleRequestModal
          isOpen={isNewModalOpen}
          onClose={() => {
            setIsNewModalOpen(false);
            setModalInitialTrack("feasibility_check");
          }}
          onSubmit={handleCreateRequest}
          initialTrack={modalInitialTrack}
          lockTrack={activeView !== "overview"}
          requestCreatedBy={user?.name || user?.userid}
        />

        {/* New Seasonal Program Planning Modal */}
        <NewProgramPlanningModal
          isOpen={isNewProgramModalOpen}
          onClose={() => setIsNewProgramModalOpen(false)}
          onProceed={(params) => {
            setIsNewProgramModalOpen(false);
            navigate("/sample-requests/program-planning", { state: params });
          }}
        />
      </React.Suspense>
    </div>
  );
};

export default SampleRequestsDesk;
