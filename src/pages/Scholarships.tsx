import * as React from "react";
import { getMockScholarshipMatches } from "../services/mockIntelligence";
import { ScholarshipMatch } from "../types/scholarship";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import ScholarshipDetailsDrawer from "../components/ScholarshipDetailsDrawer";

type SortKey = "scholarshipName" | "matchScore" | "priority" | "deadline";
type SortDir = "asc" | "desc";

function compare(a: string | number, b: string | number, dir: SortDir) {
  if (a < b) return dir === "asc" ? -1 : 1;
  if (a > b) return dir === "asc" ? 1 : -1;
  return 0;
}

function priorityVariant(p: "low" | "medium" | "high"): "secondary" | "default" | "destructive" {
  if (p === "low") return "secondary";
  if (p === "medium") return "default";
  return "destructive";
}

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

export default function Scholarships() {
  const [items] = React.useState<ScholarshipMatch[]>(() => getMockScholarshipMatches());

  const [search, setSearch] = React.useState("");
  const [priorityFilter, setPriorityFilter] = React.useState<"all" | "high" | "medium" | "low">("all");

  const [sortKey, setSortKey] = React.useState<SortKey>("matchScore");
  const [sortDir, setSortDir] = React.useState<SortDir>("desc");

  const [selected, setSelected] = React.useState<ScholarshipMatch | null>(null);
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((s) => {
      const matchesSearch = q.length === 0 || s.scholarshipName.toLowerCase().includes(q);
      const matchesPriority = priorityFilter === "all" || s.priority === priorityFilter;
      return matchesSearch && matchesPriority;
    });
  }, [items, search, priorityFilter]);

  const sorted = React.useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      if (sortKey === "scholarshipName") return compare(a.scholarshipName, b.scholarshipName, sortDir);
      if (sortKey === "priority") return compare(a.priority, b.priority, sortDir);
      if (sortKey === "deadline") return compare(a.deadline ?? "", b.deadline ?? "", sortDir);
      return compare(a.matchScore, b.matchScore, sortDir);
    });
    return arr;
  }, [filtered, sortKey, sortDir]);

  function toggleSort(nextKey: SortKey) {
    if (sortKey === nextKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(nextKey);
      setSortDir("asc");
    }
  }

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <CardTitle>Scholarship Pipeline</CardTitle>
            <p className="text-sm text-muted-foreground">
              Ranked matches based on eligibility confidence, fit, and ROI.
            </p>
          </div>

          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search scholarships…"
              className="md:w-[280px]"
            />

            <div className="flex gap-2">
              <Button
                variant={priorityFilter === "all" ? "default" : "outline"}
                onClick={() => setPriorityFilter("all")}
              >
                All
              </Button>
              <Button
                variant={priorityFilter === "high" ? "default" : "outline"}
                onClick={() => setPriorityFilter("high")}
              >
                High
              </Button>
              <Button
                variant={priorityFilter === "medium" ? "default" : "outline"}
                onClick={() => setPriorityFilter("medium")}
              >
                Medium
              </Button>
              <Button
                variant={priorityFilter === "low" ? "default" : "outline"}
                onClick={() => setPriorityFilter("low")}
              >
                Low
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[38%]">
                    <button className="font-medium hover:underline" onClick={() => toggleSort("scholarshipName")}>
                      Scholarship
                    </button>
                  </TableHead>

                  <TableHead className="w-[14%]">
                    <button className="font-medium hover:underline" onClick={() => toggleSort("priority")}>
                      Priority
                    </button>
                  </TableHead>

                  <TableHead className="w-[12%] text-right">
                    <button className="font-medium hover:underline" onClick={() => toggleSort("matchScore")}>
                      Score
                    </button>
                  </TableHead>

                  <TableHead className="w-[14%]">
                    <button className="font-medium hover:underline" onClick={() => toggleSort("deadline")}>
                      Deadline
                    </button>
                  </TableHead>

                  <TableHead className="w-[22%]">Award</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {sorted.map((s) => (
                  <TableRow
                    key={s.id}
                    className="cursor-pointer"
                    onClick={() => {
                      setSelected(s);
                      setDrawerOpen(true);
                    }}
                  >
                    <TableCell className="font-medium">{s.scholarshipName}</TableCell>

                    <TableCell>
                      <Badge variant={priorityVariant(s.priority)}>{s.priority.toUpperCase()}</Badge>
                      <div className="text-xs text-muted-foreground mt-1">
                        Eligibility: {s.eligibilityConfidence}
                      </div>
                    </TableCell>

                    <TableCell className="text-right font-semibold">{s.matchScore}</TableCell>

                    <TableCell>{s.deadline ?? "—"}</TableCell>

                    <TableCell>
                      {formatMoneyRange(s.awardRange?.min, s.awardRange?.max)}
                      <div className="text-xs text-muted-foreground mt-1">
                        Competition: {s.competitivenessEstimate}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}

                {sorted.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                      No scholarships found.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 text-xs text-muted-foreground">
            * Mock scholarship data for UI scaffolding. Next: tracking statuses + autofill packet builder.
          </div>
        </CardContent>
      </Card>

      <ScholarshipDetailsDrawer open={drawerOpen} onOpenChange={setDrawerOpen} match={selected} />
    </div>
  );
}
