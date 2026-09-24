import { useSignInForm } from "../hooks/useSignInForm";
import { AuthResponse } from "../types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export interface SignInCardProps {
  onSuccess?: (response: AuthResponse) => void;
}

function MailIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="m15 18-.722-3.25" />
      <path d="M2 2l20 20" />
      <path d="M8.71 8.71a4 4 0 0 0 5.58 5.58" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function ShieldLockIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

export function SignInCard({ onSuccess }: SignInCardProps) {
  const {
    credentials,
    state,
    showPassword,
    handleInputChange,
    togglePasswordVisibility,
    handleSubmit,
  } = useSignInForm(onSuccess);

  return (
    <div className="w-full max-w-[400px] rounded-2xl bg-white p-6 sm:p-7 shadow-[0_20px_50px_-12px_rgba(99,102,241,0.12),0_8px_24px_-8px_rgba(15,23,42,0.08)] border border-slate-200/80 border-t-2 border-t-indigo-500 transition-all duration-200">
      {/* Title & Context */}
      <div className="text-left mb-4 sm:mb-5">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-200/70 px-2 py-0.5 rounded-md">
            Enterprise Portal
          </span>
          <span className="text-[10px] font-semibold text-slate-400">
            Secure Access
          </span>
        </div>
        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
          Sign In
        </h1>
        <p className="mt-1 text-xs text-slate-500 leading-relaxed">
          Enter your corporate credentials to access the platform.
        </p>
      </div>

      {/* Success Notification */}
      {state.isSuccess && state.user && (
        <div className="mb-4 flex items-start gap-2.5 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 animate-in fade-in slide-in-from-top-1 duration-200">
          <span className="mt-0.5 rounded-full bg-emerald-100 p-0.5 text-emerald-700">
            <CheckIcon />
          </span>
          <div>
            <p className="font-bold text-emerald-900">
              Welcome back, {state.user.name}!
            </p>
            <p className="text-[11px] text-emerald-700 mt-0.5">
              Signed in as {state.user.email}
            </p>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {state.error && (
        <div className="mb-4 rounded-xl bg-rose-50 border border-rose-200 p-2.5 text-xs font-semibold text-rose-700 flex items-start gap-2">
          <span className="text-rose-500 font-bold leading-none mt-0.5">✕</span>
          <span className="leading-relaxed">{state.error}</span>
        </div>
      )}

      {/* Form Elements */}
      <form onSubmit={handleSubmit} className="space-y-3.5">
        {/* Email / Username Field */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            Corporate Email or Username
          </label>
          <Input
            type="text"
            inputSize="default"
            value={credentials.email}
            onChange={(e) => handleInputChange("email", e.target.value)}
            placeholder="name@navneet.com or username"
            icon={<MailIcon />}
            required
            autoComplete="username"
            className="text-xs sm:text-sm font-medium h-10"
          />
        </div>

        {/* Password Field */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            Password
          </label>
          <Input
            type={showPassword ? "text" : "password"}
            inputSize="default"
            value={credentials.password}
            onChange={(e) => handleInputChange("password", e.target.value)}
            placeholder="••••••••••••"
            icon={<LockIcon />}
            rightElement={
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1.5 focus:outline-none rounded-lg hover:bg-slate-100 cursor-pointer"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            }
            required
            autoComplete="current-password"
            className="text-xs sm:text-sm font-medium h-10"
          />
        </div>

        {/* Remember me Option */}
        <div className="flex items-center justify-between text-xs pt-0.5">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={credentials.rememberMe}
              onChange={(e) => handleInputChange("rememberMe", e.target.checked)}
              className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer accent-indigo-600"
            />
            <span className="text-slate-600 font-medium text-xs">
              Remember this device
            </span>
          </label>
        </div>

        {/* Submit Action */}
        <div className="pt-1.5">
          <Button
            type="submit"
            buttonSize="default"
            isLoading={state.isLoading}
            className="btn-press group w-full text-xs sm:text-sm font-bold flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-600/20 active:scale-[0.98] transition-all cursor-pointer h-10"
          >
            <span>Sign In to Platform</span>
            {!state.isLoading && <ArrowRightIcon />}
          </Button>
        </div>

        {/* Enterprise Compliance Notice */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[10px] text-slate-400 font-medium text-center">
          <ShieldLockIcon />
          <span>Authorized personnel only · 256-bit SSL encrypted</span>
        </div>
      </form>
    </div>
  );
}
