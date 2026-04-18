import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, Receipt, Search } from "lucide-react";
import { NewInvoiceDialog } from "@/components/crm/NewInvoiceDialog";

interface ClientRow {
  id: string;
  name: string;
  service_type: string;
  email: string | null;
  phone: string | null;
  location: string | null;
}

interface Aggregates {
  invoices: number;
  outstanding: number;
  collected: number;
  hasDeals: boolean;
}

export default function FinanceClients() {
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [agg, setAgg] = useState<Record<string, Aggregates>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [presetClient, setPresetClient] = useState<string | undefined>(undefined);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [{ data: cli }, { data: inv }, { data: dls }] = await Promise.all([
        supabase.from("clients").select("id, name, service_type, email, phone, location").order("name"),
        supabase.from("invoices").select("client_id, status, total, balance_due"),
        supabase.from("deals").select("client_id"),
      ]);
      const map: Record<string, Aggregates> = {};
      const dealClients = new Set((dls || []).map((d: any) => d.client_id).filter(Boolean));
      (cli || []).forEach((c: any) => {
        map[c.id] = { invoices: 0, outstanding: 0, collected: 0, hasDeals: dealClients.has(c.id) };
      });
      (inv || []).forEach((i: any) => {
        if (!i.client_id || !map[i.client_id]) return;
        map[i.client_id].invoices += 1;
        if (i.status === "paid") map[i.client_id].collected += Number(i.total || 0);
        else map[i.client_id].outstanding += Number(i.balance_due || 0);
      });
      setAgg(map);
      setClients((cli || []) as ClientRow[]);
      setLoading(false);
    })();
  }, [refreshKey]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return clients;
    return clients.filter(c =>
      c.name.toLowerCase().includes(q) ||
      (c.email || "").toLowerCase().includes(q) ||
      (c.location || "").toLowerCase().includes(q)
    );
  }, [clients, search]);

  const openInvoiceFor = (clientId: string) => {
    setPresetClient(clientId);
    setDialogOpen(true);
  };

  const openBlankInvoice = () => {
    setPresetClient(undefined);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Clients</h1>
          <p className="text-sm text-muted-foreground">All clients available for invoicing.</p>
        </div>
        <Button onClick={openBlankInvoice}>
          <Plus className="h-4 w-4 mr-2" /> New Invoice
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative max-w-xs flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search clients..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
            <CardTitle className="ml-auto text-sm font-normal text-muted-foreground">
              {filtered.length} client{filtered.length === 1 ? "" : "s"}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No clients match your search.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-muted-foreground">
                  <tr className="border-b border-border">
                    <th className="py-2 pr-4">Client</th>
                    <th className="py-2 pr-4">Type</th>
                    <th className="py-2 pr-4">Contact</th>
                    <th className="py-2 pr-4 text-right">Invoices</th>
                    <th className="py-2 pr-4 text-right">Outstanding</th>
                    <th className="py-2 pr-4 text-right">Collected</th>
                    <th className="py-2 pr-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(c => {
                    const a = agg[c.id] || { invoices: 0, outstanding: 0, collected: 0, hasDeals: false };
                    return (
                      <tr key={c.id} className="border-b border-border hover:bg-muted/50">
                        <td className="py-2 pr-4 font-medium">
                          <div className="flex items-center gap-2">
                            <span>{c.name}</span>
                            {!a.hasDeals && a.invoices === 0 && (
                              <Badge variant="outline" className="text-[10px]">No deals</Badge>
                            )}
                          </div>
                          {c.location && <div className="text-xs text-muted-foreground">{c.location}</div>}
                        </td>
                        <td className="py-2 pr-4 capitalize">{c.service_type}</td>
                        <td className="py-2 pr-4 text-muted-foreground">
                          {c.email || c.phone || "—"}
                        </td>
                        <td className="py-2 pr-4 text-right">{a.invoices}</td>
                        <td className="py-2 pr-4 text-right">
                          {a.outstanding > 0 ? (
                            <span className="text-destructive">₵{a.outstanding.toLocaleString()}</span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="py-2 pr-4 text-right text-green-600 dark:text-green-400">
                          {a.collected > 0 ? `₵${a.collected.toLocaleString()}` : "—"}
                        </td>
                        <td className="py-2 pr-4 text-right">
                          <Button size="sm" variant="outline" onClick={() => openInvoiceFor(c.id)}>
                            <Receipt className="h-3.5 w-3.5 mr-1.5" /> Invoice
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <NewInvoiceDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        defaultClientId={presetClient}
        onCreated={() => setRefreshKey(k => k + 1)}
      />
    </div>
  );
}
