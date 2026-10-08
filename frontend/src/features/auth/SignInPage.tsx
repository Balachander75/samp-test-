import React, { useState, useEffect } from "react";
import { User, Lock, Eye, EyeOff, ArrowRight, Loader2, X, ShieldCheck, AlertCircle } from "lucide-react";
import { AuthResponse } from "./types";
import { API_BASE_URL } from "@/infrastructure/api/client";
import { persistAuthSession } from "@/lib/session";
import logoImg from "@/assets/logo.png";
import brandHeroImg from "@/assets/brand-hero.jpg";

export interface SignInPageProps {
  onSignInSuccess: (response: AuthResponse) => void;
}

interface ParsedError {
  message: string;
  code?: string;
  field?: "identifier" | "password" | "general";
}

/** Extract error message and code from backend response shape */
function parseErrorMessage(data: Record<string, unknown>): ParsedError {
  const detail = data?.detail as Record<string, unknown> | undefined;
  if (detail?.error) {
    const err = detail.error as Record<string, unknown>;
    return {
      message: (err.message as string) || "Authentication failed.",
      code: (err.code as string) || undefined,
      field: "general",
    };
  }
  if (typeof detail === "string") return { message: detail, field: "general" };
  return {
    message: (data?.message as string) || "Invalid credentials. Please verify username and password.",
    code: (data?.code as string) || undefined,
    field: "general",
  };
}

