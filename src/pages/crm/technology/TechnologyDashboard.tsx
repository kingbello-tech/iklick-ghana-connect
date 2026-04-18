import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardCheck, Wrench, CheckCircle2, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function TechnologyDashboard() {
  const [surveys, setSurveys] = useState<any[]>([]);
  const [installations, setInstallations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [s, i] = await Promise.all([
        supabase.from("site_surveys").select("status"),
        supabase.from("installations").select("status"),
      ]);
      if (s.data) setSurveys(s.data);
      if (i.data) setInstallations(i.data);
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  const surveyPending = surveys.filter(s => s.status === "scheduled").length;
  const surveyDone = surveys.filter(s => s.status === "completed").length;
  const instPending = installations.filter(i => i.status === "pending").length;
  const instInProgress = installations.filter(i => i.status === "in_progress").length;
  const instDone = installations.filter(i => i.status === "completed").length;

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
