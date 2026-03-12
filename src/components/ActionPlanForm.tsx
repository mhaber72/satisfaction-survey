import { useState, useEffect } from "react";

const parseDateLocal = (d: string): Date => {
  const parts = d.split("-");
  if (parts.length === 3) {
    return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  }
  return new Date(d);
};
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { useTranslatedQuestions } from "@/hooks/useTranslatedQuestions";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parse } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface ActionPlanFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pesquisaId: number;
  surveyYear?: number | null;
  clientName?: string | null;
  theme?: string | null;
  question?: string | null;
  themeComment?: string | null;
  questionComment?: string | null;
  existingPlan?: any;
}

const ActionPlanForm = ({
  open, onOpenChange, pesquisaId,
  surveyYear, clientName, theme, question, themeComment, questionComment,
  existingPlan,
}: ActionPlanFormProps) => {
  const { t } = useTranslation();
  const { translateQuestion } = useTranslatedQuestions();
  const qc = useQueryClient();
  const { user } = useAuth();

  const [form, setForm] = useState({
    contract_manager_id: "",
    regional_manager_id: "",
    directory_id: "",
    responsible_id: "",
    action_name: "",
    action_description: "",
    observations: "",
    start_date: null as Date | null,
    end_date: null as Date | null,
    new_end_date: null as Date | null,
    completion_date: null as Date | null,
    status_id: "",
  });

  useEffect(() => {
    if (existingPlan) {
      setForm({
        contract_manager_id: existingPlan.contract_manager_id || "",
        regional_manager_id: existingPlan.regional_manager_id || "",
        directory_id: existingPlan.directory_id || "",
        responsible_id: existingPlan.responsible_id || "",
        action_name: existingPlan.action_name || "",
        action_description: existingPlan.action_description || "",
        observations: existingPlan.observations || "",
        start_date: existingPlan.start_date ? parseDateLocal(existingPlan.start_date) : null,
        end_date: existingPlan.end_date ? parseDateLocal(existingPlan.end_date) : null,
        new_end_date: existingPlan.new_end_date ? parseDateLocal(existingPlan.new_end_date) : null,
        completion_date: existingPlan.completion_date ? parseDateLocal(existingPlan.completion_date) : null,
        status_id: existingPlan.status_id || "",
      });
    } else {
      setForm({
        contract_manager_id: "",
        regional_manager_id: "",
        directory_id: "",
        responsible_id: "",
        action_name: "",
        action_description: "",
        start_date: null,
        end_date: null,
        new_end_date: null,
        completion_date: null,
        status_id: "",
      });
    }
  }, [existingPlan, open]);

  const { data: contractManagers } = useQuery({
    queryKey: ["contract_managers"],
    queryFn: async () => {
      const { data } = await supabase.from("contract_managers").select("*").order("name");
      return data || [];
    },
  });

  const { data: regionalManagers } = useQuery({
    queryKey: ["regional_managers"],
    queryFn: async () => {
      const { data } = await supabase.from("regional_managers").select("*").order("name");
      return data || [];
    },
  });

  const { data: directories } = useQuery({
    queryKey: ["directories"],
    queryFn: async () => {
      const { data } = await supabase.from("directories").select("*").order("name");
      return data || [];
    },
  });

  const { data: responsibles } = useQuery({
    queryKey: ["action_responsibles"],
    queryFn: async () => {
      const { data } = await supabase.from("action_responsibles").select("*, directories(name)").order("first_name");
      return data || [];
    },
  });

  const { data: statuses } = useQuery({
    queryKey: ["action_statuses"],
    queryFn: async () => {
      const { data } = await supabase.from("action_statuses").select("*").order("name");
      return data || [];
    },
  });

  const selectedStatus = statuses?.find((s) => s.id === form.status_id);
  const [showConfirm, setShowConfirm] = useState(false);

  const isConfirmationStatus = () => {
    if (!selectedStatus) return false;
    const name = selectedStatus.name.toLowerCase();
    return name.includes("conclu") || name.includes("cancel");
  };

  const handleSave = () => {
    if (isConfirmationStatus()) {
      setShowConfirm(true);
    } else {
      saveMutation.mutate();
    }
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        pesquisa_id: pesquisaId,
        survey_year: surveyYear,
        client_name: clientName,
        theme,
        theme_comment: themeComment,
        question_comment: questionComment,
        contract_manager_id: form.contract_manager_id,
        regional_manager_id: form.regional_manager_id,
        directory_id: form.directory_id,
        responsible_id: form.responsible_id || null,
        action_name: form.action_name,
        action_description: form.action_description,
        start_date: form.start_date ? format(form.start_date, "yyyy-MM-dd") : null,
        end_date: form.end_date ? format(form.end_date, "yyyy-MM-dd") : null,
        new_end_date: form.new_end_date ? format(form.new_end_date, "yyyy-MM-dd") : null,
        completion_date: form.completion_date ? format(form.completion_date, "yyyy-MM-dd") : null,
        status_id: form.status_id,
        created_by: user?.id,
      };

      if (existingPlan?.id) {
        // Remove read-only fields for update
        const updatePayload: any = { ...payload };
        delete updatePayload.pesquisa_id;
        delete updatePayload.survey_year;
        delete updatePayload.client_name;
        delete updatePayload.theme;
        delete updatePayload.theme_comment;
        delete updatePayload.question_comment;
        delete updatePayload.created_by;

        // If start_date was already set, don't allow update
        if (existingPlan.start_date) delete updatePayload.start_date;
        if (existingPlan.end_date) delete updatePayload.end_date;

        const { error } = await supabase.from("action_plans").update(updatePayload).eq("id", existingPlan.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("action_plans").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["action_plans"], refetchType: "all" });
      await qc.invalidateQueries({ queryKey: ["all_action_plans"], refetchType: "all" });
      await qc.refetchQueries({ queryKey: ["all_action_plans"] });
      onOpenChange(false);
      toast({ title: t("actionPlan.saved") });
    },
    onError: (err: any) => {
      toast({ title: t("actionPlan.saveError"), description: err.message, variant: "destructive" });
    },
  });

  const isValid = () => {
    if (!form.contract_manager_id || !form.regional_manager_id || !form.directory_id) return false;
    if (!form.action_name.trim() || !form.action_description.trim()) return false;
    if (!form.status_id) return false;
    if (selectedStatus) {
      if (selectedStatus.requires_start_date && !form.start_date) return false;
      if (selectedStatus.requires_end_date && !form.end_date) return false;
      if (selectedStatus.requires_new_end_date && !form.new_end_date) return false;
      if (selectedStatus.requires_completion_date && !form.completion_date) return false;
    }
    return true;
  };

  const DateField = ({ label, value, onChange, disabled }: { label: string; value: Date | null; onChange: (d: Date | undefined) => void; disabled?: boolean }) => (
    <div className="space-y-1">
      <Label>{label}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" disabled={disabled} className={cn("w-full justify-start text-left font-normal", !value && "text-muted-foreground")}>
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value ? format(value, "dd/MM/yyyy") : t("actionPlan.selectDate")}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar mode="single" selected={value || undefined} onSelect={onChange} className="p-3 pointer-events-auto" />
        </PopoverContent>
      </Popover>
    </div>
  );

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{existingPlan ? t("actionPlan.editTitle") : t("actionPlan.createTitle")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Read-only fields */}
          <div className="grid grid-cols-2 gap-4">
            <div><Label>{t("actionPlan.surveyYear")}</Label><Input value={surveyYear ?? ""} disabled /></div>
            <div><Label>{t("actionPlan.client")}</Label><Input value={clientName ?? ""} disabled /></div>
          </div>
          <div><Label>{t("actionPlan.theme")}</Label><Input value={theme ?? ""} disabled /></div>
          <div><Label>{t("dashboard.question")}</Label><Input value={translateQuestion(question) || question || ""} disabled /></div>
          <div><Label>{t("actionPlan.themeComment")}</Label><Input value={themeComment ?? ""} disabled /></div>
          <div><Label>{t("actionPlan.questionComment")}</Label><Input value={questionComment ?? ""} disabled /></div>

          {/* Editable fields */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>{t("actionPlan.contractManager")} *</Label>
              <Select value={form.contract_manager_id} onValueChange={(v) => setForm((p) => ({ ...p, contract_manager_id: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {contractManagers?.map((cm) => <SelectItem key={cm.id} value={cm.id}>{cm.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t("actionPlan.regionalManager")} *</Label>
              <Select value={form.regional_manager_id} onValueChange={(v) => setForm((p) => ({ ...p, regional_manager_id: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {regionalManagers?.map((rm) => <SelectItem key={rm.id} value={rm.id}>{rm.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t("actionPlan.directory")} *</Label>
              <Select value={form.directory_id} onValueChange={(v) => setForm((p) => ({ ...p, directory_id: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {directories?.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>{t("actionPlan.responsible")}</Label>
            <Select value={form.responsible_id} onValueChange={(v) => setForm((p) => ({ ...p, responsible_id: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {responsibles?.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.first_name} {r.last_name} — {(r.directories as any)?.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>{t("actionPlan.actionName")} *</Label>
            <Input maxLength={100} value={form.action_name} onChange={(e) => setForm((p) => ({ ...p, action_name: e.target.value }))}
              disabled={!!existingPlan && false} />
          </div>

          <div>
            <Label>{t("actionPlan.actionDescription")} *</Label>
            <Textarea maxLength={250} value={form.action_description} onChange={(e) => setForm((p) => ({ ...p, action_description: e.target.value }))} />
          </div>

          <div>
            <Label>{t("actionPlan.status")} *</Label>
            <Select value={form.status_id} onValueChange={(v) => setForm((p) => ({ ...p, status_id: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {statuses?.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <DateField
              label={`${t("actionPlan.startDate")}${selectedStatus?.requires_start_date ? " *" : ""}`}
              value={form.start_date}
              onChange={(d) => setForm((p) => ({ ...p, start_date: d || null }))}
              disabled={!!existingPlan?.start_date}
            />
            <DateField
              label={`${t("actionPlan.endDate")}${selectedStatus?.requires_end_date ? " *" : ""}`}
              value={form.end_date}
              onChange={(d) => setForm((p) => ({ ...p, end_date: d || null }))}
              disabled={!!existingPlan?.end_date}
            />
            <DateField
              label={`${t("actionPlan.newEndDate")}${selectedStatus?.requires_new_end_date ? " *" : ""}`}
              value={form.new_end_date}
              onChange={(d) => setForm((p) => ({ ...p, new_end_date: d || null }))}
            />
            <DateField
              label={`${t("actionPlan.completionDate")}${selectedStatus?.requires_completion_date ? " *" : ""}`}
              value={form.completion_date}
              onChange={(d) => setForm((p) => ({ ...p, completion_date: d || null }))}
            />
          </div>

          <Button className="w-full" disabled={!isValid()} onClick={handleSave}>
            {t("actionPlan.save")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>

    <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("actionPlan.confirmTitle")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("actionPlan.confirmStatusChange", { status: selectedStatus?.name })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("actionPlan.confirmCancel")}</AlertDialogCancel>
          <AlertDialogAction onClick={() => saveMutation.mutate()}>{t("actionPlan.confirmOk")}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
};

export default ActionPlanForm;
