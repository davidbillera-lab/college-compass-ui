import * as React from "react";
import { CollegeRecommendation } from "../types/college";

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

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rec: CollegeRecommendation | null;
};

export default function CollegeDetailsDrawer({ open, onOpenChange, rec }: Props) {
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
              <div>
                <h4 className="font-semibold text-sm mb-2">Estimated Cost</h4>
                <p className="text-2xl font-bold">
                  {currency(rec.estimatedCost?.totalCostOfAttendance)}
                </p>
                {rec.estimatedCost?.notes ? (
                  <p className="text-sm text-muted-foreground mt-1">{rec.estimatedCost.notes}</p>
                ) : null}
              </div>

              <Separator />

              <div>
                <h4 className="font-semibold text-sm mb-2">Why it matches</h4>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  {(rec.reasons ?? []).map((x, idx) => (
                    <li key={idx}>
                      {x}
                    </li>
                  ))}
                </ul>
              </div>

              {rec.risks?.length ? (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Risks / Watch-outs</h4>
                    <ul className="list-disc list-inside text-sm text-destructive space-y-1">
                      {rec.risks.map((x, idx) => (
                        <li key={idx}>
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
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Deadlines</h4>
                    <div className="text-sm text-muted-foreground space-y-1">
                      {rec.deadlines.earlyAction ? (
                        <p>
                          <span className="font-medium">Early Action:</span> {rec.deadlines.earlyAction}
                        </p>
                      ) : null}
                      {rec.deadlines.earlyDecision ? (
                        <p>
                          <span className="font-medium">Early Decision:</span> {rec.deadlines.earlyDecision}
                        </p>
                      ) : null}
                      {rec.deadlines.regularDecision ? (
                        <p>
                          <span className="font-medium">Regular Decision:</span> {rec.deadlines.regularDecision}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </>
              ) : null}

              <Separator />

              <div className="flex gap-2">
                <Button className="flex-1">Save to Shortlist</Button>
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Close
                </Button>
              </div>

              <p className="text-xs text-muted-foreground">
                Next: wire "Save to Shortlist" to persistence (local state → backend).
              </p>
            </div>
          </>
        ) : (
          <p className="text-muted-foreground">Select a college to view details.</p>
        )}
      </SheetContent>
    </Sheet>
  );
}
