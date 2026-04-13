import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import type { Database } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type Incident = Database["public"]["Tables"]["incidents"]["Row"];
type IncidentStatus = Database["public"]["Enums"]["incident_status"];

const COLUMNS: { status: IncidentStatus; label: string; color: string }[] = [
  { status: "open", label: "Open", color: "hsl(195, 100%, 42%)" },
  { status: "in_progress", label: "In Progress", color: "hsl(45, 93%, 47%)" },
  { status: "escalated", label: "Escalated", color: "hsl(0, 84%, 60%)" },
  { status: "resolved", label: "Resolved", color: "hsl(142, 71%, 45%)" },
  { status: "closed", label: "Closed", color: "hsl(215, 20%, 45%)" },
];

const PRIORITY_COLORS: Record<string, string> = {
  critical: "hsl(0, 84%, 60%)",
  high: "hsl(25, 95%, 53%)",
  medium: "hsl(45, 93%, 47%)",
  low: "hsl(142, 71%, 45%)",
};

interface Props {
  incidents: Incident[];
  clientMap: Record<string, string>;
  onRefresh: () => void;
}

export function IncidentKanban({ incidents, clientMap, onRefresh }: Props) {
  const { toast } = useToast();

  const handleDrop = async (incidentId: string, newStatus: IncidentStatus) => {
    const updates: any = { status: newStatus };
    if (newStatus === "resolved") updates.resolved_at = new Date().toISOString();
    if (newStatus === "closed") updates.closed_at = new Date().toISOString();

    const { error } = await supabase.from("incidents").update(updates).eq("id", incidentId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      onRefresh();
    }
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {COLUMNS.map((col) => {
        const items = incidents.filter((i) => i.status === col.status);
        return (
          <div
            key={col.status}
            className="flex-shrink-0 w-[260px]"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              const id = e.dataTransfer.getData("incidentId");
              if (id) handleDrop(id, col.status);
            }}
          >
            <div className="flex items-center gap-2 mb-3 px-1">
              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: col.color }} />
              <span className="text-xs font-medium text-[hsl(215,20%,65%)] uppercase tracking-wider">{col.label}</span>
              <span className="text-xs text-[hsl(215,20%,45%)] ml-auto">{items.length}</span>
            </div>
            <div className="space-y-2 min-h-[200px]">
              {items.map((inc) => (
                <div
                  key={inc.id}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData("incidentId", inc.id)}
                  className="p-3 rounded-lg bg-[hsl(220,30%,8%)] border border-[hsl(220,20%,15%)] hover:border-[hsl(220,20%,22%)] cursor-grab active:cursor-grabbing transition-colors"
                >
                  <Link to={`/crm/incidents/${inc.id}`} className="block">
                    <p className="text-xs font-mono text-[hsl(215,20%,45%)] mb-1">{inc.incident_number}</p>
                    <p className="text-sm text-[hsl(210,40%,98%)] mb-2 line-clamp-2">{inc.title}</p>
                    <div className="flex items-center justify-between">
                      <Badge className="text-[9px]" style={{ backgroundColor: `${PRIORITY_COLORS[inc.priority]}20`, color: PRIORITY_COLORS[inc.priority], borderColor: `${PRIORITY_COLORS[inc.priority]}40` }}>
                        {inc.priority}
                      </Badge>
                      {inc.client_id && (
                        <span className="text-[10px] text-[hsl(215,20%,45%)] truncate max-w-[100px]">{clientMap[inc.client_id]}</span>
                      )}
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
