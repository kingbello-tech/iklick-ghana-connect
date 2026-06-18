import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { ExternalLink, Save } from "lucide-react";
import { format } from "date-fns";

type Pattern = {
  client_id: string | null;
  client_name: string | null;
  site_id: string | null;
  site_name: string | null;
  issue_category: string;
  sub_category: string;
  incident_count: number;
  first_seen: string;
  last_seen: string;
  problem_record_id: string | null;
};

const STATUSES = ["open", "investigating", "mitigated", "resolved"] as const;

export function ProblemRecordDrawer({
  pattern,
  windowDays,
  open,
  onClose,
  onSaved,
}: {
  pattern: Pattern;
  windowDays: number;
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
}) {
  const { user } = useAuth();
  const qc = useQueryClient();

  const [title, setTitle] = useState("");
  const [status, setStatus] = useState<typeof STATUSES[number]>("open");
  const [rootCause, setRootCause] = useState("");
  const [fixPlan, setFixPlan] = useState("");
  const [notes, setNotes] = useState("");
  const [targetDate, setTargetDate] = useState<string>("");

  // Load existing record if any
  const { data: existing } = useQuery({
    queryKey: ["problem-record", pattern.problem_record_id],
    queryFn: async () => {
      if (!pattern.problem_record_id) return null;
      const { data, error } = await supabase
        .from("problem_records")
        .select("*")
        .eq("id", pattern.problem_record_id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!pattern.problem_record_id,
  });

  // Related incidents in window
  const { data: incidents = [] } = useQuery({
    queryKey: ["pattern-incidents", pattern.client_id, pattern.site_id, pattern.issue_category, pattern.sub_category, windowDays],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("recurring_pattern_incidents", {
        _client_id: pattern.client_id,
        _site_id: pattern.site_id,
        _issue_category: pattern.issue_category,
        _sub_category: pattern.sub_category,
        _window_days: windowDays,
      });
      if (error) throw error;
      return (data ?? []) as Array<{ id: string; incident_number: string; title: string; status: string; created_at: string; resolved_at: string | null; }>;
    },
  });

  useEffect(() => {
    if (existing) {
      setTitle(existing.title ?? "");
      setStatus((existing.status as any) ?? "open");
      setRootCause(existing.root_cause ?? "");
      setFixPlan(existing.fix_plan ?? "");
      setNotes(existing.notes ?? "");
      setTargetDate(existing.target_date ?? "");
    } else {
      setTitle(`${pattern.issue_category}${pattern.sub_category ? " / " + pattern.sub_category : ""} — ${pattern.client_name ?? "Unknown"}`);
      setStatus("open");
      setRootCause("");
      setFixPlan("");
      setNotes("");
      setTargetDate("");
    }
  }, [existing, pattern]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload: any = {
        client_id: pattern.client_id,
        site_id: pattern.site_id,
        issue_category: pattern.issue_category,
        sub_category: pattern.sub_category || null,
        title,
        status,
        root_cause: rootCause || null,
        fix_plan: fixPlan || null,
        notes: notes || null,
        target_date: targetDate || null,
        resolved_at: status === "resolved" ? new Date().toISOString() : null,
      };
      let recordId = pattern.problem_record_id;
      if (recordId) {
        const { error } = await supabase.from("problem_records").update(payload).eq("id", recordId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("problem_records")
          .insert({ ...payload, created_by: user?.id, owner_id: user?.id })
          .select("id")
          .single();
        if (error) throw error;
        recordId = data.id;
        // Auto-link existing incidents
        if (incidents.length > 0) {
          await supabase.from("problem_record_incidents").insert(
            incidents.map((inc) => ({
              problem_record_id: recordId!,
              incident_id: inc.id,
              linked_by: user?.id,
            }))
          );
        }
      }
      return recordId;
    },
    onSuccess: () => {
      toast.success(pattern.problem_record_id ? "Problem record updated" : "Problem record created");
      qc.invalidateQueries({ queryKey: ["problem-record"] });
      onSaved?.();
      onClose();
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to save"),
  });

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{pattern.problem_record_id ? "Problem Record" : "New Problem Record"}</SheetTitle>
          <SheetDescription>
            {pattern.client_name ?? "Unassigned client"} · {pattern.issue_category}
            {pattern.sub_category && ` / ${pattern.sub_category}`}
            {pattern.site_name && ` · ${pattern.site_name}`}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 mt-6">
          <div className="grid grid-cols-3 gap-3 text-sm">
            <Stat label="Occurrences" value={String(pattern.incident_count)} />
            <Stat label="First seen" value={format(new Date(pattern.first_seen), "MMM d, yyyy")} />
            <Stat label="Last seen" value={format(new Date(pattern.last_seen), "MMM d, yyyy")} />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="pr-title">Title</Label>
            <Input id="pr-title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pr-target">Target fix date</Label>
              <Input id="pr-target" type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pr-root">Root cause</Label>
            <Textarea id="pr-root" rows={3} value={rootCause} onChange={(e) => setRootCause(e.target.value)} placeholder="What is causing this pattern?" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pr-fix">Fix plan</Label>
            <Textarea id="pr-fix" rows={3} value={fixPlan} onChange={(e) => setFixPlan(e.target.value)} placeholder="Permanent fix to prevent recurrence" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pr-notes">Notes</Label>
            <Textarea id="pr-notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          <Separator />

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Related incidents ({incidents.length})</Label>
            </div>
            <div className="space-y-1 max-h-64 overflow-y-auto border rounded-md p-2">
              {incidents.length === 0 && <div className="text-sm text-muted-foreground p-2">No incidents in window.</div>}
              {incidents.map((inc) => (
                <Link
                  key={inc.id}
                  to={`/crm/incidents/${inc.id}`}
                  className="flex items-center justify-between gap-2 text-sm p-2 rounded hover:bg-muted"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-xs text-muted-foreground">{inc.incident_number}</div>
                    <div className="truncate">{inc.title}</div>
                  </div>
                  <Badge variant="outline" className="text-xs">{inc.status}</Badge>
                  <ExternalLink className="h-3 w-3 text-muted-foreground" />
                </Link>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !title.trim()}>
              <Save className="h-4 w-4 mr-2" />
              {pattern.problem_record_id ? "Save changes" : "Create record"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border rounded-md p-2">
      <div className="text-xs text-muted-foreground uppercase tracking-wider">{label}</div>
      <div className="font-semibold">{value}</div>
    </div>
  );
}