import React, { useState, useEffect, useCallback, useMemo } from "react";
import { UserProfile } from "@/features/auth";
import { useBusinessYear } from "@/context/BusinessYearContext";
import { usePlant } from "@/context/PlantContext";
import { SampleRequestItem } from "@/features/sample-requests/types";
import { fetchAllMarketingRequestsApi } from "@/infrastructure/api";
import { updateProgramRequestStatusApi } from "@/infrastructure/api/programsApi";
import { PlantProgramPlanningView } from "./PlantProgramPlanningView";
import { CheckCircle2 } from "lucide-react";

const ProgramPlanningInspectorModal = React.lazy(() =>
  import("@/features/sample-requests/programs/components/ProgramPlanningInspectorModal").then((m) => ({
    default: m.ProgramPlanningInspectorModal,
  }))
);

export interface PlantExecutionDeskProps {
  user?: UserProfile | null;
}

export const PlantExecutionDesk: React.FC<PlantExecutionDeskProps> = ({ user }) => {
  const { selectedYear } = useBusinessYear();
  const { selectedPlant } = usePlant();

  const isAdmin =
    String(user?.role || "").toLowerCase() === "admin" ||
    user?.userid === "admin" ||
    user?.role === "Administrator";

  const [requests, setRequests] = useState<SampleRequestItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProgramForReview, setSelectedProgramForReview] = useState<SampleRequestItem | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }, []);

  // Load requests from backend
  const loadRequests = useCallback(async () => {
    setIsLoading(true);
    try {
      const merged = await fetchAllMarketingRequestsApi(selectedYear);
      setRequests(merged);
    } catch (err) {
      console.error("Failed to load requests for plant execution desk:", err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedYear]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  // Listen to refresh events and data mutations
  useEffect(() => {
    const handleRequestsChanged = () => {
      void loadRequests();
    };
    const handleRefreshRequested = (e: Event) => {
      e.preventDefault();
      void loadRequests().finally(() => {
        window.dispatchEvent(new Event("app:refresh-complete"));
      });
    };

    window.addEventListener("samp:requests-changed", handleRequestsChanged);
    window.addEventListener("app:refresh-requested", handleRefreshRequested);

    return () => {
      window.removeEventListener("samp:requests-changed", handleRequestsChanged);
      window.removeEventListener("app:refresh-requested", handleRefreshRequested);
    };
  }, [loadRequests]);

  // Advance program status directly
  const handleAdvancePlantStatus = async (req: SampleRequestItem, nextStatus: string) => {
    if (!req.id) return;
    try {
      await updateProgramRequestStatusApi(req.id, nextStatus);
      await loadRequests();
      window.dispatchEvent(new CustomEvent("samp:requests-changed"));
    } catch (err) {
      console.error("Failed to update plant status:", err);
      throw err;
    }
  };

  // Derive unique plant options present in data
  const uniquePlants = useMemo(() => {
    const set = new Set<string>();
    requests.forEach((r) => {
      if (r.targetPlant?.trim()) set.add(r.targetPlant.trim());
    });
    return Array.from(set).sort();
  }, [requests]);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-[#0c0d14] text-slate-800 dark:text-zinc-100 select-text overflow-hidden">
      {/* ── Toast Notification Pill ── */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-semibold shadow-2xl">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ── Focused Plant Seasonal Program Planning Workbench ── */}
      <PlantProgramPlanningView
        requests={requests}
        isLoading={isLoading}
        selectedPlant={selectedPlant}
        uniquePlants={uniquePlants}
        user={user}
        isAdmin={isAdmin}
        onInspectRequest={(req) => setSelectedProgramForReview(req)}
        onRefresh={loadRequests}
        showToast={showToast}
        onAdvancePlantStatus={handleAdvancePlantStatus}
      />

      {/* ── Program Planning Inspector Modal (Plant Execution Mode) ── */}
      <React.Suspense fallback={null}>
        <ProgramPlanningInspectorModal
          request={selectedProgramForReview}
          isOpen={Boolean(selectedProgramForReview)}
          onClose={() => setSelectedProgramForReview(null)}
          onRefresh={loadRequests}
          mode="plant"
          userRole={user?.role || "Plant Production Manager"}
          currentUser={user}
        />
      </React.Suspense>
    </div>
  );
};

export default PlantExecutionDesk;
