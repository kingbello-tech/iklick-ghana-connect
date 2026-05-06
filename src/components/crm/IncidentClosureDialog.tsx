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
  mode: "resolve" | "close";
  onCompleted: () => void;
}

export function IncidentClosureDialog({ open, onOpenChange, incidentId, incidentNumber, mode, onCompleted }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rootCause, setRootCause] = useState("");
  const [resolution, setResolution] = useState("");
  const [recommendation, setRecommendation] = useState("");
  const [closureNote, setClosureNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const reset = () => { setRootCause(""); setResolution(""); setRecommendation(""); setClosureNote(""); };

  const submitResolve = async () => {
    if (!user) return;
    if (!rootCause.trim() || !resolution.trim() || !recommendation.trim()) {
      toast({ title: "All fields required", description: "Root cause, resolution and recommendation are required to resolve a ticket.", variant: "destructive" });
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
      .update({ status: "resolved", resolved_at: new Date().toISOString() })
      .eq("id", incidentId);
    if (updateError) {
      setSubmitting(false);
      toast({ title: "Error", description: updateError.message, variant: "destructive" });
      return;
    }

    await supabase.from("incident_history").insert({
      incident_id: incidentId, user_id: user.id, field_changed: "status", old_value: null, new_value: "resolved",
    });

    toast({ title: "Ticket resolved", description: `${incidentNumber} resolved with resolution report. Awaiting Client Experience closure.` });
    setSubmitting(false);
    reset();
    onOpenChange(false);
    onCompleted();
  };

  const submitClose = async () => {
    if (!user) return;
    if (!closureNote.trim()) {
      toast({ title: "Closure note required", description: "Please provide a brief closure note before closing this ticket.", variant: "destructive" });
      return;
    }
    setSubmitting(true);

    const { error: noteError } = await supabase.from("incident_notes").insert({
      incident_id: incidentId, user_id: user.id, content: closureNote.trim(), note_type: "closure_note",
    });
    if (noteError) {
      setSubmitting(false);
      toast({ title: "Error", description: noteError.message, variant: "destructive" });
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

    toast({ title: "Ticket closed", description: `${incidentNumber} has been closed.` });
    setSubmitting(false);
    reset();
    onOpenChange(false);
    onCompleted();
  };

  const isResolve = mode === "resolve";

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isResolve ? `Resolve Ticket ${incidentNumber}` : `Close Ticket ${incidentNumber}`}</DialogTitle>
          <DialogDescription>
            {isResolve
              ? "Complete the resolution report. All fields are required before this ticket can be marked resolved."
              : "Add a closure note to finalize this ticket. The resolution report submitted at resolution time is already on file."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {isResolve ? (
            <>
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
            </>
          ) : (
            <div className="space-y-1.5">
              <Label htmlFor="closure-note">Closure Note *</Label>
              <Textarea id="closure-note" rows={4} value={closureNote} onChange={(e) => setClosureNote(e.target.value)} placeholder="e.g. Confirmed with client, service restored, no further action required." />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Cancel</Button>
          <Button onClick={isResolve ? submitResolve : submitClose} disabled={submitting}>
            {submitting ? (isResolve ? "Resolving..." : "Closing...") : (isResolve ? "Submit & Resolve Ticket" : "Close Ticket")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}