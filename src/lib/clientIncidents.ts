import { supabase } from "@/integrations/supabase/client";

/**
 * Returns the filter string for incidents affecting a client: either the
 * primary client_id or linked as an affected client via incident_clients.
 */
export async function clientIncidentOrFilter(clientId: string): Promise<string> {
  const { data } = await (supabase as any)
    .from("incident_clients")
    .select("incident_id")
    .eq("client_id", clientId);
  const ids: string[] = Array.from(new Set(((data as any[]) ?? []).map((r) => r.incident_id)));
  return ids.length ? `client_id.eq.${clientId},id.in.(${ids.join(",")})` : `client_id.eq.${clientId}`;
}
