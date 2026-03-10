import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import logoIdl from "@/assets/logo-idl-dark.png";

interface Props {
  surveyYear: number | null;
}

const THEME_ORDER = [
  "ACCOMPAGNEMENT CLIENT",
  "EXCELLENCE OPÉRATIONNELLE",
  "EXPERTISE INFORMATIQUE",
  "SOLUTIONS DURABLES",
  "RESSOURCES HUMAINES",
  "GESTION DE PROJETS ET INNOVATION",
  "PARTENAIRE",
];

function fetchAllRecords(year: number | null) {
  return async () => {
    const allRows: any[] = [];
    const PAGE_SIZE = 1000;
    let from = 0;
    let hasMore = true;
    while (hasMore) {
      let query = supabase
        .from("pesquisa_satisfacao")
        .select("client_name, theme, score, answered, survey_year")
        .eq("answered", 1)
        .not("score", "is", null)
        .range(from, from + PAGE_SIZE - 1);
      if (year) {
        query = query.or(`survey_year.eq.${year},survey_year.eq.${year - 1}`);
      }
      const { data, error } = await query;
      if (error) throw error;
      allRows.push(...(data || []));
      hasMore = (data?.length || 0) === PAGE_SIZE;
      from += PAGE_SIZE;
    }
    return allRows;
  };
}

function computeAvgScoreByTheme(records: any[], year: number) {
  // Filter for this year, exclude CORPORATE PERCEPTION, exclude score 0
  const yearRecords = records.filter(
    (r) =>
      r.survey_year === year &&
      r.theme &&
      r.theme.toUpperCase() !== "CORPORATE PERCEPTION" &&
      Number(r.score) !== 0
  );

  // Group by theme -> client -> scores (mean of means)
  const byTheme: Record<string, Record<string, number[]>> = {};
  yearRecords.forEach((r) => {
    const theme = r.theme!.toUpperCase();
    const client = r.client_name ?? "Unknown";
    if (!byTheme[theme]) byTheme[theme] = {};
    if (!byTheme[theme][client]) byTheme[theme][client] = [];
    byTheme[theme][client].push(Number(r.score));
  });

  const result: Record<string, number> = {};
  for (const [theme, clients] of Object.entries(byTheme)) {
    const clientAvgs = Object.values(clients).map(
      (scores) => scores.reduce((a, b) => a + b, 0) / scores.length
    );
    result[theme] = clientAvgs.reduce((a, b) => a + b, 0) / clientAvgs.length;
  }
  return result;
}

function computeGlobalAvg(records: any[], year: number) {
  const yearRecords = records.filter(
    (r) =>
      r.survey_year === year &&
      r.theme &&
      r.theme.toUpperCase() !== "CORPORATE PERCEPTION" &&
      Number(r.score) !== 0
  );
  // Mean of means per client
  const byClient: Record<string, number[]> = {};
  yearRecords.forEach((r) => {
    const client = r.client_name ?? "Unknown";
    if (!byClient[client]) byClient[client] = [];
    byClient[client].push(Number(r.score));
  });
  const clientAvgs = Object.values(byClient).map(
    (scores) => scores.reduce((a, b) => a + b, 0) / scores.length
  );
  return clientAvgs.length
    ? clientAvgs.reduce((a, b) => a + b, 0) / clientAvgs.length
    : 0;
}

