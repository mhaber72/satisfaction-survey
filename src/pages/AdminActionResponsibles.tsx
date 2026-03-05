import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pencil, Trash2, Plus } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface EditingItem {
  id?: string;
  first_name: string;
  last_name: string;
  directory_id: string;
}

const AdminActionResponsibles = () => {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<EditingItem | null>(null);

  const { data: items, isLoading } = useQuery({
    queryKey: ["action_responsibles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("action_responsibles")
        .select("*, directories(name)")
        .order("first_name");
      if (error) throw error;
      return data;
    },
  });

  const { data: directories } = useQuery({
    queryKey: ["directories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("directories").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (item: EditingItem) => {
      const payload = {
        first_name: item.first_name,
        last_name: item.last_name,
        directory_id: item.directory_id,
      };
      if (item.id) {
        const { error } = await supabase.from("action_responsibles").update(payload).eq("id", item.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("action_responsibles").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["action_responsibles"] });
      setEditing(null);
      toast({ title: t("adminLookup.saved") });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("action_responsibles").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["action_responsibles"] });
      toast({ title: t("adminLookup.deleted") });
    },
  });

  const canSave = editing?.first_name?.trim() && editing?.last_name?.trim() && editing?.directory_id;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">{t("nav.actionResponsibles")}</h1>
          <Button onClick={() => setEditing({ first_name: "", last_name: "", directory_id: "" })}>
            <Plus className="mr-2 h-4 w-4" /> {t("adminLookup.new")}
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <p className="p-6 text-muted-foreground">{t("adminLookup.loading")}</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="p-4 text-left font-medium text-muted-foreground">{t("adminResponsibles.firstName")}</th>
                    <th className="p-4 text-left font-medium text-muted-foreground">{t("adminResponsibles.lastName")}</th>
                    <th className="p-4 text-left font-medium text-muted-foreground">{t("actionPlan.directory")}</th>
                    <th className="p-4 text-right font-medium text-muted-foreground">{t("adminLookup.actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {items?.map((item) => (
                    <tr key={item.id} className="border-b hover:bg-muted/50">
                      <td className="p-4">{item.first_name}</td>
                      <td className="p-4">{item.last_name}</td>
                      <td className="p-4">{(item.directories as any)?.name}</td>
                      <td className="p-4 text-right space-x-2">
                        <Button size="icon" variant="ghost" onClick={() => setEditing({
                          id: item.id,
                          first_name: item.first_name,
                          last_name: item.last_name,
                          directory_id: item.directory_id,
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
            )}
          </CardContent>
        </Card>

        <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing?.id ? t("adminLookup.edit") : t("adminLookup.new")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>{t("adminResponsibles.firstName")}</Label>
                <Input
                  value={editing?.first_name ?? ""}
                  onChange={(e) => setEditing((prev) => prev ? { ...prev, first_name: e.target.value } : prev)}
                />
              </div>
              <div>
                <Label>{t("adminResponsibles.lastName")}</Label>
                <Input
                  value={editing?.last_name ?? ""}
                  onChange={(e) => setEditing((prev) => prev ? { ...prev, last_name: e.target.value } : prev)}
                />
              </div>
              <div>
                <Label>{t("actionPlan.directory")}</Label>
                <Select
                  value={editing?.directory_id ?? ""}
                  onValueChange={(v) => setEditing((prev) => prev ? { ...prev, directory_id: v } : prev)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {directories?.map((d) => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                className="w-full"
                disabled={!canSave}
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

export default AdminActionResponsibles;
