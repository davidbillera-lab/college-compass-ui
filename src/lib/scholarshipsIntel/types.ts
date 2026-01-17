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
  min_gpa?: number | null;
  states?: string[] | null;
  need_based?: boolean | null;
  first_gen?: boolean | null;
  volunteer_hours_min?: number | null;
  athletics?: string[] | null;
  majors?: string[] | null;
  career_goals?: string[] | null;
  demographics_optional?: {
    race?: string[];
    religion?: string[];
  } | null;
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
  intended_majors?: string[] | null;
  region?: string | null;
  grad_year?: number | null;
  graduation_year?: number | null;
  profile_extras?: {
    admin?: boolean;
    activities?: Array<{ category?: string }>;
    sensitive?: {
      race_ethnicity?: string[];
      religion?: string;
    };
    [key: string]: unknown;
  };
}
