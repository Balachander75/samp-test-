import React from "react";
import { SampleRequestItem } from "../../types";
import { getStageIdForRequest } from "../../utils/trackTypes";
import { CopyBadge } from "@/components/ui/CopyBadge";
import { StatusPill } from "@/components/ui/StatusPill";
import { PaginationBar } from "@/components/erp/PaginationBar";
import { getRequestTypes } from "../utils/requestTypeUtils";
import { formatOdooDate } from "../../utils/dateUtils";
import {
  Building2,
  Package,
  Palette,
  Layers,
  Calculator,
  Send,
  Trash2,
  RefreshCw,
  Clock,
  CheckCircle2,
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
  hasActiveFilters?: boolean;
  onToggleSelectAll: () => void;
  onToggleSelectRow: (id: string | number, e?: React.SyntheticEvent) => void;
  onCopyCode?: (code: string, e: React.MouseEvent) => void;
  onOpenDraftInStaging: (row: SampleRequestItem, e?: React.MouseEvent) => void;
  onInspectRequest: (row: SampleRequestItem) => void;
  onReleaseDraft: (row: SampleRequestItem) => Promise<void>;
  onDeleteRequest: (row: SampleRequestItem, e?: React.MouseEvent) => Promise<void>;
  onPageChange: (page: number) => void;
  onOpenNewModal?: () => void;
  onResetFilters?: () => void;
}

