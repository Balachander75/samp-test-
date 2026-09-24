import { useState, useEffect } from "react";
import { CustomerItem } from "../types";
import { fetchCustomersApi } from "../api";

export function useCustomerOptions() {
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;
    fetchCustomersApi()
      .then((data) => {
        if (isMounted && data && data.length > 0) {
          setCustomers(data);
        }
      })
      .catch((err) => {
        if (isMounted) setError(err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return { customers, loading, error };
}
