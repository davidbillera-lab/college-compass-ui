import * as React from "react";
import { ScholarshipMatch } from "../types/scholarship";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

function formatMoney(n?: number) {
  if (n == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function formatMoneyRange(min?: number, max?: number) {
  if (min == null && max == null) return "—";
  if (min != null && max != null) return `${formatMoney(min)}–${formatMoney(max)}`;
  if (min != null) return `${formatMoney(min)}+`;
  return `Up to ${formatMoney(max as number)}`;
}

function priorityVariant(p: "low" | "medium" | "high"): "secondary" | "default" | "destructive" {
  if (p === "low") return "secondary";
  if (p === "medium") return "default";
  return "destructive";
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  match: ScholarshipMatch | null;
};

export default function ScholarshipDetailsDrawer({
  open,
  onOpenChange,
  match,
}: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        {match ? (
          <>
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                {match.scholarshipName}
                <Badge variant={priorityVariant(match.priority)}>
                  {match.priority.toUpperCase()}
                </Badge>
              </SheetTitle>
              <SheetDescription>
                Score: {match.matchScore} · Eligibility: {match.eligibilityConfidence}
              </SheetDescription>
            </SheetHeader>

            <div className="mt-6 space-y-6">
              <div className="rounded-lg border p-4 space-y-2">
                <div className="text-sm font-medium">Award Range</div>
                <div className="text-2xl font-semibold">
                  {formatMoneyRange(match.awardRange?.min, match.awardRange?.max)}
                </div>
                <div className="text-sm text-muted-foreground">
                  Competition: {match.competitivenessEstimate}
                </div>
              </div>

              {match.deadline && (
                <div className="rounded-lg border p-4 space-y-2">
                  <div className="text-sm font-medium">Deadline</div>
                  <div className="text-lg font-semibold">{match.deadline}</div>
                </div>
              )}

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
                Next: tracking status + autofill packet builder.
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
