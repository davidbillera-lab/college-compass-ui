import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ScoreBreakdown {
  category: string;
  score: number;
  maxScore: number;
  details: string;
}

interface MatchScoreResult {
  overall_score: number;
  eligibility_status: "eligible" | "maybe" | "ineligible";
  breakdown: ScoreBreakdown[];
  reasoning: string;
  missing_fields: string[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!lovableApiKey) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Get auth token from request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create client with user's token for RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Verify user
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { type, scholarship_ids, college_ids } = await req.json();

    // Fetch user profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: "Profile not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let results: Record<string, MatchScoreResult> = {};

    if (type === "scholarships" && scholarship_ids?.length > 0) {
      // Fetch scholarships
      const { data: scholarships, error: schError } = await supabase
        .from("scholarships")
        .select("*")
        .in("id", scholarship_ids);

      if (schError) throw schError;

      // Calculate scores for each scholarship using AI
      for (const scholarship of scholarships || []) {
        const score = await calculateScholarshipScore(profile, scholarship, lovableApiKey);
        results[scholarship.id] = score;
        
        // Store in database for caching
        await supabase.from("scholarship_matches").upsert({
          user_id: user.id,
          scholarship_id: scholarship.id,
          score: score.overall_score,
          eligibility_status: score.eligibility_status,
          reasons: score.reasoning,
          missing_fields: score.missing_fields,
        }, { onConflict: "user_id,scholarship_id" });
      }
    } else if (type === "colleges" && college_ids?.length > 0) {
      // Fetch colleges
      const { data: colleges, error: colError } = await supabase
        .from("colleges")
        .select("*")
        .in("id", college_ids);

      if (colError) throw colError;

      // Calculate scores for each college using AI
      for (const college of colleges || []) {
        const score = await calculateCollegeScore(profile, college, lovableApiKey);
        results[college.id] = score;
        
        // Determine bucket based on score
        let bucket = "unlikely";
        if (score.overall_score >= 75) bucket = "safety";
        else if (score.overall_score >= 50) bucket = "target";
        else if (score.overall_score >= 25) bucket = "reach";

        // Store in database for caching
        await supabase.from("college_matches").upsert({
          student_id: user.id,
          college_id: college.id,
          fit_score: score.overall_score,
          bucket,
          academic_match_score: score.breakdown.find(b => b.category === "Academic")?.score || 0,
          financial_match_score: score.breakdown.find(b => b.category === "Financial")?.score || 0,
          location_match_score: score.breakdown.find(b => b.category === "Location")?.score || 0,
          activities_match_score: score.breakdown.find(b => b.category === "Activities")?.score || 0,
          why_fit: score.reasoning,
        }, { onConflict: "student_id,college_id" });
      }
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error calculating match scores:", error);
    
    if (error instanceof Response) {
      const status = error.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }
    
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function calculateScholarshipScore(
  profile: Record<string, unknown>,
  scholarship: Record<string, unknown>,
  apiKey: string
): Promise<MatchScoreResult> {
  const systemPrompt = `You are an expert college counselor and scholarship advisor. Analyze how well a student matches a scholarship's requirements.

Return structured scoring using the provided tool. Be specific about why the student matches or doesn't match each criterion.

Scoring guidelines:
- 90-100: Excellent match, meets all requirements with strong qualifications
- 70-89: Good match, meets most requirements
- 50-69: Moderate match, meets some requirements but has gaps
- 30-49: Weak match, significant gaps in eligibility
- 0-29: Poor match, likely ineligible

Consider both hard requirements (must meet) and soft preferences (nice to have).`;

  const userPrompt = `Evaluate this student's match for this scholarship:

STUDENT PROFILE:
- GPA (unweighted): ${profile.gpa_unweighted || "Not provided"}
- SAT Score: ${profile.sat_score || "Not provided"}
- ACT Score: ${profile.act_score || "Not provided"}
- PSAT Score: ${profile.psat_score || "Not provided"}
- Class Rank: ${profile.class_rank || "Not provided"}
- State: ${profile.state || "Not provided"}
- Citizenship: ${profile.citizenship || "Not provided"}
- First-Gen College Student: ${profile.first_gen_college ? "Yes" : profile.first_gen_college === false ? "No" : "Not specified"}
- Financial Need: ${profile.financial_need ? "Yes" : profile.financial_need === false ? "No" : "Not specified"}
- Intended Majors: ${Array.isArray(profile.intended_majors) ? profile.intended_majors.join(", ") : "Not specified"}
- Volunteer Hours: ${profile.volunteer_hours || "Not provided"}
- Work Experience Hours: ${profile.work_experience_hours || "Not provided"}
- Leadership Roles: ${Array.isArray(profile.leadership_roles) ? profile.leadership_roles.join(", ") : "None listed"}
- Sports: ${Array.isArray(profile.sports_played) ? profile.sports_played.join(", ") : "None listed"}
- Awards: ${Array.isArray(profile.awards) ? profile.awards.join(", ") : "None listed"}
- AP Courses: ${Array.isArray(profile.ap_courses) ? profile.ap_courses.length + " courses" : "Not specified"}

SCHOLARSHIP:
- Name: ${scholarship.name}
- Amount: $${scholarship.amount_max_usd || scholarship.amount_usd || scholarship.amount_min_usd || "Varies"}
- Provider: ${scholarship.provider || "Unknown"}
- Description: ${scholarship.description || "No description"}
- Raw Eligibility Text: ${scholarship.raw_eligibility_text || "Not available"}
- Normalized Criteria: ${JSON.stringify(scholarship.normalized_criteria || {})}

Analyze eligibility and provide a match score.`;

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "submit_scholarship_score",
            description: "Submit the scholarship match analysis results",
            parameters: {
              type: "object",
              properties: {
                overall_score: {
                  type: "number",
                  description: "Overall match score from 0-100",
                },
                eligibility_status: {
                  type: "string",
                  enum: ["eligible", "maybe", "ineligible"],
                  description: "Whether student appears eligible, possibly eligible, or ineligible",
                },
                breakdown: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      category: { type: "string", description: "Category name (Academic, Financial, Demographic, Extracurricular)" },
                      score: { type: "number", description: "Score for this category (0-25)" },
                      maxScore: { type: "number", description: "Maximum possible score (usually 25)" },
                      details: { type: "string", description: "Brief explanation" },
                    },
                    required: ["category", "score", "maxScore", "details"],
                  },
                },
                reasoning: {
                  type: "string",
                  description: "2-3 sentence summary of why this score was given",
                },
                missing_fields: {
                  type: "array",
                  items: { type: "string" },
                  description: "Profile fields the student should fill out to improve their score or confirm eligibility",
                },
              },
              required: ["overall_score", "eligibility_status", "breakdown", "reasoning", "missing_fields"],
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "submit_scholarship_score" } },
    }),
  });

  if (!response.ok) {
    console.error("AI API error:", response.status);
    throw response;
  }

  const data = await response.json();
  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
  
  if (!toolCall?.function?.arguments) {
    // Fallback to deterministic scoring
    return calculateDeterministicScholarshipScore(profile, scholarship);
  }

  try {
    return JSON.parse(toolCall.function.arguments);
  } catch {
    return calculateDeterministicScholarshipScore(profile, scholarship);
  }
}

