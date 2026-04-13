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
import { Plus, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type Client = Database["public"]["Tables"]["clients"]["Row"];

export default function ClientList() {
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { canManageIncidents } = useAuth();
  const { toast } = useToast();
  const [form, setForm] = useState({ name: "", email: "", phone: "", location: "", service_type: "home" as Database["public"]["Enums"]["service_type"], notes: "" });

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
    setForm({ name: "", email: "", phone: "", location: "", service_type: "home", notes: "" });
    fetchClients();
  };

  const inputClass = "bg-[hsl(220,20%,10%)] border-[hsl(220,20%,18%)] text-[hsl(210,40%,98%)] placeholder:text-[hsl(215,20%,45%)]";

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[hsl(210,40%,98%)]">Clients</h1>
          <p className="text-[hsl(215,20%,65%)] text-sm">{filtered.length} client{filtered.length !== 1 ? "s" : ""}</p>
        </div>
        {canManageIncidents && (
          <Button onClick={() => setCreateOpen(true)} className="gap-2"><Plus className="h-4 w-4" /> Add Client</Button>
        )}
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(215,20%,45%)]" />
        <Input placeholder="Search clients..." value={search} onChange={(e) => setSearch(e.target.value)} className={`pl-9 ${inputClass}`} />
      </div>

      <Card className="bg-[hsl(220,30%,8%)] border-[hsl(220,20%,15%)] overflow-hidden">
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <p className="text-[hsl(215,20%,45%)] text-sm py-12 text-center">No clients found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[hsl(220,20%,15%)]">
                    <th className="text-left p-3 text-[hsl(215,20%,45%)] font-medium text-xs">Name</th>
                    <th className="text-left p-3 text-[hsl(215,20%,45%)] font-medium text-xs">Email</th>
                    <th className="text-left p-3 text-[hsl(215,20%,45%)] font-medium text-xs">Phone</th>
                    <th className="text-left p-3 text-[hsl(215,20%,45%)] font-medium text-xs">Location</th>
                    <th className="text-left p-3 text-[hsl(215,20%,45%)] font-medium text-xs">Type</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => (
                    <tr key={c.id} className="border-b border-[hsl(220,20%,15%)] hover:bg-[hsl(220,20%,10%)] transition-colors">
                      <td className="p-3 text-[hsl(210,40%,98%)] font-medium">{c.name}</td>
                      <td className="p-3 text-[hsl(215,20%,65%)]">{c.email || "—"}</td>
                      <td className="p-3 text-[hsl(215,20%,65%)]">{c.phone || "—"}</td>
                      <td className="p-3 text-[hsl(215,20%,65%)]">{c.location || "—"}</td>
                      <td className="p-3"><Badge variant="outline" className="capitalize text-[10px]">{c.service_type}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="bg-[hsl(220,30%,8%)] border-[hsl(220,20%,15%)] text-[hsl(210,40%,98%)]">
          <DialogHeader><DialogTitle>Add Client</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <Input placeholder="Name *" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} />
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClass} />
              <Input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputClass} />
            </div>
            <Input placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className={inputClass} />
            <Select value={form.service_type} onValueChange={(v) => setForm({ ...form, service_type: v as any })}>
              <SelectTrigger className={inputClass}><SelectValue /></SelectTrigger>
              <SelectContent className="bg-[hsl(220,30%,10%)] border-[hsl(220,20%,18%)]">
                <SelectItem value="home">Home</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>
            <Textarea placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={inputClass} rows={2} />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)} className="border-[hsl(220,20%,18%)] text-[hsl(215,20%,65%)]">Cancel</Button>
              <Button type="submit">Create</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
