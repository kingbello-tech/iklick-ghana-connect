# Technology workspace upgrade

## Goal
Give Technology staff one task-focused workspace covering incidents, site surveys, and installations. Personal work is always the default; managers can deliberately switch to team oversight.

## Dashboard
- Replace the split Technology manager/engineer experiences with one role-aware **Technology Operations** dashboard.
- Default the dashboard to **My Work** for both Technology Engineers and Technology Managers.
- Show combined personal KPIs: active incidents, open surveys, active installations, and work needing attention today.
- Add a unified priority queue across all three work types, ordered by breached/at-risk SLA, due date, and age, with links to the relevant record.
- Add separate compact sections for recent incidents, surveys, and installations so users can move directly into their work.
- For Technology Managers and admins, provide an explicit **Team Overview** switch showing team totals, unassigned work, SLA risks, and team queues. Keep SLA target controls available only in this view.

## Survey and installation queues
- Make **My Tasks** the default scope for every Technology user, including managers.
- Give managers/admins clear scope options: **My Tasks**, **Unassigned**, and **Team Tasks**. Engineers only see **My Tasks**.
- Add search and practical filters for status, SLA state, schedule, and assignee where permitted.
- Sort actionable work first: breached, at risk, scheduled/due soon, then newest; completed and cancelled work remain accessible through filters.
- Present richer rows with client/deal, assigned engineer, scheduled/due date, status, and SLA state while retaining the existing edit forms, assignment controls, notifications, attachments, and completion workflows.
- Reset pagination whenever scope or filters change, and make all summary counts reflect the current filtered view.

## Navigation and access
- Add Technology Dashboard, Site Surveys, and Installations to the Technology Engineer menu so engineers can reach their own queues directly.
- Route Technology Engineers through the unified Technology dashboard while preserving role protections and manager-only controls.

## Technical details
- Frontend-only change; no database or policy changes are required because existing RLS and assignment fields already support these views.
- Reuse the existing semantic theme, shared cards/tables, SLA badges, and department-filtered assignment list.
- Keep live incident updates and add safe cleanup for any dashboard subscriptions.
- Validate the manager and engineer views at desktop and mobile widths, including empty, unassigned, filtered, and SLA-risk states.
