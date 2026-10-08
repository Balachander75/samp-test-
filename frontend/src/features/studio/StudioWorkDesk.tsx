import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { fetchStudioDielinesApi, updateStudioDielineApi } from "@/infrastructure/api/downstreamApi";
import { fetchAllMarketingRequestsApi } from "@/infrastructure/api/sampleRequestsApi";
import { useBusinessYear } from "@/context/BusinessYearContext";
import type { UserProfile } from "@/features/auth";
import { DielineItem } from "./types";
import { StudioOverviewPage } from "./StudioOverviewPage";
import { StudioArtworkPage } from "./StudioArtworkPage";
import { StudioInspectorModal } from "./StudioInspectorModal";

export interface StudioWorkDeskProps {
  user?: UserProfile | null;
}

export const StudioWorkDesk: React.FC<StudioWorkDeskProps> = ({ user }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { selectedYear } = useBusinessYear();

  // Active sub-view: "overview" | "mockup" | "sampling"
  const activeView: "overview" | "mockup" | "sampling" = useMemo(() => {
    const path = location.pathname.toLowerCase();
    if (path.includes("/mockup") || path.includes("/cad") || path.includes("/simulation")) {
      return "mockup";
    }
    if (path.includes("/sampling") || path.includes("/prepress") || path.includes("/tooling")) {
      return "sampling";
    }
    if (path.includes("/artwork")) {
      return "mockup";
    }
    return "overview";
  }, [location.pathname]);

  const handleSelectTab = (tab: "overview" | "mockup" | "sampling") => {
    if (tab === "overview") navigate("/studio-work");
    else if (tab === "mockup") navigate("/studio-work/mockup");
    else if (tab === "sampling") navigate("/studio-work/sampling");
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
  const [dielines, setDielines] = useState<DielineItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Inspector state
  const [selectedDieline, setSelectedDieline] = useState<DielineItem | null>(null);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }, []);

  // Fetch real dielines from backend API and active marketing mockup requests
  const loadDielines = useCallback(async () => {
    setIsLoading(true);
    try {
      const [live, marketingRequests] = await Promise.all([
        fetchStudioDielinesApi().catch(() => []),
        fetchAllMarketingRequestsApi(selectedYear).catch(() => []),
      ]);

      // Filter out any lingering fake requests
      const cleanLive = (Array.isArray(live) ? live : []).filter(
        (d) => !String(d.id || "").startsWith("DL-2024-") && !String(d.srNumber || "").startsWith("SR-25-")
      );

      // Map any real requests requiring CAD mockup or studio dieline
      const realMockupDielines: DielineItem[] = (Array.isArray(marketingRequests) ? marketingRequests : [])
        .filter((r) => {
          const scopes = r.requestTypes || [];
          return (
            scopes.includes("mockup") ||
            r.mockupRequired === "Yes" ||
            String(r.status || "").toLowerCase().includes("studio")
          );
        })
        .map((r) => {
          const validBoxFormats: DielineItem["boxFormat"][] = [
            "Rigid Box",
            "Folding Carton",
            "Flute Corrugated",
            "Blister / Sleeve",
          ];
          const boxFormat: DielineItem["boxFormat"] = validBoxFormats.includes(r.productType as any)
            ? (r.productType as DielineItem["boxFormat"])
            : "Folding Carton";

          return {
            id: String(r.id),
            dielineCode: r.srNumber || `DL-${r.id}`,
            srNumber: r.srNumber || `SR-${r.id}`,
            boxFormat,
            title: r.productDescription || "CAD Structural Dieline",
            client: r.customer || "General",
            dimensions: "Standard Specification",
            substrate: r.brandName || "Carton Board",
            caliperMicrons: 350,
            machineCompatibility: "Bobst VisionCut",
            status: ((r.status === "Studio" ? "CAD Intake" : r.status) as any) || "CAD Intake",
            dueDate: r.sampleRequiredDate || r.targetArtworkDateStudio || "Standard SLA",
            targetPlant: r.targetPlant || "All Plants",
            fluteGrade: undefined,
            grainDirection: "Parallel to Spine",
            fileFormats: ["DXF", "PDF"],
          };
        });

      const combined = [...cleanLive, ...realMockupDielines];
      const seen = new Set<string>();
      const unique = combined.filter((d) => {
        const key = d.srNumber || d.dielineCode || d.id;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      setDielines(unique);
    } catch (err) {
      console.error("Failed to load studio dielines:", err);
      setDielines([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedYear]);

  useEffect(() => {
    loadDielines();
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

  const mockupCount = useMemo(() => {
    return dielines.filter(
      (d) =>
        d.status === "3D Simulation" ||
        d.status === "CAD Intake" ||
        d.status === "Plotter Sample Tested"
    ).length || dielines.length;
  }, [dielines]);

  const samplingCount = useMemo(() => {
    return dielines.filter(
      (d) =>
        d.status === "Laser Die Cleared" ||
        d.status === "Plotter Sample Tested" ||
        d.status === "Dieline Construction"
    ).length || dielines.length;
  }, [dielines]);

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-[#0c0d14] text-slate-800 dark:text-zinc-100 overflow-hidden select-none relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-4 right-6 z-50 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 text-[12px] font-semibold px-4 py-2 rounded-xl shadow-xl border border-slate-700/50 flex items-center gap-2 animate-in fade-in duration-200">
          <span>{toastMessage}</span>
        </div>
      )}


      {/* Active Sub-View Body */}
      {activeView === "overview" && (
        <StudioOverviewPage
          dielines={dielines}
          isLoading={isLoading}
          selectedYear={selectedYear}
          selectedPlant={selectedPlant}
          onNavigateToMockup={() => handleSelectTab("mockup")}
          onNavigateToSampling={() => handleSelectTab("sampling")}
          onInspectDieline={(dieline) => {
            setSelectedDieline(dieline);
            setIsInspectorOpen(true);
          }}
        />
      )}

      {activeView === "mockup" && (
        <StudioArtworkPage
          dielines={dielines}
          mode="mockup"
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
    </div>
  );
};

export default StudioWorkDesk;
