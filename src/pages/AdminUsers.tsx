import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";

const callAdminApi = async (body: any) => {
  const { data: { session } } = await supabase.auth.getSession();
  const res = await supabase.functions.invoke("admin-users", {
    body,
    headers: { Authorization: `Bearer ${session?.access_token}` },
  });
  if (res.error) throw new Error(res.error.message);
  return res.data;
};

const AdminUsers = () => {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editUser, setEditUser] = useState<any>(null);
  const [form, setForm] = useState({ email: "", password: "", full_name: "", role: "user", access_profile_id: "" });

  const { data: usersData, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => callAdminApi({ action: "list_users" }),
  });

  const { data: accessProfiles } = useQuery({
    queryKey: ["access-profiles"],
    queryFn: async () => {
      const { data } = await supabase.from("access_profiles").select("*").order("name");
      return data ?? [];
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => callAdminApi({ action: "create_user", ...data }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-users"] }); toast.success("Usuario creado"); setDialogOpen(false); },
    onError: (e: any) => toast.error(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => callAdminApi({ action: "update_user", ...data }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-users"] }); toast.success("Usuario actualizado"); setDialogOpen(false); },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (user_id: string) => callAdminApi({ action: "delete_user", user_id }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-users"] }); toast.success("Usuario eliminado"); },
    onError: (e: any) => toast.error(e.message),
  });

  const openCreate = () => {
    setEditUser(null);
    setForm({ email: "", password: "", full_name: "", role: "user", access_profile_id: "" });
    setDialogOpen(true);
  };

  const openEdit = (user: any) => {
    setEditUser(user);
    const userRole = user.user_roles?.some((r: any) => r.role === "admin") ? "admin" : "user";
    setForm({
      email: user.email || "",
      password: "",
      full_name: user.full_name || "",
      role: userRole,
      access_profile_id: user.access_profile_id || "",
    });
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editUser) {
      updateMutation.mutate({
        user_id: editUser.user_id,
        email: form.email,
        password: form.password || undefined,
        full_name: form.full_name,
        role: form.role,
        access_profile_id: form.access_profile_id || null,
      });
    } else {
      createMutation.mutate(form);
    }
  };

  const users = usersData?.users ?? [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(210,80%,15%)] via-[hsl(210,70%,20%)] to-[hsl(215,85%,10%)] p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Gestión de Usuarios</h1>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreate} className="bg-[hsl(200,80%,45%)] hover:bg-[hsl(200,80%,55%)]">
                <Plus className="mr-2 h-4 w-4" /> Nuevo Usuario
              </Button>
            </DialogTrigger>
            <DialogContent className="border-[hsla(200,80%,60%,0.25)] bg-[hsl(215,85%,12%)] text-white">
              <DialogHeader>
                <DialogTitle>{editUser ? "Editar Usuario" : "Crear Usuario"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[hsl(200,60%,70%)]">Nombre Completo</Label>
                  <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                    className="border-[hsla(200,80%,60%,0.3)] bg-[hsla(210,70%,15%,0.5)] text-white" required />
                </div>
                <div className="space-y-2">
                  <Label className="text-[hsl(200,60%,70%)]">Email</Label>
                  <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="border-[hsla(200,80%,60%,0.3)] bg-[hsla(210,70%,15%,0.5)] text-white" required />
                </div>
                <div className="space-y-2">
                  <Label className="text-[hsl(200,60%,70%)]">Contraseña {editUser && "(dejar vacío para no cambiar)"}</Label>
                  <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="border-[hsla(200,80%,60%,0.3)] bg-[hsla(210,70%,15%,0.5)] text-white"
                    required={!editUser} />
                </div>
                <div className="space-y-2">
                  <Label className="text-[hsl(200,60%,70%)]">Rol</Label>
                  <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                    <SelectTrigger className="border-[hsla(200,80%,60%,0.3)] bg-[hsla(210,70%,15%,0.5)] text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-[hsla(200,80%,60%,0.3)] bg-[hsl(215,85%,12%)]">
                      <SelectItem value="user" className="text-white">Usuario</SelectItem>
                      <SelectItem value="admin" className="text-white">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[hsl(200,60%,70%)]">Perfil de Acceso</Label>
                  <Select value={form.access_profile_id} onValueChange={(v) => setForm({ ...form, access_profile_id: v })}>
                    <SelectTrigger className="border-[hsla(200,80%,60%,0.3)] bg-[hsla(210,70%,15%,0.5)] text-white">
                      <SelectValue placeholder="Sin perfil" />
                    </SelectTrigger>
                    <SelectContent className="border-[hsla(200,80%,60%,0.3)] bg-[hsl(215,85%,12%)]">
                      <SelectItem value="none" className="text-white">Sin perfil</SelectItem>
                      {accessProfiles?.map((p: any) => (
                        <SelectItem key={p.id} value={p.id} className="text-white">{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full bg-[hsl(200,80%,45%)] hover:bg-[hsl(200,80%,55%)]"
                  disabled={createMutation.isPending || updateMutation.isPending}>
                  {editUser ? "Guardar" : "Crear"}
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
                    <TableHead className="text-[hsl(200,60%,60%)]">Email</TableHead>
                    <TableHead className="text-[hsl(200,60%,60%)]">Rol</TableHead>
                    <TableHead className="text-[hsl(200,60%,60%)]">Perfil</TableHead>
                    <TableHead className="text-[hsl(200,60%,60%)]">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u: any) => (
                    <TableRow key={u.id} className="border-[hsla(200,80%,60%,0.05)] hover:bg-[hsla(200,80%,50%,0.05)]">
                      <TableCell className="text-white">{u.full_name}</TableCell>
                      <TableCell className="text-white/80">{u.email}</TableCell>
                      <TableCell className="text-white/80">
                        {u.user_roles?.some((r: any) => r.role === "admin") ? "Admin" : "Usuario"}
                      </TableCell>
                      <TableCell className="text-white/80">{u.access_profiles?.name || "—"}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(u)}
                            className="text-[hsl(200,60%,60%)] hover:text-white">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon"
                            onClick={() => { if (confirm("¿Eliminar este usuario?")) deleteMutation.mutate(u.user_id); }}
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

export default AdminUsers;
