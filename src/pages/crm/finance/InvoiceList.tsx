import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
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
  client_id: string | null;
  deal_id: string | null;
}

const STATUS_BADGE: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  paid: "bg-green-500/15 text-green-600 dark:text-green-400",
  partially_paid: "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400",
  overdue: "bg-destructive/15 text-destructive",
  cancelled: "bg-muted text-muted-foreground",
};

export default function InvoiceList() {
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [clients, setClients] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    (async () => {
      const [{ data: inv }, { data: cli }] = await Promise.all([
        supabase.from("invoices").select("*").order("created_at", { ascending: false }),
        supabase.from("clients").select("id, name"),
      ]);
      setInvoices((inv || []) as InvoiceRow[]);
      setClients(Object.fromEntries((cli || []).map((c: any) => [c.id, c.name])));
      setLoading(false);
    })();
  }, []);

  const filtered = invoices.filter(i => {
    if (statusFilter !== "all" && i.status !== statusFilter) return false;
    if (search && !i.invoice_number.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Invoices</h1>
        <p className="text-sm text-muted-foreground">All invoices across all clients and deals.</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-3">
            <Input placeholder="Search invoice #..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="partially_paid">Partially Paid</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <CardTitle className="ml-auto text-sm font-normal text-muted-foreground">{filtered.length} invoice{filtered.length === 1 ? "" : "s"}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No invoices match the current filters.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-muted-foreground">
                  <tr className="border-b border-border">
                    <th className="py-2 pr-4">Invoice #</th>
                    <th className="py-2 pr-4">Client</th>
                    <th className="py-2 pr-4">Kind</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4">Issued</th>
                    <th className="py-2 pr-4">Due</th>
                    <th className="py-2 pr-4 text-right">Total</th>
                    <th className="py-2 pr-4 text-right">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(inv => (
                    <tr key={inv.id} className="border-b border-border hover:bg-muted/50">
                      <td className="py-2 pr-4">
                        <Link to={`/crm/finance/invoices/${inv.id}`} className="font-mono text-primary hover:underline">{inv.invoice_number}</Link>
                      </td>
                      <td className="py-2 pr-4">{inv.client_id ? clients[inv.client_id] || "—" : "—"}</td>
                      <td className="py-2 pr-4 capitalize">{inv.kind}</td>
                      <td className="py-2 pr-4"><Badge className={STATUS_BADGE[inv.status]}>{inv.status.replace("_", " ")}</Badge></td>
                      <td className="py-2 pr-4 text-muted-foreground">{format(new Date(inv.issue_date), "MMM d, yyyy")}</td>
                      <td className="py-2 pr-4 text-muted-foreground">{format(new Date(inv.due_date), "MMM d, yyyy")}</td>
                      <td className="py-2 pr-4 text-right font-medium">₵{Number(inv.total).toLocaleString()}</td>
                      <td className="py-2 pr-4 text-right">₵{Number(inv.balance_due).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
