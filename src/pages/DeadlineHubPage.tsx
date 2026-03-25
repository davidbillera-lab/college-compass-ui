import * as React from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  fetchAllDeadlines,
  daysUntil,
  urgencyLevel,
  DeadlineItem,
  STATUS_CONFIG,
  AppStatus,
} from "@/lib/applicationTrackingApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  GraduationCap,
  Award,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  ArrowRight,
  CalendarDays,
  TrendingUp,
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, isSameMonth } from "date-fns";

// ─── Urgency config ───────────────────────────────────────────────────────────
const URGENCY_CONFIG = {
  overdue: {
    label: "Overdue",
    badgeClass: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 border-0",
    rowClass: "border-l-4 border-red-500",
    icon: AlertTriangle,
    iconClass: "text-red-500",
  },
  critical: {
    label: "This Week",
    badgeClass: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 border-0",
    rowClass: "border-l-4 border-red-400",
    icon: Clock,
    iconClass: "text-red-400",
  },
  soon: {
    label: "This Month",
    badgeClass: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300 border-0",
    rowClass: "border-l-4 border-amber-400",
    icon: Clock,
    iconClass: "text-amber-400",
  },
  upcoming: {
    label: "Next 90 Days",
    badgeClass: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 border-0",
    rowClass: "border-l-4 border-blue-300",
    icon: Calendar,
    iconClass: "text-blue-400",
  },
  future: {
    label: "Future",
    badgeClass: "bg-muted text-muted-foreground border-0",
    rowClass: "border-l-4 border-muted",
    icon: CalendarDays,
    iconClass: "text-muted-foreground",
  },
};

// ─── Mini Calendar ────────────────────────────────────────────────────────────
interface MiniCalendarProps {
  deadlines: DeadlineItem[];
  month: Date;
  onMonthChange: (d: Date) => void;
}

