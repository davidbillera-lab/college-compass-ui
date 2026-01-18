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
import { Dumbbell, Save, Pencil, Plus, X, Trophy, Medal, Target } from "lucide-react";

interface AthleticAchievement {
  id: string;
  sport: string;
  level: "varsity" | "jv" | "club" | "recreational" | "travel" | "elite";
  position?: string;
  yearsPlayed: number;
  currentlyPlaying: boolean;
  achievements: string[];
  honors?: string[];
  stats?: string;
  recruitmentInterest?: boolean;
  ncaaEligibilityCenter?: boolean;
}

export interface AthleticAchievementsData {
  sports?: AthleticAchievement[];
  primarySport?: string;
  athleticNarrative?: string;
  recruitmentStatus?: "not-interested" | "exploring" | "actively-recruiting" | "committed";
}

interface Props {
  data: AthleticAchievementsData;
  onChange: (data: AthleticAchievementsData) => void;
  onSave?: () => void;
}

const SPORTS_LIST = [
  "Baseball", "Basketball", "Cheerleading", "Cross Country", "Dance", "Diving",
  "Equestrian", "Fencing", "Field Hockey", "Football", "Golf", "Gymnastics",
  "Ice Hockey", "Lacrosse", "Rowing", "Rugby", "Sailing", "Skiing", "Soccer",
  "Softball", "Swimming", "Tennis", "Track & Field", "Volleyball", "Water Polo",
  "Wrestling", "Other",
];

const LEVEL_OPTIONS = [
  { value: "varsity", label: "Varsity" },
  { value: "jv", label: "Junior Varsity" },
  { value: "club", label: "Club/Travel Team" },
  { value: "travel", label: "Travel/AAU" },
  { value: "elite", label: "Elite/National Level" },
  { value: "recreational", label: "Recreational" },
];

