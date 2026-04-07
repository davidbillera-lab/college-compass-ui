// =============================================================================
// Career Assessment Edge Function
// Analyzes Holland Code scores and returns personalized major/career recommendations.
// DO NOT EDIT THROUGH LOVABLE.
// =============================================================================
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version",
};

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  R: "Realistic (hands-on, mechanical, outdoor work)",
  I: "Investigative (research, analysis, science)",
  A: "Artistic (creative, expressive, design)",
  S: "Social (helping, teaching, counseling)",
  E: "Enterprising (leadership, business, persuasion)",
  C: "Conventional (organization, data, structure)",
};

const SYSTEM_PROMPT = `You are an expert career counselor and college admissions advisor helping a high school student understand their career interests and choose college majors.

You specialize in the Holland Code (RIASEC) model of career interests. Based on a student's top interest codes, you provide:
1. A clear explanation of what their combination means
2. 5-7 specific college majors that align with their interests
3. 4-6 career paths that fit their profile
4. 2-3 types of colleges or programs that would be a great fit
5. Practical advice on how to explore these interests further in high school

RULES:
- Be encouraging and specific. Avoid generic advice.
- Connect the majors to real career outcomes.
- Mention specific types of programs (e.g., "liberal arts colleges with strong psychology departments" not just "any college").
- Keep it practical for a high school student — mention clubs, internships, or summer programs they could explore.
- Use clear headers and bullet points for readability.`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { scores, topCodes } = await req.json();

    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!anthropicKey) throw new Error("ANTHROPIC_API_KEY is not configured");

    const topCodesDescription = topCodes
      .map((code: string) => CATEGORY_DESCRIPTIONS[code])
      .join(", ");

    const allScores = Object.entries(scores as Record<string, number>)
      .sort(([, a], [, b]) => b - a)
      .map(([code, score]) => `${CATEGORY_DESCRIPTIONS[code]}: ${score}/15`)
      .join("\n");

    const userPrompt = `A high school student just completed a career interest assessment. Here are their results:

**Top Holland Codes:** ${topCodes.join("")} (${topCodesDescription})

**Full Score Breakdown:**
${allScores}

Please provide a personalized career and major recommendation analysis for this student.`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 1500,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Anthropic API error: ${response.status} — ${errText}`);
    }

    const data = await response.json();
    const analysis = data.content?.[0]?.text ?? "Unable to generate analysis. Please try again.";

    return new Response(JSON.stringify({ analysis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[career-assessment] Error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
