import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle2,
  Circle,
  ChevronRight,
  ChevronLeft,
  GraduationCap,
  Sparkles,
  ExternalLink,
  BookOpen,
  PenLine,
  Award,
  DollarSign,
  Scroll,
  FileText,
  Folder,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Guide step definitions ───────────────────────────────────────────────────
interface GuideStep {
  key: string;
  title: string;
  description: string;
  details: string[];
  tip?: string;
  link?: { label: string; url: string };
  category: string;
  icon: React.ElementType;
}

const GUIDE_STEPS: GuideStep[] = [
  {
    key: "research",
    title: "Research the School",
    description: "Before you apply, make sure this school is truly a good fit for you.",
    details: [
      "Review the school's programs, campus culture, and location",
      "Check the acceptance rate and typical admitted student profile",
      "Look up net price calculator to estimate your real cost",
      "Read student reviews on Niche or College Confidential",
    ],
    tip: "Write down 2–3 specific reasons why this school fits your goals — you'll use these in your supplemental essays.",
    icon: BookOpen,
    category: "Research",
  },
  {
    key: "common_app",
    title: "Set Up Common App",
    description: "Most schools use the Common Application. Create your account and add this school.",
    details: [
      "Create an account at commonapp.org if you haven't already",
      "Add this college to your 'My Colleges' list",
      "Review the school-specific requirements tab",
      "Note any additional materials required (portfolio, audition, etc.)",
    ],
    link: { label: "Open Common App", url: "https://commonapp.org" },
    icon: FileText,
    category: "Setup",
  },
  {
    key: "personal_statement",
    title: "Write Your Personal Statement",
    description: "The 650-word Common App essay is your most important piece of writing.",
    details: [
      "Choose a topic that reveals something meaningful about you",
      "Write a first draft without editing — just get ideas down",
      "Revise for clarity, voice, and authenticity",
      "Have at least 2 people review it before submitting",
      "Use the AI Essay Coach to get detailed feedback",
    ],
    tip: "Admissions officers read thousands of essays. The best ones are specific, personal, and show — not tell.",
    icon: PenLine,
    category: "Essays",
  },
  {
    key: "supplements",
    title: "Complete Supplemental Essays",
    description: "Many schools require additional short essays. Research what this school asks for.",
    details: [
      "Log into Common App and check the 'Writing' section for this school",
      "Note each prompt and its word limit",
      "Research the school's values and programs to write targeted responses",
      "The 'Why Us?' essay is critical — be specific, not generic",
    ],
    tip: "Never write 'I've always dreamed of attending [School].' Show you've done real research.",
    icon: PenLine,
    category: "Essays",
  },
  {
    key: "transcripts",
    title: "Request Official Transcripts",
    description: "Your school counselor must send official transcripts directly to colleges.",
    details: [
      "Ask your school counselor at least 4–6 weeks before the deadline",
      "Confirm whether the school accepts electronic or paper transcripts",
      "Request mid-year reports if required",
      "Verify receipt in your Common App portal after submission",
    ],
    icon: Scroll,
    category: "Documents",
  },
  {
    key: "test_scores",
    title: "Submit Test Scores",
    description: "Send official SAT or ACT scores if required or beneficial.",
    details: [
      "Check if this school is test-optional or test-required",
      "Send SAT scores via College Board (collegeboard.org)",
      "Send ACT scores via ACT (act.org)",
      "Scores must be sent directly from the testing agency — self-reported scores are not official",
    ],
    link: { label: "College Board Score Send", url: "https://collegeboard.org" },
    icon: BookOpen,
    category: "Test Scores",
  },
  {
    key: "recommendations",
    title: "Secure Recommendation Letters",
    description: "Most schools require 1–3 letters from teachers and your counselor.",
    details: [
      "Ask teachers who know you well — ideally in subjects related to your intended major",
      "Give recommenders at least 4–6 weeks notice",
      "Provide them with a 'brag sheet' summarizing your achievements and goals",
      "Send thank-you notes after they submit",
    ],
    tip: "A strong recommendation from a teacher who knows you well beats a generic letter from a famous person.",
    icon: Award,
    category: "Recommendations",
  },
  {
    key: "activities",
    title: "Complete the Activities List",
    description: "List up to 10 extracurricular activities in order of importance to you.",
    details: [
      "Prioritize depth over breadth — quality matters more than quantity",
      "Use all 150 characters for each description — be specific about your role and impact",
      "Include leadership positions, hours per week, and weeks per year",
      "Don't forget paid work, family responsibilities, and independent projects",
    ],
    icon: Folder,
    category: "Activities",
  },
  {
    key: "financial_aid",
    title: "Apply for Financial Aid",
    description: "Don't leave money on the table — apply for all aid you're eligible for.",
    details: [
      "Complete the FAFSA at studentaid.gov (opens October 1 each year)",
      "Check if this school requires the CSS Profile (common at private schools)",
      "Note the school's financial aid priority deadline — it may be earlier than the admission deadline",
      "Look for school-specific scholarships on the financial aid page",
    ],
    link: { label: "FAFSA Application", url: "https://studentaid.gov" },
    icon: DollarSign,
    category: "Financial Aid",
  },
  {
    key: "review_submit",
    title: "Final Review & Submit",
    description: "Before you hit submit, do a thorough final review.",
    details: [
      "Read every essay out loud — you'll catch errors you missed reading silently",
      "Confirm all required materials are marked as received in your portal",
      "Double-check the school name is correct in your essays (a common mistake!)",
      "Submit at least 48 hours before the deadline — never wait until the last minute",
      "Screenshot or save your submission confirmation",
    ],
    tip: "After submitting, send a brief thank-you email to your admissions counselor. It's a small touch that stands out.",
    icon: CheckCircle2,
    category: "Submission",
  },
];

