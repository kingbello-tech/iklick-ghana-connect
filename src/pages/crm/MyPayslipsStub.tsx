import { Card, CardContent } from "@/components/ui/card";
import { Receipt } from "lucide-react";

export default function MyPayslipsStub() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">My Payslips</h1>
        <p className="text-sm text-muted-foreground">Your monthly payslips will appear here.</p>
      </div>
      <Card>
        <CardContent className="p-10 text-center space-y-2">
          <Receipt className="h-10 w-10 mx-auto text-muted-foreground" />
          <p className="font-medium">No payslips yet</p>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Once HR processes the first monthly payroll run, your payslips will be available here for download.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}