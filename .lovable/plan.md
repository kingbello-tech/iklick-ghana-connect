## Goal

Rewire the CRM with patterns borrowed from ManageEngine ServiceDesk Plus: every signed-in user lands on a dashboard tailored to their role, incident handling becomes a proper request lifecycle with SLA timers and approvals, a new Project Management module ties work to deals and incidents, and Sales + Billing get tightened pipelines and finance dashboards. Visual style stays iKlick's current liquid-glass look — only the information architecture and density are SDP-inspired.

Delivered in four phases. You approve once; each phase ships as its own batch.

---

## Phase 1 — Role-based dashboards (UI only, no schema)

Replace the current `CRMDashboard` router with a role switch that loads one of these dashboards. Each follows the same shell: top KPI strip, "My Queue" table, role-specific charts, quick actions.

| Role | Dashboard focus |
|---|---|
| admin | Global KPIs across all modules (incidents, sales pipeline, AR, projects, payroll status). Drill-down links. |
| network_manager | Team SLA compliance, unassigned queue, escalations, technician load heatmap. |
| network_engineer / support_agent | My open tickets, SLA timers, today's tasks, recently closed. |
| client_experience | CSAT trend, open survey responses, SLA breach watchlist, follow-ups due. |
| sales_manager | Team pipeline, target attainment, win rate, leaderboard, stuck deals. |
| sales_representative | My leads, my pipeline, my targets, activities due today. |
| technology_manager | Survey queue, installation calendar, engineer load, overdue work orders. |
| technology_engineer | My assigned surveys + installations, today's schedule, materials list. |
| finance_officer | AR aging, drafts to send, payments to confirm, recurring billing health. |
| hr_officer | Headcount, pending payroll runs, statutory deadlines, new hires. |

Shared building blocks: `KPIStrip`, `MyQueueTable`, `SLATimerBadge`, `QuickActions`. Built in `src/components/crm/dashboard/`.

## Phase 2 — Incident / Request module overhaul

Bring SDP "request" patterns to existing incidents.

Schema (new migration):
- `request_categories` (name, parent_id, default_priority, default_sla_policy_id)
- `request_templates` (category_id, name, fields jsonb, default assignee, default priority)
- `incident_approvals` (incident_id, approver_id, status, decided_at, comment)
- `incident_tasks` (incident_id, title, assignee_id, due_at, status) — subtasks within a ticket
- `incident_time_entries` (incident_id, user_id, minutes, note, logged_at)
- `incidents`: add `category_id`, `template_id`, `requires_approval`, `first_response_at`, `due_at`, `reopen_count`

UI:
- New "Create Request" wizard driven by category → template.
- Incident detail re-laid out as SDP-style tabs: Details · Conversations · Approvals · Tasks · Time · History · Resolution.
- Persistent SLA timer header (response + resolution countdown, colour-coded).
- Inline approve/reject for approvers; queue card on approver dashboards.
- Bulk actions on incident list (assign, priority, close).

Edge function: `sla-timer-tick` (cron, every 5 min) — sets `first_response_at`, marks breaches, sends notifications via existing channel.

## Phase 3 — Project Management module

Schema (new migration):
- `projects` (name, code, client_id, deal_id, owner_id, status, start_date, target_end, actual_end, health)
- `project_milestones` (project_id, name, target_date, completed_at, order)
- `project_tasks` (project_id, milestone_id, parent_task_id, title, assignee_id, priority, status, estimate_hours, start_date, due_date, completed_at)
- `project_members` (project_id, user_id, role) — RBAC per project
- `project_time_entries` (task_id, user_id, minutes, note, logged_at)
- `project_comments` (entity_type, entity_id, user_id, body)

UI under `/crm/projects`:
- Projects list with health pills (green/amber/red based on milestone slippage).
- Project detail: Overview · Milestones (timeline) · Tasks (Kanban via existing @dnd-kit + List view) · Team · Time · Files (reuse `attachments`).
- Auto-create a project skeleton when a deal hits `closed_won` (extend `create_installation_on_won` trigger).
- Link tasks ↔ incidents (one-way reference) so escalations from a deployment land in PM.

Dashboards updated: tech managers and admin see project health; engineers see "My project tasks" alongside incidents.

## Phase 4 — Sales + Billing rewire

Sales:
- Enforce SDP-style stage gates on `deals`: each stage transition validates required artefacts (e.g. `negotiation` requires a `quotations` row v≥1; `closed_won` requires signed quotation flag).
- Add `deal_approvals` (discount > X% routes to sales_manager).
- Sales rep dashboard gets "Stuck deals" (no activity in N days) and "Today's activities" from `deal_activities`.
- Sales manager dashboard gets weighted pipeline (`value × probability`) and target burn-down sourced from `sales_targets`.

Billing:
- New "Approval" status for invoices > threshold (admin/finance_officer manager approval before `sent`).
- Dunning: edge function `dunning-sweep` (cron) flips overdue invoices, queues reminder notifications + email via existing `send-tech-email` style function.
- Finance dashboard rebuilt around AR aging buckets (0-30, 31-60, 61-90, 90+), DSO calc, collections this month vs target, recurring run health.
- Payments view (currently buried) promoted to its own page `/crm/finance/payments`.

---

## Cross-cutting work

- **Routing & sidebar**: `CRMSidebar` groups reordered to match SDP modules (Home · Requests · Projects · Sales · Billing · HR · Admin). Each group is collapsible; default-open is the user's primary module.
- **Auth context**: add `hasProjectAccess` and `homeModule` so login redirects to the role's natural landing page (e.g. sales rep → `/crm/sales/dashboard`).
- **Realtime**: keep current `postgres_changes` subscriptions; add channels for `incident_tasks` and `project_tasks`.
- **Reusable primitives** in `src/components/crm/`: `KPIStrip`, `SLATimerBadge`, `QueueTable`, `ApprovalCard`, `StageGateAlert`, `AgingBuckets`.
- **No new design system tokens** — reuse current semantic tokens.

## Technical notes

- All new tables get RLS using existing `has_role` / `has_*_access` helpers; project members get row access via a new `has_project_access(_user_id, _project_id)` security-definer function.
- Triggers reused for audit logging (`log_audit`) and notifications (`notify_user` / `notify_role`).
- Migrations split per phase; types regenerate after each.
- Edge functions added: `sla-timer-tick`, `dunning-sweep`. Both cron-scheduled via `supabase/config.toml`.
- Phase 1 ships first — no schema changes — so you see immediate value before approving Phase 2's migration.

## Out of scope (this rewire)

- Asset/CMDB module, knowledge base, change/release management (SDP has these; flag if you want them later).
- Mobile-specific layouts beyond responsive cards.
- Email-to-ticket parsing (current Outlook integration stays as-is).
