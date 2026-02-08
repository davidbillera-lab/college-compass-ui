import { supabase } from '@/integrations/supabase/client';
import { Scholarship, ScholarshipQuestion, ScholarshipUserAnswer, ScholarshipMatch, Profile, MatchResult, NormalizedCriteria } from './types';
import { calculateMatch } from './matching';

// Fetch all active scholarships
export async function fetchScholarships(): Promise<Scholarship[]> {
  const { data, error } = await supabase
    .from('scholarships')
    .select('*')
    .or('status.is.null,status.eq.active')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching scholarships:', error);
    throw error;
  }
  
  return (data || []) as Scholarship[];
}

// Fetch all scholarship questions
export async function fetchScholarshipQuestions(): Promise<ScholarshipQuestion[]> {
  const { data, error } = await supabase
    .from('scholarship_questions')
    .select('*')
    .order('created_at', { ascending: true });
  
  if (error) {
    console.error('Error fetching questions:', error);
    throw error;
  }
  
  return (data || []).map(q => ({
    ...q,
    options: q.options ? (Array.isArray(q.options) ? q.options : JSON.parse(q.options as string)) : null,
    applies_to: q.applies_to || {},
  })) as ScholarshipQuestion[];
}

// Fetch user's scholarship answers
export async function fetchUserAnswers(userId: string): Promise<ScholarshipUserAnswer[]> {
  const { data, error } = await supabase
    .from('scholarship_user_answers')
    .select('*')
    .eq('user_id', userId);
  
  if (error) {
    console.error('Error fetching user answers:', error);
    throw error;
  }
  
  return (data || []) as ScholarshipUserAnswer[];
}

// Upsert a user answer
export async function upsertUserAnswer(
  userId: string,
  questionKey: string,
  answerJson: unknown
): Promise<void> {
  const { error } = await supabase
    .from('scholarship_user_answers')
    .upsert({
      user_id: userId,
      question_key: questionKey,
      answer_json: answerJson as Record<string, unknown>,
      updated_at: new Date().toISOString(),
    } as never, {
      onConflict: 'user_id,question_key',
    });
  
  if (error) {
    console.error('Error upserting answer:', error);
    throw error;
  }
}

// Fetch user's cached matches
export async function fetchUserMatches(userId: string): Promise<ScholarshipMatch[]> {
  const { data, error } = await supabase
    .from('scholarship_matches')
    .select('*')
    .eq('user_id', userId);
  
  if (error) {
    console.error('Error fetching matches:', error);
    throw error;
  }
  
  return (data || []).map(m => ({
    ...m,
    missing_fields: Array.isArray(m.missing_fields) ? m.missing_fields : [],
  })) as ScholarshipMatch[];
}

// Upsert a match result
export async function upsertMatch(
  userId: string,
  scholarshipId: string,
  result: MatchResult
): Promise<void> {
  const { error } = await supabase
    .from('scholarship_matches')
    .upsert({
      user_id: userId,
      scholarship_id: scholarshipId,
      score: result.score,
      eligibility_status: result.eligibility_status,
      reasons: result.reasons.join('\n'),
      missing_fields: result.missing_fields,
    }, {
      onConflict: 'user_id,scholarship_id',
    });
  
  if (error) {
    console.error('Error upserting match:', error);
    throw error;
  }
}

// Batch upsert matches
export async function batchUpsertMatches(
  userId: string,
  matches: Map<string, MatchResult>
): Promise<void> {
  const records = Array.from(matches.entries()).map(([scholarshipId, result]) => ({
    user_id: userId,
    scholarship_id: scholarshipId,
    score: result.score,
    eligibility_status: result.eligibility_status,
    reasons: result.reasons.join('\n'),
    missing_fields: result.missing_fields,
  }));
  
  // Batch in chunks of 50
  for (let i = 0; i < records.length; i += 50) {
    const chunk = records.slice(i, i + 50);
    const { error } = await supabase
      .from('scholarship_matches')
      .upsert(chunk, {
        onConflict: 'user_id,scholarship_id',
      });
    
    if (error) {
      console.error('Error batch upserting matches:', error);
      throw error;
    }
  }
}

