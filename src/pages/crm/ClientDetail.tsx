import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClientContacts } from "@/components/crm/ClientContacts";
import { ArrowLeft, Plus, MapPin, Building2, AlertTriangle, TrendingUp, Trash2, Pencil, CheckCircle2, Clock } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { format } from "date-fns";

const sb = supabase as any;

type ID = string;

interface Client { id: string; name: string; email: string | null; phone: string | null; location: string | null; service_type: string; notes: string | null; }
interface Site { id: string; client_id: string; name: string; location: string | null; gps_address: string | null; service_type: string | null; bandwidth: string | null; status: string; go_live_date: string | null; notes: string | null; }
interface Contract { id: string; site_id: string; mrc: number; nrc: number; contract_start: string | null; contract_end: string | null; renewal_date: string | null; contract_duration_months: number | null; billing_reference: string | null; status: string; notes: string | null; }
interface Onboarding { id: string; site_id: string; current_stage: "survey"|"install"|"test"|"live"; survey_completed_at: string | null; install_completed_at: string | null; test_completed_at: string | null; live_at: string | null; notes: string | null; }
interface OnbTask { id: string; site_id: string; stage: string; title: string; status: string; assigned_to: string | null; due_date: string | null; completed_at: string | null; }
interface Incident { id: string; incident_number: string; title: string; status: string; priority: string; created_at: string; resolved_at: string | null; due_at: string | null; site_id: string | null; }
interface Satisfaction { rating: number; created_at: string; }
interface Churn { client_id: string; risk_level: string; manual_override: boolean; score: number; reason: string | null; churned_at: string | null; notes: string | null; last_assessed_at: string | null; }
interface ChurnLog { id: string; action: string; from_status: string | null; to_status: string | null; notes: string | null; performed_at: string; }

const STATUS_COLORS: Record<string, string> = {
  onboarding: "bg-blue-500/10 text-blue-600 border-blue-500/30",
  active: "bg-green-500/10 text-green-600 border-green-500/30",
  suspended: "bg-yellow-500/10 text-yellow-600 border-yellow-500/30",
  churned: "bg-red-500/10 text-red-600 border-red-500/30",
};
const RISK_COLORS: Record<string, string> = {
  low: "bg-green-500/10 text-green-600 border-green-500/30",
  medium: "bg-yellow-500/10 text-yellow-600 border-yellow-500/30",
  high: "bg-orange-500/10 text-orange-600 border-orange-500/30",
  churned: "bg-red-500/10 text-red-600 border-red-500/30",
};

