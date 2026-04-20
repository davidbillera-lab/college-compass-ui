import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { calculateAllMatches } from "../src/lib/scholarshipsIntel/matching.ts";
import { calculateAllCollegeMatches } from "../src/lib/collegeIntel/matching.ts";
import type {
  Scholarship,
  ScholarshipUserAnswer,
  Profile,
} from "../src/lib/scholarshipsIntel/types.ts";
import type { College, CollegeProfile } from "../src/lib/collegeIntel/types.ts";

type EnvMap = Record<string, string>;

function loadEnvFile(filePath: string): EnvMap {
  if (!fs.existsSync(filePath)) return {};

  const raw = fs.readFileSync(filePath, "utf8");
  const env: EnvMap = {};

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;

    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim().replace(/^['"]|['"]$/g, "");
    env[key] = value;
  }

  return env;
}

function getEnv() {
  const root = process.cwd();
  const env = {
    ...loadEnvFile(path.join(root, ".env")),
    ...loadEnvFile(path.join(root, ".env.local")),
    ...process.env,
  };

  const url = env.VITE_SUPABASE_URL;
  const key = env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY");
  }

  return { url, key };
}

function argValue(flag: string, fallback: string): string {
  const index = process.argv.indexOf(flag);
  if (index === -1) return fallback;
  return process.argv[index + 1] || fallback;
}

async function signInOrCreateUser(
  supabase: ReturnType<typeof createClient>,
  email: string,
  password: string
) {
  const signInResult = await supabase.auth.signInWithPassword({ email, password });
  if (!signInResult.error && signInResult.data.session) {
    return signInResult.data.session;
  }

  const signUpResult = await supabase.auth.signUp({ email, password });
  if (signUpResult.error) {
    throw new Error(`Unable to sign in or sign up demo student: ${signUpResult.error.message}`);
  }

  if (signUpResult.data.session) {
    return signUpResult.data.session;
  }

  const retrySignIn = await supabase.auth.signInWithPassword({ email, password });
  if (retrySignIn.error || !retrySignIn.data.session) {
    throw new Error(
      "Demo student was created but could not sign in. Email confirmation may be enabled for this Supabase project."
    );
  }

  return retrySignIn.data.session;
}

async function tryDevAutoLogin(supabase: ReturnType<typeof createClient>) {
  const { data, error } = await supabase.functions.invoke("dev-auto-login");
  if (error || !data?.session?.access_token || !data?.session?.refresh_token) {
    return null;
  }

  const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
  });

  if (sessionError || !sessionData.session) {
    return null;
  }

  return sessionData.session;
}

