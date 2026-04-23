import { supabase } from "@/integrations/supabase/client";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

// ─── Types ────────────────────────────────────────────────────────────────────

export type AppStatus = "INTERESTED" | "APPLYING" | "APPLIED" | "NOT_NOW";
export type AppType = "ED" | "EA" | "RD" | "REA" | "Rolling";
export type ChecklistCategory =
  | "essays"
  | "test_scores"
  | "recommendations"
  | "financial_aid"
  | "transcripts"
  | "supplements"
  | "other";

export interface CollegeApplication {
  id: string;
  student_id: string;
  college_id: string;
  fit_score: number;
  bucket: string;
  shortlist_status: AppStatus | null;
  app_type: AppType | null;
  deadline_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  college: {
    id: string;
    name: string;
    city: string | null;
    state: string | null;
    acceptance_rate: number | null;
    avg_net_price: number | null;
  } | null;
}

export interface ChecklistItem {
  id: string;
  student_id: string;
  college_id: string;
  step_key: string;
  title: string;
  description: string | null;
  category: ChecklistCategory;
  sort_order: number;
  completed_at: string | null;
  due_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DeadlineItem {
  id: string;
  type: "college" | "scholarship";
  name: string;
  deadline_date: string;
  app_type?: string;
  status: string;
  college_id?: string;
  scholarship_id?: string;
  match_id: string;
}

// ─── Default checklist steps ──────────────────────────────────────────────────

export const DEFAULT_CHECKLIST_STEPS: Omit<
  ChecklistItem,
  "id" | "student_id" | "college_id" | "completed_at" | "due_date" | "notes" | "created_at" | "updated_at"
>[] = [
  { step_key: "common_app_profile", title: "Complete Common App profile", description: "Fill out personal information, demographics, and family details.", category: "other", sort_order: 1 },
  { step_key: "transcript_request", title: "Request official transcripts", description: "Ask your school counselor to send official transcripts.", category: "transcripts", sort_order: 2 },
  { step_key: "test_scores_send", title: "Send SAT/ACT scores", description: "Submit official test scores through College Board or ACT.", category: "test_scores", sort_order: 3 },
  { step_key: "rec_letter_1", title: "Request recommendation letter #1", description: "Ask a teacher or counselor at least 4–6 weeks before the deadline.", category: "recommendations", sort_order: 4 },
  { step_key: "rec_letter_2", title: "Request recommendation letter #2", description: "Ask a second teacher or mentor.", category: "recommendations", sort_order: 5 },
  { step_key: "main_essay", title: "Write Common App personal statement", description: "650-word essay — start early and revise multiple times.", category: "essays", sort_order: 6 },
  { step_key: "supplement_essays", title: "Complete supplemental essays", description: "Research and write any school-specific supplemental essays.", category: "supplements", sort_order: 7 },
  { step_key: "activities_list", title: "Fill out activities list", description: "List up to 10 extracurricular activities in order of importance.", category: "other", sort_order: 8 },
  { step_key: "fafsa", title: "Submit FAFSA", description: "Complete the Free Application for Federal Student Aid at studentaid.gov.", category: "financial_aid", sort_order: 9 },
  { step_key: "css_profile", title: "Submit CSS Profile (if required)", description: "Some schools require the CSS Profile for institutional aid.", category: "financial_aid", sort_order: 10 },
  { step_key: "final_review", title: "Final application review", description: "Proofread everything, confirm all materials are submitted.", category: "other", sort_order: 11 },
];

// ─── API functions ────────────────────────────────────────────────────────────

export async function fetchApplications(studentId: string): Promise<CollegeApplication[]> {
  const { data, error } = await supabase
    .from("college_matches")
    .select(`
      id, student_id, college_id, fit_score, bucket,
      shortlist_status, app_type, deadline_date, notes,
      created_at, updated_at,
      college:colleges(id, name, city, state, acceptance_rate, avg_net_price)
    `)
    .eq("student_id", studentId)
    .not("shortlist_status", "is", null)
    .order("deadline_date", { ascending: true, nullsFirst: false });

  if (error) throw error;
  return (data ?? []) as unknown as CollegeApplication[];
}

export async function updateApplicationStatus(
  matchId: string,
  status: AppStatus
): Promise<void> {
  const { error } = await supabase
    .from("college_matches")
    .update({ shortlist_status: status, updated_at: new Date().toISOString() })
    .eq("id", matchId);
  if (error) throw error;
}

export async function updateApplicationDeadline(
  matchId: string,
  deadlineDate: string | null,
  appType: AppType | null
): Promise<void> {
  const { error } = await supabase
    .from("college_matches")
    .update({
      deadline_date: deadlineDate,
      app_type: appType,
      updated_at: new Date().toISOString(),
    })
    .eq("id", matchId);
  if (error) throw error;
}

export async function updateApplicationNotes(
  matchId: string,
  notes: string
): Promise<void> {
  const { error } = await supabase
    .from("college_matches")
    .update({ notes, updated_at: new Date().toISOString() })
    .eq("id", matchId);
  if (error) throw error;
}

// ─── Checklist ────────────────────────────────────────────────────────────────

export async function fetchChecklist(
  studentId: string,
  collegeId: string
): Promise<ChecklistItem[]> {
  const { data, error } = await db
    .from("application_checklist_items")
    .select("*")
    .eq("student_id", studentId)
    .eq("college_id", collegeId)
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return (data ?? []) as ChecklistItem[];
}

export async function seedChecklist(
  studentId: string,
  collegeId: string
): Promise<ChecklistItem[]> {
  // Check if already seeded
  const existing = await fetchChecklist(studentId, collegeId);
  if (existing.length > 0) return existing;

  const rows = DEFAULT_CHECKLIST_STEPS.map((step) => ({
    ...step,
    student_id: studentId,
    college_id: collegeId,
  }));

  const { data, error } = await db
    .from("application_checklist_items")
    .insert(rows)
    .select();

  if (error) throw error;
  return (data ?? []) as ChecklistItem[];
}

export async function toggleChecklistItem(
  itemId: string,
  completed: boolean
): Promise<void> {
  const { error } = await db
    .from("application_checklist_items")
    .update({
      completed_at: completed ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", itemId);
  if (error) throw error;
}

export async function updateChecklistItemDue(
  itemId: string,
  dueDate: string | null
): Promise<void> {
  const { error } = await db
    .from("application_checklist_items")
    .update({ due_date: dueDate, updated_at: new Date().toISOString() })
    .eq("id", itemId);
  if (error) throw error;
}

// ─── Deadlines ────────────────────────────────────────────────────────────────

export async function fetchAllDeadlines(studentId: string): Promise<DeadlineItem[]> {
  const [collegeRes, scholarshipRes] = await Promise.all([
    supabase
      .from("college_matches")
      .select("id, college_id, shortlist_status, app_type, deadline_date, colleges(name)")
      .eq("student_id", studentId)
      .not("deadline_date", "is", null)
      .not("shortlist_status", "eq", "NOT_NOW"),
    supabase
      .from("scholarship_pipeline_items")
      .select("id, scholarship_id, pipeline_status, due_at, scholarships(name, deadline_date)")
      .eq("student_id", studentId)
      .not("pipeline_status", "eq", "SUBMITTED"),
  ]);

  const deadlines: DeadlineItem[] = [];

  for (const row of collegeRes.data ?? []) {
    const r = row as unknown as {
      id: string;
      college_id: string;
      shortlist_status: string;
      app_type: string | null;
      deadline_date: string;
      colleges: { name: string } | null;
    };
    if (!r.deadline_date) continue;
    deadlines.push({
      id: `college-${r.id}`,
      type: "college",
      name: r.colleges?.name ?? "Unknown College",
      deadline_date: r.deadline_date,
      app_type: r.app_type ?? "RD",
      status: r.shortlist_status,
      college_id: r.college_id,
      match_id: r.id,
    });
  }

  for (const row of scholarshipRes.data ?? []) {
    const r = row as unknown as {
      id: string;
      scholarship_id: string;
      pipeline_status: string;
      due_at: string | null;
      scholarships: { name: string; deadline_date: string | null } | null;
    };
    const deadline = r.due_at
      ? r.due_at.split("T")[0]
      : r.scholarships?.deadline_date;
    if (!deadline) continue;
    deadlines.push({
      id: `scholarship-${r.id}`,
      type: "scholarship",
      name: r.scholarships?.name ?? "Unknown Scholarship",
      deadline_date: deadline,
      status: r.pipeline_status,
      scholarship_id: r.scholarship_id,
      match_id: r.id,
    });
  }

  return deadlines.sort(
    (a, b) => new Date(a.deadline_date).getTime() - new Date(b.deadline_date).getTime()
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function daysUntil(dateStr: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function urgencyLevel(days: number): "overdue" | "critical" | "soon" | "upcoming" | "future" {
  if (days < 0) return "overdue";
  if (days <= 7) return "critical";
  if (days <= 30) return "soon";
  if (days <= 90) return "upcoming";
  return "future";
}

export const STATUS_CONFIG: Record<AppStatus, { label: string; color: string; description: string }> = {
  INTERESTED: {
    label: "Interested",
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    description: "On your radar — researching",
  },
  APPLYING: {
    label: "Applying",
    color: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
    description: "Actively working on application",
  },
  APPLIED: {
    label: "Applied",
    color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    description: "Application submitted",
  },
  NOT_NOW: {
    label: "Not Now",
    color: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
    description: "Removed from active list",
  },
};

export const APP_TYPE_LABELS: Record<AppType, string> = {
  ED: "Early Decision",
  EA: "Early Action",
  REA: "Restrictive EA",
  RD: "Regular Decision",
  Rolling: "Rolling",
};
