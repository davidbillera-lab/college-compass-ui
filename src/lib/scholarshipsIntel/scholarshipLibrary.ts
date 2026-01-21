import { supabase } from "@/integrations/supabase/client";

export type ScholarshipRow = {
  id: string;
  name: string;
  provider: string | null;
  url: string | null;
  amount_min_usd: number | null;
  amount_max_usd: number | null;
  deadline_date: string | null; // YYYY-MM-DD
  rolling_deadline: boolean | null;
  location_scope: string | null;
  education_level: string | null;
  major_tags: string | null;
  career_tags: string | null;
  raw_eligibility_text: string | null;
  normalized_criteria: unknown | null;
  status: string | null;
  source_type: string | null;
  source_url: string | null;
  last_crawled_at: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type ScholarshipLibraryFilters = {
  q?: string;
  status?: "active" | "archived" | "all";
  rollingOnly?: boolean;
  deadline?: "any" | "next30" | "next60" | "past";
  sort?: "deadline" | "amount" | "newest";
};

function yyyyMMdd(d: Date) {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export async function fetchScholarships(filters: ScholarshipLibraryFilters): Promise<ScholarshipRow[]> {
  let query = supabase
    .from("scholarships")
    .select(
      "id,name,provider,url,amount_min_usd,amount_max_usd,deadline_date,rolling_deadline,location_scope,education_level,major_tags,career_tags,raw_eligibility_text,normalized_criteria,status,source_type,source_url,last_crawled_at,created_at,updated_at"
    );

  // status
  if (filters.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  } else {
    // default to active if not specified
    if (!filters.status) query = query.eq("status", "active");
  }

  // rolling filter
  if (filters.rollingOnly) {
    query = query.eq("rolling_deadline", true);
  }

  // deadline windows
  const now = new Date();
  if (filters.deadline === "next30") {
    const to = new Date(now);
    to.setDate(to.getDate() + 30);
    query = query.gte("deadline_date", yyyyMMdd(now)).lte("deadline_date", yyyyMMdd(to));
  } else if (filters.deadline === "next60") {
    const to = new Date(now);
    to.setDate(to.getDate() + 60);
    query = query.gte("deadline_date", yyyyMMdd(now)).lte("deadline_date", yyyyMMdd(to));
  } else if (filters.deadline === "past") {
    query = query.lt("deadline_date", yyyyMMdd(now));
  }

  // search (simple ilike on name/provider/tags)
  if (filters.q && filters.q.trim()) {
    const q = filters.q.trim();
    query = query.or(
      `name.ilike.%${q}%,provider.ilike.%${q}%,major_tags.ilike.%${q}%,career_tags.ilike.%${q}%`
    );
  }

  // sort
  if (filters.sort === "amount") {
    query = query.order("amount_max_usd", { ascending: false, nullsFirst: false });
  } else if (filters.sort === "newest") {
    query = query.order("created_at", { ascending: false, nullsFirst: false });
  } else {
    // default: deadline ascending with nulls last
    query = query.order("deadline_date", { ascending: true, nullsFirst: false });
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as ScholarshipRow[];
}

/**
 * Add a scholarship to the user's pipeline.
 * Uses student_id to match the RLS policy on scholarship_pipeline_items.
 */
export async function addScholarshipToPipeline(scholarshipId: string) {
  const { data: u, error: uErr } = await supabase.auth.getUser();
  if (uErr) throw uErr;
  if (!u.user) throw new Error("Not authenticated");

  // Table uses student_id (not user_id) per schema
  const { error } = await supabase
    .from("scholarship_pipeline_items")
    .upsert(
      { student_id: u.user.id, scholarship_id: scholarshipId, status: "NOT_STARTED" },
      { onConflict: "student_id,scholarship_id" }
    );

  if (error) throw error;
}
