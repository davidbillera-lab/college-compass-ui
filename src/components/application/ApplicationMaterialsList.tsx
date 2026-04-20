import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Image, Video, FileText, MoreVertical, Trash2, Sparkles, Eye, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format } from "date-fns";

interface ApplicationMaterial {
  id: string;
  material_type: string;
  category: string;
  title: string;
  description: string | null;
  file_url: string | null;
  file_name: string | null;
  content_text: string | null;
  ai_analysis: Record<string, unknown> | null;
  ai_analyzed_at: string | null;
  created_at: string;
}

interface ApplicationMaterialsListProps {
  onAnalyze: (material: ApplicationMaterial) => void;
  refreshTrigger?: number;
}

const categoryColors: Record<string, string> = {
  extracurricular: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  achievement: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  portfolio: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  essay_draft: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  recommendation: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300",
  resume: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
  transcript: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300",
  other: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
};

const categoryLabels: Record<string, string> = {
  extracurricular: "Activity",
  achievement: "Achievement",
  portfolio: "Portfolio",
  essay_draft: "Essay",
  recommendation: "Rec Letter",
  resume: "Resume",
  transcript: "Transcript",
  other: "Other",
};

export function ApplicationMaterialsList({ onAnalyze, refreshTrigger }: ApplicationMaterialsListProps) {
  const { user } = useAuth();
  const [materials, setMaterials] = useState<ApplicationMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  const loadMaterials = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('application_materials')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMaterials((data || []) as ApplicationMaterial[]);
    } catch (error) {
      console.error("Failed to load materials:", error);
      toast.error("Failed to load materials");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void loadMaterials();
  }, [loadMaterials, refreshTrigger]);

  const handleDelete = async (material: ApplicationMaterial) => {
    if (!confirm("Are you sure you want to delete this material?")) return;

    setDeleting(material.id);
    try {
      // Delete file from storage if exists
      if (material.file_url) {
        const path = material.file_url.split('/').slice(-2).join('/');
        await supabase.storage.from('application-materials').remove([path]);
      }

      // Delete database record
      const { error } = await supabase
        .from('application_materials')
        .delete()
        .eq('id', material.id);

      if (error) throw error;

      setMaterials((prev) => prev.filter((m) => m.id !== material.id));
      toast.success("Material deleted");
    } catch (error) {
      console.error("Failed to delete:", error);
      toast.error("Failed to delete material");
    } finally {
      setDeleting(null);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "photo": return <Image className="h-4 w-4" />;
      case "video": return <Video className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (materials.length === 0) {
    return (
      <div className="text-center p-8 border-2 border-dashed rounded-lg">
        <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
        <h3 className="font-medium text-foreground">No materials yet</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Upload photos, videos, or documents to build your application portfolio
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[400px]">
      <div className="space-y-3 pr-4">
        {materials.map((material) => (
          <Card key={material.id} className="group">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                {/* Thumbnail/Icon */}
                <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {material.material_type === "photo" && material.file_url ? (
                    <img 
                      src={material.file_url} 
                      alt={material.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    getTypeIcon(material.material_type)
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-medium text-foreground truncate">{material.title}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge 
                          variant="secondary" 
                          className={`text-xs ${categoryColors[material.category] || categoryColors.other}`}
                        >
                          {categoryLabels[material.category] || material.category}
                        </Badge>
                        {material.ai_analyzed_at && (
                          <Badge variant="outline" className="text-xs">
                            <Sparkles className="h-3 w-3 mr-1" />
                            AI Reviewed
                          </Badge>
                        )}
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {material.file_url && (
                          <DropdownMenuItem onClick={() => window.open(material.file_url!, '_blank')}>
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => onAnalyze(material)}>
                          <Sparkles className="h-4 w-4 mr-2" />
                          AI Analysis
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDelete(material)}
                          className="text-destructive"
                          disabled={deleting === material.id}
                        >
                          {deleting === material.id ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4 mr-2" />
                          )}
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {material.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {material.description}
                    </p>
                  )}

                  <p className="text-xs text-muted-foreground mt-2">
                    Added {format(new Date(material.created_at), 'MMM d, yyyy')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
}
