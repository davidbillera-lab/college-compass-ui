// DO NOT EDIT VIA LOVABLE
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import OnboardingProgress from "@/onboarding/OnboardingProgress";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Sparkles, GraduationCap, Star, ArrowRight } from "lucide-react";

export default function OnboardingResultsPage() {
  const nav = useNavigate();
  const [scholarshipCount, setScholarshipCount] = useState<number | null>(null);
  const [collegeCount, setCollegeCount] = useState<number | null>(null);
  const [completeness, setCompleteness] = useState(0);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get match counts
      const [{ count: sc }, { count: cc }] = await Promise.all([
        supabase.from("scholarship_matches").select("*", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("college_matches").select("*", { count: "exact", head: true }).eq("user_id", user.id),
      ]);
      setScholarshipCount(sc ?? 0);
      setCollegeCount(cc ?? 0);

      // Compute completeness
      const { data: prof } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (prof) {
        const fields = [
          prof.preferred_name, prof.graduation_year, prof.school, prof.region,
          prof.intended_majors?.length > 0,
          prof.gpa_unweighted, prof.sat_score || prof.act_score,
          prof.coursework_rigor, prof.financial_need !== null,
          prof.first_gen_college !== null, prof.budget_max_usd,
          prof.volunteer_hours, prof.awards?.length > 0,
        ];
        const filled = fields.filter(Boolean).length;
        setCompleteness(Math.round((filled / fields.length) * 100));
      }
    })();
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <OnboardingProgress active="results" />
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-xl text-center space-y-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 mx-auto">
            <CheckCircle2 className="h-10 w-10 text-emerald-600" />
          </div>

          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Your profile is live!</h1>
            <p className="text-muted-foreground">Here's what's now unlocked for you:</p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-2xl bg-primary/5 border border-primary/20 p-5 text-center">
              <Sparkles className="h-7 w-7 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold text-primary">{scholarshipCount !== null ? scholarshipCount : "—"}</p>
              <p className="text-xs text-muted-foreground mt-1">Scholarship matches</p>
            </div>
            <div className="rounded-2xl bg-primary/5 border border-primary/20 p-5 text-center">
              <GraduationCap className="h-7 w-7 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold text-primary">{collegeCount !== null ? collegeCount : "—"}</p>
              <p className="text-xs text-muted-foreground mt-1">College matches</p>
            </div>
            <div className="rounded-2xl bg-primary/5 border border-primary/20 p-5 text-center">
              <Star className="h-7 w-7 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold text-primary">{completeness}%</p>
              <p className="text-xs text-muted-foreground mt-1">Profile complete</p>
            </div>
          </div>

          {completeness < 90 && (
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4 text-sm text-amber-800 dark:text-amber-300 text-left">
              <strong>Tip:</strong> Your profile is {completeness}% complete. Visit your Profile page to fill in the remaining fields and unlock more scholarship matches.
            </div>
          )}

          <div className="bg-muted/50 rounded-xl p-4 text-sm text-muted-foreground text-left">
            <strong className="text-foreground">Next step:</strong> Run "Calculate My Matches" from the College Matches page to generate your personalized college and scholarship scores. It takes about 30 seconds.
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" onClick={() => nav("/scholarships-intel")} className="gap-2">
              View Scholarship Matches <ArrowRight className="h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => nav("/dashboard")}>
              Go to Dashboard
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
