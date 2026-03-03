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
import { useTranslation } from "react-i18next";

const THEME_LABEL_KEYS: Record<string, string> = {
  "ACCOMPAGNEMENT CLIENT": "themeSelection.customerSupport",
  "CORPORATE PERCEPTION": "themeSelection.corporatePerception",
  "EXPERTISE INFORMATIQUE": "themeSelection.itExpertise",
  "PARTENAIRE": "themeSelection.partnership",
  "Ressources Humaines": "themeSelection.humanResources",
  "EXCELLENCE OPÉRATIONNELLE": "themeSelection.operationalExcellence",
  "GESTION DE PROJETS ET INNOVATION": "themeSelection.innovationProjectMgmt",
  "SOLUTIONS DURABLES": "themeSelection.sustainableSolutions",
};

const ALL_THEMES = Object.keys(THEME_LABEL_KEYS);

const AdminProfiles = () => {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editProfile, setEditProfile] = useState<any>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedThemes, setSelectedThemes] = useState<string[]>([]);
  const { t } = useTranslation();

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
        const { error } = await supabase.from("access_profiles").update({ name: params.name, description: params.description }).eq("id", params.id);
        if (error) throw error;
        await supabase.from("access_profile_themes").delete().eq("access_profile_id", params.id);
        if (params.themes.length > 0) {
          const { error: thErr } = await supabase.from("access_profile_themes").insert(params.themes.map((th) => ({ access_profile_id: params.id!, theme_key: th })));
          if (thErr) throw thErr;
        }
      } else {
        const { data: newProfile, error } = await supabase.from("access_profiles").insert({ name: params.name, description: params.description }).select().single();
        if (error) throw error;
        if (params.themes.length > 0) {
          const { error: thErr } = await supabase.from("access_profile_themes").insert(params.themes.map((th) => ({ access_profile_id: newProfile.id, theme_key: th })));
          if (thErr) throw thErr;
        }
      }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["access-profiles-admin"] }); toast.success(t("adminProfiles.profileSaved")); setDialogOpen(false); },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("access_profiles").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["access-profiles-admin"] }); toast.success(t("adminProfiles.profileDeleted")); },
    onError: (e: any) => toast.error(e.message),
  });

  const openCreate = () => { setEditProfile(null); setName(""); setDescription(""); setSelectedThemes([]); setDialogOpen(true); };
  const openEdit = (p: any) => { setEditProfile(p); setName(p.name); setDescription(p.description || ""); setSelectedThemes(p.access_profile_themes?.map((th: any) => th.theme_key) ?? []); setDialogOpen(true); };
  const toggleTheme = (key: string) => setSelectedThemes((prev) => prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate({ id: editProfile?.id, name, description, themes: selectedThemes });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(210,80%,15%)] via-[hsl(210,70%,20%)] to-[hsl(215,85%,10%)] p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">{t("adminProfiles.title")}</h1>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreate} className="bg-[hsl(200,80%,45%)] hover:bg-[hsl(200,80%,55%)]">
                <Plus className="mr-2 h-4 w-4" /> {t("adminProfiles.newProfile")}
              </Button>
            </DialogTrigger>
            <DialogContent className="border-[hsla(200,80%,60%,0.25)] bg-[hsl(215,85%,12%)] text-white max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editProfile ? t("adminProfiles.editProfile") : t("adminProfiles.createProfile")}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[hsl(200,60%,70%)]">{t("adminProfiles.name")}</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)}
                    className="border-[hsla(200,80%,60%,0.3)] bg-[hsla(210,70%,15%,0.5)] text-white" required />
                </div>
                <div className="space-y-2">
                  <Label className="text-[hsl(200,60%,70%)]">{t("adminProfiles.description")}</Label>
                  <Input value={description} onChange={(e) => setDescription(e.target.value)}
                    className="border-[hsla(200,80%,60%,0.3)] bg-[hsla(210,70%,15%,0.5)] text-white" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[hsl(200,60%,70%)]">{t("adminProfiles.themesAccess")}</Label>
                  <div className="space-y-2 rounded-lg border border-[hsla(200,80%,60%,0.2)] p-3">
                    {ALL_THEMES.map((key) => (
                      <div key={key} className="flex items-center gap-3">
                        <Checkbox
                          id={key}
                          checked={selectedThemes.includes(key)}
                          onCheckedChange={() => toggleTheme(key)}
                          className="border-[hsl(200,60%,50%)] data-[state=checked]:bg-[hsl(200,80%,45%)]"
                        />
                        <label htmlFor={key} className="cursor-pointer text-sm text-white/80">
                          {t(THEME_LABEL_KEYS[key])}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                <Button type="submit" className="w-full bg-[hsl(200,80%,45%)] hover:bg-[hsl(200,80%,55%)]" disabled={saveMutation.isPending}>
                  {editProfile ? t("adminProfiles.save") : t("adminProfiles.create")}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="border-[hsla(200,80%,60%,0.15)] bg-[hsla(210,70%,15%,0.6)] backdrop-blur-md">
          <CardContent className="p-0">
            {isLoading ? (
              <p className="p-6 text-center text-white/60">{t("adminProfiles.loading")}</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-[hsla(200,80%,60%,0.1)] hover:bg-transparent">
                    <TableHead className="text-[hsl(200,60%,60%)]">{t("adminProfiles.name")}</TableHead>
                    <TableHead className="text-[hsl(200,60%,60%)]">{t("adminProfiles.description")}</TableHead>
                    <TableHead className="text-[hsl(200,60%,60%)]">{t("adminProfiles.themes")}</TableHead>
                    <TableHead className="text-[hsl(200,60%,60%)]">{t("adminProfiles.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profiles?.map((p: any) => (
                    <TableRow key={p.id} className="border-[hsla(200,80%,60%,0.05)] hover:bg-[hsla(200,80%,50%,0.05)]">
                      <TableCell className="font-medium text-white">{p.name}</TableCell>
                      <TableCell className="text-white/80">{p.description || "—"}</TableCell>
                      <TableCell className="text-white/70 text-xs">
                        {p.access_profile_themes?.map((th: any) => t(THEME_LABEL_KEYS[th.theme_key] || th.theme_key)).join(", ") || t("adminProfiles.none")}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(p)} className="text-[hsl(200,60%,60%)] hover:text-white">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon"
                            onClick={() => { if (confirm(t("adminProfiles.confirmDelete"))) deleteMutation.mutate(p.id); }}
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
