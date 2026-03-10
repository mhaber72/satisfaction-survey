import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Pencil, Search } from "lucide-react";

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
  const [search, setSearch] = useState("");
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

  const filtered = questions.filter((q) => {
    const s = search.toLowerCase();
    return (
      !s ||
      q.question_fr.toLowerCase().includes(s) ||
      q.question_en.toLowerCase().includes(s) ||
      q.question_pt.toLowerCase().includes(s) ||
      q.question_es.toLowerCase().includes(s) ||
      (q.theme ?? "").toLowerCase().includes(s)
    );
  });

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
            <div className="flex items-center justify-between">
              <CardTitle className="text-white">
                {t("adminQuestions.subtitle", { count: filtered.length })}
              </CardTitle>
              <div className="relative w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(200,40%,60%)]" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t("adminQuestions.searchPlaceholder")}
                  className="pl-9 border-[hsla(200,80%,60%,0.3)] bg-[hsla(210,70%,15%,0.5)] text-white placeholder:text-[hsl(200,40%,60%)]"
                />
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
                      <TableHead className="text-[hsl(200,60%,70%)] min-w-[120px]">{t("adminQuestions.theme")}</TableHead>
                      <TableHead className="text-[hsl(200,60%,70%)] min-w-[250px]">{t("adminQuestions.questionFr")}</TableHead>
                      <TableHead className="text-[hsl(200,60%,70%)] min-w-[250px]">{t("adminQuestions.questionEn")}</TableHead>
                      <TableHead className="text-[hsl(200,60%,70%)] min-w-[250px]">{t("adminQuestions.questionPt")}</TableHead>
                      <TableHead className="text-[hsl(200,60%,70%)] min-w-[250px]">{t("adminQuestions.questionEs")}</TableHead>
                      <TableHead className="text-[hsl(200,60%,70%)] w-16">{t("adminQuestions.actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((q) => (
                      <TableRow key={q.id} className="border-[hsla(200,80%,60%,0.1)] hover:bg-[hsla(200,80%,50%,0.05)]">
                        <TableCell className="text-white">{q.survey_year ?? "-"}</TableCell>
                        <TableCell className="text-[hsl(200,60%,70%)]">{q.theme ?? "-"}</TableCell>
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
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => openEdit(q)} className="text-[hsl(200,60%,70%)] hover:text-white">
                            <Pencil className="h-4 w-4" />
                          </Button>
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
                <Input
                  value={formData.theme}
                  onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
                  className="border-[hsla(200,80%,60%,0.3)] bg-[hsla(210,70%,15%,0.5)] text-white"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[hsl(200,60%,70%)]">{t("adminQuestions.year")}</Label>
                <Input
                  value={formData.survey_year}
                  onChange={(e) => setFormData({ ...formData, survey_year: e.target.value })}
                  className="border-[hsla(200,80%,60%,0.3)] bg-[hsla(210,70%,15%,0.5)] text-white"
                  type="number"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-[hsl(200,60%,70%)]">{t("adminQuestions.questionFr")} (Original)</Label>
              <Textarea
                value={formData.question_fr}
                onChange={(e) => setFormData({ ...formData, question_fr: e.target.value })}
                className="border-[hsla(200,80%,60%,0.3)] bg-[hsla(210,70%,15%,0.5)] text-white min-h-[80px]"
              />
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
