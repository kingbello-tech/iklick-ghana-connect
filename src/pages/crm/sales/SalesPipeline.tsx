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
import { Plus, Calendar, Percent, ClipboardCheck, Wrench, Trash2, FileText, Check } from "lucide-react";

const STAGES = [
  { value: "new_lead", label: "Lead", color: "bg-blue-500" },
  { value: "qualification", label: "Qualification", color: "bg-purple-500" },
  { value: "site_survey", label: "Site Survey", color: "bg-yellow-500" },
  { value: "proposal_sent", label: "Proposal/Costing", color: "bg-orange-500" },
  { value: "negotiation", label: "Negotiation", color: "bg-pink-500" },
  { value: "closed_won", label: "Closed Won", color: "bg-green-500" },
  { value: "closed_lost", label: "Closed Lost", color: "bg-red-500" },
] as const;

const ISP_CATEGORIES = [
  { value: "community_wifi", label: "Community Wi-Fi" },
  { value: "ftth", label: "FTTH" },
  { value: "voip", label: "VOIP" },
  { value: "dia", label: "DIA" },
] as const;

interface Deal {
  id: string;
  title: string;
  value: number;
  mrc: number;
  nrc: number;
  contract_duration_months: number;
  tcv: number;
  acv: number;
  isp_category: string | null;
  expected_close_date: string | null;
  probability: number;
  stage: string;
  assigned_to: string | null;
  notes: string | null;
  created_by: string;
  created_at: string;
}

interface Profile { user_id: string; full_name: string | null; }
interface SiteSurvey {
  id: string;
  deal_id: string;
  status: string;
  feasibility: string;
  cost_estimate: number | null;
  infrastructure_notes: string | null;
  engineer_notes: string | null;
  scheduled_date: string | null;
  completed_at: string | null;
  assigned_to: string | null;
}

interface Quotation {
  id: string;
  deal_id: string;
  installation_cost: number | null;
  monthly_cost: number | null;
  status: string;
  version: number;
  document_url: string | null;
  notes: string | null;
  created_at: string;
}

const emptyForm = {
  title: "",
  mrc: "",
  nrc: "",
  contract_duration_months: "12",
  isp_category: "__none__",
  expected_close_date: "",
  probability: "50",
  stage: "new_lead",
  assigned_to: "__unassigned__",
  notes: "",
};

