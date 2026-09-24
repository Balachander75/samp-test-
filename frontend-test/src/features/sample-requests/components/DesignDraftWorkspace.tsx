import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, Camera, CheckCircle2, FileText, Hash, Palette, Send, Users } from "@/components/ui/icons";
import { fetchDesignRequestApi, mapDesignRequestToSampleRequest, updateDesignRequestStatusApi } from "../api";
import { SampleRequestItem } from "../types";
import type { DraftPackageGroup } from "./DraftPackagesView";

interface DesignDraftWorkspaceProps {
  group: DraftPackageGroup;
  onBack?: () => void;
}

export const DesignDraftWorkspace: React.FC<DesignDraftWorkspaceProps> = ({ group, onBack }) => {
  const navigate = useNavigate();
  const [isReleasing, setIsReleasing] = useState(false);
  const [released, setReleased] = useState(false);
  const designRequestId = group.items.find((item) => item.designRequestId)?.designRequestId;
  const [request, setRequest] = useState<SampleRequestItem | undefined>(group.items[0]);

  useEffect(() => {
    if (!designRequestId) return;
    let active = true;
    void fetchDesignRequestApi(designRequestId)
      .then((designRequest) => {
        if (active) setRequest(mapDesignRequestToSampleRequest(designRequest));
      })
      .catch((error) => console.error("Failed to refresh design request details:", error));
    return () => {
      active = false;
    };
  }, [designRequestId]);

  const handleBack = () => {
    if (onBack) onBack();
    else navigate("/sample-requests");
  };

  const handleRelease = async () => {
    // Extract designRequestId — fall back to parsing it from the "design-N" id string
    const ids = group.items
      .filter((item) => item.requestKind === "design")
      .map((item) => {
        if (item.designRequestId) return item.designRequestId;
        const raw = String(item.id);
        if (raw.startsWith("design-")) {
          const parsed = parseInt(raw.replace("design-", ""), 10);
          return isNaN(parsed) ? null : parsed;
        }
        return null;
      })
      .filter((id): id is number => id !== null);
    if (!ids.length) {
      alert("No design request IDs found to release. Please try refreshing the page.");
      return;
    }
    setIsReleasing(true);
    try {
      await Promise.all(ids.map((id) => updateDesignRequestStatusApi(id, "Creative")));
      setReleased(true);
      window.setTimeout(() => navigate("/sample-requests"), 900);
    } catch (error) {
      console.error("Failed to release design request:", error);
      alert("Failed to release design request. Please try again.");
    } finally {
      setIsReleasing(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 animate-in fade-in duration-200">
      <div className="flex items-center justify-between gap-3">
        <button type="button" onClick={handleBack} className="group inline-flex items-center gap-2 rounded-lg py-1 text-[13px] font-semibold text-slate-500 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100">
          <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-0.5" /> Back to drafts
        </button>
        <span className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-amber-700 dark:border-amber-800/70 dark:bg-amber-950/50 dark:text-amber-300">
          Draft (Pre-SMT)
        </span>
      </div>

      <div>
        <h1 className="text-[30px] font-bold tracking-[-0.04em] text-slate-950 dark:text-slate-100">Design request draft</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Review the design brief before sending it to Creative.</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_290px]">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.04)] dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-start gap-3 border-b border-slate-100 pb-5 dark:border-slate-800">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-950/50 dark:text-violet-300"><Palette size={18} /></div>
            <div className="min-w-0"><h2 className="text-base font-bold text-slate-900 dark:text-slate-100">{group.programName}</h2><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{group.customer} · Program year {group.programYear}</p></div>
          </div>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <Info label="Number of designs" value={String(request?.numberOfDesigns || "—")} icon={<Hash size={14} />} />
            <Info label="Design required date" value={request?.sampleRequiredDate || "—"} icon={<Calendar size={14} />} />
            <Info label="Target audience" value={request?.targetAudience || "—"} icon={<Users size={14} />} />
            <Info label="Created by" value={group.createdBy || "—"} icon={<CheckCircle2 size={14} />} />
          </div>
          <div className="mt-6 space-y-5">
            <Brief label="Product description" value={request?.productDescription} icon={<FileText size={14} />} />
            <Brief label="Trend / creative direction" value={request?.trend} icon={<Palette size={14} />} />
            {request?.referenceImage && (
              <div>
                <p className="mb-2 flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300"><Camera size={14} /> Reference image</p>
                <a href={request.referenceImage} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
                  <img src={request.referenceImage} alt="Design reference" className="h-48 w-full object-cover transition hover:scale-[1.01]" />
                </a>
              </div>
            )}
          </div>
        </div>

        <aside className="h-fit rounded-2xl border border-amber-200/80 bg-amber-50/70 p-5 dark:border-amber-900/60 dark:bg-amber-950/25">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-amber-600 shadow-sm dark:bg-slate-900 dark:text-amber-300"><Send size={17} /></div>
          <h3 className="mt-4 text-sm font-bold text-amber-950 dark:text-amber-100">Ready for Creative?</h3>
          <p className="mt-1.5 text-xs leading-5 text-amber-900/75 dark:text-amber-200/75">Release this design brief to move it from Draft into Creative work.</p>
          <button type="button" disabled={isReleasing || released} onClick={handleRelease} className="mt-5 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-xs font-bold text-white shadow-sm shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60">
            {released ? <CheckCircle2 size={14} /> : <Send size={14} />}
            {released ? "Released to Creative" : isReleasing ? "Releasing..." : "Release to Creative"}
          </button>
        </aside>
      </div>
    </div>
  );
};

function Info({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return <div className="flex items-start gap-2.5"><span className="mt-0.5 text-slate-400">{icon}</span><div><p className="text-[11px] text-slate-400">{label}</p><p className="mt-0.5 text-sm font-semibold text-slate-900 dark:text-slate-100">{value}</p></div></div>;
}

function Brief({ label, value, icon }: { label: string; value?: string | null; icon: React.ReactNode }) {
  return <div><p className="mb-2 flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">{icon} {label}</p><div className="rounded-xl bg-slate-50 px-3.5 py-3 text-sm leading-6 text-slate-700 dark:bg-slate-800/70 dark:text-slate-300">{value || "No details added."}</div></div>;
}