// ─── Props ────────────────────────────────────────────────────────────────────
interface ApplicationGuideModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collegeName: string;
  completedSteps?: string[];
  onMarkComplete?: (stepKey: string) => void;
}

export function ApplicationGuideModal({
  open,
  onOpenChange,
  collegeName,
  completedSteps = [],
  onMarkComplete,
}: ApplicationGuideModalProps) {
  const [currentStep, setCurrentStep] = React.useState(0);
  const step = GUIDE_STEPS[currentStep];
  const isCompleted = completedSteps.includes(step.key);
  const completedCount = GUIDE_STEPS.filter((s) => completedSteps.includes(s.key)).length;
  const progress = Math.round((completedCount / GUIDE_STEPS.length) * 100);
  const Icon = step.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            Application Guide — {collegeName}
          </DialogTitle>
          <DialogDescription>
            Step {currentStep + 1} of {GUIDE_STEPS.length} · {completedCount} completed
          </DialogDescription>
        </DialogHeader>

        {/* Progress bar */}
        <Progress value={progress} className="h-1.5" />

        {/* Step tabs */}
        <div className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1">
          {GUIDE_STEPS.map((s, i) => {
            const done = completedSteps.includes(s.key);
            return (
              <button
                key={s.key}
                onClick={() => setCurrentStep(i)}
                className={cn(
                  "flex-shrink-0 w-7 h-7 rounded-full text-xs font-semibold transition-all",
                  i === currentStep
                    ? "bg-primary text-primary-foreground"
                    : done
                    ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                {done ? "✓" : i + 1}
              </button>
            );
          })}
        </div>

        <Separator />

        {/* Step content */}
        <div className="space-y-4">
          {/* Step header */}
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-foreground">{step.title}</h3>
                <Badge variant="secondary" className="text-xs">
                  {step.category}
                </Badge>
                {isCompleted && (
                  <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 border-0 text-xs">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Done
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
            </div>
          </div>

          {/* Action items */}
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Action Items
            </p>
            {step.details.map((detail, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <ChevronRight className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-sm text-foreground">{detail}</p>
              </div>
            ))}
          </div>

          {/* Pro tip */}
          {step.tip && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-primary/5 border border-primary/20">
              <Sparkles className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
              <p className="text-sm text-foreground">
                <span className="font-semibold text-primary">Pro tip: </span>
                {step.tip}
              </p>
            </div>
          )}

          {/* External link */}
          {step.link && (
            <Button variant="outline" size="sm" asChild>
              <a href={step.link.url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                {step.link.label}
              </a>
            </Button>
          )}
        </div>

        <Separator />

        {/* Navigation */}
        <div className="flex items-center justify-between gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentStep((p) => Math.max(0, p - 1))}
            disabled={currentStep === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>

          <div className="flex gap-2">
            {onMarkComplete && (
              <Button
                size="sm"
                variant={isCompleted ? "outline" : "default"}
                onClick={() => onMarkComplete(step.key)}
              >
                {isCompleted ? (
                  <>
                    <Circle className="h-3.5 w-3.5 mr-1.5" />
                    Mark Incomplete
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                    Mark Complete
                  </>
                )}
              </Button>
            )}
            {currentStep < GUIDE_STEPS.length - 1 && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCurrentStep((p) => Math.min(GUIDE_STEPS.length - 1, p + 1))}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
