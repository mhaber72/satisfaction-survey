import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Pencil, Trash2, Plus, Upload, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ClientForm {
  id?: string;
  name: string;
  logo_url: string | null;
  vertical_id: string | null;
}

const AdminClients = () => {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<ClientForm | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: clients, isLoading } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (item: ClientForm) => {
      if (item.id) {
        const { error } = await supabase.from("clients").update({ name: item.name, logo_url: item.logo_url }).eq("id", item.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("clients").insert({ name: item.name, logo_url: item.logo_url });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clients"] });
      setEditing(null);
      toast({ title: t("adminLookup.saved") });
    },
    onError: (e: any) => {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("clients").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clients"] });
      toast({ title: t("adminLookup.deleted") });
    },
  });

  const handleLogoUpload = async (file: File) => {
    if (!editing) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const fileName = `${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("client-logos")
        .upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("client-logos").getPublicUrl(fileName);
      setEditing((prev) => prev ? { ...prev, logo_url: urlData.publicUrl } : prev);
    } catch (e: any) {
      toast({ title: "Erro no upload", description: e.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">{t("nav.clients", "Clientes")}</h1>
          <Button onClick={() => setEditing({ name: "", logo_url: null })}>
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
                    <th className="p-4 text-left font-medium text-muted-foreground w-16">Logo</th>
                    <th className="p-4 text-left font-medium text-muted-foreground">{t("adminLookup.name")}</th>
                    <th className="p-4 text-right font-medium text-muted-foreground">{t("adminLookup.actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {clients?.map((c) => (
                    <tr key={c.id} className="border-b hover:bg-muted/50">
                      <td className="p-4">
                        {c.logo_url ? (
                          <img src={c.logo_url} alt={c.name} className="max-h-10 max-w-[120px] object-contain" />
                        ) : (
                          <div className="h-10 w-10 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground">—</div>
                        )}
                      </td>
                      <td className="p-4">{c.name}</td>
                      <td className="p-4 text-right space-x-2">
                        <Button size="icon" variant="ghost" onClick={() => setEditing({ id: c.id, name: c.name, logo_url: c.logo_url })}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => {
                          if (confirm(t("adminLookup.confirmDelete"))) deleteMutation.mutate(c.id);
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

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Logo</label>
                {editing?.logo_url ? (
                  <div className="flex items-center gap-3">
                    <div className="border rounded p-2 bg-white">
                      <img src={editing.logo_url} alt="Logo" className="max-h-16 max-w-[200px] object-contain" />
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setEditing((prev) => prev ? { ...prev, logo_url: null } : prev)}>
                      <X className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ) : (
                  <div>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleLogoUpload(f);
                      }}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={uploading}
                      onClick={() => fileRef.current?.click()}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      {uploading ? "Uploading..." : "Upload Logo"}
                    </Button>
                  </div>
                )}
              </div>

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

export default AdminClients;
