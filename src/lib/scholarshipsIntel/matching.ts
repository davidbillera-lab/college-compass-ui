import type {
  Scholarship,
  MatchResult,
  NormalizedCriteria,
  Profile,
  ScholarshipUserAnswer,
} from './types.ts';

// Build answers map from user answers
function buildAnswersMap(answers: ScholarshipUserAnswer[]): Record<string, unknown> {
  const map: Record<string, unknown> = {};
  for (const answer of answers) {
    map[answer.question_key] = answer.answer_json;
  }
  return map;
}

// Parse class rank to percentile
function parseClassRankPercentile(rank: string | null | undefined, classSize: number | null | undefined): number | null {
  if (!rank || !classSize) return null;
  
  // Handle formats like "Top 10%", "1/100", "5 out of 200"
  const topMatch = rank.match(/top\s*(\d+)%/i);
  if (topMatch) return parseInt(topMatch[1]);
  
  const fractionMatch = rank.match(/(\d+)\s*(?:\/|out of|of)\s*(\d+)/i);
  if (fractionMatch) {
    const position = parseInt(fractionMatch[1]);
    const total = parseInt(fractionMatch[2]);
    return Math.round((position / total) * 100);
  }
  
  return null;
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
  
  // === ACADEMIC CHECKS ===
  
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
  
  // SAT score check
  if (criteria.min_sat != null) {
    if (profile.sat_score == null) {
      missing_fields.push('sat_score');
      reasons.push(`• SAT score required (${criteria.min_sat}+) - please add`);
      score -= 5;
    } else if (profile.sat_score < criteria.min_sat) {
      hasHardFail = true;
      reasons.push(`• Requires minimum ${criteria.min_sat} SAT (yours: ${profile.sat_score})`);
    } else {
      score += 10;
      const excess = profile.sat_score - criteria.min_sat;
      if (excess > 100) score += 5; // Bonus for significantly exceeding
      reasons.push(`✓ Meets SAT requirement (${criteria.min_sat}+)`);
    }
  }
  
  // ACT score check
  if (criteria.min_act != null) {
    if (profile.act_score == null) {
      missing_fields.push('act_score');
      reasons.push(`• ACT score required (${criteria.min_act}+) - please add`);
      score -= 5;
    } else if (profile.act_score < criteria.min_act) {
      hasHardFail = true;
      reasons.push(`• Requires minimum ${criteria.min_act} ACT (yours: ${profile.act_score})`);
    } else {
      score += 10;
      const excess = profile.act_score - criteria.min_act;
      if (excess > 3) score += 5; // Bonus for significantly exceeding
      reasons.push(`✓ Meets ACT requirement (${criteria.min_act}+)`);
    }
  }
  
  // PSAT score check
  if (criteria.min_psat != null) {
    if (profile.psat_score == null) {
      missing_fields.push('psat_score');
      reasons.push(`• PSAT score required (${criteria.min_psat}+) - please add`);
      score -= 3;
    } else if (profile.psat_score < criteria.min_psat) {
      score -= 5;
      reasons.push(`• Prefers PSAT of ${criteria.min_psat}+ (yours: ${profile.psat_score})`);
    } else {
      score += 8;
      reasons.push(`✓ Meets PSAT requirement`);
    }
  }
  
  // Class rank check
  if (criteria.class_rank_percentile != null) {
    const userPercentile = parseClassRankPercentile(profile.class_rank, profile.class_size);
    if (userPercentile == null) {
      missing_fields.push('class_rank');
      reasons.push(`• Class rank required (top ${criteria.class_rank_percentile}%) - please add`);
      score -= 3;
    } else if (userPercentile > criteria.class_rank_percentile) {
      score -= 10;
      reasons.push(`• Prefers top ${criteria.class_rank_percentile}% of class`);
    } else {
      score += 10;
      reasons.push(`✓ Meets class rank requirement (top ${criteria.class_rank_percentile}%)`);
    }
  }
  
  // AP courses check
  if (criteria.requires_ap_courses || criteria.min_ap_courses != null) {
    const apCount = (profile.ap_courses || []).length;
    const minRequired = criteria.min_ap_courses || 1;
    
    if (apCount === 0 && criteria.requires_ap_courses) {
      missing_fields.push('ap_courses');
      reasons.push('• AP courses required - please add');
      score -= 5;
    } else if (apCount < minRequired) {
      score -= 5;
      reasons.push(`• Prefers ${minRequired}+ AP courses (yours: ${apCount})`);
    } else {
      score += 5;
      reasons.push(`✓ Has ${apCount} AP courses`);
    }
  }
  
  // === LOCATION & CITIZENSHIP CHECKS ===
  
  // State residency check
  if (criteria.states && criteria.states.length > 0) {
    const userState = (answers['state_resident'] as string) || profile.state;
    if (!userState) {
      missing_fields.push('state_resident');
      reasons.push('• State residency requirement - please confirm your state');
      score -= 5;
    } else if (!criteria.states.some(s => s.toLowerCase() === userState.toLowerCase())) {
      hasHardFail = true;
      reasons.push(`• Requires residence in: ${criteria.states.join(', ')}`);
    } else {
      score += 15;
      reasons.push(`✓ State residency match (${userState})`);
    }
  }
  
  // Citizenship check
  if (criteria.citizenship && criteria.citizenship.length > 0) {
    const userCitizenship = profile.citizenship || (answers['citizenship'] as string);
    if (!userCitizenship) {
      missing_fields.push('citizenship');
      reasons.push('• Citizenship status required - please confirm');
      score -= 5;
    } else {
      const matched = criteria.citizenship.some(c => 
        c.toLowerCase().includes(userCitizenship.toLowerCase()) ||
        userCitizenship.toLowerCase().includes(c.toLowerCase())
      );
      if (!matched) {
        hasHardFail = true;
        reasons.push(`• Requires: ${criteria.citizenship.join(' or ')}`);
      } else {
        score += 10;
        reasons.push(`✓ Citizenship requirement met`);
      }
    }
  }
  
  // === FINANCIAL CHECKS ===
  
  // First-generation student
  if (criteria.first_gen === true) {
    const isFirstGen = profile.first_gen_college ?? (answers['first_gen'] as boolean | undefined);
    if (isFirstGen === undefined || isFirstGen === null) {
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
    const hasNeed = profile.financial_need ?? (answers['need_based'] as boolean | undefined);
    if (hasNeed === undefined || hasNeed === null) {
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
  
  // Pell eligibility
  if (criteria.pell_eligible === true) {
    const isPellEligible = answers['pell_eligible'] as boolean | undefined;
    if (isPellEligible === undefined) {
      // Check if we can infer from EFC
      if (profile.estimated_efc != null && profile.estimated_efc <= 6500) {
        score += 10;
        reasons.push('✓ Likely Pell-eligible based on EFC');
      } else {
        missing_fields.push('pell_eligible');
        reasons.push('• Pell Grant eligibility required - please confirm');
        score -= 3;
      }
    } else if (isPellEligible === true) {
      score += 12;
      reasons.push('✓ Pell Grant eligible');
    } else {
      hasHardFail = true;
      reasons.push('• Requires Pell Grant eligibility');
    }
  }
  
  // === EXTRACURRICULAR CHECKS ===
  
  // Volunteer hours
  if (criteria.volunteer_hours_min != null) {
    const hours = profile.volunteer_hours ?? (answers['volunteer_hours'] as number | undefined);
    if (hours === undefined || hours === null) {
      missing_fields.push('volunteer_hours');
      reasons.push(`• Volunteer hours requirement (${criteria.volunteer_hours_min}+) - please add`);
      score -= 3;
    } else if (hours >= criteria.volunteer_hours_min) {
      score += 10;
      if (hours >= criteria.volunteer_hours_min * 2) score += 5; // Bonus for exceeding
      reasons.push(`✓ Meets volunteer hours (${hours}/${criteria.volunteer_hours_min})`);
    } else {
      score -= 5;
      reasons.push(`• Prefers ${criteria.volunteer_hours_min}+ volunteer hours (you: ${hours})`);
    }
  }
  
  // Leadership required
  if (criteria.leadership_required === true) {
    const hasLeadership = (profile.leadership_roles && profile.leadership_roles.length > 0) ||
      (profile.profile_extras?.activities || []).some((a: { category?: string }) => 
        a.category?.toLowerCase().includes('leadership')
      );
    
    if (!hasLeadership) {
      missing_fields.push('leadership_roles');
      reasons.push('• Leadership experience required - please add');
      score -= 8;
    } else {
      score += 10;
      reasons.push(`✓ Has leadership experience`);
    }
  }
  
  // Community service required
  if (criteria.community_service_required === true) {
    const hours = profile.volunteer_hours ?? 0;
    const hasService = hours > 0 || 
      (profile.profile_extras?.activities || []).some((a: { category?: string }) =>
        a.category?.toLowerCase().includes('community') || 
        a.category?.toLowerCase().includes('volunteer')
      );
    
    if (!hasService) {
      missing_fields.push('community_service');
      reasons.push('• Community service required - please add');
      score -= 5;
    } else {
      score += 8;
      reasons.push('✓ Has community service experience');
    }
  }
  
  // Work experience
  if (criteria.work_experience_hours_min != null) {
    const hours = profile.work_experience_hours ?? (answers['work_hours'] as number | undefined);
    if (hours === undefined || hours === null) {
      missing_fields.push('work_experience_hours');
      reasons.push(`• Work experience required (${criteria.work_experience_hours_min}+ hours)`);
      score -= 3;
    } else if (hours >= criteria.work_experience_hours_min) {
      score += 8;
      reasons.push(`✓ Meets work experience requirement`);
    } else {
      score -= 3;
      reasons.push(`• Prefers ${criteria.work_experience_hours_min}+ work hours`);
    }
  }
  
  // === ATHLETIC CHECKS ===
  
  if (criteria.athletics && criteria.athletics.length > 0) {
    const userSports = profile.sports_played || [];
    const athleticAchievements = profile.profile_extras?.athletic_achievements || [];
    
    // Check for sport matches
    const matchedSports = criteria.athletics.filter(sport =>
      userSports.some(us => us.toLowerCase().includes(sport.toLowerCase()) || 
                           sport.toLowerCase().includes(us.toLowerCase()))
    );
    
    if (matchedSports.length > 0) {
      score += 12;
      reasons.push(`✓ Athletic activity match: ${matchedSports.join(', ')}`);
      
      // Bonus for achievements in matched sports
      const hasAchievements = athleticAchievements.some((a: { sport?: string }) =>
        matchedSports.some(ms => a.sport?.toLowerCase().includes(ms.toLowerCase()))
      );
      if (hasAchievements) {
        score += 5;
        reasons.push('✓ Has athletic achievements');
      }
    } else if (userSports.length === 0) {
      // Check profile activities for athletics
      const activities = profile.profile_extras?.activities || [];
      const hasAthletics = activities.some((a: { category?: string }) => 
        a.category?.toLowerCase().includes('athletic') || 
        a.category?.toLowerCase().includes('sport')
      );
      if (hasAthletics) {
        score += 3;
      } else {
        score -= 5;
        reasons.push(`• Prefers athletes in: ${criteria.athletics.slice(0, 3).join(', ')}`);
      }
    }
  }
  
  // Varsity requirement
  if (criteria.varsity_required === true) {
    const athleticAchievements = profile.profile_extras?.athletic_achievements || [];
    const hasVarsity = athleticAchievements.some((a: { level?: string }) =>
      a.level?.toLowerCase().includes('varsity')
    );
    
    if (!hasVarsity) {
      missing_fields.push('varsity_status');
      reasons.push('• Varsity athlete status required');
      score -= 8;
    } else {
      score += 10;
      reasons.push('✓ Varsity athlete');
    }
  }
  
  // === AWARDS CHECK ===
  
  if (criteria.requires_awards === true) {
    const awards = profile.awards || [];
    if (awards.length === 0) {
      missing_fields.push('awards');
      reasons.push('• Academic/extracurricular awards required');
      score -= 5;
    } else {
      score += 8;
      reasons.push(`✓ Has ${awards.length} award(s)`);
    }
  }
  
  if (criteria.specific_awards && criteria.specific_awards.length > 0) {
    const userAwards = profile.awards || [];
    const matched = criteria.specific_awards.filter(award =>
      userAwards.some(ua => ua.toLowerCase().includes(award.toLowerCase()))
    );
    if (matched.length > 0) {
      score += 15;
      reasons.push(`✓ Has qualifying award: ${matched[0]}`);
    }
  }
  
  // === MAJOR/CAREER MATCH ===
  
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
    const matched = criteria.career_goals.filter(c => 
      userCareers.some(uc => uc.toLowerCase().includes(c.toLowerCase()))
    );
    
    if (userCareers.length === 0) {
      missing_fields.push('career_goals');
      score -= 2;
    } else if (matched.length > 0) {
      score += 10;
      reasons.push(`✓ Career goal match: ${matched.join(', ')}`);
    }
  }
  
  // === DEMOGRAPHICS (optional - only boost, never penalize) ===
  
  if (criteria.demographics_optional) {
    const sensitive = profile.profile_extras?.sensitive;
    
    if (criteria.demographics_optional.race && criteria.demographics_optional.race.length > 0) {
      const userRace = (answers['race_ethnicity'] as string[] | undefined) || sensitive?.race_ethnicity;
      if (userRace && !userRace.includes('Prefer not to say')) {
        const matched = criteria.demographics_optional.race.filter(r => userRace.includes(r));
        if (matched.length > 0) {
          score += 10;
          reasons.push('✓ Background eligibility match');
        }
      }
    }
    
    if (criteria.demographics_optional.gender && criteria.demographics_optional.gender.length > 0) {
      const userGender = (answers['gender'] as string | undefined) || sensitive?.gender;
      if (userGender && userGender !== 'Prefer not to say') {
        if (criteria.demographics_optional.gender.some(g => g.toLowerCase() === userGender.toLowerCase())) {
          score += 10;
          reasons.push('✓ Gender eligibility match');
        }
      }
    }
    
    if (criteria.demographics_optional.religion && criteria.demographics_optional.religion.length > 0) {
      const userReligion = (answers['religion'] as string | undefined) || sensitive?.religion;
      if (userReligion && userReligion !== 'Prefer not to say') {
        if (criteria.demographics_optional.religion.includes(userReligion)) {
          score += 10;
          reasons.push('✓ Religious affiliation match');
        }
      }
    }
    
    if (criteria.demographics_optional.military_affiliated === true) {
      const isMilitary = (answers['military_affiliated'] as boolean | undefined) || sensitive?.military_affiliated;
      if (isMilitary === true) {
        score += 12;
        reasons.push('✓ Military affiliation match');
      }
    }
    
    if (criteria.demographics_optional.disability === true) {
      const hasDisability = (answers['has_disability'] as boolean | undefined) || sensitive?.disability;
      if (hasDisability === true) {
        score += 10;
        reasons.push('✓ Disability eligibility match');
      }
    }
  }
  
  // === AMOUNT BONUS ===
  
  const amount = scholarship.amount_max_usd || scholarship.amount_min_usd || scholarship.amount_usd;
  if (amount) {
    if (amount >= 25000) {
      score += 8;
      reasons.push(`✓ High value award: $${amount.toLocaleString()}`);
    } else if (amount >= 10000) {
      score += 5;
      reasons.push(`✓ Good value award: $${amount.toLocaleString()}`);
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
    } else if (daysUntil <= 7) {
      reasons.push(`⚠ Deadline very soon: ${daysUntil} days`);
    } else if (daysUntil <= 14) {
      reasons.push(`⚠ Deadline approaching: ${daysUntil} days`);
    }
  }
  
  // === ROLLING DEADLINE BONUS ===
  
  if (scholarship.rolling_deadline === true) {
    score += 3;
    reasons.push('✓ Rolling deadline - apply anytime');
  }
  
  // Clamp score
  score = Math.max(0, Math.min(100, score));
  
  // Determine eligibility status
  let eligibility_status: 'eligible' | 'maybe' | 'ineligible';
  if (hasHardFail) {
    eligibility_status = 'ineligible';
    score = Math.min(score, 20); // Cap ineligible scores
  } else if (missing_fields.length > 3) {
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

// Get profile completion suggestions based on scholarship requirements
export function getProfileSuggestions(
  matchResults: Map<string, MatchResult>
): { field: string; impact: string; scholarshipCount: number }[] {
  const fieldImpact = new Map<string, number>();
  
  for (const result of matchResults.values()) {
    for (const field of result.missing_fields) {
      fieldImpact.set(field, (fieldImpact.get(field) || 0) + 1);
    }
  }
  
  const fieldLabels: Record<string, string> = {
    gpa: 'Add your GPA',
    sat_score: 'Add your SAT score',
    act_score: 'Add your ACT score',
    psat_score: 'Add your PSAT score',
    class_rank: 'Add your class rank',
    volunteer_hours: 'Add volunteer hours',
    work_experience_hours: 'Add work experience',
    leadership_roles: 'Add leadership roles',
    state_resident: 'Confirm your state',
    citizenship: 'Confirm citizenship status',
    first_gen: 'Confirm first-generation status',
    need_based: 'Confirm financial need',
    intended_majors: 'Add intended majors',
    ap_courses: 'Add AP courses taken',
    awards: 'Add awards/achievements',
    sports_played: 'Add sports/athletics',
  };
  
  return Array.from(fieldImpact.entries())
    .map(([field, count]) => ({
      field,
      impact: fieldLabels[field] || `Complete ${field}`,
      scholarshipCount: count,
    }))
    .sort((a, b) => b.scholarshipCount - a.scholarshipCount)
    .slice(0, 10);
}
