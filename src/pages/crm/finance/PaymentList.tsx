import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, Search } from "lucide-react";
import { format } from "date-fns";

interface PaymentRow {
  id: string;
  amount: number;
  method: string;
  reference: string | null;
  notes: string | null;
  paid_at: string;
  invoice_id: string;
  invoice?: { invoice_number: string; client_id: string | null } | null;
}

export default function PaymentList() {
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("payments")
        .select("id, amount, method, reference, notes, paid_at, invoice_id, invoice:invoices(invoice_number, client_id)")
        .order("paid_at", { ascending: false })
        .limit(500);
      setPayments((data || []) as any);
      setLoading(false);
    })();
  }, []);

  const filtered = payments.filter((p) => {
    if (!q) return true;
    const t = q.toLowerCase();
    return (
      p.invoice?.invoice_number?.toLowerCase().includes(t) ||
      p.reference?.toLowerCase().includes(t) ||
      p.method.toLowerCase().includes(t)
    );
  });

  const total = filtered.reduce((s, p) => s + Number(p.amount || 0), 0);
  const thisMonth = filtered
    .filter((p) => new Date(p.paid_at).getMonth() === new Date().getMonth() && new Date(p.paid_at).getFullYear() === new Date().getFullYear())
    .reduce((s, p) => s + Number(p.amount || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Payments</h1>
          <p className="text-sm text-muted-foreground">All recorded payments across invoices.</p>
        </div>
        <div className="relative">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search invoice, ref, method" className="pl-9 w-72" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Collected</CardTitle></CardHeader><CardContent><div className="text-2xl font-semibold">₵{total.toLocaleString()}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">This Month</CardTitle></CardHeader><CardContent><div className="text-2xl font-semibold text-green-600 dark:text-green-400">₵{thisMonth.toLocaleString()}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Payments Recorded</CardTitle></CardHeader><CardContent><div className="text-2xl font-semibold">{filtered.length}</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Payment History</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No payments yet.</p>
          ) : (
            <div className="space-y-2">
              {filtered.map((p) => (
                <Link key={p.id} to={`/crm/finance/invoices/${p.invoice_id}`} className="flex items-center justify-between p-3 rounded-md border border-border hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm">{p.invoice?.invoice_number ?? "—"}</span>
                    <Badge variant="outline" className="capitalize text-xs">{p.method.replace("_", " ")}</Badge>
                    {p.reference && <span className="text-xs text-muted-foreground">Ref: {p.reference}</span>}
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-muted-foreground">{format(new Date(p.paid_at), "MMM d, yyyy HH:mm")}</span>
                    <span className="font-semibold text-green-600 dark:text-green-400">₵{Number(p.amount).toLocaleString()}</span>
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