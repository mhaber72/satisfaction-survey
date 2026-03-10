import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

const LANGUAGE_OPTIONS = [
  { code: "en", flag: "🇬🇧", label: "English" },
  { code: "fr", flag: "🇫🇷", label: "Français" },
  { code: "pt", flag: "🇧🇷", label: "Português" },
  { code: "es", flag: "🇪🇸", label: "Español" },
];

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

const callAdminApi = async (body: any) => {
  const { data: { session } } = await supabase.auth.getSession();
  const res = await supabase.functions.invoke("admin-users", {
    body,
    headers: { Authorization: `Bearer ${session?.access_token}` },
  });
  if (res.error) throw new Error(res.error.message);
  return res.data;
};

interface UserForm {
  email: string;
  password: string;
  full_name: string;
  role: string;
  cargo: string;
  language: string;
  user_themes: string[];
  user_clients: string[];
}

const emptyForm: UserForm = {
  email: "", password: "", full_name: "", role: "user", cargo: "", language: "en",
  user_themes: [], user_clients: [],
};

const AdminUsers = () => {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editUser, setEditUser] = useState<any>(null);
  const [form, setForm] = useState<UserForm>(emptyForm);
  const { t } = useTranslation();

  const { data: usersData, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => callAdminApi({ action: "list_users" }),
  });

  // Fetch distinct client names from pesquisa_satisfacao for the checkbox list
  const { data: allClients } = useQuery({
    queryKey: ["all-client-names"],
    queryFn: async () => {
      const { data } = await supabase.from("clients").select("name").order("name");
      return data?.map((c: any) => c.name) ?? [];
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => callAdminApi({ action: "create_user", ...data }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-users"] }); toast.success(t("adminUsers.userCreated")); setDialogOpen(false); },
    onError: (e: any) => toast.error(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => callAdminApi({ action: "update_user", ...data }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-users"] }); toast.success(t("adminUsers.userUpdated")); setDialogOpen(false); },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (user_id: string) => callAdminApi({ action: "delete_user", user_id }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-users"] }); toast.success(t("adminUsers.userDeleted")); },
    onError: (e: any) => toast.error(e.message),
  });

  const openCreate = () => {
    setEditUser(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (user: any) => {
    setEditUser(user);
    // Determine role from user_roles
    const roles = user.user_roles ?? [];
    let role = "user";
    if (roles.some((r: any) => r.role === "admin")) role = "admin";
    else if (roles.some((r: any) => r.role === "superuser")) role = "superuser";

    setForm({
      email: user.email || "",
      password: "",
      full_name: user.full_name || "",
      role,
      cargo: user.cargo || "",
      language: user.language || "en",
      user_themes: user.user_themes?.map((t: any) => t.theme_key) ?? [],
      user_clients: user.user_clients?.map((c: any) => c.client_name) ?? [],
    });
    setDialogOpen(true);
  };

  const toggleTheme = (key: string) => {
    setForm((prev) => ({
      ...prev,
      user_themes: prev.user_themes.includes(key)
        ? prev.user_themes.filter((k) => k !== key)
        : [...prev.user_themes, key],
    }));
  };

  const toggleClient = (name: string) => {
    setForm((prev) => ({
      ...prev,
      user_clients: prev.user_clients.includes(name)
        ? prev.user_clients.filter((c) => c !== name)
        : [...prev.user_clients, name],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      email: form.email,
      password: form.password || undefined,
      full_name: form.full_name,
      role: form.role,
      cargo: form.cargo,
      language: form.language,
      user_themes: form.role === "admin" ? [] : form.user_themes,
      user_clients: form.role === "admin" ? [] : form.user_clients,
    };
    if (editUser) {
      updateMutation.mutate({ user_id: editUser.user_id, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const users = usersData?.users ?? [];

  const getRoleLabel = (user: any) => {
    const roles = user.user_roles ?? [];
    if (roles.some((r: any) => r.role === "admin")) return t("adminUsers.admin");
    if (roles.some((r: any) => r.role === "superuser")) return t("adminUsers.superuser");
    return t("adminUsers.user");
  };

  const showAccessFields = form.role !== "admin";

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(210,80%,15%)] via-[hsl(210,70%,20%)] to-[hsl(215,85%,10%)] p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">{t("adminUsers.title")}</h1>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreate} className="bg-[hsl(200,80%,45%)] hover:bg-[hsl(200,80%,55%)]">
                <Plus className="mr-2 h-4 w-4" /> {t("adminUsers.newUser")}
              </Button>
            </DialogTrigger>
            <DialogContent className="border-[hsla(200,80%,60%,0.25)] bg-[hsl(215,85%,12%)] text-white max-h-[90vh] overflow-y-auto max-w-lg">
              <DialogHeader>
                <DialogTitle>{editUser ? t("adminUsers.editUser") : t("adminUsers.createUser")}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[hsl(200,60%,70%)]">{t("adminUsers.fullName")}</Label>
                  <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                    className="border-[hsla(200,80%,60%,0.3)] bg-[hsla(210,70%,15%,0.5)] text-white" required />
                </div>
                <div className="space-y-2">
                  <Label className="text-[hsl(200,60%,70%)]">{t("adminUsers.email")}</Label>
                  <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="border-[hsla(200,80%,60%,0.3)] bg-[hsla(210,70%,15%,0.5)] text-white" required />
                </div>
                <div className="space-y-2">
                  <Label className="text-[hsl(200,60%,70%)]">{t("adminUsers.password")} {editUser && t("adminUsers.passwordHint")}</Label>
                  <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="border-[hsla(200,80%,60%,0.3)] bg-[hsla(210,70%,15%,0.5)] text-white" required={!editUser} />
                </div>
                <div className="space-y-2">
                  <Label className="text-[hsl(200,60%,70%)]">{t("adminUsers.cargo")}</Label>
                  <Input value={form.cargo} onChange={(e) => setForm({ ...form, cargo: e.target.value })}
                    className="border-[hsla(200,80%,60%,0.3)] bg-[hsla(210,70%,15%,0.5)] text-white" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[hsl(200,60%,70%)]">{t("adminUsers.role")}</Label>
                  <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                    <SelectTrigger className="border-[hsla(200,80%,60%,0.3)] bg-[hsla(210,70%,15%,0.5)] text-white"><SelectValue /></SelectTrigger>
                    <SelectContent className="border-[hsla(200,80%,60%,0.3)] bg-[hsl(215,85%,12%)]">
                      <SelectItem value="admin" className="text-white">{t("adminUsers.admin")}</SelectItem>
                      <SelectItem value="superuser" className="text-white">{t("adminUsers.superuser")}</SelectItem>
                      <SelectItem value="user" className="text-white">{t("adminUsers.user")}</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-white/50">
                    {form.role === "admin" && t("adminUsers.adminDesc")}
                    {form.role === "superuser" && t("adminUsers.superuserDesc")}
                    {form.role === "user" && t("adminUsers.userDesc")}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-[hsl(200,60%,70%)]">{t("adminUsers.language")}</Label>
                  <Select value={form.language} onValueChange={(v) => setForm({ ...form, language: v })}>
                    <SelectTrigger className="border-[hsla(200,80%,60%,0.3)] bg-[hsla(210,70%,15%,0.5)] text-white"><SelectValue /></SelectTrigger>
                    <SelectContent className="border-[hsla(200,80%,60%,0.3)] bg-[hsl(215,85%,12%)]">
                      {LANGUAGE_OPTIONS.map((lang) => (
                        <SelectItem key={lang.code} value={lang.code} className="text-white">{lang.flag} {lang.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {showAccessFields && (
                  <>
                    <div className="space-y-2">
                      <Label className="text-[hsl(200,60%,70%)]">{t("adminUsers.themesAccess")}</Label>
                      <div className="space-y-2 rounded-lg border border-[hsla(200,80%,60%,0.2)] p-3 max-h-48 overflow-y-auto">
                        {ALL_THEMES.map((key) => (
                          <div key={key} className="flex items-center gap-3">
                            <Checkbox
                              id={`theme-${key}`}
                              checked={form.user_themes.includes(key)}
                              onCheckedChange={() => toggleTheme(key)}
                              className="border-[hsl(200,60%,50%)] data-[state=checked]:bg-[hsl(200,80%,45%)]"
                            />
                            <label htmlFor={`theme-${key}`} className="cursor-pointer text-sm text-white/80">
                              {t(THEME_LABEL_KEYS[key])}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[hsl(200,60%,70%)]">{t("adminUsers.clientsAccess")}</Label>
                      <div className="space-y-2 rounded-lg border border-[hsla(200,80%,60%,0.2)] p-3 max-h-48 overflow-y-auto">
                        {(allClients ?? []).map((name: string) => (
                          <div key={name} className="flex items-center gap-3">
                            <Checkbox
                              id={`client-${name}`}
                              checked={form.user_clients.includes(name)}
                              onCheckedChange={() => toggleClient(name)}
                              className="border-[hsl(200,60%,50%)] data-[state=checked]:bg-[hsl(200,80%,45%)]"
                            />
                            <label htmlFor={`client-${name}`} className="cursor-pointer text-sm text-white/80">
                              {name}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <Button type="submit" className="w-full bg-[hsl(200,80%,45%)] hover:bg-[hsl(200,80%,55%)]"
                  disabled={createMutation.isPending || updateMutation.isPending}>
                  {editUser ? t("adminUsers.save") : t("adminUsers.create")}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="border-[hsla(200,80%,60%,0.15)] bg-[hsla(210,70%,15%,0.6)] backdrop-blur-md">
          <CardContent className="p-0">
            {isLoading ? (
              <p className="p-6 text-center text-white/60">{t("adminUsers.loading")}</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-[hsla(200,80%,60%,0.1)] hover:bg-transparent">
                    <TableHead className="text-[hsl(200,60%,60%)]">{t("adminUsers.name")}</TableHead>
                    <TableHead className="text-[hsl(200,60%,60%)]">{t("adminUsers.email")}</TableHead>
                    <TableHead className="text-[hsl(200,60%,60%)]">{t("adminUsers.cargo")}</TableHead>
                    <TableHead className="text-[hsl(200,60%,60%)]">{t("adminUsers.role")}</TableHead>
                    <TableHead className="text-[hsl(200,60%,60%)]">{t("adminUsers.language")}</TableHead>
                    <TableHead className="text-[hsl(200,60%,60%)]">{t("adminUsers.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u: any) => {
                    const langOpt = LANGUAGE_OPTIONS.find((l) => l.code === u.language);
                    return (
                      <TableRow key={u.id} className="border-[hsla(200,80%,60%,0.05)] hover:bg-[hsla(200,80%,50%,0.05)]">
                        <TableCell className="text-white">{u.full_name}</TableCell>
                        <TableCell className="text-white/80">{u.email}</TableCell>
                        <TableCell className="text-white/80">{u.cargo || "—"}</TableCell>
                        <TableCell className="text-white/80">{getRoleLabel(u)}</TableCell>
                        <TableCell className="text-white/80">{langOpt ? `${langOpt.flag} ${langOpt.label}` : u.language || "—"}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="icon" onClick={() => openEdit(u)} className="text-[hsl(200,60%,60%)] hover:text-white">
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon"
                              onClick={() => { if (confirm(t("adminUsers.confirmDelete"))) deleteMutation.mutate(u.user_id); }}
                              className="text-[hsl(0,60%,60%)] hover:text-[hsl(0,80%,70%)]">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminUsers;
