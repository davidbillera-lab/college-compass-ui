import { useMemo, useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addScholarshipToPipeline,
  fetchScholarshipDirectory,
  type ScholarshipDirectoryFilters,
  type ScholarshipDirectoryRow,
} from "@/lib/scholarships/directoryApi";
import DirectoryDetailDrawer from "@/components/scholarships/DirectoryDetailDrawer";
import { AIMatchScoreBadge } from "@/components/scholarships/AIMatchScoreBadge";
import { useAIMatchScores } from "@/hooks/useAIMatchScores";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Search, DollarSign, Calendar, MapPin, ExternalLink, Plus, Loader2, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { toast } from "sonner";

const PAGE_SIZE = 12;

function formatMoney(min?: number | null, max?: number | null) {
  const fmt = (n: number) => `$${n.toLocaleString()}`;
  if (min && max && min !== max) return `${fmt(min)}–${fmt(max)}`;
  if (max) return fmt(max);
  if (min) return fmt(min);
  return "—";
}

function DeadlineBadge({ rolling, deadline }: { rolling: boolean | null; deadline: string | null }) {
  if (rolling) return <Badge variant="secondary">Rolling</Badge>;
  if (deadline) {
    const d = new Date(deadline);
    const now = new Date();
    const daysLeft = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysLeft < 0) return <Badge variant="destructive">Past</Badge>;
    if (daysLeft <= 14) return <Badge variant="destructive">Due in {daysLeft}d</Badge>;
    if (daysLeft <= 30) return <Badge variant="outline" className="border-amber-500 text-amber-600">Due in {daysLeft}d</Badge>;
    return <Badge variant="outline">Due {deadline}</Badge>;
  }
  return <Badge variant="outline">No deadline</Badge>;
}

