import React, { useState, useEffect } from "react";
import { UserProfileInfo } from "../types";
import {
  ChevronsRight,
  LogOut,
  X,
} from "@/components/ui/icons";
import { NAVIGATION_GROUPS } from "../navigation";
import logoImg from "@/assets/logo.png";

const DEPARTMENT_THEMES: Record<
  string,
  {
    active: string;
    iconColor: string;
    hoverBg: string;
    accentBar: string;
  }
> = {
  Dashboard: {
    active: "bg-gradient-to-r from-slate-900 via-slate-950 to-black text-white font-bold shadow-md shadow-black/40 border border-slate-700/60",
    iconColor: "text-slate-800 dark:text-slate-200",
    hoverBg: "hover:bg-slate-100 dark:hover:bg-slate-800/70",
    accentBar: "bg-slate-300",
  },
  "Marketing Work": {
    active: "bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-md shadow-blue-600/30",
    iconColor: "text-blue-600 dark:text-blue-400",
    hoverBg: "hover:bg-blue-50/80 dark:hover:bg-blue-950/30",
    accentBar: "bg-blue-300",
  },
  "Sample Requests": {
    active: "bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-md shadow-blue-600/30",
    iconColor: "text-blue-600 dark:text-blue-400",
    hoverBg: "hover:bg-blue-50/80 dark:hover:bg-blue-950/30",
    accentBar: "bg-blue-300",
  },
  "Creative Work": {
    active: "bg-gradient-to-r from-red-600 to-rose-600 text-white font-bold shadow-md shadow-red-600/30",
    iconColor: "text-red-600 dark:text-rose-400",
    hoverBg: "hover:bg-red-50/80 dark:hover:bg-red-950/30",
    accentBar: "bg-red-300",
  },
  "Studio Work": {
    active: "bg-gradient-to-r from-purple-600 to-violet-600 text-white font-bold shadow-md shadow-purple-600/30",
    iconColor: "text-purple-600 dark:text-purple-400",
    hoverBg: "hover:bg-purple-50/80 dark:hover:bg-purple-950/30",
    accentBar: "bg-purple-300",
  },
  "SAMP Team Work": {
    active: "bg-gradient-to-r from-orange-500 to-amber-600 text-white font-bold shadow-md shadow-orange-500/30",
    iconColor: "text-orange-500 dark:text-amber-400",
    hoverBg: "hover:bg-orange-50/80 dark:hover:bg-orange-950/30",
    accentBar: "bg-orange-300",
  },
  "Costing Team": {
    active: "bg-gradient-to-r from-teal-500 via-cyan-600 to-teal-700 text-white font-bold shadow-md shadow-cyan-600/30",
    iconColor: "text-teal-600 dark:text-cyan-400",
    hoverBg: "hover:bg-cyan-50/80 dark:hover:bg-cyan-950/30",
    accentBar: "bg-cyan-300",
  },
  Analytics: {
    active: "bg-gradient-to-r from-emerald-600 to-green-600 text-white font-bold shadow-md shadow-emerald-600/30",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    hoverBg: "hover:bg-emerald-50/80 dark:hover:bg-emerald-950/30",
    accentBar: "bg-emerald-300",
  },
  Members: {
    active: "bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-bold shadow-md shadow-indigo-600/25",
    iconColor: "text-indigo-500 dark:text-indigo-400",
    hoverBg: "hover:bg-indigo-50/80 dark:hover:bg-indigo-950/30",
    accentBar: "bg-indigo-300",
  },
  Settings: {
    active: "bg-gradient-to-r from-slate-900 via-slate-950 to-black text-white font-bold shadow-md shadow-black/40 border border-slate-700/60",
    iconColor: "text-slate-800 dark:text-slate-200",
    hoverBg: "hover:bg-slate-100 dark:hover:bg-slate-800/70",
    accentBar: "bg-slate-300",
  },
  "Help & Support": {
    active: "bg-gradient-to-r from-slate-900 via-slate-950 to-black text-white font-bold shadow-md shadow-black/40 border border-slate-700/60",
    iconColor: "text-slate-800 dark:text-slate-200",
    hoverBg: "hover:bg-slate-100 dark:hover:bg-slate-800/70",
    accentBar: "bg-slate-300",
  },
};

export interface SidebarProps {
  user?: UserProfileInfo | null;
  onLogout?: () => void;
  selected: string;
  setSelected: (title: string) => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  user,
  onLogout,
  selected,
  setSelected,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const [open, setOpen] = useState(true);

