import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { User, Save, Pencil, GraduationCap, MapPin, School, Plus, X } from "lucide-react";

export interface CoreBasicsData {
  preferredName?: string;
  fullName?: string;
  graduationYear?: number;
  school?: string;
  city?: string;
  state?: string;
  country?: string;
  contextNotes?: string;
  // Academic fields
  gpaUnweighted?: number;
  gpaWeighted?: number;
  gpaScale?: string;
  classRank?: string;
  classSize?: string;
  courseworkRigor?: string;
  intendedMajors?: string[];
  academicNarrative?: string;
}

interface Props {
  data: CoreBasicsData;
  onChange: (data: CoreBasicsData) => void;
  onSave?: () => void;
}

const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY", "DC"
];

const GRADUATION_YEARS = [2025, 2026, 2027, 2028, 2029, 2030];

const RIGOR_OPTIONS = [
  "Most rigorous curriculum available",
  "Very rigorous",
  "Rigorous",
  "Average",
  "Below average"
];

export default function CoreBasicsSection({ data, onChange, onSave }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [newMajor, setNewMajor] = useState("");

  const handleSave = () => {
    setIsEditing(false);
    onSave?.();
  };

  const updateField = <K extends keyof CoreBasicsData>(key: K, value: CoreBasicsData[K]) => {
    onChange({ ...data, [key]: value });
  };

  const addMajor = () => {
    if (newMajor.trim() && !data.intendedMajors?.includes(newMajor.trim())) {
      updateField("intendedMajors", [...(data.intendedMajors || []), newMajor.trim()]);
      setNewMajor("");
    }
  };

  const removeMajor = (major: string) => {
    updateField("intendedMajors", data.intendedMajors?.filter((m) => m !== major) || []);
  };

  // Calculate completeness
  const requiredFields = [data.fullName, data.graduationYear, data.school, data.state];
  const filledRequired = requiredFields.filter(Boolean).length;
  const completeness = Math.round((filledRequired / requiredFields.length) * 100);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle>Core Profile & Academics</CardTitle>
            <CardDescription>
              Essential information for college applications and scholarship matching
            </CardDescription>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={completeness === 100 ? "default" : "outline"} className="text-xs">
            {completeness}% complete
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

      <CardContent className="space-y-8">
        {/* Personal Information Section */}
        <div>
          <h4 className="font-medium text-foreground mb-4 flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            Personal Information
          </h4>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Full Legal Name *</Label>
              {isEditing ? (
                <Input
                  value={data.fullName || ""}
                  onChange={(e) => updateField("fullName", e.target.value)}
                  placeholder="As it appears on official documents"
                />
              ) : (
                <p className="text-foreground font-medium py-2">
                  {data.fullName || <span className="text-muted-foreground italic">Not set</span>}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Preferred Name</Label>
              {isEditing ? (
                <Input
                  value={data.preferredName || ""}
                  onChange={(e) => updateField("preferredName", e.target.value)}
                  placeholder="What you like to be called"
                />
              ) : (
                <p className="text-foreground font-medium py-2">
                  {data.preferredName || <span className="text-muted-foreground italic">Same as full name</span>}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* School & Location Section */}
        <div>
          <h4 className="font-medium text-foreground mb-4 flex items-center gap-2">
            <School className="h-4 w-4 text-primary" />
            School & Location
          </h4>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label>High School *</Label>
              {isEditing ? (
                <Input
                  value={data.school || ""}
                  onChange={(e) => updateField("school", e.target.value)}
                  placeholder="Your high school name"
                />
              ) : (
                <p className="text-foreground font-medium py-2">
                  {data.school || <span className="text-muted-foreground italic">Not set</span>}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Graduation Year *</Label>
              {isEditing ? (
                <Select
                  value={data.graduationYear?.toString() || ""}
                  onValueChange={(v) => updateField("graduationYear", parseInt(v))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {GRADUATION_YEARS.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
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
            <div className="space-y-2">
              <Label>State *</Label>
              {isEditing ? (
                <Select
                  value={data.state || ""}
                  onValueChange={(v) => updateField("state", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {US_STATES.map((state) => (
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
            <div className="space-y-2">
              <Label>City</Label>
              {isEditing ? (
                <Input
                  value={data.city || ""}
                  onChange={(e) => updateField("city", e.target.value)}
                  placeholder="City"
                />
              ) : (
                <p className="text-foreground font-medium py-2">
                  {data.city || <span className="text-muted-foreground italic">Not set</span>}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Academics Section */}
        <div>
          <h4 className="font-medium text-foreground mb-4 flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-primary" />
            Academic Profile
          </h4>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Unweighted GPA</Label>
              {isEditing ? (
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="4"
                  value={data.gpaUnweighted || ""}
                  onChange={(e) => updateField("gpaUnweighted", parseFloat(e.target.value) || undefined)}
                  placeholder="e.g., 3.85"
                />
              ) : (
                <p className="text-foreground font-medium py-2">
                  {data.gpaUnweighted || <span className="text-muted-foreground italic">—</span>}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Weighted GPA</Label>
              {isEditing ? (
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="5"
                  value={data.gpaWeighted || ""}
                  onChange={(e) => updateField("gpaWeighted", parseFloat(e.target.value) || undefined)}
                  placeholder="e.g., 4.30"
                />
              ) : (
                <p className="text-foreground font-medium py-2">
                  {data.gpaWeighted || <span className="text-muted-foreground italic">—</span>}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>GPA Scale</Label>
              {isEditing ? (
                <Select
                  value={data.gpaScale || "4.0"}
                  onValueChange={(v) => updateField("gpaScale", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="4.0">4.0 Scale</SelectItem>
                    <SelectItem value="5.0">5.0 Scale</SelectItem>
                    <SelectItem value="100">100-Point Scale</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-foreground font-medium py-2">
                  {data.gpaScale ? `${data.gpaScale} Scale` : "4.0 Scale"}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Class Rank (Optional)</Label>
              {isEditing ? (
                <Input
                  value={data.classRank || ""}
                  onChange={(e) => updateField("classRank", e.target.value)}
                  placeholder="e.g., 15"
                />
              ) : (
                <p className="text-foreground font-medium py-2">
                  {data.classRank || <span className="text-muted-foreground italic">Not reported</span>}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Class Size (Optional)</Label>
              {isEditing ? (
                <Input
                  value={data.classSize || ""}
                  onChange={(e) => updateField("classSize", e.target.value)}
                  placeholder="e.g., 450"
                />
              ) : (
                <p className="text-foreground font-medium py-2">
                  {data.classSize || <span className="text-muted-foreground italic">Not reported</span>}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Coursework Rigor</Label>
              {isEditing ? (
                <Select
                  value={data.courseworkRigor || ""}
                  onValueChange={(v) => updateField("courseworkRigor", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select rigor" />
                  </SelectTrigger>
                  <SelectContent>
                    {RIGOR_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-foreground font-medium py-2">
                  {data.courseworkRigor || <span className="text-muted-foreground italic">Not set</span>}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Intended Majors */}
        <div>
          <Label>Intended / Exploratory Majors</Label>
          <p className="text-xs text-muted-foreground mb-2">
            Add majors you're interested in pursuing. This helps match you with relevant scholarships.
          </p>
          <div className="flex flex-wrap gap-2 mb-3">
            {(data.intendedMajors || []).map((major) => (
              <Badge key={major} variant="secondary" className="text-sm py-1 px-3">
                {major}
                {isEditing && (
                  <button
                    type="button"
                    onClick={() => removeMajor(major)}
                    className="ml-2 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </Badge>
            ))}
            {(!data.intendedMajors || data.intendedMajors.length === 0) && !isEditing && (
              <span className="text-muted-foreground italic text-sm">No majors added yet</span>
            )}
          </div>
          {isEditing && (
            <div className="flex gap-2">
              <Input
                value={newMajor}
                onChange={(e) => setNewMajor(e.target.value)}
                placeholder="Add a major (e.g., Computer Science)"
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addMajor())}
                className="flex-1"
              />
              <Button type="button" size="sm" variant="outline" onClick={addMajor}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Academic Narrative */}
        <div className="space-y-2">
          <Label>Academic Narrative (Optional)</Label>
          <p className="text-xs text-muted-foreground mb-2">
            Tell the story of your academic journey—what excites you intellectually? Any context about your grades or curriculum?
          </p>
          {isEditing ? (
            <Textarea
              value={data.academicNarrative || ""}
              onChange={(e) => updateField("academicNarrative", e.target.value)}
              placeholder="Describe your academic interests, any context about your grades, and what drives you intellectually..."
              rows={4}
            />
          ) : (
            <div className="p-3 rounded-lg bg-muted/30 border min-h-[80px]">
              {data.academicNarrative ? (
                <p className="text-foreground whitespace-pre-wrap">{data.academicNarrative}</p>
              ) : (
                <p className="text-muted-foreground italic">No narrative provided</p>
              )}
            </div>
          )}
        </div>

        {/* Context Notes */}
        <div className="space-y-2">
          <Label>Additional Context (Optional)</Label>
          <p className="text-xs text-muted-foreground mb-2">
            Share any background context that's important to your story (first-generation student, family circumstances, work responsibilities, etc.)
          </p>
          {isEditing ? (
            <Textarea
              value={data.contextNotes || ""}
              onChange={(e) => updateField("contextNotes", e.target.value)}
              placeholder="Optional: Share context that helps tell your story and may qualify you for specific scholarships..."
              rows={3}
            />
          ) : (
            <div className="p-3 rounded-lg bg-muted/30 border min-h-[60px]">
              {data.contextNotes ? (
                <p className="text-foreground whitespace-pre-wrap">{data.contextNotes}</p>
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
