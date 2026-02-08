import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
  DollarSign,
  Target,
  TrendingUp,
  GraduationCap,
  Trophy,
  Heart,
  Users,
  MapPin,
  Briefcase,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { NormalizedCriteria, Scholarship } from "@/lib/scholarshipsIntel/types";
import { loadProfile } from "@/lib/profileExtrasApi";
import { cn } from "@/lib/utils";

interface FieldSuggestion {
  field: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  scholarshipCount: number;
  potentialValue: number;
  priority: "high" | "medium" | "low";
  category: "academic" | "financial" | "extracurricular" | "athletic" | "demographic";
  profileKey: string;
  inputType: "number" | "text" | "boolean" | "array";
  placeholder?: string;
}

interface ProfileCompletionWizardProps {
  onComplete?: () => void;
  onFieldUpdate?: (field: string, value: unknown) => void;
}

// Maps scholarship criteria fields to profile fields
const FIELD_MAPPINGS: Record<string, Omit<FieldSuggestion, "scholarshipCount" | "potentialValue" | "priority">> = {
  min_gpa: {
    field: "gpa",
    label: "GPA",
    description: "Your unweighted GPA on a 4.0 scale",
    icon: GraduationCap,
    category: "academic",
    profileKey: "gpa_unweighted",
    inputType: "number",
    placeholder: "3.85",
  },
  min_sat: {
    field: "sat_score",
    label: "SAT Score",
    description: "Your SAT composite score (400-1600)",
    icon: Target,
    category: "academic",
    profileKey: "sat_score",
    inputType: "number",
    placeholder: "1400",
  },
  min_act: {
    field: "act_score",
    label: "ACT Score",
    description: "Your ACT composite score (1-36)",
    icon: Target,
    category: "academic",
    profileKey: "act_score",
    inputType: "number",
    placeholder: "32",
  },
  min_psat: {
    field: "psat_score",
    label: "PSAT Score",
    description: "Your PSAT/NMSQT score (320-1520)",
    icon: Target,
    category: "academic",
    profileKey: "psat_score",
    inputType: "number",
    placeholder: "1350",
  },
  class_rank_percentile: {
    field: "class_rank",
    label: "Class Rank",
    description: "Your rank in your graduating class (e.g., 'Top 10%' or '5/200')",
    icon: Trophy,
    category: "academic",
    profileKey: "class_rank",
    inputType: "text",
    placeholder: "Top 10%",
  },
  volunteer_hours_min: {
    field: "volunteer_hours",
    label: "Volunteer Hours",
    description: "Total volunteer/community service hours",
    icon: Heart,
    category: "extracurricular",
    profileKey: "volunteer_hours",
    inputType: "number",
    placeholder: "200",
  },
  leadership_required: {
    field: "leadership_roles",
    label: "Leadership Roles",
    description: "Positions where you led others (club president, team captain, etc.)",
    icon: Users,
    category: "extracurricular",
    profileKey: "leadership_roles",
    inputType: "array",
    placeholder: "Student Council President",
  },
  first_gen: {
    field: "first_gen_college",
    label: "First-Generation Status",
    description: "Are you the first in your family to attend college?",
    icon: Sparkles,
    category: "financial",
    profileKey: "first_gen_college",
    inputType: "boolean",
  },
  need_based: {
    field: "financial_need",
    label: "Financial Need",
    description: "Do you have demonstrated financial need?",
    icon: DollarSign,
    category: "financial",
    profileKey: "financial_need",
    inputType: "boolean",
  },
  states: {
    field: "state",
    label: "State of Residence",
    description: "The US state where you legally reside",
    icon: MapPin,
    category: "demographic",
    profileKey: "state",
    inputType: "text",
    placeholder: "California",
  },
  citizenship: {
    field: "citizenship",
    label: "Citizenship Status",
    description: "Your citizenship or residency status",
    icon: MapPin,
    category: "demographic",
    profileKey: "citizenship",
    inputType: "text",
    placeholder: "US Citizen",
  },
  athletics: {
    field: "sports_played",
    label: "Sports Played",
    description: "Sports you participate in (varsity, club, recreational)",
    icon: Trophy,
    category: "athletic",
    profileKey: "sports_played",
    inputType: "array",
    placeholder: "Basketball, Soccer",
  },
  work_experience_hours_min: {
    field: "work_experience_hours",
    label: "Work Experience Hours",
    description: "Total hours of paid work experience",
    icon: Briefcase,
    category: "extracurricular",
    profileKey: "work_experience_hours",
    inputType: "number",
    placeholder: "500",
  },
  requires_awards: {
    field: "awards",
    label: "Awards & Honors",
    description: "Academic or extracurricular awards you've received",
    icon: Trophy,
    category: "academic",
    profileKey: "awards",
    inputType: "array",
    placeholder: "National Merit Scholar",
  },
  majors: {
    field: "intended_majors",
    label: "Intended Major(s)",
    description: "What do you plan to study in college?",
    icon: GraduationCap,
    category: "academic",
    profileKey: "intended_majors",
    inputType: "array",
    placeholder: "Computer Science, Engineering",
  },
};

