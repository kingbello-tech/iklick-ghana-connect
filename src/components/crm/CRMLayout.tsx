import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { CRMSidebar } from "./CRMSidebar";

export function CRMLayout() {
  return (
    <div className="dark">
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-[hsl(222,47%,5%)] text-[hsl(210,40%,98%)]">
          <CRMSidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <header className="h-12 flex items-center border-b border-[hsl(220,20%,15%)] px-4 bg-[hsl(220,30%,6%)]">
              <SidebarTrigger className="text-[hsl(215,20%,65%)] hover:text-[hsl(210,40%,98%)]" />
              <span className="ml-3 text-xs text-[hsl(215,20%,45%)] uppercase tracking-wider">iKlick NOC</span>
            </header>
            <main className="flex-1 overflow-auto p-6">
              <Outlet />
            </main>
          </div>
        </div>
      </SidebarProvider>
    </div>
  );
}
