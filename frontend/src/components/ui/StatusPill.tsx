import React from "react";

export type SemanticTone = "success" | "warning" | "danger" | "info" | "neutral";

export interface StatusPillProps {
  status?: string | null;
  tone?: SemanticTone;
  size?: "xs" | "sm" | "md";
  className?: string;
  showDot?: boolean;
}

export function resolveStatusTone(status?: string | null): {
  tone: SemanticTone;
  label: string;
} {
  const s = String(status || "").toLowerCase().trim();

  // Success / Closed / Approved
  if (
    s.includes("deal") ||
    s.includes("actual") ||
    s.includes("approved") ||
    s.includes("dispatched") ||
    s.includes("qc passed") ||
    s === "yes"
  ) {
    return { tone: "success", label: status || "Dispatched / Closed" };
  }

  // Critical / Rejected / Blocked
  if (
    s.includes("rejected") ||
    s.includes("blocked") ||
    s.includes("overdue") ||
    s.includes("cancelled") ||
    s === "no"
  ) {
    return { tone: "danger", label: status || "Rejected" };
  }

  // Warning / Feasibility Check / Pending Review
  if (
    s.includes("feasibility") ||
    s.includes("review") ||
    s.includes("pending") ||
    s.includes("due soon") ||
    s === "maybe"
  ) {
    return { tone: "warning", label: status || "Pending Review" };
  }

  // Info / In-Flight Operational Work (SAMP, In Plant, Creative, Studio)
  if (
    s.includes("plant") ||
    s.includes("execution") ||
    s.includes("samp") ||
    s.includes("studio") ||
    s.includes("creative") ||
    s.includes("released")
  ) {
    return { tone: "info", label: status || "In Progress" };
  }

  // Neutral / Draft
  return { tone: "neutral", label: status || "Draft (Pre-SMT)" };
}

const TONE_CLASSES: Record<
  SemanticTone,
  { container: string; dot: string }
> = {
  success: {
    container:
      "bg-emerald-50 text-emerald-800 border-emerald-200/90 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60",
    dot: "bg-emerald-600 dark:bg-emerald-400",
  },
  warning: {
    container:
      "bg-amber-50 text-amber-900 border-amber-200/90 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60",
    dot: "bg-amber-500",
  },
  danger: {
    container:
      "bg-rose-50 text-rose-800 border-rose-200/90 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60",
    dot: "bg-rose-600 dark:bg-rose-400",
  },
  info: {
    container:
      "bg-brand-50 text-brand-800 border-brand-200/90 dark:bg-brand-950/40 dark:text-brand-300 dark:border-brand-800/60",
    dot: "bg-brand-600 dark:bg-brand-400",
  },
  neutral: {
    container:
      "bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800/60 dark:text-zinc-300 dark:border-zinc-700/80",
    dot: "bg-zinc-400 dark:bg-zinc-500",
  },
};

const SIZE_CLASSES = {
  xs: "px-1.5 py-0.5 text-[10px] gap-1",
  sm: "px-2 py-0.5 text-[11px] gap-1.5 font-medium",
  md: "px-2.5 py-1 text-xs gap-1.5 font-medium",
};

export const StatusPill: React.FC<StatusPillProps> = ({
  status,
  tone: overrideTone,
  size = "sm",
  className = "",
  showDot = true,
}) => {
  const resolved = resolveStatusTone(status);
  const finalTone = overrideTone || resolved.tone;
  const toneStyle = TONE_CLASSES[finalTone];

  return (
    <span
      className={`inline-flex items-center rounded border ${toneStyle.container} ${SIZE_CLASSES[size]} ${className}`}
    >
      {showDot && (
        <span
          className={`h-1.5 w-1.5 rounded-full shrink-0 ${toneStyle.dot}`}
          aria-hidden="true"
        />
      )}
      <span className="truncate max-w-[150px]">{resolved.label}</span>
    </span>
  );
};

export default StatusPill;
