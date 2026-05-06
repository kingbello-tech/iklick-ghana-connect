import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, Star, FileCheck, AlertCircle, TrendingUp } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  LineChart, Line, CartesianGrid, Legend,
} from "recharts";
import { format, differenceInHours, subDays, startOfDay, eachDayOfInterval } from "date-fns";

const PRIORITY_COLORS: Record<string, string> = {
  critical: "hsl(0,84%,60%)", high: "hsl(25,95%,53%)", medium: "hsl(45,93%,47%)", low: "hsl(142,71%,45%)",
};
const RANGES = [{ label: "7d", days: 7 }, { label: "30d", days: 30 }, { label: "90d", days: 90 }];

export default function CXDashboard() {
  const [pending, setPending] = useState<any[]>([]);
  const [closures, setClosures] = useState<any[]>([]);
  const [closedIncidents, setClosedIncidents] = useState<any[]>([]);
  const [satisfaction, setSatisfaction] = useState<any[]>([]);
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [rangeDays, setRangeDays] = useState(30);

  const fetchAll = async () => {
    const [pendingRes, closuresRes, closedRes, satRes, cliRes] = await Promise.all([
      supabase.from("incidents").select("*").eq("status", "resolved").order("resolved_at", { ascending: false }),
      supabase.from("incident_closures").select("*").order("created_at", { ascending: false }),
      supabase.from("incidents").select("*").eq("status", "closed").order("closed_at", { ascending: false }),
      supabase.from("client_satisfaction").select("*").order("created_at", { ascending: false }),
      supabase.from("clients").select("id, name"),
    ]);
    if (pendingRes.data) setPending(pendingRes.data);
    if (closuresRes.data) setClosures(closuresRes.data);
    if (closedRes.data) setClosedIncidents(closedRes.data);
    if (satRes.data) setSatisfaction(satRes.data);
    if (cliRes.data) setClients(cliRes.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
    const ch = supabase.channel("cx-dash")
      .on("postgres_changes", { event: "*", schema: "public", table: "incidents" }, () => fetchAll())
      .on("postgres_changes", { event: "*", schema: "public", table: "incident_closures" }, () => fetchAll())
      .on("postgres_changes", { event: "*", schema: "public", table: "client_satisfaction" }, () => fetchAll())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const clientMap = useMemo(() => Object.fromEntries(clients.map((c) => [c.id, c.name])), [clients]);
  const now = new Date();
  const windowStart = useMemo(() => startOfDay(subDays(now, rangeDays - 1)), [rangeDays]);

  const closuresInWindow = closures.filter((c) => new Date(c.created_at) >= windowStart);
  const satInWindow = satisfaction.filter((s) => new Date(s.created_at) >= windowStart);
  const avgRating = satInWindow.length ? (satInWindow.reduce((s, r) => s + r.rating, 0) / satInWindow.length).toFixed(1) : "—";
  const satisfiedPct = satInWindow.length ? Math.round((satInWindow.filter((r) => r.rating >= 4).length / satInWindow.length) * 100) : 0;

  // Pending age buckets
  const ageBuckets: Record<string, number> = { "<24h": 0, "1-3d": 0, "3-7d": 0, ">7d": 0 };
  for (const i of pending) {
    const ref = i.resolved_at ? new Date(i.resolved_at) : new Date(i.created_at);
    const h = differenceInHours(now, ref);
    if (h < 24) ageBuckets["<24h"]++;
    else if (h < 72) ageBuckets["1-3d"]++;
    else if (h < 168) ageBuckets["3-7d"]++;
    else ageBuckets[">7d"]++;
  }
  const ageData = Object.entries(ageBuckets).map(([name, value]) => ({ name, value }));

  // Trend: closures per day
  const days = eachDayOfInterval({ start: windowStart, end: startOfDay(now) });
  const trendData = days.map((d) => ({
    day: format(d, "MMM d"),
    Closed: closures.filter((c) => startOfDay(new Date(c.created_at)).getTime() === d.getTime()).length,
    Surveys: satisfaction.filter((s) => startOfDay(new Date(s.created_at)).getTime() === d.getTime()).length,
  }));

  // Rating distribution
  const ratingDist = [1, 2, 3, 4, 5].map((r) => ({
    name: `${r}★`,
    value: satInWindow.filter((s) => s.rating === r).length,
    fill: r <= 2 ? "hsl(0,84%,60%)" : r === 3 ? "hsl(45,93%,47%)" : "hsl(142,71%,45%)",
  }));

  // Pending by priority
  const pendingByPriority = (["critical","high","medium","low"] as const).map((p) => ({
    name: p, value: pending.filter((i) => i.priority === p).length, fill: PRIORITY_COLORS[p],
  }));

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  const stats = [
    { label: "Pending Closure", value: pending.length, sub: "resolved tickets to review", icon: AlertCircle, color: "text-orange-500" },
    { label: `Closed (${rangeDays}d)`, value: closuresInWindow.length, sub: `${closedIncidents.length} all-time`, icon: FileCheck, color: "text-green-500" },
    { label: `Avg Rating (${rangeDays}d)`, value: avgRating, sub: `${satInWindow.length} survey${satInWindow.length === 1 ? "" : "s"}`, icon: Star, color: "text-yellow-500" },
    { label: `Satisfaction (${rangeDays}d)`, value: satInWindow.length ? `${satisfiedPct}%` : "—", sub: "rated 4★ or higher", icon: TrendingUp, color: satisfiedPct >= 80 ? "text-green-500" : satisfiedPct >= 60 ? "text-yellow-500" : "text-destructive" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Client Experience Dashboard</h1>
          <p className="text-muted-foreground text-sm">Review resolved tickets, finalize closures, and track satisfaction</p>
        </div>
        <div className="flex items-center gap-1 p-1 rounded-md border bg-card">
          {RANGES.map((r) => (
            <Button key={r.days} size="sm" variant={rangeDays === r.days ? "default" : "ghost"} className="h-7 px-3 text-xs" onClick={() => setRangeDays(r.days)}>{r.label}</Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-4">
              <div className={`p-3 rounded-lg bg-muted ${s.color}`}><s.icon className="h-5 w-5" /></div>
              <div className="min-w-0">
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-[10px] text-muted-foreground/80 mt-0.5 truncate">{s.sub}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" /> Pending Closure Queue ({pending.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pending.length === 0 ? (
            <p className="text-xs text-muted-foreground py-8 text-center">No resolved tickets awaiting closure. 🎉</p>
          ) : (
            <div className="space-y-2">
              {pending.slice(0, 10).map((inc) => (
                <Link key={inc.id} to={`/crm/incidents/${inc.id}`} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-mono text-muted-foreground shrink-0">{inc.incident_number}</span>
                    <div className="min-w-0">
                      <p className="text-sm text-foreground truncate">{inc.title}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{clientMap[inc.client_id] || "—"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge className="text-[10px] capitalize" style={{ backgroundColor: `${PRIORITY_COLORS[inc.priority]}20`, color: PRIORITY_COLORS[inc.priority], borderColor: `${PRIORITY_COLORS[inc.priority]}40` }}>{inc.priority}</Badge>
                    {inc.resolved_at && <span className="text-[11px] text-muted-foreground hidden sm:inline">resolved {format(new Date(inc.resolved_at), "MMM d")}</span>}
                    <Button size="sm" variant="outline" className="h-7 text-xs">Review & Close</Button>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Daily Closures & Surveys ({rangeDays}d)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="Closed" stroke="hsl(142,71%,45%)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Surveys" stroke="hsl(45,93%,47%)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-2"><Clock className="h-4 w-4" /> Pending Closure Age</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={ageData}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", fontSize: 12 }} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {ageData.map((_, i) => (
                    <Cell key={i} fill={i === 3 ? "hsl(0,84%,60%)" : i === 2 ? "hsl(25,95%,53%)" : i === 1 ? "hsl(45,93%,47%)" : "hsl(142,71%,45%)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Rating Distribution ({rangeDays}d)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={ratingDist}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", fontSize: 12 }} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>{ratingDist.map((e, i) => <Cell key={i} fill={e.fill} />)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Pending by Priority</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={pendingByPriority}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", fontSize: 12 }} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>{pendingByPriority.map((e, i) => <Cell key={i} fill={e.fill} />)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Recent Closures ({closures.length})</CardTitle></CardHeader>
        <CardContent>
          {closures.length === 0 ? (
            <p className="text-muted-foreground text-sm py-8 text-center">No closure reports yet</p>
          ) : (
            <div className="space-y-2">
              {closures.slice(0, 8).map((c) => {
                const inc = closedIncidents.find((i) => i.id === c.incident_id);
                return (
                  <Link key={c.id} to={`/crm/incidents/${c.incident_id}`} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-foreground truncate">{inc?.title || "Incident"}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{c.root_cause}</p>
                    </div>
                    <span className="text-[11px] text-muted-foreground shrink-0 ml-3">{format(new Date(c.created_at), "MMM d")}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}