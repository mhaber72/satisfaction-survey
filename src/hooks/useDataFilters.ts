import { useState, useMemo, useCallback, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

export function useDataFilters(records: any[] | undefined) {
  const [filters, setFilters] = useState<Record<string, string>>({});
  const { allowedThemes, isAdmin } = useAuth();

  // Auto-select the most recent year when records load
  useEffect(() => {
    if (!records?.length) return;
    const years = [...new Set(records.map((r) => r.survey_year).filter(Boolean))].sort((a: number, b: number) => b - a);
    if (years.length > 0 && !filters.year) {
      setFilters((prev) => ({ ...prev, year: String(years[0]) }));
    }
  }, [records]);

  const onFilterChange = useCallback((key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value === "all" ? "" : value }));
  }, []);

  const filtered = useMemo(() => {
    if (!records) return records;
    return records.filter((r) => {
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
