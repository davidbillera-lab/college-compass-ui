import { computeProfileSnapshot } from "@/lib/profileUtils";
import { ensureProfileRow } from "@/lib/profileExtrasApi";

export type OnboardingStep =
  | "welcome"
  | "basics"
  | "story"
  | "activities"
  | "results";

export async function getNextOnboardingStep(): Promise<OnboardingStep> {
  const profile = await ensureProfileRow();
  const snap = computeProfileSnapshot(profile);

  // Keep it simple: if missing basics, go basics. If missing story, go story. If <2 activities, go activities.
  const needsBasics =
    !profile.intended_major ||
    !profile.regions ||
    (!profile.budget_max_usd && !profile.campus_size);

  const needsStory =
    !profile.values ||
    !profile.proud_moment ||
    !profile.impact;

  const activityCount = snap.activityCount ?? 0;
  const needsActivities = activityCount < 2;

  // Welcome is optional once they have anything started
  if (needsBasics) return "basics";
  if (needsStory) return "story";
  if (needsActivities) return "activities";
  return "results";
}

export function stepToPath(step: OnboardingStep) {
  if (step === "welcome") return "/welcome";
  if (step === "basics") return "/onboarding/basics";
  if (step === "story") return "/onboarding/story";
  if (step === "activities") return "/onboarding/activities";
  return "/onboarding/results";
}
