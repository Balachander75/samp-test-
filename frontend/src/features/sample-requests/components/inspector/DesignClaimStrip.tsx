import React from "react";
import { UserCheck, ShieldAlert, CheckCircle2, Clock, ArrowRight } from "lucide-react";

export interface DesignClaimStripProps {
  claimedBy?: string | null;
  claimedAt?: string | null;
  isCreativeMode?: boolean;
  canClaim?: boolean;
  claimDisabledReason?: string;
  slaLabel?: string;
  onClaim: () => void;
}

export const DesignClaimStrip: React.FC<DesignClaimStripProps> = ({
  claimedBy,
  claimedAt,
  isCreativeMode = false,
  canClaim = true,
  claimDisabledReason,
  slaLabel,
  onClaim,
}) => {
  const isClaimed = Boolean(claimedBy);
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

        {isCreativeMode && slaLabel && (
          <span role="status" className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/80 px-2.5 py-1 text-[10px] font-semibold text-slate-700 dark:border-white/10 dark:bg-black/20 dark:text-zinc-300">
            <Clock className="h-3 w-3" /> {slaLabel}
          </span>
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
              ? canClaim
                ? "Claim this task to start work. The claim and counter-date window closes 48 hours after Marketing raised the request."
                : claimDisabledReason || "The 48-hour claim and counter-date window has expired."
              : "Creative team has not claimed this design assignment yet."}
          </p>
        </div>
      </div>

      {isCreativeMode && (
        <div className="flex flex-wrap items-center gap-2">
          {slaLabel && (
            <span role="status" className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-white/80 px-2.5 py-1 text-[10px] font-semibold text-amber-900 dark:border-amber-800 dark:bg-black/20 dark:text-amber-200">
              <Clock className="h-3 w-3" /> {slaLabel}
            </span>
          )}
          <button
            type="button"
            onClick={onClaim}
            disabled={!canClaim}
            title={!canClaim ? claimDisabledReason : "Claim this design request"}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#714B67] hover:bg-[#5B3C53] text-white text-xs font-bold shadow-sm transition active:scale-98 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-[#714B67]"
          >
            <UserCheck className="w-3.5 h-3.5 stroke-[2.2]" />
            <span>{canClaim ? "Claim Task" : "Claim Window Closed"}</span>
            {canClaim && <ArrowRight className="w-3 h-3 stroke-[2.5]" />}
          </button>
        </div>
      )}
    </div>
  );
};
