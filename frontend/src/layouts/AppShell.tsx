import React, { useState, useEffect } from "react";
import { UserProfile } from "@/features/auth";
import { Sidebar } from "./Sidebar";
import { ALL_NAVIGATION_ITEMS } from "./navigation";
import { useTheme } from "@/context/ThemeContext";
import { getBusinessYearInfo } from "@/lib/businessYear";
import {
  Menu,
  Sun,
  Moon,
  Bell,
  Calendar,
  Clock,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  X,
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

  const formattedDate = currentDateTime.toLocaleDateString("en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const formattedTime = currentDateTime.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
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
    <div className="flex h-screen w-screen overflow-hidden bg-[#f8fafc] dark:bg-[#08090d] text-zinc-900 dark:text-zinc-100 font-sans transition-colors duration-150">
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
        <header className="h-14 border-b border-zinc-200/80 dark:border-white/[0.08] px-4 sm:px-6 flex items-center justify-between bg-white dark:bg-[#0f1118] shrink-0 z-10 transition-colors gap-3">
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

            {/* Live System Date & Time Display */}
            <div className="flex items-center gap-2 sm:gap-2.5 px-3 py-1.5 rounded-lg bg-zinc-100/70 dark:bg-white/[0.04] border border-zinc-200/80 dark:border-white/[0.07] text-xs select-none shadow-xs">
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

              <span
                className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/80 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/60"
                title="Active SAMP Business Year (October 1 – September 30 cycle)"
              >
                BY {businessYearInfo.businessYearStr}
              </span>
            </div>
          </div>

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
              className="h-9 w-9 rounded-md flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-white/[0.06] border border-zinc-200/80 dark:border-white/[0.08] transition-colors cursor-pointer"
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
              {/* Unread indicator */}
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-brand-600 ring-2 ring-white dark:ring-[#0f1118]" />
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
