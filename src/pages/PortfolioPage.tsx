import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  fetchMaterials,
  deleteMaterial,
  calcPortfolioCompleteness,
  PORTFOLIO_CATEGORIES,
  ApplicationMaterial,
} from "@/lib/portfolioApi";
import { ApplicationMaterialUpload } from "@/components/application/ApplicationMaterialUpload";
import { PortfolioSharePanel } from "@/components/portfolio/PortfolioSharePanel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  FolderOpen,
  Plus,
  FileText,
  Image,
  Video,
  Trophy,
  Activity,
  Palette,
  Briefcase,
  MessageSquare,
  PenLine,
  Folder,
  MoreVertical,
  Eye,
  Trash2,
  Loader2,
  Share2,
  CheckCircle2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  transcript: FileText,
  achievement: Trophy,
  extracurricular: Activity,
  portfolio: Palette,
  resume: Briefcase,
  recommendation: MessageSquare,
  essay_draft: PenLine,
  other: Folder,
};

const MATERIAL_TYPE_ICONS: Record<string, React.ElementType> = {
  photo: Image,
  video: Video,
  document: FileText,
  text: PenLine,
};

function formatFileSize(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

interface MaterialCardProps {
  material: ApplicationMaterial;
  onDelete: (material: ApplicationMaterial) => void;
}

function MaterialCard({ material, onDelete }: MaterialCardProps) {
  const TypeIcon = MATERIAL_TYPE_ICONS[material.material_type] || FileText;

  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Thumbnail */}
          <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
            {material.material_type === "photo" && material.file_url ? (
              <img
                src={material.file_url}
                alt={material.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <TypeIcon className="h-5 w-5 text-muted-foreground" />
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h4 className="font-medium text-foreground truncate text-sm">{material.title}</h4>
                {material.description && (
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                    {material.description}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                  <span className="capitalize">{material.material_type}</span>
                  {material.file_size && (
                    <>
                      <span>·</span>
                      <span>{formatFileSize(material.file_size)}</span>
                    </>
                  )}
                  <span>·</span>
                  <span>{format(new Date(material.created_at), "MMM d, yyyy")}</span>
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100 flex-shrink-0"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {material.file_url && (
                    <DropdownMenuItem onClick={() => window.open(material.file_url!, "_blank")}>
                      <Eye className="h-4 w-4 mr-2" />
                      View File
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={() => onDelete(material)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface CategorySectionProps {
  categoryKey: string;
  label: string;
  description: string;
  materials: ApplicationMaterial[];
  onAdd: (category: string) => void;
  onDelete: (material: ApplicationMaterial) => void;
}

function CategorySection({
  categoryKey,
  label,
  description,
  materials,
  onAdd,
  onDelete,
}: CategorySectionProps) {
  const Icon = CATEGORY_ICONS[categoryKey] || Folder;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground text-sm">{label}</h3>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
          {materials.length > 0 && (
            <Badge variant="secondary" className="ml-1 text-xs">
              {materials.length}
            </Badge>
          )}
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onAdd(categoryKey)}
          className="h-8 text-xs"
        >
          <Plus className="h-3 w-3 mr-1" />
          Add
        </Button>
      </div>

      {materials.length === 0 ? (
        <div
          onClick={() => onAdd(categoryKey)}
          className="border-2 border-dashed border-muted-foreground/20 rounded-lg p-5 text-center cursor-pointer hover:border-primary/40 hover:bg-muted/30 transition-colors"
        >
          <Upload className="h-6 w-6 mx-auto text-muted-foreground/50 mb-1.5" />
          <p className="text-xs text-muted-foreground">
            Click to upload {label.toLowerCase()}
          </p>
        </div>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {materials.map((m) => (
            <MaterialCard key={m.id} material={m} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function PortfolioPage() {
  const { user } = useAuth();
  const [materials, setMaterials] = useState<ApplicationMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ApplicationMaterial | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("portfolio");

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const data = await fetchMaterials(user.id);
      setMaterials(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load portfolio materials");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteMaterial(deleteTarget.id, deleteTarget.file_url);
      toast.success("Material deleted");
      setDeleteTarget(null);
      void load();
    } catch (err) {
      toast.error("Failed to delete material");
    } finally {
      setDeleting(false);
    }
  };

  const { score, byCategory } = calcPortfolioCompleteness(materials);

  const getMaterialsByCategory = (cat: string) =>
    materials.filter((m) => m.category === cat);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <FolderOpen className="h-6 w-6 text-primary" />
            My Portfolio
          </h1>
          <p className="text-muted-foreground mt-1">
            Your complete application package — organized, ready to share.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShareOpen(true)}>
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Button onClick={() => setUploadOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Material
          </Button>
        </div>
      </div>

      {/* Package Completeness Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Application Package Completeness</CardTitle>
              <CardDescription>
                Based on 5 priority categories: transcripts, resume, extracurriculars, awards, and recommendations
              </CardDescription>
            </div>
            <div className="text-right">
              <span className="text-3xl font-bold text-primary">{score}%</span>
              {score === 100 && (
                <div className="flex items-center gap-1 text-green-600 text-xs mt-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Complete
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={score} className="h-2 mb-4" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {["transcript", "resume", "extracurricular", "achievement", "recommendation"].map((cat) => {
              const catInfo = PORTFOLIO_CATEGORIES.find((c) => c.key === cat);
              const count = byCategory[cat] || 0;
              const Icon = CATEGORY_ICONS[cat] || Folder;
              return (
                <div
                  key={cat}
                  className={`flex items-center gap-2 p-2 rounded-lg text-xs ${
                    count > 0
                      ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {count > 0 ? (
                    <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />
                  ) : (
                    <Icon className="h-3.5 w-3.5 flex-shrink-0" />
                  )}
                  <span className="truncate">{catInfo?.label || cat}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="portfolio">
            All Materials
            {materials.length > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {materials.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="package">Package View</TabsTrigger>
        </TabsList>

        {/* All Materials — by category */}
        <TabsContent value="portfolio" className="mt-6 space-y-8">
          {PORTFOLIO_CATEGORIES.map((cat) => (
            <CategorySection
              key={cat.key}
              categoryKey={cat.key}
              label={cat.label}
              description={cat.description}
              materials={getMaterialsByCategory(cat.key)}
              onAdd={(category) => {
                setUploadOpen(true);
              }}
              onDelete={(m) => setDeleteTarget(m)}
            />
          ))}
        </TabsContent>

        {/* Package View — summary for sharing */}
        <TabsContent value="package" className="mt-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PORTFOLIO_CATEGORIES.map((cat) => {
              const catMaterials = getMaterialsByCategory(cat.key);
              const Icon = CATEGORY_ICONS[cat.key] || Folder;
              return (
                <Card
                  key={cat.key}
                  className={`transition-all ${
                    catMaterials.length > 0 ? "border-primary/30" : "opacity-60"
                  }`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            catMaterials.length > 0
                              ? "bg-primary/10"
                              : "bg-muted"
                          }`}
                        >
                          <Icon
                            className={`h-4 w-4 ${
                              catMaterials.length > 0 ? "text-primary" : "text-muted-foreground"
                            }`}
                          />
                        </div>
                        <CardTitle className="text-sm">{cat.label}</CardTitle>
                      </div>
                      {catMaterials.length > 0 ? (
                        <Badge className="bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300 border-0 text-xs">
                          {catMaterials.length} file{catMaterials.length !== 1 ? "s" : ""}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs text-muted-foreground">
                          Empty
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {catMaterials.length === 0 ? (
                      <p className="text-xs text-muted-foreground">{cat.description}</p>
                    ) : (
                      <ul className="space-y-1">
                        {catMaterials.slice(0, 3).map((m) => (
                          <li key={m.id} className="text-xs text-foreground truncate flex items-center gap-1.5">
                            <FileText className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                            {m.title}
                          </li>
                        ))}
                        {catMaterials.length > 3 && (
                          <li className="text-xs text-muted-foreground">
                            +{catMaterials.length - 3} more
                          </li>
                        )}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="mt-6 flex justify-center">
            <Button onClick={() => setShareOpen(true)} size="lg">
              <Share2 className="h-4 w-4 mr-2" />
              Share This Package
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* Upload Dialog */}
      <ApplicationMaterialUpload
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onSuccess={() => void load()}
      />

      {/* Share Panel */}
      <PortfolioSharePanel
        open={shareOpen}
        onOpenChange={setShareOpen}
        materials={materials}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Material</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteTarget?.title}</strong>? This will
              permanently remove the file and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
