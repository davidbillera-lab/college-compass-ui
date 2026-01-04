import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Heart, Save, Pencil, Lightbulb, Target, Compass, MapPin } from "lucide-react";

interface Props {
  onComplete: (value: number) => void;
}

interface InterestsData {
  interests: string;
  values: string;
  motivations: string;
  preferredEnvironments: string;
}

const prompts = [
  {
    key: "interests" as const,
    icon: Lightbulb,
    label: "Interests",
    prompt: "What topics, subjects, or activities fascinate you? What do you love learning about?",
    placeholder: "I'm fascinated by the intersection of technology and social change...",
  },
  {
    key: "values" as const,
    icon: Target,
    label: "Values",
    prompt: "What principles guide your decisions? What matters most to you in life?",
    placeholder: "I believe in the importance of community, integrity, and continuous growth...",
  },
  {
    key: "motivations" as const,
    icon: Compass,
    label: "Motivations",
    prompt: "What drives you? What goals or aspirations shape your choices?",
    placeholder: "I'm motivated by the desire to make education more accessible...",
  },
  {
    key: "preferredEnvironments" as const,
    icon: MapPin,
    label: "Preferred Environments",
    prompt: "What kind of college environment would help you thrive? (Size, location, culture)",
    placeholder: "I thrive in collaborative environments with small class sizes...",
  },
];

export default function InterestsValuesSection({ onComplete }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [data, setData] = useState<InterestsData>({
    interests: "",
    values: "",
    motivations: "",
    preferredEnvironments: "",
  });

  // Calculate completion
  useEffect(() => {
    const fields = Object.values(data);
    const filled = fields.filter((f) => f.trim().length > 20).length; // Need substantial content
    const percentage = Math.round((filled / fields.length) * 100);
    onComplete(percentage);
  }, [data, onComplete]);

  const handleSave = () => {
    setIsEditing(false);
  };

  const updateField = (key: keyof InterestsData, value: string) => {
    setData((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-primary-light">
            <Heart className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle>Interests & Values</CardTitle>
            <CardDescription>
              Help colleges understand what drives you and what environments help you thrive
            </CardDescription>
          </div>
        </div>
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
      </CardHeader>

      <CardContent className="space-y-6">
        {prompts.map((prompt) => {
          const Icon = prompt.icon;
          const value = data[prompt.key];

          return (
            <div key={prompt.key} className="space-y-2">
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-primary" />
                <Label className="font-medium">{prompt.label}</Label>
              </div>
              <p className="text-sm text-muted-foreground">{prompt.prompt}</p>
              {isEditing ? (
                <Textarea
                  value={value}
                  onChange={(e) => updateField(prompt.key, e.target.value)}
                  placeholder={prompt.placeholder}
                  rows={4}
                  className="resize-y"
                />
              ) : (
                <div className="p-4 rounded-lg bg-muted/30 border min-h-[100px]">
                  {value ? (
                    <p className="text-foreground whitespace-pre-wrap">{value}</p>
                  ) : (
                    <p className="text-muted-foreground italic">
                      Not answered yet. Click Edit to add your response.
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}

        <div className="p-4 rounded-lg bg-accent/10 border border-accent/20">
          <div className="flex items-start gap-3">
            <div className="p-1.5 rounded-full bg-accent/20">
              <Heart className="h-4 w-4 text-accent-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-accent-foreground">
                Why this matters
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Your responses here help our matching algorithm find colleges where you'll truly thrive—not just where you might get in.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
