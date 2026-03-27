// DO NOT EDIT VIA LOVABLE
import { Link } from "react-router-dom";
import { CheckCircle2, MapPin, BookOpen, DollarSign, Trophy, Heart, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { key: "basics",     label: "Basics",     icon: MapPin,     path: "/onboarding/basics" },
  { key: "academics",  label: "Academics",  icon: BookOpen,   path: "/onboarding/academics" },
  { key: "financial",  label: "Financial",  icon: DollarSign, path: "/onboarding/financial" },
  { key: "activities", label: "Activities", icon: Trophy,     path: "/onboarding/activities" },
  { key: "story",      label: "Story",      icon: Heart,      path: "/onboarding/story" },
] as const;

type StepKey = typeof STEPS[number]["key"];

function getStepIndex(key: StepKey) {
  return STEPS.findIndex((s) => s.key === key);
}

export default function OnboardingProgress({ active }: { active: StepKey }) {
  const activeIdx = getStepIndex(active);
  const totalSteps = STEPS.length;
  const progressPct = Math.round(((activeIdx) / (totalSteps - 1)) * 100);

  return (
    <div className="w-full border-b bg-background/95 backdrop-blur sticky top-0 z-10">
      <div className="max-w-2xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <Link to="/" className="font-bold text-primary text-sm">College Compass</Link>
          <span className="text-xs text-muted-foreground">
            Step {activeIdx + 1} of {totalSteps}
          </span>
        </div>
        <div className="w-full h-1.5 bg-muted rounded-full mb-3">
          <div
            className="h-1.5 bg-primary rounded-full transition-all duration-500"
            style={{ width: progressPct + "%" }}
          />
        </div>
        <div className="flex items-center justify-between">
          {STEPS.map((s, i) => {
            const done = i < activeIdx;
            const current = i === activeIdx;
            const Icon = s.icon;
            return (
              <div key={s.key} className="flex flex-col items-center gap-1">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all",
                    done    ? "bg-primary border-primary text-primary-foreground" :
                    current ? "border-primary bg-primary/10 text-primary" :
                              "border-muted-foreground/30 text-muted-foreground/40"
                  )}
                >
                  {done ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-3.5 w-3.5" />}
                </div>
                <span className={cn(
                  "text-[10px] hidden sm:block",
                  current ? "text-primary font-semibold" : "text-muted-foreground"
                )}>
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
