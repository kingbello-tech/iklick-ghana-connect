import { useState, useMemo, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronsUpDown, X, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type Client = Database["public"]["Tables"]["clients"]["Row"];
type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type Site = Database["public"]["Tables"]["client_sites"]["Row"];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients: Client[];
  profiles?: Profile[];
  onCreated: () => void;
}

const CATEGORIES = ["Connectivity", "Speed", "Hardware", "Billing", "Installation", "Maintenance", "Other"];
const DEPARTMENTS = ["Client Experience", "Technology", "Project Management", "Sales"];

function ClientCombobox({ clients, value, onChange }: { clients: Client[]; value: string; onChange: (id: string) => void }) {
  const [comboOpen, setComboOpen] = useState(false);
  const selected = clients.find((c) => c.id === value);

  return (
    <Popover open={comboOpen} onOpenChange={setComboOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={comboOpen} className="w-full justify-between font-normal h-10">
          <span className="truncate">{selected ? selected.name : "Select Client"}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput placeholder="Search clients..." />
          <CommandList>
            <CommandEmpty>No client found.</CommandEmpty>
            <CommandGroup>
              {clients.map((c) => (
                <CommandItem key={c.id} value={c.name} onSelect={() => { onChange(c.id); setComboOpen(false); }}>
                  <Check className={cn("mr-2 h-4 w-4", value === c.id ? "opacity-100" : "opacity-0")} />
                  {c.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function AdditionalClientsPicker({ clients, selectedIds, primaryId, onChange }: { clients: Client[]; selectedIds: string[]; primaryId: string; onChange: (ids: string[]) => void }) {
  const [open, setOpen] = useState(false);
  const available = clients.filter((c) => c.id !== primaryId);
  const selectedClients = clients.filter((c) => selectedIds.includes(c.id));

  const toggle = (id: string) => {
    if (selectedIds.includes(id)) onChange(selectedIds.filter((x) => x !== id));
    else onChange([...selectedIds, id]);
  };

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" className="w-full justify-between font-normal h-10">
            <span className="flex items-center gap-2"><Plus className="h-4 w-4" /> Add Affected Clients</span>
            <ChevronsUpDown className="h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[320px] p-0">
          <Command>
            <CommandInput placeholder="Search clients..." />
            <CommandList>
              <CommandEmpty>No client found.</CommandEmpty>
              <CommandGroup>
                {available.map((c) => (
                  <CommandItem key={c.id} value={c.name} onSelect={() => toggle(c.id)}>
                    <Check className={cn("mr-2 h-4 w-4", selectedIds.includes(c.id) ? "opacity-100" : "opacity-0")} />
                    {c.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {selectedClients.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedClients.map((c) => (
            <Badge key={c.id} variant="secondary" className="gap-1">
              {c.name}
              <button type="button" onClick={() => toggle(c.id)} className="ml-1 hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
export function IncidentCreateDialog({ open, onOpenChange, clients, profiles = [], onCreated }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [additionalClientIds, setAdditionalClientIds] = useState<string[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    client_id: "",
    site_id: "",
    priority: "medium" as Database["public"]["Enums"]["incident_priority"],
    service_type: "home" as Database["public"]["Enums"]["service_type"],
    issue_category: "",
    location: "",
    termination_pop: "",
    department: "",
    assigned_to: "",
  });

  const handleClientChange = (clientId: string) => {
    const client = clients.find((c) => c.id === clientId);
    setForm({
      ...form,
      client_id: clientId,
      site_id: "",
      service_type: client ? client.service_type : form.service_type,
      department: "",
      assigned_to: "",
    });
    setAdditionalClientIds((ids) => ids.filter((id) => id !== clientId));
  };

  useEffect(() => {
    if (!form.client_id) { setSites([]); return; }
    (async () => {
      const { data } = await supabase
        .from("client_sites")
        .select("*")
        .eq("client_id", form.client_id)
        .order("name");
      setSites((data as Site[]) || []);
    })();
  }, [form.client_id]);

  const filteredProfiles = form.department
    ? profiles.filter((p) => p.department === form.department)
    : profiles;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      const { data: inserted, error } = await supabase.from("incidents").insert({
        title: form.title,
        description: form.description || null,
        client_id: form.client_id || null,
        site_id: form.site_id || null,
        priority: form.priority,
        service_type: form.service_type,
        issue_category: form.issue_category || null,
        location: form.location || null,
        termination_pop: form.termination_pop || null,
        assigned_to: form.assigned_to || null,
        created_by: user.id,
        incident_number: "TEMP",
      }).select().single();
      if (error) throw error;

      // Send email notifications
      const primaryClient = clients.find((c) => c.id === form.client_id);
      const extraClients = clients.filter((c) => additionalClientIds.includes(c.id));
      const allClients = [primaryClient, ...extraClients].filter((c): c is Client => !!c);
      const assignedProfile = profiles.find((p) => p.user_id === form.assigned_to);

      // Persist multi-client links (primary + additional) so they show on the detail page
      const linkRows = allClients.map((c) => ({ incident_id: inserted.id, client_id: c.id }));
      if (linkRows.length) {
        await (supabase as any).from("incident_clients").insert(linkRows);
      }

      // Fetch assigned user's email from profiles
      let assignedEmail: string | null = null;
      if (form.assigned_to) {
        const { data: profData } = await supabase.from("profiles").select("email").eq("user_id", form.assigned_to).single();
        assignedEmail = profData?.email || null;
      }

      // If high/critical priority, broadcast to Technology team
      let techEmails: string[] = [];
      if (form.priority === "critical" || form.priority === "high") {
        const { data: roleRows } = await supabase
          .from("user_roles")
          .select("user_id")
          .in("role", ["technology_manager", "technology_engineer"]);
        const ids = (roleRows || []).map((r) => r.user_id);
        if (ids.length) {
          const { data: profs } = await supabase.from("profiles").select("email").in("user_id", ids);
          techEmails = (profs || []).map((p) => p.email).filter((e): e is string => !!e);
        }
      }

      // Send one email per affected client; only the first call carries assigned/tech notifications to avoid duplicates
      allClients.forEach((c, idx) => {
        if (!c.email) return;
        supabase.functions.invoke("send-incident-email", {
          body: {
            incident_number: inserted.incident_number,
            title: form.title,
            description: form.description,
            priority: form.priority,
            client_email: c.email,
            client_name: c.name,
            assigned_email: idx === 0 ? assignedEmail : null,
            assigned_name: idx === 0 ? (assignedProfile?.full_name || null) : null,
            ticket_url: idx === 0 && assignedEmail ? `${window.location.origin}/crm/incidents/${inserted.id}` : undefined,
            tech_team_emails: idx === 0 ? techEmails : [],
            flag_reason: idx === 0 && techEmails.length ? `New ${form.priority} priority incident` : undefined,
          },
        }).catch((err) => console.error("Email notification failed:", err));
      });
      // If no clients at all but we still need to notify staff/tech team
      if (allClients.length === 0 && (assignedEmail || techEmails.length)) {
        supabase.functions.invoke("send-incident-email", {
          body: {
            incident_number: inserted.incident_number,
            title: form.title,
            description: form.description,
            priority: form.priority,
            client_email: null,
            client_name: null,
            assigned_email: assignedEmail,
            assigned_name: assignedProfile?.full_name || null,
            ticket_url: assignedEmail ? `${window.location.origin}/crm/incidents/${inserted.id}` : undefined,
            tech_team_emails: techEmails,
            flag_reason: techEmails.length ? `New ${form.priority} priority incident` : undefined,
          },
        }).catch((err) => console.error("Email notification failed:", err));
      }

      toast({ title: "Incident created", description: allClients.length > 1 ? `Notifications sent to ${allClients.length} clients.` : undefined });
      onOpenChange(false);
      setForm({ title: "", description: "", client_id: "", site_id: "", priority: "medium", service_type: "home", issue_category: "", location: "", termination_pop: "", department: "", assigned_to: "" });
      setAdditionalClientIds([]);
      onCreated();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Incident</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input placeholder="Title *" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
          <div className="grid grid-cols-2 gap-3">
            <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v as any })}>
              <SelectTrigger><SelectValue placeholder="Priority" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
            <Select value={form.service_type} onValueChange={(v) => setForm({ ...form, service_type: v as any })}>
              <SelectTrigger><SelectValue placeholder="Service Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="home">Home</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <ClientCombobox
              clients={clients}
              value={form.client_id}
              onChange={handleClientChange}
            />
            <Select value={form.issue_category} onValueChange={(v) => setForm({ ...form, issue_category: v })}>
              <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {form.client_id && (
            <AdditionalClientsPicker
              clients={clients}
              selectedIds={additionalClientIds}
              primaryId={form.client_id}
              onChange={setAdditionalClientIds}
            />
          )}
          {form.client_id && (
            <Select value={form.site_id} onValueChange={(v) => setForm({ ...form, site_id: v })}>
              <SelectTrigger>
                <SelectValue placeholder={sites.length ? "Select Site (optional)" : "No sites for this client"} />
              </SelectTrigger>
              <SelectContent>
                {sites.length === 0 ? (
                  <SelectItem value="none" disabled>No sites — add one in the client profile</SelectItem>
                ) : (
                  sites.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}{s.location ? ` — ${s.location}` : ""}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          )}
          <Input placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          <Input placeholder="Termination POP (where the client takes their internet from)" value={form.termination_pop} onChange={(e) => setForm({ ...form, termination_pop: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Select value={form.department} onValueChange={(v) => setForm({ ...form, department: v, assigned_to: "" })}>
              <SelectTrigger><SelectValue placeholder="Department" /></SelectTrigger>
              <SelectContent>
                {DEPARTMENTS.map((d) => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={form.assigned_to} onValueChange={(v) => setForm({ ...form, assigned_to: v })}>
              <SelectTrigger><SelectValue placeholder="Assign To" /></SelectTrigger>
              <SelectContent>
                {filteredProfiles.length === 0 ? (
                  <SelectItem value="" disabled>No users in department</SelectItem>
                ) : (
                  filteredProfiles.map((p) => (
                    <SelectItem key={p.user_id} value={p.user_id}>{p.full_name || "User"}</SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? "Creating..." : "Create"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
