import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import type { Database } from "@/integrations/supabase/types";

type HistoryRow = Database["public"]["Tables"]["incident_history"]["Row"];

export default function AuditLogs() {
  const [logs, setLogs] = useState<(HistoryRow & { incident_number?: string; user_name?: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      const { data: historyData } = await supabase
        .from("incident_history")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);

      if (!historyData) { setLoading(false); return; }

      // Fetch related incident numbers and user names
      const incidentIds = [...new Set(historyData.map((h) => h.incident_id))];
      const userIds = [...new Set(historyData.map((h) => h.user_id).filter(Boolean))] as string[];

      const [incRes, profRes] = await Promise.all([
        incidentIds.length > 0 ? supabase.from("incidents").select("id, incident_number").in("id", incidentIds) : { data: [] },
        userIds.length > 0 ? supabase.from("profiles").select("user_id, full_name").in("user_id", userIds) : { data: [] },
      ]);

      const incMap = Object.fromEntries((incRes.data || []).map((i) => [i.id, i.incident_number]));
      const profMap = Object.fromEntries((profRes.data || []).map((p) => [p.user_id, p.full_name]));

      setLogs(historyData.map((h) => ({
        ...h,
        incident_number: incMap[h.incident_id] || h.incident_id,
        user_name: h.user_id ? (profMap[h.user_id] || "Unknown") : "System",
      })));
      setLoading(false);
    };

    fetchLogs();
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Audit Logs</h1>
        <p className="text-muted-foreground text-sm">View all incident state changes and system activity</p>
      </div>

      <Card>
        <CardContent className="p-0">
          {logs.length === 0 ? (
            <p className="text-muted-foreground text-sm py-12 text-center">No audit logs yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-3 text-muted-foreground font-medium text-xs">Time</th>
                    <th className="text-left p-3 text-muted-foreground font-medium text-xs">Incident</th>
                    <th className="text-left p-3 text-muted-foreground font-medium text-xs">User</th>
                    <th className="text-left p-3 text-muted-foreground font-medium text-xs">Field</th>
                    <th className="text-left p-3 text-muted-foreground font-medium text-xs">Old Value</th>
                    <th className="text-left p-3 text-muted-foreground font-medium text-xs">New Value</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                      <td className="p-3 text-muted-foreground text-xs whitespace-nowrap">
                        {format(new Date(log.created_at), "MMM d, yyyy HH:mm")}
                      </td>
                      <td className="p-3">
                        <Badge variant="outline" className="font-mono text-xs">{log.incident_number}</Badge>
                      </td>
                      <td className="p-3 text-foreground">{log.user_name}</td>
                      <td className="p-3 text-muted-foreground capitalize">{log.field_changed.replace(/_/g, " ")}</td>
                      <td className="p-3 text-muted-foreground">{log.old_value || "—"}</td>
                      <td className="p-3 text-foreground">{log.new_value || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
