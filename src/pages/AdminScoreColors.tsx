import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { Save } from "lucide-react";

interface ScoreColor {
  id: string;
  score: number;
  color: string;
}

const AdminScoreColors = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [colors, setColors] = useState<Record<string, string>>({});

  const { data: scoreColors = [], isLoading } = useQuery<ScoreColor[]>({
    queryKey: ["score-colors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("score_colors")
        .select("*")
        .order("score", { ascending: true });
      if (error) throw error;
      return data as ScoreColor[];
    },
  });

  useEffect(() => {
    const map: Record<string, string> = {};
    scoreColors.forEach((sc) => {
      map[sc.id] = sc.color;
    });
    setColors(map);
  }, [scoreColors]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      for (const sc of scoreColors) {
        const newColor = colors[sc.id];
        if (newColor && newColor !== sc.color) {
          const { error } = await supabase
            .from("score_colors")
            .update({ color: newColor, updated_at: new Date().toISOString() })
            .eq("id", sc.id);
          if (error) throw error;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["score-colors"] });
      toast.success(t("adminScoreColors.saved"));
    },
    onError: () => {
      toast.error(t("adminScoreColors.saveError"));
    },
  });

  if (isLoading) return <p className="p-6 text-white/60">{t("adminScoreColors.loading")}</p>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(210,80%,15%)] via-[hsl(210,70%,25%)] to-[hsl(200,60%,30%)]">
      <div className="mx-auto max-w-2xl px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">{t("adminScoreColors.title")}</h1>
          <p className="text-white/60">{t("adminScoreColors.subtitle")}</p>
        </div>

        <Card className="border-white/10 bg-white/5 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white">{t("adminScoreColors.colorsConfig")}</CardTitle>
            <Button
              size="sm"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              {t("adminScoreColors.save")}
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {scoreColors.map((sc) => (
                <div key={sc.id} className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-3">
                  <span className="text-lg font-bold text-white min-w-[3rem] text-center">
                    {Number(sc.score) % 1 === 0 ? sc.score : Number(sc.score).toFixed(1)}
                  </span>
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="color"
                      value={colors[sc.id] || sc.color}
                      onChange={(e) => setColors((prev) => ({ ...prev, [sc.id]: e.target.value }))}
                      className="h-10 w-10 cursor-pointer rounded border border-white/20 bg-transparent"
                    />
                    <Input
                      value={colors[sc.id] || sc.color}
                      onChange={(e) => setColors((prev) => ({ ...prev, [sc.id]: e.target.value }))}
                      className="font-mono text-sm bg-white/5 border-white/10 text-white"
                    />
                  </div>
                  <span
                    className="w-6 h-6 rounded-full border border-white/20 flex-shrink-0"
                    style={{ backgroundColor: colors[sc.id] || sc.color }}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminScoreColors;