export default function AthleticAchievementsSection({ data, onChange, onSave }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSport, setNewSport] = useState<Partial<AthleticAchievement>>({
    level: "varsity",
    yearsPlayed: 1,
    currentlyPlaying: true,
    achievements: [],
    honors: [],
  });
  const [newAchievement, setNewAchievement] = useState("");
  const [newHonor, setNewHonor] = useState("");

  const handleSave = () => {
    setIsEditing(false);
    onSave?.();
  };

  const addSport = () => {
    if (!newSport.sport) return;

    const sport: AthleticAchievement = {
      id: crypto.randomUUID(),
      sport: newSport.sport,
      level: newSport.level as AthleticAchievement["level"],
      position: newSport.position,
      yearsPlayed: newSport.yearsPlayed || 1,
      currentlyPlaying: newSport.currentlyPlaying ?? true,
      achievements: newSport.achievements || [],
      honors: newSport.honors || [],
      stats: newSport.stats,
      recruitmentInterest: newSport.recruitmentInterest,
      ncaaEligibilityCenter: newSport.ncaaEligibilityCenter,
    };

    onChange({
      ...data,
      sports: [...(data.sports || []), sport],
    });

    setNewSport({
      level: "varsity",
      yearsPlayed: 1,
      currentlyPlaying: true,
      achievements: [],
      honors: [],
    });
    setShowAddForm(false);
  };

  const removeSport = (id: string) => {
    onChange({
      ...data,
      sports: data.sports?.filter((s) => s.id !== id),
    });
  };

  const addAchievementToNew = () => {
    if (newAchievement.trim()) {
      setNewSport({
        ...newSport,
        achievements: [...(newSport.achievements || []), newAchievement.trim()],
      });
      setNewAchievement("");
    }
  };

  const removeAchievementFromNew = (idx: number) => {
    setNewSport({
      ...newSport,
      achievements: newSport.achievements?.filter((_, i) => i !== idx),
    });
  };

  const addHonorToNew = () => {
    if (newHonor.trim()) {
      setNewSport({
        ...newSport,
        honors: [...(newSport.honors || []), newHonor.trim()],
      });
      setNewHonor("");
    }
  };

  const getLevelBadgeVariant = (level: string) => {
    switch (level) {
      case "elite":
        return "default";
      case "varsity":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Dumbbell className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle>Athletic Achievements</CardTitle>
            <CardDescription>
              Sports participation, varsity letters, athletic honors, and recruitment status
            </CardDescription>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {data.sports && data.sports.length > 0 && (
            <Badge variant="secondary">{data.sports.length} sports</Badge>
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
            Athletic Achievements That Strengthen Applications
          </h4>
          <div className="text-sm text-muted-foreground grid md:grid-cols-2 gap-4">
            <ul className="space-y-1 list-disc list-inside">
              <li><strong>Varsity letters</strong> - Years on varsity teams</li>
              <li><strong>Team honors</strong> - Captain, MVP, All-Conference</li>
              <li><strong>Individual records</strong> - Personal bests, school records</li>
            </ul>
            <ul className="space-y-1 list-disc list-inside">
              <li><strong>Championships</strong> - State, regional, national titles</li>
              <li><strong>Recruitment</strong> - NCAA eligibility, coach contacts</li>
              <li><strong>Commitment</strong> - Years of dedication, leadership</li>
            </ul>
          </div>
        </div>

        {/* Recruitment Status */}
        {isEditing && (
          <div className="bg-muted/30 rounded-lg p-4 border">
            <Label className="text-sm font-medium">Athletic Recruitment Status</Label>
            <Select
              value={data.recruitmentStatus || ""}
              onValueChange={(v) => onChange({ ...data, recruitmentStatus: v as AthleticAchievementsData["recruitmentStatus"] })}
            >
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select your recruitment status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="not-interested">Not interested in athletic recruitment</SelectItem>
                <SelectItem value="exploring">Exploring options / Early interest</SelectItem>
                <SelectItem value="actively-recruiting">Actively in recruitment process</SelectItem>
                <SelectItem value="committed">Committed / Signed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Sports List */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-foreground">Your Sports</h4>
            {isEditing && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowAddForm(!showAddForm)}
              >
                {showAddForm ? "Cancel" : (
                  <>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Sport
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Add Sport Form */}
          {showAddForm && isEditing && (
            <div className="border rounded-lg p-4 mb-4 space-y-4 bg-muted/20">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Sport</Label>
                  <Select
                    value={newSport.sport}
                    onValueChange={(v) => setNewSport({ ...newSport, sport: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select sport" />
                    </SelectTrigger>
                    <SelectContent>
                      {SPORTS_LIST.map((sport) => (
                        <SelectItem key={sport} value={sport}>{sport}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Level</Label>
                  <Select
                    value={newSport.level}
                    onValueChange={(v) => setNewSport({ ...newSport, level: v as AthleticAchievement["level"] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LEVEL_OPTIONS.map((level) => (
                        <SelectItem key={level.value} value={level.value}>{level.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Position/Role</Label>
                  <Input
                    value={newSport.position || ""}
                    onChange={(e) => setNewSport({ ...newSport, position: e.target.value })}
                    placeholder="e.g., Point Guard, Pitcher"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Years Played</Label>
                  <Input
                    type="number"
                    min={1}
                    max={12}
                    value={newSport.yearsPlayed || 1}
                    onChange={(e) => setNewSport({ ...newSport, yearsPlayed: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Key Stats (optional)</Label>
                  <Input
                    value={newSport.stats || ""}
                    onChange={(e) => setNewSport({ ...newSport, stats: e.target.value })}
                    placeholder="e.g., 15 PPG, 0.350 BA, 5:02 mile"
                  />
                </div>
              </div>

              {/* Achievements */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Medal className="h-4 w-4" />
                  Achievements & Awards
                </Label>
                {newSport.achievements && newSport.achievements.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {newSport.achievements.map((ach, idx) => (
                      <Badge key={idx} variant="secondary">
                        {ach}
                        <button onClick={() => removeAchievementFromNew(idx)} className="ml-2">
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <Input
                    value={newAchievement}
                    onChange={(e) => setNewAchievement(e.target.value)}
                    placeholder="e.g., State Champion 2024, All-Conference Team"
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addAchievementToNew())}
                  />
                  <Button type="button" variant="outline" onClick={addAchievementToNew}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Honors */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Athletic Honors
                </Label>
                <div className="flex gap-2">
                  <Input
                    value={newHonor}
                    onChange={(e) => setNewHonor(e.target.value)}
                    placeholder="e.g., Team Captain, MVP, Most Improved"
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addHonorToNew())}
                  />
                  <Button type="button" variant="outline" onClick={addHonorToNew}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {newSport.honors && newSport.honors.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {newSport.honors.map((honor, idx) => (
                      <Badge key={idx} variant="outline">{honor}</Badge>
                    ))}
                  </div>
                )}
              </div>

              <Button onClick={addSport} disabled={!newSport.sport} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Sport
              </Button>
            </div>
          )}

          {/* Sports Display */}
          {data.sports && data.sports.length > 0 ? (
            <div className="space-y-4">
              {data.sports.map((sport) => (
                <div
                  key={sport.id}
                  className="border rounded-lg p-4 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h5 className="font-semibold text-foreground">{sport.sport}</h5>
                        <Badge variant={getLevelBadgeVariant(sport.level)}>
                          {LEVEL_OPTIONS.find((l) => l.value === sport.level)?.label}
                        </Badge>
                        {sport.currentlyPlaying && (
                          <Badge variant="outline" className="text-green-600 border-green-600">Active</Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        {sport.position && <p><strong>Position:</strong> {sport.position}</p>}
                        <p><strong>Years:</strong> {sport.yearsPlayed} year{sport.yearsPlayed > 1 ? "s" : ""}</p>
                        {sport.stats && <p><strong>Stats:</strong> {sport.stats}</p>}
                      </div>
                      {sport.achievements && sport.achievements.length > 0 && (
                        <div className="mt-3">
                          <p className="text-xs font-medium text-muted-foreground mb-1">Achievements:</p>
                          <div className="flex flex-wrap gap-1">
                            {sport.achievements.map((ach, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">{ach}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {sport.honors && sport.honors.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs font-medium text-muted-foreground mb-1">Honors:</p>
                          <div className="flex flex-wrap gap-1">
                            {sport.honors.map((honor, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">{honor}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    {isEditing && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => removeSport(sport.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 border rounded-lg border-dashed">
              <Dumbbell className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">
                No sports added yet. Add your athletic activities to strengthen your profile.
              </p>
            </div>
          )}
        </div>

        {/* Athletic Narrative */}
        {isEditing && (
          <div className="space-y-2">
            <Label>Athletic Narrative (optional)</Label>
            <Textarea
              value={data.athleticNarrative || ""}
              onChange={(e) => onChange({ ...data, athleticNarrative: e.target.value })}
              placeholder="Share your athletic journey, what sports mean to you, lessons learned, or goals..."
              rows={3}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