export default function ClientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin, canManageIncidents } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [client, setClient] = useState<Client | null>(null);
  const [sites, setSites] = useState<Site[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [onboarding, setOnboarding] = useState<Onboarding[]>([]);
  const [tasks, setTasks] = useState<OnbTask[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [csat, setCsat] = useState<Satisfaction[]>([]);
  const [churn, setChurn] = useState<Churn | null>(null);
  const [churnLog, setChurnLog] = useState<ChurnLog[]>([]);

  const fetchAll = async () => {
    if (!id) return;
    const [clientRes, sitesRes, incRes, csatRes, churnRes, logRes] = await Promise.all([
      sb.from("clients").select("*").eq("id", id).single(),
      sb.from("client_sites").select("*").eq("client_id", id).order("created_at", { ascending: false }),
      sb.from("incidents").select("id,incident_number,title,status,priority,created_at,resolved_at,due_at,site_id").eq("client_id", id).order("created_at", { ascending: false }).limit(500),
      sb.from("client_satisfaction").select("rating,created_at").eq("client_id", id).order("created_at", { ascending: false }),
      sb.from("client_churn").select("*").eq("client_id", id).maybeSingle(),
      sb.from("client_churn_log").select("*").eq("client_id", id).order("performed_at", { ascending: false }).limit(50),
    ]);
    setClient(clientRes.data);
    setSites(sitesRes.data || []);
    setIncidents(incRes.data || []);
    setCsat(csatRes.data || []);
    setChurn(churnRes.data);
    setChurnLog(logRes.data || []);

    const siteIds = (sitesRes.data || []).map((s: Site) => s.id);
    if (siteIds.length) {
      const [contrRes, onbRes, taskRes] = await Promise.all([
        sb.from("site_contracts").select("*").in("site_id", siteIds).order("created_at", { ascending: false }),
        sb.from("site_onboarding").select("*").in("site_id", siteIds),
        sb.from("site_onboarding_tasks").select("*").in("site_id", siteIds).order("created_at", { ascending: false }),
      ]);
      setContracts(contrRes.data || []);
      setOnboarding(onbRes.data || []);
      setTasks(taskRes.data || []);
    } else {
      setContracts([]); setOnboarding([]); setTasks([]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchAll(); /* eslint-disable-next-line */ }, [id]);

  // ---- Derived metrics ----
  const activeSites = sites.filter((s) => s.status === "active").length;
  const onboardingSites = sites.filter((s) => s.status === "onboarding").length;
  const totalMRC = contracts.filter((c) => c.status === "active").reduce((sum, c) => sum + Number(c.mrc || 0), 0);
  const openIncidents = incidents.filter((i) => !["closed", "resolved"].includes(i.status)).length;
  const resolvedIncidents = incidents.filter((i) => i.resolved_at).length;
  const mttr = useMemo(() => {
    const resolved = incidents.filter((i) => i.resolved_at);
    if (!resolved.length) return null;
    const totalH = resolved.reduce((sum, i) => sum + (new Date(i.resolved_at!).getTime() - new Date(i.created_at).getTime()) / 3600000, 0);
    return totalH / resolved.length;
  }, [incidents]);
  const slaCompliance = useMemo(() => {
    const withDue = incidents.filter((i) => i.due_at && i.resolved_at);
    if (!withDue.length) return null;
    const met = withDue.filter((i) => new Date(i.resolved_at!) <= new Date(i.due_at!)).length;
    return (met / withDue.length) * 100;
  }, [incidents]);
  const csatAvg = csat.length ? csat.reduce((s, x) => s + x.rating, 0) / csat.length : null;

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  if (!client) return <div className="text-center py-12"><p className="text-muted-foreground">Client not found.</p><Button variant="outline" onClick={() => navigate("/crm/clients")} className="mt-4">Back to clients</Button></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/crm/clients")}><ArrowLeft className="h-4 w-4" /></Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><Building2 className="h-6 w-6 text-primary" />{client.name}</h1>
            <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1 flex-wrap">
              {client.email && <span>{client.email}</span>}
              {client.phone && <span>· {client.phone}</span>}
              {client.location && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{client.location}</span>}
              <Badge variant="outline" className="capitalize text-[10px]">{client.service_type}</Badge>
              {churn && <Badge className={`${RISK_COLORS[churn.risk_level]} border capitalize text-[10px]`}>{churn.risk_level} risk</Badge>}
            </div>
          </div>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <KPI label="Sites" value={sites.length} sub={`${activeSites} active · ${onboardingSites} onboarding`} />
        <KPI label="Monthly Recurring" value={`₵${totalMRC.toLocaleString()}`} sub="active contracts" />
        <KPI label="Open Incidents" value={openIncidents} sub={`${resolvedIncidents} resolved`} />
        <KPI label="SLA Compliance" value={slaCompliance == null ? "—" : `${slaCompliance.toFixed(0)}%`} sub={mttr == null ? "no MTTR" : `MTTR ${mttr.toFixed(1)}h`} />
        <KPI label="CSAT" value={csatAvg == null ? "—" : csatAvg.toFixed(1)} sub={`${csat.length} responses`} />
      </div>

      <Tabs defaultValue="sites" className="w-full">
        <TabsList className="flex w-full overflow-x-auto">
          <TabsTrigger value="sites">Sites</TabsTrigger>
          <TabsTrigger value="contracts">Contracts</TabsTrigger>
          <TabsTrigger value="onboarding">Onboarding</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="churn">Churn</TabsTrigger>
          <TabsTrigger value="incidents">Incidents</TabsTrigger>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
        </TabsList>

        <TabsContent value="sites"><SitesTab clientId={client.id} sites={sites} canEdit={canManageIncidents} isAdmin={isAdmin} onChange={fetchAll} /></TabsContent>
        <TabsContent value="contracts"><ContractsTab sites={sites} contracts={contracts} canEdit={canManageIncidents} isAdmin={isAdmin} onChange={fetchAll} /></TabsContent>
        <TabsContent value="onboarding"><OnboardingTab sites={sites} onboarding={onboarding} tasks={tasks} canEdit={canManageIncidents} userId={user?.id || ""} onChange={fetchAll} /></TabsContent>
        <TabsContent value="performance"><PerformanceTab incidents={incidents} sites={sites} /></TabsContent>
        <TabsContent value="churn"><ChurnTab clientId={client.id} churn={churn} log={churnLog} canEdit={canManageIncidents} userId={user?.id || ""} onChange={fetchAll} /></TabsContent>
        <TabsContent value="incidents"><IncidentsTab incidents={incidents} sites={sites} /></TabsContent>
        <TabsContent value="contacts">{client && <ClientContacts clientId={client.id} canEdit={canManageIncidents} />}</TabsContent>
      </Tabs>
    </div>
  );
}

function KPI({ label, value, sub }: { label: string; value: any; sub?: string }) {
  return (
    <Card><CardContent className="p-4">
      <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold mt-1 text-foreground">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </CardContent></Card>
  );
}

// =================== SITES TAB ===================
function SitesTab({ clientId, sites, canEdit, isAdmin, onChange }: { clientId: string; sites: Site[]; canEdit: boolean; isAdmin: boolean; onChange: () => void }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Site | null>(null);
  const emptyForm = { name: "", location: "", gps_address: "", service_type: "enterprise", bandwidth: "", status: "onboarding", go_live_date: "", notes: "" };
  const [form, setForm] = useState<any>(emptyForm);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setOpen(true); };
  const openEdit = (s: Site) => {
    setEditing(s);
    setForm({ name: s.name, location: s.location || "", gps_address: s.gps_address || "", service_type: s.service_type || "enterprise", bandwidth: s.bandwidth || "", status: s.status, go_live_date: s.go_live_date || "", notes: s.notes || "" });
    setOpen(true);
  };
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...form, client_id: clientId, go_live_date: form.go_live_date || null, location: form.location || null, gps_address: form.gps_address || null, bandwidth: form.bandwidth || null, notes: form.notes || null };
    const { error } = editing
      ? await sb.from("client_sites").update(payload).eq("id", editing.id)
      : await sb.from("client_sites").insert(payload);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: editing ? "Site updated" : "Site added" });
    setOpen(false); onChange();
  };
  const del = async (s: Site) => {
    if (!confirm(`Delete site "${s.name}"?`)) return;
    const { error } = await sb.from("client_sites").delete().eq("id", s.id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Site deleted" }); onChange();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{sites.length} site{sites.length !== 1 ? "s" : ""}</p>
        {canEdit && <Button onClick={openCreate} size="sm" className="gap-2"><Plus className="h-4 w-4" /> Add Site</Button>}
      </div>
      {sites.length === 0 ? (
        <Card><CardContent className="p-12 text-center text-muted-foreground text-sm">No sites yet. Add the client's first site to begin tracking.</CardContent></Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {sites.map((s) => (
            <Card key={s.id} className="hover:border-primary/50 transition-colors">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-foreground">{s.name}</h3>
                    {s.location && <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><MapPin className="h-3 w-3" />{s.location}</p>}
                  </div>
                  <Badge className={`${STATUS_COLORS[s.status]} border capitalize text-[10px]`}>{s.status}</Badge>
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  {s.service_type && <span className="capitalize">{s.service_type}</span>}
                  {s.bandwidth && <span>· {s.bandwidth}</span>}
                  {s.go_live_date && <span>· live {format(new Date(s.go_live_date), "PP")}</span>}
                </div>
                {canEdit && (
                  <div className="flex justify-end gap-1 pt-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(s)}><Pencil className="h-4 w-4" /></Button>
                    {isAdmin && <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => del(s)}><Trash2 className="h-4 w-4" /></Button>}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Site" : "Add Site"}</DialogTitle></DialogHeader>
          <form onSubmit={submit} className="space-y-3">
            <Input placeholder="Site name *" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            <Input placeholder="GPS / digital address" value={form.gps_address} onChange={(e) => setForm({ ...form, gps_address: e.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <Select value={form.service_type} onValueChange={(v) => setForm({ ...form, service_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="home">Home</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
              <Input placeholder="Bandwidth (e.g. 50Mbps)" value={form.bandwidth} onChange={(e) => setForm({ ...form, bandwidth: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="onboarding">Onboarding</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="churned">Churned</SelectItem>
                </SelectContent>
              </Select>
              <Input type="date" placeholder="Go-live date" value={form.go_live_date} onChange={(e) => setForm({ ...form, go_live_date: e.target.value })} />
            </div>
            <Textarea placeholder="Notes" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit">{editing ? "Save" : "Add Site"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// =================== CONTRACTS TAB ===================
function ContractsTab({ sites, contracts, canEdit, isAdmin, onChange }: { sites: Site[]; contracts: Contract[]; canEdit: boolean; isAdmin: boolean; onChange: () => void }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Contract | null>(null);
  const emptyForm = { site_id: "", mrc: "0", nrc: "0", contract_start: "", contract_end: "", renewal_date: "", contract_duration_months: "12", billing_reference: "", status: "pending", notes: "" };
  const [form, setForm] = useState<any>(emptyForm);

  const siteName = (id: string) => sites.find((s) => s.id === id)?.name || "—";
  const openCreate = () => { setEditing(null); setForm({ ...emptyForm, site_id: sites[0]?.id || "" }); setOpen(true); };
  const openEdit = (c: Contract) => {
    setEditing(c);
    setForm({ site_id: c.site_id, mrc: String(c.mrc), nrc: String(c.nrc), contract_start: c.contract_start || "", contract_end: c.contract_end || "", renewal_date: c.renewal_date || "", contract_duration_months: String(c.contract_duration_months ?? 12), billing_reference: c.billing_reference || "", status: c.status, notes: c.notes || "" });
    setOpen(true);
  };
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = {
      site_id: form.site_id, mrc: Number(form.mrc), nrc: Number(form.nrc),
      contract_start: form.contract_start || null, contract_end: form.contract_end || null,
      renewal_date: form.renewal_date || null,
      contract_duration_months: form.contract_duration_months ? Number(form.contract_duration_months) : null,
      billing_reference: form.billing_reference || null, status: form.status, notes: form.notes || null,
    };
    const { error } = editing
      ? await sb.from("site_contracts").update(payload).eq("id", editing.id)
      : await sb.from("site_contracts").insert(payload);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: editing ? "Contract updated" : "Contract created" });
    setOpen(false); onChange();
  };
  const del = async (c: Contract) => {
    if (!confirm("Delete this contract?")) return;
    const { error } = await sb.from("site_contracts").delete().eq("id", c.id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    onChange();
  };

  const upcoming = contracts.filter((c) => c.renewal_date && new Date(c.renewal_date) <= new Date(Date.now() + 60 * 86400000) && c.status === "active");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{contracts.length} contract{contracts.length !== 1 ? "s" : ""}</p>
        {canEdit && sites.length > 0 && <Button size="sm" onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" /> Add Contract</Button>}
      </div>
      {upcoming.length > 0 && (
        <Card className="border-yellow-500/30 bg-yellow-500/5">
          <CardContent className="p-3 flex items-center gap-2 text-sm">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            {upcoming.length} contract{upcoming.length !== 1 ? "s" : ""} up for renewal in the next 60 days.
          </CardContent>
        </Card>
      )}
      {sites.length === 0 ? (
        <Card><CardContent className="p-12 text-center text-muted-foreground text-sm">Add a site first before creating contracts.</CardContent></Card>
      ) : contracts.length === 0 ? (
        <Card><CardContent className="p-12 text-center text-muted-foreground text-sm">No contracts yet.</CardContent></Card>
      ) : (
        <Card><CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border text-xs text-muted-foreground">
              <th className="text-left p-3">Site</th><th className="text-left p-3">MRC</th><th className="text-left p-3">NRC</th>
              <th className="text-left p-3">Start</th><th className="text-left p-3">End</th>
              <th className="text-left p-3">Renewal</th><th className="text-left p-3">Ref</th>
              <th className="text-left p-3">Status</th>{canEdit && <th></th>}
            </tr></thead>
            <tbody>
              {contracts.map((c) => (
                <tr key={c.id} className="border-b border-border hover:bg-muted/40">
                  <td className="p-3 font-medium">{siteName(c.site_id)}</td>
                  <td className="p-3">₵{Number(c.mrc).toLocaleString()}</td>
                  <td className="p-3">₵{Number(c.nrc).toLocaleString()}</td>
                  <td className="p-3 text-muted-foreground">{c.contract_start ? format(new Date(c.contract_start), "PP") : "—"}</td>
                  <td className="p-3 text-muted-foreground">{c.contract_end ? format(new Date(c.contract_end), "PP") : "—"}</td>
                  <td className="p-3 text-muted-foreground">{c.renewal_date ? format(new Date(c.renewal_date), "PP") : "—"}</td>
                  <td className="p-3 text-muted-foreground">{c.billing_reference || "—"}</td>
                  <td className="p-3"><Badge variant="outline" className="capitalize text-[10px]">{c.status}</Badge></td>
                  {canEdit && <td className="p-3 text-right whitespace-nowrap">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(c)}><Pencil className="h-4 w-4" /></Button>
                    {isAdmin && <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => del(c)}><Trash2 className="h-4 w-4" /></Button>}
                  </td>}
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent></Card>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Contract" : "New Contract"}</DialogTitle></DialogHeader>
          <form onSubmit={submit} className="space-y-3">
            <Select value={form.site_id} onValueChange={(v) => setForm({ ...form, site_id: v })}>
              <SelectTrigger><SelectValue placeholder="Site" /></SelectTrigger>
              <SelectContent>{sites.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
            </Select>
            <div className="grid grid-cols-2 gap-3">
              <Input type="number" step="0.01" placeholder="MRC" value={form.mrc} onChange={(e) => setForm({ ...form, mrc: e.target.value })} />
              <Input type="number" step="0.01" placeholder="NRC" value={form.nrc} onChange={(e) => setForm({ ...form, nrc: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs text-muted-foreground">Start</label><Input type="date" value={form.contract_start} onChange={(e) => setForm({ ...form, contract_start: e.target.value })} /></div>
              <div><label className="text-xs text-muted-foreground">End</label><Input type="date" value={form.contract_end} onChange={(e) => setForm({ ...form, contract_end: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs text-muted-foreground">Renewal</label><Input type="date" value={form.renewal_date} onChange={(e) => setForm({ ...form, renewal_date: e.target.value })} /></div>
              <Input type="number" placeholder="Duration (months)" value={form.contract_duration_months} onChange={(e) => setForm({ ...form, contract_duration_months: e.target.value })} />
            </div>
            <Input placeholder="Billing reference" value={form.billing_reference} onChange={(e) => setForm({ ...form, billing_reference: e.target.value })} />
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Textarea placeholder="Notes" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit">{editing ? "Save" : "Create"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// =================== ONBOARDING TAB ===================
const STAGES: { key: "survey"|"install"|"test"|"live"; label: string }[] = [
  { key: "survey", label: "Survey" },
  { key: "install", label: "Install" },
  { key: "test", label: "Test" },
  { key: "live", label: "Live" },
];

function OnboardingTab({ sites, onboarding, tasks, canEdit, userId, onChange }: { sites: Site[]; onboarding: Onboarding[]; tasks: OnbTask[]; canEdit: boolean; userId: string; onChange: () => void }) {
  const { toast } = useToast();
  const onbBySite: Record<string, Onboarding> = {};
  onboarding.forEach((o) => { onbBySite[o.site_id] = o; });
  const onboardingSites = sites.filter((s) => s.status === "onboarding" || (onbBySite[s.id] && onbBySite[s.id].current_stage !== "live"));

  const [taskOpen, setTaskOpen] = useState(false);
  const [taskSiteId, setTaskSiteId] = useState<string>("");
  const [taskForm, setTaskForm] = useState({ title: "", stage: "survey", due_date: "", description: "" });

  const advance = async (site: Site, current: Onboarding | undefined) => {
    if (!current) return;
    const order: ("survey"|"install"|"test"|"live")[] = ["survey","install","test","live"];
    const idx = order.indexOf(current.current_stage);
    if (idx === -1 || idx >= order.length - 1) return;
    const next = order[idx + 1];
    const stampField: any = {
      survey: "survey_completed_at",
      install: "install_completed_at",
      test: "test_completed_at",
    }[current.current_stage as "survey"|"install"|"test"];
    const update: any = { current_stage: next, [stampField]: new Date().toISOString() };
    if (next === "live") {
      update.live_at = new Date().toISOString();
      // also mark site active
      await sb.from("client_sites").update({ status: "active", go_live_date: new Date().toISOString().slice(0,10) }).eq("id", site.id);
    }
    const { error } = await sb.from("site_onboarding").update(update).eq("id", current.id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: `Moved to ${next}` });
    onChange();
  };

  const openTask = (siteId: string, stage: string) => {
    setTaskSiteId(siteId);
    setTaskForm({ title: "", stage, due_date: "", description: "" });
    setTaskOpen(true);
  };
  const submitTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await sb.from("site_onboarding_tasks").insert({
      site_id: taskSiteId, stage: taskForm.stage, title: taskForm.title,
      description: taskForm.description || null, due_date: taskForm.due_date || null,
      created_by: userId,
    });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    setTaskOpen(false); onChange();
  };
  const toggleTask = async (t: OnbTask) => {
    const done = t.status === "done";
    await sb.from("site_onboarding_tasks").update({ status: done ? "open" : "done", completed_at: done ? null : new Date().toISOString() }).eq("id", t.id);
    onChange();
  };

  if (sites.length === 0) return <Card><CardContent className="p-12 text-center text-muted-foreground text-sm">Add sites to start tracking onboarding.</CardContent></Card>;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{onboardingSites.length} site{onboardingSites.length !== 1 ? "s" : ""} in onboarding</p>
      {onboardingSites.length === 0 ? (
        <Card><CardContent className="p-12 text-center text-muted-foreground text-sm">All sites are live. 🎉</CardContent></Card>
      ) : (
        <div className="space-y-4">
          {onboardingSites.map((site) => {
            const onb = onbBySite[site.id];
            const stage = onb?.current_stage || "survey";
            const siteTasks = tasks.filter((t) => t.site_id === site.id);
            return (
              <Card key={site.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <CardTitle className="text-base">{site.name}</CardTitle>
                    {canEdit && stage !== "live" && (
                      <Button size="sm" variant="outline" className="gap-2" onClick={() => advance(site, onb)}>
                        <CheckCircle2 className="h-3.5 w-3.5" /> Complete {stage}
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Stage progress */}
                  <div className="grid grid-cols-4 gap-2">
                    {STAGES.map((st, i) => {
                      const activeIdx = STAGES.findIndex((x) => x.key === stage);
                      const isDone = i < activeIdx;
                      const isCurrent = i === activeIdx;
                      return (
                        <div key={st.key} className={`rounded-md border p-2 text-center text-xs ${isCurrent ? "border-primary bg-primary/10 text-foreground font-medium" : isDone ? "border-green-500/40 bg-green-500/10 text-green-700 dark:text-green-400" : "border-border text-muted-foreground"}`}>
                          {isDone ? <CheckCircle2 className="h-3.5 w-3.5 mx-auto mb-0.5" /> : isCurrent ? <Clock className="h-3.5 w-3.5 mx-auto mb-0.5" /> : null}
                          {st.label}
                        </div>
                      );
                    })}
                  </div>
                  {/* Tasks per stage */}
                  <div className="grid gap-3 md:grid-cols-4">
                    {STAGES.map((st) => (
                      <div key={st.key} className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] font-semibold uppercase text-muted-foreground tracking-wider">{st.label}</p>
                          {canEdit && <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openTask(site.id, st.key)}><Plus className="h-3 w-3" /></Button>}
                        </div>
                        {siteTasks.filter((t) => t.stage === st.key).map((t) => (
                          <div key={t.id} className={`rounded border border-border p-2 text-xs ${t.status === "done" ? "opacity-60 line-through" : ""}`}>
                            <button onClick={() => canEdit && toggleTask(t)} className="text-left w-full">{t.title}</button>
                            {t.due_date && <p className="text-[10px] text-muted-foreground mt-0.5">due {format(new Date(t.due_date), "PP")}</p>}
                          </div>
                        ))}
                        {siteTasks.filter((t) => t.stage === st.key).length === 0 && (
                          <p className="text-[10px] text-muted-foreground italic">no tasks</p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={taskOpen} onOpenChange={setTaskOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Onboarding Task</DialogTitle></DialogHeader>
          <form onSubmit={submitTask} className="space-y-3">
            <Input placeholder="Title *" required value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} />
            <Select value={taskForm.stage} onValueChange={(v) => setTaskForm({ ...taskForm, stage: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{STAGES.map((s) => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}</SelectContent>
            </Select>
            <Input type="date" value={taskForm.due_date} onChange={(e) => setTaskForm({ ...taskForm, due_date: e.target.value })} />
            <Textarea placeholder="Description" rows={2} value={taskForm.description} onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setTaskOpen(false)}>Cancel</Button>
              <Button type="submit">Add Task</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// =================== PERFORMANCE TAB ===================
function PerformanceTab({ incidents, sites }: { incidents: Incident[]; sites: Site[] }) {
  const monthly = useMemo(() => {
    const m: Record<string, { month: string; opened: number; resolved: number }> = {};
    incidents.forEach((i) => {
      const k = format(new Date(i.created_at), "MMM yy");
      if (!m[k]) m[k] = { month: k, opened: 0, resolved: 0 };
      m[k].opened++;
    });
    incidents.filter((i) => i.resolved_at).forEach((i) => {
      const k = format(new Date(i.resolved_at!), "MMM yy");
      if (!m[k]) m[k] = { month: k, opened: 0, resolved: 0 };
      m[k].resolved++;
    });
    return Object.values(m).reverse().slice(-12);
  }, [incidents]);

  const bySite = useMemo(() => {
    const map: Record<string, { name: string; count: number; mttr: number | null }> = {};
    sites.forEach((s) => { map[s.id] = { name: s.name, count: 0, mttr: null }; });
    const unassigned = { name: "Unassigned", count: 0, mttr: null as number | null };
    const totals: Record<string, { sum: number; n: number }> = {};
    incidents.forEach((i) => {
      const key = i.site_id && map[i.site_id] ? i.site_id : "_un";
      if (key === "_un") unassigned.count++;
      else map[key].count++;
      if (i.resolved_at) {
        const dur = (new Date(i.resolved_at).getTime() - new Date(i.created_at).getTime()) / 3600000;
        if (!totals[key]) totals[key] = { sum: 0, n: 0 };
        totals[key].sum += dur; totals[key].n++;
      }
    });
    Object.keys(map).forEach((k) => { if (totals[k]) map[k].mttr = totals[k].sum / totals[k].n; });
    if (totals["_un"]) unassigned.mttr = totals["_un"].sum / totals["_un"].n;
    const arr = Object.values(map).filter((x) => x.count > 0);
    if (unassigned.count > 0) arr.push(unassigned);
    return arr;
  }, [incidents, sites]);

  if (incidents.length === 0) {
    return <Card><CardContent className="p-12 text-center text-muted-foreground text-sm">No incidents yet for this client.</CardContent></Card>;
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader><CardTitle className="text-base">Incidents — last 12 months</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={monthly}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="opened" fill="hsl(var(--primary))" name="Opened" />
              <Bar dataKey="resolved" fill="hsl(var(--accent))" name="Resolved" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-base">Per-site breakdown</CardTitle></CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border text-xs text-muted-foreground">
              <th className="text-left p-3">Site</th><th className="text-right p-3">Incidents</th><th className="text-right p-3">MTTR (h)</th>
            </tr></thead>
            <tbody>
              {bySite.map((r, i) => (
                <tr key={i} className="border-b border-border">
                  <td className="p-3 font-medium">{r.name}</td>
                  <td className="p-3 text-right">{r.count}</td>
                  <td className="p-3 text-right text-muted-foreground">{r.mttr == null ? "—" : r.mttr.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

// =================== INCIDENTS TAB ===================
function IncidentsTab({ incidents, sites }: { incidents: Incident[]; sites: Site[] }) {
  const siteName = (id: string | null) => id ? (sites.find((s) => s.id === id)?.name || "—") : "—";
  if (incidents.length === 0) return <Card><CardContent className="p-12 text-center text-muted-foreground text-sm">No incidents.</CardContent></Card>;
  return (
    <Card><CardContent className="p-0 overflow-x-auto">
      <table className="w-full text-sm">
        <thead><tr className="border-b border-border text-xs text-muted-foreground">
          <th className="text-left p-3">#</th><th className="text-left p-3">Title</th>
          <th className="text-left p-3">Site</th><th className="text-left p-3">Priority</th>
          <th className="text-left p-3">Status</th><th className="text-left p-3">Created</th>
        </tr></thead>
        <tbody>
          {incidents.slice(0, 50).map((i) => (
            <tr key={i.id} className="border-b border-border hover:bg-muted/40">
              <td className="p-3 font-mono text-xs">{i.incident_number}</td>
              <td className="p-3"><Link to={`/crm/incidents/${i.id}`} className="hover:underline text-primary">{i.title}</Link></td>
              <td className="p-3 text-muted-foreground">{siteName(i.site_id)}</td>
              <td className="p-3"><Badge variant="outline" className="capitalize text-[10px]">{i.priority}</Badge></td>
              <td className="p-3"><Badge variant="outline" className="capitalize text-[10px]">{i.status}</Badge></td>
              <td className="p-3 text-muted-foreground">{format(new Date(i.created_at), "PP")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </CardContent></Card>
  );
}

// =================== CHURN TAB ===================
function ChurnTab({ clientId, churn, log, canEdit, userId, onChange }: { clientId: string; churn: Churn | null; log: ChurnLog[]; canEdit: boolean; userId: string; onChange: () => void }) {
  const { toast } = useToast();
  const [computing, setComputing] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [actionOpen, setActionOpen] = useState(false);
  const [form, setForm] = useState({ risk_level: churn?.risk_level || "low", reason: churn?.reason || "", notes: churn?.notes || "" });
  const [action, setAction] = useState({ notes: "" });

  useEffect(() => {
    setForm({ risk_level: churn?.risk_level || "low", reason: churn?.reason || "", notes: churn?.notes || "" });
  }, [churn]);

  const recompute = async () => {
    setComputing(true);
    const { data, error } = await sb.rpc("compute_client_churn_score", { _client_id: clientId });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); setComputing(false); return; }
    const score = Number(data) || 0;
    const auto: "low"|"medium"|"high" = score >= 60 ? "high" : score >= 30 ? "medium" : "low";
    const payload: any = { client_id: clientId, score, last_assessed_at: new Date().toISOString(), updated_by: userId };
    if (!churn?.manual_override) payload.risk_level = auto;
    const { error: upErr } = await sb.from("client_churn").upsert(payload, { onConflict: "client_id" });
    if (upErr) { toast({ title: "Error", description: upErr.message, variant: "destructive" }); setComputing(false); return; }
    toast({ title: `Score: ${score}`, description: churn?.manual_override ? "Manual override active" : `Risk → ${auto}` });
    setComputing(false); onChange();
  };

  const saveOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    const from = churn?.risk_level || "low";
    const payload: any = {
      client_id: clientId, risk_level: form.risk_level, manual_override: true,
      reason: form.reason || null, notes: form.notes || null,
      churned_at: form.risk_level === "churned" ? new Date().toISOString() : null,
      updated_by: userId, last_assessed_at: new Date().toISOString(),
    };
    const { error } = await sb.from("client_churn").upsert(payload, { onConflict: "client_id" });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    if (from !== form.risk_level) {
      await sb.from("client_churn_log").insert({ client_id: clientId, action: "status_change", from_status: from, to_status: form.risk_level, notes: form.reason || null, performed_by: userId });
    }
    if (form.risk_level === "churned") {
      await sb.from("clients").update({}).eq("id", clientId); // no-op trigger placeholder
    }
    toast({ title: "Churn updated" });
    setEditOpen(false); onChange();
  };

  const clearOverride = async () => {
    if (!churn) return;
    await sb.from("client_churn").update({ manual_override: false, updated_by: userId }).eq("client_id", clientId);
    toast({ title: "Override cleared" });
    onChange();
  };

  const logAction = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await sb.from("client_churn_log").insert({ client_id: clientId, action: "retention_action", notes: action.notes, performed_by: userId });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    setActionOpen(false); setAction({ notes: "" }); onChange();
  };

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Churn Risk</CardTitle>
          <div className="flex gap-2">
            {canEdit && <Button size="sm" variant="outline" onClick={recompute} disabled={computing}>{computing ? "Computing..." : "Recompute"}</Button>}
            {canEdit && <Button size="sm" onClick={() => setEditOpen(true)}>Override</Button>}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div>
              <p className="text-xs text-muted-foreground uppercase">Current risk</p>
              <Badge className={`${RISK_COLORS[churn?.risk_level || "low"]} border capitalize text-sm mt-1`}>{churn?.risk_level || "low"}</Badge>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase">Auto score</p>
              <p className="text-2xl font-bold">{churn?.score ?? 0}<span className="text-sm text-muted-foreground">/100</span></p>
            </div>
            {churn?.manual_override && (
              <div className="ml-auto">
                <Badge variant="outline" className="border-yellow-500/40 text-yellow-600">Manual override</Badge>
                {canEdit && <Button variant="link" size="sm" onClick={clearOverride}>clear</Button>}
              </div>
            )}
          </div>
          {churn?.reason && <div><p className="text-xs text-muted-foreground uppercase">Reason</p><p className="text-sm mt-1">{churn.reason}</p></div>}
          {churn?.notes && <div><p className="text-xs text-muted-foreground uppercase">Notes</p><p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{churn.notes}</p></div>}
          {churn?.last_assessed_at && <p className="text-xs text-muted-foreground">Last assessed {format(new Date(churn.last_assessed_at), "PPp")}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Activity log</CardTitle>
          {canEdit && <Button size="sm" variant="outline" onClick={() => setActionOpen(true)}>Log action</Button>}
        </CardHeader>
        <CardContent>
          {log.length === 0 ? (
            <p className="text-sm text-muted-foreground">No activity logged.</p>
          ) : (
            <ul className="space-y-3">
              {log.map((l) => (
                <li key={l.id} className="border-l-2 border-border pl-3">
                  <p className="text-xs font-medium capitalize">{l.action.replace("_", " ")}</p>
                  {l.from_status && l.to_status && <p className="text-xs text-muted-foreground">{l.from_status} → {l.to_status}</p>}
                  {l.notes && <p className="text-xs text-muted-foreground mt-0.5">{l.notes}</p>}
                  <p className="text-[10px] text-muted-foreground mt-1">{format(new Date(l.performed_at), "PPp")}</p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Override churn risk</DialogTitle></DialogHeader>
          <form onSubmit={saveOverride} className="space-y-3">
            <Select value={form.risk_level} onValueChange={(v) => setForm({ ...form, risk_level: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="churned">Churned</SelectItem>
              </SelectContent>
            </Select>
            <Input placeholder="Reason" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
            <Textarea placeholder="Notes" rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={actionOpen} onOpenChange={setActionOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Log retention action</DialogTitle></DialogHeader>
          <form onSubmit={logAction} className="space-y-3">
            <Textarea placeholder="What was done? (e.g. called account owner, offered discount, scheduled review)" required rows={4} value={action.notes} onChange={(e) => setAction({ notes: e.target.value })} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setActionOpen(false)}>Cancel</Button>
              <Button type="submit">Log</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}