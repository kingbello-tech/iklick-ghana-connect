import { useAuth } from "@/contexts/AuthContext";
import CRMGlobalDashboard from "./CRMGlobalDashboard";
import MyDashboard from "./MyDashboard";

export default function CRMDashboard() {
  const { isAdmin } = useAuth();
  return isAdmin ? <CRMGlobalDashboard /> : <MyDashboard />;
}
