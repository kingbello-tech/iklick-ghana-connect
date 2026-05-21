import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Save, Star } from "lucide-react";

type Row = {
  id?: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  is_primary: boolean;
  _dirty?: boolean;
  _new?: boolean;
};

interface Props {
  clientId: string;
  canEdit?: boolean;
}

const empty = (): Row => ({ name: "", email: "", phone: "", role: "", is_primary: false, _new: true, _dirty: true });

export function ClientContacts({ clientId, canEdit = true }: Props) {
  const { toast } = useToast();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("client_contacts")
      .select("*")
      .eq("client_id", clientId)
      .order("is_primary", { ascending: false })
      .order("created_at");
    if (!error && data) {
      setRows(
        data.map((d: any) => ({
          id: d.id,
          name: d.name || "",
          email: d.email || "",
          phone: d.phone || "",
          role: d.role || "",
          is_primary: !!d.is_primary,
        }))
      );
    }
    setLoading(false);
  };

  useEffect(() => {
    if (clientId) load();
  }, [clientId]);

  const update = (i: number, patch: Partial<Row>) =>
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch, _dirty: true } : r)));

  const addRow = () => setRows((rs) => [...rs, empty()]);

  const saveRow = async (i: number) => {
    const r = rows[i];
    if (!r.name && !r.email && !r.phone) {
      toast({ title: "Provide a name, email, or phone", variant: "destructive" });
      return;
    }
    const payload = {
      client_id: clientId,
      name: r.name || null,
      email: r.email || null,
      phone: r.phone || null,
      role: r.role || null,
      is_primary: r.is_primary,
    } as any;
    if (r.id) {
      const { error } = await supabase.from("client_contacts").update(payload).eq("id", r.id);
      if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from("client_contacts").insert({ ...payload, created_by: user?.id });
      if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    }
    toast({ title: "Contact saved" });
    load();
  };

  const removeRow = async (i: number) => {
    const r = rows[i];
    if (r.id) {
      const { error } = await supabase.from("client_contacts").delete().eq("id", r.id);
      if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
      toast({ title: "Contact removed" });
      load();
    } else {
      setRows((rs) => rs.filter((_, idx) => idx !== i));
    }
  };

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-foreground">Contacts</h3>
            <p className="text-xs text-muted-foreground">Multiple emails and numbers per client.</p>
          </div>
          {canEdit && (
            <Button size="sm" onClick={addRow} className="gap-1">
              <Plus className="h-4 w-4" /> Add Contact
            </Button>
          )}
        </div>
        {loading ? (
          <p className="text-xs text-muted-foreground">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="text-xs text-muted-foreground py-4 text-center">No contacts yet.</p>
        ) : (
          <div className="space-y-2">
            {rows.map((r, i) => (
              <div key={r.id || `new-${i}`} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center border border-border rounded-md p-2">
                <Input className="md:col-span-3" placeholder="Name" value={r.name} disabled={!canEdit} onChange={(e) => update(i, { name: e.target.value })} />
                <Input className="md:col-span-3" placeholder="Email" value={r.email} disabled={!canEdit} onChange={(e) => update(i, { email: e.target.value })} />
                <Input className="md:col-span-2" placeholder="Phone" value={r.phone} disabled={!canEdit} onChange={(e) => update(i, { phone: e.target.value })} />
                <Input className="md:col-span-2" placeholder="Role (Billing, Tech…)" value={r.role} disabled={!canEdit} onChange={(e) => update(i, { role: e.target.value })} />
                <div className="md:col-span-2 flex items-center justify-end gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    title={r.is_primary ? "Primary contact" : "Mark as primary"}
                    disabled={!canEdit}
                    onClick={() => update(i, { is_primary: !r.is_primary })}
                  >
                    <Star className={`h-4 w-4 ${r.is_primary ? "fill-primary text-primary" : "text-muted-foreground"}`} />
                  </Button>
                  {canEdit && r._dirty && (
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => saveRow(i)}>
                      <Save className="h-4 w-4" />
                    </Button>
                  )}
                  {canEdit && (
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => removeRow(i)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {r.is_primary && (
                  <div className="md:col-span-12 -mt-1">
                    <Badge variant="outline" className="text-[10px]">Primary</Badge>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}