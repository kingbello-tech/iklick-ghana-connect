import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2, Plus } from "lucide-react";

const EMPTY = {
  name: "",
  item_type: "allowance",
  taxable: true,
  pension_qualifying: false,
  calc_method: "fixed",
  default_value: "0",
  description: "",
  active: true,
};

export default function PayItems() {
  const { toast } = useToast();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("pay_items").select("*").order("item_type").order("name");
    setRows(data || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const startNew = () => { setEditing(null); setForm(EMPTY); setOpen(true); };
  const startEdit = (r: any) => { setEditing(r); setForm({ ...r, default_value: String(r.default_value) }); setOpen(true); };

  const save = async () => {
    if (!form.name) { toast({ title: "Name required", variant: "destructive" }); return; }
    setSaving(true);
    const payload = {
      name: form.name,
      item_type: form.item_type,
      taxable: !!form.taxable,
      pension_qualifying: !!form.pension_qualifying,
      calc_method: form.calc_method,
      default_value: Number(form.default_value) || 0,
      description: form.description || null,
      active: !!form.active,
    };
    let error;
    if (editing?.id) ({ error } = await supabase.from("pay_items").update(payload).eq("id", editing.id));
    else ({ error } = await supabase.from("pay_items").insert(payload));
    setSaving(false);
    if (error) { toast({ title: "Save failed", description: error.message, variant: "destructive" }); return; }
    toast({ title: editing ? "Updated" : "Created" });
    setOpen(false); load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Pay Items</h1>
          <p className="text-sm text-muted-foreground">Allowances, deductions, and employer-cost lines you can apply on payslips.</p>
        </div>
        <Button size="sm" onClick={startNew}><Plus className="h-4 w-4 mr-1" /> New Pay Item</Button>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">{rows.length} items</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-muted-foreground border-b border-border">
                  <tr><th className="py-2">Name</th><th className="py-2">Type</th><th className="py-2">Calc</th><th className="py-2">Default</th><th className="py-2">Flags</th><th className="py-2"></th></tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-b border-border/60">
                      <td className="py-3 font-medium">{r.name}</td>
                      <td className="py-3 capitalize">{r.item_type.replace("_", " ")}</td>
                      <td className="py-3 text-xs">{r.calc_method === "percent_of_basic" ? "% of basic" : "fixed"}</td>
                      <td className="py-3">{r.calc_method === "percent_of_basic" ? `${r.default_value}%` : `₵${Number(r.default_value).toLocaleString()}`}</td>
                      <td className="py-3 space-x-1">
                        {r.taxable && <Badge variant="outline" className="text-xs">Taxable</Badge>}
                        {r.pension_qualifying && <Badge variant="outline" className="text-xs">Pensionable</Badge>}
                        {!r.active && <Badge variant="secondary" className="text-xs">Inactive</Badge>}
                      </td>
                      <td className="py-3 text-right"><Button size="sm" variant="ghost" onClick={() => startEdit(r)}>Edit</Button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Pay Item" : "New Pay Item"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Type</Label>
                <Select value={form.item_type} onValueChange={(v) => setForm({ ...form, item_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="allowance">Allowance</SelectItem>
                    <SelectItem value="deduction">Deduction</SelectItem>
                    <SelectItem value="employer_cost">Employer cost</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Calculation</Label>
                <Select value={form.calc_method} onValueChange={(v) => setForm({ ...form, calc_method: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Fixed amount (₵)</SelectItem>
                    <SelectItem value="percent_of_basic">% of basic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Default value</Label><Input type="number" step="0.01" value={form.default_value} onChange={(e) => setForm({ ...form, default_value: e.target.value })} /></div>
            <div className="flex items-center justify-between p-3 rounded border border-border"><div><Label>Taxable</Label><p className="text-xs text-muted-foreground">Counts toward PAYE taxable income</p></div><Switch checked={form.taxable} onCheckedChange={(v) => setForm({ ...form, taxable: v })} /></div>
            <div className="flex items-center justify-between p-3 rounded border border-border"><div><Label>Pension-qualifying</Label><p className="text-xs text-muted-foreground">Counts toward SSNIT/Tier 2 pensionable salary</p></div><Switch checked={form.pension_qualifying} onCheckedChange={(v) => setForm({ ...form, pension_qualifying: v })} /></div>
            <div className="flex items-center justify-between p-3 rounded border border-border"><div><Label>Active</Label><p className="text-xs text-muted-foreground">Available for assignment</p></div><Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} /></div>
            <div><Label>Description</Label><Input value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}