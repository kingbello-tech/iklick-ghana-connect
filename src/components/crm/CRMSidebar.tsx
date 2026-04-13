import { LayoutDashboard, AlertTriangle, Users, Settings, LogOut, ChevronLeft } from "lucide-react";
import { useLocation, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
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

const adminItems = [
  { title: "Settings", url: "/crm/settings", icon: Settings },
];

export function CRMSidebar() {
  const location = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const { signOut, isAdmin, profile } = useAuth();
  const collapsed = state === "collapsed";

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <Sidebar collapsible="icon" className="border-r border-[hsl(220,20%,15%)] bg-[hsl(220,30%,6%)]">
      <SidebarHeader className="p-4 flex flex-row items-center justify-between">
        {!collapsed && (
          <img src="/iKlick_logo_variations_on_transparent_background_1.PNG" alt="iKlick" className="h-8 object-contain" />
        )}
        <button onClick={toggleSidebar} className="text-[hsl(215,20%,65%)] hover:text-[hsl(210,40%,98%)] transition-colors">
          <ChevronLeft className={`h-4 w-4 transition-transform ${collapsed ? "rotate-180" : ""}`} />
        </button>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-[hsl(215,20%,45%)] text-xs uppercase tracking-wider">
            {!collapsed && "Operations"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <Link to={item.url} className="flex items-center gap-3 text-[hsl(215,20%,65%)] hover:text-[hsl(210,40%,98%)] data-[active=true]:text-primary data-[active=true]:bg-primary/10">
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-[hsl(215,20%,45%)] text-xs uppercase tracking-wider">
              {!collapsed && "Admin"}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive(item.url)}>
                      <Link to={item.url} className="flex items-center gap-3 text-[hsl(215,20%,65%)] hover:text-[hsl(210,40%,98%)] data-[active=true]:text-primary data-[active=true]:bg-primary/10">
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

      <SidebarFooter className="p-4 border-t border-[hsl(220,20%,15%)]">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-medium shrink-0">
            {profile?.full_name?.[0]?.toUpperCase() || "U"}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[hsl(210,40%,98%)] truncate">{profile?.full_name || "User"}</p>
              <p className="text-xs text-[hsl(215,20%,45%)] truncate capitalize">{profile?.department || "—"}</p>
            </div>
          )}
          {!collapsed && (
            <button onClick={signOut} className="text-[hsl(215,20%,45%)] hover:text-destructive transition-colors">
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
