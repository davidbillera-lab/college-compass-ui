import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  CalendarDays, CheckCircle2, Circle, AlertCircle, Plus,
  Clock, GraduationCap, FileText, DollarSign, BookOpen,
  Star, Trash2, ChevronDown, ChevronUp,
} from "lucide-react";
import { format, addDays, subDays, subWeeks, parseISO, isAfter, isBefore, isToday } from "date-fns";

interface CollegeDeadline {
  id: string;
  name: string;
  type: "ED" | "EA" | "RD" | "ED2";
  deadline: string;
}

interface Task {
  id: string;
  title: string;
  category: "essays" | "tests" | "financial" | "applications" | "visits" | "general";
  dueDate: string;
  collegeId?: string;
  completed: boolean;
  priority: "high" | "medium" | "low";
  description?: string;
}

const CATEGORY_META = {
  essays: { label: "Essays", icon: FileText, color: "text-purple-600", bg: "bg-purple-50 border-purple-200" },
  tests: { label: "SAT/ACT", icon: BookOpen, color: "text-blue-600", bg: "bg-blue-50 border-blue-200" },
  financial: { label: "Financial Aid", icon: DollarSign, color: "text-green-600", bg: "bg-green-50 border-green-200" },
  applications: { label: "Applications", icon: GraduationCap, color: "text-orange-600", bg: "bg-orange-50 border-orange-200" },
  visits: { label: "Campus Visits", icon: Star, color: "text-rose-600", bg: "bg-rose-50 border-rose-200" },
  general: { label: "General", icon: CheckCircle2, color: "text-gray-600", bg: "bg-gray-50 border-gray-200" },
};

const PRIORITY_COLORS = {
  high: "text-red-600 bg-red-50 border-red-200",
  medium: "text-yellow-600 bg-yellow-50 border-yellow-200",
  low: "text-gray-500 bg-gray-50 border-gray-200",
};

// Generate tasks automatically from a college deadline
function generateTasksFromDeadline(college: CollegeDeadline): Task[] {
  const deadline = parseISO(college.deadline);
  const tasks: Task[] = [];

  if (college.type === "ED" || college.type === "EA" || college.type === "ED2") {
    tasks.push(
      {
        id: `${college.id}-research`,
        title: `Research ${college.name} thoroughly`,
        category: "applications",
        dueDate: format(subWeeks(deadline, 10), "yyyy-MM-dd"),
        collegeId: college.id,
        completed: false,
        priority: "medium",
        description: "Review programs, campus culture, financial aid, and outcomes.",
      },
      {
        id: `${college.id}-visit`,
        title: `Visit or attend virtual event for ${college.name}`,
        category: "visits",
        dueDate: format(subWeeks(deadline, 8), "yyyy-MM-dd"),
        collegeId: college.id,
        completed: false,
        priority: "medium",
        description: "Demonstrating interest can positively impact your application.",
      },
      {
        id: `${college.id}-essay-draft`,
        title: `Draft ${college.name} supplemental essays`,
        category: "essays",
        dueDate: format(subWeeks(deadline, 6), "yyyy-MM-dd"),
        collegeId: college.id,
        completed: false,
        priority: "high",
        description: "Research specific prompts on the Common App or school website.",
      },
      {
        id: `${college.id}-essay-review`,
        title: `Get feedback on ${college.name} essays`,
        category: "essays",
        dueDate: format(subWeeks(deadline, 4), "yyyy-MM-dd"),
        collegeId: college.id,
        completed: false,
        priority: "high",
        description: "Use the AI Essay Coach and ask a trusted adult to review.",
      },
      {
        id: `${college.id}-recs`,
        title: `Confirm recommendation letters for ${college.name}`,
        category: "applications",
        dueDate: format(subWeeks(deadline, 3), "yyyy-MM-dd"),
        collegeId: college.id,
        completed: false,
        priority: "high",
        description: "Ensure teachers and counselor have submitted their letters.",
      },
      {
        id: `${college.id}-transcript`,
        title: `Request official transcript for ${college.name}`,
        category: "applications",
        dueDate: format(subWeeks(deadline, 3), "yyyy-MM-dd"),
        collegeId: college.id,
        completed: false,
        priority: "high",
        description: "Contact your school counselor at least 3 weeks before the deadline.",
      },
      {
        id: `${college.id}-final-review`,
        title: `Final review of ${college.name} application`,
        category: "applications",
        dueDate: format(subDays(deadline, 7), "yyyy-MM-dd"),
        collegeId: college.id,
        completed: false,
        priority: "high",
        description: "Check all sections, re-read essays, verify test scores are sent.",
      },
      {
        id: `${college.id}-submit`,
        title: `Submit ${college.name} ${college.type} application`,
        category: "applications",
        dueDate: college.deadline,
        collegeId: college.id,
        completed: false,
        priority: "high",
        description: `${college.type} deadline — submit by 11:59 PM in the school's time zone.`,
      }
    );
  } else {
    // Regular Decision
    tasks.push(
      {
        id: `${college.id}-essay-draft`,
        title: `Draft ${college.name} supplemental essays`,
        category: "essays",
        dueDate: format(subWeeks(deadline, 8), "yyyy-MM-dd"),
        collegeId: college.id,
        completed: false,
        priority: "medium",
      },
      {
        id: `${college.id}-recs`,
        title: `Confirm recommendation letters for ${college.name}`,
        category: "applications",
        dueDate: format(subWeeks(deadline, 4), "yyyy-MM-dd"),
        collegeId: college.id,
        completed: false,
        priority: "high",
      },
      {
        id: `${college.id}-submit`,
        title: `Submit ${college.name} RD application`,
        category: "applications",
        dueDate: college.deadline,
        collegeId: college.id,
        completed: false,
        priority: "high",
      }
    );
  }

  return tasks;
}

