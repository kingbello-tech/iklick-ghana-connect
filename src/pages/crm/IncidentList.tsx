import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, List, Columns } from "lucide-react";
import { format } from "date-fns";
import { IncidentCreateDialog } from "@/components/crm/IncidentCreateDialog";
import { IncidentKanban } from "@/components/crm/IncidentKanban";
import { Link } from "react-router-dom";
import type { Database } from "@/integrations/supabase/types";

type Incident = Database["public"]["Tables"]["incidents"]["Row"];
type Client = Database["public"]["Tables"]["clients"]["Row"];

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
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [view, setView] = useState<"table" | "kanban">("table");
  const [createOpen, setCreateOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { canManageIncidents } = useAuth();

  const fetchData = async () => {
    const [incRes, clientRes] = await Promise.all([
      supabase.from("incidents").select("*").order("created_at", { ascending: false }),
      supabase.from("clients").select("*"),
    ]);
    if (incRes.data) setIncidents(incRes.data);
    if (clientRes.data) setClients(clientRes.data);
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

  const filtered = incidents.filter((i) => {
    if (statusFilter !== "all" && i.status !== statusFilter) return false;
    if (priorityFilter !== "all" && i.priority !== priorityFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      return i.title.toLowerCase().includes(s) || i.incident_number.toLowerCase().includes(s) || (i.location || "").toLowerCase().includes(s);
    }
    return true;
  });

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[hsl(210,40%,98%)]">Incidents</h1>
          <p className="text-[hsl(215,20%,65%)] text-sm">{filtered.length} incident{filtered.length !== 1 ? "s" : ""}</p>
        </div>
        {canManageIncidents && (
          <Button onClick={() => setCreateOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" /> New Incident
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(215,20%,45%)]" />
          <Input
            placeholder="Search incidents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-[hsl(220,20%,10%)] border-[hsl(220,20%,18%)] text-[hsl(210,40%,98%)] placeholder:text-[hsl(215,20%,45%)]"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px] bg-[hsl(220,20%,10%)] border-[hsl(220,20%,18%)] text-[hsl(210,40%,98%)]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-[hsl(220,30%,10%)] border-[hsl(220,20%,18%)]">
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="escalated">Escalated</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-[140px] bg-[hsl(220,20%,10%)] border-[hsl(220,20%,18%)] text-[hsl(210,40%,98%)]">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent className="bg-[hsl(220,30%,10%)] border-[hsl(220,20%,18%)]">
            <SelectItem value="all">All Priority</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex border border-[hsl(220,20%,18%)] rounded-md overflow-hidden">
          <button onClick={() => setView("table")} className={`p-2 ${view === "table" ? "bg-primary/20 text-primary" : "text-[hsl(215,20%,45%)]"}`}>
            <List className="h-4 w-4" />
          </button>
          <button onClick={() => setView("kanban")} className={`p-2 ${view === "kanban" ? "bg-primary/20 text-primary" : "text-[hsl(215,20%,45%)]"}`}>
            <Columns className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      {view === "kanban" ? (
        <IncidentKanban incidents={filtered} clientMap={clientMap} onRefresh={fetchData} />
      ) : (
        <Card className="bg-[hsl(220,30%,8%)] border-[hsl(220,20%,15%)] overflow-hidden">
          <CardContent className="p-0">
            {filtered.length === 0 ? (
              <p className="text-[hsl(215,20%,45%)] text-sm py-12 text-center">No incidents found</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[hsl(220,20%,15%)]">
                      <th className="text-left p-3 text-[hsl(215,20%,45%)] font-medium text-xs">ID</th>
                      <th className="text-left p-3 text-[hsl(215,20%,45%)] font-medium text-xs">Title</th>
                      <th className="text-left p-3 text-[hsl(215,20%,45%)] font-medium text-xs">Client</th>
                      <th className="text-left p-3 text-[hsl(215,20%,45%)] font-medium text-xs">Priority</th>
                      <th className="text-left p-3 text-[hsl(215,20%,45%)] font-medium text-xs">Status</th>
                      <th className="text-left p-3 text-[hsl(215,20%,45%)] font-medium text-xs">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((inc) => (
                      <tr key={inc.id} className="border-b border-[hsl(220,20%,15%)] hover:bg-[hsl(220,20%,10%)] transition-colors">
                        <td className="p-3">
                          <Link to={`/crm/incidents/${inc.id}`} className="font-mono text-primary hover:underline text-xs">{inc.incident_number}</Link>
                        </td>
                        <td className="p-3 text-[hsl(210,40%,98%)]">
                          <Link to={`/crm/incidents/${inc.id}`} className="hover:underline">{inc.title}</Link>
                        </td>
                        <td className="p-3 text-[hsl(215,20%,65%)]">{inc.client_id ? clientMap[inc.client_id] || "—" : "—"}</td>
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
                        <td className="p-3 text-[hsl(215,20%,45%)] text-xs">{format(new Date(inc.created_at), "MMM d, HH:mm")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <IncidentCreateDialog open={createOpen} onOpenChange={setCreateOpen} clients={clients} onCreated={fetchData} />
    </div>
  );
}
