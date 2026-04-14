import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle, Clock, Download } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { format, differenceInMinutes } from "date-fns";
import type { Database } from "@/integrations/supabase/types";

type Incident = Database["public"]["Tables"]["incidents"]["Row"];

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

export default function MyDashboard() {
  const { user, profile } = useAuth();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase.from("incidents").select("*").eq("assigned_to", user.id).order("created_at", { ascending: false });
      if (data) setIncidents(data);
      setLoading(false);
    };
    fetch();

    const channel = supabase
      .channel("my-incidents-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "incidents" }, () => fetch())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const activeIncidents = incidents.filter((i) => !["resolved", "closed"].includes(i.status));
  const resolvedIncidents = incidents.filter((i) => i.resolved_at);
  const avgResolutionMins = resolvedIncidents.length > 0
    ? Math.round(resolvedIncidents.reduce((sum, i) => sum + differenceInMinutes(new Date(i.resolved_at!), new Date(i.created_at)), 0) / resolvedIncidents.length)
    : 0;

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
      resolution_mins: i.resolved_at ? differenceInMinutes(new Date(i.resolved_at), new Date(i.created_at)) : "",
    }));
    if (data.length === 0) return;
    const headers = Object.keys(data[0]);
    const csv = [headers.join(","), ...data.map((row) => headers.map((h) => `"${(row as any)[h] ?? ""}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `my_performance_${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const statCards = [
    { label: "My Active", value: activeIncidents.length, icon: AlertTriangle, color: "text-orange-500" },
    { label: "My Resolved", value: resolvedIncidents.length, icon: CheckCircle, color: "text-green-500" },
    { label: "Resolution Rate", value: incidents.length > 0 ? `${((resolvedIncidents.length / incidents.length) * 100).toFixed(0)}%` : "—", icon: Clock, color: "text-blue-500" },
    { label: "Avg Resolution", value: avgResolutionMins > 0 ? `${avgResolutionMins}m` : "—", icon: Clock, color: "text-primary" },
  ];

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Dashboard</h1>
          <p className="text-muted-foreground text-sm">Your assigned incidents and performance</p>
        </div>
        <Button variant="outline" size="sm" onClick={exportCSV}><Download className="h-4 w-4 mr-2" />Export My Report</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
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
        <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">My Incidents by Status</CardTitle></CardHeader>
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
        <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">My Recent Incidents ({incidents.length})</CardTitle></CardHeader>
        <CardContent>
          {incidents.length === 0 ? (
            <p className="text-muted-foreground text-sm py-8 text-center">No incidents assigned to you</p>
          ) : (
            <div className="space-y-2">
              {incidents.slice(0, 10).map((inc) => (
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
