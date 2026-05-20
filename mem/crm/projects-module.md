---
name: Projects Module
description: Project management with Kanban, milestones, team, discussion. Auto-created from won deals.
type: feature
---
- Tables: projects, project_milestones, project_tasks, project_members, project_time_entries, project_comments.
- Auto-creation: deal stage flips to closed_won → trigger create_project_on_won inserts a project linked to the deal.
- Code prefix: PRJ-XXXX (sequence project_code_seq).
- Kanban statuses: backlog, todo, in_progress, review, done, blocked. Drag-and-drop via @dnd-kit.
- Health pills: green/amber/red. Status: planning/active/on_hold/completed/cancelled.
- Manager roles (admin, technology_manager, network_manager, sales_manager) can create/manage. Project members + owner can edit their project.
- Routes: /crm/projects (list), /crm/projects/:id (detail with tabs Board/Milestones/Team/Discussion/Overview).