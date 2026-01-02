import * as React from "react";
import { getMockScholarshipMatches } from "../services/mockIntelligence";
import { ScholarshipMatch } from "../types/scholarship";
import { ScholarshipTrackingItem, ScholarshipStatus } from "../types/scholarshipTracking";
import {
  loadScholarships,
  saveScholarships,
  upsertScholarship,
  setScholarshipStatus,
  setScholarshipNotes,
} from "../services/scholarshipStore";

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

function nextScholarshipStatus(
  s: "to_apply" | "drafting" | "submitted" | "won" | "not_now"
) {
  if (s === "to_apply") return "drafting";
  if (s === "drafting") return "submitted";
  if (s === "submitted") return "won";
  if (s === "won") return "not_now";
  return "to_apply";
}

function daysUntil(deadline?: string): number | null {
  if (!deadline) return null; // ISODate "YYYY-MM-DD"
  const [y, m, d] = deadline.split("-").map(Number);
  if (!y || !m || !d) return null;

  const due = new Date(y, m - 1, d);
  // normalize to midnight local time for consistent day diff
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((due.getTime() - today.getTime()) / msPerDay);
}

function urgencyLabel(days: number): string {
  if (days < 0) return "Overdue";
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  return `Due in ${days} days`;
}

function urgencyVariant(days: number): "destructive" | "default" | "secondary" | "outline" {
  if (days < 0) return "destructive";
  if (days <= 3) return "destructive";
  if (days <= 14) return "default";
  if (days <= 30) return "secondary";
  return "outline";
}

function isUrgentDeadline(deadline?: string): boolean {
  const d = daysUntil(deadline);
  if (d == null) return false;
  return d <= 14; // urgent window: 2 weeks
}

export default function Scholarships() {
  const [items] = React.useState<ScholarshipMatch[]>(() => getMockScholarshipMatches());

  const [search, setSearch] = React.useState("");
  const [priorityFilter, setPriorityFilter] = React.useState<"all" | "high" | "medium" | "low">("all");
  const [trackedOnly, setTrackedOnly] = React.useState(false);
  const [urgentOnly, setUrgentOnly] = React.useState(false);

  const [sortKey, setSortKey] = React.useState<SortKey>("matchScore");
  const [sortDir, setSortDir] = React.useState<SortDir>("desc");

  const [selected, setSelected] = React.useState<ScholarshipMatch | null>(null);
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  // Tracking state
  const [tracked, setTracked] = React.useState<Record<string, ScholarshipTrackingItem>>(() =>
    loadScholarships()
  );

  // Persist tracking changes
  React.useEffect(() => {
    saveScholarships(tracked);
  }, [tracked]);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((s) => {
      const matchesSearch = q.length === 0 || s.scholarshipName.toLowerCase().includes(q);
      const matchesPriority = priorityFilter === "all" || s.priority === priorityFilter;
      const isTracked = !!tracked[s.scholarshipId];
      const matchesTracked = !trackedOnly || isTracked;
      const matchesUrgent = !urgentOnly || isUrgentDeadline(s.deadline);
      return matchesSearch && matchesPriority && matchesTracked && matchesUrgent;
    });
  }, [items, search, priorityFilter, trackedOnly, urgentOnly, tracked]);

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

  // Tracking helpers
  const selectedId = selected?.scholarshipId ?? "";
  const isTracked = !!(selectedId && tracked[selectedId]);

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
                size="sm"
                variant={priorityFilter === "all" ? "default" : "outline"}
                onClick={() => setPriorityFilter("all")}
              >
                All
              </Button>
              <Button
                size="sm"
                variant={priorityFilter === "high" ? "default" : "outline"}
                onClick={() => setPriorityFilter("high")}
              >
                High
              </Button>
              <Button
                size="sm"
                variant={priorityFilter === "medium" ? "default" : "outline"}
                onClick={() => setPriorityFilter("medium")}
              >
                Medium
              </Button>
              <Button
                size="sm"
                variant={priorityFilter === "low" ? "default" : "outline"}
                onClick={() => setPriorityFilter("low")}
              >
                Low
              </Button>
              <Button
                size="sm"
                variant={trackedOnly ? "default" : "outline"}
                onClick={() => setTrackedOnly((v) => !v)}
              >
                Tracked
              </Button>
              <Button
                size="sm"
                variant={urgentOnly ? "default" : "outline"}
                onClick={() => setUrgentOnly((v) => !v)}
              >
                Urgent
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
                  <TableHead className="w-[14%]">Tracking</TableHead>
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

                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{s.deadline ?? "—"}</span>
                        {(() => {
                          const d = daysUntil(s.deadline);
                          if (d == null) return null;
                          // only show badge when within 30 days or overdue
                          if (d > 30) return null;
                          return (
                            <Badge variant={urgencyVariant(d)} className="whitespace-nowrap">
                              {urgencyLabel(d)}
                            </Badge>
                          );
                        })()}
                      </div>
                    </TableCell>

                    <TableCell>
                      {formatMoneyRange(s.awardRange?.min, s.awardRange?.max)}
                      <div className="text-xs text-muted-foreground mt-1">
                        Competition: {s.competitivenessEstimate}
                      </div>
                    </TableCell>
                    <TableCell>
                      {tracked[s.scholarshipId] ? (
                        <button
                          type="button"
                          className="inline-flex"
                          onClick={(e) => {
                            e.stopPropagation();
                            const current = tracked[s.scholarshipId].status;
                            const next = nextScholarshipStatus(current);
                            setTracked((m: any) => setScholarshipStatus(m, s.scholarshipId, next));
                          }}
                          title="Click to change tracking status"
                        >
                          <Badge variant="outline">
                            {tracked[s.scholarshipId].status
                              .replace("_", " ")
                              .replace(/\b\w/g, (c) => c.toUpperCase())}
                          </Badge>
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="text-xs text-muted-foreground hover:underline"
                          onClick={(e) => {
                            e.stopPropagation();
                            setTracked((m: any) =>
                              upsertScholarship(m, s.scholarshipId, s.scholarshipName, "to_apply")
                            );
                          }}
                          title="Click to track this scholarship"
                        >
                          —
                        </button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}

                {sorted.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
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

      <ScholarshipDetailsDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        match={selected}
        isTracked={isTracked}
        status={(isTracked ? tracked[selectedId].status : "to_apply") as ScholarshipStatus}
        notes={isTracked ? tracked[selectedId].notes ?? "" : ""}
        onTrack={() => {
          if (!selected) return;
          setTracked((m: any) =>
            upsertScholarship(m, selected.scholarshipId, selected.scholarshipName, "to_apply")
          );
        }}
        onStatusChange={(s) => {
          if (!selected) return;
          setTracked((m: any) => setScholarshipStatus(m, selected.scholarshipId, s));
        }}
        onNotesChange={(n) => {
          if (!selected) return;
          setTracked((m: any) => setScholarshipNotes(m, selected.scholarshipId, n));
        }}
      />
    </div>
  );
}
