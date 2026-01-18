import { College, CollegeProfile, CollegeMatchResult } from './types';

// Calculate academic match score
function calculateAcademicScore(college: College, profile: CollegeProfile): { score: number; reasons: string[]; missing: string[] } {
  const reasons: string[] = [];
  const missing: string[] = [];
  let score = 50;
  let hasData = false;
  
  // GPA comparison
  const userGpa = profile.gpa_unweighted || profile.gpa_weighted;
  if (college.avg_gpa != null && userGpa != null) {
    hasData = true;
    const gpaDiff = userGpa - college.avg_gpa;
    if (gpaDiff >= 0.3) {
      score += 25;
      reasons.push(`✓ GPA (${userGpa.toFixed(2)}) exceeds average (${college.avg_gpa.toFixed(2)})`);
    } else if (gpaDiff >= 0) {
      score += 15;
      reasons.push(`✓ GPA (${userGpa.toFixed(2)}) meets average (${college.avg_gpa.toFixed(2)})`);
    } else if (gpaDiff >= -0.3) {
      score -= 5;
      reasons.push(`• GPA (${userGpa.toFixed(2)}) slightly below average (${college.avg_gpa.toFixed(2)})`);
    } else {
      score -= 15;
      reasons.push(`• GPA (${userGpa.toFixed(2)}) below average (${college.avg_gpa.toFixed(2)})`);
    }
  } else if (userGpa == null) {
    missing.push('gpa');
  }
  
  // SAT comparison
  if (college.sat_range_low != null && college.sat_range_high != null) {
    if (profile.sat_score != null) {
      hasData = true;
      const midSat = (college.sat_range_low + college.sat_range_high) / 2;
      if (profile.sat_score >= college.sat_range_high) {
        score += 20;
        reasons.push(`✓ SAT (${profile.sat_score}) above 75th percentile`);
      } else if (profile.sat_score >= midSat) {
        score += 10;
        reasons.push(`✓ SAT (${profile.sat_score}) in target range`);
      } else if (profile.sat_score >= college.sat_range_low) {
        score += 0;
        reasons.push(`• SAT (${profile.sat_score}) in 25th-50th percentile`);
      } else {
        score -= 15;
        reasons.push(`• SAT (${profile.sat_score}) below 25th percentile (${college.sat_range_low})`);
      }
    } else if (profile.act_score == null) {
      missing.push('test_scores');
    }
  }
  
  // ACT comparison
  if (college.act_range_low != null && college.act_range_high != null && profile.act_score != null) {
    hasData = true;
    const midAct = (college.act_range_low + college.act_range_high) / 2;
    if (profile.act_score >= college.act_range_high) {
      score += 20;
      reasons.push(`✓ ACT (${profile.act_score}) above 75th percentile`);
    } else if (profile.act_score >= midAct) {
      score += 10;
      reasons.push(`✓ ACT (${profile.act_score}) in target range`);
    } else if (profile.act_score >= college.act_range_low) {
      score += 0;
    } else {
      score -= 15;
      reasons.push(`• ACT (${profile.act_score}) below 25th percentile (${college.act_range_low})`);
    }
  }
  
  // AP/Honors courses (proxy for rigor)
  const apCount = profile.ap_courses?.length || 0;
  const honorsCount = profile.honors_courses?.length || 0;
  if (apCount > 0 || honorsCount > 0) {
    hasData = true;
    const rigorScore = Math.min(15, (apCount * 2) + (honorsCount * 1));
    score += rigorScore;
    if (apCount > 0) {
      reasons.push(`✓ ${apCount} AP courses show academic rigor`);
    }
  }
  
  // Major alignment
  if (profile.intended_majors && profile.intended_majors.length > 0 && college.notable_programs) {
    const matchedMajors = profile.intended_majors.filter(major =>
      college.notable_programs!.some(prog => 
        prog.toLowerCase().includes(major.toLowerCase()) || 
        major.toLowerCase().includes(prog.toLowerCase())
      )
    );
    if (matchedMajors.length > 0) {
      hasData = true;
      score += 10;
      reasons.push(`✓ Strong programs in: ${matchedMajors.join(', ')}`);
    }
  } else if (!profile.intended_majors || profile.intended_majors.length === 0) {
    missing.push('intended_majors');
  }
  
  return { score: hasData ? Math.max(0, Math.min(100, score)) : 50, reasons, missing };
}

