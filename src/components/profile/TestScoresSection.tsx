import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calculator, Save, Pencil, Plus, X, Info, Award } from "lucide-react";

interface SATScore {
  total?: number;
  reading?: number;
  math?: number;
  essay?: number;
}

interface ACTScore {
  composite?: number;
  english?: number;
  math?: number;
  reading?: number;
  science?: number;
  writing?: number;
}

interface APScore {
  subject: string;
  score: number;
  year: number;
}

interface SubjectTest {
  subject: string;
  score: number;
}

export interface TestScoresData {
  testPolicy?: "test-required" | "test-optional" | "test-blind" | "superscore";
  sat?: SATScore;
  act?: ACTScore;
  apScores?: APScore[];
  subjectTests?: SubjectTest[];
  psat?: number;
  clep?: { subject: string; score: number }[];
  ib?: { subject: string; score: number; level: "HL" | "SL" }[];
}

interface Props {
  data: TestScoresData;
  onChange: (data: TestScoresData) => void;
  onSave?: () => void;
}

const AP_SUBJECTS = [
  "AP Biology", "AP Chemistry", "AP Physics 1", "AP Physics 2", "AP Physics C: Mechanics",
  "AP Calculus AB", "AP Calculus BC", "AP Statistics", "AP Computer Science A", "AP Computer Science Principles",
  "AP English Language", "AP English Literature", "AP US History", "AP World History", "AP European History",
  "AP Psychology", "AP Economics (Macro)", "AP Economics (Micro)", "AP Government", "AP Human Geography",
  "AP Spanish", "AP French", "AP German", "AP Latin", "AP Chinese", "AP Japanese",
  "AP Art History", "AP Music Theory", "AP Studio Art", "AP Environmental Science",
];

const SUBJECT_TEST_OPTIONS = [
  "Math Level 1", "Math Level 2", "Biology E/M", "Chemistry", "Physics",
  "US History", "World History", "Literature", "Spanish", "French", "German",
];

