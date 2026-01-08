import { useEffect, useState } from "react";
import type { ProfileExtras, ProfileRow } from "@/lib/profileUtils";
import ProfileSnapshotCard from "@/components/profile/ProfileSnapshotCard";
import ActivitiesEditor from "@/components/profile/ActivitiesEditor";
import { ensureProfileRow, normalizeExtras, saveProfileExtras } from "@/lib/profileExtrasApi";
import { Button } from "@/components/ui/button";

export default function StudentProfile() {
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [extras, setExtras] = useState<ProfileExtras>({});
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setErr(null);
    try {
      const p = await ensureProfileRow();
      // Map database row to ProfileRow type
      const mapped: ProfileRow = {
        id: p.id,
        full_name: p.full_name,
        grad_year: p.grad_year,
        gpa_unweighted: p.gpa_unweighted,
        gpa_weighted: p.gpa_weighted,
        test_policy: p.test_policy,
        sat_score: p.sat_score,
        act_score: p.act_score,
        intended_major: p.intended_majors?.join(", ") ?? null,
        intended_majors: p.intended_majors,
        regions: p.region,
        region: p.region,
        budget_max_usd: p.budget_max_usd,
        campus_size: p.campus_size,
        values: p.values,
        proud_moment: p.proud_moment,
        challenge: p.challenge,
        impact: p.impact,
        profile_extras: p.profile_extras as ProfileExtras | null,
      };
      setProfile(mapped);
      setExtras(normalizeExtras(p.profile_extras));
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to load profile";
      setErr(message);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function save() {
    setSaving(true);
    setErr(null);
    try {
      await saveProfileExtras(extras);
      await load();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to save extras";
      setErr(message);
    } finally {
      setSaving(false);
    }
  }

  if (err) {
    return (
      <div className="p-6 text-center text-destructive">
        <p>{err}</p>
        <Button variant="outline" className="mt-4" onClick={load}>
          Retry
        </Button>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-6 text-center text-muted-foreground">Loading…</div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-3xl font-bold text-foreground">Profile</h1>

      <ProfileSnapshotCard profile={profile} />

      <ActivitiesEditor
        extras={extras}
        onChange={(next) => setExtras(next)}
      />

      <div className="flex justify-end">
        <Button onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save extras"}
        </Button>
      </div>
    </div>
  );
}
