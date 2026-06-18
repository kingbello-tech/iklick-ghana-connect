import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Calendar, Clock, Video, Loader2, ArrowLeft, CheckCircle2, Copy } from "lucide-react";
import { toast } from "sonner";
import { buildIcs, downloadIcs } from "@/lib/ics";

type Host = {
  id: string;
  slug: string;
  display_name: string;
  title: string | null;
  avatar_url: string | null;
  bio: string | null;
  timezone: string;
  slot_minutes: number;
  buffer_minutes: number;
  advance_notice_hours: number;
  max_days_ahead: number;
};

type Availability = { weekday: number; start_time: string; end_time: string };
type Blackout = { start_at: string; end_at: string };
type BookedSlot = { start_at: string; end_at: string };

function addMinutes(d: Date, m: number) { return new Date(d.getTime() + m * 60_000); }
function startOfDay(d: Date) { const x = new Date(d); x.setHours(0,0,0,0); return x; }
function sameDay(a: Date, b: Date) { return a.toDateString() === b.toDateString(); }
function parseTime(t: string) { const [h,m] = t.split(":").map(Number); return h*60 + m; }

export default function BookMeeting() {
  const { slug } = useParams<{ slug: string }>();
  const [host, setHost] = useState<Host | null>(null);
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [blackouts, setBlackouts] = useState<Blackout[]>([]);
  const [booked, setBooked] = useState<BookedSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(startOfDay(new Date()));
  const [selectedSlot, setSelectedSlot] = useState<Date | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState<{
    bookingId: string;
    cancelToken: string;
    start: Date;
    end: Date;
    teamsUrl: string;
    hostName: string;
  } | null>(null);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      setLoading(true);
      const { data: hostRow, error } = await supabase
        .from("meeting_hosts")
        .select("id, slug, display_name, title, avatar_url, bio, timezone, slot_minutes, buffer_minutes, advance_notice_hours, max_days_ahead")
        .eq("slug", slug)
        .eq("is_active", true)
        .maybeSingle();
      if (error || !hostRow) { setNotFound(true); setLoading(false); return; }
      setHost(hostRow as Host);

      const horizon = addMinutes(new Date(), hostRow.max_days_ahead * 24 * 60).toISOString();
      const [{ data: av }, { data: bl }, { data: bk }] = await Promise.all([
        supabase.from("meeting_availability").select("weekday, start_time, end_time").eq("host_id", hostRow.id),
        supabase.from("meeting_blackouts").select("start_at, end_at").eq("host_id", hostRow.id).lte("start_at", horizon),
        supabase.from("meeting_booked_slots").select("start_at, end_at").eq("host_id", hostRow.id),
      ]);
      setAvailability((av ?? []) as Availability[]);
      setBlackouts((bl ?? []) as Blackout[]);
      setBooked((bk ?? []) as BookedSlot[]);
      setLoading(false);
    })();
  }, [slug]);

  const days = useMemo(() => {
    if (!host) return [];
    const out: Date[] = [];
    const today = startOfDay(new Date());
    for (let i = 0; i < Math.min(host.max_days_ahead, 14); i++) {
      out.push(addMinutes(today, i * 24 * 60));
    }
    return out;
  }, [host]);

  const slots = useMemo(() => {
    if (!host) return [];
    const weekday = selectedDate.getDay();
    const windows = availability.filter(a => a.weekday === weekday);
    if (!windows.length) return [];
    const result: Date[] = [];
    const earliest = addMinutes(new Date(), host.advance_notice_hours * 60);
    for (const w of windows) {
      const startMin = parseTime(w.start_time);
      const endMin = parseTime(w.end_time);
      for (let m = startMin; m + host.slot_minutes <= endMin; m += host.slot_minutes) {
        const slot = new Date(selectedDate);
        slot.setHours(0, m, 0, 0);
        const slotEnd = addMinutes(slot, host.slot_minutes);
        if (slot < earliest) continue;
        const bufMs = host.buffer_minutes * 60_000;
        const conflict = booked.some(b => {
          const bs = new Date(b.start_at).getTime();
          const be = new Date(b.end_at).getTime();
          return bs < slotEnd.getTime() + bufMs && be > slot.getTime() - bufMs;
        }) || blackouts.some(b => {
          const bs = new Date(b.start_at).getTime();
          const be = new Date(b.end_at).getTime();
          return bs < slotEnd.getTime() && be > slot.getTime();
        });
        if (!conflict) result.push(slot);
      }
    }
    return result;
  }, [host, availability, blackouts, booked, selectedDate]);

  const handleBook = async () => {
    if (!host || !selectedSlot) return;
    if (!name.trim() || !email.trim()) { toast.error("Name and email are required"); return; }
    setSubmitting(true);
    const { data, error } = await supabase.rpc("book_meeting", {
      _slug: host.slug,
      _start_at: selectedSlot.toISOString(),
      _guest_name: name.trim(),
      _guest_email: email.trim(),
      _notes: notes.trim() || null,
    });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    const row = Array.isArray(data) ? data[0] : data;
    if (!row) { toast.error("Booking failed"); return; }
    setConfirmation({
      bookingId: row.booking_id,
      cancelToken: row.cancel_token,
      start: selectedSlot,
      end: new Date(row.end_at),
      teamsUrl: row.teams_join_url,
      hostName: row.display_name,
    });
    // Fire-and-forget email notification to host
    supabase.functions.invoke("meeting-emails", {
      body: {
        type: "host_pending",
        booking_id: row.booking_id,
        app_origin: window.location.origin,
      },
    }).catch((e) => console.warn("notify host failed", e));
  };

  const downloadCalendar = () => {
    if (!confirmation) return;
    const ics = buildIcs({
      uid: confirmation.bookingId,
      start: confirmation.start,
      end: confirmation.end,
      summary: `Meeting with ${confirmation.hostName}`,
      description: `Join via Microsoft Teams: ${confirmation.teamsUrl}\n\nReschedule or cancel: ${window.location.origin}/booking/${confirmation.cancelToken}`,
      location: confirmation.teamsUrl,
      organizerName: confirmation.hostName,
      attendeeName: name,
      attendeeEmail: email,
    });
    downloadIcs(`meeting-${confirmation.hostName.replace(/\s+/g,"-").toLowerCase()}.ics`, ics);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  if (notFound || !host) return (
    <div className="min-h-screen flex items-center justify-center px-4 text-center">
      <div>
        <h1 className="text-2xl font-semibold mb-2">Meeting link not found</h1>
        <p className="text-muted-foreground">This booking page is no longer available.</p>
      </div>
    </div>
  );

  if (confirmation) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-lg w-full p-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-emerald-500" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">You're booked!</h1>
              <p className="text-sm text-muted-foreground">A confirmation is on its way.</p>
            </div>
          </div>
          <div className="rounded-lg border p-4 space-y-3 text-sm">
            <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground" /><span>{confirmation.start.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</span></div>
            <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-muted-foreground" /><span>{confirmation.start.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })} – {confirmation.end.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })} ({host.timezone})</span></div>
            <div className="flex items-center gap-2"><Video className="h-4 w-4 text-muted-foreground" /><span>Microsoft Teams</span></div>
          </div>
          <div className="space-y-2">
            <a href={confirmation.teamsUrl} target="_blank" rel="noreferrer" className="block">
              <Button className="w-full" size="lg"><Video className="h-4 w-4 mr-2" />Join Teams meeting</Button>
            </a>
            <Button variant="outline" className="w-full" onClick={downloadCalendar}><Calendar className="h-4 w-4 mr-2" />Add to calendar (.ics)</Button>
            <Button variant="ghost" className="w-full" onClick={() => { navigator.clipboard.writeText(confirmation.teamsUrl); toast.success("Link copied"); }}><Copy className="h-4 w-4 mr-2" />Copy meeting link</Button>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Need to cancel? <Link to={`/booking/${confirmation.cancelToken}`} className="underline">Manage booking</Link>
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <Card className="overflow-hidden">
          <div className="grid md:grid-cols-[280px,1fr]">
            <div className="bg-muted/40 p-6 border-r">
              {host.avatar_url ? (
                <img src={host.avatar_url} alt={host.display_name} className="h-20 w-20 rounded-full object-cover mb-4" />
              ) : (
                <div className="h-20 w-20 rounded-full bg-primary/20 flex items-center justify-center text-2xl font-semibold text-primary mb-4">
                  {host.display_name[0]}
                </div>
              )}
              <h1 className="text-xl font-semibold">{host.display_name}</h1>
              {host.title && <p className="text-sm text-muted-foreground mt-1">{host.title}</p>}
              {host.bio && <p className="text-sm mt-4 text-muted-foreground">{host.bio}</p>}
              <div className="mt-6 space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2"><Clock className="h-4 w-4" />{host.slot_minutes} minutes</div>
                <div className="flex items-center gap-2"><Video className="h-4 w-4" />Microsoft Teams</div>
              </div>
            </div>
            <div className="p-6">
              {!selectedSlot ? (
                <>
                  <h2 className="font-semibold mb-3">Select a date</h2>
                  <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
                    {days.map(d => {
                      const active = sameDay(d, selectedDate);
                      return (
                        <button key={d.toISOString()} onClick={() => setSelectedDate(d)}
                          className={`flex-shrink-0 px-3 py-2 rounded-md border text-center min-w-[60px] ${active ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted"}`}>
                          <div className="text-[10px] uppercase">{d.toLocaleDateString(undefined,{weekday:"short"})}</div>
                          <div className="font-semibold">{d.getDate()}</div>
                        </button>
                      );
                    })}
                  </div>
                  <h2 className="font-semibold mb-3">{selectedDate.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</h2>
                  {slots.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No available times on this day.</p>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {slots.map(s => (
                        <button key={s.toISOString()} onClick={() => setSelectedSlot(s)}
                          className="px-3 py-2 rounded-md border hover:border-primary hover:bg-primary/5 text-sm">
                          {s.toLocaleTimeString(undefined,{ hour:"2-digit", minute:"2-digit" })}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <button onClick={() => setSelectedSlot(null)} className="text-sm text-muted-foreground inline-flex items-center gap-1 mb-4 hover:text-foreground">
                    <ArrowLeft className="h-3 w-3" /> Back to times
                  </button>
                  <h2 className="font-semibold mb-1">Confirm your details</h2>
                  <p className="text-sm text-muted-foreground mb-4">
                    {selectedSlot.toLocaleDateString(undefined,{ weekday:"long", month:"long", day:"numeric" })} at {selectedSlot.toLocaleTimeString(undefined,{ hour:"2-digit", minute:"2-digit" })}
                  </p>
                  <div className="space-y-3">
                    <div><Label htmlFor="n">Name</Label><Input id="n" value={name} onChange={e=>setName(e.target.value)} /></div>
                    <div><Label htmlFor="e">Email</Label><Input id="e" type="email" value={email} onChange={e=>setEmail(e.target.value)} /></div>
                    <div><Label htmlFor="notes">Notes (optional)</Label><Textarea id="notes" value={notes} onChange={e=>setNotes(e.target.value)} rows={3} /></div>
                    <Button onClick={handleBook} disabled={submitting} className="w-full" size="lg">
                      {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                      Confirm booking
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </Card>
        <p className="text-center text-xs text-muted-foreground mt-4">
          Powered by iKlick · meet.iklickgh.com
        </p>
      </div>
    </div>
  );
}