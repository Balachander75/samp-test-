import React, { useState, useEffect, useRef } from "react";
import { UserProfile } from "@/features/auth";
import { Sidebar } from "./Sidebar";
import { ALL_NAVIGATION_ITEMS, getNavigationTitle } from "./navigation";
import { useTheme } from "@/context/ThemeContext";
import { useBusinessYear } from "@/context/BusinessYearContext";
import { getBusinessYearInfo } from "@/lib/businessYear";
import {
  Menu,
  Sun,
  Moon,
  Bell,
  Calendar,
  Clock,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  ChevronDown,
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
  const { theme, toggleTheme } = useTheme();
  const {
    selectedYear,
    setSelectedYear,
    yearsList,
    totalRecords,
  } = useBusinessYear();

  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);
  const yearDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (yearDropdownRef.current && !yearDropdownRef.current.contains(e.target as Node)) {
        setIsYearDropdownOpen(false);
      }
    };
    if (isYearDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isYearDropdownOpen]);

  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
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

  useEffect(() => {
    const handleRefreshComplete = () => setIsRefreshing(false);
    window.addEventListener("app:refresh-complete", handleRefreshComplete);
    return () => window.removeEventListener("app:refresh-complete", handleRefreshComplete);
  }, []);

  const isWorkspaceHome = currentPath === "/" || ALL_NAVIGATION_ITEMS.some(
    (item) => item.path === currentPath || item.aliases?.includes(currentPath)
  );
  const handlePageRefresh = () => {
    setIsRefreshing(true);
    const refreshEvent = new Event("app:refresh-requested", { cancelable: true });
    if (window.dispatchEvent(refreshEvent)) {
      window.location.reload();
    }
  };

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

  const businessYearInfo = React.useMemo(() => getBusinessYearInfo(currentDateTime), [currentDateTime]);

  // Global Ctrl+K / Cmd+K listener
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        handleGlobalSearchFocus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentPath]);

  const handleGlobalSearchFocus = () => {
    const el = document.getElementById("global-search-input") as HTMLInputElement | null;
    if (el) {
      el.focus();
      el.select();
    } else {
      onNavigate("/sample-requests");
      setTimeout(() => {
        const input = document.getElementById("global-search-input") as HTMLInputElement | null;
        if (input) {
          input.focus();
          input.select();
        }
      }, 100);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[var(--bg-app)] text-zinc-900 dark:text-zinc-100 font-sans transition-colors duration-150">
      {/* Universal Sidebar */}
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
        {/* Global Enterprise Top Bar */}
        <header className="h-14 border-b border-zinc-200/80 dark:border-white/[0.08] px-4 sm:px-6 flex items-center justify-between bg-[var(--bg-panel)] shrink-0 z-10 transition-colors gap-3">
          {/* Left: Mobile Toggle & Live System Date / Time */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setIsMobileNavOpen(true)}
              className="md:hidden h-9 w-9 rounded-md flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-white/[0.06] cursor-pointer transition-colors"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {currentPath !== "/dashboard" && (
              <span className="hidden xl:block text-[13px] font-semibold text-zinc-800 dark:text-zinc-100 whitespace-nowrap">
                {getNavigationTitle(currentPath)}
              </span>
            )}

            {currentPath !== "/dashboard" && (
              <span className="hidden xl:block h-5 w-px bg-zinc-200 dark:bg-white/10" aria-hidden="true" />
            )}

            {/* Live System Date & Time Display */}
            <div className="flex items-center gap-2 sm:gap-2.5 px-2.5 py-1.5 rounded-md bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200 dark:border-white/[0.08] text-xs select-none">
              <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400 font-medium">
                <Calendar className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 shrink-0" />
                <span className="tracking-tight">{formattedDate}</span>
              </div>

              <span className="text-zinc-300 dark:text-zinc-700 font-light">|</span>

              <div className="flex items-center gap-1.5 text-zinc-900 dark:text-zinc-100 font-mono font-semibold tabular-nums">
                <Clock className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400 shrink-0" />
                <span>{formattedTime}</span>
              </div>

              <span className="text-zinc-300 dark:text-zinc-700 font-light hidden sm:inline">|</span>

              {/* Business Year Dropdown Selector */}
              <div className="relative hidden sm:inline-block" ref={yearDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsYearDropdownOpen((prev) => !prev)}
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-mono font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-200/60 dark:hover:bg-white/[0.08] transition-colors cursor-pointer select-none"
                  title="Switch Business Year"
                >
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {selectedYear === "ALL" ? "All Years" : `BY ${selectedYear}`}
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 transition-transform duration-150 ${
                      isYearDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Dropdown Menu */}
                {isYearDropdownOpen && (
                  <div className="absolute left-0 mt-2 w-52 rounded-md bg-white dark:bg-[#12131a] border border-zinc-200 dark:border-zinc-800 shadow-lg z-50 p-1 select-none">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedYear("ALL");
                        setIsYearDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs font-mono transition-colors cursor-pointer ${
                        selectedYear === "ALL"
                          ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold"
                          : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-100"
                      }`}
                    >
                      <span>All Business Years</span>
                      <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
                        {totalRecords.toLocaleString()}
                      </span>
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
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs font-mono transition-colors cursor-pointer ${
                            isSelected
                              ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold"
                              : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-100"
                          }`}
                        >
                          <span className="flex items-center gap-1.5">
                            <span>BY {y.year}</span>
                            {y.is_current && (
                              <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-sans">
                                (Current)
                              </span>
                            )}
                          </span>
                          <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
                            {y.count.toLocaleString()}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
        </div>

          {/* Quick access to request search from any workspace. */}
          <button
            type="button"
            onClick={handleGlobalSearchFocus}
            className="hidden lg:flex flex-1 max-w-[440px] h-9 items-center gap-2.5 px-3 rounded-md border border-zinc-300 bg-white text-zinc-500 hover:border-zinc-400 hover:text-zinc-700 dark:border-white/15 dark:bg-[#111318] dark:text-zinc-400 dark:hover:border-white/25 transition-colors text-left"
            aria-label="Open sample request search"
          >
            <Search className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span className="flex-1 text-[13px]">Search sample requests, SKUs, customers…</span>
            <kbd className="px-1.5 py-0.5 rounded border border-zinc-200 bg-zinc-50 text-[10px] font-medium text-zinc-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-400">Ctrl K</kbd>
          </button>

          {/* Right: Quick Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {isWorkspaceHome && (
              <button
                type="button"
                onClick={handlePageRefresh}
                disabled={isRefreshing}
                aria-label="Refresh current section"
                title="Refresh current section"
                className="group h-9 w-9 rounded-md flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-white/[0.06] border border-zinc-200/80 dark:border-white/[0.08] transition-[color,background-color,border-color,transform] duration-150 active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 cursor-pointer disabled:cursor-wait disabled:opacity-60"
              >
                <RefreshCw className={`w-[17px] h-[17px] transition-transform duration-200 ${isRefreshing ? "animate-spin" : "group-hover:rotate-45"}`} />
              </button>
            )}

            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              className="h-9 w-9 rounded-md flex items-center justify-center bg-[var(--bg-panel)] text-zinc-500 dark:text-zinc-400 hover:text-brand-700 dark:hover:text-brand-300 hover:bg-brand-50 dark:hover:bg-brand-950/30 border border-zinc-200/80 dark:border-white/[0.08] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 active:scale-[0.97]"
            >
              {theme === "dark" ? (
                <Sun className="w-[18px] h-[18px] text-amber-400" />
              ) : (
                <Moon className="w-[18px] h-[18px] text-indigo-500" />
              )}
            </button>

            {/* Notifications Button */}
            <button
              type="button"
              className="relative h-9 w-9 rounded-md flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-white/[0.06] border border-zinc-200/80 dark:border-white/[0.08] transition-colors cursor-pointer"
              aria-label="System notifications"
              title="Notifications"
            >
              <Bell className="w-[18px] h-[18px]" />
            </button>

            {/* User Avatar */}
            <div
              className="h-9 w-9 rounded-md bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold text-xs flex items-center justify-center font-mono cursor-default select-none shadow-xs border border-zinc-700/50 dark:border-zinc-300 ml-1"
              title={`${user?.name || "User"} (${user?.sub_role || user?.role || "Operator"})`}
            >
              {(user?.name || "A").charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Global Operational Toast Notification */}
        {globalToast && (
          <div
            role="status"
            aria-live="polite"
            className={`fixed top-16 right-5 z-[80] flex items-center gap-3 px-4 py-3 rounded-lg shadow-2xl text-xs font-semibold border backdrop-blur-md max-w-md animate-smooth-toast transition-all ${
              globalToast.tone === "error"
                ? "bg-rose-950/90 text-rose-100 border-rose-700/80 shadow-rose-950/40"
                : globalToast.tone === "info"
                ? "bg-zinc-900/95 text-zinc-100 border-zinc-700/80 shadow-zinc-950/40"
                : "bg-emerald-950/90 text-emerald-100 border-emerald-700/80 shadow-emerald-950/40"
            }`}
          >
            {globalToast.tone === "error" ? (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            ) : globalToast.tone === "info" ? (
              <Clock className="w-4 h-4 shrink-0 text-amber-400 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            )}
            <span className="flex-1 leading-snug">{globalToast.message}</span>
            <button
              type="button"
              onClick={() => setGlobalToast(null)}
              className="p-1 rounded hover:bg-white/20 text-white/70 hover:text-white transition-colors cursor-pointer shrink-0"
              aria-label="Dismiss notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Main Work Viewport */}
        <main className="flex-1 min-h-0 flex flex-col overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
};
