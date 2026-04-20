import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  fetchMyPortfolioShare,
  createPortfolioShare,
  deactivatePortfolioShare,
  calcPortfolioCompleteness,
  ApplicationMaterial,
  PortfolioShare,
} from "@/lib/portfolioApi";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Share2,
  Copy,
  CheckCheck,
  Loader2,
  Link2,
  Link2Off,
  Eye,
  Calendar,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface PortfolioSharePanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  materials: ApplicationMaterial[];
}

export function PortfolioSharePanel({ open, onOpenChange, materials }: PortfolioSharePanelProps) {
  const { user } = useAuth();
  const [share, setShare] = useState<PortfolioShare | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [copied, setCopied] = useState(false);
  const [label, setLabel] = useState("My Application Portfolio");
  const [includeProfile, setIncludeProfile] = useState(true);
  const [includeMaterials, setIncludeMaterials] = useState(true);

  const { score } = calcPortfolioCompleteness(materials);

  const shareUrl = share
    ? `${window.location.origin}/shared-portfolio/${share.share_token}`
    : null;

  const loadShare = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const existing = await fetchMyPortfolioShare(user.id);
      setShare(existing);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (open && user) {
      void loadShare();
    }
  }, [open, user, loadShare]);

  const handleCreate = async () => {
    if (!user) return;
    setCreating(true);
    try {
      const newShare = await createPortfolioShare(user.id, label, {
        include_profile: includeProfile,
        include_materials: includeMaterials,
        include_essays: true,
      });
      setShare(newShare);
      toast.success("Share link created!");
    } catch (err) {
      toast.error("Failed to create share link");
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async () => {
    if (!share) return;
    setRevoking(true);
    try {
      await deactivatePortfolioShare(share.id);
      setShare(null);
      toast.success("Share link revoked. Anyone with the old link can no longer access your portfolio.");
    } catch (err) {
      toast.error("Failed to revoke share link");
    } finally {
      setRevoking(false);
    }
  };

  const handleCopy = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("Link copied to clipboard!");
    setTimeout(() => setCopied(false), 2500);
  };

  const handleRegenerate = async () => {
    if (!share || !user) return;
    setRevoking(true);
    try {
      await deactivatePortfolioShare(share.id);
      const newShare = await createPortfolioShare(user.id, share.label, {
        include_profile: share.include_profile,
        include_materials: share.include_materials,
        include_essays: share.include_essays,
      });
      setShare(newShare);
      toast.success("New share link generated!");
    } catch (err) {
      toast.error("Failed to regenerate link");
    } finally {
      setRevoking(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-primary" />
            Share Your Portfolio
          </DialogTitle>
          <DialogDescription>
            Generate a read-only link to share your application package with counselors, parents, or mentors.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : share ? (
          /* Active share exists */
          <div className="space-y-4">
            {/* Status banner */}
            <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
              <Link2 className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                  Share link is active
                </p>
                <p className="text-xs text-green-600 dark:text-green-400 truncate">
                  {shareUrl}
                </p>
              </div>
              <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 border-0 text-xs flex-shrink-0">
                Live
              </Badge>
            </div>

            {/* Copy link */}
            <div className="flex gap-2">
              <Input
                readOnly
                value={shareUrl || ""}
                className="text-xs font-mono"
              />
              <Button
                size="icon"
                variant="outline"
                onClick={handleCopy}
                className="flex-shrink-0"
              >
                {copied ? (
                  <CheckCheck className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 p-2 rounded-lg bg-muted text-sm">
                <Eye className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Views:</span>
                <span className="font-medium">{share.view_count}</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-muted text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground text-xs">
                  Created {format(new Date(share.created_at), "MMM d")}
                </span>
              </div>
            </div>

            <Separator />

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRegenerate}
                disabled={revoking}
                className="flex-1"
              >
                {revoking ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                ) : (
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                )}
                New Link
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRevoke}
                disabled={revoking}
                className="flex-1 text-destructive hover:text-destructive border-destructive/30 hover:border-destructive"
              >
                <Link2Off className="h-3.5 w-3.5 mr-1.5" />
                Revoke
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              "New Link" invalidates the old link. "Revoke" disables sharing entirely.
            </p>
          </div>
        ) : (
          /* No active share — create one */
          <div className="space-y-4">
            {/* Portfolio summary */}
            <div className="p-3 rounded-lg bg-muted">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">Portfolio completeness</span>
                <span className="text-sm font-bold text-primary">{score}%</span>
              </div>
              <div className="w-full bg-background rounded-full h-1.5">
                <div
                  className="bg-primary h-1.5 rounded-full transition-all"
                  style={{ width: `${score}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">
                {materials.length} material{materials.length !== 1 ? "s" : ""} uploaded
              </p>
            </div>

            {/* Label */}
            <div className="space-y-1.5">
              <Label htmlFor="share-label">Link label (for your reference)</Label>
              <Input
                id="share-label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g., Portfolio for College Counselor"
              />
            </div>

            {/* Options */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Include in shared view</Label>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm">Profile summary</p>
                    <p className="text-xs text-muted-foreground">GPA, test scores, intended major</p>
                  </div>
                  <Switch
                    checked={includeProfile}
                    onCheckedChange={setIncludeProfile}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm">Uploaded materials</p>
                    <p className="text-xs text-muted-foreground">All files and documents</p>
                  </div>
                  <Switch
                    checked={includeMaterials}
                    onCheckedChange={setIncludeMaterials}
                  />
                </div>
              </div>
            </div>

            <Button onClick={handleCreate} disabled={creating} className="w-full">
              {creating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Share2 className="h-4 w-4 mr-2" />
              )}
              Generate Share Link
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              The link is read-only. Viewers cannot edit or download files.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
