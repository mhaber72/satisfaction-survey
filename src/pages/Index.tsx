import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Database, BarChart3, Users, FileSpreadsheet } from "lucide-react";
import { useTranslation } from "react-i18next";
import RadarChartDialog from "@/components/RadarChartDialog";
import DataFilters from "@/components/DataFilters";
import { useDataFilters } from "@/hooks/useDataFilters";

const Index = () => {
  const { t } = useTranslation();

  const { data: records, isLoading } = useQuery({
    queryKey: ["pesquisa"],
    queryFn: async () => {
      let allData: any[] = [];
      let from = 0;
      const pageSize = 1000;
      while (true) {
        const { data, error } = await supabase.from("pesquisa_satisfacao").select("*").order("id", { ascending: true }).range(from, from + pageSize - 1);
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
                <div className="flex items-center gap-1">
                  {kpi.key === "avgScore" && <RadarChartDialog records={filtered} />}
                  <kpi.icon className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent><p className="text-2xl font-bold">{kpi.value}</p></CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader><CardTitle>{t("dashboard.surveyData")}</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground">{t("dashboard.loading")}</p>
            ) : totalRecords === 0 ? (
              <div className="flex flex-col items-center gap-4 py-12 text-muted-foreground">
                <FileSpreadsheet className="h-12 w-12" />
                <p>{t("dashboard.noData")}</p>
              </div>
            ) : (
              <div className="overflow-auto max-h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="whitespace-nowrap">{t("dashboard.client")}</TableHead>
                      <TableHead className="whitespace-nowrap">{t("dashboard.name")}</TableHead>
                      <TableHead className="whitespace-nowrap">{t("dashboard.theme")}</TableHead>
                      <TableHead className="whitespace-nowrap">{t("dashboard.themeComment")}</TableHead>
                      <TableHead className="whitespace-nowrap">{t("dashboard.question")}</TableHead>
                      <TableHead className="whitespace-nowrap">{t("dashboard.applicability")}</TableHead>
                      <TableHead className="whitespace-nowrap">{t("dashboard.importance")}</TableHead>
                      <TableHead className="whitespace-nowrap">{t("dashboard.score")}</TableHead>
                      <TableHead className="whitespace-nowrap">{t("dashboard.questionComment")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered?.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="max-w-[150px] truncate">{r.client_name}</TableCell>
                        <TableCell className="whitespace-nowrap">{r.firstname} {r.lastname}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{r.theme}</TableCell>
                        <TableCell className="max-w-[250px] truncate">{r.theme_comment}</TableCell>
                        <TableCell className="max-w-[250px] truncate">{r.question}</TableCell>
                        <TableCell>{r.applicability}</TableCell>
                        <TableCell>{r.importance}</TableCell>
                        <TableCell>{r.score}</TableCell>
                        <TableCell className="max-w-[300px] truncate">{r.question_comment}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
