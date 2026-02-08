import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { ProfileExtras, ProfileRow } from "@/lib/profileUtils";
import ProfileSnapshotCard from "@/components/profile/ProfileSnapshotCard";
import ProfileCompletionWizard from "@/components/profile/ProfileCompletionWizard";
import ScholarshipOpportunityBanner from "@/components/profile/ScholarshipOpportunityBanner";
import ActivitiesEditor from "@/components/profile/ActivitiesEditor";
import PersonalStorySection from "@/components/profile/PersonalStorySection";
import TestScoresSection from "@/components/profile/TestScoresSection";
import VerificationSection from "@/components/profile/VerificationSection";
import VideoShowcaseSection from "@/components/profile/VideoShowcaseSection";
import AthleticAchievementsSection from "@/components/profile/AthleticAchievementsSection";
import AcademicAchievementsSection from "@/components/profile/AcademicAchievementsSection";
import CoreBasicsSection, { type CoreBasicsData } from "@/components/profile/CoreBasicsSection";
import { ApplicationMaterialsHub } from "@/components/application/ApplicationMaterialsHub";
import { ensureProfileRow, normalizeExtras, saveProfileExtras } from "@/lib/profileExtrasApi";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, BookOpen, Calculator, ShieldCheck, Video, Activity, Dumbbell, GraduationCap, Sparkles, FolderOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ProfilePage() {
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const showWizard = searchParams.get("wizard") === "true";
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [extras, setExtras] = useState<ProfileExtras>({});
  const [coreData, setCoreData] = useState<CoreBasicsData>({});
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const closeWizard = () => {
    searchParams.delete("wizard");
    setSearchParams(searchParams);
    load(); // Reload profile after wizard closes
  };

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
      
      // Set core data from database
      setCoreData({
        fullName: p.full_name || undefined,
        preferredName: p.preferred_name || undefined,
        graduationYear: p.grad_year || undefined,
        school: p.school || undefined,
        state: p.region || undefined,
        gpaUnweighted: p.gpa_unweighted || undefined,
        gpaWeighted: p.gpa_weighted || undefined,
        classRank: p.class_rank || undefined,
        courseworkRigor: p.coursework_rigor || undefined,
        intendedMajors: p.intended_majors || [],
        academicNarrative: p.academic_narrative || undefined,
        contextNotes: p.context_notes || undefined,
      });
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
      // Save extras (personal story, test scores, videos, verification)
      await saveProfileExtras(extras);
      
      // Save core profile data to the profiles table
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) {
        const { error: profileError } = await supabase
          .from("profiles")
          .update({
            full_name: coreData.fullName || null,
            preferred_name: coreData.preferredName || null,
            grad_year: coreData.graduationYear || null,
            graduation_year: coreData.graduationYear || null,
            school: coreData.school || null,
            region: coreData.state || null,
            gpa_unweighted: coreData.gpaUnweighted || null,
            gpa_weighted: coreData.gpaWeighted || null,
            class_rank: coreData.classRank || null,
            coursework_rigor: coreData.courseworkRigor || null,
            intended_majors: coreData.intendedMajors || null,
            academic_narrative: coreData.academicNarrative || null,
            context_notes: coreData.contextNotes || null,
          })
          .eq("id", userData.user.id);

        if (profileError) throw profileError;
      }
      
      await load();
      toast({
        title: "Profile saved",
        description: "Your profile has been updated successfully.",
      });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to save profile";
      setErr(message);
      toast({
        title: "Error saving profile",
        description: message,
        variant: "destructive",
      });
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

  // Show wizard mode
  if (showWizard) {
    return (
      <div className="space-y-6 p-6 max-w-2xl mx-auto animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Sparkles className="h-8 w-8 text-primary" />
              Boost Your Profile
            </h1>
            <p className="text-muted-foreground mt-1">
              Complete key fields to unlock more scholarship opportunities
            </p>
          </div>
          <Button variant="outline" onClick={closeWizard}>
            Exit Wizard
          </Button>
        </div>
        <ProfileCompletionWizard 
          onComplete={closeWizard}
          onFieldUpdate={() => {}}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">My Profile</h1>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => setSearchParams({ wizard: "true" })}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Boost Profile
          </Button>
          <Button onClick={save} disabled={saving} size="lg">
            {saving ? "Saving…" : "Save All Changes"}
          </Button>
        </div>
      </div>

      <ScholarshipOpportunityBanner compact />

      <ProfileSnapshotCard profile={profile} />

      <Tabs defaultValue="basics" className="w-full">
        <TabsList className="grid w-full grid-cols-5 md:grid-cols-9">
          <TabsTrigger value="basics" className="flex items-center gap-1 text-xs">
            <User className="h-4 w-4 hidden sm:inline" />
            <span className="hidden md:inline">Basics</span>
            <span className="md:hidden">Core</span>
          </TabsTrigger>
          <TabsTrigger value="story" className="flex items-center gap-1 text-xs">
            <BookOpen className="h-4 w-4 hidden sm:inline" />
            Story
          </TabsTrigger>
          <TabsTrigger value="activities" className="flex items-center gap-1 text-xs">
            <Activity className="h-4 w-4 hidden sm:inline" />
            <span className="hidden md:inline">Activities</span>
            <span className="md:hidden">Acts</span>
          </TabsTrigger>
          <TabsTrigger value="materials" className="flex items-center gap-1 text-xs">
            <FolderOpen className="h-4 w-4 hidden sm:inline" />
            <span className="hidden md:inline">Materials</span>
            <span className="md:hidden">Files</span>
          </TabsTrigger>
          <TabsTrigger value="tests" className="flex items-center gap-1 text-xs">
            <Calculator className="h-4 w-4 hidden sm:inline" />
            Tests
          </TabsTrigger>
          <TabsTrigger value="athletics" className="flex items-center gap-1 text-xs">
            <Dumbbell className="h-4 w-4 hidden sm:inline" />
            <span className="hidden md:inline">Athletics</span>
            <span className="md:hidden">Ath</span>
          </TabsTrigger>
          <TabsTrigger value="academics" className="flex items-center gap-1 text-xs">
            <GraduationCap className="h-4 w-4 hidden sm:inline" />
            <span className="hidden md:inline">Academics</span>
            <span className="md:hidden">Acad</span>
          </TabsTrigger>
          <TabsTrigger value="videos" className="flex items-center gap-1 text-xs">
            <Video className="h-4 w-4 hidden sm:inline" />
            <span className="hidden md:inline">Videos</span>
            <span className="md:hidden">Vid</span>
          </TabsTrigger>
          <TabsTrigger value="verification" className="flex items-center gap-1 text-xs">
            <ShieldCheck className="h-4 w-4 hidden sm:inline" />
            Docs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="basics" className="mt-6">
          <CoreBasicsSection
            data={coreData}
            onChange={setCoreData}
            onSave={save}
          />
        </TabsContent>

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

        <TabsContent value="materials" className="mt-6">
          <ApplicationMaterialsHub />
        </TabsContent>

        <TabsContent value="tests" className="mt-6">
          <TestScoresSection
            data={extras.testScores || {}}
            onChange={(testScores) => setExtras({ ...extras, testScores })}
            onSave={save}
          />
        </TabsContent>

        <TabsContent value="athletics" className="mt-6">
          <AthleticAchievementsSection
            data={extras.athleticAchievements || {}}
            onChange={(athleticAchievements) => setExtras({ ...extras, athleticAchievements })}
            onSave={save}
          />
        </TabsContent>

        <TabsContent value="academics" className="mt-6">
          <AcademicAchievementsSection
            data={extras.academicAchievements || {}}
            onChange={(academicAchievements) => setExtras({ ...extras, academicAchievements })}
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
