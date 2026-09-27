import React, { useState } from "react";
import { User, Lock, Eye, EyeOff, Sun, Moon, Shield } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AuthResponse } from "./types";
import { API_BASE_URL } from "@/lib/api";
import { persistAuthSession } from "@/lib/session";
import { useTheme } from "@/context/ThemeContext";
import logoImg from "@/assets/logo.png";
import brandHeroImg from "@/assets/brand-hero.jpg";

export interface SignInPageProps {
  onSignInSuccess: (response: AuthResponse) => void;
}

export const SignInPage: React.FC<SignInPageProps> = ({ onSignInSuccess }) => {
  const { theme, toggleTheme } = useTheme();
  const [identifier, setIdentifier] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = identifier.trim();
    if (!cleanId || !password) {
      setError("Please enter your account identifier and password.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          userid: cleanId,
          username: cleanId,
          email: cleanId,
          password,
          remember_me: rememberMe,
        }),
      });

      const data = await response.json();

      if (!response.ok || data.ok === false) {
        setError(data?.message || data?.error?.message || "Invalid credentials. Please verify your credentials and try again.");
        setIsLoading(false);
        return;
      }

      const token = data.access_token || data.token || "mock_token";
      const user = data.user || {
        id: 1,
        name: "Balachander",
        userid: cleanId,
        email: cleanId.includes("@") ? cleanId : `${cleanId}@navneet.com`,
        role: "admin",
        sub_role: "Global Admin",
        is_active: true,
      };

      const authData: AuthResponse = {
        access_token: token,
        token_type: "bearer",
        user,
      };

      persistAuthSession(token, user, rememberMe);
      onSignInSuccess(authData);
    } catch {
      setError("Authentication service unavailable. Please check your network connection.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full relative flex flex-col justify-between items-center p-3 sm:p-6 lg:p-8 select-none overflow-x-hidden overflow-y-auto">
      {/* =========================================================
          BACKGROUND: Full Bleed with Smooth Subtle Drift & Dual-Theme Contrast
          ========================================================= */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <img
          src={brandHeroImg}
          alt="Navneet Enterprise"
          className="w-full h-full object-cover object-center animate-bg-drift"
        />
        {/* Dual-theme contrast overlay */}
        <div className="absolute inset-0 bg-black/45 dark:bg-black/80 backdrop-blur-[2.5px] transition-colors duration-300" />
      </div>

      {/* =========================================================
          TOP BAR: Brand Identity (Left) & Adaptive Theme Switcher (Right)
          ========================================================= */}
      <div className="fixed top-6 left-6 sm:left-8 z-30 flex items-center">
        <img
          src={logoImg}
          alt="Navneet"
          className="h-12 sm:h-14 w-auto object-contain filter drop-shadow-[0_2px_12px_rgba(0,0,0,0.7)]"
        />
      </div>

      <div className="fixed top-6 right-6 sm:right-8 z-30">
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          className="group flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold cursor-pointer transition-all duration-200 backdrop-blur-md erp-theme-toggle"
        >
          {theme === "dark" ? (
            <>
              <Sun className="w-4 h-4 text-amber-400 transition-transform group-hover:rotate-45" />
              <span>Light Mode</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-indigo-600 transition-transform group-hover:-rotate-12" />
              <span>Dark Mode</span>
            </>
          )}
        </button>
      </div>

      {/* =========================================================
          CENTER FLOATING CONSOLE: Fluid, Device-Adaptive & High-Density
          ========================================================= */}
      <main className="relative z-10 w-full max-w-[440px] sm:max-w-[460px] md:max-w-[480px] my-auto py-4 sm:py-6">
        <div className="w-full rounded-xl p-5 sm:p-8 md:p-9 transition-colors duration-200 erp-auth-card backdrop-blur-xl">
          {/* Header */}
          <div className="mb-5 sm:mb-7">
            <h1 className="text-xl sm:text-2xl md:text-[28px] font-bold tracking-tight text-zinc-900 dark:text-white leading-tight">
              Enterprise Sign In
            </h1>
            <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-normal">
              Enter your credentials to access the Navneet Enterprise Portal.
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-4 sm:mb-5 p-3 sm:p-3.5 rounded-md bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs sm:text-sm flex items-start gap-2.5 animate-in fade-in duration-150">
              <span className="font-bold text-rose-600 dark:text-rose-400 text-sm leading-none mt-0.5">✕</span>
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleFormSubmit} className="space-y-3.5 sm:space-y-4">
            <div>
              <label className="block text-xs sm:text-[13px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Username or Email Address
              </label>
              <Input
                inputSize="lg"
                type="text"
                autoComplete="username"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="name@navneet.com"
                leftIcon={<User className="w-4 h-4" />}
                hasError={Boolean(error)}
                required
              />
            </div>

            <div>
              <label className="block text-xs sm:text-[13px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Password
              </label>
              <Input
                inputSize="lg"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                leftIcon={<Lock className="w-4 h-4" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors p-1 cursor-pointer"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
                hasError={Boolean(error)}
                required
              />
            </div>

            <div className="flex items-center justify-between pt-0.5 sm:pt-1">
              <label className="flex items-center gap-2 sm:gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-brand-600 focus:ring-brand-500/20 focus:ring-offset-0 focus:ring-1 cursor-pointer shrink-0"
                />
                <span className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 font-medium leading-tight">
                  Keep me signed in
                </span>
              </label>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              className="w-full mt-2 sm:mt-3 font-semibold h-11 sm:h-12 text-sm sm:text-base cursor-pointer shadow-md hover:shadow-lg"
            >
              Sign In to Workspace
            </Button>
          </form>

          {/* Professional Compliance Notice */}
          <div className="mt-5 sm:mt-6 pt-4 sm:pt-5 border-t border-zinc-200/80 dark:border-white/[0.08] flex items-start gap-2.5 text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
            <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-zinc-400 dark:text-zinc-500 shrink-0 mt-0.5" />
            <span>Authorized corporate access only. System activity is logged and subject to audit in accordance with company security policy.</span>
          </div>
        </div>
      </main>

      {/* =========================================================
          FOOTER: Polished Enterprise Copyright (Clean, Seamless Status)
          ========================================================= */}
      <footer className="relative z-10 w-full text-center py-2 sm:py-4 shrink-0">
        <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full transition-all duration-200 backdrop-blur-md erp-footer-pill max-w-full">
          <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[11px] sm:text-xs md:text-[13px] font-medium tracking-wide select-text truncate">
            © 2026 Navneet Education Limited. All rights reserved.
          </span>
        </div>
      </footer>
    </div>
  );
};
