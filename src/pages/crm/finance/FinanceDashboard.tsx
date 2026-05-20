import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { FileText, Wallet, AlertCircle, Repeat, Loader2, Plus, BellRing, ShieldCheck } from "lucide-react";
import { format } from "date-fns";
import { NewInvoiceDialog } from "@/components/crm/NewInvoiceDialog";

interface InvoiceRow {
  id: string;
  invoice_number: string;
  status: string;
  kind: string;
  total: number;
  balance_due: number;
  due_date: string;
  issue_date: string;
  approval_required?: boolean;
  approved_at?: string | null;
}

const STATUS_BADGE: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  pending_approval: "bg-purple-500/15 text-purple-600 dark:text-purple-400",
  approved: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  sent: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  paid: "bg-green-500/15 text-green-600 dark:text-green-400",
  partially_paid: "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400",
  overdue: "bg-destructive/15 text-destructive",
  cancelled: "bg-muted text-muted-foreground line-through",
};

export default function FinanceDashboard() {
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [sweeping, setSweeping] = useState(false);
  const [newInvoiceOpen, setNewInvoiceOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("invoices")
      .select("id, invoice_number, status, kind, total, balance_due, due_date, issue_date, approval_required, approved_at")
      .order("created_at", { ascending: false })
      .limit(500);
    setInvoices((data || []) as InvoiceRow[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const drafts = invoices.filter(i => i.status === "draft");
  const pendingApproval = invoices.filter(i => i.status === "pending_approval");
  const outstanding = invoices.filter(i => ["sent", "partially_paid", "overdue"].includes(i.status));
  const paid = invoices.filter(i => i.status === "paid");

  const totalOutstanding = outstanding.reduce((s, i) => s + Number(i.balance_due || 0), 0);
  const totalCollected = paid.reduce((s, i) => s + Number(i.total || 0), 0);

  // AR aging buckets
  const today = new Date();
  const daysOverdue = (due: string) => Math.floor((today.getTime() - new Date(due).getTime()) / 86400000);
  const aging = { current: 0, b30: 0, b60: 0, b90: 0, b90plus: 0 };
  outstanding.forEach((i) => {
    const d = daysOverdue(i.due_date);
    const bal = Number(i.balance_due || 0);
    if (d <= 0) aging.current += bal;
    else if (d <= 30) aging.b30 += bal;
    else if (d <= 60) aging.b60 += bal;
    else if (d <= 90) aging.b90 += bal;
    else aging.b90plus += bal;
  });

  // DSO approximation: (Outstanding / Avg daily revenue last 90d) — fallback to simple avg
  const last90 = paid.filter((i) => daysOverdue(i.due_date) <= 90);
  const avgDaily = last90.reduce((s, i) => s + Number(i.total || 0), 0) / 90 || 1;
  const dso = Math.round(totalOutstanding / avgDaily) || 0;

  const runRecurring = async () => {
    setGenerating(true);
    const { data, error } = await supabase.rpc("generate_monthly_recurring_invoices");
    setGenerating(false);
    if (error) {
      toast({ title: "Failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Done", description: `${data ?? 0} recurring invoices generated.` });
    load();
  };

  const runDunning = async () => {
    setSweeping(true);
    const { data, error } = await supabase.rpc("dunning_sweep");
    setSweeping(false);
    if (error) {
      toast({ title: "Failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Dunning sweep complete", description: `${data ?? 0} invoices flagged as overdue.` });
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Finance Dashboard</h1>
          <p className="text-sm text-muted-foreground">AR aging, collections, approvals, and recurring billing.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button onClick={() => setNewInvoiceOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> New Invoice
          </Button>
          <Button onClick={runRecurring} disabled={generating} variant="outline">
            {generating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Repeat className="h-4 w-4 mr-2" />}
            Generate Monthly Recurring
          </Button>
          <Button onClick={runDunning} disabled={sweeping} variant="outline">
            {sweeping ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <BellRing className="h-4 w-4 mr-2" />}
            Run Dunning Sweep
          </Button>
          <Button asChild variant="outline">
            <Link to="/crm/finance/invoices">All Invoices</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-2"><AlertCircle className="h-4 w-4" /> Outstanding</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-semibold">₵{totalOutstanding.toLocaleString()}</div><div className="text-xs text-muted-foreground">{outstanding.length} open invoices</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-2"><Wallet className="h-4 w-4" /> Collected</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-semibold text-green-600 dark:text-green-400">₵{totalCollected.toLocaleString()}</div><div className="text-xs text-muted-foreground">{paid.length} paid invoices</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-2"><FileText className="h-4 w-4" /> Drafts</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-semibold">{drafts.length}</div><div className="text-xs text-muted-foreground">awaiting action</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Awaiting Approval</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-semibold text-purple-600 dark:text-purple-400">{pendingApproval.length}</div><div className="text-xs text-muted-foreground">DSO ≈ {dso} days</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Accounts Receivable Aging</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
            {[
              { label: "Current", value: aging.current, tone: "bg-muted text-muted-foreground" },
              { label: "1-30 days", value: aging.b30, tone: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400" },
              { label: "31-60 days", value: aging.b60, tone: "bg-orange-500/15 text-orange-700 dark:text-orange-400" },
              { label: "61-90 days", value: aging.b90, tone: "bg-red-500/15 text-red-700 dark:text-red-400" },
              { label: "90+ days", value: aging.b90plus, tone: "bg-destructive/15 text-destructive" },
            ].map((b) => (
              <div key={b.label} className={`p-4 rounded-md ${b.tone}`}>
                <div className="text-xs uppercase tracking-wide opacity-75">{b.label}</div>
                <div className="text-lg font-semibold mt-1">₵{b.value.toLocaleString()}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {pendingApproval.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Awaiting Approval</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pendingApproval.slice(0, 5).map((inv) => (
                <Link key={inv.id} to={`/crm/finance/invoices/${inv.id}`} className="flex items-center justify-between p-3 rounded-md border border-border hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm">{inv.invoice_number}</span>
                    <Badge className={STATUS_BADGE[inv.status]}>{inv.status.replace("_", " ")}</Badge>
                  </div>
                  <span className="font-semibold">₵{Number(inv.total).toLocaleString()}</span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Recent Invoices</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : invoices.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No invoices yet. They are auto-drafted when an installation is completed.</p>
          ) : (
            <div className="space-y-2">
              {invoices.slice(0, 10).map(inv => (
                <Link key={inv.id} to={`/crm/finance/invoices/${inv.id}`} className="flex items-center justify-between p-3 rounded-md border border-border hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm">{inv.invoice_number}</span>
                    <Badge variant="outline" className="capitalize text-xs">{inv.kind}</Badge>
                    <Badge className={STATUS_BADGE[inv.status] || ""}>{inv.status.replace("_", " ")}</Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-muted-foreground">Due {format(new Date(inv.due_date), "MMM d")}</span>
                    <span className="font-semibold">₵{Number(inv.total).toLocaleString()}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      <NewInvoiceDialog open={newInvoiceOpen} onOpenChange={setNewInvoiceOpen} onCreated={() => load()} />
    </div>
  );
}
