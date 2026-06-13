import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, FolderKanban } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { useDepartmentProfiles } from "@/lib/assignment";

type Project = {
  id: string;
  code: string;
  name: string;
  status: string;
  health: string;
  start_date: string | null;
  target_end_date: string | null;
  client_id: string | null;
};

const HEALTH: Record<string, string> = {
  green: "bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/40",
  amber: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/40",
  red: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/40",
};

export default function ProjectList() {
  const { user, role, isAdmin } = useAuth();
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [clientId, setClientId] = useState<string>("");
  const [department, setDepartment] = useState<string>("service_delivery");
  const [ownerId, setOwnerId] = useState<string>("");
  const { profiles: techProfiles } = useDepartmentProfiles("technology", { includeAdmins: false });

  const canCreate = isAdmin || role === "service_delivery" || role === "technology_manager" || role === "network_manager" || role === "technology_engineer" || role === "network_engineer";

  const load = async () => {
    const [p, c] = await Promise.all([
      (supabase as any).from("projects").select("*").order("created_at", { ascending: false }),
      supabase.from("clients").select("id,name").order("name"),
    ]);
    setProjects(p.data || []);
    setClients(c.data || []);
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!name.trim() || !user || !ownerId) return;
    const { error } = await (supabase as any).from("projects").insert({
      name, client_id: clientId || null, department, created_by: user.id, owner_id: ownerId, start_date: new Date().toISOString().slice(0, 10),
    });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    setOpen(false); setName(""); setClientId(""); setDepartment("service_delivery"); setOwnerId("");
    load();
  };

  const filtered = projects.filter((p) =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><FolderKanban className="h-6 w-6" /> Projects</h1>
          <p className="text-sm text-muted-foreground">Track delivery projects across teams.</p>
        </div>
        {canCreate && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" /> New Project</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create Project</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground">Name</label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Lakeside Office Fiber Rollout" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Client (optional)</label>
                  <Select value={clientId} onValueChange={setClientId}>
                    <SelectTrigger><SelectValue placeholder="No client" /></SelectTrigger>
                    <SelectContent>
                      {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Department</label>
                  <Select value={department} onValueChange={setDepartment}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="service_delivery">Project Management</SelectItem>
                      <SelectItem value="technology">Technology</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-muted-foreground mt-1">Only Project Management and Technology can see projects.</p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Assign to (Technology)</label>
                  <Select value={ownerId} onValueChange={setOwnerId}>
                    <SelectTrigger><SelectValue placeholder="Select a technology user" /></SelectTrigger>
                    <SelectContent>
                      {techProfiles.map((p) => (
                        <SelectItem key={p.user_id} value={p.user_id}>
                          {p.full_name || "User"} {p.role ? `· ${p.role.replace(/_/g, " ")}` : ""}
                        </SelectItem>
                      ))}
                      {techProfiles.length === 0 && (
                        <div className="px-2 py-1.5 text-xs text-muted-foreground">No technology users available</div>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={create} disabled={!name.trim() || !ownerId}>Create</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Input placeholder="Search projects…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-md" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((p) => (
          <Link key={p.id} to={`/crm/projects/${p.id}`}>
            <Card className="hover:border-primary/40 transition">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-muted-foreground">{p.code}</span>
                  <Badge className={`text-[10px] ${HEALTH[p.health] || ""}`}>{p.health}</Badge>
                </div>
                <h3 className="font-semibold text-foreground">{p.name}</h3>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline" className="capitalize text-[10px]">{p.status.replace("_", " ")}</Badge>
                  {p.target_end_date && <span>Due {format(new Date(p.target_end_date), "MMM d, yyyy")}</span>}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground col-span-full text-center py-8">No projects yet.</p>
        )}
      </div>
    </div>
  );
}