import { useNavigate } from "react-router-dom";
import OnboardingProgress from "@/onboarding/OnboardingProgress";
import { Button } from "@/components/ui/button";

export default function WelcomePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <OnboardingProgress active="basics" />
      <div className="max-w-xl mx-auto p-8 text-center space-y-6">
        <h1 className="text-3xl font-bold text-foreground">
          Let's build your plan.
        </h1>
        <p className="text-muted-foreground">
          In ~5 minutes you'll get: a college match list, a scholarship pipeline, and a clear next-7-days plan.
        </p>
        <Button size="lg" onClick={() => navigate("/onboarding/basics")}>
          Start
        </Button>
      </div>
    </div>
  );
}
