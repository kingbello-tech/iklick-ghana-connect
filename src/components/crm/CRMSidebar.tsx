import { LayoutDashboard, AlertTriangle, Users, Settings, LogOut, ChevronLeft, Clock, FileText, Heart, BarChart3, Target, TrendingUp, ClipboardCheck, Wrench, Wifi, Receipt, Wallet, BookOpen, UserCog, Coins, CalendarClock, FileSpreadsheet, ScrollText, Link2, FolderKanban, Repeat, Video } from "lucide-react";

const CediSign = ({ className }: { className?: string }) => (
  <span className={`inline-flex items-center justify-center font-bold ${className ?? ""}`} aria-hidden="true">₵</span>
);
import { useLocation, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import iklickLogo from "@/assets/iklick_logo_full.png";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";

const navItems = [
  { title: "Dashboard", url: "/crm/dashboard", icon: LayoutDashboard },
  { title: "Projects", url: "/crm/projects", icon: FolderKanban },
  { title: "Clients", url: "/crm/clients", icon: Users },
  { title: "Help & Workflow", url: "/crm/help", icon: BookOpen },
];

const cxItems = [
  { title: "Incidents", url: "/crm/incidents", icon: AlertTriangle },
  { title: "Recurring Issues", url: "/crm/recurring-issues", icon: Repeat },
  { title: "Satisfaction", url: "/crm/satisfaction", icon: Heart },
  { title: "SLA Reports", url: "/crm/sla-reports", icon: Clock },
];

// Items visible to Technology Engineers (no surveys/installs queue)
const techEngineerItems = [
  { title: "Incidents", url: "/crm/incidents", icon: AlertTriangle },
];

// Items visible to Network Engineers (incidents only from Technology dept)
const networkEngineerItems = [
  { title: "Incidents", url: "/crm/incidents", icon: AlertTriangle },
];

const adminItems = [
  { title: "User Management", url: "/crm/settings", icon: Settings },
  { title: "SLA Policies", url: "/crm/sla-policies", icon: Clock },
  { title: "Performance", url: "/crm/performance", icon: BarChart3 },
  { title: "Audit Logs", url: "/crm/audit-logs", icon: FileText },
];

const salesItems = [
  { title: "Sales Dashboard", url: "/crm/sales/dashboard", icon: CediSign },
  { title: "Leads", url: "/crm/sales/leads", icon: Target },
  { title: "Pipeline", url: "/crm/sales/pipeline", icon: TrendingUp },
  { title: "Intake Links", url: "/crm/sales/intake-links", icon: Link2 },
  { title: "Targets", url: "/crm/sales/targets", icon: BarChart3 },
];

// Full Technology section (manager/admin)
const technologyItems = [
  { title: "Tech Dashboard", url: "/crm/technology/dashboard", icon: Wifi },
  { title: "Incidents", url: "/crm/incidents", icon: AlertTriangle },
  { title: "Recurring Issues", url: "/crm/recurring-issues", icon: Repeat },
  { title: "Site Surveys", url: "/crm/technology/surveys", icon: ClipboardCheck },
  { title: "Installations", url: "/crm/technology/installations", icon: Wrench },
];

const financeItems = [
  { title: "Finance Dashboard", url: "/crm/finance/dashboard", icon: Wallet },
  { title: "Invoices", url: "/crm/finance/invoices", icon: Receipt },
  { title: "Payments", url: "/crm/finance/payments", icon: Coins },
  { title: "Clients", url: "/crm/finance/clients", icon: Users },
];

const hrItems = [
  { title: "Employees", url: "/crm/hr/employees", icon: UserCog },
  { title: "Pay Items", url: "/crm/hr/pay-items", icon: Coins },
  { title: "Payroll Runs", url: "/crm/hr/payroll-runs", icon: CalendarClock },
  { title: "Statutory Reports", url: "/crm/hr/statutory-reports", icon: FileSpreadsheet },
];

const hrAdminItems = [
  { title: "Statutory Settings", url: "/crm/hr/statutory-settings", icon: ScrollText },
];

const serviceDeliveryItems = [
  { title: "SD Dashboard", url: "/crm/service-delivery/dashboard", icon: FolderKanban },
  { title: "Projects", url: "/crm/projects", icon: FolderKanban },
];

export function CRMSidebar() {
  const location = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const { signOut, isAdmin, profile, role, hasSalesAccess, hasTechnologyAccess, hasFinanceAccess, hasHRAccess, hasServiceDeliveryAccess, user } = useAuth();
  const collapsed = state === "collapsed";
  const isCX = role === "client_experience" || role === "network_manager" || isAdmin;
  const isNetworkManager = role === "network_manager";

  // Pick correct technology section per role
  const techMenu =
    role === "technology_engineer"
      ? techEngineerItems
      : role === "network_engineer"
      ? networkEngineerItems
      : technologyItems; // admin, technology_manager, network_manager get the full queue

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <Sidebar collapsible="icon" className="border-r border-border bg-card">
      <SidebarHeader className="p-4 flex flex-row items-center justify-between">
        {!collapsed && (
          <img src={iklickLogo} alt="iKlick" className="h-8 object-contain" />
        )}
        <button onClick={toggleSidebar} className="text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className={`h-4 w-4 transition-transform ${collapsed ? "rotate-180" : ""}`} />
        </button>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground text-xs uppercase tracking-wider">
            {!collapsed && "Operations"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <Link to={item.url} className="flex items-center gap-3 text-muted-foreground hover:text-foreground data-[active=true]:text-primary data-[active=true]:bg-primary/10">
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isCX && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-muted-foreground text-xs uppercase tracking-wider">
              {!collapsed && "Client Experience"}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {cxItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive(item.url)}>
                      <Link to={item.url} className="flex items-center gap-3 text-muted-foreground hover:text-foreground data-[active=true]:text-primary data-[active=true]:bg-primary/10">
                        <item.icon className="h-4 w-4 shrink-0" />
                        {!collapsed && <span>{item.title}</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {hasSalesAccess && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-muted-foreground text-xs uppercase tracking-wider">
              {!collapsed && "Sales"}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {salesItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive(item.url)}>
                      <Link to={item.url} className="flex items-center gap-3 text-muted-foreground hover:text-foreground data-[active=true]:text-primary data-[active=true]:bg-primary/10">
                        <item.icon className="h-4 w-4 shrink-0" />
                        {!collapsed && <span>{item.title}</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {hasTechnologyAccess && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-muted-foreground text-xs uppercase tracking-wider">
              {!collapsed && "Technology"}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {techMenu.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive(item.url)}>
                      <Link to={item.url} className="flex items-center gap-3 text-muted-foreground hover:text-foreground data-[active=true]:text-primary data-[active=true]:bg-primary/10">
                        <item.icon className="h-4 w-4 shrink-0" />
                        {!collapsed && <span>{item.title}</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {hasFinanceAccess && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-muted-foreground text-xs uppercase tracking-wider">
              {!collapsed && "Finance"}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {financeItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive(item.url)}>
                      <Link to={item.url} className="flex items-center gap-3 text-muted-foreground hover:text-foreground data-[active=true]:text-primary data-[active=true]:bg-primary/10">
                        <item.icon className="h-4 w-4 shrink-0" />
                        {!collapsed && <span>{item.title}</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {hasHRAccess && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-muted-foreground text-xs uppercase tracking-wider">
              {!collapsed && "HR & Payroll"}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {hrItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive(item.url)}>
                      <Link to={item.url} className="flex items-center gap-3 text-muted-foreground hover:text-foreground data-[active=true]:text-primary data-[active=true]:bg-primary/10">
                        <item.icon className="h-4 w-4 shrink-0" />
                        {!collapsed && <span>{item.title}</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
                {isAdmin && hrAdminItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive(item.url)}>
                      <Link to={item.url} className="flex items-center gap-3 text-muted-foreground hover:text-foreground data-[active=true]:text-primary data-[active=true]:bg-primary/10">
                        <item.icon className="h-4 w-4 shrink-0" />
                        {!collapsed && <span>{item.title}</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {hasServiceDeliveryAccess && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-muted-foreground text-xs uppercase tracking-wider">
              {!collapsed && "Service Delivery"}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {serviceDeliveryItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive(item.url)}>
                      <Link to={item.url} className="flex items-center gap-3 text-muted-foreground hover:text-foreground data-[active=true]:text-primary data-[active=true]:bg-primary/10">
                        <item.icon className="h-4 w-4 shrink-0" />
                        {!collapsed && <span>{item.title}</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {user && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-muted-foreground text-xs uppercase tracking-wider">
              {!collapsed && "Me"}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive("/crm/me/payslips")}>
                    <Link to="/crm/me/payslips" className="flex items-center gap-3 text-muted-foreground hover:text-foreground data-[active=true]:text-primary data-[active=true]:bg-primary/10">
                      <Receipt className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>My Payslips</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive("/crm/meeting-links")}>
                    <Link to="/crm/meeting-links" className="flex items-center gap-3 text-muted-foreground hover:text-foreground data-[active=true]:text-primary data-[active=true]:bg-primary/10">
                      <Video className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>Meeting Link</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {isNetworkManager && !isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-muted-foreground text-xs uppercase tracking-wider">
              {!collapsed && "Management"}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {[
                  { title: "Performance", url: "/crm/performance", icon: BarChart3 },
                ].map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive(item.url)}>
                      <Link to={item.url} className="flex items-center gap-3 text-muted-foreground hover:text-foreground data-[active=true]:text-primary data-[active=true]:bg-primary/10">
                        <item.icon className="h-4 w-4 shrink-0" />
                        {!collapsed && <span>{item.title}</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-muted-foreground text-xs uppercase tracking-wider">
              {!collapsed && "Admin"}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive(item.url)}>
                      <Link to={item.url} className="flex items-center gap-3 text-muted-foreground hover:text-foreground data-[active=true]:text-primary data-[active=true]:bg-primary/10">
                        <item.icon className="h-4 w-4 shrink-0" />
                        {!collapsed && <span>{item.title}</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-border">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-medium shrink-0">
            {profile?.full_name?.[0]?.toUpperCase() || "U"}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{profile?.full_name || "User"}</p>
              <p className="text-xs text-muted-foreground truncate capitalize">{role?.replace("_", " ") || "—"}</p>
            </div>
          )}
          {!collapsed && (
            <button onClick={signOut} className="text-muted-foreground hover:text-destructive transition-colors">
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}