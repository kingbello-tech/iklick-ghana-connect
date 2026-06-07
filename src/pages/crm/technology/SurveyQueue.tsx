import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useDepartmentProfiles } from "@/lib/assignment";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ClipboardCheck, MapPin } from "lucide-react";
import { format } from "date-fns";
import { TablePagination, usePaginatedSlice } from "@/components/crm/TablePagination";
import { Attachments } from "@/components/crm/Attachments";

interface Survey {
  id: string;
  deal_id: string;
  assigned_to: string | null;
  scheduled_date: string | null;
  status: string;
  feasibility: string;
  cost_estimate: number | null;
  infrastructure_notes: string | null;
  engineer_notes: string | null;
  requested_at: string | null;
  completed_at: string | null;
}

interface Deal {
  id: string;
  title: string;
  isp_category: string | null;
  service_type: string | null;
  bandwidth: string | null;
  mrc: number | null;
  nrc: number | null;
  notes: string | null;
  lead_id: string | null;
  client_id: string | null;
  assigned_to: string | null;
  created_by: string | null;
}
interface Lead {
  id: string;
  name: string;
  company_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  gps_address: string | null;
  location: string | null;
  ghana_card_number: string | null;
  lead_type: string | null;
  notes: string | null;
  source: string | null;
}
interface Client { id: string; name: string; email: string | null; phone: string | null; location: string | null; service_type: string | null; }
interface Profile { user_id: string; full_name: string | null; }

const STATUS_COLORS: Record<string, string> = {
  scheduled: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  completed: "bg-green-500/20 text-green-400 border-green-500/30",
  cancelled: "bg-red-500/20 text-red-400 border-red-500/30",
};

