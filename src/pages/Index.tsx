import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Upload, Database, BarChart3, Users, FileSpreadsheet } from "lucide-react";
import { useTranslation } from "react-i18next";

const COLUMN_MAP: Record<string, string> = {
  COUNTRY: "country", CONTACT: "contact", CLIENT_NAME: "client_name",
  FIRSTNAME: "firstname", LASTNAME: "lastname", TYPE: "type",
  ACTIVITY: "activity", CONTEXT: "context", ANSWERED: "answered",
  PROGRESS: "progress", ANSWER_DELAY: "answer_delay", THEME: "theme",
  THEME_COMMENT: "theme_comment", QUESTION: "question",
  APPLICABILITY: "applicability", IMPORTANCE: "importance",
  SCORE: "score", QUESTION_COMMENT: "question_comment",
};

const Index = () => {
  const [importing, setImporting] = useState(false);
  const { t } = useTranslation();

  const { data: records, refetch, isLoading } = useQuery({
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
  const avgScore = records?.length
    ? (records.reduce((s, r) => s + (Number(r.score) || 0), 0) / records.filter(r => r.score != null).length).toFixed(2)
    : "—";
  const uniqueClients = new Set(records?.map((r) => r.client_name)).size;
  const uniqueThemes = new Set(records?.map((r) => r.theme)).size;

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const jsonRows = XLSX.utils.sheet_to_json<Record<string, any>>(ws);
      const mapped = jsonRows.map((row) => {
        const out: Record<string, any> = {};
        for (const [excelCol, dbCol] of Object.entries(COLUMN_MAP)) {
          const val = row[excelCol];
          if (val !== undefined && val !== null && val !== "") out[dbCol] = val;
        }
        return out;
      });
      const batchSize = 200;
      let inserted = 0;
      for (let i = 0; i < mapped.length; i += batchSize) {
        const batch = mapped.slice(i, i + batchSize);
        const { error } = await supabase.from("pesquisa_satisfacao").insert(batch);
        if (error) throw error;
        inserted += batch.length;
      }
      toast.success(t("dashboard.recordsImported", { count: inserted }));
      refetch();
    } catch (err: any) {
      toast.error(t("dashboard.importError") + err.message);
    } finally {
      setImporting(false);
      e.target.value = "";
    }
  }, [refetch, t]);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{t("dashboard.title")}</h1>
            <p className="text-muted-foreground">{t("dashboard.subtitle")}</p>
          </div>
          <label>
            <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFileUpload} disabled={importing} />
            <Button asChild variant="default" disabled={importing}>
              <span className="cursor-pointer">
                <Upload className="mr-2 h-4 w-4" />
                {importing ? t("dashboard.importing") : t("dashboard.importExcel")}
              </span>
            </Button>
          </label>
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
