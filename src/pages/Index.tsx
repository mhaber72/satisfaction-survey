import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Database, BarChart3, Users, FileSpreadsheet } from "lucide-react";
import { useTranslation } from "react-i18next";

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

  const totalRecords = records?.length ?? 0;
  const avgScore = (() => {
    if (!records?.length) return "—";
    // Group by person (contact) and exclude those with 100% zero/null scores
    const byPerson = new Map<string, any[]>();
    records.forEach((r) => {
      const key = r.contact || `${r.firstname}_${r.lastname}`;
      if (!byPerson.has(key)) byPerson.set(key, []);
      byPerson.get(key)!.push(r);
    });
    const validRecords = records.filter((r) => {
      const key = r.contact || `${r.firstname}_${r.lastname}`;
      const personRecords = byPerson.get(key)!;
      const allZero = personRecords.every((pr) => !pr.score || Number(pr.score) === 0);
      return !allZero;
    });
    if (!validRecords.length) return "—";
    return (validRecords.reduce((s, r) => s + (Number(r.score) || 0), 0) / validRecords.length).toFixed(2);
  })();
  const uniqueClients = new Set(records?.map((r) => r.client_name)).size;
  const uniqueThemes = new Set(records?.map((r) => r.theme)).size;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{t("dashboard.title")}</h1>
            <p className="text-muted-foreground">{t("dashboard.subtitle")}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: t("dashboard.totalRecords"), value: totalRecords, icon: Database },
            { label: t("dashboard.avgScore"), value: avgScore, icon: BarChart3 },
            { label: t("dashboard.clients"), value: uniqueClients, icon: Users },
            { label: t("dashboard.themes"), value: uniqueThemes, icon: FileSpreadsheet },
          ].map((kpi) => (
            <Card key={kpi.label}>
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
                      <TableHead>{t("dashboard.country")}</TableHead>
                      <TableHead>{t("dashboard.client")}</TableHead>
                      <TableHead>{t("dashboard.name")}</TableHead>
                      <TableHead>{t("dashboard.type")}</TableHead>
                      <TableHead>{t("dashboard.theme")}</TableHead>
                      <TableHead>{t("dashboard.score")}</TableHead>
                      <TableHead>{t("dashboard.importance")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records?.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell>{r.country}</TableCell>
                        <TableCell className="max-w-[150px] truncate">{r.client_name}</TableCell>
                        <TableCell>{r.firstname} {r.lastname}</TableCell>
                        <TableCell>{r.type}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{r.theme}</TableCell>
                        <TableCell>{r.score}</TableCell>
                        <TableCell>{r.importance}</TableCell>
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