async function calculateCollegeScore(
  profile: Record<string, unknown>,
  college: Record<string, unknown>,
  apiKey: string
): Promise<MatchScoreResult> {
  const systemPrompt = `You are an expert college admissions counselor. Analyze a student's chances of admission to a specific college.

Return structured scoring using the provided tool. Consider academic fit, financial fit, and overall match.

Score interpretation:
- 75-100: Safety school - student likely exceeds typical admit profile
- 50-74: Target school - student is competitive, good chance
- 25-49: Reach school - student has a chance but below typical admits
- 0-24: Unlikely - significant gap between student and typical admits

Be realistic but encouraging. Consider that holistic admissions look beyond just numbers.`;

  const userPrompt = `Evaluate this student's admission chances for this college:

STUDENT PROFILE:
- GPA (unweighted): ${profile.gpa_unweighted || "Not provided"}
- GPA (weighted): ${profile.gpa_weighted || "Not provided"}
- SAT Score: ${profile.sat_score || "Not provided"}
- ACT Score: ${profile.act_score || "Not provided"}
- State: ${profile.state || "Not provided"}
- Intended Majors: ${Array.isArray(profile.intended_majors) ? profile.intended_majors.join(", ") : "Not specified"}
- Budget Max: $${profile.budget_max_usd || "Not specified"}
- Leadership Roles: ${Array.isArray(profile.leadership_roles) ? profile.leadership_roles.join(", ") : "None listed"}
- Sports: ${Array.isArray(profile.sports_played) ? profile.sports_played.join(", ") : "None listed"}
- Awards: ${Array.isArray(profile.awards) ? profile.awards.join(", ") : "None listed"}
- AP Courses: ${Array.isArray(profile.ap_courses) ? profile.ap_courses.length + " courses" : "Not specified"}

COLLEGE:
- Name: ${college.name}
- Location: ${college.city}, ${college.state}
- Type: ${college.type || "Unknown"}
- Acceptance Rate: ${college.acceptance_rate ? (college.acceptance_rate * 100).toFixed(1) + "%" : "Unknown"}
- SAT Range: ${college.sat_range_low || "?"}-${college.sat_range_high || "?"}
- ACT Range: ${college.act_range_low || "?"}-${college.act_range_high || "?"}
- Average GPA: ${college.avg_gpa || "Unknown"}
- In-State Tuition: $${college.tuition_in_state || "Unknown"}
- Out-of-State Tuition: $${college.tuition_out_state || "Unknown"}
- Average Financial Aid: $${college.avg_financial_aid || "Unknown"}
- Student Population: ${college.student_population || "Unknown"}
- Setting: ${college.setting || "Unknown"}

Analyze admission chances and fit.`;

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "submit_college_score",
            description: "Submit the college admission analysis results",
            parameters: {
              type: "object",
              properties: {
                overall_score: {
                  type: "number",
                  description: "Overall admission chance score from 0-100",
                },
                eligibility_status: {
                  type: "string",
                  enum: ["eligible", "maybe", "ineligible"],
                  description: "Whether student appears to be a strong candidate, competitive, or unlikely",
                },
                breakdown: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      category: { type: "string", description: "Category name (Academic, Financial, Location, Activities)" },
                      score: { type: "number", description: "Score for this category (0-25)" },
                      maxScore: { type: "number", description: "Maximum possible score (usually 25)" },
                      details: { type: "string", description: "Brief explanation" },
                    },
                    required: ["category", "score", "maxScore", "details"],
                  },
                },
                reasoning: {
                  type: "string",
                  description: "2-3 sentence summary explaining the admission chances and fit",
                },
                missing_fields: {
                  type: "array",
                  items: { type: "string" },
                  description: "Profile fields that would help refine this assessment",
                },
              },
              required: ["overall_score", "eligibility_status", "breakdown", "reasoning", "missing_fields"],
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "submit_college_score" } },
    }),
  });

  if (!response.ok) {
    console.error("AI API error:", response.status);
    throw response;
  }

  const data = await response.json();
  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
  
  if (!toolCall?.function?.arguments) {
    return calculateDeterministicCollegeScore(profile, college);
  }

  try {
    return JSON.parse(toolCall.function.arguments);
  } catch {
    return calculateDeterministicCollegeScore(profile, college);
  }
}

