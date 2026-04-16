import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Calendar, Percent } from "lucide-react";

const STAGES = [
  { value: "new_lead", label: "New Lead", color: "bg-blue-500" },
  { value: "qualification", label: "Qualification", color: "bg-purple-500" },
  { value: "site_survey", label: "Site Survey", color: "bg-yellow-500" },
  { value: "proposal_sent", label: "Proposal Sent", color: "bg-orange-500" },
  { value: "negotiation", label: "Negotiation", color: "bg-pink-500" },
  { value: "closed_won", label: "Closed Won", color: "bg-green-500" },
  { value: "closed_lost", label: "Closed Lost", color: "bg-red-500" },
] as const;

const SERVICE_TYPES = ["fiber_home", "dedicated_business", "enterprise_link"] as const;
const COMPLEXITIES = ["low", "medium", "high"] as const;

interface Deal {
  id: string;
  lead_id: string | null;
  title: string;
  value: number;
  expected_close_date: string | null;
  probability: number;
  stage: string;
  service_type: string | null;
  bandwidth: string | null;
  installation_complexity: string;
  assigned_to: string | null;
  notes: string | null;
  client_id: string | null;
  created_by: string;
  created_at: string;
}

interface Profile {
  user_id: string;
  full_name: string | null;
}

const emptyForm = {
  title: "",
  value: "",
  expected_close_date: "",
  probability: "50",
  stage: "new_lead",
  service_type: "",
  bandwidth: "",
  installation_complexity: "low",
  assigned_to: "__unassigned__",
  notes: "",
};