// Fetch user profile
export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
  
  return data as Profile;
}

// Check if user is admin using secure user_roles table
export async function isUserAdmin(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .eq('role', 'admin')
    .maybeSingle();
  
  if (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
  
  return data !== null;
}

// Add scholarship to pipeline
export async function addToPipeline(
  studentId: string,
  scholarshipId: string
): Promise<void> {
  // Check if already in pipeline
  const { data: existing } = await supabase
    .from('scholarship_pipeline_items')
    .select('id')
    .eq('student_id', studentId)
    .eq('scholarship_id', scholarshipId)
    .maybeSingle();
  
  if (existing) {
    throw new Error('Scholarship already in pipeline');
  }
  
  const { error } = await supabase
    .from('scholarship_pipeline_items')
    .insert({
      student_id: studentId,
      scholarship_id: scholarshipId,
      status: 'NOT_STARTED',
      pipeline_status: 'NOT_STARTED',
    });
  
  if (error) {
    console.error('Error adding to pipeline:', error);
    throw error;
  }
}

// Check if scholarship is in pipeline
export async function isInPipeline(
  studentId: string,
  scholarshipId: string
): Promise<boolean> {
  const { data } = await supabase
    .from('scholarship_pipeline_items')
    .select('id')
    .eq('student_id', studentId)
    .eq('scholarship_id', scholarshipId)
    .maybeSingle();
  
  return !!data;
}

// Fetch pipeline status for multiple scholarships
export async function fetchPipelineStatuses(
  studentId: string,
  scholarshipIds: string[]
): Promise<Set<string>> {
  if (scholarshipIds.length === 0) return new Set();
  
  const { data } = await supabase
    .from('scholarship_pipeline_items')
    .select('scholarship_id')
    .eq('student_id', studentId)
    .in('scholarship_id', scholarshipIds);
  
  return new Set((data || []).map(d => d.scholarship_id));
}

// Trigger Firecrawl ingestion (admin only)
export async function triggerIngestion(
  startUrl: string,
  maxPages: number = 10
): Promise<{ success: boolean; message: string; details?: unknown }> {
  const { data, error } = await supabase.functions.invoke('firecrawl-ingest', {
    body: { startUrl, maxPages },
  });
  
  if (error) {
    console.error('Ingestion error:', error);
    return { success: false, message: error.message };
  }
  
  if (data?.error) {
    return { success: false, message: data.error };
  }
  
  return {
    success: true,
    message: `Processed ${data.pagesProcessed} pages. Inserted: ${data.inserted}, Updated: ${data.updated}, Skipped: ${data.skipped}`,
    details: data,
  };
}

// Toggle scholarship status (admin only)
export async function toggleScholarshipStatus(
  scholarshipId: string,
  newStatus: 'active' | 'archived'
): Promise<void> {
  const { error } = await supabase
    .from('scholarships')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', scholarshipId);
  
  if (error) {
    console.error('Error toggling status:', error);
    throw error;
  }
}

// Update scholarship criteria (admin only)
export async function updateScholarshipCriteria(
  scholarshipId: string,
  criteria: NormalizedCriteria
): Promise<void> {
  const { error } = await supabase
    .from('scholarships')
    .update({ 
      normalized_criteria: criteria as unknown as Record<string, never>, 
      updated_at: new Date().toISOString() 
    })
    .eq('id', scholarshipId);
  
  if (error) {
    console.error('Error updating criteria:', error);
    throw error;
  }
}

// Parse scholarship eligibility text with AI (admin only)
export async function parseScholarshipCriteria(
  scholarshipId: string,
  rawEligibilityText: string,
  scholarshipName?: string
): Promise<{ success: boolean; criteria?: NormalizedCriteria; error?: string }> {
  const { data, error } = await supabase.functions.invoke('parse-scholarship-criteria', {
    body: {
      scholarship_id: scholarshipId,
      raw_eligibility_text: rawEligibilityText,
      scholarship_name: scholarshipName,
    },
  });

  if (error) {
    console.error('AI parsing error:', error);
    return { success: false, error: error.message };
  }

  if (data?.error) {
    return { success: false, error: data.error };
  }

  return { success: true, criteria: data.criteria as NormalizedCriteria };
}

// Batch parse multiple scholarships with AI (admin only)
export async function batchParseScholarships(
  scholarships: Array<{ id: string; name: string; raw_eligibility_text: string }>,
  onProgress?: (completed: number, total: number, current: string) => void
): Promise<{ success: number; failed: number; errors: string[] }> {
  let success = 0;
  let failed = 0;
  const errors: string[] = [];

  for (let i = 0; i < scholarships.length; i++) {
    const s = scholarships[i];
    onProgress?.(i, scholarships.length, s.name);

    try {
      const result = await parseScholarshipCriteria(s.id, s.raw_eligibility_text, s.name);
      if (result.success) {
        success++;
      } else {
        failed++;
        errors.push(`${s.name}: ${result.error}`);
      }
    } catch (err) {
      failed++;
      errors.push(`${s.name}: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }

    // Add a small delay between requests to avoid rate limiting
    if (i < scholarships.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  onProgress?.(scholarships.length, scholarships.length, 'Complete');
  return { success, failed, errors };
}

// Recalculate all matches for a user (deterministic)
export async function recalculateMatches(
  userId: string
): Promise<Map<string, MatchResult>> {
  const [scholarships, profile, answers] = await Promise.all([
    fetchScholarships(),
    fetchProfile(userId),
    fetchUserAnswers(userId),
  ]);
  
  if (!profile) {
    throw new Error('Profile not found');
  }
  
  const results = new Map<string, MatchResult>();
  
  for (const scholarship of scholarships) {
    const result = calculateMatch(scholarship, profile, answers);
    results.set(scholarship.id, result);
  }
  
  // Save to database
  await batchUpsertMatches(userId, results);
  
  return results;
}

// AI-powered match score result
export interface AIMatchScoreResult {
  overall_score: number;
  eligibility_status: 'eligible' | 'maybe' | 'ineligible';
  breakdown: Array<{
    category: string;
    score: number;
    maxScore: number;
    details: string;
  }>;
  reasoning: string;
  missing_fields: string[];
}

// Calculate AI-powered match scores for scholarships
export async function calculateAIScholarshipScores(
  scholarshipIds: string[]
): Promise<{ results: Record<string, AIMatchScoreResult>; error?: string }> {
  if (scholarshipIds.length === 0) {
    return { results: {} };
  }

  const { data, error } = await supabase.functions.invoke('calculate-match-scores', {
    body: {
      type: 'scholarships',
      scholarship_ids: scholarshipIds,
    },
  });

  if (error) {
    console.error('AI scoring error:', error);
    return { results: {}, error: error.message };
  }

  if (data?.error) {
    return { results: {}, error: data.error };
  }

  return { results: data.results || {} };
}

// Calculate AI-powered match scores for colleges
export async function calculateAICollegeScores(
  collegeIds: string[]
): Promise<{ results: Record<string, AIMatchScoreResult>; error?: string }> {
  if (collegeIds.length === 0) {
    return { results: {} };
  }

  const { data, error } = await supabase.functions.invoke('calculate-match-scores', {
    body: {
      type: 'colleges',
      college_ids: collegeIds,
    },
  });

  if (error) {
    console.error('AI scoring error:', error);
    return { results: {}, error: error.message };
  }

  if (data?.error) {
    return { results: {}, error: data.error };
  }

  return { results: data.results || {} };
}
