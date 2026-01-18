import { supabase } from '@/integrations/supabase/client';
import { College, CollegeProfile, CollegeMatchResult } from './types';
import { calculateCollegeMatch, calculateAllCollegeMatches } from './matching';

// Fetch all colleges
export async function fetchColleges(): Promise<College[]> {
  const { data, error } = await supabase
    .from('colleges')
    .select('*')
    .order('name');
  
  if (error) {
    console.error('Error fetching colleges:', error);
    throw error;
  }
  
  return (data || []) as College[];
}

// Fetch colleges with filters
export async function fetchCollegesFiltered(filters: {
  region?: string;
  state?: string;
  type?: string;
  size?: string;
  maxTuition?: number;
  minAcceptanceRate?: number;
  athleticsDivision?: string;
  majors?: string[];
}): Promise<College[]> {
  let query = supabase.from('colleges').select('*');
  
  if (filters.region) {
    query = query.eq('region', filters.region);
  }
  if (filters.state) {
    query = query.eq('state', filters.state);
  }
  if (filters.type) {
    query = query.eq('type', filters.type);
  }
  if (filters.size) {
    query = query.eq('size', filters.size);
  }
  if (filters.maxTuition) {
    query = query.lte('sticker_usd', filters.maxTuition);
  }
  if (filters.minAcceptanceRate) {
    query = query.gte('acceptance_rate', filters.minAcceptanceRate / 100);
  }
  if (filters.athleticsDivision) {
    query = query.eq('athletics_division', filters.athleticsDivision);
  }
  
  const { data, error } = await query.order('name');
  
  if (error) {
    console.error('Error fetching filtered colleges:', error);
    throw error;
  }
  
  // Filter by majors client-side (JSONB array matching)
  let colleges = (data || []) as College[];
  if (filters.majors && filters.majors.length > 0) {
    colleges = colleges.filter(college => {
      const collegeMajors = college.majors?.toLowerCase() || '';
      return filters.majors!.some(major => collegeMajors.includes(major.toLowerCase()));
    });
  }
  
  return colleges;
}

// Fetch user profile for matching
export async function fetchCollegeProfile(userId: string): Promise<CollegeProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
  
  return data as unknown as CollegeProfile;
}

// Fetch saved college matches for a user
export async function fetchCollegeMatches(userId: string): Promise<Map<string, { score: number; bucket: string }>> {
  const { data, error } = await supabase
    .from('college_matches')
    .select('college_id, fit_score, bucket')
    .eq('student_id', userId);
  
  if (error) {
    console.error('Error fetching college matches:', error);
    return new Map();
  }
  
  const matches = new Map<string, { score: number; bucket: string }>();
  for (const match of data || []) {
    matches.set(match.college_id, { score: match.fit_score, bucket: match.bucket });
  }
  
  return matches;
}

// Upsert a college match
export async function upsertCollegeMatch(
  userId: string,
  collegeId: string,
  result: CollegeMatchResult
): Promise<void> {
  const { error } = await supabase
    .from('college_matches')
    .upsert({
      student_id: userId,
      college_id: collegeId,
      fit_score: result.score,
      bucket: result.bucket,
      why_fit: result.reasons.join('\n'),
      academic_match_score: result.breakdown.academic,
      financial_match_score: result.breakdown.financial,
      location_match_score: result.breakdown.location,
      activities_match_score: result.breakdown.activities,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'student_id,college_id'
    });
  
  if (error) {
    console.error('Error upserting college match:', error);
    throw error;
  }
}

// Batch upsert college matches
export async function batchUpsertCollegeMatches(
  userId: string,
  matches: Map<string, CollegeMatchResult>
): Promise<void> {
  const records = Array.from(matches.entries()).map(([collegeId, result]) => ({
    student_id: userId,
    college_id: collegeId,
    fit_score: result.score,
    bucket: result.bucket,
    why_fit: result.reasons.slice(0, 5).join('\n'),
    academic_match_score: result.breakdown.academic,
    financial_match_score: result.breakdown.financial,
    location_match_score: result.breakdown.location,
    activities_match_score: result.breakdown.activities,
    updated_at: new Date().toISOString()
  }));
  
  // Batch in chunks of 50
  const chunkSize = 50;
  for (let i = 0; i < records.length; i += chunkSize) {
    const chunk = records.slice(i, i + chunkSize);
    const { error } = await supabase
      .from('college_matches')
      .upsert(chunk, { onConflict: 'student_id,college_id' });
    
    if (error) {
      console.error('Error batch upserting college matches:', error);
    }
  }
}

// Recalculate all matches for a user
export async function recalculateCollegeMatches(
  userId: string
): Promise<Map<string, CollegeMatchResult>> {
  const [colleges, profile] = await Promise.all([
    fetchColleges(),
    fetchCollegeProfile(userId)
  ]);
  
  if (!profile) {
    throw new Error('Profile not found');
  }
  
  const results = calculateAllCollegeMatches(colleges, profile);
  
  // Save results
  await batchUpsertCollegeMatches(userId, results);
  
  return results;
}

// Update shortlist status
export async function updateShortlistStatus(
  userId: string,
  collegeId: string,
  status: 'INTERESTED' | 'APPLYING' | 'APPLIED' | 'NOT_NOW' | null
): Promise<void> {
  const { error } = await supabase
    .from('college_matches')
    .update({ 
      shortlist_status: status,
      updated_at: new Date().toISOString()
    })
    .eq('student_id', userId)
    .eq('college_id', collegeId);
  
  if (error) {
    console.error('Error updating shortlist status:', error);
    throw error;
  }
}

// Trigger college ingestion (admin only)
export async function triggerCollegeIngestion(
  startUrl: string,
  maxPages: number = 20
): Promise<{ success: boolean; message: string; details?: unknown }> {
  const { data, error } = await supabase.functions.invoke('college-ingest', {
    body: { startUrl, maxPages }
  });
  
  if (error) {
    console.error('Error triggering college ingestion:', error);
    return { success: false, message: error.message };
  }
  
  return {
    success: data?.success || false,
    message: data?.success 
      ? `Processed ${data.pagesProcessed} pages. Inserted: ${data.inserted}, Updated: ${data.updated}`
      : data?.error || 'Unknown error',
    details: data
  };
}
