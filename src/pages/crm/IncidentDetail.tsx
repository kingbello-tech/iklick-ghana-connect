import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Clock, User, MapPin, Send } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type Incident = Database["public"]["Tables"]["incidents"]["Row"];
type IncidentNote = Database["public"]["Tables"]["incident_notes"]["Row"];
type IncidentHistory = Database["public"]["Tables"]["incident_history"]["Row"];
type Profile = Database["public"]["Tables"]["profiles"]["Row"];

const PRIORITY_COLORS: Record<string, string> = {
  critical: "hsl(0, 84%, 60%)", high: "hsl(25, 95%, 53%)", medium: "hsl(45, 93%, 47%)", low: "hsl(142, 71%, 45%)",
};
const STATUS_COLORS: Record<string, string> = {
  open: "hsl(195, 100%, 42%)", in_progress: "hsl(45, 93%, 47%)", escalated: "hsl(0, 84%, 60%)", resolved: "hsl(142, 71%, 45%)", closed: "hsl(215, 20%, 45%)",
};

export default function IncidentDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, canManageIncidents } = useAuth();
  const { toast } = useToast();
  const [incident, setIncident] = useState<Incident | null>(null);
  const [notes, setNotes] = useState<IncidentNote[]>([]);
  const [history, setHistory] = useState<IncidentHistory[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [clientName, setClientName] = useState<string>("");
  const [newNote, setNewNote] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    if (!id) return;
    const [incRes, notesRes, histRes, profRes] = await Promise.all([
      supabase.from("incidents").select("*").eq("id", id).single(),
      supabase.from("incident_notes").select("*").eq("incident_id", id).order("created_at", { ascending: true }),
      supabase.from("incident_history").select("*").eq("incident_id", id).order("created_at", { ascending: false }),
      supabase.from("profiles").select("*"),
    ]);
    if (incRes.data) {
      setIncident(incRes.data);
      if (incRes.data.client_id) {
        const { data: c } = await supabase.from("clients").select("name").eq("id", incRes.data.client_id).single();
        if (c) setClientName(c.name);
      }
    }
    if (notesRes.data) setNotes(notesRes.data);
    if (histRes.data) setHistory(histRes.data);
    if (profRes.data) setProfiles(Object.fromEntries(profRes.data.map((p) => [p.user_id, p])));
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, [id]);

  const updateStatus = async (newStatus: string) => {
    if (!incident || !user) return;
    const updates: any = { status: newStatus };
    if (newStatus === "resolved") updates.resolved_at = new Date().toISOString();
    if (newStatus === "closed") updates.closed_at = new Date().toISOString();

    const { error } = await supabase.from("incidents").update(updates).eq("id", incident.id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }

    await supabase.from("incident_history").insert({
      incident_id: incident.id, user_id: user.id, field_changed: "status", old_value: incident.status, new_value: newStatus,
    });
    fetchAll();
  };

  const addNote = async () => {
    if (!newNote.trim() || !incident || !user) return;
    const { error } = await supabase.from("incident_notes").insert({
      incident_id: incident.id, user_id: user.id, content: newNote, note_type: "note",
    });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    setNewNote("");
    fetchAll();
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  if (!incident) return <p className="text-center text-[hsl(215,20%,45%)]">Incident not found</p>;

  return (
    <div className="space-y-6 max-w-4xl">
      <Link to="/crm/incidents" className="inline-flex items-center gap-2 text-sm text-[hsl(215,20%,65%)] hover:text-primary transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Incidents
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="font-mono text-[hsl(215,20%,45%)] text-sm">{incident.incident_number}</span>
            <Badge style={{ backgroundColor: `${PRIORITY_COLORS[incident.priority]}20`, color: PRIORITY_COLORS[incident.priority], borderColor: `${PRIORITY_COLORS[incident.priority]}40` }}>
              {incident.priority}
            </Badge>
            <Badge variant="outline" style={{ color: STATUS_COLORS[incident.status], borderColor: `${STATUS_COLORS[incident.status]}40` }}>
              {incident.status.replace("_", " ")}
            </Badge>
          </div>
          <h1 className="text-xl font-bold text-[hsl(210,40%,98%)]">{incident.title}</h1>
        </div>
        {canManageIncidents && (
          <Select value={incident.status} onValueChange={updateStatus}>
            <SelectTrigger className="w-[150px] bg-[hsl(220,20%,10%)] border-[hsl(220,20%,18%)] text-[hsl(210,40%,98%)]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[hsl(220,30%,10%)] border-[hsl(220,20%,18%)]">
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="escalated">Escalated</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-4">
          {incident.description && (
            <Card className="bg-[hsl(220,30%,8%)] border-[hsl(220,20%,15%)]">
              <CardHeader className="pb-2"><CardTitle className="text-sm text-[hsl(215,20%,65%)]">Description</CardTitle></CardHeader>
              <CardContent><p className="text-sm text-[hsl(210,40%,98%)] whitespace-pre-wrap">{incident.description}</p></CardContent>
            </Card>
          )}

          {/* Notes */}
          <Card className="bg-[hsl(220,30%,8%)] border-[hsl(220,20%,15%)]">
            <CardHeader className="pb-2"><CardTitle className="text-sm text-[hsl(215,20%,65%)]">Notes & Activity</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {notes.map((note) => (
                <div key={note.id} className="p-3 rounded-lg bg-[hsl(220,20%,10%)]">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-primary">{profiles[note.user_id]?.full_name || "User"}</span>
                    <span className="text-[10px] text-[hsl(215,20%,45%)]">{format(new Date(note.created_at), "MMM d, HH:mm")}</span>
                  </div>
                  <p className="text-sm text-[hsl(210,40%,98%)]">{note.content}</p>
                </div>
              ))}
              {canManageIncidents && (
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Add a note..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    className="bg-[hsl(220,20%,10%)] border-[hsl(220,20%,18%)] text-[hsl(210,40%,98%)] placeholder:text-[hsl(215,20%,45%)] flex-1"
                    rows={2}
                  />
                  <Button onClick={addNote} size="icon" disabled={!newNote.trim()} className="self-end shrink-0">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* History */}
          {history.length > 0 && (
            <Card className="bg-[hsl(220,30%,8%)] border-[hsl(220,20%,15%)]">
              <CardHeader className="pb-2"><CardTitle className="text-sm text-[hsl(215,20%,65%)]">Change History</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {history.map((h) => (
                    <div key={h.id} className="flex items-center gap-2 text-xs text-[hsl(215,20%,65%)]">
                      <Clock className="h-3 w-3 shrink-0" />
                      <span className="text-primary">{profiles[h.user_id || ""]?.full_name || "System"}</span>
                      <span>changed <span className="font-medium">{h.field_changed}</span></span>
                      {h.old_value && <span>from <Badge variant="outline" className="text-[9px]">{h.old_value.replace("_", " ")}</Badge></span>}
                      <span>to <Badge variant="outline" className="text-[9px]">{h.new_value?.replace("_", " ")}</Badge></span>
                      <span className="ml-auto text-[hsl(215,20%,45%)]">{format(new Date(h.created_at), "MMM d, HH:mm")}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar Details */}
        <div className="space-y-4">
          <Card className="bg-[hsl(220,30%,8%)] border-[hsl(220,20%,15%)]">
            <CardHeader className="pb-2"><CardTitle className="text-sm text-[hsl(215,20%,65%)]">Details</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-[hsl(215,20%,45%)]" />
                <span className="text-[hsl(215,20%,65%)]">Client:</span>
                <span className="text-[hsl(210,40%,98%)]">{clientName || "—"}</span>
              </div>
              {incident.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-[hsl(215,20%,45%)]" />
                  <span className="text-[hsl(215,20%,65%)]">Location:</span>
                  <span className="text-[hsl(210,40%,98%)]">{incident.location}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-[hsl(215,20%,45%)]" />
                <span className="text-[hsl(215,20%,65%)]">Created:</span>
                <span className="text-[hsl(210,40%,98%)]">{format(new Date(incident.created_at), "MMM d, yyyy HH:mm")}</span>
              </div>
              {incident.service_type && (
                <div>
                  <span className="text-[hsl(215,20%,65%)]">Service: </span>
                  <Badge variant="outline" className="capitalize text-[10px]">{incident.service_type}</Badge>
                </div>
              )}
              {incident.issue_category && (
                <div>
                  <span className="text-[hsl(215,20%,65%)]">Category: </span>
                  <span className="text-[hsl(210,40%,98%)]">{incident.issue_category}</span>
                </div>
              )}
              {incident.assigned_to && (
                <div>
                  <span className="text-[hsl(215,20%,65%)]">Assigned: </span>
                  <span className="text-[hsl(210,40%,98%)]">{profiles[incident.assigned_to]?.full_name || "—"}</span>
                </div>
              )}
              {incident.resolved_at && (
                <div>
                  <span className="text-[hsl(215,20%,65%)]">Resolved: </span>
                  <span className="text-[hsl(210,40%,98%)]">{format(new Date(incident.resolved_at), "MMM d, HH:mm")}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
