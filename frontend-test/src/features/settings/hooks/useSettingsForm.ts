import { useState } from "react";
import { SettingsProfileData, SettingsSecurityData, SettingsPreferencesData } from "../types";
import { updateCurrentUserApi } from "@/features/dashboard/api";

export function useSettingsForm(
  initialProfile?: SettingsProfileData,
  onSaved?: (profile: SettingsProfileData) => void,
) {
  const [profile, setProfile] = useState<SettingsProfileData>({
    name: initialProfile?.name || "Admin",
    userid: initialProfile?.userid || "admin",
    email: initialProfile?.email || "admin@example.com",
    role: initialProfile?.role || "admin",
  });

  const [security, setSecurity] = useState<SettingsSecurityData>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [preferences, setPreferences] = useState<SettingsPreferencesData>({
    emailNotifs: true,
    securityAlerts: true,
    stageTransitionAlerts: true,
    plantCapacityAlerts: false,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleProfileChange = (field: keyof SettingsProfileData, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const handleSecurityChange = (field: keyof SettingsSecurityData, value: string) => {
    setSecurity((prev) => ({ ...prev, [field]: value }));
  };

  const handlePreferencesToggle = (field: keyof SettingsPreferencesData) => {
    setPreferences((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (security.newPassword && security.newPassword !== security.confirmPassword) {
      setError("New passwords do not match.");
      return;
    }
    setError(null);
    if (security.newPassword && !security.currentPassword) {
      setError("Enter your current password to change your password.");
      return;
    }

    setIsSaving(true);
    const result = await updateCurrentUserApi({
      name: profile.name.trim(),
      userid: profile.userid.trim(),
      email: profile.email.trim(),
      current_password: security.currentPassword || undefined,
      new_password: security.newPassword || undefined,
    });

    if (!result.success || !result.user) {
      setError(result.error || "Failed to save account settings.");
      setIsSaving(false);
      return;
    }

    const savedProfile = {
      name: result.user.name,
      userid: result.user.userid,
      email: result.user.email,
      role: result.user.role,
    };
    setProfile(savedProfile);
    onSaved?.(savedProfile);
    setIsSaving(false);
    setSaveSuccess(true);
    setSecurity({ currentPassword: "", newPassword: "", confirmPassword: "" });
    window.setTimeout(() => setSaveSuccess(false), 4000);
  };

  return {
    profile,
    security,
    preferences,
    isSaving,
    saveSuccess,
    error,
    handleProfileChange,
    handleSecurityChange,
    handlePreferencesToggle,
    handleSubmit,
  };
}
