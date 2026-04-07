import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Plus, Trash2, Trophy, HelpCircle, TrendingDown, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface AwardEntry {
  id: string;
  collegeName: string;
  tuition: string;
  roomBoard: string;
  fees: string;
  books: string;
  grants: string;
  scholarships: string;
  subsidizedLoans: string;
  unsubsidizedLoans: string;
  workStudy: string;
  parentPlusLoans: string;
}

const emptyEntry = (): AwardEntry => ({
  id: crypto.randomUUID(),
  collegeName: "",
  tuition: "",
  roomBoard: "",
  fees: "",
  books: "",
  grants: "",
  scholarships: "",
  subsidizedLoans: "",
  unsubsidizedLoans: "",
  workStudy: "",
  parentPlusLoans: "",
});

const parseNum = (val: string) => parseFloat(val.replace(/[^0-9.]/g, "")) || 0;

function calcSummary(entry: AwardEntry) {
  const totalCost =
    parseNum(entry.tuition) +
    parseNum(entry.roomBoard) +
    parseNum(entry.fees) +
    parseNum(entry.books);

  const totalFreeAid = parseNum(entry.grants) + parseNum(entry.scholarships);
  const totalLoans =
    parseNum(entry.subsidizedLoans) +
    parseNum(entry.unsubsidizedLoans) +
    parseNum(entry.parentPlusLoans);
  const workStudy = parseNum(entry.workStudy);

  const netPrice = totalCost - totalFreeAid;
  const outOfPocket = netPrice - totalLoans - workStudy;

  return { totalCost, totalFreeAid, totalLoans, workStudy, netPrice, outOfPocket };
}

const fmt = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

const FIELD_TIPS: Record<string, string> = {
  tuition: "Annual tuition and required fees listed on the Cost of Attendance.",
  roomBoard: "Room and board (on-campus) or estimated off-campus housing costs.",
  fees: "Any additional mandatory fees not included in tuition.",
  books: "Estimated books and supplies — typically $800–$1,200/year.",
  grants: "Free money from the school, state, or federal government (Pell Grant). Does NOT need to be repaid.",
  scholarships: "Merit or need-based scholarships from the school or outside organizations. Does NOT need to be repaid.",
  subsidizedLoans: "Federal loans where the government pays interest while you're in school. Must be repaid.",
  unsubsidizedLoans: "Federal loans that accrue interest immediately. Must be repaid.",
  workStudy: "Federal Work-Study is earned through part-time work — it is NOT guaranteed income.",
  parentPlusLoans: "Loans taken out by parents. Must be repaid with interest. Treat as debt, not aid.",
};

