import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, MessageCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

interface Props {
  records: any[] | undefined;
  isLoading: boolean;
}

const QUESTION_1 = "Dans quelle mesure recommanderiez-vous ID Logistics à vos collègues, partenaires commerciaux ou clients ?";
const QUESTION_2 = "Si vous aviez de nouvelles activités à prester, pourriez-vous les confier, dans le cadre d\u2019un AO et sous réserve de compétitivité, à IDL ?";

function computeNPSByClient(records: any[] | undefined) {
  if (!records) return [];

  const q1Records = records.filter(
    (r) => r.question === QUESTION_1 && r.score != null
  );

  const byClient: Record<string, number[]> = {};
  q1Records.forEach((r) => {
    const client = r.client_name ?? "Unknown";
    if (!byClient[client]) byClient[client] = [];
    byClient[client].push(Number(r.score));
  });

  return Object.entries(byClient)
    .map(([client, scores]) => {
      const points = scores.map((s) => {
        if (s >= 9) return 100;
        if (s >= 7) return 0;
        return -100;
      });
      const nps = Math.round(points.reduce((a, b) => a + b, 0) / points.length);
      return { client, nps };
    })
    .sort((a, b) => b.nps - a.nps);
}

export default function CorporatePerceptionCharts({ records, isLoading }: Props) {
  const { t } = useTranslation();
  const [showNoClients, setShowNoClients] = useState(false);

  const availableYears = useMemo(() => {
    if (!records) return [];
    const years = [...new Set(records.map((r) => r.survey_year).filter(Boolean))].sort((a, b) => b - a);
    return years;
  }, [records]);

  const [selectedYear, setSelectedYear] = useState<string>("");

  // Auto-select first year when available
  useMemo(() => {
    if (!selectedYear && availableYears.length > 0) {
      setSelectedYear(String(availableYears[0]));
    }
  }, [availableYears]);

  const filteredRecords = useMemo(() => {
    if (!records || !selectedYear) return records;
    return records.filter((r) => String(r.survey_year) === selectedYear);
  }, [records, selectedYear]);

  const npsData = useMemo(() => computeNPSByClient(filteredRecords), [filteredRecords]);

  const prevYear = selectedYear ? String(Number(selectedYear) - 1) : "";
  const prevYearRecords = useMemo(() => {
    if (!records || !prevYear) return [];
    return records.filter((r) => String(r.survey_year) === prevYear);
  }, [records, prevYear]);

  const clientsCurrentYear = useMemo(() => {
    if (!filteredRecords) return 0;
    return new Set(filteredRecords.map((r) => r.client_name).filter(Boolean)).size;
  }, [filteredRecords]);

  const clientsPrevYear = useMemo(() => {
    if (!prevYearRecords.length) return null;
    return new Set(prevYearRecords.map((r) => r.client_name).filter(Boolean)).size;
  }, [prevYearRecords]);

  const answersCurrentYear = useMemo(() => {
    if (!filteredRecords) return 0;
    return filteredRecords.filter((r) => r.question === QUESTION_1 && r.score != null).length;
  }, [filteredRecords]);

  const answersPrevYear = useMemo(() => {
    if (!prevYearRecords.length) return null;
    return prevYearRecords.filter((r) => r.question === QUESTION_1 && r.score != null).length;
  }, [prevYearRecords]);

  // Question 2: "Contrataria ID para nuevo servicio?" - SIM (score=1) / NÃO (score=0)
  // IMPORTANT: only count records where score is explicitly 0 or 1, ignore null/blank
  const isExplicitScore = (score: any, val: number) =>
    score !== null && score !== undefined && String(score).trim() !== "" && Number(score) === val;

  const q2Stats = useMemo(() => {
    if (!filteredRecords) return { yes: 0, no: 0 };
    const q2 = filteredRecords.filter((r) => r.question === QUESTION_2);
    const yes = q2.filter((r) => isExplicitScore(r.score, 1)).length;
    const no = q2.filter((r) => isExplicitScore(r.score, 0)).length;
    return { yes, no };
  }, [filteredRecords]);

  const q2PrevStats = useMemo(() => {
    if (!prevYearRecords.length) return null;
    const q2 = prevYearRecords.filter((r) => r.question === QUESTION_2);
    const yes = q2.filter((r) => isExplicitScore(r.score, 1)).length;
    const no = q2.filter((r) => isExplicitScore(r.score, 0)).length;
    return { yes, no };
  }, [prevYearRecords]);

  // Breakdown of "No" answers by client
  const noClientBreakdown = useMemo(() => {
    if (!filteredRecords) return [];
    const noRecords = filteredRecords.filter(
      (r) => r.question === QUESTION_2 && isExplicitScore(r.score, 0)
    );
    const byClient: Record<string, number> = {};
    noRecords.forEach((r) => {
      const client = r.client_name ?? "Unknown";
      byClient[client] = (byClient[client] || 0) + 1;
    });
    return Object.entries(byClient)
      .map(([client, count]) => ({ client, count }))
      .sort((a, b) => b.count - a.count);
  }, [filteredRecords]);

  if (isLoading) {
    return <p className="text-white/60">Loading...</p>;
  }

  const maxAbs = Math.max(...(npsData.length ? npsData.map((d) => Math.abs(d.nps)) : [1]), 1);

  // Split into two columns
  const mid = Math.ceil(npsData.length / 2);
  const leftCol = npsData.slice(0, mid);
  const rightCol = npsData.slice(mid);

  return (
    <div className="space-y-6">
      <Card className="border-white/10 bg-white/5 backdrop-blur-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white text-lg">NPS Score by Client</CardTitle>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-[130px] border-white/20 bg-white/10 text-white">
              <SelectValue placeholder={t("dashboard.year")} />
            </SelectTrigger>
            <SelectContent className="border-white/20 bg-[hsl(215,85%,12%)]">
              {availableYears.map((y) => (
                <SelectItem key={y} value={String(y)} className="text-white">{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {!npsData.length ? (
            <p className="text-white/60 text-center py-12">No data available</p>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <NPSColumn data={leftCol} maxAbs={maxAbs} />
              <NPSColumn data={rightCol} maxAbs={maxAbs} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Clients Card */}
        <Card className="border-white/10 bg-white/5 backdrop-blur-md">
          <CardContent className="flex flex-col items-center justify-center py-10">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full border-2 border-blue-400/50">
              <Users className="h-10 w-10 text-blue-400" />
            </div>
            <p className="text-4xl font-bold text-white">{clientsCurrentYear} clients</p>
            {clientsPrevYear !== null && (
              <p className="text-lg text-white/50 mt-2">
                {clientsPrevYear} in {prevYear}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Global NPS Card */}
        <Card className="border-white/10 bg-white/5 backdrop-blur-md">
          <CardContent className="flex flex-col items-center justify-center py-10">
            <GlobalNPSGauge records={filteredRecords} prevRecords={prevYearRecords} prevYear={prevYear} selectedYear={selectedYear} />
          </CardContent>
        </Card>

        {/* Answers Card */}
        <Card className="border-white/10 bg-white/5 backdrop-blur-md">
          <CardContent className="flex flex-col items-center justify-center py-10">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full border-2 border-blue-400/50">
              <MessageCircle className="h-10 w-10 text-blue-400" />
            </div>
            <p className="text-4xl font-bold text-white">{answersCurrentYear} answers</p>
            {answersPrevYear !== null && (
              <p className="text-lg text-white/50 mt-2">
                {answersPrevYear} in {prevYear}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Q2 - Contrataria Card */}
        <Card className="border-white/10 bg-white/5 backdrop-blur-md">
          <CardContent className="flex flex-col items-center justify-center py-10">
            <p className="text-lg font-bold text-blue-300 text-center mb-6 leading-tight">
              {t("corporatePerception.wouldHireQuestion", "Contrataria ID para um novo serviço ou operação?")}
            </p>
            <div className="flex items-start gap-8">
              <div className="flex flex-col items-center">
                <span className="text-blue-400 font-bold text-lg">SIM</span>
                <span className="text-4xl font-bold text-green-400">{q2Stats.yes}</span>
                {q2PrevStats && (
                  <span className="text-sm text-white/50 mt-1">{q2PrevStats.yes} in {prevYear}</span>
                )}
              </div>
              <div className="flex flex-col items-center">
                <span className="text-blue-400 font-bold text-lg">NÃO</span>
                <span
                  className="text-4xl font-bold text-red-400 cursor-pointer hover:underline"
                  onClick={() => q2Stats.no > 0 && setShowNoClients(true)}
                  title="Clique para ver detalhes"
                >
                  {q2Stats.no}
                </span>
                {q2PrevStats && (
                  <span className="text-sm text-white/50 mt-1">{q2PrevStats.no} in {prevYear}</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialog: No clients breakdown */}
      <Dialog open={showNoClients} onOpenChange={setShowNoClients}>
        <DialogContent className="border-white/10 bg-[hsl(210,70%,15%)] text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Clients who answered "No" ({selectedYear})</DialogTitle>
          </DialogHeader>
          <Table>
            <TableHeader>
              <TableRow className="border-white/10">
                <TableHead className="text-white/60">Client</TableHead>
                <TableHead className="text-white/60 text-right">Count</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {noClientBreakdown.map((row) => (
                <TableRow key={row.client} className="border-white/5">
                  <TableCell className="text-white/80">{row.client}</TableCell>
                  <TableCell className="text-white font-bold text-right">{row.count}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function NPSColumn({ data, maxAbs }: { data: { client: string; nps: number }[]; maxAbs: number }) {
  return (
    <div className="flex flex-col gap-2">
      {data.map((d) => (
        <NPSBar key={d.client} client={d.client} nps={d.nps} maxAbs={maxAbs} />
      ))}
    </div>
  );
}

function NPSBar({ client, nps, maxAbs }: { client: string; nps: number; maxAbs: number }) {
  const barPct = Math.max((Math.abs(nps) / maxAbs) * 100, 2);
  const isPositive = nps >= 0;

  if (isPositive) {
    return (
      <div className="flex items-center gap-2 h-8">
        <span className="text-white/80 text-sm font-semibold text-right min-w-[160px] truncate">
          {client}
        </span>
        <div className="w-[350px] flex items-center gap-2">
          <div
            className="h-6 rounded-sm bg-green-500"
            style={{ width: `${barPct}%` }}
          />
          <span className="text-white text-sm font-bold whitespace-nowrap">{nps}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 h-8">
      <span className="text-white text-sm font-bold whitespace-nowrap min-w-[40px] text-right">{nps}</span>
      <div className="w-[350px] flex items-center justify-end">
        <div
          className="h-6 rounded-sm bg-red-500"
          style={{ width: `${barPct}%` }}
        />
      </div>
      <span className="text-white/80 text-sm font-semibold truncate">
        {client}
      </span>
    </div>
  );
}

function GlobalNPSGauge({ records, prevRecords, prevYear, selectedYear }: { records: any[] | undefined; prevRecords: any[]; prevYear: string; selectedYear: string }) {
  const stats = useMemo(() => computeGlobalNPS(records), [records]);
  const prevStats = useMemo(() => computeGlobalNPS(prevRecords), [prevRecords]);

  const total = stats.promoters + stats.passives + stats.detractors;
  const promoterPct = total ? (stats.promoters / total) * 100 : 0;
  const passivePct = total ? (stats.passives / total) * 100 : 0;
  const detractorPct = total ? (stats.detractors / total) * 100 : 0;

  const size = 240;
  const strokeOuter = 40;
  const gap = 6;
  const rOuter = (size - strokeOuter) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const startAngle = 225; // bottom-left, opening at bottom
  const totalArc = 270;
  const usableArc = totalArc - gap * 2;

  // Clockwise from opening: red (bottom-left) → orange (top-left) → green (top-right)
  const redSweep = total ? (detractorPct / 100) * usableArc : 0;
  const orangeSweep = total ? (passivePct / 100) * usableArc : 0;
  const greenSweep = total ? (promoterPct / 100) * usableArc : 0;

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

  function labelPos(startDeg: number, sweepDeg: number, r: number) {
    const mid = ((startDeg + sweepDeg / 2 - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(mid), y: cy + r * Math.sin(mid) };
  }

  const gLabel = labelPos(greenStart, greenSweep, rOuter);
  const oLabel = labelPos(orangeStart, orangeSweep, rOuter);
  const dLabel = labelPos(redStart, redSweep, rOuter);

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size + 30} viewBox={`0 0 ${size} ${size + 30}`}>
        {total > 0 && (
          <>
            {greenSweep > 0.5 && (
              <path d={arcPath(rOuter, greenStart, greenSweep)} fill="none" stroke="rgba(134,239,172,0.5)" strokeWidth={strokeOuter} strokeLinecap="butt" />
            )}
            {orangeSweep > 0.5 && (
              <path d={arcPath(rOuter, orangeStart, orangeSweep)} fill="none" stroke="rgba(253,186,116,0.5)" strokeWidth={strokeOuter} strokeLinecap="butt" />
            )}
            {redSweep > 0.5 && (
              <path d={arcPath(rOuter, redStart, redSweep)} fill="none" stroke="rgba(252,165,165,0.5)" strokeWidth={strokeOuter} strokeLinecap="butt" />
            )}
            {greenSweep > 8 && (
              <text x={gLabel.x} y={gLabel.y} textAnchor="middle" dominantBaseline="central" fill="#166534" fontSize="16" fontWeight="700">{stats.promoters}</text>
            )}
            {orangeSweep > 8 && (
              <text x={oLabel.x} y={oLabel.y} textAnchor="middle" dominantBaseline="central" fill="#c2410c" fontSize="16" fontWeight="700">{stats.passives}</text>
            )}
            {redSweep > 8 && (
              <text x={dLabel.x} y={dLabel.y} textAnchor="middle" dominantBaseline="central" fill="#dc2626" fontSize="16" fontWeight="700">{stats.detractors}</text>
            )}
          </>
        )}
        {/* Center NPS value */}
        <text x={cx} y={cy - 10} textAnchor="middle" dominantBaseline="central" fill="white" fontSize="48" fontWeight="800">{stats.nps}</text>
        {/* NPS + year label */}
        <text x={cx} y={cy + 24} textAnchor="middle" dominantBaseline="central" fill="white" fontSize="16" fontWeight="700">NPS {selectedYear}</text>
        {/* Previous year */}
        {prevRecords.length > 0 && (
          <text x={cx} y={cy + 64} textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="16">{prevStats.nps} in {prevYear}</text>
        )}
      </svg>
    </div>
  );
}

function computeGlobalNPS(records: any[] | undefined) {
  if (!records || !records.length) return { nps: 0, promoters: 0, passives: 0, detractors: 0 };
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