function MiniCalendar({ deadlines, month, onMonthChange }: MiniCalendarProps) {
  const days = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) });
  const deadlineDates = deadlines.map((d) => parseISO(d.deadline_date));
  const startDow = startOfMonth(month).getDay(); // 0=Sun

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">
            {format(month, "MMMM yyyy")}
          </CardTitle>
          <div className="flex gap-1">
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={() => onMonthChange(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
            >
              ‹
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={() => onMonthChange(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
            >
              ›
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-7 gap-0.5 text-center">
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
            <div key={d} className="text-xs text-muted-foreground font-medium py-1">
              {d}
            </div>
          ))}
          {/* Empty cells before first day */}
          {Array.from({ length: startDow }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {days.map((day) => {
            const hasDeadline = deadlineDates.some((d) => isSameDay(d, day));
            const today = isToday(day);
            return (
              <div
                key={day.toISOString()}
                className={`relative text-xs py-1 rounded-sm flex items-center justify-center
                  ${today ? "bg-primary text-primary-foreground font-bold" : ""}
                  ${hasDeadline && !today ? "font-semibold text-foreground" : ""}
                  ${!today && !hasDeadline ? "text-muted-foreground" : ""}
                `}
              >
                {day.getDate()}
                {hasDeadline && (
                  <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Deadline Row ─────────────────────────────────────────────────────────────
interface DeadlineRowProps {
  item: DeadlineItem;
}

function DeadlineRow({ item }: DeadlineRowProps) {
  const days = daysUntil(item.deadline_date);
  const urgency = urgencyLevel(days);
  const cfg = URGENCY_CONFIG[urgency];
  const Icon = item.type === "college" ? GraduationCap : Award;

  return (
    <div className={`flex items-center gap-4 p-3 rounded-lg bg-card ${cfg.rowClass}`}>
      <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{item.name}</p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className="text-xs text-muted-foreground">
            {format(parseISO(item.deadline_date), "MMMM d, yyyy")}
          </span>
          {item.app_type && item.type === "college" && (
            <Badge variant="secondary" className="text-xs px-1.5 py-0">
              {item.app_type}
            </Badge>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <Badge className={`${cfg.badgeClass} text-xs`}>
          {days < 0
            ? `${Math.abs(days)}d ago`
            : days === 0
            ? "Today"
            : `${days}d`}
        </Badge>
        {item.type === "college" && (
          <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" asChild>
            <Link to="/applications">
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function DeadlineHubPage() {
  const { user } = useAuth();
  const [deadlines, setDeadlines] = React.useState<DeadlineItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [calMonth, setCalMonth] = React.useState(new Date());

  React.useEffect(() => {
    if (user) void loadDeadlines();
  }, [user]);

  const loadDeadlines = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await fetchAllDeadlines(user.id);
      setDeadlines(data);
    } catch {
      toast.error("Failed to load deadlines");
    } finally {
      setLoading(false);
    }
  };

  // Group by urgency
  const grouped = {
    overdue: deadlines.filter((d) => urgencyLevel(daysUntil(d.deadline_date)) === "overdue"),
    critical: deadlines.filter((d) => urgencyLevel(daysUntil(d.deadline_date)) === "critical"),
    soon: deadlines.filter((d) => urgencyLevel(daysUntil(d.deadline_date)) === "soon"),
    upcoming: deadlines.filter((d) => urgencyLevel(daysUntil(d.deadline_date)) === "upcoming"),
    future: deadlines.filter((d) => urgencyLevel(daysUntil(d.deadline_date)) === "future"),
  };

  const urgencyKeys = ["overdue", "critical", "soon", "upcoming", "future"] as const;

  const nextDeadline = deadlines.find((d) => daysUntil(d.deadline_date) >= 0);
  const overdueCount = grouped.overdue.length;
  const thisWeekCount = grouped.critical.length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Deadline Hub</h1>
          <p className="text-muted-foreground text-sm mt-1">
            All your college and scholarship deadlines in one place.
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link to="/applications">
            <TrendingUp className="h-4 w-4 mr-1.5" />
            Application Tracker
          </Link>
        </Button>
      </div>

      {/* Alert banners */}
      {!loading && overdueCount > 0 && (
        <Card className="border-red-300 bg-red-50 dark:bg-red-950 dark:border-red-800">
          <CardContent className="py-3 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-800 dark:text-red-200">
              <strong>{overdueCount} deadline{overdueCount > 1 ? "s" : ""} overdue.</strong>{" "}
              Review these immediately and contact the school or scholarship provider.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: deadline list */}
        <div className="lg:col-span-2 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : deadlines.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-40" />
                <h3 className="font-semibold text-lg mb-2">No deadlines tracked</h3>
                <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-6">
                  Add deadline dates to your college applications and scholarship pipeline items to see them here.
                </p>
                <div className="flex gap-3 justify-center">
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/applications">College Deadlines</Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/scholarships-intel">Scholarship Deadlines</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            urgencyKeys.map((key) => {
              const items = grouped[key];
              if (items.length === 0) return null;
              const cfg = URGENCY_CONFIG[key];
              const Icon = cfg.icon;
              return (
                <div key={key}>
                  <div className="flex items-center gap-2 mb-3">
                    <Icon className={`h-4 w-4 ${cfg.iconClass}`} />
                    <h3 className="font-semibold text-sm">{cfg.label}</h3>
                    <Badge variant="secondary" className="text-xs">
                      {items.length}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    {items.map((item) => (
                      <DeadlineRow key={item.id} item={item} />
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right: calendar + summary */}
        <div className="space-y-4">
          <MiniCalendar
            deadlines={deadlines}
            month={calMonth}
            onMonthChange={setCalMonth}
          />

          {/* Summary stats */}
          {!loading && deadlines.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total deadlines</span>
                  <span className="font-medium">{deadlines.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">College apps</span>
                  <span className="font-medium">
                    {deadlines.filter((d) => d.type === "college").length}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Scholarships</span>
                  <span className="font-medium">
                    {deadlines.filter((d) => d.type === "scholarship").length}
                  </span>
                </div>
                {overdueCount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-red-600 dark:text-red-400">Overdue</span>
                    <span className="font-medium text-red-600 dark:text-red-400">
                      {overdueCount}
                    </span>
                  </div>
                )}
                {thisWeekCount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-amber-600 dark:text-amber-400">Due this week</span>
                    <span className="font-medium text-amber-600 dark:text-amber-400">
                      {thisWeekCount}
                    </span>
                  </div>
                )}
                {nextDeadline && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-xs text-muted-foreground">Next deadline</p>
                      <p className="text-sm font-medium truncate">{nextDeadline.name}</p>
                      <p className="text-xs text-primary font-semibold">
                        {format(parseISO(nextDeadline.deadline_date), "MMMM d, yyyy")} ·{" "}
                        {daysUntil(nextDeadline.deadline_date)} days
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
