import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Pencil, Search, BarChart3, Eye, Upload } from "lucide-react";
import { format } from "date-fns";
import ActionPlanForm from "@/components/ActionPlanForm";
import ActionPlanDashboard from "@/components/ActionPlanDashboard";
import ActionPlanImport from "@/components/ActionPlanImport";
import MultiSelectFilter from "@/components/MultiSelectFilter";

const AllActionPlans = () => {
  const { t } = useTranslation();
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [viewingPlan, setViewingPlan] = useState<any>(null);
  const [showDashboard, setShowDashboard] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedYears, setSelectedYears] = useState<string[]>([]);
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [selectedThemes, setSelectedThemes] = useState<string[]>([]);
  const [selectedResponsibles, setSelectedResponsibles] = useState<string[]>([]);

  const { data: plans, isLoading } = useQuery({
    queryKey: ["all_action_plans"],
    queryFn: async () => {
      // Auto-update statuses based on date logic before fetching
      await supabase.rpc("auto_update_action_plan_statuses");
      const { data, error } = await supabase
        .from("action_plans")
        .select("*, contract_managers(name), regional_managers(name), directories(name), action_statuses(name, color), action_responsibles(first_name, last_name), pesquisa_satisfacao(question)")
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
  const themes = [...new Set(plans?.map((p) => p.theme).filter(Boolean) as string[])].sort();
  const responsibles = [...new Set(plans?.map((p) => {
    const r = p.action_responsibles as any;
    return r ? `${r.first_name} ${r.last_name}` : null;
  }).filter(Boolean) as string[])].sort();

  const filtered = plans?.filter((p) => {
    if (selectedStatuses.length > 0) {
      const statusName = (p.action_statuses as any)?.name;
      if (!statusName || !selectedStatuses.includes(statusName)) return false;
    }
    if (selectedYears.length > 0 && !selectedYears.includes(String(p.survey_year))) return false;
    if (selectedClients.length > 0 && (!p.client_name || !selectedClients.includes(p.client_name))) return false;
    if (selectedThemes.length > 0 && (!p.theme || !selectedThemes.includes(p.theme))) return false;
    if (selectedResponsibles.length > 0) {
      const r = p.action_responsibles as any;
      const rName = r ? `${r.first_name} ${r.last_name}` : null;
      if (!rName || !selectedResponsibles.includes(rName)) return false;
    }
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

  const fmtDate = (d: string | null) => {
    if (!d) return "—";
    // Parse date-only strings (YYYY-MM-DD) without timezone shift
    const parts = d.split("-");
    if (parts.length === 3) {
      return format(new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])), "dd/MM/yyyy");
    }
    return format(new Date(d), "dd/MM/yyyy");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("actionPlan.listTitle")}</h1>
        <div className="flex gap-2 mt-5 mr-10">
          <Button variant="outline" size="lg" onClick={() => setShowImport(true)} title={t("importActions.title")} className="border-green-400/50 bg-green-500/10 hover:bg-green-500/20 text-green-400 gap-2 px-4">
            <Upload className="h-6 w-6" />
          </Button>
          <Button variant="outline" size="lg" onClick={() => setShowDashboard(true)} title="Dashboard" className="border-blue-400/50 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 gap-2 px-4">
            <BarChart3 className="h-7 w-7" />
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end">
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
          <label className="text-xs font-medium text-muted-foreground mb-1 block">{t("actionPlan.theme", "Tema")}</label>
          <MultiSelectFilter
            label={t("actionPlan.theme", "Tema")}
            options={themes}
            selected={selectedThemes}
            onChange={setSelectedThemes}
            width="w-[200px]"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">{t("actionPlan.responsible", "Responsável")}</label>
          <MultiSelectFilter
            label={t("actionPlan.responsible", "Responsável")}
            options={responsibles}
            selected={selectedResponsibles}
            onChange={setSelectedResponsibles}
            width="w-[200px]"
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
                <th className="p-3 text-left font-medium text-muted-foreground">{t("actionPlan.client")}</th>
                <th className="p-3 text-left font-medium text-muted-foreground">{t("actionPlan.theme")}</th>
                <th className="p-3 text-left font-medium text-muted-foreground">{t("actionPlan.actionName")}</th>
                <th className="p-3 text-left font-medium text-muted-foreground">{t("actionPlan.status")}</th>
                <th className="p-3 text-left font-medium text-muted-foreground">{t("actionPlan.responsible")}</th>
                <th className="p-3 text-left font-medium text-muted-foreground">{t("actionPlan.startDate")}</th>
                <th className="p-3 text-left font-medium text-muted-foreground">{t("actionPlan.endDate")}</th>
                <th className="p-3 text-left font-medium text-muted-foreground">{t("actionPlan.newEndDate")}</th>
                <th className="p-3 text-left font-medium text-muted-foreground">{t("actionPlan.completionDate")}</th>
                <th className="p-3 text-right font-medium text-muted-foreground">{t("adminLookup.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((plan) => (
                <tr key={plan.id} className="border-b hover:bg-muted/50 cursor-pointer" onClick={() => setViewingPlan(plan)}>
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
                  <td className="p-3">{(() => { const r = plan.action_responsibles as any; return r ? `${r.first_name} ${r.last_name}` : "—"; })()}</td>
                  <td className="p-3">{fmtDate(plan.start_date)}</td>
                  <td className="p-3">{fmtDate(plan.end_date)}</td>
                  <td className="p-3">{fmtDate(plan.new_end_date)}</td>
                  <td className="p-3">{fmtDate(plan.completion_date)}</td>
                  <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                    {(() => {
                      const statusName = ((plan.action_statuses as any)?.name || "").toLowerCase();
                      const isTerminal = statusName.includes("conclu") || statusName.includes("cancel");
                      return !isTerminal ? (
                        <Button size="icon" variant="ghost" onClick={() => setEditingPlan(plan)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      ) : null;
                    })()}
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
          question={(editingPlan.pesquisa_satisfacao as any)?.question ?? null}
          themeComment={editingPlan.theme_comment}
          questionComment={editingPlan.question_comment}
          existingPlan={editingPlan}
        />
      )}

      <ActionPlanImport open={showImport} onOpenChange={setShowImport} />

      <ActionPlanDashboard
        open={showDashboard}
        onOpenChange={setShowDashboard}
        plans={plans}
        statuses={statuses}
      />

      {/* Detail Dialog */}
      <Dialog open={!!viewingPlan} onOpenChange={(o) => !o && setViewingPlan(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {viewingPlan?.action_statuses && (
                <span
                  className="inline-block h-3.5 w-3.5 rounded-full shrink-0"
                  style={{ backgroundColor: (viewingPlan.action_statuses as any)?.color || "#6b7280" }}
                />
              )}
              {viewingPlan?.action_name}
            </DialogTitle>
          </DialogHeader>
          {viewingPlan && (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <DetailField label={t("actionPlan.status")} value={
                <span className="flex items-center gap-2">
                  <span className="inline-block h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: (viewingPlan.action_statuses as any)?.color || "#6b7280" }} />
                  {(viewingPlan.action_statuses as any)?.name ?? "—"}
                </span>
              } />
              <DetailField label={t("actionPlan.surveyYear")} value={viewingPlan.survey_year ?? "—"} />
              <DetailField label={t("actionPlan.client")} value={viewingPlan.client_name ?? "—"} />
              <DetailField label={t("actionPlan.theme")} value={viewingPlan.theme ?? "—"} />
              <div className="col-span-2">
                <DetailField label={t("dashboard.question")} value={(viewingPlan.pesquisa_satisfacao as any)?.question ?? "—"} />
              </div>
              <DetailField label={t("actionPlan.contractManager")} value={(viewingPlan.contract_managers as any)?.name ?? "—"} />
              <DetailField label={t("actionPlan.regionalManager", "Gestor Regional")} value={(viewingPlan.regional_managers as any)?.name ?? "—"} />
              <DetailField label={t("actionPlan.directory", "Diretoria")} value={(viewingPlan.directories as any)?.name ?? "—"} />
              <DetailField label={t("actionPlan.responsible")} value={
                viewingPlan.action_responsibles
                  ? `${(viewingPlan.action_responsibles as any)?.first_name} ${(viewingPlan.action_responsibles as any)?.last_name}`
                  : "—"
              } />
              <DetailField label={t("actionPlan.startDate")} value={fmtDate(viewingPlan.start_date)} />
              <DetailField label={t("actionPlan.endDate")} value={fmtDate(viewingPlan.end_date)} />
              <DetailField label={t("actionPlan.newEndDate", "Nova Data Fim")} value={fmtDate(viewingPlan.new_end_date)} />
              <DetailField label={t("actionPlan.completionDate", "Data Conclusão")} value={fmtDate(viewingPlan.completion_date)} />
              <div className="col-span-2">
                <DetailField label={t("actionPlan.actionDescription", "Descrição da Ação")} value={viewingPlan.action_description || "—"} />
              </div>
              {viewingPlan.theme_comment && (
                <div className="col-span-2">
                  <DetailField label={t("actionPlan.themeComment", "Comentário do Tema")} value={viewingPlan.theme_comment} />
                </div>
              )}
              {viewingPlan.question_comment && (
                <div className="col-span-2">
                  <DetailField label={t("actionPlan.questionComment", "Comentário da Questão")} value={viewingPlan.question_comment} />
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

function DetailField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground mb-0.5">{label}</p>
      <div className="text-sm text-foreground">{value}</div>
    </div>
  );
}

export default AllActionPlans;