const DEFAULT_TASKS: Task[] = [
  {
    id: "fafsa",
    title: "File FAFSA (opens October 1)",
    category: "financial",
    dueDate: format(new Date(new Date().getFullYear(), 9, 1), "yyyy-MM-dd"),
    completed: false,
    priority: "high",
    description: "File as early as possible — many state programs are first-come, first-served.",
  },
  {
    id: "personal-statement-draft",
    title: "Draft Common App Personal Statement",
    category: "essays",
    dueDate: format(addDays(new Date(), 14), "yyyy-MM-dd"),
    completed: false,
    priority: "high",
    description: "650 words. Focus on a specific moment that reveals who you are.",
  },
  {
    id: "test-scores",
    title: "Send official SAT/ACT scores to colleges",
    category: "tests",
    dueDate: format(addDays(new Date(), 30), "yyyy-MM-dd"),
    completed: false,
    priority: "medium",
    description: "Scores must be sent directly from College Board or ACT — not self-reported.",
  },
  {
    id: "brag-sheet",
    title: "Create Brag Sheet for recommendation letter writers",
    category: "applications",
    dueDate: format(addDays(new Date(), 7), "yyyy-MM-dd"),
    completed: false,
    priority: "high",
    description: "Use the Brag Sheet Generator to create a one-pager for your teachers.",
  },
];

function getStatusColor(dueDate: string, completed: boolean) {
  if (completed) return "text-green-600";
  const date = parseISO(dueDate);
  const today = new Date();
  if (isBefore(date, today)) return "text-red-600";
  if (isBefore(date, addDays(today, 7))) return "text-orange-500";
  return "text-muted-foreground";
}

function getStatusLabel(dueDate: string, completed: boolean) {
  if (completed) return "Done";
  const date = parseISO(dueDate);
  const today = new Date();
  if (isToday(date)) return "Due Today";
  if (isBefore(date, today)) return "Overdue";
  if (isBefore(date, addDays(today, 7))) return "Due Soon";
  return format(date, "MMM d");
}

