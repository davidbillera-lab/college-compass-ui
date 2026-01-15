import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Save, Pencil, Lightbulb, Heart, Target, Sparkles, Users, Globe } from "lucide-react";

interface PersonalStoryData {
  background?: string;
  values?: string;
  proudMoment?: string;
  challenge?: string;
  impact?: string;
  uniquePerspective?: string;
  communityRole?: string;
  futureVision?: string;
}

interface Props {
  data: PersonalStoryData;
  onChange: (data: PersonalStoryData) => void;
  onSave?: () => void;
}

const STORY_PROMPTS = [
  {
    key: "background" as const,
    label: "Your Background & Context",
    icon: Globe,
    placeholder: "Share about your family, community, or circumstances that shaped who you are...",
    hint: "Helps scholarship committees understand your unique perspective and any challenges you've overcome.",
  },
  {
    key: "values" as const,
    label: "Core Values & Beliefs",
    icon: Heart,
    placeholder: "What principles guide your decisions? What do you stand for?",
    hint: "Many scholarships look for students whose values align with their mission.",
  },
  {
    key: "proudMoment" as const,
    label: "A Moment You're Proud Of",
    icon: Sparkles,
    placeholder: "Describe an achievement, experience, or decision that reflects who you are...",
    hint: "Demonstrates character and initiative - key factors in scholarship selection.",
  },
  {
    key: "challenge" as const,
    label: "A Challenge You've Overcome",
    icon: Target,
    placeholder: "What obstacles have you faced? How did you grow from the experience?",
    hint: "Resilience and growth mindset are highly valued by scholarship committees.",
  },
  {
    key: "impact" as const,
    label: "Impact You Want to Make",
    icon: Lightbulb,
    placeholder: "How do you want to contribute to your field, community, or the world?",
    hint: "Shows purpose and long-term thinking - essential for merit scholarships.",
  },
  {
    key: "uniquePerspective" as const,
    label: "Your Unique Perspective",
    icon: BookOpen,
    placeholder: "What viewpoint or experience do you bring that others might not?",
    hint: "Diversity of thought and experience is valued by many scholarship programs.",
  },
  {
    key: "communityRole" as const,
    label: "Role in Your Community",
    icon: Users,
    placeholder: "How have you contributed to or been shaped by your community?",
    hint: "Community involvement is a key criterion for many local and national scholarships.",
  },
  {
    key: "futureVision" as const,
    label: "Vision for Your Future",
    icon: Target,
    placeholder: "Where do you see yourself in 5-10 years? What career or impact goals do you have?",
    hint: "Clear goals help match you with career-specific and field-based scholarships.",
  },
];

export default function PersonalStorySection({ data, onChange, onSave }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [expandedPrompts, setExpandedPrompts] = useState<Set<string>>(new Set(["values", "proudMoment", "impact"]));

  const handleSave = () => {
    setIsEditing(false);
    onSave?.();
  };

  const updateField = (key: keyof PersonalStoryData, value: string) => {
    onChange({ ...data, [key]: value });
  };

  const togglePrompt = (key: string) => {
    setExpandedPrompts((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const filledCount = STORY_PROMPTS.filter((p) => data[p.key]?.trim()).length;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <BookOpen className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle>Personal Story</CardTitle>
            <CardDescription>
              Your narrative helps you stand out for scholarships and admissions
            </CardDescription>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {filledCount}/{STORY_PROMPTS.length} sections
          </Badge>
          <Button
            variant={isEditing ? "default" : "outline"}
            size="sm"
            onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
          >
            {isEditing ? (
              <>
                <Save className="h-4 w-4 mr-1" />
                Save
              </>
            ) : (
              <>
                <Pencil className="h-4 w-4 mr-1" />
                Edit
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="bg-muted/30 rounded-lg p-4 border">
          <h4 className="font-medium text-sm text-foreground mb-2 flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-amber-500" />
            Why This Matters for Scholarships
          </h4>
          <p className="text-sm text-muted-foreground">
            Scholarship committees read thousands of applications. Your personal story helps them 
            understand who you are beyond grades and test scores. Strong narratives can qualify you 
            for need-based aid, merit scholarships, diversity grants, and field-specific awards.
          </p>
        </div>

        <div className="space-y-3">
          {STORY_PROMPTS.map((prompt) => {
            const Icon = prompt.icon;
            const isExpanded = expandedPrompts.has(prompt.key);
            const hasContent = data[prompt.key]?.trim();

            return (
              <div
                key={prompt.key}
                className={`border rounded-lg transition-all ${
                  hasContent ? "border-primary/30 bg-primary/5" : "border-border"
                }`}
              >
                <button
                  type="button"
                  onClick={() => togglePrompt(prompt.key)}
                  className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-muted/30 transition-colors rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`h-4 w-4 ${hasContent ? "text-primary" : "text-muted-foreground"}`} />
                    <span className={`font-medium text-sm ${hasContent ? "text-foreground" : "text-muted-foreground"}`}>
                      {prompt.label}
                    </span>
                    {hasContent && (
                      <Badge variant="secondary" className="text-xs">
                        Filled
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {isExpanded ? "Collapse" : "Expand"}
                  </span>
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 space-y-2">
                    <p className="text-xs text-muted-foreground italic">{prompt.hint}</p>
                    {isEditing ? (
                      <Textarea
                        value={data[prompt.key] || ""}
                        onChange={(e) => updateField(prompt.key, e.target.value)}
                        placeholder={prompt.placeholder}
                        rows={4}
                        className="resize-none"
                      />
                    ) : (
                      <div className="p-3 rounded-lg bg-background border min-h-[80px]">
                        {data[prompt.key] ? (
                          <p className="text-sm text-foreground whitespace-pre-wrap">{data[prompt.key]}</p>
                        ) : (
                          <p className="text-sm text-muted-foreground italic">Not yet written</p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