async function main() {
  const { url, key } = getEnv();
  const email = argValue("--email", "collegecompass.demo.junior@example.com");
  const password = argValue("--password", "DemoStudent!2027");
  const supabase = createClient(url, key);
  let usedDevAutoLogin = false;

  let session;
  try {
    session = await signInOrCreateUser(supabase, email, password);
  } catch (error) {
    const fallbackSession = await tryDevAutoLogin(supabase);
    if (!fallbackSession) {
      throw error;
    }
    usedDevAutoLogin = true;
    session = fallbackSession;
  }

  const userId = session.user.id;

  const demoProfile = {
    id: userId,
    full_name: "Maya Torres",
    preferred_name: "Maya",
    school: "Front Range STEM Academy",
    grad_year: 2027,
    graduation_year: 2027,
    region: "West",
    state: "Colorado",
    city: "Aurora",
    gpa_unweighted: 3.82,
    gpa_weighted: 4.31,
    gpa_scale: 4,
    sat_score: 1280,
    psat_score: 1210,
    class_rank: "28/312",
    class_size: 312,
    coursework_rigor: "High",
    intended_majors: ["Computer Science", "Data Science"],
    academic_narrative:
      "First-generation junior focused on computer science, robotics, and community impact.",
    context_notes:
      "Balances honors coursework, robotics leadership, paid work, and family responsibilities.",
    citizenship: "US Citizen",
    first_gen_college: true,
    financial_need: true,
    estimated_efc: 3200,
    budget_max_usd: 25000,
    preferred_college_type: "public",
    preferred_setting: "suburban",
    volunteer_hours: 140,
    work_experience_hours: 180,
    leadership_roles: ["Robotics Team Captain", "National Honor Society Officer"],
    sports_played: ["Soccer"],
    awards: [
      "Regional Robotics Innovation Award",
      "National Honor Society",
      "Girls Who Code Summer Program Scholar",
    ],
    ap_courses: ["AP Computer Science Principles", "AP Statistics", "AP English Language"],
    honors_courses: ["Honors Chemistry", "Honors Algebra II", "Honors US History"],
    values: "service, perseverance, curiosity",
    proud_moment:
      "Led our robotics team through a redesign that qualified us for the state showcase.",
    challenge:
      "Learned to manage school, caregiving, and a part-time job while staying academically strong.",
    impact:
      "Started beginner coding workshops for middle school girls at the public library.",
    interests: "robotics, coding outreach, STEM mentorship",
    profile_extras: {
      activities: [
        {
          category: "Leadership",
          title: "Robotics Team Captain",
          description: "Led build strategy, mentoring, and competition prep for a 24-student team.",
          hours_per_week: 8,
          weeks_per_year: 30,
          years: 3,
        },
        {
          category: "Community Service",
          title: "Library Coding Mentor",
          description: "Taught Scratch and Python basics to middle school students.",
          hours_per_week: 3,
          weeks_per_year: 20,
          years: 2,
        },
        {
          category: "Work",
          title: "Math and Science Tutor",
          description: "Tutored algebra and biology students after school.",
          hours_per_week: 6,
          weeks_per_year: 24,
          years: 1,
        },
      ],
      athletic_achievements: [
        {
          sport: "Soccer",
          level: "Varsity",
          achievement: "Varsity midfielder and team leadership council member",
        },
      ],
      personalStory: {
        background:
          "First-generation student from Colorado passionate about technology and access.",
        values: "service, perseverance, curiosity",
        proudMoment:
          "Seeing younger students build confidence through our coding workshops.",
        challenge:
          "Balancing academics, family responsibilities, and work while staying engaged.",
        impact:
          "Used robotics and tutoring to open more STEM opportunities in my community.",
      },
      sensitive: {
        gender: "Female",
        race_ethnicity: ["Hispanic or Latino"],
      },
    },
  };

  const answerSeed: ScholarshipUserAnswer[] = [
    {
      id: "",
      user_id: userId,
      question_key: "state_resident",
      answer_json: "Colorado",
      updated_at: new Date().toISOString(),
    },
    {
      id: "",
      user_id: userId,
      question_key: "citizenship",
      answer_json: "US Citizen",
      updated_at: new Date().toISOString(),
    },
    {
      id: "",
      user_id: userId,
      question_key: "first_gen",
      answer_json: true,
      updated_at: new Date().toISOString(),
    },
    {
      id: "",
      user_id: userId,
      question_key: "need_based",
      answer_json: true,
      updated_at: new Date().toISOString(),
    },
    {
      id: "",
      user_id: userId,
      question_key: "pell_eligible",
      answer_json: true,
      updated_at: new Date().toISOString(),
    },
    {
      id: "",
      user_id: userId,
      question_key: "volunteer_hours",
      answer_json: 140,
      updated_at: new Date().toISOString(),
    },
    {
      id: "",
      user_id: userId,
      question_key: "work_hours",
      answer_json: 180,
      updated_at: new Date().toISOString(),
    },
    {
      id: "",
      user_id: userId,
      question_key: "career_goals",
      answer_json: ["Software Engineering", "Cybersecurity"],
      updated_at: new Date().toISOString(),
    },
    {
      id: "",
      user_id: userId,
      question_key: "gender",
      answer_json: "Female",
      updated_at: new Date().toISOString(),
    },
    {
      id: "",
      user_id: userId,
      question_key: "race_ethnicity",
      answer_json: ["Hispanic or Latino"],
      updated_at: new Date().toISOString(),
    },
  ];

  const { error: profileError } = await supabase.from("profiles").upsert(demoProfile, {
    onConflict: "id",
  });
  if (profileError) throw new Error(`Failed to upsert demo profile: ${profileError.message}`);

  const { error: answerError } = await supabase
    .from("scholarship_user_answers")
    .upsert(
      answerSeed.map(({ user_id, question_key, answer_json, updated_at }) => ({
        user_id,
        question_key,
        answer_json,
        updated_at,
      })),
      { onConflict: "user_id,question_key" }
    );
  if (answerError) throw new Error(`Failed to save demo scholarship answers: ${answerError.message}`);

  const [{ data: scholarships }, { data: colleges }] = await Promise.all([
    supabase
      .from("scholarships")
      .select("*")
      .or("status.is.null,status.eq.active"),
    supabase.from("colleges").select("*"),
  ]);

  const scholarshipResults = calculateAllMatches(
    (scholarships || []) as Scholarship[],
    demoProfile as unknown as Profile,
    answerSeed
  );
  const collegeResults = calculateAllCollegeMatches(
    (colleges || []) as College[],
    demoProfile as unknown as CollegeProfile
  );

  const scholarshipRows = Array.from(scholarshipResults.entries()).map(([scholarshipId, result]) => ({
    user_id: userId,
    scholarship_id: scholarshipId,
    score: result.score,
    eligibility_status: result.eligibility_status,
    reasons: result.reasons.join("\n"),
    missing_fields: result.missing_fields,
  }));

  const collegeRows = Array.from(collegeResults.entries()).map(([collegeId, result]) => ({
    student_id: userId,
    college_id: collegeId,
    fit_score: result.score,
    bucket: result.bucket,
    why_fit: result.reasons.slice(0, 5).join("\n"),
    academic_match_score: result.breakdown.academic,
    financial_match_score: result.breakdown.financial,
    location_match_score: result.breakdown.location,
    activities_match_score: result.breakdown.activities,
    updated_at: new Date().toISOString(),
  }));

  for (let i = 0; i < scholarshipRows.length; i += 50) {
    const chunk = scholarshipRows.slice(i, i + 50);
    const { error } = await supabase
      .from("scholarship_matches")
      .upsert(chunk, { onConflict: "user_id,scholarship_id" });
    if (error) throw new Error(`Failed to upsert scholarship matches: ${error.message}`);
  }

  for (let i = 0; i < collegeRows.length; i += 50) {
    const chunk = collegeRows.slice(i, i + 50);
    const { error } = await supabase
      .from("college_matches")
      .upsert(chunk, { onConflict: "student_id,college_id" });
    if (error) throw new Error(`Failed to upsert college matches: ${error.message}`);
  }

  const topScholarship = Array.from(scholarshipResults.entries())
    .filter(([, result]) => result.eligibility_status === "eligible")
    .sort((a, b) => b[1].score - a[1].score)[0];

  if (topScholarship) {
    const { error } = await supabase.from("scholarship_pipeline_items").upsert(
      {
        student_id: userId,
        scholarship_id: topScholarship[0],
        status: "NOT_STARTED",
        pipeline_status: "NOT_STARTED",
      },
      { onConflict: "student_id,scholarship_id" }
    );
    if (error) {
      console.warn(`Could not seed scholarship pipeline item: ${error.message}`);
    }
  }

  const topScholarshipSummaries = Array.from(scholarshipResults.entries())
    .filter(([, result]) => result.eligibility_status === "eligible")
    .sort((a, b) => b[1].score - a[1].score)
    .slice(0, 5)
    .map(([id, result]) => {
      const scholarship = (scholarships || []).find((item) => item.id === id);
      return {
        name: scholarship?.name || id,
        score: result.score,
      };
    });

  const topCollegeSummaries = Array.from(collegeResults.entries())
    .sort((a, b) => b[1].score - a[1].score)
    .slice(0, 5)
    .map(([id, result]) => {
      const college = (colleges || []).find((item) => item.id === id);
      return {
        name: college?.name || id,
        score: result.score,
        bucket: result.bucket,
      };
    });

  console.log(
    JSON.stringify(
      {
        email,
        password,
        userId,
        usedDevAutoLogin,
        seededProfile: demoProfile.full_name,
        eligibleScholarshipCount: scholarshipRows.filter(
          (row) => row.eligibility_status === "eligible"
        ).length,
        totalScholarshipMatches: scholarshipRows.length,
        totalCollegeMatches: collegeRows.length,
        topScholarships: topScholarshipSummaries,
        topColleges: topCollegeSummaries,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
