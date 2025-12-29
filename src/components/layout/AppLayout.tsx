import { Outlet } from "react-router-dom";
import { TopNavbar } from "./TopNavbar";
import { AppSidebar } from "./AppSidebar";

export function AppLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TopNavbar />
      <div className="flex flex-1">
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          <div className="container py-6 px-4 md:px-6 lg:px-8 max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
