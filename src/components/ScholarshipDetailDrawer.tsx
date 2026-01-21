import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import type { ScholarshipRow } from "@/lib/scholarshipsIntel/scholarshipLibrary";

function formatMoney(min?: number | null, max?: number | null) {
  const fmt = (n: number) => `$${n.toLocaleString()}`;
  if (min && max) return `${fmt(min)}–${fmt(max)}`;
  if (max) return fmt(max);
  if (min) return fmt(min);
  return "—";
}

export default function ScholarshipDetailDrawer({
  open,
  onOpenChange,
  scholarship,
  onAddToPipeline,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  scholarship: ScholarshipRow | null;
  onAddToPipeline: (id: string) => void;
}) {
  if (!scholarship) return null;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <div className="mx-auto w-full max-w-3xl p-4">
          <DrawerHeader>
            <DrawerTitle>{scholarship.name}</DrawerTitle>
            <DrawerDescription>
              {scholarship.provider ?? "Provider unknown"} •{" "}
              {formatMoney(scholarship.amount_min_usd, scholarship.amount_max_usd)} •{" "}
              {scholarship.rolling_deadline ? "Rolling" : scholarship.deadline_date ?? "No deadline listed"}
            </DrawerDescription>
          </DrawerHeader>

          <div className="space-y-3 px-2 pb-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded border p-3">
                <div className="text-muted-foreground">Location</div>
                <div className="font-medium">{scholarship.location_scope ?? "—"}</div>
              </div>
              <div className="rounded border p-3">
                <div className="text-muted-foreground">Education level</div>
                <div className="font-medium">{scholarship.education_level ?? "—"}</div>
              </div>
              <div className="rounded border p-3">
                <div className="text-muted-foreground">Major tags</div>
                <div className="font-medium">{scholarship.major_tags ?? "—"}</div>
              </div>
              <div className="rounded border p-3">
                <div className="text-muted-foreground">Career tags</div>
                <div className="font-medium">{scholarship.career_tags ?? "—"}</div>
              </div>
            </div>

            <div className="rounded border p-3">
              <div className="text-sm text-muted-foreground mb-2">Eligibility (raw)</div>
              <div className="text-sm whitespace-pre-wrap">
                {scholarship.raw_eligibility_text ?? "—"}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={() => onAddToPipeline(scholarship.id)}>
                Add to Pipeline
              </Button>

              {scholarship.url && (
                <Button variant="outline" asChild>
                  <a href={scholarship.url} target="_blank" rel="noreferrer">
                    Open link
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