  // Close mobile navigation on Escape key
  useEffect(() => {
    if (!isMobileOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && onCloseMobile) {
        onCloseMobile();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobileOpen, onCloseMobile]);

  // Lock body scroll when mobile nav is open
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileOpen]);

  const handleSelect = (title: string) => {
    setSelected(title);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const renderNavContent = (isDrawer = false) => {
    const isExpanded = isDrawer ? true : open;

    return (
      <div className="flex flex-col justify-between h-full">
        <div className="space-y-4">
          {/* Brand Header */}
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-200/70 dark:border-slate-800/80 px-2 min-h-[52px]">
            {isExpanded ? (
              <div className="flex items-center gap-2.5 min-w-0">
                <img
                  src={logoImg}
                  alt="Navneet"
                  className="h-8 w-auto max-w-[130px] object-contain object-left"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/logo.png";
                  }}
                />
                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 font-mono uppercase tracking-wider bg-blue-50 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-900/60 px-2 py-0.5 rounded-md">
                  SAMP
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-center w-full">
                <img
                  src={logoImg}
                  alt="Navneet"
                  className="h-7 w-7 object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/logo.png";
                  }}
                />
              </div>
            )}

            {isDrawer && onCloseMobile && (
              <button
                type="button"
                onClick={onCloseMobile}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-slate-200 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                aria-label="Close menu"
              >
                <X size={18} />
              </button>
            )}
          </div>

          {/* Navigation Groups */}
          <div className="space-y-3.5">
            {NAVIGATION_GROUPS.map((group, groupIdx) => (
              <div key={group.groupTitle} className="space-y-1">
                {isExpanded ? (
                  <div className="px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-slate-400/90 dark:text-slate-400">
                    {group.groupTitle}
                  </div>
                ) : (
                  groupIdx > 0 && (
                    <div className="w-8 h-px bg-slate-200/70 dark:bg-slate-800 mx-auto my-1.5" />
                  )
                )}

                {group.items.map((item) => {
                  const isSelected = selected === item.title;
                  const Icon = item.icon;
                  const theme = DEPARTMENT_THEMES[item.title] || DEPARTMENT_THEMES["Dashboard"];

                  return (
                    <div key={item.title} className="relative group">
                      <button
                        type="button"
                        onClick={() => handleSelect(item.title)}
                        className={`relative flex h-10 w-full items-center rounded-xl text-xs sm:text-[13px] transition-all duration-200 cursor-pointer ${
                          isSelected
                            ? `${theme.active} scale-[1.01]`
                            : `text-slate-600 dark:text-slate-300 ${theme.hoverBg} hover:text-slate-950 dark:hover:text-white font-medium`
                        } ${isExpanded ? "px-3" : "justify-center px-0"}`}
                      >
                        {/* Left active accent bar */}
                        {isSelected && isExpanded && (
                          <div className={`absolute left-1 top-2 bottom-2 w-1 rounded-full ${theme.accentBar}`} />
                        )}

                        <div className="flex items-center justify-center shrink-0 w-6">
                          <Icon
                            className={`h-4 w-4 transition-transform duration-150 ${
                              isSelected
                                ? "text-white stroke-[2.3]"
                                : `${theme.iconColor} group-hover:scale-110`
                            }`}
                          />
                        </div>

                        {isExpanded && (
                          <span className="ml-2.5 tracking-tight truncate flex-1 text-left font-semibold">
                            {item.title}
                          </span>
                        )}

                        {isExpanded && item.badge && !isSelected && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60 font-mono mr-1">
                            {item.badge}
                          </span>
                        )}

                        {isExpanded && item.pulse && !isSelected && (
                          <span className="h-2 w-2 rounded-full bg-blue-600 animate-pulse mr-1 shadow-xs" />
                        )}
                      </button>

                      {/* Tooltip for collapsed mode */}
                      {!isExpanded && (
                        <div className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-2.5 px-2.5 py-1 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-[11px] font-semibold rounded-lg shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50">
                          {item.title}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Footer Area: User Profile & Collapse Toggle */}
        <div className="space-y-2 pt-3 border-t border-slate-200/70 dark:border-slate-800/80 px-1">
          {/* User Profile Pill */}
          <div className="relative group">
            <div className={`flex items-center justify-between p-2 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200/90 dark:border-slate-800 shadow-card ${!isExpanded ? "justify-center" : ""}`}>
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="relative shrink-0">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-bold text-xs flex items-center justify-center shadow-sm shadow-blue-500/30">
                    {(user?.name || "A").charAt(0).toUpperCase()}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-850 shadow-xs" />
                </div>

                {isExpanded && (
                  <div className="min-w-0 text-left">
                    <span className="block text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight truncate">
                      {user?.name || "Admin"}
                    </span>
                    <span className="block text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider truncate">
                      {user?.role || "Reviewer"}
                    </span>
                  </div>
                )}
              </div>

              {isExpanded && onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  title="Sign Out"
                  className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                >
                  <LogOut size={14} />
                </button>
              )}
            </div>

            {/* User Profile Tooltip for collapsed mode */}
            {!isExpanded && (
              <div className="pointer-events-none absolute left-full bottom-0 ml-2.5 px-2.5 py-1.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-[11px] rounded-lg shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50">
                <div className="font-bold">{user?.name || "Admin"}</div>
                <div className="text-[10px] text-slate-300 dark:text-slate-600 capitalize">{user?.role || "Reviewer"}</div>
              </div>
            )}
          </div>

          {/* Desktop Collapse Toggle */}
          {!isDrawer && (
            <button
              type="button"
              onClick={() => setOpen(!open)}
              className="hidden md:flex w-full items-center justify-center p-2 rounded-xl border border-slate-200/70 dark:border-slate-800/80 transition-all hover:bg-slate-100/70 dark:hover:bg-slate-800/50 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer shadow-2xs"
              title={open ? "Collapse Sidebar" : "Expand Sidebar"}
            >
              <div className="flex items-center gap-1.5">
                <ChevronsRight
                  className={`h-4 w-4 transition-transform duration-200 ${
                    open ? "rotate-180" : ""
                  }`}
                />
                {open && (
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    Collapse
                  </span>
                )}
              </div>
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Desktop Sticky Sidebar */}
      <aside
        className={`app-sidebar sticky top-0 h-screen shrink-0 border-r border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-3.5 transition-[width] duration-200 ease-out z-20 select-none hidden md:flex flex-col justify-between ${
          open ? "w-60" : "w-[68px]"
        }`}
      >
        {renderNavContent(false)}
      </aside>

      {/* Mobile Off-Canvas Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity duration-150"
            onClick={onCloseMobile}
          />
          {/* Sliding drawer */}
          <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shadow-2xl p-4 flex flex-col justify-between">
            {renderNavContent(true)}
          </aside>
        </div>
      )}
    </>
  );
};
