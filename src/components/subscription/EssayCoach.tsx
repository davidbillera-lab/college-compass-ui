import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { 
  Sparkles, 
  FileText, 
  Lightbulb, 
  CheckCircle, 
  Loader2, 
  Crown,
  Wand2,
  MessageSquare
} from "lucide-react";

type EssayAction = "review" | "brainstorm" | "improve" | "grammar";

export function EssayCoach() {
  const { isPremium, openCheckout } = useSubscription();
  const { session } = useAuth();
  const [essayText, setEssayText] = useState("");
  const [prompt, setPrompt] = useState("");
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeAction, setActiveAction] = useState<EssayAction>("review");

  const handleSubmit = async () => {
    if (!session?.access_token) {
      toast.error("Please sign in to use the essay coach");
      return;
    }

    if (!isPremium) {
      openCheckout();
      return;
    }

    if (!essayText && !prompt) {
      toast.error("Please enter your essay or prompt");
      return;
    }

    setLoading(true);
    setFeedback("");

    try {
      const { data, error } = await supabase.functions.invoke("essay-coach", {
        body: {
          essayText,
          prompt,
          action: activeAction,
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        if (error.message?.includes("SUBSCRIPTION_REQUIRED")) {
          toast.error("Premium subscription required for essay coaching");
          openCheckout();
          return;
        }
        throw error;
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      setFeedback(data?.feedback || "No feedback generated");
      toast.success("Essay feedback ready!");
    } catch (error) {
      console.error("Essay coach error:", error);
      toast.error("Failed to get essay feedback. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isPremium) {
    return (
      <Card className="border-dashed border-primary/30">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <CardTitle>AI Essay Coach</CardTitle>
          <CardDescription>
            Get expert feedback on your college application essays with our AI-powered coach
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-primary" />
              Detailed essay reviews and feedback
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-primary" />
              Brainstorm ideas for any prompt
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-primary" />
              Grammar and style improvements
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-primary" />
              Section-by-section refinements
            </li>
          </ul>
          <Button onClick={openCheckout} className="w-full" size="lg">
            <Crown className="mr-2 h-4 w-4" />
            Unlock Essay Coach
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI Essay Coach
            </CardTitle>
            <CardDescription>
              Get expert feedback on your college application essays
            </CardDescription>
          </div>
          <Badge variant="secondary" className="bg-primary/10 text-primary">
            Premium
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={activeAction} onValueChange={(v) => setActiveAction(v as EssayAction)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="review" className="text-xs">
              <FileText className="mr-1 h-3 w-3" />
              Review
            </TabsTrigger>
            <TabsTrigger value="brainstorm" className="text-xs">
              <Lightbulb className="mr-1 h-3 w-3" />
              Brainstorm
            </TabsTrigger>
            <TabsTrigger value="improve" className="text-xs">
              <Wand2 className="mr-1 h-3 w-3" />
              Improve
            </TabsTrigger>
            <TabsTrigger value="grammar" className="text-xs">
              <CheckCircle className="mr-1 h-3 w-3" />
              Polish
            </TabsTrigger>
          </TabsList>

          <TabsContent value="review" className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Paste your complete essay for a comprehensive review with actionable feedback.
            </p>
            <Textarea
              placeholder="Paste your essay here..."
              value={essayText}
              onChange={(e) => setEssayText(e.target.value)}
              className="min-h-[200px]"
            />
          </TabsContent>

          <TabsContent value="brainstorm" className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Share your essay prompt or topic and get creative ideas to explore.
            </p>
            <Textarea
              placeholder="What's your essay prompt or topic? What experiences or stories are you considering?"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[150px]"
            />
          </TabsContent>

          <TabsContent value="improve" className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Paste a section you want to strengthen with specific improvement suggestions.
            </p>
            <Textarea
              placeholder="Paste the section you want to improve..."
              value={essayText}
              onChange={(e) => setEssayText(e.target.value)}
              className="min-h-[150px]"
            />
          </TabsContent>

          <TabsContent value="grammar" className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Get your essay polished for grammar, style, and clarity.
            </p>
            <Textarea
              placeholder="Paste your essay for grammar and style review..."
              value={essayText}
              onChange={(e) => setEssayText(e.target.value)}
              className="min-h-[200px]"
            />
          </TabsContent>
        </Tabs>

        <Button 
          onClick={handleSubmit} 
          disabled={loading || (!essayText && !prompt)}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <MessageSquare className="mr-2 h-4 w-4" />
              Get Feedback
            </>
          )}
        </Button>

        {feedback && (
          <div className="mt-4 rounded-lg border bg-muted/50 p-4">
            <h4 className="mb-2 font-semibold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              AI Feedback
            </h4>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <div className="whitespace-pre-wrap text-sm">{feedback}</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
