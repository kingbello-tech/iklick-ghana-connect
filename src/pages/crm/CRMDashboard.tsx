import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, Clock, Zap, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { format } from "date-fns";
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

export default function CRMDashboard() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("incidents").select("*").order("created_at", { ascending: false });
      if (data) setIncidents(data);
      setLoading(false);
    };
    fetch();

    const channel = supabase
      .channel("incidents-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "incidents" }, () => fetch())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const activeIncidents = incidents.filter((i) => !["resolved", "closed"].includes(i.status));
  const byPriority = (p: string) => activeIncidents.filter((i) => i.priority === p).length;
  const byStatus = Object.entries(
    incidents.reduce((acc, i) => ({ ...acc, [i.status]: (acc[i.status] || 0) + 1 }), {} as Record<string, number>)
  ).map(([name, value]) => ({ name: name.replace("_", " "), value, fill: STATUS_COLORS[name] || "hsl(215,20%,45%)" }));

  const priorityData = [
    { name: "Critical", value: byPriority("critical"), fill: PRIORITY_COLORS.critical },
    { name: "High", value: byPriority("high"), fill: PRIORITY_COLORS.high },
    { name: "Medium", value: byPriority("medium"), fill: PRIORITY_COLORS.medium },
    { name: "Low", value: byPriority("low"), fill: PRIORITY_COLORS.low },
  ];

  const recentIncidents = incidents.slice(0, 8);

  const statCards = [
    { label: "Active Incidents", value: activeIncidents.length, icon: AlertTriangle, color: "text-orange-500" },
    { label: "Critical", value: byPriority("critical"), icon: Zap, color: "text-destructive" },
    { label: "Resolved Today", value: incidents.filter((i) => i.resolved_at && new Date(i.resolved_at).toDateString() === new Date().toDateString()).length, icon: CheckCircle, color: "text-green-500" },
    { label: "Escalated", value: incidents.filter((i) => i.status === "escalated").length, icon: TrendingUp, color: "text-yellow-500" },
  ];

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">NOC Command Center</h1>
        <p className="text-muted-foreground text-sm">Real-time network operations overview</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-4">
              <div className={`p-3 rounded-lg bg-muted ${s.color}`}>
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Incidents by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={byStatus}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} className="fill-muted-foreground" axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {byStatus.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Active by Priority</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={priorityData} dataKey="value" cx="50%" cy="50%" outerRadius={70} innerRadius={40} paddingAngle={4} strokeWidth={0}>
                  {priorityData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Recent Incidents</CardTitle>
        </CardHeader>
        <CardContent>
          {recentIncidents.length === 0 ? (
            <p className="text-muted-foreground text-sm py-8 text-center">No incidents yet</p>
          ) : (
            <div className="space-y-2">
              {recentIncidents.map((inc) => (
                <div key={inc.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-mono text-muted-foreground">{inc.incident_number}</span>
                    <span className="text-sm text-foreground truncate">{inc.title}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge className="text-[10px] capitalize" style={{ backgroundColor: `${PRIORITY_COLORS[inc.priority]}20`, color: PRIORITY_COLORS[inc.priority], borderColor: `${PRIORITY_COLORS[inc.priority]}40` }}>
                      {inc.priority}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] capitalize" style={{ color: STATUS_COLORS[inc.status], borderColor: `${STATUS_COLORS[inc.status]}40` }}>
                      {inc.status.replace("_", " ")}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{format(new Date(inc.created_at), "MMM d")}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
