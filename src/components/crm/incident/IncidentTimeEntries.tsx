import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Trash2 } from "lucide-react";

type Entry = {
  id: string;
  minutes: number;
  billable: boolean;
  worked_on: string;
  note: string | null;
  logged_by: string;
  created_at: string;
};

export function IncidentTimeEntries({ incidentId }: { incidentId: string }) {
  const { user, role } = useAuth();
  const { toast } = useToast();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [minutes, setMinutes] = useState("");
  const [billable, setBillable] = useState(false);
  const [note, setNote] = useState("");

  const load = async () => {
    const [e, p] = await Promise.all([
      (supabase as any).from("incident_time_entries").select("*").eq("incident_id", incidentId).order("created_at", { ascending: false }),
      supabase.from("profiles").select("user_id, full_name"),
    ]);
    setEntries(e.data || []);
    setProfiles(Object.fromEntries((p.data || []).map((x: any) => [x.user_id, x.full_name || "User"])));
  };

  useEffect(() => { load(); }, [incidentId]);

  const add = async () => {
    const m = parseInt(minutes, 10);
    if (!m || m <= 0 || !user) return;
    const { error } = await (supabase as any).from("incident_time_entries").insert({
      incident_id: incidentId, logged_by: user.id, minutes: m, billable, note: note || null,
    });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    setMinutes(""); setBillable(false); setNote("");
    load();
  };

  const remove = async (id: string) => {
    await (supabase as any).from("incident_time_entries").delete().eq("id", id);
    load();
  };

  const total = entries.reduce((s, e) => s + e.minutes, 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-muted-foreground flex items-center justify-between">
          <span>Time Logged</span>
          <span className="text-foreground font-mono">{Math.floor(total / 60)}h {total % 60}m</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {entries.length === 0 && <p className="text-xs text-muted-foreground">No time logged.</p>}
        {entries.map((e) => (
          <div key={e.id} className="flex items-start gap-2 p-2 rounded-lg border border-border text-xs">
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium">{profiles[e.logged_by] || "User"}</span>
                <Badge variant="outline" className="text-[9px]">{e.minutes}m</Badge>
                {e.billable && <Badge variant="outline" className="text-[9px]">Billable</Badge>}
                <span className="text-muted-foreground">{format(new Date(e.created_at), "MMM d, HH:mm")}</span>
              </div>
              {e.note && <p className="text-foreground mt-1">{e.note}</p>}
            </div>
            {(role === "admin" || e.logged_by === user?.id) && (
              <Button size="icon" variant="ghost" onClick={() => remove(e.id)}><Trash2 className="h-3 w-3" /></Button>
            )}
          </div>
        ))}
        <div className="space-y-2 pt-2 border-t border-border">
          <div className="grid grid-cols-3 gap-2">
            <Input type="number" min={1} placeholder="Minutes" value={minutes} onChange={(e) => setMinutes(e.target.value)} />
            <label className="flex items-center gap-2 text-xs">
              <Checkbox checked={billable} onCheckedChange={(v) => setBillable(!!v)} /> Billable
            </label>
            <Button onClick={add} disabled={!minutes} size="sm">Log Time</Button>
          </div>
          <Input placeholder="What did you do? (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
      </CardContent>
    </Card>
  );
}