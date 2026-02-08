import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { 
  initializeGA, 
  trackPageView,
  trackEvent,
  trackSignUp,
  trackLogin,
  trackOnboardingStep,
  trackProfileComplete,
  trackScholarshipView,
  trackScholarshipAddPipeline,
  trackScholarshipStatusChange,
  trackCollegeView,
  trackCollegeAddList,
  trackEssayCoachingStart,
  trackEssayCoachingFeedback,
  trackMaterialUpload,
  trackCheckoutStart,
  trackPurchase,
  trackSearch,
  trackFilter,
  trackShare,
  trackParentView
} from "@/lib/analytics";

// Initialize GA4 on first load
let isInitialized = false;

export const useAnalyticsInit = () => {
  useEffect(() => {
    if (!isInitialized) {
      initializeGA();
      isInitialized = true;
    }
  }, []);
};

// Track page views on route changes
export const usePageTracking = () => {
  const location = useLocation();

  useEffect(() => {
    trackPageView(location.pathname);
  }, [location.pathname]);
};

// Combined hook for convenience
export const useAnalytics = () => {
  useAnalyticsInit();
  usePageTracking();

  return {
    trackEvent,
    trackSignUp,
    trackLogin,
    trackOnboardingStep,
    trackProfileComplete,
    trackScholarshipView,
    trackScholarshipAddPipeline,
    trackScholarshipStatusChange,
    trackCollegeView,
    trackCollegeAddList,
    trackEssayCoachingStart,
    trackEssayCoachingFeedback,
    trackMaterialUpload,
    trackCheckoutStart,
    trackPurchase,
    trackSearch,
    trackFilter,
    trackShare,
    trackParentView
  };
};

export default useAnalytics;
