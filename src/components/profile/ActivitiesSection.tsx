import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trophy, Plus, Pencil, Trash2, Clock, Calendar } from "lucide-react";
import { mockActivities } from "@/lib/mockData";

interface Props {
  onComplete: (value: number) => void;
}

interface Activity {
  id: string;
  name: string;
  category: string;
  role: string;
  duration: string;
  hoursPerWeek: number;
  weeksPerYear: number;
  description: string;
  impact: string;
  significance: string;
}

const categories = [
  "Academic",
  "Arts",
  "Athletics",
  "Career-Oriented",
  "Community Service",
  "Cultural",
  "Family Responsibilities",
  "Leadership",
  "Research",
  "Work",
  "Other",
];

const emptyActivity: Activity = {
  id: "",
  name: "",
  category: "Academic",
  role: "",
  duration: "9, 10, 11, 12",
  hoursPerWeek: 5,
  weeksPerYear: 40,
  description: "",
  impact: "",
  significance: "",
};

export default function ActivitiesSection({ onComplete }: Props) {
  const [activities, setActivities] = useState<Activity[]>(() =>
    mockActivities.map((a, i) => ({
      id: a.id,
      name: a.name,
      category: a.category,
      role: a.leadership || "Member",
      duration: a.years.join(", "),
      hoursPerWeek: a.hoursPerWeek,
      weeksPerYear: 40,
      description: a.description,
      impact: "",
      significance: "",
    }))
  );

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [formData, setFormData] = useState<Activity>(emptyActivity);

  // Calculate completion
  useEffect(() => {
    // Consider complete if at least 3 activities with descriptions
    const complete = activities.filter((a) => a.name && a.description).length;
    const percentage = Math.min(100, Math.round((complete / 3) * 100));
    onComplete(percentage);
  }, [activities, onComplete]);

  const handleOpenDialog = (activity?: Activity) => {
    if (activity) {
      setEditingActivity(activity);
      setFormData(activity);
    } else {
      setEditingActivity(null);
      setFormData({ ...emptyActivity, id: `activity-${Date.now()}` });
    }
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.name.trim()) return;

    if (editingActivity) {
      setActivities((prev) => prev.map((a) => (a.id === editingActivity.id ? formData : a)));
    } else {
      setActivities((prev) => [...prev, formData]);
    }
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    setActivities((prev) => prev.filter((a) => a.id !== id));
  };

  const updateForm = <K extends keyof Activity>(key: K, value: Activity[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-primary-light">
            <Trophy className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle>Activities & Impact</CardTitle>
            <CardDescription>
              Showcase your extracurriculars, leadership, and achievements
            </CardDescription>
          </div>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-1" />
              Add Activity
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingActivity ? "Edit Activity" : "Add New Activity"}</DialogTitle>
              <DialogDescription>
                Describe your involvement and its impact
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Activity Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => updateForm("name", e.target.value)}
                    placeholder="e.g., Debate Team"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(v) => updateForm("category", v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Your Role</Label>
                  <Input
                    value={formData.role}
                    onChange={(e) => updateForm("role", e.target.value)}
                    placeholder="e.g., Team Captain"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Duration (Grade Years)</Label>
                  <Input
                    value={formData.duration}
                    onChange={(e) => updateForm("duration", e.target.value)}
                    placeholder="e.g., 9, 10, 11, 12"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Hours per Week</Label>
                  <Input
                    type="number"
                    value={formData.hoursPerWeek}
                    onChange={(e) => updateForm("hoursPerWeek", parseInt(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Weeks per Year</Label>
                  <Input
                    type="number"
                    value={formData.weeksPerYear}
                    onChange={(e) => updateForm("weeksPerYear", parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => updateForm("description", e.target.value)}
                  placeholder="Briefly describe the activity..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Impact & Achievements</Label>
                <Textarea
                  value={formData.impact}
                  onChange={(e) => updateForm("impact", e.target.value)}
                  placeholder="What did you accomplish? Include numbers if possible..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Personal Significance</Label>
                <p className="text-xs text-muted-foreground">
                  Why does this activity matter to you personally?
                </p>
                <Textarea
                  value={formData.significance}
                  onChange={(e) => updateForm("significance", e.target.value)}
                  placeholder="What does this activity mean to you?"
                  rows={2}
                />
              </div>

              <Button onClick={handleSave} className="w-full">
                {editingActivity ? "Save Changes" : "Add Activity"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>

      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Trophy className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No activities added yet.</p>
            <p className="text-sm">Click "Add Activity" to get started.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="p-4 rounded-lg border border-border hover:border-primary/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-foreground">{activity.name}</h4>
                      <Badge variant="secondary" size="sm">
                        {activity.category}
                      </Badge>
                    </div>
                    {activity.role && (
                      <p className="text-sm text-primary font-medium">{activity.role}</p>
                    )}
                    <p className="text-sm text-muted-foreground mt-1">{activity.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {activity.hoursPerWeek} hrs/week
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Grades {activity.duration}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleOpenDialog(activity)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(activity.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
