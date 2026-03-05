import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import MultiSelectFilter from "@/components/MultiSelectFilter";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface DataFiltersProps {
  records: any[] | undefined;
  filters: Record<string, string[]>;
  onFilterChange: (key: string, values: string[]) => void;
  showTheme?: boolean;
  showActionPlanFilter?: boolean;
}

const DataFilters = ({ records, filters, onFilterChange, showTheme = false, showActionPlanFilter = false }: DataFiltersProps) => {
  const { t } = useTranslation();

  // Helper: apply all filters EXCEPT the excluded key to get contextual options
  const applyFiltersExcept = (excludeKey: string) => {
    if (!records?.length) return [];
    return records.filter((r) => {
      if (excludeKey !== "year" && filters.year?.length && !filters.year.includes(String(r.survey_year))) return false;
      if (excludeKey !== "client" && filters.client?.length && !filters.client.includes(r.client_name)) return false;
      if (excludeKey !== "name" && filters.name?.length) {
        const fullName = [r.firstname, r.lastname].filter(Boolean).join(" ");
        if (!filters.name.includes(fullName)) return false;
      }
      if (excludeKey !== "theme" && filters.theme?.length && !filters.theme.includes(r.theme)) return false;
      if (excludeKey !== "score" && filters.score?.length && !filters.score.includes(String(r.score))) return false;
      return true;
    });
  };

  const yearOptions = useMemo(() => {
    const subset = applyFiltersExcept("year");
    return [...new Set(subset.map((r) => r.survey_year).filter(Boolean))].sort((a, b) => b - a);
  }, [records, filters]);

  const clientOptions = useMemo(() => {
    const subset = applyFiltersExcept("client");
    return [...new Set(subset.map((r) => r.client_name).filter(Boolean))].sort();
  }, [records, filters]);

  const nameOptions = useMemo(() => {
    const subset = applyFiltersExcept("name");
    return [...new Set(subset.map((r) => [r.firstname, r.lastname].filter(Boolean).join(" ")).filter(Boolean))].sort();
  }, [records, filters]);

  const scoreOptions = useMemo(() => {
    const subset = applyFiltersExcept("score");
    return [...new Set(subset.map((r) => r.score).filter((s) => s != null))].sort((a, b) => a - b);
  }, [records, filters]);

  const themeOptions = useMemo(() => {
    const subset = applyFiltersExcept("theme");
    return [...new Set(subset.map((r) => r.theme).filter(Boolean))].sort();
  }, [records, filters]);

  return (
    <div className="flex flex-wrap gap-4">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground">{t("filters.year")}</label>
        <MultiSelectFilter
          label={t("filters.year")}
          options={yearOptions}
          selected={filters.year || []}
          onChange={(v) => onFilterChange("year", v)}
          width="w-[150px]"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground">{t("filters.client")}</label>
        <MultiSelectFilter
          label={t("filters.client")}
          options={clientOptions}
          selected={filters.client || []}
          onChange={(v) => onFilterChange("client", v)}
          width="w-[200px]"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground">{t("filters.name")}</label>
        <MultiSelectFilter
          label={t("filters.name")}
          options={nameOptions}
          selected={filters.name || []}
          onChange={(v) => onFilterChange("name", v)}
          width="w-[200px]"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground">Score</label>
        <MultiSelectFilter
          label="Score"
          options={scoreOptions}
          selected={filters.score || []}
          onChange={(v) => onFilterChange("score", v)}
          width="w-[150px]"
        />
      </div>

      {showTheme && (
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">{t("filters.theme")}</label>
          <MultiSelectFilter
            label={t("filters.theme")}
            options={themeOptions}
            selected={filters.theme || []}
            onChange={(v) => onFilterChange("theme", v)}
            width="w-[220px]"
          />
        </div>
      )}

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground">{t("filters.themeComment", "Theme Comment")}</label>
        <Select
          value={filters.theme_comment?.length === 1 ? filters.theme_comment[0] : "all"}
          onValueChange={(v) => onFilterChange("theme_comment", v === "all" ? [] : [v])}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("filters.all", "All")}</SelectItem>
            <SelectItem value="filled">{t("filters.notEmpty", "Not Empty")}</SelectItem>
            <SelectItem value="empty">{t("filters.empty", "Empty")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground">{t("filters.questionComment", "Question Comment")}</label>
        <Select
          value={filters.question_comment?.length === 1 ? filters.question_comment[0] : "all"}
          onValueChange={(v) => onFilterChange("question_comment", v === "all" ? [] : [v])}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("filters.all", "All")}</SelectItem>
            <SelectItem value="filled">{t("filters.notEmpty", "Not Empty")}</SelectItem>
            <SelectItem value="empty">{t("filters.empty", "Empty")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {showActionPlanFilter && (
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">{t("filters.actionPlan", "Action Plan")}</label>
          <Select
            value={filters.action_plan?.length === 1 ? filters.action_plan[0] : "all"}
            onValueChange={(v) => onFilterChange("action_plan", v === "all" ? [] : [v])}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("filters.all", "All")}</SelectItem>
              <SelectItem value="yes">{t("filters.yes", "Yes")}</SelectItem>
              <SelectItem value="no">{t("filters.no", "No")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
};

export default DataFilters;
