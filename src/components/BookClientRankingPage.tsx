import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import logoIdl from "@/assets/logo-idl-dark.png";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface Props {
  surveyYear: number | null;
  verticalName?: string;
  filterClients?: string[];
}

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

function computeClientAvgs(records: any[], year: number) {
  const yearRecords = records.filter(
    (r) =>
      r.survey_year === year &&
      r.theme &&
      r.theme.toUpperCase() !== "CORPORATE PERCEPTION" &&
      Number(r.score) !== 0
  );

  const byClient: Record<string, number[]> = {};
  yearRecords.forEach((r) => {
    const client = r.client_name ?? "Unknown";
    if (!byClient[client]) byClient[client] = [];
    byClient[client].push(Number(r.score));
  });

  const result: { client: string; avg: number }[] = [];
  for (const [client, scores] of Object.entries(byClient)) {
    result.push({
      client,
      avg: scores.reduce((a, b) => a + b, 0) / scores.length,
    });
  }
  return result.sort((a, b) => b.avg - a.avg || a.client.localeCompare(b.client));
}

function computeGlobalAvg(records: any[], year: number) {
  const yearRecords = records.filter(
    (r) =>
      r.survey_year === year &&
      r.theme &&
      r.theme.toUpperCase() !== "CORPORATE PERCEPTION" &&
      Number(r.score) !== 0
  );
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

function TrendIcon({ current, previous }: { current: number; previous: number | null }) {
  if (previous == null) return null;
  const diff = current - previous;
  if (Math.abs(diff) < 0.01) {
    return (
      <div className="w-7 h-7 rounded-full border-2 border-[hsl(200,60%,50%)] flex items-center justify-center">
        <Minus className="w-3.5 h-3.5 text-[hsl(200,60%,50%)]" />
      </div>
    );
  }
  if (diff > 0) {
    return (
      <div className="w-7 h-7 rounded-full border-2 border-[hsl(200,60%,50%)] flex items-center justify-center">
        <TrendingUp className="w-3.5 h-3.5 text-[hsl(200,60%,50%)]" />
      </div>
    );
  }
  return (
    <div className="w-7 h-7 rounded-full border-2 border-[hsl(0,70%,50%)] flex items-center justify-center">
      <TrendingDown className="w-3.5 h-3.5 text-[hsl(0,70%,50%)]" />
    </div>
  );
}

export default function BookClientRankingPage({ surveyYear, verticalName, filterClients }: Props) {
  const prevYear = surveyYear ? surveyYear - 1 : null;

  const { data: rawRecords } = useQuery({
    queryKey: ["book-client-ranking", surveyYear],
    queryFn: fetchAllRecords(surveyYear),
    enabled: !!surveyYear,
  });

  const records = useMemo(() => {
    if (!rawRecords) return null;
    if (!filterClients) return rawRecords;
    const filterSet = new Set(filterClients.map((n) => n.toLowerCase()));
    return rawRecords.filter((r) => filterSet.has((r.client_name ?? "").toLowerCase()));
  }, [rawRecords, filterClients]);

  const { clientsData, globalCurrent, globalPrev, variation } = useMemo(() => {
    if (!records || !surveyYear)
      return { clientsData: [], globalCurrent: 0, globalPrev: 0, variation: 0 };

    const currentAvgs = computeClientAvgs(records, surveyYear);
    const prevAvgsArr = prevYear ? computeClientAvgs(records, prevYear) : [];
    const prevMap = new Map(prevAvgsArr.map((c) => [c.client, c.avg]));

    const merged = currentAvgs
      .map((c) => ({
        client: c.client,
        current: Math.round(c.avg * 100) / 100,
        previous: prevMap.has(c.client) ? Math.round(prevMap.get(c.client)! * 100) / 100 : null,
      }))
      .sort((a, b) => {
        const diff = b.current - a.current;
        if (diff !== 0) return diff;
        return a.client.localeCompare(b.client);
      });

    const gCur = computeGlobalAvg(records, surveyYear);
    const gPrev = prevYear ? computeGlobalAvg(records, prevYear) : 0;
    const vari = gPrev ? ((gCur - gPrev) / gPrev) * 100 : 0;

    return { clientsData: merged, globalCurrent: gCur, globalPrev: gPrev, variation: vari };
  }, [records, surveyYear, prevYear]);

  const fmt = (v: number) => v.toFixed(2).replace(".", ",");
  const maxScore = 5;

  // Determine if we should use single column (few clients) or two columns
  const useOneCol = clientsData.length <= 6;
  const large = clientsData.length <= 8;

  // Split into two columns if needed
  const half = Math.ceil(clientsData.length / 2);
  const leftCol = useOneCol ? clientsData : clientsData.slice(0, half);
  const rightCol = useOneCol ? [] : clientsData.slice(half);

  const barH = large ? "h-[24px]" : "h-[18px]";
  const fontSize = large ? "text-base" : "text-sm";
  const nameW = large ? "w-[200px]" : "w-[160px]";
  const rowGap = large ? "gap-[14px]" : "gap-[8px]";

  const renderColumn = (items: typeof clientsData) => (
    <div className={`flex flex-col ${rowGap} flex-1 justify-center`}>
      {items.map((item) => {
        const curPct = (item.current / maxScore) * 100;
        const prevPct = item.previous != null ? (item.previous / maxScore) * 100 : 0;
        const barColor = item.current >= 3
          ? "hsl(175, 65%, 55%)"
          : "hsl(0, 75%, 50%)";

        return (
          <div key={item.client} className="flex items-center gap-2">
            <div className={`${nameW} shrink-0 text-right pr-2`}>
              <span className={`${fontSize} font-bold uppercase leading-tight`}>
                {item.client}
              </span>
            </div>
            <div className="flex-1 flex flex-col gap-[2px]">
              <div className="flex items-center gap-1">
                <div className={`flex-1 ${barH} bg-[hsl(210,20%,95%)] rounded-sm overflow-hidden`}>
                  <div
                    className="h-full rounded-sm"
                    style={{
                      width: `${curPct}%`,
                      backgroundColor: barColor,
                    }}
                  />
                </div>
                <span className={`${fontSize} font-bold w-[40px] shrink-0`}>{fmt(item.current)}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className={`flex-1 ${barH} bg-[hsl(210,20%,95%)] rounded-sm overflow-hidden`}>
                  <div
                    className="h-full rounded-sm"
                    style={{
                      width: `${prevPct}%`,
                      backgroundColor: "hsl(210, 10%, 75%)",
                    }}
                  />
                </div>
                <span className={`${fontSize} font-semibold text-[hsl(210,10%,55%)] w-[40px] shrink-0`}>
                  {item.previous != null ? fmt(item.previous) : "—"}
                </span>
              </div>
            </div>
            <div className="shrink-0">
              <TrendIcon current={item.current} previous={item.previous} />
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="flex h-full w-full flex-col bg-white text-[hsl(215,85%,15%)]">
      {/* Header */}
      <div className="flex items-center justify-between px-10 py-3 border-b border-[hsl(210,30%,90%)]">
        <div>
          <h2 className="text-3xl font-extrabold uppercase tracking-tight">
            Client Ranking {surveyYear}
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-sm font-bold text-[hsl(0,85%,45%)] uppercase tracking-wide">
              BRAZIL
            </p>
            <div className="h-[3px] w-6 bg-[hsl(0,85%,45%)] rounded-full" />
          </div>
          {verticalName && (
            <p className="text-sm font-bold text-[hsl(200,80%,45%)] uppercase tracking-wide mt-0.5">{verticalName}</p>
          )}
        </div>
        <div className="flex items-center gap-6">
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

      {/* Legend */}
      <div className="flex items-center gap-6 px-10 pt-2 pb-0">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-3 rounded-sm" style={{ backgroundColor: "hsl(175, 65%, 55%)" }} />
          <span className="text-[9px] font-semibold">{surveyYear} — Score ≥ 3</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-3 rounded-sm" style={{ backgroundColor: "hsl(0, 75%, 50%)" }} />
          <span className="text-[9px] font-semibold">{surveyYear} — Score &lt; 3</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-3 rounded-sm" style={{ backgroundColor: "hsl(210, 10%, 75%)" }} />
          <span className="text-[9px] font-semibold">{prevYear}</span>
        </div>
      </div>

      {/* Chart area */}
      <div className={`flex-1 flex gap-8 px-10 py-1 overflow-hidden min-h-0 ${useOneCol ? 'justify-center' : ''}`}>
        {renderColumn(leftCol)}
        {rightCol.length > 0 && renderColumn(rightCol)}
      </div>
    </div>
  );
}
