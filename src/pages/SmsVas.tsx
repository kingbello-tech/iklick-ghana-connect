import { useMemo, useState } from "react";
import { MessageSquare, Zap, ShieldCheck, BarChart3, Code2, Users, Check, Copy, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Indicative tiered rates (GHS per SMS) — placeholder until official pricing is confirmed.
export const SMS_TIERS = [
  { min: 0, max: 9_999, rate: 0.045, label: "Starter" },
  { min: 10_000, max: 99_999, rate: 0.038, label: "Growth" },
  { min: 100_000, max: 499_999, rate: 0.032, label: "Business" },
  { min: 500_000, max: Infinity, rate: 0.027, label: "Enterprise" },
];
export const tierFor = (v: number) => SMS_TIERS.find((t) => v >= t.min && v <= t.max)!;

const features = [
  { icon: Zap, title: "Fast delivery", text: "Direct routes to MTN, Telecel and AT for messages delivered in seconds." },
  { icon: ShieldCheck, title: "Registered sender IDs", text: "Send under your own brand name, registered and approved for you." },
  { icon: BarChart3, title: "Delivery reports", text: "Track every message: sent, delivered or failed, in real time." },
  { icon: Code2, title: "Simple API", text: "Connect your app, website or system with a few lines of code." },
  { icon: Users, title: "Contact groups", text: "Upload lists and send personalised campaigns to thousands at once." },
  { icon: MessageSquare, title: "Value-added services", text: "USSD menus, short codes, OTPs and two-way SMS for your customers." },
];

const useCases = ["Alerts & notifications", "OTP / verification", "Marketing campaigns", "Reminders & billing", "USSD / short code", "Other"];

const snippets: Record<string, string> = {
  curl: `curl -X POST https://api.iklickgh.com/v1/sms/send \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "sender": "IKLICK",
    "to": ["233241234567"],
    "message": "Your order #1042 has shipped."
  }'`,
  javascript: `const res = await fetch("https://api.iklickgh.com/v1/sms/send", {
  method: "POST",
  headers: {
    Authorization: "Bearer YOUR_API_KEY",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    sender: "IKLICK",
    to: ["233241234567"],
    message: "Your order #1042 has shipped.",
  }),
});
const data = await res.json();`,
  python: `import requests

r = requests.post(
    "https://api.iklickgh.com/v1/sms/send",
    headers={"Authorization": "Bearer YOUR_API_KEY"},
    json={
        "sender": "IKLICK",
        "to": ["233241234567"],
        "message": "Your order #1042 has shipped.",
    },
)
print(r.json())`,
};
const sampleResponse = `{
  "status": "accepted",
  "message_id": "msg_8f3a21c9",
  "recipients": 1,
  "segments": 1
}`;

const fmt = (n: number) => n.toLocaleString("en-GH", { maximumFractionDigits: 2 });

export default function SmsVas() {
  const [volume, setVolume] = useState(25_000);
  const [segments, setSegments] = useState(1);
  const [lang, setLang] = useState<keyof typeof snippets>("curl");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: "", company: "", email: "", phone: "", use_case: "", message: "", website: "" });

  const tier = tierFor(volume);
  const total = useMemo(() => volume * segments * tier.rate, [volume, segments, tier]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.phone) return toast.error("Please fill in name, email and phone.");
    setSending(true);
    const { data, error } = await supabase.functions.invoke("sms-inquiry", {
      body: { ...form, monthly_volume: volume * segments },
    });
    setSending(false);
    if (error || data?.error) return toast.error(data?.error || "Could not send your inquiry. Please try again.");
    setSent(true);
    toast.success("Thanks! Our sales team will contact you shortly.");
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <section className="pt-32 pb-16 container mx-auto px-4 text-center">
        <span className="inline-block rounded-full border border-border px-3 py-1 text-xs uppercase tracking-wider text-muted-foreground mb-4">SMS & Value-Added Services</span>
        <h1 className="text-4xl md:text-6xl font-bold max-w-4xl mx-auto leading-tight">Reach every customer, <span className="text-primary">instantly</span>.</h1>
        <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">Bulk SMS, OTPs, USSD and short codes on reliable Ghanaian networks — with a simple API and real-time delivery reports.</p>
        <div className="mt-8 flex flex-wrap gap-3 justify-center">
          <Button size="lg" asChild><a href="#inquiry">Get started</a></Button>
          <Button size="lg" variant="outline" asChild><a href="#calculator">Estimate cost</a></Button>
        </div>
      </section>

      <section className="container mx-auto px-4 pb-20 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {features.map(({ icon: Icon, title, text }) => (
          <div key={title} className="rounded-2xl border border-border bg-card p-6">
            <Icon className="h-6 w-6 text-primary mb-4" />
            <h3 className="font-semibold text-lg">{title}</h3>
            <p className="text-muted-foreground mt-2 text-sm">{text}</p>
          </div>
        ))}
      </section>

      <section id="calculator" className="container mx-auto px-4 pb-20 scroll-mt-24">
        <div className="rounded-3xl border border-border bg-card p-6 md:p-10 grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-bold">Volume calculator</h2>
            <p className="text-muted-foreground mt-2">The more you send, the less each message costs.</p>
            <div className="mt-8 space-y-8">
              <div>
                <div className="flex justify-between mb-3"><Label>Messages per month</Label><span className="font-semibold">{fmt(volume)}</span></div>
                <Slider min={1000} max={1_000_000} step={1000} value={[volume]} onValueChange={([v]) => setVolume(v)} />
                <Input type="number" min={0} className="mt-3" value={volume} onChange={(e) => setVolume(Math.max(0, Number(e.target.value) || 0))} aria-label="Messages per month" />
              </div>
              <div>
                <Label>Message length</Label>
                <Select value={String(segments)} onValueChange={(v) => setSegments(Number(v))}>
                  <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Up to 160 characters (1 part)</SelectItem>
                    <SelectItem value="2">Up to 306 characters (2 parts)</SelectItem>
                    <SelectItem value="3">Up to 459 characters (3 parts)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div className="rounded-2xl bg-muted p-6 flex flex-col">
            <p className="text-sm text-muted-foreground">Your plan</p>
            <p className="text-2xl font-bold">{tier.label}</p>
            <p className="mt-6 text-sm text-muted-foreground">Estimated monthly cost</p>
            <p className="text-5xl font-bold text-primary">GHS {fmt(total)}</p>
            <p className="mt-2 text-sm text-muted-foreground">GHS {tier.rate.toFixed(3)} per message part · {fmt(volume * segments)} parts</p>
            <div className="mt-6 space-y-2 text-sm">
              {SMS_TIERS.map((t) => (
                <div key={t.label} className={`flex justify-between rounded-lg px-3 py-2 ${t === tier ? "bg-background font-semibold" : ""}`}>
                  <span>{t.label} ({fmt(t.min)}{t.max === Infinity ? "+" : `–${fmt(t.max)}`})</span>
                  <span>GHS {t.rate.toFixed(3)}</span>
                </div>
              ))}
            </div>
            <p className="mt-auto pt-6 text-xs text-muted-foreground">Indicative pricing. Final rates are confirmed in your quote.</p>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 pb-20">
        <h2 className="text-3xl font-bold">Developer-friendly API</h2>
        <p className="text-muted-foreground mt-2">Send your first message in minutes. API keys are issued when your account is set up.</p>
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="flex items-center gap-1 border-b border-border p-2">
              {(Object.keys(snippets) as (keyof typeof snippets)[]).map((k) => (
                <Button key={k} size="sm" variant={lang === k ? "secondary" : "ghost"} onClick={() => setLang(k)}>{k}</Button>
              ))}
              <Button size="icon" variant="ghost" className="ml-auto" aria-label="Copy code"
                onClick={() => { navigator.clipboard.writeText(snippets[lang]); toast.success("Copied"); }}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <pre className="p-4 text-xs md:text-sm overflow-x-auto"><code>{snippets[lang]}</code></pre>
          </div>
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="border-b border-border p-3 text-sm text-muted-foreground">Response · 200 OK</div>
            <pre className="p-4 text-xs md:text-sm overflow-x-auto"><code>{sampleResponse}</code></pre>
          </div>
        </div>
      </section>

      <section id="inquiry" className="container mx-auto px-4 pb-24 scroll-mt-24">
        <div className="rounded-3xl border border-border bg-card p-6 md:p-10 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold">Talk to our team</h2>
          <p className="text-muted-foreground mt-2">Tell us what you need and we'll send you a quote.</p>
          {sent ? (
            <div className="mt-8 flex items-center gap-3 rounded-xl bg-muted p-6"><Check className="h-6 w-6 text-primary" /> Thanks, {form.name.split(" ")[0]}! A sales rep will be in touch shortly.</div>
          ) : (
            <form onSubmit={submit} className="mt-8 grid gap-4 sm:grid-cols-2">
              <div><Label htmlFor="n">Full name *</Label><Input id="n" maxLength={200} value={form.name} onChange={set("name")} required /></div>
              <div><Label htmlFor="c">Company</Label><Input id="c" maxLength={200} value={form.company} onChange={set("company")} /></div>
              <div><Label htmlFor="e">Email *</Label><Input id="e" type="email" maxLength={255} value={form.email} onChange={set("email")} required /></div>
              <div><Label htmlFor="p">Phone *</Label><Input id="p" type="tel" maxLength={40} value={form.phone} onChange={set("phone")} required /></div>
              <div className="sm:col-span-2">
                <Label>Use case</Label>
                <Select value={form.use_case} onValueChange={(v) => setForm((f) => ({ ...f, use_case: v }))}>
                  <SelectTrigger className="mt-2"><SelectValue placeholder="Choose one" /></SelectTrigger>
                  <SelectContent>{useCases.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2"><Label htmlFor="m">Message</Label><Textarea id="m" maxLength={2000} value={form.message} onChange={set("message")} /></div>
              <input type="text" tabIndex={-1} autoComplete="off" className="hidden" value={form.website} onChange={set("website")} aria-hidden="true" />
              <p className="sm:col-span-2 text-sm text-muted-foreground">Estimated volume from the calculator: <strong>{fmt(volume * segments)}</strong> message parts/month.</p>
              <Button type="submit" size="lg" className="sm:col-span-2" disabled={sending}>
                {sending && <Loader2 className="h-4 w-4 animate-spin" />} Send inquiry
              </Button>
            </form>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
