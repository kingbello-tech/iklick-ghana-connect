import { Badge } from "@/components/ui/badge";
import { differenceInMinutes } from "date-fns";

export function SLATimerBadge({
  createdAt,
  targetMinutes,
  resolved,
  resolvedAt,
}: {
  createdAt: string;
  targetMinutes?: number | null;
  resolved?: boolean;
  resolvedAt?: string | null;
}) {
  // Elapsed = time between created and (resolved_at OR now)
  const end = resolved && resolvedAt ? new Date(resolvedAt) : new Date();
  const elapsed = Math.max(0, differenceInMinutes(end, new Date(createdAt)));
  const hrs = (elapsed / 60).toFixed(1);

  // No SLA policy → just show elapsed
  if (!targetMinutes) {
    return (
      <Badge className="text-[10px] bg-muted text-muted-foreground border-border">
        {hrs}h
      </Badge>
    );
  }

  const breached = elapsed > targetMinutes;
  if (breached) {
    return (
      <Badge className="text-[10px] bg-destructive/15 text-destructive border-destructive/40">
        {hrs}h · breached
      </Badge>
    );
  }
  if (resolved) {
    return (
      <Badge className="text-[10px] bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/40">
        {hrs}h · met
      </Badge>
    );
  }
  const remaining = targetMinutes - elapsed;
  if (remaining < targetMinutes * 0.25) {
    return (
      <Badge className="text-[10px] bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/40">
        {hrs}h · at risk
      </Badge>
    );
  }
  return (
    <Badge className="text-[10px] bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/40">
      {hrs}h
    </Badge>
  );
}