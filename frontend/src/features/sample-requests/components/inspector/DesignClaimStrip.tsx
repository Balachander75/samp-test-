import React from "react";
import { UserCheck, ShieldAlert, CheckCircle2, User, Clock, ArrowRight } from "lucide-react";

export interface DesignClaimStripProps {
  claimedBy?: string | null;
  claimedAt?: string | null;
  currentUserName?: string;
  isCreativeMode?: boolean;
  onClaim: () => void;
  onUnclaim?: () => void;
}

export const DesignClaimStrip: React.FC<DesignClaimStripProps> = ({
  claimedBy,
  claimedAt,
  currentUserName = "Creative Designer",
  isCreativeMode = false,
  onClaim,
  onUnclaim,
}) => {
  const isClaimed = Boolean(claimedBy);
  const isClaimedByMe =
    isClaimed && claimedBy?.trim().toLowerCase() === currentUserName.trim().toLowerCase();

  const formattedClaimedTime = claimedAt
    ? new Date(claimedAt).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  if (isClaimed) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-50/90 to-teal-50/70 dark:from-emerald-950/30 dark:to-teal-950/20 border border-emerald-200/80 dark:border-emerald-800/40 text-xs shadow-2xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-emerald-600 dark:bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
            <UserCheck className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-emerald-950 dark:text-emerald-200 tracking-tight">
                Assigned to {claimedBy}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-700/60">
                <CheckCircle2 className="w-2.5 h-2.5 stroke-[2.5]" />
                CLAIMED
              </span>
            </div>
            {formattedClaimedTime && (
              <p className="text-[11px] text-emerald-700/90 dark:text-emerald-400/90 flex items-center gap-1 mt-0.5">
                <Clock className="w-3 h-3" />
                <span>Claimed on {formattedClaimedTime}</span>
              </p>
            )}
          </div>
        </div>

        {isCreativeMode && onUnclaim && (
          <button
            type="button"
            onClick={onUnclaim}
            className="text-[11px] font-medium text-slate-500 hover:text-rose-600 dark:text-zinc-400 dark:hover:text-rose-400 px-2 py-1 rounded hover:bg-black/5 dark:hover:bg-white/5 transition cursor-pointer"
            title="Release assignment to allow another designer to claim"
          >
            Release Claim
          </button>
        )}
      </div>
    );
  }

  // Unclaimed Banner
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-50 to-purple-50/50 dark:from-amber-950/30 dark:to-purple-950/20 border border-amber-200/90 dark:border-amber-800/40 text-xs shadow-2xs animate-in fade-in duration-200">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-7 h-7 rounded-lg bg-amber-500 dark:bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-xs">
          <ShieldAlert className="w-4 h-4 stroke-[2.2]" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-amber-950 dark:text-amber-200 tracking-tight">
              Unclaimed Design Task
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 border border-amber-300/60">
              PENDING CLAIM
            </span>
          </div>
          <p className="text-[11px] text-amber-800/90 dark:text-amber-400/90 mt-0.5">
            {isCreativeMode
              ? "Claim this task to start work, request target date adjustment, or submit artwork deliverables."
              : "Creative team has not claimed this design assignment yet."}
          </p>
        </div>
      </div>

      {isCreativeMode && (
        <button
          type="button"
          onClick={onClaim}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#714B67] hover:bg-[#5B3C53] text-white text-xs font-bold shadow-sm transition active:scale-98 cursor-pointer"
        >
          <UserCheck className="w-3.5 h-3.5 stroke-[2.2]" />
          <span>Claim Task</span>
          <ArrowRight className="w-3 h-3 stroke-[2.5]" />
        </button>
      )}
    </div>
  );
};
