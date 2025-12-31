import * as React from "react";
import { getMockCollegeRecommendations } from "../services/mockIntelligence";
import { CollegeRecommendation } from "../types/college";
import { FitBand } from "../types/index";

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

import CollegeDetailsDrawer from "../components/CollegeDetailsDrawer";

type SortKey = "collegeName" | "overallScore" | "fitBand";
type SortDir = "asc" | "desc";

function fitBandLabel(band: FitBand) {
  if (band === "likely") return "Likely";
  if (band === "target") return "Target";
  return "Reach";
}

function fitBandBadgeVariant(band: FitBand): "default" | "secondary" | "destructive" {
  if (band === "likely") return "default";
  if (band === "target") return "secondary";
  return "destructive";
}

function currency(n?: number) {
  if (n == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function compare(a: string | number, b: string | number, dir: SortDir) {
  if (a < b) return dir === "asc" ? -1 : 1;
  if (a > b) return dir === "asc" ? 1 : -1;
  return 0;
}

export default function CollegeMatches() {
  const [items] = React.useState<CollegeRecommendation[]>(
    () => getMockCollegeRecommendations()
  );

  const [search, setSearch] = React.useState("");
  const [bandFilter, setBandFilter] = React.useState<string>("all");

  const [sortKey, setSortKey] = React.useState<SortKey>("overallScore");
  const [sortDir, setSortDir] = React.useState<SortDir>("desc");

  const [selectedRec, setSelectedRec] = React.useState<CollegeRecommendation | null>(null);
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((r) => {
      const matchesSearch =
        q.length === 0 || r.collegeName.toLowerCase().includes(q);
      const matchesBand = bandFilter === "all" || r.fitBand === bandFilter;
      return matchesSearch && matchesBand;
    });
  }, [items, search, bandFilter]);

  const sorted = React.useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      if (sortKey === "collegeName") return compare(a.collegeName, b.collegeName, sortDir);
      if (sortKey === "fitBand") return compare(a.fitBand, b.fitBand, sortDir);
      return compare(a.overallScore, b.overallScore, sortDir);
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
    <div className="container mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-2xl">College Matches</CardTitle>
              <p className="text-muted-foreground text-sm mt-1">
                Filter by reach/target/likely and sort by score.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search colleges…"
                className="md:w-[260px]"
              />

              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant={bandFilter === "all" ? "default" : "outline"}
                  onClick={() => setBandFilter("all")}
                >
                  All
                </Button>
                <Button
                  size="sm"
                  variant={bandFilter === "likely" ? "default" : "outline"}
                  onClick={() => setBandFilter("likely")}
                >
                  Likely
                </Button>
                <Button
                  size="sm"
                  variant={bandFilter === "target" ? "default" : "outline"}
                  onClick={() => setBandFilter("target")}
                >
                  Target
                </Button>
                <Button
                  size="sm"
                  variant={bandFilter === "reach" ? "default" : "outline"}
                  onClick={() => setBandFilter("reach")}
                >
                  Reach
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleSort("collegeName")}
                    >
                      College
                    </Button>
                  </TableHead>

                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleSort("fitBand")}
                    >
                      Band
                    </Button>
                  </TableHead>

                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleSort("overallScore")}
                    >
                      Score
                    </Button>
                  </TableHead>

                  <TableHead>Est. Cost</TableHead>
                  <TableHead>Why it matches</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((r) => (
                  <TableRow 
                    key={r.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => {
                      setSelectedRec(r);
                      setDrawerOpen(true);
                    }}
                  >
                    <TableCell className="font-medium">{r.collegeName}</TableCell>

                    <TableCell>
                      <Badge variant={fitBandBadgeVariant(r.fitBand)}>
                        {fitBandLabel(r.fitBand)}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        Confidence: {r.confidence}
                      </p>
                    </TableCell>

                    <TableCell className="text-center font-semibold">
                      {r.overallScore}
                    </TableCell>

                    <TableCell>
                      {currency(r.estimatedCost?.totalCostOfAttendance)}
                      <p className="text-xs text-muted-foreground">
                        {r.estimatedCost?.notes ?? ""}
                      </p>
                    </TableCell>

                    <TableCell>
                      <ul className="text-sm list-disc list-inside">
                        {(r.reasons ?? []).slice(0, 2).map((x, idx) => (
                          <li key={idx} className="text-muted-foreground">
                            {x}
                          </li>
                        ))}
                      </ul>
                      {r.risks?.length ? (
                        <p className="text-xs text-destructive mt-1">
                          Risk: {r.risks[0]}
                        </p>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}

                {sorted.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No matches found.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>

          <p className="text-xs text-muted-foreground mt-4">
            * Scores and bands are mock data for UI scaffolding. Next step is replacing with the real scoring engine.
          </p>
        </CardContent>
      </Card>

      <CollegeDetailsDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        rec={selectedRec}
      />
    </div>
  );
}
