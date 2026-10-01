import { useEffect, useState } from "react";
import { fetchCustomersApi, fetchPlantsApi } from "../api";
import { CustomerItem, PlantItem } from "../types";

interface MasterDataState {
  customers: CustomerItem[];
  plants: PlantItem[];
  isLoading: boolean;
  error: string | null;
}

/** Load customer and plant masters from the FastAPI database. */
export function useMasterData(enabled = true): MasterDataState {
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [plants, setPlants] = useState<PlantItem[]>([]);
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    Promise.all([fetchCustomersApi(), fetchPlantsApi()])
      .then(([customerRows, plantRows]) => {
        if (cancelled) return;
        setCustomers(customerRows);
        setPlants(plantRows.filter((plant) => plant.isActive !== false));
        if (customerRows.length === 0 || plantRows.length === 0) {
          setError("Customer or plant master data is unavailable.");
        }
      })
      .catch(() => {
        if (!cancelled) setError("Unable to load customer and plant master data.");
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
