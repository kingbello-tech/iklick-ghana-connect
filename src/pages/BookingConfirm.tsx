import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

type Booking = {
  booking_id: string;
  status: string;
  host_response: string;
  start_at: string;
  end_at: string;
  proposed_start_at: string | null;
  proposed_end_at: string | null;
  guest_name: string;
  guest_email: string;
  guest_decision: string | null;
  host_display_name: string;
  host_message: string | null;
  timezone: string;
  teams_join_url: string;
};

export default function BookingConfirm() {
  const { token } = useParams<{ token: string }>();
  const [params] = useSearchParams();
  const initial = params.get("decision"); // "accept" | "decline" | null
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<null | "accepted" | "declined">(null);

  useEffect(() => {
    if (!token) return;
    (async () => {
      const { data, error } = await supabase.rpc("get_booking_by_guest_token", { _token: token });
      setLoading(false);
      if (error) { toast.error(error.message); return; }
      const row = Array.isArray(data) ? data[0] : data;
      if (row) setBooking(row as Booking);
    })();
  }, [token]);

  const proposedFmt = useMemo(() => {
    if (!booking?.proposed_start_at) return "";
    return new Date(booking.proposed_start_at).toLocaleString(undefined, {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  }, [booking]);

  const decide = async (accept: boolean) => {
    if (!token) return;
    setSubmitting(true);
    const { error } = await supabase.rpc("guest_decide_reschedule", { _token: token, _accept: accept });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    setDone(accept ? "accepted" : "declined");
    supabase.functions.invoke("meeting-emails", {
      body: { type: "host_confirmed", booking_id: booking?.booking_id, app_origin: window.location.origin },
    }).catch((e) => console.warn("notify host failed", e));
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  if (!booking) return (
    <div className="min-h-screen flex items-center justify-center px-4 text-center">
      <div><h1 className="text-2xl font-semibold mb-2">Invalid link</h1><p className="text-muted-foreground">This confirmation link is no longer valid.</p></div>
    </div>
  );

  if (done || booking.guest_decision) {
    const outcome = done ?? (booking.guest_decision as "accepted" | "declined");
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center space-y-3">
          {outcome === "declined" ? <XCircle className="h-12 w-12 text-red-500 mx-auto" /> : <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto" />}
          <h1 className="text-xl font-semibold">{outcome === "accepted" ? "New time confirmed" : "Reschedule declined"}</h1>
          <p className="text-sm text-muted-foreground">
            {outcome === "accepted"
              ? `Your meeting with ${booking.host_display_name} is now confirmed.`
              : `Your booking has been cancelled. ${booking.host_display_name} has been notified.`}
          </p>
          {outcome === "accepted" && booking.teams_join_url && (
            <a href={booking.teams_join_url} target="_blank" rel="noreferrer">
              <Button className="w-full">Join Microsoft Teams meeting</Button>
            </a>
          )}
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-6 space-y-5">
        <div>
          <h1 className="text-xl font-semibold">New time proposed</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {booking.host_display_name} proposed a different time for your meeting.
          </p>
        </div>
        <div className="rounded-lg border p-4 space-y-1 text-sm bg-muted/30">
          <div><strong>Proposed time:</strong> {proposedFmt} ({booking.timezone})</div>
          {booking.host_message && <div><strong>Message:</strong> {booking.host_message}</div>}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button onClick={() => decide(true)} disabled={submitting} className="bg-emerald-600 hover:bg-emerald-700">
            <CheckCircle2 className="h-4 w-4 mr-1" />Accept
          </Button>
          <Button onClick={() => decide(false)} disabled={submitting} variant="outline">
            <XCircle className="h-4 w-4 mr-1" />Decline
          </Button>
        </div>
        {initial && <p className="text-xs text-muted-foreground text-center">Tap a button to confirm your choice.</p>}
      </Card>
    </div>
  );
}