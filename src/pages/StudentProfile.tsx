import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  User,
  GraduationCap,
  Trophy,
  Heart,
  FileText,
  CheckCircle2,
  Circle,
  Pencil,
} from "lucide-react";

import CoreIdentitySection from "@/components/profile/CoreIdentitySection";
import AcademicProfileSection from "@/components/profile/AcademicProfileSection";
import ActivitiesSection from "@/components/profile/ActivitiesSection";
import InterestsValuesSection from "@/components/profile/InterestsValuesSection";
import WritingLibrarySection from "@/components/profile/WritingLibrarySection";

// Profile section definitions
const sections = [
  { id: "identity", label: "Core Identity", icon: User, description: "Your name, school, and background" },
  { id: "academic", label: "Academics", icon: GraduationCap, description: "GPA, courses, and test scores" },
  { id: "activities", label: "Activities & Impact", icon: Trophy, description: "Extracurriculars and achievements" },
  { id: "interests", label: "Interests & Values", icon: Heart, description: "What drives you" },
  { id: "writing", label: "Writing Library", icon: FileText, description: "Essays and artifacts" },
];

export default function StudentProfile() {
  const [activeTab, setActiveTab] = useState("identity");
  
  // Mock completion state (would come from persistent storage)
  const [completion, setCompletion] = useState({
    identity: 80,
    academic: 60,
    activities: 40,
    interests: 20,
    writing: 0,
  });

  const overallProgress = Math.round(
    Object.values(completion).reduce((a, b) => a + b, 0) / Object.values(completion).length
  );

  const handleSectionComplete = (sectionId: string, value: number) => {
    setCompletion((prev) => ({ ...prev, [sectionId]: value }));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Your Profile</h1>
          <p className="text-muted-foreground mt-1">
            Build your narrative-driven profile to unlock personalized college and scholarship matches.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Profile Strength</p>
            <p className="text-2xl font-bold text-primary">{overallProgress}%</p>
          </div>
          <div className="w-24">
            <Progress value={overallProgress} className="h-3" />
          </div>
        </div>
      </div>

      {/* Section Progress Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {sections.map((section) => {
          const Icon = section.icon;
          const progress = completion[section.id as keyof typeof completion];
          const isComplete = progress >= 80;

          return (
            <button
              key={section.id}
              onClick={() => setActiveTab(section.id)}
              className={`p-4 rounded-xl border text-left transition-all hover:border-primary/50 hover:shadow-soft ${
                activeTab === section.id
                  ? "border-primary bg-primary-light/50 ring-1 ring-primary/20"
                  : "border-border bg-card"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <Icon className={`h-5 w-5 ${activeTab === section.id ? "text-primary" : "text-muted-foreground"}`} />
                {isComplete ? (
                  <CheckCircle2 className="h-4 w-4 text-success" />
                ) : (
                  <Circle className="h-4 w-4 text-muted-foreground/50" />
                )}
              </div>
              <p className={`text-sm font-medium ${activeTab === section.id ? "text-primary" : "text-foreground"}`}>
                {section.label}
              </p>
              <div className="mt-2">
                <Progress value={progress} className="h-1" />
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="hidden">
          {sections.map((section) => (
            <TabsTrigger key={section.id} value={section.id}>
              {section.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="identity" className="mt-0">
          <CoreIdentitySection onComplete={(v) => handleSectionComplete("identity", v)} />
        </TabsContent>

        <TabsContent value="academic" className="mt-0">
          <AcademicProfileSection onComplete={(v) => handleSectionComplete("academic", v)} />
        </TabsContent>

        <TabsContent value="activities" className="mt-0">
          <ActivitiesSection onComplete={(v) => handleSectionComplete("activities", v)} />
        </TabsContent>

        <TabsContent value="interests" className="mt-0">
          <InterestsValuesSection onComplete={(v) => handleSectionComplete("interests", v)} />
        </TabsContent>

        <TabsContent value="writing" className="mt-0">
          <WritingLibrarySection onComplete={(v) => handleSectionComplete("writing", v)} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
