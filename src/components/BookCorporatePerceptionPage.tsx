import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Users, MessageCircle } from "lucide-react";
import logoIdl from "@/assets/logo-idl-dark.png";

interface Props {
  surveyYear: number | null;
}

const QUESTION_1 = "Dans quelle mesure recommanderiez-vous ID Logistics à vos collègues, partenaires commerciaux ou clients ?";
const QUESTION_2 = "Si vous aviez de nouvelles activités à prester, pourriez-vous les confier, dans le cadre d\u2019un AO et sous réserve de compétitivité, à IDL ?";

function computeNPSByClient(records: any[]) {
  const q1Records = records.filter((r) => r.question === QUESTION_1 && r.score != null);
  const byClient: Record<string, number[]> = {};
  q1Records.forEach((r) => {
    const client = r.client_name ?? "Unknown";
    if (!byClient[client]) byClient[client] = [];
    byClient[client].push(Number(r.score));
  });
  return Object.entries(byClient)
    .map(([client, scores]) => {
      const points = scores.map((s) => (s >= 9 ? 100 : s >= 7 ? 0 : -100));
      const nps = Math.round(points.reduce((a, b) => a + b, 0) / points.length);
      return { client, nps };
    })
    .sort((a, b) => b.nps - a.nps);
}

function computeGlobalNPS(records: any[]) {
  const q1 = records.filter((r) => r.question === QUESTION_1 && r.score != null);
  let promoters = 0, passives = 0, detractors = 0;
  q1.forEach((r) => {
    const s = Number(r.score);
    if (s >= 9) promoters++;
    else if (s >= 7) passives++;
    else detractors++;
  });
  const total = promoters + passives + detractors;
  const nps = total ? Math.round(((promoters - detractors) / total) * 100) : 0;
  return { nps, promoters, passives, detractors };
}

const isExplicitScore = (score: any, val: number) =>
  score !== null && score !== undefined && String(score).trim() !== "" && Number(score) === val;

