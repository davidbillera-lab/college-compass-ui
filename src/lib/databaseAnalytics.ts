import { supabase } from "@/integrations/supabase/client";

// Generate or retrieve session ID (persists for the browser session)
const getSessionId = (): string => {
  const key = "analytics_session_id";
  let sessionId = sessionStorage.getItem(key);
  
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem(key, sessionId);
  }
  
  return sessionId;
};

/**
 * Track page view in database
 */
export const trackPageViewDb = async (
  path: string,
  title?: string
) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    await supabase.from("analytics_page_views").insert({
      user_id: user?.id || null,
      page_path: path,
      page_title: title || document.title,
      referrer: document.referrer || null,
      session_id: getSessionId(),
    });
  } catch (error) {
    console.error("[Analytics] Failed to track page view:", error);
  }
};

/**
 * Track custom event in database
 */
export const trackEventDb = async (
  eventName: string,
  eventData?: Record<string, any>
) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    await supabase.from("analytics_events").insert({
      user_id: user?.id || null,
      event_name: eventName,
      event_data: eventData || {},
      session_id: getSessionId(),
    });
  } catch (error) {
    console.error("[Analytics] Failed to track event:", error);
  }
};

// ========== CONVERSION FUNNEL EVENTS ==========

export const trackSignUpDb = async (method: string = "email") => {
  await trackEventDb("sign_up", { method });
};

export const trackLoginDb = async (method: string = "email") => {
  await trackEventDb("login", { method });
};

export const trackProfileCompleteDb = async (completionPercent: number) => {
  await trackEventDb("profile_complete", { completion_percent: completionPercent });
};

export const trackScholarshipViewDb = async (scholarshipId: string, scholarshipName: string) => {
  await trackEventDb("scholarship_view", { 
    scholarship_id: scholarshipId, 
    scholarship_name: scholarshipName 
  });
};

export const trackScholarshipAddPipelineDb = async (
  scholarshipId: string,
  scholarshipName: string,
  amount?: number
) => {
  await trackEventDb("scholarship_add_pipeline", { 
    scholarship_id: scholarshipId, 
    scholarship_name: scholarshipName,
    amount: amount || 0
  });
};

export const trackCollegeAddListDb = async (
  collegeId: string,
  collegeName: string,
  listName: string
) => {
  await trackEventDb("college_add_list", { 
    college_id: collegeId, 
    college_name: collegeName,
    list_name: listName
  });
};

export const trackCheckoutStartDb = async () => {
  await trackEventDb("checkout_start");
};

export const trackPurchaseDb = async (value: number, currency: string = "USD") => {
  await trackEventDb("purchase", { value, currency });
};

export const trackCTAClickDb = async (ctaName: string, location: string) => {
  await trackEventDb("cta_click", { cta_name: ctaName, location });
};

export const trackSignupConversionDb = async (source: string) => {
  await trackEventDb("signup_conversion", { source });
};
