import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type SlaPolicy = Database["public"]["Tables"]["sla_policies"]["Row"];

const PRIORITY_LABELS: Record<string, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
};

export default function SLAPolicies() {
  const [policies, setPolicies] = useState<SlaPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [edits, setEdits] = useState<Record<string, { response: number; resolution: number }>>({});
  const { toast } = useToast();

  const fetchPolicies = async () => {
    const { data } = await supabase.from("sla_policies").select("*").order("priority");
    if (data) {
      setPolicies(data);
      const initial: Record<string, { response: number; resolution: number }> = {};
      data.forEach((p) => { initial[p.id] = { response: p.response_time_minutes / 60, resolution: p.resolution_time_minutes / 60 }; });
      setEdits(initial);
    }
    setLoading(false);
  };

  useEffect(() => { fetchPolicies(); }, []);

  const savePolicy = async (policy: SlaPolicy) => {
    const edit = edits[policy.id];
    if (!edit) return;
    setSaving(policy.id);
    const { error } = await supabase.from("sla_policies").update({
      response_time_minutes: Math.round(edit.response * 60),
      resolution_time_minutes: Math.round(edit.resolution * 60),
    }).eq("id", policy.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "SLA policy updated" });
    }
    setSaving(null);
    fetchPolicies();
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  return (
    <div className="space-y-4 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">SLA Policies</h1>
        <p className="text-muted-foreground text-sm">Configure response and resolution time targets per priority level</p>
      </div>

      <div className="grid gap-4">
        {policies.map((policy) => {
          const edit = edits[policy.id];
          if (!edit) return null;
          return (
            <Card key={policy.id}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{PRIORITY_LABELS[policy.priority] || policy.priority} Priority</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Response Time (hours)</label>
                    <Input
                      type="number"
                      min={0}
                      step={0.25}
                      value={edit.response}
                      onChange={(e) => setEdits({ ...edits, [policy.id]: { ...edit, response: parseFloat(e.target.value) || 0 } })}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Resolution Time (hours)</label>
                    <Input
                      type="number"
                      min={0}
                      step={0.25}
                      value={edit.resolution}
                      onChange={(e) => setEdits({ ...edits, [policy.id]: { ...edit, resolution: parseFloat(e.target.value) || 0 } })}
                    />
                  </div>
                </div>
                <Button
                  size="sm"
                  className="mt-3"
                  onClick={() => savePolicy(policy)}
                  disabled={saving === policy.id || (Math.round(edit.response * 60) === policy.response_time_minutes && Math.round(edit.resolution * 60) === policy.resolution_time_minutes)}
                >
                  {saving === policy.id ? "Saving..." : "Save Changes"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
