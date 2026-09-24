import React from "react";
import { UserProfileInfo, DashboardLayout } from "@/features/dashboard";
import { SettingsView } from "@/features/settings";
import { SettingsProfileData } from "@/features/settings";

export interface SettingsPageProps {
  user?: UserProfileInfo | null;
  onLogout?: () => void;
  onUserUpdated?: (profile: SettingsProfileData) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ user, onLogout, onUserUpdated }) => {
  return (
    <DashboardLayout
      user={user}
      onLogout={onLogout}
      title="Account Settings"
      subtitle="Manage your credentials, security preferences, and system parameters."
    >
      <SettingsView user={user} onUserUpdated={onUserUpdated} />
    </DashboardLayout>
  );
};

export default SettingsPage;
