import { Scholarship, MatchResult, NormalizedCriteria, Profile, ScholarshipUserAnswer } from './types';

// Build answers map from user answers
function buildAnswersMap(answers: ScholarshipUserAnswer[]): Record<string, unknown> {
  const map: Record<string, unknown> = {};
  for (const answer of answers) {
    map[answer.question_key] = answer.answer_json;
  }
  return map;
}

// Calculate scholarship match score
export function calculateMatch(
  scholarship: Scholarship,
  profile: Profile,
  userAnswers: ScholarshipUserAnswer[]
): MatchResult {
  const reasons: string[] = [];
  const missing_fields: string[] = [];
  let score = 50; // Start at baseline
  let hasHardFail = false;
  
  const answers = buildAnswersMap(userAnswers);
  const criteria = scholarship.normalized_criteria || {} as NormalizedCriteria;
  
  // Get user's GPA (prefer unweighted, fall back to weighted)
  const userGpa = profile.gpa_unweighted || profile.gpa_weighted;
  
  // === HARD FAIL CHECKS ===
  
  // GPA check
  if (criteria.min_gpa != null) {
    if (userGpa == null) {
      missing_fields.push('gpa');
      reasons.push('• GPA requirement unknown - please add your GPA');
      score -= 5;
    } else if (userGpa < criteria.min_gpa) {
      hasHardFail = true;
      reasons.push(`• Requires minimum ${criteria.min_gpa} GPA (yours: ${userGpa.toFixed(2)})`);
    } else {
      score += 10;
      reasons.push(`✓ Meets GPA requirement (${criteria.min_gpa}+)`);
    }
  }
  
  // State residency check
  if (criteria.states && criteria.states.length > 0) {
    const userState = answers['state_resident'] as string | undefined;
    if (!userState) {
      missing_fields.push('state_resident');
      reasons.push('• State residency requirement - please confirm your state');
      score -= 5;
    } else if (!criteria.states.includes(userState)) {
      hasHardFail = true;
      reasons.push(`• Requires residence in: ${criteria.states.join(', ')}`);
    } else {
      score += 15;
      reasons.push(`✓ State residency match (${userState})`);
    }
  }
  
  // Location scope check (simplified)
  if (scholarship.location_scope && scholarship.location_scope !== 'national') {
    const userState = answers['state_resident'] as string | undefined;
    if (!userState) {
      missing_fields.push('state_resident');
    } else if (!scholarship.location_scope.toLowerCase().includes(userState.toLowerCase())) {
      // Soft penalty, not hard fail since location_scope might be imprecise
      score -= 5;
      reasons.push(`• Location preference: ${scholarship.location_scope}`);
    }
  }
  
  // === BONUS CHECKS ===
  
  // First-generation student
  if (criteria.first_gen === true) {
    const isFirstGen = answers['first_gen'] as boolean | undefined;
    if (isFirstGen === undefined) {
      missing_fields.push('first_gen');
      reasons.push('• First-generation student requirement - please confirm');
      score -= 3;
    } else if (isFirstGen === true) {
      score += 15;
      reasons.push('✓ First-generation student match');
    } else {
      hasHardFail = true;
      reasons.push('• Requires first-generation college student');
    }
  }
  
  // Need-based
  if (criteria.need_based === true) {
    const hasNeed = answers['need_based'] as boolean | undefined;
    if (hasNeed === undefined) {
      missing_fields.push('need_based');
      reasons.push('• Financial need requirement - please confirm');
      score -= 3;
    } else if (hasNeed === true) {
      score += 10;
      reasons.push('✓ Financial need demonstrated');
    } else {
      score -= 10;
      reasons.push('• Preference for students with financial need');
    }
  }
  
  // Volunteer hours
  if (criteria.volunteer_hours_min != null) {
    const hours = answers['volunteer_hours'] as number | undefined;
    if (hours === undefined) {
      missing_fields.push('volunteer_hours');
      reasons.push(`• Volunteer hours requirement (${criteria.volunteer_hours_min}+) - please add`);
      score -= 3;
    } else if (hours >= criteria.volunteer_hours_min) {
      score += 10;
      reasons.push(`✓ Meets volunteer hours (${hours}/${criteria.volunteer_hours_min})`);
    } else {
      score -= 5;
      reasons.push(`• Prefers ${criteria.volunteer_hours_min}+ volunteer hours (you: ${hours})`);
    }
  }
  
  // Major match
  if (criteria.majors && criteria.majors.length > 0) {
    const userMajors = profile.intended_majors || [];
    const matchedMajors = criteria.majors.filter(m => 
      userMajors.some(um => um.toLowerCase().includes(m.toLowerCase()) || m.toLowerCase().includes(um.toLowerCase()))
    );
    
    if (userMajors.length === 0) {
      missing_fields.push('intended_majors');
      score -= 3;
    } else if (matchedMajors.length > 0) {
      score += 15;
      reasons.push(`✓ Major alignment: ${matchedMajors.join(', ')}`);
    } else {
      score -= 5;
      reasons.push(`• Prefers majors: ${criteria.majors.slice(0, 3).join(', ')}`);
    }
  }
  
  // Career goals match
  if (criteria.career_goals && criteria.career_goals.length > 0) {
    const userCareers = (answers['career_goals'] as string[] | undefined) || [];
    const matched = criteria.career_goals.filter(c => userCareers.includes(c));
    
    if (userCareers.length === 0) {
      missing_fields.push('career_goals');
      score -= 2;
    } else if (matched.length > 0) {
      score += 10;
      reasons.push(`✓ Career goal match: ${matched.join(', ')}`);
    }
  }
  
  // Athletics match
  if (criteria.athletics && criteria.athletics.length > 0) {
    const userAthletics = (answers['athletics'] as string[] | undefined) || [];
    const matched = criteria.athletics.filter(a => userAthletics.includes(a));
    
    if (matched.length > 0) {
      score += 10;
      reasons.push(`✓ Athletic activity match: ${matched.join(', ')}`);
    } else if (userAthletics.length === 0 || userAthletics.includes('None')) {
      // Check profile activities for athletics
      const activities = profile.profile_extras?.activities || [];
      const hasAthletics = activities.some((a: { category?: string }) => 
        a.category?.toLowerCase().includes('athletic') || a.category?.toLowerCase().includes('sport')
      );
      if (hasAthletics) {
        score += 5;
      }
    }
  }
  
  // Demographics (optional - only boost, never penalize)
  if (criteria.demographics_optional) {
    const sensitive = profile.profile_extras?.sensitive;
    
    if (criteria.demographics_optional.race && criteria.demographics_optional.race.length > 0) {
      const userRace = (answers['race_ethnicity'] as string[] | undefined) || 
                       (sensitive?.race_ethnicity as string[] | undefined);
      if (userRace && !userRace.includes('Prefer not to say')) {
        const matched = criteria.demographics_optional.race.filter(r => userRace.includes(r));
        if (matched.length > 0) {
          score += 10;
          reasons.push('✓ Background eligibility match');
        }
      }
    }
    
    if (criteria.demographics_optional.religion && criteria.demographics_optional.religion.length > 0) {
      const userReligion = (answers['religion'] as string | undefined) || 
                          (sensitive?.religion as string | undefined);
      if (userReligion && userReligion !== 'Prefer not to say') {
        if (criteria.demographics_optional.religion.includes(userReligion)) {
          score += 10;
          reasons.push('✓ Religious affiliation match');
        }
      }
    }
  }
  
  // === AMOUNT BONUS ===
  const amount = scholarship.amount_max_usd || scholarship.amount_min_usd || scholarship.amount_usd;
  if (amount) {
    if (amount >= 10000) {
      score += 5;
      reasons.push(`✓ High value award: $${amount.toLocaleString()}`);
    } else if (amount >= 5000) {
      score += 3;
    }
  }
  
  // === DEADLINE CHECK ===
  const deadline = scholarship.deadline_date || scholarship.deadline;
  if (deadline) {
    const deadlineDate = new Date(deadline);
    const now = new Date();
    const daysUntil = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntil < 0) {
      hasHardFail = true;
      reasons.push('• Deadline has passed');
    } else if (daysUntil <= 14) {
      reasons.push(`⚠ Deadline approaching: ${daysUntil} days`);
    }
  }
  
  // Clamp score
  score = Math.max(0, Math.min(100, score));
  
  // Determine eligibility status
  let eligibility_status: 'eligible' | 'maybe' | 'ineligible';
  if (hasHardFail) {
    eligibility_status = 'ineligible';
    score = Math.min(score, 20); // Cap ineligible scores
  } else if (missing_fields.length > 2) {
    eligibility_status = 'maybe';
  } else if (score >= 60) {
    eligibility_status = 'eligible';
  } else {
    eligibility_status = 'maybe';
  }
  
  return {
    score,
    eligibility_status,
    reasons,
    missing_fields: [...new Set(missing_fields)], // Dedupe
  };
}

// Batch calculate matches for all scholarships
export function calculateAllMatches(
  scholarships: Scholarship[],
  profile: Profile,
  userAnswers: ScholarshipUserAnswer[]
): Map<string, MatchResult> {
  const results = new Map<string, MatchResult>();
  
  for (const scholarship of scholarships) {
    results.set(scholarship.id, calculateMatch(scholarship, profile, userAnswers));
  }
  
  return results;
}

// Get most impactful questions to answer
export function getMostImpactfulQuestions(
  matchResults: Map<string, MatchResult>,
  maxQuestions: number = 5
): { field: string; count: number }[] {
  const fieldCounts = new Map<string, number>();
  
  for (const result of matchResults.values()) {
    if (result.eligibility_status === 'maybe') {
      for (const field of result.missing_fields) {
        fieldCounts.set(field, (fieldCounts.get(field) || 0) + 1);
      }
    }
  }
  
  return Array.from(fieldCounts.entries())
    .map(([field, count]) => ({ field, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, maxQuestions);
}
