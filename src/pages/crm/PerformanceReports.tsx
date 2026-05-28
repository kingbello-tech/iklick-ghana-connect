import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, ExternalLink } from "lucide-react";
import { format, differenceInMinutes } from "date-fns";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";
import { TablePagination, usePaginatedSlice } from "@/components/crm/TablePagination";
import type { Database } from "@/integrations/supabase/types";

type Incident = Database["public"]["Tables"]["incidents"]["Row"];
type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface UserPerf {
  userId: string;
  name: string;
  assigned: number;
  resolved: number;
  avgResolutionMins: number;
}

interface ClientPerf {
  clientId: string;
  name: string;
  totalIncidents: number;
  openIncidents: number;
  avgRating: number;
}

export default function PerformanceReports() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [satisfaction, setSatisfaction] = useState<{ client_id: string; rating: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [userPage, setUserPage] = useState(1);
  const [userPageSize, setUserPageSize] = useState(25);
  const [clientPage, setClientPage] = useState(1);
  const [clientPageSize, setClientPageSize] = useState(25);

  useEffect(() => {
    const fetch = async () => {
      const [incRes, profRes, clientRes, satRes] = await Promise.all([
        supabase.from("incidents").select("*"),
        supabase.from("profiles").select("*"),
        supabase.from("clients").select("id, name"),
        supabase.from("client_satisfaction").select("client_id, rating"),
      ]);
      if (incRes.data) setIncidents(incRes.data);
      if (profRes.data) setProfiles(profRes.data);
      if (clientRes.data) setClients(clientRes.data);
      if (satRes.data) setSatisfaction(satRes.data as any);
      setLoading(false);
    };
    fetch();
  }, []);

  const profMap = Object.fromEntries(profiles.map((p) => [p.user_id, p.full_name || "Unknown"]));

  const userPerf: UserPerf[] = Object.entries(
    incidents.reduce((acc, inc) => {
      if (!inc.assigned_to) return acc;
      if (!acc[inc.assigned_to]) acc[inc.assigned_to] = { assigned: 0, resolved: 0, totalMins: 0, resolvedCount: 0 };
      acc[inc.assigned_to].assigned++;
      if (inc.resolved_at) {
        acc[inc.assigned_to].resolved++;
        acc[inc.assigned_to].totalMins += differenceInMinutes(new Date(inc.resolved_at), new Date(inc.created_at));
        acc[inc.assigned_to].resolvedCount++;
      }
      return acc;
    }, {} as Record<string, { assigned: number; resolved: number; totalMins: number; resolvedCount: number }>)
  ).map(([uid, data]) => ({
    userId: uid,
    name: profMap[uid] || "Unknown",
    assigned: data.assigned,
    resolved: data.resolved,
    avgResolutionMins: data.resolvedCount > 0 ? Math.round(data.totalMins / data.resolvedCount) : 0,
  })).sort((a, b) => b.resolved - a.resolved);

  const satByClient = satisfaction.reduce((acc, s) => {
    if (!acc[s.client_id]) acc[s.client_id] = { total: 0, count: 0 };
    acc[s.client_id].total += s.rating;
    acc[s.client_id].count++;
    return acc;
  }, {} as Record<string, { total: number; count: number }>);

  const clientPerf: ClientPerf[] = clients.map((c) => {
    const clientIncs = incidents.filter((i) => i.client_id === c.id);
    const sat = satByClient[c.id];
    return {
      clientId: c.id,
      name: c.name,
      totalIncidents: clientIncs.length,
      openIncidents: clientIncs.filter((i) => !["resolved", "closed"].includes(i.status)).length,
      avgRating: sat ? parseFloat((sat.total / sat.count).toFixed(1)) : 0,
    };
  }).sort((a, b) => b.totalIncidents - a.totalIncidents);

  const exportCSV = (data: Record<string, any>[], filename: string) => {
    if (data.length === 0) return;
    const headers = Object.keys(data[0]).filter((h) => h !== "userId" && h !== "clientId");
    const csv = [headers.join(","), ...data.map((row) => headers.map((h) => `"${row[h] ?? ""}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}_${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  const userPerfPaged = usePaginatedSlice(userPerf, userPage, userPageSize);
  const clientPerfPaged = usePaginatedSlice(clientPerf, clientPage, clientPageSize);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Performance Reports</h1>
        <p className="text-muted-foreground text-sm">View and export user and client performance data</p>
      </div>

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">User Performance</TabsTrigger>
          <TabsTrigger value="clients">Client Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={() => exportCSV(userPerf, "user_performance")}>
              <Download className="h-4 w-4 mr-2" />Export CSV
            </Button>
          </div>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Incidents Resolved by User</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={userPerf}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="assigned" fill="hsl(215,70%,60%)" name="Assigned" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="resolved" fill="hsl(142,71%,45%)" name="Resolved" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-3 text-muted-foreground font-medium text-xs">User</th>
                      <th className="text-left p-3 text-muted-foreground font-medium text-xs">Assigned</th>
                      <th className="text-left p-3 text-muted-foreground font-medium text-xs">Resolved</th>
                      <th className="text-left p-3 text-muted-foreground font-medium text-xs">Resolution Rate</th>
                      <th className="text-left p-3 text-muted-foreground font-medium text-xs">Avg Resolution Time</th>
                      <th className="text-left p-3 text-muted-foreground font-medium text-xs"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {userPerfPaged.map((u) => (
                      <tr key={u.userId} className="border-b border-border hover:bg-muted/50">
                        <td className="p-3 text-foreground font-medium">{u.name}</td>
                        <td className="p-3 text-muted-foreground">{u.assigned}</td>
                        <td className="p-3 text-foreground">{u.resolved}</td>
                        <td className="p-3 text-foreground">{u.assigned > 0 ? `${((u.resolved / u.assigned) * 100).toFixed(0)}%` : "—"}</td>
                        <td className="p-3 text-muted-foreground">{u.avgResolutionMins > 0 ? `${(u.avgResolutionMins / 60).toFixed(1)} h` : "—"}</td>
                        <td className="p-3">
                          <Link to={`/crm/performance/staff/${u.userId}`}>
                            <Button variant="ghost" size="sm"><ExternalLink className="h-3 w-3 mr-1" />View</Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {userPerf.length > 0 && (
                <TablePagination
                  page={userPage}
                  pageSize={userPageSize}
                  total={userPerf.length}
                  onPageChange={setUserPage}
                  onPageSizeChange={(s) => { setUserPageSize(s); setUserPage(1); }}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clients" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={() => exportCSV(clientPerf, "client_performance")}>
              <Download className="h-4 w-4 mr-2" />Export CSV
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-3 text-muted-foreground font-medium text-xs">Client</th>
                      <th className="text-left p-3 text-muted-foreground font-medium text-xs">Total Incidents</th>
                      <th className="text-left p-3 text-muted-foreground font-medium text-xs">Open</th>
                      <th className="text-left p-3 text-muted-foreground font-medium text-xs">Avg Satisfaction</th>
                      <th className="text-left p-3 text-muted-foreground font-medium text-xs"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientPerfPaged.map((c) => (
                      <tr key={c.clientId} className="border-b border-border hover:bg-muted/50">
                        <td className="p-3 text-foreground font-medium">{c.name}</td>
                        <td className="p-3 text-muted-foreground">{c.totalIncidents}</td>
                        <td className="p-3 text-foreground">{c.openIncidents}</td>
                        <td className="p-3 text-foreground">{c.avgRating > 0 ? `${c.avgRating} ★` : "—"}</td>
                        <td className="p-3">
                          <Link to={`/crm/performance/client/${c.clientId}`}>
                            <Button variant="ghost" size="sm"><ExternalLink className="h-3 w-3 mr-1" />View</Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {clientPerf.length > 0 && (
                <TablePagination
                  page={clientPage}
                  pageSize={clientPageSize}
                  total={clientPerf.length}
                  onPageChange={setClientPage}
                  onPageSizeChange={(s) => { setClientPageSize(s); setClientPage(1); }}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
