import React, { useState } from "react";
import { UserProfile } from "@/features/auth";
import { Sidebar } from "./Sidebar";
import { useTheme } from "@/context/ThemeContext";
import { getNavigationTitle } from "./navigation";
import {
  Menu,
  Sun,
  Moon,
  Bell,
} from "lucide-react";

export interface AppShellProps {
  user: UserProfile;
  onLogout: () => void;
  currentPath: string;
  onNavigate: (path: string) => void;
  children: React.ReactNode;
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

  const activeTitle = getNavigationTitle(currentPath);

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
          {/* Left: Mobile Toggle & Page Context */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setIsMobileNavOpen(true)}
              className="md:hidden h-9 w-9 rounded-md flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-white/[0.06] cursor-pointer transition-colors"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Active section title (clean, no duplicate Navneet ERP prefix) */}
            <span className="font-semibold text-sm sm:text-[15px] text-zinc-900 dark:text-zinc-100 truncate tracking-tight">
              {activeTitle}
            </span>

            {/* Quick Search Shortcut */}
            <button
              type="button"
              onClick={handleGlobalSearchFocus}
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-900/60 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 text-xs font-mono transition-colors cursor-pointer"
              title="Global search (Ctrl+K)"
            >
              <span>Search pipeline...</span>
              <kbd className="px-1 py-0.2 rounded bg-zinc-200/60 dark:bg-zinc-800 text-[10px] text-zinc-400">Ctrl+K</kbd>
            </button>
          </div>

          {/* Right: Quick Actions */}
          <div className="flex items-center gap-2 shrink-0">
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

        {/* Main Work Viewport */}
        <main className="flex-1 min-h-0 flex flex-col overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
};
