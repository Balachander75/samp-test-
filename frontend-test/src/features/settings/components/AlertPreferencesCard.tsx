import React from "react";
import { SettingsPreferencesData } from "../types";
import { Bell, Mail, ShieldCheck, Factory, Layers } from "@/components/ui/icons";

interface AlertPreferencesCardProps {
  preferences: SettingsPreferencesData;
  onToggle: (field: keyof SettingsPreferencesData) => void;
}

interface ToggleSwitchProps {
  checked: boolean;
  onChange: () => void;
  id: string;
  label: string;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ checked, onChange, id, label }) => {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      id={id}
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 select-none ${
        checked ? "bg-blue-600 dark:bg-blue-500" : "bg-slate-200 dark:bg-slate-700"
      }`}
    >
      <span className="sr-only">{label}</span>
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
};

export const AlertPreferencesCard: React.FC<AlertPreferencesCardProps> = ({
  preferences,
  onToggle,
}) => {
  const items = [
    {
      key: "emailNotifs" as const,
      title: "Email Reports & Summaries",
      desc: "Receive weekly pipeline metrics and transaction summaries directly via email.",
      icon: Mail,
      iconColor: "text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60 border-sky-200/80 dark:border-sky-800/60",
      checked: preferences.emailNotifs,
    },
    {
      key: "securityAlerts" as const,
      title: "Security & Login Alerts",
      desc: "Instant notifications whenever a new administrative session or password change occurs.",
      icon: ShieldCheck,
      iconColor: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200/80 dark:border-emerald-800/60",
      checked: preferences.securityAlerts,
    },
    {
      key: "stageTransitionAlerts" as const,
      title: "Pipeline & Stage Movements",
      desc: "Notify when sample requests transition across Creative, Studio, SAMP, or Plant stages.",
      icon: Layers,
      iconColor: "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200/80 dark:border-indigo-800/60",
      checked: Boolean(preferences.stageTransitionAlerts),
    },
    {
      key: "plantCapacityAlerts" as const,
      title: "Plant Capacity Threshold Warnings",
      desc: "Proactive alert when any manufacturing facility exceeds 85% batch capacity.",
      icon: Factory,
      iconColor: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border-amber-200/80 dark:border-amber-800/60",
      checked: Boolean(preferences.plantCapacityAlerts),
    },
  ];

  return (
    <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-7 shadow-card hover:shadow-card-hover transition-all">
      <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-900/60">
            <Bell size={18} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Notification & Alert Preferences
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Control where and how you receive alerts across the enterprise workflow.
            </p>
          </div>
        </div>

        <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500 hidden sm:inline">
          Auto-saved on submit
        </span>
      </div>

      <div className="space-y-3">
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.key}
              onClick={() => onToggle(item.key)}
              className={`group flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer select-none ${
                item.checked
                  ? "bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-750 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs"
                  : "bg-slate-50/50 dark:bg-slate-850/30 border-slate-150 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-850/60 opacity-85"
              }`}
            >
              <div className="flex items-start gap-3.5 pr-4">
                <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${item.iconColor}`}>
                  <Icon size={16} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {item.title}
                    </p>
                    <span
                      className={`text-[10px] font-mono font-medium px-1.5 py-0.2 rounded ${
                        item.checked
                          ? "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
                          : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                      }`}
                    >
                      {item.checked ? "Active" : "Muted"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>

              <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                <ToggleSwitch
                  id={`toggle-${item.key}`}
                  label={item.title}
                  checked={item.checked}
                  onChange={() => onToggle(item.key)}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

