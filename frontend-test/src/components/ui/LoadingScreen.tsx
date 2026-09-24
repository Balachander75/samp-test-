import React from "react";
import logoImg from "@/assets/logo.png";

export interface LoadingScreenProps {
  message?: string;
  variant?: "fullscreen" | "inline" | "card";
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = "Loading...",
  variant = "fullscreen",
}) => {
  if (variant === "card" || variant === "inline") {
    return (
      <div className="flex flex-col items-center justify-center p-10 text-center space-y-4 animate-in fade-in duration-200">
        <img
          src={logoImg}
          alt="Navneet"
          className="h-9 w-auto object-contain animate-pulse"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/logo.png";
          }}
        />
        {/* Single Sleek Loading Bar */}
        <div className="w-40 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden relative">
          <div className="absolute inset-y-0 bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-600 rounded-full w-20 animate-[progress-slide_1.3s_cubic-bezier(0.4,0,0.2,1)_infinite] shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
        </div>
        <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 tracking-wide">
          {message}
        </p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[999] flex flex-col items-center justify-center bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-md animate-in fade-in duration-150 select-none">
      {/* Subtle Ambient Radial Glow */}
      <div className="pointer-events-none absolute h-64 w-64 rounded-full bg-blue-500/8 dark:bg-blue-500/15 blur-3xl animate-pulse" />

      <div className="relative flex flex-col items-center space-y-5">
        {/* Brand Logo */}
        <div className="flex items-center justify-center">
          <img
            src={logoImg}
            alt="Navneet"
            className="h-12 w-auto object-contain animate-pulse"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/logo.png";
            }}
          />
        </div>

        {/* The Single Ultra-Sleek Loading Bar */}
        <div className="w-48 sm:w-56 h-1 bg-slate-200/70 dark:bg-slate-800 rounded-full overflow-hidden relative">
          <div className="absolute inset-y-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 rounded-full w-24 animate-[progress-slide_1.3s_cubic-bezier(0.4,0,0.2,1)_infinite] shadow-[0_0_10px_rgba(99,102,241,0.6)]" />
        </div>

        {/* Minimal status text */}
        <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
          {message}
        </span>
      </div>
    </div>
  );
};
