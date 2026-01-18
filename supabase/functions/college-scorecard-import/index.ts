import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Map Carnegie classification to our size categories
function mapSize(studentCount: number | null): string | null {
  if (!studentCount) return null;
  if (studentCount < 5000) return "Small";
  if (studentCount < 15000) return "Medium";
  return "Large";
}

// Map state to region
function mapRegion(state: string | null): string | null {
  if (!state) return null;
  const northeast = ["CT", "DE", "MA", "MD", "ME", "NH", "NJ", "NY", "PA", "RI", "VT", "DC"];
  const southeast = ["AL", "AR", "FL", "GA", "KY", "LA", "MS", "NC", "SC", "TN", "VA", "WV"];
  const midwest = ["IA", "IL", "IN", "KS", "MI", "MN", "MO", "ND", "NE", "OH", "SD", "WI"];
  const southwest = ["AZ", "NM", "OK", "TX"];
  const west = ["AK", "CA", "CO", "HI", "ID", "MT", "NV", "OR", "UT", "WA", "WY"];

  if (northeast.includes(state)) return "Northeast";
  if (southeast.includes(state)) return "Southeast";
  if (midwest.includes(state)) return "Midwest";
  if (southwest.includes(state)) return "Southwest";
  if (west.includes(state)) return "West";
  return null;
}

// Map ownership to type
function mapType(ownership: number | null, predominantDegree: number | null): string | null {
  // predominantDegree: 0=Not classified, 1=Certificate, 2=Associate, 3=Bachelor's, 4=Graduate
  if (predominantDegree === 1) return "Trade School";
  if (predominantDegree === 2) return "Community College";
  
  // ownership: 1=Public, 2=Private nonprofit, 3=Private for-profit
  if (ownership === 1) return "Public";
  if (ownership === 2 || ownership === 3) return "Private";
  return null;
}

