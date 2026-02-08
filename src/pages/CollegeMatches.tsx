import * as React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { fetchColleges, fetchCollegeProfile } from "../lib/collegeIntel/api";
import { calculateAllCollegeMatches } from "../lib/collegeIntel/matching";
import { CollegeRecommendation } from "../types/college";
import { FitBand } from "../types/index";
import { ShortlistItem, CollegeStatus } from "../types/shortlist";
import {
  loadShortlist,
  saveShortlist,
  upsertShortlistItem,
  setStatus,
  setNotes,
} from "../services/shortlistStore";

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

function nextStatus(s: "interested" | "applying" | "applied" | "not_now") {
  if (s === "interested") return "applying";
  if (s === "applying") return "applied";
  if (s === "applied") return "not_now";
  return "interested";
}

export default function CollegeMatches() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [items, setItems] = React.useState<CollegeRecommendation[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [search, setSearch] = React.useState("");
  const [bandFilter, setBandFilter] = React.useState<string>("all");
  const [shortlistedOnly, setShortlistedOnly] = React.useState(false);

  const [sortKey, setSortKey] = React.useState<SortKey>("overallScore");
  const [sortDir, setSortDir] = React.useState<SortDir>("desc");

  const [selected, setSelected] = React.useState<CollegeRecommendation | null>(null);
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  // Shortlist state
  const [shortlist, setShortlist] = React.useState<Record<string, ShortlistItem>>(() =>
    loadShortlist()
  );

  // Load and calculate college matches
  React.useEffect(() => {
    const loadMatches = async () => {
      if (!user?.id) {
        setError("Please log in to view college matches");
        setLoading(false);
        return;
      }

      try {
        const [colleges, profile] = await Promise.all([
          fetchColleges(),
          fetchCollegeProfile(user.id),
        ]);

        if (!profile) {
          setError("Please complete your profile to view matches");
          setLoading(false);
          return;
        }

        // Calculate matches
        const matches = calculateAllCollegeMatches(colleges, profile);
        
        // Convert to recommendations
        const recommendations: CollegeRecommendation[] = Array.from(matches.entries()).map(
          ([collegeId, result]) => {
            const college = colleges.find((c) => c.id === collegeId);
            return {
              id: collegeId,
              collegeId,
              collegeName: college?.name || "Unknown",
              fitBand: result.bucket as FitBand,
              overallScore: Math.round(result.score),
              confidence: "medium",
              reasons: result.reasons,
              estimatedCost: {
                totalCostOfAttendance: college?.sticker_usd || undefined,
              },
            } as CollegeRecommendation;
          }
        );

        // Sort by score descending
        recommendations.sort((a, b) => b.overallScore - a.overallScore);
        
        setItems(recommendations);
        setError(null);
      } catch (err) {
        console.error("Error loading matches:", err);
        setError("Failed to load college matches");
      } finally {
        setLoading(false);
      }
    };

    loadMatches();
  }, [user?.id]);

  // Persist shortlist changes
  React.useEffect(() => {
    saveShortlist(shortlist);
  }, [shortlist]);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((r) => {
      const matchesSearch =
        q.length === 0 || r.collegeName.toLowerCase().includes(q);
      const matchesBand = bandFilter === "all" || r.fitBand === bandFilter;
      const isShortlisted = !!shortlist[r.collegeId];
      const matchesShortlisted = !shortlistedOnly || isShortlisted;
      return matchesSearch && matchesBand && matchesShortlisted;
    });
  }, [items, search, bandFilter, shortlistedOnly, shortlist]);

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

  // Shortlist helpers
  const selectedId = selected?.collegeId ?? "";
  const saved = !!(selectedId && shortlist[selectedId]);

  return (
    <div className="container mx-auto py-8 px-4">
      {loading && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Loading college matches...
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="border-destructive mb-4">
          <CardContent className="py-4 text-sm text-destructive">
            {error}
          </CardContent>
        </Card>
      )}

      {!loading && !error && (
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle className="text-2xl">College Matches</CardTitle>
                <p className="text-muted-foreground text-sm mt-1">
                  {items.length} colleges matched based on your profile. Filter by reach/target/likely and sort by score.
                </p>
              </div>
              <Button 
                variant="outline" 
                onClick={() => navigate("/college-compare")}
              >
                Compare Colleges
              </Button>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 mt-4">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search colleges…"
                className="md:w-[260px]"
              />

              <div className="flex gap-1 flex-wrap">
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
                <Button
                  size="sm"
                  variant={shortlistedOnly ? "default" : "outline"}
                  onClick={() => setShortlistedOnly((v) => !v)}
                >
                  Shortlisted
                </Button>
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
                    <TableHead className="w-[14%]">Shortlist</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sorted.map((r) => (
                    <TableRow
                      key={r.id}
                      className="cursor-pointer"
                      onClick={() => {
                        setSelected(r);
                        setDrawerOpen(true);
                      }}
                    >
                      <TableCell className="font-medium">
                        {r.collegeName}
                        {shortlist[r.id] && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            Saved
                          </Badge>
                        )}
                      </TableCell>

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
                      </TableCell>
                      <TableCell>
                        {shortlist[r.collegeId] ? (
                          <button
                            type="button"
                            className="inline-flex"
                            onClick={(e) => {
                              e.stopPropagation();
                              const current = shortlist[r.collegeId].status;
                              const next = nextStatus(current);
                              setShortlist((m: any) => setStatus(m, r.collegeId, next));
                            }}
                            title="Click to change status"
                          >
                            <Badge
                              variant={
                                shortlist[r.collegeId].status === "interested"
                                  ? "secondary"
                                  : shortlist[r.collegeId].status === "applying"
                                  ? "default"
                                  : shortlist[r.collegeId].status === "applied"
                                  ? "outline"
                                  : "destructive"
                              }
                            >
                              {shortlist[r.collegeId].status
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
                              setShortlist((m: any) =>
                                upsertShortlistItem(m, r.collegeId, r.collegeName, "interested")
                              );
                            }}
                            title="Click to add to shortlist"
                          >
                            —
                          </button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}

                  {sorted.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No matches found.
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </div>

            <p className="text-xs text-muted-foreground mt-4">
              * Matches are calculated based on your academic profile and preferences.
            </p>
          </CardContent>
        </Card>
      )}

      <CollegeDetailsDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        rec={selected}
        isSaved={saved}
        status={(saved ? shortlist[selectedId].status : "interested") as CollegeStatus}
        notes={saved ? shortlist[selectedId].notes ?? "" : ""}
        onSave={() => {
          if (!selected) return;
          setShortlist((m: any) =>
            upsertShortlistItem(m, selected.collegeId, selected.collegeName, "interested")
          );
        }}
        onStatusChange={(s) => {
          if (!selected) return;
          setShortlist((m: any) => setStatus(m, selected.collegeId, s));
        }}
        onNotesChange={(n) => {
          if (!selected) return;
          setShortlist((m: any) => setNotes(m, selected.collegeId, n));
        }}
      />
    </div>
  );
}
