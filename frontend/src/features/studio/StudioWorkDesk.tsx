import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { fetchStudioDielinesApi, updateStudioDielineApi } from "@/infrastructure/api/downstreamApi";
import { fetchSampleRequestsApi } from "@/infrastructure/api/sampleRequestsApi";
import { useBusinessYear } from "@/context/BusinessYearContext";
import type { UserProfile } from "@/features/auth";
import type { SampleRequestItem } from "@/features/sample-requests/types";
import { MockupWorkflowInspectorModal } from "@/features/sample-requests/components/staging/MockupWorkflowInspectorModal";
import { MockupWorkflowQueuePage } from "@/features/sample-requests/components/staging/MockupWorkflowQueuePage";
import { DielineItem } from "./types";
import { StudioArtworkPage } from "./StudioArtworkPage";
import { StudioInspectorModal } from "./StudioInspectorModal";

export interface StudioWorkDeskProps {
  user?: UserProfile | null;
}

export const StudioWorkDesk: React.FC<StudioWorkDeskProps> = ({ user }) => {
  const location = useLocation();
  const { selectedYear } = useBusinessYear();

  // Studio opens directly into its real mockup handoff queue.
  const activeView: "mockup" | "sampling" = useMemo(() => {
    const path = location.pathname.toLowerCase();
    if (path.includes("/sampling") || path.includes("/prepress") || path.includes("/tooling")) {
      return "sampling";
    }
    return "mockup";
  }, [location.pathname]);

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
  const [dielines, setDielines] = useState<DielineItem[]>([]);
  const [mockupRequests, setMockupRequests] = useState<SampleRequestItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Inspector state
  const [selectedDieline, setSelectedDieline] = useState<DielineItem | null>(null);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [selectedMockupRequest, setSelectedMockupRequest] = useState<SampleRequestItem | null>(null);
  const [isMockupInspectorOpen, setIsMockupInspectorOpen] = useState(false);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }, []);

  // Keep the legacy tooling data separate from the real mockup handoff queue.
  const loadDielines = useCallback(async () => {
    setIsLoading(true);
    try {
      const [live, sampleRequests] = await Promise.all([
        activeView === "sampling" ? fetchStudioDielinesApi().catch(() => []) : Promise.resolve([]),
        activeView === "mockup" ? fetchSampleRequestsApi(selectedYear).catch(() => []) : Promise.resolve([]),
      ]);
      setDielines((Array.isArray(live) ? live : []).filter(
        (d) => !String(d.id || "").startsWith("DL-2024-") && !String(d.srNumber || "").startsWith("SR-25-")
      ));
      setMockupRequests((Array.isArray(sampleRequests) ? sampleRequests : []).filter((request) => {
        const isMockup = (request.requestTypes || []).includes("mockup") || String(request.mockupRequired || "").toLowerCase() === "yes";
        return isMockup && request.mockupWorkflowState?.stage === "studio";
      }));
    } catch (err) {
      console.error("Failed to load studio dielines:", err);
      setDielines([]);
    } finally {
      setIsLoading(false);
    }
  }, [activeView, selectedYear]);

  useEffect(() => {
    loadDielines();
  }, [loadDielines]);

  useEffect(() => {
    const handleFocus = () => void loadDielines();
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [loadDielines]);

  useEffect(() => {
    const handleRefresh = (event: Event) => {
      event.preventDefault();
      void loadDielines().finally(() => window.dispatchEvent(new Event("app:refresh-complete")));
    };
    window.addEventListener("app:refresh-requested", handleRefresh);
    return () => window.removeEventListener("app:refresh-requested", handleRefresh);
  }, [loadDielines]);

  const handleUpdateStatus = async (id: string, newStatus: DielineItem["status"]) => {
    try {
      await updateStudioDielineApi(id, { status: newStatus });
      setDielines((prev) =>
        prev.map((d) => (d.id === id ? { ...d, status: newStatus } : d))
      );
      if (selectedDieline && selectedDieline.id === id) {
        setSelectedDieline((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
      showToast(`✓ Dieline status updated to "${newStatus}"!`);
      setIsInspectorOpen(false);
    } catch {
      showToast("Error updating dieline status");
    }
  };

  const handleExportCSV = () => {
    const headers = [
      "Dieline Code",
      "Title",
      "Client",
      "Box Format",
      "Dimensions",
      "Substrate",
      "Caliper Microns",
      "Machine",
      "Status",
      "Due Date",
      "Plant",
    ];
    const rows = dielines.map((d) => [
      `"${d.dielineCode}"`,
      `"${d.title}"`,
      `"${d.client}"`,
      `"${d.boxFormat}"`,
      `"${d.dimensions}"`,
      `"${d.substrate}"`,
      `"${d.caliperMicrons}"`,
      `"${d.machineCompatibility}"`,
      `"${d.status}"`,
      `"${d.dueDate}"`,
      `"${d.targetPlant}"`,
    ]);
    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `navneet_studio_dielines_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported ${dielines.length} dielines to CSV`);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-[#0c0d14] text-slate-800 dark:text-zinc-100 overflow-hidden select-none relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-4 right-6 z-50 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 text-[12px] font-semibold px-4 py-2 rounded-xl shadow-xl border border-slate-700/50 flex items-center gap-2 animate-in fade-in duration-200">
          <span>{toastMessage}</span>
        </div>
      )}


      {/* Active Sub-View Body */}
      {activeView === "mockup" && (
        <MockupWorkflowQueuePage
          requests={mockupRequests}
          role="studio"
          isLoading={isLoading}
          onRefresh={loadDielines}
          onInspect={(request) => {
            setSelectedMockupRequest(request);
            setIsMockupInspectorOpen(true);
          }}
        />
      )}
      {activeView === "sampling" && (
        <StudioArtworkPage
          dielines={dielines}
          mode="sampling"
          selectedYear={selectedYear}
          selectedPlant={selectedPlant}
          onInspectDieline={(dieline) => {
            setSelectedDieline(dieline);
            setIsInspectorOpen(true);
          }}
          onExportCSV={handleExportCSV}
          onRefresh={loadDielines}
        />
      )}

      {/* Dieline Inspector Modal */}
      <StudioInspectorModal
        isOpen={isInspectorOpen}
        onClose={() => setIsInspectorOpen(false)}
        dieline={selectedDieline}
        onUpdateStatus={handleUpdateStatus}
      />
      <MockupWorkflowInspectorModal
        request={selectedMockupRequest}
        role="studio"
        actorName={user?.name || user?.userid}
        onClose={() => setIsMockupInspectorOpen(false)}
        onRefresh={loadDielines}
      />
    </div>
  );
};

export default StudioWorkDesk;
