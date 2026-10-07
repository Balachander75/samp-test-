import React, { useEffect, useMemo, useState } from "react";
import { ExternalLink, FileImage, Plus, X } from "lucide-react";
import { SampleRequestItem } from "@/features/sample-requests/types";
import { submitCreativeDesignOutputApi } from "@/infrastructure/api/sampleRequestsApi";

interface Props {
  request: SampleRequestItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmitted: () => Promise<void>;
  showToast: (message: string) => void;
}

export const CreativeDesignOutputModal: React.FC<Props> = ({ request, isOpen, onClose, onSubmitted, showToast }) => {
  const previousRows = useMemo(() => request?.creativeSubmissions?.flatMap((batch) => batch.rows) || [], [request]);
  const requested = Number(request?.numberOfDesigns || request?.productArtworkNos || 1);
  const remaining = Math.max(0, requested - previousRows.length);
  const [count, setCount] = useState(remaining ? 1 : 0);
  const [fileUrl, setFileUrl] = useState("");
  const [rows, setRows] = useState<Array<{ description: string; stockNumber: string; remarks: string }>>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setCount(remaining ? 1 : 0);
    setRows(remaining ? [{ description: "", stockNumber: "", remarks: "" }] : []);
    setFileUrl("");
    setError("");
  }, [request?.designRequestId, remaining, isOpen]);

  if (!isOpen || !request) return null;
  const firstNumber = previousRows.length + 1;

  const changeCount = (next: number) => {
    const safeCount = Math.max(1, Math.min(remaining, next || 1));
    setCount(safeCount);
    setRows((current) => Array.from({ length: safeCount }, (_, index) => current[index] || { description: "", stockNumber: "", remarks: "" }));
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!request.designRequestId) return;
    const invalidIndex = rows.findIndex((row) => !row.description.trim() || (!row.stockNumber.trim() && !row.remarks.trim()));
    if (invalidIndex >= 0) {
      setError(`D${firstNumber + invalidIndex} needs a description and a Shutterstock number or remark.`);
      return;
    }
    if (!fileUrl.trim()) {
      setError("Add a link to the design files before submitting.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await submitCreativeDesignOutputApi(request.designRequestId, { designFileUrl: fileUrl.trim(), rows });
      await onSubmitted();
      showToast("Design output sent to Marketing for review.");
      onClose();
    } catch (e) {
      console.error("Could not submit Creative design output:", e);
      setError("The output could not be submitted. Please check the details and try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 p-4" role="presentation">
      <section role="dialog" aria-modal="true" aria-labelledby="creative-output-title" className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[#12141d]">
        <header className="flex items-center justify-between bg-[#714B67] px-6 py-4 text-white">
          <div className="flex items-center gap-3"><span className="rounded bg-white/15 p-2"><FileImage className="h-4 w-4" /></span><div><h2 id="creative-output-title" className="text-base font-semibold">Submit design output</h2><p className="mt-0.5 text-xs text-white/80">{request.srNumber} · {request.customer} · {request.productDescription}</p></div></div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded p-2 text-white/80 hover:bg-white/15 hover:text-white"><X className="h-4 w-4" /></button>
        </header>
        <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-5 overflow-y-auto p-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-700 dark:bg-white/[0.03]"><div className="text-xs text-zinc-500">Requested</div><div className="mt-1 text-lg font-semibold text-zinc-900 dark:text-zinc-100">{requested} designs</div></div>
              <div className="rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-700 dark:bg-white/[0.03]"><div className="text-xs text-zinc-500">Delivered before</div><div className="mt-1 text-lg font-semibold text-zinc-900 dark:text-zinc-100">{previousRows.length} designs</div></div>
              <div className="rounded-md border border-[#714B67]/25 bg-[#714B67]/[0.05] px-4 py-3 dark:border-[#b89ab0]/25"><div className="text-xs text-zinc-500">Still due</div><div className="mt-1 text-lg font-semibold text-[#714B67] dark:text-[#d5bdd0]">{remaining} designs</div></div>
            </div>
            {request.designRemarks && <div className="rounded-md bg-zinc-50 px-4 py-3 text-sm text-zinc-700 dark:bg-white/[0.04] dark:text-zinc-300"><span className="font-medium">Marketing brief: </span>{request.designRemarks}</div>}
            {(request.referenceImages?.length || request.referenceLinks?.length) ? <div className="flex flex-wrap gap-2 text-xs">{[...(request.referenceImages || []), ...(request.referenceLinks || [])].map((url, index) => <a key={`${url}-${index}`} href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded border border-zinc-200 px-2.5 py-1.5 text-[#714B67] hover:bg-zinc-50 dark:border-zinc-700 dark:text-[#d5bdd0]"><ExternalLink className="h-3 w-3" />Reference {index + 1}</a>)}</div> : null}
            {previousRows.length > 0 && <div><h3 className="mb-2 text-sm font-semibold text-zinc-800 dark:text-zinc-200">Previously submitted</h3><div className="flex flex-wrap gap-2">{previousRows.map((row) => <span key={row.designNumber} className="rounded bg-zinc-100 px-2 py-1 text-xs text-zinc-600 dark:bg-white/[0.06] dark:text-zinc-300">{row.designNumber}</span>)}</div></div>}
            {remaining === 0 ? <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300">All requested designs have been delivered. This request is with Marketing for review.</div> : <>
              <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_180px]">
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">Design files link <span className="text-rose-600">*</span><input type="url" required value={fileUrl} onChange={(event) => setFileUrl(event.target.value)} placeholder="https://drive.google.com/..." className="mt-1.5 h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-[#714B67] focus:ring-2 focus:ring-[#714B67]/15 dark:border-zinc-700 dark:bg-[#171923]" /></label>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">Designs completed<input type="number" min={1} max={remaining} value={count} onChange={(event) => changeCount(Number(event.target.value))} className="mt-1.5 h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-[#714B67] dark:border-zinc-700 dark:bg-[#171923]" /></label>
              </div>
              <div className="overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-700">
                <div className="hidden grid-cols-[56px_minmax(180px,1.5fr)_minmax(150px,1fr)_minmax(150px,1fr)] gap-3 bg-zinc-50 px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:bg-white/[0.04] md:grid"><span>Design</span><span>Description</span><span>Shutterstock number</span><span>Remarks</span></div>
                {rows.map((row, index) => <div key={index} className="grid grid-cols-1 gap-3 border-t border-zinc-200 p-3 dark:border-zinc-700 sm:grid-cols-2 md:grid-cols-[56px_minmax(180px,1.5fr)_minmax(150px,1fr)_minmax(150px,1fr)]"><span className="text-sm font-semibold text-[#714B67] md:pt-2">D{firstNumber + index}</span><input aria-label={`D${firstNumber + index} description`} value={row.description} onChange={(event) => setRows((current) => current.map((item, i) => i === index ? { ...item, description: event.target.value } : item))} placeholder="Design description" className="h-9 min-w-0 rounded border border-zinc-300 px-2.5 text-xs outline-none focus:border-[#714B67] dark:border-zinc-700 dark:bg-[#171923]" /><input aria-label={`D${firstNumber + index} Shutterstock number`} value={row.stockNumber} onChange={(event) => setRows((current) => current.map((item, i) => i === index ? { ...item, stockNumber: event.target.value } : item))} placeholder="Stock number (Shutterstock)" className="h-9 min-w-0 rounded border border-zinc-300 px-2.5 text-xs outline-none focus:border-[#714B67] dark:border-zinc-700 dark:bg-[#171923]" /><input aria-label={`D${firstNumber + index} remarks`} value={row.remarks} onChange={(event) => setRows((current) => current.map((item, i) => i === index ? { ...item, remarks: event.target.value } : item))} placeholder="Remarks" className="h-9 min-w-0 rounded border border-zinc-300 px-2.5 text-xs outline-none focus:border-[#714B67] dark:border-zinc-700 dark:bg-[#171923]" /></div>)}
              </div>
              <p className="text-xs text-zinc-500">Each row needs a description and either a Shutterstock number, a remark, or both.</p>
            </>}
            {error && <p role="alert" className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">{error}</p>}
          </div>
          <footer className="flex items-center justify-between border-t border-zinc-200 bg-zinc-50 px-6 py-3 dark:border-zinc-700 dark:bg-white/[0.02]"><button type="button" onClick={onClose} className="rounded border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-transparent dark:text-zinc-300">Close</button>{remaining > 0 && <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded bg-[#714B67] px-4 py-2 text-sm font-semibold text-white hover:bg-[#603e57] disabled:cursor-wait disabled:opacity-60"><Plus className="h-4 w-4" />{saving ? "Submitting…" : "Submit to Marketing"}</button>}</footer>
        </form>
      </section>
    </div>
  );
};
