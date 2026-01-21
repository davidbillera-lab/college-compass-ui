import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";
import { DollarSign, MapPin, Calendar, ExternalLink, Plus } from "lucide-react";
import type { ScholarshipDirectoryRow } from "@/lib/scholarships/directoryApi";

function formatMoney(min?: number | null, max?: number | null) {
  const fmt = (n: number) => `$${n.toLocaleString()}`;
  if (min && max && min !== max) return `${fmt(min)}–${fmt(max)}`;
  if (max) return fmt(max);
  if (min) return fmt(min);
  return "—";
}

function formatDeadline(rolling: boolean | null, deadline: string | null) {
  if (rolling) return "Rolling deadline";
  if (deadline) return `Due ${deadline}`;
  return "No deadline listed";
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scholarship: ScholarshipDirectoryRow | null;
  onAddToPipeline: (id: string) => void;
  isAdding?: boolean;
};

export default function DirectoryDetailDrawer({
  open,
  onOpenChange,
  scholarship,
  onAddToPipeline,
  isAdding,
}: Props) {
  if (!scholarship) return null;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <div className="mx-auto w-full max-w-2xl overflow-y-auto p-4">
          <DrawerHeader className="px-0">
            <DrawerTitle className="text-xl">{scholarship.name}</DrawerTitle>
            <DrawerDescription className="flex flex-wrap items-center gap-2 text-base">
              {scholarship.provider || "Provider unknown"}
              <span className="text-muted-foreground">•</span>
              {formatMoney(scholarship.amount_min_usd, scholarship.amount_max_usd)}
              <span className="text-muted-foreground">•</span>
              {formatDeadline(scholarship.rolling_deadline, scholarship.deadline_date)}
            </DrawerDescription>
          </DrawerHeader>

          <div className="space-y-4 pb-6">
            {/* Quick info badges */}
            <div className="flex flex-wrap gap-2">
              {scholarship.rolling_deadline ? (
                <Badge variant="secondary">Rolling</Badge>
              ) : scholarship.deadline_date ? (
                <Badge variant="outline">
                  <Calendar className="h-3 w-3 mr-1" />
                  {scholarship.deadline_date}
                </Badge>
              ) : null}
              {scholarship.location_scope && (
                <Badge variant="outline">
                  <MapPin className="h-3 w-3 mr-1" />
                  {scholarship.location_scope}
                </Badge>
              )}
              {scholarship.status === "archived" && (
                <Badge variant="destructive">Archived</Badge>
              )}
            </div>

            {/* Info grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border p-3">
                <div className="text-xs text-muted-foreground mb-1">Amount</div>
                <div className="font-medium flex items-center gap-1">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  {formatMoney(scholarship.amount_min_usd, scholarship.amount_max_usd)}
                </div>
              </div>
              <div className="rounded-lg border p-3">
                <div className="text-xs text-muted-foreground mb-1">Location Scope</div>
                <div className="font-medium">{scholarship.location_scope || "—"}</div>
              </div>
            </div>

            {/* Tags */}
            {(scholarship.major_tags || scholarship.career_tags) && (
              <div className="space-y-2">
                {scholarship.major_tags && (
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Major Tags</div>
                    <div className="flex flex-wrap gap-1">
                      {scholarship.major_tags.split(",").map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag.trim()}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {scholarship.career_tags && (
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Career Tags</div>
                    <div className="flex flex-wrap gap-1">
                      {scholarship.career_tags.split(",").map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag.trim()}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Eligibility text */}
            <div className="rounded-lg border p-4">
              <div className="text-sm font-medium mb-2">Eligibility Requirements</div>
              <div className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {scholarship.raw_eligibility_text || "No eligibility information available."}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                className="flex-1"
                onClick={() => onAddToPipeline(scholarship.id)}
                disabled={isAdding}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add to Pipeline
              </Button>
              {scholarship.url && (
                <Button variant="outline" asChild>
                  <a href={scholarship.url} target="_blank" rel="noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Visit Website
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