export const SamplingRequestsTable: React.FC<SamplingRequestsTableProps> = ({
  paginatedRequests,
  filteredRequestsCount,
  isLoading,
  selectedIds,
  currentPage,
  pageSize,
  totalPages,
  isAdmin,
  hasActiveFilters,
  onToggleSelectAll,
  onToggleSelectRow,
  onOpenDraftInStaging,
  onInspectRequest,
  onReleaseDraft,
  onDeleteRequest,
  onPageChange,
  onOpenNewModal,
  onResetFilters,
}) => {
  return (
    <div className="flex-1 min-h-0 overflow-auto bg-white flex flex-col">
      <div className="flex-1 min-h-0 overflow-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="sticky top-0 z-10 bg-slate-50/90 backdrop-blur-xs border-b border-slate-200/70">
            <tr className="text-slate-600 font-mono text-[11px] uppercase tracking-wider select-none">
              <th className="py-3 pl-6 pr-3 w-8">
                <input
                  type="checkbox"
                  checked={
                    paginatedRequests.length > 0 &&
                    paginatedRequests.every((r) => selectedIds.has(r.id))
                  }
                  onChange={onToggleSelectAll}
                  className="rounded text-[#006d32] focus:ring-[#006d32] cursor-pointer"
                />
              </th>
              <th className="py-3 px-4 font-semibold whitespace-nowrap">SR / Code</th>
              <th className="py-3 px-4 font-semibold whitespace-nowrap">Material Code</th>
              <th className="py-3 px-4 font-semibold">Classification & Scope</th>
              <th className="py-3 px-4 font-semibold whitespace-nowrap">Request Scope</th>
              <th className="py-3 px-4 font-semibold whitespace-nowrap">Customer & Plant</th>
              <th className="py-3 px-4 font-semibold whitespace-nowrap">Target SLA Date</th>
              <th className="py-3 px-4 font-semibold whitespace-nowrap">Workflow Stage</th>
              <th className="py-3 pl-4 pr-6 font-semibold text-right whitespace-nowrap">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={9} className="py-16 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <RefreshCw className="w-6 h-6 animate-spin text-[#006d32]" />
                    <span className="text-xs font-mono text-slate-400">Loading commercial sample requests...</span>
                  </div>
                </td>
              </tr>
            ) : paginatedRequests.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-16 text-center">
                  <div className="max-w-sm mx-auto flex flex-col items-center">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
                      <Package className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-800">No Sample Requests Found</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      {hasActiveFilters
                        ? "No sample requests match your active search or filter criteria."
                        : "There are currently no commercial sample requests registered in this category."}
                    </p>
                    {hasActiveFilters ? (
                      <button
                        type="button"
                        onClick={onResetFilters}
                        className="mt-3 text-xs font-semibold text-[#006d32] hover:underline cursor-pointer flex items-center gap-1"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Reset filters</span>
                      </button>
                    ) : onOpenNewModal ? (
                      <button
                        type="button"
                        onClick={onOpenNewModal}
                        className="mt-4 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white shadow-xs transition active:scale-98 cursor-pointer"
                        style={{ background: "linear-gradient(135deg, #006d32 0%, #00d166 100%)" }}
                      >
                        Create New Request
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ) : (
              paginatedRequests.map((row) => {
                const isDraft = getStageIdForRequest(row) === "draft";
                const srCode = row.srNumber || `SR-${row.id}`;
                const requestTypes = getRequestTypes(row);
                const isSelected = selectedIds.has(row.id);

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
                    className={`hover:bg-slate-50/80 transition-colors cursor-pointer group ${
                      isSelected ? "bg-emerald-50/40" : ""
                    }`}
                  >
                    {/* Checkbox */}
                    <td
                      className="py-3.5 pl-6 pr-3 w-8"
                      onClick={(e) => onToggleSelectRow(row.id, e)}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="rounded text-[#006d32] focus:ring-[#006d32] cursor-pointer"
                      />
                    </td>

                    {/* SR / Code */}
                    <td className="py-3.5 px-4 font-mono font-bold whitespace-nowrap">
                      <CopyBadge text={srCode} />
                    </td>

                    {/* Material Code */}
                    <td className="py-3.5 px-4 font-mono whitespace-nowrap">
                      {row.materialCode ? (
                        <span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold font-mono bg-slate-100 text-slate-700">
                          {row.materialCode}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    {/* Classification & Scope */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="font-semibold text-xs text-slate-900 truncate">
                        {row.productDescription || row.programName || "Commercial Product Sample"}
                      </div>
                      {row.brandName && (
                        <div className="text-[10.5px] text-slate-400 font-sans mt-0.5 truncate">
                          Brand: {row.brandName}
                        </div>
                      )}
                    </td>

                    {/* Request Scope */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {requestTypes.map((type) => {
                          if (type === "design") {
                            return (
                              <span
                                key="design"
                                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-50 text-purple-700"
                                title="Design Request"
                              >
                                <Palette className="w-3 h-3 text-purple-600" />
                                <span>Design</span>
                              </span>
                            );
                          }
                          if (type === "mockup") {
                            return (
                              <span
                                key="mockup"
                                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-50 text-amber-700"
                                title="Mockup Sample"
                              >
                                <Layers className="w-3 h-3 text-amber-600" />
                                <span>Mockup</span>
                              </span>
                            );
                          }
                          if (type === "costing") {
                            return (
                              <span
                                key="costing"
                                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-sky-50 text-sky-700"
                                title="Costing Estimation"
                              >
                                <Calculator className="w-3 h-3 text-sky-600" />
                                <span>Costing</span>
                              </span>
                            );
                          }
                          return (
                            <span
                              key="sample"
                              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700"
                              title="Sampling Production"
                            >
                              <Package className="w-3 h-3 text-emerald-600" />
                              <span>Sampling</span>
                            </span>
                          );
                        })}
                      </div>
                    </td>

                    {/* Customer & Plant */}
                    <td className="py-3.5 px-4 font-semibold text-slate-900 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[180px]" title={row.customer || ""}>
                          {row.customer || "—"}
                        </span>
                      </div>
                      {row.targetPlant && (
                        <div className="text-[10px] font-mono text-slate-400 mt-0.5 pl-5">
                          Plant {row.targetPlant}
                        </div>
                      )}
                    </td>

                    {/* Target SLA Date */}
                    <td className="py-3.5 px-4 whitespace-nowrap font-mono text-slate-600">
                      {row.sampleRequiredDate ? (
                        formatOdooDate(row.sampleRequiredDate)
                      ) : (
                        <span className="text-slate-400">Flexible</span>
                      )}
                    </td>

                    {/* Stage Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <StatusPill status={row.status || "Draft"} />
                    </td>

                    {/* Actions */}
                    <td
                      className="py-3.5 pl-4 pr-6 text-right whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        {isDraft ? (
                          <>
                            <button
                              type="button"
                              onClick={(e) => onOpenDraftInStaging(row, e)}
                              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium font-mono transition cursor-pointer flex items-center gap-1"
                              title="Open and edit in Product Staging Workspace"
                            >
                              <Package className="w-3 h-3 text-slate-500" />
                              <span>Staging</span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onReleaseDraft(row);
                              }}
                              className="px-2.5 py-1 rounded-lg text-white text-xs font-bold font-mono transition shadow-xs hover:shadow-sm cursor-pointer flex items-center gap-1"
                              style={{ background: "linear-gradient(135deg, #006d32 0%, #00d166 100%)" }}
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
                            className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium font-mono transition cursor-pointer"
                            title="Inspect Sample Request Details"
                          >
                            Inspect
                          </button>
                        )}

                        {isAdmin && (
                          <button
                            type="button"
                            onClick={(e) => onDeleteRequest(row, e)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 transition cursor-pointer rounded-lg hover:bg-rose-50"
                            title="Delete Record"
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

      {/* Table Footer with Pagination */}
      <div className="mt-auto px-6 py-2.5 bg-white border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-mono shrink-0">
        <span>
          Showing {filteredRequestsCount === 0 ? 0 : (currentPage - 1) * pageSize + 1}
          {filteredRequestsCount > 0 && <> – {Math.min(filteredRequestsCount, currentPage * pageSize)}</>} of {filteredRequestsCount} sample requests
        </span>
        <div className="flex items-center gap-4">
          <span className="hidden sm:flex items-center gap-1.5 text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Sorted by Latest Raised Intake
          </span>
          <PaginationBar
            currentPage={currentPage}
            totalPages={totalPages}
            totalCount={filteredRequestsCount}
            pageSize={pageSize}
            onPageChange={onPageChange}
            itemLabel="requests"
            className="border-t-0 p-0"
          />
        </div>
      </div>
    </div>
  );
};
