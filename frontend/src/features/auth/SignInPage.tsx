import React, { useState, useEffect } from "react";
import { User, Lock, Eye, EyeOff, Sun, Moon, AlertCircle, X } from "lucide-react";
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

interface ParsedError {
  message: string;
  code?: string;
}

/** Extract the most useful error message and code from any backend response shape. */
function parseErrorMessage(data: Record<string, unknown>): ParsedError {
  // Structured: { detail: { error: { message: "...", code: "..." } } }
  const detail = data?.detail as Record<string, unknown> | undefined;
  if (detail?.error) {
    const err = detail.error as Record<string, unknown>;
    return {
      message: (err.message as string) || "Authentication failed.",
      code: (err.code as string) || undefined,
    };
  }
  // Flat: { detail: "string" }
  if (typeof detail === "string") return { message: detail };
  // Legacy: { message: "..." }
  return {
    message: (data?.message as string) || "Invalid credentials. Please try again.",
    code: (data?.code as string) || undefined,
  };
}

export const SignInPage: React.FC<SignInPageProps> = ({ onSignInSuccess }) => {
  const { theme, toggleTheme } = useTheme();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorInfo, setErrorInfo] = useState<ParsedError | null>(null);

  // Auto-dismiss popup error message after 6 seconds
  useEffect(() => {
    if (!errorInfo) return;
    const timer = setTimeout(() => {
      setErrorInfo(null);
    }, 6000);
    return () => clearTimeout(timer);
  }, [errorInfo]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = identifier.trim();
    if (!cleanId) {
      setErrorInfo({
        message: "Please enter your username or email address.",
        code: "REQUIRED_FIELD",
      });
      return;
    }
    if (!password) {
      setErrorInfo({
        message: "Please enter your password.",
        code: "REQUIRED_FIELD",
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
          // legacy field aliases for compatibility
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
          message: "Unexpected response from the authentication server. Please try again.",
          code: "INVALID_SERVER_RESPONSE",
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
        message: "Unable to reach the authentication server. Please check your connection and try again.",
        code: "NETWORK_ERROR",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full relative flex flex-col justify-center items-center p-3 sm:p-6 lg:p-8 select-none overflow-x-hidden overflow-y-auto">
      {/* Background */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <img
          src={brandHeroImg}
          alt="Navneet Enterprise"
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-black/45 dark:bg-black/80 backdrop-blur-[2.5px] transition-colors duration-300" />
      </div>

      {/* Top bar: Brand Logo */}
      <div className="fixed top-6 left-6 sm:left-8 z-30 flex items-center">
        <img
          src={logoImg}
          alt="Navneet"
          className="h-12 sm:h-14 w-auto object-contain filter drop-shadow-[0_2px_12px_rgba(0,0,0,0.7)]"
        />
      </div>

      {/* Top bar: Theme Toggle */}
      <div className="fixed top-6 right-6 sm:right-8 z-30">
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          className="group flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold cursor-pointer transition-all duration-200 backdrop-blur-md erp-theme-toggle"
        >
          {theme === "dark" ? (
            <>
              <Sun className="w-4 h-4 text-amber-400" />
              <span>Light Mode</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-indigo-600" />
              <span>Dark Mode</span>
            </>
          )}
        </button>
      </div>

      {/* Sleek Floating Bottom Error Notification Popup */}
      {errorInfo && (
        <div
          role="alert"
          aria-live="assertive"
          className="fixed bottom-6 sm:bottom-8 left-1/2 z-50 w-[92%] max-w-[460px] animate-smooth-toast-bottom"
        >
          <div className="relative overflow-hidden rounded-lg bg-white/95 dark:bg-[#0c0e14]/95 backdrop-blur-xl border border-rose-500/30 dark:border-rose-500/40 shadow-[0_16px_40px_rgba(0,0,0,0.25)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.85)] text-zinc-900 dark:text-zinc-100 flex flex-col">
            <div className="flex items-start gap-3.5 p-3.5 sm:p-4">
              {/* Left accent pill icon */}
              <div className="w-8 h-8 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 mt-0.5 border border-rose-500/20 shadow-xs">
                <AlertCircle className="w-4 h-4" />
              </div>

              {/* Text content */}
              <div className="flex-1 min-w-0 pr-1">
                <div className="flex items-center gap-2">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                  <h4 className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400 font-mono">
                    {errorInfo.code ? errorInfo.code.replace(/_/g, " ") : "Authentication Alert"}
                  </h4>
                </div>
                <p className="mt-1 text-xs sm:text-[13px] text-zinc-700 dark:text-zinc-300 leading-snug break-words">
                  {errorInfo.message}
                </p>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setErrorInfo(null)}
                className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors rounded hover:bg-zinc-100 dark:hover:bg-zinc-800/80 shrink-0 cursor-pointer"
                aria-label="Dismiss error"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Subtle Progress Bar Countdown */}
            <div className="w-full h-[2px] bg-rose-500/10 dark:bg-rose-500/20 overflow-hidden">
              <div className="h-full bg-rose-500/60 dark:bg-rose-500/70 animate-toast-progress" />
            </div>
          </div>
        </div>
      )}

      {/* Sign-In Card */}
      <main className="relative z-10 w-full max-w-[440px] sm:max-w-[460px] md:max-w-[480px] my-auto py-4 sm:py-6">
        <div className="w-full rounded-xl p-6 sm:p-8 md:p-9 transition-colors duration-200 erp-auth-card backdrop-blur-xl">
          {/* Header */}
          <div className="mb-6 sm:mb-7">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-white leading-tight">
              Sign In
            </h1>
          </div>

          {/* Form */}
          <form onSubmit={handleFormSubmit} className="space-y-4" noValidate>
            <div>
              <label
                htmlFor="identifier"
                className="block text-xs sm:text-[13px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5"
              >
                Username or Email Address
              </label>
              <Input
                id="identifier"
                inputSize="lg"
                type="text"
                autoComplete="username"
                value={identifier}
                onChange={(e) => {
                  setIdentifier(e.target.value);
                  if (errorInfo) setErrorInfo(null);
                }}
                placeholder="Admin  or  name@navneet.com"
                leftIcon={<User className="w-4 h-4" />}
                hasError={Boolean(errorInfo)}
                required
                autoFocus
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs sm:text-[13px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5"
              >
                Password
              </label>
              <Input
                id="password"
                inputSize="lg"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorInfo) setErrorInfo(null);
                }}
                placeholder="••••••••••••"
                leftIcon={<Lock className="w-4 h-4" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors p-1 cursor-pointer"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
                hasError={Boolean(errorInfo)}
                required
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 sm:gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  id="rememberMe"
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
              className="w-full mt-3 font-semibold h-11 sm:h-12 text-sm sm:text-base cursor-pointer shadow-md hover:shadow-lg"
            >
              {isLoading ? "Signing In…" : "Sign In to Workspace"}
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
};
