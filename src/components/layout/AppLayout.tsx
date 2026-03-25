import { useState } from "react";
import { Outlet } from "react-router-dom";
import { TopNavbar } from "./TopNavbar";
import { AppSidebar } from "./AppSidebar";
import { TrialBanner } from "@/components/subscription/PremiumGate";

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TopNavbar onMenuClick={() => setSidebarOpen(true)} />
      <TrialBanner />
      <div className="flex flex-1">
        <AppSidebar 
          mobileOpen={sidebarOpen} 
          onMobileClose={() => setSidebarOpen(false)}
          collapsed={sidebarCollapsed}
          onCollapsedChange={setSidebarCollapsed}
        />
        <main className="flex-1 overflow-auto">
          <div className="container py-6 px-4 md:px-6 lg:px-8 max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
