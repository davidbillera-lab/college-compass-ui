import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppProvider } from "./contexts/AppContext";
import { AppLayout } from "./components/layout/AppLayout";
import { Toaster } from "@/components/ui/sonner";

import Dashboard from "./pages/Dashboard";
import StudentProfile from "./pages/StudentProfile";
import CollegeMatches from "./pages/CollegeMatches";
import Scholarships from "./pages/Scholarships";
import Essays from "./pages/Essays";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          {/* App routes with sidebar layout */}
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<StudentProfile />} />
            <Route path="/colleges" element={<CollegeMatches />} />
            <Route path="/scholarships" element={<Scholarships />} />
            <Route path="/essays" element={<Essays />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
          
          {/* Redirect root to dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      <Toaster />
    </AppProvider>
  );
}
