import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { ProjectKanban } from "@/components/crm/projects/ProjectKanban";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

type Project = {
  id: string; code: string; name: string; description: string | null;
  status: string; health: string; start_date: string | null; target_end_date: string | null;
  client_id: string | null; deal_id: string | null; owner_id: string | null; budget: number | null;
};

const HEALTH: Record<string, string> = {
  green: "bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/40",
  amber: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/40",
  red: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/40",
};

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, isAdmin, role } = useAuth();
  const { toast } = useToast();
  const [project, setProject] = useState<Project | null>(null);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [clientName, setClientName] = useState<string>("");
  const [comment, setComment] = useState("");
  const [milestoneName, setMilestoneName] = useState("");
  const [milestoneDate, setMilestoneDate] = useState("");
  const [newMember, setNewMember] = useState<string>("");

  const canManage = isAdmin || role === "technology_manager" || role === "network_manager" || role === "sales_manager" || role === "service_delivery" || project?.owner_id === user?.id;

  const load = async () => {
    if (!id) return;
    const [p, m, mem, c, pr] = await Promise.all([
      (supabase as any).from("projects").select("*").eq("id", id).single(),
      (supabase as any).from("project_milestones").select("*").eq("project_id", id).order("sort_order"),
      (supabase as any).from("project_members").select("*").eq("project_id", id),
      (supabase as any).from("project_comments").select("*").eq("project_id", id).order("created_at", { ascending: false }),
      supabase.from("profiles").select("user_id, full_name"),
    ]);
    setProject(p.data || null);
    setMilestones(m.data || []);
    setMembers(mem.data || []);
    setComments(c.data || []);
    setProfiles(Object.fromEntries((pr.data || []).map((x: any) => [x.user_id, x.full_name || "User"])));
    if (p.data?.client_id) {
      const { data } = await supabase.from("clients").select("name").eq("id", p.data.client_id).single();
      setClientName(data?.name || "");
    }
  };
  useEffect(() => { load(); }, [id]);

  const updateField = async (field: keyof Project, value: any) => {
    if (!project) return;
    await (supabase as any).from("projects").update({ [field]: value }).eq("id", project.id);
    load();
  };

  const addComment = async () => {
    if (!comment.trim() || !user || !project) return;
    const { error } = await (supabase as any).from("project_comments").insert({
      project_id: project.id, user_id: user.id, content: comment,
    });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    setComment(""); load();
  };

  const addMilestone = async () => {
    if (!milestoneName.trim() || !project) return;
    const { error } = await (supabase as any).from("project_milestones").insert({
      project_id: project.id, name: milestoneName, target_date: milestoneDate || null,
      sort_order: milestones.length,
    });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    setMilestoneName(""); setMilestoneDate(""); load();
  };

  const toggleMilestone = async (m: any) => {
    const completed = !m.completed_at;
    await (supabase as any).from("project_milestones").update({
      completed_at: completed ? new Date().toISOString() : null,
      status: completed ? "completed" : "planned",
    }).eq("id", m.id);
    load();
  };

  const addMember = async () => {
    if (!newMember || !project) return;
    const { error } = await (supabase as any).from("project_members").insert({
      project_id: project.id, user_id: newMember, role: "member",
    });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    setNewMember(""); load();
  };

  const removeMember = async (memberId: string) => {
    await (supabase as any).from("project_members").delete().eq("id", memberId);
    load();
  };

  if (!project) return <div className="text-center text-muted-foreground py-12">Loading…</div>;

  return (
    <div className="space-y-6 max-w-6xl">
      <Link to="/crm/projects" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
        <ArrowLeft className="h-4 w-4" /> Back to Projects
      </Link>

      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs text-muted-foreground">{project.code}</span>
            <Badge className={`text-[10px] ${HEALTH[project.health]}`}>{project.health}</Badge>
            <Badge variant="outline" className="capitalize text-[10px]">{project.status.replace("_", " ")}</Badge>
          </div>
          <h1 className="text-2xl font-bold">{project.name}</h1>
          {clientName && <p className="text-sm text-muted-foreground mt-1">Client: {clientName}</p>}
        </div>
        {canManage && (
          <div className="flex items-center gap-2">
            <Select value={project.status} onValueChange={(v) => updateField("status", v)}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="planning">Planning</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="on_hold">On Hold</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={project.health} onValueChange={(v) => updateField("health", v)}>
              <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="green">Green</SelectItem>
                <SelectItem value="amber">Amber</SelectItem>
                <SelectItem value="red">Red</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <Tabs defaultValue="kanban">
        <TabsList>
          <TabsTrigger value="kanban">Board</TabsTrigger>
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="discussion">Discussion</TabsTrigger>
          <TabsTrigger value="overview">Overview</TabsTrigger>
        </TabsList>

        <TabsContent value="kanban" className="mt-4">
          <ProjectKanban projectId={project.id} />
        </TabsContent>

        <TabsContent value="milestones" className="mt-4 space-y-4">
          <Card>
            <CardContent className="p-4 space-y-3">
              {milestones.length === 0 && <p className="text-sm text-muted-foreground">No milestones yet.</p>}
              {milestones.map((m) => (
                <div key={m.id} className="flex items-center gap-3 p-2 border border-border rounded-lg">
                  <input type="checkbox" checked={!!m.completed_at} onChange={() => toggleMilestone(m)} className="h-4 w-4" />
                  <div className="flex-1">
                    <p className={`text-sm ${m.completed_at ? "line-through text-muted-foreground" : ""}`}>{m.name}</p>
                    {m.target_date && <p className="text-xs text-muted-foreground">Target: {format(new Date(m.target_date), "MMM d, yyyy")}</p>}
                  </div>
                  <Badge variant="outline" className="text-[10px] capitalize">{m.status}</Badge>
                </div>
              ))}
              {canManage && (
                <div className="flex gap-2 pt-2 border-t border-border">
                  <Input placeholder="Milestone name" value={milestoneName} onChange={(e) => setMilestoneName(e.target.value)} />
                  <Input type="date" value={milestoneDate} onChange={(e) => setMilestoneDate(e.target.value)} className="w-44" />
                  <Button onClick={addMilestone} disabled={!milestoneName.trim()}><Plus className="h-4 w-4 mr-1" /> Add</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team" className="mt-4 space-y-3">
          <Card>
            <CardContent className="p-4 space-y-2">
              {members.length === 0 && <p className="text-sm text-muted-foreground">No team members yet.</p>}
              {members.map((m) => (
                <div key={m.id} className="flex items-center gap-2 p-2 border border-border rounded-lg">
                  <span className="text-sm flex-1">{profiles[m.user_id] || "User"}</span>
                  <Badge variant="outline" className="text-[10px]">{m.role}</Badge>
                  {canManage && (
                    <Button size="icon" variant="ghost" onClick={() => removeMember(m.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  )}
                </div>
              ))}
              {canManage && (
                <div className="flex gap-2 pt-2 border-t border-border">
                  <Select value={newMember} onValueChange={setNewMember}>
                    <SelectTrigger><SelectValue placeholder="Select user" /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(profiles)
                        .filter(([uid]) => !members.some((m) => m.user_id === uid))
                        .map(([uid, name]) => <SelectItem key={uid} value={uid}>{name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button onClick={addMember} disabled={!newMember}><Plus className="h-4 w-4 mr-1" /> Add</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="discussion" className="mt-4 space-y-3">
          <Card>
            <CardContent className="p-4 space-y-3">
              {comments.map((c) => (
                <div key={c.id} className="p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-primary">{profiles[c.user_id] || "User"}</span>
                    <span className="text-[10px] text-muted-foreground">{format(new Date(c.created_at), "MMM d, HH:mm")}</span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{c.content}</p>
                </div>
              ))}
              <div className="flex gap-2 pt-2 border-t border-border">
                <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Add a comment…" rows={2} />
                <Button onClick={addComment} disabled={!comment.trim()} className="self-end">Post</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overview" className="mt-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Project Details</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Start Date</p>
                  <p>{project.start_date ? format(new Date(project.start_date), "MMM d, yyyy") : "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Target End</p>
                  {canManage ? (
                    <Input type="date" value={project.target_end_date || ""} onChange={(e) => updateField("target_end_date", e.target.value || null)} />
                  ) : <p>{project.target_end_date || "—"}</p>}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Owner</p>
                  <p>{project.owner_id ? profiles[project.owner_id] || "—" : "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Budget</p>
                  {canManage ? (
                    <Input type="number" value={project.budget || 0} onChange={(e) => updateField("budget", parseFloat(e.target.value) || 0)} />
                  ) : <p>₵{(project.budget || 0).toLocaleString()}</p>}
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Description</p>
                {canManage ? (
                  <Textarea value={project.description || ""} onChange={(e) => setProject({ ...project, description: e.target.value })} onBlur={() => updateField("description", project.description)} rows={3} />
                ) : (
                  <p className="whitespace-pre-wrap">{project.description || "—"}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}