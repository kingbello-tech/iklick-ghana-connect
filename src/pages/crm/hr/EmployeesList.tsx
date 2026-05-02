import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, Search } from "lucide-react";
import EmployeeDialog from "@/components/crm/hr/EmployeeDialog";

export default function EmployeesList() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("employees").select("*").order("created_at", { ascending: false });
    setRows(data || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const filtered = rows.filter((r) => {
    const s = q.toLowerCase();
    return !s || r.full_name?.toLowerCase().includes(s) || r.email?.toLowerCase().includes(s) || r.department?.toLowerCase().includes(s) || r.job_title?.toLowerCase().includes(s);
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Employees</h1>
          <p className="text-sm text-muted-foreground">Payroll profiles for staff members.</p>
        </div>
        <Button onClick={() => { setEditing(null); setOpen(true); }} size="sm"><Plus className="h-4 w-4 mr-1" /> New Employee</Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search name, email, department…" className="pl-9" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">{filtered.length} employee{filtered.length !== 1 && "s"}</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No employees yet. Add your first staff member.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-muted-foreground border-b border-border">
                  <tr><th className="py-2">Name</th><th className="py-2">Department</th><th className="py-2">Type</th><th className="py-2">Status</th><th className="py-2 text-right">Basic (₵)</th><th className="py-2"></th></tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr key={r.id} className="border-b border-border/60">
                      <td className="py-3">
                        <Link to={`/crm/hr/employees/${r.id}`} className="font-medium hover:text-primary">{r.full_name}</Link>
                        <p className="text-xs text-muted-foreground">{r.job_title || "—"}</p>
                      </td>
                      <td className="py-3">{r.department || "—"}</td>
                      <td className="py-3 capitalize">{r.employment_type}</td>
                      <td className="py-3"><Badge variant={r.status === "active" ? "default" : "secondary"} className="capitalize">{r.status.replace("_", " ")}</Badge></td>
                      <td className="py-3 text-right">{Number(r.basic_salary).toLocaleString()}</td>
                      <td className="py-3 text-right"><Button size="sm" variant="ghost" onClick={() => { setEditing(r); setOpen(true); }}>Edit</Button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <EmployeeDialog open={open} onOpenChange={setOpen} employee={editing} onSaved={load} />
    </div>
  );
}