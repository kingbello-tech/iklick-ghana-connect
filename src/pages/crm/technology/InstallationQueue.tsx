import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MapPin, Wrench } from "lucide-react";
import { format } from "date-fns";
import { TablePagination, usePaginatedSlice } from "@/components/crm/TablePagination";

interface Installation {
  id: string;
  deal_id: string;
  assigned_to: string | null;
  status: string;
  scheduled_date: string | null;
  completed_at: string | null;
  notes: string | null;
  created_at: string;
  work_order_number: string | null;
}

interface Deal { id: string; title: string; isp_category: string | null; client_id: string | null; lead_id: string | null; assigned_to: string | null; created_by: string | null; mrc: number | null; nrc: number | null; service_type: string | null; bandwidth: string | null; notes: string | null; }
interface Lead { id: string; name: string; company_name: string | null; email: string | null; phone: string | null; address: string | null; gps_address: string | null; location: string | null; ghana_card_number: string | null; lead_type: string | null; notes: string | null; }
interface Client { id: string; name: string; email: string | null; phone: string | null; location: string | null; service_type: string | null; }
interface Profile { user_id: string; full_name: string | null; }

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  in_progress: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  completed: "bg-green-500/20 text-green-400 border-green-500/30",
  cancelled: "bg-red-500/20 text-red-400 border-red-500/30",
};

