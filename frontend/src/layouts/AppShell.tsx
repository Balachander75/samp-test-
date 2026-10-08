import React, { useState, useEffect, useRef, useMemo } from "react";
import { UserProfile } from "@/features/auth";
import { Sidebar } from "./Sidebar";
import { getNavigationTitle } from "./navigation";
import { useBusinessYear } from "@/context/BusinessYearContext";
import { usePlant } from "@/context/PlantContext";
import {
  Menu,
  Calendar,
  Clock,
  X,
  ChevronDown,
  LogOut,
  Settings,
} from "lucide-react";

export interface AppShellProps {
  user: UserProfile;
  onLogout: () => void;
  currentPath: string;
  onNavigate: (path: string) => void;
  children: React.ReactNode;
}

interface GlobalToast {
  id: string;
  message: string;
  tone: "success" | "error" | "info";
}

export const AppShell: React.FC<AppShellProps> = ({
  user,
  onLogout,
  currentPath,
  onNavigate,
  children,
}) => {
  const {
    selectedYear,
    setSelectedYear,
    yearsList,
    totalRecords,
  } = useBusinessYear();

  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);
  const yearDropdownRef = useRef<HTMLDivElement>(null);

  const [isPlantDropdownOpen, setIsPlantDropdownOpen] = useState(false);
  const plantDropdownRef = useRef<HTMLDivElement>(null);

  const {
    selectedPlant,
    setSelectedPlant,
    plantOptions,
    activePlantLabel,
  } = usePlant();

  const plantsList = useMemo(() => [
    { code: "ALL", name: "Consolidated (All Plants)", label: "Consolidated (All Plants)" },
    ...plantOptions.map((p) => ({
      code: p.code,
      name: p.name,
      label: p.displayName,
    })),
  ], [plantOptions]);

  const handleSelectPlant = (plantCode: string, plantLabel: string) => {
    setSelectedPlant(plantCode);
    setIsPlantDropdownOpen(false);
    window.dispatchEvent(
      new CustomEvent("app:plant-changed", {
        detail: { plant: plantCode, label: plantLabel },
      })
    );
    window.dispatchEvent(
      new CustomEvent("app:show-toast", {
        detail: {
          message: `Fulfillment plant scope updated: ${plantLabel}`,
          tone: "info",
        },
      })
    );
  };

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (yearDropdownRef.current && !yearDropdownRef.current.contains(target)) {
        setIsYearDropdownOpen(false);
      }
      if (plantDropdownRef.current && !plantDropdownRef.current.contains(target)) {
        setIsPlantDropdownOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [globalToast, setGlobalToast] = useState<GlobalToast | null>(null);

  // Global Toast event listener
  useEffect(() => {
    const handleToastEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ message: string; tone?: "success" | "error" | "info" }>;
      if (customEvent.detail?.message) {
        setGlobalToast({
          id: `toast-${Date.now()}`,
          message: customEvent.detail.message,
          tone: customEvent.detail.tone || "success",
        });
      }
    };

    window.addEventListener("app:show-toast", handleToastEvent);
    return () => window.removeEventListener("app:show-toast", handleToastEvent);
  }, []);

  useEffect(() => {
    if (!globalToast) return;
    const timer = setTimeout(() => {
      setGlobalToast(null);
    }, 4500);
    return () => clearTimeout(timer);
  }, [globalToast]);

  // Live system date & time sync
  const [currentDateTime, setCurrentDateTime] = useState<Date>(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedDate = currentDateTime.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const formattedTime = currentDateTime.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  // User initials (up to 2 chars)
  const initials = (user?.name || "U")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const activeTitle = getNavigationTitle(currentPath);
  const plantDisplayLabel = activePlantLabel;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#f8f9ff] text-slate-900 font-sans transition-colors duration-150 select-none">
      {/* Primary Navigation Sidebar */}
      <Sidebar
        user={user}
        onLogout={onLogout}
        selectedPath={currentPath}
        onSelectPath={onNavigate}
        isMobileOpen={isMobileNavOpen}
        onCloseMobile={() => setIsMobileNavOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Enterprise Frosted Utility Top Bar */}
        <header className="h-14 bg-white/95 backdrop-blur-xl text-slate-900 flex items-center justify-between px-4 sm:px-6 border-b border-slate-200/80 shrink-0 z-40 transition-colors gap-3">
          
          {/* Left: Mobile Menu Toggle & Current Workspace Breadcrumb */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setIsMobileNavOpen(true)}
              className="md:hidden p-1.5 rounded-xl hover:bg-slate-100 text-slate-600 transition focus:outline-none cursor-pointer"
              aria-label="Open navigation menu"
            >
              <Menu className="w-4.5 h-4.5" />
            </button>

            {/* Current Active Workspace Indicator */}
            <div className="flex items-center gap-2.5">
              <span className="text-xs text-slate-400 font-medium hidden sm:inline">Workspace</span>
              <span className="text-slate-300 text-xs hidden sm:inline">/</span>
              <h1 className="text-sm sm:text-base font-bold font-display tracking-tight text-slate-900 truncate">
                {activeTitle}
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold font-mono tracking-wide uppercase border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live
              </span>
            </div>
          </div>

          {/* Right: Multi-Plant Selector, Live Date/Time, BY, Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Multi-Plant Scope Selector */}
            <div className="relative" ref={plantDropdownRef}>
              <button
                type="button"
                onClick={() => setIsPlantDropdownOpen((prev) => !prev)}
                className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200/80 px-3 py-1.5 rounded-full border border-slate-200/80 text-xs text-slate-800 cursor-pointer transition select-none shadow-2xs"
                title="Select Active Fulfillment Plant"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span className="text-[10px] text-slate-400 uppercase font-mono hidden md:inline">Plant:</span>
                <span className="font-semibold text-xs truncate max-w-[130px] sm:max-w-none">
                  {plantDisplayLabel}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5" />
              </button>

              {isPlantDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl bg-white text-slate-800 border border-slate-200 shadow-xl z-50 p-1.5 text-xs select-none animate-in fade-in duration-100">
                  <div className="px-2.5 py-1.5 text-[10px] font-mono uppercase text-slate-400 font-bold border-b border-slate-100 mb-1">
                    Select Plant Scope
                  </div>
                  <div className="max-h-60 overflow-y-auto space-y-0.5">
                    {plantsList.map((opt) => (
                      <button
                        key={opt.code}
                        type="button"
                        onClick={() => handleSelectPlant(opt.code, opt.label)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition cursor-pointer ${
                          selectedPlant === opt.code
                            ? "bg-emerald-500/10 text-emerald-600 font-bold"
                            : "hover:bg-slate-50 text-slate-700 font-medium"
                        }`}
                      >
                        <span className="truncate">{opt.label}</span>
                        {selectedPlant === opt.code && <span className="text-emerald-600 font-bold ml-1">✓</span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Live Clock & Date Badge */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100/70 border border-slate-200/60 text-xs text-slate-600">
              <div className="flex items-center gap-1.5 text-slate-500">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{formattedDate}</span>
              </div>
              <span className="text-slate-300">|</span>
              <div className="flex items-center gap-1.5 font-mono font-semibold text-slate-800">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{formattedTime}</span>
              </div>
            </div>

            {/* Business Year Selector */}
            <div className="relative hidden sm:inline-block" ref={yearDropdownRef}>
              <button
                type="button"
                onClick={() => setIsYearDropdownOpen((prev) => !prev)}
                className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200/80 px-3 py-1.5 rounded-full border border-slate-200/80 text-slate-800 font-mono text-xs font-semibold cursor-pointer select-none"
                title="Business Year (October to September)"
              >
                <span>{selectedYear === "ALL" ? "All Years" : `BY ${selectedYear}`}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {isYearDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl bg-white text-slate-800 border border-slate-200 shadow-xl z-50 p-1.5 text-xs select-none animate-in fade-in duration-100 max-h-72 overflow-y-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedYear("ALL");
                      setIsYearDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-mono transition cursor-pointer ${
                      selectedYear === "ALL"
                        ? "bg-emerald-500/10 text-emerald-600 font-bold"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <span>All Business Years</span>
                    <span className="text-[11px] text-slate-400">{totalRecords.toLocaleString()}</span>
                  </button>

                  {yearsList.map((y) => {
                    const isSelected = selectedYear === y.year;
                    return (
                      <button
                        key={y.year}
                        type="button"
                        onClick={() => {
                          setSelectedYear(y.year);
                          setIsYearDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-mono transition cursor-pointer ${
                          isSelected
                            ? "bg-emerald-500/10 text-emerald-600 font-bold"
                            : "text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <span className="flex items-center gap-1.5">
                          <span>BY {y.year}</span>
                          {y.is_current && <span className="text-[10px] text-emerald-600 font-sans font-bold">(Current)</span>}
                        </span>
                        <span className="text-[11px] text-slate-400 tabular-nums">{y.count.toLocaleString()}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* User Profile Pill & Dropdown */}
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setIsUserMenuOpen((prev) => !prev)}
                className="flex items-center gap-2 pl-2 border-l border-slate-200 cursor-pointer select-none group"
              >
                <span className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#006d32] to-[#00d166] text-white font-bold flex items-center justify-center text-xs shadow-xs font-display">
                  {initials}
                </span>
                <span className="hidden xl:inline text-xs font-semibold text-slate-800 truncate max-w-[120px]">
                  {user?.name || "Admin"}
                </span>
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white text-slate-800 border border-slate-200 shadow-xl z-50 p-1.5 text-xs select-none animate-in fade-in duration-100">
                  <div className="px-3 py-2 border-b border-slate-100 mb-1">
                    <p className="font-bold text-slate-900 truncate font-display">{user?.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{user?.role || "Global Admin"}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      onNavigate("/settings");
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-slate-50 rounded-xl transition text-left cursor-pointer font-medium"
                  >
                    <Settings className="w-3.5 h-3.5 text-slate-400" />
                    <span>Workspace Settings</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      onLogout();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-xl transition text-left cursor-pointer font-semibold"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>

          </div>
        </header>

        {/* Global Toast Alert */}
        {globalToast && (
          <div className="fixed bottom-5 right-5 z-50 max-w-sm w-[calc(100vw-2.5rem)] animate-in fade-in slide-in-from-bottom-3 duration-200">
            <div className="bg-slate-900/95 dark:bg-[#151926]/95 backdrop-blur-xl text-white px-4 py-3 rounded-2xl shadow-2xl border border-white/10 flex items-center gap-3 text-xs">
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  globalToast.tone === "error"
                    ? "bg-rose-500 shadow-[0_0_8px_#f43f5e]"
                    : globalToast.tone === "info"
                    ? "bg-blue-400 shadow-[0_0_8px_#60a5fa]"
                    : "bg-[#00d166] shadow-[0_0_8px_#00d166]"
                }`}
              />
              <span className="flex-1 leading-snug font-medium">{globalToast.message}</span>
              <button
                type="button"
                onClick={() => setGlobalToast(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 cursor-pointer transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Main Routed View */}
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
          {children}
        </div>
      </div>
    </div>
  );
};
