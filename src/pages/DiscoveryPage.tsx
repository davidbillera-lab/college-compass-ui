import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Search, 
  Filter, 
  GraduationCap, 
  Award, 
  MapPin, 
  DollarSign, 
  Trophy, 
  Target, 
  Loader2,
  ExternalLink,
  Plus,
  ChevronRight,
  X,
  SlidersHorizontal
} from 'lucide-react';
import { toast } from 'sonner';

import { fetchColleges, fetchCollegeMatches, fetchCollegeProfile, recalculateCollegeMatches } from '@/lib/collegeIntel/api';
import { fetchScholarships, recalculateMatches, addToPipeline, fetchPipelineStatuses } from '@/lib/scholarshipsIntel/api';
import { College, CollegeProfile, CollegeMatchResult } from '@/lib/collegeIntel/types';
import { Scholarship, MatchResult } from '@/lib/scholarshipsIntel/types';

type ViewMode = 'colleges' | 'scholarships';
type BucketFilter = 'all' | 'reach' | 'target' | 'safety' | 'unlikely';
type SortOption = 'score' | 'name' | 'deadline' | 'amount' | 'tuition';

const REGIONS = [
  { value: 'all', label: 'All Regions' },
  { value: 'Northeast', label: 'Northeast' },
  { value: 'Southeast', label: 'Southeast' },
  { value: 'Midwest', label: 'Midwest' },
  { value: 'Southwest', label: 'Southwest' },
  { value: 'West', label: 'West' },
];

const ATHLETICS_DIVISIONS = [
  { value: 'all', label: 'All Divisions' },
  { value: 'D1', label: 'Division I' },
  { value: 'D2', label: 'Division II' },
  { value: 'D3', label: 'Division III' },
  { value: 'NAIA', label: 'NAIA' },
  { value: 'none', label: 'No Athletics' },
];

const TUITION_RANGES = [
  { value: 'all', label: 'Any Tuition' },
  { value: '0-20000', label: 'Under $20k' },
  { value: '20000-40000', label: '$20k - $40k' },
  { value: '40000-60000', label: '$40k - $60k' },
  { value: '60000+', label: 'Over $60k' },
];

interface CollegeWithMatch extends College {
  match?: CollegeMatchResult;
}

