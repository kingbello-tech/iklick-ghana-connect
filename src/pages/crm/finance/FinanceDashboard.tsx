import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { FileText, Wallet, AlertCircle, Repeat, Loader2 } from "lucide-react";
import { format } from "date-fns";

interface InvoiceRow {
  id: string;
  invoice_number: string;
  status: string;
  kind: string;
  total: number;
  balance_due: number;
  due_date: string;
  issue_date: string;
}

const STATUS_BADGE: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
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

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("invoices")
      .select("id, invoice_number, status, kind, total, balance_due, due_date, issue_date")
      .order("created_at", { ascending: false })
      .limit(100);
    setInvoices((data || []) as InvoiceRow[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const drafts = invoices.filter(i => i.status === "draft");
  const outstanding = invoices.filter(i => ["sent", "partially_paid", "overdue"].includes(i.status));
  const paid = invoices.filter(i => i.status === "paid");

  const totalOutstanding = outstanding.reduce((s, i) => s + Number(i.balance_due || 0), 0);
  const totalCollected = paid.reduce((s, i) => s + Number(i.total || 0), 0);
  const draftValue = drafts.reduce((s, i) => s + Number(i.total || 0), 0);

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Finance Dashboard</h1>
          <p className="text-sm text-muted-foreground">Invoicing, collections, and recurring billing.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={runRecurring} disabled={generating} variant="outline">
            {generating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Repeat className="h-4 w-4 mr-2" />}
            Generate Monthly Recurring
          </Button>
          <Button asChild>
            <Link to="/crm/finance/invoices">All Invoices</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-2"><FileText className="h-4 w-4" /> Drafts</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-semibold">{drafts.length}</div><div className="text-xs text-muted-foreground">₵{draftValue.toLocaleString()}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-2"><AlertCircle className="h-4 w-4" /> Outstanding</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-semibold">{outstanding.length}</div><div className="text-xs text-muted-foreground">₵{totalOutstanding.toLocaleString()}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-2"><Wallet className="h-4 w-4" /> Collected</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-semibold text-green-600 dark:text-green-400">₵{totalCollected.toLocaleString()}</div><div className="text-xs text-muted-foreground">{paid.length} paid invoices</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-2"><Repeat className="h-4 w-4" /> Total</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-semibold">{invoices.length}</div><div className="text-xs text-muted-foreground">last 100 invoices</div></CardContent>
        </Card>
      </div>

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
    </div>
  );
}