export default function TaskTimelinePage() {
  const [tasks, setTasks] = useState<Task[]>(DEFAULT_TASKS);
  const [colleges, setColleges] = useState<CollegeDeadline[]>([]);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [showCompleted, setShowCompleted] = useState(false);
  const [expandedColleges, setExpandedColleges] = useState<Set<string>>(new Set());

  // Add college dialog state
  const [newCollegeName, setNewCollegeName] = useState("");
  const [newCollegeType, setNewCollegeType] = useState<"ED" | "EA" | "RD" | "ED2">("RD");
  const [newCollegeDeadline, setNewCollegeDeadline] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleAddCollege = () => {
    if (!newCollegeName || !newCollegeDeadline) return;
    const college: CollegeDeadline = {
      id: crypto.randomUUID(),
      name: newCollegeName,
      type: newCollegeType,
      deadline: newCollegeDeadline,
    };
    setColleges((prev) => [...prev, college]);
    const generatedTasks = generateTasksFromDeadline(college);
    setTasks((prev) => [...prev, ...generatedTasks]);
    setNewCollegeName("");
    setNewCollegeDeadline("");
    setDialogOpen(false);
  };

  const handleToggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const handleDeleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const handleRemoveCollege = (collegeId: string) => {
    setColleges((prev) => prev.filter((c) => c.id !== collegeId));
    setTasks((prev) => prev.filter((t) => t.collegeId !== collegeId));
  };

  const filteredTasks = useMemo(() => {
    return tasks
      .filter((t) => (filterCategory === "all" ? true : t.category === filterCategory))
      .filter((t) => (showCompleted ? true : !t.completed))
      .sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        return parseISO(a.dueDate).getTime() - parseISO(b.dueDate).getTime();
      });
  }, [tasks, filterCategory, showCompleted]);

  const completedCount = tasks.filter((t) => t.completed).length;
  const progress = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  const overdueTasks = tasks.filter(
    (t) => !t.completed && isBefore(parseISO(t.dueDate), new Date())
  );

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white">
              <CalendarDays className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold">My Task Timeline</h1>
          </div>
          <p className="text-muted-foreground text-sm">
            Add your colleges and get an auto-generated, personalized application checklist
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 flex-shrink-0">
              <Plus className="h-4 w-4" />
              Add College
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add a College Deadline</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <Label>College Name</Label>
                <Input
                  placeholder="e.g. University of Michigan"
                  value={newCollegeName}
                  onChange={(e) => setNewCollegeName(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Application Type</Label>
                <Select
                  value={newCollegeType}
                  onValueChange={(v) => setNewCollegeType(v as typeof newCollegeType)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ED">Early Decision (ED) — Binding</SelectItem>
                    <SelectItem value="ED2">Early Decision II (ED2) — Binding</SelectItem>
                    <SelectItem value="EA">Early Action (EA) — Non-binding</SelectItem>
                    <SelectItem value="RD">Regular Decision (RD)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Application Deadline</Label>
                <Input
                  type="date"
                  value={newCollegeDeadline}
                  onChange={(e) => setNewCollegeDeadline(e.target.value)}
                  className="mt-1"
                />
              </div>
              <Button
                onClick={handleAddCollege}
                disabled={!newCollegeName || !newCollegeDeadline}
                className="w-full"
              >
                Add & Generate Tasks
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Progress & Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-2">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Overall Progress</span>
              <span className="text-sm text-muted-foreground">
                {completedCount} / {tasks.length} tasks
              </span>
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1.5">{progress}% complete</p>
          </CardContent>
        </Card>
        {overdueTasks.length > 0 ? (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm font-semibold">{overdueTasks.length} Overdue</span>
              </div>
              <p className="text-xs text-red-600 mt-1">
                {overdueTasks[0].title}
                {overdueTasks.length > 1 && ` + ${overdueTasks.length - 1} more`}
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-sm font-semibold">On Track!</span>
              </div>
              <p className="text-xs text-green-600 mt-1">No overdue tasks. Keep it up!</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* College Deadlines */}
      {colleges.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Your College Deadlines</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {colleges.map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full border bg-muted text-sm"
              >
                <GraduationCap className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="font-medium">{c.name}</span>
                <Badge variant="outline" className="text-xs px-1.5 py-0">
                  {c.type}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {format(parseISO(c.deadline), "MMM d")}
                </span>
                <button
                  onClick={() => handleRemoveCollege(c.id)}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={filterCategory === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterCategory("all")}
          >
            All
          </Button>
          {Object.entries(CATEGORY_META).map(([key, meta]) => {
            const Icon = meta.icon;
            return (
              <Button
                key={key}
                variant={filterCategory === key ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterCategory(key)}
                className="gap-1.5"
              >
                <Icon className="h-3.5 w-3.5" />
                {meta.label}
              </Button>
            );
          })}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowCompleted((v) => !v)}
          className="ml-auto text-muted-foreground"
        >
          {showCompleted ? "Hide Completed" : "Show Completed"}
        </Button>
      </div>

      {/* Task List */}
      <div className="space-y-2">
        {filteredTasks.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <CalendarDays className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">
                {tasks.length === 0
                  ? "Add a college above to auto-generate your personalized task list."
                  : "No tasks match your current filters."}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredTasks.map((task) => {
            const meta = CATEGORY_META[task.category];
            const Icon = meta.icon;
            const statusColor = getStatusColor(task.dueDate, task.completed);
            const statusLabel = getStatusLabel(task.dueDate, task.completed);

            return (
              <div
                key={task.id}
                className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${
                  task.completed ? "opacity-50 bg-muted/30" : "bg-card hover:bg-muted/30"
                }`}
              >
                <Checkbox
                  checked={task.completed}
                  onCheckedChange={() => handleToggleTask(task.id)}
                  className="mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p
                      className={`text-sm font-medium leading-snug ${
                        task.completed ? "line-through text-muted-foreground" : ""
                      }`}
                    >
                      {task.title}
                    </p>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-xs font-medium ${statusColor}`}>
                        {statusLabel}
                      </span>
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  {task.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      {task.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-1.5">
                    <span
                      className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${meta.bg} ${meta.color}`}
                    >
                      <Icon className="h-3 w-3" />
                      {meta.label}
                    </span>
                    <span
                      className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full border ${
                        PRIORITY_COLORS[task.priority]
                      }`}
                    >
                      {task.priority}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
