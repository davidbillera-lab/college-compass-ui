import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface IngestRequest {
  startUrl: string;
  maxPages?: number;
}

interface ScholarshipData {
  name: string;
  provider?: string;
  url?: string;
  amount_min_usd?: number;
  amount_max_usd?: number;
  deadline_date?: string;
  rolling_deadline?: boolean;
  location_scope?: string;
  education_level?: string;
  major_tags?: string;
  career_tags?: string;
  raw_eligibility_text?: string;
  normalized_criteria?: Record<string, unknown>;
  description?: string;
}

// Extract scholarship data from crawled content
function extractScholarships(markdown: string, pageUrl: string): ScholarshipData[] {
  const scholarships: ScholarshipData[] = [];
  
  // Split content by common scholarship separators
  const sections = markdown.split(/(?=#{1,3}\s|(?:\n\n|\r\n\r\n)(?=[A-Z][^a-z]*(?:Scholarship|Grant|Award|Fellowship)))/i);
  
  for (const section of sections) {
    if (section.length < 50) continue;
    
    // Look for scholarship indicators
    const scholarshipMatch = section.match(/(?:^|\n)#+?\s*(.+?(?:Scholarship|Grant|Award|Fellowship|Fund).+?)(?:\n|$)/i) ||
                            section.match(/\*\*(.+?(?:Scholarship|Grant|Award|Fellowship|Fund).+?)\*\*/i);
    
    if (!scholarshipMatch) continue;
    
    const name = scholarshipMatch[1].trim().replace(/[#*]/g, '').substring(0, 200);
    if (!name || name.length < 5) continue;
    
    const scholarship: ScholarshipData = {
      name,
      url: pageUrl,
      raw_eligibility_text: section.substring(0, 2000),
    };
    
    // Extract amount
    const amountMatch = section.match(/\$([0-9,]+)(?:\s*-\s*\$?([0-9,]+))?/);
    if (amountMatch) {
      const min = parseInt(amountMatch[1].replace(/,/g, ''), 10);
      const max = amountMatch[2] ? parseInt(amountMatch[2].replace(/,/g, ''), 10) : min;
      if (!isNaN(min)) scholarship.amount_min_usd = min;
      if (!isNaN(max)) scholarship.amount_max_usd = max;
    }
    
    // Extract deadline
    const deadlineMatch = section.match(/(?:deadline|due|closes?|submit by)[:\s]*([A-Za-z]+\s+\d{1,2},?\s+\d{4}|\d{1,2}\/\d{1,2}\/\d{2,4})/i);
    if (deadlineMatch) {
      try {
        const date = new Date(deadlineMatch[1]);
        if (!isNaN(date.getTime())) {
          scholarship.deadline_date = date.toISOString().split('T')[0];
        }
      } catch {
        // Ignore invalid dates
      }
    }
    
    // Check for rolling deadline
    if (/rolling|ongoing|no deadline|open year-round/i.test(section)) {
      scholarship.rolling_deadline = true;
    }
    
    // Extract location scope
    const stateMatch = section.match(/(?:residents? of|living in|from)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/);
    if (stateMatch) {
      scholarship.location_scope = stateMatch[1];
    } else if (/national|nationwide|all states|any state/i.test(section)) {
      scholarship.location_scope = 'national';
    }
    
    // Extract education level
    if (/high school senior|hs senior|12th grade/i.test(section)) {
      scholarship.education_level = 'hs_senior';
    } else if (/undergraduate|college student|enrolled in college/i.test(section)) {
      scholarship.education_level = 'undergrad';
    } else if (/graduate|master|phd|doctoral/i.test(section)) {
      scholarship.education_level = 'graduate';
    }
    
    // Extract provider (organization name)
    const providerMatch = section.match(/(?:offered by|sponsored by|provided by|from)\s+(?:the\s+)?([A-Z][A-Za-z\s&]+?)(?:\.|,|\n)/);
    if (providerMatch) {
      scholarship.provider = providerMatch[1].trim().substring(0, 100);
    }
    
    // Build normalized criteria
    const criteria: Record<string, unknown> = {};
    
    // GPA requirement
    const gpaMatch = section.match(/(?:minimum|at least|gpa of)\s*(\d+\.?\d*)\s*(?:gpa|grade point)/i);
    if (gpaMatch) {
      criteria.min_gpa = parseFloat(gpaMatch[1]);
    }
    
    // First-gen requirement
    if (/first[- ]generation|first in.*family.*college/i.test(section)) {
      criteria.first_gen = true;
    }
    
    // Need-based
    if (/financial need|need[- ]based|demonstrated need/i.test(section)) {
      criteria.need_based = true;
    }
    
    // Volunteer hours
    const volunteerMatch = section.match(/(\d+)\+?\s*(?:hours? of)?\s*(?:community service|volunteer)/i);
    if (volunteerMatch) {
      criteria.volunteer_hours_min = parseInt(volunteerMatch[1], 10);
    }
    
    // Majors
    const majorKeywords = ['STEM', 'engineering', 'computer science', 'nursing', 'education', 'business', 'arts', 'music', 'science', 'mathematics'];
    const foundMajors = majorKeywords.filter(m => new RegExp(m, 'i').test(section));
    if (foundMajors.length > 0) {
      criteria.majors = foundMajors;
    }
    
    if (Object.keys(criteria).length > 0) {
      scholarship.normalized_criteria = criteria;
    }
    
    scholarships.push(scholarship);
  }
  
  return scholarships;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get auth header and verify user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.log('No authorization header');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Get user from token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.log('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('User authenticated:', user.id);
    
    // Check if user is admin using secure user_roles table
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();
    
    if (roleError) {
      console.log('Role check error:', roleError);
      return new Response(
        JSON.stringify({ error: 'Could not verify admin status' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const isAdmin = roleData !== null;
    console.log('Is admin:', isAdmin);
    
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Parse request body
    const body: IngestRequest = await req.json();
    const { startUrl, maxPages = 10 } = body;
    
    if (!startUrl) {
      return new Response(
        JSON.stringify({ error: 'startUrl is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('Starting crawl:', startUrl, 'maxPages:', maxPages);
    
    // Get Firecrawl API key
    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!firecrawlApiKey) {
      console.error('FIRECRAWL_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Firecrawl not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Format URL
    let formattedUrl = startUrl.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = `https://${formattedUrl}`;
    }
    
    // Call Firecrawl crawl API
    const crawlResponse = await fetch('https://api.firecrawl.dev/v1/crawl', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: formattedUrl,
        limit: maxPages,
        scrapeOptions: {
          formats: ['markdown'],
        },
      }),
    });
    
    const crawlData = await crawlResponse.json();
    console.log('Crawl initiated:', crawlData);
    
    if (!crawlResponse.ok) {
      console.error('Firecrawl error:', crawlData);
      return new Response(
        JSON.stringify({ error: crawlData.error || 'Crawl failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // If crawl is async, poll for results
    let crawlResults = crawlData;
    if (crawlData.id || crawlData.jobId) {
      const jobId = crawlData.id || crawlData.jobId;
      console.log('Polling for crawl results, job:', jobId);
      
      // Poll for up to 2 minutes
      const maxAttempts = 24;
      for (let i = 0; i < maxAttempts; i++) {
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
        
        const statusResponse = await fetch(`https://api.firecrawl.dev/v1/crawl/${jobId}`, {
          headers: {
            'Authorization': `Bearer ${firecrawlApiKey}`,
          },
        });
        
        const statusData = await statusResponse.json();
        console.log('Poll attempt', i + 1, 'status:', statusData.status);
        
        if (statusData.status === 'completed') {
          crawlResults = statusData;
          break;
        } else if (statusData.status === 'failed') {
          return new Response(
            JSON.stringify({ error: 'Crawl failed', details: statusData }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    }
    
    // Extract scholarships from crawl results
    const allScholarships: ScholarshipData[] = [];
    const pages = crawlResults.data || [];
    
    console.log('Processing', pages.length, 'pages');
    
    for (const page of pages) {
      if (page.markdown) {
        const pageUrl = page.metadata?.sourceURL || page.url || formattedUrl;
        const extracted = extractScholarships(page.markdown, pageUrl);
        console.log('Extracted', extracted.length, 'scholarships from', pageUrl);
        allScholarships.push(...extracted);
      }
    }
    
    // Upsert scholarships
    let inserted = 0;
    let updated = 0;
    let skipped = 0;
    const errors: string[] = [];
    
    for (const scholarship of allScholarships) {
      try {
        // Check if scholarship already exists by URL or name+provider
        let existingId: string | null = null;
        
        if (scholarship.url) {
          const { data: byUrl } = await supabase
            .from('scholarships')
            .select('id')
            .eq('url', scholarship.url)
            .maybeSingle();
          if (byUrl) existingId = byUrl.id;
        }
        
        if (!existingId && scholarship.name && scholarship.provider) {
          const { data: byName } = await supabase
            .from('scholarships')
            .select('id')
            .eq('name', scholarship.name)
            .eq('provider', scholarship.provider)
            .maybeSingle();
          if (byName) existingId = byName.id;
        }
        
        const scholarshipRecord = {
          name: scholarship.name,
          provider: scholarship.provider || null,
          url: scholarship.url || null,
          amount_min_usd: scholarship.amount_min_usd || null,
          amount_max_usd: scholarship.amount_max_usd || null,
          amount_usd: scholarship.amount_max_usd || scholarship.amount_min_usd || null, // Compat with existing column
          deadline_date: scholarship.deadline_date || null,
          rolling_deadline: scholarship.rolling_deadline || false,
          location_scope: scholarship.location_scope || null,
          education_level: scholarship.education_level || null,
          major_tags: scholarship.major_tags || null,
          career_tags: scholarship.career_tags || null,
          raw_eligibility_text: scholarship.raw_eligibility_text || null,
          normalized_criteria: scholarship.normalized_criteria || {},
          description: scholarship.raw_eligibility_text?.substring(0, 500) || null,
          source_type: 'firecrawl',
          source_url: formattedUrl,
          last_crawled_at: new Date().toISOString(),
          status: 'active',
          updated_at: new Date().toISOString(),
        };
        
        if (existingId) {
          const { error: updateError } = await supabase
            .from('scholarships')
            .update(scholarshipRecord)
            .eq('id', existingId);
          
          if (updateError) {
            errors.push(`Update error for ${scholarship.name}: ${updateError.message}`);
          } else {
            updated++;
          }
        } else {
          const { error: insertError } = await supabase
            .from('scholarships')
            .insert(scholarshipRecord);
          
          if (insertError) {
            if (insertError.code === '23505') {
              skipped++;
            } else {
              errors.push(`Insert error for ${scholarship.name}: ${insertError.message}`);
            }
          } else {
            inserted++;
          }
        }
      } catch (e: unknown) {
        const errorMsg = e instanceof Error ? e.message : String(e);
        errors.push(`Error processing ${scholarship.name}: ${errorMsg}`);
      }
    }
    
    console.log('Ingestion complete:', { inserted, updated, skipped, errors: errors.length });
    
    return new Response(
      JSON.stringify({
        success: true,
        pagesProcessed: pages.length,
        inserted,
        updated,
        skipped,
        errors,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error: unknown) {
    console.error('Ingestion error:', error);
    const errorMsg = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMsg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
