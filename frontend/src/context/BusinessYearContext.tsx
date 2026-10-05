import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { getCurrentBusinessYear } from "@/lib/businessYear";
import { fetchBusinessYearsApi, BusinessYearOption } from "@/infrastructure/api/masterApi";

export interface BusinessYearContextType {
  selectedYear: string;
  setSelectedYear: (year: string) => void;
  currentBusinessYear: string;
  yearsList: BusinessYearOption[];
  totalRecords: number;
  isLoading: boolean;
  isViewingPastYear: boolean;
  isViewingAllYears: boolean;
  refreshYears: () => Promise<void>;
}

const STORAGE_KEY = "samp_business_year";

const BusinessYearContext = createContext<BusinessYearContextType | undefined>(undefined);

export const BusinessYearProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const currentBusinessYear = useMemo(() => getCurrentBusinessYear(), []);
  
  const [selectedYear, setSelectedYearState] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return saved;
    } catch {
      // Fallback
    }
    // Default to the historical year with active operational data (2025-2026) or current
    return "2025-2026";
  });

  const [yearsList, setYearsList] = useState<BusinessYearOption[]>([
    { year: currentBusinessYear, label: `BY ${currentBusinessYear}`, is_current: true, count: 0 },
    { year: "2025-2026", label: "BY 2025-2026", is_current: false, count: 2684 },
  ]);
  const [totalRecords, setTotalRecords] = useState<number>(2684);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshYears = useCallback(async () => {
    try {
      const data = await fetchBusinessYearsApi();
      setYearsList(data.years);
      setTotalRecords(data.total_records);

      // If user had no explicit preference saved and current year has 0 records,
      // pick the most recent year with records (e.g. 2025-2026)
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) {
        const yearWithRecords = data.years.find((y) => y.count > 0);
        if (yearWithRecords && yearWithRecords.year !== selectedYear) {
          setSelectedYearState(yearWithRecords.year);
        }
      }
    } catch (err) {
      console.error("Failed to load business years:", err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedYear]);

  useEffect(() => {
    refreshYears();
  }, [refreshYears]);

  const setSelectedYear = useCallback((year: string) => {
    setSelectedYearState(year);
    try {
      localStorage.setItem(STORAGE_KEY, year);
    } catch {
      // Ignore storage errors
    }
    // Dispatch custom event so any non-react listeners or decoupled tables can react
    window.dispatchEvent(new CustomEvent("app:business-year-changed", { detail: { year } }));
  }, []);

  const isViewingPastYear = useMemo(() => {
    return selectedYear !== "ALL" && selectedYear !== currentBusinessYear;
  }, [selectedYear, currentBusinessYear]);

  const isViewingAllYears = useMemo(() => {
    return selectedYear === "ALL";
  }, [selectedYear]);

  return (
    <BusinessYearContext.Provider
      value={{
        selectedYear,
        setSelectedYear,
        currentBusinessYear,
        yearsList,
        totalRecords,
        isLoading,
        isViewingPastYear,
        isViewingAllYears,
        refreshYears,
      }}
    >
      {children}
    </BusinessYearContext.Provider>
  );
};

export const useBusinessYear = (): BusinessYearContextType => {
  const context = useContext(BusinessYearContext);
  if (!context) {
    throw new Error("useBusinessYear must be used within a BusinessYearProvider");
  }
  return context;
};
