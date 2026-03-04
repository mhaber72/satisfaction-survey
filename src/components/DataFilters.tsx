import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface DataFiltersProps {
  records: any[] | undefined;
  filters: {
    year?: string;
    client?: string;
    name?: string;
    theme?: string;
  };
  onFilterChange: (key: string, value: string) => void;
  showTheme?: boolean;
}

const DataFilters = ({ records, filters, onFilterChange, showTheme = false }: DataFiltersProps) => {
  const { t } = useTranslation();

  const options = useMemo(() => {
    if (!records?.length) return { years: [], clients: [], names: [], themes: [] };

    const years = [...new Set(records.map((r) => r.survey_year).filter(Boolean))].sort((a, b) => b - a);
    const clients = [...new Set(records.map((r) => r.client_name).filter(Boolean))].sort();
    const names = [...new Set(records.map((r) => [r.firstname, r.lastname].filter(Boolean).join(" ")).filter(Boolean))].sort();
    const themes = [...new Set(records.map((r) => r.theme).filter(Boolean))].sort();

    return { years, clients, names, themes };
  }, [records]);

  return (
    <div className="flex flex-wrap gap-3">
      <Select value={filters.year || "all"} onValueChange={(v) => onFilterChange("year", v)}>
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder={t("filters.year")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("filters.all")}</SelectItem>
          {options.years.map((y) => (
            <SelectItem key={y} value={String(y)}>{y}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filters.client || "all"} onValueChange={(v) => onFilterChange("client", v)}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder={t("filters.client")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("filters.all")}</SelectItem>
          {options.clients.map((c) => (
            <SelectItem key={c} value={c}>{c}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filters.name || "all"} onValueChange={(v) => onFilterChange("name", v)}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder={t("filters.name")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("filters.all")}</SelectItem>
          {options.names.map((n) => (
            <SelectItem key={n} value={n}>{n}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {showTheme && (
        <Select value={filters.theme || "all"} onValueChange={(v) => onFilterChange("theme", v)}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder={t("filters.theme")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("filters.all")}</SelectItem>
            {options.themes.map((th) => (
              <SelectItem key={th} value={th}>{th}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
};

export default DataFilters;
