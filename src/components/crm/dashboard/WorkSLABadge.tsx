import { Badge } from "@/components/ui/badge";
import { differenceInMinutes } from "date-fns";

/**
 * SLA badge for technology field work (site surveys / installations).
 * Uses the row's due_at deadline: breached when past due and not finished,
 * met when completed before the deadline, at-risk when <25% of time remains.
 */
export function WorkSLABadge({
  createdAt,
  dueAt,
  status,
  completedAt,
}: {
  createdAt?: string | null;
  dueAt?: string | null;
  status: string;
  completedAt?: string | null;
}) {
  if (!dueAt || !createdAt) return null;

  const done = status === "completed" || status === "cancelled";
  const end = done && completedAt ? new Date(completedAt) : new Date();
  const due = new Date(dueAt);
  const start = new Date(createdAt);
  const totalMinutes = Math.max(1, differenceInMinutes(due, start));
  const elapsed = differenceInMinutes(end, start);
  const overdueBy = differenceInMinutes(end, due);
  const fmt = (mins: number) => {
    const abs = Math.abs(mins);
    return abs >= 60 ? `${(abs / 60).toFixed(1)}h` : `${abs}m`;
  };

  if (done) {
    if (completedAt && new Date(completedAt) > due) {
      return (
        <Badge className="text-[10px] bg-destructive/15 text-destructive border-destructive/40">
          late · {fmt(overdueBy)}
        </Badge>
      );
    }
    return (
      <Badge className="text-[10px] bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/40">
        SLA met
      </Badge>
    );
  }

  if (end > due) {
    return (
      <Badge className="text-[10px] bg-destructive/15 text-destructive border-destructive/40">
        breached · {fmt(overdueBy)} over
      </Badge>
    );
  }

  const remaining = differenceInMinutes(due, end);
  if (remaining < totalMinutes * 0.25) {
    return (
      <Badge className="text-[10px] bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/40">
        at risk · {fmt(remaining)} left
      </Badge>
    );
  }
  return (
    <Badge className="text-[10px] bg-muted text-muted-foreground border-border">
      due in {fmt(remaining)}
    </Badge>
  );
}
