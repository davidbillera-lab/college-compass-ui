import { Link } from "react-router-dom";

const steps = [
  { key: "basics", label: "Basics", path: "/onboarding/basics" },
  { key: "story", label: "Story", path: "/onboarding/story" },
  { key: "activities", label: "Activities", path: "/onboarding/activities" },
  { key: "results", label: "Results", path: "/onboarding/results" },
] as const;

export default function OnboardingProgress({ active }: { active: typeof steps[number]["key"] }) {
  return (
    <div className="border-b p-4 flex flex-wrap gap-2 items-center">
      <Link to="/" className="font-semibold mr-2">College App</Link>
      {steps.map((s) => (
        <Link
          key={s.key}
          to={s.path}
          className={`px-3 py-1 rounded border text-sm ${
            s.key === active ? "bg-primary text-primary-foreground" : "hover:bg-muted"
          }`}
        >
          {s.label}
        </Link>
      ))}
    </div>
  );
}
