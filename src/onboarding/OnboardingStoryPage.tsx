import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import OnboardingProgress from "@/onboarding/OnboardingProgress";
import { ensureProfileRow } from "@/lib/profileExtrasApi";
import { updateProfile } from "@/lib/mvpApi";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function OnboardingStoryPage() {
  const nav = useNavigate();
  const [p, setP] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const prof = await ensureProfileRow();
      setP(prof);
    })();
  }, []);

  async function next() {
    setErr(null);
    try {
      await updateProfile({
        values: p.values || null,
        proud_moment: p.proud_moment || null,
        impact: p.impact || null,
      });
      nav("/onboarding/activities");
    } catch (e: any) {
      setErr(e.message ?? "Failed to save");
    }
  }

  if (!p) return <p className="p-8 text-muted-foreground">Loading…</p>;

  return (
    <div className="min-h-screen bg-background">
      <OnboardingProgress active="story" />
      <div className="max-w-xl mx-auto p-8 space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Your Story</h1>
        {err && <p className="text-destructive text-sm">{err}</p>}

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">What do you value most?</label>
          <Textarea
            rows={3}
            value={p.values ?? ""}
            onChange={(e) => setP({ ...p, values: e.target.value })}
            placeholder="e.g., creativity, helping others, intellectual challenge..."
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">What's a moment you're proud of?</label>
          <Textarea
            rows={3}
            value={p.proud_moment ?? ""}
            onChange={(e) => setP({ ...p, proud_moment: e.target.value })}
            placeholder="Describe an achievement or experience..."
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">What impact do you want to make?</label>
          <Textarea
            rows={3}
            value={p.impact ?? ""}
            onChange={(e) => setP({ ...p, impact: e.target.value })}
            placeholder="How do you want to contribute to the world?"
          />
        </div>

        <div className="pt-4 flex gap-3">
          <Button variant="outline" onClick={() => nav("/onboarding/basics")}>Back</Button>
          <Button onClick={next}>Continue</Button>
        </div>
      </div>
    </div>
  );
}
