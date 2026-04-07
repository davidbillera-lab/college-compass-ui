import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import jsPDF from "jspdf";
import {
  FileText, Download, Plus, Trash2, Star, Trophy, BookOpen,
  Heart, Lightbulb, Users, GraduationCap, Copy, CheckCircle,
} from "lucide-react";

interface Activity {
  id: string;
  name: string;
  role: string;
  years: string;
  description: string;
}

interface Award {
  id: string;
  title: string;
  organization: string;
  year: string;
  description: string;
}

interface BragSheetData {
  studentName: string;
  school: string;
  gpa: string;
  satScore: string;
  actScore: string;
  intendedMajor: string;
  personalStatement: string;
  activities: Activity[];
  awards: Award[];
  communityService: string;
  workExperience: string;
  uniqueQualities: string;
  teacherContext: string;
}

const emptyActivity = (): Activity => ({
  id: crypto.randomUUID(),
  name: "",
  role: "",
  years: "",
  description: "",
});

const emptyAward = (): Award => ({
  id: crypto.randomUUID(),
  title: "",
  organization: "",
  year: "",
  description: "",
});

// ED/EA Strategy data
const ED_EA_STRATEGY = [
  {
    type: "Early Decision (ED)",
    binding: true,
    deadline: "Typically November 1",
    bestFor: [
      "Your absolute first-choice school",
      "Students whose stats are slightly below the school's median",
      "Families who have done thorough financial aid research",
    ],
    cautions: [
      "Binding — you MUST attend if accepted",
      "You cannot compare financial aid offers",
      "ED acceptance rates are often 10–20% higher than RD",
    ],
    color: "border-rose-200 bg-rose-50",
    badgeColor: "bg-rose-100 text-rose-800",
  },
  {
    type: "Early Action (EA)",
    binding: false,
    deadline: "Typically November 1–15",
    bestFor: [
      "Students with strong fall semester grades",
      "Those who want an early answer without commitment",
      "Applying to multiple schools early",
    ],
    cautions: [
      "Non-binding — you can still compare offers",
      "Restrictive EA (REA) at some schools prevents other EA applications",
      "Check each school's specific EA rules",
    ],
    color: "border-blue-200 bg-blue-50",
    badgeColor: "bg-blue-100 text-blue-800",
  },
  {
    type: "Regular Decision (RD)",
    binding: false,
    deadline: "Typically January 1–15",
    bestFor: [
      "Students who need more time to strengthen their application",
      "Those waiting for fall semester grades",
      "Applying to many schools for maximum comparison",
    ],
    cautions: [
      "More competitive pool than ED/EA",
      "Less time to prepare after decisions",
      "Financial aid packages arrive later",
    ],
    color: "border-green-200 bg-green-50",
    badgeColor: "bg-green-100 text-green-800",
  },
];

