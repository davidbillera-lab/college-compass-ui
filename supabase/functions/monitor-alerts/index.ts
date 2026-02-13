import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const log = (msg: string, details?: any) =>
  console.log(`[MONITOR] ${msg}${details ? ` - ${JSON.stringify(details)}` : ""}`);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    log("Monitor check started");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const adminEmail = Deno.env.get("DEV_AUTO_LOGIN_EMAIL") || "admin@example.com";

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const alerts: Array<{
      alert_type: string;
      severity: string;
      title: string;
      details: string;
      metadata: Record<string, any>;
    }> = [];

    // 1. Check for recent auth errors (failed logins in last 15 min)
    const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();

    // 2. Check for edge function errors by looking at analytics_events for error patterns
    const { data: recentErrors } = await supabase
      .from("analytics_events")
      .select("*")
      .ilike("event_name", "%error%")
      .gte("created_at", fifteenMinAgo)
      .limit(50);

    if (recentErrors && recentErrors.length > 10) {
      alerts.push({
        alert_type: "system",
        severity: "warning",
        title: `High error rate detected: ${recentErrors.length} errors in 15 min`,
        details: `Error events: ${[...new Set(recentErrors.map((e: any) => e.event_name))].join(", ")}`,
        metadata: { count: recentErrors.length },
      });
    }

    // 3. Check for payment-related issues (checkout errors tracked in analytics)
    const { data: paymentErrors } = await supabase
      .from("analytics_events")
      .select("*")
      .or("event_name.ilike.%payment%,event_name.ilike.%checkout%,event_name.ilike.%subscription%")
      .ilike("event_name", "%error%")
      .gte("created_at", fifteenMinAgo)
      .limit(20);

    if (paymentErrors && paymentErrors.length > 0) {
      alerts.push({
        alert_type: "payment_failure",
        severity: "critical",
        title: `${paymentErrors.length} payment error(s) in last 15 minutes`,
        details: paymentErrors.map((e: any) => JSON.stringify(e.event_data)).join("\n"),
        metadata: { count: paymentErrors.length },
      });
    }

    // 4. Check system health - verify critical tables are accessible
    const healthChecks = await Promise.allSettled([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("colleges").select("id", { count: "exact", head: true }),
      supabase.from("scholarships").select("id", { count: "exact", head: true }),
    ]);

    const tableNames = ["profiles", "colleges", "scholarships"];
    healthChecks.forEach((result, i) => {
      if (result.status === "rejected") {
        alerts.push({
          alert_type: "system",
          severity: "critical",
          title: `Database table "${tableNames[i]}" is unreachable`,
          details: result.reason?.message || "Unknown error",
          metadata: { table: tableNames[i] },
        });
      }
    });

    // 5. Check for stale data (no new signups in 24h could indicate auth issues)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count: recentSignups } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .gte("created_at", oneDayAgo);

    // Only alert if we normally have signups (check total count)
    const { count: totalProfiles } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true });

    if (totalProfiles && totalProfiles > 10 && (recentSignups === 0 || recentSignups === null)) {
      alerts.push({
        alert_type: "auth_error",
        severity: "info",
        title: "No new signups in 24 hours",
        details: `Total profiles: ${totalProfiles}. This may indicate an auth system issue or normal low traffic.`,
        metadata: { total_profiles: totalProfiles },
      });
    }

    // Insert alerts into database
    if (alerts.length > 0) {
      const { error: insertError } = await supabase
        .from("monitoring_alerts")
        .insert(alerts);

      if (insertError) {
        log("Failed to insert alerts", insertError);
      } else {
        log(`Inserted ${alerts.length} alerts`);
      }

      // Send email for critical alerts
      const criticalAlerts = alerts.filter((a) => a.severity === "critical");
      if (criticalAlerts.length > 0 && resendApiKey) {
        try {
          const emailBody = criticalAlerts
            .map((a) => `<h3>🚨 ${a.title}</h3><p>${a.details}</p>`)
            .join("<hr/>");

          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${resendApiKey}`,
            },
            body: JSON.stringify({
              from: "Campus Climb <alerts@updates.campusclimb.com>",
              to: [adminEmail],
              subject: `🚨 ${criticalAlerts.length} Critical Alert(s) - Campus Climb`,
              html: `
                <h2>Critical Monitoring Alerts</h2>
                <p>The following critical issues were detected at ${new Date().toISOString()}:</p>
                ${emailBody}
                <hr/>
                <p><small>This is an automated alert from Campus Climb monitoring.</small></p>
              `,
            }),
          });
          log("Critical alert email sent");
        } catch (emailErr) {
          log("Failed to send alert email", emailErr);
        }
      }
    } else {
      log("No alerts - all systems healthy");
    }

    return new Response(
      JSON.stringify({
        status: "ok",
        alerts_created: alerts.length,
        critical: alerts.filter((a) => a.severity === "critical").length,
        timestamp: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    log("ERROR", { message: msg });
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
