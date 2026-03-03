import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";

const ALL_THEMES = [
  { key: "ACCOMPAGNEMENT CLIENT", label: "Customer Support" },
  { key: "CORPORATE PERCEPTION", label: "Corporate Perception" },
  { key: "EXPERTISE INFORMATIQUE", label: "IT Expertise" },
  { key: "PARTENAIRE", label: "Partnership" },
  { key: "Ressources Humaines", label: "Human Resources" },
  { key: "EXCELLENCE OPÉRATIONNELLE", label: "Operational Excellence" },
  { key: "GESTION DE PROJETS ET INNOVATION", label: "Innovation & Project Management" },
  { key: "SOLUTIONS DURABLES", label: "Sustainable Solutions" },
];

const AdminProfiles = () => {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editProfile, setEditProfile] = useState<any>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedThemes, setSelectedThemes] = useState<string[]>([]);

  const { data: profiles, isLoading } = useQuery({
    queryKey: ["access-profiles-admin"],
    queryFn: async () => {
      const { data } = await supabase.from("access_profiles").select("*, access_profile_themes(theme_key)").order("name");
      return data ?? [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (params: { id?: string; name: string; description: string; themes: string[] }) => {
      if (params.id) {
        // Update
        const { error } = await supabase.from("access_profiles").update({ name: params.name, description: params.description }).eq("id", params.id);
        if (error) throw error;
        // Replace themes
        await supabase.from("access_profile_themes").delete().eq("access_profile_id", params.id);
        if (params.themes.length > 0) {
          const { error: thErr } = await supabase.from("access_profile_themes").insert(
            params.themes.map((t) => ({ access_profile_id: params.id!, theme_key: t }))
          );
          if (thErr) throw thErr;
        }
      } else {
        // Create
        const { data: newProfile, error } = await supabase.from("access_profiles").insert({ name: params.name, description: params.description }).select().single();
        if (error) throw error;
        if (params.themes.length > 0) {
          const { error: thErr } = await supabase.from("access_profile_themes").insert(
            params.themes.map((t) => ({ access_profile_id: newProfile.id, theme_key: t }))
          );
          if (thErr) throw thErr;
        }
      }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["access-profiles-admin"] }); toast.success("Perfil guardado"); setDialogOpen(false); },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("access_profiles").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["access-profiles-admin"] }); toast.success("Perfil eliminado"); },
    onError: (e: any) => toast.error(e.message),
  });

  const openCreate = () => {
    setEditProfile(null);
    setName("");
    setDescription("");
    setSelectedThemes([]);
    setDialogOpen(true);
  };

  const openEdit = (p: any) => {
    setEditProfile(p);
    setName(p.name);
    setDescription(p.description || "");
    setSelectedThemes(p.access_profile_themes?.map((t: any) => t.theme_key) ?? []);
    setDialogOpen(true);
  };

  const toggleTheme = (key: string) => {
    setSelectedThemes((prev) => prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate({ id: editProfile?.id, name, description, themes: selectedThemes });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(210,80%,15%)] via-[hsl(210,70%,20%)] to-[hsl(215,85%,10%)] p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Perfiles de Acceso</h1>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreate} className="bg-[hsl(200,80%,45%)] hover:bg-[hsl(200,80%,55%)]">
                <Plus className="mr-2 h-4 w-4" /> Nuevo Perfil
              </Button>
            </DialogTrigger>
            <DialogContent className="border-[hsla(200,80%,60%,0.25)] bg-[hsl(215,85%,12%)] text-white max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editProfile ? "Editar Perfil" : "Crear Perfil"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[hsl(200,60%,70%)]">Nombre</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)}
                    className="border-[hsla(200,80%,60%,0.3)] bg-[hsla(210,70%,15%,0.5)] text-white" required />
                </div>
                <div className="space-y-2">
                  <Label className="text-[hsl(200,60%,70%)]">Descripción</Label>
                  <Input value={description} onChange={(e) => setDescription(e.target.value)}
                    className="border-[hsla(200,80%,60%,0.3)] bg-[hsla(210,70%,15%,0.5)] text-white" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[hsl(200,60%,70%)]">Temas con Acceso</Label>
                  <div className="space-y-2 rounded-lg border border-[hsla(200,80%,60%,0.2)] p-3">
                    {ALL_THEMES.map((theme) => (
                      <div key={theme.key} className="flex items-center gap-3">
                        <Checkbox
                          id={theme.key}
                          checked={selectedThemes.includes(theme.key)}
                          onCheckedChange={() => toggleTheme(theme.key)}
                          className="border-[hsl(200,60%,50%)] data-[state=checked]:bg-[hsl(200,80%,45%)]"
                        />
                        <label htmlFor={theme.key} className="cursor-pointer text-sm text-white/80">
                          {theme.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                <Button type="submit" className="w-full bg-[hsl(200,80%,45%)] hover:bg-[hsl(200,80%,55%)]"
                  disabled={saveMutation.isPending}>
                  {editProfile ? "Guardar" : "Crear"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="border-[hsla(200,80%,60%,0.15)] bg-[hsla(210,70%,15%,0.6)] backdrop-blur-md">
          <CardContent className="p-0">
            {isLoading ? (
              <p className="p-6 text-center text-white/60">Cargando...</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-[hsla(200,80%,60%,0.1)] hover:bg-transparent">
                    <TableHead className="text-[hsl(200,60%,60%)]">Nombre</TableHead>
                    <TableHead className="text-[hsl(200,60%,60%)]">Descripción</TableHead>
                    <TableHead className="text-[hsl(200,60%,60%)]">Temas</TableHead>
                    <TableHead className="text-[hsl(200,60%,60%)]">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profiles?.map((p: any) => (
                    <TableRow key={p.id} className="border-[hsla(200,80%,60%,0.05)] hover:bg-[hsla(200,80%,50%,0.05)]">
                      <TableCell className="font-medium text-white">{p.name}</TableCell>
                      <TableCell className="text-white/80">{p.description || "—"}</TableCell>
                      <TableCell className="text-white/70 text-xs">
                        {p.access_profile_themes?.map((t: any) => {
                          const theme = ALL_THEMES.find((at) => at.key === t.theme_key);
                          return theme?.label || t.theme_key;
                        }).join(", ") || "Ninguno"}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(p)}
                            className="text-[hsl(200,60%,60%)] hover:text-white">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon"
                            onClick={() => { if (confirm("¿Eliminar este perfil?")) deleteMutation.mutate(p.id); }}
                            className="text-[hsl(0,60%,60%)] hover:text-[hsl(0,80%,70%)]">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminProfiles;
