import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { PlantItem, CreatePlantForm } from "../types";
import { fetchPlantsApi, createPlantApi } from "../api";
import { X, Factory, Plus } from "@/components/ui/icons";

interface PlantManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlantAdded?: (newPlant: PlantItem) => void;
  currentUser?: { name?: string } | null;
}

export const PlantManagementModal: React.FC<PlantManagementModalProps> = ({
  isOpen,
  onClose,
  onPlantAdded,
  currentUser,
}) => {
  const [plants, setPlants] = useState<PlantItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [form, setForm] = useState<CreatePlantForm>({
    code: "",
    name: "",
    location: "",
  });

  const loadPlants = async () => {
    setIsLoading(true);
    const data = await fetchPlantsApi();
    setPlants(data);
    setIsLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      loadPlants();
      setErrorMessage("");
      setSuccessMessage("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAddPlant = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!form.code.trim() || !form.name.trim()) {
      setErrorMessage("Please enter both plant code and plant name.");
      return;
    }

    setIsAdding(true);
    try {
      const newPlant = await createPlantApi(form, currentUser?.name || "Admin");
      if (newPlant) {
        setPlants((prev) => [...prev, newPlant]);
        setSuccessMessage(`Plant '${newPlant.name}' added successfully to database!`);
        setForm({ code: "", name: "", location: "" });
        if (onPlantAdded) onPlantAdded(newPlant);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to add plant. Plant may already exist.");
    } finally {
      setIsAdding(false);
    }
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-3xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Factory size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                Manufacturing Plants Master & History
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Manage production units and view complete history of plants
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Add New Plant Card */}
          <div className="p-5 rounded-2xl bg-slate-50/80 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-1.5">
              <Plus size={14} className="text-indigo-600" />
              Add New Manufacturing Plant
            </h3>

            {errorMessage && (
              <div className="mb-3 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-600 text-xs font-medium">
                {errorMessage}
              </div>
            )}
            {successMessage && (
              <div className="mb-3 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-600 text-xs font-medium">
                {successMessage}
              </div>
            )}

            <form onSubmit={handleAddPlant} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Plant Code *
                </label>
                <input
                  type="text"
                  placeholder="e.g. 1503"
                  value={form.code}
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                  className="w-full h-9 px-3 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Plant Full Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. 1503- Silvasa"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full h-9 px-3 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Location (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Silvasa, D&NH"
                  value={form.location}
                  onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                  className="w-full h-9 px-3 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="sm:col-span-3 flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={isAdding}
                  className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] rounded-xl shadow-sm transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Plus size={14} />
                  <span>{isAdding ? "Adding..." : "Add Plant to Database"}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Plant History & List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Factory size={14} className="text-indigo-600" />
                Plant Master History ({plants.length} Units)
              </h3>
              <span className="text-[11px] text-slate-400">Synchronized with PostgreSQL</span>
            </div>

            <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 uppercase tracking-wider font-bold text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Code</th>
                    <th className="px-4 py-3">Plant Name</th>
                    <th className="px-4 py-3">Location</th>
                    <th className="px-4 py-3">Added By</th>
                    <th className="px-4 py-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        Loading plants from database...
                      </td>
                    </tr>
                  ) : plants.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        No plants found.
                      </td>
                    </tr>
                  ) : (
                    plants.map((plant) => (
                      <tr key={plant.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                        <td className="px-4 py-3.5 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                          {plant.code}
                        </td>
                        <td className="px-4 py-3.5 font-semibold text-slate-900 dark:text-slate-100">
                          {plant.name}
                        </td>
                        <td className="px-4 py-3.5 text-slate-500">
                          {plant.location || "—"}
                        </td>
                        <td className="px-4 py-3.5 text-slate-500">
                          {plant.createdBy}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            Active
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
