import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import ReactMarkdown from "react-markdown";
import {
  Brain, Loader2, ChevronRight, ChevronLeft, RotateCcw,
  Sparkles, BookOpen, Users, Wrench, BarChart3, Lightbulb, Heart,
} from "lucide-react";

// Holland Code / RIASEC-inspired interest categories
const INTEREST_CATEGORIES = [
  { id: "R", label: "Realistic", icon: Wrench, color: "bg-orange-100 text-orange-800 border-orange-200", description: "Working with tools, machines, or outdoors" },
  { id: "I", label: "Investigative", icon: Brain, color: "bg-blue-100 text-blue-800 border-blue-200", description: "Research, analysis, and problem-solving" },
  { id: "A", label: "Artistic", icon: Sparkles, color: "bg-purple-100 text-purple-800 border-purple-200", description: "Creative expression, art, music, writing" },
  { id: "S", label: "Social", icon: Users, color: "bg-green-100 text-green-800 border-green-200", description: "Helping, teaching, and working with people" },
  { id: "E", label: "Enterprising", icon: BarChart3, color: "bg-yellow-100 text-yellow-800 border-yellow-200", description: "Leading, persuading, and business" },
  { id: "C", label: "Conventional", icon: BookOpen, color: "bg-teal-100 text-teal-800 border-teal-200", description: "Organization, data, and structured tasks" },
];

interface Question {
  id: string;
  text: string;
  category: string;
}

const QUESTIONS: Question[] = [
  // Realistic
  { id: "r1", text: "I enjoy building or fixing things with my hands.", category: "R" },
  { id: "r2", text: "I like working outdoors or with physical materials.", category: "R" },
  { id: "r3", text: "I prefer hands-on projects over reading or writing assignments.", category: "R" },
  // Investigative
  { id: "i1", text: "I enjoy solving complex puzzles or math problems.", category: "I" },
  { id: "i2", text: "I like reading about science, technology, or research.", category: "I" },
  { id: "i3", text: "I prefer to understand how and why things work.", category: "I" },
  // Artistic
  { id: "a1", text: "I enjoy creative activities like writing, drawing, or music.", category: "A" },
  { id: "a2", text: "I like expressing myself through art, design, or performance.", category: "A" },
  { id: "a3", text: "I prefer open-ended projects where I can be creative.", category: "A" },
  // Social
  { id: "s1", text: "I enjoy helping others solve their problems.", category: "S" },
  { id: "s2", text: "I like working in groups and collaborating with others.", category: "S" },
  { id: "s3", text: "I feel energized when I'm teaching or mentoring someone.", category: "S" },
  // Enterprising
  { id: "e1", text: "I enjoy taking charge and leading projects or groups.", category: "E" },
  { id: "e2", text: "I like persuading others or selling ideas.", category: "E" },
  { id: "e3", text: "I'm drawn to business, entrepreneurship, or competition.", category: "E" },
  // Conventional
  { id: "c1", text: "I enjoy organizing information, data, or files.", category: "C" },
  { id: "c2", text: "I prefer clear instructions and structured tasks.", category: "C" },
  { id: "c3", text: "I like working with numbers, spreadsheets, or databases.", category: "C" },
];

const SCALE = [
  { value: 1, label: "Strongly Disagree" },
  { value: 2, label: "Disagree" },
  { value: 3, label: "Neutral" },
  { value: 4, label: "Agree" },
  { value: 5, label: "Strongly Agree" },
];

interface Results {
  scores: Record<string, number>;
  topCodes: string[];
  analysis: string;
}

