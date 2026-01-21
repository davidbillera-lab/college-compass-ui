import { supabase } from "@/integrations/supabase/client";

export type ScholarshipDirectoryRow = {
  id: string;
  name: string;
  provider: string | null;
  url: string | null;
  amount_min_usd: number | null;
  amount_max_usd: number | null;
  deadline_date: string | null; // YYYY-MM-DD
  rolling_deadline: boolean | null;
  location_scope: string | null;
  major_tags: string | null;
  career_tags: string | null;
  raw_eligibility_text: string | null;
  status: string | null;
};

export type ScholarshipDirectoryFilters = {
  q: string;
  deadline: "any" | "next30" | "next60" | "rolling";
  minAmount: "any" | "500" | "1000" | "5000" | "10000";
  scope: "any" | "national" | "state" | "local";
  status: "active" | "archived" | "all";
  sort: "deadline" | "amount" | "name";
};

function yyyyMMdd(d: Date) {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export async function fetchScholarshipDirectory(filters: ScholarshipDirectoryFilters) {
  let q = supabase
    .from("scholarships")
    .select(
      "id,name,provider,url,amount_min_usd,amount_max_usd,deadline_date,rolling_deadline,location_scope,major_tags,career_tags,raw_eligibility_text,status"
    );

  // Status
  if (filters.status !== "all") q = q.eq("status", filters.status);

  // Search
  const query = filters.q.trim();
  if (query) {
    q = q.or(
      `name.ilike.%${query}%,provider.ilike.%${query}%,major_tags.ilike.%${query}%,career_tags.ilike.%${query}%`
    );
  }

  // Deadline
  const now = new Date();
  if (filters.deadline === "rolling") {
    q = q.eq("rolling_deadline", true);
  } else if (filters.deadline === "next30") {
    const to = new Date(now);
    to.setDate(to.getDate() + 30);
    q = q.gte("deadline_date", yyyyMMdd(now)).lte("deadline_date", yyyyMMdd(to));
  } else if (filters.deadline === "next60") {
    const to = new Date(now);
    to.setDate(to.getDate() + 60);
    q = q.gte("deadline_date", yyyyMMdd(now)).lte("deadline_date", yyyyMMdd(to));
  }

  // Min amount (use amount_max_usd when available)
  if (filters.minAmount !== "any") {
    q = q.gte("amount_max_usd", Number(filters.minAmount));
  }

  // Scope (simple heuristic)
  if (filters.scope !== "any") {
    if (filters.scope === "national") q = q.ilike("location_scope", "%national%");
    if (filters.scope === "state") q = q.or("location_scope.ilike.%state%,location_scope.ilike.%CA%,location_scope.ilike.%TX%");
    if (filters.scope === "local") q = q.ilike("location_scope", "%local%");
  }

  // Sort
  if (filters.sort === "amount") {
    q = q.order("amount_max_usd", { ascending: false, nullsFirst: false });
  } else if (filters.sort === "name") {
    q = q.order("name", { ascending: true });
  } else {
    q = q.order("deadline_date", { ascending: true, nullsFirst: false });
  }

  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as ScholarshipDirectoryRow[];
}

export async function addScholarshipToPipeline(scholarshipId: string) {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error("Not authenticated");

  // Table uses student_id (not user_id) per schema
  const { error: upErr } = await supabase
    .from("scholarship_pipeline_items")
    .upsert(
      { student_id: data.user.id, scholarship_id: scholarshipId, status: "NOT_STARTED" },
      { onConflict: "student_id,scholarship_id" }
    );

  if (upErr) throw upErr;
}
