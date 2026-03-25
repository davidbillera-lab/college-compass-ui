import * as React from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  fetchApplications,
  updateApplicationStatus,
  updateApplicationDeadline,
  seedChecklist,
  fetchChecklist,
  toggleChecklistItem,
  CollegeApplication,
  ChecklistItem,
  AppStatus,
  AppType,
  STATUS_CONFIG,
  APP_TYPE_LABELS,
  DEFAULT_CHECKLIST_STEPS,
  ChecklistCategory,
} from "@/lib/applicationTrackingApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  GraduationCap,
  Calendar,
  ChevronRight,
  Loader2,
  CheckCircle2,
  Circle,
  AlertCircle,
  Clock,
  ArrowRight,
  ListChecks,
  BookOpen,
  FileText,
  Award,
  DollarSign,
  Scroll,
  PenLine,
  Folder,
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";

// ─── Category icons ───────────────────────────────────────────────────────────
const CATEGORY_ICONS: Record<ChecklistCategory, React.ElementType> = {
  essays: PenLine,
  test_scores: BookOpen,
  recommendations: Award,
  financial_aid: DollarSign,
  transcripts: Scroll,
  supplements: FileText,
  other: Folder,
};

const CATEGORY_LABELS: Record<ChecklistCategory, string> = {
  essays: "Essays",
  test_scores: "Test Scores",
  recommendations: "Recommendations",
  financial_aid: "Financial Aid",
  transcripts: "Transcripts",
  supplements: "Supplements",
  other: "Other",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function daysUntil(dateStr: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function deadlineBadge(dateStr: string | null) {
  if (!dateStr) return null;
  const days = daysUntil(dateStr);
  if (days < 0)
    return <Badge className="bg-red-100 text-red-700 border-0 text-xs">Overdue</Badge>;
  if (days <= 7)
    return <Badge className="bg-red-100 text-red-700 border-0 text-xs">{days}d left</Badge>;
  if (days <= 30)
    return <Badge className="bg-amber-100 text-amber-700 border-0 text-xs">{days}d left</Badge>;
  return (
    <Badge variant="secondary" className="text-xs">
      {format(parseISO(dateStr), "MMM d")}
    </Badge>
  );
}

// ─── Checklist Drawer ─────────────────────────────────────────────────────────
interface ChecklistDrawerProps {
  app: CollegeApplication | null;
  open: boolean;
  onClose: () => void;
  studentId: string;
}

function ChecklistDrawer({ app, open, onClose, studentId }: ChecklistDrawerProps) {
  const [items, setItems] = React.useState<ChecklistItem[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [deadlineInput, setDeadlineInput] = React.useState("");
  const [appTypeInput, setAppTypeInput] = React.useState<AppType>("RD");
  const [savingDeadline, setSavingDeadline] = React.useState(false);

  React.useEffect(() => {
    if (open && app) {
      setDeadlineInput(app.deadline_date ?? "");
      setAppTypeInput((app.app_type as AppType) ?? "RD");
      void loadChecklist();
    }
  }, [open, app]);

  const loadChecklist = async () => {
    if (!app) return;
    setLoading(true);
    try {
      let list = await fetchChecklist(studentId, app.college_id);
      if (list.length === 0 && app.shortlist_status === "APPLYING") {
        list = await seedChecklist(studentId, app.college_id);
      }
      setItems(list);
    } catch {
      toast.error("Failed to load checklist");
    } finally {
      setLoading(false);
    }
  };

  const handleSeedChecklist = async () => {
    if (!app) return;
    setLoading(true);
    try {
      const list = await seedChecklist(studentId, app.college_id);
      setItems(list);
      toast.success("Checklist created!");
    } catch {
      toast.error("Failed to create checklist");
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (item: ChecklistItem) => {
    const newCompleted = !item.completed_at;
    setItems((prev) =>
      prev.map((i) =>
        i.id === item.id
          ? { ...i, completed_at: newCompleted ? new Date().toISOString() : null }
          : i
      )
    );
    try {
      await toggleChecklistItem(item.id, newCompleted);
    } catch {
      // revert
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, completed_at: item.completed_at } : i
        )
      );
      toast.error("Failed to update item");
    }
  };

  const handleSaveDeadline = async () => {
    if (!app) return;
    setSavingDeadline(true);
    try {
      await updateApplicationDeadline(app.id, deadlineInput || null, appTypeInput);
      toast.success("Deadline saved!");
    } catch {
      toast.error("Failed to save deadline");
    } finally {
      setSavingDeadline(false);
    }
  };

  const completedCount = items.filter((i) => i.completed_at).length;
  const progress = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;

  // Group by category
  const grouped = items.reduce(
    (acc, item) => {
      const cat = item.category as ChecklistCategory;
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
      return acc;
    },
    {} as Record<ChecklistCategory, ChecklistItem[]>
  );

  const categories = Object.keys(grouped) as ChecklistCategory[];

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        {app && (
          <>
            <SheetHeader className="pb-4">
              <SheetTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-primary" />
                {app.college?.name ?? "College"}
              </SheetTitle>
              <SheetDescription>
                {[app.college?.city, app.college?.state].filter(Boolean).join(", ")} ·{" "}
                <span className={STATUS_CONFIG[app.shortlist_status ?? "INTERESTED"].color.replace("bg-", "text-").split(" ")[0]}>
                  {STATUS_CONFIG[app.shortlist_status ?? "INTERESTED"].label}
                </span>
              </SheetDescription>
            </SheetHeader>

            {/* Deadline editor */}
            <div className="space-y-3 p-4 rounded-lg bg-muted mb-4">
              <h4 className="text-sm font-semibold">Application Deadline</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Application Type</Label>
                  <Select
                    value={appTypeInput}
                    onValueChange={(v) => setAppTypeInput(v as AppType)}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(APP_TYPE_LABELS).map(([k, v]) => (
                        <SelectItem key={k} value={k} className="text-xs">
                          {v}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Deadline Date</Label>
                  <Input
                    type="date"
                    value={deadlineInput}
                    onChange={(e) => setDeadlineInput(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
              </div>
              <Button
                size="sm"
                onClick={handleSaveDeadline}
                disabled={savingDeadline}
                className="w-full"
              >
                {savingDeadline ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                ) : (
                  <Calendar className="h-3.5 w-3.5 mr-1.5" />
                )}
                Save Deadline
              </Button>
            </div>

            {/* Checklist */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <ListChecks className="h-4 w-4 text-primary" />
                  Application Checklist
                </h4>
                {items.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {completedCount}/{items.length} done
                  </span>
                )}
              </div>

              {items.length > 0 && (
                <Progress value={progress} className="h-1.5" />
              )}

              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : items.length === 0 ? (
                <div className="text-center py-6">
                  <ListChecks className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" />
                  <p className="text-sm font-medium">No checklist yet</p>
                  <p className="text-xs text-muted-foreground mt-1 mb-4">
                    Generate a step-by-step application checklist for this school.
                  </p>
                  <Button size="sm" onClick={handleSeedChecklist}>
                    Create Checklist
                  </Button>
                </div>
              ) : (
                <div className="space-y-5">
                  {categories.map((cat) => {
                    const Icon = CATEGORY_ICONS[cat];
                    return (
                      <div key={cat}>
                        <div className="flex items-center gap-2 mb-2">
                          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            {CATEGORY_LABELS[cat]}
                          </span>
                        </div>
                        <div className="space-y-2 pl-5">
                          {grouped[cat].map((item) => (
                            <div
                              key={item.id}
                              className="flex items-start gap-3 group"
                            >
                              <Checkbox
                                checked={!!item.completed_at}
                                onCheckedChange={() => handleToggle(item)}
                                className="mt-0.5"
                              />
                              <div className="flex-1 min-w-0">
                                <p
                                  className={`text-sm leading-snug ${
                                    item.completed_at
                                      ? "line-through text-muted-foreground"
                                      : "text-foreground"
                                  }`}
                                >
                                  {item.title}
                                </p>
                                {item.description && !item.completed_at && (
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    {item.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

// ─── Application Card ─────────────────────────────────────────────────────────
interface AppCardProps {
  app: CollegeApplication;
  onStatusChange: (id: string, status: AppStatus) => void;
  onOpenChecklist: (app: CollegeApplication) => void;
}

const STATUS_ORDER: AppStatus[] = ["INTERESTED", "APPLYING", "APPLIED", "NOT_NOW"];

function AppCard({ app, onStatusChange, onOpenChecklist }: AppCardProps) {
  const currentIdx = STATUS_ORDER.indexOf(app.shortlist_status ?? "INTERESTED");
  const nextStatus = currentIdx < STATUS_ORDER.length - 2 ? STATUS_ORDER[currentIdx + 1] : null;
  const cfg = STATUS_CONFIG[app.shortlist_status ?? "INTERESTED"];

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm truncate">{app.college?.name ?? "Unknown"}</h4>
            <p className="text-xs text-muted-foreground">
              {[app.college?.city, app.college?.state].filter(Boolean).join(", ")}
            </p>
          </div>
          <Badge className={`${cfg.color} border-0 text-xs flex-shrink-0`}>
            {cfg.label}
          </Badge>
        </div>

        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <Badge variant="outline" className="text-xs">
            {app.bucket} · {app.fit_score}%
          </Badge>
          {app.app_type && (
            <Badge variant="secondary" className="text-xs">
              {APP_TYPE_LABELS[app.app_type as AppType] ?? app.app_type}
            </Badge>
          )}
          {deadlineBadge(app.deadline_date)}
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 text-xs h-7"
            onClick={() => onOpenChecklist(app)}
          >
            <ListChecks className="h-3 w-3 mr-1" />
            Checklist
          </Button>
          {nextStatus && (
            <Button
              size="sm"
              className="flex-1 text-xs h-7"
              onClick={() => onStatusChange(app.id, nextStatus)}
            >
              {STATUS_CONFIG[nextStatus].label}
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ApplicationTrackerPage() {
  const { user } = useAuth();
  const [apps, setApps] = React.useState<CollegeApplication[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedApp, setSelectedApp] = React.useState<CollegeApplication | null>(null);
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  React.useEffect(() => {
    if (user) void loadApps();
  }, [user]);

  const loadApps = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await fetchApplications(user.id);
      setApps(data);
    } catch {
      toast.error("Failed to load applications");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (matchId: string, newStatus: AppStatus) => {
    setApps((prev) =>
      prev.map((a) => (a.id === matchId ? { ...a, shortlist_status: newStatus } : a))
    );
    try {
      await updateApplicationStatus(matchId, newStatus);
      toast.success(`Moved to ${STATUS_CONFIG[newStatus].label}`);
    } catch {
      toast.error("Failed to update status");
      await loadApps();
    }
  };

  const handleOpenChecklist = (app: CollegeApplication) => {
    setSelectedApp(app);
    setDrawerOpen(true);
  };

  const columns: { status: AppStatus; apps: CollegeApplication[] }[] = [
    { status: "INTERESTED", apps: apps.filter((a) => a.shortlist_status === "INTERESTED") },
    { status: "APPLYING", apps: apps.filter((a) => a.shortlist_status === "APPLYING") },
    { status: "APPLIED", apps: apps.filter((a) => a.shortlist_status === "APPLIED") },
  ];

  const notNow = apps.filter((a) => a.shortlist_status === "NOT_NOW");

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Application Tracker</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Track every application from interest to submission.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to="/deadlines">
              <Calendar className="h-4 w-4 mr-1.5" />
              Deadline Hub
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to="/colleges">
              <GraduationCap className="h-4 w-4 mr-1.5" />
              Add Colleges
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats row */}
      {!loading && apps.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Interested", status: "INTERESTED" as AppStatus, icon: Circle },
            { label: "Applying", status: "APPLYING" as AppStatus, icon: Clock },
            { label: "Applied", status: "APPLIED" as AppStatus, icon: CheckCircle2 },
            { label: "Not Now", status: "NOT_NOW" as AppStatus, icon: AlertCircle },
          ].map(({ label, status, icon: Icon }) => (
            <Card key={status} className="text-center">
              <CardContent className="py-3">
                <p className="text-2xl font-bold text-primary">
                  {apps.filter((a) => a.shortlist_status === status).length}
                </p>
                <p className="text-xs text-muted-foreground flex items-center justify-center gap-1 mt-0.5">
                  <Icon className="h-3 w-3" />
                  {label}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : apps.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-40" />
            <h3 className="font-semibold text-lg mb-2">No applications tracked yet</h3>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-6">
              Go to College Fit, mark schools as Interested or Applying, and they'll appear here.
            </p>
            <Button asChild>
              <Link to="/colleges">
                <GraduationCap className="h-4 w-4 mr-2" />
                Go to College Fit
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Kanban columns */}
          <div className="grid md:grid-cols-3 gap-4">
            {columns.map(({ status, apps: colApps }) => {
              const cfg = STATUS_CONFIG[status];
              return (
                <div key={status} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${cfg.color.split(" ")[0]}`} />
                      {cfg.label}
                    </h3>
                    <Badge variant="secondary" className="text-xs">
                      {colApps.length}
                    </Badge>
                  </div>
                  {colApps.length === 0 ? (
                    <div className="border-2 border-dashed rounded-lg p-6 text-center text-muted-foreground text-xs">
                      No colleges here yet
                    </div>
                  ) : (
                    colApps.map((app) => (
                      <AppCard
                        key={app.id}
                        app={app}
                        onStatusChange={handleStatusChange}
                        onOpenChecklist={handleOpenChecklist}
                      />
                    ))
                  )}
                </div>
              );
            })}
          </div>

          {/* Not Now section */}
          {notNow.length > 0 && (
            <div>
              <Separator className="my-4" />
              <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Not Now ({notNow.length})
              </h3>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {notNow.map((app) => (
                  <AppCard
                    key={app.id}
                    app={app}
                    onStatusChange={handleStatusChange}
                    onOpenChecklist={handleOpenChecklist}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Checklist Drawer */}
      <ChecklistDrawer
        app={selectedApp}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        studentId={user?.id ?? ""}
      />
    </div>
  );
}
