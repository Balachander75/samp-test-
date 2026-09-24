import React, { useState, useMemo } from "react";
import { SampleRequestItem } from "../types";
import { getSampleRequestTypeInfo } from "../utils/requestType";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Package,
  Eye,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  List,
  SlidersHorizontal,
  Palette,
} from "@/components/ui/icons";

export interface SampleRequestsTableProps {
  requests: SampleRequestItem[];
  totalFilteredCount: number;
  currentPage: number;
  totalPages: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onSelectRequest: (req: SampleRequestItem) => void;
  onDeleteRequest?: (req: SampleRequestItem, e: React.MouseEvent) => void;
  isAdmin?: boolean;
  onResetFilters?: () => void;
  isLoading?: boolean;
}

type SortField = "srNumber" | "productDescription" | "requestType" | "sampleRequiredDate" | "customer" | "program" | "status";

export const SampleRequestsTable: React.FC<SampleRequestsTableProps> = ({
  requests,
  totalFilteredCount,
  currentPage,
  totalPages,
  pageSize,
  onPageChange,
  onSelectRequest,
  onDeleteRequest,
  isAdmin = false,
  onResetFilters,
  isLoading = false,
}) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable");
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortAsc, setSortAsc] = useState(true);

  const handleCopy = (text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(null), 1500);
  };

  const handleToggleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortAsc) {
        setSortAsc(false);
      } else {
        setSortField(null);
        setSortAsc(true);
      }
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  // Sorted slice
  const sortedRequests = useMemo(() => {
    if (!sortField) return requests;
    return [...requests].sort((a, b) => {
      let valA = "";
      let valB = "";

      switch (sortField) {
        case "srNumber":
          valA = a.srNumber || "";
          valB = b.srNumber || "";
          break;
        case "productDescription":
          valA = a.productDescription || "";
          valB = b.productDescription || "";
          break;
        case "requestType":
          valA = getSampleRequestTypeInfo(a).label;
          valB = getSampleRequestTypeInfo(b).label;
          break;
        case "sampleRequiredDate":
          valA = a.sampleRequiredDate || "";
          valB = b.sampleRequiredDate || "";
          break;
        case "customer":
          valA = a.customer || "";
          valB = b.customer || "";
          break;
        case "program":
          valA = `${a.programName || ""} ${a.programYear || a.year || ""}`;
          valB = `${b.programName || ""} ${b.programYear || b.year || ""}`;
          break;
        case "status":
          valA = a.status || "";
          valB = b.status || "";
          break;
      }

      const comparison = valA.localeCompare(valB, undefined, { numeric: true, sensitivity: "base" });
      return sortAsc ? comparison : -comparison;
    });
  }, [requests, sortField, sortAsc]);

  const rowPadding = density === "compact" ? "py-1.5" : "py-2.5 sm:py-3";

  return (
    <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
      {/* Table Top Utility Bar */}
      <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 text-xs bg-slate-50/50 dark:bg-slate-850/50">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            {totalFilteredCount.toLocaleString()}
          </span>
          <span className="text-slate-400 font-medium">results</span>

          {sortField && (
            <button
              type="button"
              onClick={() => {
                setSortField(null);
                setSortAsc(true);
              }}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/80 text-[11px] font-medium cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors"
              title="Click to reset sort order"
            >
              <span>Sorted by {sortField}</span>
              {sortAsc ? <ArrowUp size={11} /> : <ArrowDown size={11} />}
              <span className="ml-0.5 text-blue-400 hover:text-blue-600">✕</span>
            </button>
          )}
        </div>

        {/* Density Toggle */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200/80 dark:border-slate-700">
          <button
            type="button"
            onClick={() => setDensity("comfortable")}
            className={`px-2 py-1 rounded-md text-[11px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer select-none ${
              density === "comfortable"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-semibold"
                : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
            title="Comfortable row spacing"
          >
            <SlidersHorizontal size={11} />
            <span>Comfortable</span>
          </button>
          <button
            type="button"
            onClick={() => setDensity("compact")}
            className={`px-2 py-1 rounded-md text-[11px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer select-none ${
              density === "compact"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-semibold"
                : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
            title="Compact high-density view"
          >
            <List size={11} />
            <span>Compact</span>
          </button>
        </div>
      </div>

      {/* Main Table Viewport with Horizontal Scroll */}
      <div className="overflow-x-auto max-h-[640px]">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-50/95 dark:bg-slate-850 border-b border-slate-200/80 dark:border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 sticky top-0 z-20 backdrop-blur-md">
            <tr>
              {/* 1. Sticky Left Column: Sample Code */}
              <th
                onClick={() => handleToggleSort("srNumber")}
                className="sticky-col-left px-4 py-3 whitespace-nowrap min-w-[150px] bg-slate-50 dark:bg-slate-850 cursor-pointer select-none group/th hover:text-slate-800 dark:hover:text-slate-200"
              >
                <div className="flex items-center gap-1.5">
                  <span>Sample Code</span>
                  {sortField === "srNumber" ? (
                    sortAsc ? <ArrowUp size={11} className="text-blue-600" /> : <ArrowDown size={11} className="text-blue-600" />
                  ) : (
                    <ArrowUpDown size={11} className="text-slate-300 group-hover/th:text-slate-500 opacity-0 group-hover/th:opacity-100 transition-opacity" />
                  )}
                </div>
              </th>

              {/* 2. Product Specification */}
              <th
                onClick={() => handleToggleSort("productDescription")}
                className="px-4 py-3 whitespace-nowrap min-w-[240px] cursor-pointer select-none group/th hover:text-slate-800 dark:hover:text-slate-200"
              >
                <div className="flex items-center gap-1.5">
                  <span>Product Specification</span>
                  {sortField === "productDescription" ? (
                    sortAsc ? <ArrowUp size={11} className="text-blue-600" /> : <ArrowDown size={11} className="text-blue-600" />
                  ) : (
                    <ArrowUpDown size={11} className="text-slate-300 group-hover/th:text-slate-500 opacity-0 group-hover/th:opacity-100 transition-opacity" />
                  )}
                </div>
              </th>

              {/* 3. Request Type */}
              <th
                onClick={() => handleToggleSort("requestType")}
                className="px-4 py-3 whitespace-nowrap min-w-[140px] cursor-pointer select-none group/th hover:text-slate-800 dark:hover:text-slate-200"
              >
                <div className="flex items-center gap-1.5">
                  <span>Request Type</span>
                  {sortField === "requestType" ? (
                    sortAsc ? <ArrowUp size={11} className="text-blue-600" /> : <ArrowDown size={11} className="text-blue-600" />
                  ) : (
                    <ArrowUpDown size={11} className="text-slate-300 group-hover/th:text-slate-500 opacity-0 group-hover/th:opacity-100 transition-opacity" />
                  )}
                </div>
              </th>

              {/* 4. Required Date */}
              <th
                onClick={() => handleToggleSort("sampleRequiredDate")}
                className="px-4 py-3 whitespace-nowrap min-w-[120px] cursor-pointer select-none group/th hover:text-slate-800 dark:hover:text-slate-200"
              >
                <div className="flex items-center gap-1.5">
                  <span>Required Date</span>
                  {sortField === "sampleRequiredDate" ? (
                    sortAsc ? <ArrowUp size={11} className="text-blue-600" /> : <ArrowDown size={11} className="text-blue-600" />
                  ) : (
                    <ArrowUpDown size={11} className="text-slate-300 group-hover/th:text-slate-500 opacity-0 group-hover/th:opacity-100 transition-opacity" />
                  )}
                </div>
              </th>

              {/* 5. Customer */}
              <th
                onClick={() => handleToggleSort("customer")}
                className="px-4 py-3 whitespace-nowrap min-w-[160px] cursor-pointer select-none group/th hover:text-slate-800 dark:hover:text-slate-200"
              >
                <div className="flex items-center gap-1.5">
                  <span>Customer</span>
                  {sortField === "customer" ? (
                    sortAsc ? <ArrowUp size={11} className="text-blue-600" /> : <ArrowDown size={11} className="text-blue-600" />
                  ) : (
                    <ArrowUpDown size={11} className="text-slate-300 group-hover/th:text-slate-500 opacity-0 group-hover/th:opacity-100 transition-opacity" />
                  )}
                </div>
              </th>

              {/* 6. Program / Program Year */}
              <th
                onClick={() => handleToggleSort("program")}
                className="px-4 py-3 whitespace-nowrap min-w-[160px] cursor-pointer select-none group/th hover:text-slate-800 dark:hover:text-slate-200"
              >
                <div className="flex items-center gap-1.5">
                  <span>Program / Program Year</span>
                  {sortField === "program" ? (
                    sortAsc ? <ArrowUp size={11} className="text-blue-600" /> : <ArrowDown size={11} className="text-blue-600" />
                  ) : (
                    <ArrowUpDown size={11} className="text-slate-300 group-hover/th:text-slate-500 opacity-0 group-hover/th:opacity-100 transition-opacity" />
                  )}
                </div>
              </th>

              {/* 7. Status */}
              <th
                onClick={() => handleToggleSort("status")}
                className="px-4 py-3 whitespace-nowrap min-w-[150px] cursor-pointer select-none group/th hover:text-slate-800 dark:hover:text-slate-200"
              >
                <div className="flex items-center gap-1.5">
                  <span>Status</span>
                  {sortField === "status" ? (
                    sortAsc ? <ArrowUp size={11} className="text-blue-600" /> : <ArrowDown size={11} className="text-blue-600" />
                  ) : (
                    <ArrowUpDown size={11} className="text-slate-300 group-hover/th:text-slate-500 opacity-0 group-hover/th:opacity-100 transition-opacity" />
                  )}
                </div>
              </th>

              {/* 8. Sticky Right Column: Actions */}
              <th className="sticky-col-right px-4 py-3 whitespace-nowrap text-right bg-slate-50 dark:bg-slate-850">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {isLoading ? (
              Array.from({ length: 8 }).map((_, idx) => (
                <tr key={idx} className="animate-pulse">
                  <td className="sticky-col-left px-4 py-3 whitespace-nowrap bg-white dark:bg-slate-900">
                    <div className="h-4 w-24 bg-slate-200/80 dark:bg-slate-800 rounded font-mono" />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="h-4 w-52 bg-slate-200/80 dark:bg-slate-800 rounded" />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="h-5 w-24 bg-slate-200/80 dark:bg-slate-800 rounded-full" />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="h-4 w-20 bg-slate-200/80 dark:bg-slate-800 rounded" />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="h-4 w-28 bg-slate-200/80 dark:bg-slate-800 rounded" />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="h-4 w-32 bg-slate-200/80 dark:bg-slate-800 rounded" />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="h-5 w-24 bg-slate-200/80 dark:bg-slate-800 rounded-full" />
                  </td>
                  <td className="sticky-col-right px-4 py-3 whitespace-nowrap text-right bg-white dark:bg-slate-900">
                    <div className="h-7 w-16 bg-slate-200/80 dark:bg-slate-800 rounded-lg ml-auto" />
                  </td>
                </tr>
              ))
            ) : sortedRequests.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-16 text-center">
                  <div className="saas-empty-state max-w-xs mx-auto">
                    <div className="saas-empty-state-icon">
                      <Package size={24} />
                    </div>
                    <div>
                      <h4 className="saas-empty-state-title">No sample requests match your filters</h4>
                      <p className="saas-empty-state-desc mt-1">
                        Try adjusting your search query or switching to a different stage tab.
                      </p>
                    </div>
                    {onResetFilters && (
                      <button
                        type="button"
                        onClick={onResetFilters}
                        className="px-3.5 py-1.5 rounded-xl bg-slate-900 dark:bg-blue-600 text-white text-xs font-semibold hover:bg-slate-800 dark:hover:bg-blue-500 transition-colors shadow-2xs cursor-pointer"
                      >
                        Clear Filters
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              sortedRequests.map((req) => {
                return (
                  <tr
                    key={req.id}
                    onClick={() => onSelectRequest(req)}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors duration-150 group cursor-pointer"
                  >
                    {/* 1. Sticky Left Column: Sample Code */}
                    <td className={`sticky-col-left px-4 ${rowPadding} whitespace-nowrap min-w-[150px] bg-white dark:bg-slate-900 group-hover:bg-slate-100 dark:group-hover:bg-slate-800 transition-colors`}>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors font-mono text-xs">
                          {req.srNumber}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => handleCopy(req.srNumber, e)}
                          className="p-1 rounded text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                          title="Copy Sample Code"
                        >
                          {copiedCode === req.srNumber ? (
                            <Check size={12} className="text-emerald-600 stroke-[3]" />
                          ) : (
                            <Copy size={12} />
                          )}
                        </button>
                      </div>
                      {req.materialCode && (
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5 font-medium">
                          Mat: <span className="text-slate-600 dark:text-slate-300">{req.materialCode}</span>
                        </div>
                      )}
                    </td>

                    {/* 2. Product Specification */}
                    <td className={`px-4 ${rowPadding} whitespace-nowrap min-w-[240px]`}>
                      <div
                        className="font-medium text-slate-800 dark:text-slate-200 text-xs truncate max-w-[320px]"
                        title={req.productDescription || undefined}
                      >
                        {req.productDescription || "—"}
                      </div>
                    </td>

                    {/* 3. Request Type */}
                    <td className={`px-4 ${rowPadding} whitespace-nowrap min-w-[140px]`}>
                      {(() => {
                        const typeInfo = getSampleRequestTypeInfo(req);
                        return (
                          <div className="flex flex-col gap-0.5 items-start">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${typeInfo.badgeClass}`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${typeInfo.dotClass}`} />
                              {typeInfo.label}
                            </span>
                            {typeInfo.subTypes && typeInfo.subTypes.length > 0 && (
                              <div className="flex items-center gap-1 text-[10px] text-slate-400 pl-1 capitalize font-medium">
                                {typeInfo.subTypes.join(", ")}
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </td>

                    {/* 4. Required Date */}
                    <td className={`px-4 ${rowPadding} whitespace-nowrap min-w-[120px]`}>
                      {req.sampleRequiredDate ? (
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 font-mono text-[11px] font-medium">
                          {req.sampleRequiredDate}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-mono text-xs">—</span>
                      )}
                    </td>

                    {/* 5. Customer */}
                    <td className={`px-4 ${rowPadding} whitespace-nowrap min-w-[160px]`}>
                      {req.customer && req.customer.trim() ? (
                        <span
                          className="font-semibold text-slate-800 dark:text-slate-200 text-xs truncate block max-w-[200px]"
                          title={req.customer}
                        >
                          {req.customer}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-mono text-xs">—</span>
                      )}
                    </td>

                    {/* 6. Program / Program Year */}
                    <td className={`px-4 ${rowPadding} whitespace-nowrap min-w-[160px]`}>
                      <div className="font-semibold text-slate-800 dark:text-slate-200 text-xs truncate max-w-[220px]" title={req.programName || undefined}>
                        {req.programName || "Standard Program"}
                      </div>
                      <div className="mt-0.5">
                        <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-mono border border-blue-200/70 dark:border-blue-800/60">
                          {req.programYear ? req.programYear.replace(/BTS/gi, "").trim() : req.year || "2026-2027"}
                        </span>
                      </div>
                    </td>

                    {/* 7. Status */}
                    <td className={`px-4 ${rowPadding} whitespace-nowrap min-w-[150px]`}>
                      <div className="space-y-1">
                        <StatusBadge status={req.status} />
                        {(req.plantFeasibilityResponse || req.samplingFeasibilityResponse) && (
                          <div className="flex items-center gap-1">
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                                (req.plantFeasibilityResponse || req.samplingFeasibilityResponse) === "Yes"
                                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                                  : (req.plantFeasibilityResponse || req.samplingFeasibilityResponse) === "No"
                                  ? "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
                                  : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                              }`}
                              title={`Feasibility Decision: ${req.plantFeasibilityResponse || req.samplingFeasibilityResponse} by ${(req.feasibilityClosedBy || "Team").toUpperCase()}${
                                req.plantFeasibilityRemark ? ` | Plant: ${req.plantFeasibilityRemark}` : ""
                              }${req.samplingFeasibilityRemark ? ` | SAMP: ${req.samplingFeasibilityRemark}` : ""}`}
                            >
                              Feasibility: {req.plantFeasibilityResponse || req.samplingFeasibilityResponse}
                            </span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* 15. Sticky Right Column: Actions */}
                    <td
                      className={`sticky-col-right px-4 ${rowPadding} whitespace-nowrap text-right bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800 transition-colors`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        {req.requestKind === "design" || req.materialCode?.startsWith("DESIGN-") || req.srNumber?.startsWith("DR-") ? (
                          <button
                            type="button"
                            onClick={() => onSelectRequest(req)}
                            className="group/btn h-7.5 px-3 rounded-lg border border-rose-200/90 dark:border-rose-900/60 bg-rose-50/50 hover:bg-rose-100/70 dark:bg-rose-950/30 dark:hover:bg-rose-900/40 text-rose-700 dark:text-rose-300 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs hover:shadow-xs"
                            title="View Creative Design Brief"
                          >
                            <Palette size={13} className="text-rose-600 dark:text-rose-400 group-hover/btn:scale-110 transition-transform" />
                            <span>Design</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onSelectRequest(req)}
                            className="group/btn h-7.5 px-3 rounded-lg border border-slate-200/90 dark:border-slate-700 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs hover:shadow-xs hover:border-slate-300 dark:hover:border-slate-600"
                            title="View specifications drawer"
                          >
                            <Eye size={13} className="text-blue-600 dark:text-blue-400 group-hover/btn:scale-110 transition-transform" />
                            <span>Specs</span>
                          </button>
                        )}
                        {isAdmin && onDeleteRequest && (
                          <button
                            type="button"
                            onClick={(e) => onDeleteRequest(req, e)}
                            className="h-7 w-7 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors flex items-center justify-center cursor-pointer"
                            title="Delete request"
                          >
                            <Trash2 size={13} />
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

      {/* Pagination Footer */}
      <div className="px-4 py-2.5 sm:py-3 bg-slate-50/90 dark:bg-slate-850 border-t border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2.5">
        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium text-center sm:text-left">
          Showing {(currentPage - 1) * pageSize + 1} to{" "}
          {Math.min(currentPage * pageSize, totalFilteredCount)} of {totalFilteredCount.toLocaleString()} requests
        </span>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-2xs"
          >
            <ChevronLeft size={14} />
          </button>
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 px-2 font-mono">
            Page {currentPage} of {totalPages || 1}
          </span>
          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-2xs"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