export default function BookComparisonByThemePage({ surveyYear }: Props) {
  const prevYear = surveyYear ? surveyYear - 1 : null;

  const { data: records } = useQuery({
    queryKey: ["book-comparison-theme", surveyYear],
    queryFn: fetchAllRecords(surveyYear),
    enabled: !!surveyYear,
  });

  const { currentByTheme, prevByTheme, globalCurrent, globalPrev, variation } =
    useMemo(() => {
      if (!records || !surveyYear)
        return {
          currentByTheme: {} as Record<string, number>,
          prevByTheme: {} as Record<string, number>,
          globalCurrent: 0,
          globalPrev: 0,
          variation: 0,
        };
      const cur = computeAvgScoreByTheme(records, surveyYear);
      const prev = prevYear ? computeAvgScoreByTheme(records, prevYear) : {};
      const gCur = computeGlobalAvg(records, surveyYear);
      const gPrev = prevYear ? computeGlobalAvg(records, prevYear) : 0;
      const vari = gPrev ? ((gCur - gPrev) / gPrev) * 100 : 0;
      return {
        currentByTheme: cur,
        prevByTheme: prev,
        globalCurrent: gCur,
        globalPrev: gPrev,
        variation: vari,
      };
    }, [records, surveyYear, prevYear]);

  const themes = THEME_ORDER.filter(
    (t) => currentByTheme[t] !== undefined || prevByTheme[t] !== undefined
  );

  const maxScore = 5;

  const fmt = (v: number) => v.toFixed(2).replace(".", ",");

  return (
    <div className="flex h-full w-full flex-col bg-white text-[hsl(215,85%,15%)]">
      {/* Header — same layout as Customers page */}
      <div className="flex items-center justify-between px-10 py-5 border-b border-[hsl(210,30%,90%)]">
        <div>
          <h2 className="text-3xl font-extrabold uppercase tracking-tight">
            Comparison by Theme
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-sm font-bold text-[hsl(0,85%,45%)] uppercase tracking-wide">
              BRAZIL
            </p>
            <div className="h-[3px] w-6 bg-[hsl(0,85%,45%)] rounded-full" />
          </div>
        </div>
        <div className="flex items-center gap-6">
          {/* Global score */}
          <div className="text-right">
            <p className="text-4xl font-extrabold">{fmt(globalCurrent)}</p>
            {prevYear && globalPrev > 0 && (
              <p className="text-xs text-[hsl(200,20%,50%)]">
                {prevYear} : {fmt(globalPrev)} ({variation >= 0 ? "+" : ""}
                {variation.toFixed(2).replace(".", ",")}%)
              </p>
            )}
          </div>
          <img src={logoIdl} alt="ID Logistics" className="h-10 object-contain" />
        </div>
      </div>

      {/* Chart area */}
      <div className="flex-1 flex flex-col px-10 py-4 overflow-hidden min-h-0">
        {/* Y-axis gridlines + bars */}
        <div className="flex-1 relative min-h-0" style={{ display: "flex", flexDirection: "column" }}>
          {/* Grid lines */}
          {[1, 2, 3, 4, 5].map((tick) => {
            const pct = ((maxScore - tick) / maxScore) * 100;
            return (
              <div
                key={tick}
                className="absolute left-6 right-0 border-t border-[hsl(210,20%,90%)]"
                style={{ top: `${pct}%` }}
              >
                <span className="absolute -left-5 -top-2 text-[10px] text-[hsl(200,20%,55%)]">
                  {tick}
                </span>
              </div>
            );
          })}

          {/* Bars container - absolute to fill the chart area */}
          <div className="absolute inset-0 left-6 flex items-end justify-around px-4 pb-0">
            {themes.map((theme) => {
              const cur = currentByTheme[theme] ?? 0;
              const prev = prevByTheme[theme] ?? 0;
              const curPct = (cur / maxScore) * 100;
              const prevPct = (prev / maxScore) * 100;

              return (
                <div key={theme} className="flex flex-col items-center flex-1 max-w-[120px] h-full justify-end">
                  <div className="flex items-end gap-1 w-full justify-center h-full">
                    {/* Current year bar */}
                    <div className="flex flex-col items-center justify-end w-[38%] h-full">
                      <span className="text-sm font-bold mb-1">{fmt(cur)}</span>
                      <div
                        className="w-full rounded-t-sm"
                        style={{
                          height: `${curPct}%`,
                          minHeight: cur > 0 ? 4 : 0,
                          backgroundColor: "hsl(215, 85%, 15%)",
                        }}
                      />
                    </div>
                    {/* Previous year bar */}
                    <div className="flex flex-col items-center justify-end w-[38%] h-full">
                      <span className="text-sm font-bold text-[hsl(215,40%,55%)] mb-1">
                        {prev > 0 ? fmt(prev) : "—"}
                      </span>
                      <div
                        className="w-full rounded-t-sm"
                        style={{
                          height: `${prevPct}%`,
                          minHeight: prev > 0 ? 4 : 0,
                          backgroundColor: "hsl(215, 40%, 70%)",
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Theme labels — staggered */}
        <div className="flex justify-around px-4 pl-10 mt-2 shrink-0">
          {themes.map((theme, i) => (
            <div
              key={theme}
              className="flex-1 max-w-[120px] text-center"
              style={{ marginTop: i % 2 === 1 ? "14px" : "0px" }}
            >
              <span className="text-[10px] font-bold uppercase leading-tight block">
                {theme}
              </span>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-3 shrink-0">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-3 rounded-sm" style={{ backgroundColor: "hsl(215, 85%, 15%)" }} />
            <span className="text-[10px] font-semibold">{surveyYear}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-3 rounded-sm" style={{ backgroundColor: "hsl(215, 40%, 70%)" }} />
            <span className="text-[10px] font-semibold">{prevYear}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
