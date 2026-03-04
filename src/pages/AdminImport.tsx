import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import ExcelJS from "exceljs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Upload, Trash2, FileSpreadsheet } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const COLUMN_MAP: Record<string, string> = {
  COUNTRY: "country", CONTACT: "contact", CLIENT_NAME: "client_name",
  FIRSTNAME: "firstname", LASTNAME: "lastname", TYPE: "type",
  ACTIVITY: "activity", CONTEXT: "context", ANSWERED: "answered",
  PROGRESS: "progress", ANSWER_DELAY: "answer_delay", THEME: "theme",
  THEME_COMMENT: "theme_comment", QUESTION: "question",
  APPLICABILITY: "applicability", IMPORTANCE: "importance",
  SCORE: "score", QUESTION_COMMENT: "question_comment",
};

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 10 }, (_, i) => currentYear - i);

const AdminImport = () => {
  const [importing, setImporting] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [selectedYear, setSelectedYear] = useState<string>(String(currentYear));
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data: recordCount, refetch } = useQuery({
    queryKey: ["pesquisa-count"],
    queryFn: async () => {
      const { count, error } = await supabase.from("pesquisa_satisfacao").select("*", { count: "exact", head: true });
      if (error) throw error;
      return count ?? 0;
    },
  });

  const handleClearData = useCallback(async () => {
    if (!confirm(t("adminImport.confirmClear"))) return;
    setClearing(true);
    try {
      const { error } = await supabase.from("pesquisa_satisfacao").delete().gte("id", 0);
      if (error) throw error;
      toast.success(t("adminImport.dataCleared"));
      refetch();
      queryClient.invalidateQueries({ queryKey: ["pesquisa"] });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setClearing(false);
    }
  }, [refetch, queryClient, t]);

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!selectedYear) {
      toast.error(t("adminImport.selectYearFirst"));
      return;
    }
    setImporting(true);
    try {
      const data = await file.arrayBuffer();
      const wb = new ExcelJS.Workbook();
      await wb.xlsx.load(data);
      const ws = wb.worksheets[0];
      const headers: string[] = [];
      ws.getRow(1).eachCell((cell, colNumber) => {
        headers[colNumber - 1] = String(cell.value ?? "").trim();
      });
      const jsonRows: Record<string, any>[] = [];
      ws.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;
        const obj: Record<string, any> = {};
        row.eachCell((cell, colNumber) => {
          const key = headers[colNumber - 1];
          if (key) obj[key] = cell.value;
        });
        jsonRows.push(obj);
      });
      const mapped = jsonRows.map((row) => {
        const out: Record<string, any> = { survey_year: Number(selectedYear) };
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
      toast.success(t("adminImport.recordsImported", { count: inserted }));
      refetch();
      queryClient.invalidateQueries({ queryKey: ["pesquisa"] });
    } catch (err: any) {
      toast.error(t("adminImport.importError") + err.message);
    } finally {
      setImporting(false);
      e.target.value = "";
    }
  }, [refetch, queryClient, selectedYear, t]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(210,80%,15%)] via-[hsl(210,70%,20%)] to-[hsl(215,85%,10%)] p-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <h1 className="text-2xl font-bold text-white">{t("adminImport.title")}</h1>

        <Card className="border-[hsla(200,80%,60%,0.15)] bg-[hsla(210,70%,15%,0.6)] backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-white">{t("adminImport.currentData")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-[hsl(200,60%,70%)]">
              {t("adminImport.totalRecords")}: <span className="font-bold text-white">{recordCount ?? 0}</span>
            </p>
            <Button
              variant="destructive"
              onClick={handleClearData}
              disabled={clearing || recordCount === 0}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {clearing ? t("adminImport.clearing") : t("adminImport.clearAll")}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-[hsla(200,80%,60%,0.15)] bg-[hsla(210,70%,15%,0.6)] backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-white">{t("adminImport.importTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[hsl(200,60%,70%)]">{t("adminImport.surveyYear")}</Label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-[200px] border-[hsla(200,80%,60%,0.3)] bg-[hsla(210,70%,15%,0.5)] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-[hsla(200,80%,60%,0.3)] bg-[hsl(215,85%,12%)]">
                  {YEARS.map((y) => (
                    <SelectItem key={y} value={String(y)} className="text-white">{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <label>
              <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFileUpload} disabled={importing} />
              <Button asChild variant="default" disabled={importing} className="bg-[hsl(200,80%,45%)] hover:bg-[hsl(200,80%,55%)]">
                <span className="cursor-pointer">
                  <Upload className="mr-2 h-4 w-4" />
                  {importing ? t("adminImport.importing") : t("adminImport.importExcel")}
                </span>
              </Button>
            </label>

            <div className="rounded-md border border-[hsla(200,80%,60%,0.1)] bg-[hsla(210,70%,15%,0.3)] p-4">
              <div className="flex items-start gap-3">
                <FileSpreadsheet className="mt-0.5 h-5 w-5 text-[hsl(200,60%,60%)]" />
                <div className="text-sm text-[hsl(200,40%,70%)]">
                  <p className="font-medium text-[hsl(200,60%,70%)]">{t("adminImport.formatTitle")}</p>
                  <p className="mt-1">{t("adminImport.formatDesc")}</p>
                  <p className="mt-1 font-mono text-xs text-[hsl(200,40%,60%)]">
                    COUNTRY, CONTACT, CLIENT_NAME, FIRSTNAME, LASTNAME, TYPE, ACTIVITY, CONTEXT, ANSWERED, PROGRESS, ANSWER_DELAY, THEME, THEME_COMMENT, QUESTION, APPLICABILITY, IMPORTANCE, SCORE, QUESTION_COMMENT
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminImport;
