import { useState, useRef } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Upload, Image, Video, FileText, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

type MaterialType = "photo" | "video" | "text" | "document";
type MaterialCategory = "extracurricular" | "achievement" | "portfolio" | "essay_draft" | "recommendation" | "resume" | "transcript" | "other";

interface ApplicationMaterialUploadProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const categoryLabels: Record<MaterialCategory, string> = {
  extracurricular: "Extracurricular Activity",
  achievement: "Award or Achievement",
  portfolio: "Portfolio Piece",
  essay_draft: "Essay Draft",
  recommendation: "Recommendation Letter",
  resume: "Resume/CV",
  transcript: "Transcript",
  other: "Other",
};

const acceptedFileTypes: Record<MaterialType, string> = {
  photo: "image/jpeg,image/png,image/webp,image/gif",
  video: "video/mp4,video/webm,video/quicktime",
  document: "application/pdf",
  text: "",
};

export function ApplicationMaterialUpload({ open, onOpenChange, onSuccess }: ApplicationMaterialUploadProps) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [materialType, setMaterialType] = useState<MaterialType>("photo");
  const [category, setCategory] = useState<MaterialCategory>("extracurricular");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [contentText, setContentText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const resetForm = () => {
    setMaterialType("photo");
    setCategory("extracurricular");
    setTitle("");
    setDescription("");
    setContentText("");
    setFile(null);
    setPreviewUrl(null);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Check file size (50MB max)
    if (selectedFile.size > 52428800) {
      toast.error("File too large. Maximum size is 50MB.");
      return;
    }

    setFile(selectedFile);
    
    // Create preview for images/videos
    if (selectedFile.type.startsWith("image/") || selectedFile.type.startsWith("video/")) {
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error("Please sign in to upload materials");
      return;
    }

    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }

    if (materialType !== "text" && !file) {
      toast.error("Please select a file to upload");
      return;
    }

    if (materialType === "text" && !contentText.trim()) {
      toast.error("Please enter your text content");
      return;
    }

    setUploading(true);

    try {
      let fileUrl = null;
      let fileName = null;
      let fileSize = null;

      // Upload file if present
      if (file) {
        const fileExt = file.name.split('.').pop();
        const filePath = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('application-materials')
          .upload(filePath, file);

        if (uploadError) {
          throw new Error(`Failed to upload file: ${uploadError.message}`);
        }

        const { data: urlData } = supabase.storage
          .from('application-materials')
          .getPublicUrl(filePath);

        fileUrl = urlData.publicUrl;
        fileName = file.name;
        fileSize = file.size;
      }

      // Insert record into database
      const { error: insertError } = await supabase
        .from('application_materials')
        .insert({
          user_id: user.id,
          material_type: materialType,
          category,
          title: title.trim(),
          description: description.trim() || null,
          file_url: fileUrl,
          file_name: fileName,
          file_size: fileSize,
          content_text: materialType === "text" ? contentText.trim() : null,
        });

      if (insertError) {
        throw new Error(`Failed to save material: ${insertError.message}`);
      }

      toast.success("Material uploaded successfully!");
      resetForm();
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to upload material";
      toast.error(message);
      console.error("Upload error:", error);
    } finally {
      setUploading(false);
    }
  };

  const getTypeIcon = (type: MaterialType) => {
    switch (type) {
      case "photo": return <Image className="h-4 w-4" />;
      case "video": return <Video className="h-4 w-4" />;
      case "document": return <FileText className="h-4 w-4" />;
      case "text": return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Application Material</DialogTitle>
          <DialogDescription>
            Upload photos, videos, documents, or text to strengthen your application
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          {/* Material Type Selection */}
          <div className="space-y-2">
            <Label>Material Type</Label>
            <div className="flex gap-2 flex-wrap">
              {(["photo", "video", "document", "text"] as MaterialType[]).map((type) => (
                <Button
                  key={type}
                  variant={materialType === type ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setMaterialType(type);
                    setFile(null);
                    setPreviewUrl(null);
                  }}
                  className="flex items-center gap-1.5"
                >
                  {getTypeIcon(type)}
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Button>
              ))}
            </div>
          </div>

          {/* Category Selection */}
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as MaterialCategory)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(categoryLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label>Title *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., State Science Fair 1st Place"
              maxLength={100}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe this material and its significance..."
              rows={2}
              maxLength={500}
            />
          </div>

          {/* File Upload (for non-text types) */}
          {materialType !== "text" && (
            <div className="space-y-2">
              <Label>Upload File *</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept={acceptedFileTypes[materialType]}
                onChange={handleFileSelect}
                className="hidden"
              />
              
              {!file ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                >
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Click to upload {materialType}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Max 50MB
                  </p>
                </div>
              ) : (
                <div className="relative">
                  {previewUrl && materialType === "photo" && (
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  )}
                  {previewUrl && materialType === "video" && (
                    <video
                      src={previewUrl}
                      className="w-full h-48 object-cover rounded-lg"
                      controls
                    />
                  )}
                  {materialType === "document" && (
                    <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                      <FileText className="h-8 w-8 text-muted-foreground" />
                      <span className="text-sm truncate flex-1">{file.name}</span>
                    </div>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 bg-background/80"
                    onClick={() => {
                      setFile(null);
                      setPreviewUrl(null);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Text Content (for text type) */}
          {materialType === "text" && (
            <div className="space-y-2">
              <Label>Content *</Label>
              <Textarea
                value={contentText}
                onChange={(e) => setContentText(e.target.value)}
                placeholder="Enter your essay draft, activity description, or other text content..."
                rows={8}
                maxLength={10000}
              />
              <p className="text-xs text-muted-foreground text-right">
                {contentText.length}/10,000 characters
              </p>
            </div>
          )}

          {/* Submit Button */}
          <Button 
            onClick={handleSubmit} 
            className="w-full" 
            disabled={uploading}
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Add Material
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
