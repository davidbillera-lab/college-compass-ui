import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Sparkles, 
  Search, 
  Star, 
  AlertTriangle, 
  FileCheck, 
  Loader2,
  Lock,
  Crown
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

interface ApplicationMaterial {
  id: string;
  material_type: string;
  category: string;
  title: string;
  description: string | null;
  content_text: string | null;
  ai_analysis: Record<string, unknown> | null;
}

interface AIApplicationAdvisorProps {
  materials: ApplicationMaterial[];
  selectedMaterial?: ApplicationMaterial | null;
  onClose?: () => void;
}

type AnalysisType = "review" | "gaps" | "strengths" | "comprehensive";

export function AIApplicationAdvisor({ materials, selectedMaterial, onClose }: AIApplicationAdvisorProps) {
  const { session } = useAuth();
  const { isPremium, openCheckout } = useSubscription();
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisType, setAnalysisType] = useState<AnalysisType>("comprehensive");
  const [feedback, setFeedback] = useState<string | null>(null);

  const runAnalysis = async (type: AnalysisType) => {
    if (!session?.access_token) {
      toast.error("Please sign in to use AI analysis");
      return;
    }

    if (!isPremium) {
      toast.error("Premium subscription required for AI analysis");
      return;
    }

    setAnalyzing(true);
    setFeedback(null);

    try {
      // Get profile data for context
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .single();

      let action = "";
      let content = null;

      switch (type) {
        case "review":
          if (!selectedMaterial) {
            toast.error("Please select a material to review");
            setAnalyzing(false);
            return;
          }
          action = selectedMaterial.material_type === "photo" ? "analyze_photo" : "review_content";
          content = selectedMaterial.content_text || {
            title: selectedMaterial.title,
            description: selectedMaterial.description,
            category: selectedMaterial.category,
          };
          break;
        case "gaps":
          action = "detect_gaps";
          break;
        case "strengths":
          action = "highlight_strengths";
          break;
        case "comprehensive":
          action = "comprehensive_review";
          break;
      }

      const { data, error } = await supabase.functions.invoke('application-advisor', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: {
          action,
          content,
          materials,
          profileData,
          materialId: selectedMaterial?.id,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data?.code === "SUBSCRIPTION_REQUIRED") {
        toast.error("Premium subscription required");
        return;
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      setFeedback(data.feedback);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Analysis failed";
      toast.error(message);
      console.error("Analysis error:", error);
    } finally {
      setAnalyzing(false);
    }
  };

  if (!isPremium) {
    return (
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="flex items-center justify-center gap-2">
            <Crown className="h-5 w-5 text-amber-500" />
            AI Application Advisor
          </CardTitle>
          <CardDescription>
            Get personalized AI guidance on your application materials
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-amber-500" />
              <span>Content review & feedback</span>
            </div>
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-blue-500" />
              <span>Missing content detection</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-500" />
              <span>Strength highlighting</span>
            </div>
            <div className="flex items-center gap-2">
              <FileCheck className="h-4 w-4 text-green-500" />
              <span>Comprehensive portfolio review</span>
            </div>
          </div>
          <Button onClick={openCheckout} className="w-full">
            <Crown className="h-4 w-4 mr-2" />
            Upgrade to Premium
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          AI Application Advisor
        </CardTitle>
        <CardDescription>
          {selectedMaterial 
            ? `Analyzing: ${selectedMaterial.title}`
            : "Get AI-powered insights on your application materials"
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={analysisType} onValueChange={(v) => setAnalysisType(v as AnalysisType)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="comprehensive" className="text-xs">
              <FileCheck className="h-3 w-3 mr-1 hidden sm:inline" />
              Full Review
            </TabsTrigger>
            <TabsTrigger value="review" className="text-xs" disabled={!selectedMaterial}>
              <Star className="h-3 w-3 mr-1 hidden sm:inline" />
              Content
            </TabsTrigger>
            <TabsTrigger value="gaps" className="text-xs">
              <AlertTriangle className="h-3 w-3 mr-1 hidden sm:inline" />
              Gaps
            </TabsTrigger>
            <TabsTrigger value="strengths" className="text-xs">
              <Sparkles className="h-3 w-3 mr-1 hidden sm:inline" />
              Strengths
            </TabsTrigger>
          </TabsList>

          <div className="mt-4">
            <Button 
              onClick={() => runAnalysis(analysisType)}
              disabled={analyzing || (analysisType === "review" && !selectedMaterial)}
              className="w-full"
            >
              {analyzing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  {analysisType === "comprehensive" && "Run Full Portfolio Review"}
                  {analysisType === "review" && "Review Selected Content"}
                  {analysisType === "gaps" && "Detect Missing Elements"}
                  {analysisType === "strengths" && "Highlight My Strengths"}
                </>
              )}
            </Button>
          </div>
        </Tabs>

        {feedback && (
          <div className="mt-4">
            <h4 className="font-medium text-sm mb-2">AI Analysis</h4>
            <ScrollArea className="h-[300px] rounded-lg border p-4 bg-muted/30">
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown>{feedback}</ReactMarkdown>
              </div>
            </ScrollArea>
          </div>
        )}

        {selectedMaterial?.ai_analysis && !feedback && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-sm">Previous Analysis</h4>
              <Badge variant="outline" className="text-xs">
                {selectedMaterial.ai_analysis.analyzed_at 
                  ? new Date(selectedMaterial.ai_analysis.analyzed_at as string).toLocaleDateString()
                  : "Saved"
                }
              </Badge>
            </div>
            <ScrollArea className="h-[200px] rounded-lg border p-4 bg-muted/30">
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown>
                  {(selectedMaterial.ai_analysis.feedback as string) || "No previous analysis available"}
                </ReactMarkdown>
              </div>
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
