import { useState, useMemo, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useDataFilters(records: any[] | undefined, pesquisaIdsWithPlans?: Set<number>) {
  const [filters, setFilters] = useState<Record<string, string[]>>({});
  const { allowedThemes, isAdmin } = useAuth();

  const { data: clientsWithVertical } = useQuery({
    queryKey: ["clients-verticals"],
    queryFn: async () => {
      const { data } = await supabase.from("clients").select("name, vertical_id");
      return data || [];
    },
  });

  const verticalClientNames = useMemo(() => {
    if (!filters.vertical?.length || !clientsWithVertical) return null;
    return new Set(
      clientsWithVertical
        .filter((c) => filters.vertical.includes(c.vertical_id!))
        .map((c) => c.name)
    );
  }, [filters.vertical, clientsWithVertical]);

  // Auto-select the most recent year when records load
  useEffect(() => {
    if (!records?.length) return;
    const years = [...new Set(records.map((r) => r.survey_year).filter(Boolean))].sort((a: number, b: number) => b - a);
    if (years.length > 0 && (!filters.year || filters.year.length === 0)) {
      setFilters((prev) => ({ ...prev, year: [String(years[0])] }));
    }
  }, [records]);

  const onFilterChange = useCallback((key: string, values: string[]) => {
    setFilters((prev) => ({ ...prev, [key]: values }));
  }, []);

  const filtered = useMemo(() => {
    if (!records) return records;
    return records.filter((r) => {
      if (!isAdmin && allowedThemes.length > 0 && !allowedThemes.includes(r.theme)) return false;
      if (filters.year?.length && !filters.year.includes(String(r.survey_year))) return false;
      if (verticalClientNames && !verticalClientNames.has(r.client_name)) return false;
      if (filters.client?.length && !filters.client.includes(r.client_name)) return false;
      if (filters.name?.length) {
        const fullName = [r.firstname, r.lastname].filter(Boolean).join(" ");
        if (!filters.name.includes(fullName)) return false;
      }
      if (filters.theme?.length && !filters.theme.includes(r.theme)) return false;
      if (filters.score?.length && !filters.score.includes(String(r.score))) return false;
      if (filters.theme_comment?.length) {
        const hasComment = r.theme_comment != null && String(r.theme_comment).trim() !== "";
        const wantFilled = filters.theme_comment.includes("filled");
        const wantEmpty = filters.theme_comment.includes("empty");
        if (wantFilled && !wantEmpty && !hasComment) return false;
        if (wantEmpty && !wantFilled && hasComment) return false;
      }
      if (filters.question_comment?.length) {
        const hasComment = r.question_comment != null && String(r.question_comment).trim() !== "";
        const wantFilled = filters.question_comment.includes("filled");
        const wantEmpty = filters.question_comment.includes("empty");
        if (wantFilled && !wantEmpty && !hasComment) return false;
        if (wantEmpty && !wantFilled && hasComment) return false;
      }
      if (filters.action_plan?.length && pesquisaIdsWithPlans) {
        const hasPlan = pesquisaIdsWithPlans.has(r.id);
        const wantYes = filters.action_plan.includes("yes");
        const wantNo = filters.action_plan.includes("no");
        if (wantYes && !wantNo && !hasPlan) return false;
        if (wantNo && !wantYes && hasPlan) return false;
      }
      return true;
    });
  }, [records, filters, allowedThemes, isAdmin, pesquisaIdsWithPlans, verticalClientNames]);

  return { filters, onFilterChange, filtered };
}
