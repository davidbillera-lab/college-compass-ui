import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import ScholarshipDetailDrawer from "@/components/ScholarshipDetailDrawer";
import {
  addScholarshipToPipeline,
  fetchScholarships,
  type ScholarshipLibraryFilters,
  type ScholarshipRow,
} from "@/lib/scholarshipsIntel/scholarshipLibrary";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function formatMoney(min?: number | null, max?: number | null) {
  const fmt = (n: number) => `$${n.toLocaleString()}`;
  if (min && max) return `${fmt(min)}–${fmt(max)}`;
  if (max) return fmt(max);
  if (min) return fmt(min);
  return "—";
}

function statusBadge(s: string | null) {
  if (s === "archived") return <Badge variant="secondary">Archived</Badge>;
  return <Badge>Active</Badge>;
}

function eligibilityBadge(rolling: boolean | null, deadline: string | null) {
  if (rolling) return <Badge variant="outline">Rolling</Badge>;
  if (deadline) return <Badge variant="outline">Due {deadline}</Badge>;
  return <Badge variant="outline">No deadline</Badge>;
}

export default function ScholarshipLibraryPage() {
  const qc = useQueryClient();

  const [filters, setFilters] = useState<ScholarshipLibraryFilters>({
    q: "",
    status: "active",
    rollingOnly: false,
    deadline: "any",
    sort: "deadline",
  });

  const queryKey = useMemo(() => ["scholarships", filters], [filters]);

  const { data, isLoading, error } = useQuery({
    queryKey,
    queryFn: () => fetchScholarships(filters),
  });

  const [selected, setSelected] = useState<ScholarshipRow | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const addMut = useMutation({
    mutationFn: (id: string) => addScholarshipToPipeline(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pipeline"] });
    },
  });

  const rows = data ?? [];

  return (
    <main className="p-6 space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Scholarship Library</h1>
          <p className="text-sm text-muted-foreground">
            Browse scholarships and add the best ones to your pipeline.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="grid gap-3 md:grid-cols-5">
        <Input
          placeholder="Search name, provider, major tags..."
          value={filters.q ?? ""}
          onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
          className="md:col-span-2"
        />

        <Select
          value={filters.status ?? "active"}
          onValueChange={(v) => setFilters((f) => ({ ...f, status: v as ScholarshipLibraryFilters["status"] }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
            <SelectItem value="all">All</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.deadline ?? "any"}
          onValueChange={(v) => setFilters((f) => ({ ...f, deadline: v as ScholarshipLibraryFilters["deadline"] }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Deadline" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any deadline</SelectItem>
            <SelectItem value="next30">Next 30 days</SelectItem>
            <SelectItem value="next60">Next 60 days</SelectItem>
            <SelectItem value="past">Past deadlines</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.sort ?? "deadline"}
          onValueChange={(v) => setFilters((f) => ({ ...f, sort: v as ScholarshipLibraryFilters["sort"] }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="deadline">Deadline soon</SelectItem>
            <SelectItem value="amount">Highest amount</SelectItem>
            <SelectItem value="newest">Newest added</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2 md:col-span-5">
          <Switch
            checked={!!filters.rollingOnly}
            onCheckedChange={(v) => setFilters((f) => ({ ...f, rollingOnly: v }))}
          />
          <span className="text-sm">Rolling deadlines only</span>
        </div>
      </div>

      {/* List */}
      <div className="rounded border overflow-hidden">
        <div className="bg-muted/40 px-4 py-2 text-sm flex items-center justify-between">
          <div>
            {isLoading ? "Loading…" : `${rows.length.toLocaleString()} scholarships`}
          </div>
          {addMut.isPending && <div className="text-xs text-muted-foreground">Adding…</div>}
        </div>

        {error ? (
          <div className="p-6 text-sm text-red-600">
            {(error as Error).message ?? "Failed to load scholarships"}
          </div>
        ) : rows.length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground">
            No scholarships found yet. (Your table is currently empty.) Once ingestion runs, they will appear here.
          </div>
        ) : (
          <div className="divide-y">
            {rows.map((s) => (
              <div key={s.id} className="p-4 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex flex-wrap gap-2 items-center">
                    <div className="font-medium">{s.name}</div>
                    {statusBadge(s.status)}
                    {eligibilityBadge(!!s.rolling_deadline, s.deadline_date)}
                  </div>

                  <div className="text-sm text-muted-foreground">
                    {s.provider ?? "Provider unknown"} • {formatMoney(s.amount_min_usd, s.amount_max_usd)}
                    {s.location_scope ? ` • ${s.location_scope}` : ""}
                  </div>

                  {(s.major_tags || s.career_tags) && (
                    <div className="text-xs text-muted-foreground">
                      {s.major_tags ? `Majors: ${s.major_tags}` : ""}
                      {s.major_tags && s.career_tags ? " • " : ""}
                      {s.career_tags ? `Careers: ${s.career_tags}` : ""}
                    </div>
                  )}
                </div>

                <div className="flex gap-2 flex-wrap justify-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelected(s);
                      setDrawerOpen(true);
                    }}
                  >
                    Details
                  </Button>

                  <Button onClick={() => addMut.mutate(s.id)}>
                    Add to Pipeline
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ScholarshipDetailDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        scholarship={selected}
        onAddToPipeline={(id) => addMut.mutate(id)}
      />
    </main>
  );
}
