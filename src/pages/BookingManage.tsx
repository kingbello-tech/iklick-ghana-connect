import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Calendar, Clock, Video, XCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

type Booking = {
  booking_id: string;
  start_at: string;
  end_at: string;
  status: string;
  guest_name: string;
  guest_email: string;
  display_name: string;
  teams_join_url: string;
  slug: string;
  timezone: string;
};

export default function BookingManage() {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!token) return;
    (async () => {
      const { data } = await supabase.rpc("get_booking_by_token", { _token: token });
      const row = Array.isArray(data) ? data[0] : null;
      setBooking(row as Booking | null);
      setLoading(false);
    })();
  }, [token]);

  const cancel = async () => {
    if (!token) return;
    setCancelling(true);
    const { data, error } = await supabase.rpc("cancel_meeting_booking", { _token: token });
    setCancelling(false);
    if (error || !data) { toast.error(error?.message ?? "Unable to cancel"); return; }
    toast.success("Booking cancelled");
    setBooking(b => b ? { ...b, status: "cancelled" } : b);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  if (!booking) return <div className="min-h-screen flex items-center justify-center"><p>Booking not found.</p></div>;

  const start = new Date(booking.start_at);
  const end = new Date(booking.end_at);
  const cancelled = booking.status === "cancelled";
  const past = start < new Date();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-lg w-full p-8 space-y-5">
        <h1 className="text-xl font-semibold">Your meeting with {booking.display_name}</h1>
        <div className="rounded-lg border p-4 space-y-3 text-sm">
          <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground" />{start.toLocaleDateString(undefined,{ weekday:"long", month:"long", day:"numeric", year:"numeric" })}</div>
          <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-muted-foreground" />{start.toLocaleTimeString(undefined,{ hour:"2-digit", minute:"2-digit" })} – {end.toLocaleTimeString(undefined,{ hour:"2-digit", minute:"2-digit" })}</div>
          <div className="flex items-center gap-2"><Video className="h-4 w-4 text-muted-foreground" />Microsoft Teams</div>
        </div>
        {cancelled ? (
          <div className="flex items-center gap-2 text-destructive text-sm"><XCircle className="h-4 w-4" />This booking is cancelled.</div>
        ) : past ? (
          <div className="flex items-center gap-2 text-muted-foreground text-sm"><CheckCircle2 className="h-4 w-4" />This meeting has already taken place.</div>
        ) : (
          <div className="space-y-2">
            <a href={booking.teams_join_url} target="_blank" rel="noreferrer"><Button className="w-full"><Video className="h-4 w-4 mr-2" />Join meeting</Button></a>
            <Button variant="outline" className="w-full" onClick={cancel} disabled={cancelling}>
              {cancelling && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Cancel booking
            </Button>
            <a href={`/${booking.slug}`} className="block text-center text-xs text-muted-foreground underline">Reschedule (book a new time)</a>
          </div>
        )}
      </Card>
    </div>
  );
}