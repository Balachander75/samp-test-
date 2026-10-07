import React from "react";
import { SampleRequestItem } from "../../types";
import { getStageIdForRequest } from "../../utils/trackTypes";
import { CopyBadge } from "@/components/ui/CopyBadge";
import { StatusPill } from "@/components/ui/StatusPill";
import { PaginationBar } from "@/components/erp/PaginationBar";
import { getRequestTypes } from "../utils/requestTypeUtils";
import {
  Building2,
  Package,
  Palette,
  Layers,
  Calculator,
  ExternalLink,
  Send,
  Trash2,
  RefreshCw,
} from "lucide-react";

export interface SamplingRequestsTableProps {
  paginatedRequests: SampleRequestItem[];
  filteredRequestsCount: number;
  isLoading: boolean;
  selectedIds: Set<string | number>;
  copiedId?: string | null;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  isAdmin: boolean;
  onToggleSelectAll: () => void;
  onToggleSelectRow: (id: string | number, e?: React.SyntheticEvent) => void;
  onCopyCode?: (code: string, e: React.MouseEvent) => void;
  onOpenDraftInStaging: (row: SampleRequestItem, e?: React.MouseEvent) => void;
  onInspectRequest: (row: SampleRequestItem) => void;
  onReleaseDraft: (row: SampleRequestItem) => Promise<void>;
  onDeleteRequest: (row: SampleRequestItem, e?: React.MouseEvent) => Promise<void>;
  onPageChange: (page: number) => void;
}

