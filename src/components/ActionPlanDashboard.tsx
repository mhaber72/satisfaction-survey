import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useTranslation } from "react-i18next";
import { ClipboardList, ListChecks, Clock, CheckCircle2 } from "lucide-react";

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

  const completionRate = totalActions > 0 ? Math.round((terminalCount / totalActions) * 100) : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-white/10 bg-[hsl(210,70%,12%)] text-white max-w-[95vw] w-[1400px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white text-xl">{t("actionPlan.dashboard", "Dashboard de Planos de Ação")}</DialogTitle>
        </DialogHeader>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
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

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Actions */}
          <Card className="border-white/10 bg-white/5 backdrop-blur-md">
            <CardContent className="flex flex-col items-center justify-center py-8">
              <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full border-2 border-blue-400/50">
                <ClipboardList className="h-8 w-8 text-blue-400" />
              </div>
              <p className="text-3xl font-bold text-white">{totalActions}</p>
              <p className="text-sm text-white/50 mt-1">{t("actionPlan.totalActions", "Total de Ações")}</p>
            </CardContent>
          </Card>

          {/* In Progress */}
          <Card className="border-white/10 bg-white/5 backdrop-blur-md">
            <CardContent className="flex flex-col items-center justify-center py-8">
              <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full border-2 border-amber-400/50">
                <Clock className="h-8 w-8 text-amber-400" />
              </div>
              <p className="text-3xl font-bold text-white">{inProgressCount}</p>
              <p className="text-sm text-white/50 mt-1">{t("actionPlan.inProgress", "Em Andamento")}</p>
            </CardContent>
          </Card>

          {/* Completed/Cancelled */}
          <Card className="border-white/10 bg-white/5 backdrop-blur-md">
            <CardContent className="flex flex-col items-center justify-center py-8">
              <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full border-2 border-green-400/50">
                <CheckCircle2 className="h-8 w-8 text-green-400" />
              </div>
              <p className="text-3xl font-bold text-white">{terminalCount}</p>
              <p className="text-sm text-white/50 mt-1">{t("actionPlan.completed", "Concluídas/Canceladas")}</p>
            </CardContent>
          </Card>

          {/* Completion Rate */}
          <Card className="border-white/10 bg-white/5 backdrop-blur-md">
            <CardContent className="flex flex-col items-center justify-center py-8">
              <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full border-2 border-purple-400/50">
                <ListChecks className="h-8 w-8 text-purple-400" />
              </div>
              <p className="text-3xl font-bold text-white">{completionRate}%</p>
              <p className="text-sm text-white/50 mt-1">{t("actionPlan.completionRate", "Taxa de Conclusão")}</p>
            </CardContent>
          </Card>
        </div>

        {/* Status Breakdown */}
        <Card className="border-white/10 bg-white/5 backdrop-blur-md mt-4">
          <CardContent className="py-6">
            <h3 className="text-white font-semibold mb-4">{t("actionPlan.statusBreakdown", "Distribuição por Status")}</h3>
            <div className="space-y-3">
              {statuses?.map((s) => {
                const count = statusBreakdown[s.id] || 0;
                const pct = totalActions > 0 ? (count / totalActions) * 100 : 0;
                return (
                  <div key={s.id} className="flex items-center gap-3">
                    <span className="inline-block h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                    <span className="text-white/80 text-sm min-w-[140px]">{s.name}</span>
                    <div className="flex-1 h-5 rounded bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded transition-all"
                        style={{ width: `${pct}%`, backgroundColor: s.color }}
                      />
                    </div>
                    <span className="text-white font-semibold text-sm min-w-[40px] text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
