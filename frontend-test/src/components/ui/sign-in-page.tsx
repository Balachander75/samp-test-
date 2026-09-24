import { Eye, EyeOff, RefreshCw, User, Lock } from "lucide-react";
import { useSignInForm } from "@/features/auth/hooks/useSignInForm";
import { AuthResponse } from "@/features/auth/types";
import logoImg from "@/assets/logo.png";
import brandHeroImg from "@/assets/brand-hero.jpg";

export interface LoginPageProps {
  onSignInSuccess?: (response: AuthResponse) => void;
}

export function LoginPage({ onSignInSuccess }: LoginPageProps) {
  const {
    credentials,
    state,
    showPassword,
    handleInputChange,
    togglePasswordVisibility,
    handleSubmit,
  } = useSignInForm(onSignInSuccess);

  return (
    <div className="h-screen w-screen bg-slate-950 grid grid-cols-1 lg:grid-cols-2 overflow-hidden font-sans select-none">
      {/* Left Panel - Exactly 50% width, Real Stationery & Notebook Photo */}
      <div className="hidden lg:block relative w-full h-full overflow-hidden bg-slate-950">
        {/* Brand Logo on Left Top Corner (Transparent PNG, No Text) */}
        <div className="absolute top-8 left-8 z-20">
          <img
            src={logoImg}
            alt="Brand Logo"
            className="h-16 xl:h-20 w-auto object-contain drop-shadow-[0_4px_16px_rgba(0,0,0,0.6)]"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/logo.png";
            }}
          />
        </div>

        {/* Real Authentic Photography Asset */}
        <img
          src={brandHeroImg}
          alt="Navneet Stationery Workshop"
          className="w-full h-full object-cover object-center"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/brand-hero.jpg";
          }}
        />

        {/* Soft edge ambient shadow */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/30 via-transparent to-slate-950/20 pointer-events-none" />
      </div>

      {/* Right Panel - Exactly 50% width, Larger & Polished Sign In Section */}
      <div className="w-full h-full flex flex-col justify-between items-center bg-white p-6 sm:p-12 lg:p-14 xl:p-18 overflow-y-auto">
        <div className="w-full" />

        <div className="w-full max-w-md xl:max-w-lg my-auto py-8">
          {/* Logo at Top of Form */}
          <div className="flex flex-col items-center text-center mb-9">
            <div className="mb-6 flex items-center justify-center">
              <img
                src={logoImg}
                alt="Brand Logo"
                className="h-16 sm:h-20 w-auto object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/logo.png";
                }}
              />
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Welcome Back
            </h1>
            <p className="text-sm sm:text-base text-slate-500 mt-2 font-medium">
              Enter your credentials to access your workspace.
            </p>
          </div>

          {/* Error Alert */}
          {state.error && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-200/80 rounded-2xl text-xs sm:text-sm text-rose-700 font-medium flex items-center gap-3 animate-in fade-in duration-150">
              <span className="font-bold text-rose-600 text-base">✕</span>
              <span className="leading-snug">{state.error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username or Email */}
            <div className="space-y-2">
              <label className="block text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wider">
                Username or Email
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <User className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  name="email"
                  value={credentials.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="Enter your username or email"
                  className="w-full h-14 pl-12 pr-4 text-base bg-slate-50/80 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-2xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all font-medium shadow-2xs"
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="block text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={credentials.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  placeholder="Enter your password"
                  className="w-full h-14 pl-12 pr-12 text-base bg-slate-50/80 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-2xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all font-medium shadow-2xs"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 cursor-pointer transition-colors"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center pt-1">
              <label className="flex items-center space-x-3 text-sm text-slate-600 font-medium cursor-pointer select-none">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={credentials.rememberMe}
                  onChange={(e) => handleInputChange("rememberMe", e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 accent-blue-600 cursor-pointer"
                />
                <span>Remember me on this device</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={state.isLoading}
              className="w-full h-14 bg-slate-950 hover:bg-slate-900 active:bg-black text-white rounded-2xl text-base font-bold shadow-lg shadow-slate-950/15 transition-all flex items-center justify-center gap-2.5 cursor-pointer active:scale-[0.99] disabled:opacity-60"
            >
              {state.isLoading && <RefreshCw className="w-5 h-5 animate-spin" />}
              <span>Sign In</span>
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="w-full max-w-md xl:max-w-lg text-center pt-6 pb-2">
          <p className="text-xs text-slate-400 font-medium">
            Authorized Access Only · Enterprise Sampling Portal
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
