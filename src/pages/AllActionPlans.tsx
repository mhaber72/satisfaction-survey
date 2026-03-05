import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Pencil, Search, BarChart3, Eye } from "lucide-react";
import { format } from "date-fns";
import ActionPlanForm from "@/components/ActionPlanForm";
import ActionPlanDashboard from "@/components/ActionPlanDashboard";
import MultiSelectFilter from "@/components/MultiSelectFilter";

const AllActionPlans = () => {
  const { t } = useTranslation();
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [viewingPlan, setViewingPlan] = useState<any>(null);
  const [showDashboard, setShowDashboard] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedYears, setSelectedYears] = useState<string[]>([]);
  const [selectedClients, setSelectedClients] = useState<string[]>([]);

  const { data: plans, isLoading } = useQuery({
    queryKey: ["all_action_plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("action_plans")
        .select("*, contract_managers(name), regional_managers(name), directories(name), action_statuses(name, color)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: statuses } = useQuery({
    queryKey: ["action_statuses"],
    queryFn: async () => {
      const { data } = await supabase.from("action_statuses").select("*").order("name");
      return data || [];
    },
  });

  const years = [...new Set(plans?.map((p) => p.survey_year).filter(Boolean))].sort((a, b) => (b ?? 0) - (a ?? 0));
  const clients = [...new Set(plans?.map((p) => p.client_name).filter(Boolean) as string[])].sort();
  const statusOptions = statuses?.map((s) => s.name) || [];

  const filtered = plans?.filter((p) => {
    if (selectedStatuses.length > 0) {
      const statusName = (p.action_statuses as any)?.name;
      if (!statusName || !selectedStatuses.includes(statusName)) return false;
    }
    if (selectedYears.length > 0 && !selectedYears.includes(String(p.survey_year))) return false;
    if (selectedClients.length > 0 && (!p.client_name || !selectedClients.includes(p.client_name))) return false;
    if (searchText) {
      const s = searchText.toLowerCase();
      const match =
        p.action_name?.toLowerCase().includes(s) ||
        p.client_name?.toLowerCase().includes(s) ||
        p.theme?.toLowerCase().includes(s) ||
        (p.contract_managers as any)?.name?.toLowerCase().includes(s);
      if (!match) return false;
    }
    return true;
  });

  const fmtDate = (d: string | null) => (d ? format(new Date(d), "dd/MM/yyyy") : "—");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("actionPlan.listTitle")}</h1>
        <Button variant="outline" size="lg" onClick={() => setShowDashboard(true)} title="Dashboard" className="border-blue-400/50 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 gap-2 px-4 mt-5 mr-10">
          <BarChart3 className="h-7 w-7" />
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="relative flex-1 min-w-[200px]">
          <label className="text-xs font-medium text-muted-foreground mb-1 block">{t("actionPlan.searchPlaceholder", "Buscar")}</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("actionPlan.searchPlaceholder")}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">{t("actionPlan.client", "Cliente")}</label>
          <MultiSelectFilter
            label={t("actionPlan.client", "Cliente")}
            options={clients}
            selected={selectedClients}
            onChange={setSelectedClients}
            width="w-[200px]"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">{t("actionPlan.status", "Status")}</label>
          <MultiSelectFilter
            label={t("actionPlan.status", "Status")}
            options={statusOptions}
            selected={selectedStatuses}
            onChange={setSelectedStatuses}
            width="w-[180px]"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">{t("filters.year", "Ano")}</label>
          <MultiSelectFilter
            label={t("filters.year", "Ano")}
            options={years.map(String)}
            selected={selectedYears}
            onChange={setSelectedYears}
            width="w-[120px]"
          />
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <p className="text-muted-foreground">{t("adminLookup.loading")}</p>
      ) : !filtered?.length ? (
        <p className="text-muted-foreground py-8 text-center">{t("actionPlan.noActions")}</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="p-3 text-left font-medium text-muted-foreground">{t("actionPlan.surveyYear")}</th>
                <th className="p-3 text-left font-medium text-muted-foreground">{t("actionPlan.client")}</th>
                <th className="p-3 text-left font-medium text-muted-foreground">{t("actionPlan.theme")}</th>
                <th className="p-3 text-left font-medium text-muted-foreground">{t("actionPlan.actionName")}</th>
                <th className="p-3 text-left font-medium text-muted-foreground">{t("actionPlan.status")}</th>
                <th className="p-3 text-left font-medium text-muted-foreground">{t("actionPlan.contractManager")}</th>
                <th className="p-3 text-left font-medium text-muted-foreground">{t("actionPlan.startDate")}</th>
                <th className="p-3 text-left font-medium text-muted-foreground">{t("actionPlan.endDate")}</th>
                <th className="p-3 text-right font-medium text-muted-foreground">{t("adminLookup.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((plan) => (
                <tr key={plan.id} className="border-b hover:bg-muted/50 cursor-pointer" onClick={() => setViewingPlan(plan)}>
                  <td className="p-3">{plan.survey_year ?? "—"}</td>
                  <td className="p-3">{plan.client_name ?? "—"}</td>
                  <td className="p-3 max-w-[150px] truncate">{plan.theme ?? "—"}</td>
                  <td className="p-3 max-w-[200px] truncate">{plan.action_name}</td>
                  <td className="p-3">
                    <span className="flex items-center gap-2">
                      <span
                        className="inline-block h-3 w-3 rounded-full shrink-0"
                        style={{ backgroundColor: (plan.action_statuses as any)?.color || "#6b7280" }}
                      />
                      {(plan.action_statuses as any)?.name ?? "—"}
                    </span>
                  </td>
                  <td className="p-3">{(plan.contract_managers as any)?.name ?? "—"}</td>
                  <td className="p-3">{fmtDate(plan.start_date)}</td>
                  <td className="p-3">{fmtDate(plan.end_date)}</td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button size="icon" variant="ghost" onClick={() => setViewingPlan(plan)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      {(() => {
                        const statusName = ((plan.action_statuses as any)?.name || "").toLowerCase();
                        const isTerminal = statusName.includes("conclu") || statusName.includes("cancel");
                        return !isTerminal ? (
                          <Button size="icon" variant="ghost" onClick={() => setEditingPlan(plan)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                        ) : null;
                      })()}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editingPlan && (
        <ActionPlanForm
          open={!!editingPlan}
          onOpenChange={(o) => !o && setEditingPlan(null)}
          pesquisaId={editingPlan.pesquisa_id}
          surveyYear={editingPlan.survey_year}
          clientName={editingPlan.client_name}
          theme={editingPlan.theme}
          themeComment={editingPlan.theme_comment}
          questionComment={editingPlan.question_comment}
          existingPlan={editingPlan}
        />
      )}

      <ActionPlanDashboard
        open={showDashboard}
        onOpenChange={setShowDashboard}
        plans={plans}
        statuses={statuses}
      />
    </div>
  );
};

export default AllActionPlans;
