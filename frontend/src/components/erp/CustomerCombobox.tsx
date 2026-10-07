import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
  const optionsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [dropdownPosition, setDropdownPosition] = useState<{
    top: number;
    left: number;
    width: number;
    maxHeight: number;
  } | null>(null);
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
      const target = event.target as Node;
      if (!containerRef.current?.contains(target) && !optionsRef.current?.contains(target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsidePointer);
    return () => document.removeEventListener("mousedown", handleOutsidePointer);
  }, []);

  useLayoutEffect(() => {
    if (!isOpen || disabled) {
      setDropdownPosition(null);
      return;
    }

    const updatePosition = () => {
      const input = inputRef.current;
      if (!input) return;

      const rect = input.getBoundingClientRect();
      let clippingRect: DOMRect | null = null;
      let ancestor = input.parentElement;
      while (ancestor && ancestor !== document.body) {
        const { overflowX, overflowY } = window.getComputedStyle(ancestor);
        if (/(auto|scroll|hidden|clip)/.test(`${overflowX} ${overflowY}`)) {
          clippingRect = ancestor.getBoundingClientRect();
          break;
        }
        ancestor = ancestor.parentElement;
      }

      const boundaryTop = Math.max(8, clippingRect?.top ?? 0);
      const boundaryBottom = Math.min(window.innerHeight - 8, clippingRect?.bottom ?? window.innerHeight);
      const boundaryLeft = Math.max(8, clippingRect?.left ?? 0);
      const boundaryRight = Math.min(window.innerWidth - 8, clippingRect?.right ?? window.innerWidth);
      const spaceBelow = boundaryBottom - rect.bottom - 8;
      const spaceAbove = rect.top - boundaryTop - 8;
      const opensAbove = spaceBelow < 224 && spaceAbove > spaceBelow;
      const availableSpace = opensAbove ? spaceAbove : spaceBelow;
      const maxHeight = Math.max(0, Math.min(256, availableSpace));
      const width = Math.min(rect.width, boundaryRight - boundaryLeft);
      const left = Math.max(boundaryLeft, Math.min(rect.left, boundaryRight - width));

      setDropdownPosition({
        top: opensAbove ? rect.top - maxHeight - 4 : rect.bottom + 4,
        left,
        width,
        maxHeight,
      });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isOpen, disabled, filteredCustomers.length]);

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
          aria-label="Customer account"
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
          onBlur={() => setIsOpen(false)}
          onChange={(event) => {
            setQuery(event.target.value);
            setIsOpen(true);
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setIsOpen(true);
              setActiveIndex((index) => isOpen ? Math.min(index + 1, Math.max(0, filteredCustomers.length - 1)) : 0);
            }
            if (event.key === "ArrowUp") {
              event.preventDefault();
              setIsOpen(true);
              setActiveIndex((index) => isOpen ? Math.max(index - 1, 0) : Math.max(filteredCustomers.length - 1, 0));
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
          className={`h-9 w-full rounded-xl border border-zinc-200 bg-white pl-8 ${value ? "pr-14" : "pr-8"} text-[12px] font-medium text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-[#006d32] focus:ring-2 focus:ring-[#006d32]/15 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700/80 dark:bg-zinc-900/80 dark:text-zinc-100`}
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
        <ChevronDown className={`pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400 transition-transform ${isOpen ? "rotate-180 text-[#006d32]" : ""}`} />
      </div>

      {isOpen && !disabled && dropdownPosition && createPortal(
        <div
          ref={optionsRef}
          id="customer-options"
          role="listbox"
          style={{
            position: "fixed",
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            width: dropdownPosition.width,
            maxHeight: dropdownPosition.maxHeight,
          }}
          className="z-[70] overflow-y-auto rounded-xl border border-zinc-200 bg-white p-1.5 shadow-[0_10px_30px_rgba(15,23,42,0.12)] dark:border-zinc-700 dark:bg-zinc-900 dark:shadow-[0_10px_28px_rgba(0,0,0,0.45)]"
        >
          {filteredCustomers.length > 0 ? (
            filteredCustomers.map((customer, index) => (
              <button
                key={customer.id}
                type="button"
                role="option"
                id={`customer-option-${customer.id}`}
                aria-selected={index === activeIndex}
                onMouseDown={(event) => event.preventDefault()}
                onMouseMove={() => setActiveIndex(index)}
                onClick={() => selectCustomer(customer)}
                tabIndex={-1}
                className={`flex w-full items-center justify-between gap-3 rounded-lg px-2.5 py-1.5 text-left transition-colors hover:bg-emerald-50 dark:hover:bg-emerald-950/40 ${index === activeIndex ? "bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200" : ""}`}
              >
                <span className="min-w-0">
                  <span className="block truncate text-[12px] font-semibold text-zinc-900 dark:text-zinc-100">
                    {customer.name}
                  </span>
                  <span className="block truncate text-[10px] font-mono text-zinc-500 dark:text-zinc-400">
                    {customer.country || "Country not set"}
                  </span>
                </span>
                {customer.name === value && <Check className="h-3.5 w-3.5 shrink-0 text-[#006d32] dark:text-emerald-400" />}
              </button>
            ))
          ) : (
            <div className="px-2.5 py-3 text-center text-[11px] text-zinc-500 dark:text-zinc-400">
              No customers match “{query}”. Search by account name or country.
            </div>
          )}
        </div>,
        document.body,
      )}
    </div>
  );
};
