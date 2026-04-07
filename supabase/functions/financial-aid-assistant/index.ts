// =============================================================================
// Financial Aid Assistant Edge Function
// Uses Anthropic Claude to answer FAFSA, CSS Profile, and financial aid questions.
// DO NOT EDIT THROUGH LOVABLE — uses direct Anthropic API calls.
// =============================================================================
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version",
};

const SYSTEM_PROMPT = `You are a knowledgeable and friendly college financial aid advisor with deep expertise in:
- FAFSA (Free Application for Federal Student Aid) — filing process, deadlines, dependency status, EFC/SAI calculation
- CSS Profile — which schools require it, how it differs from FAFSA, institutional methodology
- Federal financial aid programs — Pell Grants, Direct Subsidized/Unsubsidized Loans, PLUS Loans, Work-Study
- State grant programs and institutional aid
- Scholarship searching and application strategy
- Understanding and comparing financial aid award letters
- Financial aid appeals and negotiation strategies
- 529 plans, tax credits (AOTC, LLC), and education savings

CRITICAL RULES:
- Be warm, clear, and encouraging. Financial aid is confusing and stressful — be a reassuring guide.
- Give specific, actionable advice. Avoid vague generalities.
- When discussing dollar amounts or percentages, be precise and cite the current year where relevant.
- Always remind families to verify information with their school's financial aid office for school-specific policies.
- If a student shares their specific financial situation, tailor your advice to their circumstances.
- Use clear formatting with headers and bullet points for complex topics.
- Never give tax or legal advice — refer to a CPA or attorney for those questions.
- Keep responses focused and practical — no unnecessary filler.`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "messages array is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!anthropicKey) {
      throw new Error("ANTHROPIC_API_KEY is not configured");
    }

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
        messages: messages.slice(-10), // keep last 10 messages for context window
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Anthropic API error: ${response.status} — ${errText}`);
    }

    const data = await response.json();
    const reply = data.content?.[0]?.text ?? "I'm sorry, I couldn't generate a response. Please try again.";

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[financial-aid-assistant] Error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
