import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Target as TargetIcon } from "lucide-react";

const CATEGORIES = [
  { value: "community_wifi", label: "Community Wi-Fi" },
  { value: "ftth", label: "FTTH" },
  { value: "voip", label: "VOIP" },
  { value: "dia", label: "DIA" },
] as const;

interface SalesTarget {
  id: string;
  user_id: string;
  category: string;
  target_month: string;
  target_amount: number;
  carryover_amount: number;
  notes: string | null;
}

interface Deal {
  id: string;
  tcv: number;
  value: number;
  isp_category: string | null;
  assigned_to: string | null;
  stage: string;
  updated_at: string;
}

interface Profile { user_id: string; full_name: string | null; }

const monthStart = (d = new Date()) => {
  const x = new Date(d.getFullYear(), d.getMonth(), 1);
  return x.toISOString().slice(0, 10);
};
const addMonths = (iso: string, n: number) => {
  const d = new Date(iso);
  d.setMonth(d.getMonth() + n);
  return monthStart(d);
};

export default function SalesTargets() {
  const { user, isSalesManagerOrAdmin } = useAuth();
  const { toast } = useToast();
  const [targets, setTargets] = useState<SalesTarget[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(monthStart());
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ user_id: "", category: "community_wifi", target_amount: "0", notes: "" });

  const fetchData = async () => {
    const [tRes, dRes, pRes] = await Promise.all([
      supabase.from("sales_targets").select("*"),
      supabase.from("deals").select("id, tcv, value, isp_category, assigned_to, stage, updated_at"),
      supabase.from("profiles").select("user_id, full_name"),
    ]);
    if (tRes.data) setTargets(tRes.data as any);
    if (dRes.data) setDeals(dRes.data as any);
    if (pRes.data) setProfiles(pRes.data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const profileMap = Object.fromEntries(profiles.map(p => [p.user_id, p.full_name || "Unknown"]));

  // Compute achieved value for a (rep, category, month)
  const achievedFor = (userId: string, category: string, monthIso: string) => {
    const next = addMonths(monthIso, 1);
    return deals
      .filter(d => d.assigned_to === userId && d.isp_category === category && d.stage === "closed_won")
      .filter(d => d.updated_at >= monthIso && d.updated_at < next)
      .reduce((s, d) => s + Number(d.tcv || d.value || 0), 0);
  };

  const monthTargets = targets.filter(t => t.target_month === month);
  const reps = Array.from(new Set([...targets.map(t => t.user_id), ...(user ? [user.id] : [])]));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    // compute carryover from previous month for same rep + category
    const prevMonth = addMonths(month, -1);
    const prev = targets.find(t => t.user_id === form.user_id && t.category === form.category && t.target_month === prevMonth);
    let carryover = 0;
    if (prev) {
      const achieved = achievedFor(form.user_id, form.category, prevMonth);
      const totalGoal = Number(prev.target_amount) + Number(prev.carryover_amount);
      // unmet: positive carryover added, surplus: negative carryover (deduction) 
      carryover = totalGoal - achieved;
    }
    const { error } = await supabase.from("sales_targets").upsert({
      user_id: form.user_id,
      category: form.category as any,
      target_month: month,
      target_amount: parseFloat(form.target_amount) || 0,
      carryover_amount: carryover,
      notes: form.notes || null,
      created_by: user.id,
    }, { onConflict: "user_id,category,target_month" });
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Target saved" }); setOpen(false); setForm({ user_id: "", category: "community_wifi", target_amount: "0", notes: "" }); fetchData(); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  const visibleReps = isSalesManagerOrAdmin ? reps : (user ? [user.id] : []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Sales Targets</h1>
          <p className="text-muted-foreground text-sm">Per-rep, per-category monthly targets with auto carryover</p>
        </div>
        <div className="flex gap-2 items-center">
          <Input type="month" value={month.slice(0, 7)} onChange={e => setMonth(e.target.value + "-01")} className="w-40" />
          {isSalesManagerOrAdmin && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Set Target</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Set Monthly Target ({month.slice(0, 7)})</DialogTitle></DialogHeader>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div>
                    <Label>Sales Rep *</Label>
                    <Select value={form.user_id} onValueChange={v => setForm({ ...form, user_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Select rep" /></SelectTrigger>
                      <SelectContent>{profiles.map(p => <SelectItem key={p.user_id} value={p.user_id}>{p.full_name || "Unknown"}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Category *</Label>
                    <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Target Amount (₵)</Label><Input type="number" step="0.01" value={form.target_amount} onChange={e => setForm({ ...form, target_amount: e.target.value })} required /></div>
                  <div><Label>Notes</Label><Input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
                  <Button type="submit" className="w-full" disabled={!form.user_id}>Save Target</Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {visibleReps.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No targets set yet. {isSalesManagerOrAdmin && "Click 'Set Target' to create one."}</CardContent></Card>
      ) : (
        visibleReps.map(repId => {
          const repTargets = monthTargets.filter(t => t.user_id === repId);
          const totalGoal = repTargets.reduce((s, t) => s + Number(t.target_amount) + Number(t.carryover_amount), 0);
          const totalAchieved = CATEGORIES.reduce((s, c) => s + achievedFor(repId, c.value, month), 0);
          const overall = totalGoal > 0 ? Math.min(100, Math.round((totalAchieved / totalGoal) * 100)) : 0;
          return (
            <Card key={repId}>
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <CardTitle className="text-base flex items-center gap-2"><TargetIcon className="h-4 w-4" />{profileMap[repId] || "Unknown"}</CardTitle>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Overall {month.slice(0, 7)}</p>
                    <p className="text-sm font-semibold text-foreground">₵{totalAchieved.toLocaleString()} / ₵{totalGoal.toLocaleString()}</p>
                  </div>
                </div>
                <Progress value={overall} className="h-2" />
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {CATEGORIES.map(cat => {
                  const t = repTargets.find(x => x.category === cat.value);
                  const goal = t ? Number(t.target_amount) + Number(t.carryover_amount) : 0;
                  const achieved = achievedFor(repId, cat.value, month);
                  const pct = goal > 0 ? Math.min(100, Math.round((achieved / goal) * 100)) : 0;
                  return (
                    <div key={cat.value} className="p-3 rounded-lg border border-border space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">{cat.label}</span>
                        {t && Number(t.carryover_amount) !== 0 && (
                          <Badge variant={Number(t.carryover_amount) > 0 ? "destructive" : "secondary"} className="text-xs">
                            {Number(t.carryover_amount) > 0 ? "+" : ""}₵{Number(t.carryover_amount).toLocaleString()} carry
                          </Badge>
                        )}
                      </div>
                      <Progress value={pct} className="h-2" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>₵{achieved.toLocaleString()} achieved</span>
                        <span>₵{goal.toLocaleString()} goal</span>
                      </div>
                      {!t && <p className="text-xs text-muted-foreground italic">No target set</p>}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
