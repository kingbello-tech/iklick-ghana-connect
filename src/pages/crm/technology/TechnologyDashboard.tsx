import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { format, isToday } from "date-fns";
import { AlertTriangle, ClipboardCheck, Gauge, Save, Siren, UserRound, UsersRound, Wrench } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KPIStrip } from "@/components/crm/dashboard/KPIStrip";
import { WorkSLABadge } from "@/components/crm/dashboard/WorkSLABadge";
import type { Database } from "@/integrations/supabase/types";

type Incident = Database["public"]["Tables"]["incidents"]["Row"];
type Survey = Database["public"]["Tables"]["site_surveys"]["Row"];
type Installation = Database["public"]["Tables"]["installations"]["Row"];
type Scope = "mine" | "team";
type WorkItem = {
  id: string;
  type: "Incident" | "Survey" | "Installation";
  title: string;
  meta: string;
  status: string;
  href: string;
  createdAt: string;
  dueAt: string | null;
  completedAt: string | null;
  scheduledDate?: string | null;
  assignedTo: string | null;
};

const isClosed = (status: string) => ["completed", "cancelled", "resolved", "closed"].includes(status);
const workState = (item: WorkItem) => {
  if (isClosed(item.status) || !item.dueAt) return "normal";
  const now = Date.now();
  const due = new Date(item.dueAt).getTime();
  if (due < now) return "breached";
  const start = new Date(item.createdAt).getTime();
  return due - now < (due - start) * 0.25 ? "at_risk" : "normal";
};

