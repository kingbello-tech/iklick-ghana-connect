import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { KPIStrip } from "@/components/crm/dashboard/KPIStrip";
import { QueueTable } from "@/components/crm/dashboard/QueueTable";
import { QuickActions } from "@/components/crm/dashboard/QuickActions";
import { Users, UserPlus, CalendarClock, FileSpreadsheet, Coins } from "lucide-react";
import { format, subDays } from "date-fns";

export default function HRDashboard() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const e = await supabase.from("employees").select("*").order("hire_date", { ascending: false });
      setEmployees(e.data || []);
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  const active = employees.filter((e) => e.status === "active");
  const terminated = employees.filter((e) => e.status === "terminated");
  const recentlyHired = employees.filter((e) => e.hire_date && new Date(e.hire_date) > subDays(new Date(), 30));
  const byDept = new Map<string, number>();
  for (const e of active) {
    const d = e.department || "Unassigned";
    byDept.set(d, (byDept.get(d) || 0) + 1);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">HR Overview</h1>
          <p className="text-sm text-muted-foreground">Headcount, payroll readiness, and statutory deadlines</p>
        </div>
        <QuickActions actions={[
          { label: "Employees", to: "/crm/hr/employees", icon: Users },
          { label: "Payroll Runs", to: "/crm/hr/payroll-runs", icon: CalendarClock },
          { label: "Statutory Reports", to: "/crm/hr/statutory-reports", icon: FileSpreadsheet },
          { label: "Pay Items", to: "/crm/hr/pay-items", icon: Coins },
        ]} />
      </div>

      <KPIStrip items={[
        { label: "Active Headcount", value: active.length, icon: Users, color: "text-primary" },
        { label: "New (30d)", value: recentlyHired.length, icon: UserPlus, color: "text-green-500" },
        { label: "Terminated", value: terminated.length, icon: Users, color: "text-muted-foreground" },
        { label: "Departments", value: byDept.size, icon: FileSpreadsheet, color: "text-blue-500" },
      ]} />

      <div className="grid lg:grid-cols-2 gap-4">
        <QueueTable
          title={`Recent Hires (${recentlyHired.length})`}
          rows={recentlyHired.slice(0, 8)}
          rowHref={(r: any) => `/crm/hr/employees/${r.id}`}
          empty="No new hires in the last 30 days"
          columns={[
            { header: "Name", cell: (r: any) => <span className="text-sm truncate">{r.full_name}</span> },
            { header: "Role", cell: (r: any) => <span className="text-xs text-muted-foreground truncate">{r.job_title ?? "—"}</span> },
            { header: "Dept", cell: (r: any) => <span className="text-xs text-muted-foreground truncate">{r.department ?? "—"}</span> },
            { header: "Hired", className: "text-right text-xs", cell: (r: any) => r.hire_date ? format(new Date(r.hire_date), "MMM d") : "—" },
          ]}
        />
        <QueueTable
          title="Headcount by Department"
          rows={Array.from(byDept.entries()).map(([dept, n], idx) => ({ id: String(idx), dept, n }))}
          empty="No active employees"
          columns={[
            { header: "Department", cell: (r: any) => <span className="text-sm">{r.dept}</span> },
            { header: "Count", className: "text-right", cell: (r: any) => <Badge variant="outline" className="text-xs">{r.n}</Badge> },
          ]}
        />
      </div>
    </div>
  );
}