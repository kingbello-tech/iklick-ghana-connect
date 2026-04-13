import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/crm/ProtectedRoute";
import { CRMLayout } from "@/components/crm/CRMLayout";
import Home from "./pages/Home";
import Projects from "./pages/Projects";
import NotFound from "./pages/NotFound";
import LoginPage from "./pages/LoginPage";
import CRMDashboard from "./pages/crm/CRMDashboard";
import IncidentList from "./pages/crm/IncidentList";
import IncidentDetail from "./pages/crm/IncidentDetail";
import ClientList from "./pages/crm/ClientList";
import UserManagement from "./pages/crm/UserManagement";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              {/* Public website */}
              <Route path="/" element={<Home />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/login" element={<LoginPage />} />

              {/* CRM routes */}
              <Route path="/crm" element={<ProtectedRoute><CRMLayout /></ProtectedRoute>}>
                <Route path="dashboard" element={<CRMDashboard />} />
                <Route path="incidents" element={<IncidentList />} />
                <Route path="incidents/:id" element={<IncidentDetail />} />
                <Route path="clients" element={<ClientList />} />
                <Route path="settings" element={<ProtectedRoute allowedRoles={["admin"]}><UserManagement /></ProtectedRoute>} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
