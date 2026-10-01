import React from "react";
import { AlertCircle, AlertTriangle, WifiOff, ShieldOff, RefreshCw, X } from "lucide-react";

// ---------------------------------------------------------------------------
// Variant types
// ---------------------------------------------------------------------------
type Severity = "error" | "warning" | "info";
type ErrorVariant = "banner" | "toast" | "inline" | "empty-state";

interface BaseErrorProps {
  message: string;
  code?: string;
  severity?: Severity;
  onDismiss?: () => void;
  onRetry?: () => void;
  className?: string;
}

// ---------------------------------------------------------------------------
// Icon helper
// ---------------------------------------------------------------------------
function SeverityIcon({ severity, className }: { severity: Severity; className?: string }) {
  if (severity === "warning") return <AlertTriangle className={className} />;
  if (severity === "info") return <AlertCircle className={className} />;
  return <AlertCircle className={className} />;
}

const SEVERITY_STYLES: Record<Severity, { container: string; icon: string; code: string }> = {
  error: {
    container:
      "bg-red-50 dark:bg-red-950/25 border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-300",
    icon: "text-red-500 dark:text-red-400",
    code: "text-red-500/70 dark:text-red-400/60",
  },
  warning: {
    container:
      "bg-amber-50 dark:bg-amber-950/25 border-amber-200 dark:border-amber-800/50 text-amber-700 dark:text-amber-300",
    icon: "text-amber-500 dark:text-amber-400",
    code: "text-amber-500/70 dark:text-amber-400/60",
  },
  info: {
    container:
      "bg-blue-50 dark:bg-blue-950/25 border-blue-200 dark:border-blue-800/50 text-blue-700 dark:text-blue-300",
    icon: "text-blue-500 dark:text-blue-400",
    code: "text-blue-500/70 dark:text-blue-400/60",
  },
};

// ---------------------------------------------------------------------------
// Banner — strip below a toolbar / header row
// ---------------------------------------------------------------------------
export function ErrorBanner({
  message,
  code,
  severity = "error",
  onDismiss,
  onRetry,
  className = "",
}: BaseErrorProps) {
  const s = SEVERITY_STYLES[severity];
  return (
    <div
      role="alert"
      className={`flex items-center gap-3 px-4 py-2.5 border rounded-md text-[13px] font-medium ${s.container} ${className}`}
    >
      <SeverityIcon severity={severity} className={`w-4 h-4 shrink-0 ${s.icon}`} />
      <span className="flex-1 leading-snug">{message}</span>

      {code && (
        <span className={`font-mono text-[11px] shrink-0 ${s.code}`}>{code}</span>
      )}

      {onRetry && (
        <button
          onClick={onRetry}
          className="shrink-0 inline-flex items-center gap-1 text-[12px] font-semibold underline underline-offset-2 hover:no-underline transition-all cursor-pointer"
        >
          <RefreshCw className="w-3 h-3" />
          Retry
        </button>
      )}

      {onDismiss && (
        <button
          onClick={onDismiss}
          aria-label="Dismiss"
          className="shrink-0 hover:opacity-60 transition-opacity cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inline — inside a form field or table cell
// ---------------------------------------------------------------------------
export function InlineError({
  message,
  severity = "error",
  className = "",
}: Omit<BaseErrorProps, "code" | "onDismiss" | "onRetry">) {
  const s = SEVERITY_STYLES[severity];
  return (
    <p
      role="alert"
      className={`flex items-center gap-1.5 text-[12px] font-medium mt-1 ${s.icon.replace("text-", "text-")} ${className}`}
    >
      <SeverityIcon severity={severity} className={`w-3.5 h-3.5 shrink-0 ${s.icon}`} />
      {message}
    </p>
  );
}

// ---------------------------------------------------------------------------
// Empty State Error — replaces a data table / list when fetch fails
// ---------------------------------------------------------------------------
interface EmptyStateErrorProps {
  title?: string;
  message: string;
  code?: string;
  type?: "generic" | "network" | "auth";
  onRetry?: () => void;
}

const EMPTY_STATE_ICONS = {
  generic: AlertCircle,
  network: WifiOff,
  auth: ShieldOff,
};

export function EmptyStateError({
  title,
  message,
  code,
  type = "generic",
  onRetry,
}: EmptyStateErrorProps) {
  const Icon = EMPTY_STATE_ICONS[type];

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 px-6 text-center select-none">
      {/* Icon chip */}
      <div className="w-12 h-12 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200/60 dark:border-red-800/40 flex items-center justify-center">
        <Icon className="w-6 h-6 text-red-500 dark:text-red-400" />
      </div>

      <div className="max-w-sm">
        <p className="text-[14px] font-semibold text-zinc-800 dark:text-zinc-200 leading-tight">
          {title || "Failed to Load Data"}
        </p>
        <p className="text-[13px] text-zinc-500 dark:text-zinc-400 mt-1.5 leading-relaxed">
          {message}
        </p>
        {code && (
          <p className="mt-2 text-[11px] font-mono text-zinc-400 dark:text-zinc-600">
            Error code: {code}
          </p>
        )}
      </div>

      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-[#1d4ed8] hover:bg-[#1a44c2] text-white text-[13px] font-semibold transition-colors cursor-pointer border border-[#1a44c2] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Try Again
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Network Error — specifically for backend unreachable
// ---------------------------------------------------------------------------
export function NetworkError({ onRetry }: { onRetry?: () => void }) {
  return (
    <EmptyStateError
      type="network"
      title="Cannot Reach Server"
      message="The SAMP ERP backend is not responding. Please check that the server is running and your network connection is active."
      code="ERR_NETWORK"
      onRetry={onRetry}
    />
  );
}

// ---------------------------------------------------------------------------
// Auth Error — for 401 / session expired states
// ---------------------------------------------------------------------------
export function AuthError({ onSignIn }: { onSignIn?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 px-6 text-center select-none">
      <div className="w-12 h-12 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/40 flex items-center justify-center">
        <ShieldOff className="w-6 h-6 text-amber-500 dark:text-amber-400" />
      </div>
      <div className="max-w-sm">
        <p className="text-[14px] font-semibold text-zinc-800 dark:text-zinc-200 leading-tight">
          Session Expired
        </p>
        <p className="text-[13px] text-zinc-500 dark:text-zinc-400 mt-1.5 leading-relaxed">
          Your session has expired or is no longer valid. Please sign in again to continue.
        </p>
      </div>
      {onSignIn && (
        <button
          onClick={onSignIn}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-[#1d4ed8] hover:bg-[#1a44c2] text-white text-[13px] font-semibold transition-colors cursor-pointer border border-[#1a44c2]"
        >
          Sign In Again
        </button>
      )}
    </div>
  );
}

export default ErrorBanner;
