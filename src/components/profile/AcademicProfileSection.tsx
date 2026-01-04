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
import { GraduationCap, Save, Pencil, Plus, X } from "lucide-react";
import { mockStudentProfile } from "@/lib/mockData";

interface Props {
  onComplete: (value: number) => void;
}

interface AcademicData {
  gpaUnweighted: string;
  gpaWeighted: string;
  gpaScale: string;
  classRank: string;
  classSize: string;
  rigorDescription: string;
  satScore: string;
  actScore: string;
  intendedMajors: string[];
  academicNarrative: string;
}

export default function AcademicProfileSection({ onComplete }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [newMajor, setNewMajor] = useState("");
  const [data, setData] = useState<AcademicData>({
    gpaUnweighted: mockStudentProfile.basics.gpa.toString(),
    gpaWeighted: mockStudentProfile.basics.weightedGpa.toString(),
    gpaScale: "4.0",
    classRank: "",
    classSize: "",
    rigorDescription: "Most rigorous curriculum available",
    satScore: mockStudentProfile.academics.satScore?.toString() || "",
    actScore: mockStudentProfile.academics.actScore?.toString() || "",
    intendedMajors: ["Computer Science", "Economics"],
    academicNarrative: "",
  });

  // Calculate completion
  useEffect(() => {
    const fields = [
      data.gpaUnweighted,
      data.gpaScale,
      data.rigorDescription,
      data.intendedMajors.length > 0 ? "filled" : "",
    ];
    const filled = fields.filter((f) => f && f.toString().trim().length > 0).length;
    const percentage = Math.round((filled / fields.length) * 100);
    onComplete(percentage);
  }, [data, onComplete]);

  const handleSave = () => {
    setIsEditing(false);
  };

  const updateField = <K extends keyof AcademicData>(key: K, value: AcademicData[K]) => {
    setData((prev) => ({ ...prev, [key]: value }));
  };

  const addMajor = () => {
    if (newMajor.trim() && !data.intendedMajors.includes(newMajor.trim())) {
      updateField("intendedMajors", [...data.intendedMajors, newMajor.trim()]);
      setNewMajor("");
    }
  };

  const removeMajor = (major: string) => {
    updateField("intendedMajors", data.intendedMajors.filter((m) => m !== major));
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-primary-light">
            <GraduationCap className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle>Academic Profile</CardTitle>
            <CardDescription>
              Your academic achievements, test scores, and intended majors
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
        {/* GPA Section */}
        <div>
          <h4 className="font-medium text-foreground mb-4">Grade Point Average</h4>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Unweighted GPA</Label>
              {isEditing ? (
                <Input
                  type="number"
                  step="0.01"
                  value={data.gpaUnweighted}
                  onChange={(e) => updateField("gpaUnweighted", e.target.value)}
                  placeholder="3.85"
                />
              ) : (
                <p className="text-foreground font-medium py-2">{data.gpaUnweighted || "—"}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Weighted GPA</Label>
              {isEditing ? (
                <Input
                  type="number"
                  step="0.01"
                  value={data.gpaWeighted}
                  onChange={(e) => updateField("gpaWeighted", e.target.value)}
                  placeholder="4.30"
                />
              ) : (
                <p className="text-foreground font-medium py-2">{data.gpaWeighted || "—"}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>GPA Scale</Label>
              {isEditing ? (
                <Select value={data.gpaScale} onValueChange={(v) => updateField("gpaScale", v)}>
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
                <p className="text-foreground font-medium py-2">{data.gpaScale} Scale</p>
              )}
            </div>
          </div>
        </div>

        {/* Class Rank */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Class Rank (Optional)</Label>
            {isEditing ? (
              <Input
                value={data.classRank}
                onChange={(e) => updateField("classRank", e.target.value)}
                placeholder="e.g., 15"
              />
            ) : (
              <p className="text-foreground font-medium py-2">{data.classRank || "Not provided"}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Class Size (Optional)</Label>
            {isEditing ? (
              <Input
                value={data.classSize}
                onChange={(e) => updateField("classSize", e.target.value)}
                placeholder="e.g., 450"
              />
            ) : (
              <p className="text-foreground font-medium py-2">{data.classSize || "Not provided"}</p>
            )}
          </div>
        </div>

        {/* Course Rigor */}
        <div className="space-y-2">
          <Label>Coursework Rigor</Label>
          {isEditing ? (
            <Select value={data.rigorDescription} onValueChange={(v) => updateField("rigorDescription", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Most rigorous curriculum available">Most rigorous curriculum available</SelectItem>
                <SelectItem value="Very rigorous">Very rigorous</SelectItem>
                <SelectItem value="Rigorous">Rigorous</SelectItem>
                <SelectItem value="Average">Average</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <p className="text-foreground font-medium py-2">{data.rigorDescription}</p>
          )}
        </div>

        {/* Test Scores */}
        <div>
          <h4 className="font-medium text-foreground mb-4">Standardized Tests (Optional)</h4>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>SAT Score</Label>
              {isEditing ? (
                <Input
                  type="number"
                  value={data.satScore}
                  onChange={(e) => updateField("satScore", e.target.value)}
                  placeholder="1400–1600"
                />
              ) : (
                <p className="text-foreground font-medium py-2">{data.satScore || "Not provided"}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>ACT Score</Label>
              {isEditing ? (
                <Input
                  type="number"
                  value={data.actScore}
                  onChange={(e) => updateField("actScore", e.target.value)}
                  placeholder="21–36"
                />
              ) : (
                <p className="text-foreground font-medium py-2">{data.actScore || "Not provided"}</p>
              )}
            </div>
          </div>
        </div>

        {/* Intended Majors */}
        <div className="space-y-2">
          <Label>Intended / Exploratory Majors</Label>
          <div className="flex flex-wrap gap-2 mb-2">
            {data.intendedMajors.map((major) => (
              <Badge key={major} variant="secondary" className="text-sm">
                {major}
                {isEditing && (
                  <button
                    type="button"
                    onClick={() => removeMajor(major)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </Badge>
            ))}
          </div>
          {isEditing && (
            <div className="flex gap-2">
              <Input
                value={newMajor}
                onChange={(e) => setNewMajor(e.target.value)}
                placeholder="Add a major..."
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addMajor())}
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
            Tell the story of your academic journey—what excites you intellectually?
          </p>
          {isEditing ? (
            <Textarea
              value={data.academicNarrative}
              onChange={(e) => updateField("academicNarrative", e.target.value)}
              placeholder="Describe your academic interests and journey..."
              rows={4}
            />
          ) : (
            <div className="p-3 rounded-lg bg-muted/30 border min-h-[100px]">
              {data.academicNarrative ? (
                <p className="text-foreground">{data.academicNarrative}</p>
              ) : (
                <p className="text-muted-foreground italic">No narrative provided</p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
