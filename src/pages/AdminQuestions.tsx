import { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Filter } from "lucide-react";

interface SurveyQuestion {
  id: string;
  question_fr: string;
  question_en: string;
  question_pt: string;
  question_es: string;
  theme: string | null;
  survey_year: number | null;
  created_at: string;
}

const AdminQuestions = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<SurveyQuestion | null>(null);
  const [filterYear, setFilterYear] = useState<string>("all");
  const [filterTheme, setFilterTheme] = useState<string>("all");
  const [formData, setFormData] = useState({
    question_fr: "",
    question_en: "",
    question_pt: "",
    question_es: "",
    theme: "",
    survey_year: "",
  });

  const { data: questions = [], isLoading } = useQuery({
    queryKey: ["survey-questions"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("survey_questions")
        .select("*")
        .order("survey_year", { ascending: false })
        .order("theme")
        .order("question_fr");
      if (error) throw error;
      return data as SurveyQuestion[];
    },
  });

  const years = useMemo(() => {
    const set = new Set<number>();
    questions.forEach((q) => q.survey_year && set.add(q.survey_year));
    return Array.from(set).sort((a, b) => b - a);
  }, [questions]);

  const themes = useMemo(() => {
    const set = new Set<string>();
    questions.forEach((q) => q.theme && set.add(q.theme));
    return Array.from(set).sort();
  }, [questions]);

  const filtered = useMemo(() => {
    return questions.filter((q) => {
      if (filterYear !== "all" && String(q.survey_year) !== filterYear) return false;
      if (filterTheme !== "all" && q.theme !== filterTheme) return false;
      return true;
    });
  }, [questions, filterYear, filterTheme]);

  const openEdit = (q: SurveyQuestion) => {
    setEditing(q);
    setFormData({
      question_fr: q.question_fr,
      question_en: q.question_en,
      question_pt: q.question_pt,
      question_es: q.question_es,
      theme: q.theme ?? "",
      survey_year: q.survey_year ? String(q.survey_year) : "",
    });
  };

  const handleSave = async () => {
    if (!editing) return;
    const { error } = await (supabase as any)
      .from("survey_questions")
      .update({
        question_fr: formData.question_fr,
        question_en: formData.question_en,
        question_pt: formData.question_pt,
        question_es: formData.question_es,
        theme: formData.theme || null,
        survey_year: formData.survey_year ? Number(formData.survey_year) : null,
      })
      .eq("id", editing.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(t("adminQuestions.saved"));
    setEditing(null);
    queryClient.invalidateQueries({ queryKey: ["survey-questions"] });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(210,80%,15%)] via-[hsl(210,70%,20%)] to-[hsl(215,85%,10%)] p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <h1 className="text-2xl font-bold text-white">{t("adminQuestions.title")}</h1>

        <Card className="border-[hsla(200,80%,60%,0.15)] bg-[hsla(210,70%,15%,0.6)] backdrop-blur-md">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <CardTitle className="text-white">
                {t("adminQuestions.subtitle", { count: filtered.length })}
              </CardTitle>
              <div className="flex items-center gap-3">
                <Filter className="h-4 w-4 text-[hsl(200,40%,60%)]" />
                <Select value={filterYear} onValueChange={setFilterYear}>
                  <SelectTrigger className="w-[130px] border-[hsla(200,80%,60%,0.3)] bg-[hsla(210,70%,15%,0.5)] text-white">
                    <SelectValue placeholder={t("adminQuestions.year")} />
                  </SelectTrigger>
                  <SelectContent className="border-[hsla(200,80%,60%,0.3)] bg-[hsl(215,85%,12%)]">
                    <SelectItem value="all" className="text-white">{t("filters.all")}</SelectItem>
                    {years.map((y) => (
                      <SelectItem key={y} value={String(y)} className="text-white">{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterTheme} onValueChange={setFilterTheme}>
                  <SelectTrigger className="w-[220px] border-[hsla(200,80%,60%,0.3)] bg-[hsla(210,70%,15%,0.5)] text-white">
                    <SelectValue placeholder={t("adminQuestions.theme")} />
                  </SelectTrigger>
                  <SelectContent className="border-[hsla(200,80%,60%,0.3)] bg-[hsl(215,85%,12%)]">
                    <SelectItem value="all" className="text-white">{t("filters.all")}</SelectItem>
                    {themes.map((th) => (
                      <SelectItem key={th} value={th} className="text-white">{th}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-[hsl(200,60%,70%)]">{t("adminQuestions.loading")}</p>
            ) : (
              <div className="overflow-auto max-h-[calc(100vh-280px)] rounded-md border border-[hsla(200,80%,60%,0.1)]">
                <Table>
                  <TableHeader className="sticky top-0 bg-[hsl(215,85%,12%)] z-10">
                    <TableRow className="border-[hsla(200,80%,60%,0.1)]">
                      <TableHead className="text-[hsl(200,60%,70%)] min-w-[60px]">{t("adminQuestions.year")}</TableHead>
                      <TableHead className="text-[hsl(200,60%,70%)] min-w-[140px]">{t("adminQuestions.theme")}</TableHead>
                      <TableHead className="text-[hsl(200,60%,70%)] min-w-[280px]">{t("adminQuestions.questionFr")}</TableHead>
                      <TableHead className="text-[hsl(200,60%,70%)] min-w-[280px]">{t("adminQuestions.questionEn")}</TableHead>
                      <TableHead className="text-[hsl(200,60%,70%)] min-w-[280px]">{t("adminQuestions.questionPt")}</TableHead>
                      <TableHead className="text-[hsl(200,60%,70%)] min-w-[280px]">{t("adminQuestions.questionEs")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((q) => (
                      <TableRow
                        key={q.id}
                        className="border-[hsla(200,80%,60%,0.1)] hover:bg-[hsla(200,80%,50%,0.1)] cursor-pointer transition-colors"
                        onClick={() => openEdit(q)}
                      >
                        <TableCell className="text-white font-medium">{q.survey_year ?? "-"}</TableCell>
                        <TableCell className="text-[hsl(200,60%,70%)] text-xs font-medium">{q.theme ?? "-"}</TableCell>
                        <TableCell className="text-white text-xs">{q.question_fr}</TableCell>
                        <TableCell className="text-[hsl(200,60%,70%)] text-xs">
                          {q.question_en || <span className="text-[hsl(0,60%,60%)] italic">{t("adminQuestions.noTranslation")}</span>}
                        </TableCell>
                        <TableCell className="text-[hsl(200,60%,70%)] text-xs">
                          {q.question_pt || <span className="text-[hsl(0,60%,60%)] italic">{t("adminQuestions.noTranslation")}</span>}
                        </TableCell>
                        <TableCell className="text-[hsl(200,60%,70%)] text-xs">
                          {q.question_es || <span className="text-[hsl(0,60%,60%)] italic">{t("adminQuestions.noTranslation")}</span>}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl border-[hsla(200,80%,60%,0.2)] bg-[hsl(215,85%,12%)] text-white">
          <DialogHeader>
            <DialogTitle className="text-white">{t("adminQuestions.editQuestion")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-[hsl(200,60%,70%)]">{t("adminQuestions.theme")}</Label>
                <div className="rounded-md border border-[hsla(200,80%,60%,0.2)] bg-[hsla(210,70%,15%,0.3)] px-3 py-2 text-sm text-[hsl(200,40%,60%)]">
                  {formData.theme || "-"}
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-[hsl(200,60%,70%)]">{t("adminQuestions.year")}</Label>
                <div className="rounded-md border border-[hsla(200,80%,60%,0.2)] bg-[hsla(210,70%,15%,0.3)] px-3 py-2 text-sm text-[hsl(200,40%,60%)]">
                  {formData.survey_year || "-"}
                </div>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-[hsl(200,60%,70%)]">{t("adminQuestions.questionFr")} (Original)</Label>
              <div className="rounded-md border border-[hsla(200,80%,60%,0.2)] bg-[hsla(210,70%,15%,0.3)] px-3 py-2 text-sm text-white min-h-[60px]">
                {formData.question_fr}
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-[hsl(200,60%,70%)]">{t("adminQuestions.questionEn")}</Label>
              <Textarea
                value={formData.question_en}
                onChange={(e) => setFormData({ ...formData, question_en: e.target.value })}
                className="border-[hsla(200,80%,60%,0.3)] bg-[hsla(210,70%,15%,0.5)] text-white min-h-[80px]"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[hsl(200,60%,70%)]">{t("adminQuestions.questionPt")}</Label>
              <Textarea
                value={formData.question_pt}
                onChange={(e) => setFormData({ ...formData, question_pt: e.target.value })}
                className="border-[hsla(200,80%,60%,0.3)] bg-[hsla(210,70%,15%,0.5)] text-white min-h-[80px]"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[hsl(200,60%,70%)]">{t("adminQuestions.questionEs")}</Label>
              <Textarea
                value={formData.question_es}
                onChange={(e) => setFormData({ ...formData, question_es: e.target.value })}
                className="border-[hsla(200,80%,60%,0.3)] bg-[hsla(210,70%,15%,0.5)] text-white min-h-[80px]"
              />
            </div>
            <Button onClick={handleSave} className="w-full bg-[hsl(200,80%,45%)] hover:bg-[hsl(200,80%,55%)]">
              {t("adminQuestions.save")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminQuestions;