export default function CareerAssessmentPage() {
  const { session } = useAuth();
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [currentPage, setCurrentPage] = useState(0);
  const [results, setResults] = useState<Results | null>(null);
  const [loading, setLoading] = useState(false);

  const QUESTIONS_PER_PAGE = 6;
  const totalPages = Math.ceil(QUESTIONS.length / QUESTIONS_PER_PAGE);
  const currentQuestions = QUESTIONS.slice(
    currentPage * QUESTIONS_PER_PAGE,
    (currentPage + 1) * QUESTIONS_PER_PAGE
  );
  const answeredOnPage = currentQuestions.filter((q) => answers[q.id] !== undefined).length;
  const pageComplete = answeredOnPage === currentQuestions.length;
  const totalAnswered = Object.keys(answers).length;
  const allAnswered = totalAnswered === QUESTIONS.length;

  const handleAnswer = (questionId: string, value: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const calculateScores = (): Record<string, number> => {
    const scores: Record<string, number> = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
    QUESTIONS.forEach((q) => {
      if (answers[q.id]) {
        scores[q.category] += answers[q.id];
      }
    });
    return scores;
  };

  const handleSubmit = async () => {
    if (!allAnswered) {
      toast.error("Please answer all questions before submitting.");
      return;
    }

    setLoading(true);
    const scores = calculateScores();
    const sorted = Object.entries(scores).sort(([, a], [, b]) => b - a);
    const topCodes = sorted.slice(0, 3).map(([code]) => code);

    try {
      const { data, error } = await supabase.functions.invoke("career-assessment", {
        body: { scores, topCodes },
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });

      if (error || data?.error) throw new Error(data?.error || error?.message);

      setResults({ scores, topCodes, analysis: data.analysis });
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate analysis. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setAnswers({});
    setCurrentPage(0);
    setResults(null);
  };

  if (results) {
    const maxScore = 15; // 3 questions × 5 max
    return (
      <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Your Career Interest Profile</h1>
            <p className="text-muted-foreground text-sm">Based on your Holland Code assessment</p>
          </div>
          <Button variant="outline" onClick={handleReset} className="gap-2">
            <RotateCcw className="h-4 w-4" />
            Retake
          </Button>
        </div>

        {/* Top Codes */}
        <div className="flex flex-wrap gap-3">
          {results.topCodes.map((code, idx) => {
            const cat = INTEREST_CATEGORIES.find((c) => c.id === code)!;
            const Icon = cat.icon;
            return (
              <div
                key={code}
                className={`flex items-center gap-2 px-4 py-2 rounded-full border font-semibold ${cat.color}`}
              >
                {idx === 0 && <span className="text-xs opacity-70">Primary</span>}
                {idx === 1 && <span className="text-xs opacity-70">Secondary</span>}
                {idx === 2 && <span className="text-xs opacity-70">Tertiary</span>}
                <Icon className="h-4 w-4" />
                {cat.label}
              </div>
            );
          })}
        </div>

        {/* Score Bars */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Interest Scores</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(results.scores)
              .sort(([, a], [, b]) => b - a)
              .map(([code, score]) => {
                const cat = INTEREST_CATEGORIES.find((c) => c.id === code)!;
                const Icon = cat.icon;
                return (
                  <div key={code}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2 text-sm">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{cat.label}</span>
                        <span className="text-xs text-muted-foreground">{cat.description}</span>
                      </div>
                      <span className="text-sm font-semibold">{score}/{maxScore}</span>
                    </div>
                    <Progress value={(score / maxScore) * 100} className="h-2" />
                  </div>
                );
              })}
          </CardContent>
        </Card>

        {/* AI Analysis */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-600" />
              Personalized Career & Major Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown>{results.analysis}</ReactMarkdown>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white">
            <Brain className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Career Interest Assessment</h1>
            <p className="text-muted-foreground text-sm">
              Discover your Holland Code and get personalized major & career recommendations
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          {INTEREST_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <span
                key={cat.id}
                className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border ${cat.color}`}
              >
                <Icon className="h-3 w-3" />
                {cat.label}
              </span>
            );
          })}
        </div>
      </div>

      {/* Progress */}
      <div>
        <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
          <span>
            Page {currentPage + 1} of {totalPages}
          </span>
          <span>{totalAnswered} / {QUESTIONS.length} answered</span>
        </div>
        <Progress value={(totalAnswered / QUESTIONS.length) * 100} className="h-1.5" />
      </div>

      {/* Questions */}
      <div className="space-y-4">
        {currentQuestions.map((question, idx) => {
          const cat = INTEREST_CATEGORIES.find((c) => c.id === question.category)!;
          const Icon = cat.icon;
          return (
            <Card key={question.id}>
              <CardContent className="pt-4">
                <div className="flex items-start gap-3 mb-4">
                  <div
                    className={`p-1.5 rounded-lg border flex-shrink-0 ${cat.color}`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <p className="text-sm font-medium leading-relaxed">{question.text}</p>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {SCALE.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleAnswer(question.id, option.value)}
                      className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-all text-xs ${
                        answers[question.id] === option.value
                          ? "border-primary bg-primary/10 text-primary font-semibold"
                          : "border-border hover:bg-muted text-muted-foreground"
                      }`}
                    >
                      <span className="text-base font-bold">{option.value}</span>
                      <span className="hidden sm:block text-center leading-tight">
                        {option.label}
                      </span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentPage((p) => p - 1)}
          disabled={currentPage === 0}
          className="gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>

        {currentPage < totalPages - 1 ? (
          <Button
            onClick={() => setCurrentPage((p) => p + 1)}
            disabled={!pageComplete}
            className="gap-2"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={!allAnswered || loading}
            className="gap-2 bg-purple-600 hover:bg-purple-700"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Get My Results
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
