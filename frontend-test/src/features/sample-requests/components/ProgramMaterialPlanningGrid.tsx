import React from "react";
import { Plus, Trash2, Layers } from "@/components/ui/icons";

export interface ProgramMaterialPlanningRow {
  id: string;
  materialType: string;
  supplierInfo: string;
  grade: string;
  colorVariant: string;
  caliperWeight: string;
  quantity: string;
  unit: string;
  remark: string;
}

export interface ProgramMaterialPlanningGridProps {
  rows: ProgramMaterialPlanningRow[];
  onAddRow: () => void;
  onUpdateRow: (id: string, field: keyof ProgramMaterialPlanningRow, value: string) => void;
  onDeleteRow: (id: string) => void;
}

export const ProgramMaterialPlanningGrid: React.FC<ProgramMaterialPlanningGridProps> = ({
  rows,
  onAddRow,
  onUpdateRow,
  onDeleteRow,
}) => {
  return (
    <div className="w-full rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
      {/* Header Bar */}
      <div className="border-b border-slate-100 dark:border-slate-800 px-5 py-4 flex items-center justify-between gap-3 bg-white dark:bg-slate-900">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60 flex items-center justify-center font-bold shadow-2xs">
            <Layers size={16} className="stroke-[2.2]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Material Specification Matrix
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Specify raw materials, grades, and quantities planned for this program
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onAddRow}
          className="h-8.5 px-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-sm shadow-blue-500/20 shrink-0 select-none active:scale-[0.98]"
        >
          <Plus size={14} className="stroke-[2.5]" />
          <span>Add Row</span>
        </button>
      </div>

      {/* Unified Table with Clean Column Layout */}
      <div className="w-full overflow-hidden">
        <table className="w-full text-left text-xs table-fixed">
          <thead>
            <tr className="border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[10px]">
              <th className="w-[32px] px-1 py-2 text-center">#</th>
              <th className="w-[16%] px-1.5 py-2">Material Type</th>
              <th className="w-[14%] px-1.5 py-2">Supplier Info</th>
              <th className="w-[11%] px-1.5 py-2">Grade</th>
              <th className="w-[12%] px-1.5 py-2">Color Variant</th>
              <th className="w-[12%] px-1.5 py-2">Caliper / Wt</th>
              <th className="w-[10%] px-1.5 py-2">Qty</th>
              <th className="w-[10%] px-1.5 py-2">Unit</th>
              <th className="w-[15%] px-1.5 py-2">Remark</th>
              <th className="w-[34px] px-1 py-2 text-center"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {rows.map((row, index) => (
              <tr
                key={row.id}
                className="hover:bg-blue-50/30 dark:hover:bg-blue-950/20 transition-colors group"
              >
                {/* # Index */}
                <td className="px-1 py-2 text-center text-slate-400 font-mono font-semibold text-[11px]">
                  {index + 1}
                </td>

                {/* 1. Material Type */}
                <td className="px-1.5 py-2">
                  <input
                    type="text"
                    placeholder="e.g. Kappa Board"
                    value={row.materialType}
                    onChange={(e) => onUpdateRow(row.id, "materialType", e.target.value)}
                    className="w-full h-8.5 px-2.5 rounded-lg border border-slate-200/90 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 text-xs font-semibold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/15 outline-none transition-all truncate shadow-2xs"
                  />
                </td>

                {/* 2. Supplier Info */}
                <td className="px-1.5 py-2">
                  <input
                    type="text"
                    placeholder="e.g. BILT / ITC"
                    value={row.supplierInfo}
                    onChange={(e) => onUpdateRow(row.id, "supplierInfo", e.target.value)}
                    className="w-full h-8.5 px-2.5 rounded-lg border border-slate-200/90 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 text-xs font-semibold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/15 outline-none transition-all truncate shadow-2xs"
                  />
                </td>

                {/* 3. Grade */}
                <td className="px-1.5 py-2">
                  <input
                    type="text"
                    placeholder="e.g. Grade A"
                    value={row.grade}
                    onChange={(e) => onUpdateRow(row.id, "grade", e.target.value)}
                    className="w-full h-8.5 px-2.5 rounded-lg border border-slate-200/90 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 text-xs font-semibold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/15 outline-none transition-all truncate shadow-2xs"
                  />
                </td>

                {/* 4. Color Variant */}
                <td className="px-1.5 py-2">
                  <input
                    type="text"
                    placeholder="e.g. Natural White"
                    value={row.colorVariant}
                    onChange={(e) => onUpdateRow(row.id, "colorVariant", e.target.value)}
                    className="w-full h-8.5 px-2.5 rounded-lg border border-slate-200/90 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 text-xs font-semibold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/15 outline-none transition-all truncate shadow-2xs"
                  />
                </td>

                {/* 5. Caliper Weight */}
                <td className="px-1.5 py-2">
                  <input
                    type="text"
                    placeholder="e.g. 70 GSM"
                    value={row.caliperWeight}
                    onChange={(e) => onUpdateRow(row.id, "caliperWeight", e.target.value)}
                    className="w-full h-8.5 px-2.5 rounded-lg border border-slate-200/90 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 text-xs font-semibold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/15 outline-none transition-all truncate shadow-2xs"
                  />
                </td>

                {/* 6. Quantity */}
                <td className="px-1.5 py-2">
                  <input
                    type="text"
                    placeholder="5000"
                    value={row.quantity}
                    onChange={(e) => onUpdateRow(row.id, "quantity", e.target.value)}
                    className="w-full h-8.5 px-2.5 rounded-lg border border-slate-200/90 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 text-xs font-semibold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/15 outline-none transition-all font-mono truncate shadow-2xs"
                  />
                </td>

                {/* 7. Unit */}
                <td className="px-1.5 py-2">
                  <input
                    type="text"
                    placeholder="e.g. Reams / MT / Pcs"
                    value={row.unit}
                    onChange={(e) => onUpdateRow(row.id, "unit", e.target.value)}
                    className="w-full h-8.5 px-2.5 rounded-lg border border-slate-200/90 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 text-xs font-semibold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/15 outline-none transition-all truncate shadow-2xs"
                  />
                </td>

                {/* 8. Remark */}
                <td className="px-1.5 py-2">
                  <input
                    type="text"
                    placeholder="Notes..."
                    value={row.remark}
                    onChange={(e) => onUpdateRow(row.id, "remark", e.target.value)}
                    className="w-full h-8.5 px-2.5 rounded-lg border border-slate-200/90 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 text-xs font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/15 outline-none transition-all truncate shadow-2xs"
                  />
                </td>

                {/* Action Delete */}
                <td className="px-1 py-2 text-center">
                  <button
                    type="button"
                    onClick={() => onDeleteRow(row.id)}
                    disabled={rows.length === 1}
                    className={`p-1.5 rounded-lg transition-colors ${
                      rows.length === 1
                        ? "text-slate-300 dark:text-slate-700 cursor-not-allowed"
                        : "text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                    }`}
                    title="Remove row"
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Table Footer Helper */}
      <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-850/40 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <span className="font-medium text-[11px]">{rows.length} {rows.length === 1 ? "row" : "rows"} configured</span>
      </div>
    </div>
  );
};

export default ProgramMaterialPlanningGrid;