export default function DirectoryView() {
  const qc = useQueryClient();
  const { scores, loading: aiLoading, calculateScholarshipScores, getScore } = useAIMatchScores();

  const [filters, setFilters] = useState<ScholarshipDirectoryFilters>({
    q: "",
    deadline: "any",
    minAmount: "any",
    scope: "any",
    status: "active",
    sort: "deadline",
    page: 1,
    pageSize: PAGE_SIZE,
  });

  const queryKey = useMemo(() => ["scholarship-directory", filters], [filters]);

  const { data, isLoading, error } = useQuery({
    queryKey,
    queryFn: () => fetchScholarshipDirectory(filters),
  });

  const addMut = useMutation({
    mutationFn: (id: string) => addScholarshipToPipeline(id),
    onSuccess: () => {
      toast.success("Added to pipeline!");
      qc.invalidateQueries({ queryKey: ["pipeline"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to add to pipeline");
    },
  });

  const [selected, setSelected] = useState<ScholarshipDirectoryRow | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const rows = data?.data ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const currentPage = filters.page;

  const openDetail = (s: ScholarshipDirectoryRow) => {
    setSelected(s);
    setDrawerOpen(true);
  };

  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setFilters((f) => ({ ...f, page }));
  };

  // Function to calculate AI scores for visible scholarships
  const calculateVisibleScores = () => {
    if (rows.length === 0) return;
    const ids = rows.map((s) => s.id);
    calculateScholarshipScores(ids);
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="grid gap-3 md:grid-cols-6">
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search name, provider, major..."
            value={filters.q}
            onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value, page: 1 }))}
            className="pl-9"
          />
        </div>

        <Select
          value={filters.deadline}
          onValueChange={(v) => setFilters((f) => ({ ...f, deadline: v as ScholarshipDirectoryFilters["deadline"], page: 1 }))}
        >
          <SelectTrigger>
            <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Deadline" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any deadline</SelectItem>
            <SelectItem value="next30">Next 30 days</SelectItem>
            <SelectItem value="next60">Next 60 days</SelectItem>
            <SelectItem value="rolling">Rolling only</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.minAmount}
          onValueChange={(v) => setFilters((f) => ({ ...f, minAmount: v as ScholarshipDirectoryFilters["minAmount"], page: 1 }))}
        >
          <SelectTrigger>
            <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Min amount" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any amount</SelectItem>
            <SelectItem value="500">$500+</SelectItem>
            <SelectItem value="1000">$1,000+</SelectItem>
            <SelectItem value="5000">$5,000+</SelectItem>
            <SelectItem value="10000">$10,000+</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.scope}
          onValueChange={(v) => setFilters((f) => ({ ...f, scope: v as ScholarshipDirectoryFilters["scope"], page: 1 }))}
        >
          <SelectTrigger>
            <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Scope" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any scope</SelectItem>
            <SelectItem value="national">National</SelectItem>
            <SelectItem value="state">State</SelectItem>
            <SelectItem value="local">Local</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.sort}
          onValueChange={(v) => setFilters((f) => ({ ...f, sort: v as ScholarshipDirectoryFilters["sort"], page: 1 }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="deadline">Deadline (soonest)</SelectItem>
            <SelectItem value="amount">Amount (highest)</SelectItem>
            <SelectItem value="name">Name (A–Z)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results count and AI scoring */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>
            {isLoading ? "Loading…" : `${totalCount.toLocaleString()} scholarships`}
          </span>
          {!isLoading && rows.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={calculateVisibleScores}
              disabled={aiLoading}
              className="gap-1"
            >
              {aiLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5 text-primary" />
              )}
              {aiLoading ? "Calculating..." : "Get AI Match Scores"}
            </Button>
          )}
        </div>
        <Select
          value={filters.status}
          onValueChange={(v) => setFilters((f) => ({ ...f, status: v as ScholarshipDirectoryFilters["status"], page: 1 }))}
        >
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
            <SelectItem value="all">All</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {(error as Error).message || "Failed to load scholarships"}
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && rows.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg font-medium">No scholarships found</p>
          <p className="text-sm">Try adjusting your filters or check back later.</p>
        </div>
      )}

      {/* Grid */}
      {!isLoading && rows.length > 0 && (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {rows.map((s) => (
              <Card
                key={s.id}
                className="flex flex-col cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => openDetail(s)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base leading-tight line-clamp-2">
                      {s.name}
                    </CardTitle>
                    <DeadlineBadge rolling={s.rolling_deadline} deadline={s.deadline_date} />
                  </div>
                  <CardDescription className="line-clamp-1">
                    {s.provider || "Provider unknown"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 space-y-3">
                  {/* AI Match Score */}
                  <div onClick={(e) => e.stopPropagation()}>
                    <AIMatchScoreBadge
                      score={getScore(s.id)}
                      loading={aiLoading}
                      onCalculate={() => calculateScholarshipScores([s.id])}
                      compact
                    />
                  </div>

                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{formatMoney(s.amount_min_usd, s.amount_max_usd)}</span>
                    </div>
                    {s.location_scope && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span className="truncate max-w-[120px]">{s.location_scope}</span>
                      </div>
                    )}
                  </div>

                  {(s.major_tags || s.career_tags) && (
                    <div className="flex flex-wrap gap-1">
                      {s.major_tags?.split(",").slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag.trim()}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        addMut.mutate(s.id);
                      }}
                      disabled={addMut.isPending}
                    >
                      {addMut.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-1" />
                          Add to Pipeline
                        </>
                      )}
                    </Button>
                    {s.url && (
                      <Button
                        size="sm"
                        variant="outline"
                        asChild
                        onClick={(e) => e.stopPropagation()}
                      >
                        <a href={s.url} target="_blank" rel="noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <span>Page</span>
                <Select
                  value={String(currentPage)}
                  onValueChange={(v) => goToPage(Number(v))}
                >
                  <SelectTrigger className="w-16 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                      <SelectItem key={p} value={String(p)}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span>of {totalPages}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage >= totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}

      <DirectoryDetailDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        scholarship={selected}
        onAddToPipeline={(id) => addMut.mutate(id)}
        isAdding={addMut.isPending}
      />
    </div>
  );
}
