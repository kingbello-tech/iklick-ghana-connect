import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, Loader2, MapPin, Paperclip, Upload, X } from "lucide-react";

const MAX_BYTES = 1024 * 1024; // 1 MB
const ID_TYPES = [
  { value: "ghana_card", label: "Ghana Card" },
  { value: "drivers_license", label: "Driver's License" },
  { value: "passport", label: "Passport" },
];

export default function IntakeForm() {
  const { token } = useParams<{ token: string }>();
  const { toast } = useToast();
  const [checking, setChecking] = useState(true);
  const [valid, setValid] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [locating, setLocating] = useState(false);
  const [idFile, setIdFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    name: "",
    address: "",
    gps_address: "",
    phone: "",
    email: "",
    id_type: "ghana_card",
    bandwidth: "",
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

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > MAX_BYTES) {
      toast({ title: "File too large", description: "Attachments must be 1 MB or smaller.", variant: "destructive" });
      return;
    }
    setIdFile(file);
  };

  const fileToBase64 = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result).split(",")[1] || "");
      reader.onerror = () => reject(new Error("Could not read file"));
      reader.readAsDataURL(file);
    });

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      toast({ title: "Not supported", description: "Geolocation isn't available in this browser.", variant: "destructive" });
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        update("gps_address", `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
        setLocating(false);
      },
      (err) => {
        toast({ title: "Location unavailable", description: err.message, variant: "destructive" });
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim() || !form.email.trim() || !form.gps_address.trim() || !idFile) {
      toast({ title: "Missing info", description: "Name, contact number, email, GPS/coordinates and an ID document are required.", variant: "destructive" });
      return;
    }
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim());
    if (!emailOk) {
      toast({ title: "Invalid email", description: "Please enter a valid email address.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      let identification_file: any = null;
      if (idFile) {
        identification_file = {
          name: idFile.name,
          type: idFile.type || "application/octet-stream",
          size: idFile.size,
          data: await fileToBase64(idFile),
        };
      }
      const { data, error } = await supabase.functions.invoke("submit-intake", {
        body: { token, ...form, identification_file },
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
                <Label htmlFor="gps">GPS address / coordinates *</Label>
                <div className="flex gap-2">
                  <Input id="gps" placeholder="e.g. GA-123-4567 or 5.6037, -0.1870" value={form.gps_address} onChange={(e) => update("gps_address", e.target.value)} required maxLength={100} />
                  <Button type="button" variant="outline" onClick={useMyLocation} disabled={locating}>
                    {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
                    <span className="ml-2 hidden sm:inline">Use my location</span>
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Contact number *</Label>
                  <Input id="phone" type="tel" value={form.phone} onChange={(e) => update("phone", e.target.value)} required maxLength={30} />
                </div>
                <div>
                  <Label htmlFor="email">Email address *</Label>
                  <Input id="email" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} required maxLength={255} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Identification (Ghana Card, Driver's License, Passport) *</Label>
                <Select value={form.id_type} onValueChange={(v) => update("id_type", v)}>
                  <SelectTrigger><SelectValue placeholder="Select ID type" /></SelectTrigger>
                  <SelectContent>
                    {ID_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                {idFile ? (
                  <div className="flex items-center gap-2 p-2 rounded border border-border bg-muted/30">
                    <Paperclip className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{idFile.name}</p>
                      <p className="text-[10px] text-muted-foreground">{(idFile.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <Button type="button" size="icon" variant="ghost" className="h-7 w-7" onClick={() => setIdFile(null)}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ) : (
                  <div>
                    <input id="id_file" type="file" className="hidden" accept="image/*,application/pdf" onChange={onPickFile} required />
                    <Button type="button" size="sm" variant="outline" onClick={() => document.getElementById("id_file")?.click()}>
                      <Upload className="h-3.5 w-3.5 mr-1.5" />Attach ID document *
                    </Button>
                  </div>
                )}
                <p className="text-[10px] text-muted-foreground">Max 1 MB per file. Image or PDF. Required.</p>
              </div>
              <div>
                <Label htmlFor="bandwidth">Bandwidth required</Label>
                <Input id="bandwidth" placeholder="e.g. 100 Mbps, 1 Gbps" value={form.bandwidth} onChange={(e) => update("bandwidth", e.target.value)} maxLength={50} />
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