import { useState, useMemo, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Radar as RadarIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

interface RadarChartDialogProps {
  records: any[] | undefined;
}

// Theme colors matching the reference image
const THEME_COLORS: Record<string, string> = {
  "ACCOMPAGNEMENT CLIENT": "#8B0000",       // dark red
  "EXCELLENCE OPÉRATIONNELLE": "#4A4A4A",   // dark gray
  "EXPERTISE INFORMATIQUE": "#2563EB",      // blue
  "GESTION DE PROJETS ET INNOVATION": "#7C3AED", // purple
  "SOLUTIONS DURABLES": "#22C55E",          // green
  "RESSOURCES HUMAINES": "#F59E0B",         // amber
  "PARTENAIRE": "#F97316",                  // orange
};

// Short labels for questions (mapped by keywords)
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
  theme: string;
  color: string;
  count: number;
}

const RadarChartDialog = ({ records }: RadarChartDialogProps) => {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();

  const radarData: QuestionData[] = useMemo(() => {
    if (!records?.length) return [];

    const filtered = records.filter(
      (r) =>
        r.score != null &&
        r.score !== 0 &&
        r.answered === 1 &&
        r.theme?.toUpperCase() !== "CORPORATE PERCEPTION" &&
        r.question
    );

    const byQuestion = new Map<string, { scores: number[]; theme: string }>();
    filtered.forEach((r) => {
      const q = r.question!;
      if (!byQuestion.has(q)) byQuestion.set(q, { scores: [], theme: r.theme || "" });
      byQuestion.get(q)!.scores.push(Number(r.score));
    });

    // Group by theme, then sort within each theme
    const themeOrder = [
      "ACCOMPAGNEMENT CLIENT",
      "EXCELLENCE OPÉRATIONNELLE",
      "EXPERTISE INFORMATIQUE",
      "GESTION DE PROJETS ET INNOVATION",
      "PARTENAIRE",
      "RESSOURCES HUMAINES",
      "SOLUTIONS DURABLES",
    ];

    return Array.from(byQuestion.entries())
      .map(([question, { scores, theme }]) => ({
        question,
        shortLabel: getShortLabel(question),
        avg: parseFloat((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2)),
        theme,
        color: getThemeColor(theme),
        count: scores.length,
      }))
      .sort((a, b) => {
        const ai = themeOrder.indexOf(a.theme.toUpperCase());
        const bi = themeOrder.indexOf(b.theme.toUpperCase());
        if (ai !== bi) return ai - bi;
        return a.question.localeCompare(b.question);
      });
  }, [records]);

  const canvasRef = useCallback(
    (canvas: HTMLCanvasElement | null) => {
      if (!canvas || radarData.length === 0) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const size = 900;
      canvas.width = size * dpr;
      canvas.height = size * dpr;
      canvas.style.width = `${size}px`;
      canvas.style.height = `${size}px`;
      ctx.scale(dpr, dpr);

      const cx = size / 2;
      const cy = size / 2;
      const maxR = 310;
      const n = radarData.length;
      const maxVal = 5;

      ctx.clearRect(0, 0, size, size);

      // Draw grid circles
      for (let step = 1; step <= 9; step++) {
        const r = (step / 9) * maxR;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = "#d1d5db";
        ctx.lineWidth = 0.5;
        ctx.stroke();
        // Labels
        if (step % 2 === 0) {
          const val = ((step / 9) * maxVal).toFixed(2);
          ctx.fillStyle = "#9ca3af";
          ctx.font = "10px sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(val, cx, cy - r + 12);
        }
      }

      // Draw axis lines
      for (let i = 0; i < n; i++) {
        const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
        const ex = cx + maxR * Math.cos(angle);
        const ey = cy + maxR * Math.sin(angle);
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(ex, ey);
        ctx.strokeStyle = "#e5e7eb";
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }

      // Draw filled theme sectors
      const themeGroups: { theme: string; startIdx: number; endIdx: number; color: string }[] = [];
      let currentTheme = radarData[0].theme;
      let startIdx = 0;
      for (let i = 1; i <= n; i++) {
        if (i === n || radarData[i].theme !== currentTheme) {
          themeGroups.push({ theme: currentTheme, startIdx, endIdx: i - 1, color: radarData[startIdx].color });
          if (i < n) {
            currentTheme = radarData[i].theme;
            startIdx = i;
          }
        }
      }

      themeGroups.forEach(({ startIdx: si, endIdx: ei, color }) => {
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        for (let i = si; i <= ei; i++) {
          const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
          const ex = cx + maxR * Math.cos(angle);
          const ey = cy + maxR * Math.sin(angle);
          ctx.lineTo(ex, ey);
        }
        // Close to next axis or back
        const lastAngle = (Math.PI * 2 * (ei + 1)) / n - Math.PI / 2;
        ctx.lineTo(cx + maxR * Math.cos(lastAngle), cy + maxR * Math.sin(lastAngle));
        ctx.lineTo(cx, cy);
        ctx.closePath();
        ctx.fillStyle = color + "66"; // 40% opacity
        ctx.fill();
      });

      // Draw score polygon (red line)
      ctx.beginPath();
      radarData.forEach((d, i) => {
        const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
        const r = (d.avg / maxVal) * maxR;
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.closePath();
      ctx.strokeStyle = "#DC2626";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw score dots
      radarData.forEach((d, i) => {
        const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
        const r = (d.avg / maxVal) * maxR;
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fillStyle = "#DC2626";
        ctx.fill();
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      // Draw labels
      radarData.forEach((d, i) => {
        const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
        const labelR = maxR + 18;
        const x = cx + labelR * Math.cos(angle);
        const y = cy + labelR * Math.sin(angle);

        const label = `${d.shortLabel} (${d.avg.toFixed(2).replace(".", ",")})`;

        ctx.save();
        ctx.font = "10px sans-serif";
        ctx.fillStyle = "#374151";

        // Determine text alignment based on position
        const angleDeg = ((angle * 180) / Math.PI + 360) % 360;
        if (angleDeg > 80 && angleDeg < 100) {
          ctx.textAlign = "center";
          ctx.textBaseline = "top";
        } else if (angleDeg > 260 && angleDeg < 280) {
          ctx.textAlign = "center";
          ctx.textBaseline = "bottom";
        } else if (angleDeg >= 100 && angleDeg <= 260) {
          ctx.textAlign = "right";
          ctx.textBaseline = "middle";
        } else {
          ctx.textAlign = "left";
          ctx.textBaseline = "middle";
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
      <DialogContent className="max-w-[960px] max-h-[95vh] overflow-auto p-6">
        <DialogHeader>
          <DialogTitle>{t("dashboard.avgByQuestion", "Average Score by Question")}</DialogTitle>
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
