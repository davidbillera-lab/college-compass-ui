import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  trackPageViewDb,
  trackEventDb,
  trackSignUpDb,
  trackLoginDb,
  trackProfileCompleteDb,
  trackScholarshipViewDb,
  trackScholarshipAddPipelineDb,
  trackCollegeAddListDb,
  trackCheckoutStartDb,
  trackPurchaseDb,
  trackCTAClickDb,
  trackSignupConversionDb,
} from "@/lib/databaseAnalytics";

/**
 * Track page views on route changes
 */
export const usePageTracking = () => {
  const location = useLocation();

  useEffect(() => {
    trackPageViewDb(location.pathname);
  }, [location.pathname]);
};

/**
 * Combined hook for convenience - provides all analytics functions
 */
export const useDatabaseAnalytics = () => {
  usePageTracking();

  return {
    trackEvent: trackEventDb,
    trackSignUp: trackSignUpDb,
    trackLogin: trackLoginDb,
    trackProfileComplete: trackProfileCompleteDb,
    trackScholarshipView: trackScholarshipViewDb,
    trackScholarshipAddPipeline: trackScholarshipAddPipelineDb,
    trackCollegeAddList: trackCollegeAddListDb,
    trackCheckoutStart: trackCheckoutStartDb,
    trackPurchase: trackPurchaseDb,
    trackCTAClick: trackCTAClickDb,
    trackSignupConversion: trackSignupConversionDb,
  };
};

export default useDatabaseAnalytics;
