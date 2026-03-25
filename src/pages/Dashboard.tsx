import * as React from "react";
import { useApp } from "@/contexts/AppContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { StatCard } from "@/components/ui/stat-card";
import { PremiumUpgradeCard } from "@/components/subscription/PremiumUpgradeCard";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Target, Award, CheckCircle2, Circle, ArrowRight,
  TrendingUp, GraduationCap, Sparkles, Calendar, AlertCircle,
  FolderOpen,
} from "lucide-react";
import { fetchMaterials, calcPortfolioCompleteness } from "@/lib/portfolioApi";
import { Link } from "react-router-dom";

const ProfileCompletionWizard = React.lazy(() =>
  import("@/components/profile/ProfileCompletionWizard")
);

interface DashboardStats {
  collegeMatchCount: number;
  scholarshipMatchCount: number;
  scholarshipPotentialUsd: number;
  nextDeadlineDays: number | null;
  nextDeadlineLabel: string | null;
}

interface CollegeMatchRow {
  id: string;
  bucket: string;
  fit_score: number;
  colleges: { name: string; city: string | null; state: string | null } | null;
}

interface ScholarshipMatchRow {
  id: string;
  score: number;
  scholarships: {
    name: string;
    amount_max_usd: number | null;
    amount_usd: number | null;
    deadline_date: string | null;
  } | null;
}

interface TaskRow {
  id: string;
  title: string;
  completed_at: string | null;
  due_at: string | null;
  priority: number;
}

function fitBadgeVariant(bucket: string): "default" | "secondary" | "destructive" {
  if (bucket === "likely" || bucket === "safety") return "default";
  if (bucket === "target") return "secondary";
  return "destructive";
}

function fitBadgeLabel(bucket: string): string {
  const map: Record<string, string> = {
    likely: "Likely", safety: "Safety", target: "Target",
    reach: "Reach", unlikely: "Unlikely",
  };
  return map[bucket] ?? bucket;
}