export default function SalesPipeline() {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [surveys, setSurveys] = useState<SiteSurvey[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [quoteForm, setQuoteForm] = useState({ installation_cost: "", monthly_cost: "", document_url: "", notes: "" });
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selected, setSelected] = useState<Deal | null>(null);
  const [form, setForm] = useState(emptyForm);

  const fetchData = async () => {
    const [dealsRes, profilesRes, surveysRes, quotesRes] = await Promise.all([
      supabase.from("deals").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("user_id, full_name"),
      supabase.from("site_surveys").select("*").order("requested_at", { ascending: false }),
      supabase.from("quotations").select("*").order("created_at", { ascending: false }),
    ]);
    if (dealsRes.data) setDeals(dealsRes.data as unknown as Deal[]);
    if (profilesRes.data) setProfiles(profilesRes.data);
    if (surveysRes.data) setSurveys(surveysRes.data as unknown as SiteSurvey[]);
    if (quotesRes.data) setQuotations(quotesRes.data as unknown as Quotation[]);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const profileMap = Object.fromEntries(profiles.map(p => [p.user_id, p.full_name || "Unknown"]));

  const mrc = parseFloat(form.mrc) || 0;
  const nrc = parseFloat(form.nrc) || 0;
  const months = parseInt(form.contract_duration_months) || 0;
  const previewTcv = mrc * months + nrc;
  const previewAcv = mrc * 12;

  const buildPayload = () => ({
    title: form.title,
    mrc,
    nrc,
    contract_duration_months: months,
    value: previewTcv, // keep `value` in sync as TCV for backwards compatibility
    isp_category: (form.isp_category && form.isp_category !== "__none__" ? form.isp_category : null) as any,
    expected_close_date: form.expected_close_date || null,
    probability: parseInt(form.probability) || 50,
    stage: form.stage as any,
    assigned_to: form.assigned_to && form.assigned_to !== "__unassigned__" ? form.assigned_to : null,
    notes: form.notes || null,
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const { error } = await supabase.from("deals").insert({ ...buildPayload(), created_by: user.id });
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Deal created" }); setCreateOpen(false); setForm(emptyForm); fetchData(); }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    const payload = buildPayload();
    const enteringSurveyStage = payload.stage === "site_survey" && selected.stage !== "site_survey";
    const enteringClosedWon = payload.stage === "closed_won" && selected.stage !== "closed_won";
    const { error } = await supabase.from("deals").update(payload).eq("id", selected.id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      if (enteringSurveyStage) {
        supabase.functions.invoke("send-tech-email", {
          body: {
            type: "survey_requested",
            deal_title: selected.title,
            deal_id: selected.id,
            isp_category: payload.isp_category,
          },
        }).catch(err => console.error("tech email failed", err));
      }
      if (enteringClosedWon) {
        // Notify tech alias of new installation request
        supabase.functions.invoke("send-tech-email", {
          body: {
            type: "deal_won_to_tech",
            deal_title: selected.title,
            deal_id: selected.id,
            isp_category: payload.isp_category,
            service_type: (payload as any).service_type ?? undefined,
          },
        }).catch(err => console.error("deal won email failed", err));
      }
      toast({ title: "Deal updated" }); setEditOpen(false); fetchData();
    }
  };

  const requestSurvey = async (deal: Deal) => {
    if (!user) return;
    const { error } = await supabase.from("site_surveys").insert({
      deal_id: deal.id,
      requested_by: user.id,
      requested_at: new Date().toISOString(),
      status: "scheduled" as any,
    });
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      await supabase.from("deals").update({ stage: "site_survey" as any }).eq("id", deal.id);
      // Notify technology alias
      supabase.functions.invoke("send-tech-email", {
        body: {
          type: "survey_requested",
          deal_title: deal.title,
          deal_id: deal.id,
          isp_category: deal.isp_category,
        },
      }).catch(err => console.error("tech email failed", err));
      toast({ title: "Site survey requested", description: "Sent to Technology team" });
      fetchData();
    }
  };

  const requestInstallation = async (deal: Deal) => {
    if (!user) return;
    // Move stage to closed_won; trigger create_installation_on_won will create the installation row + work order #
    const { error } = await supabase.from("deals").update({ stage: "closed_won" as any }).eq("id", deal.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    // Fetch the newly-created installation to surface the work order number
    const { data: inst } = await supabase
      .from("installations")
      .select("work_order_number")
      .eq("deal_id", deal.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    supabase.functions.invoke("send-tech-email", {
      body: {
        type: "deal_won_to_tech",
        deal_title: deal.title,
        deal_id: deal.id,
        isp_category: deal.isp_category,
        notes: inst?.work_order_number ? `Work Order: ${inst.work_order_number}` : undefined,
      },
    }).catch(err => console.error("install request email failed", err));
    toast({
      title: "Installation requested",
      description: inst?.work_order_number ? `Work Order ${inst.work_order_number} sent to Technology` : "Sent to Technology team",
    });
    fetchData();
  };

  const openEdit = (deal: Deal) => {
    setSelected(deal);
    setQuoteForm({ installation_cost: "", monthly_cost: String(deal.mrc || ""), document_url: "", notes: "" });
    setForm({
      title: deal.title,
      mrc: String(deal.mrc || 0),
      nrc: String(deal.nrc || 0),
      contract_duration_months: String(deal.contract_duration_months || 12),
      isp_category: deal.isp_category || "__none__",
      expected_close_date: deal.expected_close_date || "",
      probability: String(deal.probability),
      stage: deal.stage,
      assigned_to: deal.assigned_to || "__unassigned__",
      notes: deal.notes || "",
    });
    setEditOpen(true);
  };

  const handleDeleteDeal = async (deal: Deal) => {
    if (!confirm(`Delete deal "${deal.title}"? This cannot be undone.`)) return;
    const { error } = await supabase.from("deals").delete().eq("id", deal.id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Deal deleted" }); fetchData(); }
  };

  const addQuotation = async () => {
    if (!user || !selected) return;
    const dealQuotes = quotations.filter(q => q.deal_id === selected.id);
    const nextVersion = dealQuotes.length ? Math.max(...dealQuotes.map(q => q.version)) + 1 : 1;
    const { error } = await supabase.from("quotations").insert({
      deal_id: selected.id,
      installation_cost: parseFloat(quoteForm.installation_cost) || 0,
      monthly_cost: parseFloat(quoteForm.monthly_cost) || 0,
      document_url: quoteForm.document_url || null,
      notes: quoteForm.notes || null,
      version: nextVersion,
      status: "draft" as any,
      created_by: user.id,
    });
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      toast({ title: `Quotation v${nextVersion} added` });
      setQuoteForm({ installation_cost: "", monthly_cost: String(selected.mrc || ""), document_url: "", notes: "" });
      fetchData();
    }
  };

  const setQuotationStatus = async (q: Quotation, status: "sent" | "accepted" | "rejected") => {
    const { error } = await supabase.from("quotations").update({ status: status as any }).eq("id", q.id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: `Quotation marked ${status}` }); fetchData(); }
  };

  const deleteQuotation = async (q: Quotation) => {
    if (!confirm(`Delete quotation v${q.version}?`)) return;
    const { error } = await supabase.from("quotations").delete().eq("id", q.id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Quotation deleted" }); fetchData(); }
  };

  const totalPipeline = deals.filter(d => !["closed_won", "closed_lost"].includes(d.stage)).reduce((s, d) => s + Number(d.tcv || d.value), 0);
  const wonValue = deals.filter(d => d.stage === "closed_won").reduce((s, d) => s + Number(d.tcv || d.value), 0);

  const renderDealForm = (onSubmit: (e: React.FormEvent) => void, submitLabel: string) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2"><Label>Title *</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required /></div>
        <div>
          <Label>Service Category *</Label>
          <Select value={form.isp_category} onValueChange={v => setForm({ ...form, isp_category: v })}>
            <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">None</SelectItem>
              {ISP_CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Stage</Label>
          <Select value={form.stage} onValueChange={v => setForm({ ...form, stage: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{STAGES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div><Label>MRC (₵) — Monthly</Label><Input type="number" step="0.01" value={form.mrc} onChange={e => setForm({ ...form, mrc: e.target.value })} /></div>
        <div><Label>NRC (₵) — One-off</Label><Input type="number" step="0.01" value={form.nrc} onChange={e => setForm({ ...form, nrc: e.target.value })} /></div>
        <div><Label>Contract Duration (months)</Label><Input type="number" min="1" value={form.contract_duration_months} onChange={e => setForm({ ...form, contract_duration_months: e.target.value })} /></div>
        <div><Label>Probability (%)</Label><Input type="number" min="0" max="100" value={form.probability} onChange={e => setForm({ ...form, probability: e.target.value })} /></div>
        <div className="col-span-2 grid grid-cols-2 gap-4 p-3 rounded-lg bg-muted/30 border border-border">
          <div><p className="text-xs text-muted-foreground">TCV (auto)</p><p className="text-lg font-bold text-primary">₵{previewTcv.toLocaleString()}</p></div>
          <div><p className="text-xs text-muted-foreground">ACV (auto)</p><p className="text-lg font-bold text-primary">₵{previewAcv.toLocaleString()}</p></div>
        </div>
        <div><Label>Expected Close Date</Label><Input type="date" value={form.expected_close_date} onChange={e => setForm({ ...form, expected_close_date: e.target.value })} /></div>
        <div>
          <Label>Assigned Sales Rep</Label>
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
  const categoryLabel = (k: string | null) => ISP_CATEGORIES.find(c => c.value === k)?.label || "—";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Sales Pipeline</h1>
          <p className="text-muted-foreground text-sm">Lead → Survey → Proposal → Closure</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />New Deal</Button></DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Create Deal</DialogTitle></DialogHeader>
            {renderDealForm(handleCreate, "Create Deal")}
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="pt-4 flex items-center gap-3"><span className="text-2xl font-bold text-primary">₵</span><div><p className="text-2xl font-bold text-foreground">₵{totalPipeline.toLocaleString()}</p><p className="text-xs text-muted-foreground">Pipeline TCV</p></div></CardContent></Card>
        <Card><CardContent className="pt-4 flex items-center gap-3"><span className="text-2xl font-bold text-green-400">₵</span><div><p className="text-2xl font-bold text-foreground">₵{wonValue.toLocaleString()}</p><p className="text-xs text-muted-foreground">Won TCV</p></div></CardContent></Card>
        <Card><CardContent className="pt-4 flex items-center gap-3"><Percent className="h-8 w-8 text-yellow-400" /><div><p className="text-2xl font-bold text-foreground">{deals.length > 0 ? Math.round((deals.filter(d => d.stage === "closed_won").length / deals.length) * 100) : 0}%</p><p className="text-xs text-muted-foreground">Win Rate</p></div></CardContent></Card>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {activeStages.map(stage => {
          const stageDeals = deals.filter(d => d.stage === stage.value);
          const stageValue = stageDeals.reduce((s, d) => s + Number(d.tcv || d.value), 0);
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
                  <Card key={deal.id} className="hover:border-primary/50 transition-colors">
                    <CardContent className="p-3 space-y-2">
                      <p className="font-medium text-sm text-foreground cursor-pointer" onClick={() => openEdit(deal)}>{deal.title}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-primary">₵{Number(deal.tcv || deal.value).toLocaleString()}</span>
                        <span className="text-xs text-muted-foreground">{deal.probability}%</span>
                      </div>
                      <div className="flex items-center gap-1 flex-wrap">
                        {deal.isp_category && <Badge variant="outline" className="text-xs">{categoryLabel(deal.isp_category)}</Badge>}
                        {deal.mrc > 0 && <Badge variant="secondary" className="text-xs">MRC ₵{Number(deal.mrc).toLocaleString()}</Badge>}
                      </div>
                      {deal.assigned_to && <p className="text-xs text-muted-foreground">{profileMap[deal.assigned_to] || "Unknown"}</p>}
                      {deal.expected_close_date && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />{deal.expected_close_date}
                        </div>
                      )}
                      {["qualification", "new_lead"].includes(deal.stage) && (
                        <Button size="sm" variant="outline" className="w-full mt-2" onClick={() => requestSurvey(deal)}>
                          <ClipboardCheck className="h-3 w-3 mr-1" />Request Site Survey
                        </Button>
                      )}
                      {["proposal_sent", "negotiation"].includes(deal.stage) &&
                        surveys.some(s => s.deal_id === deal.id && s.status === "completed") && (
                          <Button size="sm" className="w-full mt-2" onClick={() => requestInstallation(deal)}>
                            <Wrench className="h-3 w-3 mr-1" />Move to Installation
                          </Button>
                        )}
                      {isAdmin && (
                        <Button size="sm" variant="ghost" className="w-full mt-1 text-red-500 hover:text-red-600" onClick={() => handleDeleteDeal(deal)}>
                          <Trash2 className="h-3 w-3 mr-1" />Delete
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-green-400 text-sm">Closed Won ({deals.filter(d => d.stage === "closed_won").length})</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {deals.filter(d => d.stage === "closed_won").map(d => (
              <div key={d.id} className="flex justify-between items-center cursor-pointer hover:bg-muted/50 p-2 rounded" onClick={() => openEdit(d)}>
                <span className="text-sm text-foreground">{d.title}</span>
                <span className="text-sm font-semibold text-green-400">₵{Number(d.tcv || d.value).toLocaleString()}</span>
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
                <span className="text-sm font-semibold text-red-400">₵{Number(d.tcv || d.value).toLocaleString()}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Deal</DialogTitle></DialogHeader>
          {selected && (() => {
            const survey = surveys.find(s => s.deal_id === selected.id);
            if (!survey) return null;
            const Row = ({ label, value }: { label: string; value: any }) =>
              value ? (
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
                  <p className="text-sm text-foreground break-words">{value}</p>
                </div>
              ) : null;
            return (
              <div className="mb-4 p-4 rounded-lg border border-border bg-muted/30 space-y-3">
                <div className="flex items-center gap-2">
                  <ClipboardCheck className="h-4 w-4 text-primary" />
                  <p className="text-sm font-semibold text-foreground">Site Survey Report</p>
                  <Badge variant="outline" className="ml-auto text-xs">{survey.status}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Row label="Feasibility" value={survey.feasibility} />
                  <Row label="Cost Estimate" value={survey.cost_estimate ? `₵${Number(survey.cost_estimate).toLocaleString()}` : null} />
                  <Row label="Scheduled" value={survey.scheduled_date} />
                  <Row label="Completed" value={survey.completed_at ? new Date(survey.completed_at).toLocaleDateString() : null} />
                  <Row label="Engineer" value={survey.assigned_to ? profileMap[survey.assigned_to] : null} />
                </div>
                {survey.infrastructure_notes && <Row label="Infrastructure Notes" value={survey.infrastructure_notes} />}
                {survey.engineer_notes && <Row label="Engineer Notes" value={survey.engineer_notes} />}
                {survey.status !== "completed" && (
                  <p className="text-xs text-muted-foreground italic">Awaiting Technology team to complete the survey.</p>
                )}
              </div>
            );
          })()}
          {renderDealForm(handleEdit, "Save Changes")}
        </DialogContent>
      </Dialog>
    </div>
  );
}
