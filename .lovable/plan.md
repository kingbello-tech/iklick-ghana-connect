# Client Profile — Multi-Site, Contracts, Onboarding, Performance & Churn

## What gets built

A dedicated **Client Profile page** at `/crm/clients/:id` with tabbed sections, accessible by clicking any client in the existing client list. It centralizes everything about a client and their sites.

### Tabs on the Client Profile

1. **Overview** — Summary card (active sites, MRC total, open incidents, churn risk badge, CSAT avg), recent activity stream.
2. **Sites** — List of all the client's sites with status, location, service type, bandwidth, go-live date. Add / edit / view site → opens a Site Detail drawer with its own sub-tabs (Contract, Onboarding, Incidents, Performance).
3. **Contracts** — Per-site contracts (MRC, NRC, start/end, renewal date, billing reference, status). Highlights upcoming renewals.
4. **Onboarding** — Pipeline view (Survey → Install → Test → Live) across all sites currently being onboarded, with per-stage owners, tasks, attachments.
5. **Performance** — Per-client and per-site: incident count, MTTR, SLA compliance %, open vs resolved, monthly trend (Recharts).
6. **Churn** — Auto-computed risk score + manual override + churn log (date, reason, retention actions).
7. **Contacts** — Existing client contacts (reuse current component).

### Sales / Tech integration

- Incidents get an optional `site_id` so they can be tied to a specific site (existing incidents stay valid — site is nullable).
- Onboarding pipeline can be auto-seeded when a deal is `closed_won` (creates a site in `survey` stage).

## Data model (new tables)

```text
client_sites
  id, client_id, name, location, gps_address,
  service_type, bandwidth, status (onboarding|active|suspended|churned),
  go_live_date, notes, created_at/by, updated_at

site_contracts
  id, site_id, mrc, nrc, contract_start, contract_end,
  renewal_date, contract_duration_months, billing_reference,
  status (active|expired|cancelled|pending), notes

site_onboarding
  id, site_id, current_stage (survey|install|test|live),
  survey_owner, install_owner, test_owner,
  survey_completed_at, install_completed_at, test_completed_at, live_at,
  notes

site_onboarding_tasks
  id, site_id, stage, title, assigned_to, due_date,
  status (open|in_progress|done), completed_at, created_by

client_churn
  client_id (PK), risk_level (low|medium|high|churned),
  manual_override (bool), score (int 0-100),
  reason, churned_at, last_assessed_at, notes

client_churn_log
  id, client_id, action (status_change|retention_action),
  from_status, to_status, notes, performed_by, performed_at

incidents.site_id  ← new nullable FK column
```

Auto-churn score is computed in a Postgres function from: recent incident volume, SLA breaches, CSAT average, overdue invoices, days since last activity. Staff can override.

RLS: existing patterns — authenticated read; admin / network manager / technology manager / network engineer / technology engineer / client_experience / sales for inserts/updates; admin for deletes.

## UI / files

- New page: `src/pages/crm/ClientDetail.tsx` (tabs + sections)
- New components in `src/components/crm/client/`:
  - `ClientOverview.tsx`
  - `SiteList.tsx` + `SiteFormDialog.tsx` + `SiteDetailDrawer.tsx`
  - `ContractList.tsx` + `ContractFormDialog.tsx`
  - `OnboardingBoard.tsx` (stage columns, drag via @dnd-kit) + `OnboardingTaskDialog.tsx`
  - `ClientPerformance.tsx` (Recharts charts driven by incidents)
  - `ChurnPanel.tsx` (auto score, manual override, churn log)
- `ClientList.tsx` — make each row clickable, route to `/crm/clients/:id`.
- `App.tsx` — add `/crm/clients/:id` route.
- `IncidentCreateDialog.tsx` — add optional Site selector that appears once a client is chosen.
- `IncidentDetail.tsx` — show site name if linked.

## Notes / non-goals

- No automated uptime polling — uptime/availability is out of scope (you picked Incident & SLA only).
- No financial-health panel in this round.
- Existing incidents remain valid; site link is optional and additive.

Shall I proceed with the migration and build?