export default function SalesPipeline() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selected, setSelected] = useState<Deal | null>(null);
  const [form, setForm] = useState(emptyForm);

  const fetchData = async () => {
    const [dealsRes, profilesRes] = await Promise.all([
      supabase.from("deals").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("user_id, full_name"),
    ]);
    if (dealsRes.data) setDeals(dealsRes.data as unknown as Deal[]);
    if (profilesRes.data) setProfiles(profilesRes.data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const profileMap = Object.fromEntries(profiles.map(p => [p.user_id, p.full_name || "Unknown"]));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const { error } = await supabase.from("deals").insert({
      title: form.title,
      value: parseFloat(form.value) || 0,
      expected_close_date: form.expected_close_date || null,
      probability: parseInt(form.probability) || 50,
      stage: form.stage as any,
      service_type: (form.service_type || null) as any,
      bandwidth: form.bandwidth || null,
      installation_complexity: form.installation_complexity as any,
      assigned_to: form.assigned_to && form.assigned_to !== "__unassigned__" ? form.assigned_to : null,
      notes: form.notes || null,
      created_by: user.id,
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Deal created" });
      setCreateOpen(false);
      setForm(emptyForm);
      fetchData();
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    const { error } = await supabase.from("deals").update({
      title: form.title,
      value: parseFloat(form.value) || 0,
      expected_close_date: form.expected_close_date || null,
      probability: parseInt(form.probability) || 50,
      stage: form.stage as any,
      service_type: (form.service_type || null) as any,
      bandwidth: form.bandwidth || null,
      installation_complexity: form.installation_complexity as any,
      assigned_to: form.assigned_to && form.assigned_to !== "__unassigned__" ? form.assigned_to : null,
      notes: form.notes || null,
    }).eq("id", selected.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Deal updated" });
      setEditOpen(false);
      fetchData();
    }
  };

  const openEdit = (deal: Deal) => {
    setSelected(deal);
    setForm({
      title: deal.title,
      value: String(deal.value),
      expected_close_date: deal.expected_close_date || "",
      probability: String(deal.probability),
      stage: deal.stage,
      service_type: deal.service_type || "",
      bandwidth: deal.bandwidth || "",
      installation_complexity: deal.installation_complexity,
      assigned_to: deal.assigned_to || "__unassigned__",
      notes: deal.notes || "",
    });
    setEditOpen(true);
  };

  const moveDeal = async (dealId: string, newStage: string) => {
    const { error } = await supabase.from("deals").update({ stage: newStage as any }).eq("id", dealId);
    if (!error) fetchData();
  };

  const totalPipeline = deals.filter(d => !["closed_won", "closed_lost"].includes(d.stage)).reduce((sum, d) => sum + Number(d.value), 0);
  const wonValue = deals.filter(d => d.stage === "closed_won").reduce((sum, d) => sum + Number(d.value), 0);

  const DealForm = ({ onSubmit, submitLabel }: { onSubmit: (e: React.FormEvent) => void; submitLabel: string }) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2"><Label>Title *</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required /></div>
        <div><Label>Deal Value (₵)</Label><Input type="number" step="0.01" value={form.value} onChange={e => setForm({ ...form, value: e.target.value })} /></div>
        <div><Label>Probability (%)</Label><Input type="number" min="0" max="100" value={form.probability} onChange={e => setForm({ ...form, probability: e.target.value })} /></div>
        <div><Label>Expected Close Date</Label><Input type="date" value={form.expected_close_date} onChange={e => setForm({ ...form, expected_close_date: e.target.value })} /></div>
        <div>
          <Label>Stage</Label>
          <Select value={form.stage} onValueChange={v => setForm({ ...form, stage: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{STAGES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label>Service Type</Label>
          <Select value={form.service_type} onValueChange={v => setForm({ ...form, service_type: v })}>
            <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
            <SelectContent>{SERVICE_TYPES.map(t => <SelectItem key={t} value={t} className="capitalize">{t.replace("_", " ")}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div><Label>Bandwidth</Label><Input value={form.bandwidth} onChange={e => setForm({ ...form, bandwidth: e.target.value })} placeholder="e.g. 100Mbps" /></div>
        <div>
          <Label>Installation Complexity</Label>
          <Select value={form.installation_complexity} onValueChange={v => setForm({ ...form, installation_complexity: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{COMPLEXITIES.map(c => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}</SelectContent>
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

  const activeStages = STAGES.filter(s => !["closed_won", "closed_lost"].includes(s.value));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Sales Pipeline</h1>
          <p className="text-muted-foreground text-sm">Track and manage deals through the sales process</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />New Deal</Button></DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>Create Deal</DialogTitle></DialogHeader>
            <DealForm onSubmit={handleCreate} submitLabel="Create Deal" />
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="pt-4 flex items-center gap-3"><span className="text-2xl font-bold text-primary">₵</span><div><p className="text-2xl font-bold text-foreground">₵{totalPipeline.toLocaleString()}</p><p className="text-xs text-muted-foreground">Pipeline Value</p></div></CardContent></Card>
        <Card><CardContent className="pt-4 flex items-center gap-3"><span className="text-2xl font-bold text-green-400">₵</span><div><p className="text-2xl font-bold text-foreground">₵{wonValue.toLocaleString()}</p><p className="text-xs text-muted-foreground">Won Revenue</p></div></CardContent></Card>
        <Card><CardContent className="pt-4 flex items-center gap-3"><Percent className="h-8 w-8 text-yellow-400" /><div><p className="text-2xl font-bold text-foreground">{deals.length > 0 ? Math.round((deals.filter(d => d.stage === "closed_won").length / deals.length) * 100) : 0}%</p><p className="text-xs text-muted-foreground">Win Rate</p></div></CardContent></Card>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {activeStages.map(stage => {
          const stageDeals = deals.filter(d => d.stage === stage.value);
          const stageValue = stageDeals.reduce((sum, d) => sum + Number(d.value), 0);
          return (
            <div key={stage.value} className="min-w-[280px] flex-shrink-0">
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-3 h-3 rounded-full ${stage.color}`} />
                <h3 className="text-sm font-semibold text-foreground">{stage.label}</h3>
                <Badge variant="secondary" className="ml-auto">{stageDeals.length}</Badge>
              </div>
              <p className="text-xs text-muted-foreground mb-3">₵{stageValue.toLocaleString()}</p>
              <div className="space-y-2">
                {stageDeals.map(deal => (
                  <Card key={deal.id} className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => openEdit(deal)}>
                    <CardContent className="p-3 space-y-2">
                      <p className="font-medium text-sm text-foreground">{deal.title}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-primary">₵{Number(deal.value).toLocaleString()}</span>
                        <span className="text-xs text-muted-foreground">{deal.probability}%</span>
                      </div>
                      {deal.service_type && <Badge variant="outline" className="text-xs">{deal.service_type.replace("_", " ")}</Badge>}
                      {deal.assigned_to && <p className="text-xs text-muted-foreground">{profileMap[deal.assigned_to] || "Unknown"}</p>}
                      {deal.expected_close_date && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />{deal.expected_close_date}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Closed Deals Summary */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-green-400 text-sm">Closed Won ({deals.filter(d => d.stage === "closed_won").length})</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {deals.filter(d => d.stage === "closed_won").map(d => (
              <div key={d.id} className="flex justify-between items-center cursor-pointer hover:bg-muted/50 p-2 rounded" onClick={() => openEdit(d)}>
                <span className="text-sm text-foreground">{d.title}</span>
                <span className="text-sm font-semibold text-green-400">₵{Number(d.value).toLocaleString()}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-red-400 text-sm">Closed Lost ({deals.filter(d => d.stage === "closed_lost").length})</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {deals.filter(d => d.stage === "closed_lost").map(d => (
              <div key={d.id} className="flex justify-between items-center cursor-pointer hover:bg-muted/50 p-2 rounded" onClick={() => openEdit(d)}>
                <span className="text-sm text-foreground">{d.title}</span>
                <span className="text-sm font-semibold text-red-400">₵{Number(d.value).toLocaleString()}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Edit Deal</DialogTitle></DialogHeader>
          <DealForm onSubmit={handleEdit} submitLabel="Save Changes" />
        </DialogContent>
      </Dialog>
    </div>
  );
}