export const SignInPage: React.FC<SignInPageProps> = ({ onSignInSuccess }) => {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorInfo, setErrorInfo] = useState<ParsedError | null>(null);

  // Auto-dismiss floating toast notification after 5 seconds
  useEffect(() => {
    if (!errorInfo) return;
    const timer = setTimeout(() => {
      setErrorInfo(null);
    }, 5000);
    return () => clearTimeout(timer);
  }, [errorInfo]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = identifier.trim();

    if (!cleanId) {
      setErrorInfo({
        message: "Please enter your username or email.",
        code: "REQUIRED_FIELD",
        field: "identifier",
      });
      return;
    }
    if (!password) {
      setErrorInfo({
        message: "Please enter your password.",
        code: "REQUIRED_FIELD",
        field: "password",
      });
      return;
    }

    setIsLoading(true);
    setErrorInfo(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          identifier: cleanId,
          userid: cleanId,
          username: cleanId,
          email: cleanId,
          password,
          remember_me: rememberMe,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorInfo(parseErrorMessage(data));
        return;
      }

      const token = data.access_token || data.token || "";
      const user = data.user;

      if (!token || !user) {
        setErrorInfo({
          message: "Unexpected response from authentication service. Please try again.",
          code: "INVALID_SERVER_RESPONSE",
          field: "general",
        });
        return;
      }

      const authData: AuthResponse = {
        access_token: token,
        refresh_token: data.refresh_token,
        token_type: "bearer",
        expires_in: data.expires_in,
        user,
      };

      persistAuthSession(token, user, rememberMe, data.refresh_token);
      onSignInSuccess(authData);
    } catch {
      setErrorInfo({
        message: "Unable to reach authentication server. Please check your network connection.",
        code: "NETWORK_ERROR",
        field: "general",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full relative flex flex-col justify-center items-center p-4 sm:p-6 select-none overflow-hidden font-sans">
      {/* Brand Hero Background - Crystal Clear in Both Light & Night/Dark Mode */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <img
          src={brandHeroImg}
          alt=""
          className="h-full w-full object-cover object-center scale-105 transition-transform duration-1000 opacity-90 dark:opacity-75"
        />
        {/* Cinematic atmospheric overlay: keeps hero photo rich and visible in dark mode without blacking out */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/30 to-black/60 dark:from-black/70 dark:via-black/50 dark:to-black/80 backdrop-blur-[1px]" />

        {/* Luminous subtle energy ambient glow in corners */}
        <div className="absolute -top-[10%] left-[15%] w-[500px] h-[500px] rounded-full bg-[#00d166]/15 dark:bg-[#00d166]/10 blur-[130px]" />
        <div className="absolute -bottom-[15%] right-[15%] w-[550px] h-[550px] rounded-full bg-[#0070ff]/15 dark:bg-[#0070ff]/10 blur-[140px]" />
      </div>

      {/* Luminous Floating Notification Toast for Exceptions */}
      {errorInfo && (
        <div
          role="alert"
          aria-live="assertive"
          className="fixed bottom-6 right-6 z-50 max-w-[400px] w-[calc(100vw-3rem)] animate-in fade-in slide-in-from-bottom-4 duration-200"
        >
          <div className="bg-white/95 dark:bg-[#0e121a]/95 backdrop-blur-2xl text-slate-900 dark:text-white p-4 rounded-2xl shadow-[0_20px_50px_-10px_rgba(225,29,72,0.25)] dark:shadow-[0_20px_50px_-10px_rgba(0,0,0,0.8)] border border-rose-200/80 dark:border-rose-900/40 flex items-start gap-3.5 text-xs">
            {/* Luminous alert badge icon */}
            <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-500 flex items-center justify-center shrink-0 border border-rose-200/60 dark:border-rose-800/40 shadow-xs">
              <AlertCircle className="w-4.5 h-4.5" />
            </div>

            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-rose-500 tracking-wider uppercase text-[10px] font-display">
                  {errorInfo.code ? errorInfo.code.replace(/_/g, " ") : "Authentication Notice"}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              </div>
              <p className="text-slate-700 dark:text-slate-200 text-xs font-medium leading-relaxed">
                {errorInfo.message}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setErrorInfo(null)}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
              aria-label="Close notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Sign-In Floating Card */}
      <main className="relative z-10 w-full max-w-[420px]">
        {/* High-Contrast Frosted Glass Card */}
        <div className="bg-white/95 dark:bg-[#0e121a]/95 backdrop-blur-2xl rounded-3xl border border-white/60 dark:border-white/10 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.4)] dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] p-7 sm:p-9 transition-colors duration-150">
          
          {/* Brand Header: Compact & Tight with Title */}
          <div className="flex flex-col items-center mb-6 text-center">
            <img
              src={logoImg}
              alt="Navneet"
              className="h-11 sm:h-12 w-auto object-contain mb-2.5 drop-shadow-xs"
            />
            <h1 className="text-2xl font-bold font-display tracking-tight text-slate-900 dark:text-white">
              Sign In
            </h1>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
              Enter your corporate credentials to continue
            </p>
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-5" noValidate>
            {/* Username / Email Field */}
            <div>
              <label
                htmlFor="identifier"
                className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1.5 font-display"
              >
                Username or Email
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 text-slate-400 dark:text-slate-400 pointer-events-none">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="identifier"
                  type="text"
                  autoComplete="username"
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    if (errorInfo) setErrorInfo(null);
                  }}
                  placeholder="Enter your corporate ID"
                  autoFocus
                  required
                  className={`w-full h-11 pl-10 pr-3.5 text-sm rounded-xl bg-slate-50 dark:bg-[#161c26] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 border border-slate-200/90 dark:border-white/10 transition-all duration-150 outline-none ${
                    errorInfo?.field === "identifier"
                      ? "border-rose-500 focus:border-rose-500 ring-2 ring-rose-500/15"
                      : "focus:border-[#00d166] dark:focus:border-[#00d166] focus:ring-2 focus:ring-[#00d166]/20 focus:bg-white dark:focus:bg-[#1a2230]"
                  }`}
                />
              </div>
              {errorInfo?.field === "identifier" && (
                <p className="mt-1.5 text-[11px] text-rose-500 font-medium">
                  {errorInfo.message}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1.5 font-display"
              >
                Password
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 text-slate-400 dark:text-slate-400 pointer-events-none">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorInfo) setErrorInfo(null);
                  }}
                  placeholder="••••••••••••"
                  required
                  className={`w-full h-11 pl-10 pr-10 text-sm rounded-xl bg-slate-50 dark:bg-[#161c26] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 border border-slate-200/90 dark:border-white/10 transition-all duration-150 outline-none font-mono ${
                    errorInfo?.field === "password"
                      ? "border-rose-500 focus:border-rose-500 ring-2 ring-rose-500/15"
                      : "focus:border-[#00d166] dark:focus:border-[#00d166] focus:ring-2 focus:ring-[#00d166]/20 focus:bg-white dark:focus:bg-[#1a2230]"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors p-0.5 cursor-pointer"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errorInfo?.field === "password" && (
                <p className="mt-1.5 text-[11px] text-rose-500 font-medium">
                  {errorInfo.message}
                </p>
              )}
            </div>

            {/* Remember Me Option */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded-md border-slate-300 dark:border-zinc-700 text-[#00d166] focus:ring-[#00d166]/20 accent-[#00a854] cursor-pointer"
                />
                <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                  Keep me signed in
                </span>
              </label>

              <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 font-mono">
                <ShieldCheck className="w-3.5 h-3.5 text-[#00d166]" />
                256-bit Secure
              </span>
            </div>

            {/* High-Contrast Luminous Emerald Action Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 py-3 px-4 rounded-xl bg-[#00d166] hover:bg-[#00ba5a] active:bg-[#009e4d] text-slate-950 font-bold font-display text-sm sm:text-[15px] flex items-center justify-center gap-2.5 shadow-lg shadow-[#00d166]/30 hover:shadow-[#00d166]/45 active:scale-[0.99] transition-all duration-150 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                    <span>Authenticating…</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to System</span>
                    <ArrowRight className="w-4.5 h-4.5 text-slate-950" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* High-Legibility Footer */}
        <p className="mt-6 text-center text-xs text-white/85 dark:text-white/65 font-medium font-display drop-shadow-sm">
          Navneet Education Limited • Enterprise Operations
        </p>
      </main>
    </div>
  );
};
