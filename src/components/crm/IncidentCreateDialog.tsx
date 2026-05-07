import { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type Client = Database["public"]["Tables"]["clients"]["Row"];
type Profile = Database["public"]["Tables"]["profiles"]["Row"];

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
export function IncidentCreateDialog({ open, onOpenChange, clients, profiles = [], onCreated }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    client_id: "",
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
      service_type: client ? client.service_type : form.service_type,
      department: "",
      assigned_to: "",
    });
  };

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
      const client = clients.find((c) => c.id === form.client_id);
      const assignedProfile = profiles.find((p) => p.user_id === form.assigned_to);

      // Fetch assigned user's email from profiles
      let assignedEmail: string | null = null;
      if (form.assigned_to) {
        const { data: profData } = await supabase.from("profiles").select("email").eq("user_id", form.assigned_to).single();
        assignedEmail = profData?.email || null;
      }

      supabase.functions.invoke("send-incident-email", {
        body: {
          incident_number: inserted.incident_number,
          title: form.title,
          description: form.description,
          priority: form.priority,
          client_email: client?.email || null,
          client_name: client?.name || null,
          assigned_email: assignedEmail,
          assigned_name: assignedProfile?.full_name || null,
          ticket_url: assignedEmail ? `${window.location.origin}/crm/incidents/${inserted.id}` : undefined,
        },
      }).catch((err) => console.error("Email notification failed:", err));

      toast({ title: "Incident created" });
      onOpenChange(false);
      setForm({ title: "", description: "", client_id: "", priority: "medium", service_type: "home", issue_category: "", location: "", termination_pop: "", department: "", assigned_to: "" });
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
