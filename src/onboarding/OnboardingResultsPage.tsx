import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import OnboardingProgress from "@/onboarding/OnboardingProgress";
import { ensureProfileRow } from "@/lib/profileExtrasApi";
import { computeProfileSnapshot } from "@/lib/profileUtils";
import { Button } from "@/components/ui/button";
import { CheckCircle, Circle } from "lucide-react";

export default function OnboardingResultsPage() {
  const nav = useNavigate();
  const [snap, setSnap] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const prof = await ensureProfileRow();
      setSnap(computeProfileSnapshot(prof as any));
    })();
  }, []);

  if (!snap) return <p className="p-8 text-muted-foreground">Loading…</p>;

  const allReady = snap.narrativeReady && snap.matchReady && snap.scholarshipReady;

  return (
    <div className="min-h-screen bg-background">
      <OnboardingProgress active="results" />
      <div className="max-w-xl mx-auto p-8 space-y-6">
        <h1 className="text-2xl font-bold text-foreground">You're All Set!</h1>
        
        <div className="p-6 border rounded-lg bg-card space-y-4">
          <div className="text-center">
            <span className="text-4xl font-bold text-primary">{snap.completeness}%</span>
            <p className="text-sm text-muted-foreground mt-1">Profile Complete</p>
          </div>

          <div className="space-y-2">
            <ReadinessItem ready={snap.narrativeReady} label="Narrative Ready" />
            <ReadinessItem ready={snap.matchReady} label="Match Ready" />
            <ReadinessItem ready={snap.scholarshipReady} label="Scholarship Ready" />
          </div>

          {snap.activityCount > 0 && (
            <p className="text-sm text-muted-foreground text-center">
              {snap.activityCount} {snap.activityCount === 1 ? "activity" : "activities"} added
            </p>
          )}
        </div>

        {!allReady && snap.missing.length > 0 && (
          <div className="text-sm text-muted-foreground">
            <p className="font-medium mb-2">Still missing:</p>
            <ul className="list-disc list-inside space-y-1">
              {snap.missing.slice(0, 3).map((m: string) => (
                <li key={m}>{m.replace(/_/g, " ")}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="pt-4 flex gap-3">
          <Button variant="outline" onClick={() => nav("/onboarding/activities")}>Back</Button>
          <Button onClick={() => nav("/dashboard")}>Go to Dashboard</Button>
        </div>
      </div>
    </div>
  );
}

function ReadinessItem({ ready, label }: { ready: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2">
      {ready ? (
        <CheckCircle className="h-5 w-5 text-green-500" />
      ) : (
        <Circle className="h-5 w-5 text-muted-foreground" />
      )}
      <span className={ready ? "text-foreground" : "text-muted-foreground"}>{label}</span>
    </div>
  );
}
