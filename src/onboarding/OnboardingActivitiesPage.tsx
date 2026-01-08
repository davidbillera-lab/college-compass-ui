import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import OnboardingProgress from "@/onboarding/OnboardingProgress";
import { ensureProfileRow, saveProfileExtras, normalizeExtras, newActivity } from "@/lib/profileExtrasApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";
import type { Activity } from "@/lib/profileUtils";

export default function OnboardingActivitiesPage() {
  const nav = useNavigate();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const prof = await ensureProfileRow();
      const extras = normalizeExtras(prof.profile_extras);
      setActivities(extras.activities ?? []);
      setLoading(false);
    })();
  }, []);

  function updateActivity(i: number, patch: Partial<Activity>) {
    setActivities((prev) => prev.map((a, idx) => (idx === i ? { ...a, ...patch } : a)));
  }

  function addActivity() {
    setActivities((prev) => [...prev, newActivity()]);
  }

  function removeActivity(i: number) {
    setActivities((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function next() {
    setErr(null);
    try {
      const prof = await ensureProfileRow();
      const extras = normalizeExtras(prof.profile_extras);
      await saveProfileExtras({ ...extras, activities });
      nav("/onboarding/results");
    } catch (e: any) {
      setErr(e.message ?? "Failed to save");
    }
  }

  if (loading) return <p className="p-8 text-muted-foreground">Loading…</p>;

  return (
    <div className="min-h-screen bg-background">
      <OnboardingProgress active="activities" />
      <div className="max-w-xl mx-auto p-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Activities</h1>
          <Button variant="outline" size="sm" onClick={addActivity}>
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        </div>
        {err && <p className="text-destructive text-sm">{err}</p>}
        <p className="text-sm text-muted-foreground">Add at least 2 activities for scholarship matching.</p>

        <div className="space-y-4">
          {activities.map((a, i) => (
            <div key={i} className="p-4 border rounded-lg space-y-3 bg-card">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">Activity {i + 1}</span>
                <Button variant="ghost" size="sm" onClick={() => removeActivity(i)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
              <Input
                placeholder="Activity name"
                value={a.name}
                onChange={(e) => updateActivity(i, { name: e.target.value })}
              />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Role"
                  value={a.role ?? ""}
                  onChange={(e) => updateActivity(i, { role: e.target.value })}
                />
                <Input
                  placeholder="Years (e.g. 10-12)"
                  value={a.years ?? ""}
                  onChange={(e) => updateActivity(i, { years: e.target.value })}
                />
              </div>
              <Input
                placeholder="Impact (1-2 lines)"
                value={a.impact ?? ""}
                onChange={(e) => updateActivity(i, { impact: e.target.value })}
              />
            </div>
          ))}
          {activities.length === 0 && (
            <p className="text-muted-foreground text-sm text-center py-8">
              No activities yet. Click "Add" to get started.
            </p>
          )}
        </div>

        <div className="pt-4 flex gap-3">
          <Button variant="outline" onClick={() => nav("/onboarding/story")}>Back</Button>
          <Button onClick={next}>Continue</Button>
        </div>
      </div>
    </div>
  );
}
