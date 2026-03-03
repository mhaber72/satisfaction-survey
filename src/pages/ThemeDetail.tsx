import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, BarChart3, Users, TrendingUp, FileText } from "lucide-react";

const ThemeDetail = () => {
  const { theme } = useParams<{ theme: string }>();
  const navigate = useNavigate();
  const decodedTheme = decodeURIComponent(theme || "");

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

  const total = records?.length ?? 0;
  const avgScore = records?.length
    ? (records.reduce((s, r) => s + (Number(r.score) || 0), 0) / records.filter(r => r.score != null).length).toFixed(2)
    : "—";
  const uniqueClients = new Set(records?.map((r) => r.client_name)).size;
  const uniqueQuestions = new Set(records?.map((r) => r.question)).size;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(210,80%,15%)] via-[hsl(210,70%,25%)] to-[hsl(200,60%,30%)]">
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-white">{decodedTheme}</h1>
            <p className="text-white/60">Datos filtrados por tema</p>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Registros", value: total, icon: FileText },
            { label: "Score Medio", value: avgScore, icon: BarChart3 },
            { label: "Clientes", value: uniqueClients, icon: Users },
            { label: "Preguntas", value: uniqueQuestions, icon: TrendingUp },
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

        {/* Data Table */}
        <Card className="border-white/10 bg-white/5 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-white">Datos</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-white/60">Cargando...</p>
            ) : total === 0 ? (
              <p className="py-12 text-center text-white/60">Sin datos para este tema.</p>
            ) : (
              <div className="max-h-[500px] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10 hover:bg-white/5">
                      <TableHead className="text-white/60">País</TableHead>
                      <TableHead className="text-white/60">Cliente</TableHead>
                      <TableHead className="text-white/60">Nombre</TableHead>
                      <TableHead className="text-white/60">Tipo</TableHead>
                      <TableHead className="text-white/60">Score</TableHead>
                      <TableHead className="text-white/60">Importancia</TableHead>
                      <TableHead className="text-white/60">Pregunta</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records?.map((r) => (
                      <TableRow key={r.id} className="border-white/5 hover:bg-white/5">
                        <TableCell className="text-white/80">{r.country}</TableCell>
                        <TableCell className="max-w-[150px] truncate text-white/80">{r.client_name}</TableCell>
                        <TableCell className="text-white/80">{r.firstname} {r.lastname}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="bg-white/10 text-white/80">{r.type}</Badge>
                        </TableCell>
                        <TableCell className="font-medium text-white">{r.score}</TableCell>
                        <TableCell className="text-white/80">{r.importance}</TableCell>
                        <TableCell className="max-w-[250px] truncate text-white/80">{r.question}</TableCell>
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

export default ThemeDetail;
