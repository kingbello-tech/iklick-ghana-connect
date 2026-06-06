import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { KPIStrip } from "@/components/crm/dashboard/KPIStrip";
import { QueueTable } from "@/components/crm/dashboard/QueueTable";
import { Badge } from "@/components/ui/badge";
import { QuickActions } from "@/components/crm/dashboard/QuickActions";
import { FolderKanban, Activity, CheckCircle2, AlertTriangle, Clock } from "lucide-react";

export default function ServiceDeliveryDashboard() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any)
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });
      setProjects(data || []);
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  const active = projects.filter((p) => p.status === "active" || p.status === "planning");
  const completed = projects.filter((p) => p.status === "completed");
  const atRisk = projects.filter((p) => p.health === "red" || p.health === "amber");
  const overdue = projects.filter(
    (p) => p.target_end_date && new Date(p.target_end_date) < new Date() && p.status !== "completed"
  );

  const cols = [
    { header: "Code", cell: (p: any) => <span className="font-mono text-xs">{p.code}</span> },
    { header: "Name", cell: (p: any) => <span className="truncate">{p.name}</span> },
    { header: "Status", cell: (p: any) => <Badge variant="outline" className="capitalize text-[10px]">{String(p.status).replace("_", " ")}</Badge> },
    { header: "Health", cell: (p: any) => <Badge variant="outline" className="capitalize text-[10px]">{p.health}</Badge> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">Service Delivery</h1>
          <p className="text-sm text-muted-foreground">All projects in the Service Delivery department</p>
        </div>
        <QuickActions actions={[
          { label: "All Projects", to: "/crm/projects", icon: FolderKanban },
        ]} />
      </div>

      <KPIStrip items={[
        { label: "Active Projects", value: active.length, icon: Activity, color: "text-primary" },
        { label: "Completed", value: completed.length, icon: CheckCircle2, color: "text-green-500" },
        { label: "At Risk", value: atRisk.length, icon: AlertTriangle, color: "text-amber-500" },
        { label: "Overdue", value: overdue.length, icon: Clock, color: "text-destructive" },
      ]} />

      <div className="grid lg:grid-cols-2 gap-4">
        <QueueTable
          title={`Active (${active.length})`}
          rows={active.slice(0, 10)}
          columns={cols}
          rowHref={(r: any) => `/crm/projects/${r.id}`}
          empty="No active projects"
        />
        <QueueTable
          title={`At Risk / Overdue (${atRisk.length + overdue.length})`}
          rows={[...atRisk, ...overdue].slice(0, 10)}
          columns={cols}
          rowHref={(r: any) => `/crm/projects/${r.id}`}
          empty="All projects on track"
        />
      </div>
    </div>
  );
}