export const SamplingRequestsTable: React.FC<SamplingRequestsTableProps> = ({
  paginatedRequests,
  filteredRequestsCount,
  isLoading,
  selectedIds,
  copiedId,
  currentPage,
  pageSize,
  totalPages,
  isAdmin,
  onToggleSelectAll,
  onToggleSelectRow,
  onCopyCode,
  onOpenDraftInStaging,
  onInspectRequest,
  onReleaseDraft,
  onDeleteRequest,
  onPageChange,
}) => {
  return (
    <div className="bg-white dark:bg-[#12141d] rounded-xl border border-[#CED4DA] dark:border-white/[0.08] shadow-2xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-[#CED4DA] dark:border-white/[0.08] bg-[#F8F9FA] dark:bg-zinc-900/60 text-neutral-600 dark:text-zinc-300 font-mono text-[11px] font-bold uppercase tracking-wider select-none">
              <th className="py-3 px-3 w-10 text-center">
                <input
                  type="checkbox"
                  checked={
                    paginatedRequests.length > 0 &&
                    paginatedRequests.every((r) => selectedIds.has(r.id))
                  }
                  onChange={onToggleSelectAll}
                  className="rounded border-[#CED4DA] dark:border-zinc-700 text-[#714B67] focus:ring-[#714B67] cursor-pointer"
                />
              </th>
              <th className="py-3 px-4 w-36 whitespace-nowrap">SR</th>
              <th className="py-3 px-4 w-32 whitespace-nowrap">MATERIAL CODE</th>
              <th className="py-3 px-4">DESCRIPTION</th>
              <th className="py-3 px-4 w-52 whitespace-nowrap">TYPE OF REQUEST</th>
              <th className="py-3 px-4 w-52">CUSTOMER</th>
              <th className="py-3 px-4 w-36 whitespace-nowrap">STAGE</th>
              <th className="py-3 px-4 w-32 text-right pr-6 whitespace-nowrap">ACTIONS</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[#E2E8F0] dark:divide-white/[0.06] bg-white dark:bg-[#12141d]">
            {isLoading ? (
              <tr>
                <td colSpan={8} className="p-12 text-center text-neutral-400 font-mono">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <RefreshCw className="w-6 h-6 animate-spin text-[#714B67]" />
                    <span>Loading sample requests from database...</span>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedRequests.map((row) => {
                const isDraft = getStageIdForRequest(row) === "draft";
                const srCode = row.srNumber || `SR-${row.id}`;
                const requestTypes = getRequestTypes(row);

                return (
                  <tr
                    key={row.id}
                    onClick={() => {
                      if (isDraft) {
                        onOpenDraftInStaging(row);
                      } else {
                        onInspectRequest(row);
                      }
                    }}
                    className={`border-b border-[#E2E8F0] dark:border-white/[0.06] hover:bg-purple-50/30 dark:hover:bg-purple-950/20 transition cursor-pointer select-text ${
                      selectedIds.has(row.id) ? "bg-purple-50/60 dark:bg-purple-950/30" : ""
                    }`}
                  >
                    {/* Checkbox */}
                    <td
                      className="py-3 px-3 text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.has(row.id)}
                        onChange={(e) => onToggleSelectRow(row.id, e)}
                        className="rounded border-[#CED4DA] dark:border-zinc-700 text-[#714B67] focus:ring-[#714B67] cursor-pointer"
                      />
                    </td>

                    {/* 1. SR */}
                    <td className="py-3 px-4 font-mono font-bold whitespace-nowrap">
                      <CopyBadge text={srCode} />
                    </td>

                    {/* 2. MATERIAL CODE */}
                    <td className="py-3 px-4 font-mono text-neutral-600 dark:text-zinc-400 whitespace-nowrap">
                      {row.materialCode ? (
                        <span className="bg-neutral-100 dark:bg-zinc-800 border border-neutral-200 dark:border-zinc-700 px-2 py-0.5 rounded text-[11px] font-semibold text-neutral-700 dark:text-zinc-300">
                          {row.materialCode}
                        </span>
                      ) : (
                        <span className="text-neutral-400">—</span>
                      )}
                    </td>

                    {/* 3. DESCRIPTION */}
                    <td className="py-3 px-4 font-medium text-neutral-900 dark:text-zinc-100 min-w-[200px]">
                      <div className="line-clamp-1 font-semibold text-xs">
                        {row.productDescription || row.programName || "Commercial Product Sample"}
                      </div>
                      {row.brandName && (
                        <div className="text-[10px] text-neutral-400 font-sans mt-0.5">
                          Brand: {row.brandName}
                        </div>
                      )}
                    </td>

                    {/* 4. TYPE OF REQUEST */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {requestTypes.map((type) => {
                          if (type === "design") {
                            return (
                              <span
                                key="design"
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-semibold bg-[#714B67]/10 text-[#714B67] dark:bg-[#714B67]/25 dark:text-[#E8D5E5] border border-[#714B67]/25 shrink-0"
                                title="Design Request"
                              >
                                <Palette className="w-3 h-3 text-[#714B67] dark:text-[#E8D5E5]" />
                                <span>Design</span>
                              </span>
                            );
                          }
                          if (type === "mockup") {
                            return (
                              <span
                                key="mockup"
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 shrink-0"
                                title="Mockup Sample"
                              >
                                <Layers className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                                <span>Mockup</span>
                              </span>
                            );
                          }
                          if (type === "costing") {
                            return (
                              <span
                                key="costing"
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 shrink-0"
                                title="Costing Estimation"
                              >
                                <Calculator className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                                <span>Costing</span>
                              </span>
                            );
                          }
                          return (
                            <span
                              key="sample"
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-semibold bg-[#017E84]/10 text-[#017E84] dark:bg-[#017E84]/25 dark:text-[#7ce3e8] border border-[#017E84]/25 shrink-0"
                              title="Sampling Production"
                            >
                              <Package className="w-3 h-3 text-[#017E84] dark:text-[#7ce3e8]" />
                              <span>Sampling</span>
                            </span>
                          );
                        })}
                      </div>
                    </td>

                    {/* 5. CUSTOMER */}
                    <td className="py-3 px-4 text-neutral-700 dark:text-zinc-300 font-medium">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                        <span className="truncate max-w-[200px]" title={row.customer || ""}>
                          {row.customer || "—"}
                        </span>
                      </div>
                    </td>

                    {/* 6. STAGE */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <StatusPill status={row.status || "Draft"} />
                    </td>

                    {/* 7. ACTIONS */}
                    <td
                      className="py-3 px-4 text-right pr-5 whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end space-x-1.5">
                        {isDraft ? (
                          <>
                            <button
                              type="button"
                              onClick={(e) => onOpenDraftInStaging(row, e)}
                              className="bg-[#714B67] hover:bg-[#5B3C53] text-white text-[11px] font-bold px-2.5 py-1 rounded shadow-2xs transition-colors cursor-pointer flex items-center gap-1"
                              title="Open and edit in Product Staging Workspace"
                            >
                              <Package className="w-3 h-3" />
                              <span>Staging</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => onReleaseDraft(row)}
                              className="bg-[#017E84] hover:bg-[#00666A] text-white text-[11px] font-bold px-2.5 py-1 rounded shadow-2xs transition-colors cursor-pointer flex items-center gap-1"
                              title="Release this request to active PMT / Sampling workflow"
                            >
                              <Send className="w-3 h-3" />
                              <span>Release</span>
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onInspectRequest(row)}
                            className="px-2.5 py-1 text-xs font-semibold rounded text-neutral-600 hover:text-[#714B67] dark:text-zinc-300 dark:hover:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/40 border border-neutral-200 dark:border-zinc-700 flex items-center gap-1 transition cursor-pointer"
                            title="Inspect Sample Request Details"
                          >
                            <ExternalLink className="w-3.5 h-3.5 text-[#714B67] dark:text-purple-300" />
                            <span>Inspect</span>
                          </button>
                        )}

                        {isAdmin && (
                          <button
                            type="button"
                            onClick={(e) => onDeleteRequest(row, e)}
                            className="p-1 text-rose-400 hover:text-rose-600 dark:hover:text-rose-300 transition cursor-pointer"
                            title="Delete request"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Document Pager Footer */}
      <PaginationBar
        currentPage={currentPage}
        totalPages={totalPages}
        totalCount={filteredRequestsCount}
        pageSize={pageSize}
        onPageChange={onPageChange}
        itemLabel="requests"
      />
    </div>
  );
};
