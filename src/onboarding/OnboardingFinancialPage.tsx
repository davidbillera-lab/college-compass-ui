// DO NOT EDIT VIA LOVABLE
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import OnboardingProgress from "@/onboarding/OnboardingProgress";
import { ensureProfileRow } from "@/lib/profileExtrasApi";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const CITIZENSHIP_OPTIONS = [
  "U.S. Citizen",
  "U.S. Permanent Resident (Green Card)",
  "DACA / Dreamer",
  "International Student",
  "Other",
];

const ETHNICITY_OPTIONS = [
  "American Indian or Alaska Native",
  "Asian or Pacific Islander",
  "Black or African American",
  "Hispanic or Latino",
  "Middle Eastern or North African",
  "White or Caucasian",
  "Two or more races",
  "Prefer not to say",
];

type BoolAnswer = true | false | null;

function TriButton({ value, current, onChange, label }: { value: BoolAnswer; current: BoolAnswer; onChange: (v: BoolAnswer) => void; label: string }) {
  return (
    <button
      type="button"
      onClick={() => onChange(value)}
      className={cn(
        "flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors",
        current === value ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/40"
      )}
    >
      {label}
    </button>
  );
}

export default function OnboardingFinancialPage() {
  const nav = useNavigate();
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [financialNeed, setFinancialNeed] = useState<BoolAnswer>(null);
  const [firstGen, setFirstGen] = useState<BoolAnswer>(null);
  const [budget, setBudget] = useState(30000);
  const [citizenship, setCitizenship] = useState("");
  const [ethnicity, setEthnicity] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      const prof = await ensureProfileRow();
      if (prof.financial_need !== null && prof.financial_need !== undefined) setFinancialNeed(prof.financial_need);
      if (prof.first_gen_college !== null && prof.first_gen_college !== undefined) setFirstGen(prof.first_gen_college);
      if (prof.budget_max_usd) setBudget(prof.budget_max_usd);
    })();
  }, []);

  function toggleEthnicity(e: string) {
    setEthnicity((prev) => prev.includes(e) ? prev.filter((x) => x !== e) : [...prev, e]);
  }

  async function handleNext() {
    setSaving(true);
    setErr(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in");
      await supabase.from("profiles").update({
        financial_need: financialNeed,
        first_gen_college: firstGen,
        budget_max_usd: budget,
      }).eq("id", user.id);
      if (citizenship) {
        await supabase.from("scholarship_user_answers").upsert(
          { user_id: user.id, question_key: "citizenship", answer_json: { value: citizenship } },
          { onConflict: "user_id,question_key" }
        );
      }
      if (ethnicity.length > 0) {
        await supabase.from("scholarship_user_answers").upsert(
          { user_id: user.id, question_key: "race_ethnicity", answer_json: { value: ethnicity } },
          { onConflict: "user_id,question_key" }
        );
      }
      nav("/onboarding/activities");
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <OnboardingProgress active="financial" />
      <div className="flex-1 flex flex-col items-center px-4 py-8">
        <div className="w-full max-w-xl space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Financial & Background</h1>
            <p className="text-sm text-muted-foreground mt-1">
              These questions feel personal — but they're the same ones every scholarship application asks. Answering them here means you only see scholarships you actually qualify for.
            </p>
          </div>
          {err && <p className="text-destructive text-sm">{err}</p>}

          <div className="space-y-5">
            <div className="space-y-2">
              <Label>Do you have demonstrated financial need?</Label>
              <p className="text-xs text-muted-foreground">If your family qualifies for federal aid (FAFSA), answer Yes.</p>
              <div className="flex gap-3">
                <TriButton value={true} current={financialNeed} onChange={setFinancialNeed} label="Yes" />
                <TriButton value={false} current={financialNeed} onChange={setFinancialNeed} label="No" />
                <TriButton value={null} current={financialNeed} onChange={setFinancialNeed} label="Not sure" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Are you a first-generation college student?</Label>
              <p className="text-xs text-muted-foreground">First-gen means neither parent completed a 4-year college degree.</p>
              <div className="flex gap-3">
                <TriButton value={true} current={firstGen} onChange={setFirstGen} label="Yes" />
                <TriButton value={false} current={firstGen} onChange={setFirstGen} label="No" />
              </div>
            </div>

            <div className="space-y-3">
              <Label>
                Estimated family budget for college (per year):{" "}
                <span className="text-primary font-semibold">
                  {budget >= 80000 ? "$80,000+" : `$${budget.toLocaleString()}`}
                </span>
              </Label>
              <p className="text-xs text-muted-foreground">This helps filter colleges you can actually afford.</p>
              <Slider min={0} max={80000} step={2500} value={[budget]} onValueChange={([v]) => setBudget(v)} className="w-full" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>$0</span><span>$20k</span><span>$40k</span><span>$60k</span><span>$80k+</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Citizenship status</Label>
              <Select value={citizenship} onValueChange={setCitizenship}>
                <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                <SelectContent>
                  {CITIZENSHIP_OPTIONS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Race / Ethnicity (optional)</Label>
              <p className="text-xs text-muted-foreground">Some scholarships are identity-specific. This is never shared publicly.</p>
              <div className="grid grid-cols-2 gap-2">
                {ETHNICITY_OPTIONS.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => toggleEthnicity(e)}
                    className={cn(
                      "text-xs rounded-lg border px-3 py-2 text-left transition-colors",
                      ethnicity.includes(e) ? "border-primary bg-primary/10 text-primary font-medium" : "border-border hover:border-primary/50"
                    )}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 px-4 py-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-emerald-800 dark:text-emerald-300">This step unlocks need-based, first-gen, and identity-specific scholarships — often the highest-value awards available.</p>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border">
            <Button variant="ghost" onClick={() => nav("/onboarding/academics")}>Back</Button>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => nav("/onboarding/activities")}>Skip</Button>
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
