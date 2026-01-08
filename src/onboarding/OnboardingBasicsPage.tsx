import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import OnboardingProgress from "@/onboarding/OnboardingProgress";
import { ensureProfileRow } from "@/lib/profileExtrasApi";
import { updateProfile } from "@/lib/mvpApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function OnboardingBasicsPage() {
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
        intended_major: p.intended_major || null,
        regions: p.regions || null,
        budget_max_usd: p.budget_max_usd ? Number(p.budget_max_usd) : null,
        campus_size: p.campus_size || null,
      });
      nav("/onboarding/story");
    } catch (e: any) {
      setErr(e.message ?? "Failed to save");
    }
  }

  if (!p) return <p className="p-8 text-muted-foreground">Loading…</p>;

  return (
    <div className="min-h-screen bg-background">
      <OnboardingProgress active="basics" />
      <div className="max-w-xl mx-auto p-8 space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Basics</h1>
        {err && <p className="text-destructive text-sm">{err}</p>}

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Intended major (or "Undecided")</label>
          <Input
            value={p.intended_major ?? ""}
            onChange={(e) => setP({ ...p, intended_major: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Regions (comma-separated)</label>
          <Input
            value={p.regions ?? ""}
            onChange={(e) => setP({ ...p, regions: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Budget max (USD)</label>
            <Input
              type="number"
              value={p.budget_max_usd ?? ""}
              onChange={(e) => setP({ ...p, budget_max_usd: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Campus size</label>
            <Select
              value={p.campus_size ?? ""}
              onValueChange={(val) => setP({ ...p, campus_size: val })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">—</SelectItem>
                <SelectItem value="small">Small</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="large">Large</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="pt-4">
          <Button onClick={next}>Continue</Button>
        </div>
      </div>
    </div>
  );
}
