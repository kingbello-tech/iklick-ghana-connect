import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Pause, Play } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function IncidentPauseControl({
  incidentId, paused, onChange,
}: { incidentId: string; paused: boolean; onChange: () => void }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const pause = async () => {
    if (!reason.trim()) return;
    setBusy(true);
    const { error } = await (supabase as any).rpc("pause_incident", { _incident_id: incidentId, _reason: reason.trim() });
    setBusy(false);
    if (error) return toast({ title: "Could not pause", description: error.message, variant: "destructive" });
    toast({ title: "SLA paused" });
    setOpen(false); setReason(""); onChange();
  };

  const resume = async () => {
    setBusy(true);
    const { error } = await (supabase as any).rpc("resume_incident", { _incident_id: incidentId });
    setBusy(false);
    if (error) return toast({ title: "Could not resume", description: error.message, variant: "destructive" });
    toast({ title: "SLA resumed", description: "Deadline extended by the paused time." });
    onChange();
  };

  if (paused) {
    return (
      <Button size="sm" variant="outline" onClick={resume} disabled={busy}>
        <Play className="h-3.5 w-3.5 mr-1.5" /> Resume SLA
      </Button>
    );
  }

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        <Pause className="h-3.5 w-3.5 mr-1.5" /> Pause SLA
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pause SLA clock</DialogTitle>
            <DialogDescription>
              While paused the ticket will not escalate or breach. The deadline is extended by the paused time when resumed.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="pause-reason">Reason (required)</Label>
            <Textarea id="pause-reason" value={reason} onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Awaiting client site access / third-party update" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={pause} disabled={busy || !reason.trim()}>Pause</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
