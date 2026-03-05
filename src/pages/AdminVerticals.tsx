import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Pencil, Trash2, Plus } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const AdminVerticals = () => {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<{ id?: string; name: string } | null>(null);

  const { data: verticals, isLoading } = useQuery({
    queryKey: ["verticals"],
    queryFn: async () => {
      const { data, error } = await supabase.from("verticals").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (item: { id?: string; name: string }) => {
      if (item.id) {
        const { error } = await supabase.from("verticals").update({ name: item.name }).eq("id", item.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("verticals").insert({ name: item.name });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["verticals"] });
      setEditing(null);
      toast({ title: t("adminLookup.saved") });
    },
    onError: (e: any) => {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("verticals").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["verticals"] });
      toast({ title: t("adminLookup.deleted") });
    },
  });

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">{t("nav.verticals", "Verticais")}</h1>
          <Button onClick={() => setEditing({ name: "" })}>
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
                    <th className="p-4 text-left font-medium text-muted-foreground">{t("adminLookup.name")}</th>
                    <th className="p-4 text-right font-medium text-muted-foreground">{t("adminLookup.actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {verticals?.map((v) => (
                    <tr key={v.id} className="border-b hover:bg-muted/50">
                      <td className="p-4">{v.name}</td>
                      <td className="p-4 text-right space-x-2">
                        <Button size="icon" variant="ghost" onClick={() => setEditing({ id: v.id, name: v.name })}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => {
                          if (confirm(t("adminLookup.confirmDelete"))) deleteMutation.mutate(v.id);
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
              <Input
                value={editing?.name ?? ""}
                onChange={(e) => setEditing((prev) => prev ? { ...prev, name: e.target.value } : prev)}
                placeholder={t("adminLookup.name")}
              />
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

export default AdminVerticals;
