import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

export interface KPI {
  label: string;
  value: string | number;
  sub?: string;
  icon: LucideIcon;
  color?: string;
}

export function KPIStrip({ items }: { items: KPI[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {items.map((k) => (
        <Card key={k.label}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className={`p-2.5 rounded-lg bg-muted ${k.color ?? "text-primary"}`}>
              <k.icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xl font-semibold text-foreground leading-tight">{k.value}</p>
              <p className="text-xs text-muted-foreground">{k.label}</p>
              {k.sub && <p className="text-[10px] text-muted-foreground/80 truncate">{k.sub}</p>}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}