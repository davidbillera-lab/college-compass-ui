import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import {
  fetchSharedPortfolio,
  PORTFOLIO_CATEGORIES,
  ApplicationMaterial,
  PortfolioShare,
} from "@/lib/portfolioApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  FolderOpen,
  FileText,
  Image,
  Video,
  PenLine,
  Trophy,
  Activity,
  Palette,
  Briefcase,
  MessageSquare,
  Folder,
  Eye,
  Loader2,
  GraduationCap,
  BookOpen,
  DollarSign,
  ExternalLink,
} from "lucide-react";
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

interface MaterialRowProps {
  material: ApplicationMaterial;
}

function MaterialRow({ material }: MaterialRowProps) {
  const TypeIcon = MATERIAL_TYPE_ICONS[material.material_type] || FileText;

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors">
      <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
        {material.material_type === "photo" && material.file_url ? (
          <img
            src={material.file_url}
            alt={material.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <TypeIcon className="h-4 w-4 text-muted-foreground" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{material.title}</p>
        {material.description && (
          <p className="text-xs text-muted-foreground truncate">{material.description}</p>
        )}
        <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
          <span className="capitalize">{material.material_type}</span>
          {material.file_size && (
            <>
              <span>·</span>
              <span>{formatFileSize(material.file_size)}</span>
            </>
          )}
        </div>
      </div>
      {material.file_url && (
        <Button
          size="sm"
          variant="ghost"
          className="flex-shrink-0 h-8 w-8 p-0"
          onClick={() => window.open(material.file_url!, "_blank")}
        >
          <Eye className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

export default function SharedPortfolioPage() {
  const { shareToken } = useParams<{ shareToken: string }>();
  const [data, setData] = useState<{
    share: PortfolioShare;
    materials: ApplicationMaterial[];
    profile: Record<string, unknown> | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPortfolio = useCallback(async () => {
    if (!shareToken) return;
    setLoading(true);
    try {
      const result = await fetchSharedPortfolio(shareToken);
      if (!result) {
        setError("This portfolio link is invalid or has been revoked.");
        return;
      }
      setData(result);
    } catch (err) {
      setError("Failed to load this portfolio.");
    } finally {
      setLoading(false);
    }
  }, [shareToken]);

  useEffect(() => {
    if (shareToken) {
      void loadPortfolio();
    }
  }, [shareToken, loadPortfolio]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading portfolio...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-sm mx-auto px-4">
          <FolderOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Portfolio Not Found</h2>
          <p className="text-muted-foreground mb-6">
            {error || "This portfolio link is invalid or has been revoked."}
          </p>
          <Link to="/">
            <Button variant="outline">Go to College Compass</Button>
          </Link>
        </div>
      </div>
    );
  }

  const { share, materials, profile } = data;
  const materialsByCategory = PORTFOLIO_CATEGORIES.reduce(
    (acc, cat) => {
      acc[cat.key] = materials.filter((m) => m.category === cat.key);
      return acc;
    },
    {} as Record<string, ApplicationMaterial[]>
  );

  const studentName =
    profile && typeof profile.full_name === "string" ? profile.full_name : "Student";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-4xl mx-auto px-4 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="font-bold text-foreground">College Compass</h1>
              <p className="text-xs text-muted-foreground">Application Portfolio</p>
            </div>
          </div>
          <Badge variant="outline" className="text-xs">
            Read-only view
          </Badge>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Portfolio title */}
        <div>
          <h2 className="text-2xl font-bold text-foreground">{share.label}</h2>
          <p className="text-muted-foreground mt-1">
            Shared by {studentName} · {materials.length} material{materials.length !== 1 ? "s" : ""} ·{" "}
            {format(new Date(share.created_at), "MMMM d, yyyy")}
          </p>
        </div>

        {/* Profile summary */}
        {profile && share.include_profile && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                Student Profile
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {profile.gpa_unweighted && (
                  <div>
                    <p className="text-xs text-muted-foreground">Unweighted GPA</p>
                    <p className="text-lg font-bold">{String(profile.gpa_unweighted)}</p>
                  </div>
                )}
                {profile.gpa_weighted && (
                  <div>
                    <p className="text-xs text-muted-foreground">Weighted GPA</p>
                    <p className="text-lg font-bold">{String(profile.gpa_weighted)}</p>
                  </div>
                )}
                {profile.sat_score && (
                  <div>
                    <p className="text-xs text-muted-foreground">SAT</p>
                    <p className="text-lg font-bold">{String(profile.sat_score)}</p>
                  </div>
                )}
                {profile.act_score && (
                  <div>
                    <p className="text-xs text-muted-foreground">ACT</p>
                    <p className="text-lg font-bold">{String(profile.act_score)}</p>
                  </div>
                )}
                {profile.grad_year && (
                  <div>
                    <p className="text-xs text-muted-foreground">Graduation Year</p>
                    <p className="text-lg font-bold">{String(profile.grad_year)}</p>
                  </div>
                )}
                {Array.isArray(profile.intended_majors) && profile.intended_majors.length > 0 && (
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground">Intended Major(s)</p>
                    <p className="text-sm font-medium mt-0.5">
                      {(profile.intended_majors as string[]).join(", ")}
                    </p>
                  </div>
                )}
                {profile.budget_max_usd && (
                  <div>
                    <p className="text-xs text-muted-foreground">Budget (max/yr)</p>
                    <p className="text-sm font-medium flex items-center gap-1 mt-0.5">
                      <DollarSign className="h-3.5 w-3.5" />
                      {Number(profile.budget_max_usd).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Materials by category */}
        {share.include_materials && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Application Materials</h3>
            {PORTFOLIO_CATEGORIES.map((cat) => {
              const catMaterials = materialsByCategory[cat.key] || [];
              if (catMaterials.length === 0) return null;
              const Icon = CATEGORY_ICONS[cat.key] || Folder;
              return (
                <div key={cat.key}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <h4 className="font-semibold text-sm">{cat.label}</h4>
                    <Badge variant="secondary" className="text-xs">
                      {catMaterials.length}
                    </Badge>
                  </div>
                  <div className="space-y-2 pl-9">
                    {catMaterials.map((m) => (
                      <MaterialRow key={m.id} material={m} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <Separator />

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground pb-4">
          <p>
            This portfolio was shared via{" "}
            <Link to="/" className="text-primary hover:underline">
              College Compass
            </Link>
            . This is a read-only view — files cannot be downloaded or edited.
          </p>
        </div>
      </div>
    </div>
  );
}
