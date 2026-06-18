Build a lightweight scheduler at `meet.iklick.com/{slug}` where visitors book a slot and get a static Teams meeting link (admin-managed per user) plus a calendar invite.

## Flow

1. Visitor opens `meet.iklick.com/john` (or `/meet/john` fallback).
2. Sees host's name/title/photo + a 7-day availability grid (slots derived from host's working hours and existing bookings).
3. Picks slot → enters name, email, optional notes → confirms.
4. App stores booking, emails visitor + host with the host's static Teams URL and an `.ics` calendar attachment.

## Data (new tables)

- `meeting_hosts`: `user_id`, `slug` (unique), `display_name`, `title`, `teams_join_url`, `timezone`, `slot_minutes` (default 30), `buffer_minutes`, `avatar_url`, `is_active`.
- `meeting_availability`: `host_id`, `weekday` (0–6), `start_time`, `end_time`. Multiple rows per host.
- `meeting_blackouts`: `host_id`, `start_at`, `end_at`, `reason` (manual time-off).
- `meeting_bookings`: `host_id`, `start_at`, `end_at`, `guest_name`, `guest_email`, `notes`, `status` (`confirmed`/`cancelled`), `cancel_token`, `created_at`.

RLS: hosts manage own rows; `anon` can `SELECT` active hosts + availability + future bookings (for slot conflict checks) and `INSERT` a booking via a SECURITY DEFINER RPC `book_meeting(slug, start_at, name, email, notes)` that validates the slot is in availability, not blacked out, and not double-booked.

## Public booking page

- Route `/{slug}` on a dedicated public layout (no CRM chrome). Also `/meet/{slug}` as fallback if subdomain DNS isn't ready.
- React component fetches host + availability + upcoming bookings via anon client, generates slots client-side, posts to `book_meeting` RPC.
- On success, shows confirmation with the Teams link, "Add to calendar" `.ics` download, and reschedule/cancel link using `cancel_token`.

## Email + calendar

- Edge function `send-booking-confirmation` (triggered after RPC success from the client): renders host + guest emails with the Teams link and an inline `.ics` (METHOD:REQUEST, ORGANIZER=host, ATTENDEE=guest, LOCATION=Teams URL, DESCRIPTION includes join link). Uses Lovable Emails (existing domain).
- No Microsoft Graph integration — meetings reuse the host's static Teams URL, so any join lands in the host's personal room.

## CRM admin (signed-in users)

New page `/crm/meeting-links` (admin + all staff for own profile):
- "My link" card: slug, Teams URL, slot length, buffer, working hours editor (weekday + start/end rows), blackout date picker, copy-link button, preview link.
- Admin tab: table of all hosts with toggle active, edit slug/URL.
- No signature generator — just a prominent "Copy meeting link" button (the user said link only).

Sidebar entry "Meeting Links" under Operations/Profile group.

## Subdomain

`meet.iklick.com` is set up by the user as a CNAME to the Lovable app domain; the SPA routes `/{slug}` to the booking page when `window.location.hostname === 'meet.iklick.com'`, otherwise treats `/{slug}` as normal. `/meet/{slug}` works on the main domain too.

## Out of scope

- Microsoft Graph / per-meeting Teams link creation
- Outlook signature HTML generator
- Group/round-robin scheduling, paid bookings, reminders beyond initial confirmation
