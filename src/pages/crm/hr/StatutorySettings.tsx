import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Save } from "lucide-react";

export default function StatutorySettings() {
  const { toast } = useToast();
  const [bands, setBands] = useState<any[]>([]);
  const [rates, setRates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string>("");

  const load = async () => {
    setLoading(true);
    const [{ data: b }, { data: r }] = await Promise.all([
      supabase.from("paye_bands").select("*").order("effective_from", { ascending: false }).order("band_order"),
      supabase.from("statutory_rates").select("*").order("effective_from", { ascending: false }),
    ]);
    setBands(b || []);
    setRates(r || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const updateBand = async (b: any) => {
    setSavingId(b.id);
    const { error } = await supabase.from("paye_bands").update({
      lower_bound: Number(b.lower_bound) || 0,
      upper_bound: b.upper_bound === null || b.upper_bound === "" ? null : Number(b.upper_bound),
      rate_percent: Number(b.rate_percent) || 0,
    }).eq("id", b.id);
    setSavingId("");
    if (error) toast({ title: "Failed", description: error.message, variant: "destructive" });
    else toast({ title: "Updated" });
  };

  const updateRate = async (r: any) => {
    setSavingId(r.id);
    const { error } = await supabase.from("statutory_rates").update({
      ssnit_employee_pct: Number(r.ssnit_employee_pct),
      ssnit_employer_pct: Number(r.ssnit_employer_pct),
      tier2_pct: Number(r.tier2_pct),
    }).eq("id", r.id);
    setSavingId("");
    if (error) toast({ title: "Failed", description: error.message, variant: "destructive" });
    else toast({ title: "Updated" });
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;

  // Group bands by effective_from
  const grouped = bands.reduce((acc: any, b: any) => { (acc[b.effective_from] ||= []).push(b); return acc; }, {});

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Statutory Settings</h1>
        <p className="text-sm text-muted-foreground">GRA PAYE bands, SSNIT, and Tier 2 rates used by payroll calculations.</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">SSNIT &amp; Tier 2 Rates</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {rates.map((r) => (
            <div key={r.id} className="grid grid-cols-2 md:grid-cols-5 gap-3 items-end p-3 rounded border border-border">
              <div><Label>Effective from</Label><Input value={r.effective_from} disabled /></div>
              <div><Label>SSNIT employee %</Label><Input type="number" step="0.01" defaultValue={r.ssnit_employee_pct} onChange={(e) => r.ssnit_employee_pct = e.target.value} /></div>
              <div><Label>SSNIT employer %</Label><Input type="number" step="0.01" defaultValue={r.ssnit_employer_pct} onChange={(e) => r.ssnit_employer_pct = e.target.value} /></div>
              <div><Label>Tier 2 %</Label><Input type="number" step="0.01" defaultValue={r.tier2_pct} onChange={(e) => r.tier2_pct = e.target.value} /></div>
              <Button size="sm" onClick={() => updateRate(r)} disabled={savingId === r.id}><Save className="h-4 w-4 mr-1" /> Save</Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {Object.entries(grouped).map(([eff, bs]: any) => (
        <Card key={eff}>
          <CardHeader><CardTitle className="text-base">PAYE Bands — effective {eff}</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-muted-foreground border-b border-border">
                  <tr><th className="py-2">Band</th><th className="py-2">Lower (₵)</th><th className="py-2">Upper (₵, blank=∞)</th><th className="py-2">Rate %</th><th></th></tr>
                </thead>
                <tbody>
                  {bs.map((b: any) => (
                    <tr key={b.id} className="border-b border-border/60">
                      <td className="py-2">{b.band_order}</td>
                      <td className="py-2"><Input className="w-32" type="number" step="0.01" defaultValue={b.lower_bound} onChange={(e) => b.lower_bound = e.target.value} /></td>
                      <td className="py-2"><Input className="w-32" type="number" step="0.01" defaultValue={b.upper_bound ?? ""} onChange={(e) => b.upper_bound = e.target.value} /></td>
                      <td className="py-2"><Input className="w-24" type="number" step="0.01" defaultValue={b.rate_percent} onChange={(e) => b.rate_percent = e.target.value} /></td>
                      <td className="py-2"><Button size="sm" variant="ghost" onClick={() => updateBand(b)} disabled={savingId === b.id}><Save className="h-4 w-4" /></Button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}