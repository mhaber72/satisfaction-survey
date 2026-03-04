import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import MultiSelectFilter from "@/components/MultiSelectFilter";

interface DataFiltersProps {
  records: any[] | undefined;
  filters: Record<string, string[]>;
  onFilterChange: (key: string, values: string[]) => void;
  showTheme?: boolean;
}

const DataFilters = ({ records, filters, onFilterChange, showTheme = false }: DataFiltersProps) => {
  const { t } = useTranslation();

  const options = useMemo(() => {
    if (!records?.length) return { years: [], clients: [], names: [], themes: [], scores: [] };

    const years = [...new Set(records.map((r) => r.survey_year).filter(Boolean))].sort((a, b) => b - a);
    const clients = [...new Set(records.map((r) => r.client_name).filter(Boolean))].sort();
    const names = [...new Set(records.map((r) => [r.firstname, r.lastname].filter(Boolean).join(" ")).filter(Boolean))].sort();
    const themes = [...new Set(records.map((r) => r.theme).filter(Boolean))].sort();
    const scores = [...new Set(records.map((r) => r.score).filter((s) => s != null))].sort((a, b) => a - b);

    return { years, clients, names, themes, scores };
  }, [records]);

  return (
    <div className="flex flex-wrap gap-4">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground">{t("filters.year")}</label>
        <MultiSelectFilter
          label={t("filters.year")}
          options={options.years}
          selected={filters.year || []}
          onChange={(v) => onFilterChange("year", v)}
          width="w-[150px]"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground">{t("filters.client")}</label>
        <MultiSelectFilter
          label={t("filters.client")}
          options={options.clients}
          selected={filters.client || []}
          onChange={(v) => onFilterChange("client", v)}
          width="w-[200px]"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground">{t("filters.name")}</label>
        <MultiSelectFilter
          label={t("filters.name")}
          options={options.names}
          selected={filters.name || []}
          onChange={(v) => onFilterChange("name", v)}
          width="w-[200px]"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground">Score</label>
        <MultiSelectFilter
          label="Score"
          options={options.scores}
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
            options={options.themes}
            selected={filters.theme || []}
            onChange={(v) => onFilterChange("theme", v)}
            width="w-[220px]"
          />
        </div>
      )}
    </div>
  );
};

export default DataFilters;
