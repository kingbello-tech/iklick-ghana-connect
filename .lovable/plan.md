## Recurring Issues Tracker

A new module that surfaces issues that keep coming back, so the team can act proactively instead of reactively fixing the same problem.

### What it does

- Groups incidents by **client + issue_category + sub_category** (and optionally **site**) over a rolling window (default last 90 days).
- Flags a group as **recurring** when it crosses a configurable threshold (default ≥ 3 incidents in the window).
- Shows trend (incidents/week), avg resolution time, last occurrence, SLA breaches, and the linked client/site.
- Lets staff create a **Problem Record** from a recurring group to track root cause + permanent fix, with status (open / investigating / mitigated / resolved), owner, target date, and notes.
- Sends a notification to Technology Manager when a new pattern crosses the threshold.

### Where it lives

- New page **`/crm/recurring-issues`** (sidebar entry under Technology / NOC area, visible to admin, technology_*, network_*, client_experience).
- "View related incidents" drill-down opens the existing IncidentList filtered by the group.
- Link on Client Detail page → "Recurring patterns for this client".

### UI

- Top: filters (window 30/60/90/180 days, min occurrences slider, client, category, status of problem record).
- KPI cards: Active patterns, New this week, Problem records open, Avg recurrence interval.
- Table of recurring groups: Client · Category/Sub-category · Site · Count · Trend sparkline · Last seen · SLA breach % · Problem-record status · Actions (View incidents, Create/Open problem record).
- Drawer for Problem Record: root cause, fix plan, owner, target date, status, activity log.

### Technical

New tables (with GRANTs + RLS):

- `problem_records` — id, client_id, site_id, issue_category, sub_category, title, root_cause, fix_plan, owner_id, status, target_date, created_at/by, resolved_at, notes
- `problem_record_incidents` — problem_record_id, incident_id (link table to attach incidents to a problem)

RLS: read/write for admin, technology_manager, technology_engineer, network_manager, network_engineer, client_experience; read for support_agent.

Detection logic (SQL view + RPC):

- `recurring_issue_patterns(window_days int, min_count int)` security-definer function returning aggregated groups with counts, first/last seen, avg resolution minutes, breach %, linked problem_record_id.
- Implemented as `SELECT client_id, issue_category, sub_category, site_id, count(*), min/max(created_at), ... FROM incidents WHERE created_at > now() - interval … GROUP BY … HAVING count(*) >= min_count`.

Notifications:

- Trigger on `incidents` insert: if the new incident causes a group to cross threshold for the first time (or in last 7 days), call `notify_role('technology_manager', 'recurring_pattern', …)`.

Frontend:

- `src/pages/crm/RecurringIssues.tsx` — list + filters + KPIs.
- `src/components/crm/ProblemRecordDrawer.tsx` — create/edit problem record, attach incidents.
- Add route in `App.tsx` and sidebar link.
- React Query hooks calling the RPC and CRUD on `problem_records`.

### Out of scope

- Auto root-cause inference / ML clustering (uses simple category+client grouping).
- Email digest (in-app notification only for now).
