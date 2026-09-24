import React from "react";
import { SettingsSecurityData } from "../types";
import { Key, Lock } from "@/components/ui/icons";

interface SecuritySettingsCardProps {
  security: SettingsSecurityData;
  onChange: (field: keyof SettingsSecurityData, value: string) => void;
}

export const SecuritySettingsCard: React.FC<SecuritySettingsCardProps> = ({
  security,
  onChange,
}) => {
  return (
    <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-7 shadow-card hover:shadow-card-hover transition-all space-y-5">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-900/60">
            <Key size={18} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Security & Credentials
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Update your administrative password and credential authentication.
            </p>
          </div>
        </div>

        <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500 hidden sm:inline">
          Leave blank to retain current
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
            Current Password
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
              <Lock size={15} />
            </div>
            <input
              type="password"
              value={security.currentPassword || ""}
              onChange={(e) => onChange("currentPassword", e.target.value)}
              placeholder="••••••••••••"
              className="w-full h-10.5 pl-10 pr-4 text-sm bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/90 dark:border-slate-700/90 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all font-medium font-mono"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
            New Password
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
              <Key size={15} />
            </div>
            <input
              type="password"
              value={security.newPassword || ""}
              onChange={(e) => onChange("newPassword", e.target.value)}
              placeholder="••••••••••••"
              className="w-full h-10.5 pl-10 pr-4 text-sm bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/90 dark:border-slate-700/90 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all font-medium font-mono"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
            Confirm New Password
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
              <Key size={15} />
            </div>
            <input
              type="password"
              value={security.confirmPassword || ""}
              onChange={(e) => onChange("confirmPassword", e.target.value)}
              placeholder="••••••••••••"
              className="w-full h-10.5 pl-10 pr-4 text-sm bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/90 dark:border-slate-700/90 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all font-medium font-mono"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

