import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
      const { error } = await supabase.from("incidents").insert({
        title: form.title,
        description: form.description || null,
        client_id: form.client_id || null,
        priority: form.priority,
        service_type: form.service_type,
        issue_category: form.issue_category || null,
        location: form.location || null,
        assigned_to: form.assigned_to || null,
        created_by: user.id,
        incident_number: "TEMP",
      });
      if (error) throw error;
      toast({ title: "Incident created" });
      onOpenChange(false);
      setForm({ title: "", description: "", client_id: "", priority: "medium", service_type: "home", issue_category: "", location: "", department: "", assigned_to: "" });
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
            <Select value={form.client_id} onValueChange={handleClientChange}>
              <SelectTrigger><SelectValue placeholder="Select Client" /></SelectTrigger>
              <SelectContent>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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