function formatCurrency(amount: number): string {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(0)}K`;
  }
  return `$${amount}`;
}

export default function ProfileCompletionWizard({ onComplete, onFieldUpdate }: ProfileCompletionWizardProps) {
  const [loading, setLoading] = useState(true);
  const [suggestions, setSuggestions] = useState<FieldSuggestion[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);

  // Analyze scholarships and generate suggestions
  useEffect(() => {
    async function analyze() {
      setLoading(true);
      try {
        // Load profile and scholarships in parallel
        const [profileData, { data: scholarships }] = await Promise.all([
          loadProfile(),
          supabase.from("scholarships").select("*").eq("status", "active"),
        ]);

        setProfile(profileData);

        // Count how many scholarships require each field and sum potential value
        const fieldStats: Record<string, { count: number; totalValue: number }> = {};

        (scholarships || []).forEach((s) => {
          const criteria = (s.normalized_criteria || {}) as NormalizedCriteria;
          const value = s.amount_max_usd || s.amount_usd || s.amount_min_usd || 5000;

          Object.entries(criteria).forEach(([key, val]) => {
            if (val != null && val !== false && FIELD_MAPPINGS[key]) {
              if (!fieldStats[key]) {
                fieldStats[key] = { count: 0, totalValue: 0 };
              }
              fieldStats[key].count++;
              fieldStats[key].totalValue += value;
            }
          });
        });

        // Generate suggestions for missing profile fields
        const generated: FieldSuggestion[] = [];

        Object.entries(fieldStats)
          .sort((a, b) => b[1].totalValue - a[1].totalValue)
          .forEach(([criteriaKey, stats]) => {
            const mapping = FIELD_MAPPINGS[criteriaKey];
            if (!mapping) return;

            // Check if profile already has this field filled
            const profileValue = profileData?.[mapping.profileKey as keyof typeof profileData];
            const isFilled = 
              profileValue != null && 
              profileValue !== "" && 
              (Array.isArray(profileValue) ? profileValue.length > 0 : true);

            if (isFilled) return; // Skip if already filled

            // Determine priority based on value and count
            let priority: "high" | "medium" | "low" = "low";
            if (stats.totalValue >= 100000 || stats.count >= 20) priority = "high";
            else if (stats.totalValue >= 25000 || stats.count >= 5) priority = "medium";

            generated.push({
              ...mapping,
              scholarshipCount: stats.count,
              potentialValue: stats.totalValue,
              priority,
            });
          });

        setSuggestions(generated);
      } catch (error) {
        console.error("Error analyzing scholarships:", error);
      } finally {
        setLoading(false);
      }
    }

    analyze();
  }, []);

  // Initialize values from current step
  useEffect(() => {
    if (suggestions[currentStep] && profile) {
      const field = suggestions[currentStep].profileKey;
      const currentValue = profile[field as keyof typeof profile];
      if (currentValue != null && !values[field]) {
        setValues(prev => ({ ...prev, [field]: currentValue }));
      }
    }
  }, [currentStep, suggestions, profile, values]);

  const handleValueChange = (profileKey: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [profileKey]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Prepare update object with only changed values
      const updates: Record<string, unknown> = {};
      Object.entries(values).forEach(([key, value]) => {
        if (value != null && value !== "") {
          updates[key] = value;
        }
      });

      if (Object.keys(updates).length > 0) {
        const { error } = await supabase
          .from("profiles")
          .update(updates)
          .eq("id", user.id);

        if (error) throw error;
      }

      // Move to next step or complete
      if (currentStep < suggestions.length - 1) {
        setCurrentStep((prev) => prev + 1);
        onFieldUpdate?.(suggestions[currentStep].profileKey, values[suggestions[currentStep].profileKey]);
      } else {
        onComplete?.();
      }
    } catch (error) {
      console.error("Error saving:", error);
    } finally {
      setSaving(false);
    }
  };

  const currentSuggestion = suggestions[currentStep];
  const completedCount = currentStep;
  const progress = suggestions.length > 0 ? (completedCount / suggestions.length) * 100 : 0;

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="py-8">
          <div className="h-8 bg-muted rounded w-1/3 mb-4" />
          <div className="h-4 bg-muted rounded w-2/3" />
        </CardContent>
      </Card>
    );
  }

  if (suggestions.length === 0) {
    return (
      <Card className="border-success/20 bg-success/5">
        <CardContent className="py-8 text-center">
          <Check className="h-12 w-12 text-success mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Profile Complete!</h3>
          <p className="text-muted-foreground">
            You've filled in all the key fields that scholarships look for. Great job!
          </p>
        </CardContent>
      </Card>
    );
  }

  // Summary view showing all suggestions
  if (currentStep === -1) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Unlock More Scholarships
          </CardTitle>
          <CardDescription>
            Complete these fields to match with {suggestions.reduce((sum, s) => sum + s.scholarshipCount, 0)} more scholarships
            worth up to {formatCurrency(suggestions.reduce((sum, s) => sum + s.potentialValue, 0))}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {suggestions.map((suggestion, idx) => (
            <button
              key={suggestion.field}
              onClick={() => setCurrentStep(idx)}
              className="w-full flex items-center gap-4 p-4 rounded-lg border hover:border-primary/30 hover:bg-muted/30 transition-colors text-left"
            >
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center",
                suggestion.priority === "high" && "bg-primary/10 text-primary",
                suggestion.priority === "medium" && "bg-warning/10 text-warning",
                suggestion.priority === "low" && "bg-muted text-muted-foreground"
              )}>
                <suggestion.icon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">{suggestion.label}</span>
                  <Badge
                    variant={suggestion.priority === "high" ? "default" : suggestion.priority === "medium" ? "warning" : "secondary"}
                    size="sm"
                  >
                    {suggestion.priority} priority
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {suggestion.scholarshipCount} scholarships · Up to {formatCurrency(suggestion.potentialValue)}
                </p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </button>
          ))}
        </CardContent>
      </Card>
    );
  }

  // Step-by-step wizard view
  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between mb-2">
          <Badge variant="outline" className="text-xs">
            Step {currentStep + 1} of {suggestions.length}
          </Badge>
          <Badge
            variant={currentSuggestion.priority === "high" ? "default" : currentSuggestion.priority === "medium" ? "warning" : "secondary"}
          >
            {currentSuggestion.priority} priority
          </Badge>
        </div>
        <Progress value={progress} className="h-1 mb-4" />
        <CardTitle className="flex items-center gap-2">
          <currentSuggestion.icon className="h-5 w-5 text-primary" />
          {currentSuggestion.label}
        </CardTitle>
        <CardDescription>{currentSuggestion.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Value proposition */}
        <div className="flex items-center gap-4 p-4 rounded-lg bg-primary/5 border border-primary/10">
          <div className="flex-shrink-0">
            <DollarSign className="h-8 w-8 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              {currentSuggestion.scholarshipCount} scholarships need this
            </p>
            <p className="text-xs text-muted-foreground">
              Combined potential value: {formatCurrency(currentSuggestion.potentialValue)}
            </p>
          </div>
        </div>

        {/* Input field based on type */}
        <div className="space-y-2">
          <Label htmlFor={currentSuggestion.profileKey}>{currentSuggestion.label}</Label>
          
          {currentSuggestion.inputType === "number" && (
            <Input
              id={currentSuggestion.profileKey}
              type="number"
              placeholder={currentSuggestion.placeholder}
              value={(values[currentSuggestion.profileKey] as number) || ""}
              onChange={(e) => handleValueChange(currentSuggestion.profileKey, e.target.value ? Number(e.target.value) : null)}
              className="text-lg"
            />
          )}
          
          {currentSuggestion.inputType === "text" && (
            <Input
              id={currentSuggestion.profileKey}
              type="text"
              placeholder={currentSuggestion.placeholder}
              value={(values[currentSuggestion.profileKey] as string) || ""}
              onChange={(e) => handleValueChange(currentSuggestion.profileKey, e.target.value)}
              className="text-lg"
            />
          )}
          
          {currentSuggestion.inputType === "boolean" && (
            <div className="flex items-center space-x-2 py-2">
              <Checkbox
                id={currentSuggestion.profileKey}
                checked={(values[currentSuggestion.profileKey] as boolean) || false}
                onCheckedChange={(checked) => handleValueChange(currentSuggestion.profileKey, checked)}
              />
              <label
                htmlFor={currentSuggestion.profileKey}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Yes, this applies to me
              </label>
            </div>
          )}
          
          {currentSuggestion.inputType === "array" && (
            <Input
              id={currentSuggestion.profileKey}
              type="text"
              placeholder={currentSuggestion.placeholder}
              value={Array.isArray(values[currentSuggestion.profileKey]) 
                ? (values[currentSuggestion.profileKey] as string[]).join(", ") 
                : (values[currentSuggestion.profileKey] as string) || ""}
              onChange={(e) => {
                const arr = e.target.value.split(",").map(s => s.trim()).filter(Boolean);
                handleValueChange(currentSuggestion.profileKey, arr.length > 0 ? arr : null);
              }}
              className="text-lg"
            />
          )}
          
          {currentSuggestion.inputType === "array" && (
            <p className="text-xs text-muted-foreground">Separate multiple items with commas</p>
          )}
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between pt-4">
          <Button
            variant="ghost"
            onClick={() => setCurrentStep((prev) => prev - 1)}
            disabled={currentStep === 0}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setCurrentStep((prev) => prev + 1)}
              disabled={currentStep === suggestions.length - 1}
            >
              Skip
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : currentStep === suggestions.length - 1 ? "Complete" : "Save & Continue"}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
