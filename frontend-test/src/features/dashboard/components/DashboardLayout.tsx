import React, { useCallback, useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { UserProfileInfo } from "../types";
import { Sidebar } from "./Sidebar";
import { DashboardHeader } from "./DashboardHeader";
import { getNavigationPath, getNavigationTitle } from "../navigation";
import { Menu } from "@/components/ui/icons";

interface DashboardLayoutProps {
  user?: UserProfileInfo | null;
  onLogout?: () => void;
  title: string;
  subtitle?: string;
  hideHeader?: boolean;
  hideHeaderActions?: boolean;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  user,
  onLogout,
  title,
  subtitle,
  hideHeader = false,
  hideHeaderActions = false,
  onRefresh,
  isRefreshing,
  children,
}) => {
  const location = useLocation();
  const navigate = useNavigate();

  const getTabFromPath = useCallback(
    () => getNavigationTitle(location.pathname),
    [location.pathname],
  );

  const [selected, setSelected] = useState(getTabFromPath());

  useEffect(() => {
    setSelected(getTabFromPath());
  }, [getTabFromPath]);

  const handleSelectTab = (tab: string) => {
    setSelected(tab);
    navigate(getNavigationPath(tab));
  };

  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  return (
    <div className="flex min-h-screen w-full ambient-canvas text-slate-900 dark:text-slate-100 antialiased overflow-x-hidden">
      <Sidebar
        user={user}
        onLogout={onLogout}
        selected={selected}
        setSelected={handleSelectTab}
        isMobileOpen={isMobileNavOpen}
        onCloseMobile={() => setIsMobileNavOpen(false)}
      />
        <main className="dashboard-main flex-1 min-w-0 p-4 sm:p-6 lg:p-7 overflow-y-auto max-h-screen overflow-x-hidden">
        {hideHeader && (
          <div className="md:hidden flex items-center justify-between pb-3.5 mb-4 border-b border-slate-200/80 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsMobileNavOpen(true)}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-2xs cursor-pointer"
              aria-label="Open navigation menu"
            >
              <Menu size={18} />
            </button>
            <span className="font-semibold text-sm text-slate-900 dark:text-white">SAMP Operations</span>
          </div>
        )}
        {!hideHeader && (
          <DashboardHeader
            title={title}
            subtitle={subtitle}
            user={user}
            onLogout={onLogout}
            hideActions={hideHeaderActions}
            onOpenMobileNav={() => setIsMobileNavOpen(true)}
            onRefresh={onRefresh}
            isRefreshing={isRefreshing}
          />
        )}
        {children}
      </main>
    </div>
  );
};
