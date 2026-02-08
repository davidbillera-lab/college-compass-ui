import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { NormalizedCriteria, Scholarship } from "@/lib/scholarshipsIntel/types";

export interface FieldImpact {
  field: string;
  label: string;
  scholarshipCount: number;
  potentialValue: number;
  isFilled: boolean;
}

// Maps criteria keys to human-readable labels
const FIELD_LABELS: Record<string, string> = {
  min_gpa: "GPA",
  min_sat: "SAT Score",
  min_act: "ACT Score",
  min_psat: "PSAT Score",
  class_rank_percentile: "Class Rank",
  volunteer_hours_min: "Volunteer Hours",
  leadership_required: "Leadership Experience",
  community_service_required: "Community Service",
  work_experience_hours_min: "Work Experience",
  first_gen: "First-Generation Status",
  need_based: "Financial Need",
  pell_eligible: "Pell Eligibility",
  states: "State Residency",
  citizenship: "Citizenship",
  athletics: "Sports/Athletics",
  varsity_required: "Varsity Status",
  requires_awards: "Awards",
  majors: "Intended Major",
  requires_ap_courses: "AP Courses",
};

// Maps criteria keys to profile field keys
const PROFILE_KEY_MAP: Record<string, string> = {
  min_gpa: "gpa_unweighted",
  min_sat: "sat_score",
  min_act: "act_score",
  min_psat: "psat_score",
  class_rank_percentile: "class_rank",
  volunteer_hours_min: "volunteer_hours",
  leadership_required: "leadership_roles",
  work_experience_hours_min: "work_experience_hours",
  first_gen: "first_gen_college",
  need_based: "financial_need",
  states: "state",
  citizenship: "citizenship",
  athletics: "sports_played",
  requires_awards: "awards",
  majors: "intended_majors",
  requires_ap_courses: "ap_courses",
};

export function useScholarshipFieldAnalysis() {
  const [impacts, setImpacts] = useState<FieldImpact[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalMissingValue, setTotalMissingValue] = useState(0);
  const [totalMissingCount, setTotalMissingCount] = useState(0);

  useEffect(() => {
    async function analyze() {
      setLoading(true);
      try {
        // Get current user profile
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const [{ data: profile }, { data: scholarships }] = await Promise.all([
          supabase.from("profiles").select("*").eq("id", user.id).single(),
          supabase.from("scholarships").select("*").eq("status", "active"),
        ]);

        if (!scholarships) return;

        // Analyze field impact
        const fieldStats: Record<string, { count: number; totalValue: number }> = {};

        scholarships.forEach((s) => {
          const criteria = (s.normalized_criteria || {}) as NormalizedCriteria;
          const value = s.amount_max_usd || s.amount_usd || s.amount_min_usd || 5000;

          Object.entries(criteria).forEach(([key, val]) => {
            if (val != null && val !== false && FIELD_LABELS[key]) {
              if (!fieldStats[key]) {
                fieldStats[key] = { count: 0, totalValue: 0 };
              }
              fieldStats[key].count++;
              fieldStats[key].totalValue += value;
            }
          });
        });

        // Build impact list with filled status
        const impactList: FieldImpact[] = Object.entries(fieldStats)
          .map(([key, stats]) => {
            const profileKey = PROFILE_KEY_MAP[key];
            const profileValue = profile?.[profileKey as keyof typeof profile];
            const isFilled = 
              profileValue != null && 
              profileValue !== "" && 
              (Array.isArray(profileValue) ? profileValue.length > 0 : true);

            return {
              field: key,
              label: FIELD_LABELS[key] || key,
              scholarshipCount: stats.count,
              potentialValue: stats.totalValue,
              isFilled,
            };
          })
          .sort((a, b) => b.potentialValue - a.potentialValue);

        setImpacts(impactList);
        
        // Calculate totals for missing fields
        const missing = impactList.filter(i => !i.isFilled);
        setTotalMissingValue(missing.reduce((sum, i) => sum + i.potentialValue, 0));
        setTotalMissingCount(missing.reduce((sum, i) => sum + i.scholarshipCount, 0));
      } catch (error) {
        console.error("Error analyzing fields:", error);
      } finally {
        setLoading(false);
      }
    }

    analyze();
  }, []);

  return { impacts, loading, totalMissingValue, totalMissingCount };
}
