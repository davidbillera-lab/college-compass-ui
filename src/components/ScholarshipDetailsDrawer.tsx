import * as React from "react";
import { ScholarshipMatch } from "../types/scholarship";
import { ScholarshipStatus } from "../types/scholarshipTracking";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

function formatMoneyRange(min?: number, max?: number) {
  if (min == null && max == null) return "—";
  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(n);
  if (min != null && max != null) return `${fmt(min)}–${fmt(max)}`;
  if (min != null) return `${fmt(min)}+`;
  return `Up to ${fmt(max as number)}`;
}

function priorityVariant(p: "low" | "medium" | "high"): "secondary" | "default" | "destructive" {
  if (p === "low") return "secondary";
  if (p === "medium") return "default";
  return "destructive";
}

function trackingLabel(s: ScholarshipStatus) {
  if (s === "to_apply") return "To Apply";
  if (s === "drafting") return "Drafting";
  if (s === "submitted") return "Submitted";
  if (s === "won") return "Won";
  return "Not Now";
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  match: ScholarshipMatch | null;

  // tracking wiring
  isTracked: boolean;
  status: ScholarshipStatus;
  notes: string;

  onTrack: () => void;
  onStatusChange: (s: ScholarshipStatus) => void;
  onNotesChange: (notes: string) => void;
};

export default function ScholarshipDetailsDrawer({
  open,
  onOpenChange,
  match,
  isTracked,
  status,
  notes,
  onTrack,
  onStatusChange,
  onNotesChange,
}: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-[520px]">
        {match ? (
          <>
            <SheetHeader>
              <SheetTitle className="flex items-start justify-between gap-3">
                <span>{match.scholarshipName}</span>
                <Badge variant={priorityVariant(match.priority)}>{match.priority.toUpperCase()}</Badge>
              </SheetTitle>
              <SheetDescription>
                Score: <span className="font-medium">{match.matchScore}</span> · Eligibility:{" "}
                <span className="font-medium">{match.eligibilityConfidence}</span> · Competition:{" "}
                <span className="font-medium">{match.competitivenessEstimate}</span>
              </SheetDescription>
            </SheetHeader>

            <div className="mt-6 space-y-5">
              <div className="rounded-lg border p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">Tracking</div>
                  <Badge variant={isTracked ? "default" : "secondary"}>
                    {isTracked ? trackingLabel(status) : "Not tracked"}
                  </Badge>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button onClick={onTrack} disabled={isTracked} className="min-w-[160px]">
                    {isTracked ? "Tracked" : "Track Scholarship"}
                  </Button>

                  <Button
                    variant={status === "to_apply" ? "default" : "outline"}
                    onClick={() => onStatusChange("to_apply")}
                    disabled={!isTracked}
                  >
                    To Apply
                  </Button>
                  <Button
                    variant={status === "drafting" ? "default" : "outline"}
                    onClick={() => onStatusChange("drafting")}
                    disabled={!isTracked}
                  >
                    Drafting
                  </Button>
                  <Button
                    variant={status === "submitted" ? "default" : "outline"}
                    onClick={() => onStatusChange("submitted")}
                    disabled={!isTracked}
                  >
                    Submitted
                  </Button>
                  <Button
                    variant={status === "won" ? "default" : "outline"}
                    onClick={() => onStatusChange("won")}
                    disabled={!isTracked}
                  >
                    Won
                  </Button>
                  <Button
                    variant={status === "not_now" ? "default" : "outline"}
                    onClick={() => onStatusChange("not_now")}
                    disabled={!isTracked}
                  >
                    Not Now
                  </Button>
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-medium">Notes</div>
                  <Textarea
                    value={notes}
                    onChange={(e) => onNotesChange(e.target.value)}
                    placeholder="Notes: requirements, docs needed, essay reuse, etc."
                    disabled={!isTracked}
                  />
                  {!isTracked ? (
                    <p className="text-xs text-muted-foreground">
                      Track this scholarship to enable status and notes.
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="rounded-lg border p-4 space-y-2">
                <div className="text-sm font-medium">Award</div>
                <div className="text-2xl font-semibold">
                  {formatMoneyRange(match.awardRange?.min, match.awardRange?.max)}
                </div>
                <div className="text-sm text-muted-foreground">
                  Deadline: <span className="text-foreground">{match.deadline ?? "—"}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">Why it matches</div>
                <ul className="list-disc pl-5 space-y-1">
                  {(match.reasons ?? []).map((x, idx) => (
                    <li key={idx} className="text-sm">
                      {x}
                    </li>
                  ))}
                </ul>
              </div>

              <Separator />

              <div className="flex gap-2">
                <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
                  Close
                </Button>
              </div>

              <p className="text-xs text-muted-foreground">
                Stored locally for now. Next step: persist to backend per user account.
              </p>
            </div>
          </>
        ) : (
          <div className="py-10 text-sm text-muted-foreground">
            Select a scholarship to view details.
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
