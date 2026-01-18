import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GraduationCap, Save, Pencil, Plus, X, Award, Star, Trophy, BookOpen } from "lucide-react";

interface AcademicAward {
  id: string;
  name: string;
  organization?: string;
  level: "school" | "regional" | "state" | "national" | "international";
  year: number;
  description?: string;
  category: string;
}

interface AcademicProgram {
  id: string;
  name: string;
  type: "honor-society" | "academic-program" | "summer-program" | "research" | "competition";
  organization?: string;
  yearsInvolved: number;
  role?: string;
  achievements?: string[];
}

export interface AcademicAchievementsData {
  awards?: AcademicAward[];
  programs?: AcademicProgram[];
  honorRoll?: boolean;
  honorRollSemesters?: number;
  nationalMeritStatus?: "none" | "commended" | "semifinalist" | "finalist" | "scholar";
  classRankPercentile?: number;
  academicNarrative?: string;
}

interface Props {
  data: AcademicAchievementsData;
  onChange: (data: AcademicAchievementsData) => void;
  onSave?: () => void;
}

const AWARD_CATEGORIES = [
  "Academic Excellence",
  "Subject-Specific Award",
  "Science Fair / STEM",
  "Math Competition",
  "Debate / Speech",
  "Writing / Essay",
  "Research",
  "Language / Linguistics",
  "Arts / Creative",
  "Community Impact",
  "Leadership",
  "Other",
];

const AWARD_LEVELS = [
  { value: "school", label: "School Level" },
  { value: "regional", label: "Regional / District" },
  { value: "state", label: "State Level" },
  { value: "national", label: "National Level" },
  { value: "international", label: "International" },
];

const PROGRAM_TYPES = [
  { value: "honor-society", label: "Honor Society" },
  { value: "academic-program", label: "Academic Program" },
  { value: "summer-program", label: "Summer Program" },
  { value: "research", label: "Research Experience" },
  { value: "competition", label: "Competition Team" },
];

const HONOR_SOCIETIES = [
  "National Honor Society (NHS)",
  "National Junior Honor Society (NJHS)",
  "National Beta Club",
  "Mu Alpha Theta (Math)",
  "Science National Honor Society",
  "Tri-M Music Honor Society",
  "National Art Honor Society",
  "Quill and Scroll",
  "Sociedad Honoraria Hispánica",
  "French Honor Society",
  "German Honor Society",
  "National English Honor Society",
  "Rho Kappa (Social Studies)",
  "Computer Science Honor Society",
  "Other",
];

