import { LayoutDashboard, AlertTriangle, Users, Settings, LogOut, ChevronLeft, Clock, FileText, Heart, BarChart3, Target, TrendingUp, ClipboardCheck, Wrench, Wifi, Receipt, Wallet } from "lucide-react";

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
  { title: "Incidents", url: "/crm/incidents", icon: AlertTriangle },
  { title: "Clients", url: "/crm/clients", icon: Users },
];

const cxItems = [
  { title: "Satisfaction", url: "/crm/satisfaction", icon: Heart },
  { title: "SLA Reports", url: "/crm/sla-reports", icon: Clock },
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
  { title: "Targets", url: "/crm/sales/targets", icon: BarChart3 },
];

const technologyItems = [
  { title: "Tech Dashboard", url: "/crm/technology/dashboard", icon: Wifi },
  { title: "Site Surveys", url: "/crm/technology/surveys", icon: ClipboardCheck },
  { title: "Installations", url: "/crm/technology/installations", icon: Wrench },
];

const financeItems = [
  { title: "Finance Dashboard", url: "/crm/finance/dashboard", icon: Wallet },
  { title: "Invoices", url: "/crm/finance/invoices", icon: Receipt },
  { title: "Clients", url: "/crm/finance/clients", icon: Users },
];

export function CRMSidebar() {
  const location = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const { signOut, isAdmin, profile, role, hasSalesAccess, hasTechnologyAccess, hasFinanceAccess } = useAuth();
  const collapsed = state === "collapsed";
  const isCX = role === "client_experience" || role === "network_manager" || isAdmin;
  const isNetworkManager = role === "network_manager";

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
                {technologyItems.map((item) => (
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