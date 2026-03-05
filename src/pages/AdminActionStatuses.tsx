import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Pencil, Trash2, Plus } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface StatusForm {
  id?: string;
  name: string;
  color: string;
  requires_start_date: boolean;
  requires_end_date: boolean;
  requires_new_end_date: boolean;
  requires_completion_date: boolean;
}

const EMPTY: StatusForm = { name: "", color: "#6b7280", requires_start_date: false, requires_end_date: false, requires_new_end_date: false, requires_completion_date: false };

const AdminActionStatuses = () => {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<StatusForm | null>(null);

  const { data: items, isLoading } = useQuery({
    queryKey: ["action_statuses"],
    queryFn: async () => {
      const { data, error } = await supabase.from("action_statuses").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (item: StatusForm) => {
      const payload = {
        name: item.name,
        color: item.color,
        requires_start_date: item.requires_start_date,
        requires_end_date: item.requires_end_date,
        requires_new_end_date: item.requires_new_end_date,
        requires_completion_date: item.requires_completion_date,
      };
      if (item.id) {
        const { error } = await supabase.from("action_statuses").update(payload).eq("id", item.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("action_statuses").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["action_statuses"] });
      setEditing(null);
      toast({ title: t("adminLookup.saved") });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("action_statuses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["action_statuses"] });
      toast({ title: t("adminLookup.deleted") });
    },
  });

  const boolLabel = (v: boolean) => (v ? "✓" : "—");

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">{t("adminStatuses.title")}</h1>
          <Button onClick={() => setEditing({ ...EMPTY })}>
            <Plus className="mr-2 h-4 w-4" /> {t("adminLookup.new")}
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <p className="p-6 text-muted-foreground">{t("adminLookup.loading")}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="p-4 text-left font-medium text-muted-foreground">{t("adminLookup.name")}</th>
                      <th className="p-4 text-center font-medium text-muted-foreground">{t("adminStatuses.color")}</th>
                      <th className="p-4 text-center font-medium text-muted-foreground">{t("adminStatuses.startDate")}</th>
                      <th className="p-4 text-center font-medium text-muted-foreground">{t("adminStatuses.endDate")}</th>
                      <th className="p-4 text-center font-medium text-muted-foreground">{t("adminStatuses.newEndDate")}</th>
                      <th className="p-4 text-center font-medium text-muted-foreground">{t("adminStatuses.completionDate")}</th>
                      <th className="p-4 text-right font-medium text-muted-foreground">{t("adminLookup.actions")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items?.map((item) => (
                      <tr key={item.id} className="border-b hover:bg-muted/50">
                        <td className="p-4">
                          <span className="flex items-center gap-2">
                            <span className="inline-block h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: item.color || '#6b7280' }} />
                            {item.name}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <span className="inline-block h-5 w-5 rounded-full border" style={{ backgroundColor: item.color || '#6b7280' }} />
                        </td>
                        <td className="p-4 text-center">{boolLabel(item.requires_start_date)}</td>
                        <td className="p-4 text-center">{boolLabel(item.requires_end_date)}</td>
                        <td className="p-4 text-center">{boolLabel(item.requires_new_end_date)}</td>
                        <td className="p-4 text-center">{boolLabel(item.requires_completion_date)}</td>
                        <td className="p-4 text-right space-x-2">
                          <Button size="icon" variant="ghost" onClick={() => setEditing({
                            id: item.id,
                            name: item.name,
                            requires_start_date: item.requires_start_date,
                            requires_end_date: item.requires_end_date,
                            requires_new_end_date: item.requires_new_end_date,
                            requires_completion_date: item.requires_completion_date,
                          })}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => {
                            if (confirm(t("adminLookup.confirmDelete"))) deleteMutation.mutate(item.id);
                          }}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing?.id ? t("adminLookup.edit") : t("adminLookup.new")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                value={editing?.name ?? ""}
                onChange={(e) => setEditing((prev) => prev ? { ...prev, name: e.target.value } : prev)}
                placeholder={t("adminLookup.name")}
              />
              {[
                { key: "requires_start_date" as const, label: t("adminStatuses.startDate") },
                { key: "requires_end_date" as const, label: t("adminStatuses.endDate") },
                { key: "requires_new_end_date" as const, label: t("adminStatuses.newEndDate") },
                { key: "requires_completion_date" as const, label: t("adminStatuses.completionDate") },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center gap-2">
                  <Checkbox
                    checked={editing?.[key] ?? false}
                    onCheckedChange={(v) => setEditing((prev) => prev ? { ...prev, [key]: !!v } : prev)}
                    id={key}
                  />
                  <Label htmlFor={key}>{label} {t("adminStatuses.required")}</Label>
                </div>
              ))}
              <Button
                className="w-full"
                disabled={!editing?.name?.trim()}
                onClick={() => editing && saveMutation.mutate(editing)}
              >
                {t("adminLookup.save")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AdminActionStatuses;
