import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { KPIStrip } from "@/components/crm/dashboard/KPIStrip";
import { QueueTable } from "@/components/crm/dashboard/QueueTable";
import { QuickActions } from "@/components/crm/dashboard/QuickActions";
import { SLATimerBadge } from "@/components/crm/dashboard/SLATimerBadge";
import { AlertTriangle, Users, ShieldCheck, Timer, Plus, BarChart3, ClipboardList } from "lucide-react";
import { differenceInMinutes } from "date-fns";
import type { Database } from "@/integrations/supabase/types";

type Incident = Database["public"]["Tables"]["incidents"]["Row"];
type SlaPolicy = Database["public"]["Tables"]["sla_policies"]["Row"];
type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export default function NetworkManagerDashboard() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [slas, setSlas] = useState<SlaPolicy[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [i, s, p] = await Promise.all([
        supabase.from("incidents").select("*").order("created_at", { ascending: false }).limit(500),
        supabase.from("sla_policies").select("*"),
        supabase.from("profiles").select("*"),
      ]);
      setIncidents((i.data || []) as Incident[]);
      setSlas((s.data || []) as SlaPolicy[]);
      setProfiles((p.data || []) as Profile[]);
      setLoading(false);
    })();
  }, []);

  const slaByPriority = useMemo(() => {
    const m: Record<string, number> = {};
    for (const s of slas) m[s.priority as string] = s.resolution_time_minutes;
    return m;
  }, [slas]);

  const profileByUser = useMemo(() => {
    const m = new Map<string, Profile>();
    for (const p of profiles) m.set(p.user_id, p);
    return m;
  }, [profiles]);

  const active = incidents.filter((i) => !["resolved", "closed"].includes(i.status));
  const unassigned = active.filter((i) => !i.assigned_to);
  const escalated = incidents.filter((i) => i.status === "escalated");
  const breached = active.filter((i) => {
    const t = slaByPriority[i.priority as string];
    return t ? differenceInMinutes(new Date(), new Date(i.created_at)) > t : false;
  });

  const loadByEngineer = useMemo(() => {
    const m = new Map<string, number>();
    for (const i of active) {
      if (!i.assigned_to) continue;
      m.set(i.assigned_to, (m.get(i.assigned_to) || 0) + 1);
    }
    return Array.from(m.entries())
      .map(([uid, count]) => ({ uid, count, name: profileByUser.get(uid)?.full_name || "Unknown" }))
      .sort((a, b) => b.count - a.count);
  }, [active, profileByUser]);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">Network Operations</h1>
          <p className="text-sm text-muted-foreground">Team queues, SLA compliance, and escalations</p>
        </div>
        <QuickActions
          actions={[
            { label: "New Incident", to: "/crm/incidents", icon: Plus, variant: "default" },
            { label: "Performance", to: "/crm/performance", icon: BarChart3 },
            { label: "SLA Policies", to: "/crm/sla-policies", icon: ShieldCheck },
          ]}
        />
      </div>

      <KPIStrip
        items={[
          { label: "Active Incidents", value: active.length, icon: AlertTriangle, color: "text-orange-500" },
          { label: "Unassigned", value: unassigned.length, icon: ClipboardList, color: "text-blue-500" },
          { label: "Escalated", value: escalated.length, icon: Timer, color: "text-destructive" },
          { label: "SLA Breached", value: breached.length, icon: ShieldCheck, color: breached.length > 0 ? "text-destructive" : "text-green-500" },
        ]}
      />

      <div className="grid lg:grid-cols-2 gap-4">
        <QueueTable
          title={`Unassigned Queue (${unassigned.length})`}
          rows={unassigned.slice(0, 8)}
          rowHref={(r) => `/crm/incidents/${r.id}`}
          empty="All incidents are assigned"
          columns={[
            { cell: (r) => <span className="font-mono text-xs text-muted-foreground">{r.incident_number}</span>, header: "#" },
            { cell: (r) => <span className="text-sm truncate">{r.title}</span>, header: "Title" },
            { cell: (r) => <Badge variant="outline" className="capitalize text-[10px]">{r.priority}</Badge>, header: "Pri", className: "text-right" },
            { cell: (r) => <SLATimerBadge createdAt={r.created_at} targetMinutes={slaByPriority[r.priority]} />, header: "SLA", className: "text-right" },
          ]}
        />
        <QueueTable
          title={`Escalated (${escalated.length})`}
          rows={escalated.slice(0, 8)}
          rowHref={(r) => `/crm/incidents/${r.id}`}
          empty="No escalations"
          columns={[
            { cell: (r) => <span className="font-mono text-xs text-muted-foreground">{r.incident_number}</span>, header: "#" },
            { cell: (r) => <span className="text-sm truncate">{r.title}</span>, header: "Title" },
            { cell: (r) => <span className="text-xs text-muted-foreground truncate">{r.assigned_to ? profileByUser.get(r.assigned_to)?.full_name ?? "—" : "Unassigned"}</span>, header: "Owner" },
            { cell: (r) => <SLATimerBadge createdAt={r.created_at} targetMinutes={slaByPriority[r.priority]} />, header: "SLA", className: "text-right" },
          ]}
        />
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-2"><Users className="h-4 w-4" /> Engineer Load (active incidents)</CardTitle></CardHeader>
        <CardContent>
          {loadByEngineer.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No active incidents assigned</p>
          ) : (
            <div className="space-y-2">
              {loadByEngineer.map((row) => {
                const max = loadByEngineer[0].count;
                const pct = Math.round((row.count / max) * 100);
                return (
                  <div key={row.uid} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-foreground">{row.name}</span>
                      <span className="text-muted-foreground">{row.count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}