export default function TechnologyDashboard() {
  const { user, role } = useAuth();
  const { toast } = useToast();
  const isManager = role === "admin" || role === "technology_manager";
  const [scope, setScope] = useState<Scope>("mine");
  const [scopeTouched, setScopeTouched] = useState(false);
  useEffect(() => {
    if (!scopeTouched && isManager) setScope("team");
  }, [isManager, scopeTouched]);
  const changeScope = (next: Scope) => { setScopeTouched(true); setScope(next); };
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [installations, setInstallations] = useState<Installation[]>([]);
  const [dealMap, setDealMap] = useState<Record<string, string>>({});
  const [clientMap, setClientMap] = useState<Record<string, string>>({});
  const [slaTargets, setSlaTargets] = useState({ site_survey: "72", installation: "120" });
  const [savingSla, setSavingSla] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    const [incidentResult, surveyResult, installationResult, dealResult, clientResult, slaResult] = await Promise.all([
      supabase.from("incidents").select("*").order("created_at", { ascending: false }),
      supabase.from("site_surveys").select("*").order("requested_at", { ascending: false }),
      supabase.from("installations").select("*").order("created_at", { ascending: false }),
      supabase.from("deals").select("id, title"),
      supabase.from("clients").select("id, name"),
      supabase.from("tech_sla_policies").select("task_type, target_hours"),
    ]);
    const error = incidentResult.error || surveyResult.error || installationResult.error;
    if (error) toast({ title: "Could not load Technology work", description: error.message, variant: "destructive" });
    setIncidents(incidentResult.data || []);
    setSurveys(surveyResult.data || []);
    setInstallations(installationResult.data || []);
    setDealMap(Object.fromEntries((dealResult.data || []).map((deal) => [deal.id, deal.title])));
    setClientMap(Object.fromEntries((clientResult.data || []).map((client) => [client.id, client.name])));
    if (slaResult.data) {
      const targets = { site_survey: "72", installation: "120" };
      slaResult.data.forEach((policy) => {
        if (policy.task_type === "site_survey" || policy.task_type === "installation") targets[policy.task_type] = String(policy.target_hours);
      });
      setSlaTargets(targets);
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchData();
    const channel = supabase
      .channel("technology-work-dashboard")
      .on("postgres_changes", { event: "*", schema: "public", table: "incidents" }, fetchData)
      .on("postgres_changes", { event: "*", schema: "public", table: "site_surveys" }, fetchData)
      .on("postgres_changes", { event: "*", schema: "public", table: "installations" }, fetchData)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchData]);

  const allWork = useMemo<WorkItem[]>(() => [
    ...incidents.map((item) => ({
      id: item.id, type: "Incident" as const, title: item.title,
      meta: `${item.incident_number} · ${item.client_id ? clientMap[item.client_id] || "Client" : "No client"}`,
      status: item.status, href: `/crm/incidents/${item.id}`, createdAt: item.created_at,
      dueAt: item.due_at, completedAt: item.resolved_at, assignedTo: item.assigned_to,
    })),
    ...surveys.map((item) => ({
      id: item.id, type: "Survey" as const, title: dealMap[item.deal_id] || "Unknown deal",
      meta: item.scheduled_date ? `Scheduled ${format(new Date(item.scheduled_date), "MMM d")}` : "Not scheduled",
      status: item.status, href: "/crm/technology/surveys", createdAt: item.requested_at || item.created_at,
      dueAt: item.due_at, completedAt: item.completed_at, scheduledDate: item.scheduled_date, assignedTo: item.assigned_to,
    })),
    ...installations.map((item) => ({
      id: item.id, type: "Installation" as const, title: dealMap[item.deal_id] || "Unknown deal",
      meta: `${item.work_order_number || "No work order"}${item.scheduled_date ? ` · ${format(new Date(item.scheduled_date), "MMM d")}` : " · Not scheduled"}`,
      status: item.status, href: "/crm/technology/installations", createdAt: item.created_at,
      dueAt: item.due_at, completedAt: item.completed_at, scheduledDate: item.scheduled_date, assignedTo: item.assigned_to,
    })),
  ], [clientMap, dealMap, incidents, installations, surveys]);

  const visibleWork = useMemo(() => {
    const scoped = scope === "mine" ? allWork.filter((item) => item.assignedTo === user?.id) : allWork;
    return scoped.sort((a, b) => {
      const rank = { breached: 0, at_risk: 1, normal: 2 };
      const stateDifference = rank[workState(a)] - rank[workState(b)];
      if (stateDifference) return stateDifference;
      return new Date(a.dueAt || a.createdAt).getTime() - new Date(b.dueAt || b.createdAt).getTime();
    });
  }, [allWork, scope, user?.id]);

  const openWork = visibleWork.filter((item) => !isClosed(item.status));
  const activeIncidents = openWork.filter((item) => item.type === "Incident");
  const openSurveys = openWork.filter((item) => item.type === "Survey");
  const activeInstallations = openWork.filter((item) => item.type === "Installation");
  const attention = openWork.filter((item) => workState(item) !== "normal" || (item.scheduledDate && isToday(new Date(item.scheduledDate))));
  const unassigned = allWork.filter((item) => !isClosed(item.status) && !item.assignedTo);
  const breached = openWork.filter((item) => workState(item) === "breached");
  const atRisk = openWork.filter((item) => workState(item) === "at_risk");
  const recent = (type: WorkItem["type"]) => visibleWork.filter((item) => item.type === type).slice(0, 5);

  const saveSlaTargets = async () => {
    setSavingSla(true);
    const { error } = await supabase.from("tech_sla_policies").upsert([
      { task_type: "site_survey", target_hours: parseInt(slaTargets.site_survey) || 72 },
      { task_type: "installation", target_hours: parseInt(slaTargets.installation) || 120 },
    ] as any, { onConflict: "task_type" });
    setSavingSla(false);
    toast(error ? { title: "Error saving SLA targets", description: error.message, variant: "destructive" } : { title: "SLA targets updated" });
  };

  if (loading) return <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" /></div>;

  const WorkList = ({ title, items, empty }: { title: string; items: WorkItem[]; empty: string }) => (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">{title}</CardTitle></CardHeader>
      <CardContent className="divide-y divide-border">
        {items.length === 0 ? <p className="py-6 text-center text-sm text-muted-foreground">{empty}</p> : items.map((item) => (
          <Link key={`${item.type}-${item.id}`} to={item.href} className="flex items-center justify-between gap-3 py-3 hover:bg-muted/50">
            <div className="min-w-0">
              <div className="flex items-center gap-2"><Badge variant="outline" className="text-[10px]">{item.type}</Badge><p className="truncate text-sm font-medium">{item.title}</p></div>
              <p className="mt-1 truncate text-xs text-muted-foreground">{item.meta}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <WorkSLABadge createdAt={item.createdAt} dueAt={item.dueAt} status={item.status} completedAt={item.completedAt} />
              <Badge variant="secondary" className="text-[10px] capitalize">{item.status.replace("_", " ")}</Badge>
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Technology Operations</h1>
          <p className="text-sm text-muted-foreground">Incidents, surveys, and installations in one work queue</p>
        </div>
        {isManager && (
          <div className="flex gap-2">
            <Button size="sm" variant={scope === "mine" ? "default" : "outline"} onClick={() => changeScope("mine")}><UserRound className="mr-2 h-4 w-4" />My Work</Button>
            <Button size="sm" variant={scope === "team" ? "default" : "outline"} onClick={() => changeScope("team")}><UsersRound className="mr-2 h-4 w-4" />Team Overview</Button>
          </div>
        )}
      </div>

      <KPIStrip items={[
        { label: "Active Incidents", value: activeIncidents.length, icon: Siren, color: "text-destructive" },
        { label: "Open Surveys", value: openSurveys.length, icon: ClipboardCheck, color: "text-primary" },
        { label: "Active Installations", value: activeInstallations.length, icon: Wrench, color: "text-accent" },
        { label: "Needs Attention", value: attention.length, sub: `${breached.length} breached · ${atRisk.length} at risk`, icon: AlertTriangle, color: "text-destructive" },
      ]} />

      {scope === "team" && isManager && (
        <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm"><Gauge className="h-4 w-4" />Team workload health</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-3 gap-3">
              <div><p className="text-2xl font-semibold">{openWork.length}</p><p className="text-xs text-muted-foreground">Active team work</p></div>
              <div><p className="text-2xl font-semibold text-destructive">{breached.length}</p><p className="text-xs text-muted-foreground">SLA breached</p></div>
              <div><p className="text-2xl font-semibold text-primary">{unassigned.length}</p><p className="text-xs text-muted-foreground">Unassigned</p></div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Field work SLA targets</CardTitle></CardHeader>
            <CardContent className="flex flex-wrap items-end gap-3">
              <div><Label className="text-xs">Survey hours</Label><Input type="number" min={1} className="w-24" value={slaTargets.site_survey} onChange={(event) => setSlaTargets({ ...slaTargets, site_survey: event.target.value })} /></div>
              <div><Label className="text-xs">Installation hours</Label><Input type="number" min={1} className="w-24" value={slaTargets.installation} onChange={(event) => setSlaTargets({ ...slaTargets, installation: event.target.value })} /></div>
              <Button size="sm" onClick={saveSlaTargets} disabled={savingSla}><Save className="mr-2 h-4 w-4" />{savingSla ? "Saving…" : "Save"}</Button>
            </CardContent>
          </Card>
        </div>
      )}

      <WorkList title={`Priority queue (${Math.min(openWork.length, 12)} shown)`} items={openWork.slice(0, 12)} empty={scope === "mine" ? "No active work assigned to you" : "No active Technology work"} />

      <div className="grid gap-4 xl:grid-cols-3">
        <WorkList title="Recent incidents" items={recent("Incident")} empty="No incidents in this view" />
        <WorkList title="Recent surveys" items={recent("Survey")} empty="No surveys in this view" />
        <WorkList title="Recent installations" items={recent("Installation")} empty="No installations in this view" />
      </div>
    </div>
  );
}
