import { Search, UserRound, UserX, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type QueueScope = "mine" | "unassigned" | "team";

interface Option { value: string; label: string }

export function TechnologyQueueToolbar({
  scope,
  onScopeChange,
  isManager,
  search,
  onSearchChange,
  status,
  onStatusChange,
  statusOptions,
  sla,
  onSlaChange,
  schedule,
  onScheduleChange,
  assignee,
  onAssigneeChange,
  assignees,
}: {
  scope: QueueScope;
  onScopeChange: (scope: QueueScope) => void;
  isManager: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  status: string;
  onStatusChange: (value: string) => void;
  statusOptions: Option[];
  sla: string;
  onSlaChange: (value: string) => void;
  schedule: string;
  onScheduleChange: (value: string) => void;
  assignee: string;
  onAssigneeChange: (value: string) => void;
  assignees: Array<{ user_id: string; full_name: string | null }>;
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2" aria-label="Task scope">
        <Button size="sm" variant={scope === "mine" ? "default" : "outline"} onClick={() => onScopeChange("mine")}>
          <UserRound className="mr-2 h-4 w-4" />My Tasks
        </Button>
        {isManager && (
          <>
            <Button size="sm" variant={scope === "unassigned" ? "default" : "outline"} onClick={() => onScopeChange("unassigned")}>
              <UserX className="mr-2 h-4 w-4" />Unassigned
            </Button>
            <Button size="sm" variant={scope === "team" ? "default" : "outline"} onClick={() => onScopeChange("team")}>
              <UsersRound className="mr-2 h-4 w-4" />Team Tasks
            </Button>
          </>
        )}
      </div>
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
        <div className="relative sm:col-span-2 xl:col-span-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="Search tasks" className="pl-9" />
        </div>
        <Select value={status} onValueChange={onStatusChange}>
          <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>{statusOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={sla} onValueChange={onSlaChange}>
          <SelectTrigger><SelectValue placeholder="SLA" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All SLA states</SelectItem>
            <SelectItem value="breached">Breached</SelectItem>
            <SelectItem value="at_risk">At risk</SelectItem>
            <SelectItem value="on_track">On track</SelectItem>
          </SelectContent>
        </Select>
        <Select value={schedule} onValueChange={onScheduleChange}>
          <SelectTrigger><SelectValue placeholder="Schedule" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any schedule</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="overdue">Schedule overdue</SelectItem>
            <SelectItem value="unscheduled">Unscheduled</SelectItem>
          </SelectContent>
        </Select>
        {isManager && scope === "team" ? (
          <Select value={assignee} onValueChange={onAssigneeChange}>
            <SelectTrigger><SelectValue placeholder="Engineer" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All engineers</SelectItem>
              {assignees.map((person) => <SelectItem key={person.user_id} value={person.user_id}>{person.full_name || "Unknown"}</SelectItem>)}
            </SelectContent>
          </Select>
        ) : <div className="hidden xl:block" />}
      </div>
    </div>
  );
}