export default function BragSheetPage() {
  const [data, setData] = useState<BragSheetData>({
    studentName: "",
    school: "",
    gpa: "",
    satScore: "",
    actScore: "",
    intendedMajor: "",
    personalStatement: "",
    activities: [emptyActivity()],
    awards: [emptyAward()],
    communityService: "",
    workExperience: "",
    uniqueQualities: "",
    teacherContext: "",
  });
  const [copied, setCopied] = useState(false);

  const update = (field: keyof BragSheetData, value: string) =>
    setData((prev) => ({ ...prev, [field]: value }));

  const updateActivity = (id: string, field: keyof Activity, value: string) =>
    setData((prev) => ({
      ...prev,
      activities: prev.activities.map((a) => (a.id === id ? { ...a, [field]: value } : a)),
    }));

  const updateAward = (id: string, field: keyof Award, value: string) =>
    setData((prev) => ({
      ...prev,
      awards: prev.awards.map((a) => (a.id === id ? { ...a, [field]: value } : a)),
    }));

  const generatePDF = () => {
    if (!data.studentName) {
      toast.error("Please enter the student's name before downloading.");
      return;
    }

    const doc = new jsPDF();
    const margin = 20;
    let y = margin;
    const lineHeight = 7;
    const pageWidth = doc.internal.pageSize.getWidth();
    const contentWidth = pageWidth - margin * 2;

    const addLine = (text: string, fontSize = 11, bold = false) => {
      if (y > 270) { doc.addPage(); y = margin; }
      doc.setFontSize(fontSize);
      doc.setFont("helvetica", bold ? "bold" : "normal");
      const lines = doc.splitTextToSize(text, contentWidth);
      doc.text(lines, margin, y);
      y += lineHeight * lines.length;
    };

    const addSection = (title: string) => {
      y += 4;
      if (y > 265) { doc.addPage(); y = margin; }
      doc.setFillColor(240, 240, 250);
      doc.rect(margin - 2, y - 5, contentWidth + 4, 9, "F");
      addLine(title, 12, true);
      y += 2;
    };

    // Header
    doc.setFillColor(79, 70, 229);
    doc.rect(0, 0, pageWidth, 30, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("Student Brag Sheet", margin, 20);
    doc.setTextColor(0, 0, 0);
    y = 40;

    addLine(`Student: ${data.studentName}`, 13, true);
    if (data.school) addLine(`School: ${data.school}`);
    addLine(`Prepared for: Recommendation Letter Writers`, 10);
    y += 4;

    // Academics
    addSection("Academic Profile");
    if (data.gpa) addLine(`GPA: ${data.gpa}`);
    if (data.satScore) addLine(`SAT Score: ${data.satScore}`);
    if (data.actScore) addLine(`ACT Score: ${data.actScore}`);
    if (data.intendedMajor) addLine(`Intended Major: ${data.intendedMajor}`);

    // Activities
    if (data.activities.some((a) => a.name)) {
      addSection("Extracurricular Activities");
      data.activities
        .filter((a) => a.name)
        .forEach((a, idx) => {
          addLine(`${idx + 1}. ${a.name}${a.role ? ` — ${a.role}` : ""}${a.years ? ` (${a.years})` : ""}`, 11, true);
          if (a.description) addLine(`   ${a.description}`, 10);
        });
    }

    // Awards
    if (data.awards.some((a) => a.title)) {
      addSection("Awards & Honors");
      data.awards
        .filter((a) => a.title)
        .forEach((a, idx) => {
          addLine(`${idx + 1}. ${a.title}${a.organization ? ` — ${a.organization}` : ""}${a.year ? ` (${a.year})` : ""}`, 11, true);
          if (a.description) addLine(`   ${a.description}`, 10);
        });
    }

    if (data.communityService) {
      addSection("Community Service");
      addLine(data.communityService, 10);
    }

    if (data.workExperience) {
      addSection("Work Experience");
      addLine(data.workExperience, 10);
    }

    if (data.uniqueQualities) {
      addSection("Unique Qualities & Personal Characteristics");
      addLine(data.uniqueQualities, 10);
    }

    if (data.teacherContext) {
      addSection("Note to Recommendation Writer");
      addLine(data.teacherContext, 10);
    }

    if (data.personalStatement) {
      addSection("Personal Statement Summary");
      addLine(data.personalStatement, 10);
    }

    doc.save(`${data.studentName.replace(/\s+/g, "_")}_Brag_Sheet.pdf`);
    toast.success("Brag Sheet PDF downloaded!");
  };

  const generateText = () => {
    const lines: string[] = [];
    lines.push(`STUDENT BRAG SHEET — ${data.studentName}`);
    lines.push(`School: ${data.school || "N/A"}`);
    lines.push("");
    lines.push("ACADEMIC PROFILE");
    if (data.gpa) lines.push(`GPA: ${data.gpa}`);
    if (data.satScore) lines.push(`SAT: ${data.satScore}`);
    if (data.actScore) lines.push(`ACT: ${data.actScore}`);
    if (data.intendedMajor) lines.push(`Intended Major: ${data.intendedMajor}`);
    lines.push("");
    if (data.activities.some((a) => a.name)) {
      lines.push("ACTIVITIES");
      data.activities.filter((a) => a.name).forEach((a, i) => {
        lines.push(`${i + 1}. ${a.name} — ${a.role} (${a.years})`);
        if (a.description) lines.push(`   ${a.description}`);
      });
      lines.push("");
    }
    if (data.awards.some((a) => a.title)) {
      lines.push("AWARDS & HONORS");
      data.awards.filter((a) => a.title).forEach((a, i) => {
        lines.push(`${i + 1}. ${a.title} — ${a.organization} (${a.year})`);
        if (a.description) lines.push(`   ${a.description}`);
      });
      lines.push("");
    }
    if (data.uniqueQualities) {
      lines.push("UNIQUE QUALITIES");
      lines.push(data.uniqueQualities);
    }
    return lines.join("\n");
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generateText());
    setCopied(true);
    toast.success("Brag Sheet copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white">
            <Star className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Brag Sheet & Strategy Hub</h1>
            <p className="text-muted-foreground text-sm">
              Generate a teacher brag sheet and plan your ED/EA strategy
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="brag-sheet">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="brag-sheet" className="gap-2">
            <FileText className="h-4 w-4" />
            Brag Sheet Generator
          </TabsTrigger>
          <TabsTrigger value="strategy" className="gap-2">
            <GraduationCap className="h-4 w-4" />
            ED/EA Strategy Guide
          </TabsTrigger>
        </TabsList>

        <TabsContent value="brag-sheet" className="space-y-6 mt-4">
          <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm">
            <Lightbulb className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <p>
              A brag sheet gives your recommendation letter writers the specific details they need
              to write a powerful, personalized letter. Fill this out completely and share it with
              every teacher and counselor writing on your behalf.
            </p>
          </div>

          {/* Basic Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Academic Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { field: "studentName", label: "Full Name *", placeholder: "Jane Smith" },
                { field: "school", label: "High School", placeholder: "Lincoln High School" },
                { field: "gpa", label: "GPA (Weighted / Unweighted)", placeholder: "4.2 / 3.9" },
                { field: "satScore", label: "SAT Score (if applicable)", placeholder: "1450" },
                { field: "actScore", label: "ACT Score (if applicable)", placeholder: "32" },
                { field: "intendedMajor", label: "Intended Major / Field", placeholder: "Computer Science" },
              ].map(({ field, label, placeholder }) => (
                <div key={field}>
                  <Label className="text-xs">{label}</Label>
                  <Input
                    placeholder={placeholder}
                    value={(data as Record<string, string>)[field]}
                    onChange={(e) => update(field as keyof BragSheetData, e.target.value)}
                    className="mt-1"
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Activities */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Trophy className="h-4 w-4" />
                  Extracurricular Activities
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setData((prev) => ({ ...prev, activities: [...prev.activities, emptyActivity()] }))
                  }
                  className="gap-1.5 h-7 text-xs"
                >
                  <Plus className="h-3 w-3" />
                  Add
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.activities.map((activity, idx) => (
                <div key={activity.id} className="p-3 rounded-lg border bg-muted/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-muted-foreground">
                      Activity {idx + 1}
                    </span>
                    {data.activities.length > 1 && (
                      <button
                        onClick={() =>
                          setData((prev) => ({
                            ...prev,
                            activities: prev.activities.filter((a) => a.id !== activity.id),
                          }))
                        }
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="col-span-2">
                      <Label className="text-xs">Activity Name</Label>
                      <Input
                        placeholder="Varsity Soccer, Student Council, Robotics Club..."
                        value={activity.name}
                        onChange={(e) => updateActivity(activity.id, "name", e.target.value)}
                        className="mt-1 h-8"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Your Role</Label>
                      <Input
                        placeholder="Captain, President, Member..."
                        value={activity.role}
                        onChange={(e) => updateActivity(activity.id, "role", e.target.value)}
                        className="mt-1 h-8"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Years Involved</Label>
                      <Input
                        placeholder="9th–12th grade"
                        value={activity.years}
                        onChange={(e) => updateActivity(activity.id, "years", e.target.value)}
                        className="mt-1 h-8"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs">Key Accomplishments</Label>
                      <Textarea
                        placeholder="What did you achieve? Any leadership, awards, or impact?"
                        value={activity.description}
                        onChange={(e) => updateActivity(activity.id, "description", e.target.value)}
                        className="mt-1 resize-none"
                        rows={2}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Awards */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  Awards & Honors
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setData((prev) => ({ ...prev, awards: [...prev.awards, emptyAward()] }))
                  }
                  className="gap-1.5 h-7 text-xs"
                >
                  <Plus className="h-3 w-3" />
                  Add
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.awards.map((award, idx) => (
                <div key={award.id} className="p-3 rounded-lg border bg-muted/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-muted-foreground">Award {idx + 1}</span>
                    {data.awards.length > 1 && (
                      <button
                        onClick={() =>
                          setData((prev) => ({
                            ...prev,
                            awards: prev.awards.filter((a) => a.id !== award.id),
                          }))
                        }
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="col-span-2">
                      <Label className="text-xs">Award / Honor Title</Label>
                      <Input
                        placeholder="National Merit Semifinalist, AP Scholar..."
                        value={award.title}
                        onChange={(e) => updateAward(award.id, "title", e.target.value)}
                        className="mt-1 h-8"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Awarding Organization</Label>
                      <Input
                        placeholder="College Board, State Government..."
                        value={award.organization}
                        onChange={(e) => updateAward(award.id, "organization", e.target.value)}
                        className="mt-1 h-8"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Year</Label>
                      <Input
                        placeholder="2025"
                        value={award.year}
                        onChange={(e) => updateAward(award.id, "year", e.target.value)}
                        className="mt-1 h-8"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Additional Sections */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Heart className="h-4 w-4" />
                Additional Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { field: "communityService", label: "Community Service & Volunteering", placeholder: "Describe your service work, organizations, hours, and impact..." },
                { field: "workExperience", label: "Work Experience", placeholder: "Jobs, internships, freelance work, entrepreneurship..." },
                { field: "uniqueQualities", label: "Unique Qualities & Personal Characteristics", placeholder: "What makes you unique? What would your friends say about you? What challenges have you overcome?" },
                { field: "teacherContext", label: "Note to Recommendation Writer", placeholder: "Is there a specific class, project, or moment you'd like them to highlight? Any context that would help them write a stronger letter?" },
                { field: "personalStatement", label: "Personal Statement Theme / Summary", placeholder: "Briefly summarize what your personal statement is about so your recommenders can reinforce the same themes..." },
              ].map(({ field, label, placeholder }) => (
                <div key={field}>
                  <Label className="text-xs">{label}</Label>
                  <Textarea
                    placeholder={placeholder}
                    value={(data as Record<string, string>)[field]}
                    onChange={(e) => update(field as keyof BragSheetData, e.target.value)}
                    className="mt-1 resize-none"
                    rows={3}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-3">
            <Button onClick={generatePDF} className="flex-1 gap-2 h-11">
              <Download className="h-4 w-4" />
              Download PDF
            </Button>
            <Button variant="outline" onClick={handleCopy} className="flex-1 gap-2 h-11">
              {copied ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy as Text
                </>
              )}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="strategy" className="space-y-6 mt-4">
          <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-sm">
            <Lightbulb className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <p>
              Choosing the right application strategy can dramatically improve your acceptance odds.
              Early Decision applicants are often accepted at rates 10–20% higher than Regular
              Decision applicants at the same school.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {ED_EA_STRATEGY.map((strategy) => (
              <Card key={strategy.type} className={`border-2 ${strategy.color}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{strategy.type}</CardTitle>
                    <Badge
                      className={`text-xs ${strategy.badgeColor}`}
                      variant="outline"
                    >
                      {strategy.binding ? "Binding" : "Non-binding"}
                    </Badge>
                  </div>
                  <CardDescription className="text-xs font-medium">
                    {strategy.deadline}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-green-700 mb-1.5">Best For:</p>
                    <ul className="space-y-1">
                      {strategy.bestFor.map((item, i) => (
                        <li key={i} className="text-xs flex items-start gap-1.5">
                          <CheckCircle className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-xs font-semibold text-amber-700 mb-1.5">Watch Out:</p>
                    <ul className="space-y-1">
                      {strategy.cautions.map((item, i) => (
                        <li key={i} className="text-xs flex items-start gap-1.5">
                          <span className="text-amber-500 mt-0.5 flex-shrink-0">⚠</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* ED Acceptance Rate Advantage */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">The ED Acceptance Rate Advantage</CardTitle>
              <CardDescription>
                Real data from top universities showing the ED vs. RD acceptance rate gap
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 pr-4 font-medium text-muted-foreground">University</th>
                      <th className="text-right py-2 px-3 font-medium text-rose-700">ED Rate</th>
                      <th className="text-right py-2 px-3 font-medium text-muted-foreground">RD Rate</th>
                      <th className="text-right py-2 pl-3 font-medium text-green-700">Advantage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { school: "University of Pennsylvania", ed: "19%", rd: "6%", adv: "+13%" },
                      { school: "Vanderbilt University", ed: "24%", rd: "7%", adv: "+17%" },
                      { school: "Tulane University", ed: "42%", rd: "11%", adv: "+31%" },
                      { school: "Boston University", ed: "33%", rd: "14%", adv: "+19%" },
                      { school: "Emory University", ed: "28%", rd: "11%", adv: "+17%" },
                      { school: "Case Western Reserve", ed: "41%", rd: "27%", adv: "+14%" },
                    ].map((row) => (
                      <tr key={row.school} className="border-b last:border-0">
                        <td className="py-2 pr-4 font-medium">{row.school}</td>
                        <td className="text-right py-2 px-3 text-rose-700 font-semibold">{row.ed}</td>
                        <td className="text-right py-2 px-3 text-muted-foreground">{row.rd}</td>
                        <td className="text-right py-2 pl-3 text-green-700 font-bold">{row.adv}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                * Rates are approximate and vary by year. Always verify current rates on each school's Common Data Set.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
