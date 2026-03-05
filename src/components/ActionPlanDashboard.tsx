import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useTranslation } from "react-i18next";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, LabelList, PieChart, Pie, Cell } from "recharts";

interface ActionPlanDashboardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plans: any[] | undefined;
  statuses: any[] | undefined;
}

export default function ActionPlanDashboard({ open, onOpenChange, plans, statuses }: ActionPlanDashboardProps) {
  const { t } = useTranslation();
  const [filterYear, setFilterYear] = useState<string>("all");
  const [filterClient, setFilterClient] = useState<string>("all");
  const [filterTheme, setFilterTheme] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const years = useMemo(() => {
    if (!plans) return [];
    return [...new Set(plans.map((p) => p.survey_year).filter(Boolean))].sort((a, b) => b - a);
  }, [plans]);

  const clients = useMemo(() => {
    if (!plans) return [];
    return [...new Set(plans.map((p) => p.client_name).filter(Boolean))].sort();
  }, [plans]);

  const themes = useMemo(() => {
    if (!plans) return [];
    return [...new Set(plans.map((p) => p.theme).filter(Boolean))].sort();
  }, [plans]);

  const filtered = useMemo(() => {
    if (!plans) return [];
    return plans.filter((p) => {
      if (filterYear !== "all" && String(p.survey_year) !== filterYear) return false;
      if (filterClient !== "all" && p.client_name !== filterClient) return false;
      if (filterTheme !== "all" && p.theme !== filterTheme) return false;
      if (filterStatus !== "all" && p.status_id !== filterStatus) return false;
      return true;
    });
  }, [plans, filterYear, filterClient, filterTheme, filterStatus]);

  const totalActions = filtered.length;

  const statusBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.forEach((p) => {
      const sid = p.status_id;
      map[sid] = (map[sid] || 0) + 1;
    });
    return map;
  }, [filtered]);

  const terminalCount = useMemo(() => {
    return filtered.filter((p) => {
      const name = ((p.action_statuses as any)?.name || "").toLowerCase();
      return name.includes("conclu") || name.includes("cancel");
    }).length;
  }, [filtered]);

  const inProgressCount = useMemo(() => {
    return filtered.filter((p) => {
      const name = ((p.action_statuses as any)?.name || "").toLowerCase();
      return !name.includes("conclu") && !name.includes("cancel");
    }).length;
  }, [filtered]);

  // Pendente Data Conclusão: completion_date is null/empty
  const pendingCompletionCount = useMemo(() => {
    return filtered.filter((p) => !p.completion_date).length;
  }, [filtered]);

  // Dentro do Prazo: completion_date <= new_end_date (if filled) or <= end_date (if new_end_date is blank)
  const onTimeCount = useMemo(() => {
    return filtered.filter((p) => {
      if (!p.completion_date) return false;
      const completion = new Date(p.completion_date);
      const deadline = p.new_end_date ? new Date(p.new_end_date) : p.end_date ? new Date(p.end_date) : null;
      if (!deadline) return false;
      return completion <= deadline;
    }).length;
  }, [filtered]);

  // Fora do Prazo: completion_date > deadline
  const lateCount = useMemo(() => {
    return filtered.filter((p) => {
      if (!p.completion_date) return false;
      const completion = new Date(p.completion_date);
      const deadline = p.new_end_date ? new Date(p.new_end_date) : p.end_date ? new Date(p.end_date) : null;
      if (!deadline) return false;
      return completion > deadline;
    }).length;
  }, [filtered]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-white/10 bg-[hsl(210,70%,12%)] text-white max-w-[95vw] w-[1400px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white text-xl">{t("actionPlan.dashboard", "Dashboard de Planos de Ação")}</DialogTitle>
        </DialogHeader>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-3">
          <Select value={filterYear} onValueChange={setFilterYear}>
            <SelectTrigger className="w-[130px] border-white/20 bg-white/10 text-white">
              <SelectValue placeholder={t("filters.year")} />
            </SelectTrigger>
            <SelectContent className="border-white/20 bg-[hsl(215,85%,12%)]">
              <SelectItem value="all" className="text-white">{t("filters.all")}</SelectItem>
              {years.map((y) => (
                <SelectItem key={y} value={String(y)} className="text-white">{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterClient} onValueChange={setFilterClient}>
            <SelectTrigger className="w-[180px] border-white/20 bg-white/10 text-white">
              <SelectValue placeholder={t("actionPlan.client")} />
            </SelectTrigger>
            <SelectContent className="border-white/20 bg-[hsl(215,85%,12%)] max-h-[300px]">
              <SelectItem value="all" className="text-white">{t("filters.all")}</SelectItem>
              {clients.map((c) => (
                <SelectItem key={c} value={c} className="text-white">{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterTheme} onValueChange={setFilterTheme}>
            <SelectTrigger className="w-[200px] border-white/20 bg-white/10 text-white">
              <SelectValue placeholder={t("actionPlan.theme")} />
            </SelectTrigger>
            <SelectContent className="border-white/20 bg-[hsl(215,85%,12%)] max-h-[300px]">
              <SelectItem value="all" className="text-white">{t("filters.all")}</SelectItem>
              {themes.map((th) => (
                <SelectItem key={th} value={th} className="text-white">{th}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[180px] border-white/20 bg-white/10 text-white">
              <SelectValue placeholder={t("actionPlan.status")} />
            </SelectTrigger>
            <SelectContent className="border-white/20 bg-[hsl(215,85%,12%)]">
              <SelectItem value="all" className="text-white">{t("filters.all")}</SelectItem>
              {statuses?.map((s) => (
                <SelectItem key={s.id} value={s.id} className="text-white">
                  <span className="flex items-center gap-2">
                    <span className="inline-block h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                    {s.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* KPI Labels - reference style */}
        <div className="flex flex-wrap gap-4 items-stretch">
          {/* PROJETOS */}
          <div className="border border-white/20 rounded-md overflow-hidden">
            <div className="bg-white/10 px-6 py-2 text-center">
              <span className="text-white font-bold text-sm tracking-wide uppercase">{t("actionPlan.totalActions", "Projetos")}</span>
            </div>
            <div className="px-6 py-4 text-center">
              <span className="text-3xl font-bold text-white">{totalActions}</span>
            </div>
          </div>

          {/* STATUS PROJETO */}
          <div className="border border-white/20 rounded-md overflow-hidden flex-1 min-w-[300px]">
            <div className="bg-white/10 px-6 py-2 text-center">
              <span className="text-white font-bold text-sm tracking-wide uppercase">{t("actionPlan.statusBreakdown", "Status Projeto")}</span>
            </div>
            <div className="px-4 py-3">
              <table className="w-full text-center">
                <thead>
                  <tr>
                    {statuses?.filter((s) => (statusBreakdown[s.id] || 0) > 0).map((s) => (
                      <th key={s.id} className="px-3 py-1 text-white/80 text-sm font-bold">
                        <span className="flex items-center justify-center gap-1.5">
                          <span className="inline-block h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                          {s.name}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                   {statuses?.filter((s) => (statusBreakdown[s.id] || 0) > 0).map((s) => {
                      const count = statusBreakdown[s.id] || 0;
                      const pct = totalActions > 0 ? ((count / totalActions) * 100).toFixed(2) : "0,00";
                      return (
                        <td key={s.id} className="px-3 py-1 text-white text-sm">
                          {count} ({pct}%)
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* STATUS CONCLUSÃO */}
          <div className="border border-white/20 rounded-md overflow-hidden min-w-[350px]">
            <div className="bg-white/10 px-6 py-2 text-center">
              <span className="text-white font-bold text-sm tracking-wide uppercase">{t("actionPlan.completionStatus", "Status Conclusão")}</span>
            </div>
            <div className="px-4 py-3">
              <table className="w-full text-center">
                <thead>
                  <tr>
                    <th className="px-3 py-1 text-white/80 text-sm font-bold">{t("actionPlan.pendingCompletion", "Pend. Data Conclusão")}</th>
                    <th className="px-3 py-1 text-white/80 text-sm font-bold">{t("actionPlan.onTime", "Dentro do Prazo")}</th>
                    <th className="px-3 py-1 text-white/80 text-sm font-bold">{t("actionPlan.late", "Fora do Prazo")}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="px-3 py-1 text-white text-sm">
                      {pendingCompletionCount} ({totalActions > 0 ? ((pendingCompletionCount / totalActions) * 100).toFixed(2) : "0,00"}%)
                    </td>
                    <td className="px-3 py-1 text-white text-sm">
                      {onTimeCount} ({totalActions > 0 ? ((onTimeCount / totalActions) * 100).toFixed(2) : "0,00"}%)
                    </td>
                    <td className="px-3 py-1 text-white text-sm">
                      {lateCount} ({totalActions > 0 ? ((lateCount / totalActions) * 100).toFixed(2) : "0,00"}%)
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Donut Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
          {/* Status Projeto Donut */}
          <div className="border border-white/20 rounded-md overflow-hidden">
            <div className="bg-white/10 px-6 py-2 text-center">
              <span className="text-white font-bold text-sm tracking-wide uppercase">{t("actionPlan.statusBreakdown", "Status Projeto")}</span>
            </div>
            <div className="flex justify-center py-2">
              <StatusDonutChart
                data={statuses?.filter((s) => (statusBreakdown[s.id] || 0) > 0).map((s) => ({
                  name: s.name,
                  value: statusBreakdown[s.id] || 0,
                  color: s.color,
                })) || []}
                total={totalActions}
              />
            </div>
          </div>

          {/* Status Conclusão Donut */}
          <div className="border border-white/20 rounded-md overflow-hidden">
            <div className="bg-white/10 px-6 py-2 text-center">
              <span className="text-white font-bold text-sm tracking-wide uppercase">{t("actionPlan.completionStatus", "Status Conclusão")}</span>
            </div>
            <div className="flex justify-center py-2">
              <StatusDonutChart
                data={[
                  { name: t("actionPlan.pendingCompletion", "Pend. Data Conclusão"), value: pendingCompletionCount, color: "#f4a261" },
                  { name: t("actionPlan.onTime", "Dentro do Prazo"), value: onTimeCount, color: "#3b82f6" },
                  { name: t("actionPlan.late", "Fora do Prazo"), value: lateCount, color: "#ef4444" },
                ].filter((d) => d.value > 0)}
                total={totalActions}
              />
            </div>
          </div>
        </div>

        {/* Bar Charts side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mt-3">
          <div className="border border-white/20 rounded-md overflow-hidden">
            <div className="bg-white/10 px-4 py-1.5 text-center">
              <span className="text-white font-bold text-xs tracking-wide uppercase">
                {t("actionPlan.chartByThemeStatus", "Total de Projetos por Área e Status")}
              </span>
            </div>
            <div className="px-2 py-2">
              <ThemeStatusChart filtered={filtered} statuses={statuses} />
            </div>
          </div>

          <div className="border border-white/20 rounded-md overflow-hidden">
            <div className="bg-white/10 px-4 py-1.5 text-center">
              <span className="text-white font-bold text-xs tracking-wide uppercase">
                {t("actionPlan.chartByClientStatus", "Total de Projetos por Cliente e Status")}
              </span>
            </div>
            <div className="px-2 py-2">
              <ClientStatusChart filtered={filtered} statuses={statuses} />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ThemeStatusChart({ filtered, statuses }: { filtered: any[]; statuses: any[] | undefined }) {
  const chartData = useMemo(() => {
    if (!filtered.length || !statuses?.length) return [];

    const themeMap: Record<string, Record<string, number>> = {};
    filtered.forEach((p) => {
      const theme = p.theme || "N/A";
      const statusId = p.status_id;
      if (!themeMap[theme]) themeMap[theme] = {};
      themeMap[theme][statusId] = (themeMap[theme][statusId] || 0) + 1;
    });

    return Object.entries(themeMap)
      .map(([theme, counts]) => {
        const row: any = { theme };
        statuses.forEach((s) => {
          row[s.id] = counts[s.id] || 0;
        });
        return row;
      })
      .sort((a, b) => {
        const totalA = statuses.reduce((sum, s) => sum + (a[s.id] || 0), 0);
        const totalB = statuses.reduce((sum, s) => sum + (b[s.id] || 0), 0);
        return totalB - totalA;
      });
  }, [filtered, statuses]);

  // Only show statuses that have at least 1 entry across all themes
  const activeStatuses = useMemo(() => {
    if (!statuses) return [];
    return statuses.filter((s) => chartData.some((row) => row[s.id] > 0));
  }, [statuses, chartData]);

  if (!chartData.length || !activeStatuses.length) {
    return <p className="text-white/50 text-center py-8">Sem dados</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={chartData} layout="horizontal" margin={{ top: 15, right: 20, left: 5, bottom: 50 }}>
        <XAxis
          dataKey="theme"
          tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 9 }}
          angle={-30}
          textAnchor="end"
          height={60}
          interval={0}
        />
        <YAxis tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 10 }} allowDecimals={false} />
        <Tooltip
          contentStyle={{ backgroundColor: "hsl(210,70%,15%)", border: "1px solid rgba(255,255,255,0.2)", color: "white" }}
          labelStyle={{ color: "white", fontWeight: "bold" }}
        />
        <Legend
          wrapperStyle={{ paddingTop: 10 }}
          formatter={(value: string) => {
            const status = activeStatuses.find((s) => s.id === value);
            return <span style={{ color: "rgba(255,255,255,0.8)" }}>{status?.name || value}</span>;
          }}
        />
        {activeStatuses.map((s) => (
          <Bar key={s.id} dataKey={s.id} name={s.id} fill={s.color} radius={[3, 3, 0, 0]}>
            <LabelList dataKey={s.id} position="top" fill="rgba(255,255,255,0.9)" fontSize={9} formatter={(v: number) => v > 0 ? v : ""} />
          </Bar>
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

function ClientStatusChart({ filtered, statuses }: { filtered: any[]; statuses: any[] | undefined }) {
  const chartData = useMemo(() => {
    if (!filtered.length || !statuses?.length) return [];

    const clientMap: Record<string, Record<string, number>> = {};
    filtered.forEach((p) => {
      const client = p.client_name || "N/A";
      const statusId = p.status_id;
      if (!clientMap[client]) clientMap[client] = {};
      clientMap[client][statusId] = (clientMap[client][statusId] || 0) + 1;
    });

    return Object.entries(clientMap)
      .map(([client, counts]) => {
        const row: any = { client };
        let total = 0;
        statuses.forEach((s) => {
          row[s.id] = counts[s.id] || 0;
          total += row[s.id];
        });
        row._total = total;
        return row;
      })
      .sort((a, b) => b._total - a._total);
  }, [filtered, statuses]);

  const activeStatuses = useMemo(() => {
    if (!statuses) return [];
    return statuses.filter((s) => chartData.some((row) => row[s.id] > 0));
  }, [statuses, chartData]);

  if (!chartData.length || !activeStatuses.length) {
    return <p className="text-white/50 text-center py-8">Sem dados</p>;
  }

  const CustomTotalLabel = (props: any) => {
    const { x, y, width, index } = props;
    const total = chartData[index]?._total;
    if (!total) return null;
    return (
      <text x={x + width / 2} y={y - 6} textAnchor="middle" fill="rgba(255,255,255,0.9)" fontSize={11} fontWeight="bold">
        {total}
      </text>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={chartData} layout="horizontal" margin={{ top: 25, right: 20, left: 5, bottom: 60 }}>
        <XAxis
          dataKey="client"
          tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 10 }}
          angle={-35}
          textAnchor="end"
          height={100}
          interval={0}
        />
        <YAxis tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 12 }} allowDecimals={false} />
        <Tooltip
          contentStyle={{ backgroundColor: "hsl(210,70%,15%)", border: "1px solid rgba(255,255,255,0.2)", color: "white" }}
          labelStyle={{ color: "white", fontWeight: "bold" }}
        />
        <Legend
          wrapperStyle={{ paddingTop: 10 }}
          formatter={(value: string) => {
            const status = activeStatuses.find((s) => s.id === value);
            return <span style={{ color: "rgba(255,255,255,0.8)" }}>{status?.name || value}</span>;
          }}
        />
        {activeStatuses.map((s, i) => (
          <Bar key={s.id} dataKey={s.id} name={s.id} fill={s.color} stackId="stack" radius={i === activeStatuses.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}>
            <LabelList dataKey={s.id} position="inside" fill="white" fontSize={10} formatter={(v: number) => v > 0 ? v : ""} />
            {i === activeStatuses.length - 1 && (
              <LabelList content={<CustomTotalLabel />} />
            )}
          </Bar>
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

const RADIAN = Math.PI / 180;

function StatusDonutChart({ data, total }: { data: { name: string; value: number; color: string }[]; total: number }) {
  if (!data.length) {
    return <p className="text-white/50 text-center py-8">Sem dados</p>;
  }

  const renderCustomLabel = ({ cx, cy, midAngle, outerRadius, value, percent }: any) => {
    const radius = outerRadius + 25;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    const pct = (percent * 100).toFixed(2);
    return (
      <text x={x} y={y} fill="rgba(255,255,255,0.9)" textAnchor={x > cx ? "start" : "end"} dominantBaseline="central" fontSize={12} fontWeight="bold">
        {value} ({pct}%)
      </text>
    );
  };

  return (
    <ResponsiveContainer width={350} height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="45%"
          innerRadius={70}
          outerRadius={100}
          dataKey="value"
          label={renderCustomLabel}
          labelLine={{ stroke: "rgba(255,255,255,0.3)", strokeWidth: 1 }}
          strokeWidth={2}
          stroke="hsl(210,70%,12%)"
        >
          {data.map((entry, index) => (
            <Cell key={index} fill={entry.color} />
          ))}
        </Pie>
        <Legend
          verticalAlign="bottom"
          formatter={(value: string, entry: any) => (
            <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 12 }}>
              {data[entry.index]?.name || value}
            </span>
          )}
          payload={data.map((d) => ({ value: d.name, type: "circle" as const, color: d.color }))}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
