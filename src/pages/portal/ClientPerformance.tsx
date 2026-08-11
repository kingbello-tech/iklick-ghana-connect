import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KPIStrip } from "@/components/crm/dashboard/KPIStrip";
import { Activity, CheckCircle2, Clock, ShieldCheck } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type Incident = {
  id: string;
  priority: string;
  status: string;
  created_at: string;
  resolved_at: string | null;
  due_at: string | null;
  first_response_at: string | null;
};

const RANGES = [
  { label: "Last 30 days", days: 30 },
  { label: "Last 90 days", days: 90 },
  { label: "Last 12 months", days: 365 },
];

function fmtMins(mins: number | null) {
  if (mins === null || !isFinite(mins)) return "—";
  if (mins < 60) return `${Math.round(mins)}m`;
  const h = mins / 60;
  if (h < 48) return `${h.toFixed(1)}h`;
  return `${(h / 24).toFixed(1)}d`;
}

export default function ClientPerformance() {
  const { clientId } = useAuth();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [clientName, setClientName] = useState("");
  const [days, setDays] = useState(90);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clientId) return;
    const since = new Date(Date.now() - days * 86400000).toISOString();
    setLoading(true);
    Promise.all([
      supabase
        .from("incidents")
        .select("id,priority,status,created_at,resolved_at,due_at,first_response_at")
        .eq("client_id", clientId)
        .gte("created_at", since)
        .order("created_at", { ascending: false }),
      supabase.from("clients").select("name").eq("id", clientId).maybeSingle(),
    ]).then(([inc, cli]) => {
      setIncidents((inc.data as Incident[]) ?? []);
      setClientName(cli.data?.name ?? "");
      setLoading(false);
    });
  }, [clientId, days]);

  const stats = useMemo(() => {
    const total = incidents.length;
    const resolved = incidents.filter((i) => i.resolved_at);
    const open = incidents.filter((i) => !i.resolved_at);
    const withDue = incidents.filter((i) => i.due_at);
    const met = withDue.filter((i) => i.resolved_at && new Date(i.resolved_at) <= new Date(i.due_at!)).length;
    const breached = withDue.filter(
      (i) => (i.resolved_at && new Date(i.resolved_at) > new Date(i.due_at!)) || (!i.resolved_at && new Date(i.due_at!) < new Date()),
    ).length;
    const judged = met + breached;
    const compliance = judged ? Math.round((met / judged) * 100) : null;

    const resMins = resolved.map((i) => (new Date(i.resolved_at!).getTime() - new Date(i.created_at).getTime()) / 60000);
    const avgRes = resMins.length ? resMins.reduce((a, b) => a + b, 0) / resMins.length : null;

    const respMins = incidents
      .filter((i) => i.first_response_at)
      .map((i) => (new Date(i.first_response_at!).getTime() - new Date(i.created_at).getTime()) / 60000);
    const avgResp = respMins.length ? respMins.reduce((a, b) => a + b, 0) / respMins.length : null;

    return { total, open: open.length, resolved: resolved.length, met, breached, compliance, avgRes, avgResp };
  }, [incidents]);

  const monthly = useMemo(() => {
    const buckets = new Map<string, { month: string; logged: number; resolved: number }>();
    incidents.forEach((i) => {
      const key = new Date(i.created_at).toLocaleDateString(undefined, { month: "short", year: "2-digit" });
      const b = buckets.get(key) ?? { month: key, logged: 0, resolved: 0 };
      b.logged += 1;
      if (i.resolved_at) b.resolved += 1;
      buckets.set(key, b);
    });
    return Array.from(buckets.values()).reverse();
  }, [incidents]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Service Performance</h1>
          <p className="text-sm text-muted-foreground">{clientName || "Your account"} — uptime and SLA overview</p>
        </div>
        <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            {RANGES.map((r) => <SelectItem key={r.days} value={String(r.days)}>{r.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground py-12 text-center">Loading…</p>
      ) : (
        <>
          <KPIStrip
            items={[
              {
                label: "SLA compliance",
                value: stats.compliance === null ? "—" : `${stats.compliance}%`,
                sub: `${stats.met} met · ${stats.breached} breached`,
                icon: ShieldCheck,
              },
              { label: "Incidents logged", value: stats.total, sub: `${stats.open} still open`, icon: Activity },
              { label: "Avg. first response", value: fmtMins(stats.avgResp), icon: Clock },
              { label: "Avg. resolution time", value: fmtMins(stats.avgRes), sub: `${stats.resolved} resolved`, icon: CheckCircle2 },
            ]}
          />

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Incident volume</CardTitle></CardHeader>
            <CardContent className="h-72">
              {monthly.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-16">No incidents in this period.</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthly}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                    <Bar dataKey="logged" name="Logged" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="resolved" name="Resolved" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}