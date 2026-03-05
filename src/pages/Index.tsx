import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Database, BarChart3, Users, FileSpreadsheet } from "lucide-react";
import { useTranslation } from "react-i18next";

import DataFilters from "@/components/DataFilters";
import { useDataFilters } from "@/hooks/useDataFilters";
import { useTableSort } from "@/hooks/useTableSort";
import SortableTh from "@/components/SortableTh";

const Index = () => {
  const { t } = useTranslation();

  const { data: records, isLoading } = useQuery({
    queryKey: ["pesquisa"],
    queryFn: async () => {
      let allData: any[] = [];
      let from = 0;
      const pageSize = 1000;
      while (true) {
        const { data, error } = await supabase.from("pesquisa_satisfacao").select("*").neq("theme", "CORPORATE PERCEPTION").eq("answered", 1).order("id", { ascending: true }).range(from, from + pageSize - 1);
        if (error) throw error;
        if (!data || data.length === 0) break;
        allData = allData.concat(data);
        if (data.length < pageSize) break;
        from += pageSize;
      }
      return allData;
    },
  });

  const { filters, onFilterChange, filtered } = useDataFilters(records);
  const { sorted, sort, toggle } = useTableSort(filtered);

  const totalRecords = filtered?.length ?? 0;
  const avgScore = (() => {
    if (!filtered?.length) return "—";
    const valid = filtered.filter((r) => r.score != null && r.score !== 0 && r.answered === 1 && r.theme?.toUpperCase() !== "CORPORATE PERCEPTION");
    if (!valid.length) return "—";
    const byClient: Record<string, number[]> = {};
    valid.forEach((r) => {
      const key = r.client_name ?? "__unknown__";
      if (!byClient[key]) byClient[key] = [];
      byClient[key].push(Number(r.score));
    });
    const clientAvgs = Object.values(byClient).map((scores) => scores.reduce((a, b) => a + b, 0) / scores.length);
    return (clientAvgs.reduce((a, b) => a + b, 0) / clientAvgs.length).toFixed(2);
  })();
  const uniqueClients = new Set(filtered?.map((r) => r.client_name)).size;
  const uniqueThemes = new Set(filtered?.map((r) => r.theme)).size;

  const columns = [
    { key: "client_name", label: t("dashboard.client") },
    { key: "name", label: t("dashboard.name") },
    { key: "theme", label: t("dashboard.theme") },
    { key: "theme_comment", label: t("dashboard.themeComment") },
    { key: "question", label: t("dashboard.question") },
    { key: "applicability", label: t("dashboard.applicability") },
    { key: "importance", label: t("dashboard.importance") },
    { key: "score", label: t("dashboard.score") },
    { key: "question_comment", label: t("dashboard.questionComment") },
  ];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{t("dashboard.title")}</h1>
            <p className="text-muted-foreground">{t("dashboard.subtitle")}</p>
          </div>
        </div>

        <DataFilters records={records} filters={filters} onFilterChange={onFilterChange} showTheme />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: t("dashboard.totalRecords"), value: totalRecords, icon: Database, key: "totalRecords" },
            { label: t("dashboard.avgScore"), value: avgScore, icon: BarChart3, key: "avgScore" },
            { label: t("dashboard.clients"), value: uniqueClients, icon: Users, key: "clients" },
            { label: t("dashboard.themes"), value: uniqueThemes, icon: FileSpreadsheet, key: "themes" },
          ].map((kpi) => (
            <Card key={kpi.key}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{kpi.label}</CardTitle>
                <kpi.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent><p className="text-2xl font-bold">{kpi.value}</p></CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader><CardTitle>{t("dashboard.surveyData")}</CardTitle></CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <p className="text-muted-foreground p-6">{t("dashboard.loading")}</p>
            ) : totalRecords === 0 ? (
              <div className="flex flex-col items-center gap-4 py-12 text-muted-foreground">
                <FileSpreadsheet className="h-12 w-12" />
                <p>{t("dashboard.noData")}</p>
              </div>
            ) : (
              <div className="relative border rounded-md" style={{ height: "380px" }}>
                <div className="absolute inset-0 overflow-auto" style={{ scrollbarWidth: "auto", scrollbarColor: "#888 #f1f1f1" }}>
                  <table className="w-max min-w-full caption-bottom text-sm">
                    <thead className="sticky top-0 z-10 bg-background [&_tr]:border-b">
                      <tr className="border-b transition-colors">
                        {columns.map((col) => (
                          <SortableTh
                            key={col.key}
                            label={col.label}
                            column={col.key}
                            currentColumn={sort.column}
                            direction={sort.direction}
                            onToggle={toggle}
                            className="text-muted-foreground"
                          />
                        ))}
                      </tr>
                    </thead>
                    <tbody className="[&_tr:last-child]:border-0">
                      {sorted?.map((r) => (
                        <tr key={r.id} className="border-b transition-colors hover:bg-muted/50">
                           <td className="p-4 align-middle whitespace-nowrap">{r.client_name}</td>
                           <td className="p-4 align-middle whitespace-nowrap">{r.firstname} {r.lastname}</td>
                           <td className="p-4 align-middle whitespace-nowrap">{r.theme}</td>
                           <td className="p-4 align-middle whitespace-nowrap">{r.theme_comment}</td>
                           <td className="p-4 align-middle whitespace-nowrap">{r.question}</td>
                           <td className="p-4 align-middle whitespace-nowrap">{r.applicability}</td>
                           <td className="p-4 align-middle whitespace-nowrap">{r.importance}</td>
                           <td className="p-4 align-middle whitespace-nowrap">{r.score}</td>
                           <td className="p-4 align-middle whitespace-nowrap">{r.question_comment}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
