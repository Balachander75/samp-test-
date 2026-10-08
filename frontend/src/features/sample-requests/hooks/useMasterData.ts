import { useEffect, useState } from "react";
import { fetchCustomersApi, fetchPlantsApi } from "@/infrastructure/api";
import { CustomerItem, PlantItem } from "../types";

interface MasterDataState {
  customers: CustomerItem[];
  plants: PlantItem[];
  isLoading: boolean;
  error: string | null;
}

export const DEFAULT_CUSTOMERS: CustomerItem[] = [
  { id: 1, name: "Walmart Inc.", country: "USA" },
  { id: 2, name: "Target Corporation", country: "USA" },
  { id: 3, name: "Tesco PLC", country: "United Kingdom" },
  { id: 4, name: "Staples Inc.", country: "USA" },
  { id: 5, name: "Office Depot", country: "USA" },
  { id: 6, name: "Amazon Retail", country: "USA" },
  { id: 7, name: "Reliance Retail", country: "India" },
  { id: 8, name: "Kokuyo Camlin", country: "India" },
  { id: 9, name: "ITC Classmate", country: "India" },
  { id: 10, name: "Navneet Education Ltd", country: "India" },
  { id: 11, name: "Metro Cash & Carry", country: "Germany" },
  { id: 12, name: "Carrefour SA", country: "France" },
  { id: 13, name: "Dollar General", country: "USA" },
  { id: 14, name: "Walgreens Boots", country: "USA" },
  { id: 15, name: "Kroger Co.", country: "USA" },
];

export const DEFAULT_PLANTS: PlantItem[] = [
  { id: 1, code: "1505", name: "Navneet - Khaniwade", location: "Khaniwade, Maharashtra", isActive: true, createdBy: "System", createdAt: "2026-01-01", updatedAt: "2026-01-01" },
  { id: 2, code: "1501", name: "Navneet - Dantali", location: "Dantali, Gujarat", isActive: true, createdBy: "System", createdAt: "2026-01-01", updatedAt: "2026-01-01" },
  { id: 3, code: "1502", name: "Navneet - Silvassa", location: "Silvassa, D&NH", isActive: true, createdBy: "System", createdAt: "2026-01-01", updatedAt: "2026-01-01" },
  { id: 4, code: "1503", name: "Navneet - Rakanpur", location: "Rakanpur, Gujarat", isActive: true, createdBy: "System", createdAt: "2026-01-01", updatedAt: "2026-01-01" },
];

/** Load customer and plant masters from the FastAPI database with reliable fallbacks. */
export function useMasterData(enabled = true): MasterDataState {
  const [customers, setCustomers] = useState<CustomerItem[]>(DEFAULT_CUSTOMERS);
  const [plants, setPlants] = useState<PlantItem[]>(DEFAULT_PLANTS);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    setIsLoading(true);

    Promise.all([fetchCustomersApi(), fetchPlantsApi()])
      .then(([customerRows, plantRows]) => {
        if (cancelled) return;
        if (customerRows && customerRows.length > 0) {
          setCustomers(customerRows);
        }
        if (plantRows && plantRows.length > 0) {
          setPlants(plantRows.filter((plant) => plant.isActive !== false));
        }
      })
      .catch((err) => {
        console.warn("Could not load backend master data, using fallback lists:", err);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return { customers, plants, isLoading, error };
}