export default function InstallationQueue() {
  const { user, role } = useAuth();
  const { toast } = useToast();
  const [installations, setInstallations] = useState<Installation[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Installation | null>(null);
  const [form, setForm] = useState({ assigned_to: "__unassigned__", scheduled_date: "", status: "pending", notes: "" });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const isManager = role === "admin" || role === "technology_manager";

  const fetchData = async () => {
    const [iRes, dRes, lRes, cRes, pRes] = await Promise.all([
      supabase.from("installations").select("*").order("created_at", { ascending: false }),
      supabase.from("deals").select("id, title, isp_category, client_id, lead_id, assigned_to, created_by, mrc, nrc, service_type, bandwidth, notes"),
      supabase.from("leads").select("id, name, company_name, email, phone, address, gps_address, location, ghana_card_number, lead_type, notes"),
      supabase.from("clients").select("id, name, email, phone, location, service_type"),
      supabase.from("profiles").select("user_id, full_name"),
    ]);
    if (iRes.data) setInstallations(iRes.data as any);
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

  const openEdit = (i: Installation) => {
    setSelected(i);
    setForm({
      assigned_to: i.assigned_to || "__unassigned__",
      scheduled_date: i.scheduled_date || "",
      status: i.status,
      notes: i.notes || "",
    });
    setOpen(true);
  };

  const save = async () => {
    if (!selected || !user) return;
    const newAssignee = form.assigned_to !== "__unassigned__" ? form.assigned_to : null;
    const reassigned = newAssignee && newAssignee !== selected.assigned_to;
    const justCompleted = form.status === "completed" && selected.status !== "completed";
    const update: any = {
      assigned_to: newAssignee,
      scheduled_date: form.scheduled_date || null,
      status: form.status as any,
      notes: form.notes || null,
      assigned_by: reassigned ? user.id : undefined,
      completed_at: justCompleted ? new Date().toISOString() : undefined,
    };
    Object.keys(update).forEach(k => update[k] === undefined && delete update[k]);
    const { error } = await supabase.from("installations").update(update).eq("id", selected.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    const deal = dealMap[selected.deal_id];
    const dealTitle = deal?.title;
    const assignedByName = profiles.find(p => p.user_id === user.id)?.full_name || undefined;

    if (reassigned && newAssignee) {
      const { data: engProfile } = await supabase
        .from("profiles").select("email, full_name").eq("user_id", newAssignee).maybeSingle();
      if (engProfile?.email) {
        supabase.functions.invoke("send-tech-email", {
          body: {
            type: "install_assigned",
            deal_title: dealTitle,
            engineer_name: engProfile.full_name || "Engineer",
            engineer_email: engProfile.email,
            assigned_by_name: assignedByName,
            scheduled_date: form.scheduled_date || undefined,
            notes: form.notes || undefined,
          },
        }).catch(err => console.error("install assign email failed", err));
      }
    }

    if (justCompleted) {
      const eng = selected.assigned_to ? profileMap[selected.assigned_to] : undefined;
      // Tech alias notification
      supabase.functions.invoke("send-tech-email", {
        body: {
          type: "install_closed",
          deal_title: dealTitle,
          engineer_name: eng,
          notes: form.notes || undefined,
        },
      }).catch(err => console.error("install close email failed", err));
      // Finance alias notification (Installation Completed → Billing Required)
      supabase.functions.invoke("send-tech-email", {
        body: {
          type: "install_completed_to_finance",
          deal_title: dealTitle,
          mrc: deal?.mrc ?? null,
          nrc: deal?.nrc ?? null,
          service_type: deal?.service_type ?? undefined,
        },
      }).catch(err => console.error("install→finance email failed", err));
    }

    toast({ title: "Installation updated" });
    setOpen(false);
    fetchData();
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  const myQueue = role === "technology_engineer" ? installations.filter(i => i.assigned_to === user?.id) : installations;
  const paginated = usePaginatedSlice(myQueue, page, pageSize);
  const pending = myQueue.filter(i => i.status === "pending").length;
  const inProgress = myQueue.filter(i => i.status === "in_progress").length;
  const done = myQueue.filter(i => i.status === "completed").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Installation Queue</h1>
        <p className="text-muted-foreground text-sm">Auto-created when deals close won. Assign and track installation progress.</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="pt-4"><p className="text-2xl font-bold text-yellow-400">{pending}</p><p className="text-xs text-muted-foreground">Pending</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-2xl font-bold text-blue-400">{inProgress}</p><p className="text-xs text-muted-foreground">In Progress</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-2xl font-bold text-green-400">{done}</p><p className="text-xs text-muted-foreground">Completed</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm">All Installations</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {myQueue.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No installations</p>}
          {paginated.map(i => {
            const deal = dealMap[i.deal_id];
            return (
              <div key={i.id} className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary/50 cursor-pointer" onClick={() => openEdit(i)}>
                <div className="flex items-center gap-3">
                  <Wrench className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {i.work_order_number && <span className="font-mono text-xs text-primary mr-2">{i.work_order_number}</span>}
                      {deal?.title || "Unknown deal"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {i.assigned_to ? `Engineer: ${profileMap[i.assigned_to]}` : "Unassigned"} · Created {format(new Date(i.created_at), "MMM d")}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className={STATUS_COLORS[i.status]}>{i.status.replace("_", " ")}</Badge>
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
        <DialogContent>
          <DialogHeader><DialogTitle>Installation</DialogTitle></DialogHeader>
          {selected && (
              <div className="space-y-4">
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground">
                    Deal {selected.work_order_number && <span className="font-mono text-primary ml-1">· {selected.work_order_number}</span>}
                  </p>
                  <p className="font-medium text-foreground">{dealMap[selected.deal_id]?.title}</p>
                </div>
                {(() => {
                  const d = dealMap[selected.deal_id];
                  const l = d?.lead_id ? leadMap[d.lead_id] : null;
                  const c = d?.client_id ? clientMap[d.client_id] : null;
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
                {isManager && (
                <div>
                  <Label>Assign Engineer</Label>
                  <Select value={form.assigned_to} onValueChange={v => setForm({ ...form, assigned_to: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__unassigned__">Unassigned</SelectItem>
                      {profiles.map(p => <SelectItem key={p.user_id} value={p.user_id}>{p.full_name || "Unknown"}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div><Label>Scheduled Date</Label><Input type="date" value={form.scheduled_date} onChange={e => setForm({ ...form, scheduled_date: e.target.value })} /></div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
              <Button onClick={save} className="w-full">Save</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
