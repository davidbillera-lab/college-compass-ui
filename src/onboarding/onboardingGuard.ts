// DO NOT EDIT VIA LOVABLE
import { supabase } from "@/integrations/supabase/client";

export type OnboardingStep =
  | "welcome"
  | "basics"
  | "academics"
  | "financial"
  | "activities"
  | "story"
  | "results";

export async function getNextOnboardingStep(): Promise<OnboardingStep> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return "welcome";

  const { data: prof } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!prof) return "basics";

  const needsBasics = !prof.graduation_year || !prof.region || !prof.intended_majors?.length;
  const needsAcademics = !prof.gpa_unweighted && !prof.sat_score && !prof.act_score;
  const needsFinancial = prof.financial_need === null || prof.financial_need === undefined;
  const needsActivities = !prof.volunteer_hours && !prof.leadership_roles?.length && !prof.awards?.length;
  const needsStory = !prof.proud_moment && !prof.impact;

  if (needsBasics) return "basics";
  if (needsAcademics) return "academics";
  if (needsFinancial) return "financial";
  if (needsActivities) return "activities";
  if (needsStory) return "story";
  return "results";
}

export function stepToPath(step: OnboardingStep): string {
  const paths: Record<OnboardingStep, string> = {
    welcome: "/welcome",
    basics: "/onboarding/basics",
    academics: "/onboarding/academics",
    financial: "/onboarding/financial",
    activities: "/onboarding/activities",
    story: "/onboarding/story",
    results: "/onboarding/results",
  };
  return paths[step];
}
