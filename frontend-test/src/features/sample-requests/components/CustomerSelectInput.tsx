import React, { useState, useRef, useEffect, useMemo } from "react";
import { CustomerItem } from "../types";
import { Building2, X, ChevronDown, Check } from "@/components/ui/icons";

export interface CustomerSelectInputProps {
  value: string;
  onChange: (customerName: string) => void;
  customers: CustomerItem[];
  loading?: boolean;
  required?: boolean;
  placeholder?: string;
  themeColor?: "blue" | "emerald" | "purple";
  label?: string;
}

export const CustomerSelectInput: React.FC<CustomerSelectInputProps> = ({
  value,
  onChange,
  customers,
  loading = false,
  required = true,
  placeholder = "Search or enter customer name (e.g., Staples, Walmart, Target)...",
  themeColor = "blue",
  label = "Customer Name",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const themeRingClasses = {
    blue: "focus:border-blue-600 focus:ring-blue-600/20",
    emerald: "focus:border-emerald-600 focus:ring-emerald-500/20",
    purple: "focus:border-purple-600 focus:ring-purple-500/20",
  }[themeColor];

  const themeHoverItemClasses = {
    blue: "hover:bg-blue-50 dark:hover:bg-blue-950/50",
    emerald: "hover:bg-emerald-50 dark:hover:bg-emerald-950/50",
    purple: "hover:bg-purple-50 dark:hover:bg-purple-950/50",
  }[themeColor];

  const filteredCustomers = useMemo(() => {
    const q = (value || "").trim().toLowerCase();
    const seen = new Set<string>();
    return customers.filter((c) => {
      const name = c.name.trim();
      const key = name.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return !q || key.includes(q) || (c.country && c.country.toLowerCase().includes(q));
    });
  }, [value, customers]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="space-y-1.5 relative w-full" ref={containerRef}>
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
          <Building2 size={13} className="text-slate-400" />
          <span>{label}</span>
          {required && <span className="text-rose-500">*</span>}
        </label>
        {loading && <span className="text-[10px] text-slate-400 font-medium">Loading customer accounts...</span>}
      </div>

      <div className="relative">
        <input
          type="text"
          required={required}
          placeholder={placeholder}
          value={value}
          onClick={() => setIsOpen(true)}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
          }}
          className={`w-full h-10 px-3.5 pr-8 rounded-lg border border-slate-200/90 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 text-xs font-semibold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 outline-none transition-all ${themeRingClasses}`}
        />
        {value ? (
          <button
            type="button"
            onClick={() => {
              onChange("");
              setIsOpen(false);
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
          >
            <X size={13} />
          </button>
        ) : (
          <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        )}
      </div>

      {/* Customer Autocomplete Dropdown */}
      {isOpen && filteredCustomers.length > 0 && (
        <div className="absolute left-0 right-0 z-50 mt-1 max-h-48 overflow-y-auto rounded-lg border border-slate-200 bg-white p-1 shadow-lg dark:border-slate-700 dark:bg-slate-900">
          {filteredCustomers.slice(0, 10).map((c) => {
            const isSelected = value.trim().toLowerCase() === c.name.toLowerCase();
            return (
              <button
                key={c.id || c.name}
                type="button"
                onClick={() => {
                  onChange(c.name);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs text-left cursor-pointer transition-colors ${themeHoverItemClasses} ${
                  isSelected ? "font-bold text-slate-900 dark:text-white" : "text-slate-700 dark:text-slate-200"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="truncate">{c.name}</span>
                </div>
                {c.country && <span className="text-[10px] text-slate-400 font-mono shrink-0">{c.country}</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CustomerSelectInput;
