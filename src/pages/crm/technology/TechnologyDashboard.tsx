import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ClipboardCheck, Wrench, CheckCircle2, Clock, AlertTriangle, Gauge, Save } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { WorkSLABadge } from "@/components/crm/dashboard/WorkSLABadge";

interface Deal { id: string; title: string; }

const STATUS_BADGE: Record<string, string> = {
  scheduled: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  in_progress: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  completed: "bg-green-500/20 text-green-400 border-green-500/30",
  cancelled: "bg-red-500/20 text-red-400 border-red-500/30",
};

export default function TechnologyDashboard() {
  const { user, role } = useAuth();
  const { toast } = useToast();
  const [surveys, setSurveys] = useState<any[]>([]);
  const [installations, setInstallations] = useState<any[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [slaTargets, setSlaTargets] = useState<{ site_survey: string; installation: string }>({ site_survey: "72", installation: "120" });
  const [savingSla, setSavingSla] = useState(false);
  const [loading, setLoading] = useState(true);

  const isEngineer = role === "technology_engineer";
  const isManager = role === "admin" || role === "technology_manager";

  useEffect(() => {
    (async () => {
      const [s, i, d, sla] = await Promise.all([
        supabase.from("site_surveys").select("id, status, deal_id, assigned_to, scheduled_date, feasibility, requested_at, created_at, due_at, completed_at"),
        supabase.from("installations").select("id, status, deal_id, assigned_to, scheduled_date, created_at, due_at, completed_at, work_order_number"),
        supabase.from("deals").select("id, title"),
        supabase.from("tech_sla_policies").select("task_type, target_hours"),
      ]);
      if (s.data) setSurveys(s.data);
      if (i.data) setInstallations(i.data);
      if (d.data) setDeals(d.data);
      if (sla.data) {
        const map: any = { site_survey: "72", installation: "120" };
        sla.data.forEach((p: any) => { map[p.task_type] = String(p.target_hours); });
        setSlaTargets(map);
      }
      setLoading(false);
    })();
  }, []);

  const saveSlaTargets = async () => {
    setSavingSla(true);
    const rows = [
      { task_type: "site_survey", target_hours: parseInt(slaTargets.site_survey) || 72 },
      { task_type: "installation", target_hours: parseInt(slaTargets.installation) || 120 },
    ];
    const { error } = await supabase.from("tech_sla_policies").upsert(rows as any, { onConflict: "task_type" });
    setSavingSla(false);
    toast(error
      ? { title: "Error saving SLA targets", description: error.message, variant: "destructive" }
      : { title: "SLA targets updated", description: "New deadlines apply to newly created work." });
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  const dealMap = Object.fromEntries(deals.map(d => [d.id, d.title]));

  const surveyPending = surveys.filter(s => s.status === "scheduled").length;
  const surveyDone = surveys.filter(s => s.status === "completed").length;
  const instPending = installations.filter(i => i.status === "pending").length;
  const instInProgress = installations.filter(i => i.status === "in_progress").length;
  const instDone = installations.filter(i => i.status === "completed").length;

  const now = new Date();
  const isOpen = (x: any) => x.status !== "completed" && x.status !== "cancelled";
  const isBreached = (x: any) => x.due_at && new Date(x.due_at) < now && isOpen(x);
  const isAtRisk = (x: any) => {
    if (!x.due_at || !isOpen(x)) return false;
    const due = new Date(x.due_at), start = new Date(x.requested_at || x.created_at);
    return due > now && due.getTime() - now.getTime() < (due.getTime() - start.getTime()) * 0.25;
  };
  const breachedWork = [...surveys, ...installations].filter(isBreached);
  const atRiskCount = [...surveys, ...installations].filter(isAtRisk).length;
  const lateDone = [...surveys, ...installations].filter(x => x.status === "completed" && x.completed_at && x.due_at && new Date(x.completed_at) > new Date(x.due_at)).length;

  const mySurveys = isEngineer
    ? surveys.filter(s => s.assigned_to === user?.id && s.status !== "completed" && s.status !== "cancelled")
    : [];
  const myInstalls = isEngineer
    ? installations.filter(i => i.assigned_to === user?.id && i.status !== "completed" && i.status !== "cancelled")
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Technology Operations</h1>
        <p className="text-muted-foreground text-sm">Survey and installation workflow overview</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 flex items-center gap-3"><Clock className="h-8 w-8 text-yellow-400" /><div><p className="text-2xl font-bold text-foreground">{surveyPending}</p><p className="text-xs text-muted-foreground">Surveys Pending</p></div></CardContent></Card>
        <Card><CardContent className="pt-4 flex items-center gap-3"><CheckCircle2 className="h-8 w-8 text-green-400" /><div><p className="text-2xl font-bold text-foreground">{surveyDone}</p><p className="text-xs text-muted-foreground">Surveys Done</p></div></CardContent></Card>
        <Card><CardContent className="pt-4 flex items-center gap-3"><Wrench className="h-8 w-8 text-yellow-400" /><div><p className="text-2xl font-bold text-foreground">{instPending + instInProgress}</p><p className="text-xs text-muted-foreground">Active Installs</p></div></CardContent></Card>
        <Card><CardContent className="pt-4 flex items-center gap-3"><CheckCircle2 className="h-8 w-8 text-green-400" /><div><p className="text-2xl font-bold text-foreground">{instDone}</p><p className="text-xs text-muted-foreground">Installs Done</p></div></CardContent></Card>
      </div>

      {isEngineer && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-sm"><ClipboardCheck className="h-4 w-4" />My Surveys ({mySurveys.length})</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {mySurveys.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No active surveys assigned</p>}
              {mySurveys.map(s => (
                <Link key={s.id} to="/crm/technology/surveys" className="block p-3 rounded-lg border border-border hover:border-primary/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">{dealMap[s.deal_id] || "Unknown deal"}</p>
                      <p className="text-xs text-muted-foreground">
                        {s.scheduled_date ? `Scheduled ${format(new Date(s.scheduled_date), "MMM d")}` : "Not scheduled"} · {s.feasibility}
                      </p>
                    </div>
                    <Badge variant="outline" className={STATUS_BADGE[s.status]}>{s.status}</Badge>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-sm"><Wrench className="h-4 w-4" />My Installations ({myInstalls.length})</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {myInstalls.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No active installations assigned</p>}
              {myInstalls.map(i => (
                <Link key={i.id} to="/crm/technology/installations" className="block p-3 rounded-lg border border-border hover:border-primary/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">{dealMap[i.deal_id] || "Unknown deal"}</p>
                      <p className="text-xs text-muted-foreground">
                        {i.scheduled_date ? `Scheduled ${format(new Date(i.scheduled_date), "MMM d")}` : "Not scheduled"}
                      </p>
                    </div>
                    <Badge variant="outline" className={STATUS_BADGE[i.status]}>{i.status.replace("_", " ")}</Badge>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-sm"><ClipboardCheck className="h-4 w-4" />Site Surveys</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">Surveys requested by Sales for technical and feasibility assessment.</p>
            <Button asChild size="sm" className="w-full"><Link to="/crm/technology/surveys">Open Survey Queue</Link></Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-sm"><Wrench className="h-4 w-4" />Installations</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">Auto-created from Closed Won deals. Assign engineers and track progress.</p>
            <Button asChild size="sm" className="w-full"><Link to="/crm/technology/installations">Open Installation Queue</Link></Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
