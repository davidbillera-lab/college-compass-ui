/**
 * Google Analytics 4 Analytics Module
 * 
 * SETUP INSTRUCTIONS:
 * 1. Go to https://analytics.google.com/
 * 2. Create a new GA4 property for "Campus Climb Kit"
 * 3. Get your Measurement ID (format: G-XXXXXXXXXX)
 * 4. Replace the GA_MEASUREMENT_ID below with your actual ID
 * 
 * Key Events Tracked:
 * - page_view: Automatic page navigation
 * - sign_up: User registration
 * - login: User authentication
 * - profile_complete: Onboarding completion
 * - scholarship_view: Scholarship discovery
 * - scholarship_add_pipeline: Scholarship added to pipeline
 * - essay_coaching_start: AI essay coach session
 * - college_add_list: College added to list
 * - checkout_start: Payment initiation
 * - purchase: Subscription conversion
 */

// Replace with your actual GA4 Measurement ID
export const GA_MEASUREMENT_ID = "G-XXXXXXXXXX";

// Initialize GA4 (called once on app load)
export const initializeGA = () => {
  if (typeof window === "undefined" || GA_MEASUREMENT_ID === "G-XXXXXXXXXX") {
    console.warn("[Analytics] GA4 not configured. Set GA_MEASUREMENT_ID in src/lib/analytics.ts");
    return;
  }

  // Load gtag script
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  // Initialize dataLayer
  window.dataLayer = window.dataLayer || [];
  function gtag(...args: unknown[]) {
    window.dataLayer.push(args);
  }
  window.gtag = gtag;
  
  gtag("js", new Date());
  gtag("config", GA_MEASUREMENT_ID, {
    send_page_view: false, // We'll handle page views manually
  });

  console.log("[Analytics] GA4 initialized");
};

// Track page views (call on route changes)
export const trackPageView = (path: string, title?: string) => {
  if (!window.gtag) return;
  
  window.gtag("event", "page_view", {
    page_path: path,
    page_title: title || document.title,
  });
};

// Track custom events
export const trackEvent = (
  eventName: string,
  parameters?: Record<string, string | number | boolean>
) => {
  if (!window.gtag) {
    console.log("[Analytics] Event (not sent - GA not configured):", eventName, parameters);
    return;
  }
  
  window.gtag("event", eventName, parameters);
  console.log("[Analytics] Event:", eventName, parameters);
};

// ========== CONVERSION FUNNEL EVENTS ==========

// Authentication events
export const trackSignUp = (method: string = "email") => {
  trackEvent("sign_up", { method });
};

export const trackLogin = (method: string = "email") => {
  trackEvent("login", { method });
};

// Onboarding funnel
export const trackOnboardingStep = (step: string, stepNumber: number) => {
  trackEvent("onboarding_step", { step, step_number: stepNumber });
};

export const trackProfileComplete = (completionPercent: number) => {
  trackEvent("profile_complete", { completion_percent: completionPercent });
};

// Scholarship funnel
export const trackScholarshipView = (scholarshipId: string, scholarshipName: string) => {
  trackEvent("scholarship_view", { 
    scholarship_id: scholarshipId, 
    scholarship_name: scholarshipName 
  });
};

export const trackScholarshipAddPipeline = (scholarshipId: string, scholarshipName: string, amount?: number) => {
  trackEvent("scholarship_add_pipeline", { 
    scholarship_id: scholarshipId, 
    scholarship_name: scholarshipName,
    amount: amount || 0
  });
};

export const trackScholarshipStatusChange = (scholarshipId: string, newStatus: string) => {
  trackEvent("scholarship_status_change", { 
    scholarship_id: scholarshipId, 
    new_status: newStatus 
  });
};

// College funnel
export const trackCollegeView = (collegeId: string, collegeName: string) => {
  trackEvent("college_view", { 
    college_id: collegeId, 
    college_name: collegeName 
  });
};

export const trackCollegeAddList = (collegeId: string, collegeName: string, listName: string) => {
  trackEvent("college_add_list", { 
    college_id: collegeId, 
    college_name: collegeName,
    list_name: listName
  });
};

// Essay coaching
export const trackEssayCoachingStart = () => {
  trackEvent("essay_coaching_start");
};

export const trackEssayCoachingFeedback = (essayType: string) => {
  trackEvent("essay_coaching_feedback", { essay_type: essayType });
};

// Application materials
export const trackMaterialUpload = (materialType: string, category: string) => {
  trackEvent("material_upload", { material_type: materialType, category });
};

// Payment funnel
export const trackCheckoutStart = () => {
  trackEvent("checkout_start");
};

export const trackPurchase = (value: number, currency: string = "USD") => {
  trackEvent("purchase", { value, currency });
};

export const trackSubscriptionCancel = () => {
  trackEvent("subscription_cancel");
};

// Engagement metrics
export const trackSearch = (searchTerm: string, category: string) => {
  trackEvent("search", { search_term: searchTerm, category });
};

export const trackFilter = (filterType: string, filterValue: string) => {
  trackEvent("filter_applied", { filter_type: filterType, filter_value: filterValue });
};

export const trackShare = (contentType: string, method: string) => {
  trackEvent("share", { content_type: contentType, method });
};

// Parent-specific events
export const trackParentView = (section: string) => {
  trackEvent("parent_view", { section });
};

// Declare gtag on window
declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}
