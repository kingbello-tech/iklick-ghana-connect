import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { KPIStrip } from "@/components/crm/dashboard/KPIStrip";
import { Search, GitBranch, ClipboardCheck, Wrench, CheckCircle2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

type Deal = {
  id: string;
  title: string;
  stage: string;
  value: number | null;
  mrc: number | null;
  bandwidth: string | null;
  service_type: string | null;
  client_id: string | null;
  assigned_to: string | null;
  expected_close_date: string | null;
  created_at: string;
};

type Survey = { id: string; deal_id: string; status: string; feasibility: string | null; scheduled_date: string | null; completed_at: string | null; assigned_to: string | null };
type Install = { id: string; deal_id: string; status: string; scheduled_date: string | null; completed_at: string | null; assigned_to: string | null; work_order_number: string | null };

// Lifecycle stages tracked by Service Delivery (leads become relevant once qualified)
const TRACKED_STAGES = ["qualification", "site_survey", "proposal_sent", "negotiation", "closed_won"];

type Phase = "qualified" | "survey" | "installation" | "live";

const PHASE_LABEL: Record<Phase, string> = {
  qualified: "Qualified",
  survey: "Site Survey",
  installation: "Installation",
  live: "Delivered",
};

const PHASE_STYLE: Record<Phase, string> = {
  qualified: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/40",
  survey: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/40",
  installation: "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/40",
  live: "bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/40",
};

export default function DeliveryPipeline() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [installs, setInstalls] = useState<Install[]>([]);
  const [clients, setClients] = useState<Record<string, string>>({});
  const [people, setPeople] = useState<Record<string, string>>({});

  const [search, setSearch] = useState("");
  const [phase, setPhase] = useState<string>("all");
  const [stage, setStage] = useState<string>("all");
  const [surveyStatus, setSurveyStatus] = useState<string>("all");
  const [installStatus, setInstallStatus] = useState<string>("all");

  useEffect(() => {
    (async () => {
      const [d, s, i, c, p] = await Promise.all([
        (supabase as any).from("deals").select("*").in("stage", TRACKED_STAGES).order("created_at", { ascending: false }),
        (supabase as any).from("site_surveys").select("id,deal_id,status,feasibility,scheduled_date,completed_at,assigned_to"),
        (supabase as any).from("installations").select("id,deal_id,status,scheduled_date,completed_at,assigned_to,work_order_number"),
        supabase.from("clients").select("id,name"),
        supabase.from("profiles").select("user_id,full_name"),
      ]);
      const err = d.error || s.error || i.error;
      if (err) toast({ title: "Could not load pipeline", description: err.message, variant: "destructive" });
      setDeals(d.data || []);
      setSurveys(s.data || []);
      setInstalls(i.data || []);
      setClients(Object.fromEntries((c.data || []).map((x: any) => [x.id, x.name])));
      setPeople(Object.fromEntries((p.data || []).map((x: any) => [x.user_id, x.full_name])));
      setLoading(false);
    })();
  }, [toast]);

  const rows = useMemo(() => {
    return deals.map((d) => {
      const survey = surveys.find((s) => s.deal_id === d.id) || null;
      const install = installs.find((x) => x.deal_id === d.id) || null;
      let phase: Phase = "qualified";
      if (install) phase = install.status === "completed" ? "live" : "installation";
      else if (survey) phase = "survey";
      return { deal: d, survey, install, phase };
    });
  }, [deals, surveys, installs]);

  const filtered = rows.filter((r) => {
    const q = search.trim().toLowerCase();
    if (q) {
      const hay = `${r.deal.title} ${clients[r.deal.client_id || ""] || ""} ${r.install?.work_order_number || ""}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (phase !== "all" && r.phase !== phase) return false;
    if (stage !== "all" && r.deal.stage !== stage) return false;
    if (surveyStatus !== "all" && (r.survey?.status || "none") !== surveyStatus) return false;
    if (installStatus !== "all" && (r.install?.status || "none") !== installStatus) return false;
    return true;
  });

  const clearAll = () => { setSearch(""); setPhase("all"); setStage("all"); setSurveyStatus("all"); setInstallStatus("all"); };
  const hasFilters = !!search || phase !== "all" || stage !== "all" || surveyStatus !== "all" || installStatus !== "all";

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold flex items-center gap-2"><GitBranch className="h-6 w-6" /> Delivery Pipeline</h1>
        <p className="text-sm text-muted-foreground">Qualified opportunities tracked from qualification through site survey to installation.</p>
      </div>

      <KPIStrip items={[
        { label: "Qualified", value: filtered.filter((r) => r.phase === "qualified").length, icon: ClipboardCheck, color: "text-blue-500" },
        { label: "In Survey", value: filtered.filter((r) => r.phase === "survey").length, icon: Search, color: "text-amber-500" },
        { label: "In Installation", value: filtered.filter((r) => r.phase === "installation").length, icon: Wrench, color: "text-purple-500" },
        { label: "Delivered", value: filtered.filter((r) => r.phase === "live").length, icon: CheckCircle2, color: "text-green-500" },
      ]} />

      <Card>
        <CardContent className="p-4 grid gap-3 md:grid-cols-5">
          <div className="relative md:col-span-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search deal, client, WO…" className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={phase} onValueChange={setPhase}>
            <SelectTrigger><SelectValue placeholder="Lifecycle phase" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All phases</SelectItem>
              {(Object.keys(PHASE_LABEL) as Phase[]).map((p) => <SelectItem key={p} value={p}>{PHASE_LABEL[p]}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={stage} onValueChange={setStage}>
            <SelectTrigger><SelectValue placeholder="Deal stage" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All stages</SelectItem>
              {TRACKED_STAGES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s.replace(/_/g, " ")}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={surveyStatus} onValueChange={setSurveyStatus}>
            <SelectTrigger><SelectValue placeholder="Survey status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any survey status</SelectItem>
              <SelectItem value="none">No survey yet</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Select value={installStatus} onValueChange={setInstallStatus}>
            <SelectTrigger><SelectValue placeholder="Installation status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any install status</SelectItem>
              <SelectItem value="none">No installation yet</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">In progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          {hasFilters && (
            <Button variant="ghost" size="sm" className="justify-self-start" onClick={clearAll}>
              <X className="h-4 w-4 mr-1" /> Clear filters
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">{filtered.length} opportunit{filtered.length === 1 ? "y" : "ies"}</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-10">No opportunities match these filters</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground border-b border-border">
                  <th className="py-2 pr-3 font-medium">Deal</th>
                  <th className="py-2 pr-3 font-medium">Client</th>
                  <th className="py-2 pr-3 font-medium">Phase</th>
                  <th className="py-2 pr-3 font-medium">Stage</th>
                  <th className="py-2 pr-3 font-medium">Survey</th>
                  <th className="py-2 pr-3 font-medium">Installation</th>
                  <th className="py-2 pr-3 font-medium">Bandwidth</th>
                  <th className="py-2 pr-3 font-medium">Expected close</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map(({ deal, survey, install, phase }) => (
                  <tr key={deal.id} className="hover:bg-muted/40">
                    <td className="py-2 pr-3 max-w-[220px] truncate">{deal.title}</td>
                    <td className="py-2 pr-3 max-w-[180px] truncate text-muted-foreground">{clients[deal.client_id || ""] || "—"}</td>
                    <td className="py-2 pr-3"><Badge variant="outline" className={`text-[10px] ${PHASE_STYLE[phase]}`}>{PHASE_LABEL[phase]}</Badge></td>
                    <td className="py-2 pr-3 capitalize text-muted-foreground">{deal.stage.replace(/_/g, " ")}</td>
                    <td className="py-2 pr-3 text-xs text-muted-foreground">
                      {survey ? (
                        <span className="capitalize">
                          {survey.status}
                          {survey.scheduled_date ? ` · ${format(new Date(survey.scheduled_date), "dd MMM")}` : ""}
                          {survey.assigned_to && people[survey.assigned_to] ? ` · ${people[survey.assigned_to]}` : ""}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="py-2 pr-3 text-xs text-muted-foreground">
                      {install ? (
                        <span className="capitalize">
                          {install.status.replace("_", " ")}
                          {install.work_order_number ? ` · ${install.work_order_number}` : ""}
                          {install.assigned_to && people[install.assigned_to] ? ` · ${people[install.assigned_to]}` : ""}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="py-2 pr-3 text-muted-foreground">{deal.bandwidth || "—"}</td>
                    <td className="py-2 pr-3 text-muted-foreground">{deal.expected_close_date ? format(new Date(deal.expected_close_date), "dd MMM yyyy") : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
