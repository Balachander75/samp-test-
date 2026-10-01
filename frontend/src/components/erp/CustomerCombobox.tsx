import React, { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { CustomerItem } from "@/features/sample-requests/types";

interface CustomerComboboxProps {
  customers: CustomerItem[];
  value: string;
  onChange: (customerName: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

/** Searchable customer selector matching against both account name and country. */
export const CustomerCombobox: React.FC<CustomerComboboxProps> = ({
  customers,
  value,
  onChange,
  disabled = false,
  placeholder = "Search customer or country...",
  className = "",
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const selectedCustomer = customers.find((customer) => customer.name === value);

  const filteredCustomers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return customers;
    return customers.filter((customer) =>
      `${customer.name} ${customer.country || ""}`.toLowerCase().includes(normalizedQuery),
    );
  }, [customers, query]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    const handleOutsidePointer = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleOutsidePointer);
    return () => document.removeEventListener("mousedown", handleOutsidePointer);
  }, []);

  const openSearch = () => {
    if (disabled) return;
    setQuery("");
    setActiveIndex(0);
    setIsOpen(true);
  };

  const selectCustomer = (customer: CustomerItem) => {
    onChange(customer.name);
    setQuery("");
    setActiveIndex(0);
    setIsOpen(false);
  };

  const clearCustomer = () => {
    onChange("");
    setQuery("");
    setActiveIndex(0);
    setIsOpen(true);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls="customer-options"
          aria-activedescendant={isOpen && filteredCustomers[activeIndex] ? `customer-option-${filteredCustomers[activeIndex].id}` : undefined}
          aria-autocomplete="list"
          value={
            isOpen
              ? query
              : selectedCustomer
              ? `${selectedCustomer.name} · ${selectedCustomer.country || "Country not set"}`
              : ""
          }
          placeholder={disabled ? "Customer data unavailable" : placeholder}
          disabled={disabled}
          onFocus={openSearch}
          onChange={(event) => {
            setQuery(event.target.value);
            setIsOpen(true);
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setIsOpen(true);
              setActiveIndex((index) => Math.min(index + 1, Math.max(0, filteredCustomers.length - 1)));
            }
            if (event.key === "ArrowUp") {
              event.preventDefault();
              setIsOpen(true);
              setActiveIndex((index) => Math.max(index - 1, 0));
            }
            if (event.key === "Escape") {
              setQuery("");
              setIsOpen(false);
            }
            if (event.key === "Enter" && isOpen && filteredCustomers[activeIndex]) {
              event.preventDefault();
              selectCustomer(filteredCustomers[activeIndex]);
            }
          }}
          className={`h-8 w-full rounded-md border border-zinc-200 bg-white pl-8 ${value ? "pr-14" : "pr-8"} text-[12px] font-medium text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700/80 dark:bg-zinc-900/80 dark:text-zinc-100`}
        />
        {value && (
          <button
            type="button"
            aria-label="Clear selected customer"
            title="Choose a different customer"
            onMouseDown={(event) => event.preventDefault()}
            onClick={clearCustomer}
            className="absolute right-7 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          >
            <X className="h-3 w-3" />
          </button>
        )}
        <ChevronDown className={`pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </div>

      {isOpen && !disabled && (
        <div
          id="customer-options"
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+4px)] z-[70] max-h-64 overflow-y-auto rounded-md border border-zinc-200 bg-white p-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
        >
          {filteredCustomers.length > 0 ? (
            filteredCustomers.map((customer, index) => (
              <button
                key={customer.id}
                type="button"
                role="option"
                id={`customer-option-${customer.id}`}
                aria-selected={customer.name === value}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => selectCustomer(customer)}
                className={`flex w-full items-center justify-between gap-3 rounded px-2.5 py-2 text-left transition-colors hover:bg-brand-50 focus:bg-brand-50 focus:outline-none dark:hover:bg-brand-950/30 dark:focus:bg-brand-950/30 ${index === activeIndex ? "bg-brand-50 dark:bg-brand-950/30" : ""}`}
              >
                <span className="min-w-0">
                  <span className="block truncate text-[12px] font-semibold text-zinc-900 dark:text-zinc-100">
                    {customer.name}
                  </span>
                  <span className="block truncate text-[10px] font-mono text-zinc-500 dark:text-zinc-400">
                    {customer.country || "Country not set"}
                  </span>
                </span>
                {customer.name === value && <Check className="h-3.5 w-3.5 shrink-0 text-brand-600" />}
              </button>
            ))
          ) : (
            <div className="px-2.5 py-3 text-center text-[11px] text-zinc-500 dark:text-zinc-400">
              No customers match “{query}”. Search by account name or country.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
