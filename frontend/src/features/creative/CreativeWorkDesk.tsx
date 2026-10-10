import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { UserProfile } from "@/features/auth";
import { fetchCreativeBriefsApi } from "@/infrastructure/api/downstreamApi";
import { fetchAllMarketingRequestsApi } from "@/infrastructure/api/sampleRequestsApi";
import { useBusinessYear } from "@/context/BusinessYearContext";
import { CreativeBriefItem, SampleRequestItem } from "@/features/sample-requests/types";
import { CreativeOverviewPage } from "./CreativeOverviewPage";
import { CreativeDesignPage } from "./CreativeDesignPage";
import { MockupWorkflowQueuePage } from "@/features/sample-requests/components/staging/MockupWorkflowQueuePage";
import { MockupWorkflowInspectorModal } from "@/features/sample-requests/components/staging/MockupWorkflowInspectorModal";
import { getRequestTrackType } from "@/features/sample-requests/utils/trackTypes";

const DesignRequestInspectorModal = React.lazy(() =>
  import("@/features/sample-requests/components/DesignRequestInspectorModal").then((m) => ({
    default: m.DesignRequestInspectorModal,
  }))
);

export interface CreativeWorkDeskProps {
  user?: UserProfile | null;
}

export const CreativeWorkDesk: React.FC<CreativeWorkDeskProps> = ({ user }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { selectedYear } = useBusinessYear();

  // Active sub-view: "overview" | "design" | "sampling"
  const activeView: "overview" | "design" | "sampling" = useMemo(() => {
    const path = location.pathname.toLowerCase();
    if (path.includes("/design")) return "design";
    if (path.includes("/sampling") || path.includes("/mockup")) return "sampling";
    return "overview";
  }, [location.pathname]);

  const handleSelectTab = (tab: "overview" | "design" | "sampling") => {
    if (tab === "overview") navigate("/creative-work");
    else if (tab === "design") navigate("/creative-work/design");
    else if (tab === "sampling") navigate("/creative-work/sampling");
  };

  // Plant state
  const [selectedPlant, setSelectedPlant] = useState<string>(() => {
    try {
      return localStorage.getItem("samp_active_plant") || "ALL";
    } catch {
      return "ALL";
    }
  });

  useEffect(() => {
    const handlePlantChanged = (e: Event) => {
      const customEvent = e as CustomEvent<{ plant: string }>;
      if (customEvent.detail?.plant) {
        setSelectedPlant(customEvent.detail.plant);
      }
    };
    window.addEventListener("app:plant-changed", handlePlantChanged);
    return () => window.removeEventListener("app:plant-changed", handlePlantChanged);
  }, []);

  // Data state
  const [briefs, setBriefs] = useState<CreativeBriefItem[]>([]);
  const [allRequests, setAllRequests] = useState<SampleRequestItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Inspector states
  const [selectedRequest, setSelectedRequest] = useState<SampleRequestItem | null>(null);
  const [isDesignInspectorOpen, setIsDesignInspectorOpen] = useState(false);
  const [isMockupInspectorOpen, setIsMockupInspectorOpen] = useState(false);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }, []);

  // Load briefs & sample requests
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [liveBriefs, requests] = await Promise.all([
        fetchCreativeBriefsApi().catch(() => []),
        fetchAllMarketingRequestsApi(selectedYear),
      ]);

      const cleanBriefs = (Array.isArray(liveBriefs) ? liveBriefs : []).filter(
        (b) => !String(b.id || "").startsWith("CB-2024-") && !String(b.srNumber || "").startsWith("SR-25-")
      );
      const cleanRequests = (Array.isArray(requests) ? requests : []).filter(
        (r) => !String(r.srNumber || "").startsWith("SR-25-0001")
      );

      setBriefs(cleanBriefs);
      setAllRequests(cleanRequests);
    } catch (err) {
      console.error("Failed to load creative data:", err);
      showToast("Could not load design requests from the backend. Retry in a moment.");
    } finally {
      setIsLoading(false);
    }
  }, [selectedYear, showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const handleFocus = () => void loadData();
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [loadData]);

  useEffect(() => {
    const handleRefresh = (event: Event) => {
      event.preventDefault();
      void loadData().finally(() => window.dispatchEvent(new Event("app:refresh-complete")));
    };
    window.addEventListener("app:refresh-requested", handleRefresh);
    return () => window.removeEventListener("app:refresh-requested", handleRefresh);
  }, [loadData]);

  // Design scoped requests
  const designRequests = useMemo(() => {
    return allRequests.filter((r) => {
      const srCode = String(r.srNumber || "").toUpperCase();
      const materialCode = String(r.materialCode || "").toUpperCase();
      if (getRequestTrackType(r) === "program_planning" || r.requestKind === "program" || srCode.startsWith("PG-") || materialCode.startsWith("PG-")) return false;
      const scopes = r.requestTypes || [];
      const s = String(r.status || "").toLowerCase();
      // Exclude unreleased drafts - only show once released to Creative
      if (s.includes("draft") || s.includes("smt") || s.includes("pending allocation")) return false;

      const code = String(r.materialCode || "");
      const designState = String(r.designRequestStatus || r.status || "").toLowerCase();
      if (r.marketingDesignDecision === "awaiting_marketing_review" || r.marketingDesignDecision === "accepted" || designState.includes("approved / closed")) return false;
      return (
        scopes.includes("design") ||
        s.includes("creative") ||
        code.startsWith("DSG-") ||
        r.requestKind === "design"
      );
    });
  }, [allRequests]);

  // Sampling & Mockup requests (come together)
  const samplingMockupRequests = useMemo(() => {
    return allRequests.filter((r) => {
      const srCode = String(r.srNumber || "").toUpperCase();
      const materialCode = String(r.materialCode || "").toUpperCase();
      if (
        getRequestTrackType(r) === "program_planning" ||
        r.requestKind === "program" ||
        r.creationMode === "program_planning" ||
        srCode.includes("-PG-") ||
        srCode.startsWith("PG-") ||
        materialCode.startsWith("PG-")
      ) {
        return false;
      }
      const s = String(r.status || "").toLowerCase();
      // Exclude unreleased drafts
      if (s.includes("draft") || s.includes("smt") || s.includes("pending allocation")) return false;

      const scopes = r.requestTypes || [];
      const hasMockup = scopes.includes("mockup") || String(r.mockupRequired || "").toLowerCase() === "yes";
      return hasMockup && r.mockupWorkflowState?.stage === "creative";
    });
  }, [allRequests]);

  // Counts for tabs
  const designCount = briefs.length + designRequests.length;
  const samplingMockupCount = samplingMockupRequests.length;

  // Handlers for Inspect
  const handleInspectDesignRequest = (req: SampleRequestItem) => {
    setSelectedRequest(req);
    setIsDesignInspectorOpen(true);
  };

  const handleInspectBrief = (brief: CreativeBriefItem) => {
    const adapted: SampleRequestItem = {
      id: brief.id,
      srNumber: brief.srNumber || brief.artCode,
      productDescription: brief.title,
      customer: brief.brand,
      programName: (brief as any).programName || "",
      programYear: "",
      year: "",
      dateRequestCreated: "",
      createdBy: (brief as any).createdBy || "",
      targetPlant: "",
      createdAt: "",
      sampleRequiredDate: brief.dueDate,
      status: brief.proofStatus,
      materialCode: brief.artCode,
      requestTypes: ["design"],
      requestKind: "design",
      numberOfDesigns: brief.variantsCount,
      designRemarks: (brief as any).designRemarks || "",
      targetAudience: (brief as any).targetAudience || "",
      trend: (brief as any).trend || "",
      designRequestStatus: brief.proofStatus,
    };
    setSelectedRequest(adapted);
    setIsDesignInspectorOpen(true);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white text-slate-800 overflow-hidden select-none relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[100] bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 text-[12px] font-semibold px-4 py-2.5 rounded-xl shadow-2xl border border-slate-700/50 flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Active Sub-View Body */}
      {activeView === "overview" && (
        <CreativeOverviewPage
          briefs={briefs}
          designRequests={designRequests}
          samplingMockupRequests={samplingMockupRequests}
          isLoading={isLoading}
          selectedYear={selectedYear}
          selectedPlant={selectedPlant}
          onNavigateToTab={(tab) => handleSelectTab(tab)}
          onInspectBrief={handleInspectBrief}
          onInspectRequest={(req) => {
            setSelectedRequest(req);
            setIsMockupInspectorOpen(true);
          }}
        />
      )}

      {activeView === "design" && (
        <CreativeDesignPage
          briefs={briefs}
          designRequests={designRequests}
          selectedYear={selectedYear}
          onInspectBrief={handleInspectBrief}
          onInspectRequest={handleInspectDesignRequest}
        />
      )}

      {activeView === "sampling" && (
        <MockupWorkflowQueuePage
          requests={samplingMockupRequests}
          role="creative"
          isLoading={isLoading}
          onRefresh={loadData}
          onInspect={(req: SampleRequestItem) => {
            setSelectedRequest(req);
            setIsMockupInspectorOpen(true);
          }}
        />
      )}

      {/* Modals & Inspectors */}
      <React.Suspense fallback={null}>
        {selectedRequest && isMockupInspectorOpen && (
          <MockupWorkflowInspectorModal
            request={selectedRequest}
            role="creative"
            actorName={user?.name || user?.userid}
            onClose={() => setIsMockupInspectorOpen(false)}
            onRefresh={loadData}
          />
        )}
        {selectedRequest && isDesignInspectorOpen && (
          <DesignRequestInspectorModal
            request={selectedRequest}
            isOpen={isDesignInspectorOpen}
            onClose={() => setIsDesignInspectorOpen(false)}
            onRefresh={loadData}
            mode="creative"
            showToast={showToast}
          />
        )}
      </React.Suspense>
    </div>
  );
};

export default CreativeWorkDesk;
