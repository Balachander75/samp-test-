import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { UserProfileInfo } from "../types";
import { Bell, Menu, Calendar, Palette, Factory, FileText, ArrowRight, X, RefreshCw } from "@/components/ui/icons";

interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
  user?: UserProfileInfo | null;
  onLogout?: () => void;
  hideActions?: boolean;
  onOpenMobileNav?: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

const QUICK_ALERTS = [
  {
    id: "1",
    title: "Sample Request Dispatched",
    desc: "SR-2026-0042 dispatched from Khaniwade Central plant.",
    time: "10m ago",
    type: "plant",
    unread: true,
  },
  {
    id: "2",
    title: "Creative Artwork Approved",
    desc: "Artwork approved for Walmart BTS Program 2027.",
    time: "45m ago",
    type: "creative",
    unread: true,
  },
  {
    id: "3",
    title: "Batch Allocation Finalized",
    desc: "12 batches allocated to Palghar Factory line 2.",
    time: "2h ago",
    type: "request",
    unread: false,
  },
];

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  title,
  subtitle,
  user,
  hideActions,
  onOpenMobileNav,
  onRefresh,
  isRefreshing,
}) => {
  const navigate = useNavigate();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  // Calculate dynamic time-of-day greeting
  const hour = new Date().getHours();
  const timeGreeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = user?.name ? user.name.split(" ")[0] : "Admin";

  const renderedTitle = title.toLowerCase().includes("dashboard") || title.toLowerCase().includes("welcome")
    ? `${timeGreeting}, ${firstName} 👋`
    : title;

  // Close notification popover on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="app-header flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5 pb-3 border-b border-slate-200/80 dark:border-slate-800">
      {/* Left: Enhanced Greeting and Clean Date */}
      <div className="flex items-start gap-3">
        {onOpenMobileNav && (
          <button
            type="button"
            onClick={onOpenMobileNav}
            className="md:hidden p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 shadow-2xs cursor-pointer shrink-0 mt-0.5"
            aria-label="Open navigation menu"
          >
            <Menu size={18} />
          </button>
        )}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2 py-0.2 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-semibold font-mono border border-slate-200/70 dark:border-slate-700">
            <Calendar size={11} className="text-blue-600 dark:text-blue-400" />
            <span>{currentDate}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {renderedTitle}
          </h1>
          {subtitle && (
            <p className="text-slate-500 dark:text-slate-400 text-xs font-medium leading-normal">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Right Action Controls: Interactive Notifications Hub */}
      {!hideActions && (
        <div className="flex items-center gap-2.5 relative" ref={notifRef}>
          {/* Refresh Button */}
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="h-10 px-3.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200/90 dark:border-slate-800 shadow-2xs hover:shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60 select-none active:scale-[0.98]"
              title="Refresh requests"
            >
              <RefreshCw
                size={14}
                className={`transition-transform duration-500 ${isRefreshing ? "animate-spin text-blue-600 dark:text-blue-400" : "text-slate-500 dark:text-slate-400"}`}
              />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          )}

          {/* Notifications Bell with unread counter */}
          <button
            type="button"
            onClick={() => setIsNotifOpen((prev) => !prev)}
            aria-label="Toggle notifications"
            className={`h-10 w-10 rounded-xl border transition-all flex items-center justify-center relative shadow-2xs hover:shadow-sm cursor-pointer select-none active:scale-[0.98] ${
              isNotifOpen
                ? "bg-blue-50/80 dark:bg-blue-950/70 border-blue-400 dark:border-blue-600 text-blue-600 dark:text-blue-400 shadow-inner"
                : "bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-200/90 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
            }`}
            title="Open notifications"
          >
            <Bell size={17} />
            <span className="absolute top-2 right-2 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600 ring-2 ring-white dark:ring-slate-900"></span>
            </span>
          </button>

          {/* Interactive Notifications Popover Dropdown */}
          {isNotifOpen && (
            <div className="absolute right-0 top-12 z-50 w-84 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xl p-3.5 space-y-2.5 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    Notifications
                  </h3>
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 font-mono">
                    2 new
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsNotifOpen(false)}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X size={13} />
                </button>
              </div>

              {/* Quick Alerts List */}
              <div className="space-y-2">
                {QUICK_ALERTS.map((alert) => (
                  <div
                    key={alert.id}
                    onClick={() => {
                      setIsNotifOpen(false);
                      navigate("/notifications");
                    }}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-start gap-2.5 ${
                      alert.unread
                        ? "bg-blue-50/50 dark:bg-blue-950/30 border-blue-200/80 dark:border-blue-900/60"
                        : "bg-slate-50/60 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800 hover:bg-slate-100/70"
                    }`}
                  >
                    <div className="w-7 h-7 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                      {alert.type === "creative" && <Palette size={13} className="text-rose-500" />}
                      {alert.type === "plant" && <Factory size={13} className="text-amber-500" />}
                      {alert.type === "request" && <FileText size={13} className="text-blue-500" />}
                    </div>
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                          {alert.title}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono shrink-0 ml-1">
                          {alert.time}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug line-clamp-2">
                        {alert.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* View All Footer Link */}
              <button
                type="button"
                onClick={() => {
                  setIsNotifOpen(false);
                  navigate("/notifications");
                }}
                className="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <span>View All in Notifications Page</span>
                <ArrowRight size={13} />
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default DashboardHeader;
