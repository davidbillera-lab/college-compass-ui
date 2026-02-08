import { useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { StatCard } from "@/components/ui/stat-card";
import ProfileCompletionWizard from "@/components/profile/ProfileCompletionWizard";
import { 
  mockColleges, 
  mockScholarships, 
  mockNextActions,
  mockStudentProfile 
} from "@/lib/mockData";
import { 
  Target, 
  Award, 
  CheckCircle2, 
  Circle,
  ArrowRight,
  TrendingUp,
  GraduationCap,
  Sparkles,
  Calendar
} from "lucide-react";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const [showWizard, setShowWizard] = useState(false);
  const { userName, profileStrength, currentRole } = useApp();
  const firstName = userName.split(" ")[0];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Welcome back, {firstName}! 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            Here's what's happening with your college applications.
          </p>
        </div>
        <Button variant="hero" asChild>
          <Link to="/profile">
            Complete Profile
            <ArrowRight className="h-4 w-4 ml-1" />
          </Link>
        </Button>
      </div>

      {/* Profile Completion Wizard or Summary */}
      {showWizard ? (
        <ProfileCompletionWizard 
          onComplete={() => setShowWizard(false)}
          onFieldUpdate={() => {}}
        />
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
                <Progress 
                  value={profileStrength} 
                  variant="primary" 
                  indicatorVariant="gradient"
                  size="lg"
                  className="max-w-md"
                />
              </div>
              <div className="flex items-center gap-4">
                <div className="text-4xl font-bold text-primary">
                  {profileStrength}%
                </div>
                <Button variant="outline" onClick={() => setShowWizard(true)}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Boost Profile
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="College Matches"
          value="12"
          subtitle="3 new this week"
          icon={GraduationCap}
          variant="primary"
        />
        <StatCard
          title="Scholarship Matches"
          value="8"
          subtitle="$45,000 potential"
          icon={Award}
          variant="success"
        />
        <StatCard
          title="Profile Views"
          value="24"
          subtitle="+12% from last week"
          icon={TrendingUp}
          trend={{ value: 12, label: "vs last week", positive: true }}
        />
        <StatCard
          title="Days to Deadline"
          value="18"
          subtitle="Next: Jan 15"
          icon={Calendar}
          variant="warning"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Next Best Actions */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Next Best Actions
            </CardTitle>
            <CardDescription>Your personalized to-do list</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {mockNextActions.slice(0, 5).map((action) => (
                <li key={action.id} className="flex items-start gap-3">
                  {action.completed ? (
                    <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  )}
                  <span className={`text-sm ${action.completed ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                    {action.title}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* College Fit Snapshot */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-primary" />
                College Fit Snapshot
              </CardTitle>
              <CardDescription>Top matches based on your profile</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/colleges">View All</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockColleges.map((college) => (
                <div 
                  key={college.id} 
                  className="flex items-center justify-between p-4 rounded-lg border border-border hover:border-primary/20 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary-light flex items-center justify-center">
                      <GraduationCap className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">{college.name}</h4>
                      <p className="text-sm text-muted-foreground">{college.location}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={college.fitCategory}>
                      {college.fitCategory.charAt(0).toUpperCase() + college.fitCategory.slice(1)}
                    </Badge>
                    <span className="text-lg font-semibold text-primary">{college.fitScore}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Scholarships Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-accent" />
              Scholarship Matches
            </CardTitle>
            <CardDescription>Opportunities that fit your profile</CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/scholarships">View All</Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockScholarships.slice(0, 3).map((scholarship) => (
              <Card key={scholarship.id} variant="interactive" className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <Badge variant="info" size="sm">{scholarship.eligibility}% Match</Badge>
                  <Badge variant={scholarship.effort === 'low' ? 'success' : scholarship.effort === 'medium' ? 'warning' : 'secondary'} size="sm">
                    {scholarship.effort} effort
                  </Badge>
                </div>
                <h4 className="font-semibold text-foreground mb-1">{scholarship.name}</h4>
                <p className="text-2xl font-bold text-primary mb-2">
                  ${scholarship.amount.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">
                  Deadline: {new Date(scholarship.deadline).toLocaleDateString()}
                </p>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
