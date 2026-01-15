import type { TestScoresData } from "@/components/profile/TestScoresSection";
import type { VerificationData } from "@/components/profile/VerificationSection";
import type { VideoShowcaseData } from "@/components/profile/VideoShowcaseSection";

export type Activity = {
  name: string;
  role?: string;
  years?: string; // e.g. "10-12"
  impact?: string; // 1–2 lines
};

export type PersonalStoryData = {
  background?: string;
  values?: string;
  proudMoment?: string;
  challenge?: string;
  impact?: string;
  uniquePerspective?: string;
  communityRole?: string;
  futureVision?: string;
};

export type ProfileExtras = {
  activities?: Activity[];
  honors?: { name: string; year?: number }[];
  links?: { portfolio?: string; github?: string; linkedin?: string };
  themes?: string[];
  personalStory?: PersonalStoryData;
  testScores?: TestScoresData;
  verification?: VerificationData;
  videoShowcase?: VideoShowcaseData;
};

export type ProfileRow = {
  id: string;
  full_name?: string | null;
  grad_year?: number | null;
  gpa_unweighted?: number | null;
  gpa_weighted?: number | null;
  test_policy?: string | null;
  sat_score?: number | null;
  act_score?: number | null;
  intended_major?: string | null;
  intended_majors?: string[] | null;
  regions?: string | null;
  region?: string | null;
  budget_max_usd?: number | null;
  campus_size?: string | null;
  values?: string | null;
  proud_moment?: string | null;
  challenge?: string | null;
  impact?: string | null;
  profile_extras?: ProfileExtras | null;
};

function isNonEmpty(v: unknown) {
  return typeof v === "string" ? v.trim().length > 0 : v != null;
}

function countActivities(extras?: ProfileExtras | null) {
  const a = extras?.activities ?? [];
  return Array.isArray(a) ? a.filter((x) => x?.name?.trim()).length : 0;
}

export function computeProfileSnapshot(profile: ProfileRow) {
  // --- scoring weights (tweak anytime) ---
  const items: { key: string; ok: boolean; weight: number }[] = [
    { key: "full_name", ok: isNonEmpty(profile.full_name), weight: 8 },
    { key: "grad_year", ok: !!profile.grad_year, weight: 6 },
    { key: "gpa_or_tests", ok: !!profile.gpa_unweighted || !!profile.gpa_weighted || !!profile.sat_score || !!profile.act_score, weight: 10 },
    { key: "intended_major", ok: isNonEmpty(profile.intended_major) || (profile.intended_majors?.length ?? 0) > 0, weight: 10 },
    { key: "regions", ok: isNonEmpty(profile.regions) || isNonEmpty(profile.region), weight: 8 },
    { key: "budget", ok: !!profile.budget_max_usd, weight: 8 },
    { key: "campus_size", ok: isNonEmpty(profile.campus_size), weight: 6 },
    { key: "values", ok: isNonEmpty(profile.values), weight: 10 },
    { key: "proud_moment", ok: isNonEmpty(profile.proud_moment), weight: 12 },
    { key: "impact", ok: isNonEmpty(profile.impact), weight: 10 },
    { key: "activities_2plus", ok: countActivities(profile.profile_extras) >= 2, weight: 10 },
  ];

  const total = items.reduce((s, i) => s + i.weight, 0);
  const earned = items.reduce((s, i) => s + (i.ok ? i.weight : 0), 0);
  const completeness = Math.round((earned / total) * 100);

  const narrativeReady =
    isNonEmpty(profile.values) &&
    isNonEmpty(profile.proud_moment) &&
    isNonEmpty(profile.impact);

  const matchReady =
    isNonEmpty(profile.intended_major) &&
    isNonEmpty(profile.regions) &&
    (!!profile.budget_max_usd || isNonEmpty(profile.campus_size));

  const scholarshipReady =
    narrativeReady && countActivities(profile.profile_extras) >= 2;

  const missing = items.filter((i) => !i.ok).map((i) => i.key);

  return {
    completeness,
    narrativeReady,
    matchReady,
    scholarshipReady,
    missing,
    activityCount: countActivities(profile.profile_extras),
  };
}
