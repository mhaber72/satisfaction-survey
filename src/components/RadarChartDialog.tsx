import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from "recharts";
import { Radar as RadarIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

interface RadarChartDialogProps {
  records: any[] | undefined;
}

const truncate = (str: string, max: number) => {
  if (!str) return "";
  return str.length > max ? str.slice(0, max) + "…" : str;
};

const RadarChartDialog = ({ records }: RadarChartDialogProps) => {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();

  const radarData = useMemo(() => {
    if (!records?.length) return [];

    const filtered = records.filter(
      (r) =>
        r.score != null &&
        r.score !== 0 &&
        r.answered === 1 &&
        r.theme?.toUpperCase() !== "CORPORATE PERCEPTION" &&
        r.question
    );

    const byQuestion = new Map<string, number[]>();
    filtered.forEach((r) => {
      const q = r.question!;
      if (!byQuestion.has(q)) byQuestion.set(q, []);
      byQuestion.get(q)!.push(Number(r.score));
    });

    return Array.from(byQuestion.entries())
      .map(([question, scores]) => ({
        question,
        shortLabel: truncate(question, 30),
        avg: parseFloat((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2)),
        count: scores.length,
      }))
      .sort((a, b) => a.question.localeCompare(b.question));
  }, [records]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const data = payload[0].payload;
    return (
      <div className="rounded-lg border bg-background p-3 shadow-md max-w-xs">
        <p className="text-xs text-muted-foreground mb-1">{data.question}</p>
        <p className="text-sm font-bold text-foreground">
          Avg: {data.avg} ({data.count} responses)
        </p>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          className="inline-flex items-center justify-center rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          title={t("dashboard.radarChart", "Radar Chart")}
        >
          <RadarIcon className="h-4 w-4" />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>{t("dashboard.avgByQuestion", "Average Score by Question")}</DialogTitle>
        </DialogHeader>
        {radarData.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No data available</p>
        ) : (
          <div className="w-full h-[500px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis
                  dataKey="shortLabel"
                  tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 5]}
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Radar
                  name="Avg Score"
                  dataKey="avg"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.3}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default RadarChartDialog;
