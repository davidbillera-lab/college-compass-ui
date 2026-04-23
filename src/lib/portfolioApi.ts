import { supabase } from "@/integrations/supabase/client";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export interface ApplicationMaterial {
  id: string;
  material_type: string;
  category: string;
  title: string;
  description: string | null;
  file_url: string | null;
  file_name: string | null;
  file_size: number | null;
  content_text: string | null;
  ai_analysis: Record<string, unknown> | null;
  ai_analyzed_at: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export interface PortfolioShare {
  id: string;
  user_id: string;
  share_token: string;
  label: string;
  is_active: boolean;
  include_essays: boolean;
  include_materials: boolean;
  include_profile: boolean;
  view_count: number;
  last_viewed_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export const PORTFOLIO_CATEGORIES = [
  { key: "transcript", label: "Transcripts", icon: "FileText", description: "Official and unofficial transcripts" },
  { key: "achievement", label: "Awards & Achievements", icon: "Trophy", description: "Certificates, awards, and honors" },
  { key: "extracurricular", label: "Extracurriculars", icon: "Activity", description: "Activity lists, club materials, sports" },
  { key: "portfolio", label: "Portfolio & Creative Work", icon: "Palette", description: "Art, writing samples, projects, videos" },
  { key: "resume", label: "Resume / CV", icon: "Briefcase", description: "Student resume or CV" },
  { key: "recommendation", label: "Recommendation Letters", icon: "MessageSquare", description: "Letters from teachers and counselors" },
  { key: "essay_draft", label: "Essay Drafts", icon: "PenLine", description: "Essay drafts and writing samples" },
  { key: "other", label: "Other Documents", icon: "Folder", description: "Anything else for your application" },
] as const;

export type PortfolioCategory = typeof PORTFOLIO_CATEGORIES[number]["key"];

export async function fetchMaterials(userId: string): Promise<ApplicationMaterial[]> {
  const { data, error } = await supabase
    .from("application_materials")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []) as ApplicationMaterial[];
}

export async function deleteMaterial(id: string, fileUrl: string | null): Promise<void> {
  // Delete from storage if there's a file
  if (fileUrl) {
    const url = new URL(fileUrl);
    const pathParts = url.pathname.split("/object/public/application-materials/");
    if (pathParts.length === 2) {
      await supabase.storage.from("application-materials").remove([pathParts[1]]);
    }
  }
  const { error } = await supabase.from("application_materials").delete().eq("id", id);
  if (error) throw error;
}

export async function fetchMyPortfolioShare(userId: string): Promise<PortfolioShare | null> {
  const { data, error } = await db
    .from("portfolio_shares")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data as PortfolioShare | null;
}

export async function createPortfolioShare(
  userId: string,
  label: string,
  options: { include_essays?: boolean; include_materials?: boolean; include_profile?: boolean }
): Promise<PortfolioShare> {
  const { data, error } = await db
    .from("portfolio_shares")
    .insert({
      user_id: userId,
      label,
      is_active: true,
      include_essays: options.include_essays ?? true,
      include_materials: options.include_materials ?? true,
      include_profile: options.include_profile ?? true,
    })
    .select()
    .single();
  if (error) throw error;
  return data as PortfolioShare;
}

export async function deactivatePortfolioShare(id: string): Promise<void> {
  const { error } = await db
    .from("portfolio_shares")
    .update({ is_active: false })
    .eq("id", id);
  if (error) throw error;
}

export async function fetchSharedPortfolio(token: string): Promise<{
  share: PortfolioShare;
  materials: ApplicationMaterial[];
  profile: Record<string, unknown> | null;
} | null> {
  // Fetch the share record
  const { data: share, error: shareError } = await db
    .from("portfolio_shares")
    .select("*")
    .eq("share_token", token)
    .eq("is_active", true)
    .maybeSingle();

  if (shareError || !share) return null;

  const portfolioShare = share as PortfolioShare;

  // Increment view count
  await db
    .from("portfolio_shares")
    .update({ view_count: portfolioShare.view_count + 1, last_viewed_at: new Date().toISOString() })
    .eq("id", portfolioShare.id);

  // Fetch materials if included
  let materials: ApplicationMaterial[] = [];
  if (portfolioShare.include_materials) {
    const { data: mats } = await supabase
      .from("application_materials")
      .select("*")
      .eq("user_id", portfolioShare.user_id)
      .order("category", { ascending: true });
    materials = (mats || []) as ApplicationMaterial[];
  }

  // Fetch profile if included
  let profile: Record<string, unknown> | null = null;
  if (portfolioShare.include_profile) {
    const { data: prof } = await db
      .from("profiles")
      .select("full_name, grad_year, gpa_unweighted, gpa_weighted, sat_score, act_score, intended_majors, budget_max_usd")
      .eq("id", portfolioShare.user_id)
      .maybeSingle();
    profile = prof as Record<string, unknown> | null;
  }

  return { share: portfolioShare, materials, profile };
}

export function calcPortfolioCompleteness(materials: ApplicationMaterial[]): {
  score: number;
  byCategory: Record<string, number>;
} {
  const priorityCategories = ["transcript", "resume", "extracurricular", "achievement", "recommendation"];
  const byCategory: Record<string, number> = {};
  for (const cat of PORTFOLIO_CATEGORIES) {
    byCategory[cat.key] = materials.filter((m) => m.category === cat.key).length;
  }
  const filled = priorityCategories.filter((c) => byCategory[c] > 0).length;
  const score = Math.round((filled / priorityCategories.length) * 100);
  return { score, byCategory };
}
