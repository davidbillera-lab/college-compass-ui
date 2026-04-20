import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  GraduationCap, 
  DollarSign, 
  Calendar, 
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertCircle,
  Target,
  FileText,
  BookOpen
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { trackParentView } from "@/lib/analytics";
import { format, differenceInDays, isPast } from "date-fns";
import { demoJuniorProfile, demoParentProgress } from "@/lib/demoStudent";

interface StudentProgress {
  profileCompletion: number;
  scholarshipsInPipeline: number;
  scholarshipsApplied: number;
  potentialAwardAmount: number;
  collegesOnLists: number;
  upcomingDeadlines: Array<{
    name: string;
    deadline: string;
    daysRemaining: number;
    type: 'scholarship' | 'college';
  }>;
  recentActivity: Array<{
    action: string;
    item: string;
    timestamp: string;
  }>;
  essaysCompleted: number;
  materialsUploaded: number;
}

export default function ParentDashboard() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const isDemoMode = searchParams.get("guest") === "true" && searchParams.get("demo") === "junior";
  const [progress, setProgress] = useState<StudentProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [studentName, setStudentName] = useState<string>("Your Student");

  const fetchStudentProgress = useCallback(async () => {
    if (isDemoMode) {
      setStudentName(demoJuniorProfile.preferred_name);
      setProgress(demoParentProgress);
      setLoading(false);
      return;
    }

    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Fetch profile for completion and name
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profile?.preferred_name || profile?.full_name) {
        setStudentName(profile.preferred_name || profile.full_name || "Your Student");
      }

      // Calculate profile completion
      const profileFields = [
        'full_name', 'graduation_year', 'school', 'gpa_unweighted', 
        'sat_score', 'act_score', 'intended_majors', 'interests'
      ];
      const filledFields = profileFields.filter(f => profile?.[f as keyof typeof profile]);
      const profileCompletion = Math.round((filledFields.length / profileFields.length) * 100);

      // Fetch scholarship pipeline
      const { data: scholarships } = await supabase
        .from("scholarship_pipeline_items")
        .select(`
          *,
          scholarship:scholarships(name, deadline_date, amount_max_usd)
        `)
        .eq("student_id", user.id);

      const scholarshipsInPipeline = scholarships?.length || 0;
      const scholarshipsApplied = scholarships?.filter(s => s.pipeline_status === "SUBMITTED").length || 0;
      const potentialAwardAmount = scholarships?.reduce((sum, s) => {
        return sum + (s.scholarship?.amount_max_usd || 0);
      }, 0) || 0;

      // Fetch college lists
      const { data: collegeLists } = await supabase
        .from("college_lists")
        .select("id")
        .eq("user_id", user.id);

      const listIds = collegeLists?.map(l => l.id) || [];
      let collegesOnLists = 0;
      
      if (listIds.length > 0) {
        const { count } = await supabase
          .from("college_list_items")
          .select("*", { count: "exact", head: true })
          .in("list_id", listIds);
        collegesOnLists = count || 0;
      }

      // Fetch application materials
      const { data: materials } = await supabase
        .from("application_materials")
        .select("id, category")
        .eq("user_id", user.id);

      const materialsUploaded = materials?.length || 0;
      const essaysCompleted = materials?.filter(m => m.category === "essay").length || 0;

      // Build upcoming deadlines
      const upcomingDeadlines: StudentProgress['upcomingDeadlines'] = [];
      
      scholarships?.forEach(s => {
        if (s.scholarship?.deadline_date && s.pipeline_status !== "SUBMITTED") {
          const deadline = new Date(s.scholarship.deadline_date);
          if (!isPast(deadline)) {
            upcomingDeadlines.push({
              name: s.scholarship.name,
              deadline: s.scholarship.deadline_date,
              daysRemaining: differenceInDays(deadline, new Date()),
              type: 'scholarship'
            });
          }
        }
      });

      // Sort by days remaining
      upcomingDeadlines.sort((a, b) => a.daysRemaining - b.daysRemaining);

      // Recent activity (mock for now - would need an activity log table)
      const recentActivity: StudentProgress['recentActivity'] = [];

      setProgress({
        profileCompletion,
        scholarshipsInPipeline,
        scholarshipsApplied,
        potentialAwardAmount,
        collegesOnLists,
        upcomingDeadlines: upcomingDeadlines.slice(0, 5),
        recentActivity,
        essaysCompleted,
        materialsUploaded
      });
    } catch (error) {
      console.error("Error fetching student progress:", error);
    } finally {
      setLoading(false);
    }
  }, [isDemoMode, user]);

  useEffect(() => {
    trackParentView("dashboard");
    void fetchStudentProgress();
  }, [fetchStudentProgress]);

  if (loading) {
    return (
      <div className="container py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Parent Dashboard
        </h1>
        <p className="text-muted-foreground">
          Track {studentName}'s college application progress
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Profile Complete</p>
                <p className="text-2xl font-bold">{progress?.profileCompletion}%</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Target className="h-6 w-6 text-primary" />
              </div>
            </div>
            <Progress value={progress?.profileCompletion} className="mt-3" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Scholarships</p>
                <p className="text-2xl font-bold">
                  {progress?.scholarshipsApplied}/{progress?.scholarshipsInPipeline}
                </p>
                <p className="text-xs text-muted-foreground">applied/in pipeline</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Potential Awards</p>
                <p className="text-2xl font-bold">
                  ${(progress?.potentialAwardAmount || 0).toLocaleString()}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Colleges Saved</p>
                <p className="text-2xl font-bold">{progress?.collegesOnLists}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                <GraduationCap className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Application Materials */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Application Materials
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Essays Completed</p>
                  <p className="text-sm text-muted-foreground">Personal statements, supplements</p>
                </div>
              </div>
              <Badge variant="outline" className="text-lg px-3">
                {progress?.essaysCompleted}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Total Materials</p>
                  <p className="text-sm text-muted-foreground">Essays, portfolios, transcripts</p>
                </div>
              </div>
              <Badge variant="outline" className="text-lg px-3">
                {progress?.materialsUploaded}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Deadlines */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Upcoming Deadlines
            </CardTitle>
          </CardHeader>
          <CardContent>
            {progress?.upcomingDeadlines && progress.upcomingDeadlines.length > 0 ? (
              <div className="space-y-3">
                {progress.upcomingDeadlines.map((deadline, i) => (
                  <div 
                    key={i} 
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                        deadline.daysRemaining <= 7 
                          ? "bg-red-100" 
                          : deadline.daysRemaining <= 14 
                          ? "bg-yellow-100" 
                          : "bg-green-100"
                      }`}>
                        {deadline.daysRemaining <= 7 ? (
                          <AlertCircle className="h-4 w-4 text-red-600" />
                        ) : deadline.daysRemaining <= 14 ? (
                          <Clock className="h-4 w-4 text-yellow-600" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-sm line-clamp-1">{deadline.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(deadline.deadline), "MMM d, yyyy")}
                        </p>
                      </div>
                    </div>
                    <Badge 
                      variant={deadline.daysRemaining <= 7 ? "destructive" : "outline"}
                      className="text-xs"
                    >
                      {deadline.daysRemaining}d
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No upcoming deadlines</p>
                <p className="text-sm">Scholarships will appear here once added to pipeline</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Progress Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Application Journey Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-4">
            <div className="text-center p-4 rounded-lg bg-muted/30">
              <div className={`w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center ${
                (progress?.profileCompletion || 0) >= 80 ? "bg-green-100" : "bg-yellow-100"
              }`}>
                {(progress?.profileCompletion || 0) >= 80 ? (
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                ) : (
                  <Clock className="h-6 w-6 text-yellow-600" />
                )}
              </div>
              <p className="font-medium">Profile</p>
              <p className="text-sm text-muted-foreground">
                {(progress?.profileCompletion || 0) >= 80 ? "Complete" : "In Progress"}
              </p>
            </div>

            <div className="text-center p-4 rounded-lg bg-muted/30">
              <div className={`w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center ${
                (progress?.collegesOnLists || 0) >= 5 ? "bg-green-100" : "bg-yellow-100"
              }`}>
                {(progress?.collegesOnLists || 0) >= 5 ? (
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                ) : (
                  <Clock className="h-6 w-6 text-yellow-600" />
                )}
              </div>
              <p className="font-medium">College List</p>
              <p className="text-sm text-muted-foreground">
                {progress?.collegesOnLists || 0} schools saved
              </p>
            </div>

            <div className="text-center p-4 rounded-lg bg-muted/30">
              <div className={`w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center ${
                (progress?.scholarshipsInPipeline || 0) >= 5 ? "bg-green-100" : "bg-yellow-100"
              }`}>
                {(progress?.scholarshipsInPipeline || 0) >= 5 ? (
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                ) : (
                  <Clock className="h-6 w-6 text-yellow-600" />
                )}
              </div>
              <p className="font-medium">Scholarships</p>
              <p className="text-sm text-muted-foreground">
                {progress?.scholarshipsInPipeline || 0} in pipeline
              </p>
            </div>

            <div className="text-center p-4 rounded-lg bg-muted/30">
              <div className={`w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center ${
                (progress?.essaysCompleted || 0) >= 3 ? "bg-green-100" : "bg-yellow-100"
              }`}>
                {(progress?.essaysCompleted || 0) >= 3 ? (
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                ) : (
                  <Clock className="h-6 w-6 text-yellow-600" />
                )}
              </div>
              <p className="font-medium">Essays</p>
              <p className="text-sm text-muted-foreground">
                {progress?.essaysCompleted || 0} completed
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
