import { useAuth } from "@/contexts/AuthContext";
import CRMGlobalDashboard from "./CRMGlobalDashboard";
import MyDashboard from "./MyDashboard";
import CXDashboard from "./CXDashboard";

export default function CRMDashboard() {
  const { isAdmin, role } = useAuth();
  if (isAdmin) return <CRMGlobalDashboard />;
  if (role === "client_experience") return <CXDashboard />;
  return <MyDashboard />;
}
