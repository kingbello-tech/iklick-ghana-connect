import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle2, XCircle, CalendarClock } from "lucide-react";
import { toast } from "sonner";

type Action = "accepted" | "declined" | "reschedule";

type Booking = {
  booking_id: string;
  start_at: string;
  end_at: string;
  status: string;
  host_response: string;
  proposed_start_at: string | null;
  guest_name: string;
  guest_email: string;
  guest_notes: string | null;
  host_display_name: string;
  slug: string;
  timezone: string;
  teams_join_url: string;
};

export default function BookingRespond() {
  const { token } = useParams<{ token: string }>();
  const [params] = useSearchParams();
  const initialAction = (params.get("action") as Action | null) ?? null;
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState<Action | null>(initialAction);
  const [message, setMessage] = useState("");
  const [proposedDate, setProposedDate] = useState("");
  const [proposedTime, setProposedTime] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<null | "accepted" | "declined" | "reschedule">(null);

  useEffect(() => {
    if (!token) return;
    (async () => {
      const { data, error } = await supabase.rpc("get_booking_by_host_token", { _token: token });
      setLoading(false);
      if (error) { toast.error(error.message); return; }
      const row = Array.isArray(data) ? data[0] : data;
      if (row) setBooking(row as Booking);
    })();
  }, [token]);

  const alreadyResponded = booking && booking.host_response !== "pending";

  const whenFmt = useMemo(() => {
    if (!booking) return "";
    return new Date(booking.start_at).toLocaleString(undefined, {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  }, [booking]);

  const submit = async () => {
    if (!action || !token) return;
    let proposedIso: string | null = null;
    if (action === "reschedule") {
      if (!proposedDate || !proposedTime) { toast.error("Pick a new date and time"); return; }
      const d = new Date(`${proposedDate}T${proposedTime}`);
      if (Number.isNaN(d.getTime())) { toast.error("Invalid date/time"); return; }
      proposedIso = d.toISOString();
    }
    setSubmitting(true);
    const { data, error } = await supabase.rpc("respond_to_booking", {
      _token: token,
      _action: action,
      _proposed_start: proposedIso,
      _message: message.trim() || null,
    });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    setDone(action);
    // notify guest
    supabase.functions.invoke("meeting-emails", {
      body: { type: "guest_response", booking_id: booking?.booking_id, app_origin: window.location.origin },
    }).catch((e) => console.warn("notify guest failed", e));
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  if (!booking) return (
    <div className="min-h-screen flex items-center justify-center px-4 text-center">
      <div><h1 className="text-2xl font-semibold mb-2">Invalid or expired link</h1><p className="text-muted-foreground">This response link is no longer valid.</p></div>
    </div>
  );

  if (done) return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8 text-center space-y-3">
        {done === "declined" ? <XCircle className="h-12 w-12 text-red-500 mx-auto" /> : <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto" />}
        <h1 className="text-xl font-semibold">
          {done === "accepted" && "Meeting accepted"}
          {done === "declined" && "Meeting declined"}
          {done === "reschedule" && "New time proposed"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {done === "reschedule"
            ? `${booking.guest_name} has been emailed and will accept or decline your proposed time.`
            : `${booking.guest_name} has been notified by email.`}
        </p>
      </Card>
    </div>
  );

  if (alreadyResponded) return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8 text-center space-y-3">
        <h1 className="text-xl font-semibold">Already responded</h1>
        <p className="text-sm text-muted-foreground">You have already responded to this booking ({booking.host_response}).</p>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-background p-4 flex items-center justify-center">
      <Card className="max-w-xl w-full p-6 space-y-5">
        <div>
          <h1 className="text-2xl font-semibold">Meeting request</h1>
          <p className="text-sm text-muted-foreground mt-1">Hi {booking.host_display_name}, please respond to this booking.</p>
        </div>
        <div className="rounded-lg border p-4 space-y-1 text-sm bg-muted/30">
          <div><strong>Guest:</strong> {booking.guest_name} &lt;{booking.guest_email}&gt;</div>
          <div><strong>When:</strong> {whenFmt} ({booking.timezone})</div>
          {booking.guest_notes && <div><strong>Notes:</strong> {booking.guest_notes}</div>}
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Button variant={action === "accepted" ? "default" : "outline"} onClick={() => setAction("accepted")} className={action === "accepted" ? "bg-emerald-600 hover:bg-emerald-700" : ""}>
            <CheckCircle2 className="h-4 w-4 mr-1" />Accept
          </Button>
          <Button variant={action === "declined" ? "default" : "outline"} onClick={() => setAction("declined")} className={action === "declined" ? "bg-red-600 hover:bg-red-700" : ""}>
            <XCircle className="h-4 w-4 mr-1" />Decline
          </Button>
          <Button variant={action === "reschedule" ? "default" : "outline"} onClick={() => setAction("reschedule")}>
            <CalendarClock className="h-4 w-4 mr-1" />Reschedule
          </Button>
        </div>

        {action === "reschedule" && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>New date</Label>
              <Input type="date" value={proposedDate} onChange={(e) => setProposedDate(e.target.value)} />
            </div>
            <div>
              <Label>New time</Label>
              <Input type="time" value={proposedTime} onChange={(e) => setProposedTime(e.target.value)} />
            </div>
          </div>
        )}

        <div>
          <Label>Optional message to {booking.guest_name}</Label>
          <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} placeholder="Add a note (optional)" />
        </div>

        <Button onClick={submit} disabled={!action || submitting} className="w-full" size="lg">
          {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Send response
        </Button>
      </Card>
    </div>
  );
}