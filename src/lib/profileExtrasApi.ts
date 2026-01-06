import { supabase } from "@/integrations/supabase/client";
import type { Activity, ProfileExtras } from "@/lib/profileUtils";

async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error("Not authenticated");
  return data.user.id;
}

export async function loadProfile() {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  if (error) throw error;
  return data;
}

export async function ensureProfileRow() {
  const userId = await requireUserId();

  const { data: existing, error: selErr } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (selErr) throw selErr;
  if (existing) return existing;

  const { data: created, error: insErr } = await supabase
    .from("profiles")
    .insert({
      id: userId,
      full_name: "New Student",
      grad_year: new Date().getFullYear() + 1,
      profile_extras: {},
    })
    .select("*")
    .single();

  if (insErr) throw insErr;
  return created;
}

export async function saveProfileExtras(extras: ProfileExtras) {
  const userId = await requireUserId();
  const { error } = await supabase
    .from("profiles")
    .update({ profile_extras: extras })
    .eq("id", userId);

  if (error) throw error;
}

export function normalizeExtras(raw: unknown): ProfileExtras {
  const extras = (raw ?? {}) as ProfileExtras;
  if (!extras.activities || !Array.isArray(extras.activities)) extras.activities = [];
  return extras;
}

export function newActivity(): Activity {
  return { name: "", role: "", years: "", impact: "" };
}
