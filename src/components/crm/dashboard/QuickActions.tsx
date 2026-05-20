import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";

export interface QuickAction {
  label: string;
  to: string;
  icon: LucideIcon;
  variant?: "default" | "outline" | "secondary";
}

export function QuickActions({ actions }: { actions: QuickAction[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((a) => (
        <Button key={a.label} asChild size="sm" variant={a.variant ?? "outline"}>
          <Link to={a.to} className="flex items-center gap-2">
            <a.icon className="h-4 w-4" />
            {a.label}
          </Link>
        </Button>
      ))}
    </div>
  );
}