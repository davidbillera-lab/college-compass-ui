// DO NOT EDIT VIA LOVABLE
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import OnboardingProgress from "@/onboarding/OnboardingProgress";
import { ensureProfileRow } from "@/lib/profileExtrasApi";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ArrowRight, CheckCircle2 } from "lucide-react";

function StoryTextarea({ id, label, hint, placeholder, value, onChange, maxLen = 500 }: {
  id: string; label: string; hint: string; placeholder: string; value: string; onChange: (v: string) => void; maxLen?: number;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <p className="text-xs text-muted-foreground">{hint}</p>
      <textarea
        id={id}
        className="w-full min-h-[110px] rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
        placeholder={placeholder}
        maxLength={maxLen}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <p className="text-xs text-muted-foreground text-right">{value.length}/{maxLen}</p>
    </div>
  );
}

export default function OnboardingStoryPage() {
  const nav = useNavigate();
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [proudMoment, setProudMoment] = useState("");
  const [challenge, setChallenge] = useState("");
  const [impact, setImpact] = useState("");

  useEffect(() => {
    (async () => {
      const prof: any = await ensureProfileRow();
      if (prof.proud_moment) setProudMoment(prof.proud_moment);
      if (prof.challenge) setChallenge(prof.challenge);
      if (prof.impact) setImpact(prof.impact);
    })();
  }, []);

  async function handleNext() {
    setSaving(true);
    setErr(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in");
      // Save to profile_extras JSONB
      const { data: existing } = await supabase.from("profiles").select("profile_extras").eq("id", user.id).single();
      const extras = (existing?.profile_extras as Record<string, unknown>) || {};
      await supabase.from("profiles").update({
        proud_moment: proudMoment || null,
        challenge: challenge || null,
        impact: impact || null,
        profile_extras: { ...extras, proudMoment: proudMoment || null, challenge: challenge || null, impact: impact || null },
      }).eq("id", user.id);
      nav("/onboarding/results");
    } catch (e: any) {
      setErr(e.message ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <OnboardingProgress active="story" />
      <div className="flex-1 flex flex-col items-center px-4 py-8">
        <div className="w-full max-w-xl space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Your Story</h1>
            <p className="text-sm text-muted-foreground mt-1">
              The best college essays aren't written from scratch — they're pulled from real experiences. Answer these three questions and your AI Essay Coach will use them to help you write essays that actually sound like you.
            </p>
            <p className="text-xs text-muted-foreground mt-1">All fields are optional. You can always add or edit these later.</p>
          </div>
          {err && <p className="text-destructive text-sm">{err}</p>}

          <div className="space-y-5">
            <StoryTextarea
              id="proud"
              label="A moment you're genuinely proud of"
              hint="Big or small. What happened and why does it matter to you?"
              placeholder="e.g. I organized a food drive that collected 2,000 cans for our local shelter. It taught me that one person with a plan can actually move a community..."
              value={proudMoment}
              onChange={setProudMoment}
            />
            <StoryTextarea
              id="challenge"
              label="The hardest thing you've dealt with"
              hint="How did you handle it? What did you learn?"
              placeholder="e.g. When my family moved three times in two years, I had to learn how to make friends quickly and adapt to new environments..."
              value={challenge}
              onChange={setChallenge}
            />
            <StoryTextarea
              id="impact"
              label="The impact you want to have on the world"
              hint="Be specific — not just 'help people.' What problem? What community? What change?"
              placeholder="e.g. I want to build affordable housing technology that helps working-class families in the Southeast own homes without predatory loans..."
              value={impact}
              onChange={setImpact}
            />
          </div>

          <div className="flex items-start gap-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 px-4 py-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-emerald-800 dark:text-emerald-300">Your story powers the AI Essay Coach. The more you share, the more personalized your feedback will be.</p>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border">
            <Button variant="ghost" onClick={() => nav("/onboarding/activities")}>Back</Button>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => nav("/onboarding/results")}>Skip</Button>
              <Button onClick={handleNext} disabled={saving} className="gap-2 min-w-[140px]">
                {saving ? "Saving..." : "Complete Profile"} <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
