# Plan: Technology Department Restructure + Incident & Client Updates

## 1. Roles & Department Reorganization

**Technology department** now contains: `technology_manager`, `network_manager`, `technology_engineer`, `network_engineer`, `client_experience` (kept under Technology since CX is the closure/SLA arm).

- **Remove `support_agent` role** from the system (enum value retained for backward compat; UI option removed; existing users migrated to `network_engineer`).
- **Technology Manager**: superset of Network Manager — manages incidents, surveys, installations, network ops. Dashboard combines all four.
- **Network Manager**: keep current role and dashboard (unchanged).
- **Technology Engineer**: can work incidents but **no longer sees** Survey Queue / Installation Queue sidebar items or `/crm/technology/dashboard` (redirects to incident-focused engineer dashboard).
- **Network Engineer**: gains incident management (create + work incidents).

## 2. Incident Permissions

- **Can create incidents**: admin, technology_manager, technology_engineer, network_manager, network_engineer (NOT client_experience anymore).
- **Can work/update incidents**: same set + client_experience (for closure/notes).
- Update RLS on `incidents`, `incident_notes`, `incident_history`, `incident_closures`, `incident_tasks`, `incident_time_entries`, `incident_approvals` accordingly.
- `canManageIncidents` in `AuthContext` updated; "Create Incident" button hidden for client_experience.

## 3. Department-Scoped Assignment

In `IncidentCreateDialog` (and any other assignment dropdown that filters by department), when a department is chosen the user list shows **only profiles whose `profiles.department` matches**. Backfill `profiles.department` for the five Technology roles via a one-time SQL update so dropdowns aren't empty.

## 4. Client Contacts (multiple emails & phones per client)

New table `public.client_contacts`:
- `client_id` (FK clients), `name`, `email`, `phone`, `role` (e.g. "Billing", "Technical"), `is_primary`
- RLS: same read scope as `clients`; staff with client write access can manage.

UI: on Client detail/list, add a "Contacts" section with **Add Contact** button → dialog to add multiple rows; edit/delete per row.

## 5. Email Notification on Flagged Incidents

When an incident is created **or escalated/flagged high-priority**, send an email to the Technology team via the existing `send-incident-email` edge function:
- Recipients: all profiles with role in `technology_manager`, `technology_engineer` (collected at send time).
- Trigger points:
  1. Incident creation (already partially wired — extend to also CC tech team, not only the assignee).
  2. Status change to `escalated` or priority change to `critical` — new client-side hook in `IncidentDetail` post-update.

## Technical Summary

**Migration**
- Update RLS policies on all incident tables to include `network_engineer` for INSERT/UPDATE and remove `client_experience` from INSERT-incident.
- `UPDATE user_roles SET role='network_engineer' WHERE role='support_agent'`.
- Backfill `profiles.department='Technology'` for affected roles.
- Create `client_contacts` table + RLS + `updated_at` trigger.

**Frontend**
- `AuthContext.tsx`: `canManageIncidents` → add `network_engineer`, `network_manager`; add `canCreateIncidents` (excludes `client_experience`).
- `CRMSidebar.tsx`: remove Surveys/Installations from technology_engineer view; add Incidents for network_engineer; remove support_agent references; under CX remove create-incident shortcut.
- `CRMDashboard.tsx`: technology_engineer → engineer-focused (incidents) dashboard, not the queue dashboard.
- `TechnologyDashboard.tsx`: include network ops widgets for technology_manager.
- `IncidentList.tsx` / `IncidentCreateDialog.tsx`: hide "Create" for CX; assignment dropdown filtered by selected department; default department list updated.
- New `src/components/crm/ClientContacts.tsx` mounted on client detail.
- `UserManagement.tsx`: remove `support_agent` from selectable roles.

**Edge function**
- `send-incident-email`: accept `cc_emails` array; UI call sites collect Technology team emails and pass them in for create + flag events.

No new packages.

Awaiting approval before applying the migration and code changes.