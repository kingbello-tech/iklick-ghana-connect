import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import CRMGlobalDashboard from "./CRMGlobalDashboard";
import MyDashboard from "./MyDashboard";
import CXDashboard from "./CXDashboard";
import NetworkManagerDashboard from "./NetworkManagerDashboard";
import TechEngineerDashboard from "./TechEngineerDashboard";
import HRDashboard from "./HRDashboard";
import ServiceDeliveryDashboard from "./projects/ServiceDeliveryDashboard";

export default function CRMDashboard() {
  const { isAdmin, role } = useAuth();
  if (isAdmin) return <CRMGlobalDashboard />;

  // Module-owners → their module dashboards (SDP-style home for the role)
  if (role === "sales_manager" || role === "sales_representative")
    return <Navigate to="/crm/sales/dashboard" replace />;
  if (role === "technology_manager")
    return <Navigate to="/crm/technology/dashboard" replace />;
  if (role === "finance_officer")
    return <Navigate to="/crm/finance/dashboard" replace />;
  if (role === "service_delivery") return <ServiceDeliveryDashboard />;

  // Role-specific dashboards built in this rewire
  if (role === "network_manager") return <NetworkManagerDashboard />;
  if (role === "technology_engineer") return <TechEngineerDashboard />;
  if (role === "hr_officer") return <HRDashboard />;
  if (role === "client_experience") return <CXDashboard />;

  // network_engineer and any other staff
  return <MyDashboard />;
}
