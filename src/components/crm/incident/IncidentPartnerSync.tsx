import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ExternalLink, RefreshCw, Send, Upload } from "lucide-react";

type PartnerSystem = { id: string; name: string; active: boolean };
type PartnerTicket = {
  id: string;
  partner_system_id: string;
  external_ticket_id: string | null;
  external_ticket_number: string | null;
  external_url: string | null;
  external_status: string | null;
  sync_state: string;
  last_error: string | null;
  last_pushed_at: string | null;
  last_synced_at: string | null;
};
type LogRow = {
  id: string;
  direction: string;
  action: string;
  status: string;
  message: string | null;
  created_at: string;
};

export function IncidentPartnerSync({ incidentId }: { incidentId: string }) {
  const { toast } = useToast();
  const [systems, setSystems] = useState<PartnerSystem[]>([]);
  const [tickets, setTickets] = useState<PartnerTicket[]>([]);
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [selected, setSelected] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    const [s, t, l] = await Promise.all([
      (supabase as any).from("partner_systems").select("id, name, active").eq("active", true).order("name"),
      (supabase as any).from("partner_tickets").select("*").eq("incident_id", incidentId),
      (supabase as any).from("partner_sync_log").select("id, direction, action, status, message, created_at")
        .eq("incident_id", incidentId).order("created_at", { ascending: false }).limit(10),
    ]);
    setSystems(s.data || []);
    setTickets(t.data || []);
    setLogs(l.data || []);
  };

  useEffect(() => { load(); }, [incidentId]);

  const run = async (action: string, partner_system_id?: string) => {
    setBusy(action + (partner_system_id ?? ""));
    try {
      const { data, error } = await supabase.functions.invoke("partner-ticket-sync", {
        body: { incident_id: incidentId, action, partner_system_id, note: note || undefined },
      });
      if (error) throw error;
      const res: any = data;
      if (res?.skipped) toast({ title: "Nothing to sync", description: res.reason });
      else if (res?.ok) { toast({ title: "Synced with partner system" }); setNote(""); }
      else toast({ title: "Sync failed", description: res?.results?.[0]?.error || "See sync history", variant: "destructive" });
      load();
    } catch (err: any) {
      toast({ title: "Sync error", description: err.message, variant: "destructive" });
    } finally {
      setBusy(null);
    }
  };

  const systemName = (id: string) => systems.find((s) => s.id === id)?.name || "Partner";

  return (
    <Card>
      <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm text-muted-foreground">Partner ISP Tickets</CardTitle>
        <Button size="icon" variant="ghost" onClick={load}><RefreshCw className="h-3.5 w-3.5" /></Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {tickets.length === 0 && (
          <p className="text-xs text-muted-foreground">Not escalated to any partner system yet.</p>
        )}

        {tickets.map((t) => (
          <div key={t.id} className="rounded-lg border border-border p-3 space-y-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{systemName(t.partner_system_id)}</span>
                <Badge variant={t.sync_state === "error" ? "destructive" : "secondary"} className="text-[9px]">
                  {t.sync_state}
                </Badge>
                {t.external_status && <Badge variant="outline" className="text-[9px]">{t.external_status}</Badge>}
              </div>
              {t.external_url && (
                <a href={t.external_url} target="_blank" rel="noreferrer" className="text-xs text-primary inline-flex items-center gap-1">
                  Open <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Ticket {t.external_ticket_number || t.external_ticket_id || "—"}
              {t.last_pushed_at ? ` · pushed ${new Date(t.last_pushed_at).toLocaleString()}` : ""}
            </p>
            {t.last_error && <p className="text-xs text-destructive break-words">{t.last_error}</p>}
            <div className="flex gap-2 flex-wrap">
              {!t.external_ticket_id ? (
                <>
                  <p className="text-xs text-muted-foreground w-full">
                    No ticket was opened on the partner system yet — retry the escalation before sending updates.
                  </p>
                  <Button size="sm" variant="outline" disabled={busy !== null}
                    onClick={() => run("create", t.partner_system_id)}>
                    Retry escalation
                  </Button>
                </>
              ) : (
                <>
                  <Button size="sm" variant="outline" disabled={busy !== null}
                    onClick={() => run("update", t.partner_system_id)}>
                    <Upload className="h-3.5 w-3.5 mr-1" /> Push update
                  </Button>
                  <Button size="sm" variant="outline" disabled={busy !== null || !note.trim()}
                    onClick={() => run("comment", t.partner_system_id)}>
                    <Send className="h-3.5 w-3.5 mr-1" /> Send note
                  </Button>
                  <Button size="sm" variant="outline" disabled={busy !== null}
                    onClick={() => run("close", t.partner_system_id)}>
                    Close on partner
                  </Button>
                </>
              )}
            </div>
          </div>
        ))}

        <Textarea
          rows={2}
          placeholder="Note to send to the partner system (optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />

        {systems.length > 0 && (
          <div className="flex gap-2 pt-2 border-t border-border">
            <Select value={selected} onValueChange={setSelected}>
              <SelectTrigger className="flex-1"><SelectValue placeholder="Escalate to partner system" /></SelectTrigger>
              <SelectContent>
                {systems.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button size="sm" disabled={!selected || busy !== null} onClick={() => run("create", selected)}>
              Escalate
            </Button>
          </div>
        )}
        {systems.length === 0 && (
          <p className="text-xs text-muted-foreground">No active partner systems configured.</p>
        )}

        {logs.length > 0 && (
          <div className="pt-2 border-t border-border space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Sync history</p>
            {logs.map((l) => (
              <div key={l.id} className="flex items-start justify-between gap-2 text-[11px]">
                <span className="text-muted-foreground">
                  {l.direction} · {l.action} {l.message ? `· ${l.message.slice(0, 80)}` : ""}
                </span>
                <span className={l.status === "success" ? "text-muted-foreground" : "text-destructive"}>
                  {new Date(l.created_at).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
