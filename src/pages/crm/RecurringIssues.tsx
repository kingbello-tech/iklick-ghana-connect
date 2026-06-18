import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, Search, RefreshCw, ExternalLink, ShieldAlert } from "lucide-react";
import { ProblemRecordDrawer } from "@/components/crm/ProblemRecordDrawer";
import { formatDistanceToNow } from "date-fns";

type Pattern = {
  client_id: string | null;
  client_name: string | null;
  site_id: string | null;
  site_name: string | null;
  issue_category: string;
  sub_category: string;
  incident_count: number;
  first_seen: string;
  last_seen: string;
  avg_resolution_minutes: number | null;
  breach_count: number;
  problem_record_id: string | null;
  problem_record_status: string | null;
};

const STATUS_COLORS: Record<string, string> = {
  open: "bg-red-500/15 text-red-600 border-red-500/30",
  investigating: "bg-amber-500/15 text-amber-600 border-amber-500/30",
  mitigated: "bg-blue-500/15 text-blue-600 border-blue-500/30",
  resolved: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
};

export default function RecurringIssues() {
  const [windowDays, setWindowDays] = useState(90);
  const [minCount, setMinCount] = useState(3);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("__all__");
  const [activePattern, setActivePattern] = useState<Pattern | null>(null);

  const { data: patterns = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ["recurring-issue-patterns", windowDays, minCount],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("recurring_issue_patterns", {
        _window_days: windowDays,
        _min_count: minCount,
      });
      if (error) throw error;
      return (data ?? []) as Pattern[];
    },
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return patterns.filter((p) => {
      if (q) {
        const hay = `${p.client_name ?? ""} ${p.issue_category} ${p.sub_category} ${p.site_name ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (statusFilter !== "__all__") {
        if (statusFilter === "none" && p.problem_record_id) return false;
        if (statusFilter !== "none" && p.problem_record_status !== statusFilter) return false;
      }
      return true;
    });
  }, [patterns, search, statusFilter]);

  const kpis = useMemo(() => {
    const active = patterns.length;
    const newThisWeek = patterns.filter((p) => {
      const last = new Date(p.last_seen).getTime();
      return Date.now() - last < 7 * 86400 * 1000;
    }).length;
    const open = patterns.filter((p) => p.problem_record_id && p.problem_record_status !== "resolved").length;
    const avgInterval = (() => {
      const intervals = patterns
        .map((p) => {
          if (p.incident_count < 2) return null;
          const days = (new Date(p.last_seen).getTime() - new Date(p.first_seen).getTime()) / 86400000;
          return days / (p.incident_count - 1);
        })
        .filter((v): v is number => v !== null);
      if (!intervals.length) return null;
      return intervals.reduce((a, b) => a + b, 0) / intervals.length;
    })();
    return { active, newThisWeek, open, avgInterval };
  }, [patterns]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-amber-500" />
            Recurring Issues
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Patterns of repeated incidents grouped by client, category, and site — track them with problem records for proactive fixes.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPI label="Active patterns" value={kpis.active} />
        <KPI label="New in last 7 days" value={kpis.newThisWeek} />
        <KPI label="Open problem records" value={kpis.open} />
        <KPI
          label="Avg interval (days)"
          value={kpis.avgInterval !== null ? kpis.avgInterval.toFixed(1) : "—"}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-5">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search client, category, site..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={String(windowDays)} onValueChange={(v) => setWindowDays(Number(v))}>
            <SelectTrigger><SelectValue placeholder="Window" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="60">Last 60 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="180">Last 180 days</SelectItem>
              <SelectItem value="365">Last 365 days</SelectItem>
            </SelectContent>
          </Select>
          <Select value={String(minCount)} onValueChange={(v) => setMinCount(Number(v))}>
            <SelectTrigger><SelectValue placeholder="Min occurrences" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="2">≥ 2 occurrences</SelectItem>
              <SelectItem value="3">≥ 3 occurrences</SelectItem>
              <SelectItem value="5">≥ 5 occurrences</SelectItem>
              <SelectItem value="10">≥ 10 occurrences</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger><SelectValue placeholder="Problem record" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Any status</SelectItem>
              <SelectItem value="none">No record yet</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="investigating">Investigating</SelectItem>
              <SelectItem value="mitigated">Mitigated</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Site</TableHead>
                <TableHead className="text-right">Count</TableHead>
                <TableHead>Last seen</TableHead>
                <TableHead className="text-right">SLA breach</TableHead>
                <TableHead>Problem record</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Loading patterns…</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No recurring patterns detected with current filters.</TableCell></TableRow>
              ) : filtered.map((p, i) => {
                const breachPct = p.incident_count > 0 ? Math.round((Number(p.breach_count) / Number(p.incident_count)) * 100) : 0;
                return (
                  <TableRow key={`${p.client_id ?? "x"}-${p.site_id ?? "x"}-${p.issue_category}-${p.sub_category}-${i}`}>
                    <TableCell className="font-medium">
                      {p.client_id ? (
                        <Link to={`/crm/clients/${p.client_id}`} className="hover:underline">
                          {p.client_name ?? "Unknown client"}
                        </Link>
                      ) : <span className="text-muted-foreground">Unassigned</span>}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{p.issue_category}</div>
                      {p.sub_category && <div className="text-xs text-muted-foreground">{p.sub_category}</div>}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{p.site_name ?? "—"}</TableCell>
                    <TableCell className="text-right font-mono font-semibold">{p.incident_count}</TableCell>
                    <TableCell className="text-sm">{formatDistanceToNow(new Date(p.last_seen), { addSuffix: true })}</TableCell>
                    <TableCell className="text-right">
                      {breachPct > 0 ? (
                        <Badge variant="outline" className={breachPct >= 50 ? "border-red-500/40 text-red-600" : "border-amber-500/40 text-amber-600"}>
                          <ShieldAlert className="h-3 w-3 mr-1" />{breachPct}%
                        </Badge>
                      ) : <span className="text-muted-foreground text-xs">—</span>}
                    </TableCell>
                    <TableCell>
                      {p.problem_record_status ? (
                        <Badge variant="outline" className={STATUS_COLORS[p.problem_record_status] ?? ""}>
                          {p.problem_record_status}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">Not tracked</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="ghost" asChild>
                          <Link to={`/crm/incidents?client_id=${p.client_id ?? ""}&category=${encodeURIComponent(p.issue_category)}`}>
                            <ExternalLink className="h-3.5 w-3.5 mr-1" />Incidents
                          </Link>
                        </Button>
                        <Button size="sm" variant={p.problem_record_id ? "outline" : "default"} onClick={() => setActivePattern(p)}>
                          {p.problem_record_id ? "Open record" : "Create record"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {activePattern && (
        <ProblemRecordDrawer
          pattern={activePattern}
          windowDays={windowDays}
          open={!!activePattern}
          onClose={() => setActivePattern(null)}
          onSaved={() => refetch()}
        />
      )}
    </div>
  );
}

function KPI({ label, value }: { label: string; value: number | string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-xs text-muted-foreground uppercase tracking-wider">{label}</div>
        <div className="text-3xl font-bold mt-1">{value}</div>
      </CardContent>
    </Card>
  );
}