import React from "react";

export interface StatusBadgeProps {
  status?: string | null;
  className?: string;
}

export function getStatusBadgeConfig(status?: string | null) {
  const s = String(status || "").toLowerCase();
  if (s.includes("deal") || s.includes("actual")) {
    return {
      bg: "bg-emerald-50 text-emerald-800 border-emerald-200/90 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/70",
      dot: "bg-emerald-500",
      label: status || "Actual Deal",
    };
  }
  if (s.includes("dispatch") || s.includes("close")) {
    return {
      bg: "bg-teal-50 text-teal-800 border-teal-200/90 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800/70",
      dot: "bg-teal-500",
      label: status || "Dispatched / Closed",
    };
  }
  if (s.includes("plant") || s.includes("execution")) {
    return {
      bg: "bg-blue-50 text-blue-800 border-blue-200/90 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/70",
      dot: "bg-blue-600",
      label: status || "In Plant Work",
    };
  }
  if (s.includes("samp") || s.includes("review") || s.includes("pmt") || s.includes("qc")) {
    return {
      bg: "bg-sky-50 text-sky-800 border-sky-200/90 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800/70",
      dot: "bg-sky-500",
      label: status || "SAMP",
    };
  }
  if (s.includes("studio")) {
    return {
      bg: "bg-indigo-50 text-indigo-800 border-indigo-200/90 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/70",
      dot: "bg-indigo-600",
      label: status || "Studio",
    };
  }
  if (s.includes("creative")) {
    return {
      bg: "bg-purple-50 text-purple-800 border-purple-200/90 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/70",
      dot: "bg-purple-500",
      label: status || "Creative",
    };
  }
  if (s.includes("released")) {
    return {
      bg: "bg-violet-50 text-violet-800 border-violet-200/90 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800/70",
      dot: "bg-violet-600",
      label: status || "Released",
    };
  }
  return {
    bg: "bg-amber-50 text-amber-900 border-amber-200/90 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/70",
    dot: "bg-amber-500",
    label: status || "Draft (Pre-SMT)",
  };
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = "" }) => {
  const badge = getStatusBadgeConfig(status);

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${badge.bg} ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />
      <span className="truncate max-w-[140px]">{badge.label}</span>
    </span>
  );
};

export default StatusBadge;
