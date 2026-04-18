import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Loader2, ArrowLeft, Send, Plus, Printer } from "lucide-react";
import { format } from "date-fns";

const STATUS_BADGE: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  paid: "bg-green-500/15 text-green-600 dark:text-green-400",
  partially_paid: "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400",
  overdue: "bg-destructive/15 text-destructive",
  cancelled: "bg-muted text-muted-foreground",
};

export default function InvoiceDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [invoice, setInvoice] = useState<any>(null);
  const [client, setClient] = useState<any>(null);
  const [deal, setDeal] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("bank_transfer");
  const [payRef, setPayRef] = useState("");
  const [payNotes, setPayNotes] = useState("");

  const load = async () => {
    if (!id) return;
    setLoading(true);
    const { data: inv } = await supabase.from("invoices").select("*").eq("id", id).maybeSingle();
    setInvoice(inv);
    if (inv?.client_id) {
      const { data: c } = await supabase.from("clients").select("*").eq("id", inv.client_id).maybeSingle();
      setClient(c);
    }
    if (inv?.deal_id) {
      const { data: d } = await supabase.from("deals").select("id, title, mrc, nrc").eq("id", inv.deal_id).maybeSingle();
      setDeal(d);
    }
    const { data: pays } = await supabase.from("payments").select("*").eq("invoice_id", id).order("paid_at", { ascending: false });
    setPayments(pays || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  const updateStatus = async (status: string) => {
    if (!invoice) return;
    setUpdating(true);
    const { error } = await supabase.from("invoices").update({ status: status as any }).eq("id", invoice.id);
    setUpdating(false);
    if (error) {
      toast({ title: "Failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Updated", description: `Invoice status changed to ${status}.` });
    load();
  };

  const recordPayment = async () => {
    if (!invoice || !user) return;
    const amt = parseFloat(payAmount);
    if (!amt || amt <= 0) {
      toast({ title: "Invalid amount", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("payments").insert({
      invoice_id: invoice.id,
      amount: amt,
      method: payMethod as any,
      reference: payRef || null,
      notes: payNotes || null,
      recorded_by: user.id,
    });
    if (error) {
      toast({ title: "Failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Payment recorded" });
    setPayDialogOpen(false);
    setPayAmount(""); setPayRef(""); setPayNotes("");
    load();
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  if (!invoice) return <p className="text-sm text-muted-foreground">Invoice not found.</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3 print:hidden">
        <Button asChild variant="ghost" size="sm">
          <Link to="/crm/finance/invoices"><ArrowLeft className="h-4 w-4 mr-1" /> All Invoices</Link>
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => window.print()}><Printer className="h-4 w-4 mr-1" /> Print</Button>
          {invoice.status === "draft" && (
            <Button onClick={() => updateStatus("sent")} disabled={updating} size="sm">
              <Send className="h-4 w-4 mr-1" /> Send to Client
            </Button>
          )}
          {["sent", "partially_paid", "overdue"].includes(invoice.status) && (
            <Dialog open={payDialogOpen} onOpenChange={setPayDialogOpen}>
              <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Record Payment</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Record Payment</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label>Amount (₵)</Label><Input type="number" step="0.01" value={payAmount} onChange={e => setPayAmount(e.target.value)} placeholder={String(invoice.balance_due)} /></div>
                  <div><Label>Method</Label>
                    <Select value={payMethod} onValueChange={setPayMethod}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        <SelectItem value="mobile_money">Mobile Money</SelectItem>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="cheque">Cheque</SelectItem>
                        <SelectItem value="card">Card</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Reference</Label><Input value={payRef} onChange={e => setPayRef(e.target.value)} placeholder="Transaction ID, cheque #, etc." /></div>
                  <div><Label>Notes</Label><Textarea value={payNotes} onChange={e => setPayNotes(e.target.value)} rows={2} /></div>
                </div>
                <DialogFooter><Button onClick={recordPayment}>Record</Button></DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Invoice document */}
      <Card>
        <CardContent className="p-8 space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold">INVOICE</h1>
              <p className="font-mono text-muted-foreground mt-1">{invoice.invoice_number}</p>
              <Badge className={`${STATUS_BADGE[invoice.status]} mt-2 capitalize`}>{invoice.status.replace("_", " ")}</Badge>
            </div>
            <div className="text-right">
              <p className="font-bold text-lg">iKlick Communications</p>
              <p className="text-sm text-muted-foreground">finance@iklickgh.com</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 pt-4 border-t border-border">
            <div>
              <p className="text-xs uppercase text-muted-foreground mb-1">Bill To</p>
              <p className="font-medium">{client?.name || "—"}</p>
              {client?.email && <p className="text-sm text-muted-foreground">{client.email}</p>}
              {client?.phone && <p className="text-sm text-muted-foreground">{client.phone}</p>}
              {client?.location && <p className="text-sm text-muted-foreground">{client.location}</p>}
            </div>
            <div className="text-right space-y-1">
              <div className="flex justify-end gap-4"><span className="text-muted-foreground text-sm">Issue Date:</span><span className="text-sm">{format(new Date(invoice.issue_date), "MMM d, yyyy")}</span></div>
              <div className="flex justify-end gap-4"><span className="text-muted-foreground text-sm">Due Date:</span><span className="text-sm">{format(new Date(invoice.due_date), "MMM d, yyyy")}</span></div>
              {invoice.period_start && <div className="flex justify-end gap-4"><span className="text-muted-foreground text-sm">Period:</span><span className="text-sm">{format(new Date(invoice.period_start), "MMM d")} – {format(new Date(invoice.period_end), "MMM d, yyyy")}</span></div>}
              <div className="flex justify-end gap-4"><span className="text-muted-foreground text-sm">Kind:</span><span className="text-sm capitalize">{invoice.kind}</span></div>
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <table className="w-full text-sm">
              <thead className="text-left">
                <tr className="border-b border-border"><th className="py-2">Description</th><th className="py-2 text-right">Amount</th></tr>
              </thead>
              <tbody>
                {Number(invoice.nrc_amount) > 0 && (
                  <tr className="border-b border-border"><td className="py-3">Non-Recurring Charge {deal && `– ${deal.title}`}</td><td className="py-3 text-right">₵{Number(invoice.nrc_amount).toLocaleString()}</td></tr>
                )}
                {Number(invoice.mrc_amount) > 0 && (
                  <tr className="border-b border-border"><td className="py-3">Monthly Recurring Charge {deal && `– ${deal.title}`}</td><td className="py-3 text-right">₵{Number(invoice.mrc_amount).toLocaleString()}</td></tr>
                )}
              </tbody>
              <tfoot>
                <tr><td className="py-2 text-right text-muted-foreground">Subtotal</td><td className="py-2 text-right">₵{Number(invoice.subtotal).toLocaleString()}</td></tr>
                <tr><td className="py-2 text-right text-muted-foreground">VAT ({invoice.vat_rate}%)</td><td className="py-2 text-right">₵{Number(invoice.vat_amount).toLocaleString()}</td></tr>
                <tr className="border-t border-border font-bold text-lg"><td className="py-3 text-right">Total</td><td className="py-3 text-right">₵{Number(invoice.total).toLocaleString()}</td></tr>
                {Number(invoice.amount_paid) > 0 && (
                  <>
                    <tr><td className="py-1 text-right text-muted-foreground">Paid</td><td className="py-1 text-right text-green-600 dark:text-green-400">−₵{Number(invoice.amount_paid).toLocaleString()}</td></tr>
                    <tr className="font-semibold"><td className="py-1 text-right">Balance Due</td><td className="py-1 text-right">₵{Number(invoice.balance_due).toLocaleString()}</td></tr>
                  </>
                )}
              </tfoot>
            </table>
          </div>

          {invoice.notes && (
            <div className="border-t border-border pt-4">
              <p className="text-xs uppercase text-muted-foreground mb-1">Notes</p>
              <p className="text-sm">{invoice.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="print:hidden">
        <CardHeader><CardTitle className="text-base">Payment History</CardTitle></CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No payments recorded yet.</p>
          ) : (
            <div className="space-y-2">
              {payments.map(p => (
                <div key={p.id} className="flex justify-between items-center p-3 rounded border border-border">
                  <div>
                    <p className="font-medium">₵{Number(p.amount).toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground capitalize">{p.method.replace("_", " ")}{p.reference && ` · ${p.reference}`}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">{format(new Date(p.paid_at), "MMM d, yyyy HH:mm")}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
