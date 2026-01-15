import { useEffect, useState } from "react";
import type { ProfileExtras, ProfileRow } from "@/lib/profileUtils";
import ProfileSnapshotCard from "@/components/profile/ProfileSnapshotCard";
import ActivitiesEditor from "@/components/profile/ActivitiesEditor";
import PersonalStorySection from "@/components/profile/PersonalStorySection";
import TestScoresSection from "@/components/profile/TestScoresSection";
import VerificationSection from "@/components/profile/VerificationSection";
import VideoShowcaseSection from "@/components/profile/VideoShowcaseSection";
import { ensureProfileRow, normalizeExtras, saveProfileExtras } from "@/lib/profileExtrasApi";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, BookOpen, Calculator, ShieldCheck, Video, Activity } from "lucide-react";

export default function ProfilePage() {
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
    <div className="space-y-6 p-6 max-w-4xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">My Profile</h1>
        <Button onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save All Changes"}
        </Button>
      </div>

      <ProfileSnapshotCard profile={profile} />

      <Tabs defaultValue="story" className="w-full">
        <TabsList className="grid w-full grid-cols-5 lg:grid-cols-5">
          <TabsTrigger value="story" className="flex items-center gap-1 text-xs sm:text-sm">
            <BookOpen className="h-4 w-4 hidden sm:inline" />
            Story
          </TabsTrigger>
          <TabsTrigger value="activities" className="flex items-center gap-1 text-xs sm:text-sm">
            <Activity className="h-4 w-4 hidden sm:inline" />
            Activities
          </TabsTrigger>
          <TabsTrigger value="tests" className="flex items-center gap-1 text-xs sm:text-sm">
            <Calculator className="h-4 w-4 hidden sm:inline" />
            Tests
          </TabsTrigger>
          <TabsTrigger value="videos" className="flex items-center gap-1 text-xs sm:text-sm">
            <Video className="h-4 w-4 hidden sm:inline" />
            Videos
          </TabsTrigger>
          <TabsTrigger value="verification" className="flex items-center gap-1 text-xs sm:text-sm">
            <ShieldCheck className="h-4 w-4 hidden sm:inline" />
            Docs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="story" className="mt-6">
          <PersonalStorySection
            data={extras.personalStory || {}}
            onChange={(personalStory) => setExtras({ ...extras, personalStory })}
            onSave={save}
          />
        </TabsContent>

        <TabsContent value="activities" className="mt-6">
          <ActivitiesEditor
            extras={extras}
            onChange={(next) => setExtras(next)}
          />
        </TabsContent>

        <TabsContent value="tests" className="mt-6">
          <TestScoresSection
            data={extras.testScores || {}}
            onChange={(testScores) => setExtras({ ...extras, testScores })}
            onSave={save}
          />
        </TabsContent>

        <TabsContent value="videos" className="mt-6">
          <VideoShowcaseSection
            data={extras.videoShowcase || {}}
            onChange={(videoShowcase) => setExtras({ ...extras, videoShowcase })}
            onSave={save}
          />
        </TabsContent>

        <TabsContent value="verification" className="mt-6">
          <VerificationSection
            data={extras.verification || {}}
            onChange={(verification) => setExtras({ ...extras, verification })}
            onSave={save}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
