import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Clock, User, MapPin, Send, Pencil, X, Check, Trash2 } from "lucide-react";
import { Attachments } from "@/components/crm/Attachments";
import { NotesEditor } from "@/components/crm/NotesEditor";
import { IncidentClosureDialog } from "@/components/crm/IncidentClosureDialog";
import { SLATimerBadge } from "@/components/crm/dashboard/SLATimerBadge";
import { IncidentApprovals } from "@/components/crm/incident/IncidentApprovals";
import { IncidentTasks } from "@/components/crm/incident/IncidentTasks";
import { IncidentTimeEntries } from "@/components/crm/incident/IncidentTimeEntries";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type Incident = Database["public"]["Tables"]["incidents"]["Row"];
type IncidentNote = Database["public"]["Tables"]["incident_notes"]["Row"];
type IncidentHistory = Database["public"]["Tables"]["incident_history"]["Row"];
type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type Client = Database["public"]["Tables"]["clients"]["Row"];
type Site = Database["public"]["Tables"]["client_sites"]["Row"];

const PRIORITY_COLORS: Record<string, string> = {
  critical: "hsl(0, 84%, 60%)", high: "hsl(25, 95%, 53%)", medium: "hsl(45, 93%, 47%)", low: "hsl(142, 71%, 45%)",
};
const STATUS_COLORS: Record<string, string> = {
  open: "hsl(195, 100%, 42%)", in_progress: "hsl(45, 93%, 47%)", escalated: "hsl(0, 84%, 60%)", resolved: "hsl(142, 71%, 45%)", closed: "hsl(215, 20%, 45%)",
};

const CATEGORIES = ["Connectivity", "Speed", "Hardware", "Billing", "Installation", "Maintenance", "Other"];
const DEPARTMENTS = ["Client Experience", "Technology", "Project Management", "Sales"];