// Fallback deterministic scoring
function calculateDeterministicScholarshipScore(
  profile: Record<string, unknown>,
  scholarship: Record<string, unknown>
): MatchScoreResult {
  const criteria = (scholarship.normalized_criteria || {}) as Record<string, unknown>;
  let score = 70; // Base score
  const breakdown: ScoreBreakdown[] = [];
  const missingFields: string[] = [];

  // Academic check
  let academicScore = 20;
  if (criteria.min_gpa && profile.gpa_unweighted) {
    if ((profile.gpa_unweighted as number) >= (criteria.min_gpa as number)) {
      academicScore = 25;
    } else {
      academicScore = 10;
      score -= 15;
    }
  } else if (criteria.min_gpa && !profile.gpa_unweighted) {
    missingFields.push("gpa_unweighted");
  }
  breakdown.push({ category: "Academic", score: academicScore, maxScore: 25, details: "GPA and test score match" });

  // Financial check
  let financialScore = 20;
  if (criteria.need_based && !profile.financial_need) {
    missingFields.push("financial_need");
    financialScore = 15;
  }
  if (criteria.first_gen && !profile.first_gen_college) {
    missingFields.push("first_gen_college");
  }
  breakdown.push({ category: "Financial", score: financialScore, maxScore: 25, details: "Financial eligibility" });

  // Demographics
  breakdown.push({ category: "Demographic", score: 20, maxScore: 25, details: "Location and citizenship match" });

  // Extracurricular
  breakdown.push({ category: "Extracurricular", score: 20, maxScore: 25, details: "Activities and leadership" });

  const totalScore = breakdown.reduce((sum, b) => sum + b.score, 0);

  return {
    overall_score: totalScore,
    eligibility_status: totalScore >= 70 ? "eligible" : totalScore >= 40 ? "maybe" : "ineligible",
    breakdown,
    reasoning: `Based on available profile data, this appears to be a ${totalScore >= 70 ? "good" : totalScore >= 40 ? "possible" : "challenging"} match. ${missingFields.length > 0 ? `Complete ${missingFields.join(", ")} for a more accurate assessment.` : ""}`,
    missing_fields: missingFields,
  };
}

