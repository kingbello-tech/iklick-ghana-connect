import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Star } from "lucide-react";
import { format } from "date-fns";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from "recharts";

interface SatisfactionRecord {
  id: string;
  client_id: string;
  incident_id: string | null;
  rating: number;
  feedback: string | null;
  surveyed_by: string;
  created_at: string;
}

const RATING_COLORS = ["", "hsl(0,84%,60%)", "hsl(25,95%,53%)", "hsl(45,93%,47%)", "hsl(142,50%,50%)", "hsl(142,71%,45%)"];

export default function ClientSatisfaction() {
  const { user, role } = useAuth();
  const { toast } = useToast();
  const [records, setRecords] = useState<SatisfactionRecord[]>([]);
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ client_id: "", incident_id: "", rating: "5", feedback: "" });

  const canCreate = role === "admin" || role === "client_experience" || role === "support_agent" || role === "network_engineer";

  const fetchData = async () => {
    const [satRes, clientRes] = await Promise.all([
      supabase.from("client_satisfaction").select("*").order("created_at", { ascending: false }),
      supabase.from("clients").select("id, name").order("name"),
    ]);
    if (satRes.data) setRecords(satRes.data as SatisfactionRecord[]);
    if (clientRes.data) setClients(clientRes.data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const clientMap = Object.fromEntries(clients.map((c) => [c.id, c.name]));

  const handleCreate = async () => {
    if (!user) return;
    const { error } = await supabase.from("client_satisfaction").insert({
      client_id: form.client_id,
      incident_id: form.incident_id || null,
      rating: parseInt(form.rating),
      feedback: form.feedback || null,
      surveyed_by: user.id,
    } as any);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Survey recorded" });
    setForm({ client_id: "", incident_id: "", rating: "5", feedback: "" });
    setDialogOpen(false);
    fetchData();
  };

  // Analytics
  const avgRating = records.length > 0 ? (records.reduce((s, r) => s + r.rating, 0) / records.length).toFixed(1) : "—";
  const ratingDist = [1, 2, 3, 4, 5].map((r) => ({
    name: `${r} Star`,
    value: records.filter((rec) => rec.rating === r).length,
    fill: RATING_COLORS[r],
  }));

  // Client avg ratings
  const clientRatings = Object.entries(
    records.reduce((acc, r) => {
      if (!acc[r.client_id]) acc[r.client_id] = { total: 0, count: 0 };
      acc[r.client_id].total += r.rating;
      acc[r.client_id].count += 1;
      return acc;
    }, {} as Record<string, { total: number; count: number }>)
  ).map(([id, data]) => ({
    name: clientMap[id] || "Unknown",
    avg: parseFloat((data.total / data.count).toFixed(1)),
  })).sort((a, b) => b.avg - a.avg).slice(0, 10);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Client Satisfaction</h1>
          <p className="text-muted-foreground text-sm">Track and manage client satisfaction surveys</p>
        </div>
        {canCreate && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />New Survey</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Record Satisfaction Survey</DialogTitle></DialogHeader>
              <div className="space-y-4 mt-2">
                <Select value={form.client_id} onValueChange={(v) => setForm({ ...form, client_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={form.rating} onValueChange={(v) => setForm({ ...form, rating: v })}>
                  <SelectTrigger><SelectValue placeholder="Rating" /></SelectTrigger>
                  <SelectContent>
                    {[5, 4, 3, 2, 1].map((r) => <SelectItem key={r} value={String(r)}>{r} Star{r > 1 ? "s" : ""}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Textarea placeholder="Client feedback (optional)" value={form.feedback} onChange={(e) => setForm({ ...form, feedback: e.target.value })} />
                <Button onClick={handleCreate} disabled={!form.client_id} className="w-full">Save Survey</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-foreground">{avgRating}</p>
            <p className="text-xs text-muted-foreground">Average Rating</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-foreground">{records.length}</p>
            <p className="text-xs text-muted-foreground">Total Surveys</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-foreground">{records.filter((r) => r.rating >= 4).length}</p>
            <p className="text-xs text-muted-foreground">Satisfied (4-5★)</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Rating Distribution</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={ratingDist}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {ratingDist.map((e, i) => <Cell key={i} fill={e.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Top Clients by Rating</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={clientRatings} layout="vertical">
                <XAxis type="number" domain={[0, 5]} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={100} />
                <Tooltip />
                <Bar dataKey="avg" fill="hsl(142,71%,45%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Recent Surveys</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-3 text-muted-foreground font-medium text-xs">Date</th>
                  <th className="text-left p-3 text-muted-foreground font-medium text-xs">Client</th>
                  <th className="text-left p-3 text-muted-foreground font-medium text-xs">Rating</th>
                  <th className="text-left p-3 text-muted-foreground font-medium text-xs">Feedback</th>
                </tr>
              </thead>
              <tbody>
                {records.slice(0, 20).map((r) => (
                  <tr key={r.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                    <td className="p-3 text-muted-foreground text-xs whitespace-nowrap">{format(new Date(r.created_at), "MMM d, yyyy")}</td>
                    <td className="p-3 text-foreground">{clientMap[r.client_id] || "Unknown"}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} className={`h-3 w-3 ${s <= r.rating ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground"}`} />
                        ))}
                      </div>
                    </td>
                    <td className="p-3 text-muted-foreground truncate max-w-[300px]">{r.feedback || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}