export default function IncidentDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, role, canManageIncidents, isAdmin } = useAuth();
  const canCloseIncident = role === "admin" || role === "client_experience" || role === "network_manager";
  const navigate = useNavigate();
  const { toast } = useToast();
  const [incident, setIncident] = useState<Incident | null>(null);
  const [notes, setNotes] = useState<IncidentNote[]>([]);
  const [history, setHistory] = useState<IncidentHistory[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [clients, setClients] = useState<Client[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [clientName, setClientName] = useState<string>("");
  const [affectedClientIds, setAffectedClientIds] = useState<string[]>([]);
  const [newNote, setNewNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Incident> & { department?: string }>({});
  const [editDepartment, setEditDepartment] = useState("");
  const [closureOpen, setClosureOpen] = useState(false);
  const [closureMode, setClosureMode] = useState<"resolve" | "close">("resolve");
  const [closure, setClosure] = useState<{ root_cause: string; resolution: string; recommendation: string; closed_by: string; created_at: string } | null>(null);
  const [slaMinutes, setSlaMinutes] = useState<number | null>(null);

  const fetchAll = async () => {
    if (!id) return;
    const [incRes, notesRes, histRes, profRes, clientsRes, closureRes, slaRes, linksRes, sitesRes] = await Promise.all([
      supabase.from("incidents").select("*").eq("id", id).single(),
      supabase.from("incident_notes").select("*").eq("incident_id", id).order("created_at", { ascending: true }),
      supabase.from("incident_history").select("*").eq("incident_id", id).order("created_at", { ascending: false }),
      supabase.from("profiles").select("*"),
      supabase.from("clients").select("*"),
      (supabase as any).from("incident_closures").select("*").eq("incident_id", id).maybeSingle(),
      supabase.from("sla_policies").select("priority,resolution_time_minutes"),
      (supabase as any).from("incident_clients").select("client_id").eq("incident_id", id),
      supabase.from("client_sites").select("*").order("name"),
    ]);
    if (incRes.data) {
      setIncident(incRes.data);
      if (incRes.data.client_id) {
        const c = clientsRes.data?.find((cl) => cl.id === incRes.data.client_id);
        if (c) setClientName(c.name);
      }
      const sla = slaRes.data?.find((s: any) => s.priority === incRes.data.priority);
      setSlaMinutes(sla?.resolution_time_minutes ?? null);
    }
    if (notesRes.data) setNotes(notesRes.data);
    if (histRes.data) setHistory(histRes.data);
    if (profRes.data) setProfiles(Object.fromEntries(profRes.data.map((p) => [p.user_id, p])));
    if (clientsRes.data) setClients(clientsRes.data);
    if (sitesRes.data) setSites(sitesRes.data as Site[]);
    setAffectedClientIds(((linksRes as any)?.data || []).map((r: any) => r.client_id));
    setClosure(closureRes.data || null);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, [id]);

  const trackChange = async (field: string, oldVal: string | null, newVal: string | null) => {
    if (!incident || !user || oldVal === newVal) return;
    await supabase.from("incident_history").insert({
      incident_id: incident.id, user_id: user.id, field_changed: field, old_value: oldVal, new_value: newVal,
    });
  };

  const updateStatus = async (newStatus: string) => {
    if (!incident || !user) return;
    if (newStatus === "resolved") {
      // Mandatory resolution report
      if (!canManageIncidents) {
        toast({ title: "Not allowed", description: "You don't have permission to resolve tickets.", variant: "destructive" });
        return;
      }
      setClosureMode("resolve");
      setClosureOpen(true);
      return;
    }
    if (newStatus === "closed") {
      if (!canCloseIncident) {
        toast({ title: "Not allowed", description: "Only Client Experience, Managers and Admins can close tickets.", variant: "destructive" });
        return;
      }
      setClosureMode("close");
      setClosureOpen(true);
      return;
    }
    const updates: any = { status: newStatus };

    const { error } = await supabase.from("incidents").update(updates).eq("id", incident.id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }

    await trackChange("status", incident.status, newStatus);

    // Flag-to-Technology: notify tech team when escalated
    if (newStatus === "escalated" && incident.status !== "escalated") {
      try {
        const { data: roleRows } = await supabase
          .from("user_roles")
          .select("user_id")
          .in("role", ["technology_manager", "technology_engineer"] as any);
        const ids = (roleRows || []).map((r: any) => r.user_id);
        let emails: string[] = [];
        if (ids.length) {
          const { data: profs } = await supabase.from("profiles").select("email").in("user_id", ids);
          emails = (profs || []).map((p: any) => p.email).filter(Boolean);
        }
        if (emails.length) {
          supabase.functions.invoke("send-incident-email", {
            body: {
              incident_number: incident.incident_number,
              title: incident.title,
              description: incident.description,
              priority: incident.priority,
              tech_team_emails: emails,
              flag_reason: "Incident escalated and requires Technology team attention",
              ticket_url: `${window.location.origin}/crm/incidents/${incident.id}`,
            },
          }).catch((err) => console.error("Tech notify failed:", err));
        }
      } catch (err) { console.error("Tech notify lookup failed:", err); }
    }

    fetchAll();
  };

  const onClosureCompleted = async () => {
    if (!incident) return;
    if (incident.client_id) {
      const client = clients.find((c) => c.id === incident.client_id);
      if (client?.email) {
        supabase.functions.invoke("send-incident-email", {
          body: {
            incident_number: incident.incident_number,
            title: incident.title,
            description: incident.description,
            priority: incident.priority,
            client_email: client.email,
            client_name: client.name,
            is_closed: closureMode === "close",
            is_resolved: closureMode === "resolve",
          },
        }).catch((err) => console.error("Notification failed:", err));
      }
    }
    fetchAll();
  };

  const startEditing = () => {
    if (!incident) return;
    // Find the department of currently assigned user
    const assignedProfile = incident.assigned_to ? profiles[incident.assigned_to] : null;
    setEditDepartment(assignedProfile?.department || "");
    setEditForm({
      title: incident.title,
      description: incident.description,
      priority: incident.priority,
      service_type: incident.service_type,
      issue_category: incident.issue_category,
      location: incident.location,
      termination_pop: (incident as any).termination_pop ?? null,
      client_id: incident.client_id,
      site_id: (incident as any).site_id ?? null,
      assigned_to: incident.assigned_to,
    });
    setEditing(true);
  };

  const saveEdits = async () => {
    if (!incident || !user) return;
    const changes: { field: string; old: string | null; new: string | null }[] = [];

    if (editForm.title !== incident.title) changes.push({ field: "title", old: incident.title, new: editForm.title || null });
    if (editForm.description !== incident.description) changes.push({ field: "description", old: incident.description, new: editForm.description || null });
    if (editForm.priority !== incident.priority) changes.push({ field: "priority", old: incident.priority, new: editForm.priority || null });
    if (editForm.service_type !== incident.service_type) changes.push({ field: "service_type", old: incident.service_type, new: editForm.service_type || null });
    if (editForm.issue_category !== incident.issue_category) changes.push({ field: "issue_category", old: incident.issue_category, new: editForm.issue_category || null });
    if (editForm.location !== incident.location) changes.push({ field: "location", old: incident.location, new: editForm.location || null });
    if ((editForm as any).termination_pop !== (incident as any).termination_pop) changes.push({ field: "termination_pop", old: (incident as any).termination_pop ?? null, new: (editForm as any).termination_pop || null });
    if (editForm.client_id !== incident.client_id) changes.push({ field: "client_id", old: incident.client_id, new: editForm.client_id || null });
    if ((editForm as any).site_id !== (incident as any).site_id) changes.push({ field: "site_id", old: (incident as any).site_id ?? null, new: (editForm as any).site_id || null });
    if (editForm.assigned_to !== incident.assigned_to) changes.push({ field: "assigned_to", old: incident.assigned_to, new: editForm.assigned_to || null });

    if (changes.length === 0) { setEditing(false); return; }

    const { error } = await supabase.from("incidents").update({
      title: editForm.title,
      description: editForm.description,
      priority: editForm.priority,
      service_type: editForm.service_type,
      issue_category: editForm.issue_category,
      location: editForm.location,
      termination_pop: (editForm as any).termination_pop || null,
      client_id: editForm.client_id || null,
      site_id: (editForm as any).site_id || null,
      assigned_to: editForm.assigned_to || null,
    }).eq("id", incident.id);

    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }

    for (const ch of changes) {
      await trackChange(ch.field, ch.old, ch.new);
    }

    // Send reassignment email if assigned_to changed
    if (editForm.assigned_to && editForm.assigned_to !== incident.assigned_to) {
      const assignedProfile = profiles[editForm.assigned_to];
      let assignedEmail: string | null = null;
      if (assignedProfile?.email) {
        assignedEmail = assignedProfile.email;
      } else {
        const { data: profData } = await supabase.from("profiles").select("email").eq("user_id", editForm.assigned_to).single();
        assignedEmail = profData?.email || null;
      }

      if (assignedEmail) {
        supabase.functions.invoke("send-incident-email", {
          body: {
            incident_number: incident.incident_number,
            title: editForm.title || incident.title,
            description: editForm.description || incident.description,
            priority: editForm.priority || incident.priority,
            assigned_email: assignedEmail,
            assigned_name: assignedProfile?.full_name || null,
            ticket_url: `${window.location.origin}/crm/incidents/${incident.id}`,
          },
        }).catch((err) => console.error("Reassignment email failed:", err));
      }
    }

    toast({ title: "Incident updated" });
    setEditing(false);
    fetchAll();
  };

  const addNote = async () => {
    if (!newNote.trim() || !incident || !user) return;
    const { error } = await supabase.from("incident_notes").insert({
      incident_id: incident.id, user_id: user.id, content: newNote, note_type: "note",
    });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }

    // Notify client about the new note
    if (incident.client_id) {
      const client = clients.find((c) => c.id === incident.client_id);
      if (client?.email) {
        supabase.functions.invoke("send-incident-email", {
          body: {
            incident_number: incident.incident_number,
            title: incident.title,
            description: `A new update has been added to your ticket:\n\n"${newNote}"`,
            priority: incident.priority,
            client_email: client.email,
            client_name: client.name,
            is_note_update: true,
          },
        }).catch((err) => console.error("Client note notification failed:", err));
      }
    }

    setNewNote("");
    fetchAll();
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  if (!incident) return <p className="text-center text-muted-foreground">Incident not found</p>;

  const staffProfiles = Object.values(profiles);
  const filteredStaff = editDepartment
    ? staffProfiles.filter((p) => p.department === editDepartment)
    : staffProfiles;

  return (
    <div className="space-y-6 max-w-4xl">
      <Link to="/crm/incidents" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Incidents
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="font-mono text-muted-foreground text-sm">{incident.incident_number}</span>
            <Badge style={{ backgroundColor: `${PRIORITY_COLORS[incident.priority]}20`, color: PRIORITY_COLORS[incident.priority], borderColor: `${PRIORITY_COLORS[incident.priority]}40` }}>
              {incident.priority}
            </Badge>
            <Badge variant="outline" style={{ color: STATUS_COLORS[incident.status], borderColor: `${STATUS_COLORS[incident.status]}40` }}>
              {incident.status.replace("_", " ")}
            </Badge>
            <SLATimerBadge
              createdAt={incident.created_at}
              targetMinutes={slaMinutes}
              resolved={incident.status === "resolved" || incident.status === "closed"}
            />
          </div>
          {editing ? (
            <Input
              value={editForm.title || ""}
              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              className="text-xl font-bold mt-1"
            />
          ) : (
            <h1 className="text-xl font-bold text-foreground">{incident.title}</h1>
          )}
        </div>
        <div className="flex items-center gap-2">
          {canManageIncidents && !editing && (
            <Button variant="outline" size="sm" onClick={startEditing}>
              <Pencil className="h-3.5 w-3.5 mr-1.5" /> Edit
            </Button>
          )}
          {editing && (
            <>
              <Button variant="outline" size="sm" onClick={() => setEditing(false)}>
                <X className="h-3.5 w-3.5 mr-1.5" /> Cancel
              </Button>
              <Button size="sm" onClick={saveEdits}>
                <Check className="h-3.5 w-3.5 mr-1.5" /> Save
              </Button>
            </>
          )}
          {canManageIncidents && !editing && (
            <Select value={incident.status} onValueChange={updateStatus}>
              <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="escalated">Escalated</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                {(canCloseIncident || incident.status === "closed") && (
                  <SelectItem value="closed">Closed</SelectItem>
                )}
              </SelectContent>
            </Select>
          )}
          {canCloseIncident && incident.status === "resolved" && !editing && (
            <Button size="sm" onClick={() => { setClosureMode("close"); setClosureOpen(true); }}>
              Close Ticket
            </Button>
          )}
          {isAdmin && !editing && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Incident</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete {incident.incident_number}? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={async () => {
                      const { error } = await supabase.from("incidents").delete().eq("id", incident.id);
                      if (error) {
                        toast({ title: "Error", description: error.message, variant: "destructive" });
                      } else {
                        toast({ title: "Deleted", description: "Incident has been deleted." });
                        navigate("/crm/incidents");
                      }
                    }}
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-4">
          <Tabs defaultValue="conversation" className="space-y-4">
            <TabsList>
              <TabsTrigger value="conversation">Conversation</TabsTrigger>
              <TabsTrigger value="approvals">Approvals</TabsTrigger>
              <TabsTrigger value="tasks">Tasks</TabsTrigger>
              <TabsTrigger value="time">Time</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            <TabsContent value="conversation" className="space-y-4 mt-0">
              {/* Description */}
              <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Description</CardTitle></CardHeader>
            <CardContent>
              {editing ? (
                <Textarea
                  value={editForm.description || ""}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  rows={4}
                />
              ) : (
                <p className="text-sm text-foreground whitespace-pre-wrap">{incident.description || "No description provided."}</p>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Notes & Activity</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {notes.map((note) => (
                <div key={note.id} className="p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-primary">{profiles[note.user_id]?.full_name || "User"}</span>
                    <span className="text-[10px] text-muted-foreground">{format(new Date(note.created_at), "MMM d, HH:mm")}</span>
                  </div>
                  <div className="text-sm text-foreground prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-headings:my-2">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{note.content}</ReactMarkdown>
                  </div>
                  <div className="mt-2">
                    <Attachments entityType="incident_note" entityId={note.id} compact canUpload={note.user_id === user?.id || canManageIncidents} />
                  </div>
                </div>
              ))}
              {canManageIncidents && (
                <div className="flex gap-2">
                  <NotesEditor value={newNote} onChange={setNewNote} placeholder="Add a note... (supports **bold**, *italic*, lists, links)" rows={2} />
                  <Button onClick={addNote} size="icon" disabled={!newNote.trim()} className="self-end shrink-0">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

              {/* Attachments */}
              <Attachments entityType="incident" entityId={incident.id} title="Incident Attachments" />

              {closure && (
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Closure Report</CardTitle></CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Root Cause</p>
                      <p className="text-foreground whitespace-pre-wrap">{closure.root_cause}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Resolution</p>
                      <p className="text-foreground whitespace-pre-wrap">{closure.resolution}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Recommendation</p>
                      <p className="text-foreground whitespace-pre-wrap">{closure.recommendation}</p>
                    </div>
                    <p className="text-[11px] text-muted-foreground pt-2 border-t border-border">
                      Closed by {profiles[closure.closed_by]?.full_name || "—"} on {format(new Date(closure.created_at), "MMM d, yyyy HH:mm")}
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="approvals" className="mt-0">
              <IncidentApprovals incidentId={incident.id} />
            </TabsContent>

            <TabsContent value="tasks" className="mt-0">
              <IncidentTasks incidentId={incident.id} />
            </TabsContent>

            <TabsContent value="time" className="mt-0">
              <IncidentTimeEntries incidentId={incident.id} />
            </TabsContent>

            <TabsContent value="history" className="mt-0">
              {history.length > 0 ? (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Change History</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {history.map((h) => {
                    const resolve = (val: string | null) => {
                      if (!val) return val;
                      if (h.field_changed === "client_id") {
                        return clients.find((c) => c.id === val)?.name || val;
                      }
                      if (h.field_changed === "assigned_to") {
                        return profiles[val]?.full_name || val;
                      }
                      return val.replace(/_/g, " ");
                    };
                    const fieldLabel = h.field_changed === "client_id" ? "client" : h.field_changed === "assigned_to" ? "assignee" : h.field_changed.replace(/_/g, " ");
                    return (
                      <div key={h.id} className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                        <Clock className="h-3 w-3 shrink-0" />
                        <span className="text-primary">{profiles[h.user_id || ""]?.full_name || "System"}</span>
                        <span>changed <span className="font-medium text-foreground">{fieldLabel}</span></span>
                        {h.old_value && <span>from <Badge variant="outline" className="text-[9px]">{resolve(h.old_value)}</Badge></span>}
                        <span>to <Badge variant="outline" className="text-[9px]">{resolve(h.new_value)}</Badge></span>
                        <span className="ml-auto">{format(new Date(h.created_at), "MMM d, HH:mm")}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
              ) : (
                <p className="text-xs text-muted-foreground">No history yet.</p>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar Details */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Details</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              {editing ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Client</label>
                    <Select value={editForm.client_id || ""} onValueChange={(v) => setEditForm({ ...editForm, client_id: v, site_id: null } as any)}>
                      <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                      <SelectContent>
                        {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  {editForm.client_id && (
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Site</label>
                      <Select value={(editForm as any).site_id || ""} onValueChange={(v) => setEditForm({ ...editForm, site_id: v } as any)}>
                        <SelectTrigger><SelectValue placeholder="Select site (optional)" /></SelectTrigger>
                        <SelectContent>
                          {sites.filter((s) => s.client_id === editForm.client_id).length === 0 ? (
                            <SelectItem value="none" disabled>No sites for this client</SelectItem>
                          ) : (
                            sites.filter((s) => s.client_id === editForm.client_id).map((s) => (
                              <SelectItem key={s.id} value={s.id}>{s.name}{s.location ? ` — ${s.location}` : ""}</SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Priority</label>
                    <Select value={editForm.priority || "medium"} onValueChange={(v) => setEditForm({ ...editForm, priority: v as any })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Service Type</label>
                    <Select value={editForm.service_type || "home"} onValueChange={(v) => setEditForm({ ...editForm, service_type: v as any })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="home">Home</SelectItem>
                        <SelectItem value="enterprise">Enterprise</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Category</label>
                    <Select value={editForm.issue_category || ""} onValueChange={(v) => setEditForm({ ...editForm, issue_category: v })}>
                      <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Location</label>
                    <Input value={editForm.location || ""} onChange={(e) => setEditForm({ ...editForm, location: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Termination POP</label>
                    <Input
                      placeholder="Where the client takes their internet from"
                      value={(editForm as any).termination_pop || ""}
                      onChange={(e) => setEditForm({ ...editForm, termination_pop: e.target.value } as any)}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Department</label>
                    <Select value={editDepartment} onValueChange={(v) => { setEditDepartment(v); setEditForm({ ...editForm, assigned_to: "" }); }}>
                      <SelectTrigger><SelectValue placeholder="Filter by department" /></SelectTrigger>
                      <SelectContent>
                        {DEPARTMENTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Assigned To</label>
                    <Select value={editForm.assigned_to || ""} onValueChange={(v) => setEditForm({ ...editForm, assigned_to: v })}>
                      <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                      <SelectContent>
                        {filteredStaff.length === 0 ? (
                          <SelectItem value="" disabled>No users in department</SelectItem>
                        ) : (
                          filteredStaff.map((p) => <SelectItem key={p.user_id} value={p.user_id}>{p.full_name || "User"}</SelectItem>)
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Client:</span>
                    <span className="text-foreground">{clientName || "—"}</span>
                  </div>
                  {incident.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Location:</span>
                      <span className="text-foreground">{incident.location}</span>
                    </div>
                  )}
                  {(incident as any).termination_pop && (
                    <div>
                      <span className="text-muted-foreground">Termination POP: </span>
                      <span className="text-foreground">{(incident as any).termination_pop}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Created:</span>
                    <span className="text-foreground">{format(new Date(incident.created_at), "MMM d, yyyy HH:mm")}</span>
                  </div>
                  {incident.service_type && (
                    <div>
                      <span className="text-muted-foreground">Service: </span>
                      <Badge variant="outline" className="capitalize text-[10px]">{incident.service_type}</Badge>
                    </div>
                  )}
                  {incident.issue_category && (
                    <div>
                      <span className="text-muted-foreground">Category: </span>
                      <span className="text-foreground">{incident.issue_category}</span>
                    </div>
                  )}
                  {incident.assigned_to && (
                    <div>
                      <span className="text-muted-foreground">Assigned: </span>
                      <span className="text-foreground">{profiles[incident.assigned_to]?.full_name || "—"}</span>
                    </div>
                  )}
                  {incident.resolved_at && (
                    <div>
                      <span className="text-muted-foreground">Resolved: </span>
                      <span className="text-foreground">{format(new Date(incident.resolved_at), "MMM d, HH:mm")}</span>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {(() => {
            const ids = Array.from(new Set([
              ...(incident.client_id ? [incident.client_id] : []),
              ...affectedClientIds,
            ]));
            if (ids.length <= 1) return null;
            const affected = ids
              .map((cid) => clients.find((c) => c.id === cid))
              .filter((c): c is Client => !!c);
            return (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">
                    Affected Clients ({affected.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {affected.map((c) => (
                    <div key={c.id} className="flex items-start justify-between gap-2 p-2 rounded-md bg-muted/40">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-foreground truncate">{c.name}</span>
                          {incident.client_id === c.id && (
                            <Badge variant="outline" className="text-[9px]">Primary</Badge>
                          )}
                        </div>
                        {c.email && (
                          <p className="text-xs text-muted-foreground truncate">{c.email}</p>
                        )}
                        {c.phone && (
                          <p className="text-xs text-muted-foreground truncate">{c.phone}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })()}
        </div>
      </div>

      <IncidentClosureDialog
        open={closureOpen}
        onOpenChange={setClosureOpen}
        incidentId={incident.id}
        incidentNumber={incident.incident_number}
        mode={closureMode}
        onCompleted={onClosureCompleted}
      />
    </div>
  );
}
