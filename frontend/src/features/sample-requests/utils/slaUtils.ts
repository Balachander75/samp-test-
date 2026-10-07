import { formatOdooDate } from "./dateUtils";

export interface SlaEvaluationResult {
  type: "normal" | "overdue" | "today" | "tomorrow" | "soon";
  label: string;
  days: number;
}

export function getSlaEvaluation(dateStr?: string | null): SlaEvaluationResult {
  if (!dateStr) return { type: "normal", label: "1.5d left", days: 1.5 };
  const target = new Date(dateStr);
  if (isNaN(target.getTime())) return { type: "normal", label: dateStr, days: 3 };

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const due = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { type: "overdue", label: `Overdue ${Math.abs(diffDays)}d`, days: diffDays };
  } else if (diffDays === 0) {
    return { type: "today", label: "Due Today", days: 0 };
  } else if (diffDays === 1) {
    return { type: "tomorrow", label: "Due Tomorrow", days: 1 };
  } else if (diffDays <= 2) {
    return { type: "soon", label: `${diffDays}d left`, days: diffDays };
  } else {
    return { type: "normal", label: formatOdooDate(dateStr), days: diffDays };
  }
}
