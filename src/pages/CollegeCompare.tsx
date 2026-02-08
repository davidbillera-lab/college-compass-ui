import * as React from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { fetchColleges } from "../lib/collegeIntel/api";
import { College } from "../lib/collegeIntel/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Plus, Search, ExternalLink, MapPin, Users, DollarSign, GraduationCap, Award } from "lucide-react";

function formatCurrency(value?: number | null) {
  if (value == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPercent(value?: number | null) {
  if (value == null) return "—";
  return `${Math.round(value)}%`;
}

function formatRatio(value?: number | null) {
  if (value == null) return "—";
  return `${value}:1`;
}

interface StatRowProps {
  label: string;
  values: (string | React.ReactNode)[];
  icon?: React.ReactNode;
}

function StatRow({ label, values, icon }: StatRowProps) {
  return (
    <div className="grid gap-4 py-3 border-b border-border last:border-0" style={{ gridTemplateColumns: `180px repeat(${values.length}, 1fr)` }}>
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        {icon}
        {label}
      </div>
      {values.map((val, i) => (
        <div key={i} className="text-sm font-medium text-center">
          {val}
        </div>
      ))}
    </div>
  );
}

export default function CollegeCompare() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [allColleges, setAllColleges] = React.useState<College[]>([]);
  const [selectedColleges, setSelectedColleges] = React.useState<College[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [showSelector, setShowSelector] = React.useState(false);

  // Load colleges on mount
  React.useEffect(() => {
    const loadColleges = async () => {
      try {
        const colleges = await fetchColleges();
        setAllColleges(colleges);
        
        // Check URL params for pre-selected colleges
        const ids = searchParams.get("ids")?.split(",").filter(Boolean) || [];
        if (ids.length > 0) {
          const selected = colleges.filter(c => ids.includes(c.id));
          setSelectedColleges(selected);
        }
      } catch (err) {
        console.error("Error loading colleges:", err);
      } finally {
        setLoading(false);
      }
    };
    loadColleges();
  }, []);

  // Update URL when selection changes
  React.useEffect(() => {
    if (selectedColleges.length > 0) {
      setSearchParams({ ids: selectedColleges.map(c => c.id).join(",") });
    } else {
      setSearchParams({});
    }
  }, [selectedColleges, setSearchParams]);

  const addCollege = (college: College) => {
    if (selectedColleges.length >= 3) return;
    if (selectedColleges.some(c => c.id === college.id)) return;
    setSelectedColleges([...selectedColleges, college]);
    setShowSelector(false);
    setSearchQuery("");
  };

  const removeCollege = (collegeId: string) => {
    setSelectedColleges(selectedColleges.filter(c => c.id !== collegeId));
  };

  const filteredColleges = React.useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return [];
    return allColleges
      .filter(c => 
        c.name.toLowerCase().includes(q) &&
        !selectedColleges.some(s => s.id === c.id)
      )
      .slice(0, 20);
  }, [searchQuery, allColleges, selectedColleges]);

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Loading colleges...
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-2xl">Compare Colleges</CardTitle>
              <p className="text-muted-foreground text-sm mt-1">
                Select up to 3 colleges to compare side-by-side
              </p>
            </div>
            <Button variant="outline" onClick={() => navigate("/colleges")}>
              ← Back to Matches
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {/* College selection header */}
          <div className="grid gap-4 mb-6" style={{ gridTemplateColumns: `180px repeat(3, 1fr)` }}>
            <div className="text-sm font-medium text-muted-foreground pt-2">
              Selected Colleges
            </div>
            
            {[0, 1, 2].map((slot) => {
              const college = selectedColleges[slot];
              
              if (college) {
                return (
                  <Card key={slot} className="relative">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      onClick={() => removeCollege(college.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                    <CardContent className="p-4 text-center">
                      <h3 className="font-semibold text-sm line-clamp-2">{college.name}</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {college.city}, {college.state}
                      </p>
                      <Badge variant="secondary" className="mt-2 text-xs">
                        {college.type || "College"}
                      </Badge>
                    </CardContent>
                  </Card>
                );
              }

              return (
                <div key={slot} className="relative">
                  {showSelector && slot === selectedColleges.length ? (
                    <Card className="p-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search colleges..."
                          className="pl-10"
                          autoFocus
                        />
                      </div>
                      {filteredColleges.length > 0 && (
                        <ScrollArea className="h-48 mt-2 rounded border">
                          <div className="p-2 space-y-1">
                            {filteredColleges.map((c) => (
                              <button
                                key={c.id}
                                onClick={() => addCollege(c)}
                                className="w-full text-left p-2 rounded hover:bg-accent text-sm"
                              >
                                <p className="font-medium">{c.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {c.city}, {c.state}
                                </p>
                              </button>
                            ))}
                          </div>
                        </ScrollArea>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2 w-full"
                        onClick={() => {
                          setShowSelector(false);
                          setSearchQuery("");
                        }}
                      >
                        Cancel
                      </Button>
                    </Card>
                  ) : (
                    <button
                      onClick={() => setShowSelector(true)}
                      className="w-full h-full min-h-[100px] border-2 border-dashed border-muted-foreground/25 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-primary hover:bg-accent/50 transition-colors"
                      disabled={selectedColleges.length >= 3}
                    >
                      <Plus className="h-6 w-6 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Add College</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Comparison table */}
          {selectedColleges.length >= 2 && (
            <div className="mt-8 border rounded-lg p-4">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Comparison
              </h3>

              <StatRow
                label="Type"
                icon={<Award className="h-4 w-4" />}
                values={selectedColleges.map(c => (
                  <Badge variant="outline">{c.type || "—"}</Badge>
                ))}
              />

              <StatRow
                label="Location"
                icon={<MapPin className="h-4 w-4" />}
                values={selectedColleges.map(c => `${c.city || "—"}, ${c.state || "—"}`)}
              />

              <StatRow
                label="Setting"
                values={selectedColleges.map(c => c.setting || "—")}
              />

              <StatRow
                label="Size"
                icon={<Users className="h-4 w-4" />}
                values={selectedColleges.map(c => c.size || "—")}
              />

              <StatRow
                label="Student Population"
                values={selectedColleges.map(c => 
                  c.student_population ? c.student_population.toLocaleString() : "—"
                )}
              />

              <StatRow
                label="Acceptance Rate"
                values={selectedColleges.map(c => formatPercent(c.acceptance_rate))}
              />

              <StatRow
                label="SAT Range"
                values={selectedColleges.map(c => 
                  c.sat_range_low && c.sat_range_high 
                    ? `${c.sat_range_low} - ${c.sat_range_high}`
                    : "—"
                )}
              />

              <StatRow
                label="ACT Range"
                values={selectedColleges.map(c => 
                  c.act_range_low && c.act_range_high 
                    ? `${c.act_range_low} - ${c.act_range_high}`
                    : "—"
                )}
              />

              <StatRow
                label="Avg GPA"
                values={selectedColleges.map(c => 
                  c.avg_gpa ? c.avg_gpa.toFixed(2) : "—"
                )}
              />

              <StatRow
                label="In-State Tuition"
                icon={<DollarSign className="h-4 w-4" />}
                values={selectedColleges.map(c => formatCurrency(c.tuition_in_state))}
              />

              <StatRow
                label="Out-of-State Tuition"
                values={selectedColleges.map(c => formatCurrency(c.tuition_out_state))}
              />

              <StatRow
                label="Avg Net Price"
                values={selectedColleges.map(c => formatCurrency(c.sticker_usd))}
              />

              <StatRow
                label="Avg Financial Aid"
                values={selectedColleges.map(c => formatCurrency(c.avg_financial_aid))}
              />

              <StatRow
                label="Graduation Rate"
                values={selectedColleges.map(c => formatPercent(c.graduation_rate))}
              />

              <StatRow
                label="Retention Rate"
                values={selectedColleges.map(c => formatPercent(c.retention_rate))}
              />

              <StatRow
                label="Student-Faculty Ratio"
                values={selectedColleges.map(c => formatRatio(c.student_faculty_ratio))}
              />

              <StatRow
                label="Athletics"
                values={selectedColleges.map(c => c.athletics_division || "—")}
              />

              <StatRow
                label="Website"
                values={selectedColleges.map(c => 
                  c.website_url ? (
                    <a 
                      href={c.website_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline inline-flex items-center gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Visit <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : "—"
                )}
              />
            </div>
          )}

          {selectedColleges.length < 2 && (
            <div className="text-center py-12 text-muted-foreground">
              <GraduationCap className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Select at least 2 colleges to compare</p>
              <p className="text-sm mt-1">
                Search and add colleges above to see a side-by-side comparison
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
