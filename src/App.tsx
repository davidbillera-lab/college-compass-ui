import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppProvider } from "./contexts/AppContext";
import { SubscriptionProvider } from "./contexts/SubscriptionContext";
import { AppLayout } from "./components/layout/AppLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Toaster } from "@/components/ui/sonner";
import { useAnalytics } from "@/hooks/useAnalytics";
import { usePageTracking } from "@/hooks/useDatabaseAnalytics";

import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
import ProfilePage from "./pages/ProfilePage";
import CollegeMatches from "./pages/CollegeMatches";
import CollegeCompare from "./pages/CollegeCompare";
import CollegeLibraryPage from "./pages/CollegeLibraryPage";
import DiscoveryPage from "./pages/DiscoveryPage";
import Scholarships from "./pages/Scholarships";
import Essays from "./pages/Essays";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import ScholarshipsIntelPage from "./pages/ScholarshipsIntelPage";
import ScholarshipsIntelAdminPage from "./pages/ScholarshipsIntelAdminPage";
import CollegeListsPage from "./pages/CollegeListsPage";
import SharedListPage from "./pages/SharedListPage";
import PortfolioPage from "./pages/PortfolioPage";
import SharedPortfolioPage from "./pages/SharedPortfolioPage";
import ApplicationTrackerPage from "./pages/ApplicationTrackerPage";
import DeadlineHubPage from "./pages/DeadlineHubPage";
import LandingPage from "./pages/LandingPage";
import PricingPage from "./pages/PricingPage";
import ParentDashboard from "./pages/ParentDashboard";
import AdminMonitoringPage from "./pages/AdminMonitoringPage";

import OnboardingGate from "./onboarding/OnboardingGate";
import WelcomePage from "./onboarding/WelcomePage";
import OnboardingBasicsPage from "./onboarding/OnboardingBasicsPage";
import OnboardingStoryPage from "./onboarding/OnboardingStoryPage";
import OnboardingActivitiesPage from "./onboarding/OnboardingActivitiesPage";
import OnboardingResultsPage from "./onboarding/OnboardingResultsPage";
import OnboardingAcademicsPage from "./onboarding/OnboardingAcademicsPage";
import OnboardingFinancialPage from "./onboarding/OnboardingFinancialPage";

const queryClient = new QueryClient();

// Analytics wrapper component
function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  useAnalytics();
  usePageTracking(); // Track page views in database
  return <>{children}</>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <SubscriptionProvider>
        <BrowserRouter>
          <AnalyticsProvider>
            <Routes>
              {/* Public landing page */}
              <Route path="/" element={<LandingPage />} />
              
              {/* Auth routes */}
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/login" element={<Navigate to="/auth" replace />} />
              
              {/* Onboarding routes */}
              <Route path="/start" element={<OnboardingGate />} />
              <Route path="/welcome" element={<WelcomePage />} />
              <Route path="/onboarding/basics" element={<OnboardingBasicsPage />} />
              <Route path="/onboarding/story" element={<OnboardingStoryPage />} />
              <Route path="/onboarding/academics" element={<OnboardingAcademicsPage />} />
              <Route path="/onboarding/financial" element={<OnboardingFinancialPage />} />
              <Route path="/onboarding/activities" element={<OnboardingActivitiesPage />} />
              <Route path="/onboarding/results" element={<OnboardingResultsPage />} />
              
              {/* Public shared list page */}
              <Route path="/shared-list/:shareToken" element={<SharedListPage />} />
              
              {/* Public shared portfolio page */}
              <Route path="/shared-portfolio/:shareToken" element={<SharedPortfolioPage />} />
              
              {/* Protected app routes with sidebar layout */}
              <Route element={<ProtectedRoute />}>
                <Route element={<AppLayout />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/parent" element={<ParentDashboard />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/discovery" element={<DiscoveryPage />} />
                  <Route path="/college-library" element={<CollegeLibraryPage />} />
                  <Route path="/college-compare" element={<CollegeCompare />} />
                  <Route path="/colleges" element={<CollegeMatches />} />
                  <Route path="/college-lists" element={<CollegeListsPage />} />
                  <Route path="/scholarships" element={<Scholarships />} />
                  <Route path="/scholarships-intel" element={<ScholarshipsIntelPage />} />
                  <Route path="/scholarships-intel/admin" element={<ScholarshipsIntelAdminPage />} />
                  <Route path="/essays" element={<Essays />} />
                  <Route path="/portfolio" element={<PortfolioPage />} />
                  <Route path="/applications" element={<ApplicationTrackerPage />} />
                  <Route path="/deadlines" element={<DeadlineHubPage />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/admin/monitoring" element={<AdminMonitoringPage />} />
                  <Route path="/pricing" element={<PricingPage />} />
                </Route>
              </Route>
              
              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AnalyticsProvider>
        </BrowserRouter>
        <Toaster />
        </SubscriptionProvider>
      </AppProvider>
    </QueryClientProvider>
  );
}
