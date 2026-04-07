import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import ReactMarkdown from "react-markdown";
import {
  Bot, User, Send, Loader2, BookOpen, DollarSign,
  FileText, HelpCircle, Lightbulb, ChevronRight,
} from "lucide-react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const QUICK_QUESTIONS = [
  { icon: FileText, label: "What is the FAFSA and when do I file it?", category: "fafsa" },
  { icon: DollarSign, label: "How do I maximize my Expected Family Contribution (EFC)?", category: "fafsa" },
  { icon: BookOpen, label: "What is the CSS Profile and which schools require it?", category: "css" },
  { icon: HelpCircle, label: "What's the difference between grants, loans, and work-study?", category: "aid" },
  { icon: Lightbulb, label: "How do I compare financial aid award letters?", category: "aid" },
  { icon: DollarSign, label: "Can I appeal or negotiate my financial aid offer?", category: "appeal" },
];

const TOPIC_BADGES = [
  { label: "FAFSA", color: "bg-blue-100 text-blue-800" },
  { label: "CSS Profile", color: "bg-purple-100 text-purple-800" },
  { label: "Grants & Scholarships", color: "bg-green-100 text-green-800" },
  { label: "Student Loans", color: "bg-orange-100 text-orange-800" },
  { label: "Work-Study", color: "bg-teal-100 text-teal-800" },
  { label: "Aid Appeals", color: "bg-rose-100 text-rose-800" },
];

function MarkdownMessage({ content }: { content: string }) {
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}

export default function FinancialAidAssistantPage() {
  const { session } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: `# Welcome to your Financial Aid Assistant! 🎓

I'm your dedicated guide for navigating the complex world of college financial aid. I can help you with:

- **FAFSA** — What it is, when to file, and how to maximize your aid eligibility
- **CSS Profile** — Which schools require it and how it differs from FAFSA
- **Understanding Your Aid Package** — Breaking down grants, loans, and work-study
- **Comparing Award Letters** — Finding the true "bottom line" cost at each school
- **Appealing Your Aid** — How to negotiate for more money

What would you like to know? You can ask me anything or click one of the quick questions below.`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;
    if (!session?.access_token) {
      toast.error("Please sign in to use the Financial Aid Assistant");
      return;
    }

    const userMsg: ChatMessage = { role: "user", content: text.trim(), timestamp: new Date() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("financial-aid-assistant", {
        body: {
          messages: updatedMessages.map((m) => ({ role: m.role, content: m.content })),
        },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error || data?.error) {
        throw new Error(data?.error || error?.message || "Failed to get response");
      }

      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: data.reply,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error(err);
      toast.error("Failed to get a response. Please try again.");
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Financial Aid Assistant</h1>
            <p className="text-muted-foreground text-sm">
              Your AI-powered guide to FAFSA, CSS Profile, and maximizing your college funding
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          {TOPIC_BADGES.map((badge) => (
            <span
              key={badge.label}
              className={`text-xs font-medium px-2.5 py-1 rounded-full ${badge.color}`}
            >
              {badge.label}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat Panel */}
        <div className="lg:col-span-2 flex flex-col">
          <Card className="flex flex-col h-[600px]">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base flex items-center gap-2">
                <Bot className="h-4 w-4 text-green-600" />
                Financial Aid Chat
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                    >
                      <div
                        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {msg.role === "user" ? (
                          <User className="h-4 w-4" />
                        ) : (
                          <Bot className="h-4 w-4" />
                        )}
                      </div>
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground rounded-tr-sm"
                            : "bg-muted rounded-tl-sm"
                        }`}
                      >
                        {msg.role === "assistant" ? (
                          <MarkdownMessage content={msg.content} />
                        ) : (
                          <p className="text-sm">{msg.content}</p>
                        )}
                      </div>
                    </div>
                  ))}
                  {loading && (
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center">
                        <Bot className="h-4 w-4" />
                      </div>
                      <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
              </ScrollArea>
              <Separator />
              <div className="p-4 flex gap-2">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about FAFSA, CSS Profile, financial aid appeals..."
                  className="resize-none min-h-[44px] max-h-[120px]"
                  rows={1}
                  disabled={loading}
                />
                <Button
                  onClick={() => sendMessage(input)}
                  disabled={loading || !input.trim()}
                  size="icon"
                  className="flex-shrink-0 bg-green-600 hover:bg-green-700"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Questions Panel */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Quick Questions</CardTitle>
              <CardDescription className="text-xs">
                Tap any question to get an instant answer
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 p-3 pt-0">
              {QUICK_QUESTIONS.map((q, idx) => {
                const Icon = q.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => sendMessage(q.label)}
                    disabled={loading}
                    className="w-full text-left flex items-start gap-2 p-2.5 rounded-lg hover:bg-muted transition-colors text-sm group"
                  >
                    <Icon className="h-4 w-4 mt-0.5 flex-shrink-0 text-green-600" />
                    <span className="flex-1 leading-snug">{q.label}</span>
                    <ChevronRight className="h-3 w-3 mt-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" />
                  </button>
                );
              })}
            </CardContent>
          </Card>

          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-start gap-2">
                <Lightbulb className="h-4 w-4 text-green-700 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-green-800 mb-1">Pro Tip</p>
                  <p className="text-xs text-green-700 leading-relaxed">
                    File the FAFSA as early as possible — October 1st of your senior year. Many
                    state and institutional aid programs are first-come, first-served and run out
                    of funds quickly.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-start gap-2">
                <FileText className="h-4 w-4 text-blue-700 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-blue-800 mb-1">Key Dates</p>
                  <ul className="text-xs text-blue-700 space-y-1 leading-relaxed">
                    <li><strong>Oct 1:</strong> FAFSA opens for new cycle</li>
                    <li><strong>Oct–Feb:</strong> CSS Profile deadlines vary</li>
                    <li><strong>Mar–Apr:</strong> Award letters arrive</li>
                    <li><strong>May 1:</strong> National Decision Day</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
