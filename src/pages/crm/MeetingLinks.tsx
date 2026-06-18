import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Loader2, Copy, ExternalLink, Plus, Trash2, Calendar as CalIcon } from "lucide-react";
import { toast } from "sonner";

type Host = {
  id: string;
  user_id: string;
  slug: string;
  display_name: string;
  title: string | null;
  teams_join_url: string;
  timezone: string;
  slot_minutes: number;
  buffer_minutes: number;
  advance_notice_hours: number;
  max_days_ahead: number;
  avatar_url: string | null;
  bio: string | null;
  is_active: boolean;
};
type Avail = { id?: string; weekday: number; start_time: string; end_time: string };
type Booking = { id: string; start_at: string; end_at: string; guest_name: string; guest_email: string; status: string; notes: string | null };

const WEEKDAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const DEFAULT_AVAIL: Avail[] = [1,2,3,4,5].map(w => ({ weekday: w, start_time: "09:00", end_time: "17:00" }));

export default function MeetingLinks() {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [host, setHost] = useState<Host | null>(null);
  const [avail, setAvail] = useState<Avail[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);

  // form fields
  const [slug, setSlug] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [title, setTitle] = useState("");
  const [teamsUrl, setTeamsUrl] = useState("");
  const [bio, setBio] = useState("");
  const [slotMinutes, setSlotMinutes] = useState(30);
  const [bufferMinutes, setBufferMinutes] = useState(0);
  const [advanceHours, setAdvanceHours] = useState(2);
  const [maxDays, setMaxDays] = useState(30);
  const [active, setActive] = useState(true);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data: hostRow } = await supabase
      .from("meeting_hosts")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    if (hostRow) {
      setHost(hostRow as Host);
      setSlug(hostRow.slug);
      setDisplayName(hostRow.display_name);
      setTitle(hostRow.title ?? "");
      setTeamsUrl(hostRow.teams_join_url);
      setBio(hostRow.bio ?? "");
      setSlotMinutes(hostRow.slot_minutes);
      setBufferMinutes(hostRow.buffer_minutes);
      setAdvanceHours(hostRow.advance_notice_hours);
      setMaxDays(hostRow.max_days_ahead);
      setActive(hostRow.is_active);
      const [{ data: av }, { data: bk }] = await Promise.all([
        supabase.from("meeting_availability").select("*").eq("host_id", hostRow.id).order("weekday"),
        supabase.from("meeting_bookings").select("id,start_at,end_at,guest_name,guest_email,status,notes").eq("host_id", hostRow.id).order("start_at", { ascending: false }).limit(50),
      ]);
      setAvail((av ?? []) as Avail[]);
      setBookings((bk ?? []) as Booking[]);
    } else {
      setDisplayName(profile?.full_name ?? "");
      setSlug((profile?.full_name ?? "").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,""));
      setAvail(DEFAULT_AVAIL);
    }
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [user?.id]);

  const saveProfile = async () => {
    if (!user) return;
    if (!slug.match(/^[a-z0-9-]{2,40}$/)) { toast.error("Slug must be 2–40 lowercase letters, numbers, or hyphens"); return; }
    if (!teamsUrl.startsWith("https://")) { toast.error("Teams URL must start with https://"); return; }
    setSaving(true);
    const payload = {
      user_id: user.id,
      slug, display_name: displayName, title: title || null,
      teams_join_url: teamsUrl, bio: bio || null,
      slot_minutes: slotMinutes, buffer_minutes: bufferMinutes,
      advance_notice_hours: advanceHours, max_days_ahead: maxDays,
      is_active: active,
    };
    const { data, error } = await supabase
      .from("meeting_hosts")
      .upsert(payload, { onConflict: "user_id" })
      .select()
      .single();
    if (error) { toast.error(error.message); setSaving(false); return; }
    const hostId = (data as Host).id;
    // sync availability — easiest: delete + reinsert
    await supabase.from("meeting_availability").delete().eq("host_id", hostId);
    if (avail.length) {
      const rows = avail.map(a => ({ host_id: hostId, weekday: a.weekday, start_time: a.start_time, end_time: a.end_time }));
      const { error: avErr } = await supabase.from("meeting_availability").insert(rows);
      if (avErr) { toast.error("Availability: " + avErr.message); }
    }
    toast.success("Saved");
    setSaving(false);
    load();
  };

  const addRow = () => setAvail([...avail, { weekday: 1, start_time: "09:00", end_time: "17:00" }]);
  const removeRow = (i: number) => setAvail(avail.filter((_,idx) => idx !== i));
  const updateRow = (i: number, k: keyof Avail, v: any) => setAvail(avail.map((r,idx) => idx===i ? { ...r, [k]: v } : r));

  const publicUrl = slug ? `${window.location.origin}/${slug}` : "";
  const brandedUrl = slug ? `https://meet.iklickgh.com/${slug}` : "";

  if (loading) return <div className="p-8 flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading…</div>;

  return (
    <div className="p-6 max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Meeting Link</h1>
        <p className="text-sm text-muted-foreground">Share a single link for people to book time with you on Microsoft Teams.</p>
      </div>

      {host && (
        <Card className="p-5 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
          <div className="space-y-1 min-w-0">
            <p className="text-xs uppercase text-muted-foreground tracking-wider">Your branded link</p>
            <p className="font-mono text-sm truncate">{brandedUrl}</p>
            <p className="text-xs text-muted-foreground truncate">Live now at: {publicUrl}</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(brandedUrl); toast.success("Copied"); }}><Copy className="h-3 w-3 mr-1" />Copy</Button>
            <a href={publicUrl} target="_blank" rel="noreferrer"><Button variant="outline" size="sm"><ExternalLink className="h-3 w-3 mr-1" />Preview</Button></a>
          </div>
        </Card>
      )}

      <Card className="p-6 space-y-4">
        <h2 className="font-semibold">Profile</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div><Label>Slug</Label><Input value={slug} onChange={e=>setSlug(e.target.value.toLowerCase())} placeholder="john-doe" /></div>
          <div><Label>Display name</Label><Input value={displayName} onChange={e=>setDisplayName(e.target.value)} /></div>
          <div><Label>Title</Label><Input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Account Manager" /></div>
          <div><Label>Teams meeting URL</Label><Input value={teamsUrl} onChange={e=>setTeamsUrl(e.target.value)} placeholder="https://teams.microsoft.com/l/meetup-join/..." /></div>
          <div className="sm:col-span-2"><Label>Short bio</Label><Textarea value={bio} onChange={e=>setBio(e.target.value)} rows={2} /></div>
        </div>
        <div className="grid sm:grid-cols-4 gap-4">
          <div><Label>Slot length (min)</Label><Input type="number" value={slotMinutes} onChange={e=>setSlotMinutes(parseInt(e.target.value)||30)} /></div>
          <div><Label>Buffer (min)</Label><Input type="number" value={bufferMinutes} onChange={e=>setBufferMinutes(parseInt(e.target.value)||0)} /></div>
          <div><Label>Min notice (hrs)</Label><Input type="number" value={advanceHours} onChange={e=>setAdvanceHours(parseInt(e.target.value)||0)} /></div>
          <div><Label>Max days ahead</Label><Input type="number" value={maxDays} onChange={e=>setMaxDays(parseInt(e.target.value)||30)} /></div>
        </div>
        <div className="flex items-center gap-3"><Switch checked={active} onCheckedChange={setActive} /><Label>Accept bookings</Label></div>
      </Card>

      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Weekly availability</h2>
          <Button variant="outline" size="sm" onClick={addRow}><Plus className="h-3 w-3 mr-1" />Add row</Button>
        </div>
        {avail.length === 0 ? <p className="text-sm text-muted-foreground">No availability — add at least one row.</p> :
          <div className="space-y-2">
            {avail.map((r,i) => (
              <div key={i} className="grid grid-cols-[120px,1fr,1fr,40px] gap-2 items-center">
                <select className="border rounded px-2 py-2 bg-background text-sm" value={r.weekday} onChange={e=>updateRow(i,"weekday",parseInt(e.target.value))}>
                  {WEEKDAYS.map((d,idx) => <option key={idx} value={idx}>{d}</option>)}
                </select>
                <Input type="time" value={r.start_time.slice(0,5)} onChange={e=>updateRow(i,"start_time",e.target.value+":00")} />
                <Input type="time" value={r.end_time.slice(0,5)} onChange={e=>updateRow(i,"end_time",e.target.value+":00")} />
                <Button variant="ghost" size="icon" onClick={()=>removeRow(i)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            ))}
          </div>
        }
      </Card>

      <div className="flex justify-end">
        <Button onClick={saveProfile} disabled={saving} size="lg">
          {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Save changes
        </Button>
      </div>

      {host && (
        <Card className="p-6 space-y-3">
          <h2 className="font-semibold flex items-center gap-2"><CalIcon className="h-4 w-4" />Upcoming & recent bookings</h2>
          {bookings.length === 0 ? <p className="text-sm text-muted-foreground">No bookings yet.</p> :
            <div className="divide-y border rounded-md">
              {bookings.map(b => (
                <div key={b.id} className="p-3 flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium">{b.guest_name} <span className="text-muted-foreground font-normal">· {b.guest_email}</span></p>
                    <p className="text-xs text-muted-foreground">{new Date(b.start_at).toLocaleString()} · {b.status}</p>
                    {b.notes && <p className="text-xs mt-1 italic">"{b.notes}"</p>}
                  </div>
                </div>
              ))}
            </div>
          }
        </Card>
      )}
    </div>
  );
}