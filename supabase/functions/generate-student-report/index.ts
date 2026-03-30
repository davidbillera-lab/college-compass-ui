// DO NOT EDIT VIA LOVABLE AI - DIRECT API CALLS REQUIRED
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // Get user from auth token
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const userId = user.id;

    // Fetch profile
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError) throw profileError;

    // Fetch college matches
    const { data: collegeMatches } = await supabaseClient
      .from('college_matches')
      .select(`
        fit_score,
        bucket,
        why_fit,
        colleges ( name, state, acceptance_rate, tuition_in_state, tuition_out_of_state )
      `)
      .eq('student_id', userId)
      .order('fit_score', { ascending: false })
      .limit(10);

    // Fetch scholarship matches
    const { data: scholarshipMatches } = await supabaseClient
      .from('scholarship_matches')
      .select(`
        score,
        reasons,
        scholarships ( name, provider, amount_max, deadline, is_need_based, is_merit_based )
      `)
      .eq('student_id', userId)
      .order('score', { ascending: false })
      .limit(10);

    // Fetch profile answers
    const { data: answers } = await supabaseClient
      .from('scholarship_user_answers')
      .select('question_key, answer_json')
      .eq('user_id', userId);

    const openAiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Build context for AI
    const prompt = `
You are an expert, honest, and highly analytical college admissions counselor. 
Your task is to generate a comprehensive, personalized "Student Action Report" in Markdown format for the following student.

STUDENT PROFILE:
Name: ${profile.preferred_name || 'Student'}
GPA (Unweighted): ${profile.gpa_unweighted || 'N/A'}
GPA (Weighted): ${profile.gpa_weighted || 'N/A'}
SAT Score: ${profile.sat_score || 'N/A'}
ACT Score: ${profile.act_score || 'N/A'}
Intended Majors: ${profile.intended_majors?.join(', ') || 'Undecided'}
State: ${profile.region || 'N/A'}
First Generation: ${profile.first_gen_college ? 'Yes' : 'No'}
Financial Need: ${profile.financial_need ? 'Yes' : 'No'}
Max Budget: $${profile.budget_max_usd || 'N/A'}
Coursework Rigor: ${profile.coursework_rigor || 'N/A'}
Leadership/Sports/Volunteer: ${profile.leadership_roles ? 'Yes' : 'No'} / ${profile.sports_played ? 'Yes' : 'No'} / ${profile.volunteer_hours || 0} hours
Other info: ${JSON.stringify(answers || [])}

TOP COLLEGE MATCHES:
${JSON.stringify(collegeMatches || [], null, 2)}

TOP SCHOLARSHIP MATCHES:
${JSON.stringify(scholarshipMatches || [], null, 2)}

REQUIREMENTS:
1. Be completely honest. If their GPA/SAT is too low for a reach school, say it gently but clearly.
2. Structure the report with these sections:
   - **Executive Summary**: A brief, honest assessment of their profile strength.
   - **College Strategy**: Analyze their Likely, Target, and Reach schools. Are they aiming too high? Too low? 
   - **Financial & Scholarship Strategy**: Based on their need and matches, what should they focus on?
   - **Essay & Application Focus**: What parts of their story should they highlight?
   - **Prioritized Action Plan**: 3-5 concrete next steps.
3. Format beautifully in Markdown with headings (##), bold text, and bullet points.
4. DO NOT use generic fluff. Reference their specific numbers, colleges, and scholarships.
`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        messages: [
          { role: 'system', content: 'You are an expert college admissions counselor generating honest student reports.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
      }),
    });

    const aiData = await response.json();
    
    if (!response.ok) {
      console.error('OpenAI Error:', aiData);
      throw new Error('Failed to generate report with AI');
    }

    const reportMarkdown = aiData.choices[0].message.content;

    return new Response(
      JSON.stringify({ report: reportMarkdown }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
