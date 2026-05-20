import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Check, X } from "lucide-react";

type Approval = {
  id: string;
  incident_id: string;
  requested_by: string;
  approver_id: string | null;
  reason: string;
  decision: string;
  decision_comment: string | null;
  decided_at: string | null;
  created_at: string;
};

export function IncidentApprovals({ incidentId }: { incidentId: string }) {
  const { user, role } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<Approval[]>([]);
  const [profiles, setProfiles] = useState<Record<string, { full_name: string | null }>>({});
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(true);

  const canApprove = role === "admin" || role === "network_manager" || role === "client_experience";

  const load = async () => {
    const [a, p] = await Promise.all([
      (supabase as any).from("incident_approvals").select("*").eq("incident_id", incidentId).order("created_at", { ascending: false }),
      supabase.from("profiles").select("user_id, full_name"),
    ]);
    setItems(a.data || []);
    setProfiles(Object.fromEntries((p.data || []).map((x: any) => [x.user_id, { full_name: x.full_name }])));
    setLoading(false);
  };

  useEffect(() => { load(); }, [incidentId]);

  const request = async () => {
    if (!reason.trim() || !user) return;
    const { error } = await (supabase as any).from("incident_approvals").insert({
      incident_id: incidentId, requested_by: user.id, reason,
    });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    setReason("");
    toast({ title: "Approval requested" });
    load();
  };

  const decide = async (id: string, decision: "approved" | "rejected", comment?: string) => {
    const { error } = await (supabase as any).from("incident_approvals").update({
      decision, decision_comment: comment || null, approver_id: user?.id, decided_at: new Date().toISOString(),
    }).eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: `Approval ${decision}` });
    load();
  };

  if (loading) return null;

  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Approvals</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 && <p className="text-xs text-muted-foreground">No approvals requested.</p>}
        {items.map((a) => (
          <div key={a.id} className="p-3 rounded-lg border border-border space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium">{profiles[a.requested_by]?.full_name || "User"}</span>
              <span className="text-[10px] text-muted-foreground">{format(new Date(a.created_at), "MMM d, HH:mm")}</span>
              <Badge variant="outline" className="ml-auto capitalize text-[10px]">{a.decision}</Badge>
            </div>
            <p className="text-sm whitespace-pre-wrap">{a.reason}</p>
            {a.decision === "pending" && canApprove && (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => decide(a.id, "approved")}><Check className="h-3.5 w-3.5 mr-1" /> Approve</Button>
                <Button size="sm" variant="outline" onClick={() => decide(a.id, "rejected")}><X className="h-3.5 w-3.5 mr-1" /> Reject</Button>
              </div>
            )}
            {a.decision !== "pending" && a.decision_comment && (
              <p className="text-xs text-muted-foreground italic">"{a.decision_comment}"</p>
            )}
          </div>
        ))}
        <div className="flex gap-2 pt-2 border-t border-border">
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Request approval (e.g., extend SLA, escalate to vendor)…" rows={2} />
          <Button onClick={request} disabled={!reason.trim()} className="self-end shrink-0">Request</Button>
        </div>
      </CardContent>
    </Card>
  );
}