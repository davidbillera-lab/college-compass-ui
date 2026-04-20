import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchColleges } from "@/lib/collegeIntel/api";
import { College } from "@/lib/collegeIntel/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CollegeLibraryDrawer } from "@/components/CollegeLibraryDrawer";
import { AIMatchScoreBadge } from "@/components/scholarships/AIMatchScoreBadge";
import { useAIMatchScores } from "@/hooks/useAIMatchScores";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { toast } from "sonner";
import {
  Search,
  MapPin,
  Users,
  DollarSign,
  GraduationCap,
  Building2,
  Filter,
  Library,
  Loader2,
  ExternalLink,
  Sparkles,
  Crown,
} from "lucide-react";

const US_REGIONS = ["All", "Northeast", "Southeast", "Midwest", "Southwest", "West"];
const INSTITUTION_TYPES = ["All", "Public", "Private", "Community College", "Trade School"];
const SIZE_OPTIONS = ["All", "Small", "Medium", "Large"];

export default function CollegeLibraryPage() {
  const [search, setSearch] = useState("");
  const [regionFilter, setRegionFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [sizeFilter, setSizeFilter] = useState("All");
  const [stateFilter, setStateFilter] = useState("All");
  const [sortBy, setSortBy] = useState("name");
  const [likelyAdmitsOnly, setLikelyAdmitsOnly] = useState(false);
  const [selectedCollege, setSelectedCollege] = useState<College | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { loading: aiLoading, calculateCollegeScores, getScore } = useAIMatchScores();
  const { hasAccess, openCheckout } = useSubscription();

  const { data: colleges = [], isLoading } = useQuery({
    queryKey: ["colleges-library"],
    queryFn: fetchColleges,
  });

  // Get unique states from colleges
  const availableStates = useMemo(() => {
    const states = new Set<string>();
    colleges.forEach((c) => {
      if (c.state) states.add(c.state);
    });
    return ["All", ...Array.from(states).sort()];
  }, [colleges]);

  // Filter and sort colleges
  const filteredColleges = useMemo(() => {
    let result = colleges.filter((college) => {
      const matchesSearch =
        search === "" ||
        college.name.toLowerCase().includes(search.toLowerCase()) ||
        college.city?.toLowerCase().includes(search.toLowerCase()) ||
        college.state?.toLowerCase().includes(search.toLowerCase());

      const matchesRegion = regionFilter === "All" || college.region === regionFilter;
      const matchesType = typeFilter === "All" || college.type === typeFilter;
      const matchesSize = sizeFilter === "All" || college.size === sizeFilter;
      const matchesState = stateFilter === "All" || college.state === stateFilter;
      
      // Filter by likely admits (AI score > 50%)
      const matchesLikelyAdmits = !likelyAdmitsOnly || (getScore(college.id)?.overall_score ?? 0) > 50;

      return matchesSearch && matchesRegion && matchesType && matchesSize && matchesState && matchesLikelyAdmits;
    });

    // Sort colleges
    if (sortBy === "score") {
      result = result.sort((a, b) => {
        const scoreA = getScore(a.id)?.overall_score ?? 0;
        const scoreB = getScore(b.id)?.overall_score ?? 0;
        return scoreB - scoreA; // Highest score first
      });
    } else if (sortBy === "name") {
      result = result.sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [colleges, search, regionFilter, typeFilter, sizeFilter, stateFilter, likelyAdmitsOnly, sortBy, getScore]);

  // Stats
  const stats = useMemo(() => {
    const typeCount: Record<string, number> = {};
    colleges.forEach((c) => {
      const type = c.type || "Unknown";
      typeCount[type] = (typeCount[type] || 0) + 1;
    });
    return {
      total: colleges.length,
      public: typeCount["Public"] || 0,
      private: typeCount["Private"] || 0,
      community: typeCount["Community College"] || 0,
      trade: typeCount["Trade School"] || 0,
    };
  }, [colleges]);

  const handleCollegeClick = (college: College) => {
    setSelectedCollege(college);
    setDrawerOpen(true);
  };

  const clearFilters = () => {
    setSearch("");
    setRegionFilter("All");
    setTypeFilter("All");
    setSizeFilter("All");
    setStateFilter("All");
  };

  // Function to calculate AI scores for visible colleges (premium only)
  const calculateVisibleScores = () => {
    if (!hasAccess) {
      toast.info("AI Admission Odds is a Premium feature", {
        action: {
          label: "Upgrade",
          onClick: openCheckout,
        },
      });
      return;
    }
    if (filteredColleges.length === 0) return;
    const ids = filteredColleges.map((c) => c.id);
    calculateCollegeScores(ids);
  };

  // Handle individual college score calculation (premium only)
  const handleCalculateScore = (collegeId: string) => {
    if (!hasAccess) {
      toast.info("AI Admission Odds is a Premium feature", {
        action: {
          label: "Upgrade",
          onClick: openCheckout,
        },
      });
      return;
    }
    calculateCollegeScores([collegeId]);
  };

  const hasActiveFilters =
    search !== "" ||
    regionFilter !== "All" ||
    typeFilter !== "All" ||
    sizeFilter !== "All" ||
    stateFilter !== "All";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Library className="h-7 w-7 text-primary" />
            College Library
          </h1>
          <p className="text-muted-foreground mt-1">
            Browse all US colleges, universities, and trade schools
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-card/50">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-foreground">{stats.total.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Total Institutions</div>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.public.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Public</div>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.private.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Private</div>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.community.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Community Colleges</div>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.trade.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Trade Schools</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, city, or state..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filter row */}
            <div className="flex flex-wrap gap-3 items-center">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Filters:</span>
              </div>

              <Select value={regionFilter} onValueChange={setRegionFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Region" />
                </SelectTrigger>
                <SelectContent>
                  {US_REGIONS.map((region) => (
                    <SelectItem key={region} value={region}>
                      {region}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={stateFilter} onValueChange={setStateFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="State" />
                </SelectTrigger>
                <SelectContent>
                  {availableStates.map((state) => (
                    <SelectItem key={state} value={state}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  {INSTITUTION_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sizeFilter} onValueChange={setSizeFilter}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Size" />
                </SelectTrigger>
                <SelectContent>
                  {SIZE_OPTIONS.map((size) => (
                    <SelectItem key={size} value={size}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name (A–Z)</SelectItem>
                  <SelectItem value="score">AI Odds (Highest)</SelectItem>
                </SelectContent>
              </Select>

              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Clear all
                </Button>
              )}
            </div>

            {/* Likely admits filter */}
            <div className="flex items-center gap-3 px-1">
              <Switch
                id="likely-admits"
                checked={likelyAdmitsOnly}
                onCheckedChange={setLikelyAdmitsOnly}
              />
              <label htmlFor="likely-admits" className="text-sm text-muted-foreground cursor-pointer">
                Show only likely admits (score &gt; 50%)
              </label>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">
                  Showing {filteredColleges.length.toLocaleString()} of {colleges.length.toLocaleString()} institutions
                </span>
                {!isLoading && filteredColleges.length > 0 && (
                  <Button
                    variant={hasAccess ? "outline" : "default"}
                    size="sm"
                    onClick={calculateVisibleScores}
                    disabled={aiLoading}
                    className="gap-1"
                  >
                    {aiLoading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : hasAccess ? (
                      <Sparkles className="h-3.5 w-3.5 text-primary" />
                    ) : (
                      <Crown className="h-3.5 w-3.5" />
                    )}
                    {aiLoading ? "Calculating..." : hasAccess ? "Get AI Admission Odds" : "Upgrade for AI Odds"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* College List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredColleges.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No institutions found</h3>
            <p className="text-muted-foreground">
              {colleges.length === 0
                ? "The college database is empty. Data needs to be ingested."
                : "Try adjusting your filters or search term."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredColleges.map((college) => (
            <Card
              key={college.id}
              className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:border-primary/50"
              onClick={() => handleCollegeClick(college)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {/* Logo placeholder */}
                  <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    {college.logo_url ? (
                      <img
                        src={college.logo_url}
                        alt={college.name}
                        className="w-10 h-10 object-contain"
                      />
                    ) : (
                      <Building2 className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">{college.name}</h3>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
                      <MapPin className="h-3 w-3" />
                      <span className="truncate">
                        {college.city}, {college.state}
                      </span>
                    </div>
                  </div>
                </div>

                {/* AI Match Score - Premium feature */}
                <div onClick={(e) => e.stopPropagation()}>
                  <AIMatchScoreBadge
                    score={hasAccess ? getScore(college.id) : undefined}
                    loading={aiLoading}
                    onCalculate={() => handleCalculateScore(college.id)}
                    compact
                    locked={!hasAccess}
                  />
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {college.type && (
                    <Badge variant="outline" className="text-xs">
                      {college.type}
                    </Badge>
                  )}
                  {college.size && (
                    <Badge variant="secondary" className="text-xs">
                      {college.size}
                    </Badge>
                  )}
                  {college.athletics_division && (
                    <Badge variant="info" className="text-xs">
                      {college.athletics_division}
                    </Badge>
                  )}
                </div>

                {/* Quick stats */}
                <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                  {college.student_population && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Users className="h-3 w-3" />
                      <span>{college.student_population.toLocaleString()} students</span>
                    </div>
                  )}
                  {college.tuition_in_state && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <DollarSign className="h-3 w-3" />
                      <span>${college.tuition_in_state.toLocaleString()}/yr</span>
                    </div>
                  )}
                  {college.acceptance_rate && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <GraduationCap className="h-3 w-3" />
                      <span>{college.acceptance_rate}% acceptance</span>
                    </div>
                  )}
                  {college.website_url && (
                    <a
                      href={college.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-primary hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="h-3 w-3" />
                      <span>Website</span>
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* College Details Drawer */}
      <CollegeLibraryDrawer
        college={selectedCollege}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />
    </div>
  );
}
