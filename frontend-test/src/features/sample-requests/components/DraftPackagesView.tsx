import React, { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { SampleRequestItem } from "../types";
import {
  batchUpdateStatusApi,
  batchDeleteSampleRequestsApi,
  deleteDesignRequestApi,
  updateDesignRequestStatusApi,
} from "../api";
import {
  ArrowRight,
  Sparkles,
  Layers,
  Calendar,
  Trash2,
  CheckCircle2,
  Send,
  RefreshCw,
  User,
} from "@/components/ui/icons";

export interface DraftPackageGroup {
  key: string;
  customer: string;
  programName: string;
  programYear: string;
  targetPlant: string;
  createdBy: string;
  dateRequestCreated: string;
  sampleRequiredDate?: string;
  status: string;
  requestKind?: "sample" | "design";
  items: SampleRequestItem[];
}

export interface DraftPackagesViewProps {
  requests: SampleRequestItem[];
  searchTerm?: string;
  onOpenDraftWorkspace: (group: DraftPackageGroup) => void;
  onRefresh: () => void;
  isAdmin?: boolean;
}

export const DraftPackagesView: React.FC<DraftPackagesViewProps> = ({
  requests,
  searchTerm = "",
  onOpenDraftWorkspace,
  onRefresh,
  isAdmin = true,
}) => {
  const [releasingGroup, setReleasingGroup] = useState<DraftPackageGroup | null>(null);
  const [isReleasing, setIsReleasing] = useState(false);
  const [deletingGroup, setDeletingGroup] = useState<DraftPackageGroup | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Group draft sample requests by Customer + Program Name + Program Year
  const draftGroups = useMemo<DraftPackageGroup[]>(() => {
    const draftRequests = requests.filter((r) => {
      const s = (r.status || "").toLowerCase();
      return s.includes("draft") || s.includes("smt");
    });

    const groupsMap = new Map<string, DraftPackageGroup>();

    draftRequests.forEach((req) => {
      const customer = (req.customer || "General Customer").trim();
      const programName = (req.programName || "General Program").trim();
      const rawYear = req.programYear || req.year || "2026";
      const cleaned = String(rawYear).replace(/BTS/gi, "").trim();
      const programYear = cleaned.split("-")[0].trim() || "2026";
      const requestKind = req.requestKind || "sample";
      const key = `${requestKind}::${customer.toLowerCase()}::${programName.toLowerCase()}::${programYear}`;

      if (!groupsMap.has(key)) {
        groupsMap.set(key, {
          key,
          customer,
          programName,
          programYear,
          targetPlant: req.targetPlant || "",
          createdBy: req.createdBy || "Admin",
          dateRequestCreated: req.dateRequestCreated || "",
          sampleRequiredDate: req.sampleRequiredDate || undefined,
          status: req.status || "Draft (Pre-SMT)",
          requestKind,
          items: [],
        });
      }

      groupsMap.get(key)!.items.push(req);
    });

    return Array.from(groupsMap.values()).sort((a, b) => {
      const dateA = new Date(a.dateRequestCreated || 0).getTime();
      const dateB = new Date(b.dateRequestCreated || 0).getTime();
      return dateB - dateA;
    });
  }, [requests]);

  // Filter groups based on search term
  const filteredGroups = useMemo(() => {
    if (!searchTerm.trim()) return draftGroups;
    const q = searchTerm.toLowerCase().trim();
    return draftGroups.filter((g) => {
      return (
        g.customer.toLowerCase().includes(q) ||
        g.programName.toLowerCase().includes(q) ||
        g.programYear.toLowerCase().includes(q) ||
        g.createdBy.toLowerCase().includes(q) ||
        g.items.some(
          (item) =>
            (item.materialCode || "").toLowerCase().includes(q) ||
            (item.productDescription || "").toLowerCase().includes(q) ||
            (item.srNumber || "").toLowerCase().includes(q)
        )
      );
    });
  }, [draftGroups, searchTerm]);

  // Quick Release Handler
  const handleConfirmRelease = async () => {
    if (!releasingGroup) return;
    setIsReleasing(true);
    try {
      const sampleIds = releasingGroup.items
        .filter((item) => item.requestKind !== "design")
        .map((item) => item.id);
      const designIds = releasingGroup.items
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
      if (sampleIds.length) await batchUpdateStatusApi(sampleIds, "Creative");
      await Promise.all(designIds.map((id) => updateDesignRequestStatusApi(id, "Creative")));
      if (sampleIds.length || designIds.length) {
        setActionMessage(
          `Successfully released program "${releasingGroup.programName}" (${releasingGroup.items.length} ${releasingGroup.requestKind === "design" ? "design request" : "products"}) to Creative / SMT!`
        );
        setTimeout(() => setActionMessage(null), 4000);
        onRefresh();
        setReleasingGroup(null);
      }
    } catch (err) {
      console.error("Failed to release draft program:", err);
      alert("Failed to release draft. Please check your network and try again.");
    } finally {
      setIsReleasing(false);
    }
  };

  // Quick Delete Handler
  const handleConfirmDelete = async () => {
    if (!deletingGroup) return;
    setIsDeleting(true);
    try {
      const sampleIds = deletingGroup.items
        .filter((item) => item.requestKind !== "design")
        .map((item) => item.id);
      const designIds = deletingGroup.items
        .filter((item) => item.requestKind === "design" && item.designRequestId)
        .map((item) => item.designRequestId as number);
      const sampleDeleted = sampleIds.length ? await batchDeleteSampleRequestsApi(sampleIds) : true;
      if (sampleDeleted) await Promise.all(designIds.map((id) => deleteDesignRequestApi(id)));
      if (sampleDeleted) {
        setActionMessage(
          `Deleted draft program "${deletingGroup.programName}" (${deletingGroup.items.length} ${deletingGroup.requestKind === "design" ? "design request" : "products"}).`
        );
        setTimeout(() => setActionMessage(null), 4000);
        onRefresh();
        setDeletingGroup(null);
      }
    } catch (err) {
      console.error("Failed to delete draft program:", err);
      alert("Failed to delete draft program.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Toast Notification */}
      {actionMessage && (
        <div className="fixed top-20 right-6 z-[130] flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-emerald-600 text-white shadow-xl shadow-emerald-600/30 text-xs font-semibold animate-in slide-in-from-top-4 duration-200 max-w-sm">
          <CheckCircle2 size={16} className="stroke-[3] shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Empty State */}
      {filteredGroups.length === 0 ? (
        <div className="saas-empty-state rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 p-10 text-center space-y-2.5">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center mx-auto">
            <Layers size={20} />
          </div>
          <div className="space-y-1 max-w-sm mx-auto">
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              No Draft Programs Found
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {searchTerm.trim()
                ? `No draft programs match "${searchTerm}".`
                : "No draft sample requests currently in Pre-SMT staging."}
            </p>
          </div>
        </div>
      ) : (
        /* Sleek Wide Draft Program Rows */
        <div className="space-y-2.5">
          {filteredGroups.map((group) => {
            const productCount = group.items.length;
            const topProducts = group.items.slice(0, 5);
            const remainingCount = productCount - topProducts.length;

            return (
              <div
                key={group.key}
                onClick={() => onOpenDraftWorkspace(group)}
                className="group relative rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 sm:p-4 shadow-2xs hover:shadow-xs hover:border-indigo-300 dark:hover:border-indigo-700/80 transition-all duration-150 cursor-pointer overflow-hidden flex flex-col lg:flex-row lg:items-center justify-between gap-3"
              >
                {/* Left Accent Stripe */}
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500 group-hover:w-1.5 transition-all" />

                {/* Left: Customer, Year, Program Title, Created Meta */}
                <div className="space-y-1.5 min-w-0 lg:w-[35%] shrink-0 pl-1.5 sm:pl-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700/80">
                      {group.customer}
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded-md font-mono font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                      {group.programYear}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/50">
                      Draft (Pre-SMT)
                    </span>
                    {group.requestKind === "design" && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-violet-50 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 border border-violet-200/80 dark:border-violet-800/50">
                        Design Request
                      </span>
                    )}
                  </div>

                  <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-snug truncate">
                    {group.programName}
                  </h4>

                  <div className="flex items-center gap-2.5 text-[11px] text-slate-400">
                    <span className="inline-flex items-center gap-1">
                      <Calendar size={11} className="text-slate-400" />
                      <span>{group.dateRequestCreated || "Draft"}</span>
                    </span>
                    <span>&bull;</span>
                    <span className="inline-flex items-center gap-1">
                      <User size={11} className="text-slate-400" />
                      <span>{group.createdBy}</span>
                    </span>
                  </div>
                </div>

                {/* Middle: Compact Material Code Chips */}
                <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
                  <div className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-400 shrink-0 mr-1">
                    <Layers size={13} className="text-indigo-500" />
                    <span>{productCount} {group.requestKind === "design" ? (productCount === 1 ? "Design Request" : "Design Requests") : (productCount === 1 ? "Item" : "Items")}:</span>
                  </div>

                  {topProducts.map((p) => (
                    <span
                      key={p.id}
                      className="font-mono text-xs font-bold px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200/70 dark:border-slate-700/70"
                      title={p.productDescription}
                    >
                      {p.materialCode}
                    </span>
                  ))}

                  {remainingCount > 0 && (
                    <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-1.5 py-0.5 rounded-md border border-indigo-200/60 dark:border-indigo-800/40">
                      +{remainingCount} more
                    </span>
                  )}
                </div>

                {/* Right: Actions */}
                <div
                  className="flex items-center gap-1.5 shrink-0 self-end lg:self-center pt-1.5 lg:pt-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => setReleasingGroup(group)}
                    title="Release to Creative / SMT"
                    className="h-8 px-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-xs font-semibold border border-emerald-200 dark:border-emerald-800 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Send size={12} />
                    <span>Release</span>
                  </button>

                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => setDeletingGroup(group)}
                      title="Delete draft package"
                      className="h-8 w-8 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-rose-600 transition-colors flex items-center justify-center cursor-pointer border border-transparent hover:border-rose-200 dark:hover:border-rose-800"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => onOpenDraftWorkspace(group)}
                    className="h-8 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer transition-all shadow-2xs active:scale-[0.98]"
                  >
                    <span>Open</span>
                    <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Release Confirmation Modal (Portal attached directly to document.body for full viewport coverage) */}
      {releasingGroup &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm animate-in fade-in duration-150"
            onClick={() => !isReleasing && setReleasingGroup(null)}
          >
            <div
              className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in zoom-in-[0.98] duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center shrink-0 shadow-sm shadow-emerald-600/10">
                  <Sparkles size={22} />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                    Release Draft to Creative / SMT
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Send this program package into the active sampling workflow?
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Customer:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                    {releasingGroup.customer}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Program:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {releasingGroup.programName} ({releasingGroup.programYear})
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">{releasingGroup.requestKind === "design" ? "Design Requests Included:" : "Products Included:"}</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">
                    {releasingGroup.items.length} {releasingGroup.items.length === 1 ? (releasingGroup.requestKind === "design" ? "Design Request" : "Product") : (releasingGroup.requestKind === "design" ? "Design Requests" : "Products")}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  disabled={isReleasing}
                  onClick={() => setReleasingGroup(null)}
                  className="h-9 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isReleasing}
                  onClick={handleConfirmRelease}
                  className="h-9 px-4.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50 active:scale-[0.98]"
                >
                  {isReleasing ? (
                    <>
                      <RefreshCw size={13} className="animate-spin" />
                      <span>Releasing...</span>
                    </>
                  ) : (
                    <>
                      <Send size={13} />
                      <span>Confirm & Release to SMT</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Delete Confirmation Modal (Portal attached directly to document.body for full viewport coverage) */}
      {deletingGroup &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm animate-in fade-in duration-150"
            onClick={() => !isDeleting && setDeletingGroup(null)}
          >
            <div
              className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in zoom-in-[0.98] duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 flex items-center justify-center shrink-0 shadow-sm shadow-rose-600/10">
                  <Trash2 size={22} className="stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                    Delete Draft Program Package
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Delete this draft and all its {deletingGroup.items.length} staged {deletingGroup.items.length === 1 ? "product" : "products"}?
                  </p>
                </div>
              </div>

              {/* Package Summary Box */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Customer:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                    {deletingGroup.customer}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Program:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {deletingGroup.programName} ({deletingGroup.programYear})
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Products ({deletingGroup.items.length}):</span>
                  <div className="flex items-center gap-1 flex-wrap justify-end">
                    {deletingGroup.items.slice(0, 3).map((item) => (
                      <span
                        key={item.id}
                        className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200"
                      >
                        {item.materialCode}
                      </span>
                    ))}
                    {deletingGroup.items.length > 3 && (
                      <span className="text-[10px] text-slate-400 font-semibold">
                        +{deletingGroup.items.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/60 text-xs text-rose-800 dark:text-rose-300 flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-600 dark:bg-rose-400 mt-1.5 shrink-0" />
                <p>
                  {deletingGroup.requestKind === "design"
                    ? "This action is permanent and cannot be undone. The design request will be removed from drafts."
                    : "This action is permanent and cannot be undone. All 378 technical specifications per staged product will be purged from the draft workspace."}
                </p>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setDeletingGroup(null)}
                  className="h-9 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleConfirmDelete}
                  className="h-9 px-4.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm shadow-rose-600/20 transition-all cursor-pointer disabled:opacity-50 active:scale-[0.98]"
                >
                  {isDeleting ? (
                    <>
                      <RefreshCw size={13} className="animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 size={13} />
                      <span>Yes, Delete Package</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
