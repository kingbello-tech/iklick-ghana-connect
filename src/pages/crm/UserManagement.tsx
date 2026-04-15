import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { UserPlus, Pencil, Trash2 } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type UserRole = Database["public"]["Tables"]["user_roles"]["Row"];
type AppRole = Database["public"]["Enums"]["app_role"];

const DEPARTMENTS = ["Client Experience", "Technology", "Project Management", "Sales"];

export default function UserManagement() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newUser, setNewUser] = useState({ email: "", password: "", full_name: "", role: "viewer" as AppRole, department: "" });
  const [editUser, setEditUser] = useState<{ profile: Profile; role: AppRole | "" }>({ profile: {} as Profile, role: "" });
  const [deleteTarget, setDeleteTarget] = useState<Profile | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = async () => {
    const [profRes, roleRes] = await Promise.all([
      supabase.from("profiles").select("*").order("full_name"),
      supabase.from("user_roles").select("*"),
    ]);
    if (profRes.data) setProfiles(profRes.data);
    if (roleRes.data) setRoles(roleRes.data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const roleMap = Object.fromEntries(roles.map((r) => [r.user_id, r]));

  const updateRole = async (userId: string, newRole: AppRole) => {
    const existing = roleMap[userId];
    if (existing) {
      const { error } = await supabase.from("user_roles").update({ role: newRole }).eq("id", existing.id);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    } else {
      const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: newRole });
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    }
    toast({ title: "Role updated" });
    fetchData();
  };

  const createUser = async () => {
    setCreating(true);
    try {
      const res = await supabase.functions.invoke("create-user", {
        body: { ...newUser, department: newUser.department || null },
      });
      if (res.error) throw new Error(res.error.message);
      if (res.data?.error) throw new Error(res.data.error);
      toast({ title: "User created", description: `Account created for ${newUser.email}` });
      setNewUser({ email: "", password: "", full_name: "", role: "viewer", department: "" });
      setDialogOpen(false);
      setTimeout(fetchData, 1000);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const openEdit = (profile: Profile) => {
    const currentRole = roleMap[profile.user_id]?.role || "";
    setEditUser({ profile: { ...profile }, role: currentRole });
    setEditDialogOpen(true);
  };

  const deleteUser = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await supabase.functions.invoke("delete-user", {
        body: { user_id: deleteTarget.user_id },
      });
      if (res.error) throw new Error(res.error.message);
      if (res.data?.error) throw new Error(res.data.error);
      toast({ title: "User deleted", description: `${deleteTarget.full_name || "User"} has been removed` });
      setDeleteTarget(null);
      fetchData();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  const saveEdit = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.from("profiles").update({
        full_name: editUser.profile.full_name,
        phone: editUser.profile.phone,
        department: editUser.profile.department,
        email: (editUser.profile as any).email,
      }).eq("id", editUser.profile.id);
      if (error) throw error;

      if (editUser.role) {
        await updateRole(editUser.profile.user_id, editUser.role as AppRole);
      }

      toast({ title: "User updated" });
      setEditDialogOpen(false);
      fetchData();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  return (
    <div className="space-y-4 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">User Management</h1>
          <p className="text-muted-foreground text-sm">Manage user roles and permissions</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><UserPlus className="h-4 w-4 mr-2" />Create User</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <Input placeholder="Full Name" value={newUser.full_name} onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })} />
              <Input type="email" placeholder="Email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} />
              <Input type="password" placeholder="Password (min 6 chars)" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} />
              <Select value={newUser.department} onValueChange={(v) => setNewUser({ ...newUser, department: v })}>
                <SelectTrigger><SelectValue placeholder="Select Department" /></SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={newUser.role} onValueChange={(v) => setNewUser({ ...newUser, role: v as AppRole })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="network_engineer">Network Engineer</SelectItem>
                  <SelectItem value="support_agent">Support Agent</SelectItem>
                  <SelectItem value="client_experience">Client Experience</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={createUser} disabled={creating || !newUser.email || !newUser.password || !newUser.full_name} className="w-full">
                {creating ? "Creating..." : "Create Account"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          {profiles.length === 0 ? (
            <p className="text-muted-foreground text-sm py-12 text-center">No users yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-3 text-muted-foreground font-medium text-xs">User</th>
                    <th className="text-left p-3 text-muted-foreground font-medium text-xs">Department</th>
                    <th className="text-left p-3 text-muted-foreground font-medium text-xs">Role</th>
                    <th className="text-left p-3 text-muted-foreground font-medium text-xs">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {profiles.map((p) => {
                    const currentRole = roleMap[p.user_id]?.role;
                    return (
                      <tr key={p.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-medium">
                              {p.full_name?.[0]?.toUpperCase() || "U"}
                            </div>
                            <div>
                              <p className="text-foreground font-medium">{p.full_name || "—"}</p>
                              <p className="text-[10px] text-muted-foreground">{(p as any).email || p.phone || "—"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-muted-foreground">{p.department || "—"}</td>
                        <td className="p-3">
                          <Badge variant="outline" className="capitalize text-[10px]">
                            {currentRole?.replace(/_/g, " ") || "No role"}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(p)}>
                            <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Full Name</label>
              <Input value={editUser.profile.full_name || ""} onChange={(e) => setEditUser({ ...editUser, profile: { ...editUser.profile, full_name: e.target.value } })} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Email</label>
              <Input type="email" value={(editUser.profile as any).email || ""} onChange={(e) => setEditUser({ ...editUser, profile: { ...editUser.profile, email: e.target.value } as any })} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Phone</label>
              <Input value={editUser.profile.phone || ""} onChange={(e) => setEditUser({ ...editUser, profile: { ...editUser.profile, phone: e.target.value } })} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Department</label>
              <Select value={editUser.profile.department || ""} onValueChange={(v) => setEditUser({ ...editUser, profile: { ...editUser.profile, department: v } })}>
                <SelectTrigger><SelectValue placeholder="Select Department" /></SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Role</label>
              <Select value={editUser.role as string} onValueChange={(v) => setEditUser({ ...editUser, role: v as AppRole })}>
                <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="network_engineer">Network Engineer</SelectItem>
                  <SelectItem value="support_agent">Support Agent</SelectItem>
                  <SelectItem value="client_experience">Client Experience</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={saveEdit} disabled={saving} className="w-full">
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
