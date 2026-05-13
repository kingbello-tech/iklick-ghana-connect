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
import SurveyPage from "./pages/SurveyPage";
import Projects from "./pages/Projects";
import Team from "./pages/Team";
import IntakeForm from "./pages/IntakeForm";
import NotFound from "./pages/NotFound";
import LoginPage from "./pages/LoginPage";
import CRMDashboard from "./pages/crm/CRMDashboard";
import IncidentList from "./pages/crm/IncidentList";
import IncidentDetail from "./pages/crm/IncidentDetail";
import ClientList from "./pages/crm/ClientList";
import UserManagement from "./pages/crm/UserManagement";
import SLAPolicies from "./pages/crm/SLAPolicies";
import AuditLogs from "./pages/crm/AuditLogs";
import ClientSatisfaction from "./pages/crm/ClientSatisfaction";
import SLAReports from "./pages/crm/SLAReports";
import PerformanceReports from "./pages/crm/PerformanceReports";
import StaffReport from "./pages/crm/StaffReport";
import ClientReport from "./pages/crm/ClientReport";
import SalesLeads from "./pages/crm/sales/SalesLeads";
import SalesPipeline from "./pages/crm/sales/SalesPipeline";
import SalesDashboard from "./pages/crm/sales/SalesDashboard";
import SalesTargets from "./pages/crm/sales/SalesTargets";
import IntakeLinks from "./pages/crm/sales/IntakeLinks";
import TechnologyDashboard from "./pages/crm/technology/TechnologyDashboard";
import SurveyQueue from "./pages/crm/technology/SurveyQueue";
import InstallationQueue from "./pages/crm/technology/InstallationQueue";
import FinanceDashboard from "./pages/crm/finance/FinanceDashboard";
import InvoiceList from "./pages/crm/finance/InvoiceList";
import InvoiceDetail from "./pages/crm/finance/InvoiceDetail";
import FinanceClients from "./pages/crm/finance/FinanceClients";
import Help from "./pages/crm/Help";
import EmployeesList from "./pages/crm/hr/EmployeesList";
import EmployeeDetail from "./pages/crm/hr/EmployeeDetail";
import PayItems from "./pages/crm/hr/PayItems";
import StatutorySettings from "./pages/crm/hr/StatutorySettings";
import PayrollRunsStub from "./pages/crm/hr/PayrollRunsStub";
import StatutoryReportsStub from "./pages/crm/hr/StatutoryReportsStub";
import MyPayslipsStub from "./pages/crm/MyPayslipsStub";

const queryClient = new QueryClient();

