import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, differenceInMinutes } from "date-fns";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from "recharts";
import type { Database } from "@/integrations/supabase/types";

type Incident = Database["public"]["Tables"]["incidents"]["Row"];
type SlaPolicy = Database["public"]["Tables"]["sla_policies"]["Row"];

export default function SLAReports() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [policies, setPolicies] = useState<SlaPolicy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const [incRes, slaRes] = await Promise.all([
        supabase.from("incidents").select("*").order("created_at", { ascending: false }),
        supabase.from("sla_policies").select("*"),
      ]);
      if (incRes.data) setIncidents(incRes.data);
      if (slaRes.data) setPolicies(slaRes.data);
      setLoading(false);
    };
    fetch();
  }, []);

  const policyMap = Object.fromEntries(policies.map((p) => [p.priority, p]));

  const getSLAStatus = (inc: Incident) => {
    const policy = policyMap[inc.priority];
    if (!policy) return { response: "unknown", resolution: "unknown" };
    const createdAt = new Date(inc.created_at);
    const now = new Date();
    const resolvedAt = inc.resolved_at ? new Date(inc.resolved_at) : null;

    const resolutionMins = resolvedAt
      ? differenceInMinutes(resolvedAt, createdAt)
      : differenceInMinutes(now, createdAt);

    return {
      response: "—",
      resolution: resolvedAt
        ? resolutionMins <= policy.resolution_time_minutes ? "met" : "breached"
        : resolutionMins > policy.resolution_time_minutes ? "at_risk" : "on_track",
      resolutionMins,
      targetMins: policy.resolution_time_minutes,
    };
  };

  const analyzed = incidents.map((inc) => ({ ...inc, sla: getSLAStatus(inc) }));
  const breached = analyzed.filter((a) => a.sla.resolution === "breached").length;
  const atRisk = analyzed.filter((a) => a.sla.resolution === "at_risk").length;
  const met = analyzed.filter((a) => a.sla.resolution === "met").length;
  const onTrack = analyzed.filter((a) => a.sla.resolution === "on_track").length;

  const complianceRate = met + breached > 0 ? ((met / (met + breached)) * 100).toFixed(1) : "—";

  const priorityCompliance = ["critical", "high", "medium", "low"].map((p) => {
    const items = analyzed.filter((a) => a.priority === p);
    const metCount = items.filter((a) => a.sla.resolution === "met").length;
    const breachedCount = items.filter((a) => a.sla.resolution === "breached").length;
    const total = metCount + breachedCount;
    return {
      name: p.charAt(0).toUpperCase() + p.slice(1),
      compliance: total > 0 ? parseFloat(((metCount / total) * 100).toFixed(1)) : 0,
      fill: p === "critical" ? "hsl(0,84%,60%)" : p === "high" ? "hsl(25,95%,53%)" : p === "medium" ? "hsl(45,93%,47%)" : "hsl(142,71%,45%)",
    };
  });

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">SLA Reports</h1>
        <p className="text-muted-foreground text-sm">Service Level Agreement compliance overview</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card><CardContent className="p-4 text-center">
          <p className="text-3xl font-bold text-foreground">{complianceRate}%</p>
          <p className="text-xs text-muted-foreground">SLA Compliance</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-3xl font-bold text-green-500">{met}</p>
          <p className="text-xs text-muted-foreground">SLA Met</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-3xl font-bold text-destructive">{breached}</p>
          <p className="text-xs text-muted-foreground">SLA Breached</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-3xl font-bold text-yellow-500">{atRisk}</p>
          <p className="text-xs text-muted-foreground">At Risk</p>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Compliance by Priority</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={priorityCompliance}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v: number) => `${v}%`} />
              <Bar dataKey="compliance" radius={[4, 4, 0, 0]}>
                {priorityCompliance.map((e, i) => <Cell key={i} fill={e.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Incident SLA Status</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-3 text-muted-foreground font-medium text-xs">Incident</th>
                  <th className="text-left p-3 text-muted-foreground font-medium text-xs">Priority</th>
                  <th className="text-left p-3 text-muted-foreground font-medium text-xs">Status</th>
                  <th className="text-left p-3 text-muted-foreground font-medium text-xs">SLA</th>
                  <th className="text-left p-3 text-muted-foreground font-medium text-xs">Time</th>
                  <th className="text-left p-3 text-muted-foreground font-medium text-xs">Target</th>
                </tr>
              </thead>
              <tbody>
                {analyzed.slice(0, 30).map((a) => (
                  <tr key={a.id} className="border-b border-border hover:bg-muted/50">
                    <td className="p-3 font-mono text-xs text-muted-foreground">{a.incident_number}</td>
                    <td className="p-3 text-foreground capitalize">{a.priority}</td>
                    <td className="p-3 text-foreground capitalize">{a.status.replace("_", " ")}</td>
                    <td className="p-3">
                      <Badge variant={a.sla.resolution === "met" ? "default" : a.sla.resolution === "breached" ? "destructive" : "outline"}
                        className="text-[10px] capitalize">
                        {a.sla.resolution === "at_risk" ? "At Risk" : a.sla.resolution === "on_track" ? "On Track" : a.sla.resolution}
                      </Badge>
                    </td>
                    <td className="p-3 text-muted-foreground text-xs">{typeof a.sla.resolutionMins === "number" ? `${Math.round(a.sla.resolutionMins)} min` : "—"}</td>
                    <td className="p-3 text-muted-foreground text-xs">{typeof a.sla.targetMins === "number" ? `${a.sla.targetMins} min` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}