import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { KeyRound, Plus, Trash2 } from "lucide-react";

type Row = { user_id: string; client_id: string; created_at: string; email: string | null; full_name: string | null; client_name: string };

export default function ClientLogins() {
  const { toast } = useToast();
  const [rows, setRows] = useState<Row[]>([]);
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", full_name: "", client_id: "" });

  const load = async () => {
    setLoading(true);
    const [cu, cl, pr] = await Promise.all([
      supabase.from("client_users").select("user_id,client_id,created_at"),
      supabase.from("clients").select("id,name").order("name"),
      supabase.from("profiles").select("user_id,email,full_name"),
    ]);
    const clientMap = new Map((cl.data ?? []).map((c) => [c.id, c.name]));
    const profMap = new Map((pr.data ?? []).map((p: any) => [p.user_id, p]));
    setClients((cl.data as any) ?? []);
    setRows(
      ((cu.data as any[]) ?? []).map((r) => ({
        ...r,
        email: profMap.get(r.user_id)?.email ?? null,
        full_name: profMap.get(r.user_id)?.full_name ?? null,
        client_name: clientMap.get(r.client_id) ?? "—",
      })),
    );
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const canSubmit = useMemo(
    () => form.email.includes("@") && form.password.length >= 8 && !!form.client_id,
    [form],
  );

  const create = async () => {
    setSaving(true);
    const { data, error } = await supabase.functions.invoke("create-user", {
      body: { email: form.email.trim(), password: form.password, full_name: form.full_name.trim(), client_id: form.client_id },
    });
    setSaving(false);
    if (error || (data as any)?.error) {
      toast({ title: "Could not create login", description: (data as any)?.error ?? error?.message, variant: "destructive" });
      return;
    }
    toast({ title: "Client login created", description: `${form.email} can now sign in to the client portal.` });
    setForm({ email: "", password: "", full_name: "", client_id: "" });
    setOpen(false);
    load();
  };

  const resetPassword = async (userId: string, email: string | null) => {
    const password = prompt(`New password for ${email || "this portal account"} (min 8 characters)`);
    if (!password || password.length < 8) return;
    const { data, error } = await supabase.functions.invoke("reset-user-password", { body: { user_id: userId, password } });
    if (error || (data as any)?.error) {
      toast({ title: "Reset failed", description: (data as any)?.error ?? error?.message, variant: "destructive" });
      return;
    }
    toast({ title: "Password updated" });
  };

  const remove = async (userId: string) => {
    if (!confirm("Remove this client login? The user will lose portal access.")) return;
    const { data, error } = await supabase.functions.invoke("delete-user", { body: { user_id: userId } });
    if (error || (data as any)?.error) {
      toast({ title: "Delete failed", description: (data as any)?.error ?? error?.message, variant: "destructive" });
      return;
    }
    toast({ title: "Client login removed" });
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Client Logins</h1>
          <p className="text-sm text-muted-foreground">Portal accounts for clients — performance and incidents only</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />New client login</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create client login</DialogTitle></DialogHeader>
            <div className="space-y-3 mt-2">
              <div className="space-y-1.5">
                <Label>Client company *</Label>
                <Select value={form.client_id} onValueChange={(v) => setForm({ ...form, client_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Contact name</Label>
                <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Email *</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Temporary password *</Label>
                <Input type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Min 8 characters" />
              </div>
              <Button className="w-full" disabled={!canSubmit || saving} onClick={create}>
                {saving ? "Creating…" : "Create login"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Existing portal accounts</CardTitle></CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <p className="text-sm text-muted-foreground py-12 text-center">Loading…</p>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground py-12 text-center">No client logins yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground">Client</th>
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground">Contact</th>
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground">Email</th>
                    <th className="text-right p-3 text-xs font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.user_id} className="border-b border-border">
                      <td className="p-3">{r.client_name}</td>
                      <td className="p-3 text-muted-foreground">{r.full_name || "—"}</td>
                      <td className="p-3 text-muted-foreground">{r.email || "—"}</td>
                      <td className="p-3 text-right space-x-1">
                        <Button size="sm" variant="ghost" onClick={() => resetPassword(r.email)}>
                          <KeyRound className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => remove(r.user_id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}