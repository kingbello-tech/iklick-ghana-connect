import { Badge } from "@/components/ui/badge";
import { differenceInMinutes } from "date-fns";

export function SLATimerBadge({
  createdAt,
  targetMinutes,
  resolved,
}: {
  createdAt: string;
  targetMinutes?: number | null;
  resolved?: boolean;
}) {
  if (resolved || !targetMinutes) return null;
  const elapsed = differenceInMinutes(new Date(), new Date(createdAt));
  const remaining = targetMinutes - elapsed;
  if (remaining <= 0) {
    return (
      <Badge className="text-[10px] bg-destructive/15 text-destructive border-destructive/40">
        SLA breached
      </Badge>
    );
  }
  if (remaining < targetMinutes * 0.25) {
    return (
      <Badge className="text-[10px] bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/40">
        {remaining < 60 ? `${remaining}m left` : `${(remaining / 60).toFixed(1)}h left`}
      </Badge>
    );
  }
  return (
    <Badge className="text-[10px] bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/40">
      {remaining < 60 ? `${remaining}m` : `${(remaining / 60).toFixed(1)}h`}
    </Badge>
  );
}