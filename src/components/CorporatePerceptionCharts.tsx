import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  records: any[] | undefined;
  isLoading: boolean;
}

const QUESTION_1 = "Dans quelle mesure recommanderiez-vous ID Logistics à vos collègues, partenaires commerciaux ou clients ?";

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
  const npsData = useMemo(() => computeNPSByClient(records), [records]);

  if (isLoading) {
    return <p className="text-white/60">Loading...</p>;
  }

  if (!npsData.length) {
    return <p className="text-white/60 text-center py-12">No data available</p>;
  }

  // Split into two columns for layout like the reference image
  const mid = Math.ceil(npsData.length / 2);
  const leftCol = npsData.slice(0, mid);
  const rightCol = npsData.slice(mid);

  const maxAbs = Math.max(...npsData.map((d) => Math.abs(d.nps)), 1);

  return (
    <Card className="border-white/10 bg-white/5 backdrop-blur-md">
      <CardHeader>
        <CardTitle className="text-white text-lg">NPS Score by Client</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <NPSColumn data={leftCol} maxAbs={maxAbs} />
          <NPSColumn data={rightCol} maxAbs={maxAbs} />
        </div>
      </CardContent>
    </Card>
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
  const barWidth = Math.max((Math.abs(nps) / maxAbs) * 100, 2);
  const isPositive = nps >= 0;

  if (isPositive) {
    return (
      <div className="flex items-center gap-2 h-8">
        <span className="text-white/80 text-sm font-semibold text-right min-w-[160px] truncate">
          {client}
        </span>
        <div className="flex-1 flex items-center gap-2">
          <div
            className="h-6 rounded-sm bg-green-500"
            style={{ width: `${barWidth}%` }}
          />
          <span className="text-white text-sm font-bold whitespace-nowrap">{nps}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 h-8">
      <span className="text-white text-sm font-bold whitespace-nowrap min-w-[40px] text-right">
        {nps}
      </span>
      <div
        className="h-6 rounded-sm bg-red-500"
        style={{ width: `${barWidth}%`, maxWidth: "60%" }}
      />
      <span className="text-white/80 text-sm font-semibold truncate">
        {client}
      </span>
    </div>
  );
}
