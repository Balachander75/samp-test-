import React from "react";
import { ProgramMaterialItem, AddProgramMaterialPayload } from "../../types";
import { ParsedMatrixRow, formatAddedDate } from "../../utils/feasibilityParsers";
import { Plus, Check, CheckCircle2 } from "lucide-react";

export interface InspectorMaterialsTableProps {
  unifiedMatrixRows: ParsedMatrixRow[];
  matrixRemarks: Record<string | number, string>;
  savingRemarkId: string | number | null;
  savedRemarkId: string | number | null;
  isAddingRow: boolean;
  isSavingNewRow: boolean;
  newRowData: AddProgramMaterialPayload;
  addRowFeedback: string | null;
  onRemarkChange: (rowId: string | number, value: string) => void;
  onSaveRemark: (rowId: string | number, index: number) => void;
  onStartAddRow: () => void;
  onCancelAddRow: () => void;
  onNewRowDataChange: (field: keyof AddProgramMaterialPayload, value: string) => void;
  onSaveNewRow: () => void;
}

export const InspectorMaterialsTable: React.FC<InspectorMaterialsTableProps> = ({
  unifiedMatrixRows,
  matrixRemarks,
  savingRemarkId,
  savedRemarkId,
  isAddingRow,
  isSavingNewRow,
  newRowData,
  addRowFeedback,
  onRemarkChange,
  onSaveRemark,
  onStartAddRow,
  onCancelAddRow,
  onNewRowDataChange,
  onSaveNewRow,
}) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-neutral-600 dark:text-zinc-400">
          Direct Material Allocations scheduled across paper, board, and accessories.
        </span>
        {!isAddingRow && (
          <button
            type="button"
            onClick={onStartAddRow}
            className="bg-[#017E84] hover:bg-[#00666A] text-white text-xs font-semibold px-2.5 py-1 rounded shadow-xs flex items-center space-x-1 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Add a Line</span>
          </button>
        )}
      </div>

      {addRowFeedback && (
        <div
          className={`p-2 rounded text-xs ${
            addRowFeedback.startsWith("✓") || addRowFeedback.includes("successfully")
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-rose-50 text-rose-800 border border-rose-200"
          }`}
        >
          {addRowFeedback}
        </div>
      )}

      <div className="border border-[#CED4DA] dark:border-zinc-700 rounded overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[#F8F9FA] dark:bg-zinc-850 border-b border-[#CED4DA] dark:border-zinc-700 text-neutral-600 dark:text-zinc-300 font-bold text-[11px]">
              <th className="p-2 border-r border-[#CED4DA] dark:border-zinc-700 w-8 text-center">#</th>
              <th className="p-2 border-r border-[#CED4DA] dark:border-zinc-700">Type</th>
              <th className="p-2 border-r border-[#CED4DA] dark:border-zinc-700">Supplier</th>
              <th className="p-2 border-r border-[#CED4DA] dark:border-zinc-700">Grade</th>
              <th className="p-2 border-r border-[#CED4DA] dark:border-zinc-700">Color</th>
              <th className="p-2 border-r border-[#CED4DA] dark:border-zinc-700">Caliper / Wt</th>
              <th className="p-2 border-r border-[#CED4DA] dark:border-zinc-700 text-right">Qty</th>
              <th className="p-2 border-r border-[#CED4DA] dark:border-zinc-700">Unit</th>
              <th className="p-2 border-r border-[#CED4DA] dark:border-zinc-700">Marketing Remark</th>
              <th className="p-2">SAMP Remark</th>
            </tr>
          </thead>
          <tbody>
            {unifiedMatrixRows.map((row) => (
              <tr
                key={row.id ?? row.index}
                className="border-b border-[#E9ECEF] dark:border-zinc-800 hover:bg-neutral-50/80 dark:hover:bg-zinc-800/40"
              >
                <td className="p-2 border-r border-[#E9ECEF] dark:border-zinc-800 text-center font-mono text-neutral-400">
                  {row.index}
                </td>
                <td className="p-2 border-r border-[#E9ECEF] dark:border-zinc-800 font-semibold text-neutral-800 dark:text-zinc-200">
                  {row.type}
                </td>
                <td className="p-2 border-r border-[#E9ECEF] dark:border-zinc-800 text-neutral-600 dark:text-zinc-400">
                  {row.supplier}
                </td>
                <td className="p-2 border-r border-[#E9ECEF] dark:border-zinc-800 font-mono text-neutral-600 dark:text-zinc-400">
                  {row.grade}
                </td>
                <td className="p-2 border-r border-[#E9ECEF] dark:border-zinc-800 text-neutral-600 dark:text-zinc-400">
                  {row.color}
                </td>
                <td className="p-2 border-r border-[#E9ECEF] dark:border-zinc-800 font-mono text-neutral-600 dark:text-zinc-400">
                  {row.caliper}
                </td>
                <td className="p-2 border-r border-[#E9ECEF] dark:border-zinc-800 text-right font-mono font-bold text-neutral-800 dark:text-zinc-200">
                  {row.qty}
                </td>
                <td className="p-2 border-r border-[#E9ECEF] dark:border-zinc-800 text-neutral-500 font-mono">
                  {row.unit}
                </td>
                <td className="p-2 border-r border-[#E9ECEF] dark:border-zinc-800 text-neutral-600 dark:text-zinc-400 italic">
                  {row.remark}
                </td>
                <td className="p-2">
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={matrixRemarks[row.id ?? row.index] ?? ""}
                      onChange={(e) => onRemarkChange(row.id ?? row.index, e.target.value)}
                      placeholder="Add SAMP remark..."
                      className="flex-1 px-2 py-1 rounded border border-[#CED4DA] dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs focus:ring-1 focus:ring-[#714B67]"
                    />
                    <button
                      type="button"
                      onClick={() => onSaveRemark(row.id ?? row.index, row.index)}
                      disabled={savingRemarkId === (row.id ?? row.index)}
                      className="px-2 py-1 bg-[#714B67] hover:bg-[#5B3C53] text-white rounded text-[11px] font-semibold cursor-pointer shrink-0 disabled:opacity-50"
                    >
                      {savingRemarkId === (row.id ?? row.index) ? "Saving..." : "Save"}
                    </button>
                    {savedRemarkId === (row.id ?? row.index) && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    )}
                  </div>
                </td>
              </tr>
            ))}

            {isAddingRow && (
              <tr className="bg-purple-50/50 dark:bg-purple-950/20 border-b border-purple-200 dark:border-purple-800">
                <td className="p-2 border-r text-center font-mono text-[#714B67] font-bold">
                  {unifiedMatrixRows.length + 1}
                </td>
                <td className="p-2 border-r">
                  <input
                    type="text"
                    placeholder="e.g. Paper"
                    value={newRowData.material_type || ""}
                    onChange={(e) => onNewRowDataChange("material_type", e.target.value)}
                    className="w-full px-1.5 py-0.5 border rounded text-xs bg-white dark:bg-zinc-900"
                  />
                </td>
                <td className="p-2 border-r">
                  <input
                    type="text"
                    placeholder="Supplier"
                    value={newRowData.supplier_name || ""}
                    onChange={(e) => onNewRowDataChange("supplier_name", e.target.value)}
                    className="w-full px-1.5 py-0.5 border rounded text-xs bg-white dark:bg-zinc-900"
                  />
                </td>
                <td className="p-2 border-r">
                  <input
                    type="text"
                    placeholder="Grade"
                    value={newRowData.grade || ""}
                    onChange={(e) => onNewRowDataChange("grade", e.target.value)}
                    className="w-full px-1.5 py-0.5 border rounded text-xs bg-white dark:bg-zinc-900"
                  />
                </td>
                <td className="p-2 border-r">
                  <input
                    type="text"
                    placeholder="Color"
                    value={newRowData.color_variant || ""}
                    onChange={(e) => onNewRowDataChange("color_variant", e.target.value)}
                    className="w-full px-1.5 py-0.5 border rounded text-xs bg-white dark:bg-zinc-900"
                  />
                </td>
                <td className="p-2 border-r">
                  <input
                    type="text"
                    placeholder="Caliper"
                    value={newRowData.caliper_wt || ""}
                    onChange={(e) => onNewRowDataChange("caliper_wt", e.target.value)}
                    className="w-full px-1.5 py-0.5 border rounded text-xs bg-white dark:bg-zinc-900"
                  />
                </td>
                <td className="p-2 border-r">
                  <input
                    type="text"
                    placeholder="Qty"
                    value={newRowData.quantity !== undefined && newRowData.quantity !== null ? String(newRowData.quantity) : ""}
                    onChange={(e) => onNewRowDataChange("quantity", e.target.value)}
                    className="w-full px-1.5 py-0.5 border rounded text-xs bg-white dark:bg-zinc-900 text-right"
                  />
                </td>
                <td className="p-2 border-r">
                  <input
                    type="text"
                    placeholder="Unit"
                    value={newRowData.unit || "sheets"}
                    onChange={(e) => onNewRowDataChange("unit", e.target.value)}
                    className="w-full px-1.5 py-0.5 border rounded text-xs bg-white dark:bg-zinc-900"
                  />
                </td>
                <td className="p-2 border-r">
                  <input
                    type="text"
                    placeholder="Remark"
                    value={newRowData.remark || ""}
                    onChange={(e) => onNewRowDataChange("remark", e.target.value)}
                    className="w-full px-1.5 py-0.5 border rounded text-xs bg-white dark:bg-zinc-900"
                  />
                </td>
                <td className="p-2">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={onSaveNewRow}
                      disabled={isSavingNewRow}
                      className="h-6 px-2 bg-[#017E84] text-white rounded text-[10px] font-bold cursor-pointer disabled:opacity-50"
                    >
                      {isSavingNewRow ? "Saving..." : "Save"}
                    </button>
                    <button
                      type="button"
                      onClick={onCancelAddRow}
                      className="h-6 px-2 bg-neutral-200 text-neutral-700 rounded text-[10px] cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
