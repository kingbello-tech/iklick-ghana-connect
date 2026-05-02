import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  employee: any | null;
  onSaved: () => void;
};

const EMPTY = {
  full_name: "",
  email: "",
  phone: "",
  ssnit_number: "",
  tin: "",
  ghana_card_number: "",
  bank_name: "",
  bank_branch: "",
  bank_account: "",
  momo_number: "",
  momo_network: "",
  hire_date: "",
  termination_date: "",
  employment_type: "permanent",
  status: "active",
  job_title: "",
  department: "",
  basic_salary: "0",
  tier2_trustee: "",
  notes: "",
  user_id: "",
};

export default function EmployeeDialog({ open, onOpenChange, employee, onSaved }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [form, setForm] = useState<any>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [staff, setStaff] = useState<any[]>([]);

  useEffect(() => {
    if (open) {
      supabase.from("profiles").select("user_id, full_name, email").then(({ data }) => setStaff(data || []));
    }
  }, [open]);

  useEffect(() => {
    if (employee) {
      setForm({
        ...EMPTY,
        ...employee,
        basic_salary: String(employee.basic_salary ?? 0),
        hire_date: employee.hire_date || "",
        termination_date: employee.termination_date || "",
        user_id: employee.user_id || "",
      });
    } else {
      setForm(EMPTY);
    }
  }, [employee, open]);

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.full_name) {
      toast({ title: "Full name required", variant: "destructive" });
      return;
    }
    setSaving(true);
    const payload: any = {
      full_name: form.full_name,
      email: form.email || null,
      phone: form.phone || null,
      ssnit_number: form.ssnit_number || null,
      tin: form.tin || null,
      ghana_card_number: form.ghana_card_number || null,
      bank_name: form.bank_name || null,
      bank_branch: form.bank_branch || null,
      bank_account: form.bank_account || null,
      momo_number: form.momo_number || null,
      momo_network: form.momo_network || null,
      hire_date: form.hire_date || null,
      termination_date: form.termination_date || null,
      employment_type: form.employment_type,
      status: form.status,
      job_title: form.job_title || null,
      department: form.department || null,
      basic_salary: Number(form.basic_salary) || 0,
      tier2_trustee: form.tier2_trustee || null,
      notes: form.notes || null,
      user_id: form.user_id || null,
    };
    let error;
    if (employee?.id) {
      ({ error } = await supabase.from("employees").update(payload).eq("id", employee.id));
    } else {
      payload.created_by = user?.id;
      ({ error } = await supabase.from("employees").insert(payload));
    }
    setSaving(false);
    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: employee ? "Employee updated" : "Employee created" });
    onOpenChange(false);
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader><DialogTitle>{employee ? "Edit Employee" : "New Employee"}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2"><Label>Full name *</Label><Input value={form.full_name} onChange={(e) => set("full_name", e.target.value)} /></div>
          <div><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} /></div>
          <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => set("phone", e.target.value)} /></div>
          <div className="col-span-2"><Label>Linked staff account (optional)</Label>
            <Select value={form.user_id || "__none"} onValueChange={(v) => set("user_id", v === "__none" ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="Not linked" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none">— Not linked —</SelectItem>
                {staff.map((s) => (<SelectItem key={s.user_id} value={s.user_id}>{s.full_name || s.email}</SelectItem>))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">Required for the employee to see their own payslips.</p>
          </div>
          <div><Label>Department</Label><Input value={form.department} onChange={(e) => set("department", e.target.value)} /></div>
          <div><Label>Job title</Label><Input value={form.job_title} onChange={(e) => set("job_title", e.target.value)} /></div>
          <div><Label>Employment type</Label>
            <Select value={form.employment_type} onValueChange={(v) => set("employment_type", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="permanent">Permanent</SelectItem>
                <SelectItem value="contract">Contract</SelectItem>
                <SelectItem value="probation">Probation</SelectItem>
                <SelectItem value="intern">Intern</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => set("status", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="on_leave">On leave</SelectItem>
                <SelectItem value="terminated">Terminated</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>Hire date</Label><Input type="date" value={form.hire_date} onChange={(e) => set("hire_date", e.target.value)} /></div>
          <div><Label>Termination date</Label><Input type="date" value={form.termination_date} onChange={(e) => set("termination_date", e.target.value)} /></div>
          <div className="col-span-2"><Label>Basic salary (₵, monthly)</Label><Input type="number" min="0" step="0.01" value={form.basic_salary} onChange={(e) => set("basic_salary", e.target.value)} /></div>

          <div className="col-span-2 pt-2 text-xs uppercase text-muted-foreground tracking-wider">Statutory IDs</div>
          <div><Label>SSNIT number</Label><Input value={form.ssnit_number} onChange={(e) => set("ssnit_number", e.target.value)} /></div>
          <div><Label>TIN</Label><Input value={form.tin} onChange={(e) => set("tin", e.target.value)} /></div>
          <div><Label>Ghana Card #</Label><Input value={form.ghana_card_number} onChange={(e) => set("ghana_card_number", e.target.value)} /></div>
          <div><Label>Tier 2 trustee</Label><Input value={form.tier2_trustee} onChange={(e) => set("tier2_trustee", e.target.value)} /></div>

          <div className="col-span-2 pt-2 text-xs uppercase text-muted-foreground tracking-wider">Payment</div>
          <div><Label>Bank name</Label><Input value={form.bank_name} onChange={(e) => set("bank_name", e.target.value)} /></div>
          <div><Label>Bank branch</Label><Input value={form.bank_branch} onChange={(e) => set("bank_branch", e.target.value)} /></div>
          <div className="col-span-2"><Label>Bank account #</Label><Input value={form.bank_account} onChange={(e) => set("bank_account", e.target.value)} /></div>
          <div><Label>Momo number</Label><Input value={form.momo_number} onChange={(e) => set("momo_number", e.target.value)} /></div>
          <div><Label>Momo network</Label><Input value={form.momo_network} onChange={(e) => set("momo_network", e.target.value)} placeholder="MTN, Telecel, AirtelTigo" /></div>

          <div className="col-span-2"><Label>Notes</Label><Textarea rows={2} value={form.notes} onChange={(e) => set("notes", e.target.value)} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}