export default function DiscoveryPage() {
  const { user } = useAuth();
  
  // Data state
  const [colleges, setColleges] = useState<College[]>([]);
  const [collegeMatches, setCollegeMatches] = useState<Map<string, CollegeMatchResult>>(new Map());
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [scholarshipMatches, setScholarshipMatches] = useState<Map<string, MatchResult>>(new Map());
  const [pipelineIds, setPipelineIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  
  // UI state
  const [viewMode, setViewMode] = useState<ViewMode>('colleges');
  const [searchQuery, setSearchQuery] = useState('');
  const [bucketFilter, setBucketFilter] = useState<BucketFilter>('all');
  const [regionFilter, setRegionFilter] = useState('all');
  const [athleticsFilter, setAthleticsFilter] = useState('all');
  const [tuitionFilter, setTuitionFilter] = useState('all');
  const [majorFilter, setMajorFilter] = useState('');
  const [minMatchScore, setMinMatchScore] = useState(0);
  const [sortBy, setSortBy] = useState<SortOption>('score');
  const [showFilters, setShowFilters] = useState(false);
  
  // Detail panel
  const [selectedCollege, setSelectedCollege] = useState<CollegeWithMatch | null>(null);
  const [selectedScholarship, setSelectedScholarship] = useState<Scholarship | null>(null);

  // Load data
  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    
    try {
      const [collegeData, scholarshipData] = await Promise.all([
        fetchColleges(),
        fetchScholarships(),
      ]);
      
      setColleges(collegeData);
      setScholarships(scholarshipData);
      
      // Load matches in parallel
      const [collegeMatchData, scholarshipMatchData, pipeIds] = await Promise.all([
        recalculateCollegeMatches(user.id),
        recalculateMatches(user.id),
        fetchPipelineStatuses(user.id, scholarshipData.map(s => s.id)),
      ]);
      
      setCollegeMatches(collegeMatchData);
      setScholarshipMatches(scholarshipMatchData);
      setPipelineIds(pipeIds);
    } catch (err) {
      console.error('Failed to load discovery data:', err);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Extract unique majors from colleges
  const availableMajors = useMemo(() => {
    const majors = new Set<string>();
    colleges.forEach(c => {
      if (c.notable_programs) {
        c.notable_programs.forEach(p => majors.add(p));
      }
    });
    return Array.from(majors).sort();
  }, [colleges]);

  // Filter and sort colleges
  const filteredColleges = useMemo(() => {
    return colleges
      .map(c => ({ ...c, match: collegeMatches.get(c.id) }))
      .filter(c => {
        // Search
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          const nameMatch = c.name.toLowerCase().includes(q);
          const cityMatch = c.city?.toLowerCase().includes(q);
          const stateMatch = c.state?.toLowerCase().includes(q);
          if (!nameMatch && !cityMatch && !stateMatch) return false;
        }
        
        // Bucket filter
        if (bucketFilter !== 'all') {
          if (!c.match || c.match.bucket !== bucketFilter) return false;
        }
        
        // Region filter
        if (regionFilter !== 'all' && c.region !== regionFilter) return false;
        
        // Athletics filter
        if (athleticsFilter !== 'all') {
          if (athleticsFilter === 'none' && c.athletics_division) return false;
          if (athleticsFilter !== 'none' && c.athletics_division !== athleticsFilter) return false;
        }
        
        // Tuition filter
        if (tuitionFilter !== 'all') {
          const tuition = c.tuition_out_state || c.sticker_usd || 0;
          if (tuitionFilter === '0-20000' && tuition > 20000) return false;
          if (tuitionFilter === '20000-40000' && (tuition < 20000 || tuition > 40000)) return false;
          if (tuitionFilter === '40000-60000' && (tuition < 40000 || tuition > 60000)) return false;
          if (tuitionFilter === '60000+' && tuition < 60000) return false;
        }
        
        // Major filter
        if (majorFilter && !c.notable_programs?.some(p => p.toLowerCase().includes(majorFilter.toLowerCase()))) {
          return false;
        }
        
        // Min match score
        if (minMatchScore > 0 && (!c.match || c.match.score < minMatchScore)) return false;
        
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'score') {
          return (b.match?.score || 0) - (a.match?.score || 0);
        }
        if (sortBy === 'name') {
          return a.name.localeCompare(b.name);
        }
        if (sortBy === 'tuition') {
          const ta = a.tuition_out_state || a.sticker_usd || 0;
          const tb = b.tuition_out_state || b.sticker_usd || 0;
          return ta - tb;
        }
        return 0;
      });
  }, [colleges, collegeMatches, searchQuery, bucketFilter, regionFilter, athleticsFilter, tuitionFilter, majorFilter, minMatchScore, sortBy]);

  // Filter and sort scholarships
  const filteredScholarships = useMemo(() => {
    return scholarships
      .filter(s => {
        // Search
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          if (!s.name.toLowerCase().includes(q) && !s.provider?.toLowerCase().includes(q)) {
            return false;
          }
        }
        
        // Bucket filter (eligibility status)
        if (bucketFilter !== 'all') {
          const match = scholarshipMatches.get(s.id);
          if (bucketFilter === 'target' && match?.eligibility_status !== 'eligible') return false;
          if (bucketFilter === 'reach' && match?.eligibility_status !== 'maybe') return false;
          if (bucketFilter === 'safety' && match?.eligibility_status === 'ineligible') return false;
        }
        
        // Min match score
        if (minMatchScore > 0) {
          const match = scholarshipMatches.get(s.id);
          if (!match || match.score < minMatchScore) return false;
        }
        
        return true;
      })
      .sort((a, b) => {
        const ma = scholarshipMatches.get(a.id);
        const mb = scholarshipMatches.get(b.id);
        
        if (sortBy === 'score') {
          return (mb?.score || 0) - (ma?.score || 0);
        }
        if (sortBy === 'name') {
          return a.name.localeCompare(b.name);
        }
        if (sortBy === 'deadline') {
          const da = a.deadline_date || a.deadline || '9999';
          const db = b.deadline_date || b.deadline || '9999';
          return da.toString().localeCompare(db.toString());
        }
        if (sortBy === 'amount') {
          return (b.amount_max_usd || b.amount_usd || 0) - (a.amount_max_usd || a.amount_usd || 0);
        }
        return 0;
      });
  }, [scholarships, scholarshipMatches, searchQuery, bucketFilter, minMatchScore, sortBy]);

  // Bucket counts
  const collegeBuckets = useMemo(() => {
    const counts = { reach: 0, target: 0, safety: 0, unlikely: 0 };
    colleges.forEach(c => {
      const match = collegeMatches.get(c.id);
      if (match?.bucket && match.bucket in counts) {
        counts[match.bucket as keyof typeof counts]++;
      }
    });
    return counts;
  }, [colleges, collegeMatches]);

  const scholarshipBuckets = useMemo(() => {
    let eligible = 0, maybe = 0, ineligible = 0;
    scholarships.forEach(s => {
      const match = scholarshipMatches.get(s.id);
      if (match?.eligibility_status === 'eligible') eligible++;
      else if (match?.eligibility_status === 'maybe') maybe++;
      else ineligible++;
    });
    return { eligible, maybe, ineligible };
  }, [scholarships, scholarshipMatches]);

  const handleAddToPipeline = async (scholarshipId: string) => {
    if (!user) return;
    try {
      await addToPipeline(user.id, scholarshipId);
      setPipelineIds(prev => new Set([...prev, scholarshipId]));
      toast.success('Added to pipeline!');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to add');
    }
  };

  const formatCurrency = (n?: number | null) => {
    if (!n) return '—';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
  };

  const getBucketBadgeVariant = (bucket: string) => {
    switch (bucket) {
      case 'safety': return 'default';
      case 'target': return 'secondary';
      case 'reach': return 'outline';
      case 'unlikely': return 'destructive';
      default: return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Discovery</h1>
          <p className="text-muted-foreground text-sm">Find your best-fit colleges and scholarships</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
            <TabsList>
              <TabsTrigger value="colleges" className="gap-2">
                <GraduationCap className="h-4 w-4" />
                <span className="hidden sm:inline">Colleges</span>
                <Badge variant="secondary" className="ml-1">{colleges.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="scholarships" className="gap-2">
                <Award className="h-4 w-4" />
                <span className="hidden sm:inline">Scholarships</span>
                <Badge variant="secondary" className="ml-1">{scholarships.length}</Badge>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Search and filters bar */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={viewMode === 'colleges' ? 'Search colleges by name, city, or state...' : 'Search scholarships...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Quick filters */}
            <div className="flex flex-wrap gap-2">
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="score">Best Match</SelectItem>
                  <SelectItem value="name">Name A-Z</SelectItem>
                  {viewMode === 'colleges' && <SelectItem value="tuition">Tuition (Low-High)</SelectItem>}
                  {viewMode === 'scholarships' && <SelectItem value="deadline">Deadline</SelectItem>}
                  {viewMode === 'scholarships' && <SelectItem value="amount">Amount</SelectItem>}
                </SelectContent>
              </Select>
              
              <Button
                variant="outline"
                onClick={() => setShowFilters(true)}
                className="gap-2"
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filters
              </Button>
            </div>
          </div>
          
          {/* Bucket filter chips */}
          <div className="flex flex-wrap gap-2 mt-4">
            <Button
              size="sm"
              variant={bucketFilter === 'all' ? 'default' : 'outline'}
              onClick={() => setBucketFilter('all')}
            >
              All
            </Button>
            {viewMode === 'colleges' ? (
              <>
                <Button
                  size="sm"
                  variant={bucketFilter === 'safety' ? 'default' : 'outline'}
                  onClick={() => setBucketFilter('safety')}
                  className="gap-1"
                >
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  Safety ({collegeBuckets.safety})
                </Button>
                <Button
                  size="sm"
                  variant={bucketFilter === 'target' ? 'default' : 'outline'}
                  onClick={() => setBucketFilter('target')}
                  className="gap-1"
                >
                  <span className="w-2 h-2 rounded-full bg-yellow-500" />
                  Target ({collegeBuckets.target})
                </Button>
                <Button
                  size="sm"
                  variant={bucketFilter === 'reach' ? 'default' : 'outline'}
                  onClick={() => setBucketFilter('reach')}
                  className="gap-1"
                >
                  <span className="w-2 h-2 rounded-full bg-orange-500" />
                  Reach ({collegeBuckets.reach})
                </Button>
              </>
            ) : (
              <>
                <Button
                  size="sm"
                  variant={bucketFilter === 'target' ? 'default' : 'outline'}
                  onClick={() => setBucketFilter('target')}
                  className="gap-1"
                >
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  Eligible ({scholarshipBuckets.eligible})
                </Button>
                <Button
                  size="sm"
                  variant={bucketFilter === 'reach' ? 'default' : 'outline'}
                  onClick={() => setBucketFilter('reach')}
                  className="gap-1"
                >
                  <span className="w-2 h-2 rounded-full bg-yellow-500" />
                  Maybe ({scholarshipBuckets.maybe})
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {viewMode === 'colleges' ? (
          filteredColleges.length === 0 ? (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              <GraduationCap className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No colleges match your filters</p>
            </div>
          ) : (
            filteredColleges.map(college => (
              <Card 
                key={college.id} 
                className="cursor-pointer hover:shadow-card transition-all hover-lift"
                onClick={() => setSelectedCollege(college)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{college.name}</h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {college.city}, {college.state}
                      </p>
                    </div>
                    {college.match && (
                      <Badge variant={getBucketBadgeVariant(college.match.bucket)} className="capitalize">
                        {college.match.bucket}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm mt-3">
                    <div>
                      <p className="text-muted-foreground text-xs">Match Score</p>
                      <p className="font-semibold text-primary">{college.match?.score || 0}%</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Tuition</p>
                      <p className="font-medium">{formatCurrency(college.tuition_out_state || college.sticker_usd)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Accept Rate</p>
                      <p className="font-medium">{college.acceptance_rate ? `${(college.acceptance_rate * 100).toFixed(0)}%` : '—'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Athletics</p>
                      <p className="font-medium">{college.athletics_division || '—'}</p>
                    </div>
                  </div>
                  
                  {college.notable_programs && college.notable_programs.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {college.notable_programs.slice(0, 3).map((prog, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {prog}
                        </Badge>
                      ))}
                      {college.notable_programs.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{college.notable_programs.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )
        ) : (
          filteredScholarships.length === 0 ? (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              <Award className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No scholarships match your filters</p>
            </div>
          ) : (
            filteredScholarships.map(scholarship => {
              const match = scholarshipMatches.get(scholarship.id);
              return (
                <Card 
                  key={scholarship.id} 
                  className="cursor-pointer hover:shadow-card transition-all hover-lift"
                  onClick={() => setSelectedScholarship(scholarship)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{scholarship.name}</h3>
                        {scholarship.provider && (
                          <p className="text-sm text-muted-foreground truncate">{scholarship.provider}</p>
                        )}
                      </div>
                      <Badge variant={match?.eligibility_status === 'eligible' ? 'default' : match?.eligibility_status === 'maybe' ? 'secondary' : 'destructive'}>
                        {match?.score || 0}%
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm mt-3">
                      <div>
                        <p className="text-muted-foreground text-xs">Amount</p>
                        <p className="font-semibold text-primary">
                          {scholarship.amount_max_usd 
                            ? `${formatCurrency(scholarship.amount_min_usd)} - ${formatCurrency(scholarship.amount_max_usd)}`
                            : formatCurrency(scholarship.amount_usd)}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Deadline</p>
                        <p className="font-medium">
                          {scholarship.rolling_deadline 
                            ? 'Rolling' 
                            : scholarship.deadline_date 
                              ? new Date(scholarship.deadline_date).toLocaleDateString()
                              : '—'}
                        </p>
                      </div>
                    </div>
                    
                    {match?.reasons && match.reasons.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-3 line-clamp-2">
                        {match.reasons[0]}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between mt-3">
                      {pipelineIds.has(scholarship.id) ? (
                        <Badge variant="outline">In Pipeline</Badge>
                      ) : (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={(e) => { e.stopPropagation(); handleAddToPipeline(scholarship.id); }}
                        >
                          <Plus className="h-4 w-4 mr-1" /> Add
                        </Button>
                      )}
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )
        )}
      </div>

      {/* Filters Sheet */}
      <Sheet open={showFilters} onOpenChange={setShowFilters}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Filters</SheetTitle>
          </SheetHeader>
          
          <ScrollArea className="h-[calc(100vh-100px)] pr-4">
            <div className="space-y-6 py-4">
              {/* Match Score Filter */}
              <div className="space-y-2">
                <Label>Minimum Match Score: {minMatchScore}%</Label>
                <Slider
                  value={[minMatchScore]}
                  onValueChange={([v]) => setMinMatchScore(v)}
                  max={100}
                  step={5}
                />
              </div>
              
              {viewMode === 'colleges' && (
                <>
                  <Separator />
                  
                  {/* Region */}
                  <div className="space-y-2">
                    <Label>Region</Label>
                    <Select value={regionFilter} onValueChange={setRegionFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {REGIONS.map(r => (
                          <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Athletics */}
                  <div className="space-y-2">
                    <Label>Athletics Division</Label>
                    <Select value={athleticsFilter} onValueChange={setAthleticsFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ATHLETICS_DIVISIONS.map(d => (
                          <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Tuition */}
                  <div className="space-y-2">
                    <Label>Tuition Range</Label>
                    <Select value={tuitionFilter} onValueChange={setTuitionFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TUITION_RANGES.map(t => (
                          <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Major */}
                  <div className="space-y-2">
                    <Label>Major / Program</Label>
                    <Input
                      placeholder="Search programs..."
                      value={majorFilter}
                      onChange={(e) => setMajorFilter(e.target.value)}
                    />
                  </div>
                </>
              )}
              
              <Separator />
              
              {/* Clear filters */}
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setSearchQuery('');
                  setBucketFilter('all');
                  setRegionFilter('all');
                  setAthleticsFilter('all');
                  setTuitionFilter('all');
                  setMajorFilter('');
                  setMinMatchScore(0);
                }}
              >
                Clear All Filters
              </Button>
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* College Detail Sheet */}
      <Sheet open={!!selectedCollege} onOpenChange={(open) => !open && setSelectedCollege(null)}>
        <SheetContent className="w-full sm:max-w-lg">
          {selectedCollege && (
            <>
              <SheetHeader>
                <SheetTitle>{selectedCollege.name}</SheetTitle>
              </SheetHeader>
              
              <ScrollArea className="h-[calc(100vh-100px)] pr-4">
                <div className="space-y-6 py-4">
                  {/* Match info */}
                  {selectedCollege.match && (
                    <Card className="bg-primary/5 border-primary/20">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Your Match</span>
                          <Badge variant={getBucketBadgeVariant(selectedCollege.match.bucket)} className="capitalize">
                            {selectedCollege.match.bucket}
                          </Badge>
                        </div>
                        <p className="text-3xl font-bold text-primary">{selectedCollege.match.score}%</p>
                        {selectedCollege.match.reasons && selectedCollege.match.reasons.length > 0 && (
                          <p className="text-sm text-muted-foreground mt-2">{selectedCollege.match.reasons[0]}</p>
                        )}
                      </CardContent>
                    </Card>
                  )}
                  
                  {/* Location */}
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <MapPin className="h-4 w-4" /> Location
                    </h4>
                    <p className="text-muted-foreground">
                      {selectedCollege.city}, {selectedCollege.state}
                      {selectedCollege.region && ` • ${selectedCollege.region}`}
                    </p>
                    {selectedCollege.setting && (
                      <p className="text-sm text-muted-foreground capitalize">{selectedCollege.setting} campus</p>
                    )}
                  </div>
                  
                  <Separator />
                  
                  {/* Academics */}
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <GraduationCap className="h-4 w-4" /> Academics
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Acceptance Rate</p>
                        <p className="font-medium">{selectedCollege.acceptance_rate ? `${(selectedCollege.acceptance_rate * 100).toFixed(0)}%` : '—'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Avg GPA</p>
                        <p className="font-medium">{selectedCollege.avg_gpa?.toFixed(2) || '—'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">SAT Range</p>
                        <p className="font-medium">
                          {selectedCollege.sat_range_low && selectedCollege.sat_range_high 
                            ? `${selectedCollege.sat_range_low} - ${selectedCollege.sat_range_high}`
                            : '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">ACT Range</p>
                        <p className="font-medium">
                          {selectedCollege.act_range_low && selectedCollege.act_range_high 
                            ? `${selectedCollege.act_range_low} - ${selectedCollege.act_range_high}`
                            : '—'}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  {/* Cost */}
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <DollarSign className="h-4 w-4" /> Cost
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">In-State Tuition</p>
                        <p className="font-medium">{formatCurrency(selectedCollege.tuition_in_state)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Out-of-State Tuition</p>
                        <p className="font-medium">{formatCurrency(selectedCollege.tuition_out_state)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Avg Financial Aid</p>
                        <p className="font-medium">{formatCurrency(selectedCollege.avg_financial_aid)}</p>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  {/* Athletics */}
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Trophy className="h-4 w-4" /> Athletics
                    </h4>
                    <p className="text-sm">
                      {selectedCollege.athletics_division 
                        ? `Division: ${selectedCollege.athletics_division}`
                        : 'No athletics division listed'}
                    </p>
                    {selectedCollege.sports && selectedCollege.sports.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {selectedCollege.sports.map((sport, i) => (
                          <Badge key={i} variant="outline" className="text-xs">{sport}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Programs */}
                  {selectedCollege.notable_programs && selectedCollege.notable_programs.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="font-medium mb-2">Notable Programs</h4>
                        <div className="flex flex-wrap gap-1">
                          {selectedCollege.notable_programs.map((prog, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">{prog}</Badge>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                  
                  {/* Actions */}
                  <div className="flex gap-2 pt-4">
                    {selectedCollege.website_url && (
                      <Button className="flex-1" onClick={() => window.open(selectedCollege.website_url!, '_blank')}>
                        <ExternalLink className="h-4 w-4 mr-2" /> Visit Website
                      </Button>
                    )}
                  </div>
                </div>
              </ScrollArea>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Scholarship Detail Sheet */}
      <Sheet open={!!selectedScholarship} onOpenChange={(open) => !open && setSelectedScholarship(null)}>
        <SheetContent className="w-full sm:max-w-lg">
          {selectedScholarship && (
            <>
              <SheetHeader>
                <SheetTitle>{selectedScholarship.name}</SheetTitle>
              </SheetHeader>
              
              <ScrollArea className="h-[calc(100vh-100px)] pr-4">
                <div className="space-y-6 py-4">
                  {selectedScholarship.provider && (
                    <p className="text-muted-foreground">By {selectedScholarship.provider}</p>
                  )}
                  
                  {/* Match info */}
                  {scholarshipMatches.get(selectedScholarship.id) && (
                    <Card className="bg-primary/5 border-primary/20">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Your Match</span>
                          <Badge variant={
                            scholarshipMatches.get(selectedScholarship.id)?.eligibility_status === 'eligible' 
                              ? 'default' 
                              : 'secondary'
                          }>
                            {scholarshipMatches.get(selectedScholarship.id)?.eligibility_status}
                          </Badge>
                        </div>
                        <p className="text-3xl font-bold text-primary">
                          {scholarshipMatches.get(selectedScholarship.id)?.score}%
                        </p>
                        {scholarshipMatches.get(selectedScholarship.id)?.reasons.map((r, i) => (
                          <p key={i} className="text-sm text-muted-foreground mt-2">{r}</p>
                        ))}
                      </CardContent>
                    </Card>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Amount</p>
                      <p className="font-semibold">
                        {selectedScholarship.amount_max_usd 
                          ? `${formatCurrency(selectedScholarship.amount_min_usd)} - ${formatCurrency(selectedScholarship.amount_max_usd)}`
                          : formatCurrency(selectedScholarship.amount_usd) || 'Varies'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Deadline</p>
                      <p className="font-semibold">
                        {selectedScholarship.rolling_deadline 
                          ? 'Rolling' 
                          : selectedScholarship.deadline_date 
                            ? new Date(selectedScholarship.deadline_date).toLocaleDateString()
                            : 'Not specified'}
                      </p>
                    </div>
                  </div>
                  
                  {selectedScholarship.description && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="font-medium mb-2">Description</h4>
                        <p className="text-sm text-muted-foreground">{selectedScholarship.description}</p>
                      </div>
                    </>
                  )}
                  
                  {selectedScholarship.raw_eligibility_text && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="font-medium mb-2">Eligibility</h4>
                        <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                          {selectedScholarship.raw_eligibility_text.substring(0, 500)}
                          {selectedScholarship.raw_eligibility_text.length > 500 && '...'}
                        </p>
                      </div>
                    </>
                  )}
                  
                  {/* Actions */}
                  <div className="flex gap-2 pt-4">
                    {selectedScholarship.url && (
                      <Button variant="outline" onClick={() => window.open(selectedScholarship.url!, '_blank')}>
                        <ExternalLink className="h-4 w-4 mr-2" /> Visit Site
                      </Button>
                    )}
                    {!pipelineIds.has(selectedScholarship.id) && (
                      <Button onClick={() => handleAddToPipeline(selectedScholarship.id)}>
                        <Plus className="h-4 w-4 mr-2" /> Add to Pipeline
                      </Button>
                    )}
                  </div>
                </div>
              </ScrollArea>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
