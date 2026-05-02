import { Card, CardContent } from "@/components/ui/card";
import { CalendarClock } from "lucide-react";

export default function PayrollRunsStub() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Payroll Runs</h1>
        <p className="text-sm text-muted-foreground">Monthly payroll processing.</p>
      </div>
      <Card>
        <CardContent className="p-10 text-center space-y-2">
          <CalendarClock className="h-10 w-10 mx-auto text-muted-foreground" />
          <p className="font-medium">Phase B — coming next</p>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Once you've added employees and confirmed the pay items and statutory bands, the next build adds monthly payroll runs with automatic gross/PAYE/SSNIT/Tier 2/net calculation.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}