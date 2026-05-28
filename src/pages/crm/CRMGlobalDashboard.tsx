import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  TrendingUp,
  ShieldCheck,
  Timer,
  Users,
  Activity,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
} from "recharts";
import {
  format,
  differenceInMinutes,
  subDays,
  startOfDay,
  eachDayOfInterval,
  isAfter,
  differenceInHours,
} from "date-fns";
import type { Database } from "@/integrations/supabase/types";

type Incident = Database["public"]["Tables"]["incidents"]["Row"];
type Client = Database["public"]["Tables"]["clients"]["Row"];
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

const RANGES: { label: string; days: number }[] = [
  { label: "7d", days: 7 },
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
];

function fmtMins(mins: number) {
  if (!isFinite(mins) || mins <= 0) return "—";
  const h = mins / 60;
  if (h < 48) return `${h.toFixed(1)}h`;
  return `${(h / 24).toFixed(1)}d`;
}

export default function CRMGlobalDashboard() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [slas, setSlas] = useState<SlaPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [rangeDays, setRangeDays] = useState(30);

  useEffect(() => {
    const fetchAll = async () => {
      const [incRes, cliRes, slaRes] = await Promise.all([
        supabase.from("incidents").select("*").order("created_at", { ascending: false }),
        supabase.from("clients").select("*"),
        supabase.from("sla_policies").select("*"),
      ]);
      if (incRes.data) setIncidents(incRes.data);
      if (cliRes.data) setClients(cliRes.data);
      if (slaRes.data) setSlas(slaRes.data);
      setLoading(false);
    };
    fetchAll();
    const channel = supabase
      .channel("dash-incidents")
      .on("postgres_changes", { event: "*", schema: "public", table: "incidents" }, () => fetchAll())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const slaByPriority = useMemo(() => {
    const m: Record<string, number> = {};
    for (const s of slas) m[s.priority as string] = s.resolution_time_minutes;
    return m;
  }, [slas]);

  const clientById = useMemo(() => {
    const m = new Map<string, Client>();
    for (const c of clients) m.set(c.id, c);
    return m;
  }, [clients]);

  // Window filter
  const windowStart = useMemo(() => startOfDay(subDays(new Date(), rangeDays - 1)), [rangeDays]);
  const inWindow = useMemo(
    () => incidents.filter((i) => new Date(i.created_at) >= windowStart),
    [incidents, windowStart]
  );

  // ===== TOP-LINE METRICS =====
  const activeAll = incidents.filter((i) => !["resolved", "closed"].includes(i.status));
  const critical = activeAll.filter((i) => i.priority === "critical").length;
  const escalated = activeAll.filter((i) => i.status === "escalated").length;
  const resolvedToday = incidents.filter(
    (i) => i.resolved_at && new Date(i.resolved_at).toDateString() === new Date().toDateString()
  ).length;

  // SLA stats over window (only resolved)
  const resolvedInWindow = inWindow.filter((i) => i.resolved_at);
  let breaches = 0;
  let totalMTTR = 0;
  for (const i of resolvedInWindow) {
    const mins = differenceInMinutes(new Date(i.resolved_at!), new Date(i.created_at));
    totalMTTR += mins;
    const target = slaByPriority[i.priority as string];
    if (target && mins > target) breaches++;
  }
  const mttr = resolvedInWindow.length > 0 ? totalMTTR / resolvedInWindow.length : 0;
  const slaCompliance =
    resolvedInWindow.length > 0
      ? Math.round(((resolvedInWindow.length - breaches) / resolvedInWindow.length) * 100)
      : 0;

  // Open backlog age
  const now = new Date();
  const ageBuckets = { "<24h": 0, "1-3d": 0, "3-7d": 0, ">7d": 0 } as Record<string, number>;
  for (const i of activeAll) {
    const h = differenceInHours(now, new Date(i.created_at));
    if (h < 24) ageBuckets["<24h"]++;
    else if (h < 72) ageBuckets["1-3d"]++;
    else if (h < 168) ageBuckets["3-7d"]++;
    else ageBuckets[">7d"]++;
  }
  const ageData = Object.entries(ageBuckets).map(([name, value]) => ({ name, value }));

  // SLA breach risk in active queue
  const atRisk = activeAll.filter((i) => {
    const target = slaByPriority[i.priority as string];
    if (!target) return false;
    const mins = differenceInMinutes(now, new Date(i.created_at));
    return mins > target * 0.75 && mins <= target;
  }).length;
  const breached = activeAll.filter((i) => {
    const target = slaByPriority[i.priority as string];
    if (!target) return false;
    return differenceInMinutes(now, new Date(i.created_at)) > target;
  }).length;

  // ===== STATUS / PRIORITY CHARTS =====
  const byStatus = Object.entries(
    incidents.reduce((acc, i) => ({ ...acc, [i.status]: (acc[i.status] || 0) + 1 }), {} as Record<string, number>)
  ).map(([name, value]) => ({
    name: name.replace("_", " "),
    value: value as number,
    fill: STATUS_COLORS[name] || "hsl(215,20%,45%)",
  }));

  const priorityData = (["critical", "high", "medium", "low"] as const).map((p) => ({
    name: p[0].toUpperCase() + p.slice(1),
    value: activeAll.filter((i) => i.priority === p).length,
    fill: PRIORITY_COLORS[p],
  }));

  // ===== DAILY VOLUME TREND =====
  const days = eachDayOfInterval({ start: windowStart, end: startOfDay(now) });
  const trendData = days.map((d) => {
    const key = format(d, "MMM d");
    const created = incidents.filter(
      (i) => startOfDay(new Date(i.created_at)).getTime() === d.getTime()
    ).length;
    const resolved = incidents.filter(
      (i) => i.resolved_at && startOfDay(new Date(i.resolved_at)).getTime() === d.getTime()
    ).length;
    return { day: key, Created: created, Resolved: resolved };
  });

  // ===== PEAK HOURS =====
  const hourly = Array.from({ length: 24 }, (_, h) => ({
    hour: `${h}`,
    count: inWindow.filter((i) => new Date(i.created_at).getHours() === h).length,
  }));

  // ===== CATEGORY BREAKDOWN =====
  const categoryMap: Record<string, number> = {};
  for (const i of inWindow) {
    const k = i.issue_category || "Uncategorized";
    categoryMap[k] = (categoryMap[k] || 0) + 1;
  }
  const categoryData = Object.entries(categoryMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  // ===== TOP AFFECTED CLIENTS =====
  type ClientStat = { id: string; name: string; total: number; active: number; lastAt: number };
  const clientStatsMap = new Map<string, ClientStat>();
  for (const i of inWindow) {
    if (!i.client_id) continue;
    const c = clientById.get(i.client_id);
    const name = c?.name || "Unknown";
    const cur =
      clientStatsMap.get(i.client_id) ||
      ({ id: i.client_id, name, total: 0, active: 0, lastAt: 0 } as ClientStat);
    cur.total++;
    if (!["resolved", "closed"].includes(i.status)) cur.active++;
    cur.lastAt = Math.max(cur.lastAt, new Date(i.created_at).getTime());
    clientStatsMap.set(i.client_id, cur);
  }
  const topClients = Array.from(clientStatsMap.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, 6);

  // Peak hour readout
  const peakHour = hourly.reduce((a, b) => (b.count > a.count ? b : a), hourly[0]);
  const peakLabel =
    peakHour.count > 0 ? `${peakHour.hour}:00 – ${(parseInt(peakHour.hour) + 1) % 24}:00` : "—";

  const recentIncidents = incidents.slice(0, 8);

  const statCards = [
    { label: "Active Incidents", value: activeAll.length, sub: `${critical} critical · ${escalated} escalated`, icon: AlertTriangle, color: "text-orange-500" },
    { label: `MTTR (${rangeDays}d)`, value: fmtMins(mttr), sub: `${resolvedInWindow.length} resolved`, icon: Timer, color: "text-blue-500" },
    { label: `SLA Compliance (${rangeDays}d)`, value: resolvedInWindow.length > 0 ? `${slaCompliance}%` : "—", sub: `${breaches} breach${breaches === 1 ? "" : "es"}`, icon: ShieldCheck, color: slaCompliance >= 90 ? "text-green-500" : slaCompliance >= 75 ? "text-yellow-500" : "text-destructive" },
    { label: "Backlog at Risk", value: breached + atRisk, sub: `${breached} breached · ${atRisk} nearing`, icon: Zap, color: "text-destructive" },
  ];

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Command Center</h1>
          <p className="text-muted-foreground text-sm">
            Real-time network operations · {inWindow.length} incidents in last {rangeDays} days
          </p>
        </div>
        <div className="flex items-center gap-1 p-1 rounded-md border bg-card">
          {RANGES.map((r) => (
            <Button
              key={r.days}
              size="sm"
              variant={rangeDays === r.days ? "default" : "ghost"}
              className="h-7 px-3 text-xs"
              onClick={() => setRangeDays(r.days)}
            >
              {r.label}
            </Button>
          ))}
        </div>
      </div>

      {/* TOP STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-4">
              <div className={`p-3 rounded-lg bg-muted ${s.color}`}>
                <s.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-[10px] text-muted-foreground/80 mt-0.5 truncate">{s.sub}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* SLA COMPLIANCE STRIP */}
      <Card>
        <CardHeader className="pb-2 flex-row items-center justify-between">
          <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" /> SLA Compliance by Priority ({rangeDays}d)
          </CardTitle>
          <span className="text-xs text-muted-foreground">Resolved within target / total resolved</span>
        </CardHeader>
        <CardContent className="space-y-3">
          {(["critical", "high", "medium", "low"] as const).map((p) => {
            const target = slaByPriority[p];
            const list = resolvedInWindow.filter((i) => i.priority === p);
            const ontime = list.filter(
              (i) => differenceInMinutes(new Date(i.resolved_at!), new Date(i.created_at)) <= (target || Infinity)
            ).length;
            const pct = list.length > 0 ? Math.round((ontime / list.length) * 100) : 0;
            return (
              <div key={p} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ background: PRIORITY_COLORS[p] }} />
                    <span className="capitalize text-foreground">{p}</span>
                    <span className="text-muted-foreground">target {fmtMins(target || 0)}</span>
                  </div>
                  <span className="text-foreground font-medium">
                    {list.length > 0 ? `${ontime}/${list.length} · ${pct}%` : "no data"}
                  </span>
                </div>
                <Progress value={list.length > 0 ? pct : 0} className="h-1.5" />
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* TREND + AGE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <Activity className="h-4 w-4" /> Daily Volume — Created vs Resolved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="Created" stroke="hsl(195, 100%, 42%)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Resolved" stroke="hsl(142, 71%, 45%)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" /> Open Backlog Age
            </CardTitle>
          </CardHeader>
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

      {/* STATUS / PRIORITY / CATEGORY */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Incidents by Status (all-time)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={byStatus}>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", fontSize: 12 }} />
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
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Top Issue Categories ({rangeDays}d)</CardTitle>
          </CardHeader>
          <CardContent>
            {categoryData.length === 0 ? (
              <p className="text-xs text-muted-foreground py-8 text-center">No categorised incidents in window</p>
            ) : (
              <div className="space-y-2">
                {categoryData.map((c) => {
                  const max = categoryData[0].value || 1;
                  return (
                    <div key={c.name} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-foreground truncate">{c.name}</span>
                        <span className="text-muted-foreground">{c.value}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${(c.value / max) * 100}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* TOP CLIENTS + PEAK HOURS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" /> Top Affected Clients ({rangeDays}d)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topClients.length === 0 ? (
              <p className="text-xs text-muted-foreground py-8 text-center">No client incidents in window</p>
            ) : (
              <div className="space-y-1">
                <div className="grid grid-cols-12 gap-2 text-[10px] uppercase tracking-wide text-muted-foreground px-2 pb-1 border-b">
                  <span className="col-span-6">Client</span>
                  <span className="col-span-2 text-right">Total</span>
                  <span className="col-span-2 text-right">Active</span>
                  <span className="col-span-2 text-right">Last</span>
                </div>
                {topClients.map((c) => (
                  <Link
                    to={`/crm/clients/${c.id}`}
                    key={c.id}
                    className="grid grid-cols-12 gap-2 items-center px-2 py-2 rounded-md hover:bg-muted text-sm"
                  >
                    <span className="col-span-6 text-foreground truncate">{c.name}</span>
                    <span className="col-span-2 text-right text-foreground font-medium">{c.total}</span>
                    <span className="col-span-2 text-right">
                      {c.active > 0 ? (
                        <Badge variant="outline" className="text-[10px]" style={{ color: "hsl(25,95%,53%)", borderColor: "hsl(25,95%,53%,0.4)" }}>
                          {c.active}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">0</span>
                      )}
                    </span>
                    <span className="col-span-2 text-right text-xs text-muted-foreground">
                      {format(new Date(c.lastAt), "MMM d")}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> Peak Hours ({rangeDays}d)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-2">
              Busiest: <span className="text-foreground font-medium">{peakLabel}</span>
            </p>
            <ResponsiveContainer width="100%" height={170}>
              <BarChart data={hourly}>
                <XAxis dataKey="hour" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} interval={2} />
                <YAxis hide />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", fontSize: 12 }} />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* RECENT */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Recent Incidents</CardTitle>
        </CardHeader>
        <CardContent>
          {recentIncidents.length === 0 ? (
            <p className="text-muted-foreground text-sm py-8 text-center">No incidents yet</p>
          ) : (
            <div className="space-y-2">
              {recentIncidents.map((inc) => {
                const target = slaByPriority[inc.priority as string];
                const ageMins = differenceInMinutes(now, new Date(inc.created_at));
                const isResolved = ["resolved", "closed"].includes(inc.status);
                const slaState =
                  isResolved || !target
                    ? null
                    : ageMins > target
                    ? "breached"
                    : ageMins > target * 0.75
                    ? "at-risk"
                    : null;
                const cli = inc.client_id ? clientById.get(inc.client_id) : null;
                return (
                  <Link
                    key={inc.id}
                    to={`/crm/incidents/${inc.id}`}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xs font-mono text-muted-foreground shrink-0">{inc.incident_number}</span>
                      <div className="min-w-0">
                        <p className="text-sm text-foreground truncate">{inc.title}</p>
                        {cli && <p className="text-[11px] text-muted-foreground truncate">{cli.name}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {slaState === "breached" && (
                        <Badge className="text-[10px] bg-destructive/10 text-destructive border-destructive/40">SLA breached</Badge>
                      )}
                      {slaState === "at-risk" && (
                        <Badge className="text-[10px] bg-orange-500/10 text-orange-500 border-orange-500/40">At risk</Badge>
                      )}
                      <Badge
                        className="text-[10px] capitalize"
                        style={{
                          backgroundColor: `${PRIORITY_COLORS[inc.priority]}20`,
                          color: PRIORITY_COLORS[inc.priority],
                          borderColor: `${PRIORITY_COLORS[inc.priority]}40`,
                        }}
                      >
                        {inc.priority}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="text-[10px] capitalize"
                        style={{ color: STATUS_COLORS[inc.status], borderColor: `${STATUS_COLORS[inc.status]}40` }}
                      >
                        {inc.status.replace("_", " ")}
                      </Badge>
                      <span className="text-xs text-muted-foreground hidden sm:inline">{format(new Date(inc.created_at), "MMM d")}</span>
                    </div>
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
