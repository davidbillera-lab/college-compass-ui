import type { ScholarshipUserAnswer, Profile } from "@/lib/scholarshipsIntel/types";
import type { ApplicationMaterial } from "@/lib/portfolioApi";
import type {
  AppType,
  ChecklistItem,
  CollegeApplication,
  DeadlineItem,
} from "@/lib/applicationTrackingApi";
import type { ProfileExtras, ProfileRow } from "@/lib/profileUtils";

export const demoJuniorProfile = {
  id: "demo-junior-student",
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
  budget_max_usd: 25000,
  preferred_setting: "suburban",
  preferred_college_type: "public",
  intended_majors: ["Computer Science", "Data Science"],
  citizenship: "US Citizen",
  first_gen_college: true,
  financial_need: true,
  estimated_efc: 3200,
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
  profile_extras: {
    activities: [
      {
        category: "Leadership",
        title: "Robotics Team Captain",
        description: "Led a 24-student robotics team through state competition prep.",
        hours_per_week: 8,
        weeks_per_year: 30,
        years: 3,
      },
      {
        category: "Community Service",
        title: "Library Coding Mentor",
        description: "Runs beginner coding workshops for middle school students.",
        hours_per_week: 3,
        weeks_per_year: 20,
        years: 2,
      },
      {
        category: "Work",
        title: "Math and Science Tutor",
        description: "Tutors algebra and biology students after school.",
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
    sensitive: {
      gender: "Female",
      race_ethnicity: ["Hispanic or Latino"],
    },
  },
} as const satisfies Profile & {
  preferred_name: string;
  school: string;
  city: string;
  preferred_college_type: string;
};

export const demoJuniorAnswers: ScholarshipUserAnswer[] = [
  {
    id: "demo-state",
    user_id: demoJuniorProfile.id,
    question_key: "state_resident",
    answer_json: "Colorado",
    updated_at: new Date().toISOString(),
  },
  {
    id: "demo-citizenship",
    user_id: demoJuniorProfile.id,
    question_key: "citizenship",
    answer_json: "US Citizen",
    updated_at: new Date().toISOString(),
  },
  {
    id: "demo-first-gen",
    user_id: demoJuniorProfile.id,
    question_key: "first_gen",
    answer_json: true,
    updated_at: new Date().toISOString(),
  },
  {
    id: "demo-need",
    user_id: demoJuniorProfile.id,
    question_key: "need_based",
    answer_json: true,
    updated_at: new Date().toISOString(),
  },
  {
    id: "demo-pell",
    user_id: demoJuniorProfile.id,
    question_key: "pell_eligible",
    answer_json: true,
    updated_at: new Date().toISOString(),
  },
  {
    id: "demo-volunteer",
    user_id: demoJuniorProfile.id,
    question_key: "volunteer_hours",
    answer_json: 140,
    updated_at: new Date().toISOString(),
  },
  {
    id: "demo-work",
    user_id: demoJuniorProfile.id,
    question_key: "work_hours",
    answer_json: 180,
    updated_at: new Date().toISOString(),
  },
  {
    id: "demo-careers",
    user_id: demoJuniorProfile.id,
    question_key: "career_goals",
    answer_json: ["Software Engineering", "Cybersecurity"],
    updated_at: new Date().toISOString(),
  },
  {
    id: "demo-gender",
    user_id: demoJuniorProfile.id,
    question_key: "gender",
    answer_json: "Female",
    updated_at: new Date().toISOString(),
  },
  {
    id: "demo-race",
    user_id: demoJuniorProfile.id,
    question_key: "race_ethnicity",
    answer_json: ["Hispanic or Latino"],
    updated_at: new Date().toISOString(),
  },
];

function futureDate(daysFromNow: number) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().split("T")[0];
}

function timestamp(daysAgo: number) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString();
}