// Map locale to setting
function mapSetting(locale: number | null): string | null {
  if (!locale) return null;
  // 11-13 = City, 21-23 = Suburb, 31-33 = Town, 41-43 = Rural
  if (locale >= 11 && locale <= 13) return "Urban";
  if (locale >= 21 && locale <= 23) return "Suburban";
  if (locale >= 31 && locale <= 33) return "Suburban";
  if (locale >= 41 && locale <= 43) return "Rural";
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("COLLEGE_SCORECARD_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: "College Scorecard API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fields we want from the API
    const fields = [
      "id",
      "school.name",
      "school.city",
      "school.state",
      "school.school_url",
      "school.ownership",
      "school.locale",
      "school.degrees_awarded.predominant",
      "school.religious_affiliation",
      "latest.student.size",
      "latest.cost.tuition.in_state",
      "latest.cost.tuition.out_of_state",
      "latest.cost.avg_net_price.overall",
      "latest.admissions.admission_rate.overall",
      "latest.admissions.sat_scores.25th_percentile.critical_reading",
      "latest.admissions.sat_scores.75th_percentile.critical_reading",
      "latest.admissions.sat_scores.25th_percentile.math",
      "latest.admissions.sat_scores.75th_percentile.math",
      "latest.admissions.act_scores.25th_percentile.cumulative",
      "latest.admissions.act_scores.75th_percentile.cumulative",
      "latest.completion.rate_suppressed.overall",
      "latest.student.retention_rate.overall.full_time",
      "latest.student.demographics.student_faculty_ratio",
      "latest.aid.median_debt.completers.overall",
    ].join(",");

    let totalInserted = 0;
    let totalUpdated = 0;
    let totalSkipped = 0;
    let page = 0;
    const perPage = 100;
    let hasMore = true;

    console.log("Starting College Scorecard import...");

    while (hasMore) {
      const url = `https://api.data.gov/ed/collegescorecard/v1/schools?api_key=${apiKey}&fields=${fields}&page=${page}&per_page=${perPage}`;
      
      console.log(`Fetching page ${page}...`);
      
      const response = await fetch(url);
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API error on page ${page}:`, errorText);
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      const results = data.results || [];
      
      if (results.length === 0) {
        hasMore = false;
        break;
      }

      // Transform and insert data
      const colleges = results.map((school: any) => {
        const satReadLow = school["latest.admissions.sat_scores.25th_percentile.critical_reading"];
        const satReadHigh = school["latest.admissions.sat_scores.75th_percentile.critical_reading"];
        const satMathLow = school["latest.admissions.sat_scores.25th_percentile.math"];
        const satMathHigh = school["latest.admissions.sat_scores.75th_percentile.math"];
        
        // Calculate combined SAT ranges
        const satLow = (satReadLow && satMathLow) ? satReadLow + satMathLow : null;
        const satHigh = (satReadHigh && satMathHigh) ? satReadHigh + satMathHigh : null;

        const state = school["school.state"];
        const studentSize = school["latest.student.size"];
        const ownership = school["school.ownership"];
        const predominantDegree = school["school.degrees_awarded.predominant"];
        const locale = school["school.locale"];
        const acceptanceRate = school["latest.admissions.admission_rate.overall"];

        return {
          name: school["school.name"],
          city: school["school.city"],
          state: state,
          region: mapRegion(state),
          type: mapType(ownership, predominantDegree),
          size: mapSize(studentSize),
          setting: mapSetting(locale),
          website_url: school["school.school_url"] ? 
            (school["school.school_url"].startsWith("http") ? school["school.school_url"] : `https://${school["school.school_url"]}`) : null,
          student_population: studentSize,
          tuition_in_state: school["latest.cost.tuition.in_state"],
          tuition_out_state: school["latest.cost.tuition.out_of_state"],
          sticker_usd: school["latest.cost.avg_net_price.overall"],
          acceptance_rate: acceptanceRate ? Math.round(acceptanceRate * 100 * 10) / 10 : null,
          sat_range_low: satLow,
          sat_range_high: satHigh,
          act_range_low: school["latest.admissions.act_scores.25th_percentile.cumulative"],
          act_range_high: school["latest.admissions.act_scores.75th_percentile.cumulative"],
          graduation_rate: school["latest.completion.rate_suppressed.overall"] ? 
            Math.round(school["latest.completion.rate_suppressed.overall"] * 100) : null,
          retention_rate: school["latest.student.retention_rate.overall.full_time"] ?
            Math.round(school["latest.student.retention_rate.overall.full_time"] * 100) : null,
          student_faculty_ratio: school["latest.student.demographics.student_faculty_ratio"],
          religious_affiliation: school["school.religious_affiliation"] ? 
            String(school["school.religious_affiliation"]) : null,
          source_type: "college_scorecard",
          last_crawled_at: new Date().toISOString(),
        };
      }).filter((c: any) => c.name); // Filter out any without names

      // Upsert to database (using name + city + state as unique identifier)
      for (const college of colleges) {
        const { data: existing } = await supabase
          .from("colleges")
          .select("id")
          .eq("name", college.name)
          .eq("city", college.city || "")
          .eq("state", college.state || "")
          .maybeSingle();

        if (existing) {
          const { error } = await supabase
            .from("colleges")
            .update(college)
            .eq("id", existing.id);
          
          if (error) {
            console.error(`Error updating ${college.name}:`, error.message);
            totalSkipped++;
          } else {
            totalUpdated++;
          }
        } else {
          const { error } = await supabase
            .from("colleges")
            .insert(college);
          
          if (error) {
            console.error(`Error inserting ${college.name}:`, error.message);
            totalSkipped++;
          } else {
            totalInserted++;
          }
        }
      }

      console.log(`Page ${page} complete. Inserted: ${totalInserted}, Updated: ${totalUpdated}, Skipped: ${totalSkipped}`);

      // Check if there are more pages
      const totalResults = data.metadata?.total || 0;
      const processedSoFar = (page + 1) * perPage;
      hasMore = processedSoFar < totalResults;
      page++;

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`Import complete! Inserted: ${totalInserted}, Updated: ${totalUpdated}, Skipped: ${totalSkipped}`);

    return new Response(
      JSON.stringify({
        success: true,
        inserted: totalInserted,
        updated: totalUpdated,
        skipped: totalSkipped,
        total: totalInserted + totalUpdated,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Import error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
