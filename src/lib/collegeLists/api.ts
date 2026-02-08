import { supabase } from "@/integrations/supabase/client";

export interface CollegeList {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  color: string | null;
  share_token: string | null;
  created_at: string;
  updated_at: string;
}

export interface CollegeListItem {
  id: string;
  list_id: string;
  college_id: string;
  notes: string | null;
  added_at: string;
}

export interface CollegeListWithCount extends CollegeList {
  item_count: number;
}

// Fetch all lists for the current user
export async function fetchCollegeLists(): Promise<CollegeListWithCount[]> {
  const { data: lists, error: listsError } = await supabase
    .from("college_lists")
    .select("*")
    .order("created_at", { ascending: false });

  if (listsError) throw listsError;

  // Get counts for each list
  const listsWithCounts: CollegeListWithCount[] = await Promise.all(
    (lists || []).map(async (list) => {
      const { count } = await supabase
        .from("college_list_items")
        .select("*", { count: "exact", head: true })
        .eq("list_id", list.id);
      
      return {
        ...list,
        item_count: count || 0,
      };
    })
  );

  return listsWithCounts;
}

// Create a new list
export async function createCollegeList(
  userId: string,
  name: string,
  description?: string,
  color?: string
): Promise<CollegeList> {
  const { data, error } = await supabase
    .from("college_lists")
    .insert({
      user_id: userId,
      name,
      description: description || null,
      color: color || "blue",
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Update a list
export async function updateCollegeList(
  listId: string,
  updates: { name?: string; description?: string; color?: string }
): Promise<CollegeList> {
  const { data, error } = await supabase
    .from("college_lists")
    .update(updates)
    .eq("id", listId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Delete a list
export async function deleteCollegeList(listId: string): Promise<void> {
  const { error } = await supabase
    .from("college_lists")
    .delete()
    .eq("id", listId);

  if (error) throw error;
}

// Fetch items in a list
export async function fetchListItems(listId: string): Promise<CollegeListItem[]> {
  const { data, error } = await supabase
    .from("college_list_items")
    .select("*")
    .eq("list_id", listId)
    .order("added_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

// Add a college to a list
export async function addCollegeToList(
  listId: string,
  collegeId: string,
  notes?: string
): Promise<CollegeListItem> {
  const { data, error } = await supabase
    .from("college_list_items")
    .insert({
      list_id: listId,
      college_id: collegeId,
      notes: notes || null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Remove a college from a list
export async function removeCollegeFromList(
  listId: string,
  collegeId: string
): Promise<void> {
  const { error } = await supabase
    .from("college_list_items")
    .delete()
    .eq("list_id", listId)
    .eq("college_id", collegeId);

  if (error) throw error;
}

// Get all lists a college belongs to
export async function getCollegeListMembership(collegeId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("college_list_items")
    .select("list_id")
    .eq("college_id", collegeId);

  if (error) throw error;
  return (data || []).map((item) => item.list_id);
}

// Generate a share token for a list
export async function generateShareToken(listId: string): Promise<string> {
  const token = crypto.randomUUID();
  const { error } = await supabase
    .from("college_lists")
    .update({ share_token: token })
    .eq("id", listId);

  if (error) throw error;
  return token;
}

// Revoke share token (make list private again)
export async function revokeShareToken(listId: string): Promise<void> {
  const { error } = await supabase
    .from("college_lists")
    .update({ share_token: null })
    .eq("id", listId);

  if (error) throw error;
}

// Fetch a shared list by its share token (public access)
export async function fetchSharedList(shareToken: string): Promise<CollegeList | null> {
  const { data, error } = await supabase
    .from("college_lists")
    .select("*")
    .eq("share_token", shareToken)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // Not found
    throw error;
  }
  return data;
}

// Fetch items in a shared list (public access)
export async function fetchSharedListItems(shareToken: string): Promise<CollegeListItem[]> {
  // First get the list to verify it's shared
  const list = await fetchSharedList(shareToken);
  if (!list) return [];

  const { data, error } = await supabase
    .from("college_list_items")
    .select("*")
    .eq("list_id", list.id)
    .order("added_at", { ascending: false });

  if (error) throw error;
  return data || [];
}