export const demoJuniorProfileExtras: ProfileExtras = {
  activities: [
    { name: "Robotics Team", role: "Captain", years: "9-11", impact: "Led strategy and build season planning for a 24-student team." },
    { name: "Library Coding Mentor", role: "Volunteer", years: "10-11", impact: "Created beginner-friendly coding workshops for middle school students." },
    { name: "Math and Science Tutor", role: "Peer Tutor", years: "11", impact: "Supports younger students in algebra, biology, and study planning." },
  ],
  honors: [
    { name: "Regional Robotics Innovation Award", year: 2025 },
    { name: "Girls Who Code Summer Program Scholar", year: 2024 },
    { name: "National Honor Society", year: 2025 },
  ],
  links: {
    github: "https://github.com/maya-torres-demo",
    linkedin: "https://linkedin.com/in/maya-torres-demo",
  },
  themes: ["STEM equity", "first-generation success", "community mentoring"],
  personalStory: {
    background: "First-generation student from Aurora balancing rigorous STEM coursework with family responsibilities.",
    values: "Curiosity, community, and using technology to make opportunities more accessible.",
    proudMoment: "Launching a free coding club at the local library for younger students.",
    challenge: "Learning to advocate for herself in advanced STEM spaces where she often felt underestimated.",
    impact: "Built confidence as a leader and found a way to open doors for other students too.",
    uniquePerspective: "Combines technical ambition with a strong service mindset.",
    communityRole: "Peer mentor, robotics captain, and tutor.",
    futureVision: "Use software and data science to improve access to education and public services.",
  },
  testScores: {
    satComposite: 1280,
    psatComposite: 1210,
    apExams: [
      { subject: "AP Computer Science Principles", score: 4 },
      { subject: "AP Statistics", score: 4 },
    ],
  },
  verification: {
    achievementsVerified: true,
    activitiesVerified: true,
    documentsUploaded: true,
  },
  videoShowcase: {
    introVideoUrl: "https://example.com/demo-student-intro",
    highlights: [
      "Robotics leadership",
      "Coding mentorship",
      "STEM tutoring",
    ],
  },
  athleticAchievements: {
    sports: [
      {
        name: "Soccer",
        level: "Varsity",
        years: "10-11",
        achievements: ["Leadership council member", "Two-year varsity midfielder"],
      },
    ],
  },
  academicAchievements: {
    advancedCourses: ["AP Computer Science Principles", "AP Statistics", "AP English Language"],
    honors: ["Honors Chemistry", "Honors Algebra II", "Honors US History"],
    academicInterests: ["Computer Science", "Data Science", "Cybersecurity"],
  },
};

export const demoJuniorProfileRow: ProfileRow = {
  id: demoJuniorProfile.id,
  full_name: demoJuniorProfile.full_name,
  grad_year: demoJuniorProfile.grad_year,
  gpa_unweighted: demoJuniorProfile.gpa_unweighted,
  gpa_weighted: demoJuniorProfile.gpa_weighted,
  sat_score: demoJuniorProfile.sat_score,
  intended_major: demoJuniorProfile.intended_majors.join(", "),
  intended_majors: [...demoJuniorProfile.intended_majors],
  regions: demoJuniorProfile.region,
  region: demoJuniorProfile.region,
  budget_max_usd: demoJuniorProfile.budget_max_usd,
  campus_size: "medium",
  values: demoJuniorProfileExtras.personalStory?.values ?? null,
  proud_moment: demoJuniorProfileExtras.personalStory?.proudMoment ?? null,
  challenge: demoJuniorProfileExtras.personalStory?.challenge ?? null,
  impact: demoJuniorProfileExtras.personalStory?.impact ?? null,
  profile_extras: demoJuniorProfileExtras,
};

export const demoJuniorCoreData = {
  fullName: demoJuniorProfile.full_name,
  preferredName: demoJuniorProfile.preferred_name,
  graduationYear: demoJuniorProfile.grad_year,
  school: demoJuniorProfile.school,
  state: demoJuniorProfile.state,
  gpaUnweighted: demoJuniorProfile.gpa_unweighted,
  gpaWeighted: demoJuniorProfile.gpa_weighted,
  classRank: demoJuniorProfile.class_rank,
  courseworkRigor: "Most rigorous available",
  intendedMajors: [...demoJuniorProfile.intended_majors],
  academicNarrative: "Built a strong STEM foundation through AP coursework, tutoring, and robotics leadership.",
  contextNotes: "Balances academics, mentorship, and part-time tutoring while helping younger students find confidence in STEM.",
};

