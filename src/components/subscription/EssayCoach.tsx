import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import {
  Sparkles, FileText, Lightbulb, CheckCircle, Loader2,
  Wand2, MessageSquare, Send, RotateCcw, Copy, User, Bot,
} from "lucide-react";

type EssayAction = "review" | "brainstorm" | "improve" | "grammar" | "chat";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

function MarkdownFeedback({ content }: { content: string }) {
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}

interface EssayCoachProps {
  initialEssayText?: string;
}

export function EssayCoach({ initialEssayText }: EssayCoachProps = {}) {
  const { session } = useAuth();
  const [activeAction, setActiveAction] = useState<EssayAction>("review");
  const [essayText, setEssayText] = useState("");
  const [prompt, setPrompt] = useState("");
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "Hi! I'm your AI Essay Coach. I can help you review your essay, brainstorm ideas, fix grammar, or answer questions about the college application process. What would you like to work on today?",
      timestamp: new Date(),
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeAction === "chat") {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, activeAction]);

  const callEssayCoach = async (action: EssayAction, body: Record<string, unknown>) => {
    if (!session?.access_token) {
      toast.error("Please sign in to use the essay coach");
      return null;
    }
    const { data, error } = await supabase.functions.invoke("essay-coach", {
      body: { action, ...body },
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (error || data?.error) {
      throw new Error(data?.error || error?.message || "Failed to get feedback");
    }
    return data?.feedback as string;
  };

  const handleSubmit = async () => {
    if (!essayText && !prompt) { toast.error("Please enter your essay or prompt"); return; }
    setLoading(true); setFeedback("");
    try {
      const result = await callEssayCoach(activeAction, { essayText, prompt });
      if (result) setFeedback(result);
    } catch (err) {
      console.error(err);
      toast.error("Failed to get feedback. Please try again.");
    } finally { setLoading(false); }
  };

  const handleChatSend = async () => {
    if (!chatInput.trim()) return;
    const userMsg: ChatMessage = { role: "user", content: chatInput.trim(), timestamp: new Date() };
    const updatedMessages = [...chatMessages, userMsg];
    setChatMessages(updatedMessages);
    setChatInput("");
    setLoading(true);
    try {
      const result = await callEssayCoach("chat", {
        messages: updatedMessages.map((m) => ({ role: m.role, content: m.content })),
      });
      if (result) {
        setChatMessages((prev) => [...prev, { role: "assistant", content: result, timestamp: new Date() }]);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to get response. Please try again.");
      setChatMessages((prev) => prev.slice(0, -1));
    } finally { setLoading(false); }
  };

  const wordCount = essayText.trim().split(/\s+/).filter(Boolean).length;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Sparkles className="h-5 w-5 text-primary" />
              AI Essay Coach
            </CardTitle>
            <CardDescription className="mt-1">
              Powered by Claude — preserves your voice, teaches as it corrects
            </CardDescription>
          </div>
          <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">AI-Powered</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeAction} onValueChange={(v) => { setActiveAction(v as EssayAction); setFeedback(""); }}>
          <TabsList className="grid w-full grid-cols-5 mb-6">
            <TabsTrigger value="review" className="text-xs flex items-center gap-1"><FileText className="h-3 w-3" />Review</TabsTrigger>
            <TabsTrigger value="grammar" className="text-xs flex items-center gap-1"><CheckCircle className="h-3 w-3" />Polish</TabsTrigger>
            <TabsTrigger value="improve" className="text-xs flex items-center gap-1"><Wand2 className="h-3 w-3" />Improve</TabsTrigger>
            <TabsTrigger value="brainstorm" className="text-xs flex items-center gap-1"><Lightbulb className="h-3 w-3" />Brainstorm</TabsTrigger>
            <TabsTrigger value="chat" className="text-xs flex items-center gap-1"><MessageSquare className="h-3 w-3" />Chat</TabsTrigger>
          </TabsList>

          <TabsContent value="review" className="space-y-3">
            <p className="text-sm text-muted-foreground">Full essay review — identifies strengths, flags issues, gives one clear next step while keeping your voice intact.</p>
            <Textarea placeholder="Paste your essay here..." value={essayText} onChange={(e) => setEssayText(e.target.value)} className="min-h-[220px] resize-y font-mono text-sm" />
            <div className="flex justify-between text-xs text-muted-foreground"><span>{wordCount} words</span><span>Common App: 250–650 words</span></div>
          </TabsContent>

          <TabsContent value="grammar" className="space-y-3">
            <p className="text-sm text-muted-foreground">Fixes grammar, punctuation, and run-ons while keeping your exact voice. Every change includes an explanation so you learn, not just copy.</p>
            <Textarea placeholder="Paste your essay for grammar and style review..." value={essayText} onChange={(e) => setEssayText(e.target.value)} className="min-h-[220px] resize-y font-mono text-sm" />
          </TabsContent>

          <TabsContent value="improve" className="space-y-3">
            <p className="text-sm text-muted-foreground">Paste a specific section to strengthen. The coach gives 2–3 targeted suggestions that sound like a better version of you.</p>
            <Textarea placeholder="Paste the section you want to improve..." value={essayText} onChange={(e) => setEssayText(e.target.value)} className="min-h-[180px] resize-y font-mono text-sm" />
          </TabsContent>

          <TabsContent value="brainstorm" className="space-y-3">
            <p className="text-sm text-muted-foreground">Share your prompt or experiences. The coach suggests 3–5 specific angles and explains why each would resonate with admissions officers.</p>
            <Textarea placeholder="What's your essay prompt? What experiences are you thinking about?" value={prompt} onChange={(e) => setPrompt(e.target.value)} className="min-h-[180px] resize-y text-sm" />
          </TabsContent>

          <TabsContent value="chat" className="space-y-4">
            <ScrollArea className="h-[380px] rounded-xl border bg-muted/20 p-4">
              <div className="space-y-4">
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted border"}`}>
                      {msg.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                    </div>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${msg.role === "user" ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-background border rounded-tl-sm"}`}>
                      {msg.role === "assistant" ? <MarkdownFeedback content={msg.content} /> : <p className="whitespace-pre-wrap">{msg.content}</p>}
                    </div>
                  </div>
                ))}
                {loading && activeAction === "chat" && (
                  <div className="flex gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted border"><Bot className="h-4 w-4" /></div>
                    <div className="rounded-2xl rounded-tl-sm bg-background border px-4 py-3">
                      <div className="flex gap-1 items-center h-5">
                        <span className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:0ms]" />
                        <span className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:150ms]" />
                        <span className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:300ms]" />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
            </ScrollArea>
            <div className="flex gap-2">
              <Input
                placeholder="Ask anything about your essay or the application process..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && !loading) { e.preventDefault(); handleChatSend(); } }}
                disabled={loading}
                className="flex-1"
              />
              <Button onClick={handleChatSend} disabled={loading || !chatInput.trim()} size="icon">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {activeAction !== "chat" && (
          <div className="mt-4 space-y-4">
            <Button onClick={handleSubmit} disabled={loading || (!essayText && !prompt)} className="w-full" size="lg">
              {loading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Analyzing your essay...</>) : (<><Sparkles className="mr-2 h-4 w-4" />Get AI Feedback</>)}
            </Button>
            {feedback && (
              <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                <div className="flex items-center justify-between border-b px-4 py-3 bg-muted/30">
                  <h4 className="font-semibold flex items-center gap-2 text-sm"><Sparkles className="h-4 w-4 text-primary" />AI Feedback</h4>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => { navigator.clipboard.writeText(feedback); toast.success("Copied!"); }} className="h-7 px-2 text-xs"><Copy className="h-3 w-3 mr-1" />Copy</Button>
                    <Button variant="ghost" size="sm" onClick={() => { setFeedback(""); setEssayText(""); setPrompt(""); }} className="h-7 px-2 text-xs"><RotateCcw className="h-3 w-3 mr-1" />Reset</Button>
                  </div>
                </div>
                <div className="p-4"><MarkdownFeedback content={feedback} /></div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