export default function SurveyQueue() {
  const { user, role } = useAuth();
  const { toast } = useToast();
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Survey | null>(null);
  const [form, setForm] = useState({
    assigned_to: "__unassigned__",
    scheduled_date: "",
    feasibility: "pending",
    cost_estimate: "",
    infrastructure_notes: "",
    engineer_notes: "",
    status: "scheduled",
  });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const isManager = role === "admin" || role === "technology_manager";

  const fetchData = async () => {
    const [sRes, dRes, lRes, cRes, pRes] = await Promise.all([
      supabase.from("site_surveys").select("*").order("requested_at", { ascending: false }),
      supabase.from("deals").select("id, title, isp_category, service_type, bandwidth, mrc, nrc, notes, lead_id, client_id, assigned_to, created_by"),
      supabase.from("leads").select("id, name, company_name, email, phone, address, gps_address, location, ghana_card_number, lead_type, notes, source"),
      supabase.from("clients").select("id, name, email, phone, location, service_type"),
      supabase.from("profiles").select("user_id, full_name"),
    ]);
    if (sRes.data) setSurveys(sRes.data as any);
    if (dRes.data) setDeals(dRes.data as any);
    if (lRes.data) setLeads(lRes.data as any);
    if (cRes.data) setClients(cRes.data as any);
    if (pRes.data) setProfiles(pRes.data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const dealMap = Object.fromEntries(deals.map(d => [d.id, d]));
  const leadMap = Object.fromEntries(leads.map(l => [l.id, l]));
  const clientMap = Object.fromEntries(clients.map(c => [c.id, c]));
  const profileMap = Object.fromEntries(profiles.map(p => [p.user_id, p.full_name || "Unknown"]));

  const openEdit = (s: Survey) => {
    setSelected(s);
    setForm({
      assigned_to: s.assigned_to || "__unassigned__",
      scheduled_date: s.scheduled_date || "",
      feasibility: s.feasibility,
      cost_estimate: s.cost_estimate ? String(s.cost_estimate) : "",
      infrastructure_notes: s.infrastructure_notes || "",
      engineer_notes: s.engineer_notes || "",
      status: s.status,
    });
    setOpen(true);
  };

  const save = async () => {
    if (!selected) return;
    const newAssignee = form.assigned_to !== "__unassigned__" ? form.assigned_to : null;
    const reassigned = newAssignee && newAssignee !== selected.assigned_to;
    const justCompleted = form.status === "completed" && selected.status !== "completed";
    const update: any = {
      assigned_to: newAssignee,
      scheduled_date: form.scheduled_date || null,
      feasibility: form.feasibility as any,
      cost_estimate: form.cost_estimate ? parseFloat(form.cost_estimate) : null,
      infrastructure_notes: form.infrastructure_notes || null,
      engineer_notes: form.engineer_notes || null,
      status: form.status as any,
      assigned_at: reassigned ? new Date().toISOString() : undefined,
      completed_at: justCompleted ? new Date().toISOString() : undefined,
    };
    Object.keys(update).forEach(k => update[k] === undefined && delete update[k]);
    const { error } = await supabase.from("site_surveys").update(update).eq("id", selected.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    // When survey is completed, advance the deal to Proposal/Costing for the sales rep.
    if (justCompleted) {
      await supabase
        .from("deals")
        .update({ stage: "proposal_sent" as any })
        .eq("id", selected.deal_id);
    }

    const deal = dealMap[selected.deal_id];
    const dealTitle = deal?.title;
    const assignedByName = profiles.find(p => p.user_id === user?.id)?.full_name || undefined;

    // Engineer assignment notification
    if (reassigned && newAssignee) {
      const eng = profiles.find(p => p.user_id === newAssignee);
      // fetch engineer email from profiles table (profiles list here lacks email, refetch)
      const { data: engProfile } = await supabase
        .from("profiles").select("email, full_name").eq("user_id", newAssignee).maybeSingle();
      if (engProfile?.email) {
        supabase.functions.invoke("send-tech-email", {
          body: {
            type: "survey_assigned",
            deal_title: dealTitle,
            engineer_name: engProfile.full_name || eng?.full_name || "Engineer",
            engineer_email: engProfile.email,
            assigned_by_name: assignedByName,
            scheduled_date: form.scheduled_date || undefined,
          },
        }).catch(err => console.error("survey assign email failed", err));
      }
    }

    // Closure notification to tech alias + sales rep
    if (justCompleted) {
      const eng = selected.assigned_to ? profileMap[selected.assigned_to] : undefined;
      // Tech alias
      supabase.functions.invoke("send-tech-email", {
        body: {
          type: "survey_closed",
          deal_title: dealTitle,
          engineer_name: eng,
          feasibility: form.feasibility,
          cost_estimate: form.cost_estimate ? parseFloat(form.cost_estimate) : null,
        },
      }).catch(err => console.error("survey close email failed", err));

      // Sales rep — fetch deal owner profile (assigned_to or created_by)
      const { data: dealRow } = await supabase
        .from("deals").select("assigned_to, created_by").eq("id", selected.deal_id).maybeSingle();
      const repUserId = dealRow?.assigned_to || dealRow?.created_by;
      if (repUserId) {
        const { data: repProfile } = await supabase
          .from("profiles").select("email, full_name").eq("user_id", repUserId).maybeSingle();
        if (repProfile?.email) {
          supabase.functions.invoke("send-tech-email", {
            body: {
              type: "survey_completed_to_sales",
              deal_title: dealTitle,
              sales_rep_name: repProfile.full_name || "Sales Representative",
              sales_rep_email: repProfile.email,
              feasibility: form.feasibility,
              cost_estimate: form.cost_estimate ? parseFloat(form.cost_estimate) : null,
            },
          }).catch(err => console.error("survey→sales email failed", err));
        }
      }
    }

    toast({ title: "Survey updated" });
    setOpen(false);
    fetchData();
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  const myQueue = role === "technology_engineer" ? surveys.filter(s => s.assigned_to === user?.id) : surveys;
  const paginated = usePaginatedSlice(myQueue, page, pageSize);
  const pending = myQueue.filter(s => s.status === "scheduled");
  const completed = myQueue.filter(s => s.status === "completed");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Site Survey Queue</h1>
        <p className="text-muted-foreground text-sm">Surveys requested by Sales for technical assessment</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="pt-4"><p className="text-2xl font-bold text-foreground">{pending.length}</p><p className="text-xs text-muted-foreground">Pending</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-2xl font-bold text-green-400">{completed.length}</p><p className="text-xs text-muted-foreground">Completed</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-2xl font-bold text-foreground">{myQueue.length}</p><p className="text-xs text-muted-foreground">Total</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm">Active Surveys</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {myQueue.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No surveys assigned</p>}
          {paginated.map(s => {
            const deal = dealMap[s.deal_id];
            return (
              <div key={s.id} className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary/50 cursor-pointer" onClick={() => openEdit(s)}>
                <div className="flex items-center gap-3">
                  <ClipboardCheck className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{deal?.title || "Unknown deal"}</p>
                    <p className="text-xs text-muted-foreground">
                      {s.assigned_to ? `Assigned: ${profileMap[s.assigned_to]}` : "Unassigned"} · {s.requested_at && format(new Date(s.requested_at), "MMM d")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={STATUS_COLORS[s.status]}>{s.status}</Badge>
                  <Badge variant="secondary" className="text-xs">{s.feasibility}</Badge>
                </div>
              </div>
            );
          })}
          {myQueue.length > 0 && (
            <TablePagination
              page={page}
              pageSize={pageSize}
              total={myQueue.length}
              onPageChange={setPage}
              onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
            />
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Survey Details</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-xs text-muted-foreground">Deal</p>
                <p className="font-medium text-foreground">{dealMap[selected.deal_id]?.title}</p>
              </div>
              {(() => {
                const d = dealMap[selected.deal_id];
                const l = d?.lead_id ? leadMap[d.lead_id] : null;
                const c = d?.client_id ? clientMap[d.client_id] : null;
                const rep = d?.assigned_to ? profileMap[d.assigned_to] : (d?.created_by ? profileMap[d.created_by] : null);
                const Row = ({ label, value }: { label: string; value: any }) =>
                  value ? (
                    <div>
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
                      <p className="text-sm text-foreground break-words">{value}</p>
                    </div>
                  ) : null;
                return (
                  <div className="p-4 rounded-lg border border-border bg-card/50 space-y-3">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      <p className="text-sm font-semibold text-foreground">Client / Site Information</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Row label="Customer" value={l?.name || c?.name} />
                      <Row label="Company" value={l?.company_name} />
                      <Row label="Phone" value={l?.phone || c?.phone} />
                      <Row label="Email" value={l?.email || c?.email} />
                      <Row label="Address" value={l?.address} />
                      <Row label="GPS Address" value={l?.gps_address} />
                      <Row label="Location" value={l?.location || c?.location} />
                      <Row label="Ghana Card No." value={l?.ghana_card_number} />
                      <Row label="Service Type" value={d?.service_type || l?.lead_type || c?.service_type} />
                      <Row label="ISP Category" value={d?.isp_category} />
                      <Row label="Bandwidth" value={d?.bandwidth} />
                    </div>
                    {(l?.notes || d?.notes) && (
                      <div className="pt-2 border-t border-border">
                        <Row label="Notes from Sales" value={l?.notes || d?.notes} />
                      </div>
                    )}
                  </div>
                );
              })()}
              <div className="grid grid-cols-2 gap-4">
                {isManager && (
                  <div>
                    <Label>Assign Engineer</Label>
                    <Select value={form.assigned_to} onValueChange={v => setForm({ ...form, assigned_to: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__unassigned__">Unassigned</SelectItem>
                        {techProfiles.map(p => <SelectItem key={p.user_id} value={p.user_id}>{p.full_name || "Unknown"}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div><Label>Scheduled Date</Label><Input type="date" value={form.scheduled_date} onChange={e => setForm({ ...form, scheduled_date: e.target.value })} /></div>
                <div>
                  <Label>Feasibility</Label>
                  <Select value={form.feasibility} onValueChange={v => setForm({ ...form, feasibility: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2"><Label>Cost Estimate (₵)</Label><Input type="number" step="0.01" value={form.cost_estimate} onChange={e => setForm({ ...form, cost_estimate: e.target.value })} /></div>
                <div className="col-span-2"><Label>Infrastructure Notes</Label><Textarea value={form.infrastructure_notes} onChange={e => setForm({ ...form, infrastructure_notes: e.target.value })} /></div>
                <div className="col-span-2"><Label>Engineer Notes</Label><Textarea value={form.engineer_notes} onChange={e => setForm({ ...form, engineer_notes: e.target.value })} /></div>
              </div>
              <Attachments entityType="site_survey" entityId={selected.id} title="Survey Attachments" />
              <Button onClick={save} className="w-full">Save</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
