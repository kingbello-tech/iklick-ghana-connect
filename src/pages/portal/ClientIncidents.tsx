import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search } from "lucide-react";
import { TablePagination, usePaginatedSlice } from "@/components/crm/TablePagination";

type Incident = {
  id: string;
  incident_number: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  location: string | null;
  created_at: string;
  resolved_at: string | null;
  due_at: string | null;
};

const STATUS_VARIANT: Record<string, string> = {
  open: "bg-amber-500/15 text-amber-600",
  in_progress: "bg-blue-500/15 text-blue-600",
  escalated: "bg-destructive/15 text-destructive",
  resolved: "bg-emerald-500/15 text-emerald-600",
  closed: "bg-muted text-muted-foreground",
};

export default function ClientIncidents() {
  const { clientId, user } = useAuth();
  const { toast } = useToast();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [detail, setDetail] = useState<Incident | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [form, setForm] = useState({ title: "", description: "", priority: "medium", location: "" });

  const load = async () => {
    if (!clientId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("incidents")
      .select("id,incident_number,title,description,status,priority,location,created_at,resolved_at,due_at")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false });
    if (error) toast({ title: "Could not load incidents", description: error.message, variant: "destructive" });
    setIncidents((data as Incident[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [clientId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return incidents.filter(
      (i) =>
        (statusFilter === "all" || i.status === statusFilter) &&
        (!q || i.title.toLowerCase().includes(q) || i.incident_number.toLowerCase().includes(q)),
    );
  }, [incidents, search, statusFilter]);

  const paginated = usePaginatedSlice(filtered, page, pageSize);

  const submit = async () => {
    if (!clientId || !user) return;
    setSaving(true);
    const { error } = await supabase.from("incidents").insert({
      client_id: clientId,
      created_by: user.id,
      title: form.title.trim(),
      description: form.description.trim() || null,
      location: form.location.trim() || null,
      priority: form.priority as any,
      status: "open" as any,
      source: "client_portal",
    });
    setSaving(false);
    if (error) {
      toast({ title: "Could not log incident", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Incident logged", description: "Our team has been notified." });
    setForm({ title: "", description: "", priority: "medium", location: "" });
    setOpen(false);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Incidents</h1>
          <p className="text-sm text-muted-foreground">Track and report service issues</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Log incident</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Log a new incident</DialogTitle></DialogHeader>
            <div className="space-y-3 mt-2">
              <Input placeholder="Short summary *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              <Textarea placeholder="What is happening? Include any error messages." rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              <Input placeholder="Site / location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
              <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low — minor inconvenience</SelectItem>
                  <SelectItem value="medium">Medium — degraded service</SelectItem>
                  <SelectItem value="high">High — major disruption</SelectItem>
                  <SelectItem value="critical">Critical — service down</SelectItem>
                </SelectContent>
              </Select>
              <Button className="w-full" onClick={submit} disabled={saving || form.title.trim().length < 3}>
                {saving ? "Submitting…" : "Submit incident"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search by title or number" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_progress">In progress</SelectItem>
            <SelectItem value="escalated">Escalated</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <p className="text-sm text-muted-foreground py-12 text-center">Loading…</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground py-12 text-center">No incidents found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground">Number</th>
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground">Title</th>
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground">Priority</th>
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground">Status</th>
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground">Logged</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((i) => (
                    <tr key={i.id} className="border-b border-border hover:bg-muted/50 cursor-pointer" onClick={() => setDetail(i)}>
                      <td className="p-3 font-mono text-xs">{i.incident_number}</td>
                      <td className="p-3">{i.title}</td>
                      <td className="p-3 capitalize text-muted-foreground">{i.priority}</td>
                      <td className="p-3">
                        <Badge variant="outline" className={`text-[10px] capitalize border-0 ${STATUS_VARIANT[i.status] ?? ""}`}>
                          {i.status.replace(/_/g, " ")}
                        </Badge>
                      </td>
                      <td className="p-3 text-muted-foreground">{new Date(i.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {filtered.length > 0 && (
            <TablePagination
              page={page}
              pageSize={pageSize}
              total={filtered.length}
              onPageChange={setPage}
              onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
            />
          )}
        </CardContent>
      </Card>

      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{detail?.incident_number} — {detail?.title}</DialogTitle></DialogHeader>
          {detail && (
            <div className="space-y-3 text-sm">
              <div className="flex gap-2">
                <Badge variant="outline" className={`capitalize border-0 ${STATUS_VARIANT[detail.status] ?? ""}`}>{detail.status.replace(/_/g, " ")}</Badge>
                <Badge variant="outline" className="capitalize">{detail.priority}</Badge>
              </div>
              <p className="whitespace-pre-wrap text-muted-foreground">{detail.description || "No description provided."}</p>
              <dl className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div><dt className="font-medium text-foreground">Location</dt><dd>{detail.location || "—"}</dd></div>
                <div><dt className="font-medium text-foreground">Logged</dt><dd>{new Date(detail.created_at).toLocaleString()}</dd></div>
                <div><dt className="font-medium text-foreground">Target resolution</dt><dd>{detail.due_at ? new Date(detail.due_at).toLocaleString() : "—"}</dd></div>
                <div><dt className="font-medium text-foreground">Resolved</dt><dd>{detail.resolved_at ? new Date(detail.resolved_at).toLocaleString() : "—"}</dd></div>
              </dl>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}