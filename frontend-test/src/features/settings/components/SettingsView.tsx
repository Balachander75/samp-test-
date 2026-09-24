import React, { useState } from "react";
import { SettingsProfileData } from "../types";
import { useSettingsForm } from "../hooks/useSettingsForm";
import { ProfileSettingsCard } from "./ProfileSettingsCard";
import { SecuritySettingsCard } from "./SecuritySettingsCard";
import { AlertPreferencesCard } from "./AlertPreferencesCard";
import { CheckCircle2, Save, RefreshCw, Factory, Plus } from "@/components/ui/icons";
import { PlantManagementModal } from "@/features/sample-requests/components/PlantManagementModal";

interface SettingsViewProps {
  user?: SettingsProfileData | null;
  onUserUpdated?: (profile: SettingsProfileData) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ user, onUserUpdated }) => {
  const [isPlantModalOpen, setIsPlantModalOpen] = useState(false);
  const isAdmin = user?.role.toLowerCase() === "admin" || user?.userid === "admin";

  const {
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
  } = useSettingsForm(user || undefined, onUserUpdated);

  return (
    <div className="max-w-4xl space-y-6">
      {saveSuccess && (
        <div className="flex items-center gap-2.5 rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-800 animate-in fade-in slide-in-from-top-2 duration-300 shadow-sm">
          <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          <span className="font-semibold">
            Settings updated successfully! Changes are active.
          </span>
        </div>
      )}

      {error && (
        <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4 text-sm text-rose-700 shadow-sm">
          {error}
        </div>
      )}

      {/* Manufacturing Plants Master & History Card */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-card hover:shadow-card-hover transition-all">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white dark:bg-black dark:border dark:border-slate-700 shadow-xs">
              <Factory size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Manufacturing Plants Master & History
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                View active plants (1503- Silvasa, 1505- Khaniwade, 1003- Pariya), production routing & capacities.
              </p>
            </div>
          </div>
          {isAdmin && (
            <button
              type="button"
              onClick={() => setIsPlantModalOpen(true)}
              className="flex items-center gap-2 h-10 px-4 rounded-xl bg-gradient-to-r from-slate-900 via-slate-950 to-black hover:from-black hover:to-slate-900 text-white font-semibold text-xs shadow-md shadow-black/25 border border-slate-800 active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap self-start sm:self-auto select-none"
            >
              <Plus size={15} className="stroke-[2.5]" />
              <span>Manage Plants & History</span>
            </button>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <ProfileSettingsCard
          profile={profile}
          onChange={handleProfileChange}
        />

        <SecuritySettingsCard
          security={security}
          onChange={handleSecurityChange}
        />

        <AlertPreferencesCard
          preferences={preferences}
          onToggle={handlePreferencesToggle}
        />

        {/* Action Button */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-200/80 dark:border-slate-800">
          <p className="text-xs text-slate-400 font-mono">
            All configuration parameters are synced locally
          </p>

          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 h-11 px-6 rounded-xl bg-gradient-to-r from-slate-900 via-slate-950 to-black hover:from-black hover:to-slate-900 text-white font-bold text-sm shadow-md shadow-black/30 border border-slate-800 active:scale-[0.98] hover:shadow-lg transition-all disabled:opacity-60 cursor-pointer select-none"
          >
            {isSaving ? (
              <RefreshCw size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            <span>{isSaving ? "Saving Settings..." : "Save Changes"}</span>
          </button>
        </div>
      </form>

      {/* Plant Management Modal */}
      <PlantManagementModal
        isOpen={isPlantModalOpen}
        onClose={() => setIsPlantModalOpen(false)}
        currentUser={user ? { name: user.name } : null}
      />
    </div>
  );
};
