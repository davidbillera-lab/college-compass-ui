import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[ESSAY-COACH] ${step}${detailsStr}`);
};

// Premium product ID - users must be subscribed to access this feature
const PREMIUM_PRODUCT_ID = "prod_TwKv99TtmRbLfO";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    // Verify user is authenticated
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Verify premium subscription
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      return new Response(JSON.stringify({ 
        error: "Premium subscription required",
        code: "SUBSCRIPTION_REQUIRED" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403,
      });
    }

    const customerId = customers.data[0].id;
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      return new Response(JSON.stringify({ 
        error: "Premium subscription required",
        code: "SUBSCRIPTION_REQUIRED" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403,
      });
    }

    // Verify it's the premium product
    const productId = subscriptions.data[0].items.data[0].price.product;
    if (productId !== PREMIUM_PRODUCT_ID) {
      return new Response(JSON.stringify({ 
        error: "Premium subscription required",
        code: "SUBSCRIPTION_REQUIRED" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403,
      });
    }

    logStep("Premium subscription verified");

    // Parse request body
    const { essayText, prompt, action } = await req.json();
    
    if (!essayText && !prompt) {
      throw new Error("Either essayText or prompt is required");
    }

    logStep("Processing essay request", { action, hasEssay: !!essayText });

    // Build the system prompt for essay coaching
    const systemPrompt = `You are an expert college admissions essay coach with decades of experience helping students get into top universities. You provide thoughtful, specific, and actionable feedback.

Your approach:
- Be encouraging but honest
- Focus on the student's unique voice and story
- Suggest specific improvements, not just general advice
- Help students show rather than tell
- Ensure essays answer the prompt effectively
- Check for authenticity and genuine reflection

When reviewing essays:
1. Comment on the overall narrative and structure
2. Identify the strongest parts to build on
3. Point out areas that need more depth or clarity
4. Suggest concrete ways to improve weak sections
5. Check that the essay reveals something meaningful about the student

Keep responses focused and actionable. Use bullet points for specific feedback.`;

    let userMessage = "";
    
    switch (action) {
      case "review":
        userMessage = `Please review this college application essay and provide detailed feedback:\n\n${essayText}`;
        break;
      case "brainstorm":
        userMessage = `Help me brainstorm ideas for a college essay. Here's what I'm thinking about:\n\n${prompt}`;
        break;
      case "improve":
        userMessage = `Please suggest specific improvements for this essay section:\n\n${essayText}`;
        break;
      case "grammar":
        userMessage = `Please check this essay for grammar, style, and clarity issues:\n\n${essayText}`;
        break;
      default:
        userMessage = prompt || `Please review this essay:\n\n${essayText}`;
    }

    // Call Lovable AI Gateway
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro", // Using high-quality model for essay feedback
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        stream: false,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "AI rate limit exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI usage limit reached." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errorText);
      throw new Error("AI service temporarily unavailable");
    }

    const aiData = await aiResponse.json();
    const feedback = aiData.choices?.[0]?.message?.content;

    if (!feedback) {
      throw new Error("No response from AI service");
    }

    logStep("Essay feedback generated successfully");

    return new Response(JSON.stringify({ 
      feedback,
      action 
    }), {
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