export const demoPortfolioMaterials: ApplicationMaterial[] = [
  {
    id: "demo-material-1",
    user_id: demoJuniorProfile.id,
    material_type: "document",
    category: "transcript",
    title: "Unofficial Transcript",
    description: "Latest junior-year transcript showing AP coursework and GPA trend.",
    file_url: null,
    file_name: "maya-torres-transcript.pdf",
    file_size: 320000,
    content_text: null,
    ai_analysis: null,
    ai_analyzed_at: null,
    created_at: timestamp(12),
    updated_at: timestamp(12),
  },
  {
    id: "demo-material-2",
    user_id: demoJuniorProfile.id,
    material_type: "document",
    category: "resume",
    title: "Student Resume",
    description: "One-page resume with robotics leadership, tutoring, and service hours.",
    file_url: null,
    file_name: "maya-torres-resume.pdf",
    file_size: 185000,
    content_text: null,
    ai_analysis: null,
    ai_analyzed_at: null,
    created_at: timestamp(10),
    updated_at: timestamp(10),
  },
  {
    id: "demo-material-3",
    user_id: demoJuniorProfile.id,
    material_type: "document",
    category: "achievement",
    title: "Regional Robotics Innovation Award",
    description: "Certificate and short reflection on the team project.",
    file_url: null,
    file_name: "robotics-award.pdf",
    file_size: 240000,
    content_text: null,
    ai_analysis: null,
    ai_analyzed_at: null,
    created_at: timestamp(8),
    updated_at: timestamp(8),
  },
  {
    id: "demo-material-4",
    user_id: demoJuniorProfile.id,
    material_type: "text",
    category: "extracurricular",
    title: "Library Coding Mentor Summary",
    description: "Impact summary from running coding workshops for middle school students.",
    file_url: null,
    file_name: null,
    file_size: null,
    content_text: "Designed and led coding workshops for beginner students, covering Scratch, Python basics, and project confidence.",
    ai_analysis: null,
    ai_analyzed_at: null,
    created_at: timestamp(4),
    updated_at: timestamp(4),
  },
];

const demoApplicationBaseDate = {
  ea: futureDate(45),
  rd: futureDate(92),
  rolling: futureDate(28),
};

export const demoApplications: CollegeApplication[] = [
  {
    id: "demo-app-1",
    student_id: demoJuniorProfile.id,
    college_id: "demo-college-1",
    fit_score: 70,
    bucket: "Safety",
    shortlist_status: "APPLYING",
    app_type: "EA",
    deadline_date: demoApplicationBaseDate.ea,
    notes: "Strong in-state option with supportive STEM programs and solid affordability.",
    created_at: timestamp(20),
    updated_at: timestamp(2),
    college: {
      id: "demo-college-1",
      name: "University of Colorado Colorado Springs",
      city: "Colorado Springs",
      state: "CO",
      acceptance_rate: 0.95,
      avg_net_price: 18000,
    },
  },
  {
    id: "demo-app-2",
    student_id: demoJuniorProfile.id,
    college_id: "demo-college-2",
    fit_score: 68,
    bucket: "Safety",
    shortlist_status: "INTERESTED",
    app_type: "RD",
    deadline_date: demoApplicationBaseDate.rd,
    notes: "Worth visiting for engineering-adjacent programs and scholarship potential.",
    created_at: timestamp(18),
    updated_at: timestamp(5),
    college: {
      id: "demo-college-2",
      name: "Colorado Mesa University",
      city: "Grand Junction",
      state: "CO",
      acceptance_rate: 0.81,
      avg_net_price: 17000,
    },
  },
  {
    id: "demo-app-3",
    student_id: demoJuniorProfile.id,
    college_id: "demo-college-3",
    fit_score: 64,
    bucket: "Target",
    shortlist_status: "INTERESTED",
    app_type: "Rolling",
    deadline_date: demoApplicationBaseDate.rolling,
    notes: "Could be a high-value backup with solid mentoring programs.",
    created_at: timestamp(16),
    updated_at: timestamp(3),
    college: {
      id: "demo-college-3",
      name: "Fort Lewis College",
      city: "Durango",
      state: "CO",
      acceptance_rate: 0.92,
      avg_net_price: 19500,
    },
  },
];

