import { Card, CardContent } from "@/components/ui/card";
import { FileSpreadsheet } from "lucide-react";

export default function StatutoryReportsStub() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Statutory Reports</h1>
        <p className="text-sm text-muted-foreground">GRA PAYE & SSNIT filing exports.</p>
      </div>
      <Card>
        <CardContent className="p-10 text-center space-y-2">
          <FileSpreadsheet className="h-10 w-10 mx-auto text-muted-foreground" />
          <p className="font-medium">Phase D — coming after payroll runs</p>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Once monthly runs are processed, this page will export GRA PAYE and SSNIT contribution schedules in CSV/PDF formats.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}