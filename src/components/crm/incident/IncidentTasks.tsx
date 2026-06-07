import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2 } from "lucide-react";
import { useDepartmentProfiles } from "@/lib/assignment";

type Task = {
  id: string;
  title: string;
  status: string;
  assigned_to: string | null;
  due_date: string | null;
  created_by: string;
};

export function IncidentTasks({ incidentId }: { incidentId: string }) {
  const { user, role } = useAuth();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const { profiles } = useDepartmentProfiles("technology");
  const [title, setTitle] = useState("");
  const [assignTo, setAssignTo] = useState<string>("");
  const [dueDate, setDueDate] = useState("");

  const isAdmin = role === "admin" || role === "network_manager";

  const load = async () => {
    const t = await (supabase as any).from("incident_tasks").select("*").eq("incident_id", incidentId).order("created_at", { ascending: true });
    setTasks(t.data || []);
  };

  useEffect(() => { load(); }, [incidentId]);

  const add = async () => {
    if (!title.trim() || !user) return;
    const { error } = await (supabase as any).from("incident_tasks").insert({
      incident_id: incidentId, title, created_by: user.id,
      assigned_to: assignTo || null, due_date: dueDate || null,
    });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    setTitle(""); setAssignTo(""); setDueDate("");
    load();
  };

  const toggle = async (task: Task) => {
    const newStatus = task.status === "done" ? "open" : "done";
    await (supabase as any).from("incident_tasks").update({
      status: newStatus, completed_at: newStatus === "done" ? new Date().toISOString() : null,
    }).eq("id", task.id);
    load();
  };

  const remove = async (id: string) => {
    await (supabase as any).from("incident_tasks").delete().eq("id", id);
    load();
  };

  const profileName = (uid: string | null) => profiles.find((p) => p.user_id === uid)?.full_name || "—";

  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Tasks</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {tasks.length === 0 && <p className="text-xs text-muted-foreground">No tasks yet.</p>}
        {tasks.map((t) => (
          <div key={t.id} className="flex items-center gap-3 p-2 rounded-lg border border-border">
            <Checkbox checked={t.status === "done"} onCheckedChange={() => toggle(t)} />
            <div className="flex-1 min-w-0">
              <p className={`text-sm ${t.status === "done" ? "line-through text-muted-foreground" : ""}`}>{t.title}</p>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <Badge variant="outline" className="text-[9px]">{profileName(t.assigned_to)}</Badge>
                {t.due_date && <Badge variant="outline" className="text-[9px]">Due {t.due_date}</Badge>}
              </div>
            </div>
            {(isAdmin || t.created_by === user?.id) && (
              <Button size="icon" variant="ghost" onClick={() => remove(t.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
            )}
          </div>
        ))}
        <div className="space-y-2 pt-2 border-t border-border">
          <Input placeholder="Task title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <div className="grid grid-cols-2 gap-2">
            <Select value={assignTo} onValueChange={setAssignTo}>
              <SelectTrigger><SelectValue placeholder="Assign to" /></SelectTrigger>
              <SelectContent>
                {profiles.map((p) => <SelectItem key={p.user_id} value={p.user_id}>{p.full_name || "User"}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
          <Button onClick={add} disabled={!title.trim()} size="sm" className="w-full">
            <Plus className="h-3.5 w-3.5 mr-1" /> Add Task
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}