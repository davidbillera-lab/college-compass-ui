export interface College {
  id: string;
  created_at: string;
  updated_at?: string;
  name: string;
  city?: string | null;
  state?: string | null;
  region?: string | null;
  type?: string | null; // 'public', 'private', 'community'
  setting?: string | null; // 'urban', 'suburban', 'rural'
  size?: string | null; // 'small', 'medium', 'large', 'very_large'
  acceptance_rate?: number | null;
  sat_range_low?: number | null;
  sat_range_high?: number | null;
  act_range_low?: number | null;
  act_range_high?: number | null;
  avg_gpa?: number | null;
  tuition_in_state?: number | null;
  tuition_out_state?: number | null;
  sticker_usd?: number | null;
  avg_financial_aid?: number | null;
  student_population?: number | null;
  student_faculty_ratio?: number | null;
  graduation_rate?: number | null;
  retention_rate?: number | null;
  athletics_division?: string | null; // 'D1', 'D2', 'D3', 'NAIA', 'none'
  sports?: string[] | null;
  notable_programs?: string[] | null;
  majors?: string | null;
  religious_affiliation?: string | null;
  website_url?: string | null;
  logo_url?: string | null;
  source_type?: string | null;
  source_url?: string | null;
  last_crawled_at?: string | null;
}

export interface CollegeProfile {
  id: string;
  // Academics
  gpa_unweighted?: number | null;
  gpa_weighted?: number | null;
  gpa_scale?: number | null;
  sat_score?: number | null;
  act_score?: number | null;
  psat_score?: number | null;
  ap_courses?: string[] | null;
  honors_courses?: string[] | null;
  class_rank?: string | null;
  intended_majors?: string[] | null;
  
  // Location
  city?: string | null;
  state?: string | null;
  region?: string | null;
  max_distance_miles?: number | null;
  
  // Preferences
  preferred_college_type?: string | null;
  preferred_setting?: string | null;
  campus_size?: string | null;
  budget_max_usd?: number | null;
  
  // Activities & achievements
  sports_played?: string[] | null;
  volunteer_hours?: number | null;
  leadership_roles?: string[] | null;
  awards?: string[] | null;
  special_talents?: string[] | null;
  
  // Demographics
  first_gen_college?: boolean | null;
  financial_need?: boolean | null;
  estimated_efc?: number | null;
  citizenship?: string | null;
  
  // Extras
  profile_extras?: {
    admin?: boolean;
    activities?: Array<{ category?: string; name?: string; role?: string }>;
    test_scores?: Array<{ type: string; composite?: number }>;
    [key: string]: unknown;
  };
}

export interface CollegeMatchResult {
  score: number;
  bucket: 'reach' | 'target' | 'safety' | 'unlikely';
  breakdown: {
    academic: number;
    financial: number;
    location: number;
    activities: number;
    preferences: number;
  };
  reasons: string[];
  missing_fields: string[];
}

export interface CollegeMatch {
  id: string;
  student_id: string;
  college_id: string;
  fit_score: number;
  bucket: string;
  why_fit?: string | null;
  notes?: string | null;
  shortlist_status?: string | null;
  academic_match_score?: number | null;
  financial_match_score?: number | null;
  location_match_score?: number | null;
  activities_match_score?: number | null;
  created_at: string;
  updated_at: string;
}
