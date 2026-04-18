import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface NewInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultClientId?: string;
  onCreated?: (invoiceId: string) => void;
}

interface ClientOption {
  id: string;
  name: string;
}

interface DealOption {
  id: string;
  title: string;
  client_id: string | null;
  mrc: number | null;
  nrc: number | null;
}

export function NewInvoiceDialog({ open, onOpenChange, defaultClientId, onCreated }: NewInvoiceDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [clients, setClients] = useState<ClientOption[]>([]);
  const [deals, setDeals] = useState<DealOption[]>([]);
  const [clientId, setClientId] = useState<string>(defaultClientId ?? "");
  const [dealId, setDealId] = useState<string>("none");
  const [kind, setKind] = useState<"one_off" | "initial" | "recurring">("one_off");
  const [mrc, setMrc] = useState<string>("0");
  const [nrc, setNrc] = useState<string>("0");
  const [vatRate, setVatRate] = useState<string>("15");
  const [dueDate, setDueDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().slice(0, 10);
  });
  const [notes, setNotes] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setClientId(defaultClientId ?? "");
    setDealId("none");
    (async () => {
      const [{ data: c }, { data: d }] = await Promise.all([
        supabase.from("clients").select("id, name").order("name"),
        supabase.from("deals").select("id, title, client_id, mrc, nrc").order("created_at", { ascending: false }),
      ]);
      setClients((c || []) as ClientOption[]);
      setDeals((d || []) as DealOption[]);
    })();
  }, [open, defaultClientId]);

  const filteredDeals = clientId ? deals.filter(d => d.client_id === clientId) : [];

  const handleDealChange = (val: string) => {
    setDealId(val);
    if (val !== "none") {
      const d = deals.find(x => x.id === val);
      if (d) {
        if (d.mrc != null) setMrc(String(d.mrc));
        if (d.nrc != null) setNrc(String(d.nrc));
      }
    }
  };

  const subtotal = (Number(mrc) || 0) + (Number(nrc) || 0);
  const vat = +(subtotal * (Number(vatRate) || 0) / 100).toFixed(2);
  const total = +(subtotal + vat).toFixed(2);

  const submit = async () => {
    if (!clientId) {
      toast({ title: "Client required", description: "Please select a client.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const payload: any = {
      client_id: clientId,
      deal_id: dealId === "none" ? null : dealId,
      kind,
      status: "draft",
      mrc_amount: Number(mrc) || 0,
      nrc_amount: Number(nrc) || 0,
      vat_rate: Number(vatRate) || 0,
      due_date: dueDate,
      notes: notes || null,
      created_by: user?.id ?? null,
      invoice_number: "", // trigger fills it
    };
    const { data, error } = await supabase.from("invoices").insert(payload).select("id").single();
    setSubmitting(false);
    if (error) {
      toast({ title: "Failed to create invoice", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Invoice created", description: "Draft invoice ready for review." });
    onOpenChange(false);
    onCreated?.(data.id);
    navigate(`/crm/finance/invoices/${data.id}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>New Invoice</DialogTitle>
          <DialogDescription>Create a draft invoice for any client. A deal is optional.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Client *</Label>
            <Select value={clientId} onValueChange={(v) => { setClientId(v); setDealId("none"); }}>
              <SelectTrigger><SelectValue placeholder="Select a client..." /></SelectTrigger>
              <SelectContent>
                {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Deal (optional)</Label>
            <Select value={dealId} onValueChange={handleDealChange} disabled={!clientId}>
              <SelectTrigger><SelectValue placeholder="No linked deal" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— No linked deal —</SelectItem>
                {filteredDeals.map(d => <SelectItem key={d.id} value={d.id}>{d.title}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Kind</Label>
              <Select value={kind} onValueChange={(v: any) => setKind(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="one_off">One-off</SelectItem>
                  <SelectItem value="initial">Initial</SelectItem>
                  <SelectItem value="recurring">Recurring</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Due date</Label>
              <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>MRC (₵)</Label>
              <Input type="number" min="0" step="0.01" value={mrc} onChange={e => setMrc(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>NRC (₵)</Label>
              <Input type="number" min="0" step="0.01" value={nrc} onChange={e => setNrc(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>VAT %</Label>
              <Input type="number" min="0" step="0.01" value={vatRate} onChange={e => setVatRate(e.target.value)} />
            </div>
          </div>

          <div className="rounded-md border border-border bg-muted/40 p-3 text-sm space-y-1">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>₵{subtotal.toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">VAT</span><span>₵{vat.toLocaleString()}</span></div>
            <div className="flex justify-between font-semibold border-t border-border pt-1"><span>Total</span><span>₵{total.toLocaleString()}</span></div>
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Optional notes shown on the invoice..." />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={submitting || !clientId}>
            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Create Draft Invoice
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
