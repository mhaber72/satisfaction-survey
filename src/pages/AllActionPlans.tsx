import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pencil, Search, BarChart3 } from "lucide-react";
import { format } from "date-fns";
import ActionPlanForm from "@/components/ActionPlanForm";
import ActionPlanDashboard from "@/components/ActionPlanDashboard";

const AllActionPlans = () => {
  const { t } = useTranslation();
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [searchText, setSearchText] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterYear, setFilterYear] = useState<string>("all");

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

  const filtered = plans?.filter((p) => {
    if (filterStatus !== "all" && p.status_id !== filterStatus) return false;
    if (filterYear !== "all" && String(p.survey_year) !== filterYear) return false;
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
      <h1 className="text-2xl font-bold">{t("actionPlan.listTitle")}</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("actionPlan.searchPlaceholder")}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t("actionPlan.status")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("filters.all")}</SelectItem>
            {statuses?.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                <span className="flex items-center gap-2">
                  <span className="inline-block h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                  {s.name}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterYear} onValueChange={setFilterYear}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder={t("filters.year")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("filters.all")}</SelectItem>
            {years.map((y) => (
              <SelectItem key={y} value={String(y)}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
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
                <tr key={plan.id} className="border-b hover:bg-muted/50">
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
          themeComment={editingPlan.theme_comment}
          questionComment={editingPlan.question_comment}
          existingPlan={editingPlan}
        />
      )}
    </div>
  );
};

export default AllActionPlans;
