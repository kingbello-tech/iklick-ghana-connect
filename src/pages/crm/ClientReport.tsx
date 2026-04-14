import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, ArrowLeft, CheckCircle, Clock, AlertTriangle, Star } from "lucide-react";
import { format, differenceInMinutes } from "date-fns";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from "recharts";
import type { Database } from "@/integrations/supabase/types";

type Incident = Database["public"]["Tables"]["incidents"]["Row"];
type Client = Database["public"]["Tables"]["clients"]["Row"];

const STATUS_COLORS: Record<string, string> = {
  open: "hsl(195, 100%, 42%)",
  in_progress: "hsl(45, 93%, 47%)",
  escalated: "hsl(0, 84%, 60%)",
  resolved: "hsl(142, 71%, 45%)",
  closed: "hsl(215, 20%, 45%)",
};

const PRIORITY_COLORS: Record<string, string> = {
  critical: "hsl(0, 84%, 60%)",
  high: "hsl(25, 95%, 53%)",
  medium: "hsl(45, 93%, 47%)",
  low: "hsl(142, 71%, 45%)",
};

export default function ClientReport() {
  const { clientId } = useParams<{ clientId: string }>();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [client, setClient] = useState<Client | null>(null);
  const [satisfaction, setSatisfaction] = useState<{ rating: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const [incRes, clientRes, satRes] = await Promise.all([
        supabase.from("incidents").select("*").eq("client_id", clientId!).order("created_at", { ascending: false }),
        supabase.from("clients").select("*").eq("id", clientId!).single(),
        supabase.from("client_satisfaction").select("rating").eq("client_id", clientId!),
      ]);
      if (incRes.data) setIncidents(incRes.data);
      if (clientRes.data) setClient(clientRes.data);
      if (satRes.data) setSatisfaction(satRes.data);
      setLoading(false);
    };
    fetch();
  }, [clientId]);

  const activeIncidents = incidents.filter((i) => !["resolved", "closed"].includes(i.status));
  const resolvedIncidents = incidents.filter((i) => i.resolved_at);
  const avgRating = satisfaction.length > 0 ? parseFloat((satisfaction.reduce((s, r) => s + r.rating, 0) / satisfaction.length).toFixed(1)) : 0;

  const byStatus = Object.entries(
    incidents.reduce((acc, i) => ({ ...acc, [i.status]: (acc[i.status] || 0) + 1 }), {} as Record<string, number>)
  ).map(([name, value]) => ({ name: name.replace("_", " "), value, fill: STATUS_COLORS[name] || "hsl(215,20%,45%)" }));

  const exportCSV = () => {
    const data = incidents.map((i) => ({
      incident_number: i.incident_number,
      title: i.title,
      status: i.status,
      priority: i.priority,
      created_at: format(new Date(i.created_at), "yyyy-MM-dd HH:mm"),
      resolved_at: i.resolved_at ? format(new Date(i.resolved_at), "yyyy-MM-dd HH:mm") : "",
    }));
    if (data.length === 0) return;
    const headers = Object.keys(data[0]);
    const csv = [headers.join(","), ...data.map((row) => headers.map((h) => `"${(row as any)[h] ?? ""}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `client_report_${client?.name?.replace(/\s+/g, "_") || clientId}_${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/crm/performance"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{client?.name || "Unknown"}</h1>
            <p className="text-muted-foreground text-sm">{client?.service_type === "enterprise" ? "Enterprise" : "Home"} · {client?.location || "No location"}</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={exportCSV}><Download className="h-4 w-4 mr-2" />Export CSV</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Incidents", value: incidents.length, icon: AlertTriangle, color: "text-primary" },
          { label: "Active", value: activeIncidents.length, icon: Clock, color: "text-orange-500" },
          { label: "Resolved", value: resolvedIncidents.length, icon: CheckCircle, color: "text-green-500" },
          { label: "Avg Satisfaction", value: avgRating > 0 ? `${avgRating} ★` : "—", icon: Star, color: "text-yellow-500" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-4">
              <div className={`p-3 rounded-lg bg-muted ${s.color}`}><s.icon className="h-5 w-5" /></div>
              <div>
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Incidents by Status</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={byStatus}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>{byStatus.map((e, i) => <Cell key={i} fill={e.fill} />)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">All Incidents ({incidents.length})</CardTitle></CardHeader>
        <CardContent>
          {incidents.length === 0 ? (
            <p className="text-muted-foreground text-sm py-8 text-center">No incidents for this client</p>
          ) : (
            <div className="space-y-2">
              {incidents.map((inc) => (
                <Link key={inc.id} to={`/crm/incidents/${inc.id}`} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-mono text-muted-foreground">{inc.incident_number}</span>
                    <span className="text-sm text-foreground truncate">{inc.title}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge className="text-[10px] capitalize" style={{ backgroundColor: `${PRIORITY_COLORS[inc.priority]}20`, color: PRIORITY_COLORS[inc.priority], borderColor: `${PRIORITY_COLORS[inc.priority]}40` }}>{inc.priority}</Badge>
                    <Badge variant="outline" className="text-[10px] capitalize" style={{ color: STATUS_COLORS[inc.status], borderColor: `${STATUS_COLORS[inc.status]}40` }}>{inc.status.replace("_", " ")}</Badge>
                    <span className="text-xs text-muted-foreground">{format(new Date(inc.created_at), "MMM d")}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
