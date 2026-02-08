import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are an expert at parsing scholarship eligibility requirements into structured criteria.

Given the raw eligibility text of a scholarship, extract and return structured criteria as a JSON object. Only include fields that are explicitly mentioned or strongly implied in the text.

The output schema is:
{
  "min_gpa": number | null,  // Minimum GPA required (on 4.0 scale)
  "min_sat": number | null,  // Minimum SAT score (400-1600)
  "min_act": number | null,  // Minimum ACT score (1-36)
  "min_psat": number | null, // Minimum PSAT score (320-1520)
  "class_rank_percentile": number | null, // Top X%, e.g., 10 for "top 10%"
  "requires_ap_courses": boolean | null,
  "min_ap_courses": number | null,
  "volunteer_hours_min": number | null,
  "leadership_required": boolean | null,
  "community_service_required": boolean | null,
  "athletics": string[] | null, // Specific sports if mentioned
  "varsity_required": boolean | null,
  "need_based": boolean | null,
  "merit_based": boolean | null,
  "first_gen": boolean | null, // First-generation college student
  "max_family_income": number | null,
  "pell_eligible": boolean | null,
  "states": string[] | null, // US state codes like ["CA", "TX", "NY"]
  "citizenship": string[] | null, // e.g., ["US Citizen", "Permanent Resident"]
  "majors": string[] | null, // Intended fields of study
  "career_goals": string[] | null,
  "education_levels": string[] | null, // e.g., ["high school senior", "college freshman"]
  "essay_required": boolean | null,
  "interview_required": boolean | null,
  "recommendation_letters": number | null, // Number of letters required
  "requires_awards": boolean | null,
  "work_experience_hours_min": number | null,
  "demographics_optional": {
    "race": string[] | null,
    "gender": string[] | null,
    "religion": string[] | null,
    "disability": boolean | null,
    "military_affiliated": boolean | null,
    "lgbtq": boolean | null
  } | null
}

Rules:
1. Only extract criteria that are explicitly stated or clearly implied
2. For GPA, normalize to 4.0 scale if a different scale is mentioned
3. For states, use 2-letter codes (CA, TX, NY, etc.)
4. For citizenship, use standardized terms: "US Citizen", "Permanent Resident", "DACA", "International", "Refugee"
5. For majors, use common categories: "STEM", "Engineering", "Computer Science", "Business", "Medicine", "Nursing", etc.
6. Demographics should only be included if the scholarship specifically mentions preference or requirement
7. Return null for fields not mentioned in the text
8. Be conservative - if something is vague or unclear, omit it`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase credentials not configured");
    }

    // Get authorization header for user verification
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create supabase client with user's token
    const supabaseUser = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify user is authenticated
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin role
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roles) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { scholarship_id, raw_eligibility_text, scholarship_name } = body;

    if (!raw_eligibility_text) {
      return new Response(
        JSON.stringify({ error: "raw_eligibility_text is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Parsing eligibility for: ${scholarship_name || scholarship_id}`);

    // Call Lovable AI Gateway
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `Parse this scholarship eligibility text into structured criteria:\n\nScholarship Name: ${scholarship_name || "Unknown"}\n\nEligibility Text:\n${raw_eligibility_text}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_scholarship_criteria",
              description: "Extract structured scholarship eligibility criteria from text",
              parameters: {
                type: "object",
                properties: {
                  min_gpa: { type: "number", description: "Minimum GPA (4.0 scale)" },
                  min_sat: { type: "number", description: "Minimum SAT score" },
                  min_act: { type: "number", description: "Minimum ACT score" },
                  min_psat: { type: "number", description: "Minimum PSAT score" },
                  class_rank_percentile: { type: "number", description: "Top X%" },
                  requires_ap_courses: { type: "boolean" },
                  min_ap_courses: { type: "number" },
                  volunteer_hours_min: { type: "number" },
                  leadership_required: { type: "boolean" },
                  community_service_required: { type: "boolean" },
                  athletics: { type: "array", items: { type: "string" } },
                  varsity_required: { type: "boolean" },
                  need_based: { type: "boolean" },
                  merit_based: { type: "boolean" },
                  first_gen: { type: "boolean" },
                  max_family_income: { type: "number" },
                  pell_eligible: { type: "boolean" },
                  states: { type: "array", items: { type: "string" } },
                  citizenship: { type: "array", items: { type: "string" } },
                  majors: { type: "array", items: { type: "string" } },
                  career_goals: { type: "array", items: { type: "string" } },
                  education_levels: { type: "array", items: { type: "string" } },
                  essay_required: { type: "boolean" },
                  interview_required: { type: "boolean" },
                  recommendation_letters: { type: "number" },
                  requires_awards: { type: "boolean" },
                  work_experience_hours_min: { type: "number" },
                  demographics_optional: {
                    type: "object",
                    properties: {
                      race: { type: "array", items: { type: "string" } },
                      gender: { type: "array", items: { type: "string" } },
                      religion: { type: "array", items: { type: "string" } },
                      disability: { type: "boolean" },
                      military_affiliated: { type: "boolean" },
                      lgbtq: { type: "boolean" },
                    },
                  },
                },
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_scholarship_criteria" } },
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits depleted. Please add credits to continue." }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      const errorText = await aiResponse.text();
      console.error("AI Gateway error:", aiResponse.status, errorText);
      throw new Error(`AI Gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log("AI Response:", JSON.stringify(aiData, null, 2));

    // Extract the parsed criteria from tool call
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== "extract_scholarship_criteria") {
      throw new Error("Invalid AI response format");
    }

    const parsedCriteria = JSON.parse(toolCall.function.arguments);

    // Clean up the criteria - remove null/undefined values
    const cleanedCriteria: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(parsedCriteria)) {
      if (value !== null && value !== undefined) {
        // For arrays, only include if not empty
        if (Array.isArray(value) && value.length === 0) continue;
        // For objects like demographics_optional, check if it has any truthy values
        if (typeof value === "object" && !Array.isArray(value)) {
          const hasValues = Object.values(value as Record<string, unknown>).some(
            v => v !== null && v !== undefined && (Array.isArray(v) ? v.length > 0 : v !== false)
          );
          if (!hasValues) continue;
        }
        cleanedCriteria[key] = value;
      }
    }

    // If scholarship_id is provided, update the database
    if (scholarship_id) {
      const { error: updateError } = await supabaseAdmin
        .from("scholarships")
        .update({ normalized_criteria: cleanedCriteria })
        .eq("id", scholarship_id);

      if (updateError) {
        console.error("Database update error:", updateError);
        throw new Error(`Failed to update scholarship: ${updateError.message}`);
      }

      console.log(`Updated scholarship ${scholarship_id} with parsed criteria`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        criteria: cleanedCriteria,
        scholarship_id,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("parse-scholarship-criteria error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
