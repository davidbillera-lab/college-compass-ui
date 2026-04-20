import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, FolderOpen, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ApplicationMaterialUpload } from "./ApplicationMaterialUpload";
import { ApplicationMaterialsList } from "./ApplicationMaterialsList";
import { AIApplicationAdvisor } from "./AIApplicationAdvisor";

interface ApplicationMaterial {
  id: string;
  material_type: string;
  category: string;
  title: string;
  description: string | null;
  file_url: string | null;
  content_text: string | null;
  ai_analysis: Record<string, unknown> | null;
  ai_analyzed_at: string | null;
  created_at: string;
}

interface ApplicationMaterialsHubProps {
  compact?: boolean;
}

export function ApplicationMaterialsHub({ compact = false }: ApplicationMaterialsHubProps) {
  const { user } = useAuth();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [materials, setMaterials] = useState<ApplicationMaterial[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState<ApplicationMaterial | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

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
    }
  }, [user]);

  useEffect(() => {
    void loadMaterials();
  }, [loadMaterials, refreshTrigger]);

  const handleUploadSuccess = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleAnalyze = (material: ApplicationMaterial) => {
    setSelectedMaterial(material);
  };

  const materialCounts = materials.reduce((acc, m) => {
    acc[m.material_type] = (acc[m.material_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (compact) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Application Materials</CardTitle>
            </div>
            <Button size="sm" onClick={() => setUploadOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 flex-wrap mb-3">
            <Badge variant="secondary">{materials.length} items</Badge>
            {materialCounts.photo && (
              <Badge variant="outline">{materialCounts.photo} photos</Badge>
            )}
            {materialCounts.video && (
              <Badge variant="outline">{materialCounts.video} videos</Badge>
            )}
            {materialCounts.document && (
              <Badge variant="outline">{materialCounts.document} docs</Badge>
            )}
          </div>

          <ApplicationMaterialsList 
            onAnalyze={handleAnalyze}
            refreshTrigger={refreshTrigger}
          />

          <ApplicationMaterialUpload
            open={uploadOpen}
            onOpenChange={setUploadOpen}
            onSuccess={handleUploadSuccess}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Materials List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5 text-primary" />
                My Application Materials
              </CardTitle>
              <CardDescription className="mt-1">
                Photos, videos, and documents for your applications
              </CardDescription>
            </div>
            <Button onClick={() => setUploadOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Material
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 flex-wrap mb-4">
            <Badge variant="secondary">{materials.length} total</Badge>
            {Object.entries(materialCounts).map(([type, count]) => (
              <Badge key={type} variant="outline" className="capitalize">
                {count} {type}s
              </Badge>
            ))}
          </div>

          <ApplicationMaterialsList 
            onAnalyze={handleAnalyze}
            refreshTrigger={refreshTrigger}
          />
        </CardContent>
      </Card>

      {/* AI Advisor */}
      <AIApplicationAdvisor 
        materials={materials}
        selectedMaterial={selectedMaterial}
        onClose={() => setSelectedMaterial(null)}
      />

      <ApplicationMaterialUpload
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onSuccess={handleUploadSuccess}
      />
    </div>
  );
}
