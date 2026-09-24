import React from "react";
import { SettingsProfileData } from "../types";
import { User, Mail, Shield, Hash } from "@/components/ui/icons";

interface ProfileSettingsCardProps {
  profile: SettingsProfileData;
  onChange: (field: keyof SettingsProfileData, value: string) => void;
}

export const ProfileSettingsCard: React.FC<ProfileSettingsCardProps> = ({ profile, onChange }) => {
  const initials = profile.name
    ? profile.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "AD";

  return (
    <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-7 shadow-card hover:shadow-card-hover transition-all space-y-6">
      {/* Header with Avatar Hero Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white dark:bg-blue-600 font-mono font-bold text-sm shadow-sm ring-4 ring-slate-100 dark:ring-slate-800">
            {initials}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {profile.name || "Administrator"}
              </h2>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60 font-mono">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Active
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Personal credentials and system identifier
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/70 dark:border-blue-800/60 capitalize font-mono">
            Role: {profile.role || "Admin"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
            Display Name
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
              <User size={15} />
            </div>
            <input
              type="text"
              value={profile.name}
              onChange={(e) => onChange("name", e.target.value)}
              className="w-full h-10.5 pl-10 pr-4 text-sm bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/90 dark:border-slate-700/90 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all font-medium"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
            User ID / Handle
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
              <Hash size={15} />
            </div>
            <input
              type="text"
              value={profile.userid}
              onChange={(e) => onChange("userid", e.target.value)}
              className="w-full h-10.5 pl-10 pr-4 text-sm bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/90 dark:border-slate-700/90 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all font-mono font-medium"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
            Email Address
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
              <Mail size={15} />
            </div>
            <input
              type="email"
              value={profile.email}
              onChange={(e) => onChange("email", e.target.value)}
              className="w-full h-10.5 pl-10 pr-4 text-sm bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/90 dark:border-slate-700/90 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all font-medium"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
            System Permission Level
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
              <Shield size={15} />
            </div>
            <div className="w-full h-10.5 pl-10 pr-4 flex items-center bg-slate-100/80 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 select-none">
              <span className="capitalize">{profile.role || "Admin"}</span>
              <span className="ml-2 text-slate-400 font-normal">· Full Read, Write & Plant Dispatch Privileges</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

