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
                    {statuses?.map((s) => (
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
                    {statuses?.map((s) => {
                      const count = statusBreakdown[s.id] || 0;
                      const pct = totalActions > 0 ? ((count / totalActions) * 100).toFixed(2) : "0,00";
                      return (
                        <td key={s.id} className="px-3 py-1 text-white text-sm">
                          {pct}%
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* STATUS CONCLUSÃO */}
          <div className="border border-white/20 rounded-md overflow-hidden min-w-[250px]">
            <div className="bg-white/10 px-6 py-2 text-center">
              <span className="text-white font-bold text-sm tracking-wide uppercase">{t("actionPlan.completionStatus", "Status Conclusão")}</span>
            </div>
            <div className="px-4 py-3">
              <table className="w-full text-center">
                <thead>
                  <tr>
                    <th className="px-3 py-1 text-white/80 text-sm font-bold">{t("actionPlan.inProgress", "Em Andamento")}</th>
                    <th className="px-3 py-1 text-white/80 text-sm font-bold">{t("actionPlan.completed", "Concluídas")}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="px-3 py-1 text-white text-sm">
                      {totalActions > 0 ? ((inProgressCount / totalActions) * 100).toFixed(2) : "0,00"}%
                    </td>
                    <td className="px-3 py-1 text-white text-sm">
                      {totalActions > 0 ? ((terminalCount / totalActions) * 100).toFixed(2) : "0,00"}%
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
