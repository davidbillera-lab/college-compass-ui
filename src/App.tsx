import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppProvider } from "./contexts/AppContext";
import { AppLayout } from "./components/layout/AppLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Toaster } from "@/components/ui/sonner";

import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
import ProfilePage from "./pages/ProfilePage";
import CollegeMatches from "./pages/CollegeMatches";
import DiscoveryPage from "./pages/DiscoveryPage";
import Scholarships from "./pages/Scholarships";
import Essays from "./pages/Essays";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import ScholarshipsIntelPage from "./pages/ScholarshipsIntelPage";
import ScholarshipsIntelAdminPage from "./pages/ScholarshipsIntelAdminPage";

import OnboardingGate from "./onboarding/OnboardingGate";
import WelcomePage from "./onboarding/WelcomePage";
import OnboardingBasicsPage from "./onboarding/OnboardingBasicsPage";
import OnboardingStoryPage from "./onboarding/OnboardingStoryPage";
import OnboardingActivitiesPage from "./onboarding/OnboardingActivitiesPage";
import OnboardingResultsPage from "./onboarding/OnboardingResultsPage";

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          {/* Auth routes */}
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/login" element={<Navigate to="/auth" replace />} />
          
          {/* Onboarding routes */}
          <Route path="/start" element={<OnboardingGate />} />
          <Route path="/welcome" element={<WelcomePage />} />
          <Route path="/onboarding/basics" element={<OnboardingBasicsPage />} />
          <Route path="/onboarding/story" element={<OnboardingStoryPage />} />
          <Route path="/onboarding/activities" element={<OnboardingActivitiesPage />} />
          <Route path="/onboarding/results" element={<OnboardingResultsPage />} />
          
          {/* Protected app routes with sidebar layout */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/discovery" element={<DiscoveryPage />} />
              <Route path="/colleges" element={<CollegeMatches />} />
              <Route path="/scholarships" element={<Scholarships />} />
              <Route path="/scholarships-intel" element={<ScholarshipsIntelPage />} />
              <Route path="/scholarships-intel/admin" element={<ScholarshipsIntelAdminPage />} />
              <Route path="/essays" element={<Essays />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
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
