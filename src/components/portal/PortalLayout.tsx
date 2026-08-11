import { Navigate, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/ThemeToggle";
import LogoLoader from "@/components/LogoLoader";
import { Activity, AlertTriangle, LogOut } from "lucide-react";
import iklickLogo from "@/assets/iklick_logo_full.png";

const NAV = [
  { title: "Performance", url: "/portal/performance", icon: Activity },
  { title: "Incidents", url: "/portal/incidents", icon: AlertTriangle },
];

export default function PortalLayout() {
  const { user, loading, isClient, signOut } = useAuth();

  if (loading) return <LogoLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (!isClient) return <Navigate to="/crm/dashboard" replace />;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <img src={iklickLogo} alt="iKlick Communications" className="h-7 object-contain" />
          <nav className="flex items-center gap-1">
            {NAV.map((n) => (
              <NavLink
                key={n.url}
                to={n.url}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
                    isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
                  }`
                }
              >
                <n.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{n.title}</span>
              </NavLink>
            ))}
            <ThemeToggle />
            <Button variant="ghost" size="sm" onClick={signOut} aria-label="Sign out">
              <LogOut className="h-4 w-4" />
            </Button>
          </nav>
        </div>
      </header>
      <main className="max-w-6xl mx-auto p-4 md:p-6">
        <Outlet />
      </main>
    </div>
  );
}