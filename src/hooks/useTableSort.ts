import { useState, useMemo } from "react";

type SortDirection = "asc" | "desc" | null;

interface SortState {
  column: string | null;
  direction: SortDirection;
}

export function useTableSort<T extends Record<string, any>>(data: T[] | undefined | null) {
  const [sort, setSort] = useState<SortState>({ column: null, direction: null });

  const toggle = (column: string) => {
    setSort((prev) => {
      if (prev.column !== column) return { column, direction: "asc" };
      if (prev.direction === "asc") return { column, direction: "desc" };
      return { column: null, direction: null };
    });
  };

  const sorted = useMemo(() => {
    if (!data) return data;
    if (!sort.column || !sort.direction) return data;
    const col = sort.column;
    const dir = sort.direction === "asc" ? 1 : -1;
    return [...data].sort((a, b) => {
      const va = a[col];
      const vb = b[col];
      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;
      if (typeof va === "number" && typeof vb === "number") return (va - vb) * dir;
      return String(va).localeCompare(String(vb)) * dir;
    });
  }, [data, sort]);

  return { sorted, sort, toggle };
}
