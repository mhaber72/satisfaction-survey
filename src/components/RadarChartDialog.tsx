import { useState, useMemo, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Radar as RadarIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

interface RadarChartDialogProps {
  records: any[] | undefined;
}

const THEME_COLORS: Record<string, string> = {
  "ACCOMPAGNEMENT CLIENT": "#8B0000",
  "EXCELLENCE OPÉRATIONNELLE": "#4A4A4A",
  "EXPERTISE INFORMATIQUE": "#2563EB",
  "GESTION DE PROJETS ET INNOVATION": "#7C3AED",
  "SOLUTIONS DURABLES": "#22C55E",
  "RESSOURCES HUMAINES": "#F59E0B",
  "PARTENAIRE": "#F97316",
};

const QUESTION_SHORT_LABELS: Record<string, string> = {
  "direction générale": "Relation with Top Mngt",
  "Contract Manager": "Relation with ID Mngt",
  "équipes opérationnelles": "Relation Ops",
  "projets et ambitions": "Strategy understanding",
  "démarrages de nouvelles": "Start-up",
  "amélioration continue": "Continuous improvement",
  "prestation d'ID Logistics": "Ops. Performance & Quick answers",
  "qualité de service d'ID Logistics par vos propres": "Operationnal quality",
  "optimiser votre transport": "Truck loading optimization",
  "outils informatiques à disposition": "Use of IT tools",
  "faire évoluer nos outils": "IT evolution",
  "solutions applicatives": "IT development",
  "projets d'innovation": "Innovation",
  "nouvelles technologies": "New technologies / process",
  "démarche innovation par rapport": "Innovation VS Competition",
  "solutions, des réalisations": "Share other solutions",
  "par rapport à vos autres prestataires": "ID vs Competition",
  "réponses suite à l'enquête": "Survey follow-up",
  "politique de rémunération": "Wages policy",
  "climat social": "Social atmosphere",
  "diversité, l'inclusion": "Diversity, inclusion and disability",
  "gestion RH": "HR management",
  "hygiène et la propreté": "Hygiene",
  "normes de sécurité": "Security standards",
  "intégrité de vos marchandises": "Transport conditions",
  "objectifs RSE": "CSR Policy",
};

const THEME_ORDER = [
  "ACCOMPAGNEMENT CLIENT",
  "EXCELLENCE OPÉRATIONNELLE",
  "EXPERTISE INFORMATIQUE",
  "GESTION DE PROJETS ET INNOVATION",
  "PARTENAIRE",
  "RESSOURCES HUMAINES",
  "SOLUTIONS DURABLES",
];

function getShortLabel(question: string): string {
  for (const [keyword, label] of Object.entries(QUESTION_SHORT_LABELS)) {
    if (question.includes(keyword)) return label;
  }
  return question.length > 25 ? question.slice(0, 25) + "…" : question;
}

function getThemeColor(theme: string): string {
  return THEME_COLORS[theme.toUpperCase()] || "#94A3B8";
}

interface QuestionData {
  question: string;
  shortLabel: string;
  avg: number;
  prevAvg: number | null;
  theme: string;
  color: string;
  count: number;
}

function computeAvgByQuestion(records: any[]): Map<string, { avg: number; theme: string; count: number }> {
  const filtered = records.filter(
    (r) =>
      r.score != null &&
      r.score !== 0 &&
      r.answered === 1 &&
      r.theme?.toUpperCase() !== "CORPORATE PERCEPTION" &&
      r.question
  );
  const byQ = new Map<string, { scores: number[]; theme: string }>();
  filtered.forEach((r) => {
    const q = r.question!;
    if (!byQ.has(q)) byQ.set(q, { scores: [], theme: r.theme || "" });
    byQ.get(q)!.scores.push(Number(r.score));
  });
  const result = new Map<string, { avg: number; theme: string; count: number }>();
  byQ.forEach(({ scores, theme }, q) => {
    result.set(q, {
      avg: parseFloat((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2)),
      theme,
      count: scores.length,
    });
  });
  return result;
}

const RadarChartDialog = ({ records }: RadarChartDialogProps) => {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();

  const availableYears = useMemo(() => {
    if (!records?.length) return [];
    const years = new Set(records.filter((r) => r.survey_year != null).map((r) => r.survey_year as number));
    return Array.from(years).sort((a, b) => b - a);
  }, [records]);

  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  // Set default year when data loads
  useMemo(() => {
    if (availableYears.length > 0 && selectedYear === null) {
      setSelectedYear(availableYears[0]);
    }
  }, [availableYears]);

  const radarData: QuestionData[] = useMemo(() => {
    if (!records?.length || selectedYear === null) return [];

    const currentYearRecords = records.filter((r) => r.survey_year === selectedYear);
    const prevYearRecords = records.filter((r) => r.survey_year === selectedYear - 1);

    const currentAvg = computeAvgByQuestion(currentYearRecords);
    const prevAvg = prevYearRecords.length > 0 ? computeAvgByQuestion(prevYearRecords) : null;

    return Array.from(currentAvg.entries())
      .map(([question, { avg, theme, count }]) => ({
        question,
        shortLabel: getShortLabel(question),
        avg,
        prevAvg: prevAvg?.get(question)?.avg ?? null,
        theme,
        color: getThemeColor(theme),
        count,
      }))
      .sort((a, b) => {
        const ai = THEME_ORDER.indexOf(a.theme.toUpperCase());
        const bi = THEME_ORDER.indexOf(b.theme.toUpperCase());
        if (ai !== bi) return ai - bi;
        return a.question.localeCompare(b.question);
      });
  }, [records, selectedYear]);

  const canvasRef = useCallback(
    (canvas: HTMLCanvasElement | null) => {
      if (!canvas || radarData.length === 0) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const size = 1200;
      canvas.width = size * dpr;
      canvas.height = size * dpr;
      canvas.style.width = `${size}px`;
      canvas.style.height = `${size}px`;
      ctx.scale(dpr, dpr);

      const cx = size / 2;
      const cy = size / 2;
      const maxR = 420;
      const n = radarData.length;
      const maxVal = 5;

      ctx.clearRect(0, 0, size, size);

      // Grid circles
      for (let step = 1; step <= 9; step++) {
        const r = (step / 9) * maxR;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = "#d1d5db";
        ctx.lineWidth = 0.5;
        ctx.stroke();
        if (step % 2 === 0) {
          ctx.fillStyle = "#9ca3af";
          ctx.font = "11px sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(((step / 9) * maxVal).toFixed(2), cx, cy - r + 12);
        }
      }

      // Axis lines
      for (let i = 0; i < n; i++) {
        const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + maxR * Math.cos(angle), cy + maxR * Math.sin(angle));
        ctx.strokeStyle = "#e5e7eb";
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }

      // Filled theme sectors — filled to CURRENT YEAR avg per question
      const themeGroups: { startIdx: number; endIdx: number; color: string }[] = [];
      let currentTheme = radarData[0].theme;
      let startIdx = 0;
      for (let i = 1; i <= n; i++) {
        if (i === n || radarData[i].theme !== currentTheme) {
          themeGroups.push({ startIdx, endIdx: i - 1, color: radarData[startIdx].color });
          if (i < n) { currentTheme = radarData[i].theme; startIdx = i; }
        }
      }

      // Draw colored filled areas based on current year avg
      themeGroups.forEach(({ startIdx: si, endIdx: ei, color }) => {
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        for (let i = si; i <= ei; i++) {
          const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
          const r = (radarData[i].avg / maxVal) * maxR;
          ctx.lineTo(cx + r * Math.cos(angle), cy + r * Math.sin(angle));
        }
        // Last edge
        const lastAngle = (Math.PI * 2 * (ei + 1)) / n - Math.PI / 2;
        const lastR = (radarData[ei].avg / maxVal) * maxR;
        ctx.lineTo(cx + lastR * Math.cos(lastAngle), cy + lastR * Math.sin(lastAngle));
        ctx.lineTo(cx, cy);
        ctx.closePath();
        ctx.fillStyle = color + "88";
        ctx.fill();
      });

      // Red line — PREVIOUS YEAR avg
      const hasPrev = radarData.some((d) => d.prevAvg !== null);
      if (hasPrev) {
        ctx.beginPath();
        radarData.forEach((d, i) => {
          if (d.prevAvg === null) return;
          const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
          const r = (d.prevAvg / maxVal) * maxR;
          const x = cx + r * Math.cos(angle);
          const y = cy + r * Math.sin(angle);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.closePath();
        ctx.strokeStyle = "#DC2626";
        ctx.lineWidth = 2;
        ctx.stroke();

        // Red dots
        radarData.forEach((d, i) => {
          if (d.prevAvg === null) return;
          const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
          const r = (d.prevAvg / maxVal) * maxR;
          ctx.beginPath();
          ctx.arc(cx + r * Math.cos(angle), cy + r * Math.sin(angle), 4, 0, Math.PI * 2);
          ctx.fillStyle = "#DC2626";
          ctx.fill();
          ctx.strokeStyle = "#fff";
          ctx.lineWidth = 1;
          ctx.stroke();
        });
      }

      // Labels with current avg (and prev avg if available)
      radarData.forEach((d, i) => {
        const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
        const labelR = maxR + 18;
        const x = cx + labelR * Math.cos(angle);
        const y = cy + labelR * Math.sin(angle);

        const cur = d.avg.toFixed(2).replace(".", ",");
        const prev = d.prevAvg !== null ? d.prevAvg.toFixed(2).replace(".", ",") : "—";
        const label = `${d.shortLabel} (${cur} / ${prev})`;

        ctx.save();
        ctx.font = "12px sans-serif";
        ctx.fillStyle = "#374151";
        const angleDeg = ((angle * 180) / Math.PI + 360) % 360;
        if (angleDeg > 80 && angleDeg < 100) {
          ctx.textAlign = "center"; ctx.textBaseline = "top";
        } else if (angleDeg > 260 && angleDeg < 280) {
          ctx.textAlign = "center"; ctx.textBaseline = "bottom";
        } else if (angleDeg >= 100 && angleDeg <= 260) {
          ctx.textAlign = "right"; ctx.textBaseline = "middle";
        } else {
          ctx.textAlign = "left"; ctx.textBaseline = "middle";
        }
        ctx.fillText(label, x, y);
        ctx.restore();
      });
    },
    [radarData]
  );

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
      <DialogContent className="max-w-[100vw] w-[100vw] h-[100vh] max-h-[100vh] overflow-auto p-6 rounded-none">
        <DialogHeader>
          <div className="flex items-center justify-between w-full gap-4">
            <DialogTitle>{t("dashboard.avgByQuestion", "Average Score by Question")}</DialogTitle>
            {availableYears.length > 0 && (
              <Select
                value={String(selectedYear)}
                onValueChange={(v) => setSelectedYear(Number(v))}
              >
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableYears.map((y) => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </DialogHeader>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 mb-2">
          {Object.entries(THEME_COLORS).map(([theme, color]) => (
            <div key={theme} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: color + "99" }} />
              <span className="text-xs text-muted-foreground capitalize">
                {theme.charAt(0) + theme.slice(1).toLowerCase()}
              </span>
            </div>
          ))}
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-0.5 bg-red-600 rounded" />
            <span className="text-xs text-muted-foreground">
              {selectedYear ? `${selectedYear - 1}` : "Previous year"}
            </span>
          </div>
        </div>

        {radarData.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No data available</p>
        ) : (
          <div className="flex justify-center">
            <canvas ref={canvasRef} style={{ width: 900, height: 900 }} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default RadarChartDialog;