function calculateDeterministicCollegeScore(
  profile: Record<string, unknown>,
  college: Record<string, unknown>
): MatchScoreResult {
  let score = 50;
  const breakdown: ScoreBreakdown[] = [];
  const missingFields: string[] = [];

  // Academic match
  let academicScore = 15;
  if (profile.sat_score && college.sat_range_low && college.sat_range_high) {
    const sat = profile.sat_score as number;
    const mid = ((college.sat_range_low as number) + (college.sat_range_high as number)) / 2;
    if (sat >= mid) academicScore = 25;
    else if (sat >= (college.sat_range_low as number)) academicScore = 20;
    else academicScore = 10;
  } else if (!profile.sat_score) {
    missingFields.push("sat_score");
  }
  breakdown.push({ category: "Academic", score: academicScore, maxScore: 25, details: "Test scores vs requirements" });

  // Financial match
  breakdown.push({ category: "Financial", score: 20, maxScore: 25, details: "Cost vs budget" });

  // Location match
  let locationScore = 20;
  if (profile.state === college.state) locationScore = 25;
  breakdown.push({ category: "Location", score: locationScore, maxScore: 25, details: "Geographic preference" });

  // Activities match
  breakdown.push({ category: "Activities", score: 18, maxScore: 25, details: "Extracurricular fit" });

  const totalScore = breakdown.reduce((sum, b) => sum + b.score, 0);

  return {
    overall_score: totalScore,
    eligibility_status: totalScore >= 75 ? "eligible" : totalScore >= 50 ? "maybe" : "ineligible",
    breakdown,
    reasoning: `Based on available data, this college appears to be a ${totalScore >= 75 ? "safety" : totalScore >= 50 ? "target" : totalScore >= 25 ? "reach" : "unlikely"} school for you.`,
    missing_fields: missingFields,
  };
}