function FieldLabel({ label, tip }: { label: string; tip: string }) {
  return (
    <div className="flex items-center gap-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
          </TooltipTrigger>
          <TooltipContent className="max-w-[220px] text-xs">{tip}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}

function AwardCard({
  entry,
  rank,
  onChange,
  onRemove,
  canRemove,
}: {
  entry: AwardEntry;
  rank: number | null;
  onChange: (id: string, field: keyof AwardEntry, value: string) => void;
  onRemove: (id: string) => void;
  canRemove: boolean;
}) {
  const summary = calcSummary(entry);
  const isComplete = entry.collegeName && entry.tuition;

  return (
    <Card className={`relative ${rank === 1 ? "ring-2 ring-green-500" : ""}`}>
      {rank === 1 && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-green-600 text-white gap-1">
            <Trophy className="h-3 w-3" /> Best Value
          </Badge>
        </div>
      )}
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <Input
            placeholder="College Name"
            value={entry.collegeName}
            onChange={(e) => onChange(entry.id, "collegeName", e.target.value)}
            className="font-semibold text-base border-0 border-b rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary"
          />
          {canRemove && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive flex-shrink-0"
              onClick={() => onRemove(entry.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Costs */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
            Cost of Attendance
          </p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { field: "tuition", label: "Tuition & Fees" },
              { field: "roomBoard", label: "Room & Board" },
              { field: "fees", label: "Additional Fees" },
              { field: "books", label: "Books & Supplies" },
            ].map(({ field, label }) => (
              <div key={field}>
                <FieldLabel label={label} tip={FIELD_TIPS[field]} />
                <Input
                  placeholder="$0"
                  value={(entry as Record<string, string>)[field]}
                  onChange={(e) => onChange(entry.id, field as keyof AwardEntry, e.target.value)}
                  className="h-8 text-sm mt-0.5"
                />
              </div>
            ))}
          </div>
          {isComplete && (
            <div className="mt-2 flex justify-between text-sm font-medium">
              <span>Total Cost</span>
              <span>{fmt(summary.totalCost)}</span>
            </div>
          )}
        </div>

        <Separator />

        {/* Free Aid */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-green-700 mb-2">
            Free Aid (Does Not Need to Be Repaid)
          </p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { field: "grants", label: "Grants" },
              { field: "scholarships", label: "Scholarships" },
            ].map(({ field, label }) => (
              <div key={field}>
                <FieldLabel label={label} tip={FIELD_TIPS[field]} />
                <Input
                  placeholder="$0"
                  value={(entry as Record<string, string>)[field]}
                  onChange={(e) => onChange(entry.id, field as keyof AwardEntry, e.target.value)}
                  className="h-8 text-sm mt-0.5 border-green-200 focus-visible:ring-green-300"
                />
              </div>
            ))}
          </div>
          {isComplete && (
            <div className="mt-2 flex justify-between text-sm font-medium text-green-700">
              <span>Total Free Aid</span>
              <span>- {fmt(summary.totalFreeAid)}</span>
            </div>
          )}
        </div>

        <Separator />

        {/* Loans & Work-Study */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-orange-700 mb-2">
            Loans & Work-Study (Must Be Repaid or Earned)
          </p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { field: "subsidizedLoans", label: "Subsidized Loans" },
              { field: "unsubsidizedLoans", label: "Unsubsidized Loans" },
              { field: "workStudy", label: "Work-Study" },
              { field: "parentPlusLoans", label: "Parent PLUS Loans" },
            ].map(({ field, label }) => (
              <div key={field}>
                <FieldLabel label={label} tip={FIELD_TIPS[field]} />
                <Input
                  placeholder="$0"
                  value={(entry as Record<string, string>)[field]}
                  onChange={(e) => onChange(entry.id, field as keyof AwardEntry, e.target.value)}
                  className="h-8 text-sm mt-0.5 border-orange-200 focus-visible:ring-orange-300"
                />
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Summary */}
        {isComplete && (
          <div className="rounded-lg bg-muted p-3 space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Cost</span>
              <span>{fmt(summary.totalCost)}</span>
            </div>
            <div className="flex justify-between text-sm text-green-700">
              <span>− Free Aid</span>
              <span>{fmt(summary.totalFreeAid)}</span>
            </div>
            <Separator className="my-1" />
            <div className="flex justify-between text-sm font-semibold">
              <span>Net Price</span>
              <span>{fmt(summary.netPrice)}</span>
            </div>
            <div className="flex justify-between text-sm text-orange-700">
              <span>− Loans & Work-Study</span>
              <span>{fmt(summary.totalLoans + summary.workStudy)}</span>
            </div>
            <Separator className="my-1" />
            <div className="flex justify-between text-base font-bold">
              <span>Out-of-Pocket</span>
              <span
                className={
                  summary.outOfPocket <= 0
                    ? "text-green-600"
                    : summary.outOfPocket < 10000
                    ? "text-yellow-600"
                    : "text-red-600"
                }
              >
                {fmt(Math.max(0, summary.outOfPocket))}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function AwardComparisonPage() {
  const [entries, setEntries] = useState<AwardEntry[]>([emptyEntry(), emptyEntry()]);

  const handleChange = (id: string, field: keyof AwardEntry, value: string) => {
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, [field]: value } : e))
    );
  };

  const handleRemove = (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const handleAdd = () => {
    if (entries.length >= 6) {
      toast.info("You can compare up to 6 colleges at once.");
      return;
    }
    setEntries((prev) => [...prev, emptyEntry()]);
  };

  // Rank by lowest out-of-pocket
  const summaries = entries.map((e) => ({ id: e.id, ...calcSummary(e) }));
  const completedEntries = entries.filter((e) => e.collegeName && e.tuition);
  let bestId: string | null = null;
  if (completedEntries.length >= 2) {
    const sorted = [...summaries]
      .filter((s) => entries.find((e) => e.id === s.id)?.collegeName)
      .sort((a, b) => a.outOfPocket - b.outOfPocket);
    bestId = sorted[0]?.id ?? null;
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
              <TrendingDown className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold">Financial Aid Comparison</h1>
          </div>
          <p className="text-muted-foreground text-sm max-w-2xl">
            Enter the numbers from each college's award letter to find your true out-of-pocket cost.
            Remember: grants and scholarships are free money — loans must be repaid.
          </p>
        </div>
        <Button onClick={handleAdd} variant="outline" className="flex-shrink-0 gap-2">
          <Plus className="h-4 w-4" />
          Add College
        </Button>
      </div>

      {/* Warning banner */}
      <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm">
        <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
        <p>
          <strong>Important:</strong> Work-Study funds must be earned through a part-time job and
          are not automatically applied to your bill. Parent PLUS Loans are debt — not aid. Always
          calculate your true out-of-pocket cost before making your enrollment decision.
        </p>
      </div>

      {/* Comparison Grid */}
      <div
        className={`grid gap-6 ${
          entries.length === 1
            ? "grid-cols-1 max-w-md"
            : entries.length === 2
            ? "grid-cols-1 md:grid-cols-2"
            : entries.length === 3
            ? "grid-cols-1 md:grid-cols-3"
            : "grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
        }`}
      >
        {entries.map((entry) => (
          <AwardCard
            key={entry.id}
            entry={entry}
            rank={entry.id === bestId ? 1 : null}
            onChange={handleChange}
            onRemove={handleRemove}
            canRemove={entries.length > 1}
          />
        ))}
      </div>

      {/* Summary Table */}
      {completedEntries.length >= 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Side-by-Side Summary</CardTitle>
            <CardDescription>Ranked by lowest out-of-pocket cost</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 pr-4 font-medium text-muted-foreground">College</th>
                    <th className="text-right py-2 px-3 font-medium text-muted-foreground">Total Cost</th>
                    <th className="text-right py-2 px-3 font-medium text-green-700">Free Aid</th>
                    <th className="text-right py-2 px-3 font-medium text-muted-foreground">Net Price</th>
                    <th className="text-right py-2 px-3 font-medium text-orange-700">Loans</th>
                    <th className="text-right py-2 pl-3 font-bold">Out-of-Pocket</th>
                  </tr>
                </thead>
                <tbody>
                  {[...completedEntries]
                    .sort(
                      (a, b) =>
                        calcSummary(a).outOfPocket - calcSummary(b).outOfPocket
                    )
                    .map((entry, idx) => {
                      const s = calcSummary(entry);
                      return (
                        <tr key={entry.id} className="border-b last:border-0">
                          <td className="py-2 pr-4 font-medium">
                            {idx === 0 && (
                              <Trophy className="inline h-3.5 w-3.5 text-green-600 mr-1" />
                            )}
                            {entry.collegeName}
                          </td>
                          <td className="text-right py-2 px-3">{fmt(s.totalCost)}</td>
                          <td className="text-right py-2 px-3 text-green-700">
                            {fmt(s.totalFreeAid)}
                          </td>
                          <td className="text-right py-2 px-3">{fmt(s.netPrice)}</td>
                          <td className="text-right py-2 px-3 text-orange-700">
                            {fmt(s.totalLoans)}
                          </td>
                          <td
                            className={`text-right py-2 pl-3 font-bold ${
                              idx === 0 ? "text-green-600" : ""
                            }`}
                          >
                            {fmt(Math.max(0, s.outOfPocket))}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
