import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getNextOnboardingStep, stepToPath } from "@/onboarding/onboardingGuard";

export default function OnboardingGate() {
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const next = await getNextOnboardingStep();
      navigate(stepToPath(next), { replace: true });
    })();
  }, [navigate]);

  return <p className="p-8 text-muted-foreground">Redirecting…</p>;
}
