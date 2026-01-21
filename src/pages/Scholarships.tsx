import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ScholarshipMatch } from "../types/scholarship";
import { ScholarshipTrackingItem, ScholarshipStatus } from "../types/scholarshipTracking";
import {
  loadScholarships,
  saveScholarships,
  upsertScholarship,
  setScholarshipStatus,
  setScholarshipNotes,
} from "../services/scholarshipStore";
import { Skeleton } from "@/components/ui/skeleton";

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
  // Fetch scholarships from database
  const { data: dbScholarships, isLoading, error } = useQuery({
    queryKey: ["scholarships-pipeline"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("scholarships")
        .select("*")
        .eq("status", "active")
        .order("deadline_date", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  // Transform DB rows to ScholarshipMatch format
  const items = React.useMemo<ScholarshipMatch[]>(() => {
    if (!dbScholarships) return [];
    return dbScholarships.map((row) => ({
      id: row.id,
      scholarshipId: row.id,
      scholarshipName: row.name,
      matchScore: 75, // Default score until matching engine runs
      eligibilityConfidence: "medium" as const,
      priority: row.amount_max_usd && row.amount_max_usd >= 10000 ? "high" as const : 
               row.amount_max_usd && row.amount_max_usd >= 2500 ? "medium" as const : "low" as const,
      awardRange: {
        min: row.amount_min_usd ?? undefined,
        max: row.amount_max_usd ?? undefined,
      },
      deadline: row.deadline_date ?? undefined,
      competitivenessEstimate: "medium" as const,
      reasons: ["Based on your profile"],
    }));
  }, [dbScholarships]);

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

  const urgencyStats = React.useMemo(() => {
    let overdue = 0;
    let due7 = 0;
    let due14 = 0;

    for (const s of items) {
      const d = daysUntil(s.deadline);
      if (d == null) continue;
      if (d < 0) overdue += 1;
      if (d >= 0 && d <= 7) due7 += 1;
      if (d >= 0 && d <= 14) due14 += 1;
    }

    return { overdue, due7, due14 };
  }, [items]);

  const todaysPriorities = React.useMemo(() => {
    const ranked = [...items]
      .map((s) => {
        const d = daysUntil(s.deadline);
        const dayScore = d == null ? 9999 : d;
        const priorityBoost = s.priority === "high" ? -5 : s.priority === "medium" ? 0 : 5;
        return { s, sortVal: dayScore + priorityBoost };
      })
      .sort((a, b) => a.sortVal - b.sortVal)
      .map((x) => x.s);

    const urgent = ranked.filter((s) => {
      const d = daysUntil(s.deadline);
      return d != null && d <= 14;
    });

    return urgent.slice(0, 3);
  }, [items]);

  const sorted = React.useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      if (sortKey === "scholarshipName") return compare(a.scholarshipName, b.scholarshipName, sortDir);
      if (sortKey === "priority") return compare(a.priority, b.priority, sortDir);
      if (sortKey === "deadline") {
        const ad = daysUntil(a.deadline);
        const bd = daysUntil(b.deadline);
        const aVal = ad == null ? Number.POSITIVE_INFINITY : ad;
        const bVal = bd == null ? Number.POSITIVE_INFINITY : bd;
        return compare(aVal, bVal, sortDir);
      }
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

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-72 mt-2" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-10 text-center text-destructive">
            Failed to load scholarships. Please try again.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <CardTitle>Scholarship Pipeline</CardTitle>
            <p className="text-sm text-muted-foreground">
              {items.length} scholarships · Ranked by eligibility confidence, fit, and ROI.
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
          <div className="mb-4 space-y-3">
            <div className="flex flex-wrap gap-2">
              <Badge variant={urgencyStats.overdue > 0 ? "destructive" : "outline"}>
                Overdue: {urgencyStats.overdue}
              </Badge>
              <Badge variant={urgencyStats.due7 > 0 ? "destructive" : "outline"}>
                Due ≤ 7 days: {urgencyStats.due7}
              </Badge>
              <Badge variant={urgencyStats.due14 > 0 ? "default" : "outline"}>
                Due ≤ 14 days: {urgencyStats.due14}
              </Badge>
            </div>

            {todaysPriorities.length > 0 ? (
              <div className="rounded-lg border p-3">
                <div className="text-sm font-medium mb-2">Today's Priorities</div>
                <div className="space-y-2">
                  {todaysPriorities.map((s) => {
                    const d = daysUntil(s.deadline);
                    return (
                      <button
                        key={s.id}
                        type="button"
                        className="w-full text-left rounded-md px-3 py-2 hover:bg-muted transition"
                        onClick={() => {
                          setSelected(s);
                          setDrawerOpen(true);
                        }}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="font-medium">{s.scholarshipName}</div>
                          <div className="flex items-center gap-2">
                            <Badge variant={priorityVariant(s.priority)}>{s.priority.toUpperCase()}</Badge>
                            {d != null ? (
                              <Badge variant={urgencyVariant(d)} className="whitespace-nowrap">
                                {urgencyLabel(d)}
                              </Badge>
                            ) : null}
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Match Score: {s.matchScore} · Eligibility: {s.eligibilityConfidence} · Competition:{" "}
                          {s.competitivenessEstimate}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-xs text-muted-foreground">
                No scholarships due within 14 days. Nice work.
              </div>
            )}
          </div>

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
            Showing {items.length} scholarships from the database.
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