// Calculate financial match score
function calculateFinancialScore(college: College, profile: CollegeProfile): { score: number; reasons: string[]; missing: string[] } {
  const reasons: string[] = [];
  const missing: string[] = [];
  let score = 50;
  
  // Get applicable tuition
  const isInState = profile.state && college.state && profile.state === college.state;
  const tuition = isInState ? (college.tuition_in_state || college.sticker_usd) : (college.tuition_out_state || college.sticker_usd);
  
  if (profile.budget_max_usd != null && tuition != null) {
    if (tuition <= profile.budget_max_usd) {
      score += 25;
      reasons.push(`✓ Tuition $${tuition.toLocaleString()} within budget`);
    } else if (tuition <= profile.budget_max_usd * 1.3) {
      score += 10;
      const gap = tuition - profile.budget_max_usd;
      reasons.push(`• Tuition $${gap.toLocaleString()} over budget (may qualify for aid)`);
    } else {
      score -= 15;
      reasons.push(`• Tuition $${tuition.toLocaleString()} significantly over budget`);
    }
    
    // In-state bonus
    if (isInState) {
      score += 10;
      reasons.push('✓ In-state tuition rates apply');
    }
  } else if (profile.budget_max_usd == null) {
    missing.push('budget');
  }
  
  // Financial aid consideration
  if (college.avg_financial_aid && college.avg_financial_aid > 10000) {
    score += 5;
    reasons.push(`✓ Strong financial aid ($${college.avg_financial_aid.toLocaleString()} avg)`);
  }
  
  // Financial need alignment
  if (profile.financial_need && college.type === 'public') {
    score += 5;
    reasons.push('✓ Public institution - typically more affordable');
  }
  
  return { score: Math.max(0, Math.min(100, score)), reasons, missing };
}

// Calculate location match score
function calculateLocationScore(college: College, profile: CollegeProfile): { score: number; reasons: string[]; missing: string[] } {
  const reasons: string[] = [];
  const missing: string[] = [];
  let score = 50;
  
  // Same state bonus
  if (profile.state && college.state) {
    if (profile.state === college.state) {
      score += 20;
      reasons.push(`✓ In-state location (${college.city || college.state})`);
    } else if (profile.region && college.region && profile.region === college.region) {
      score += 10;
      reasons.push(`✓ Same region (${college.region})`);
    }
  } else if (!profile.state) {
    missing.push('location');
  }
  
  // Setting preference
  if (profile.preferred_setting && college.setting) {
    if (profile.preferred_setting === college.setting || profile.preferred_setting === 'any') {
      score += 15;
      reasons.push(`✓ ${college.setting.charAt(0).toUpperCase() + college.setting.slice(1)} setting matches preference`);
    } else {
      score -= 5;
      reasons.push(`• ${college.setting} setting (preferred: ${profile.preferred_setting})`);
    }
  }
  
  return { score: Math.max(0, Math.min(100, score)), reasons, missing };
}

// Calculate activities match score
function calculateActivitiesScore(college: College, profile: CollegeProfile): { score: number; reasons: string[]; missing: string[] } {
  const reasons: string[] = [];
  const missing: string[] = [];
  let score = 50;
  let hasData = false;
  
  // Sports match
  if (profile.sports_played && profile.sports_played.length > 0) {
    hasData = true;
    if (college.sports && college.sports.length > 0) {
      const matchedSports = profile.sports_played.filter(sport =>
        college.sports!.some(s => s.toLowerCase().includes(sport.toLowerCase()))
      );
      if (matchedSports.length > 0) {
        score += 15;
        reasons.push(`✓ Offers your sport(s): ${matchedSports.join(', ')}`);
        
        // Division consideration
        if (college.athletics_division === 'D1') {
          score += 5;
          reasons.push('✓ NCAA Division I athletics');
        } else if (college.athletics_division === 'D2' || college.athletics_division === 'D3') {
          score += 3;
          reasons.push(`✓ NCAA ${college.athletics_division} athletics`);
        }
      }
    }
  }
  
  // Leadership/awards boost
  if (profile.leadership_roles && profile.leadership_roles.length > 0) {
    hasData = true;
    score += Math.min(10, profile.leadership_roles.length * 3);
    reasons.push(`✓ ${profile.leadership_roles.length} leadership roles strengthen application`);
  }
  
  if (profile.awards && profile.awards.length > 0) {
    hasData = true;
    score += Math.min(10, profile.awards.length * 3);
    reasons.push(`✓ ${profile.awards.length} awards/honors boost profile`);
  }
  
  // Volunteer hours
  if (profile.volunteer_hours != null && profile.volunteer_hours > 0) {
    hasData = true;
    if (profile.volunteer_hours >= 100) {
      score += 10;
      reasons.push(`✓ Strong community service (${profile.volunteer_hours}+ hours)`);
    } else if (profile.volunteer_hours >= 50) {
      score += 5;
    }
  }
  
  return { score: hasData ? Math.max(0, Math.min(100, score)) : 50, reasons, missing };
}

