import { useMemo, useState } from "react";
import type { Activity, ProfileExtras } from "@/lib/profileUtils";
import { newActivity, normalizeExtras } from "@/lib/profileExtrasApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Trash2 } from "lucide-react";

export default function ActivitiesEditor({
  extras,
  onChange,
}: {
  extras: ProfileExtras | null | undefined;
  onChange: (next: ProfileExtras) => void;
}) {
  const safe = useMemo(() => normalizeExtras(extras), [extras]);
  const [local, setLocal] = useState<ProfileExtras>(safe);

  // Sync when props change (first load)
  useMemo(() => setLocal(safe), [safe]);

  const activities = local.activities ?? [];

  function updateActivity(i: number, patch: Partial<Activity>) {
    const next = [...activities];
    next[i] = { ...next[i], ...patch };
    const updated = { ...local, activities: next };
    setLocal(updated);
    onChange(updated);
  }

  function add() {
    const updated = { ...local, activities: [...activities, newActivity()] };
    setLocal(updated);
    onChange(updated);
  }

  function remove(i: number) {
    const updated = { ...local, activities: activities.filter((_, idx) => idx !== i) };
    setLocal(updated);
    onChange(updated);
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Profile Extras</h3>
          <p className="text-sm text-muted-foreground">Activities</p>
        </div>
        <Button variant="outline" size="sm" onClick={add}>
          + Add activity
        </Button>
      </div>

      <div className="space-y-4">
        {activities.map((a, i) => (
          <div
            key={i}
            className="rounded-lg border bg-card p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">
                Activity {i + 1}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => remove(i)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Remove
              </Button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor={`name-${i}`}>Name</Label>
                <Input
                  id={`name-${i}`}
                  value={a.name}
                  onChange={(e) => updateActivity(i, { name: e.target.value })}
                  placeholder="e.g. Robotics Club"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor={`role-${i}`}>Role</Label>
                <Input
                  id={`role-${i}`}
                  value={a.role ?? ""}
                  onChange={(e) => updateActivity(i, { role: e.target.value })}
                  placeholder="e.g. Captain"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor={`years-${i}`}>Years</Label>
                <Input
                  id={`years-${i}`}
                  value={a.years ?? ""}
                  onChange={(e) => updateActivity(i, { years: e.target.value })}
                  placeholder="e.g. 10-12"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor={`impact-${i}`}>Impact</Label>
                <Textarea
                  id={`impact-${i}`}
                  value={a.impact ?? ""}
                  onChange={(e) => updateActivity(i, { impact: e.target.value })}
                  placeholder="1-2 lines describing your contribution"
                  rows={2}
                />
              </div>
            </div>
          </div>
        ))}

        {activities.length === 0 && (
          <div className="text-sm text-muted-foreground p-4 border border-dashed rounded-lg text-center">
            Add at least 2 activities for scholarship readiness.
          </div>
        )}
      </div>
    </section>
  );
}
