import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Copy, Plus, Trash2 } from "lucide-react";

type System = any;
type ClientRow = { id: string; name: string };

const emptySystem = {
  name: "",
  base_url: "",
  auth_header_name: "Authorization",
  auth_header_prefix: "Bearer ",
  api_key_secret_name: "PARTNER_ISP_API_KEY",
  create_path: "/tickets",
  update_path: "/tickets/{external_id}",
  comment_path: "/tickets/{external_id}/comments",
  close_path: "",
  update_method: "PATCH",
  field_map: "{}",
  status_map: "{}",
  inbound_status_map: "{}",
  priority_map: "{}",
  auto_escalate: false,
  active: true,
  notes: "",
};

export default function PartnerSystems() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [systems, setSystems] = useState<System[]>([]);
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [links, setLinks] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptySystem });
  const [linkForm, setLinkForm] = useState({ partner_system_id: "", client_id: "", partner_account_ref: "" });

  const load = async () => {
    const [s, c, l] = await Promise.all([
      (supabase as any).from("partner_systems").select("*").order("name"),
      supabase.from("clients").select("id, name").order("name"),
      (supabase as any).from("partner_client_accounts").select("*"),
    ]);
    setSystems(s.data || []);
    setClients((c.data as ClientRow[]) || []);
    setLinks(l.data || []);
  };

  useEffect(() => { load(); }, []);

  const webhookUrl = (token: string) =>
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/partner-webhook?token=${token}`;

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  };

  const startEdit = (s?: System) => {
    if (s) {
      setEditingId(s.id);
      setForm({
        ...emptySystem,
        ...s,
        close_path: s.close_path ?? "",
        notes: s.notes ?? "",
        field_map: JSON.stringify(s.field_map ?? {}, null, 0),
        status_map: JSON.stringify(s.status_map ?? {}, null, 0),
        inbound_status_map: JSON.stringify(s.inbound_status_map ?? {}, null, 0),
        priority_map: JSON.stringify(s.priority_map ?? {}, null, 0),
      });
    } else {
      setEditingId(null);
      setForm({ ...emptySystem });
    }
    setOpen(true);
  };

  const save = async () => {
    let maps: any;
    try {
      maps = {
        field_map: JSON.parse(form.field_map || "{}"),
        status_map: JSON.parse(form.status_map || "{}"),
        inbound_status_map: JSON.parse(form.inbound_status_map || "{}"),
        priority_map: JSON.parse(form.priority_map || "{}"),
      };
    } catch {
      toast({ title: "Invalid JSON", description: "Check the mapping fields.", variant: "destructive" });
      return;
    }
    const payload = {
      name: form.name,
      base_url: form.base_url,
      auth_header_name: form.auth_header_name,
      auth_header_prefix: form.auth_header_prefix,
      api_key_secret_name: form.api_key_secret_name,
      create_path: form.create_path,
      update_path: form.update_path,
      comment_path: form.comment_path,
      close_path: form.close_path || null,
      update_method: form.update_method,
      auto_escalate: form.auto_escalate,
      active: form.active,
      notes: form.notes || null,
      ...maps,
    };
    const q = editingId
      ? (supabase as any).from("partner_systems").update(payload).eq("id", editingId)
      : (supabase as any).from("partner_systems").insert({ ...payload, created_by: user?.id });
    const { error } = await q;
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    setOpen(false);
    load();
  };

  const remove = async (id: string) => {
    await (supabase as any).from("partner_systems").delete().eq("id", id);
    load();
  };

  const addLink = async () => {
    if (!linkForm.partner_system_id || !linkForm.client_id) return;
    const { error } = await (supabase as any).from("partner_client_accounts").insert({
      ...linkForm,
      partner_account_ref: linkForm.partner_account_ref || null,
      created_by: user?.id,
    });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    setLinkForm({ partner_system_id: "", client_id: "", partner_account_ref: "" });
    load();
  };

  const removeLink = async (id: string) => {
    await (supabase as any).from("partner_client_accounts").delete().eq("id", id);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Partner ISP Integration</h1>
          <p className="text-sm text-muted-foreground">Sync incidents with a partner ISP's ticketing system.</p>
        </div>
        <Button onClick={() => startEdit()}><Plus className="h-4 w-4 mr-1" /> Add system</Button>
      </div>

      <div className="grid gap-4">
        {systems.length === 0 && (
          <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">
            No partner systems configured yet.
          </CardContent></Card>
        )}
        {systems.map((s) => (
          <Card key={s.id}>
            <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base flex items-center gap-2">
                {s.name}
                <Badge variant={s.active ? "secondary" : "outline"} className="text-[9px]">{s.active ? "active" : "inactive"}</Badge>
                {s.auto_escalate && <Badge variant="outline" className="text-[9px]">auto-escalate</Badge>}
              </CardTitle>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => startEdit(s)}>Edit</Button>
                <Button size="icon" variant="ghost" onClick={() => remove(s.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="text-muted-foreground break-all">{s.base_url}</p>
              <div className="space-y-1">
                <Label className="text-xs">Inbound webhook URL (give this to the partner)</Label>
                <div className="flex gap-2">
                  <Input readOnly value={webhookUrl(s.webhook_token)} className="text-xs" />
                  <Button size="icon" variant="outline" onClick={() => copy(webhookUrl(s.webhook_token))}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Linked client accounts</Label>
                <div className="flex flex-wrap gap-1.5">
                  {links.filter((l) => l.partner_system_id === s.id).map((l) => (
                    <Badge key={l.id} variant="secondary" className="gap-1">
                      {clients.find((c) => c.id === l.client_id)?.name || "Client"}
                      {l.partner_account_ref ? ` · ${l.partner_account_ref}` : ""}
                      <button onClick={() => removeLink(l.id)} className="ml-1 hover:text-destructive">×</button>
                    </Badge>
                  ))}
                  {links.filter((l) => l.partner_system_id === s.id).length === 0 && (
                    <span className="text-xs text-muted-foreground">None linked.</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {systems.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Link a client to a partner account</CardTitle></CardHeader>
          <CardContent className="grid gap-2 md:grid-cols-4">
            <Select value={linkForm.partner_system_id} onValueChange={(v) => setLinkForm({ ...linkForm, partner_system_id: v })}>
              <SelectTrigger><SelectValue placeholder="Partner system" /></SelectTrigger>
              <SelectContent>{systems.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={linkForm.client_id} onValueChange={(v) => setLinkForm({ ...linkForm, client_id: v })}>
              <SelectTrigger><SelectValue placeholder="Client" /></SelectTrigger>
              <SelectContent>{clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
            <Input placeholder="Partner account reference" value={linkForm.partner_account_ref}
              onChange={(e) => setLinkForm({ ...linkForm, partner_account_ref: e.target.value })} />
            <Button onClick={addLink}>Link</Button>
          </CardContent>
        </Card>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingId ? "Edit" : "Add"} partner system</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label className="text-xs">API base URL</Label><Input placeholder="https://api.partner.com/v1" value={form.base_url} onChange={(e) => setForm({ ...form, base_url: e.target.value })} /></div>
              <div><Label className="text-xs">Auth header name</Label><Input value={form.auth_header_name} onChange={(e) => setForm({ ...form, auth_header_name: e.target.value })} /></div>
              <div><Label className="text-xs">Auth header prefix</Label><Input value={form.auth_header_prefix} onChange={(e) => setForm({ ...form, auth_header_prefix: e.target.value })} /></div>
              <div className="col-span-2"><Label className="text-xs">API key secret name (stored in Lovable secrets)</Label><Input value={form.api_key_secret_name} onChange={(e) => setForm({ ...form, api_key_secret_name: e.target.value })} /></div>
              <div><Label className="text-xs">Create path</Label><Input value={form.create_path} onChange={(e) => setForm({ ...form, create_path: e.target.value })} /></div>
              <div><Label className="text-xs">Update path</Label><Input value={form.update_path} onChange={(e) => setForm({ ...form, update_path: e.target.value })} /></div>
              <div><Label className="text-xs">Comment path</Label><Input value={form.comment_path} onChange={(e) => setForm({ ...form, comment_path: e.target.value })} /></div>
              <div><Label className="text-xs">Close path (optional)</Label><Input value={form.close_path} onChange={(e) => setForm({ ...form, close_path: e.target.value })} /></div>
              <div>
                <Label className="text-xs">Update method</Label>
                <Select value={form.update_method} onValueChange={(v) => setForm({ ...form, update_method: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PATCH">PATCH</SelectItem>
                    <SelectItem value="PUT">PUT</SelectItem>
                    <SelectItem value="POST">POST</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Field map (ours → theirs)</Label><Textarea rows={2} value={form.field_map} onChange={(e) => setForm({ ...form, field_map: e.target.value })} placeholder='{"title":"subject"}' /></div>
              <div><Label className="text-xs">Priority map</Label><Textarea rows={2} value={form.priority_map} onChange={(e) => setForm({ ...form, priority_map: e.target.value })} placeholder='{"critical":"P1"}' /></div>
              <div><Label className="text-xs">Outbound status map</Label><Textarea rows={2} value={form.status_map} onChange={(e) => setForm({ ...form, status_map: e.target.value })} placeholder='{"resolved":"solved"}' /></div>
              <div><Label className="text-xs">Inbound status map (theirs → ours)</Label><Textarea rows={2} value={form.inbound_status_map} onChange={(e) => setForm({ ...form, inbound_status_map: e.target.value })} placeholder='{"solved":"resolved"}' /></div>
            </div>
            <Textarea rows={2} placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={form.auto_escalate} onCheckedChange={(v) => setForm({ ...form, auto_escalate: v })} /> Auto-escalate linked clients
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} /> Active
              </label>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={save} disabled={!form.name || !form.base_url}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
