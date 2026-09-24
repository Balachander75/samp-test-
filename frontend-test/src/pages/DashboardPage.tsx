import React from "react";
import { UserProfileInfo, DashboardLayout, DashboardOverview } from "@/features/dashboard";

export interface DashboardPageProps {
  user?: UserProfileInfo | null;
  onLogout?: () => void;
  tabTitle?: string;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  user,
  onLogout,
  tabTitle = "Dashboard",
}) => {
  return (
    <DashboardLayout
      user={user}
      onLogout={onLogout}
      title={tabTitle}
      hideHeader={tabTitle === "Dashboard"}
      hideHeaderActions={tabTitle === "Dashboard"}
    >
      <DashboardOverview user={user} />
    </DashboardLayout>
  );
};

export default DashboardPage;
