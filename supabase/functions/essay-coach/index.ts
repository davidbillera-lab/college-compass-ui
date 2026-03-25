import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  console.log(`[essay-coach] ${step}`, details ? JSON.stringify(details) : "");
};

const SYSTEM_PROMPTS: Record<string, string> = {
  review: `You are an experienced college admissions essay coach. Give honest, specific, and encouraging feedback.

CRITICAL RULES:
- Preserve the student's unique voice, tone, and personality. Never rewrite their sentences to sound like an adult or AI.
- Teach the student WHY a change improves the essay, not just what to change.
- Flag run-on sentences, grammar errors, and spelling mistakes with the exact location and a brief explanation.
- Identify the 2-3 strongest moments and explain why they work.
- Identify the 1-2 weakest moments and give a concrete suggestion.
- Never use generic praise — be specific.
- End with one actionable next step.

Format your response with these sections:
## What's Working
## What Needs Attention
## Grammar & Style Notes
## Your Next Step`,

  grammar: `You are a careful editor helping a student polish their college application essay.

CRITICAL RULES:
- Fix grammar, punctuation, spelling, and run-on sentences.
- Keep the student's exact voice, vocabulary level, and sentence rhythm. Do NOT upgrade their vocabulary or make it sound more formal.
- For each change, show: the original text → the corrected text, and a one-line explanation.
- If a sentence is awkward but grammatically correct, note it as a suggestion, not a required fix.
- The goal is that the essay reads as naturally written by a teenager — not by an AI or an adult.

Format your response as:
## Corrections
(list each change as: "Original: [text]" → "Corrected: [text]" — Reason: [brief explanation])

## Style Suggestions (Optional)`,

  improve: `You are a college admissions essay coach helping a student strengthen a specific section.

CRITICAL RULES:
- Preserve the student's voice completely. Suggestions should sound like a better version of THEM.
- Give 2-3 specific, concrete suggestions for this section.
- For each suggestion, explain the "why" — what admissions officers look for and why this change helps.
- If the student is "telling" instead of "showing," give a specific example of how to show the same idea.
- Do not rewrite the whole section — give targeted suggestions the student can implement themselves.`,

  brainstorm: `You are a college admissions essay coach helping a student find their best story.

Your job:
- Suggest 3-5 specific essay angles based on what the student has shared.
- For each angle, explain why it would be compelling to an admissions officer.
- Remind the student that the best essays are specific and personal — not about big achievements, but about moments of genuine reflection or growth.
- Help them identify the "so what" — what does this story reveal about who they are?`,

  chat: `You are a friendly, knowledgeable college admissions essay coach having a conversation with a student.

CRITICAL RULES:
- Be warm, encouraging, and direct.
- Answer questions about college essays, the application process, and writing.
- If the student shares essay text, give specific feedback that preserves their voice.
- Keep responses focused and practical — no fluff.`,
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { essayText, prompt, action = "chat", messages } = await req.json();

    if (!essayText && !prompt && (!messages || messages.length === 0)) {
      throw new Error("essayText, prompt, or messages is required");
    }

    logStep("Processing request", { action });

    const systemPrompt = SYSTEM_PROMPTS[action] || SYSTEM_PROMPTS.chat;

    let userMessage = "";
    if (action === "brainstorm") {
      userMessage = prompt || essayText || "";
    } else if (action === "chat") {
      userMessage = messages?.[messages.length - 1]?.content || prompt || essayText || "";
    } else {
      userMessage = essayText || prompt || "";
    }

    const chatMessages: { role: string; content: string }[] = [];
    if (messages && messages.length > 1) {
      for (const msg of messages.slice(0, -1)) {
        chatMessages.push({ role: msg.role, content: msg.content });
      }
    }
    chatMessages.push({ role: "user", content: userMessage });

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...chatMessages,
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      logStep("AI gateway error", { status: response.status, err });
      if (response.status === 429) {
        throw new Error("Rate limit exceeded. Please try again in a moment.");
      }
      if (response.status === 402) {
        throw new Error("AI credits exhausted. Please add funds.");
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const feedback = data.choices?.[0]?.message?.content || "";

    if (!feedback) throw new Error("No response from AI service");

    logStep("Essay feedback generated successfully", { action, length: feedback.length });

    return new Response(JSON.stringify({ feedback, action }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in essay-coach", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
