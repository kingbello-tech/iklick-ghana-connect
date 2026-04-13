import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type UserRole = Database["public"]["Tables"]["user_roles"]["Row"];
type AppRole = Database["public"]["Enums"]["app_role"];

const ROLE_COLORS: Record<string, string> = {
  admin: "hsl(0, 84%, 60%)",
  network_engineer: "hsl(195, 100%, 42%)",
  support_agent: "hsl(142, 71%, 45%)",
  viewer: "hsl(215, 20%, 65%)",
};

export default function UserManagement() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

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

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  return (
    <div className="space-y-4 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-[hsl(210,40%,98%)]">User Management</h1>
        <p className="text-[hsl(215,20%,65%)] text-sm">Manage user roles and permissions</p>
      </div>

      <Card className="bg-[hsl(220,30%,8%)] border-[hsl(220,20%,15%)]">
        <CardContent className="p-0">
          {profiles.length === 0 ? (
            <p className="text-[hsl(215,20%,45%)] text-sm py-12 text-center">No users yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[hsl(220,20%,15%)]">
                    <th className="text-left p-3 text-[hsl(215,20%,45%)] font-medium text-xs">User</th>
                    <th className="text-left p-3 text-[hsl(215,20%,45%)] font-medium text-xs">Department</th>
                    <th className="text-left p-3 text-[hsl(215,20%,45%)] font-medium text-xs">Role</th>
                  </tr>
                </thead>
                <tbody>
                  {profiles.map((p) => {
                    const currentRole = roleMap[p.user_id]?.role;
                    return (
                      <tr key={p.id} className="border-b border-[hsl(220,20%,15%)] hover:bg-[hsl(220,20%,10%)] transition-colors">
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-medium">
                              {p.full_name?.[0]?.toUpperCase() || "U"}
                            </div>
                            <div>
                              <p className="text-[hsl(210,40%,98%)] font-medium">{p.full_name || "—"}</p>
                              <p className="text-[10px] text-[hsl(215,20%,45%)]">{p.phone || "—"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-[hsl(215,20%,65%)]">{p.department || "—"}</td>
                        <td className="p-3">
                          <Select value={currentRole || ""} onValueChange={(v) => updateRole(p.user_id, v as AppRole)}>
                            <SelectTrigger className="w-[180px] bg-[hsl(220,20%,10%)] border-[hsl(220,20%,18%)] text-[hsl(210,40%,98%)]">
                              <SelectValue placeholder="Assign role" />
                            </SelectTrigger>
                            <SelectContent className="bg-[hsl(220,30%,10%)] border-[hsl(220,20%,18%)]">
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="network_engineer">Network Engineer</SelectItem>
                              <SelectItem value="support_agent">Support Agent</SelectItem>
                              <SelectItem value="viewer">Viewer</SelectItem>
                            </SelectContent>
                          </Select>
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
    </div>
  );
}
