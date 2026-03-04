import { useState, useMemo, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";

export function useDataFilters(records: any[] | undefined) {
  const [filters, setFilters] = useState<Record<string, string>>({});
  const { allowedThemes, isAdmin } = useAuth();

  const onFilterChange = useCallback((key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value === "all" ? "" : value }));
  }, []);

  const filtered = useMemo(() => {
    if (!records) return records;
    return records.filter((r) => {
      // Filter by allowed themes (admins see all, empty array = no access profile = show all)
      if (!isAdmin && allowedThemes.length > 0 && !allowedThemes.includes(r.theme)) return false;
      if (filters.year && String(r.survey_year) !== filters.year) return false;
      if (filters.client && r.client_name !== filters.client) return false;
      if (filters.name) {
        const fullName = [r.firstname, r.lastname].filter(Boolean).join(" ");
        if (fullName !== filters.name) return false;
      }
      if (filters.theme && r.theme !== filters.theme) return false;
      return true;
    });
  }, [records, filters, allowedThemes, isAdmin]);

  return { filters, onFilterChange, filtered };
}
