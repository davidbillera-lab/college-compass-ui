// DO NOT EDIT VIA LOVABLE
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import OnboardingProgress from "@/onboarding/OnboardingProgress";
import { ensureProfileRow } from "@/lib/profileExtrasApi";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const US_STATES = [
  "Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut",
  "Delaware","Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa",
  "Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts","Michigan",
  "Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire",
  "New Jersey","New Mexico","New York","North Carolina","North Dakota","Ohio",
  "Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina","South Dakota",
  "Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia",
  "Wisconsin","Wyoming","Washington D.C."
];

const GRAD_YEARS = [2025, 2026, 2027, 2028, 2029, 2030];

const TOP_MAJORS = [
  "Accounting","Aerospace Engineering","Art & Design","Biology","Business Administration",
  "Chemical Engineering","Chemistry","Civil Engineering","Communications","Computer Science",
  "Criminal Justice","Data Science","Economics","Education","Electrical Engineering",
  "English","Environmental Science","Finance","Health Sciences","History",
  "Information Technology","Journalism","Kinesiology","Law (Pre-Law)","Marketing",
  "Mathematics","Mechanical Engineering","Medicine (Pre-Med)","Music","Nursing",
  "Philosophy","Physics","Political Science","Psychology","Public Health",
  "Social Work","Sociology","Software Engineering","Theater","Undecided"
];

export default function OnboardingBasicsPage() {
  const nav = useNavigate();
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [preferredName, setPreferredName] = useState("");
  const [gradYear, setGradYear] = useState<number | null>(null);
  const [school, setSchool] = useState("");
  const [state, setState] = useState("");
  const [majors, setMajors] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      const prof: any = await ensureProfileRow();
      if (prof.preferred_name) setPreferredName(prof.preferred_name);
      if (prof.graduation_year) setGradYear(prof.graduation_year);
      if (prof.school) setSchool(prof.school);
      if (prof.region) setState(prof.region);
      if (prof.intended_majors) setMajors(prof.intended_majors);
    })();
  }, []);

  function toggleMajor(m: string) {
    setMajors((prev) => prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]);
  }

  async function handleNext() {
    setSaving(true);
    setErr(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in");
      await supabase.from("profiles").update({
        preferred_name: preferredName || null,
        graduation_year: gradYear,
        grad_year: gradYear,
        school: school || null,
        region: state || null,
        intended_majors: majors.length > 0 ? majors : null,
      }).eq("id", user.id);
      nav("/onboarding/academics");
    } catch (e: any) {
      setErr(e.message ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <OnboardingProgress active="basics" />
      <div className="flex-1 flex flex-col items-center px-4 py-8">
        <div className="w-full max-w-xl space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">The Basics</h1>
            <p className="text-sm text-muted-foreground mt-1">
              These five fields unlock your first wave of matches — especially state-specific scholarships, which make up 40% of all available funding.
            </p>
          </div>
          {err && <p className="text-destructive text-sm">{err}</p>}

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">What should we call you?</Label>
              <Input id="name" placeholder="First name or nickname" value={preferredName} onChange={(e) => setPreferredName(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Graduation year</Label>
                <Select value={gradYear?.toString() ?? ""} onValueChange={(v) => setGradYear(parseInt(v))}>
                  <SelectTrigger><SelectValue placeholder="Select year" /></SelectTrigger>
                  <SelectContent>
                    {GRAD_YEARS.map((y) => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>State of residence</Label>
                <Select value={state} onValueChange={setState}>
                  <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
                  <SelectContent className="max-h-60">
                    {US_STATES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="school">High school name</Label>
              <Input id="school" placeholder="e.g. Lincoln High School" value={school} onChange={(e) => setSchool(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Intended major(s)</Label>
              <p className="text-xs text-muted-foreground">Select all that apply — you can change these anytime.</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-52 overflow-y-auto pr-1">
                {TOP_MAJORS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => toggleMajor(m)}
                    className={cn(
                      "text-xs rounded-lg border px-2 py-1.5 text-left transition-colors",
                      majors.includes(m) ? "border-primary bg-primary/10 text-primary font-medium" : "border-border hover:border-primary/50"
                    )}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 px-4 py-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-emerald-800 dark:text-emerald-300">Completing this step unlocks state-specific scholarships and your personalized college list.</p>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border">
            <Button variant="ghost" onClick={() => nav("/welcome")}>Back</Button>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => nav("/onboarding/academics")}>Skip</Button>
              <Button onClick={handleNext} disabled={saving} className="gap-2 min-w-[140px]">
                {saving ? "Saving..." : "Save & Continue"} <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
