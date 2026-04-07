import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReactMarkdown from "react-markdown";
import {
  Loader2, Wand2, Copy, CheckCircle, Mail, DollarSign,
  FileText, AlertCircle, Lightbulb,
} from "lucide-react";

const APPEAL_TYPES = [
  {
    value: "income_change",
    label: "Change in Financial Circumstances",
    description: "Job loss, medical expenses, divorce, or other income changes since filing FAFSA",
  },
  {
    value: "competing_offer",
    label: "Competing School Offer",
    description: "Another school offered significantly more aid",
  },
  {
    value: "merit_appeal",
    label: "Merit / Achievement Appeal",
    description: "New awards, improved grades, or accomplishments since applying",
  },
  {
    value: "special_circumstances",
    label: "Special Circumstances",
    description: "Unusual expenses, family obligations, or other factors not captured on FAFSA",
  },
  {
    value: "waitlist_interest",
    label: "Letter of Continued Interest (Waitlist)",
    description: "Demonstrate continued enthusiasm and new updates after being waitlisted",
  },
];

export default function AppealLetterPage() {
  const { session } = useAuth();
  const [appealType, setAppealType] = useState("");
  const [collegeName, setCollegeName] = useState("");
  const [currentAid, setCurrentAid] = useState("");
  const [requestedAid, setRequestedAid] = useState("");
  const [competingSchool, setCompetingSchool] = useState("");
  const [competingOffer, setCompetingOffer] = useState("");
  const [circumstanceDetails, setCircumstanceDetails] = useState("");
  const [studentName, setStudentName] = useState("");
  const [generatedLetter, setGeneratedLetter] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("form");

  const handleGenerate = async () => {
    if (!appealType || !collegeName || !circumstanceDetails) {
      toast.error("Please fill in the required fields: college name, appeal type, and details.");
      return;
    }
    if (!session?.access_token) {
      toast.error("Please sign in to generate a letter.");
      return;
    }

    setLoading(true);
    setGeneratedLetter("");

    try {
      const { data, error } = await supabase.functions.invoke("appeal-letter-generator", {
        body: {
          appealType,
          collegeName,
          currentAid,
          requestedAid,
          competingSchool,
          competingOffer,
          circumstanceDetails,
          studentName,
        },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error || data?.error) {
        throw new Error(data?.error || error?.message || "Failed to generate letter");
      }

      setGeneratedLetter(data.letter);
      setActiveTab("letter");
      toast.success("Appeal letter generated! Review and personalize before sending.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate letter. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generatedLetter);
    setCopied(true);
    toast.success("Letter copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const selectedType = APPEAL_TYPES.find((t) => t.value === appealType);

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 text-white">
            <Mail className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Appeal Letter Generator</h1>
            <p className="text-muted-foreground text-sm">
              Generate a professional financial aid appeal or waitlist letter in seconds
            </p>
          </div>
        </div>
      </div>

      {/* Success tip */}
      <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-sm">
        <Lightbulb className="h-4 w-4 mt-0.5 flex-shrink-0" />
        <p>
          <strong>Did you know?</strong> Most families who appeal their financial aid award receive
          additional funding. The key is to be specific, professional, and provide documentation.
          This tool generates a strong starting draft — always personalize it before sending.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="form">
            <FileText className="h-4 w-4 mr-2" />
            Letter Details
          </TabsTrigger>
          <TabsTrigger value="letter" disabled={!generatedLetter}>
            <Mail className="h-4 w-4 mr-2" />
            Generated Letter
          </TabsTrigger>
        </TabsList>

        <TabsContent value="form" className="space-y-6 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-xs">Student Name</Label>
                    <Input
                      placeholder="Your full name"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">College Name *</Label>
                    <Input
                      placeholder="e.g. University of Michigan"
                      value={collegeName}
                      onChange={(e) => setCollegeName(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Current Aid Offer</Label>
                    <Input
                      placeholder="e.g. $15,000"
                      value={currentAid}
                      onChange={(e) => setCurrentAid(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Aid Amount You're Requesting</Label>
                    <Input
                      placeholder="e.g. $22,000"
                      value={requestedAid}
                      onChange={(e) => setRequestedAid(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Competing Offer (Optional)</CardTitle>
                  <CardDescription className="text-xs">
                    If another school offered more, this is your strongest negotiating tool
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-xs">Competing School Name</Label>
                    <Input
                      placeholder="e.g. Ohio State University"
                      value={competingSchool}
                      onChange={(e) => setCompetingSchool(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Their Aid Offer</Label>
                    <Input
                      placeholder="e.g. $28,000"
                      value={competingOffer}
                      onChange={(e) => setCompetingOffer(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Appeal Type *</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {APPEAL_TYPES.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setAppealType(type.value)}
                      className={`w-full text-left p-3 rounded-lg border transition-all ${
                        appealType === type.value
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-muted"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium">{type.label}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {type.description}
                          </p>
                        </div>
                        {appealType === type.value && (
                          <CheckCircle className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                        )}
                      </div>
                    </button>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Your Specific Details *</CardTitle>
                  <CardDescription className="text-xs">
                    The more specific you are, the stronger your letter will be
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder={
                      appealType === "income_change"
                        ? "Describe the change in circumstances (e.g., 'My father was laid off in January 2025, reducing our household income from $85,000 to $42,000...')"
                        : appealType === "competing_offer"
                        ? "Describe why you prefer this school despite the lower offer (e.g., 'I am deeply committed to your engineering program because...')"
                        : appealType === "waitlist_interest"
                        ? "Share new accomplishments, awards, or activities since applying, and reaffirm your strong interest..."
                        : "Describe your specific circumstances in detail. Be honest and specific — vague appeals are rarely successful."
                    }
                    value={circumstanceDetails}
                    onChange={(e) => setCircumstanceDetails(e.target.value)}
                    rows={8}
                    className="resize-none"
                  />
                  <p className="text-xs text-muted-foreground mt-1.5">
                    {circumstanceDetails.length} characters
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={loading || !appealType || !collegeName || !circumstanceDetails}
            className="w-full gap-2 h-11"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating your letter...
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4" />
                Generate Appeal Letter
              </>
            )}
          </Button>
        </TabsContent>

        <TabsContent value="letter" className="mt-4">
          {generatedLetter && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Your Appeal Letter</CardTitle>
                    <CardDescription className="text-xs mt-1">
                      Review carefully and personalize before sending. Add specific dollar amounts,
                      dates, and documentation references.
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleCopy} className="gap-2">
                    {copied ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        Copy Letter
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs mb-4">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <p>
                    <strong>Before sending:</strong> Replace all [bracketed placeholders] with your
                    actual information. Attach supporting documentation (tax returns, employer
                    letter, competing award letter). Send to the Financial Aid Office directly —
                    not admissions.
                  </p>
                </div>
                <div className="prose prose-sm dark:prose-invert max-w-none bg-muted/50 rounded-lg p-6 font-mono text-sm leading-relaxed whitespace-pre-wrap">
                  {generatedLetter}
                </div>
                <div className="mt-4 flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setActiveTab("form")}
                    className="flex-1"
                  >
                    Edit Details
                  </Button>
                  <Button onClick={handleGenerate} disabled={loading} className="flex-1 gap-2">
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Wand2 className="h-4 w-4" />
                    )}
                    Regenerate
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