export default function TestScoresSection({ data, onChange, onSave }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [newApSubject, setNewApSubject] = useState("");
  const [newApScore, setNewApScore] = useState("");
  const [newApYear, setNewApYear] = useState(new Date().getFullYear().toString());

  const handleSave = () => {
    setIsEditing(false);
    onSave?.();
  };

  const updateSAT = (key: keyof SATScore, value: string) => {
    const numValue = value ? parseInt(value) : undefined;
    onChange({
      ...data,
      sat: { ...data.sat, [key]: numValue },
    });
  };

  const updateACT = (key: keyof ACTScore, value: string) => {
    const numValue = value ? parseInt(value) : undefined;
    onChange({
      ...data,
      act: { ...data.act, [key]: numValue },
    });
  };

  const addAPScore = () => {
    if (newApSubject && newApScore) {
      const score = parseInt(newApScore);
      if (score >= 1 && score <= 5) {
        onChange({
          ...data,
          apScores: [
            ...(data.apScores || []),
            { subject: newApSubject, score, year: parseInt(newApYear) },
          ],
        });
        setNewApSubject("");
        setNewApScore("");
      }
    }
  };

  const removeAPScore = (index: number) => {
    onChange({
      ...data,
      apScores: data.apScores?.filter((_, i) => i !== index),
    });
  };

  const getScoreQuality = (sat?: number, act?: number): string | null => {
    if (sat && sat >= 1400) return "Strong";
    if (sat && sat >= 1200) return "Competitive";
    if (act && act >= 30) return "Strong";
    if (act && act >= 25) return "Competitive";
    return null;
  };

  const scoreQuality = getScoreQuality(data.sat?.total, data.act?.composite);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Calculator className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle>Standardized Test Scores</CardTitle>
            <CardDescription>
              SAT, ACT, AP exams, and other standardized tests
            </CardDescription>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {scoreQuality && (
            <Badge variant="secondary" className="text-xs">
              {scoreQuality} Scores
            </Badge>
          )}
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

      <CardContent className="space-y-6">
        {/* Test Policy */}
        <div className="bg-muted/30 rounded-lg p-4 border">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div>
              <Label className="text-sm font-medium">Your Testing Approach</Label>
              {isEditing ? (
                <Select
                  value={data.testPolicy || ""}
                  onValueChange={(v) => onChange({ ...data, testPolicy: v as TestScoresData["testPolicy"] })}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select your approach" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="test-required">Submitting scores (test-required schools)</SelectItem>
                    <SelectItem value="test-optional">Test-optional (may submit)</SelectItem>
                    <SelectItem value="test-blind">Not submitting scores</SelectItem>
                    <SelectItem value="superscore">Planning to superscore</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm text-muted-foreground mt-1">
                  {data.testPolicy === "test-required" && "Submitting scores to test-required schools"}
                  {data.testPolicy === "test-optional" && "Test-optional - may submit scores"}
                  {data.testPolicy === "test-blind" && "Not submitting test scores"}
                  {data.testPolicy === "superscore" && "Planning to superscore across test dates"}
                  {!data.testPolicy && "Not specified"}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* SAT Scores */}
        <div>
          <h4 className="font-medium text-foreground mb-4">SAT Scores</h4>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Total Score</Label>
              {isEditing ? (
                <Input
                  type="number"
                  min={400}
                  max={1600}
                  value={data.sat?.total || ""}
                  onChange={(e) => updateSAT("total", e.target.value)}
                  placeholder="400-1600"
                />
              ) : (
                <p className="text-foreground font-medium py-2">{data.sat?.total || "—"}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Reading & Writing</Label>
              {isEditing ? (
                <Input
                  type="number"
                  min={200}
                  max={800}
                  value={data.sat?.reading || ""}
                  onChange={(e) => updateSAT("reading", e.target.value)}
                  placeholder="200-800"
                />
              ) : (
                <p className="text-foreground font-medium py-2">{data.sat?.reading || "—"}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Math</Label>
              {isEditing ? (
                <Input
                  type="number"
                  min={200}
                  max={800}
                  value={data.sat?.math || ""}
                  onChange={(e) => updateSAT("math", e.target.value)}
                  placeholder="200-800"
                />
              ) : (
                <p className="text-foreground font-medium py-2">{data.sat?.math || "—"}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>PSAT/NMSQT</Label>
              {isEditing ? (
                <Input
                  type="number"
                  min={320}
                  max={1520}
                  value={data.psat || ""}
                  onChange={(e) => onChange({ ...data, psat: e.target.value ? parseInt(e.target.value) : undefined })}
                  placeholder="320-1520"
                />
              ) : (
                <p className="text-foreground font-medium py-2">{data.psat || "—"}</p>
              )}
            </div>
          </div>
        </div>

        {/* ACT Scores */}
        <div>
          <h4 className="font-medium text-foreground mb-4">ACT Scores</h4>
          <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="space-y-2">
              <Label>Composite</Label>
              {isEditing ? (
                <Input
                  type="number"
                  min={1}
                  max={36}
                  value={data.act?.composite || ""}
                  onChange={(e) => updateACT("composite", e.target.value)}
                  placeholder="1-36"
                />
              ) : (
                <p className="text-foreground font-medium py-2">{data.act?.composite || "—"}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>English</Label>
              {isEditing ? (
                <Input
                  type="number"
                  min={1}
                  max={36}
                  value={data.act?.english || ""}
                  onChange={(e) => updateACT("english", e.target.value)}
                  placeholder="1-36"
                />
              ) : (
                <p className="text-foreground font-medium py-2">{data.act?.english || "—"}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Math</Label>
              {isEditing ? (
                <Input
                  type="number"
                  min={1}
                  max={36}
                  value={data.act?.math || ""}
                  onChange={(e) => updateACT("math", e.target.value)}
                  placeholder="1-36"
                />
              ) : (
                <p className="text-foreground font-medium py-2">{data.act?.math || "—"}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Reading</Label>
              {isEditing ? (
                <Input
                  type="number"
                  min={1}
                  max={36}
                  value={data.act?.reading || ""}
                  onChange={(e) => updateACT("reading", e.target.value)}
                  placeholder="1-36"
                />
              ) : (
                <p className="text-foreground font-medium py-2">{data.act?.reading || "—"}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Science</Label>
              {isEditing ? (
                <Input
                  type="number"
                  min={1}
                  max={36}
                  value={data.act?.science || ""}
                  onChange={(e) => updateACT("science", e.target.value)}
                  placeholder="1-36"
                />
              ) : (
                <p className="text-foreground font-medium py-2">{data.act?.science || "—"}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Writing</Label>
              {isEditing ? (
                <Input
                  type="number"
                  min={2}
                  max={12}
                  value={data.act?.writing || ""}
                  onChange={(e) => updateACT("writing", e.target.value)}
                  placeholder="2-12"
                />
              ) : (
                <p className="text-foreground font-medium py-2">{data.act?.writing || "—"}</p>
              )}
            </div>
          </div>
        </div>

        {/* AP Scores */}
        <div>
          <h4 className="font-medium text-foreground mb-4 flex items-center gap-2">
            <Award className="h-4 w-4" />
            AP Exam Scores
          </h4>
          <p className="text-xs text-muted-foreground mb-3">
            Strong AP scores (4-5) can qualify you for academic merit scholarships and demonstrate college readiness.
          </p>

          {data.apScores && data.apScores.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {data.apScores.map((ap, idx) => (
                <Badge
                  key={idx}
                  variant={ap.score >= 4 ? "default" : "secondary"}
                  className="text-sm py-1 px-3"
                >
                  {ap.subject}: {ap.score}
                  {isEditing && (
                    <button
                      type="button"
                      onClick={() => removeAPScore(idx)}
                      className="ml-2 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </Badge>
              ))}
            </div>
          )}

          {isEditing && (
            <div className="flex flex-wrap gap-2 items-end">
              <div className="space-y-1 flex-1 min-w-[200px]">
                <Label className="text-xs">Subject</Label>
                <Select value={newApSubject} onValueChange={setNewApSubject}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select AP exam" />
                  </SelectTrigger>
                  <SelectContent>
                    {AP_SUBJECTS.map((subj) => (
                      <SelectItem key={subj} value={subj}>
                        {subj}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1 w-24">
                <Label className="text-xs">Score (1-5)</Label>
                <Input
                  type="number"
                  min={1}
                  max={5}
                  value={newApScore}
                  onChange={(e) => setNewApScore(e.target.value)}
                  placeholder="1-5"
                />
              </div>
              <div className="space-y-1 w-24">
                <Label className="text-xs">Year</Label>
                <Input
                  type="number"
                  min={2015}
                  max={2030}
                  value={newApYear}
                  onChange={(e) => setNewApYear(e.target.value)}
                />
              </div>
              <Button type="button" size="sm" variant="outline" onClick={addAPScore}>
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
