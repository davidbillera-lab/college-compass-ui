import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { generateShareToken, revokeShareToken, CollegeList } from "@/lib/collegeLists/api";
import { Copy, Link, Loader2, Check } from "lucide-react";

interface ShareListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  list: CollegeList | null;
  onListUpdated: () => void;
}

export function ShareListDialog({
  open,
  onOpenChange,
  list,
  onListUpdated,
}: ShareListDialogProps) {
  const [loading, setLoading] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [shareToken, setShareToken] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (list) {
      setShareToken(list.share_token);
    }
  }, [list]);

  const shareUrl = shareToken
    ? `${window.location.origin}/shared-list/${shareToken}`
    : null;

  const handleToggleSharing = async () => {
    if (!list) return;
    setLoading(true);
    try {
      if (shareToken) {
        await revokeShareToken(list.id);
        setShareToken(null);
        toast({ title: "Link sharing disabled" });
      } else {
        const token = await generateShareToken(list.id);
        setShareToken(token);
        toast({ title: "Share link created!" });
      }
      onListUpdated();
    } catch (err) {
      console.error("Error toggling share:", err);
      toast({
        title: "Error",
        description: "Failed to update sharing settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast({ title: "Link copied to clipboard!" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: "Error",
        description: "Failed to copy link",
        variant: "destructive",
      });
    }
  };

  if (!list) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link className="h-5 w-5" />
            Share "{list.name}"
          </DialogTitle>
          <DialogDescription>
            Create a shareable link for parents or counselors to view this list.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Toggle sharing */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="share-toggle" className="text-base">
                Enable link sharing
              </Label>
              <p className="text-sm text-muted-foreground">
                Anyone with the link can view this list
              </p>
            </div>
            <Switch
              id="share-toggle"
              checked={!!shareToken}
              onCheckedChange={handleToggleSharing}
              disabled={loading}
            />
          </div>

          {/* Share URL */}
          {shareToken && shareUrl && (
            <div className="space-y-2">
              <Label>Share link</Label>
              <div className="flex gap-2">
                <Input
                  value={shareUrl}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopy}
                  disabled={loading}
                >
              {copied ? (
                    <Check className="h-4 w-4 text-success" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Share this link with anyone you want to show your college list to.
              </p>
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center py-2">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
