import * as React from "react";
import { CollegeRecommendation } from "../types/college";
import { CollegeStatus } from "../types/shortlist";

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

function currency(n?: number) {
  if (n == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function bandBadgeVariant(band: string): "default" | "secondary" | "destructive" {
  if (band === "likely") return "default";
  if (band === "target") return "secondary";
  return "destructive";
}

function bandLabel(band: string) {
  if (band === "likely") return "Likely";
  if (band === "target") return "Target";
  return "Reach";
}

function statusLabel(s: CollegeStatus) {
  if (s === "interested") return "Interested";
  if (s === "applying") return "Applying";
  if (s === "applied") return "Applied";
  return "Not Now";
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rec: CollegeRecommendation | null;

  // NEW: shortlist wiring
  isSaved: boolean;
  status: CollegeStatus;
  notes: string;

  onSave: () => void;
  onStatusChange: (s: CollegeStatus) => void;
  onNotesChange: (notes: string) => void;
};

export default function CollegeDetailsDrawer({
  open,
  onOpenChange,
  rec,
  isSaved,
  status,
  notes,
  onSave,
  onStatusChange,
  onNotesChange,
}: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        {rec ? (
          <>
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                {rec.collegeName}
                <Badge variant={bandBadgeVariant(rec.fitBand)}>
                  {bandLabel(rec.fitBand)}
                </Badge>
              </SheetTitle>
              <SheetDescription>
                Score: {rec.overallScore} · Confidence:{" "}
                {rec.confidence}
              </SheetDescription>
            </SheetHeader>

            <div className="mt-6 space-y-6">
              <div className="rounded-lg border p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">Shortlist</h4>
                  <Badge variant={isSaved ? "default" : "outline"}>
                    {isSaved ? statusLabel(status) : "Not saved"}
                  </Badge>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant={isSaved ? "outline" : "default"}
                    onClick={onSave}
                    disabled={isSaved}
                  >
                    {isSaved ? "Saved" : "Save to Shortlist"}
                  </Button>

                  <Button
                    size="sm"
                    variant={status === "interested" ? "default" : "outline"}
                    onClick={() => onStatusChange("interested")}
                    disabled={!isSaved}
                  >
                    Interested
                  </Button>
                  <Button
                    size="sm"
                    variant={status === "applying" ? "default" : "outline"}
                    onClick={() => onStatusChange("applying")}
                    disabled={!isSaved}
                  >
                    Applying
                  </Button>
                  <Button
                    size="sm"
                    variant={status === "applied" ? "default" : "outline"}
                    onClick={() => onStatusChange("applied")}
                    disabled={!isSaved}
                  >
                    Applied
                  </Button>
                  <Button
                    size="sm"
                    variant={status === "not_now" ? "default" : "outline"}
                    onClick={() => onStatusChange("not_now")}
                    disabled={!isSaved}
                  >
                    Not Now
                  </Button>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Notes</h4>
                  <Textarea
                    value={notes}
                    onChange={(e) => onNotesChange(e.target.value)}
                    placeholder="Add notes (why you like it, what to research, visit plan, etc.)"
                    disabled={!isSaved}
                  />
                  {!isSaved ? (
                    <p className="text-xs text-muted-foreground">
                      Save to shortlist to enable status and notes.
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="rounded-lg border p-4 space-y-2">
                <div className="text-sm font-medium">Estimated Cost</div>
                <div className="text-2xl font-semibold">
                  {currency(rec.estimatedCost?.totalCostOfAttendance)}
                </div>
                {rec.estimatedCost?.notes ? (
                  <div className="text-sm text-muted-foreground">{rec.estimatedCost.notes}</div>
                ) : null}
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">Why it matches</div>
                <ul className="list-disc pl-5 space-y-1">
                  {(rec.reasons ?? []).map((x, idx) => (
                    <li key={idx} className="text-sm">
                      {x}
                    </li>
                  ))}
                </ul>
              </div>

              {rec.risks?.length ? (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Risks / Watch-outs</div>
                    <ul className="list-disc pl-5 space-y-1">
                      {rec.risks.map((x, idx) => (
                        <li key={idx} className="text-sm">
                          {x}
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              ) : null}

              {rec.deadlines ? (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Deadlines</div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      {rec.deadlines.earlyAction ? (
                        <div>
                          Early Action:{" "}
                          <span className="text-foreground">{rec.deadlines.earlyAction}</span>
                        </div>
                      ) : null}
                      {rec.deadlines.earlyDecision ? (
                        <div>
                          Early Decision:{" "}
                          <span className="text-foreground">{rec.deadlines.earlyDecision}</span>
                        </div>
                      ) : null}
                      {rec.deadlines.regularDecision ? (
                        <div>
                          Regular Decision:{" "}
                          <span className="text-foreground">{rec.deadlines.regularDecision}</span>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </>
              ) : null}

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
            Select a college to view details.
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
