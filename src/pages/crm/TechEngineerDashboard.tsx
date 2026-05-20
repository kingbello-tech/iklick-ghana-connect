import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { KPIStrip } from "@/components/crm/dashboard/KPIStrip";
import { QueueTable } from "@/components/crm/dashboard/QueueTable";
import { QuickActions } from "@/components/crm/dashboard/QuickActions";
import { ClipboardCheck, Wrench, Calendar, CheckCircle, ListTree } from "lucide-react";
import { format } from "date-fns";

export default function TechEngineerDashboard() {
  const { user } = useAuth();
  const [surveys, setSurveys] = useState<any[]>([]);
  const [installs, setInstalls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [s, i] = await Promise.all([
        supabase.from("site_surveys").select("*, deals(title, client_id, clients(name, location))").eq("assigned_to", user.id).order("scheduled_date", { ascending: true }),
        supabase.from("installations").select("*, deals(title, client_id, clients(name, location))").eq("assigned_to", user.id).order("scheduled_date", { ascending: true }),
      ]);
      setSurveys(s.data || []);
      setInstalls(i.data || []);
      setLoading(false);
    })();
  }, [user]);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  const openSurveys = surveys.filter((s) => s.status !== "completed");
  const openInstalls = installs.filter((i) => i.status !== "completed");
  const today = new Date().toISOString().slice(0, 10);
  const todayWork = [...openSurveys, ...openInstalls].filter((x) => x.scheduled_date === today);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">My Field Work</h1>
          <p className="text-sm text-muted-foreground">Site surveys and installations assigned to you</p>
        </div>
        <QuickActions actions={[
          { label: "All Surveys", to: "/crm/technology/surveys", icon: ClipboardCheck },
          { label: "All Installs", to: "/crm/technology/installations", icon: Wrench },
        ]} />
      </div>

      <KPIStrip items={[
        { label: "Open Surveys", value: openSurveys.length, icon: ClipboardCheck, color: "text-blue-500" },
        { label: "Open Installs", value: openInstalls.length, icon: Wrench, color: "text-orange-500" },
        { label: "Scheduled Today", value: todayWork.length, icon: Calendar, color: "text-primary" },
        { label: "Completed (total)", value: surveys.filter(s=>s.status==="completed").length + installs.filter(i=>i.status==="completed").length, icon: CheckCircle, color: "text-green-500" },
      ]} />

      <div className="grid lg:grid-cols-2 gap-4">
        <QueueTable
          title={`My Surveys (${openSurveys.length})`}
          rows={openSurveys.slice(0, 10)}
          rowHref={() => `/crm/technology/surveys`}
          empty="No open surveys"
          columns={[
            { header: "Deal", cell: (r: any) => <span className="text-sm truncate">{r.deals?.title ?? "—"}</span> },
            { header: "Client", cell: (r: any) => <span className="text-xs text-muted-foreground truncate">{r.deals?.clients?.name ?? "—"}</span> },
            { header: "Date", className: "text-right text-xs", cell: (r: any) => r.scheduled_date ? format(new Date(r.scheduled_date), "MMM d") : "—" },
            { header: "Status", className: "text-right", cell: (r: any) => <Badge variant="outline" className="text-[10px] capitalize">{r.status}</Badge> },
          ]}
        />
        <QueueTable
          title={`My Installations (${openInstalls.length})`}
          rows={openInstalls.slice(0, 10)}
          rowHref={() => `/crm/technology/installations`}
          empty="No open installations"
          columns={[
            { header: "WO", cell: (r: any) => <span className="font-mono text-xs">{r.work_order_number ?? "—"}</span> },
            { header: "Deal", cell: (r: any) => <span className="text-sm truncate">{r.deals?.title ?? "—"}</span> },
            { header: "Date", className: "text-right text-xs", cell: (r: any) => r.scheduled_date ? format(new Date(r.scheduled_date), "MMM d") : "—" },
            { header: "Status", className: "text-right", cell: (r: any) => <Badge variant="outline" className="text-[10px] capitalize">{r.status}</Badge> },
          ]}
        />
      </div>

      <QueueTable
        title={<span className="flex items-center gap-2"><ListTree className="h-4 w-4" />Today's Schedule</span>}
        rows={todayWork}
        empty="Nothing scheduled for today"
        columns={[
          { header: "Type", cell: (r: any) => <Badge variant="outline" className="text-[10px]">{r.work_order_number ? "Install" : "Survey"}</Badge> },
          { header: "Deal", cell: (r: any) => <span className="text-sm truncate">{r.deals?.title ?? "—"}</span> },
          { header: "Client", cell: (r: any) => <span className="text-xs text-muted-foreground truncate">{r.deals?.clients?.name ?? "—"}</span> },
          { header: "Status", className: "text-right", cell: (r: any) => <Badge variant="outline" className="text-[10px] capitalize">{r.status}</Badge> },
        ]}
      />
    </div>
  );
}