export default function AcademicAchievementsSection({ data, onChange, onSave }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [showAddAward, setShowAddAward] = useState(false);
  const [showAddProgram, setShowAddProgram] = useState(false);
  const [newAward, setNewAward] = useState<Partial<AcademicAward>>({
    level: "school",
    year: new Date().getFullYear(),
    category: "Academic Excellence",
  });
  const [newProgram, setNewProgram] = useState<Partial<AcademicProgram>>({
    type: "honor-society",
    yearsInvolved: 1,
    achievements: [],
  });
  const [newProgramAchievement, setNewProgramAchievement] = useState("");

  const handleSave = () => {
    setIsEditing(false);
    onSave?.();
  };

  const addAward = () => {
    if (!newAward.name) return;

    const award: AcademicAward = {
      id: crypto.randomUUID(),
      name: newAward.name,
      organization: newAward.organization,
      level: newAward.level as AcademicAward["level"],
      year: newAward.year || new Date().getFullYear(),
      description: newAward.description,
      category: newAward.category || "Academic Excellence",
    };

    onChange({
      ...data,
      awards: [...(data.awards || []), award],
    });

    setNewAward({
      level: "school",
      year: new Date().getFullYear(),
      category: "Academic Excellence",
    });
    setShowAddAward(false);
  };

  const removeAward = (id: string) => {
    onChange({
      ...data,
      awards: data.awards?.filter((a) => a.id !== id),
    });
  };

  const addProgram = () => {
    if (!newProgram.name) return;

    const program: AcademicProgram = {
      id: crypto.randomUUID(),
      name: newProgram.name,
      type: newProgram.type as AcademicProgram["type"],
      organization: newProgram.organization,
      yearsInvolved: newProgram.yearsInvolved || 1,
      role: newProgram.role,
      achievements: newProgram.achievements,
    };

    onChange({
      ...data,
      programs: [...(data.programs || []), program],
    });

    setNewProgram({
      type: "honor-society",
      yearsInvolved: 1,
      achievements: [],
    });
    setShowAddProgram(false);
  };

  const removeProgram = (id: string) => {
    onChange({
      ...data,
      programs: data.programs?.filter((p) => p.id !== id),
    });
  };

  const addAchievementToProgram = () => {
    if (newProgramAchievement.trim()) {
      setNewProgram({
        ...newProgram,
        achievements: [...(newProgram.achievements || []), newProgramAchievement.trim()],
      });
      setNewProgramAchievement("");
    }
  };

  const getLevelBadgeVariant = (level: string) => {
    switch (level) {
      case "international":
      case "national":
        return "default";
      case "state":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getMeritLabel = (status: string) => {
    switch (status) {
      case "commended":
        return "Commended Student";
      case "semifinalist":
        return "Semifinalist";
      case "finalist":
        return "Finalist";
      case "scholar":
        return "Scholar";
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <GraduationCap className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle>Academic Achievements</CardTitle>
            <CardDescription>
              Awards, honors, competitions, and academic programs
            </CardDescription>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {data.nationalMeritStatus && data.nationalMeritStatus !== "none" && (
            <Badge variant="default" className="bg-amber-500">
              National Merit {getMeritLabel(data.nationalMeritStatus)}
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
        {/* Why This Matters */}
        <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg p-4 border border-primary/20">
          <h4 className="font-medium text-sm text-foreground mb-2 flex items-center gap-2">
            <Trophy className="h-4 w-4 text-primary" />
            Academic Achievements That Stand Out
          </h4>
          <div className="text-sm text-muted-foreground grid md:grid-cols-2 gap-4">
            <ul className="space-y-1 list-disc list-inside">
              <li><strong>National Merit</strong> - PSAT-based recognition</li>
              <li><strong>Honor societies</strong> - NHS, subject-specific honors</li>
              <li><strong>Competitions</strong> - Math Olympiad, Science Bowl</li>
            </ul>
            <ul className="space-y-1 list-disc list-inside">
              <li><strong>Research</strong> - Published work, mentorships</li>
              <li><strong>Summer programs</strong> - Selective academic camps</li>
              <li><strong>Subject awards</strong> - Department honors</li>
            </ul>
          </div>
        </div>

        {/* Quick Stats */}
        {isEditing && (
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-muted/30 rounded-lg p-4 border">
              <Label className="text-sm font-medium">National Merit Status</Label>
              <Select
                value={data.nationalMeritStatus || "none"}
                onValueChange={(v) => onChange({ ...data, nationalMeritStatus: v as AcademicAchievementsData["nationalMeritStatus"] })}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Not applicable</SelectItem>
                  <SelectItem value="commended">Commended Student</SelectItem>
                  <SelectItem value="semifinalist">Semifinalist</SelectItem>
                  <SelectItem value="finalist">Finalist</SelectItem>
                  <SelectItem value="scholar">Scholar</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="bg-muted/30 rounded-lg p-4 border">
              <Label className="text-sm font-medium">Honor Roll</Label>
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  id="honorRoll"
                  checked={data.honorRoll || false}
                  onChange={(e) => onChange({ ...data, honorRoll: e.target.checked })}
                  className="h-4 w-4"
                />
                <Label htmlFor="honorRoll" className="text-sm text-muted-foreground">On honor roll</Label>
              </div>
              {data.honorRoll && (
                <Input
                  type="number"
                  min={1}
                  max={16}
                  value={data.honorRollSemesters || ""}
                  onChange={(e) => onChange({ ...data, honorRollSemesters: parseInt(e.target.value) || undefined })}
                  placeholder="# semesters"
                  className="mt-2"
                />
              )}
            </div>
            <div className="bg-muted/30 rounded-lg p-4 border">
              <Label className="text-sm font-medium">Class Rank Percentile</Label>
              <Input
                type="number"
                min={1}
                max={100}
                value={data.classRankPercentile || ""}
                onChange={(e) => onChange({ ...data, classRankPercentile: parseInt(e.target.value) || undefined })}
                placeholder="e.g., 5 for top 5%"
                className="mt-2"
              />
            </div>
          </div>
        )}

        {/* Awards Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-foreground flex items-center gap-2">
              <Award className="h-4 w-4" />
              Academic Awards
            </h4>
            {isEditing && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowAddAward(!showAddAward)}
              >
                {showAddAward ? "Cancel" : (
                  <>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Award
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Add Award Form */}
          {showAddAward && isEditing && (
            <div className="border rounded-lg p-4 mb-4 space-y-4 bg-muted/20">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Award Name</Label>
                  <Input
                    value={newAward.name || ""}
                    onChange={(e) => setNewAward({ ...newAward, name: e.target.value })}
                    placeholder="e.g., Presidential Scholar, AP Scholar with Distinction"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Granting Organization (optional)</Label>
                  <Input
                    value={newAward.organization || ""}
                    onChange={(e) => setNewAward({ ...newAward, organization: e.target.value })}
                    placeholder="e.g., College Board, Science Olympiad"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={newAward.category}
                    onValueChange={(v) => setNewAward({ ...newAward, category: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AWARD_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Level</Label>
                  <Select
                    value={newAward.level}
                    onValueChange={(v) => setNewAward({ ...newAward, level: v as AcademicAward["level"] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AWARD_LEVELS.map((level) => (
                        <SelectItem key={level.value} value={level.value}>{level.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Year</Label>
                  <Input
                    type="number"
                    min={2015}
                    max={2030}
                    value={newAward.year || new Date().getFullYear()}
                    onChange={(e) => setNewAward({ ...newAward, year: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description (optional)</Label>
                <Textarea
                  value={newAward.description || ""}
                  onChange={(e) => setNewAward({ ...newAward, description: e.target.value })}
                  placeholder="Briefly describe the award and what you did to earn it..."
                  rows={2}
                />
              </div>

              <Button onClick={addAward} disabled={!newAward.name} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Award
              </Button>
            </div>
          )}

          {/* Awards Display */}
          {data.awards && data.awards.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-3">
              {data.awards.map((award) => (
                <div
                  key={award.id}
                  className="border rounded-lg p-3 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h5 className="font-medium text-sm text-foreground truncate">{award.name}</h5>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge variant={getLevelBadgeVariant(award.level)} className="text-xs">
                          {AWARD_LEVELS.find((l) => l.value === award.level)?.label}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{award.year}</span>
                      </div>
                      {award.organization && (
                        <p className="text-xs text-muted-foreground mt-1">{award.organization}</p>
                      )}
                    </div>
                    {isEditing && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                        onClick={() => removeAward(award.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 border rounded-lg border-dashed">
              <Award className="h-10 w-10 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">No awards added yet.</p>
            </div>
          )}
        </div>

        {/* Programs Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-foreground flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Honor Societies & Academic Programs
            </h4>
            {isEditing && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowAddProgram(!showAddProgram)}
              >
                {showAddProgram ? "Cancel" : (
                  <>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Program
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Add Program Form */}
          {showAddProgram && isEditing && (
            <div className="border rounded-lg p-4 mb-4 space-y-4 bg-muted/20">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Program Name</Label>
                  <Select
                    value={newProgram.name}
                    onValueChange={(v) => setNewProgram({ ...newProgram, name: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select or type custom" />
                    </SelectTrigger>
                    <SelectContent>
                      {HONOR_SOCIETIES.map((hs) => (
                        <SelectItem key={hs} value={hs}>{hs}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={newProgram.type}
                    onValueChange={(v) => setNewProgram({ ...newProgram, type: v as AcademicProgram["type"] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PROGRAM_TYPES.map((pt) => (
                        <SelectItem key={pt.value} value={pt.value}>{pt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Role (optional)</Label>
                  <Input
                    value={newProgram.role || ""}
                    onChange={(e) => setNewProgram({ ...newProgram, role: e.target.value })}
                    placeholder="e.g., President, Secretary, Member"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Years Involved</Label>
                  <Input
                    type="number"
                    min={1}
                    max={8}
                    value={newProgram.yearsInvolved || 1}
                    onChange={(e) => setNewProgram({ ...newProgram, yearsInvolved: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Key Achievements (optional)</Label>
                <div className="flex gap-2">
                  <Input
                    value={newProgramAchievement}
                    onChange={(e) => setNewProgramAchievement(e.target.value)}
                    placeholder="e.g., Led tutoring program for 50 students"
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addAchievementToProgram())}
                  />
                  <Button type="button" variant="outline" onClick={addAchievementToProgram}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {newProgram.achievements && newProgram.achievements.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {newProgram.achievements.map((ach, idx) => (
                      <Badge key={idx} variant="secondary">{ach}</Badge>
                    ))}
                  </div>
                )}
              </div>

              <Button onClick={addProgram} disabled={!newProgram.name} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Program
              </Button>
            </div>
          )}

          {/* Programs Display */}
          {data.programs && data.programs.length > 0 ? (
            <div className="space-y-3">
              {data.programs.map((program) => (
                <div
                  key={program.id}
                  className="border rounded-lg p-3 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Star className="h-4 w-4 text-amber-500" />
                        <h5 className="font-medium text-sm text-foreground">{program.name}</h5>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-xs">
                          {PROGRAM_TYPES.find((pt) => pt.value === program.type)?.label}
                        </Badge>
                        {program.role && (
                          <Badge variant="secondary" className="text-xs">{program.role}</Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {program.yearsInvolved} year{program.yearsInvolved > 1 ? "s" : ""}
                        </span>
                      </div>
                      {program.achievements && program.achievements.length > 0 && (
                        <div className="mt-2 text-xs text-muted-foreground">
                          {program.achievements.join(" • ")}
                        </div>
                      )}
                    </div>
                    {isEditing && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                        onClick={() => removeProgram(program.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 border rounded-lg border-dashed">
              <BookOpen className="h-10 w-10 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">No programs added yet.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
