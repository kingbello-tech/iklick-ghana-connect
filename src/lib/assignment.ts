import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type AppRole = Database["public"]["Enums"]["app_role"];

export type Department =
  | "sales"
  | "technology"
  | "service_delivery"
  | "finance"
  | "hr"
  | "client_experience";

export const DEPARTMENT_ROLES: Record<Department, AppRole[]> = {
  sales: ["sales_representative", "sales_manager"],
  technology: [
    "technology_engineer",
    "technology_manager",
    "network_engineer",
    "network_manager",
  ],
  service_delivery: ["service_delivery"],
  finance: ["finance_officer"],
  hr: ["hr_officer", "finance_officer"],
  client_experience: ["client_experience"],
};

export const DEPARTMENT_LABEL: Record<Department, string> = {
  sales: "Sales",
  technology: "Technology",
  service_delivery: "Service Delivery",
  finance: "Finance",
  hr: "HR",
  client_experience: "Client Experience",
};

export type AssignableProfile = {
  user_id: string;
  full_name: string | null;
  role: AppRole | null;
};

/**
 * Fetch profiles assignable to a given department.
 * Always includes admins so they remain assignable everywhere.
 * If `department` is undefined/null, returns all profiles (no filter).
 */
export function useDepartmentProfiles(
  department?: Department | null,
  options?: { includeAdmins?: boolean }
) {
  const includeAdmins = options?.includeAdmins ?? true;
  const [profiles, setProfiles] = useState<AssignableProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [pRes, rRes] = await Promise.all([
        supabase.from("profiles").select("user_id, full_name"),
        supabase.from("user_roles").select("user_id, role"),
      ]);
      if (cancelled) return;
      const roleMap = new Map<string, AppRole>();
      (rRes.data || []).forEach((r: any) => roleMap.set(r.user_id, r.role));
      const allowed = department ? new Set<AppRole>(DEPARTMENT_ROLES[department]) : null;
      const list: AssignableProfile[] = (pRes.data || [])
        .map((p: any) => ({ user_id: p.user_id, full_name: p.full_name, role: roleMap.get(p.user_id) ?? null }))
        .filter((p) => {
          if (!allowed) return true;
          if (!p.role) return false;
          if (includeAdmins && p.role === "admin") return true;
          return allowed.has(p.role);
        })
        .sort((a, b) => (a.full_name || "").localeCompare(b.full_name || ""));
      setProfiles(list);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [department, includeAdmins]);

  return { profiles, loading };
}