import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, Loader2 } from "lucide-react";

export default function IntakeForm() {
  const { token } = useParams<{ token: string }>();
  const { toast } = useToast();
  const [checking, setChecking] = useState(true);
  const [valid, setValid] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: "",
    address: "",
    gps_address: "",
    phone: "",
    email: "",
    ghana_card_number: "",
    service_type: "residential",
  });

  useEffect(() => {
    document.title = "Service Request — iKlick";
    (async () => {
      if (!token) { setChecking(false); return; }
      const { data } = await (supabase as any).rpc("validate_intake_token", { _token: token });
      const row = Array.isArray(data) ? data[0] : null;
      setValid(!!row && row.active);
      setChecking(false);
    })();
  }, [token]);

  const update = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) {
      toast({ title: "Missing info", description: "Name and contact number are required.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("submit-intake", {
        body: { token, ...form },
      });
      if (error || (data as any)?.error) throw new Error((data as any)?.error || error?.message || "Submission failed");
      setSubmitted(true);
    } catch (err: any) {
      toast({ title: "Submission failed", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!valid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Link unavailable</CardTitle>
            <CardDescription>This intake link is invalid or no longer active. Please contact your iKlick sales representative.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <CheckCircle2 className="h-14 w-14 text-primary mx-auto mb-2" />
            <CardTitle>Submission received</CardTitle>
            <CardDescription>Thank you. Your iKlick representative will reach out shortly.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Service Request Form</h1>
          <p className="text-muted-foreground mt-2">Tell us about the service you need and we'll get back to you.</p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Customer name *</Label>
                <Input id="name" value={form.name} onChange={(e) => update("name", e.target.value)} required maxLength={200} />
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <Input id="address" value={form.address} onChange={(e) => update("address", e.target.value)} maxLength={300} />
              </div>
              <div>
                <Label htmlFor="gps">GPS address</Label>
                <Input id="gps" placeholder="e.g. GA-123-4567" value={form.gps_address} onChange={(e) => update("gps_address", e.target.value)} maxLength={50} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Contact number *</Label>
                  <Input id="phone" type="tel" value={form.phone} onChange={(e) => update("phone", e.target.value)} required maxLength={30} />
                </div>
                <div>
                  <Label htmlFor="email">Email address</Label>
                  <Input id="email" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} maxLength={255} />
                </div>
              </div>
              <div>
                <Label htmlFor="ghana_card">Ghana card no.</Label>
                <Input id="ghana_card" value={form.ghana_card_number} onChange={(e) => update("ghana_card_number", e.target.value)} maxLength={50} />
              </div>
              <div>
                <Label>Service type *</Label>
                <Select value={form.service_type} onValueChange={(v) => update("service_type", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="residential">Residential</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Submitting…</> : "Submit request"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}