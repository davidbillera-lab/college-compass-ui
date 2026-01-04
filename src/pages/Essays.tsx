import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { Label } from "@/components/ui/label";
import { FileText, Plus, Clock, Tag, Pencil, Trash2 } from "lucide-react";
import { mockEssays } from "@/lib/mockData";

type EssayStatus = "draft" | "in-progress" | "complete";
type EssayType = "personal_statement" | "scholarship" | "short_answer" | "supplemental";

interface Essay {
  id: string;
  title: string;
  type: EssayType;
  prompt: string;
  content: string;
  wordCount: number;
  lastUpdated: string;
  status: EssayStatus;
  tags: string[];
}

const typeLabels: Record<EssayType, string> = {
  personal_statement: "Personal Statement",
  scholarship: "Scholarship Essay",
  short_answer: "Short Answer",
  supplemental: "Supplemental",
};

const statusVariant: Record<EssayStatus, "secondary" | "default" | "success"> = {
  draft: "secondary",
  "in-progress": "default",
  complete: "success",
};

export default function Essays() {
  const [essays, setEssays] = useState<Essay[]>(() =>
    mockEssays.map((e) => ({
      ...e,
      type: "personal_statement" as EssayType,
      tags: ["common_app"],
    }))
  );

  const [selectedEssay, setSelectedEssay] = useState<Essay | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [newEssayOpen, setNewEssayOpen] = useState(false);
  const [newEssay, setNewEssay] = useState({
    title: "",
    type: "personal_statement" as EssayType,
    prompt: "",
  });

  const handleCreateEssay = () => {
    if (!newEssay.title.trim()) return;

    const essay: Essay = {
      id: `essay-${Date.now()}`,
      title: newEssay.title,
      type: newEssay.type,
      prompt: newEssay.prompt,
      content: "",
      wordCount: 0,
      lastUpdated: new Date().toISOString().split("T")[0],
      status: "draft",
      tags: [],
    };

    setEssays((prev) => [...prev, essay]);
    setNewEssayOpen(false);
    setNewEssay({ title: "", type: "personal_statement", prompt: "" });
  };

  const handleSaveContent = () => {
    if (!selectedEssay) return;

    const wordCount = editContent.trim().split(/\s+/).filter(Boolean).length;

    setEssays((prev) =>
      prev.map((e) =>
        e.id === selectedEssay.id
          ? {
              ...e,
              content: editContent,
              wordCount,
              lastUpdated: new Date().toISOString().split("T")[0],
              status: wordCount > 0 ? "in-progress" : "draft",
            }
          : e
      )
    );

    setSelectedEssay((prev) =>
      prev
        ? {
            ...prev,
            content: editContent,
            wordCount,
            lastUpdated: new Date().toISOString().split("T")[0],
            status: wordCount > 0 ? "in-progress" : "draft",
          }
        : null
    );
    setIsEditing(false);
  };

  const handleDeleteEssay = (id: string) => {
    setEssays((prev) => prev.filter((e) => e.id !== id));
    if (selectedEssay?.id === id) {
      setSelectedEssay(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Essays & Writing</h1>
          <p className="text-muted-foreground mt-1">
            Store and manage your essays, personal statements, and short answers.
          </p>
        </div>

        <Dialog open={newEssayOpen} onOpenChange={setNewEssayOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Essay
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Essay</DialogTitle>
              <DialogDescription>Add a new essay or writing piece to your library.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={newEssay.title}
                  onChange={(e) => setNewEssay((p) => ({ ...p, title: e.target.value }))}
                  placeholder="e.g., Common App Personal Statement"
                />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={newEssay.type}
                  onValueChange={(v) => setNewEssay((p) => ({ ...p, type: v as EssayType }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(typeLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Prompt (optional)</Label>
                <Textarea
                  value={newEssay.prompt}
                  onChange={(e) => setNewEssay((p) => ({ ...p, prompt: e.target.value }))}
                  placeholder="Enter the essay prompt..."
                  rows={3}
                />
              </div>
              <Button onClick={handleCreateEssay} className="w-full">
                Create Essay
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Essay List */}
        <div className="lg:col-span-1 space-y-3">
          <h3 className="font-semibold text-foreground">Your Essays ({essays.length})</h3>
          {essays.length === 0 ? (
            <Card className="p-6 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No essays yet. Create your first one!</p>
            </Card>
          ) : (
            essays.map((essay) => (
              <Card
                key={essay.id}
                className={`cursor-pointer transition-all hover:border-primary/50 ${
                  selectedEssay?.id === essay.id ? "border-primary ring-1 ring-primary/20" : ""
                }`}
                onClick={() => {
                  setSelectedEssay(essay);
                  setEditContent(essay.content);
                  setIsEditing(false);
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-foreground truncate">{essay.title}</h4>
                      <p className="text-sm text-muted-foreground">{typeLabels[essay.type]}</p>
                    </div>
                    <Badge variant={statusVariant[essay.status]} size="sm">
                      {essay.status.replace("-", " ")}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {essay.lastUpdated}
                    </span>
                    <span>{essay.wordCount} words</span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Essay Editor */}
        <div className="lg:col-span-2">
          {selectedEssay ? (
            <Card>
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div className="flex-1">
                  <CardTitle>{selectedEssay.title}</CardTitle>
                  <CardDescription className="mt-1">
                    {selectedEssay.prompt || "No prompt specified"}
                  </CardDescription>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant={statusVariant[selectedEssay.status]}>
                      {selectedEssay.status.replace("-", " ")}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {selectedEssay.wordCount} words
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  {isEditing ? (
                    <>
                      <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                        Cancel
                      </Button>
                      <Button size="sm" onClick={handleSaveContent}>
                        Save
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setIsEditing(true)}
                      >
                        <Pencil className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDeleteEssay(selectedEssay.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    placeholder="Start writing your essay..."
                    className="min-h-[400px] resize-y"
                  />
                ) : (
                  <div className="min-h-[400px] p-4 rounded-lg bg-muted/30 border">
                    {selectedEssay.content ? (
                      <p className="whitespace-pre-wrap text-foreground">{selectedEssay.content}</p>
                    ) : (
                      <p className="text-muted-foreground italic">
                        No content yet. Click Edit to start writing.
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="h-[500px] flex items-center justify-center">
              <div className="text-center">
                <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-1">Select an Essay</h3>
                <p className="text-muted-foreground">Choose an essay from the list to view or edit</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
