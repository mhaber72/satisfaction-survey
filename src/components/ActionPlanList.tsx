import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { format } from "date-fns";
import ActionPlanForm from "./ActionPlanForm";

interface ActionPlanListProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pesquisaId: number;
  surveyYear?: number | null;
  clientName?: string | null;
  theme?: string | null;
  question?: string | null;
  themeComment?: string | null;
  questionComment?: string | null;
}

const ActionPlanList = ({
  open, onOpenChange, pesquisaId,
  surveyYear, clientName, theme, question, themeComment, questionComment,
}: ActionPlanListProps) => {
  const { t } = useTranslation();
  const [editingPlan, setEditingPlan] = useState<any>(null);

  const { data: plans, isLoading } = useQuery({
    queryKey: ["action_plans", pesquisaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("action_plans")
        .select("*, contract_managers(name), regional_managers(name), directories(name), action_statuses(name, color)")
        .eq("pesquisa_id", pesquisaId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: open && !!pesquisaId,
  });

  const fmtDate = (d: string | null) => d ? format(new Date(d), "dd/MM/yyyy") : "—";

  return (
    <>
      <Dialog open={open && !editingPlan} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("actionPlan.listTitle")}</DialogTitle>
          </DialogHeader>
          {isLoading ? (
            <p className="text-muted-foreground">{t("adminLookup.loading")}</p>
          ) : !plans?.length ? (
            <p className="text-muted-foreground py-8 text-center">{t("actionPlan.noActions")}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="p-3 text-left font-medium text-muted-foreground">{t("actionPlan.actionName")}</th>
                    <th className="p-3 text-left font-medium text-muted-foreground">{t("actionPlan.status")}</th>
                    <th className="p-3 text-left font-medium text-muted-foreground">{t("actionPlan.contractManager")}</th>
                    <th className="p-3 text-left font-medium text-muted-foreground">{t("actionPlan.startDate")}</th>
                    <th className="p-3 text-left font-medium text-muted-foreground">{t("actionPlan.endDate")}</th>
                    <th className="p-3 text-right font-medium text-muted-foreground">{t("adminLookup.actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {plans.map((plan) => (
                    <tr key={plan.id} className="border-b hover:bg-muted/50">
                      <td className="p-3">{plan.action_name}</td>
                      <td className="p-3">
                        <span className="flex items-center gap-2">
                          <span className="inline-block h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: (plan.action_statuses as any)?.color || '#6b7280' }} />
                          {(plan.action_statuses as any)?.name ?? "—"}
                        </span>
                      </td>
                      <td className="p-3">{(plan.contract_managers as any)?.name ?? "—"}</td>
                      <td className="p-3">{fmtDate(plan.start_date)}</td>
                      <td className="p-3">{fmtDate(plan.end_date)}</td>
                      <td className="p-3 text-right">
                        <Button size="icon" variant="ghost" onClick={() => setEditingPlan(plan)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {editingPlan && (
        <ActionPlanForm
          open={!!editingPlan}
          onOpenChange={(o) => !o && setEditingPlan(null)}
          pesquisaId={pesquisaId}
          surveyYear={surveyYear}
          clientName={clientName}
          theme={theme}
          themeComment={themeComment}
          questionComment={questionComment}
          existingPlan={editingPlan}
        />
      )}
    </>
  );
};

export default ActionPlanList;
