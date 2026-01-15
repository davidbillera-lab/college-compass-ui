import { useState, useRef } from "react";
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
import {
  Video,
  Upload,
  Play,
  Trash2,
  Plus,
  Trophy,
  Music,
  Users,
  Heart,
  Dumbbell,
  Palette,
  BookOpen,
  Globe,
  Star,
  ExternalLink,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface VideoItem {
  id: string;
  title: string;
  description?: string;
  category: string;
  url: string;
  thumbnailUrl?: string;
  uploadedAt: string;
  duration?: string;
  isExternal?: boolean;
}

export interface VideoShowcaseData {
  videos?: VideoItem[];
}

interface Props {
  data: VideoShowcaseData;
  onChange: (data: VideoShowcaseData) => void;
  onSave?: () => void;
}

const VIDEO_CATEGORIES = [
  { value: "athletics", label: "Athletic Highlights", icon: Dumbbell, description: "Game highlights, training footage, tournaments" },
  { value: "academic", label: "Academic Competitions", icon: BookOpen, description: "Science fairs, debate tournaments, spelling bees" },
  { value: "performing-arts", label: "Performing Arts", icon: Music, description: "Music performances, theater, dance recitals" },
  { value: "visual-arts", label: "Visual Arts", icon: Palette, description: "Art portfolio walkthroughs, exhibitions" },
  { value: "community-service", label: "Community Service", icon: Heart, description: "Volunteer work, charity events, fundraisers" },
  { value: "leadership", label: "Leadership & Clubs", icon: Users, description: "Club activities, leadership moments, events organized" },
  { value: "competitions", label: "Other Competitions", icon: Trophy, description: "Hackathons, robotics, entrepreneurship" },
  { value: "international", label: "International Experience", icon: Globe, description: "Study abroad, cultural exchange, travel projects" },
  { value: "other", label: "Other", icon: Star, description: "Any other showcase content" },
];

export default function VideoShowcaseSection({ data, onChange, onSave }: Props) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addMode, setAddMode] = useState<"upload" | "link">("upload");
  const [newVideo, setNewVideo] = useState<Partial<VideoItem>>({
    category: "athletics",
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file size (100MB max)
    if (file.size > 104857600) {
      alert("File size must be under 100MB");
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `${user.id}/videos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("profile-media")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("profile-media")
        .getPublicUrl(filePath);

      const video: VideoItem = {
        id: crypto.randomUUID(),
        title: newVideo.title || file.name.replace(/\.[^/.]+$/, ""),
        description: newVideo.description,
        category: newVideo.category || "other",
        url: urlData.publicUrl,
        uploadedAt: new Date().toISOString(),
        isExternal: false,
      };

      onChange({
        ...data,
        videos: [...(data.videos || []), video],
      });

      setNewVideo({ category: "athletics" });
      setShowAddForm(false);
      onSave?.();
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const addExternalVideo = () => {
    if (!newVideo.url || !newVideo.title) return;

    const video: VideoItem = {
      id: crypto.randomUUID(),
      title: newVideo.title,
      description: newVideo.description,
      category: newVideo.category || "other",
      url: newVideo.url,
      uploadedAt: new Date().toISOString(),
      isExternal: true,
    };

    onChange({
      ...data,
      videos: [...(data.videos || []), video],
    });

    setNewVideo({ category: "athletics" });
    setShowAddForm(false);
    onSave?.();
  };

  const removeVideo = async (videoId: string) => {
    const video = data.videos?.find((v) => v.id === videoId);
    
    // If it's an uploaded video, try to delete from storage
    if (video && !video.isExternal && user) {
      try {
        // Extract path from URL
        const urlParts = video.url.split("/profile-media/");
        if (urlParts[1]) {
          await supabase.storage.from("profile-media").remove([urlParts[1]]);
        }
      } catch (err) {
        console.error("Error deleting file:", err);
      }
    }

    onChange({
      ...data,
      videos: data.videos?.filter((v) => v.id !== videoId),
    });
    onSave?.();
  };

  const getCategoryIcon = (category: string) => {
    const cat = VIDEO_CATEGORIES.find((c) => c.value === category);
    return cat?.icon || Star;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Video className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Video Showcase</CardTitle>
              <CardDescription>
                Upload videos of your achievements, performances, and activities
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline">
            {data.videos?.length || 0} videos
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Why Videos Matter */}
        <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg p-4 border border-primary/20">
          <h4 className="font-medium text-sm text-foreground mb-2 flex items-center gap-2">
            <Trophy className="h-4 w-4 text-primary" />
            Videos That Strengthen Scholarship Applications
          </h4>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-muted-foreground">
            <ul className="space-y-1 list-disc list-inside">
              <li><strong>Athletic highlights</strong> - Game footage, tournaments, training</li>
              <li><strong>Music/Dance performances</strong> - Recitals, competitions, auditions</li>
              <li><strong>Theater productions</strong> - Plays, musicals, monologues</li>
              <li><strong>Debate/Speech</strong> - Tournaments, public speaking</li>
            </ul>
            <ul className="space-y-1 list-disc list-inside">
              <li><strong>Science fairs</strong> - Project presentations, experiments</li>
              <li><strong>Community service</strong> - Volunteer events, charity drives</li>
              <li><strong>Leadership moments</strong> - Club events, ceremonies</li>
              <li><strong>Art walkthroughs</strong> - Portfolio presentations</li>
            </ul>
          </div>
        </div>

        {/* Add Video Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-foreground">Your Videos</h4>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowAddForm(!showAddForm)}
            >
              {showAddForm ? "Cancel" : (
                <>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Video
                </>
              )}
            </Button>
          </div>

          {showAddForm && (
            <div className="border rounded-lg p-4 mb-4 space-y-4 bg-muted/20">
              {/* Toggle between upload and link */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={addMode === "upload" ? "default" : "outline"}
                  onClick={() => setAddMode("upload")}
                >
                  <Upload className="h-4 w-4 mr-1" />
                  Upload
                </Button>
                <Button
                  size="sm"
                  variant={addMode === "link" ? "default" : "outline"}
                  onClick={() => setAddMode("link")}
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Link (YouTube, Vimeo)
                </Button>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Video Title</Label>
                  <Input
                    value={newVideo.title || ""}
                    onChange={(e) => setNewVideo({ ...newVideo, title: e.target.value })}
                    placeholder="e.g., State Championship Highlights"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={newVideo.category}
                    onValueChange={(v) => setNewVideo({ ...newVideo, category: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {VIDEO_CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          <div className="flex items-center gap-2">
                            <cat.icon className="h-4 w-4" />
                            {cat.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={newVideo.description || ""}
                  onChange={(e) => setNewVideo({ ...newVideo, description: e.target.value })}
                  placeholder="Describe what's shown in the video, the context, and your role..."
                  rows={2}
                />
              </div>

              {addMode === "link" ? (
                <div className="space-y-2">
                  <Label>Video URL</Label>
                  <Input
                    type="url"
                    value={newVideo.url || ""}
                    onChange={(e) => setNewVideo({ ...newVideo, url: e.target.value })}
                    placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
                  />
                  <Button onClick={addExternalVideo} className="w-full mt-2" disabled={!newVideo.url || !newVideo.title}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Video Link
                  </Button>
                </div>
              ) : (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/mp4,video/webm,video/quicktime"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    className="w-full border-dashed"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading || !newVideo.title}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {uploading ? "Uploading..." : "Select Video File (MP4, WebM, MOV - max 100MB)"}
                  </Button>
                </>
              )}
            </div>
          )}

          {/* Video List */}
          {data.videos && data.videos.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-4">
              {data.videos.map((video) => {
                const CategoryIcon = getCategoryIcon(video.category);
                const category = VIDEO_CATEGORIES.find((c) => c.value === video.category);

                return (
                  <div
                    key={video.id}
                    className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                  >
                    {/* Video Preview */}
                    <div className="relative aspect-video bg-muted flex items-center justify-center">
                      {video.isExternal ? (
                        <a
                          href={video.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="absolute inset-0 flex items-center justify-center bg-black/50 hover:bg-black/40 transition-colors"
                        >
                          <div className="p-4 rounded-full bg-white/20 backdrop-blur-sm">
                            <Play className="h-8 w-8 text-white" />
                          </div>
                        </a>
                      ) : (
                        <video
                          src={video.url}
                          className="absolute inset-0 w-full h-full object-cover"
                          controls
                          preload="metadata"
                        />
                      )}
                    </div>

                    {/* Video Info */}
                    <div className="p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h5 className="font-medium text-sm truncate">{video.title}</h5>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              <CategoryIcon className="h-3 w-3 mr-1" />
                              {category?.label}
                            </Badge>
                            {video.isExternal && (
                              <Badge variant="outline" className="text-xs">
                                <ExternalLink className="h-3 w-3 mr-1" />
                                Link
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                          onClick={() => removeVideo(video.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      {video.description && (
                        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                          {video.description}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 border rounded-lg border-dashed">
              <Video className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">
                No videos yet. Add videos to showcase your achievements.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