// Calculate preferences match score
function calculatePreferencesScore(college: College, profile: CollegeProfile): { score: number; reasons: string[]; missing: string[] } {
  const reasons: string[] = [];
  const missing: string[] = [];
  let score = 50;
  
  // College type preference
  if (profile.preferred_college_type && college.type) {
    if (profile.preferred_college_type === college.type || profile.preferred_college_type === 'any') {
      score += 15;
      reasons.push(`✓ ${college.type.charAt(0).toUpperCase() + college.type.slice(1)} institution matches preference`);
    } else {
      score -= 5;
    }
  }
  
  // Campus size preference
  if (profile.campus_size && college.size) {
    const sizeMap: Record<string, string[]> = {
      'small': ['small'],
      'medium': ['medium'],
      'large': ['large', 'very_large'],
      'any': ['small', 'medium', 'large', 'very_large']
    };
    
    const acceptableSizes = sizeMap[profile.campus_size] || [];
    if (acceptableSizes.includes(college.size)) {
      score += 15;
      reasons.push(`✓ ${college.size} campus matches preference`);
    } else {
      score -= 5;
    }
  }
  
  // First-gen consideration
  if (profile.first_gen_college) {
    score += 5;
    reasons.push('✓ First-generation status may qualify for additional support');
  }
  
  return { score: Math.max(0, Math.min(100, score)), reasons, missing };
}

// Determine admission bucket based on academic score
function determineBucket(academicScore: number, college: College): 'reach' | 'target' | 'safety' | 'unlikely' {
  // Factor in acceptance rate if available
  const acceptanceRate = college.acceptance_rate;
  
  if (acceptanceRate != null) {
    // Very selective schools (< 15% acceptance)
    if (acceptanceRate < 0.15) {
      if (academicScore >= 85) return 'reach'; // Even strong students should consider it a reach
      if (academicScore >= 70) return 'reach';
      return 'unlikely';
    }
    
    // Selective schools (15-35% acceptance)
    if (acceptanceRate < 0.35) {
      if (academicScore >= 85) return 'target';
      if (academicScore >= 70) return 'reach';
      if (academicScore >= 55) return 'reach';
      return 'unlikely';
    }
    
    // Moderately selective (35-60% acceptance)
    if (acceptanceRate < 0.60) {
      if (academicScore >= 80) return 'safety';
      if (academicScore >= 65) return 'target';
      if (academicScore >= 50) return 'reach';
      return 'unlikely';
    }
    
    // Less selective (60%+ acceptance)
    if (academicScore >= 60) return 'safety';
    if (academicScore >= 45) return 'target';
    return 'reach';
  }
  
  // No acceptance rate data - use academic score alone
  if (academicScore >= 80) return 'safety';
  if (academicScore >= 65) return 'target';
  if (academicScore >= 45) return 'reach';
  return 'unlikely';
}

// Main matching function
export function calculateCollegeMatch(college: College, profile: CollegeProfile): CollegeMatchResult {
  const academic = calculateAcademicScore(college, profile);
  const financial = calculateFinancialScore(college, profile);
  const location = calculateLocationScore(college, profile);
  const activities = calculateActivitiesScore(college, profile);
  const preferences = calculatePreferencesScore(college, profile);
  
  // Weighted overall score
  const weights = { academic: 0.35, financial: 0.20, location: 0.15, activities: 0.15, preferences: 0.15 };
  const overallScore = Math.round(
    (academic.score * weights.academic) +
    (financial.score * weights.financial) +
    (location.score * weights.location) +
    (activities.score * weights.activities) +
    (preferences.score * weights.preferences)
  );
  
  // Combine reasons
  const allReasons = [
    ...academic.reasons,
    ...financial.reasons,
    ...location.reasons,
    ...activities.reasons,
    ...preferences.reasons
  ];
  
  // Combine missing fields
  const allMissing = [...new Set([
    ...academic.missing,
    ...financial.missing,
    ...location.missing,
    ...activities.missing,
    ...preferences.missing
  ])];
  
  return {
    score: overallScore,
    bucket: determineBucket(academic.score, college),
    breakdown: {
      academic: academic.score,
      financial: financial.score,
      location: location.score,
      activities: activities.score,
      preferences: preferences.score
    },
    reasons: allReasons,
    missing_fields: allMissing
  };
}

// Batch calculate for all colleges
export function calculateAllCollegeMatches(
  colleges: College[],
  profile: CollegeProfile
): Map<string, CollegeMatchResult> {
  const results = new Map<string, CollegeMatchResult>();
  
  for (const college of colleges) {
    results.set(college.id, calculateCollegeMatch(college, profile));
  }
  
  return results;
}

// Get most impactful missing profile fields
export function getMostImpactfulFields(
  matchResults: Map<string, CollegeMatchResult>,
  maxFields: number = 5
): { field: string; count: number }[] {
  const fieldCounts = new Map<string, number>();
  
  for (const result of matchResults.values()) {
    for (const field of result.missing_fields) {
      fieldCounts.set(field, (fieldCounts.get(field) || 0) + 1);
    }
  }
  
  return Array.from(fieldCounts.entries())
    .map(([field, count]) => ({ field, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, maxFields);
}
