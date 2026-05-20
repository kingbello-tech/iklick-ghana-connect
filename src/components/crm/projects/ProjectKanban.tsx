import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  DndContext, DragEndEvent, DragOverlay, PointerSensor, useDraggable, useDroppable, useSensor, useSensors,
} from "@dnd-kit/core";

type Task = {
  id: string;
  title: string;
  status: string;
  priority: string;
  assigned_to: string | null;
  due_date: string | null;
  project_id: string;
  created_by: string;
};

const COLUMNS: { key: Task["status"]; label: string }[] = [
  { key: "backlog", label: "Backlog" },
  { key: "todo", label: "To Do" },
  { key: "in_progress", label: "In Progress" },
  { key: "review", label: "Review" },
  { key: "done", label: "Done" },
  { key: "blocked", label: "Blocked" },
];

const PRIORITY: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  high: "bg-orange-500/15 text-orange-600 dark:text-orange-400",
  critical: "bg-destructive/15 text-destructive",
};

function TaskCard({ task, profiles }: { task: Task; profiles: Record<string, string> }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: task.id });
  return (
    <Card
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`p-3 space-y-2 cursor-grab active:cursor-grabbing select-none ${isDragging ? "opacity-50" : ""}`}
    >
      <p className="text-sm font-medium text-foreground">{task.title}</p>
      <div className="flex items-center gap-2 flex-wrap">
        <Badge className={`text-[9px] ${PRIORITY[task.priority] || ""}`}>{task.priority}</Badge>
        {task.assigned_to && <Badge variant="outline" className="text-[9px]">{profiles[task.assigned_to] || "User"}</Badge>}
        {task.due_date && <Badge variant="outline" className="text-[9px]">{task.due_date}</Badge>}
      </div>
    </Card>
  );
}

function Column({ col, tasks, profiles }: { col: typeof COLUMNS[number]; tasks: Task[]; profiles: Record<string, string> }) {
  const { setNodeRef, isOver } = useDroppable({ id: col.key });
  return (
    <div className="flex-1 min-w-[220px]">
      <div className="flex items-center justify-between mb-2 px-1">
        <span className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">{col.label}</span>
        <Badge variant="outline" className="text-[10px]">{tasks.length}</Badge>
      </div>
      <div
        ref={setNodeRef}
        className={`space-y-2 p-2 rounded-lg min-h-[200px] border border-dashed transition-colors ${
          isOver ? "bg-primary/5 border-primary/40" : "border-border bg-muted/30"
        }`}
      >
        {tasks.map((t) => <TaskCard key={t.id} task={t} profiles={profiles} />)}
      </div>
    </div>
  );
}

export function ProjectKanban({ projectId }: { projectId: string }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const [tasks, setTasks] = useState<Task[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("medium");

  const load = async () => {
    const [t, p] = await Promise.all([
      (supabase as any).from("project_tasks").select("*").eq("project_id", projectId).order("sort_order"),
      supabase.from("profiles").select("user_id, full_name"),
    ]);
    setTasks(t.data || []);
    setProfiles(Object.fromEntries((p.data || []).map((x: any) => [x.user_id, x.full_name || "User"])));
  };
  useEffect(() => { load(); }, [projectId]);

  const grouped = useMemo(() => {
    const map: Record<string, Task[]> = {};
    COLUMNS.forEach((c) => (map[c.key] = []));
    tasks.forEach((t) => { (map[t.status] ||= []).push(t); });
    return map;
  }, [tasks]);

  const onDragEnd = async (e: DragEndEvent) => {
    const taskId = e.active.id as string;
    const newStatus = e.over?.id as string | undefined;
    if (!newStatus) return;
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === newStatus) return;
    setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, status: newStatus } : t));
    const { error } = await (supabase as any).from("project_tasks").update({
      status: newStatus, completed_at: newStatus === "done" ? new Date().toISOString() : null,
    }).eq("id", taskId);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); load(); }
  };

  const create = async () => {
    if (!title.trim() || !user) return;
    const { error } = await (supabase as any).from("project_tasks").insert({
      project_id: projectId, title, priority, status: "todo", created_by: user.id,
    });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    setTitle(""); setPriority("medium"); setAdding(false);
    load();
  };

  return (
    <div className="space-y-3">
      {adding ? (
        <div className="flex items-center gap-2 p-3 rounded-lg border border-border bg-card">
          <Input autoFocus placeholder="Task title" value={title} onChange={(e) => setTitle(e.target.value)} className="flex-1" />
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={create} size="sm" disabled={!title.trim()}>Add</Button>
          <Button onClick={() => setAdding(false)} variant="outline" size="sm">Cancel</Button>
        </div>
      ) : (
        <Button onClick={() => setAdding(true)} size="sm" variant="outline">
          <Plus className="h-4 w-4 mr-1" /> Add Task
        </Button>
      )}

      <DndContext sensors={sensors} onDragEnd={onDragEnd}>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {COLUMNS.map((c) => (
            <Column key={c.key} col={c} tasks={grouped[c.key] || []} profiles={profiles} />
          ))}
        </div>
        <DragOverlay />
      </DndContext>
    </div>
  );
}