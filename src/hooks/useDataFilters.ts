import { useState, useMemo, useCallback } from "react";

export function useDataFilters(records: any[] | undefined) {
  const [filters, setFilters] = useState<Record<string, string>>({});

  const onFilterChange = useCallback((key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value === "all" ? "" : value }));
  }, []);

  const filtered = useMemo(() => {
    if (!records) return records;
    return records.filter((r) => {
      if (filters.year && String(r.survey_year) !== filters.year) return false;
      if (filters.client && r.client_name !== filters.client) return false;
      if (filters.name) {
        const fullName = [r.firstname, r.lastname].filter(Boolean).join(" ");
        if (fullName !== filters.name) return false;
      }
      if (filters.theme && r.theme !== filters.theme) return false;
      return true;
    });
  }, [records, filters]);

  return { filters, onFilterChange, filtered };
}
