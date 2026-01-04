import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import { FileText, Plus, Clock, Tag, Eye, Pencil, Trash2, Link2 } from "lucide-react";
import { mockEssays } from "@/lib/mockData";

interface Props {
  onComplete: (value: number) => void;
}

type ArtifactType = "personal_statement" | "scholarship" | "short_answer" | "supplemental";
type ArtifactStatus = "draft" | "in-progress" | "complete";

interface WritingArtifact {
  id: string;
  title: string;
  type: ArtifactType;
  tags: string[];
  content: string;
  wordCount: number;
  lastUpdated: string;
  status: ArtifactStatus;
  versions: { id: string; content: string; date: string }[];
}

const typeLabels: Record<ArtifactType, string> = {
  personal_statement: "Personal Statement",
  scholarship: "Scholarship Essay",
  short_answer: "Short Answer",
  supplemental: "Supplemental Essay",
};

const statusVariant: Record<ArtifactStatus, "secondary" | "default" | "success"> = {
  draft: "secondary",
  "in-progress": "default",
  complete: "success",
};

export default function WritingLibrarySection({ onComplete }: Props) {
  const [artifacts, setArtifacts] = useState<WritingArtifact[]>(() =>
    mockEssays.map((e) => ({
      id: e.id,
      title: e.title,
      type: "personal_statement" as ArtifactType,
      tags: ["common_app"],
      content: e.content,
      wordCount: e.wordCount,
      lastUpdated: e.lastUpdated,
      status: e.status as ArtifactStatus,
      versions: e.versions,
    }))
  );

  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewingArtifact, setViewingArtifact] = useState<WritingArtifact | null>(null);
  const [newArtifact, setNewArtifact] = useState({
    title: "",
    type: "personal_statement" as ArtifactType,
    content: "",
  });

  // Calculate completion
  useEffect(() => {
    const complete = artifacts.filter((a) => a.wordCount > 100).length;
    const percentage = Math.min(100, Math.round((complete / 2) * 100)); // Need at least 2 essays
    onComplete(percentage);
  }, [artifacts, onComplete]);

  const handleCreate = () => {
    if (!newArtifact.title.trim()) return;

    const wordCount = newArtifact.content.trim().split(/\s+/).filter(Boolean).length;

    const artifact: WritingArtifact = {
      id: `artifact-${Date.now()}`,
      title: newArtifact.title,
      type: newArtifact.type,
      tags: [],
      content: newArtifact.content,
      wordCount,
      lastUpdated: new Date().toISOString().split("T")[0],
      status: wordCount > 0 ? "in-progress" : "draft",
      versions: [],
    };

    setArtifacts((prev) => [...prev, artifact]);
    setDialogOpen(false);
    setNewArtifact({ title: "", type: "personal_statement", content: "" });
  };

  const handleDelete = (id: string) => {
    setArtifacts((prev) => prev.filter((a) => a.id !== id));
    if (viewingArtifact?.id === id) {
      setViewingArtifact(null);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-primary-light">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle>Writing & Artifacts Library</CardTitle>
            <CardDescription>
              Store your essays, personal statements, and short answers for easy reuse
            </CardDescription>
          </div>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              New Artifact
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Writing Artifact</DialogTitle>
              <DialogDescription>
                Add a new essay or writing piece to your library
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Title *</Label>
                  <Input
                    value={newArtifact.title}
                    onChange={(e) => setNewArtifact((p) => ({ ...p, title: e.target.value }))}
                    placeholder="e.g., Common App Personal Statement"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={newArtifact.type}
                    onValueChange={(v) => setNewArtifact((p) => ({ ...p, type: v as ArtifactType }))}
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
              </div>

              <div className="space-y-2">
                <Label>Content (Optional - can add later)</Label>
                <Textarea
                  value={newArtifact.content}
                  onChange={(e) => setNewArtifact((p) => ({ ...p, content: e.target.value }))}
                  placeholder="Start writing or paste your essay..."
                  rows={8}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {newArtifact.content.trim().split(/\s+/).filter(Boolean).length} words
                </p>
              </div>

              <Button onClick={handleCreate} className="w-full">
                Create Artifact
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>

      <CardContent>
        {artifacts.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No writing artifacts yet.</p>
            <p className="text-sm">Create your first essay or short answer to get started.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {artifacts.map((artifact) => (
              <div
                key={artifact.id}
                className="p-4 rounded-lg border border-border hover:border-primary/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-foreground truncate">{artifact.title}</h4>
                    <p className="text-sm text-muted-foreground">{typeLabels[artifact.type]}</p>
                  </div>
                  <Badge variant={statusVariant[artifact.status]} size="sm">
                    {artifact.status.replace("-", " ")}
                  </Badge>
                </div>

                {artifact.content && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {artifact.content}
                  </p>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {artifact.lastUpdated}
                    </span>
                    <span>{artifact.wordCount} words</span>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setViewingArtifact(artifact)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(artifact.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Viewing Modal */}
        <Dialog open={!!viewingArtifact} onOpenChange={(open) => !open && setViewingArtifact(null)}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            {viewingArtifact && (
              <>
                <DialogHeader>
                  <DialogTitle>{viewingArtifact.title}</DialogTitle>
                  <DialogDescription>
                    {typeLabels[viewingArtifact.type]} • {viewingArtifact.wordCount} words
                  </DialogDescription>
                </DialogHeader>
                <div className="pt-4">
                  <div className="p-4 rounded-lg bg-muted/30 border min-h-[200px]">
                    {viewingArtifact.content ? (
                      <p className="whitespace-pre-wrap text-foreground">{viewingArtifact.content}</p>
                    ) : (
                      <p className="text-muted-foreground italic">No content yet.</p>
                    )}
                  </div>
                  {viewingArtifact.versions.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-foreground mb-2">
                        Version History ({viewingArtifact.versions.length})
                      </p>
                      <div className="space-y-1">
                        {viewingArtifact.versions.map((v) => (
                          <div key={v.id} className="text-xs text-muted-foreground">
                            {v.date}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        <div className="mt-6 p-4 rounded-lg bg-muted/30 border">
          <div className="flex items-start gap-3">
            <Link2 className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">
                Link to Scholarships
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Once you have essays saved here, you can link them to scholarship applications to track which essays you've used.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
