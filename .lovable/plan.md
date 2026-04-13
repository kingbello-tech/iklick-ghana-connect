

# iKlick CRM Platform - Phase 1 Plan

## Overview
Build the foundational CRM platform as a separate section at `/crm/*`, keeping the existing public website intact. Phase 1 covers: Authentication, User Profiles, RBAC, Dashboard, and Incident Management.

## Architecture

```text
/                  → Existing public website (unchanged)
/login             → Auth page
/crm/dashboard     → NOC Command Center
/crm/incidents     → Incident list (table + kanban toggle)
/crm/incidents/:id → Incident detail view
/crm/settings      → User/role management (admin only)
```

The CRM section uses its own layout with a dark-themed sidebar navigation, separate from the public site navbar.

## Database Schema (6 migrations)

**Migration 1 - Roles & Profiles:**
- `app_role` enum: `admin`, `network_engineer`, `support_agent`, `viewer`
- `user_roles` table (user_id, role) with RLS + `has_role()` security definer function
- `profiles` table: id, user_id, full_name, avatar_url, department, phone, created_at
- Trigger to auto-create profile on signup

**Migration 2 - Clients:**
- `clients` table: id, name, email, phone, location, service_type (home/enterprise), created_at

**Migration 3 - Incidents:**
- `incident_priority` enum: `low`, `medium`, `high`, `critical`
- `incident_status` enum: `open`, `in_progress`, `escalated`, `resolved`, `closed`
- `incidents` table: id, incident_number (auto-generated), client_id, title, description, location, service_type, issue_category, priority, status, assigned_to, created_by, created_at, updated_at, resolved_at, closed_at

**Migration 4 - Incident Activity:**
- `incident_notes` table: id, incident_id, user_id, content, note_type (note/log/image), attachment_url, created_at
- `incident_history` table: id, incident_id, user_id, field_changed, old_value, new_value, created_at

**Migration 5 - SLA Definitions (schema only, logic in Phase 2):**
- `sla_policies` table: id, priority, response_time_minutes, resolution_time_minutes

**Migration 6 - RLS Policies:**
- All tables get RLS enabled
- Policies using `has_role()` function for access control
- Support agents: CRUD on incidents, read clients
- Network engineers: all agent permissions + escalation
- Admins: full access
- Viewers: read-only

## Frontend Components

### Layout & Navigation
- `CRMLayout.tsx` - Dark-themed layout wrapper with sidebar
- `CRMSidebar.tsx` - Sidebar with nav items: Dashboard, Incidents, Clients, Settings
- Uses existing Shadcn Sidebar component with `collapsible="icon"`

### Authentication
- `LoginPage.tsx` - Email/password login page with iKlick branding
- `AuthProvider.tsx` - Context provider for auth state, role checking
- `ProtectedRoute.tsx` - Route guard checking auth + role permissions

### Dashboard (NOC Command Center)
- `CRMDashboard.tsx` - Main dashboard page with widget grid
- Widgets: Active incidents by priority (counters), incidents by status (bar chart), recent incidents list, quick stats (open/resolved today)
- Uses Recharts for charts, color-coded status indicators

### Incident Management
- `IncidentList.tsx` - Table view with filters (status, priority, assignee) + Kanban board toggle
- `IncidentKanban.tsx` - Drag-and-drop kanban by status columns
- `IncidentDetail.tsx` - Full incident view with timeline, notes, history
- `IncidentCreateDialog.tsx` - Modal form to create new incidents
- `IncidentFilters.tsx` - Filter bar with search, dropdowns

### Settings
- `UserManagement.tsx` - Admin-only user list with role assignment

## Key Technical Decisions
- Dark theme enforced in CRM layout (separate from public site theme toggle)
- Real-time updates via Supabase subscriptions on incidents table
- Incident numbers auto-generated via Postgres sequence (e.g., INC-00001)
- All timestamps in UTC, displayed in user's local timezone
- Recharts for dashboard visualizations

## What's Deferred to Phase 2
- SLA countdown timers and breach detection
- Escalation engine (auto-escalation logic)
- Customer satisfaction surveys
- SMS/Email notification hooks
- Geo-mapping of incidents
- Advanced analytics and reports

## Packages to Install
- `recharts` (already likely available via Shadcn chart)
- `@dnd-kit/core` + `@dnd-kit/sortable` (for Kanban drag-and-drop)
- `date-fns` (date formatting)

