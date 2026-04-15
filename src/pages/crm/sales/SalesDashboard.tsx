import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, Users, Target, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const STAGE_LABELS: Record<string, string> = {
  new_lead: "New Lead",
  qualification: "Qualification",
  site_survey: "Site Survey",
  proposal_sent: "Proposal Sent",
  negotiation: "Negotiation",
  closed_won: "Closed Won",
  closed_lost: "Closed Lost",
};

const STAGE_COLORS = ["#3b82f6", "#8b5cf6", "#eab308", "#f97316", "#ec4899", "#22c55e", "#ef4444"];

interface Deal {
  id: string;
  title: string;
  value: number;
  probability: number;
  stage: string;
  assigned_to: string | null;
  created_at: string;
}

interface Profile {
  user_id: string;
  full_name: string | null;
}

export default function SalesDashboard() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const [dealsRes, leadsRes, profilesRes] = await Promise.all([
        supabase.from("deals").select("*"),
        supabase.from("leads").select("*"),
        supabase.from("profiles").select("user_id, full_name"),
      ]);
      if (dealsRes.data) setDeals(dealsRes.data as unknown as Deal[]);
      if (leadsRes.data) setLeads(leadsRes.data);
      if (profilesRes.data) setProfiles(profilesRes.data);
      setLoading(false);
    };
    fetch();
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  const profileMap = Object.fromEntries(profiles.map(p => [p.user_id, p.full_name || "Unknown"]));

  const pipelineValue = deals.filter(d => !["closed_won", "closed_lost"].includes(d.stage)).reduce((s, d) => s + Number(d.value), 0);
  const wonValue = deals.filter(d => d.stage === "closed_won").reduce((s, d) => s + Number(d.value), 0);
  const forecastValue = deals.filter(d => !["closed_won", "closed_lost"].includes(d.stage)).reduce((s, d) => s + Number(d.value) * (d.probability / 100), 0);
  const winRate = deals.length > 0 ? Math.round((deals.filter(d => d.stage === "closed_won").length / deals.filter(d => ["closed_won", "closed_lost"].includes(d.stage)).length) * 100) || 0 : 0;

  // Pipeline funnel data
  const funnelData = Object.entries(STAGE_LABELS).filter(([k]) => !["closed_won", "closed_lost"].includes(k)).map(([value, label]) => ({
    name: label,
    count: deals.filter(d => d.stage === value).length,
    value: deals.filter(d => d.stage === value).reduce((s, d) => s + Number(d.value), 0),
  }));

  // Stage distribution for pie
  const pieData = Object.entries(STAGE_LABELS).map(([value, label], i) => ({
    name: label,
    value: deals.filter(d => d.stage === value).length,
    color: STAGE_COLORS[i],
  })).filter(d => d.value > 0);

  // Leaderboard
  const repDeals = deals.filter(d => d.assigned_to && d.stage === "closed_won");
  const leaderboard = Object.entries(
    repDeals.reduce<Record<string, number>>((acc, d) => {
      acc[d.assigned_to!] = (acc[d.assigned_to!] || 0) + Number(d.value);
      return acc;
    }, {})
  ).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Sales Dashboard</h1>
        <p className="text-muted-foreground text-sm">Revenue overview and sales performance</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Pipeline Value</p>
                <p className="text-2xl font-bold text-foreground">₵{pipelineValue.toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Won Revenue</p>
                <p className="text-2xl font-bold text-green-400">₵{wonValue.toLocaleString()}</p>
              </div>
              <ArrowUpRight className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Forecast</p>
                <p className="text-2xl font-bold text-yellow-400">₵{Math.round(forecastValue).toLocaleString()}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Win Rate</p>
                <p className="text-2xl font-bold text-foreground">{winRate}%</p>
              </div>
              <Target className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pipeline Funnel */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Pipeline Funnel</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={funnelData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} width={100} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", color: "hsl(var(--foreground))" }} />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Stage Distribution */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Deal Distribution</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, value }) => `${name}: ${value}`}>
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", color: "hsl(var(--foreground))" }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Leaderboard */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Sales Leaderboard</CardTitle></CardHeader>
          <CardContent>
            {leaderboard.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">No closed deals yet</p>
            ) : (
              <div className="space-y-3">
                {leaderboard.map(([userId, value], i) => (
                  <div key={userId} className="flex items-center gap-3">
                    <span className="text-lg font-bold text-muted-foreground w-6">{i + 1}</span>
                    <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-medium">
                      {profileMap[userId]?.[0]?.toUpperCase() || "?"}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{profileMap[userId]}</p>
                    </div>
                    <span className="text-sm font-semibold text-green-400">₵{value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Quick Stats</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between"><span className="text-muted-foreground">Total Leads</span><span className="font-semibold text-foreground">{leads.length}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Total Deals</span><span className="font-semibold text-foreground">{deals.length}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Active Deals</span><span className="font-semibold text-foreground">{deals.filter(d => !["closed_won", "closed_lost"].includes(d.stage)).length}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Qualified Leads</span><span className="font-semibold text-foreground">{leads.filter((l: any) => l.status === "qualified").length}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Avg Deal Value</span><span className="font-semibold text-foreground">₵{deals.length > 0 ? Math.round(deals.reduce((s, d) => s + Number(d.value), 0) / deals.length).toLocaleString() : 0}</span></div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
