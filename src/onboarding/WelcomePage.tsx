// DO NOT EDIT VIA LOVABLE
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Target, Sparkles, DollarSign, GraduationCap, Star } from "lucide-react";
import { Link } from "react-router-dom";

const BENEFITS = [
  {
    icon: Sparkles,
    title: "Scholarships you actually qualify for",
    desc: "Stop wasting hours on applications you'll never win. We match you to real opportunities based on your real profile.",
  },
  {
    icon: GraduationCap,
    title: "Colleges ranked by fit AND affordability",
    desc: "Not just prestige. We show you where you're likely to get in and where you can actually afford to go.",
  },
  {
    icon: DollarSign,
    title: "AI Essay Coach with your story built in",
    desc: "Your essay coach knows your background, your achievements, and your goals — so feedback is actually useful.",
  },
  {
    icon: Star,
    title: "A focused direction that sets you apart",
    desc: "Students with a clear narrative win more scholarships and write better essays. This profile builds that narrative.",
  },
];

export default function WelcomePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="border-b px-4 py-3 flex items-center justify-between">
        <Link to="/" className="font-bold text-primary">College Compass</Link>
        <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
          Skip for now
        </Button>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-xl text-center space-y-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 mx-auto">
            <Target className="h-10 w-10 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3 leading-tight">
              Welcome to College Compass
            </h1>
            <p className="text-lg text-muted-foreground max-w-md mx-auto">
              You're about to build the most important document of your college journey.
            </p>
          </div>
          <div className="bg-muted/50 rounded-2xl p-5 text-left">
            <p className="text-sm font-semibold text-foreground mb-2">
              Most students apply to college with no strategy.
            </p>
            <p className="text-sm text-muted-foreground">
              They pick schools from a ranking list, write generic essays, and leave tens of thousands of dollars in scholarships on the table — not because they weren't qualified, but because they never told their story clearly.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              This profile changes that. In about 8 minutes, you'll give us everything we need to match you to the right schools, the right scholarships, and help you write the right essays.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
            {BENEFITS.map((b) => (
              <div key={b.title} className="flex items-start gap-3 rounded-xl border bg-card p-4">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <b.icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{b.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            ⏱ Takes about 8 minutes · You can save and continue later · All data is private
          </p>
          <Button
            size="lg"
            onClick={() => navigate("/onboarding/basics")}
            className="gap-2 text-base px-10 w-full sm:w-auto"
          >
            Start My Profile <ArrowRight className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
