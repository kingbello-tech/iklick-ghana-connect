import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ArrowLeft, Plus, Trash2 } from "lucide-react";
import EmployeeDialog from "@/components/crm/hr/EmployeeDialog";
import { Attachments } from "@/components/crm/Attachments";

export default function EmployeeDetail() {
  const { id } = useParams();
  const { toast } = useToast();
  const [emp, setEmp] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [catalog, setCatalog] = useState<any[]>([]);
  const [newItemId, setNewItemId] = useState<string>("");
  const [newAmount, setNewAmount] = useState("0");

  const load = async () => {
    if (!id) return;
    setLoading(true);
    const [{ data: e }, { data: epi }, { data: cat }] = await Promise.all([
      supabase.from("employees").select("*").eq("id", id).maybeSingle(),
      supabase.from("employee_pay_items").select("*, pay_items(*)").eq("employee_id", id),
      supabase.from("pay_items").select("*").eq("active", true).order("name"),
    ]);
    setEmp(e);
    setItems(epi || []);
    setCatalog(cat || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, [id]);

  const addItem = async () => {
    if (!newItemId || !id) return;
    const { error } = await supabase.from("employee_pay_items").insert({
      employee_id: id, pay_item_id: newItemId, amount: Number(newAmount) || 0, active: true,
    });
    if (error) { toast({ title: "Failed", description: error.message, variant: "destructive" }); return; }
    setNewItemId(""); setNewAmount("0");
    load();
  };

  const removeItem = async (rowId: string) => {
    const { error } = await supabase.from("employee_pay_items").delete().eq("id", rowId);
    if (error) { toast({ title: "Failed", description: error.message, variant: "destructive" }); return; }
    load();
  };

  const updateAmount = async (rowId: string, amount: number) => {
    await supabase.from("employee_pay_items").update({ amount }).eq("id", rowId);
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  if (!emp) return <p className="text-sm text-muted-foreground">Employee not found.</p>;

  const assignedIds = new Set(items.map((i) => i.pay_item_id));
  const available = catalog.filter((c) => !assignedIds.has(c.id));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Button asChild variant="ghost" size="sm"><Link to="/crm/hr/employees"><ArrowLeft className="h-4 w-4 mr-1" /> All Employees</Link></Button>
        <Button size="sm" onClick={() => setEditOpen(true)}>Edit</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3 flex-wrap">
            <span>{emp.full_name}</span>
            <Badge variant={emp.status === "active" ? "default" : "secondary"} className="capitalize">{emp.status.replace("_", " ")}</Badge>
            <Badge variant="outline" className="capitalize">{emp.employment_type}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <Field label="Job title" value={emp.job_title} />
            <Field label="Department" value={emp.department} />
            <Field label="Basic salary" value={`₵${Number(emp.basic_salary).toLocaleString()}`} />
            <Field label="Email" value={emp.email} />
            <Field label="Phone" value={emp.phone} />
            <Field label="Hire date" value={emp.hire_date} />
            <Field label="SSNIT #" value={emp.ssnit_number} />
            <Field label="TIN" value={emp.tin} />
            <Field label="Ghana Card" value={emp.ghana_card_number} />
            <Field label="Bank" value={[emp.bank_name, emp.bank_branch].filter(Boolean).join(" — ")} />
            <Field label="Account #" value={emp.bank_account} />
            <Field label="Momo" value={[emp.momo_network, emp.momo_number].filter(Boolean).join(" — ")} />
            <Field label="Tier 2 trustee" value={emp.tier2_trustee} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Recurring Pay Items</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recurring items. Add allowances or deductions that should appear on every payslip.</p>
          ) : (
            <div className="space-y-2">
              {items.map((i) => (
                <div key={i.id} className="flex items-center gap-3 p-3 rounded border border-border">
                  <div className="flex-1">
                    <p className="font-medium">{i.pay_items?.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {i.pay_items?.item_type.replace("_", " ")} · {i.pay_items?.calc_method === "percent_of_basic" ? "% of basic" : "fixed"}
                      {i.pay_items?.taxable ? " · taxable" : " · non-taxable"}
                      {i.pay_items?.pension_qualifying && " · pension-qualifying"}
                    </p>
                  </div>
                  <div className="w-32">
                    <Input type="number" step="0.01" defaultValue={i.amount}
                      onBlur={(e) => updateAmount(i.id, Number(e.target.value))} />
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => removeItem(i.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2 items-end pt-2 border-t border-border">
            <div className="flex-1">
              <Label>Add pay item</Label>
              <Select value={newItemId} onValueChange={setNewItemId}>
                <SelectTrigger><SelectValue placeholder="Choose an item…" /></SelectTrigger>
                <SelectContent>
                  {available.length === 0 ? (
                    <SelectItem value="__none" disabled>No more items in catalog</SelectItem>
                  ) : available.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name} ({c.calc_method === "percent_of_basic" ? "%" : "₵"})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-32">
              <Label>Amount</Label>
              <Input type="number" step="0.01" value={newAmount} onChange={(e) => setNewAmount(e.target.value)} />
            </div>
            <Button onClick={addItem} disabled={!newItemId}><Plus className="h-4 w-4 mr-1" /> Add</Button>
          </div>
        </CardContent>
      </Card>

      <EmployeeDialog open={editOpen} onOpenChange={setEditOpen} employee={emp} onSaved={load} />

      <Attachments entityType="employee" entityId={emp.id} title="Employee Documents" />
    </div>
  );
}

function Field({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <p className="text-xs uppercase text-muted-foreground tracking-wider">{label}</p>
      <p className="font-medium break-words">{value || "—"}</p>
    </div>
  );
}