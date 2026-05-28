import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Download } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

export function IncidentExportDialog({ open, onOpenChange }: Props) {
  const { toast } = useToast();
  const today = format(new Date(), "yyyy-MM-dd");
  const monthAgo = format(new Date(Date.now() - 30 * 86400000), "yyyy-MM-dd");
  const [from, setFrom] = useState(monthAgo);
  const [to, setTo] = useState(today);
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const fromIso = new Date(from + "T00:00:00").toISOString();
      const toIso = new Date(to + "T23:59:59").toISOString();
      const [incRes, clientRes, profRes] = await Promise.all([
        supabase.from("incidents").select("*").gte("created_at", fromIso).lte("created_at", toIso).order("created_at", { ascending: false }),
        supabase.from("clients").select("id, name"),
        supabase.from("profiles").select("user_id, full_name"),
      ]);
      if (incRes.error) throw incRes.error;
      const incidentIds = (incRes.data || []).map((i: any) => i.id);
      let closures: any[] = [];
      // Fetch closures in chunks scoped to the actual incident IDs (avoids the 1000-row default limit and RLS edge cases)
      const chunkSize = 200;
      for (let i = 0; i < incidentIds.length; i += chunkSize) {
        const chunk = incidentIds.slice(i, i + chunkSize);
        const { data, error } = await (supabase as any)
          .from("incident_closures")
          .select("incident_id, root_cause, recommendation, resolution")
          .in("incident_id", chunk);
        if (error) throw error;
        closures = closures.concat(data || []);
      }
      const clientMap = Object.fromEntries((clientRes.data || []).map((c: any) => [c.id, c.name]));
      const profMap = Object.fromEntries((profRes.data || []).map((p: any) => [p.user_id, p.full_name]));
      const closureMap = Object.fromEntries(closures.map((c: any) => [c.incident_id, c]));

      const headers = ["Incident #", "Title", "Client", "Priority", "Status", "Category", "Service", "Location", "Termination POP", "Assigned To", "Created", "Resolved", "Closed", "Resolution Time (h)", "Root Cause", "Recommendation", "Resolution"];
      const rows = (incRes.data || []).map((i: any) => {
        const c = closureMap[i.id] || {};
        const resHours = i.resolved_at
          ? ((new Date(i.resolved_at).getTime() - new Date(i.created_at).getTime()) / 3600000).toFixed(2)
          : "";
        return [
        i.incident_number, i.title,
        i.client_id ? clientMap[i.client_id] || "" : "",
        i.priority, i.status, i.issue_category || "", i.service_type || "", i.location || "",
        i.termination_pop || "",
        i.assigned_to ? profMap[i.assigned_to] || "" : "",
        i.created_at ? format(new Date(i.created_at), "yyyy-MM-dd HH:mm") : "",
        i.resolved_at ? format(new Date(i.resolved_at), "yyyy-MM-dd HH:mm") : "",
        i.closed_at ? format(new Date(i.closed_at), "yyyy-MM-dd HH:mm") : "",
        resHours,
        c.root_cause || "",
        c.recommendation || "",
        c.resolution || "",
        ];
      });
      const escape = (v: any) => {
        const s = String(v ?? "");
        return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
      };
      const csv = [headers, ...rows].map((r) => r.map(escape).join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `incidents_${from}_to_${to}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Export complete", description: `${rows.length} incident${rows.length !== 1 ? "s" : ""} exported.` });
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: "Export failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Export Incidents</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">From</Label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} max={to} />
          </div>
          <div>
            <Label className="text-xs">To</Label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} min={from} max={today} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleExport} disabled={loading} className="gap-2">
            <Download className="h-4 w-4" /> {loading ? "Exporting..." : "Download CSV"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}