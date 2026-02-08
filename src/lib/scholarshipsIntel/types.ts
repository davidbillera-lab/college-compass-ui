export interface ScholarshipQuestion {
  id: string;
  key: string;
  question_text: string;
  answer_type: 'boolean' | 'number' | 'select' | 'multiselect' | 'text';
  options: string[] | null;
  applies_to: {
    sensitive?: boolean;
  };
  created_at: string;
}

export interface ScholarshipUserAnswer {
  id: string;
  user_id: string;
  question_key: string;
  answer_json: unknown;
  updated_at: string;
}

export interface NormalizedCriteria {
  // Academic requirements
  min_gpa?: number | null;
  max_gpa?: number | null;
  min_sat?: number | null;
  max_sat?: number | null;
  min_act?: number | null;
  max_act?: number | null;
  min_psat?: number | null;
  class_rank_percentile?: number | null; // e.g., top 10% = 10
  requires_ap_courses?: boolean | null;
  min_ap_courses?: number | null;
  
  // Extracurricular requirements
  volunteer_hours_min?: number | null;
  leadership_required?: boolean | null;
  community_service_required?: boolean | null;
  
  // Athletic requirements
  athletics?: string[] | null; // specific sports
  athletic_division?: string[] | null; // D1, D2, D3, NAIA
  varsity_required?: boolean | null;
  
  // Financial/demographic
  need_based?: boolean | null;
  merit_based?: boolean | null;
  first_gen?: boolean | null;
  max_family_income?: number | null;
  pell_eligible?: boolean | null;
  
  // Location
  states?: string[] | null;
  citizenship?: string[] | null; // US Citizen, Permanent Resident, DACA, etc.
  
  // Academic interests
  majors?: string[] | null;
  career_goals?: string[] | null;
  
  // Demographics (optional boosters, never disqualifiers)
  demographics_optional?: {
    race?: string[];
    gender?: string[];
    religion?: string[];
    disability?: boolean;
    military_affiliated?: boolean;
    lgbtq?: boolean;
  } | null;
  
  // Education level
  education_levels?: string[] | null; // high school senior, college freshman, etc.
  
  // Special requirements
  essay_required?: boolean | null;
  interview_required?: boolean | null;
  recommendation_letters?: number | null;
  
  // Awards/achievements
  requires_awards?: boolean | null;
  specific_awards?: string[] | null;
  
  // Work experience
  work_experience_hours_min?: number | null;
}

export interface Scholarship {
  id: string;
  created_at: string;
  updated_at?: string;
  name: string;
  provider?: string | null;
  url?: string | null;
  amount_usd?: number | null;
  amount_min_usd?: number | null;
  amount_max_usd?: number | null;
  deadline?: string | null;
  deadline_date?: string | null;
  rolling_deadline?: boolean;
  location_scope?: string | null;
  education_level?: string | null;
  major_tags?: string | null;
  career_tags?: string | null;
  raw_eligibility_text?: string | null;
  normalized_criteria?: NormalizedCriteria;
  description?: string | null;
  tags?: string | null;
  source_type?: string | null;
  source_url?: string | null;
  last_crawled_at?: string | null;
  status?: string;
}

export interface ScholarshipMatch {
  id: string;
  user_id: string;
  scholarship_id: string;
  score: number;
  eligibility_status: 'eligible' | 'maybe' | 'ineligible';
  reasons: string;
  missing_fields: string[];
  created_at: string;
}

export interface MatchResult {
  score: number;
  eligibility_status: 'eligible' | 'maybe' | 'ineligible';
  reasons: string[];
  missing_fields: string[];
}

export interface Profile {
  id: string;
  gpa_unweighted?: number | null;
  gpa_weighted?: number | null;
  gpa_scale?: number | null;
  sat_score?: number | null;
  act_score?: number | null;
  psat_score?: number | null;
  class_rank?: string | null;
  class_size?: number | null;
  intended_majors?: string[] | null;
  region?: string | null;
  state?: string | null;
  grad_year?: number | null;
  graduation_year?: number | null;
  citizenship?: string | null;
  first_gen_college?: boolean | null;
  financial_need?: boolean | null;
  estimated_efc?: number | null;
  volunteer_hours?: number | null;
  work_experience_hours?: number | null;
  leadership_roles?: string[] | null;
  sports_played?: string[] | null;
  awards?: string[] | null;
  ap_courses?: string[] | null;
  honors_courses?: string[] | null;
  profile_extras?: {
    admin?: boolean;
    activities?: Array<{ 
      category?: string;
      title?: string;
      description?: string;
      hours_per_week?: number;
      weeks_per_year?: number;
      years?: number;
    }>;
    athletic_achievements?: Array<{
      sport?: string;
      level?: string;
      achievement?: string;
    }>;
    sensitive?: {
      race_ethnicity?: string[];
      gender?: string;
      religion?: string;
      disability?: boolean;
      military_affiliated?: boolean;
      lgbtq?: boolean;
    };
    [key: string]: unknown;
  };
}
