import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { User, Save, Pencil } from "lucide-react";
import { mockStudentProfile } from "@/lib/mockData";

interface Props {
  onComplete: (value: number) => void;
}

interface CoreIdentityData {
  preferredName: string;
  graduationYear: string;
  school: string;
  city: string;
  state: string;
  country: string;
  contextNotes: string;
}

const states = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
];

const graduationYears = ["2025", "2026", "2027", "2028", "2029"];

export default function CoreIdentitySection({ onComplete }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [data, setData] = useState<CoreIdentityData>({
    preferredName: mockStudentProfile.basics.firstName,
    graduationYear: mockStudentProfile.basics.graduationYear,
    school: mockStudentProfile.basics.school,
    city: mockStudentProfile.basics.city,
    state: mockStudentProfile.basics.state,
    country: "United States",
    contextNotes: "",
  });

  // Calculate completion
  useEffect(() => {
    const fields = [data.preferredName, data.graduationYear, data.school, data.city, data.state];
    const filled = fields.filter((f) => f.trim().length > 0).length;
    const percentage = Math.round((filled / fields.length) * 100);
    onComplete(percentage);
  }, [data, onComplete]);

  const handleSave = () => {
    setIsEditing(false);
    // In real app, save to database
  };

  const updateField = <K extends keyof CoreIdentityData>(key: K, value: CoreIdentityData[K]) => {
    setData((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-primary-light">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle>Core Identity</CardTitle>
            <CardDescription>
              Basic information about you and your background
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
        <div className="grid md:grid-cols-2 gap-6">
          {/* Preferred Name */}
          <div className="space-y-2">
            <Label>Preferred Name</Label>
            {isEditing ? (
              <Input
                value={data.preferredName}
                onChange={(e) => updateField("preferredName", e.target.value)}
                placeholder="What would you like to be called?"
              />
            ) : (
              <p className="text-foreground font-medium py-2">
                {data.preferredName || <span className="text-muted-foreground italic">Not set</span>}
              </p>
            )}
          </div>

          {/* Graduation Year */}
          <div className="space-y-2">
            <Label>Graduation Year</Label>
            {isEditing ? (
              <Select
                value={data.graduationYear}
                onValueChange={(v) => updateField("graduationYear", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {graduationYears.map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-foreground font-medium py-2">
                {data.graduationYear || <span className="text-muted-foreground italic">Not set</span>}
              </p>
            )}
          </div>

          {/* School */}
          <div className="space-y-2 md:col-span-2">
            <Label>High School</Label>
            {isEditing ? (
              <Input
                value={data.school}
                onChange={(e) => updateField("school", e.target.value)}
                placeholder="Your high school name"
              />
            ) : (
              <p className="text-foreground font-medium py-2">
                {data.school || <span className="text-muted-foreground italic">Not set</span>}
              </p>
            )}
          </div>

          {/* City */}
          <div className="space-y-2">
            <Label>City</Label>
            {isEditing ? (
              <Input
                value={data.city}
                onChange={(e) => updateField("city", e.target.value)}
                placeholder="City"
              />
            ) : (
              <p className="text-foreground font-medium py-2">
                {data.city || <span className="text-muted-foreground italic">Not set</span>}
              </p>
            )}
          </div>

          {/* State */}
          <div className="space-y-2">
            <Label>State</Label>
            {isEditing ? (
              <Select
                value={data.state}
                onValueChange={(v) => updateField("state", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  {states.map((state) => (
                    <SelectItem key={state} value={state}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-foreground font-medium py-2">
                {data.state || <span className="text-muted-foreground italic">Not set</span>}
              </p>
            )}
          </div>
        </div>

        {/* Context Notes */}
        <div className="space-y-2">
          <Label>Additional Context (Optional)</Label>
          <p className="text-xs text-muted-foreground mb-2">
            Share any background context that's important to your story (first-generation student, family circumstances, etc.)
          </p>
          {isEditing ? (
            <Textarea
              value={data.contextNotes}
              onChange={(e) => updateField("contextNotes", e.target.value)}
              placeholder="Optional: Share context that helps tell your story..."
              rows={4}
            />
          ) : (
            <div className="p-3 rounded-lg bg-muted/30 border min-h-[100px]">
              {data.contextNotes ? (
                <p className="text-foreground">{data.contextNotes}</p>
              ) : (
                <p className="text-muted-foreground italic">No additional context provided</p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
