import type { ProfileRow } from "@/lib/profileUtils";
import { computeProfileSnapshot } from "@/lib/profileUtils";
import { Progress } from "@/components/ui/progress";

function Pill({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
        ok
          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
          : "bg-muted text-muted-foreground"
      }`}
    >
      {ok ? "✓" : "○"} {label}
    </span>
  );
}

export default function ProfileSnapshotCard({ profile }: { profile: ProfileRow }) {
  const snap = computeProfileSnapshot(profile);

  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              Profile Strength Snapshot
            </h3>
            <p className="text-sm text-muted-foreground">
              {snap.completeness}% complete
            </p>
          </div>
          <div className="text-sm text-muted-foreground">
            Activities: {snap.activityCount}
          </div>
        </div>
        <Progress value={snap.completeness} className="h-2" />
      </div>

      <div className="flex flex-wrap gap-2">
        <Pill ok={snap.narrativeReady} label="Narrative Ready" />
        <Pill ok={snap.matchReady} label="Match Ready" />
        <Pill ok={snap.scholarshipReady} label="Scholarship Ready" />
      </div>

      {snap.missing.length > 0 && (
        <div className="mt-4 pt-4 border-t">
          <p className="text-sm font-medium text-muted-foreground mb-2">
            Suggested next fixes:
          </p>
          <ul className="text-sm text-muted-foreground space-y-1">
            {snap.missing.slice(0, 5).map((m) => (
              <li key={m} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50" />
                {m.split("_").join(" ")}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
