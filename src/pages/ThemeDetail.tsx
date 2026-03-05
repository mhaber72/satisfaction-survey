import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, BarChart3, Users, TrendingUp, FileText } from "lucide-react";
import { useTranslation } from "react-i18next";
import DataFilters from "@/components/DataFilters";
import RowDetailDialog from "@/components/RowDetailDialog";
import { useDataFilters } from "@/hooks/useDataFilters";
import { useTableSort } from "@/hooks/useTableSort";
import SortableTh from "@/components/SortableTh";
import CorporatePerceptionCharts from "@/components/CorporatePerceptionCharts";
import { ScoreDot } from "@/components/ScoreDot";
import { useScoreColors } from "@/hooks/useScoreColors";
import { useState } from "react";

const ThemeDetail = () => {
  const { theme } = useParams<{ theme: string }>();
  const navigate = useNavigate();
  const decodedTheme = decodeURIComponent(theme || "");
  const isCorporatePerception = decodedTheme.toUpperCase() === "CORPORATE PERCEPTION";
  const { t } = useTranslation();
  const [selectedRow, setSelectedRow] = useState<any>(null);
  const { getColor } = useScoreColors();

  const { data: records, isLoading } = useQuery({
    queryKey: ["pesquisa-theme", decodedTheme],
    queryFn: async () => {
      let allData: any[] = [];
      let from = 0;
      const pageSize = 1000;
      while (true) {
        const { data, error } = await supabase
          .from("pesquisa_satisfacao")
          .select("*")
          .eq("theme", decodedTheme)
          .eq("answered", 1)
          .order("id", { ascending: true })
          .range(from, from + pageSize - 1);
        if (error) throw error;
        if (!data || data.length === 0) break;
        allData = allData.concat(data);
        if (data.length < pageSize) break;
        from += pageSize;
      }
      return allData;
    },
    enabled: !!decodedTheme,
  });

  const { data: pesquisaIdsWithPlans } = useQuery({
    queryKey: ["pesquisa_ids_with_plans"],
    queryFn: async () => {
      const { data, error } = await supabase.from("action_plans").select("pesquisa_id");
      if (error) throw error;
      return new Set(data?.map((d) => d.pesquisa_id) ?? []);
    },
  });

  const hasActionPlan = (id: number) => pesquisaIdsWithPlans?.has(id) ?? false;

  const { filters, onFilterChange, filtered } = useDataFilters(records);
  const { sorted, sort, toggle } = useTableSort(filtered);

  const total = filtered?.length ?? 0;
  const avgScore = (() => {
    if (!filtered?.length) return "—";
    const valid = filtered.filter((r) => r.score != null && r.score !== 0 && r.answered === 1);
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
  const uniqueQuestions = new Set(filtered?.map((r) => r.question)).size;

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
    <div className="min-h-screen bg-gradient-to-br from-[hsl(210,80%,15%)] via-[hsl(210,70%,25%)] to-[hsl(200,60%,30%)]">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8 flex items-center gap-4">
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" onClick={() => navigate("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-white">{decodedTheme}</h1>
            <p className="text-white/60">{t("themeDetail.filteredByTheme")}</p>
          </div>
        </div>

        {isCorporatePerception ? (
          <CorporatePerceptionCharts records={records} isLoading={isLoading} />
        ) : (
          <>
            <div className="mb-6">
              <DataFilters records={records} filters={filters} onFilterChange={onFilterChange} />
            </div>

            <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: t("themeDetail.records"), value: total, icon: FileText },
                { label: t("themeDetail.avgScore"), value: avgScore, icon: BarChart3 },
                { label: t("themeDetail.clients"), value: uniqueClients, icon: Users },
                { label: t("themeDetail.questions"), value: uniqueQuestions, icon: TrendingUp },
              ].map((kpi) => (
                <Card key={kpi.label} className="border-white/10 bg-white/5 backdrop-blur-md">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-white/60">{kpi.label}</CardTitle>
                    <kpi.icon className="h-4 w-4 text-white/40" />
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-white">{kpi.value}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="border-white/10 bg-white/5 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-white">{t("themeDetail.data")}</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {isLoading ? (
                  <p className="text-white/60 p-6">{t("themeDetail.loading")}</p>
                ) : total === 0 ? (
                  <p className="py-12 text-center text-white/60">{t("themeDetail.noData")}</p>
                ) : (
                  <div className="relative border-t border-white/10 rounded-b-md" style={{ height: "380px" }}>
                    <div className="absolute inset-0 overflow-auto" style={{ scrollbarWidth: "auto", scrollbarColor: "#888 rgba(255,255,255,0.1)" }}>
                      <table className="w-max min-w-full caption-bottom text-sm">
                        <thead className="sticky top-0 z-10 bg-[hsl(210,70%,20%)] [&_tr]:border-b">
                          <tr className="border-b border-white/10 transition-colors">
                            {columns.map((col) => (
                              <SortableTh
                                key={col.key}
                                label={col.label}
                                column={col.key}
                                currentColumn={sort.column}
                                direction={sort.direction}
                                onToggle={toggle}
                                className="text-white/60"
                              />
                            ))}
                          </tr>
                        </thead>
                        <tbody className="[&_tr:last-child]:border-0">
                          {sorted?.map((r) => (
                            <tr key={r.id} className="border-b border-white/5 transition-colors hover:bg-white/5 cursor-pointer" onClick={() => setSelectedRow(r)}>
                              <td className="p-4 align-middle whitespace-nowrap text-white/80"><span className="flex items-center"><ScoreDot color={getColor(r.score)} />{r.client_name}</span></td>
                              <td className="p-4 align-middle whitespace-nowrap text-white/80">{r.firstname} {r.lastname}</td>
                              <td className="p-4 align-middle whitespace-nowrap text-white/80">{r.theme}</td>
                              <td className="p-4 align-middle whitespace-nowrap text-white/80">{r.theme_comment}</td>
                              <td className="p-4 align-middle whitespace-nowrap text-white/80">{r.question}</td>
                              <td className="p-4 align-middle whitespace-nowrap text-white/80">{r.applicability}</td>
                              <td className="p-4 align-middle whitespace-nowrap text-white/80">{r.importance}</td>
                              <td className="p-4 align-middle font-medium whitespace-nowrap text-white">{r.score}</td>
                              <td className="p-4 align-middle whitespace-nowrap text-white/80">{r.question_comment}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
      <RowDetailDialog row={selectedRow} open={!!selectedRow} onOpenChange={(open) => !open && setSelectedRow(null)} />
    </div>
  );
};

export default ThemeDetail;
