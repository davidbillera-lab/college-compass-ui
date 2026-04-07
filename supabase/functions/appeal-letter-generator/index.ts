// =============================================================================
// Appeal Letter Generator Edge Function
// Generates financial aid appeal letters and waitlist letters using Claude.
// DO NOT EDIT THROUGH LOVABLE.
// =============================================================================
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version",
};

const SYSTEM_PROMPT = `You are an expert college financial aid consultant who writes highly effective financial aid appeal letters and letters of continued interest. You have helped hundreds of families successfully negotiate for additional aid.

CRITICAL RULES:
- Write in a professional, respectful, and sincere tone — never demanding or entitled.
- Be specific and factual — vague letters are ignored.
- Use [BRACKETED PLACEHOLDERS] for any information the student needs to fill in (dates, specific dollar amounts, names of documents, etc.).
- Structure the letter with: date, recipient address block, salutation, body paragraphs, closing, signature block.
- Keep the letter to 3-4 paragraphs — concise and focused.
- End with a clear, specific ask (e.g., "I respectfully request a review of my financial aid package and an increase of $X,XXX in grant aid.").
- For competing offer letters: acknowledge appreciation for the school, state the competing offer factually, and express strong preference for this school.
- For waitlist letters: open with genuine enthusiasm, share 2-3 specific new updates, and reaffirm first-choice status.
- Never fabricate specific numbers or facts — use placeholders instead.
- Output ONLY the letter text — no preamble, no explanation, no markdown formatting.`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      appealType,
      collegeName,
      currentAid,
      requestedAid,
      competingSchool,
      competingOffer,
      circumstanceDetails,
      studentName,
    } = await req.json();

    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!anthropicKey) throw new Error("ANTHROPIC_API_KEY is not configured");

    const appealTypeLabels: Record<string, string> = {
      income_change: "Change in Financial Circumstances",
      competing_offer: "Competing School Offer",
      merit_appeal: "Merit / Achievement Appeal",
      special_circumstances: "Special Circumstances",
      waitlist_interest: "Letter of Continued Interest (Waitlist)",
    };

    const userPrompt = `Write a ${appealTypeLabels[appealType] || appealType} letter for the following situation:

Student Name: ${studentName || "[Student Name]"}
College: ${collegeName}
Current Aid Offer: ${currentAid || "not specified"}
Aid Amount Requested: ${requestedAid || "an increase"}
${competingSchool ? `Competing School: ${competingSchool}` : ""}
${competingOffer ? `Competing School's Offer: ${competingOffer}` : ""}

Student's Specific Details:
${circumstanceDetails}

Write a complete, professional letter ready to send (with appropriate placeholders for any missing specifics).`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 1200,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Anthropic API error: ${response.status} — ${errText}`);
    }

    const data = await response.json();
    const letter = data.content?.[0]?.text ?? "Unable to generate letter. Please try again.";

    return new Response(JSON.stringify({ letter }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[appeal-letter-generator] Error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