export function buildDemoChecklist(studentId: string, collegeId: string): ChecklistItem[] {
  const createdAt = timestamp(6);
  const dueDate = futureDate(30);
  const steps = [
    { step_key: "common_app_profile", title: "Complete Common App profile", category: "other", completed: true },
    { step_key: "transcript_request", title: "Request official transcripts", category: "transcripts", completed: true },
    { step_key: "test_scores_send", title: "Decide whether to send SAT scores", category: "test_scores", completed: false },
    { step_key: "rec_letter_1", title: "Confirm recommendation letter #1", category: "recommendations", completed: true },
    { step_key: "main_essay", title: "Draft personal statement", category: "essays", completed: false },
    { step_key: "supplement_essays", title: "Outline school-specific supplements", category: "supplements", completed: false },
    { step_key: "fafsa", title: "Prep FAFSA materials with family", category: "financial_aid", completed: false },
  ] as const;

  return steps.map((step, index) => ({
    id: `${collegeId}-${step.step_key}`,
    student_id: studentId,
    college_id: collegeId,
    step_key: step.step_key,
    title: step.title,
    description: null,
    category: step.category,
    sort_order: index + 1,
    completed_at: step.completed ? timestamp(1 + index) : null,
    due_date: dueDate,
    notes: null,
    created_at: createdAt,
    updated_at: createdAt,
  }));
}

export function buildDemoDeadlines(): DeadlineItem[] {
  const applicationDeadlines = demoApplications
    .filter((application) => application.deadline_date)
    .map((application) => ({
      id: `college-${application.id}`,
      type: "college" as const,
      name: application.college?.name ?? "College application",
      deadline_date: application.deadline_date as string,
      app_type: application.app_type ?? "RD",
      status: application.shortlist_status ?? "INTERESTED",
      college_id: application.college_id,
      match_id: application.id,
    }));

  const scholarshipDeadlines: DeadlineItem[] = [
    {
      id: "scholarship-pell",
      type: "scholarship",
      name: "Pell Grant",
      deadline_date: futureDate(75),
      status: "READY",
      scholarship_id: "pell-grant",
      match_id: "scholarship-demo-1",
    },
    {
      id: "scholarship-fseog",
      type: "scholarship",
      name: "Federal Supplemental Educational Opportunity Grant",
      deadline_date: futureDate(54),
      status: "RESEARCH",
      scholarship_id: "fseog",
      match_id: "scholarship-demo-2",
    },
  ];

  return [...applicationDeadlines, ...scholarshipDeadlines].sort(
    (a, b) => new Date(a.deadline_date).getTime() - new Date(b.deadline_date).getTime()
  );
}

export const demoParentProgress = {
  profileCompletion: 92,
  scholarshipsInPipeline: 3,
  scholarshipsApplied: 0,
  potentialAwardAmount: 191395,
  collegesOnLists: 5,
  upcomingDeadlines: [
    {
      name: "Fort Lewis College Rolling Application",
      deadline: demoApplicationBaseDate.rolling,
      daysRemaining: 28,
      type: "college" as const,
    },
    {
      name: "UCCS Early Action",
      deadline: demoApplicationBaseDate.ea,
      daysRemaining: 45,
      type: "college" as const,
    },
    {
      name: "Federal Supplemental Educational Opportunity Grant",
      deadline: futureDate(54),
      daysRemaining: 54,
      type: "scholarship" as const,
    },
  ],
  recentActivity: [
    { action: "Updated", item: "Robotics leadership story", timestamp: timestamp(1) },
    { action: "Added", item: "Regional Robotics Innovation Award", timestamp: timestamp(4) },
  ],
  essaysCompleted: 1,
  materialsUploaded: demoPortfolioMaterials.length,
};
