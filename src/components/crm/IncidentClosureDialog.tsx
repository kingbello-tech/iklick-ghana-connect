import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  incidentId: string;
  incidentNumber: string;
  onClosed: () => void;
}

export function IncidentClosureDialog({ open, onOpenChange, incidentId, incidentNumber, onClosed }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rootCause, setRootCause] = useState("");
  const [resolution, setResolution] = useState("");
  const [recommendation, setRecommendation] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const reset = () => { setRootCause(""); setResolution(""); setRecommendation(""); };

  const submit = async () => {
    if (!user) return;
    if (!rootCause.trim() || !resolution.trim() || !recommendation.trim()) {
      toast({ title: "All fields required", description: "Root cause, resolution and recommendation are required to close a ticket.", variant: "destructive" });
      return;
    }
    setSubmitting(true);

    const { error: closureError } = await (supabase as any).from("incident_closures").insert({
      incident_id: incidentId,
      root_cause: rootCause.trim(),
      resolution: resolution.trim(),
      recommendation: recommendation.trim(),
      closed_by: user.id,
    });
    if (closureError) {
      setSubmitting(false);
      toast({ title: "Error", description: closureError.message, variant: "destructive" });
      return;
    }

    const { error: updateError } = await supabase.from("incidents")
      .update({ status: "closed", closed_at: new Date().toISOString() })
      .eq("id", incidentId);
    if (updateError) {
      setSubmitting(false);
      toast({ title: "Error", description: updateError.message, variant: "destructive" });
      return;
    }

    await supabase.from("incident_history").insert({
      incident_id: incidentId, user_id: user.id, field_changed: "status", old_value: "resolved", new_value: "closed",
    });

    toast({ title: "Ticket closed", description: `${incidentNumber} closed with closure report.` });
    setSubmitting(false);
    reset();
    onOpenChange(false);
    onClosed();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Close Ticket {incidentNumber}</DialogTitle>
          <DialogDescription>Complete the closure report. All fields are required before this ticket can be closed.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="root-cause">Root Cause *</Label>
            <Textarea id="root-cause" rows={3} value={rootCause} onChange={(e) => setRootCause(e.target.value)} placeholder="What caused this incident?" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="resolution">Resolution *</Label>
            <Textarea id="resolution" rows={3} value={resolution} onChange={(e) => setResolution(e.target.value)} placeholder="What was done to resolve it?" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="recommendation">Recommendation *</Label>
            <Textarea id="recommendation" rows={3} value={recommendation} onChange={(e) => setRecommendation(e.target.value)} placeholder="How can recurrence be prevented?" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Cancel</Button>
          <Button onClick={submit} disabled={submitting}>{submitting ? "Closing..." : "Submit & Close Ticket"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}