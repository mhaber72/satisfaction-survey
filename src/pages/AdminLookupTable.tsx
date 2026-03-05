import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Pencil, Trash2, Plus } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface AdminLookupTableProps {
  tableName: "contract_managers" | "regional_managers" | "directories";
  titleKey: string;
}

const AdminLookupTable = ({ tableName, titleKey }: AdminLookupTableProps) => {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<{ id?: string; name: string } | null>(null);

  const { data: items, isLoading } = useQuery({
    queryKey: [tableName],
    queryFn: async () => {
      const { data, error } = await supabase.from(tableName).select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (item: { id?: string; name: string }) => {
      if (item.id) {
        const { error } = await supabase.from(tableName).update({ name: item.name }).eq("id", item.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from(tableName).insert({ name: item.name });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [tableName] });
      setEditing(null);
      toast({ title: t("adminLookup.saved") });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(tableName).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [tableName] });
      toast({ title: t("adminLookup.deleted") });
    },
  });

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">{t(titleKey)}</h1>
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
                  {items?.map((item) => (
                    <tr key={item.id} className="border-b hover:bg-muted/50">
                      <td className="p-4">{item.name}</td>
                      <td className="p-4 text-right space-x-2">
                        <Button size="icon" variant="ghost" onClick={() => setEditing({ id: item.id, name: item.name })}>
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

export default AdminLookupTable;
