import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, List, Columns, AlertTriangle, Download } from "lucide-react";
import { format, differenceInMinutes } from "date-fns";
import { IncidentCreateDialog } from "@/components/crm/IncidentCreateDialog";
import { IncidentKanban } from "@/components/crm/IncidentKanban";
import { IncidentExportDialog } from "@/components/crm/IncidentExportDialog";
import { Link } from "react-router-dom";
import { TablePagination, usePaginatedSlice } from "@/components/crm/TablePagination";
import type { Database } from "@/integrations/supabase/types";

type Incident = Database["public"]["Tables"]["incidents"]["Row"];
type Client = Database["public"]["Tables"]["clients"]["Row"];
type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type SlaPolicy = Database["public"]["Tables"]["sla_policies"]["Row"];

const PRIORITY_COLORS: Record<string, string> = {
  critical: "hsl(0, 84%, 60%)",
  high: "hsl(25, 95%, 53%)",
  medium: "hsl(45, 93%, 47%)",
  low: "hsl(142, 71%, 45%)",
};

const STATUS_COLORS: Record<string, string> = {
  open: "hsl(195, 100%, 42%)",
  in_progress: "hsl(45, 93%, 47%)",
  escalated: "hsl(0, 84%, 60%)",
  resolved: "hsl(142, 71%, 45%)",
  closed: "hsl(215, 20%, 45%)",
};

export default function IncidentList() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [slaPolicies, setSlaPolicies] = useState<SlaPolicy[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [view, setView] = useState<"table" | "kanban">("table");
  const [createOpen, setCreateOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const { canManageIncidents, canCreateIncidents } = useAuth();

  const fetchData = async () => {
    const [incRes, clientRes, profRes, slaRes] = await Promise.all([
      supabase.from("incidents").select("*").order("created_at", { ascending: false }),
      supabase.from("clients").select("*"),
      supabase.from("profiles").select("*"),
      supabase.from("sla_policies").select("*"),
    ]);
    if (incRes.data) setIncidents(incRes.data);
    if (clientRes.data) setClients(clientRes.data);
    if (profRes.data) setProfiles(profRes.data);
    if (slaRes.data) setSlaPolicies(slaRes.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    const channel = supabase
      .channel("incidents-list")
      .on("postgres_changes", { event: "*", schema: "public", table: "incidents" }, () => fetchData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const clientMap = Object.fromEntries(clients.map((c) => [c.id, c.name]));
  const slaMap = Object.fromEntries(slaPolicies.map((p) => [p.priority, p]));

  const isResponseOverdue = (inc: Incident) => {
    if (inc.status !== "open") return false;
    const policy = slaMap[inc.priority];
    if (!policy) return false;
    const elapsed = differenceInMinutes(new Date(), new Date(inc.created_at));
    return elapsed > policy.response_time_minutes;
  };

  const filtered = incidents.filter((i) => {
    if (statusFilter !== "all" && i.status !== statusFilter) return false;
    if (priorityFilter !== "all" && i.priority !== priorityFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      return i.title.toLowerCase().includes(s) || i.incident_number.toLowerCase().includes(s) || (i.location || "").toLowerCase().includes(s);
    }
    return true;
  });

  useEffect(() => { setPage(1); }, [search, statusFilter, priorityFilter, view]);
  const paginated = usePaginatedSlice(filtered, page, pageSize);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Incidents</h1>
          <p className="text-muted-foreground text-sm">{filtered.length} incident{filtered.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setExportOpen(true)} className="gap-2">
            <Download className="h-4 w-4" /> Export
          </Button>
          {canCreateIncidents && (
            <Button onClick={() => setCreateOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" /> New Incident
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search incidents..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="escalated">Escalated</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Priority" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priority</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex border border-border rounded-md overflow-hidden">
          <button onClick={() => setView("table")} className={`p-2 ${view === "table" ? "bg-primary/20 text-primary" : "text-muted-foreground"}`}>
            <List className="h-4 w-4" />
          </button>
          <button onClick={() => setView("kanban")} className={`p-2 ${view === "kanban" ? "bg-primary/20 text-primary" : "text-muted-foreground"}`}>
            <Columns className="h-4 w-4" />
          </button>
        </div>
      </div>

      {view === "kanban" ? (
        <IncidentKanban incidents={filtered} clientMap={clientMap} onRefresh={fetchData} />
      ) : (
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            {filtered.length === 0 ? (
              <p className="text-muted-foreground text-sm py-12 text-center">No incidents found</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-3 text-muted-foreground font-medium text-xs">ID</th>
                      <th className="text-left p-3 text-muted-foreground font-medium text-xs">Title</th>
                      <th className="text-left p-3 text-muted-foreground font-medium text-xs">Client</th>
                      <th className="text-left p-3 text-muted-foreground font-medium text-xs">Priority</th>
                      <th className="text-left p-3 text-muted-foreground font-medium text-xs">Status</th>
                      <th className="text-left p-3 text-muted-foreground font-medium text-xs">SLA</th>
                      <th className="text-left p-3 text-muted-foreground font-medium text-xs">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map((inc) => {
                      const overdue = isResponseOverdue(inc);
                      return (
                        <tr key={inc.id} className={`border-b border-border hover:bg-muted/50 transition-colors ${overdue ? "bg-destructive/5" : ""}`}>
                          <td className="p-3">
                            <Link to={`/crm/incidents/${inc.id}`} className="font-mono text-primary hover:underline text-xs">{inc.incident_number}</Link>
                          </td>
                          <td className="p-3 text-foreground">
                            <Link to={`/crm/incidents/${inc.id}`} className="hover:underline">{inc.title}</Link>
                          </td>
                          <td className="p-3 text-muted-foreground">{inc.client_id ? clientMap[inc.client_id] || "—" : "—"}</td>
                          <td className="p-3">
                            <Badge className="text-[10px] capitalize" style={{ backgroundColor: `${PRIORITY_COLORS[inc.priority]}20`, color: PRIORITY_COLORS[inc.priority], borderColor: `${PRIORITY_COLORS[inc.priority]}40` }}>
                              {inc.priority}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <Badge variant="outline" className="text-[10px] capitalize" style={{ color: STATUS_COLORS[inc.status], borderColor: `${STATUS_COLORS[inc.status]}40` }}>
                              {inc.status.replace("_", " ")}
                            </Badge>
                          </td>
                          <td className="p-3">
                            {overdue && (
                              <Badge variant="destructive" className="text-[10px] gap-1">
                                <AlertTriangle className="h-3 w-3" /> Overdue
                              </Badge>
                            )}
                          </td>
                          <td className="p-3 text-muted-foreground text-xs">{format(new Date(inc.created_at), "MMM d, HH:mm")}</td>
                        </tr>
                      );
                    })}
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
      )}

      <IncidentCreateDialog open={createOpen} onOpenChange={setCreateOpen} clients={clients} profiles={profiles} onCreated={fetchData} />
      <IncidentExportDialog open={exportOpen} onOpenChange={setExportOpen} />
    </div>
  );
}
