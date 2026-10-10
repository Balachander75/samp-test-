import React, { useMemo, useState } from "react";
import { ArrowUpRight, Box, LoaderCircle, RefreshCw, Search } from "lucide-react";
import type { SampleRequestItem } from "../../types";

export interface MockupWorkflowQueuePageProps {
  requests: SampleRequestItem[];
  role: "creative" | "studio";
  isLoading: boolean;
  onInspect: (request: SampleRequestItem) => void;
  onRefresh?: () => Promise<void>;
}

function displayDate(value?: string): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

export const MockupWorkflowQueuePage: React.FC<MockupWorkflowQueuePageProps> = ({
  requests,
  role,
  isLoading,
  onInspect,
  onRefresh,
}) => {
  const [search, setSearch] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const filteredRequests = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    if (!query) return requests;
    return requests.filter((request) => [
      request.srNumber,
      request.materialCode,
      request.productDescription,
      request.customer,
      request.productCategory,
      request.productSubCategory,
      request.productThirdCategory,
    ].some((value) => String(value || "").toLocaleLowerCase().includes(query)));
  }, [requests, search]);

  const refresh = async () => {
    if (!onRefresh) return;
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  const title = role === "creative" ? "Mockup requests · Creative review" : "Mockup requests · Studio";
  const description = role === "creative"
    ? "Review the product category and saved specifications, then send the brief to Studio."
    : "Review the same product specifications, then send the finished mockup link to Marketing.";

  return (
    <main className="flex min-h-0 flex-1 flex-col overflow-hidden bg-slate-50 text-slate-900 dark:bg-[#0c0d14] dark:text-zinc-100">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4 dark:border-zinc-800 dark:bg-[#121622] sm:px-7">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-lg font-bold tracking-tight sm:text-xl">{title}</h1>
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold tabular-nums text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
              {isLoading ? "…" : requests.length} waiting
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">{description}</p>
        </div>
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <label className="relative min-w-0 flex-1 sm:w-72 sm:flex-none">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search SR, product, customer…"
              aria-label="Search mockup requests"
              className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none placeholder:text-slate-400 focus:border-[#006d32] focus:ring-2 focus:ring-[#006d32]/15 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            />
          </label>
          {onRefresh && (
            <button
              type="button"
              onClick={() => void refresh()}
              disabled={isRefreshing}
              className="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          )}
        </div>
      </header>

      <section className="min-h-0 flex-1 overflow-auto p-4 sm:p-6">
        <div className="mx-auto max-w-[1500px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-[#11141b]">
          {isLoading && requests.length === 0 ? (
            <div className="flex min-h-64 items-center justify-center gap-2 text-sm text-slate-500 dark:text-zinc-400">
              <LoaderCircle className="h-4 w-4 animate-spin" /> Loading mockup requests…
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-500 dark:bg-zinc-800 dark:text-zinc-300">
                <Box className="h-5 w-5" />
              </span>
              <h2 className="mt-3 text-sm font-semibold">{search ? "No matching requests" : "No mockup requests waiting"}</h2>
              <p className="mt-1 max-w-md text-sm text-slate-500 dark:text-zinc-400">
                {search ? "Try another SR number, material code, product, or customer." : role === "creative" ? "Marketing mockup requests will appear here after release." : "Creative handoffs will appear here when they send a brief to Studio."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-zinc-800 dark:bg-zinc-900/70 dark:text-zinc-400">
                  <tr>
                    <th className="px-5 py-3">Request</th>
                    <th className="px-5 py-3">Product category</th>
                    <th className="px-5 py-3">Customer</th>
                    <th className="px-5 py-3">Required date</th>
                    <th className="px-5 py-3 text-right">Next step</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                  {filteredRequests.map((request) => {
                    const category = [request.productCategory, request.productSubCategory, request.productThirdCategory].filter(Boolean).join(" / ");
                    return (
                      <tr key={request.id} className="group hover:bg-slate-50/80 dark:hover:bg-zinc-900/60">
                        <td className="px-5 py-4">
                          <div className="font-mono text-xs font-semibold text-indigo-700 dark:text-indigo-300">{request.srNumber || `SR-${request.id}`}</div>
                          <div className="mt-1 max-w-lg truncate font-semibold text-slate-900 dark:text-zinc-100" title={request.productDescription}>{request.productDescription || request.materialCode || "Mockup request"}</div>
                          {request.materialCode && <div className="mt-1 font-mono text-xs text-slate-500 dark:text-zinc-400">{request.materialCode}</div>}
                        </td>
                        <td className="px-5 py-4 text-slate-700 dark:text-zinc-300">{category || "—"}</td>
                        <td className="px-5 py-4 text-slate-700 dark:text-zinc-300">{request.customer || "—"}<div className="mt-1 text-xs text-slate-500 dark:text-zinc-500">{request.targetPlant || ""}</div></td>
                        <td className="px-5 py-4 whitespace-nowrap text-slate-600 dark:text-zinc-400">
                          {displayDate(role === "creative"
                            ? request.targetArtworkDateCreative || request.sampleRequiredDate
                            : request.targetArtworkDateStudio || request.sampleRequiredDate)}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => onInspect(request)}
                            className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#006d32] px-3.5 text-xs font-semibold text-white transition hover:bg-[#005a29] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006d32] focus-visible:ring-offset-2"
                          >
                            {role === "creative" ? "Inspect brief" : "Inspect & submit"}
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </main>
  );
};

export default MockupWorkflowQueuePage;
