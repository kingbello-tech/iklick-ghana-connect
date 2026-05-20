import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReactNode } from "react";

export interface QueueColumn<T> {
  header: string;
  cell: (row: T) => ReactNode;
  className?: string;
}

export function QueueTable<T extends { id: string }>({
  title,
  rows,
  columns,
  rowHref,
  empty = "Nothing in queue",
  action,
}: {
  title: ReactNode;
  rows: T[];
  columns: QueueColumn<T>[];
  rowHref?: (row: T) => string;
  empty?: string;
  action?: ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm text-muted-foreground">{title}</CardTitle>
        {action}
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">{empty}</p>
        ) : (
          <div className="divide-y divide-border">
            {rows.map((row) => {
              const inner = (
                <div className="grid gap-2 items-center py-2 px-1" style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0,1fr))` }}>
                  {columns.map((c, i) => (
                    <div key={i} className={c.className ?? "text-sm text-foreground truncate"}>
                      {c.cell(row)}
                    </div>
                  ))}
                </div>
              );
              return rowHref ? (
                <Link key={row.id} to={rowHref(row)} className="block hover:bg-muted/50 rounded-md">
                  {inner}
                </Link>
              ) : (
                <div key={row.id}>{inner}</div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}