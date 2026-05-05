import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, Users, UserCheck, UserX, Phone } from "lucide-react";
import { TablePagination, usePaginatedSlice } from "@/components/crm/TablePagination";

const LEAD_TYPES = ["home", "sme", "enterprise"] as const;
const LEAD_SOURCES = ["referral", "website", "walk_in", "campaign"] as const;
const LEAD_STATUSES = ["new", "contacted", "qualified", "unqualified"] as const;

const statusColors: Record<string, string> = {
  new: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  contacted: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  qualified: "bg-green-500/20 text-green-400 border-green-500/30",
  unqualified: "bg-red-500/20 text-red-400 border-red-500/30",
};

const typeColors: Record<string, string> = {
  home: "bg-primary/20 text-primary border-primary/30",
  sme: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  enterprise: "bg-orange-500/20 text-orange-400 border-orange-500/30",
};

interface Lead {
  id: string;
  name: string;
  company_name: string | null;
  phone: string | null;
  email: string | null;
  location: string | null;
  lead_type: string;
  source: string;
  status: string;
  assigned_to: string | null;
  notes: string | null;
  converted_deal_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface Profile {
  user_id: string;
  full_name: string | null;
}

const emptyForm = {
  name: "",
  company_name: "",
  phone: "",
  email: "",
  location: "",
  lead_type: "home" as string,
  source: "website" as string,
  status: "new" as string,
  assigned_to: "__unassigned__",
  notes: "",
};

export default function SalesLeads() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selected, setSelected] = useState<Lead | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const fetchData = async () => {
    const [leadsRes, profilesRes] = await Promise.all([
      supabase.from("leads").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("user_id, full_name"),
    ]);
    if (leadsRes.data) setLeads(leadsRes.data as unknown as Lead[]);
    if (profilesRes.data) setProfiles(profilesRes.data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const profileMap = Object.fromEntries(profiles.map(p => [p.user_id, p.full_name || "Unknown"]));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const { error } = await supabase.from("leads").insert({
      name: form.name,
      company_name: form.company_name || null,
      phone: form.phone || null,
      email: form.email || null,
      location: form.location || null,
      lead_type: form.lead_type as any,
      source: form.source as any,
      status: form.status as any,
      assigned_to: form.assigned_to && form.assigned_to !== "__unassigned__" ? form.assigned_to : null,
      notes: form.notes || null,
      created_by: user.id,
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Lead created" });
      setCreateOpen(false);
      setForm(emptyForm);
      fetchData();
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    const { error } = await supabase.from("leads").update({
      name: form.name,
      company_name: form.company_name || null,
      phone: form.phone || null,
      email: form.email || null,
      location: form.location || null,
      lead_type: form.lead_type as any,
      source: form.source as any,
      status: form.status as any,
      assigned_to: form.assigned_to && form.assigned_to !== "__unassigned__" ? form.assigned_to : null,
      notes: form.notes || null,
    }).eq("id", selected.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Lead updated" });
      setEditOpen(false);
      fetchData();
    }
  };

  const openEdit = (lead: Lead) => {
    setSelected(lead);
    setForm({
      name: lead.name,
      company_name: lead.company_name || "",
      phone: lead.phone || "",
      email: lead.email || "",
      location: lead.location || "",
      lead_type: lead.lead_type,
      source: lead.source,
      status: lead.status,
      assigned_to: lead.assigned_to || "__unassigned__",
      notes: lead.notes || "",
    });
    setEditOpen(true);
  };

  const filtered = leads.filter(l => {
    const matchSearch = !search || [l.name, l.company_name, l.email, l.location].some(f => f?.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = statusFilter === "all" || l.status === statusFilter;
    const matchType = typeFilter === "all" || l.lead_type === typeFilter;
    return matchSearch && matchStatus && matchType;
  });

  useEffect(() => { setPage(1); }, [search, statusFilter, typeFilter]);
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const stats = {
    total: leads.length,
    qualified: leads.filter(l => l.status === "qualified").length,
    unqualified: leads.filter(l => l.status === "unqualified").length,
    new: leads.filter(l => l.status === "new").length,
  };

  const renderLeadForm = (onSubmit: (e: React.FormEvent) => void, submitLabel: string) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div><Label>Name *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
        <div><Label>Company</Label><Input value={form.company_name} onChange={e => setForm({ ...form, company_name: e.target.value })} /></div>
        <div><Label>Phone</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
        <div><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
        <div><Label>Location</Label><Input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} /></div>
        <div>
          <Label>Lead Type</Label>
          <Select value={form.lead_type} onValueChange={v => setForm({ ...form, lead_type: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{LEAD_TYPES.map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label>Source</Label>
          <Select value={form.source} onValueChange={v => setForm({ ...form, source: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{LEAD_SOURCES.map(s => <SelectItem key={s} value={s} className="capitalize">{s.replace("_", " ")}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label>Status</Label>
          <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{LEAD_STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label>Assign To</Label>
          <Select value={form.assigned_to} onValueChange={v => setForm({ ...form, assigned_to: v })}>
            <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__unassigned__">Unassigned</SelectItem>
              {profiles.map(p => <SelectItem key={p.user_id} value={p.user_id}>{p.full_name || "Unknown"}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
      <Button type="submit" className="w-full">{submitLabel}</Button>
    </form>
  );

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Leads</h1>
          <p className="text-muted-foreground text-sm">Manage and track potential customers</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />New Lead</Button></DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>Create Lead</DialogTitle></DialogHeader>
            {renderLeadForm(handleCreate, "Create Lead")}
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 flex items-center gap-3"><Users className="h-8 w-8 text-primary" /><div><p className="text-2xl font-bold text-foreground">{stats.total}</p><p className="text-xs text-muted-foreground">Total Leads</p></div></CardContent></Card>
        <Card><CardContent className="pt-4 flex items-center gap-3"><Phone className="h-8 w-8 text-blue-400" /><div><p className="text-2xl font-bold text-foreground">{stats.new}</p><p className="text-xs text-muted-foreground">New</p></div></CardContent></Card>
        <Card><CardContent className="pt-4 flex items-center gap-3"><UserCheck className="h-8 w-8 text-green-400" /><div><p className="text-2xl font-bold text-foreground">{stats.qualified}</p><p className="text-xs text-muted-foreground">Qualified</p></div></CardContent></Card>
        <Card><CardContent className="pt-4 flex items-center gap-3"><UserX className="h-8 w-8 text-red-400" /><div><p className="text-2xl font-bold text-foreground">{stats.unqualified}</p><p className="text-xs text-muted-foreground">Unqualified</p></div></CardContent></Card>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search leads..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" /></div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {LEAD_STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {LEAD_TYPES.map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No leads found</TableCell></TableRow>
            ) : paginated.map(lead => (
              <TableRow key={lead.id}>
                <TableCell>
                  <div>
                    <p className="font-medium text-foreground">{lead.name}</p>
                    {lead.company_name && <p className="text-xs text-muted-foreground">{lead.company_name}</p>}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {lead.email && <p className="text-muted-foreground">{lead.email}</p>}
                    {lead.phone && <p className="text-muted-foreground">{lead.phone}</p>}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{lead.location || "—"}</TableCell>
                <TableCell><Badge variant="outline" className={typeColors[lead.lead_type]}>{lead.lead_type}</Badge></TableCell>
                <TableCell className="text-muted-foreground capitalize">{lead.source.replace("_", " ")}</TableCell>
                <TableCell><Badge variant="outline" className={statusColors[lead.status]}>{lead.status}</Badge></TableCell>
                <TableCell className="text-muted-foreground">{lead.assigned_to ? profileMap[lead.assigned_to] || "Unknown" : "—"}</TableCell>
                <TableCell><Button variant="ghost" size="sm" onClick={() => openEdit(lead)}>Edit</Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {filtered.length > 0 && (
          <TablePagination
            page={page}
            pageSize={pageSize}
            total={filtered.length}
            onPageChange={setPage}
            onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
          />
        )}
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Edit Lead</DialogTitle></DialogHeader>
          {renderLeadForm(handleEdit, "Save Changes")}
        </DialogContent>
      </Dialog>
    </div>
  );
}