const SALES_ROLES = ["admin", "sales_representative", "sales_manager"] as any;
const TECH_ROLES = ["admin", "technology_engineer", "technology_manager"] as any;
const FINANCE_ROLES = ["admin", "finance_officer"] as any;
const HR_ROLES = ["admin", "finance_officer", "hr_officer"] as any;

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
              <Route path="/team" element={<Team />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/survey/:token" element={<SurveyPage />} />
              <Route path="/intake/:token" element={<IntakeForm />} />

              {/* CRM routes */}
              <Route path="/crm" element={<ProtectedRoute><CRMLayout /></ProtectedRoute>}>
                <Route path="dashboard" element={<CRMDashboard />} />
                <Route path="help" element={<Help />} />
                <Route path="incidents" element={<IncidentList />} />
                <Route path="incidents/:id" element={<IncidentDetail />} />
                <Route path="clients" element={<ClientList />} />
                <Route path="satisfaction" element={<ProtectedRoute allowedRoles={["admin", "client_experience"]}><ClientSatisfaction /></ProtectedRoute>} />
                <Route path="sla-reports" element={<ProtectedRoute allowedRoles={["admin", "client_experience", "network_manager"]}><SLAReports /></ProtectedRoute>} />
                <Route path="settings" element={<ProtectedRoute allowedRoles={["admin"]}><UserManagement /></ProtectedRoute>} />
                <Route path="sla-policies" element={<ProtectedRoute allowedRoles={["admin"]}><SLAPolicies /></ProtectedRoute>} />
                <Route path="performance" element={<ProtectedRoute allowedRoles={["admin", "network_manager"]}><PerformanceReports /></ProtectedRoute>} />
                <Route path="performance/staff/:userId" element={<ProtectedRoute allowedRoles={["admin", "network_manager"]}><StaffReport /></ProtectedRoute>} />
                <Route path="performance/client/:clientId" element={<ProtectedRoute allowedRoles={["admin", "network_manager"]}><ClientReport /></ProtectedRoute>} />
                <Route path="audit-logs" element={<ProtectedRoute allowedRoles={["admin"]}><AuditLogs /></ProtectedRoute>} />

                {/* Sales routes */}
                <Route path="sales/dashboard" element={<ProtectedRoute allowedRoles={SALES_ROLES}><SalesDashboard /></ProtectedRoute>} />
                <Route path="sales/leads" element={<ProtectedRoute allowedRoles={SALES_ROLES}><SalesLeads /></ProtectedRoute>} />
                <Route path="sales/pipeline" element={<ProtectedRoute allowedRoles={SALES_ROLES}><SalesPipeline /></ProtectedRoute>} />
                <Route path="sales/targets" element={<ProtectedRoute allowedRoles={SALES_ROLES}><SalesTargets /></ProtectedRoute>} />
                <Route path="sales/intake-links" element={<ProtectedRoute allowedRoles={SALES_ROLES}><IntakeLinks /></ProtectedRoute>} />

                {/* Technology routes */}
                <Route path="technology/dashboard" element={<ProtectedRoute allowedRoles={TECH_ROLES}><TechnologyDashboard /></ProtectedRoute>} />
                <Route path="technology/surveys" element={<ProtectedRoute allowedRoles={TECH_ROLES}><SurveyQueue /></ProtectedRoute>} />
                <Route path="technology/installations" element={<ProtectedRoute allowedRoles={TECH_ROLES}><InstallationQueue /></ProtectedRoute>} />

                {/* Finance routes */}
                <Route path="finance/dashboard" element={<ProtectedRoute allowedRoles={FINANCE_ROLES}><FinanceDashboard /></ProtectedRoute>} />
                <Route path="finance/invoices" element={<ProtectedRoute allowedRoles={FINANCE_ROLES}><InvoiceList /></ProtectedRoute>} />
                <Route path="finance/invoices/:id" element={<ProtectedRoute allowedRoles={FINANCE_ROLES}><InvoiceDetail /></ProtectedRoute>} />
                <Route path="finance/clients" element={<ProtectedRoute allowedRoles={FINANCE_ROLES}><FinanceClients /></ProtectedRoute>} />

                {/* HR & Payroll */}
                <Route path="hr/employees" element={<ProtectedRoute allowedRoles={HR_ROLES}><EmployeesList /></ProtectedRoute>} />
                <Route path="hr/employees/:id" element={<ProtectedRoute allowedRoles={HR_ROLES}><EmployeeDetail /></ProtectedRoute>} />
                <Route path="hr/pay-items" element={<ProtectedRoute allowedRoles={HR_ROLES}><PayItems /></ProtectedRoute>} />
                <Route path="hr/statutory-settings" element={<ProtectedRoute allowedRoles={["admin"] as any}><StatutorySettings /></ProtectedRoute>} />
                <Route path="hr/payroll-runs" element={<ProtectedRoute allowedRoles={HR_ROLES}><PayrollRunsStub /></ProtectedRoute>} />
                <Route path="hr/statutory-reports" element={<ProtectedRoute allowedRoles={HR_ROLES}><StatutoryReportsStub /></ProtectedRoute>} />
                <Route path="me/payslips" element={<MyPayslipsStub />} />
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