export default function BookCorporatePerceptionPage({ surveyYear }: Props) {
  // Fetch all records
  const { data: allRecords } = useQuery({
    queryKey: ["book-cp-records"],
    queryFn: async () => {
      const allRows: any[] = [];
      const PAGE_SIZE = 1000;
      let from = 0;
      let hasMore = true;
      while (hasMore) {
        const { data, error } = await supabase
          .from("pesquisa_satisfacao")
          .select("*")
          .range(from, from + PAGE_SIZE - 1);
        if (error) throw error;
        allRows.push(...(data || []));
        hasMore = (data?.length || 0) === PAGE_SIZE;
        from += PAGE_SIZE;
      }
      return allRows;
    },
  });

  const records = useMemo(() => {
    if (!allRecords || !surveyYear) return [];
    return allRecords.filter((r) => r.survey_year === surveyYear);
  }, [allRecords, surveyYear]);

  const prevYear = surveyYear ? surveyYear - 1 : null;
  const prevRecords = useMemo(() => {
    if (!allRecords || !prevYear) return [];
    return allRecords.filter((r) => r.survey_year === prevYear);
  }, [allRecords, prevYear]);

  const npsData = useMemo(() => computeNPSByClient(records), [records]);
  const globalNPS = useMemo(() => computeGlobalNPS(records), [records]);
  const prevGlobalNPS = useMemo(() => computeGlobalNPS(prevRecords), [prevRecords]);

  const clientsCount = useMemo(() => new Set(records.map((r) => r.client_name).filter(Boolean)).size, [records]);
  const prevClientsCount = useMemo(() => new Set(prevRecords.map((r) => r.client_name).filter(Boolean)).size, [prevRecords]);

  const answersCount = useMemo(() => records.filter((r) => r.question === QUESTION_1 && r.score != null).length, [records]);
  const prevAnswersCount = useMemo(() => prevRecords.filter((r) => r.question === QUESTION_1 && r.score != null).length, [prevRecords]);

  const q2Stats = useMemo(() => {
    const q2 = records.filter((r) => r.question === QUESTION_2);
    return { yes: q2.filter((r) => isExplicitScore(r.score, 1)).length, no: q2.filter((r) => isExplicitScore(r.score, 0)).length };
  }, [records]);

  const q2PrevStats = useMemo(() => {
    if (!prevRecords.length) return null;
    const q2 = prevRecords.filter((r) => r.question === QUESTION_2);
    return { yes: q2.filter((r) => isExplicitScore(r.score, 1)).length, no: q2.filter((r) => isExplicitScore(r.score, 0)).length };
  }, [prevRecords]);

  const maxAbs = Math.max(...(npsData.length ? npsData.map((d) => Math.abs(d.nps)) : [1]), 1);

  return (
    <div className="flex h-full w-full flex-col bg-white text-[hsl(215,85%,15%)]">
      {/* Header */}
      <div className="flex items-center justify-between px-10 py-5 border-b border-[hsl(210,30%,90%)]">
        <div>
          <h2 className="text-3xl font-extrabold uppercase tracking-tight">
            Corporate Perception {surveyYear || ""}
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-sm font-bold text-[hsl(0,85%,45%)] uppercase tracking-wide">BRAZIL</p>
            <div className="h-[3px] w-6 bg-[hsl(0,85%,45%)] rounded-full" />
          </div>
        </div>
        <img src={logoIdl} alt="ID Logistics" className="h-10 object-contain" />
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col px-6 py-3 gap-3">
        {/* KPI Cards Row */}
        <div className="grid grid-cols-4 gap-3 flex-[1.2] min-h-[290px]">
          {/* Clients */}
          <KPICard
            icon={<Users className="h-5 w-5 text-[hsl(210,80%,50%)]" />}
            value={clientsCount}
            label="Clients"
            prevValue={prevClientsCount || null}
            prevYear={prevYear}
          />
          {/* Global NPS Gauge */}
          <div className="rounded-lg border border-[hsl(210,30%,88%)] bg-[hsl(210,40%,97%)] flex flex-col items-center justify-center p-4">
            <MiniGauge nps={globalNPS.nps} promoters={globalNPS.promoters} passives={globalNPS.passives} detractors={globalNPS.detractors} year={surveyYear} />
            {prevRecords.length > 0 && (
              <p className="text-[10px] text-[hsl(200,20%,55%)] mt-1">{prevGlobalNPS.nps} in {prevYear}</p>
            )}
          </div>
          {/* Answers */}
          <KPICard
            icon={<MessageCircle className="h-5 w-5 text-[hsl(210,80%,50%)]" />}
            value={answersCount}
            label="Answers"
            prevValue={prevAnswersCount || null}
            prevYear={prevYear}
          />
          {/* Q2 */}
          <div className="rounded-lg border border-[hsl(210,30%,88%)] bg-[hsl(210,40%,97%)] flex flex-col items-center justify-center p-4">
            <p className="text-[10px] font-bold text-[hsl(215,85%,25%)] text-center leading-tight mb-2">
              Would hire ID for a new service?
            </p>
            <div className="flex items-center gap-5">
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-bold text-[hsl(210,80%,50%)]">YES</span>
                <span className="text-2xl font-bold text-[hsl(140,60%,35%)] leading-tight">{q2Stats.yes}</span>
                {q2PrevStats && <span className="text-[9px] text-[hsl(200,20%,55%)]">{q2PrevStats.yes} in {prevYear}</span>}
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-bold text-[hsl(210,80%,50%)]">NO</span>
                <span className="text-2xl font-bold text-[hsl(0,70%,50%)] leading-tight">{q2Stats.no}</span>
                {q2PrevStats && <span className="text-[9px] text-[hsl(200,20%,55%)]">{q2PrevStats.no} in {prevYear}</span>}
              </div>
            </div>
          </div>
        </div>

        {/* NPS by Client Chart */}
        <div className="h-[44%] min-h-[180px] rounded-lg border border-[hsl(210,30%,88%)] bg-[hsl(210,40%,97%)] overflow-hidden flex flex-col">
          <div className="px-4 py-2 border-b border-[hsl(210,30%,90%)]">
            <span className="text-xs font-bold uppercase tracking-wider text-[hsl(215,85%,25%)]">NPS by Client</span>
          </div>
          <div className="flex-1 overflow-auto px-4 py-2">
            {npsData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-[hsl(200,20%,55%)] text-sm">No data</div>
            ) : (
              <div className="grid grid-cols-2 gap-x-6 gap-y-1" style={{ gridAutoFlow: 'column', gridTemplateRows: `repeat(${Math.ceil(npsData.length / 2)}, minmax(0, 1fr))` }}>
                {npsData.map((d) => (
                  <BookNPSBar key={d.client} client={d.client} nps={d.nps} maxAbs={maxAbs} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function KPICard({ icon, value, label, prevValue, prevYear }: { icon: React.ReactNode; value: number; label: string; prevValue: number | null; prevYear: number | null }) {
  return (
    <div className="rounded-lg border border-[hsl(210,30%,88%)] bg-[hsl(210,40%,97%)] flex flex-col items-center justify-center p-4">
      <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full border border-[hsl(210,60%,75%)]">
        {icon}
      </div>
      <p className="text-4xl font-bold text-[hsl(215,85%,15%)] leading-none">{value}</p>
      <p className="text-xs font-semibold text-[hsl(215,85%,25%)] uppercase mt-1">{label}</p>
      {prevValue !== null && prevYear && (
        <p className="text-[11px] text-[hsl(200,20%,55%)] mt-1">{prevValue} in {prevYear}</p>
      )}
    </div>
  );
}

function BookNPSBar({ client, nps, maxAbs }: { client: string; nps: number; maxAbs: number }) {
  const barPct = Math.max((Math.abs(nps) / maxAbs) * 100, 3);
  const isPositive = nps >= 0;

  if (isPositive) {
    return (
      <div className="flex items-center gap-1.5 h-6">
        <span className="text-[10px] font-semibold text-[hsl(215,85%,20%)] text-right min-w-[100px] truncate">{client}</span>
        <div className="flex-1 flex items-center gap-1">
          <div className="h-4 rounded-sm bg-[hsl(140,60%,45%)]" style={{ width: `${barPct}%` }} />
          <span className="text-[10px] font-bold text-[hsl(215,85%,15%)] whitespace-nowrap">{nps}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 h-6">
      <span className="text-[10px] font-bold text-[hsl(215,85%,15%)] whitespace-nowrap min-w-[24px] text-right">{nps}</span>
      <div className="flex-1 flex items-center justify-end">
        <div className="h-4 rounded-sm bg-[hsl(0,70%,55%)]" style={{ width: `${barPct}%` }} />
      </div>
      <span className="text-[10px] font-semibold text-[hsl(215,85%,20%)] truncate">{client}</span>
    </div>
  );
}

function MiniGauge({ nps, promoters, passives, detractors, year }: { nps: number; promoters: number; passives: number; detractors: number; year: number | null }) {
  const size = 110;
  const strokeOuter = 18;
  const gap = 4;
  const rOuter = (size - strokeOuter) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const startAngle = 225;
  const totalArc = 270;
  const usableArc = totalArc - gap * 2;
  const total = promoters + passives + detractors;

  const detractorPct = total ? (detractors / total) * 100 : 0;
  const passivePct = total ? (passives / total) * 100 : 0;
  const promoterPct = total ? (promoters / total) * 100 : 0;

  const redSweep = (detractorPct / 100) * usableArc;
  const orangeSweep = (passivePct / 100) * usableArc;
  const greenSweep = (promoterPct / 100) * usableArc;

  const redStart = startAngle;
  const orangeStart = redStart + redSweep + gap;
  const greenStart = orangeStart + orangeSweep + gap;

  function arcPath(r: number, startDeg: number, sweepDeg: number) {
    if (sweepDeg <= 0) return "";
    const s = ((startDeg - 90) * Math.PI) / 180;
    const e = ((startDeg + sweepDeg - 90) * Math.PI) / 180;
    const x1 = cx + r * Math.cos(s);
    const y1 = cy + r * Math.sin(s);
    const x2 = cx + r * Math.cos(e);
    const y2 = cy + r * Math.sin(e);
    const large = sweepDeg > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
  }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {total > 0 && (
        <>
          {greenSweep > 0.5 && <path d={arcPath(rOuter, greenStart, greenSweep)} fill="none" stroke="hsl(140,60%,75%)" strokeWidth={strokeOuter} strokeLinecap="butt" />}
          {orangeSweep > 0.5 && <path d={arcPath(rOuter, orangeStart, orangeSweep)} fill="none" stroke="hsl(30,80%,75%)" strokeWidth={strokeOuter} strokeLinecap="butt" />}
          {redSweep > 0.5 && <path d={arcPath(rOuter, redStart, redSweep)} fill="none" stroke="hsl(0,70%,75%)" strokeWidth={strokeOuter} strokeLinecap="butt" />}
        </>
      )}
      <text x={cx} y={cy - 4} textAnchor="middle" dominantBaseline="central" fill="hsl(215,85%,15%)" fontSize="24" fontWeight="800">{nps}</text>
      <text x={cx} y={cy + 14} textAnchor="middle" dominantBaseline="central" fill="hsl(215,85%,25%)" fontSize="8" fontWeight="700">NPS {year}</text>
    </svg>
  );
}
