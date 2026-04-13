import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type Client = Database["public"]["Tables"]["clients"]["Row"];

const emptyForm = { name: "", email: "", phone: "", location: "", service_type: "home" as Database["public"]["Enums"]["service_type"], notes: "" };

export default function ClientList() {
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const { canManageIncidents, isAdmin } = useAuth();
  const { toast } = useToast();
  const [form, setForm] = useState(emptyForm);

  const fetchClients = async () => {
    const { data } = await supabase.from("clients").select("*").order("name");
    if (data) setClients(data);
    setLoading(false);
  };

  useEffect(() => { fetchClients(); }, []);

  const filtered = clients.filter((c) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return c.name.toLowerCase().includes(s) || (c.email || "").toLowerCase().includes(s) || (c.location || "").toLowerCase().includes(s);
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("clients").insert({ ...form, notes: form.notes || null });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Client created" });
    setCreateOpen(false);
    setForm(emptyForm);
    fetchClients();
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) return;
    const { error } = await supabase.from("clients").update({ ...form, notes: form.notes || null }).eq("id", selectedClient.id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Client updated" });
    setEditOpen(false);
    setSelectedClient(null);
    setForm(emptyForm);
    fetchClients();
  };

  const handleDelete = async () => {
    if (!selectedClient) return;
    const { error } = await supabase.from("clients").delete().eq("id", selectedClient.id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Client deleted" });
    setDeleteOpen(false);
    setSelectedClient(null);
    fetchClients();
  };

  const openEdit = (client: Client) => {
    setSelectedClient(client);
    setForm({
      name: client.name,
      email: client.email || "",
      phone: client.phone || "",
      location: client.location || "",
      service_type: client.service_type,
      notes: client.notes || "",
    });
    setEditOpen(true);
  };

  const openDelete = (client: Client) => {
    setSelectedClient(client);
    setDeleteOpen(true);
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  const ClientForm = ({ onSubmit, submitLabel }: { onSubmit: (e: React.FormEvent) => void; submitLabel: string }) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <Input placeholder="Name *" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      <div className="grid grid-cols-2 gap-3">
        <Input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <Input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
      </div>
      <Input placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
      <Select value={form.service_type} onValueChange={(v) => setForm({ ...form, service_type: v as any })}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="home">Home</SelectItem>
          <SelectItem value="enterprise">Enterprise</SelectItem>
        </SelectContent>
      </Select>
      <Textarea placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => { setCreateOpen(false); setEditOpen(false); }}>Cancel</Button>
        <Button type="submit">{submitLabel}</Button>
      </div>
    </form>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Clients</h1>
          <p className="text-muted-foreground text-sm">{filtered.length} client{filtered.length !== 1 ? "s" : ""}</p>
        </div>
        {canManageIncidents && (
          <Button onClick={() => { setForm(emptyForm); setCreateOpen(true); }} className="gap-2"><Plus className="h-4 w-4" /> Add Client</Button>
        )}
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search clients..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <p className="text-muted-foreground text-sm py-12 text-center">No clients found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-3 text-muted-foreground font-medium text-xs">Name</th>
                    <th className="text-left p-3 text-muted-foreground font-medium text-xs">Email</th>
                    <th className="text-left p-3 text-muted-foreground font-medium text-xs">Phone</th>
                    <th className="text-left p-3 text-muted-foreground font-medium text-xs">Location</th>
                    <th className="text-left p-3 text-muted-foreground font-medium text-xs">Type</th>
                    {canManageIncidents && <th className="text-right p-3 text-muted-foreground font-medium text-xs">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => (
                    <tr key={c.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                      <td className="p-3 text-foreground font-medium">{c.name}</td>
                      <td className="p-3 text-muted-foreground">{c.email || "—"}</td>
                      <td className="p-3 text-muted-foreground">{c.phone || "—"}</td>
                      <td className="p-3 text-muted-foreground">{c.location || "—"}</td>
                      <td className="p-3"><Badge variant="outline" className="capitalize text-[10px]">{c.service_type}</Badge></td>
                      {canManageIncidents && (
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(c)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            {isAdmin && (
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => openDelete(c)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Client</DialogTitle></DialogHeader>
          <ClientForm onSubmit={handleCreate} submitLabel="Create" />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Client</DialogTitle></DialogHeader>
          <ClientForm onSubmit={handleEdit} submitLabel="Save Changes" />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Client</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedClient?.name}"? This action cannot be undone and will also remove related data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