export default function Dashboard() {
  const [showWizard, setShowWizard] = React.useState(false);
  const { userName, profileStrength } = useApp();
  const { user } = useAuth();
  const firstName = userName.split(" ")[0];

  const [stats, setStats] = React.useState<DashboardStats | null>(null);
  const [collegeMatches, setCollegeMatches] = React.useState<CollegeMatchRow[]>([]);
  const [scholarshipMatches, setScholarshipMatches] = React.useState<ScholarshipMatchRow[]>([]);
  const [tasks, setTasks] = React.useState<TaskRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [portfolioScore, setPortfolioScore] = React.useState(0);
  const [portfolioCount, setPortfolioCount] = React.useState(0);

  React.useEffect(() => {
    if (!user) return;
    async function loadDashboard() {
      setLoading(true);
      setError(null);
      try {
        const [cmRes, smRes, taskRes] = await Promise.all([
          supabase
            .from("college_matches")
            .select("id, bucket, fit_score, colleges(name, city, state)")
            .eq("student_id", user!.id)
            .order("fit_score", { ascending: false })
            .limit(5),
          supabase
            .from("scholarship_matches")
            .select("id, score, scholarships(name, amount_max_usd, amount_usd, deadline_date)")
            .eq("user_id", user!.id)
            .eq("eligibility_status", "eligible")
            .order("score", { ascending: false })
            .limit(3),
          supabase
            .from("tasks")
            .select("id, title, completed_at, due_at, priority")
            .eq("student_id", user!.id)
            .order("completed_at", { ascending: true, nullsFirst: true })
            .order("priority", { ascending: false })
            .limit(5),
        ]);

        if (cmRes.error) throw cmRes.error;
        if (smRes.error) throw smRes.error;
        if (taskRes.error) throw taskRes.error;

        // Portfolio completeness
        try {
          const mats = await fetchMaterials(user!.id);
          const { score } = calcPortfolioCompleteness(mats);
          setPortfolioScore(score);
          setPortfolioCount(mats.length);
        } catch {
          // non-critical, ignore
        }

        const colleges = (cmRes.data ?? []) as unknown as CollegeMatchRow[];
        const scholarships = (smRes.data ?? []) as unknown as ScholarshipMatchRow[];
        const taskList = (taskRes.data ?? []) as TaskRow[];

        setCollegeMatches(colleges);
        setScholarshipMatches(scholarships);
        setTasks(taskList);

        const potential = scholarships.reduce((sum, sm) => {
          return sum + (sm.scholarships?.amount_max_usd ?? sm.scholarships?.amount_usd ?? 0);
        }, 0);

        const now = new Date();
        const upcomingDeadlines = scholarships
          .map((sm) => sm.scholarships?.deadline_date)
          .filter(Boolean)
          .map((d) => new Date(d!))
          .filter((d) => d > now)
          .sort((a, b) => a.getTime() - b.getTime());

        const nextDeadline = upcomingDeadlines[0] ?? null;
        setStats({
          collegeMatchCount: colleges.length,
          scholarshipMatchCount: scholarships.length,
          scholarshipPotentialUsd: potential,
          nextDeadlineDays: nextDeadline
            ? Math.ceil((nextDeadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
            : null,
          nextDeadlineLabel: nextDeadline
            ? nextDeadline.toLocaleDateString("en-US", { month: "short", day: "numeric" })
            : null,
        });
      } catch (err) {
        console.error("Dashboard load error:", err);
        setError("Could not load your dashboard data. Please try refreshing.");
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, [user]);

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency", currency: "USD", maximumFractionDigits: 0,
    }).format(n);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Welcome back, {firstName}! 👋</h1>
          <p className="text-muted-foreground mt-1">Here's what's happening with your college applications.</p>
        </div>
        <Button variant="hero" asChild>
          <Link to="/profile">Complete Profile <ArrowRight className="h-4 w-4 ml-1" /></Link>
        </Button>
      </div>

      {/* Error Banner */}
      {error && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="py-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Profile Completion Wizard or Strength Card */}
      {showWizard ? (
        <React.Suspense fallback={<Card className="animate-pulse p-8"><div className="h-8 bg-muted rounded w-1/3 mb-4" /></Card>}>
          <ProfileCompletionWizard onComplete={() => setShowWizard(false)} onFieldUpdate={() => {}} />
        </React.Suspense>
      ) : (
        <Card variant="highlight">
          <CardContent className="py-6">
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold text-foreground">Profile Strength</h3>
                  <Badge variant={profileStrength >= 80 ? "success" : profileStrength >= 50 ? "warning" : "secondary"}>
                    {profileStrength >= 80 ? "Strong" : profileStrength >= 50 ? "Good" : "Needs Work"}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Complete your profile to unlock more college matches and scholarship opportunities.
                </p>
                <Progress value={profileStrength} variant="primary" indicatorVariant="gradient" size="lg" className="max-w-md" />
              </div>
              <div className="flex items-center gap-4">
                <div className="text-4xl font-bold text-primary">{profileStrength}%</div>
                <Button variant="outline" onClick={() => setShowWizard(true)}>
                  <Sparkles className="h-4 w-4 mr-2" />Boost Profile
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="py-6">
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-4 w-24" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <StatCard
              title="College Matches"
              value={stats?.collegeMatchCount ?? 0}
              subtitle={stats?.collegeMatchCount ? "Based on your profile" : "Complete profile to see matches"}
              icon={GraduationCap}
              variant="primary"
            />
            <StatCard
              title="Scholarship Matches"
              value={stats?.scholarshipMatchCount ?? 0}
              subtitle={stats?.scholarshipPotentialUsd ? `${fmt(stats.scholarshipPotentialUsd)} potential` : "Complete profile to see matches"}
              icon={Award}
              variant="success"
            />
            <StatCard
              title="Profile Strength"
              value={`${profileStrength}%`}
              subtitle="Keep building your story"
              icon={TrendingUp}
              trend={profileStrength > 0 ? { value: profileStrength, label: "complete", positive: true } : undefined}
            />
            <StatCard
              title="Days to Deadline"
              value={stats?.nextDeadlineDays ?? "—"}
              subtitle={stats?.nextDeadlineLabel ? `Next: ${stats.nextDeadlineLabel}` : "No upcoming deadlines"}
              icon={Calendar}
              variant={stats?.nextDeadlineDays && stats.nextDeadlineDays <= 14 ? "warning" : undefined}
            />
          </>
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <PremiumUpgradeCard />
        </div>

        {/* Next Best Actions — real tasks from DB */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />Next Best Actions
            </CardTitle>
            <CardDescription>Your personalized to-do list</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-6 w-full" />)}
              </div>
            ) : tasks.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Target className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No tasks yet.</p>
                <p className="text-xs mt-1">Complete your profile to generate your action plan.</p>
                <Button variant="outline" size="sm" className="mt-3" asChild>
                  <Link to="/profile">Build Profile</Link>
                </Button>
              </div>
            ) : (
              <ul className="space-y-3">
                {tasks.map((task) => (
                  <li key={task.id} className="flex items-start gap-3">
                    {task.completed_at
                      ? <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                      : <Circle className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />}
                    <span className={`text-sm ${task.completed_at ? "text-muted-foreground line-through" : "text-foreground"}`}>
                      {task.title}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* College Fit Snapshot — real college_matches from DB */}
        <Card className="lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-primary" />College Fit Snapshot
              </CardTitle>
              <CardDescription>Top matches based on your profile</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/colleges">View All</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
              </div>
            ) : collegeMatches.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <GraduationCap className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm font-medium">No college matches yet.</p>
                <p className="text-xs mt-1 max-w-xs mx-auto">
                  Finish your profile and visit the Discovery page to generate your personalized college list.
                </p>
                <Button variant="outline" size="sm" className="mt-4" asChild>
                  <Link to="/discovery">Explore Colleges</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {collegeMatches.map((match) => (
                  <div key={match.id} className="flex items-center justify-between p-4 rounded-lg border border-border hover:border-primary/20 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-primary-light flex items-center justify-center">
                        <GraduationCap className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground">{match.colleges?.name ?? "Unknown College"}</h4>
                        <p className="text-sm text-muted-foreground">
                          {[match.colleges?.city, match.colleges?.state].filter(Boolean).join(", ")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={fitBadgeVariant(match.bucket)}>{fitBadgeLabel(match.bucket)}</Badge>
                      <span className="text-lg font-semibold text-primary">{match.fit_score}%</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Portfolio Completeness Widget */}
      <Card variant="interactive">
        <CardContent className="py-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <FolderOpen className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-sm">Application Portfolio</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {portfolioCount > 0
                    ? `${portfolioCount} material${portfolioCount !== 1 ? 's' : ''} uploaded · ${portfolioScore}% of priority categories filled`
                    : 'Upload transcripts, awards, activities, and more'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {portfolioCount > 0 && (
                <div className="text-right hidden sm:block">
                  <span className="text-2xl font-bold text-primary">{portfolioScore}%</span>
                  <p className="text-xs text-muted-foreground">complete</p>
                </div>
              )}
              <Button variant="outline" size="sm" asChild>
                <Link to="/portfolio">
                  {portfolioCount > 0 ? 'View Portfolio' : 'Start Portfolio'}
                  <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                </Link>
              </Button>
            </div>
          </div>
          {portfolioCount > 0 && (
            <Progress value={portfolioScore} className="h-1.5 mt-4" />
          )}
        </CardContent>
      </Card>

      {/* Scholarships Section — real scholarship_matches from DB */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-accent" />Scholarship Matches
            </CardTitle>
            <CardDescription>Opportunities that fit your profile</CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/scholarships-intel">View All</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-lg" />)}
            </div>
          ) : scholarshipMatches.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Award className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm font-medium">No scholarship matches yet.</p>
              <p className="text-xs mt-1 max-w-xs mx-auto">
                Complete your profile and visit Scholarships Intel to find opportunities you qualify for.
              </p>
              <Button variant="outline" size="sm" className="mt-4" asChild>
                <Link to="/scholarships-intel">Find Scholarships</Link>
              </Button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {scholarshipMatches.map((sm) => (
                <Card key={sm.id} variant="interactive" className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <Badge variant="info" size="sm">{sm.score}% Match</Badge>
                    {sm.scholarships?.deadline_date && (
                      <span className="text-xs text-muted-foreground">
                        Due {new Date(sm.scholarships.deadline_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    )}
                  </div>
                  <h4 className="font-semibold text-foreground mb-1 line-clamp-2">
                    {sm.scholarships?.name ?? "Scholarship"}
                  </h4>
                  {(sm.scholarships?.amount_max_usd ?? sm.scholarships?.amount_usd) ? (
                    <p className="text-2xl font-bold text-primary">
                      {fmt(sm.scholarships?.amount_max_usd ?? sm.scholarships?.amount_usd ?? 0)}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">Amount varies</p>
                  )}
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
